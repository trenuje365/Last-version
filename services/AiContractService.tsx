import { Club, Player, PendingNegotiation } from '../types';
import { FinanceService as FinanceLogic } from './FinanceService';

export const AiContractService = {
  /**
   * Przetwarza wszystkie kluby AI w poszukiwaniu kończących się kontraktów.
   */
  processClubsContracts: (
    clubs: Club[],
    playersMap: Record<string, Player[]>,
    currentDate: Date,
    userTeamId: string | null
  ): { updatedClubs: Club[], updatedPlayers: Record<string, Player[]> } => {
    
    let updatedClubs = [...clubs];
    let updatedPlayersMap = { ...playersMap };

    updatedClubs = updatedClubs.map(club => {
      // Pomijamy klub gracza i kluby bez przypisanych piłkarzy
      if (club.id === userTeamId || !updatedPlayersMap[club.id]) return club;

      let currentClub = { ...club };
      const squad = updatedPlayersMap[club.id];

      updatedPlayersMap[club.id] = squad.map(player => {
        const p = { ...player };
        
        // 1. Sprawdzenie czy kontrakt wygasa (poniżej 365 dni)
        const daysLeft = Math.floor((new Date(p.contractEndDate).getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysLeft > 365) return p;

        // 2. Blokady: Czy zawodnik chce w ogóle rozmawiać?
        const isLocked = p.negotiationLockoutUntil && currentDate < new Date(p.negotiationLockoutUntil);
        if (isLocked || p.isNegotiationPermanentBlocked) return p;

        // 3. Obliczanie oferty AI
        // AI oferuje podwyżkę 10-25% zależnie od reputacji klubu
        const salaryMultiplier = 1.10 + (club.reputation / 100);
        const proposedSalary = Math.floor(p.annualSalary * salaryMultiplier);
        
        // Bonus za podpis - AI oferuje ok 50% tego co zawodnik chce, o ile klub ma kasę
        const baseDemand = FinanceLogic.calculatePlayerBonusDemand(p, proposedSalary, club.reputation);
        const proposedBonus = Math.floor(baseDemand * 0.75);

        // Czy klub ma na to pieniądze w puli bonusowej?
        if (proposedBonus > currentClub.signingBonusPool) return p;

        // 4. Ewaluacja silnikiem gry
        const newEndDate = new Date(currentDate.getFullYear() + 2, 5, 30).toISOString(); // Nowa umowa na +2 lata
        const result = FinanceLogic.evaluateContractLogic(p, proposedSalary, proposedBonus, newEndDate, currentDate, club.reputation);

        if (result.accepted) {
          // SUKCES: Piłkarz zostaje
          currentClub.signingBonusPool -= proposedBonus;
          currentClub.budget -= proposedBonus;
          return {
            ...p,
            annualSalary: proposedSalary,
            contractEndDate: newEndDate,
            negotiationStep: 0,
            isOnTransferList: false // Zdejmij z listy jeśli podpisał
          };
        } else {
          // PORAŻKA: Zwiększ licznik prób
          const nextStep = (p.negotiationStep || 0) + 1;
          const lockout = new Date(currentDate);
          lockout.setDate(lockout.getDate() + 21); // Blokada na 3 tygodnie

          const permanentBlock = nextStep >= 3;
          
          return {
            ...p,
            negotiationStep: nextStep,
            negotiationLockoutUntil: lockout.toISOString(),
            isNegotiationPermanentBlocked: permanentBlock,
            isOnTransferList: permanentBlock // Jeśli obraził się na amen -> trafia na listę transferową
          };
        }
      });

      return currentClub;
    });

    return { updatedClubs, updatedPlayers: updatedPlayersMap };
  },

  // TUTAJ WSTAW TEN KOD - SYSTEM REKRUTACJI FAIR PLAY
  /**
   * Analizuje wolnych agentów i generuje oferty oczekujące dla klubów AI.
   */
processAiRecruitment: (
    clubs: Club[],
    playersMap: Record<string, Player[]>,
    currentDate: Date,
    userTeamId: string | null
  ): { updatedClubs: Club[], updatedPlayers: Record<string, Player[]>, newOffers: PendingNegotiation[] } => {
    let updatedClubs = [...clubs];
    let updatedPlayersMap = { ...playersMap };
    let freeAgents = [...(updatedPlayersMap['FREE_AGENTS'] || [])];
    let newOffers: PendingNegotiation[] = [];

    if (freeAgents.length === 0) return { updatedClubs, updatedPlayers: updatedPlayersMap, newOffers };

    updatedClubs = updatedClubs.map(club => {
      if (club.id === userTeamId) return club;
      
      // WYKORZYSTANIE SQUAD_NEEDS (Most Rekrutacyjny)
      const needs = club.squadNeeds || {};
      const positionsNeeded = (Object.keys(needs) as (keyof typeof needs)[])
        .filter(pos => needs[pos] > 0);

      // Jeśli klub nie ma zdiagnozowanych potrzeb, nie kupuje nikogo
      if (positionsNeeded.length === 0) return club;

      const targetOvr = 30 + (club.reputation * 4.5);
      
      // Szukanie kandydata dopasowanego do POZYCJI i POZIOMU
      const candidate = freeAgents.find(fa => 
        positionsNeeded.includes(fa.position as any) &&
        fa.overallRating <= targetOvr + 7 && 
        fa.overallRating >= targetOvr - 12 &&
        !newOffers.some(o => o.playerId === fa.id)
      );

      if (candidate && club.budget > 250000) {
        const proposedSalary = FinanceLogic.getFairMarketSalary(candidate.overallRating);
        const proposedBonus = Math.floor(proposedSalary * 0.4);
        
        if (club.signingBonusPool < proposedBonus) return club;

        const responseDays = 3 + Math.floor(Math.random() * 2); 
        const responseDate = new Date(currentDate);
        responseDate.setDate(responseDate.getDate() + responseDays);

        newOffers.push({
          id: `AI_NEG_${club.id}_${candidate.id}_${Date.now()}`,
          playerId: candidate.id,
          clubId: club.id,
          salary: proposedSalary,
          bonus: proposedBonus,
          years: 2,
          responseDate: responseDate.toISOString(),
          status: 'PENDING' as any
        });

        // "Rezerwujemy" slot - zmniejszamy potrzebę, aby AI nie kupiło 5 graczy na tę samą dziurę w jednej klatce
        if (club.squadNeeds) {
          club.squadNeeds[candidate.position as keyof typeof needs]--;
        }
      }
      return club;
    });

    return { updatedClubs, updatedPlayers: updatedPlayersMap, newOffers };
  },

performSeasonSquadReview: (
    clubs: Club[],
    playersMap: Record<string, Player[]>,
    userTeamId: string | null
  ): { updatedClubs: Club[], updatedPlayers: Record<string, Player[]> } => {
    let updatedClubs = [...clubs];
    let updatedPlayersMap = { ...playersMap };

    updatedClubs = updatedClubs.map(club => {
      if (club.id === userTeamId) return club;

      const squad = updatedPlayersMap[club.id] || [];
      if (squad.length === 0) return club;

      const counts = {
        GK: squad.filter(p => p.position === 'GK').length,
        DEF: squad.filter(p => p.position === 'DEF').length,
        MID: squad.filter(p => p.position === 'MID').length,
        FWD: squad.filter(p => p.position === 'FWD').length
      };

      const rankedSquad = [...squad].sort((a, b) => {
        const scoreA = a.overallRating - (a.age - 18) * 1.5;
        const scoreB = b.overallRating - (b.age - 18) * 1.5;
        return scoreA - scoreB;
      });

      const numToRemove = Math.floor(Math.random() * 5);
      let removedCount = 0;
      let finalSquad = [...squad];
      let currentClub = { ...club };

      for (const candidate of rankedSquad) {
        if (removedCount >= numToRemove) break;

        let canRemove = false;
        if (candidate.position === 'GK' && counts.GK > 3) canRemove = true;
        else if (candidate.position === 'DEF' && counts.DEF > 7) canRemove = true;
        else if (candidate.position === 'MID' && counts.MID > 7) canRemove = true;
        else if (candidate.position === 'FWD' && counts.FWD > 4) canRemove = true;

        if (canRemove) {
          const decision = FinanceLogic.evaluateReleaseVsList(candidate);
          
          if (decision === 'RELEASE') {
            const cost = candidate.annualSalary * 0.4;
            if (currentClub.budget >= cost) {
              currentClub.budget -= cost;
              finalSquad = finalSquad.filter(p => p.id !== candidate.id);
              updatedPlayersMap['FREE_AGENTS'] = [...(updatedPlayersMap['FREE_AGENTS'] || []), { ...candidate, clubId: 'FREE_AGENTS', annualSalary: 0 }];
            }
          } else {
            finalSquad = finalSquad.map(p => p.id === candidate.id ? { ...p, isOnTransferList: true } : p);
          }
          
          counts[candidate.position as keyof typeof counts]--;
          removedCount++;
        }
      }

      currentClub.squadNeeds = {
        GK: Math.max(0, 3 - counts.GK),
        DEF: Math.max(0, 7 - counts.DEF),
        MID: Math.max(0, 7 - counts.MID),
        FWD: Math.max(0, 4 - counts.FWD)
      };

      updatedPlayersMap[club.id] = finalSquad;
      return currentClub;
    });

    return { updatedClubs, updatedPlayers: updatedPlayersMap };
  }

};