
export interface LeagueHistoryEntry {
  seasonLabel: string;
  championId: string;
  championName: string;
  cupWinnerId: string;
  cupWinnerName: string;
}

/**
 * Oficjalna historia rozgrywek ligowych i pucharowych.
 * Przechowuje dane o triumfatorach z ubiegłych lat.
 */
export const LEAGUE_HISTORY: LeagueHistoryEntry[] = [
  {
    seasonLabel: "2024/2025",
    championId: "PL_LECH_POZNAN",
    championName: "Lech Poznań",
    cupWinnerId: "PL_LEGIA_WARSZAWA",
    cupWinnerName: "Legia Warszawa"
  }
];
