
import { Referee, Region } from '../types';
import { NameGeneratorService } from './NameGeneratorService';

export const RefereeService = {
  pool: [] as Referee[],

  /**
   * Generates a fixed pool of 50 Polish referees.
   */
  initializePool: () => {
    if (RefereeService.pool.length > 0) return;

    for (let i = 0; i < 150; i++) {
      const names = NameGeneratorService.getRandomName(Region.POLAND);
      RefereeService.pool.push({
        id: `REF_${i}`,
        firstName: names.firstName,
        lastName: names.lastName,
        age: 30 + Math.floor(Math.random() * 25),
        nationality: Region.POLAND,
        strictness: 20 + Math.floor(Math.random() * 70),
        consistency: 30 + Math.floor(Math.random() * 60),
        advantageTendency: 10 + Math.floor(Math.random() * 80),
         experience: 30 + Math.floor(Math.random() * 70), // np. 30-99
        matchRatings: [],
        totalYellowCardsShown: 0,
        totalRedCardsShown: 0
      });
    }
  },

  /**
   * Deterministically assigns a referee based on match criteria.
   */
  assignReferee: (seedStr: string, importance: number): Referee => {
    RefereeService.initializePool();
    
    // Hash-like selection
    let hash = 0;
    for (let i = 0; i < seedStr.length; i++) {
      hash = ((hash << 5) - hash) + seedStr.charCodeAt(i);
      hash |= 0;
    }
    
    // Important matches get better (more consistent) referees
    const eligibleRefs = RefereeService.pool.filter(r => {
      if (importance >= 4) return r.consistency > 70;
      if (importance >= 3) return r.consistency > 50;
      return true;
    });

    const finalPool = eligibleRefs.length > 0 ? eligibleRefs : RefereeService.pool;
    const index = Math.abs(hash) % finalPool.length;
    return finalPool[index];
  },

  /**
   * Losuje ocenę 1-10. Wyższy consistency = szansa na wyższą ocenę.
   */
  generateMatchRating: (referee: Referee): number => {
    const maxRating = Math.min(10, 4 + Math.floor(referee.consistency / 15));
    return Math.floor(1 + Math.random() * maxRating);
  },

  recordMatchStats: (refereeId: string, rating: number, yellowCards: number, redCards: number): void => {
    const ref = RefereeService.pool.find(r => r.id === refereeId);
    if (!ref) return;
    ref.matchRatings.push(rating);
    ref.totalYellowCardsShown += yellowCards;
    ref.totalRedCardsShown += redCards;
  },

  getAverageRating: (referee: Referee): number | null => {
    if (referee.matchRatings.length === 0) return null;
    const sum = referee.matchRatings.reduce((a, b) => a + b, 0);
    return Math.round((sum / referee.matchRatings.length) * 10) / 10;
  },

  applyEndOfSeasonAdjustments: (): void => {
    RefereeService.pool.forEach(ref => {
      if (ref.matchRatings.length <= 5) return;
      const avg = RefereeService.getAverageRating(ref)!;
      const attrs: (keyof Pick<Referee, 'strictness' | 'consistency' | 'advantageTendency'>)[] =
        ['strictness', 'consistency', 'advantageTendency'];

      if (avg < 6) {
        const penalty = Math.floor(Math.random() * 3) + 1;
        attrs.forEach(attr => {
          ref[attr] = Math.max(5, ref[attr] - penalty);
        });
      } else if (avg > 6.5) {
        const bonus = Math.floor(Math.random() * 3) + 1;
        attrs.forEach(attr => {
          ref[attr] = Math.min(99, ref[attr] + bonus);
        });
      }
    });
  },

  resetSeasonStats: (): void => {
    RefereeService.pool.forEach(ref => {
      ref.matchRatings = [];
      ref.totalYellowCardsShown = 0;
      ref.totalRedCardsShown = 0;
    });
  }
};
