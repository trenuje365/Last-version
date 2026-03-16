
import { Player, PlayerPosition } from '../types';

export const GoalAttributionService = {
  /**
   * Calculates if a shot results in a goal based on GK attributes and defensive pressure.
   * v4.6: Added dedicated penalty logic and removed "ghost defender" bias.
   */
  checkShotSuccess: (attacker: Player, goalkeeper: Player, defenders: Player[], isHeader: boolean, rng: () => number, isPenalty: boolean = false, scorerLiveFatigue: number = 100, gkLiveFatigue: number = 100, scorerFitMod: number = 1.0, gkFitMod: number = 1.0, defFatigueMap: Record<string, number> = {}): boolean => {
    
    // Failsafe dla brakujących graczy (np. po czerwonej kartce przed zmianą AI)
    if (!attacker) return false;
    if (!goalkeeper) return rng() < 0.98; // Brak bramkarza = prawie pewny gol

    // PROGRESYWNA KRZYWA ZMĘCZENIA (kwadratowa)
    // Świeży (100) → 1.00 | Pomarańczowy (50%) → 0.863 | Czerwony (25%) → 0.691 | Leżący (0%) → 0.45
    const progressiveMod = (fatigue: number): number => {
      const f = Math.max(0, Math.min(100, fatigue)) / 100;
      return Math.max(0.45, 1.0 - Math.pow(1 - f, 2) * 0.55);
    };
    const attMod = progressiveMod(scorerLiveFatigue) * scorerFitMod;
    const gkMod  = progressiveMod(gkLiveFatigue)    * gkFitMod;

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
    // Zmęczeni obrońcy bronią gorzej (ważone przez progressiveMod)
    const avgDef = topDefenders.length > 0 
      ? topDefenders.reduce((acc, d) => {
          const defFatigue = defFatigueMap[d.id] ?? 100;
          return acc + d.attributes.defending * progressiveMod(defFatigue);
        }, 0) / topDefenders.length
      : 0;

    // Krok 6: Dribbling redukuje presję defensywną (zakres PL: 45-77)
    // dribbling 45 → mod 0.865 | dribbling 65 → mod 0.805 | dribbling 77 → mod 0.769
    const dribblingMod = 1.0 - (attacker.attributes.dribbling / 100) * 0.30;
    attackPower -= (avgDef * 0.25 * dribblingMod);

    // Final Calculation: Skalowane prawdopodobieństwo dla strzałów z gry
    // Final Calculation: Skalowane prawdopodobieństwo dla strzałów z gry
    const diff = attackPower - savePower;
    const goalProb = 0.50 + (diff / 300);

    return rng() < Math.max(0.05, Math.min(0.90, goalProb));

  },

  pickScorer: (players: Player[], lineupIds: string[], isCorner: boolean, rng: () => number): Player | null => {
    const candidates = players.filter(p => lineupIds.includes(p.id));
    if (candidates.length === 0) return null;
    
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
        w *= Math.pow(p.attributes.finishing / 50, 1.1)   // dominujący - kto wykończy
           * Math.pow(p.attributes.attacking  / 50, 0.8)  // ogólna ofensywność
           * Math.pow(p.attributes.pace       / 50, 0.5)  // dotarcie na pozycję strzelecką
           * Math.pow(p.attributes.technique  / 50, 0.4); // jakość techniczna strzału
      }

      // FORMA MECZOWA: średnia ocen z ostatnich 5 meczów
      // Bonus/kara progresywna, mała — nie przebija wagi pozycji ani atrybutów
      const recentRatings = p.stats?.ratingHistory?.slice(-5) ?? [];
      const avgRating = recentRatings.length > 0
        ? recentRatings.reduce((a: number, b: number) => a + b, 0) / recentRatings.length
        : 6.5; // brak historii → neutralna wartość
      let formMod = 1.0;
      if (avgRating >= 7.0) {
        // 7.0→×1.00 | 7.5→×1.04 | 8.0→×1.08 | 8.5→×1.12 | max ×1.15
        formMod = 1.0 + Math.min(0.15, (avgRating - 7.0) * 0.08);
      } else if (avgRating < 6.5) {
        // 6.5→×1.00 | 6.0→×0.95 | 5.5→×0.90 | 5.0→×0.85 (min)
        formMod = 1.0 - Math.min(0.15, (6.5 - avgRating) * 0.10);
      }
      w *= formMod;

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
