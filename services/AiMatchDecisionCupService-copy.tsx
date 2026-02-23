import { MatchLiveState, MatchContext, Player, PlayerPosition, Lineup, SubstitutionRecord, InjurySeverity, HealthStatus, Coach } from '../types';
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
    aiSensors?: any
  ): { 
    newLineup?: Lineup, 
    newSubsCount?: number, 
    subRecord?: SubstitutionRecord, 
    newTacticId?: string, 
    newTempo?: string, 
    newMindset?: string, 
    newIntensity?: string,
    lastAiActionMinute?: number, 
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
    const ADAPTATION_TIME = 15;
    const canChangeTactics = isPriority || (state.minute - (state.lastAiActionMinute || 0) >= ADAPTATION_TIME);

    if (!canChangeTactics && !isPriority) {
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
    
    if (scoreDiff <= -3 || (playerSidePower - aiSidePower) >= 40) {
        if (Math.random() > 0.5) {
            newIntensity = 'AGGRESSIVE';
            logs.push(`${state.minute}' - AI: Trener rywali nakazuje drastyczne zwiększenie agresji, by ratować wynik.`);
        }
    }

    const playerTempo = state.userInstructions?.tempo || 'NORMAL';
    const currentMomentum = state.momentum || 5;

    if (playerTempo === 'FAST' && scoreDiff > 0 && Math.random() > 0.6) {
        newTempo = 'SLOW';
        logs.push(`${state.minute}' - AI: Rywale spowalniają grę, by zneutralizować nasze wysokie tempo.`);
    }

    if (currentMomentum > 65 && newIntensity !== 'CAUTIOUS' && Math.random() > 0.7) {
        newIntensity = 'AGGRESSIVE';
        logs.push(`${state.minute}' - AI: Przeciwnik gra ostrzej, próbując odzyskać inicjatywę.`);
    }

    // --- STAGE 1 PRO: KLAUZULA BEZPIECZEŃSTWA (CZERWONA KARTKA AI) ---
    const mySentOffCount = state.sentOffIds.filter(id => myPlayers.some(p => p.id === id)).length;
    if (mySentOffCount > 0) {
        const cautionRoll = Math.floor(Math.random() * 3); // Losowo: 0, 1, 2
        
        if (cautionRoll === 1) {
            newIntensity = 'CAUTIOUS';
            logs.push(`${state.minute}' - AI: Po czerwonej kartce trener rywali nakazuje maksymalną ostrożność.`);
        } else if (cautionRoll === 2) {
            newIntensity = 'NORMAL';
            logs.push(`${state.minute}' - AI: Trener rywali tonuje nastroje, by uniknąć kolejnych wykluczeń.`);
        }
        // Jeśli 0 -> trener ignoruje ryzyko i trzyma się pierwotnego planu (np. AGGRESSIVE)
    }


    let sparkThreshold = 35 + (coachDec / 3);
    
    // Gwarantowane okna decyzyjne
    if (isHalftime) sparkThreshold = 95; 
    if (state.minute >= 60 && currentSubsCount < 2) sparkThreshold = 90;
    if (state.minute >= 75 && currentSubsCount < 3) sparkThreshold = 100;
    if (isDesperate) sparkThreshold = 100;

   
    
       // === LUDZKI MECHANIZM DECYZYJNY AI – zależny od trenera + losowość ===

    // 1. Bazowe ryzyko błędu trenera (im gorszy trener → tym wyższe ryzyko)
    let baseMistakeChance = 45 - (coachDec * 0.35) - (coachExp * 0.25);
    baseMistakeChance = Math.max(8, Math.min(50, baseMistakeChance)); // zakres 8–50%

    // 2. Czynnik losowy – "dzień z życia trenera" (od -12 do +18)
    const humanFactor = (Math.random() * 30) - 12;

    // 3. Końcowe ryzyko poważnej pomyłki
    const finalMistakeRisk = baseMistakeChance + humanFactor;
    
    // 4. Szansa na podjęcie sensownej decyzji (Wymuszona 100% przy priorytecie)
   const decisionChance = isPriority ? 100 : Math.max(5, sparkThreshold - finalMistakeRisk);

    // 5. Sprawdzamy, czy trener w ogóle podejmuje decyzję
    if (Math.random() * 100 > decisionChance) {
      // Trener popełnia błąd → albo olewa sytuację, albo robi coś głupiego
      const mistakeRoll = Math.random();
      
      if (mistakeRoll < 0.65) {
        // Najczęstszy błąd: po prostu nie reaguje
        logs.push(`${state.minute}' - Trener rywala nie podejmuje żadnej decyzji pomimo, iż sytuacja tego wymaga.`);
        return { logs };
      } 
      else if (mistakeRoll < 0.90) {
        // Średni błąd: podejmuje decyzję, ale słabą / nieoptymalną
        logs.push(`${state.minute}' - Dziwna decyzja trenera rywali.`);
        // Można tu dodać lekką, nieoptymalną zmianę (patrz niżej)
      } 
      else {
        // Rzadki, ale spektakularny błąd – np. dziwna zmiana
        logs.push(`${state.minute}' - Trener rywala chyba nie odczytał sytuacji na boisku!`);
        // Można dodać np. zmianę najlepszego gracza na najgorszego z ławki
      }
    }

    // Jeśli dotarliśmy tutaj → trener podejmuje **sensowną decyzję**
    // (ciąg dalszy Twojego obecnego kodu z naprawą składu, zmianą taktyki itp.)

 
    // -> tutaj wstaw kod (STAGE 1 PRO: Globalna blokada powrotu zawodników)
    const outIds = new Set(mySubsHistory.map(s => s.playerOutId));

    if (currentSubsCount >= 5) return { logs: [] };

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
             logs.push(`${state.minute}' - AI: Bramkarz rezerwowy ${bestGkOnBench.lastName} zastępuje gracza z pola!`);
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
             logs.push(`${state.minute}' - AI: DRAMAT! ${bestCandidate.p.lastName} musi stanąć między słupkami!`);
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
             logs.push(`${state.minute}' - AI: ${bestSub.lastName} wchodzi w miejsce zniesionego gracza.`);
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
            // Doświadczony trener przy 0-3 przechodzi w tryb "Damage Control" zamiast szaleńczego ataku
            attackNeed += 20; 
            defendNeed += 60;
            if (Math.random() > 0.7) logs.push(`${state.minute}' - AI: Trener rywali nakazuje uspokojenie gry, by uniknąć blamażu.`);
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

        // Losowy błąd trenera (nawet dobry trener może spieprzyć)
        const errorChance = 0.12 - (coachDec / 400) - (coachExp / 600); // 12% → ~2-4% u najlepszych
        if (Math.random() < errorChance) {
            const badRoll = Math.random();
            if (badRoll < 0.5) attackNeed += 50;     // panika
            else defendNeed += 55;                    // tchórzostwo
            logs.push(`${state.minute}' - Trener rywala popełnia dziwny błąd taktyczny...`);
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

        if (aiSensors) {
          if (aiSensors.losingByTwo || aiSensors.lateChase) {
            possibleTactics = ["3-4-3", "4-2-4"]; // Reakcja na warunki 1 i 6
            logs.push(`${state.minute}' - AI: Trener rywala nakazuje totalny atak!`);
          } else if (aiSensors.lateLeadUnderPressure || aiSensors.lateDrawUnderPressure || aiSensors.winningWeaker) {
            possibleTactics = ["5-4-1", "6-3-1", "5-3-2"]; // Reakcja na warunki 3, 5 i 7
            logs.push(`${state.minute}' - AI: Rywale murują bramkę, by dowieźć wynik!`);
          } else if (aiSensors.opponentShortHanded) {
            possibleTactics = ["4-3-3", "4-4-2-OFF"]; // Reakcja na warunek 2
            logs.push(`${state.minute}' - AI: Przeciwnik próbuje wykorzystać naszą lukę w składzie!`);
          } else if (aiSensors.winningStronger) {
            possibleTactics = ["4-2-3-1", "4-1-4-1"]; // Reakcja na warunek 4
            logs.push(`${state.minute}' - AI: Rywale kontrolują grę, szukając kolejnych szans.`);
          }

if (aiSensors.winningWeaker) {
              // 1a) Losowe spowolnienie gry (50% szans)
              if (Math.random() > 0.5) newTempo = 'SLOW';
              // 1b) Losowe nastawienie Defensive (50% szans)
              if (Math.random() > 0.5) newMindset = 'DEFENSIVE';
              
              if (newTempo || newMindset) {
                  logs.push(`${state.minute}' - AI: Trener rywali nakazuje kradzież czasu i zagęszczenie pola karnego.`);
              }
}

        }
        // KONIEC KODU DO WSTAWIENIA
        if (targetStyle === "AGGRESSIVE") possibleTactics = aggressiveTactics;
        if (targetStyle === "DEFENSIVE")  possibleTactics = defensiveTactics;

        // Wybieramy jedną inną niż obecna (jeśli jest sensowna zmiana)
       // Wybieramy jedną inną niż obecna (jeśli jest sensowna zmiana)
        const current = newLineup.tacticId;

        // TUTAJ WSTAW TEN KOD:
        // Sprawdzamy, czy obecna taktyka już pasuje do wyliczonego celu (targetStyle)
        const isStyleAlreadyCorrect = possibleTactics.includes(current);

        // AI zmienia system TYLKO jeśli obecna taktyka NIE realizuje pożądanego stylu
        if (!isStyleAlreadyCorrect) {
            const candidates = possibleTactics.filter(t => t !== current);
            if (candidates.length > 0) { 
                newTacticId = candidates[Math.floor(Math.random() * candidates.length)];
                logs.push(`${state.minute}' - Reakcja taktyczna: Przejście na system ${newTacticId} (${targetStyle.toLowerCase()}).`);
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
            // Priorytet 2: Zmęczenie (Próg obniżony dla częstszych zmian)
            const fatigueThreshold = isHalftime ? 92 : 82;
            const tiredId = newLineup.startingXI.find(id => id && (currentFatigue[id] || 100) < fatigueThreshold);
            
            if (tiredId) {
                playerToOutId = tiredId;
                subReason = "odświeżenie składu";
            } else if (isHalftime || state.minute > 60) {
                // Priorytet 3: Słaby występ (Najniższy rating) - symulacja decyzji trenera o zmianie "pod formę"
                const playersOnPitch = newLineup.startingXI.filter(id => id !== null) as string[];
                playerToOutId = playersOnPitch.sort((a,b) => (currentFatigue[a] || 100) - (currentFatigue[b] || 100))[0];
                subReason = "Zmiana taktyczna";
            }
        }

        if (playerToOutId) {
            const idx = newLineup.startingXI.indexOf(playerToOutId);
          const targetTactic = newTacticId || newLineup.tacticId;
            const role = TacticRepository.getById(targetTactic).slots[idx].role;
            
            // (outIds używa teraz definicji globalnej z początku funkcji)
            // STAGE 1 PRO: AI pozwala wejść graczom z lekkim urazem, jeśli są zdolni do gry (nie SEVERE)
            const benchPoolRaw = newLineup.bench.map(id => myPlayers.find(p => p.id === id)!)
                .filter(p => p && (p.health.status !== HealthStatus.INJURED || p.health.injury?.severity !== InjurySeverity.SEVERE) && !outIds.has(p.id));

            if (benchPoolRaw.length > 0) {
                // -> TUTAJ WSTAW TEN KOD (STAGE 1 PRO: Pełna kaskada z Klauzulą Rozpaczy)
                const isGkRole = role === PlayerPosition.GK;
                
                // Próba 1: Szukamy tylko w odpowiedniej grupie zawodników (Specjaliści)
                const specialistPool = benchPoolRaw.filter(p => isGkRole ? p.position === PlayerPosition.GK : p.position !== PlayerPosition.GK);
                // Próba 2: Failsafe (Jeśli nie ma specjalisty w pole, bierzemy kogokolwiek z ławki - np. GK do ataku)
                const finalPool = specialistPool.length > 0 ? specialistPool : benchPoolRaw;

                const bestSub = finalPool.sort((a,b) => LineupService.calculateFitScore(b, role) - LineupService.calculateFitScore(a, role))[0];
                // KONIEC WSTAWKI
                if (bestSub) {
                    const pOut = myPlayers.find(p => p.id === playerToOutId);
                    newLineup = LineupService.swapPlayers(newLineup, playerToOutId, bestSub.id, idx);
                    newSubsCount++;
                    subRecord = { playerOutId: playerToOutId, playerInId: bestSub.id, minute: state.minute };
                    logs.push(`${isHalftime ? 'Przerwa' : state.minute + '\''} - ${bestSub.lastName} wchodzi za ${pOut?.lastName} (${subReason}).`);
                }
            }
        }
    }

 // Zmiana lastAiActionMinute następuje przy dowolnej zmianie taktycznej/instrukcji
    const hasAnyChange = !!subRecord || !!newTacticId || !!newTempo || !!newMindset;

    return { 
      newLineup: (subRecord || newTacticId) ? newLineup : undefined, 
      newSubsCount: subRecord ? newSubsCount : undefined,
      subRecord,
      newTacticId,
      newTempo,      // Nowe pole dla silnika
      newMindset,    // Nowe pole dla silnika
      newIntensity,  // Nowe pole dla silnika
      lastAiActionMinute: hasAnyChange ? state.minute : state.lastAiActionMinute,
      logs 
    };
  }
};