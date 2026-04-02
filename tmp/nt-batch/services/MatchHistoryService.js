// To jest nasza lokalna "Baza Danych" w pamięci (Runtime Database)
let matchHistory = [];
export const MatchHistoryService = {
    // Funkcja dodająca nowy wpis
    logMatch: (entry) => {
        matchHistory.push(entry);
        console.log(`[MatchHistory] Zapisano mecz: ${entry.homeTeamId} vs ${entry.awayTeamId}`);
    },
    // Funkcja pobierająca całą historię
    getAll: () => [...matchHistory],
    // Funkcja pobierająca mecze konkretnej drużyny
    getTeamHistory: (teamId) => {
        return matchHistory.filter(m => m.homeTeamId === teamId || m.awayTeamId === teamId);
    },
    // Funkcja czyszcząca (np. przy nowej grze)
    clear: () => {
        matchHistory = [];
    }
};
