// Historia zwycięzców konkurencji - SERWIS
export interface ChampionshipEntry {
  season: string;
  competition: 'EKSTRAKLASA' | 'PUCHAR_POLSKI' | 'SUPERPUCHAR_POLSKI' | 'LIGA_MISTRZOW';
  winner: string;
  runnerUp?: string;
  year: number;
}

// Przechowywanie w localStorage
const STORAGE_KEY = 'fm_championship_history';

export class ChampionshipHistoryService {
  private static getHistory(): ChampionshipEntry[] {
    try {
      const stored = localStorage?.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load championship history:', e);
    }
    
    // Dane domyślne
    return [
      {
        season: '2023/2024',
        competition: 'EKSTRAKLASA',
        winner: 'Jagiellonia Białystok',
        runnerUp: 'Śląsk Wrocław',
        year: 2024
      },
      {
        season: '2024/2025',
        competition: 'EKSTRAKLASA',
        winner: 'Lech Poznań',
        runnerUp: 'Raków Częstochowa',
        year: 2025
      },
      {
        season: '2023/2024',
        competition: 'PUCHAR_POLSKI',
        winner: 'Wisła Kraków',
        runnerUp: 'Pogoń Szczecin',
        year: 2024
      },
      {
        season: '2024/2025',
        competition: 'PUCHAR_POLSKI',
        winner: 'Legia Warszawa',
        runnerUp: 'Pogoń Szczecin',
        year: 2025
      },
      {
        season: '2023/2024',
        competition: 'SUPERPUCHAR_POLSKI',
        winner: 'Jagiellonia Białystok',
        runnerUp: 'Wisła Kraków',
        year: 2024
      },
      {
        season: '2024/2025',
        competition: 'SUPERPUCHAR_POLSKI',
        winner: 'Legia Warszawa',
        runnerUp: 'Lech Poznań',
        year: 2025
      },
      {
        season: '2023/2024',
        competition: 'LIGA_MISTRZOW',
        winner: 'Real Madryt',
        runnerUp: 'Borussia Dortmund',
        year: 2024
      },
      {
        season: '2024/2025',
        competition: 'LIGA_MISTRZOW',
        winner: 'Paris Saint-Germain',
        runnerUp: 'Inter Mediolan',
        year: 2025
      }
    ];
  }

  private static saveHistory(history: ChampionshipEntry[]): void {
    try {
      localStorage?.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (e) {
      console.error('Failed to save championship history:', e);
    }
  }

  static getAll(): ChampionshipEntry[] {
    return this.getHistory();
  }

  static getByCompetition(competition: 'EKSTRAKLASA' | 'PUCHAR_POLSKI' | 'SUPERPUCHAR_POLSKI' | 'LIGA_MISTRZOW'): ChampionshipEntry[] {
    return this.getHistory()
      .filter(c => c.competition === competition)
      .sort((a, b) => b.year - a.year);
  }

  static addChampion(entry: ChampionshipEntry): void {
    const history = this.getHistory();
    
    // Sprawdź czy już istnieje wpis na ten sezon i konkurencję
    const existingIndex = history.findIndex(
      h => h.season === entry.season && h.competition === entry.competition
    );
    
    if (existingIndex >= 0) {
      history[existingIndex] = entry;
    } else {
      history.push(entry);
    }
    
    this.saveHistory(history.sort((a, b) => b.year - a.year));
  }

  static addEkstraklasaChampion(season: string, winner: string, runnerUp: string, year: number): void {
    this.addChampion({
      season,
      competition: 'EKSTRAKLASA',
      winner,
      runnerUp,
      year
    });
  }

  static addCupChampion(season: string, competition: 'PUCHAR_POLSKI' | 'SUPERPUCHAR_POLSKI', winner: string, year: number): void {
    this.addChampion({
      season,
      competition,
      winner,
      year
    });
  }

  static addCLChampion(season: string, winner: string, year: number): void {
    this.addChampion({
      season,
      competition: 'LIGA_MISTRZOW',
      winner,
      year
    });
  }

  static clear(): void {
    try {
      localStorage?.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear championship history:', e);
    }
  }
}

// Backward compatibility
export const championshipHistory = ChampionshipHistoryService.getAll();
export const getChampionsByCompetition = (competition: 'EKSTRAKLASA' | 'PUCHAR_POLSKI' | 'SUPERPUCHAR_POLSKI' | 'LIGA_MISTRZOW') => {
  return ChampionshipHistoryService.getByCompetition(competition);
};
export const getAllChampions = () => {
  return ChampionshipHistoryService.getAll();
};
