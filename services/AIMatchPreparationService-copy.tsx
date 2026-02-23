
import { Club, Player, PlayerPosition, Lineup, HealthStatus, Tactic } from '../types';
import { TacticRepository } from '../resources/tactics_db';
import { LineupService } from './LineupService';

export const AiMatchPreparationService = {

  prepareAllTeams: (
    clubs: Club[], 
    playersMap: Record<string, Player[]>, 
    currentLineups: Record<string, Lineup>,
    userTeamId: string | null
  ): Record<string, Lineup> => {
    
    const updatedLineups: Record<string, Lineup> = { ...currentLineups };

    clubs.forEach(club => {
      // Nie zmieniaj składu gracza tutaj, to dzieje się w GameContext lub przed meczem
      if (club.id === userTeamId) return;

      const squad = playersMap[club.id];
      if (!squad || squad.length === 0) return;
// --- READY POOL FILTER (STAGE 1 PRO) ---
      // AI analizuje tylko tych, którzy mają >= 90% kondycji do wyboru taktyki
      const readySquad = squad.filter(p => p.condition >= 90);
      const analysisSquad = readySquad.length >= 14 ? readySquad : squad.filter(p => p.condition >= 75);

      // 1. Wybierz najlepszą taktykę startową dla tego konkretnego składu
     const bestTacticId = AiMatchPreparationService.determineBestStartingTactic(club, analysisSquad);

      // 2. Pobierz aktualny skład lub stwórz nowy z inteligentnie dobraną taktyką
      let lineup = updatedLineups[club.id];
      if (!lineup) {
        lineup = LineupService.autoPickLineup(club.id, squad, bestTacticId);
      } else if (lineup.tacticId === '4-4-2') { 
        // Jeśli AI utknęło w defaultowym 4-4-2, pozwól mu na re-ewaluację przed meczem
        lineup.tacticId = bestTacticId;
      }

      // 3. Napraw skład (wywal zawieszonych/rannych i wypełnij luki inteligentnie)
      updatedLineups[club.id] = LineupService.repairLineup(lineup, squad);
    });

    return updatedLineups;
  },

  /**
   * Analizuje kadrę i wybiera optymalną formację startową.
   */
  determineBestStartingTactic: (club: Club, players: Player[]): string => {
    const defStr = AiMatchPreparationService.calculateTopLineStrength(players, PlayerPosition.DEF, 5);
    const midStr = AiMatchPreparationService.calculateTopLineStrength(players, PlayerPosition.MID, 5);
    const fwdStr = AiMatchPreparationService.calculateTopLineStrength(players, PlayerPosition.FWD, 3);

    // Outsiderzy (Reputacja < 4) - Preferują defensywę
    if (club.reputation <= 4) {
      if (defStr > fwdStr) return '5-4-1';
      return '4-5-1';
    }

    // Giganci (Reputacja > 8) - Preferują dominację
    if (club.reputation >= 8) {
      if (fwdStr > defStr) return '4-3-3';
      return '4-2-3-1';
    }

    // Specyficzne korelacje siły formacji
    // Bardzo mocny środek pola
    if (midStr > defStr + 3 && midStr > fwdStr + 3) {
      return '3-5-2';
    }

    // Mocny atak, słabsza obrona
    if (fwdStr > defStr + 5) {
      return '4-3-3';
    }

    // Solidna obrona, szukanie kontroli
    if (defStr > fwdStr + 3) {
      return '4-1-4-1';
    }

    // Default dla zrównoważonych zespołów
    return '4-4-2';
  },

  calculateTopLineStrength: (players: Player[], pos: PlayerPosition, topN: number): number => {
    const linePlayers = players
      .filter(p => p.position === pos)
      .sort((a, b) => b.overallRating - a.overallRating)
      .slice(0, topN);

    if (linePlayers.length === 0) return 0;
    const total = linePlayers.reduce((sum, p) => sum + p.overallRating, 0);
    return total / linePlayers.length;
  }
};
