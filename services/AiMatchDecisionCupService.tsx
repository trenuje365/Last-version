import { MatchLiveState, MatchContext, Player, PlayerPosition, Lineup, SubstitutionRecord, InjurySeverity, HealthStatus, Coach } from '../types';
import { AiScoutReport } from './AiScoutingService';
import { TacticRepository } from '../resources/tactics_db';
import { LineupService } from './LineupService';

export const AiMatchDecisionCupService = {
  makeDecisions: (
    state: MatchLiveState, 
    ctx: MatchContext, 
    side: 'HOME' | 'AWAY',
     isPriority: boolean = false,
    coach: Coach | null = null,
   playerTacticId: string | undefined = undefined,
    aiSensors?: any,
    scoutReport?: AiScoutReport
  ): { 
    newLineup?: Lineup, 
    newSubsCount?: number, 
    subRecord?: SubstitutionRecord,
    secondSubRecord?: SubstitutionRecord,
    newTacticId?: string, 
    newTempo?: string, 
    newMindset?: string, 
    newIntensity?: string,
    logs: string[] 
  } => {
    
    const isHome = side === 'HOME';
    const logs: string[] = [];
    
    // --- PRZYGOTOWANIE DANYCH ---
    const myScore = isHome ? state.homeScore : state.awayScore;
    const oppScore = isHome ? state.awayScore : state.homeScore;
    const scoreDiff = myScore - oppScore;
    const isHalftime = state.minute === 45;
    const currentSubsCount = isHome ? state.subsCountHome : state.subsCountAway;

// --- ATRIBUTY I OSOBOWOŚĆ TRENERA ---
    const coachDec = coach ? coach.attributes.decisionMaking : 50;
    const coachExp = coach ? coach.attributes.experience : 50;

    // STAGE 1 PRO FIX: Inicjalizacja zmiennych pomocniczych na początku, aby uniknąć ReferenceError
    const currentLineup = isHome ? state.homeLineup : state.awayLineup;
    const currentFatigue = isHome ? state.homeFatigue : state.awayFatigue;
    const myPlayers = isHome ? ctx.homePlayers : ctx.awayPlayers;
    const mySubsHistory = isHome ? state.homeSubsHistory : state.awaySubsHistory;
    
    // TRYB DESPERACJI (VABANQUE)
    const isDesperate = scoreDiff <= -3 || (scoreDiff <= -2 && state.minute >= 45);

    // --- STAGE 1 PRO: BLOKADA ADAPTACJI TAKTYCZNEJ (15 MINUT) ---
     const randomCD = 10 + Math.floor(Math.abs(Math.sin(state.sessionSeed + (state.lastAiActionMinute || 0))) * 9); 
    const canChangeTactics = isPriority || (state.minute - (state.lastAiActionMinute || 0) >= randomCD);

    const hasGKEmergency = currentLineup.startingXI[0] === null;
    const hasEmptySlot = currentLineup.startingXI.some(id => id === null);
    if (!canChangeTactics && !isPriority && !hasGKEmergency && !hasEmptySlot) {
        return { logs: [] };
    }

    // Inicjalizacja instrukcji operacyjnych
    let newTempo: string | undefined = undefined;
    let newMindset: string | undefined = undefined;
    let newIntensity: string | undefined = undefined;

    // --- STAGE 1 PRO: LOGIKA AGRESJI (WYNIK I DYSPROPORCJA SIŁ) ---
    const getPower = (ids: (string | null)[], pool: Player[]) => {
        const act = pool.filter(p => ids.includes(p.id));
        return act.reduce((s, p) => s + (p.attributes.attacking + p.attributes.passing + p.attributes.defending), 0);
    };
    const aiSidePower = isHome ? getPower(state.homeLineup.startingXI, ctx.homePlayers) : getPower(state.awayLineup.startingXI, ctx.awayPlayers);
    const playerSidePower = isHome ? getPower(state.awayLineup.startingXI, ctx.awayPlayers) : getPower(state.homeLineup.startingXI, ctx.homePlayers);
    
    // WARUNEK A: Desperacja wynikowa — trzeba gonić wynik, ryzykujemy atak
    if (scoreDiff <= -3) {
        if (Math.random() > 0.5) {
            newIntensity = 'AGGRESSIVE';
            logs.push(`Trener rywali zaczyna grać agresywnie, by ratować wynik.`);
        }
    }
    // WARUNEK B: Dysproporcja sił — próg relatywny (% siły AI), nie stały
    // relDiff >= 0.20 → wyraźny underdog (T1 vs T3+) → pełna defensywa
    // relDiff >= 0.08 → lekki underdog (T1 vs T2)   → tylko ostrożność
    // relDiff < 0.08  → T1 vs T1 (Legia vs Górnik)  → AI gra normalnie
    else {
        const relDiff = (playerSidePower - aiSidePower) / Math.max(1, aiSidePower);

        if (relDiff >= 0.20 && scoreDiff >= -2) {
            if (!newIntensity) newIntensity = 'CAUTIOUS';
            if (!newTempo) newTempo = 'SLOW';
            if (!newMindset) newMindset = 'DEFENSIVE';
            if (Math.random() > 0.6) logs.push(`Trener rywali nakazuje twardą, defensywną grę.`);
        } else if (relDiff >= 0.08 && scoreDiff >= -2) {
            if (!newIntensity) newIntensity = 'CAUTIOUS';
            if (Math.random() > 0.5) logs.push(`Trener rywali nakazuje grę ostrożną i zorganizowaną.`);
        }
    }

    const playerTempo = state.userInstructions?.tempo || 'NORMAL';
    const currentMomentum = state.momentum || 5;

    if (playerTempo === 'FAST' && scoreDiff > 0 && Math.random() > 0.6) {
        newTempo = 'SLOW';
        logs.push(`Rywale spowalniają grę, by zneutralizować nasze wysokie tempo.`);
    }

    if (currentMomentum > 65 && newIntensity !== 'CAUTIOUS' && Math.random() > 0.7) {
        newIntensity = 'AGGRESSIVE';
        logs.push(`Przeciwnik zaczyna gra ostrzej, próbując wysokiego pressingu.`);
    }

    // --- STAGE 1 PRO: KLAUZULA BEZPIECZEŃSTWA (CZERWONA KARTKA AI) ---
    const mySentOffCount = state.sentOffIds.filter(id => myPlayers.some(p => p.id === id)).length;
    if (mySentOffCount > 0) {
        const cautionRoll = Math.floor(Math.random() * 3); // Losowo: 0, 1, 2
        
        if (cautionRoll === 1) {
            newIntensity = 'CAUTIOUS';
            logs.push(`Po czerwonej kartce trener rywali nakazuje maksymalną ostrożność.`);
        } else if (cautionRoll === 2) {
            newIntensity = 'NORMAL';
            logs.push(`Trener rywali tonuje nastroje, by uniknąć kolejnych wykluczeń.`);
        }
        // Jeśli 0 -> trener ignoruje ryzyko i trzyma się pierwotnego planu (np. AGGRESSIVE)
    }


    // === PROGRESYWNY MECHANIZM BŁĘDÓW TRENERA ===
    // Trzy niezależne warstwy: wiedza (exp) + presja (dec×minuta) + szum (dec)

    // WARSTWA 1: Bazowy błąd — dominuje experience (długoterminowa wiedza taktyczna)
    // exp=99 → ~1.5% | exp=50 → ~26% | exp=1 → ~50.5%
    const expFactor = Math.max(1.5, 52 - (coachExp * 0.51));

    // WARSTWA 2: Modyfikator presji — dominuje decisionMaking, rośnie z minutą meczu
    // Im późniejsza minuta, tym decyzyjność ważniejsza (końcówka testuje charakter trenera)
    const pressureWeight = state.minute >= 75 ? 0.30  // końcówka: decyzyjność mocno liczy
                         : state.minute >= 60 ? 0.15  // druga połowa: średni wpływ
                         : 0.08;                       // pierwsza połowa: marginalny wpływ
    const decModifier = (50 - coachDec) * pressureWeight;
    // [SLOT ERR1] - miejsce na dodatkowe modyfikatory presji (np. penalty shootout, extraTime)

    // WARSTWA 3: Szum dnia — wariancja zależna od decisionMaking
    // Dobry dec = mały szum (trener spójny), słaby dec = duży szum (chaotyczny)
    const noiseRange = 3 + ((100 - coachDec) / 20); // dec=99 → ±3 | dec=1 → ±8
    const dayFactor = (Math.random() * noiseRange * 2) - noiseRange;

    // Finalne prawdopodobieństwo błędu (zakres 1–60%)
    const errorProbability = Math.max(1, Math.min(60, expFactor + decModifier + dayFactor));

    // Gwarantowane okna decyzyjne — omijają sprawdzenie błędu całkowicie
    const isGuaranteedWindow = isPriority
        || isDesperate
        || isHalftime
        || (state.minute >= 75 && currentSubsCount < 3)
        || (state.minute >= 60 && currentSubsCount < 2);
    // [SLOT ERR2] - miejsce na dodatkowe gwarantowane okna (np. isExtraTime && diff === 0)

    // Sprawdzamy czy trener podejmuje decyzję
    if (!isGuaranteedWindow && Math.random() * 100 < errorProbability) {
      const mistakeRoll = Math.random();

      if (mistakeRoll < 0.65) {
        // Najczęstszy błąd: po prostu nie reaguje (65%)
        logs.push(`Trener rywala nie podejmuje żadnej decyzji pomimo, iż sytuacja tego wymaga.`);
        return { logs };
      }
      else if (mistakeRoll < 0.90) {
        // Średni błąd: podejmuje decyzję, ale słabą / nieoptymalną (25%)
        logs.push(`Dziwna decyzja trenera rywali.`);
        // [SLOT ERR3] - miejsce na nieoptymalną akcję (np. zły wybór zmiennika)
      }
      else {
        // Rzadki, spektakularny błąd (10%)
        logs.push(`Trener rywala chyba nie odczytał sytuacji na boisku!`);
        // [SLOT ERR4] - miejsce na spektakularną złą decyzję (np. zmiana najlepszego gracza)
      }
    }

    // Jeśli dotarliśmy tutaj → trener podejmuje sensowną decyzję

 
    // -> tutaj wstaw kod (STAGE 1 PRO: Globalna blokada powrotu zawodników)
    const outIds = new Set(mySubsHistory.map(s => s.playerOutId));

    if (currentSubsCount >= 5) return { newTempo, newMindset, newIntensity, logs };

   let newLineup = { ...currentLineup, startingXI: [...currentLineup.startingXI], bench: [...currentLineup.bench] };
    let newSubsCount = currentSubsCount;
    let subRecord: SubstitutionRecord | undefined;
    let newTacticId: string | undefined;

    const tactic = TacticRepository.getById(newLineup.tacticId);

    // --- PRIORYTET 1: BRAK BRAMKARZA / CZERWONA KARTKA GK ---
    const gkInSlot = newLineup.startingXI[0];
    if (gkInSlot === null) {
       const bestGkOnBench = newLineup.bench
         .map(id => myPlayers.find(p => p.id === id)).filter((p): p is Player => !!p)
         .filter(p => p.position === PlayerPosition.GK && !outIds.has(p.id))
         .sort((a, b) => b.overallRating - a.overallRating)[0];

       // OPCJA A: Mamy zmiany i bramkarza na ławce -> Standardowa procedura
       if (bestGkOnBench && currentSubsCount < 5) {
          let fieldPlayerIdx = -1;
          for (let i = newLineup.startingXI.length - 1; i >= 1; i--) { // i >= 1, bo 0 to pusty slot bramkarza
            if (newLineup.startingXI[i] !== null) { fieldPlayerIdx = i; break; }
          }
          if (fieldPlayerIdx !== -1) {
             const playerOutId = newLineup.startingXI[fieldPlayerIdx]!;
             newLineup.startingXI[fieldPlayerIdx] = null; // Przesunięcie "dziury" wykluczenia z bramki na pole
             newLineup.startingXI[0] = bestGkOnBench.id;
             newLineup.bench = newLineup.bench.filter(id => id !== bestGkOnBench.id);
             newSubsCount++;
             subRecord = { playerOutId, playerInId: bestGkOnBench.id, minute: state.minute };
             logs.push(`Bramkarz rezerwowy ${bestGkOnBench.lastName} zastępuje gracza z pola!`);
          }
       } 
       // OPCJA B: Brak zmian LUB brak GK na ławce -> Gracz z pola musi wejść do bramki
       else {
          const fieldCandidates = newLineup.startingXI
            .map((id, idx) => ({ id, idx }))
            .filter(item => item.id !== null && item.idx !== 0)
            .map(item => ({ ...item, p: myPlayers.find(p => p.id === item.id)! }))
            .sort((a, b) => (b.p.attributes.positioning + b.p.attributes.strength) - (a.p.attributes.positioning + a.p.attributes.strength));

          if (fieldCandidates.length > 0) {
             const bestCandidate = fieldCandidates[0];
             newLineup.startingXI[0] = bestCandidate.id;
             newLineup.startingXI[bestCandidate.idx] = null; // Przesunięcie dziury wykluczenia na pozycję gracza z pola
             logs.push(`DRAMAT! ${bestCandidate.p.lastName} musi stanąć między słupkami!`);
          }
       }
    }

    // --- PRIORYTET 2: WYPEŁNIANIE LUK (PO KONTUZJACH / CARRIED OFF) ---
    if (!subRecord && currentSubsCount < 5) {
      const emptySlotIdx = newLineup.startingXI.findIndex(id => id === null);

      if (emptySlotIdx !== -1) {
        // BUGFIX: AI nie może uzupełniać luki, jeśli jest to luka po czerwonej kartce.
        const mySentOffCount = state.sentOffIds.filter(id => myPlayers.some(p => p.id === id)).length;
        const currentOnPitchCount = newLineup.startingXI.filter(id => id !== null).length;
        const maxAllowedOnPitch = 11 - mySentOffCount;

        if (currentOnPitchCount < maxAllowedOnPitch) {
          const requiredRole = tactic.slots[emptySlotIdx].role;
          // (outIds używa teraz definicji globalnej z początku funkcji)

          const benchPool = newLineup.bench
      .map(id => myPlayers.find(p => p.id === id)).filter((p): p is Player => !!p)
            .filter(p => p && !outIds.has(p.id));

          let bestSub = null;
          if (requiredRole === PlayerPosition.GK) {
             bestSub = benchPool.find(p => p.position === PlayerPosition.GK);
          } else {
             bestSub = benchPool
               .filter(p => p.position !== PlayerPosition.GK)
               .sort((a, b) => LineupService.calculateFitScore(b, requiredRole) - LineupService.calculateFitScore(a, requiredRole))[0];
          }

          if (bestSub) {
             newLineup.startingXI[emptySlotIdx] = bestSub.id;
             newLineup.bench = newLineup.bench.filter(id => id !== bestSub.id);
             newSubsCount = currentSubsCount + 1;
             subRecord = { playerOutId: 'NONE', playerInId: bestSub.id, minute: state.minute };
             logs.push(` ${bestSub.lastName} wchodzi w miejsce zniesionego gracza.`);
          }
        }
      }
    }

        // --- RED CARD: WYMUSZENIE TAKTYKI DEFENSYWNEJ ---
        // Uruchamia się PRZED ogólną logiką taktyczną.
        // Gdy AI ma czerwoną kartkę i nie goni desperacko wyniku, wymusza przejście na formację defensywną.
        if (!subRecord && !newTacticId && mySentOffCount > 0) {
            const isGoingForIt = aiSensors && (aiSensors.losingByTwo || aiSensors.lateChase);
            if (!isGoingForIt) {
                const redCardDefensiveTactics = ["5-4-1", "5-3-2", "4-5-1"];
                // [SLOT RC1] - miejsce na dodatkowe taktyki przy czerwonej kartce (np. przy 2 czerwonych)
                const currentTacticRC = newLineup.tacticId;
                if (!redCardDefensiveTactics.includes(currentTacticRC)) {
                    const rcCandidates = redCardDefensiveTactics.filter(t => t !== currentTacticRC);
                    if (rcCandidates.length > 0) {
                        newTacticId = rcCandidates[Math.floor(Math.random() * rcCandidates.length)];
                        logs.push(`Po czerwonej kartce trener rywali przestawia drużynę na grę w obronie.`);
                    }
                }
            }
        }

        // --- NOWA LOGIKA ZMIANY TAKTYKI - DYNAMICZNA (2025) ---
    if (!subRecord && !newTacticId) {
        const diff = scoreDiff;                           // ujemny = przegrywamy
        const minsLeft = 90 - state.minute + (state.isExtraTime ? 30 : 0);
        const mom = state.momentum || 5;

        let attackNeed = 0;
        let defendNeed = 0;

       if (diff <= -3 && coachExp > 40) {
            // Doświadczony trener przy 0-3 szuka goli kontaktowych, nie rezygnuje z meczu
            attackNeed += 55; 
            defendNeed += 10;
            if (Math.random() > 0.7) logs.push(` Trener rywali szuka drogi powrotnej do meczu.`);
            // [SLOT DC1] - miejsce na dodatkową logikę przy dużej stracie (np. zmiana stylu przy diff <= -4)
        } else if (diff <= -2) {
            attackNeed += 50 + (minsLeft < 25 ? 40 : 0);
        } else if (diff === -1) {
            attackNeed += 30 + (minsLeft < 35 ? 25 : 0);
        }

        // Prowadzimy → im bliżej końca i im większa przewaga, tym mocniej się bronimy
        if (diff >= 2) {
            defendNeed += 45 + (minsLeft < 20 ? 35 : 0);
        } else if (diff === 1 && minsLeft < 30) {
            defendNeed += 35;
        }

        // Momentum ma duży wpływ
        if (mom < -25) attackNeed += 35;
        if (mom > 30)  defendNeed += 40;

        // Długotrwałe momentum — reaguj na dominację w czasie, nie tylko na chwilowy snapshot
        if (state.momentumTicks > 0) {
            const avgMom = state.momentumSum / state.momentumTicks;
            // Momentum z perspektywy AI: AI=HOME → bezpośrednio, AI=AWAY → odwracamy znak
            const aiPerspectiveMom = isHome ? avgMom : -avgMom;
            if (aiPerspectiveMom < -20) attackNeed += 20; // Rywal dominuje od dłuższego czasu → trzeba atakować
            if (aiPerspectiveMom > 30)  defendNeed += 20; // AI dominuje → chroń przewagę
            // [SLOT MM1] - miejsce na dodatkowe reakcje na długotrwałe dominacje
        }

        // Kontra-taktyka na aktualny styl gry gracza
        if (playerTacticId) {
            const aggressivePlayerTactics = ["4-2-4", "3-4-3", "4-3-3", "4-2-3-1", "4-4-2-OFF"];
            const defensivePlayerTactics  = ["5-4-1", "6-3-1", "5-3-2", "4-5-1", "4-4-2-DEF"];
            if (aggressivePlayerTactics.includes(playerTacticId)) defendNeed += 20; // Gracz atakuje → AI zagęszcza obronę
            else if (defensivePlayerTactics.includes(playerTacticId)) attackNeed += 15; // Gracz się broni → AI szuka przestrzeni
            // [SLOT CT1] - miejsce na bardziej szczegółową kontra-taktykę (np. kontra na 5-2-3)
        }

        // --- RAPORT ZWIADOWCZY (pre-match scouting) ---
        // W pierwszej fazie meczu (do 25 min) AI działa na podstawie raportu zwiadowczego,
        // nie na obserwacji boiskowej. Im słabszy trener, tym większy możliwy błąd.
        if (scoutReport && state.minute < 25) {
            // Jeśli AI myśli, że rywal jest wyczerpany → atakuj od początku
            if (scoutReport.perceivedFatigueLevel === 'EXHAUSTED') {
                attackNeed += 25;
                if (Math.random() > 0.6) logs.push(`Trener rywali wyczuł zmęczenie w naszych szeregach i rusza do ataku.`);
            } else if (scoutReport.perceivedFatigueLevel === 'TIRED') {
                attackNeed += 12;
            }
            // Jeśli AI myśli, że rywal jest osłabiony kadrowo → agresywne otwarcie
            if (scoutReport.isPerceivedWeakened) {
                attackNeed += 20;
                if (Math.random() > 0.65) logs.push(`Rywale wiedzą o naszych problemach kadrowych i od razu naciskają.`);
            }
            // Jeśli AI błędnie przecenia naszą siłę → zbyt defensywny start (poprawa po 25')
            const perceivedGap = scoutReport.perceivedPower - aiSidePower;
            if (perceivedGap > 60) {
                defendNeed += 20; // AI myśli, że rywal jest dużo silniejszy niż w rzeczywistości
            } else if (perceivedGap < -40) {
                attackNeed += 15; // AI myśli, że rywal jest dużo słabszy → atakuje od startu
            }
        }

        // UNDERDOG: Dysproporcja sił — AI słabsze → zagęszcza obronę, czeka na kontrę
        // Od minuty 25 używamy obserwacji na żywo; wcześniej scouting wpływa przez attackNeed/defendNeed powyżej
        const powerGap = playerSidePower - aiSidePower;
        if (powerGap >= 40) {
            // Bazowy boost obronny + skalowanie: gap=40→+40, gap=70→+55, gap=100→+70
            defendNeed += 40 + Math.min(30, (powerGap - 40) * 0.5);
            // Przy remisie lub prowadzeniu: nie wychylaj się, chroń wynik
            if (scoreDiff >= 0) {
                if (!newTempo) newTempo = 'SLOW';
                if (!newMindset) newMindset = 'DEFENSIVE';
            }
            // Przy bardzo dużej dysproporcji: komentarz o kontrataku (raz, losowo)
            if (powerGap >= 70 && Math.random() > 0.55) {
                logs.push(`Rywale okopują się w obronie — grają wyłącznie na kontratak.`);
            }
            // [SLOT UD1] - miejsce na skalowanie intensywności przy ekstremalnej dysproporcji (np. gap >= 100)
        }

        // Dogrywka — specjalna logika pilnowania wyniku i sił
        if (state.isExtraTime) {
            if (scoreDiff === 0) {
                attackNeed += 30; // Lepiej strzelić gola niż ryzykować niepewne karne
                if (Math.random() > 0.4 && !newTempo) newTempo = 'SLOW';          // 60%: oszczędność nóg
                if (Math.random() > 0.6 && !newIntensity) newIntensity = 'CAUTIOUS'; // 40%: unikaj żółtych
                logs.push(`Rywale grają ostrożnie w dogrywce, szukając jednego gola.`);
            } else if (scoreDiff > 0 && minsLeft < 10) {
                defendNeed += 60; // Dowieź wynik w końcówce dogrywki
            }
            // [SLOT ET1] - miejsce na dodatkową logikę dogrywkową (np. 2. połowa ET, wynik 0:0 po 110')
        }

        // Losowy błąd trenera (nawet dobry trener może spieprzyć)
        const errorChance = 0.12 - (coachDec / 400) - (coachExp / 600); // 12% → ~2-4% u najlepszych
        if (Math.random() < errorChance) {
            const badRoll = Math.random();
            if (badRoll < 0.5) attackNeed += 50;     // panika
            else defendNeed += 55;                    // tchórzostwo
            logs.push(`Trener rywala popełnia dziwny błąd taktyczny...`);
        }

        // Decydujemy co robimy
        let targetStyle = "NEUTRAL";
        if (attackNeed > defendNeed + 25) targetStyle = "AGGRESSIVE";
        if (defendNeed > attackNeed + 25) targetStyle = "DEFENSIVE";

        // Mapowanie na taktyki (możesz później zmieniać kolejność)
        const aggressiveTactics = ["4-2-4", "3-4-3", "4-3-3", "4-2-3-1", "4-4-2-OFF", "4-3-3-F9"];
        const defensiveTactics  = ["6-3-1", "5-4-1", "5-3-2", "4-5-1", "4-4-2-DEF", "5-2-1-2"];
       const neutralTactics    = ["4-4-2", "3-5-2", "4-1-4-1", "4-4-2-DIAMOND", "4-3-2-1", "3-4-2-1"];

        // TUTAJ WSTAW TEN KOD (LOGIKA REAKCJI NA 7 SENSORÓW)
        let possibleTactics = neutralTactics;
        let sensorLog: string | null = null; // komentarz odłożony — zostanie wypchnięty TYLKO przy faktycznej zmianie taktyki

        if (aiSensors) {
          if (aiSensors.losingByTwo || aiSensors.lateChase) {
            possibleTactics = ["3-4-3", "4-2-4"]; // Reakcja na warunki 1 i 6
            sensorLog = `Rywal rzuca się do ataku!`;
          } else if (aiSensors.lateLeadUnderPressure || aiSensors.lateDrawUnderPressure || aiSensors.winningWeaker) {
            possibleTactics = ["5-4-1", "6-3-1", "5-3-2"]; // Reakcja na warunki 3, 5 i 7
            sensorLog = `Rywale murują bramkę, by dowieźć wynik!`;
          } else if (aiSensors.opponentShortHanded) {
            possibleTactics = ["4-3-3", "4-4-2-OFF"]; // Reakcja na warunek 2
            sensorLog = `Trener rywali zauważa naszą przewagę liczebną i rusza do ataku!`;
          } else if (aiSensors.winningStronger) {
            possibleTactics = ["4-2-3-1", "4-1-4-1"]; // Reakcja na warunek 4
            sensorLog = `Rywale kontrolują grę, szukając kolejnych szans.`;
          }

if (aiSensors.winningWeaker) {
              // 1a) Losowe spowolnienie gry (50% szans)
              if (Math.random() > 0.5) newTempo = 'SLOW';
              // 1b) Losowe nastawienie Defensive (50% szans)
              if (Math.random() > 0.5) newMindset = 'DEFENSIVE';
              
              if (newTempo || newMindset) {
                  logs.push(`Trener rywali zaczyna grać na czas i krzyczy aby zagęścić pole karne.`);
              }
}

        }
        // KONIEC KODU DO WSTAWIENIA
        if (possibleTactics === neutralTactics) {
            if (targetStyle === "AGGRESSIVE") possibleTactics = aggressiveTactics;
            if (targetStyle === "DEFENSIVE")  possibleTactics = defensiveTactics;
        }

        // Wybieramy jedną inną niż obecna (jeśli jest sensowna zmiana)
       // Wybieramy jedną inną niż obecna (jeśli jest sensowna zmiana)
        const current = newLineup.tacticId;

        // COOLDOWN ZMIANY TAKTYKI: minimum 12 minut między zmianami formacji,
        // nawet przy isPriority (podmiany mogą nadal zachodzić swobodnie).
        const TACTIC_CHANGE_COOLDOWN = 12;
        const minutesSinceLastAction = state.minute - (state.lastAiActionMinute || 0);
        const canChangeTacticNow = minutesSinceLastAction >= TACTIC_CHANGE_COOLDOWN;
        // [SLOT TC1] - miejsce na wyjątek od cooldownu (np. natychmiastowa zmiana po stracie bramkarza)

        // Sprawdzamy, czy obecna taktyka już pasuje do wyliczonego celu (targetStyle)
        const isStyleAlreadyCorrect = possibleTactics.includes(current);

        // AI zmienia system TYLKO jeśli obecna taktyka NIE realizuje pożądanego stylu I minął cooldown
        if (!isStyleAlreadyCorrect && canChangeTacticNow) {
            const candidates = possibleTactics.filter(t => t !== current);
            if (candidates.length > 0) { 
                newTacticId = candidates[Math.floor(Math.random() * candidates.length)];
                // Komentarz sensorowy wyświetlamy TYLKO przy faktycznej zmianie taktyki (raz)
                if (sensorLog) logs.push(sensorLog);
                logs.push(`Zmiana taktyki: ${newTacticId} (${targetStyle.toLowerCase()}).`);
            }
        }
        // KONIEC KODU
    }

    // --- SCENARIUSZ C: DOPASOWANIE ZAWODNIKA DO TAKTYKI LUB ZMĘCZENIA ---
    if (!subRecord) {
        let playerToOutId: string | null = null;
        let subReason = "";

        // Priorytet 1: Poważna kontuzja
        const injuredId = newLineup.startingXI.find(id => id && state[isHome ? 'homeInjuries' : 'awayInjuries'][id] === InjurySeverity.SEVERE);

        if (injuredId) {
            playerToOutId = injuredId;
            subReason = "wymuszona kontuzją";
        } else {
            // Priorytet 1.5: Żółta kartka — podmiana profilaktyczna (od 55. minuty, doświadczony trener)
            if (state.minute >= 55 && coachExp > 45) {
                const yellowCandidates = (newLineup.startingXI.filter(id => id !== null) as string[])
                    .filter(id => (state.playerYellowCards[id] || 0) >= 1
                               && myPlayers.find(p => p.id === id)?.position !== PlayerPosition.GK);
                for (const yid of yellowCandidates) {
                    const yPlayer = myPlayers.find(p => p.id === yid);
                    if (!yPlayer) continue;
                    const yIdx = newLineup.startingXI.indexOf(yid);
                    const yRole = TacticRepository.getById(newLineup.tacticId).slots[yIdx].role;
                    const bestYSub = newLineup.bench
                        .map(id => myPlayers.find(p => p.id === id))
                        .filter((p): p is Player => !!p && !outIds.has(p.id) && p.position !== PlayerPosition.GK
                            && (p.health.status !== HealthStatus.INJURED || p.health.injury?.severity !== InjurySeverity.SEVERE))
                        .sort((a, b) => LineupService.calculateFitScore(b, yRole) - LineupService.calculateFitScore(a, yRole))[0];
                    if (bestYSub && bestYSub.overallRating >= yPlayer.overallRating - 15) {
                        playerToOutId = yid;
                        subReason = "profilaktyczna (żółta kartka)";
                        break;
                    }
                }
                // [SLOT YC1] - miejsce na bardziej złożoną logikę żółtych kartek (np. wyróżnienie kluczowych ról)
            }

            if (!playerToOutId) {
                // Priorytet 2: Zmęczenie
                const fatigueThreshold = isHalftime ? 92 : 82;
                const tiredId = newLineup.startingXI.find(id => id && (currentFatigue[id] || 100) < fatigueThreshold);
                if (tiredId) {
                    playerToOutId = tiredId;
                    subReason = "odświeżenie składu";
                } else if (isHalftime || state.minute > 60) {
                    // Priorytet 3: Zmiana taktyczna (najniższy poziom kondycji)
                    const playersOnPitch = newLineup.startingXI.filter(id => id !== null) as string[];
                    playerToOutId = playersOnPitch.sort((a, b) => (currentFatigue[a] || 100) - (currentFatigue[b] || 100))[0];
                    subReason = "Zmiana taktyczna";
                }
            }
        }

        if (playerToOutId) {
            const idx = newLineup.startingXI.indexOf(playerToOutId);
            const targetTactic = newTacticId || newLineup.tacticId;
            const role = TacticRepository.getById(targetTactic).slots[idx].role;

            const benchPoolRaw = newLineup.bench.map(id => myPlayers.find(p => p.id === id)!)
                .filter(p => p && (p.health.status !== HealthStatus.INJURED || p.health.injury?.severity !== InjurySeverity.SEVERE) && !outIds.has(p.id));

            if (benchPoolRaw.length > 0) {
                const isGkRole = role === PlayerPosition.GK;
                const specialistPool = benchPoolRaw.filter(p => isGkRole ? p.position === PlayerPosition.GK : p.position !== PlayerPosition.GK);
                const finalPool = specialistPool.length > 0 ? specialistPool : benchPoolRaw;

                // Preferuj zdrowych graczy — kontuzjowani (nie SEVERE) mają karę -3 do fit score
                const bestSub = finalPool.sort((a, b) => {
                    const aFit = LineupService.calculateFitScore(a, role) + (a.health.status === HealthStatus.INJURED ? -3 : 0);
                    const bFit = LineupService.calculateFitScore(b, role) + (b.health.status === HealthStatus.INJURED ? -3 : 0);
                    return bFit - aFit;
                })[0];
                // [SLOT HP1] - miejsce na dalsze uwzględnienie zdrowia (np. -5 za MODERATE uraz)

                if (bestSub) {
                    // Sprawdzenie jakości ławki — doświadczony trener (exp > 70) nie zmienia na dużo gorszego gracza
                    const playerOutObj = myPlayers.find(p => p.id === playerToOutId);
                    const qualityDrop = (playerOutObj?.overallRating || 70) - bestSub.overallRating;
                    const isForced = subReason === "wymuszona kontuzją" || subReason === "profilaktyczna (żółta kartka)";
                    if (!isForced && qualityDrop > 15 && coachExp > 70) {
                        logs.push(`Trener rywali uznaje, że zmiennik jest zbyt słaby — pozostawia zmęczonego zawodnika.`);
                        // [SLOT BQ1] - miejsce na logikę alternatywną (np. próba drugiej pozycji w ławce)
                    } else {
                        const pOut = myPlayers.find(p => p.id === playerToOutId);
                        newLineup = LineupService.swapPlayers(newLineup, playerToOutId, bestSub.id, idx);
                        newSubsCount++;
                        subRecord = { playerOutId: playerToOutId, playerInId: bestSub.id, minute: state.minute };
                        logs.push(`${isHalftime ? '' : state.minute + '\''} - ${bestSub.lastName} wchodzi za ${pOut?.lastName} (${subReason}).`);
                    }
                }
            }
        }
    }

    // --- PRZERWA: PODWÓJNA ZMIANA ---
    // W przerwie trener może wykonać dwie zmiany jednocześnie jeśli dwóch graczy jest zmęczonych.
    let secondSubRecord: SubstitutionRecord | undefined;
    if (isHalftime && subRecord && newSubsCount < 5) {
        const outIds2 = new Set([...Array.from(outIds), subRecord.playerOutId]);
        const secondTiredPlayers = (newLineup.startingXI.filter(id => id !== null) as string[])
            .filter(id => id !== subRecord!.playerInId && (currentFatigue[id] || 100) < 92)
            .sort((a, b) => (currentFatigue[a] || 100) - (currentFatigue[b] || 100));
        const secondPlayerToOut = secondTiredPlayers[0] || null;

        if (secondPlayerToOut) {
            const idx2 = newLineup.startingXI.indexOf(secondPlayerToOut);
            const role2 = TacticRepository.getById(newTacticId || newLineup.tacticId).slots[idx2].role;
            const benchPool2 = newLineup.bench
                .map(id => myPlayers.find(p => p.id === id)!)
                .filter(p => p && !outIds2.has(p.id)
                           && (p.health.status !== HealthStatus.INJURED || p.health.injury?.severity !== InjurySeverity.SEVERE));
            const isGkRole2 = role2 === PlayerPosition.GK;
            const specialistPool2 = benchPool2.filter(p => isGkRole2 ? p.position === PlayerPosition.GK : p.position !== PlayerPosition.GK);
            const finalPool2 = specialistPool2.length > 0 ? specialistPool2 : benchPool2;
            const bestSub2 = finalPool2.sort((a, b) => {
                const aFit = LineupService.calculateFitScore(a, role2) + (a.health.status === HealthStatus.INJURED ? -3 : 0);
                const bFit = LineupService.calculateFitScore(b, role2) + (b.health.status === HealthStatus.INJURED ? -3 : 0);
                return bFit - aFit;
            })[0];
            if (bestSub2) {
                const pOut2 = myPlayers.find(p => p.id === secondPlayerToOut);
                newLineup = LineupService.swapPlayers(newLineup, secondPlayerToOut, bestSub2.id, idx2);
                newSubsCount++;
                secondSubRecord = { playerOutId: secondPlayerToOut, playerInId: bestSub2.id, minute: state.minute };
                logs.push(`${bestSub2.lastName} wchodzi za ${pOut2?.lastName} (przerwa — podwójna zmiana).`);
            }
        }
        // [SLOT DS1] - miejsce na trzecią zmianę w przerwie (np. kontuzja + zmęczenie jednocześnie)
    }

    // Zmiana lastAiActionMinute następuje przy dowolnej zmianie taktycznej/instrukcji
    const hasAnyChange = !!subRecord || !!secondSubRecord || !!newTacticId || !!newTempo || !!newMindset || !!newIntensity;

    return { 
      newLineup: (subRecord || secondSubRecord || newTacticId) ? newLineup : undefined, 
      newSubsCount: (subRecord || secondSubRecord) ? newSubsCount : undefined,
      subRecord,
      secondSubRecord,
      newTacticId,
      newTempo,      // Nowe pole dla silnika
      newMindset,    // Nowe pole dla silnika
      newIntensity,  // Nowe pole dla silnika
      logs 
    };
  }
};