import { MatchEvent, MatchEventType, MatchContext, MatchLiveState, Player, PlayerPosition, InjurySeverity } from '../types';

export const InjuryEventGenerator = {
  /**
   * Probability-based injury generator triggered by fouls or shots.
   * Deterministic logic based on provided seed/rng.
   * v4.9: Reduced base probabilities by 50% per user request.
   */
  maybeGenerateInjury: (
    ctx: MatchContext, 
    state: MatchLiveState, 
    triggeringEvent: MatchEvent, 
    rng: () => number
  ): MatchEvent | null => {
    
    let pInjury = 0;
    let targetTeamSide: 'HOME' | 'AWAY';
    let targetPool: Player[];
    let targetPlayer: Player | null = null;

    // 1. Base Probabilities (Reduced by 50%: 0.032 -> 0.016 / 0.0064 -> 0.0032)
    if (triggeringEvent.type === MatchEventType.FOUL) {
      pInjury = 0.011;
      // Victim is on the team being fouled (opponent of the fouler)
      targetTeamSide = triggeringEvent.teamSide === 'HOME' ? 'AWAY' : 'HOME';
    } else if (triggeringEvent.type === MatchEventType.SHOT || triggeringEvent.type === MatchEventType.SHOT_ON_TARGET || triggeringEvent.type === MatchEventType.GOAL) {
      pInjury = 0.0008;
      // Victim is on the attacking team (the one that shot)
      targetTeamSide = triggeringEvent.teamSide;
    } else {
      return null;
    }

    targetPool = targetTeamSide === 'HOME' ? ctx.homePlayers : ctx.awayPlayers;
    const activeLineupIds = targetTeamSide === 'HOME' ? state.homeLineup.startingXI : state.awayLineup.startingXI;
    const currentInjuries = targetTeamSide === 'HOME' ? state.homeInjuries : state.awayInjuries;
    const currentFatigue = targetTeamSide === 'HOME' ? state.homeFatigue : state.awayFatigue;

    // Filter to only include healthy players currently on the pitch
    const healthyXI = targetPool.filter(p => activeLineupIds.includes(p.id) && !currentInjuries[p.id]);
    if (healthyXI.length === 0) return null;

    // 2. Selection Logic
    if (triggeringEvent.type === MatchEventType.FOUL) {
      const weights = healthyXI.map(p => {
        let w = 1.0;
        switch (p.position) {
          case PlayerPosition.MID: w = 1.0; break;
          case PlayerPosition.FWD: w = 0.85; break;
          case PlayerPosition.DEF: w = 0.65; break;
          case PlayerPosition.GK: w = 0.10; break;
        }
        return w;
      });

      targetPlayer = InjuryEventGenerator.weightedPick(healthyXI, weights, rng);
    } else {
      // SHOT injury logic
      if (rng() < 0.70 && triggeringEvent.primaryPlayerId && !currentInjuries[triggeringEvent.primaryPlayerId]) {
        // Strzelec (primaryPlayerId) dostaje kontuzję
        targetPlayer = targetPool.find(p => p.id === triggeringEvent.primaryPlayerId) || null;
      } else {
        // Losowy zawodnik z XI drużyny atakującej
        const weights = healthyXI.map(p => {
          let w = 1.0;
          switch (p.position) {
            case PlayerPosition.FWD: w = 1.0; break;
            case PlayerPosition.MID: w = 0.9; break;
            case PlayerPosition.DEF: w = 0.4; break;
            case PlayerPosition.GK: w = 0.05; break;
          }
          return w;
        });
        targetPlayer = InjuryEventGenerator.weightedPick(healthyXI, weights, rng);
      }
    }

    if (!targetPlayer) return null;

    // 3. Modifiers
    const fatigueValue = currentFatigue[targetPlayer.id] !== undefined ? currentFatigue[targetPlayer.id] : 100;
    
    // TUTAJ WSTAW TEN KOD - DEFINICJA I SKALOWANIE
    const staminaNorm = (targetPlayer.attributes.stamina || 50) / 100;
    const debt = targetPlayer.fatigueDebt || 0;
    
    if (debt > 40) pInjury *= 3.5;      
    else if (debt > 20) pInjury *= 2.0; 
    else if (debt > 10) pInjury *= 1.3; 

    if (fatigueValue < 30) pInjury *= 2.0;
    else if (fatigueValue < 50) pInjury *= 1.5;
    const staminaMitigation = 1.0 - (0.25 * staminaNorm);
    pInjury *= staminaMitigation;

    // Final clamp to prevent absurd rates
    pInjury = Math.max(0.0, Math.min(0.20, pInjury));

    // 4. Final Roll
    if (rng() < pInjury) {
      const isSevere = rng() < 0.22;
      const type = isSevere ? MatchEventType.INJURY_SEVERE : MatchEventType.INJURY_LIGHT;
      
      return {
        minute: triggeringEvent.minute,
        teamSide: targetTeamSide,
        type: type,
        primaryPlayerId: targetPlayer.id,
        text: `${targetPlayer.lastName}` // Used for the commentary line
      };
    }

    return null;
  },

  weightedPick: (players: Player[], weights: number[], rng: () => number): Player => {
    const total = weights.reduce((a, b) => a + b, 0);
    let r = rng() * total;
    for (let i = 0; i < players.length; i++) {
      if (r < weights[i]) return players[i];
      r -= weights[i];
    }
    return players[players.length - 1];
  }
};