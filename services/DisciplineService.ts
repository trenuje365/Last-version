
import { Referee, MatchEventType, Player } from '../types';

export const DisciplineService = {
  /**
   * Evaluates if a foul should result in a card.
   * v4.5: Integrated 30% Chaos weight.
   */
  evaluateFoul: (
    ref: Referee, 
    player: Player, 
    currentYellows: number, 
    rng: () => number
  ): MatchEventType => {
    
    // 1. Referee Multiplier
    const strictnessMult = 0.5 + (ref.strictness / 100); // 0.7x to 1.4x

    // 2. Base Card Probabilities per Foul
    let yellowProb = 0.18 * strictnessMult;
    let redProb = 0.015 * strictnessMult;

    // 3. Modifiers (Chaos & Fatigue)
    // Tired players are more likely to commit clumsy fouls
    if (player.condition < 40) {
      yellowProb *= 1.4;
      redProb *= 1.2;
    }

    // Player mental check (Technique/Defending)
    // Low technique = clumsiness
    if (player.attributes.technique < 40) {
      yellowProb *= 1.3;
    }

    // 4. Second Yellow Mitigation
    // Players with a yellow card are usually 30% more careful
    if (currentYellows === 1) {
      yellowProb *= 0.7;
    }

    // 5. Roll the dice
    const roll = rng();

    if (roll < redProb) {
      return MatchEventType.RED_CARD;
    } 
    
    if (roll < redProb + yellowProb) {
      return MatchEventType.YELLOW_CARD;
    }

    return MatchEventType.FOUL; // Simple foul, no card
  }
};
