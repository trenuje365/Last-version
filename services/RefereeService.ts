
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
        advantageTendency: 10 + Math.floor(Math.random() * 80)
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
  }
};
