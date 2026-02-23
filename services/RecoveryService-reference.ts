
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

        // 1. OBLICZANIE BAZOWEJ REGENERACJI KONDYCJI (Daily)
        const strengthBonus = player.attributes.strength / 100;
        let dailyRate = (2.0 + strengthBonus);

        // WPŁYW WYBRANEJ INTENSYWNOŚCI (STAGE 1 PRO)
        if (intensity === TrainingIntensity.LIGHT) {
          dailyRate += 2.0; // Bonus za lekki trening (+2% extra)
        } else if (intensity === TrainingIntensity.HEAVY) {
          dailyRate -= 4.0; // Drenaż kondycji przy ciężkim treningu (-2% netto przy bazowym 2%)
        }
        
        // Bonus odnowy biologicznej: Dla graczy poniżej 80% kondycji organizm reaguje mocniej
        // (Wzmacnia zarówno regenerację jak i zmęczenie)
        if (updated.condition < 80) {
          dailyRate *= 1.25;
        }

        // Skalowanie przez liczbę dni (Delta)
        const totalConditionChange = dailyRate * daysCount;
        updated.condition = Math.max(0, Math.min(100, updated.condition + totalConditionChange));

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

        // TUTAJ WSTAW TEN KOD - AUTOMATYCZNE ODBLOKOWYWANIE NEGOCJACJI
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
