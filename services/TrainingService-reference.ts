import { Player, PlayerAttributes, TrainingCycle, PlayerPosition, MatchSummary, HealthStatus, TrainingIntensity } from '../types';
import { TRAINING_CYCLES } from '../data/training_definitions_pl';
import { PlayerAttributesGenerator } from './PlayerAttributesGenerator';
import { FinanceService } from './FinanceService';

export const TrainingService = {
  /**
   * Główna logika przetwarzająca zmiany atrybutów po każdej kolejce.
   */
 processTrainingEffects: (
    playersMap: Record<string, Player[]>,
    userTeamId: string,
    activeTrainingId: string | null,
    lastMatchSummary: MatchSummary | null,
    clubReputation: number, // DODANO
    leagueTier: number,      // DODANO
     intensity: TrainingIntensity // Dodajemy nową informację o intensywności
  ): Record<string, Player[]> => {
    const updatedMap = { ...playersMap };
    if (!updatedMap[userTeamId]) return updatedMap;

    const cycle = TRAINING_CYCLES.find(c => c.id === activeTrainingId) || TRAINING_CYCLES[0];
    
    updatedMap[userTeamId] = updatedMap[userTeamId].map(player => {
      // FIX: Zawodnicy kontuzjowani nie trenują
      const intensityMultiplier = intensity === TrainingIntensity.HEAVY ? 1.8 : (intensity === TrainingIntensity.LIGHT ? 0.5 : 1.0);
      if (player.health.status === HealthStatus.INJURED) {
        return player;
      }

      let updated = { ...player };
      const stats = { ...updated.stats };
      const seasonalChanges = { ...(stats.seasonalChanges || {}) };
      const attributes = { ...updated.attributes };
      
      const performance = lastMatchSummary?.homePlayers.find(p => p.name === player.lastName) 
        || lastMatchSummary?.awayPlayers.find(p => p.name === player.lastName);

      const playedThisRound = !!performance;
      const rating = performance?.rating || 0;

      // 1. SZANSA NA WZROST (Trening + Gra)
      const attrKeys: (keyof PlayerAttributes)[] = [
        'strength', 'stamina', 'pace', 'defending', 'passing', 'attacking', 
        'finishing', 'technique', 'vision', 'dribbling', 'heading', 'positioning', 'goalkeeping'
      ];

      attrKeys.forEach(key => {
        let pGrowth = 0.02; // Bazowa szansa 2% tygodniowo

        // Wpływ wybranego cyklu
        pGrowth *= intensityMultiplier;
        if (cycle.primaryAttributes.includes(key)) pGrowth += 0.08;
        if (cycle.secondaryAttributes.includes(key)) pGrowth += 0.04;

        // Bonus za wiek (młodzi rosną szybciej)
        if (player.age < 21) pGrowth *= 1.5;
        else if (player.age > 32) pGrowth *= 0.3;

        // Bonus za grę i formę
        if (playedThisRound) {
          pGrowth += 0.02;
          if (rating >= 7.5) pGrowth += 0.05;
          if (rating >= 9.0) pGrowth += 0.10;
        }

        // Bonusy za osiągnięcia w meczu
        if (key === 'finishing' && (performance?.goals || 0) > 0) pGrowth += 0.05;
        if (key === 'goalkeeping' && player.position === PlayerPosition.GK && performance && performance.fatigue > 0 && lastMatchSummary) {
           const teamGoalsAgainst = (player.clubId === lastMatchSummary.homeClub.id) ? lastMatchSummary.awayScore : lastMatchSummary.homeScore;
           if (teamGoalsAgainst === 0) pGrowth += 0.05;
        }

        // FINALNY ROLL NA WZROST
        if (Math.random() < pGrowth) {
          const currentChange = seasonalChanges[key] || 0;
          if (currentChange < 3 && attributes[key] < 99) {
            attributes[key] += 1;
            seasonalChanges[key] = currentChange + 1;
          }
        }

        // 2. SZANSA NA REGRES (Wiek + Brak gry)
        let pRegress = 0.005;
        if (player.age > 33) pRegress += 0.04;
        if (!playedThisRound && player.age > 24) pRegress += 0.02; // Brak gry boli weteranów

        if (Math.random() < pRegress) {
          const currentChange = seasonalChanges[key] || 0;
          if (currentChange > -3 && attributes[key] > 10) {
             attributes[key] -= 1;
             seasonalChanges[key] = currentChange - 1;
          }
        }
      });

      // Aktualizacja OVR po zmianach atrybutów
      const newOvr = PlayerAttributesGenerator.calculateOverall(attributes, player.position);
// Obliczamy nową wartość rynkową na podstawie nowego OVR
      const updatedMarketValue = FinanceService.calculateMarketValue(
        { ...updated, overallRating: newOvr }, 
        clubReputation, // Ten parametr musimy dodać do sygnatury metody
        leagueTier      // Ten parametr musimy dodać do sygnatury metody
      );
      return {
        ...updated,
        attributes,
        overallRating: newOvr,
        stats: { ...stats, seasonalChanges },
        marketValue: updatedMarketValue
        // KONIEC ZAMIANY
      };
    });

    return updatedMap;
  }
};