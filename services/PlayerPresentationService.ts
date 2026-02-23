
import { Player, PlayerPosition, HealthStatus, InjurySeverity } from '../types';

const POSITION_PRIORITY: Record<PlayerPosition, number> = {
  [PlayerPosition.GK]: 0,
  [PlayerPosition.DEF]: 1,
  [PlayerPosition.MID]: 2,
  [PlayerPosition.FWD]: 3,
};

export const PlayerPresentationService = {
  /**
   * Sorts players by Position (GK, DEF, MID, FWD) -> Overall (Desc) -> Name (Asc).
   */
  sortPlayers: (players: Player[]): Player[] => {
    return [...players].sort((a, b) => {
      if (!a || !b) return 0;
      // 1. Position Priority
      const posDiff = POSITION_PRIORITY[a.position] - POSITION_PRIORITY[b.position];
      if (posDiff !== 0) return posDiff;

      // 2. Overall Rating (Descending)
      const ovrDiff = b.overallRating - a.overallRating;
      if (ovrDiff !== 0) return ovrDiff;

      // 3. Name (Alphabetical)
      const nameA = `${a.lastName} ${a.firstName}`;
      const nameB = `${b.lastName} ${b.firstName}`;
      return nameA.localeCompare(nameB);
    });
  },

  /**
   * Returns the Tailwind text color class for a given position.
   */
  getPositionColorClass: (position: PlayerPosition): string => {
    if (!position) return 'text-slate-400';
    switch (position) {
      case PlayerPosition.GK:
        return 'text-yellow-400';
      case PlayerPosition.DEF:
        return 'text-blue-400';
      case PlayerPosition.MID:
        return 'text-emerald-400';
      case PlayerPosition.FWD:
        return 'text-red-400';
      default:
        return 'text-slate-400';
    }
  },

  /**
   * Returns a badge style class (bg + border + text) for pill/badge displays.
   */
  getPositionBadgeClass: (position: PlayerPosition): string => {
    if (!position) return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    switch (position) {
      case PlayerPosition.GK:
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
      case PlayerPosition.DEF:
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case PlayerPosition.MID:
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case PlayerPosition.FWD:
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  },

  /**
   * Returns health and suspension status display info.
   */
  getHealthDisplay: (player: Player) => {
    if (player.suspensionMatches > 0) {
      return { text: `ZAWIESZONY (${player.suspensionMatches} m.)`, colorClass: 'text-rose-600 font-black' };
    }
   if (player.health.status === HealthStatus.HEALTHY) {
      return { text: '100%', colorClass: 'text-emerald-500 font-bold' };
    }
    
    const days = player.health.injury?.daysRemaining || 0;
    const severity = player.health.injury?.severity;

    // Czerwony tylko dla poważnych kontuzji (blokujących grę)
    if (severity === InjurySeverity.SEVERE) {
      return { text: `KONTUZJA (${days} dni)`, colorClass: 'text-red-500 font-bold' };
    }

    // Pomarańczowy dla lekkich kontuzji, szczególnie gdy zostało mało dni
    const color = days < 5 ? 'text-orange-500' : 'text-amber-500';
    return { text: `URAZ (${days} dni)`, colorClass: `${color} font-bold` };
  },

  /**
   * Returns condition bar color class based on value.
   */
  getConditionColorClass: (condition: number): string => {
    if (condition >= 70) return 'bg-emerald-500';
    if (condition >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  }
};
