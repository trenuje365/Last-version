import { Player, MatchEventType } from '../types';

export const PlayerStatsService = {
  applyGoal: (players: Record<string, Player[]>, scorerId: string, assistId?: string): Record<string, Player[]> => {
    const newPlayers = { ...players };

    for (const clubId in newPlayers) {
      newPlayers[clubId] = newPlayers[clubId].map(p => {
        if (p.id === scorerId) {
          return {
            ...p,
            stats: { ...p.stats, goals: p.stats.goals + 1 }
          };
        }
        if (assistId && p.id === assistId) {
          return {
            ...p,
            stats: { ...p.stats, assists: p.stats.assists + 1 }
          };
        }
        return p;
      });
    }

    return newPlayers;
  },

  applyCard: (players: Record<string, Player[]>, playerId: string, type: MatchEventType): Record<string, Player[]> => {
    const newPlayers = { ...players };

    for (const clubId in newPlayers) {
      newPlayers[clubId] = newPlayers[clubId].map(p => {
        if (p.id === playerId) {
          let yellowCards = p.stats.yellowCards;
          let redCards = p.stats.redCards;
          let suspensionMatches = p.suspensionMatches;

          if (type === MatchEventType.YELLOW_CARD) {
            yellowCards += 1;
            if (yellowCards % 4 === 0) {
              suspensionMatches += 1;
            }
          }
          
          if (type === MatchEventType.RED_CARD) {
            redCards += 1;
            suspensionMatches += 2;
          }

          return {
            ...p,
            stats: { ...p.stats, yellowCards, redCards },
            suspensionMatches
          };
        }
        return p;
      });
    }

    return newPlayers;
  },

  /**
   * Wywoływane po zakończeniu meczu dla każdego klubu.
   * Redukuje kary zawieszenia i zwiększa licznik rozegranych meczów oraz minut.
   * Regeneracja odbywa się wyłącznie w RecoveryService.
   */
  processMatchDayEndForClub: (players: Record<string, Player[]>, clubId: string, participatingIds: string[]): Record<string, Player[]> => {
    const newPlayers = { ...players };
    const idSet = new Set(participatingIds);

    if (newPlayers[clubId]) {
      newPlayers[clubId] = newPlayers[clubId].map(p => {
        let updated = { ...p };
        
        // 1. Inkrementacja meczów i minut dla zawodników biorących udział
        if (idSet.has(p.id)) {
           updated.stats = { 
             ...updated.stats, 
             matchesPlayed: updated.stats.matchesPlayed + 1,
             minutesPlayed: updated.stats.minutesPlayed + 90
           };
        }

        // 2. Redukcja zawieszenia
        if (updated.suspensionMatches > 0) {
           updated.suspensionMatches = Math.max(0, updated.suspensionMatches - 1);
        }

        return updated;
      });
    }

    return newPlayers;
  },

  incrementMatchesPlayed: (players: Record<string, Player[]>, playerIds: string[]): Record<string, Player[]> => {
    const newPlayers = { ...players };
    const idSet = new Set(playerIds);

    for (const clubId in newPlayers) {
      newPlayers[clubId] = newPlayers[clubId].map(p => {
        if (idSet.has(p.id)) {
          return {
            ...p,
            stats: { ...p.stats, matchesPlayed: p.stats.matchesPlayed + 1 }
          };
        }
        return p;
      });
    }

    return newPlayers;
  }
};