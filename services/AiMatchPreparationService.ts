
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
      // --- STAGE 1 PRO: FRESHNESS POOL ---
      const AI_FRESH_THRESHOLD = 87;
      const readySquad = squad.filter(p => p.condition >= AI_FRESH_THRESHOLD);
      const analysisSquad = readySquad.length >= 14 ? readySquad : squad.filter(p => p.condition >= 75);

      // 1. Wybierz najlepszą taktykę startową na podstawie dostępnych zdrowych graczy
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
   * Analizuje kadrę i wybiera formację, w której ma najwięcej zdrowych/świeżych opcji.
   */
determineBestStartingTactic: (club: Club, players: Player[]): string => {
    const freshPlayers = players.filter(p => p.condition >= 87);
    const tactics = TacticRepository.getAll();
    let bestTacticId = '4-4-2';
    let maxScore = -9999;

    tactics.forEach(tactic => {
      let score = 0;
      const tempUsedIds = new Set<string>();
      
      tactic.slots.forEach(slot => {
        // Szukaj najlepszego dopasowania OVR na tę pozycję wśród świeżych
        const match = freshPlayers
          .filter(p => p.position === slot.role && !tempUsedIds.has(p.id))
          .sort((a, b) => b.overallRating - a.overallRating)[0];
        
        if (match) {
          score += match.overallRating;
          tempUsedIds.add(match.id);
        } else {
          score -= 50; // Kara za brak naturalnego gracza na pozycję
        }
      });
      
      if (score > maxScore) {
        maxScore = score;
        bestTacticId = tactic.id;
      }
    });

    return bestTacticId;
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
