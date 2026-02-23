
import { Player, PlayerPosition } from '../types';

export const GoalAttributionService = {
  /**
   * Calculates if a shot results in a goal based on GK attributes and defensive pressure.
   * v4.6: Added dedicated penalty logic and removed "ghost defender" bias.
   */
  checkShotSuccess: (attacker: Player, goalkeeper: Player, defenders: Player[], isHeader: boolean, rng: () => number, isPenalty: boolean = false): boolean => {
    
    // TUTAJ WSTAW TEN KOD - Failsafe dla brakujących graczy (np. po czerwonej kartce przed zmianą AI)
    if (!attacker) return false;
    
    // OBLICZANIE KAR ZA PRZEMĘCZENIE (Stage 1 Pro)
    const calculateFatigueImpact = (p: Player) => {
      if (!p) return 1.0; // Jeśli brak gracza (np. pusta bramka), nie ma modyfikatora zmęczenia
      const debt = p.fatigueDebt || 0;
      if (debt > 40) return 0.70; // -30% do statystyk przy ogromnym długu
      if (debt > 20) return 0.85; // -15% do statystyk
      if (debt > 10) return 0.95; // -5% do statystyk
      return 1.0;
    };

    const attMod = calculateFatigueImpact(attacker);
    const gkMod = calculateFatigueImpact(goalkeeper);

    if (isPenalty) {
      const baseProb = 0.94;
      // Minimalny wpływ statystyk (zachowanie 10:1 przewagi strzelca)
     const statInfluence = ((attacker.attributes.finishing * attMod) - (goalkeeper.attributes.goalkeeping * gkMod)) / 400;
      return rng() < Math.max(0.88, Math.min(0.97, baseProb + statInfluence));
    }

    // 2. Standardowa siła ataku
    let attackPower = isHeader ? (attacker.attributes.heading * 1.1) : (attacker.attributes.finishing * 1.05);
    attackPower += attacker.attributes.attacking * 0.35;

    // 3. Siła obrony bramkarza
    let savePower = (goalkeeper.attributes.goalkeeping * 1.2) + (goalkeeper.attributes.positioning * 0.65);
    
    // 4. Presja defensywna
    const topDefenders = defenders
      .sort((a, b) => b.attributes.defending - a.attributes.defending)
      .slice(0, 2);
    
    // POPRAWKA: Usunięcie sztywnej wartości 30 (Duch Obrońcy). 
    // Przy braku obrońców (czyste 1v1) presja wynosi 0.
    const avgDef = topDefenders.length > 0 
      ? topDefenders.reduce((acc, d) => acc + d.attributes.defending, 0) / topDefenders.length
      : 0;
    
    attackPower -= (avgDef * 0.25);

    // Final Calculation: Skalowane prawdopodobieństwo dla strzałów z gry
    // Final Calculation: Skalowane prawdopodobieństwo dla strzałów z gry
    const diff = attackPower - savePower;
    const goalProb = 0.50 + (diff / 300);

    return rng() < Math.max(0.05, Math.min(0.90, goalProb));

  },

  pickScorer: (players: Player[], lineupIds: string[], isCorner: boolean, rng: () => number): Player => {
    const candidates = players.filter(p => lineupIds.includes(p.id));
    
    const weights = candidates.map(p => {
      let w = 0.1; 
      
      switch (p.position) {
        case PlayerPosition.FWD: w = 1.8; break;
        case PlayerPosition.MID: w = 1.0; break;
        case PlayerPosition.DEF: w = 0.4; break;
        case PlayerPosition.GK: w = 0.01; break;
      }

      if (isCorner) {
        w *= (p.attributes.heading / 50) * 1.8;
        if (p.position === PlayerPosition.DEF) w *= 2.2;
      } else {
        w *= Math.pow(p.attributes.finishing / 50, 1.1) * (p.attributes.attacking / 50);
      }

      return Math.max(0.05, w);
    });

    return GoalAttributionService.weightedRandom(candidates, weights, rng);
  },

  pickAssistant: (players: Player[], lineupIds: string[], scorerId: string, isSetPiece: boolean, rng: () => number): Player | null => {
    let assistChance = isSetPiece ? 0.85 : 0.65;
    if (rng() > assistChance) return null;

    const candidates = players.filter(p => lineupIds.includes(p.id) && p.id !== scorerId);
    const weights = candidates.map(p => {
      let w = 0.2; 
      switch (p.position) {
        case PlayerPosition.MID: w = 1.4; break;
        case PlayerPosition.FWD: w = 0.8; break;
        case PlayerPosition.DEF: w = 0.6; break;
        case PlayerPosition.GK: w = 0.1; break;
      }
      w *= (p.attributes.passing / 50) * (p.attributes.vision / 50);
      return Math.max(0.05, w);
    });

    return GoalAttributionService.weightedRandom(candidates, weights, rng);
  },

  weightedRandom: <T>(items: T[], weights: number[], rng: () => number): T => {
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let r = rng() * totalWeight;
    for (let i = 0; i < items.length; i++) {
      if (r < weights[i]) return items[i];
      r -= weights[i];
    }
    return items[items.length - 1];
  }
};
