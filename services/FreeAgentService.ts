import { Player, PlayerPosition, Region, HealthStatus } from '../types';
import { NameGeneratorService } from './NameGeneratorService';
import { PlayerAttributesGenerator } from './PlayerAttributesGenerator';

export const FreeAgentService = {
  /**
   * Generuje pulę bezrobotnych piłkarzy na start gry.
   * @param count Liczba piłkarzy do stworzenia (rekomendowane: 100)
   */
  generatePool: (count: number): Player[] => {
    const pool: Player[] = [];
    const positions = [PlayerPosition.GK, PlayerPosition.DEF, PlayerPosition.MID, PlayerPosition.FWD];

    for (let i = 0; i < count; i++) {
      // 1. Losowanie regionu: 70% szans na Polskę, 30% na zagranicę
      const isPolish = Math.random() < 0.7;
      const region = isPolish ? Region.POLAND : NameGeneratorService.getRandomForeignRegion();
      const namePair = NameGeneratorService.getRandomName(region);

      // 2. Losowanie pozycji
      const position = positions[Math.floor(Math.random() * positions.length)];

      // 3. Generowanie umiejętności (OVR)
      // Losujemy docelowy Overall z zakresu 10 - 81
      const targetOverall = Math.floor(Math.random() * (81 - 10 + 1)) + 10;
      
  const age = 19 + Math.floor(Math.random() * 18);

      const randomTierBase = Math.floor(Math.random() * 4) + 1;
      const genData = PlayerAttributesGenerator.generateAttributes(position, randomTierBase, 5, age);
      
      const currentOvr = genData.overall || 50;
      const scaleFactor = targetOverall / currentOvr;
      
      const scaledAttributes = { ...genData.attributes };
      (Object.keys(scaledAttributes) as (keyof typeof scaledAttributes)[]).forEach(key => {
        scaledAttributes[key] = Math.max(1, Math.min(99, Math.round(scaledAttributes[key] * scaleFactor)));
      });

      pool.push({
        id: `FREE_AGENT_${Date.now()}_${i}`,
        firstName: namePair.firstName,
        lastName: namePair.lastName,
        age: age,
        fatigueDebt: 0,
        clubId: 'FREE_AGENTS', // Kluczowe: ten identyfikator oznacza brak klubu
        nationality: region,
        position: position,
        overallRating: targetOverall,
        attributes: scaledAttributes,
        stats: { 
          goals: 0, 
          assists: 0, 
          yellowCards: 0, 
          redCards: 0, 
          cleanSheets: 0, 
          matchesPlayed: 0, 
          minutesPlayed: 0,
          ratingHistory: [],
          seasonalChanges: {} 
        },
        health: { status: HealthStatus.HEALTHY },
        condition: 87,
        suspensionMatches: 0,
        // Wolni agenci nie mają pensji dopóki nie podpiszą kontraktu
        annualSalary: 0,
        contractEndDate: "",
        marketValue: 0,
        history: [{
          clubName: "BEZ KLUBU",
          clubId: "FREE_AGENTS",
          fromYear: 2025,
          fromMonth: 7,
          toYear: null,
          toMonth: null
        }],
        boardLockoutUntil: null,
        isUntouchable: false,
        negotiationStep: 0,
        negotiationLockoutUntil: null,
        contractLockoutUntil: null,
        isNegotiationPermanentBlocked: false,
        transferLockoutUntil: null,
        freeAgentLockoutUntil: null
      });
    }
    return pool;
  }
};