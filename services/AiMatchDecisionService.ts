import { MatchLiveState, MatchContext, Player, PlayerPosition, Lineup, SubstitutionRecord, InjurySeverity } from '../types';
import { TacticRepository } from '../resources/tactics_db';
import { LineupService } from './LineupService';

export const AiMatchDecisionService = {
  /**
   * Główna funkcja decyzyjna dla AI. Zoptymalizowana pod kątem widoczności zmian.
   */
  makeDecisions: (
    state: MatchLiveState, 
    ctx: MatchContext, 
    side: 'HOME' | 'AWAY',
    isPriority: boolean = false,
    isHalftime: boolean = false
  ): { newLineup?: Lineup, newSubsCount?: number, subRecord?: SubstitutionRecord, newTacticId?: string, lastAiActionMinute?: number, logs: string[] } => {
    
    const isHome = side === 'HOME';
    const logs: string[] = [];
    
    // 1. CZAS REAKCJI (COOLDOWN)
    const cooldown = isPriority || isHalftime ? 0 : 4; 
    const lastAction = state.lastAiActionMinute || 0;
    if (!isPriority && !isHalftime && (state.minute - lastAction < cooldown)) {
      return { logs: [] };
    }

    const currentLineup = isHome ? state.homeLineup : state.awayLineup;
    const currentSubsCount = isHome ? state.subsCountHome : state.subsCountAway;
    const currentFatigue = isHome ? state.homeFatigue : state.awayFatigue;
    const currentInjuries = isHome ? state.homeInjuries : state.awayInjuries;
   const myPlayers = isHome ? ctx.homePlayers : ctx.awayPlayers;
    const mySubsHistory = isHome ? state.homeSubsHistory : state.awaySubsHistory;

    // TUTAJ WSTAW TEN KOD - Definicja zbioru IDs zawodników, którzy już zeszli z boiska
    const outIds = new Set(mySubsHistory.map(s => s.playerOutId));
    
    const myScore = isHome ? state.homeScore : state.awayScore;
    const oppScore = isHome ? state.awayScore : state.homeScore;
    const scoreDiff = myScore - oppScore;

    // 2. SZANSA NA PODJĘCIE DZIAŁANIA (Intuicja) - Zwiększone prawdopodobieństwo
    let reactionChance = 0.35; 
    if (isHalftime) {
      // W przerwie AI prawie zawsze chce coś poprawić jeśli nie wygrywa
      reactionChance = scoreDiff < 0 ? 0.85 : (scoreDiff === 0 ? 0.50 : 0.25);
    } else {
      reactionChance = isPriority ? 1.0 : (state.minute < 45 ? 0.30 : (state.minute < 75 ? 0.75 : 0.95));
      if (scoreDiff < 0) reactionChance += 0.20; 
    }

    if (Math.random() > reactionChance && !isPriority) return { logs: [] };

    let newLineup = { ...currentLineup, startingXI: [...currentLineup.startingXI], bench: [...currentLineup.bench] };
    let newSubsCount = currentSubsCount;
    let subRecord: SubstitutionRecord | undefined;
    let newTacticId: string | undefined;
    let updatedActionMinute = state.minute;

const tactic = TacticRepository.getById(newLineup.tacticId);

    // --- PRIORYTET 1: BRAK BRAMKARZA / CZERWONA KARTKA GK ---
    const gkInSlot = newLineup.startingXI[0];
    if (gkInSlot === null) {
       const bestGkOnBench = newLineup.bench
         .map(id => myPlayers.find(p => p.id === id)).filter((p): p is Player => !!p)
         .filter(p => p && p.position === PlayerPosition.GK && !outIds.has(p.id))
         .sort((a, b) => b.overallRating - a.overallRating)[0];

       // OPCJA A: Mamy zmiany i bramkarza na ławce -> Standardowa procedura
       if (bestGkOnBench && currentSubsCount < 5) {
          let fieldPlayerIdx = -1;
          for (let i = newLineup.startingXI.length - 1; i >= 1; i--) { 
            if (newLineup.startingXI[i] !== null) { fieldPlayerIdx = i; break; }
          }
          if (fieldPlayerIdx !== -1) {
             const playerOutId = newLineup.startingXI[fieldPlayerIdx]!;
             newLineup.startingXI[fieldPlayerIdx] = null; 
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
             newLineup.startingXI[bestCandidate.idx] = null; 
             logs.push(`${state.minute}' - AI: DRAMAT! ${bestCandidate.p.lastName} musi stanąć między słupkami!`);
          }
       }
    }


// --- SYSTEM KONSOLIDACJI DEFENSYWNEJ (SKD) ---
    // Logika: Jeśli wygrywamy i mamy czerwoną kartkę, priorytetem jest szczelność obrony.
    const mySentOffCount = state.sentOffIds.filter(id => myPlayers.some(p => p.id === id)).length;
    
    // SKASUJ TEN KOD (zmienna outIds jest już zdefiniowana wyżej)
    
    if (scoreDiff > 0 && mySentOffCount > 0) {
       // A. Natychmiastowa zmiana taktyki na ultra-defensywną
       if (newLineup.tacticId !== '5-4-1' && newLineup.tacticId !== '6-3-1') {
          newTacticId = '5-4-1';
          logs.push(`${state.minute}' - AI: System Konsolidacji Defensywnej aktywny. Przejście na 5-4-1.`);
       }

       // B. Sprawdzenie czy w linii obrony jest "dziura" (null)
       const defSlots = tactic.slots.filter(s => s.role === PlayerPosition.DEF).map(s => s.index);
       const emptyDefIdx = defSlots.find(idx => newLineup.startingXI[idx] === null);

       if (emptyDefIdx !== undefined && !subRecord) {
          // Opcja 1: Mamy zmiany -> Wstawiamy najlepszego obrońcę z ławki kosztem napastnika/pomocnika
          if (newSubsCount < 5) {
            const bestDefOnBench = newLineup.bench
    .map(id => myPlayers.find(p => p.id === id)).filter((p): p is Player => !!p)
    .filter(p => p.position === PlayerPosition.DEF && !outIds.has(p.id))
                .sort((a, b) => b.overallRating - a.overallRating)[0];

             if (bestDefOnBench) {
                // Naprawa błędu findLastIndex: używamy pętli od tyłu
                let sacrificeIdx = -1;
                for (let i = newLineup.startingXI.length - 1; i >= 0; i--) {
                   const pid = newLineup.startingXI[i];
                   if (pid !== null && (tactic.slots[i].role === PlayerPosition.FWD || tactic.slots[i].role === PlayerPosition.MID)) {
                      sacrificeIdx = i;
                      break;
                   }
                }

                if (sacrificeIdx !== -1) {
                   const playerOutId = newLineup.startingXI[sacrificeIdx]!;
                   newLineup.startingXI[sacrificeIdx] = null;
                   newLineup.startingXI[emptyDefIdx] = bestDefOnBench.id;
                   newLineup.bench = newLineup.bench.filter(id => id !== bestDefOnBench.id);
                   newSubsCount++;
                   subRecord = { playerOutId, playerInId: bestDefOnBench.id, minute: state.minute };
                   logs.push(`${state.minute}' - AI: Poświęcenie ofensywy dla ratowania tyłów. ${bestDefOnBench.lastName} wchodzi do obrony.`);
                }
             }
          } 
          // Opcja 2: Brak zmian -> Przesuwamy najlepszego defensywnego pomocnika do obrony
          else {
             const bestInternalCover = newLineup.startingXI
                .map((id, idx) => ({ id, idx }))
                .filter(item => item.id !== null && tactic.slots[item.idx].role !== PlayerPosition.DEF && tactic.slots[item.idx].role !== PlayerPosition.GK)
                .map(item => ({ ...item, p: myPlayers.find(p => p.id === item.id)! }))
                .sort((a, b) => b.p.attributes.defending - a.p.attributes.defending)[0];

             if (bestInternalCover) {
                newLineup.startingXI[emptyDefIdx] = bestInternalCover.id;
                newLineup.startingXI[bestInternalCover.idx] = null;
                logs.push(`${state.minute}' - AI: Brak zmian. ${bestInternalCover.p.lastName} przesunięty do linii obrony.`);
             }
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
          const outIds = new Set(mySubsHistory.map(s => s.playerOutId));

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
             updatedActionMinute = state.minute;
             logs.push(`${state.minute}' - AI: ${bestSub.lastName} wchodzi w miejsce zniesionego gracza.`);
          }
        }
      }
    }

    // --- SMART SUBS: ZMĘCZENIE I TAKTYKA ---
    if (!subRecord && currentSubsCount < 5) {
      let playerOutId: string | null = null;
      let reason = "";

      const injuredId = newLineup.startingXI.find(id => id && currentInjuries[id] === InjurySeverity.SEVERE);
      
      if (injuredId) {
        playerOutId = injuredId;
        reason = "kontuzja";
      } else if (isHalftime || state.minute > 55) {
        const fatigueThreshold = isHalftime ? 92 : 88;
        
        const candidates = newLineup.startingXI
          .filter(id => id !== null)
          .map(id => ({ id: id!, fatigue: currentFatigue[id!] || 100 }))
          .filter(c => c.fatigue < fatigueThreshold)
          .sort((a, b) => a.fatigue - b.fatigue);

        if (candidates.length > 0) {
          playerOutId = candidates[0].id;
          reason = isHalftime ? "korekta taktyczna" : "odświeżenie składu";
        } else if (isHalftime && scoreDiff < 0) {
          const fieldPlayers = newLineup.startingXI
            .slice(1)
            .filter(id => id !== null)
            .map(id => myPlayers.find(p => p.id === id))
            .filter((p): p is Player => p !== undefined)
            .sort((a, b) => a.overallRating - a.overallRating);
          
          if (fieldPlayers.length > 0) {
            playerOutId = fieldPlayers[0].id;
            reason = "impuls managera";
          }
        }
      }

      if (playerOutId) {
        const slotIdx = newLineup.startingXI.indexOf(playerOutId);
        const requiredRole = tactic.slots[slotIdx].role;
        const outIds = new Set(mySubsHistory.map(s => s.playerOutId));
        
        const benchPool = newLineup.bench
          .map(id => myPlayers.find(p => p.id === id)!)
          .filter(p => p && !outIds.has(p.id));

        let bestSub = null;
        if (requiredRole === PlayerPosition.GK) {
           bestSub = benchPool.filter(p => p.position === PlayerPosition.GK).sort((a,b) => b.overallRating - a.overallRating)[0];
        } else {
           bestSub = benchPool
             .filter(p => p.position !== PlayerPosition.GK)
             .sort((a, b) => {
                let scoreA = LineupService.calculateFitScore(a, requiredRole);
                let scoreB = LineupService.calculateFitScore(b, requiredRole);
                if (scoreDiff < 0 && b.position === PlayerPosition.FWD) scoreB += 25;
                return scoreB - scoreA;
             })[0];
        }

        if (bestSub) {
          const pOut = myPlayers.find(p => p.id === playerOutId);
          newLineup = LineupService.swapPlayers(newLineup, playerOutId, bestSub.id, slotIdx);
          newSubsCount = currentSubsCount + 1;
          subRecord = { playerOutId, playerInId: bestSub.id, minute: state.minute };
          logs.push(`${isHalftime ? 'Przerwa' : state.minute + '\''} - Zmiana ${bestSub.lastName} zastępuje ${pOut?.lastName} (${reason}).`);
        }
      }
    }

    // --- REAKCJA TAKTYCZNA ---
    if (state.minute > 20 && !newTacticId) {
      if (scoreDiff < -1 && state.minute > 45 && currentLineup.tacticId !== '3-4-3') {
           newTacticId = '3-4-3';
           logs.push(`${state.minute}' - Zmiana ustawienia na 3-4-3.`);
      }
     else if (scoreDiff > 0 && state.minute > 75 && currentLineup.tacticId !== '5-4-1' && mySentOffCount === 0) {
        newTacticId = '5-4-1';
        logs.push(`${state.minute}' - Przeciwnik przechodzi na grę defensywną (5-4-1).`);
      }
    }

    return { 
      newLineup, 
      newSubsCount,
      subRecord,
      newTacticId,
      lastAiActionMinute: updatedActionMinute,
      logs 
    };
  }
};