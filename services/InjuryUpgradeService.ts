
import { MatchContext, MatchLiveState, MatchEvent, MatchEventType, InjurySeverity, Player } from '../types';

export const InjuryUpgradeService = {
  /**
   * Checks all players with LIGHT injuries on the field and potentially upgrades them to SEVERE.
   * Returns a list of generated upgrade events.
   */
  checkUpgrades: (
    ctx: MatchContext, 
    state: MatchLiveState, 
    rng: () => number
  ): MatchEvent[] => {
    const upgradeEvents: MatchEvent[] = [];

    const processTeam = (side: 'HOME' | 'AWAY') => {
      const lineup = side === 'HOME' ? state.homeLineup.startingXI : state.awayLineup.startingXI;
      const injuries = side === 'HOME' ? state.homeInjuries : state.awayInjuries;
      const riskModes = side === 'HOME' ? state.homeRiskMode : state.awayRiskMode;
      const fatigueMap = side === 'HOME' ? state.homeFatigue : state.awayFatigue;
      const injuryMins = side === 'HOME' ? state.homeInjuryMin : state.awayInjuryMin;
      const upgradeProbs = side === 'HOME' ? state.homeUpgradeProb : state.awayUpgradeProb;
      const teamPlayers = side === 'HOME' ? ctx.homePlayers : ctx.awayPlayers;

      lineup.forEach(playerId => {
        // Condition: On field, LIGHT injury, and in Risk Mode
        if (injuries[playerId] === InjurySeverity.LIGHT && riskModes[playerId]) {
          const player = teamPlayers.find(p => p.id === playerId);
          if (!player) return;

          let p = upgradeProbs[playerId] || 0.010;
          const fatigue = fatigueMap[playerId] !== undefined ? fatigueMap[playerId] : 100;
          const staminaNorm = (player.attributes.stamina || 50) / 100;

          // Modifiers
          if (fatigue < 25) p *= 1.9;
          else if (fatigue < 40) p *= 1.5;

          p *= (1.0 - 0.20 * staminaNorm);

          const minsSinceInjury = state.minute - (injuryMins[playerId] || state.minute);
          if (minsSinceInjury < 3) p *= 0.6;
          else if (minsSinceInjury > 15) p *= 1.2;

          // Clamp
          p = Math.max(0.002, Math.min(0.030, p));

          // Roll for upgrade
          if (rng() < p) {
            upgradeEvents.push({
              minute: state.minute,
              teamSide: side,
              type: MatchEventType.INJURY_SEVERE,
              primaryPlayerId: playerId,
              text: `${player.lastName}`
            });
          }
        }
      });
    };

    processTeam('HOME');
    processTeam('AWAY');

    return upgradeEvents;
  },

  /**
   * Calculates the probability for a single player for testing purposes.
   */
  calculateUpgradeProbability: (
    player: Player, 
    fatigue: number, 
    baseProb: number, 
    currentMin: number, 
    injuryMin: number
  ): number => {
    let p = baseProb;
    const staminaNorm = (player.attributes.stamina || 50) / 100;

    if (fatigue < 25) p *= 1.9;
    else if (fatigue < 40) p *= 1.5;

    p *= (1.0 - 0.20 * staminaNorm);

    const minsSinceInjury = currentMin - injuryMin;
    if (minsSinceInjury < 3) p *= 0.6;
    else if (minsSinceInjury > 15) p *= 1.2;

    return Math.max(0.002, Math.min(0.030, p));
  }
};
