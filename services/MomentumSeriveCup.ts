
import { MatchContext, MatchLiveState, Player, MatchEventType } from '../types';
import { TacticRepository } from '../resources/tactics_db';

export const MomentumService = {
  /**
   * Zwraca wartość natychmiastowego przesunięcia paska na podstawie typu zdarzenia.
   */
  getEventImpulse: (type: MatchEventType, side: 'HOME' | 'AWAY'): number => {
    const power = side === 'HOME' ? 1 : -1;
    switch (type) {
      case MatchEventType.GOAL: return 45 * power;
      case MatchEventType.SHOT_ON_TARGET: return 15 * power;
      case MatchEventType.SHOT_POST:
      case MatchEventType.SHOT_BAR: return 20 * power;
      case MatchEventType.PRESSURE: return 12 * power;
      case MatchEventType.CORNER: return 8 * power;
      case MatchEventType.BLUNDER: return -25 * power;
      case MatchEventType.STUMBLE:
      case MatchEventType.MISPLACED_PASS: return -10 * power;
      case MatchEventType.RED_CARD: return -40 * power;
      case MatchEventType.YELLOW_CARD: return -5 * power;
      case MatchEventType.GK_LONG_THROW: return 5 * power;
      case MatchEventType.DRIBBLING: return 7 * power;
      case MatchEventType.PENALTY_AWARDED: return 30 * power;
      case MatchEventType.PENALTY_SCORED: return 40 * power;
      case MatchEventType.PENALTY_MISSED: return -35 * power;
      default: return 0;
    }
  },

  /**
   * Computes the "Natural Target" for momentum based on stats and tactics.
   */
   calculateNaturalTarget: (ctx: MatchContext, state: MatchLiveState): number => {
    const isNeutralVenue = ctx.fixture.id.includes("FINAŁ") || ctx.fixture.id.includes("SUPER_CUP");
    let target = (ctx.homeClub.reputation - ctx.awayClub.reputation) * 2;
    
    // Jeśli to NIE jest finał, doliczamy 5 pkt bonusu dla gospodarza
    if (ctx.homeAdvantage && !isNeutralVenue) {
      target += 5;
    }

    const getTeamTechPower = (players: Player[], lineupIds: string[]) => {
      const active = players.filter(p => lineupIds.includes(p.id));
      if (active.length === 0) return 50;
      const sum = active.reduce((acc, p) => acc + ((p.attributes.technique * 0.4) + (p.attributes.passing * 0.4) + (p.attributes.pace * 0.2)), 0);
      return sum / active.length;
    };

    const homePower = getTeamTechPower(ctx.homePlayers, state.homeLineup.startingXI);
    const awayPower = getTeamTechPower(ctx.awayPlayers, state.awayLineup.startingXI);
   const powerRatio = homePower / awayPower;
    target += (Math.pow(powerRatio, 3) - 1) * 50; // Bardzo silna dominacja przy przewadze OVR

const homeHasGK = ctx.homePlayers.find((p: any) => p.id === state.homeLineup.startingXI[0])?.position === 'GK';
    const awayHasGK = ctx.awayPlayers.find((p: any) => p.id === state.awayLineup.startingXI[0])?.position === 'GK';

// Usunięto nieużywane deklaracje stylów. 
    // Logika PRO opiera się teraz na Grawitacji Jakościowej (Power Ratio).

    // ZMIANA PRO: Zastępujemy stałe bonusy "Grawitacją Jakościową"
    // Im większa różnica jakości (powerRatio), tym silniej Momentum chce być po stronie silniejszego.
    const qualityGravity = (Math.pow(powerRatio, 1.8) - 1) * 45;
    target = qualityGravity;

    // "Czynnik ludzki" w przewidywaniu celu - rzut kością na to, jak zespół czuje mecz
    const perceptionRoll = (Math.random() * 20) - 10;
    target += perceptionRoll;

return Math.max(-85, Math.min(85, target));
  },

  /**
   * Dynamiczny silnik Momentum v2.5 - Skokowa reakcja i szum kinetyczny.
   */
  computeMomentum: (ctx: MatchContext, state: MatchLiveState, lastEventType?: MatchEventType, lastEventSide?: 'HOME' | 'AWAY'): number => {
    const naturalTarget = MomentumService.calculateNaturalTarget(ctx, state);
    
    // 1. Natychmiastowy impuls ze zdarzenia
    let impulse = 0;
    if (lastEventType && lastEventSide) {
      impulse = MomentumService.getEventImpulse(lastEventType, lastEventSide);
    }

    // 2. Szum kinetyczny (mikro-drgania paska dla poczucia życia)
    const jitter = (Math.random() - 0.5) * 3;

    // 3. Adaptacja (powrót do naturalnego balansu sił, ale wolniejszy niż impulsy)
    const current = state.momentum + impulse;
    const lerpFactor = 0.08; // Wolniejszy dryf, by skoki były bardziej trwałe
    const nextVal = current + (naturalTarget - current) * lerpFactor + jitter;

    return Math.max(-100, Math.min(100, nextVal));
  }
};
