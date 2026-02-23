import { Player, HealthStatus, TrainingIntensity } from '../types';

export const RecoveryService = {
  /**
   * Wykonuje dobową regenerację dla wszystkich zawodników.
   * daysCount: pozwala na precyzyjne odliczanie czasu.
   */
  applyDailyRecovery: (playersMap: Record<string, Player[]>, currentDate: Date, intensity: TrainingIntensity, daysCount: number = 1): Record<string, Player[]> => {
    const updatedMap = { ...playersMap };

    for (const clubId in updatedMap) {
      updatedMap[clubId] = updatedMap[clubId].map(player => {
        const updated = { ...player };

// TUTAJ WSTAW TEN KOD
        // 1. MODYFIKATORY REGENERACJI (Age & Injury Factor)
        let ageModifier = 1.0;
        if (player.age <= 24) ageModifier = 0.8;       // Młode organizmy (bonus)
        else if (player.age <= 29) ageModifier = 0.6;  // Szczyt formy
        else if (player.age <= 34) ageModifier = 0.17; // Powolny spadek
        else ageModifier = 0.7;                        // Weterani (wolna regeneracja)

        const injuryModifier = player.health.status === HealthStatus.INJURED ? 0.5 : 1.0;

        // 2. SPŁATA DŁUGU PRZEMĘCZENIA (Fatigue Debt Recovery)
        // Bazowa spłata zależy od Siły (99 STR = ~1.1 pkt długu / doba)
        const debtRecoveryBase = 1.5 + (player.attributes.strength * 0.02); 
        const totalDebtRecovered = debtRecoveryBase * ageModifier * injuryModifier * daysCount;
        updated.fatigueDebt = Math.max(0, (updated.fatigueDebt || 0) - totalDebtRecovered);

        // 3. OBLICZANIE REGENERACJI KONDYCJI (Respecting Max Cap)
        // Nowy sufit kondycji:
        const maxConditionCap = 100 - updated.fatigueDebt;
        
        const strengthFactor = player.attributes.strength / 100;
        const staminaFactor = player.attributes.stamina / 100;
        
        let dailyRate = 2.45 + (strengthFactor * 1.5) + (staminaFactor * 1.5);

        // WPŁYW WYBRANEJ INTENSYWNOŚCI (STAGE 1 PRO)
        if (intensity === TrainingIntensity.LIGHT) {
          dailyRate += 0.5; // Bonus za lekki trening (+2% extra)
        } else if (intensity === TrainingIntensity.HEAVY) {
          dailyRate -= 2.0; // Drenaż kondycji przy ciężkim treningu
        }
        
        // Bonus odnowy biologicznej: Dla graczy poniżej 80% kondycji organizm reaguje mocniej
        if (updated.condition < 60) {
          dailyRate *= 0.5;
        }

        // Skalowanie przez liczbę dni (Delta)
        const totalConditionChange = dailyRate * ageModifier * injuryModifier * daysCount;
        updated.condition = Math.max(0, Math.min(maxConditionCap, updated.condition + totalConditionChange* 0.88));

        // 2. BEZWZGLĘDNA REGENERACJA URAZU (Absolute Recovery Logic - STAGE 1 PRO)
        if (updated.health.status === HealthStatus.INJURED && updated.health.injury?.injuryDate) {
          const injuryStart = new Date(updated.health.injury.injuryDate).setHours(0,0,0,0);
          const currentSimDate = new Date(currentDate).setHours(0,0,0,0);
          
          // Obliczamy ile realnie dni minęło od daty wypadku
          const diffMs = currentSimDate - injuryStart;
          const totalDaysPassed = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          
          // Pozostałe dni to pierwotna długość (totalDays) minus upływ czasu
          const actualRemaining = (updated.health.injury.totalDays || updated.health.injury.daysRemaining) - totalDaysPassed;

          if (actualRemaining <= 0) {
            // Czas minął - zawodnik zdrowy
            updated.health = { status: HealthStatus.HEALTHY };
          } else {
            // Aktualizacja licznika wstecznego
            updated.health.injury.daysRemaining = actualRemaining;
          }
        }

        // AUTOMATYCZNE ODBLOKOWYWANIE NEGOCJACJI
        if (updated.negotiationLockoutUntil) {
          const lockoutDate = new Date(updated.negotiationLockoutUntil).setHours(0,0,0,0);
          const currentSimDate = new Date(currentDate).setHours(0,0,0,0);
          
          if (currentSimDate >= lockoutDate) {
            updated.negotiationLockoutUntil = null; // Czas minął, zawodnik jest gotów do rozmów
          }
        }

        return updated;
      });
    }

    return updatedMap;
  }
};