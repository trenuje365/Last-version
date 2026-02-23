
import { Club, Player, HealthStatus } from '../types';

export interface StatRow {
  player: Player;
  club: Club;
}

export const LeagueStatsService = {

  /**
   * Helper to get all players from valid clubs in a league
   */
  getPlayersForLeague: (
    leagueId: string, 
    clubs: Club[], 
    playersMap: Record<string, Player[]>
  ): StatRow[] => {
    const leagueClubs = clubs.filter(c => c.leagueId === leagueId && c.isDefaultActive);
    const rows: StatRow[] = [];

    leagueClubs.forEach(club => {
      const teamPlayers = playersMap[club.id] || [];
      teamPlayers.forEach(player => {
        rows.push({ player, club });
      });
    });

    return rows;
  },

  /**
   * 1. Top Scorers
   */
  getTopScorers: (rows: StatRow[], limit = 50): StatRow[] => {
    return [...rows]
      .filter(row => row.player.stats.goals > 0)
      .sort((a, b) => {
        if (b.player.stats.goals !== a.player.stats.goals) {
            return b.player.stats.goals - a.player.stats.goals;
        }
        if (b.player.stats.assists !== a.player.stats.assists) {
            return b.player.stats.assists - a.player.stats.assists;
        }
        if (a.player.stats.matchesPlayed !== b.player.stats.matchesPlayed) {
            return a.player.stats.matchesPlayed - b.player.stats.matchesPlayed;
        }
        return a.player.lastName.localeCompare(b.player.lastName);
      })
      .slice(0, limit);
  },

  /**
   * 2. Top Assists
   */
  getTopAssists: (rows: StatRow[], limit = 50): StatRow[] => {
    return [...rows]
      .filter(row => row.player.stats.assists > 0)
      .sort((a, b) => {
        if (b.player.stats.assists !== a.player.stats.assists) {
            return b.player.stats.assists - a.player.stats.assists;
        }
        if (b.player.stats.goals !== a.player.stats.goals) {
            return b.player.stats.goals - a.player.stats.goals;
        }
        return a.player.stats.matchesPlayed - b.player.stats.matchesPlayed;
      })
      .slice(0, limit);
  },

  /**
   * 3. Yellow Cards - Dedicated separate list
   */
  getYellowCardsList: (rows: StatRow[], limit = 50): StatRow[] => {
    return [...rows]
      .filter(row => row.player.stats.yellowCards > 0)
      .sort((a, b) => {
        if (b.player.stats.yellowCards !== a.player.stats.yellowCards) {
          return b.player.stats.yellowCards - a.player.stats.yellowCards;
        }
        // Tie-breaker: mniejsza liczba czerwonych kartek (gracz "czystszy")
        if (a.player.stats.redCards !== b.player.stats.redCards) {
          return a.player.stats.redCards - b.player.stats.redCards;
        }
        return a.player.stats.matchesPlayed - b.player.stats.matchesPlayed;
      })
      .slice(0, limit);
  },

  /**
   * 4. Red Cards - Dedicated separate list
   */
  getRedCardsList: (rows: StatRow[], limit = 50): StatRow[] => {
    return [...rows]
      .filter(row => (row.player.stats.redCards || 0) > 0)
      .sort((a, b) => (b.player.stats.redCards || 0) - (a.player.stats.redCards || 0))
      .slice(0, limit);
  },

  /**
   * 5. Injuries
   */
  getInjuryList: (rows: StatRow[], limit = 50): StatRow[] => {
    return [...rows]
      .filter(row => row.player.health.status === HealthStatus.INJURED)
      .sort((a, b) => {
        const daysA = a.player.health.injury?.daysRemaining || 999;
        const daysB = b.player.health.injury?.daysRemaining || 999;
        return daysA - daysB;
      })
      .slice(0, limit);
  }
};
