
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
   * v2.7: Reputacja minimalna (×0.5), taktyczne ryzyko vs silniejszego rywala, forma drużyny.
   */
  calculateNaturalTarget: (ctx: MatchContext, state: MatchLiveState): number => {
    // Reputacja ma minimalny wpływ — tylko tiebreaker
    let target = (ctx.homeClub.reputation - ctx.awayClub.reputation) * 0.5;
    if (ctx.homeAdvantage) target += 5;

    const getTeamTechPower = (players: Player[], lineupIds: string[]) => {
      const active = players.filter(p => lineupIds.includes(p.id));
      if (active.length === 0) return 50;
      const sum = active.reduce((acc, p) => acc + ((p.attributes.technique * 0.4) + (p.attributes.passing * 0.4) + (p.attributes.pace * 0.2)), 0);
      return sum / active.length;
    };

    const homePower = getTeamTechPower(ctx.homePlayers, state.homeLineup.startingXI);
    const awayPower = getTeamTechPower(ctx.awayPlayers, state.awayLineup.startingXI);
    target += (homePower - awayPower) * 1.2;

    const homeTactic = TacticRepository.getById(state.homeLineup.tacticId);
    const awayTactic = TacticRepository.getById(state.awayLineup.tacticId);
    target += (homeTactic.attackBias - awayTactic.attackBias) * 0.4;

    // --- TAKTYCZNE RYZYKO VS SILNIEJSZY RYWAL ---
    const techGap = homePower - awayPower;
    if (homeTactic.attackBias > 65 && techGap < -8) target += techGap < -15 ? -12 : -6;
    if (homeTactic.defenseBias > 65 && techGap < -8) target += techGap < -15 ? 8 : 4;
    if (awayTactic.attackBias > 65 && techGap > 8)   target += techGap > 15 ? 12 : 6;
    if (awayTactic.defenseBias > 65 && techGap > 8)  target += techGap > 15 ? -8 : -4;

    // --- FORMA DRUŻYNY ---
    // Liczymy serię wygranych/przegranych od ostatniego meczu (koniec tablicy = najnowszy)
    const getFormBonus = (form: ('W' | 'R' | 'P')[]): number => {
      if (!form || form.length === 0) return 0;
      const recent = [...form].reverse(); // najnowszy na początku
      let winStreak = 0;
      let lossStreak = 0;
      for (const result of recent) {
        if (result === 'W') {
          if (lossStreak > 0) break;
          winStreak++;
        } else if (result === 'P') {
          if (winStreak > 0) break;
          lossStreak++;
        } else {
          break; // remis przerywa serię
        }
      }
      if (winStreak > 0) {
        // +1.5 za każdy wygrany, ekstra +2.5 przy 5+ pod rząd, cap +8
        const base = Math.min(winStreak, 4) * 1.5;
        const extra = winStreak >= 5 ? 2.5 : 0;
        return Math.min(base + extra, 8);
      }
      if (lossStreak > 0) {
        // -1.5 za każdą przegraną, przy 5+ -4 extra (trudniej się podnieść), cap -10
        const base = Math.min(lossStreak, 4) * 1.5;
        const extra = lossStreak >= 5 ? 4 : 0;
        return -Math.min(base + extra, 10);
      }
      return 0;
    };

    const homeFormBonus = getFormBonus(ctx.homeClub.stats.form);
    const awayFormBonus = getFormBonus(ctx.awayClub.stats.form);
    // forma HOME przesuwa cel w górę (+), forma AWAY przesuwa w dół (-)
    target += homeFormBonus - awayFormBonus;

    // Przy serii 5+ przegranych — dolna granica naturalTarget spada do -92
    // (drużyna w dołku nie może wrócić do równowagi tylko przez chwilowy impuls)
    const homeDeepSlump = ctx.homeClub.stats.form.slice(-5).every(r => r === 'P');
    const awayDeepSlump = ctx.awayClub.stats.form.slice(-5).every(r => r === 'P');
    const lowerBound = (homeDeepSlump && !awayDeepSlump) ? -92 : (awayDeepSlump && !homeDeepSlump) ? -78 : -85;
    const upperBound = (awayDeepSlump && !homeDeepSlump) ? 92 : (homeDeepSlump && !awayDeepSlump) ? 78 : 85;
    
      // --- FORMA DEFENSYWY ---
      // Wyciągamy obrońców z XI, liczymy średnią ocen z ostatnich 5 meczów
      const getDefAvgRating = (players: Player[], xi: (string | null)[]): number => {
        const defList = players.filter(p => xi.includes(p.id) && p.position === 'DEF');
        if (defList.length === 0) return 6.5;
        const avgRatings = defList.map(p => {
          const recent = p.stats?.ratingHistory?.slice(-5) ?? [];
          return recent.length > 0 ? recent.reduce((a, b) => a + b, 0) / recent.length : 6.5;
        });
        return avgRatings.reduce((a, b) => a + b, 0) / avgRatings.length;
      };

      const homeDefAvg = getDefAvgRating(ctx.homePlayers, state.homeLineup.startingXI);
      const awayDefAvg = getDefAvgRating(ctx.awayPlayers, state.awayLineup.startingXI);

      // Bonus/karę progresywną, małą (max ±4)
      let homeDefBonus = 0;
      if (homeDefAvg >= 7.0) {
        homeDefBonus = Math.min(4, (homeDefAvg - 7.0) * 2);
      } else if (homeDefAvg < 6.4) {
        homeDefBonus = Math.max(-4, (homeDefAvg - 6.4) * 2);
      }
      let awayDefBonus = 0;
      if (awayDefAvg >= 7.0) {
        awayDefBonus = Math.min(4, (awayDefAvg - 7.0) * 2);
      } else if (awayDefAvg < 6.4) {
        awayDefBonus = Math.max(-4, (awayDefAvg - 6.4) * 2);
      }
      // Bonus HOME przesuwa cel w górę (+), bonus AWAY przesuwa w dół (-)
      target += homeDefBonus - awayDefBonus;

    return Math.max(lowerBound, Math.min(upperBound, target));
  },

  /**
   * Dynamiczny silnik Momentum v2.6 - Zmęczenie drużyny wpływa na pasek momentum.
   */
  computeMomentum: (ctx: MatchContext, state: MatchLiveState, lastEventType?: MatchEventType, lastEventSide?: 'HOME' | 'AWAY', homeFatigueMap?: Record<string, number>, awayFatigueMap?: Record<string, number>): number => {
    const naturalTarget = MomentumService.calculateNaturalTarget(ctx, state);
    
    // 1. Natychmiastowy impuls ze zdarzenia
    let impulse = 0;
    if (lastEventType && lastEventSide) {
      impulse = MomentumService.getEventImpulse(lastEventType, lastEventSide);
    }

    // 2. Szum kinetyczny (mikro-drgania paska dla poczucia życia)
    const jitter = (Math.random() - 0.5) * 3;

    // 2b. Losowy "ludzki błąd" / gorszy dzień (~1.5% szans per minutę ≈ 1-2x mecz)
    // Symuluje nagły błąd bramkarza, słaby pass obrońcy, utratę koncentracji
    const humanError = Math.random() < 0.015 ? (Math.random() - 0.5) * 16 : 0;

    // 3. Bonus momentum za zmęczenie rywala
    // Zmęczona drużyna traci inicjatywę → pasek dryfuje w stronę świeższego rywala
    const getAvgFatigue = (lineup: (string | null)[], fatigueMap: Record<string, number>): number => {
      const ids = lineup.filter((id): id is string => id !== null);
      if (ids.length === 0) return 100;
      return ids.reduce((acc, id) => acc + (fatigueMap[id] ?? 100), 0) / ids.length;
    };
    const homeAvg = homeFatigueMap ? getAvgFatigue(state.homeLineup.startingXI, homeFatigueMap) : 100;
    const awayAvg = awayFatigueMap ? getAvgFatigue(state.awayLineup.startingXI, awayFatigueMap) : 100;
    const fatiguePenalty = (avg: number): number => {
      if (avg < 35) return 8;   // czerwony pasek → duży bonus dla rywala
      if (avg < 50) return 5;   // pomarańczowy dolny → wyraźny bonus
      if (avg < 70) return 2;   // pomarańczowy górny → lekki bonus
      return 0;
    };
    // dodatni = HOME dostaje bonus (bo AWAY jest zmęczony), ujemny = AWAY dostaje bonus
    const fatigueBalance = fatiguePenalty(awayAvg) - fatiguePenalty(homeAvg);

    // 4. Adaptacja (powrót do naturalnego balansu sił, ale wolniejszy niż impulsy)
    const current = state.momentum + impulse;
    const lerpFactor = 0.08;
    const nextVal = current + (naturalTarget - current) * lerpFactor + jitter + humanError + fatigueBalance;

    return Math.max(-100, Math.min(100, nextVal));
  }
};
