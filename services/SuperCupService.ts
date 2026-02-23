
import { Club, Fixture, MatchStatus, CompetitionType } from '../types';

export const SuperCupService = {
  /**
   * Generuje fixture Superpucharu Polski.
   * @param year Rok, w którym rozgrywany jest mecz (lipiec)
   * @param clubs Lista aktualnych klubów
   * @param championId ID mistrza z poprzedniego sezonu (opcjonalne)
   * @param cupWinnerId ID zdobywcy pucharu z poprzedniego sezonu (opcjonalne)
   */
  generateFixture: (year: number, clubs: Club[], championId?: string, cupWinnerId?: string): Fixture => {
    let homeId = "";
    let awayId = "";

    if (year === 2025) {
      // Sezon 1 (Lore): Legia vs Lech (bazując na LeagueHistory)
      homeId = "PL_LEGIA_WARSZAWA";
      awayId = "PL_LECH_POZNAN";
    } else {
      // Pobieramy aktualną tabelę Ekstraklasy jako fallback
      const topClubs = [...clubs]
        .filter(c => c.leagueId === 'L_PL_1')
        .sort((a, b) => b.stats.points - a.stats.points);

      // Logika wyboru: 
      // Home = Mistrz
      // Away = Zdobywca Pucharu (jeśli Mistrz zdobył dublet -> Wicemistrz)
      
      homeId = championId || topClubs[0]?.id || "PL_LEGIA_WARSZAWA";
      
      const potentialAwayId = cupWinnerId || topClubs[1]?.id || "PL_LECH_POZNAN";
      
      // Obsługa Dubletu
      if (homeId === potentialAwayId) {
         // Jeśli Mistrz wygrał też puchar, bierzemy Wicemistrza z tabeli
         awayId = topClubs.find(c => c.id !== homeId)?.id || (homeId === "PL_LEGIA_WARSZAWA" ? "PL_LECH_POZNAN" : "PL_LEGIA_WARSZAWA");
      } else {
         awayId = potentialAwayId;
      }
    }

    return {
      id: `SUPER_CUP_${year}`,
      leagueId: CompetitionType.SUPER_CUP,
      homeTeamId: homeId,
      awayTeamId: awayId,
      date: new Date(year, 6, 12), // Sztywna data: 12 Lipca
      status: MatchStatus.SCHEDULED,
      homeScore: null,
      awayScore: null
    };
  }
};
