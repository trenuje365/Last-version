import { CompetitionType, SlotType } from '../types';

export interface FixedSeasonEvent {
  day: number;
  month: number; // 0-11 (6 = Lipiec, 0 = Styczeń)
  type: SlotType;
  comp: CompetitionType;
  label: string;
  priority: number;
}

/**
 * Pismo Święte kalendarza gry. 
 * Każde zdarzenie ma zdefiniowaną datę, typ slotu oraz priorytet wyświetlania.
 */
export const FIXED_SEASON_EVENTS: FixedSeasonEvent[] = [
  // --- LIPIEC (Przygotowania i Start) ---
  { day: 9,  month: 6, type: SlotType.MIDWEEK, comp: CompetitionType.BREAK, label: "Przygotownia do nowego sezonu", priority: 100 },
  { day: 10, month: 6, type: SlotType.MIDWEEK, comp: CompetitionType.TRANSFER_WINDOW, label: "ZEBRANIE ZARZĄDU KLUBU", priority: 80 },
  { day: 12, month: 6, type: SlotType.WEEKEND, comp: CompetitionType.SUPER_CUP, label: "Mecz o Superpuchar Polski", priority: 95 },
  { day: 14, month: 6, type: SlotType.MIDWEEK, comp: CompetitionType.TRANSFER_WINDOW, label: "Letnie przygotowania (Dzień 1)", priority: 20 },
  { day: 15, month: 6, type: SlotType.MIDWEEK, comp: CompetitionType.TRANSFER_WINDOW, label: "Letnie przygotowania (Dzień 2)", priority: 20 },
  { day: 16, month: 6, type: SlotType.MIDWEEK, comp: CompetitionType.TRANSFER_WINDOW, label: "Letnie przygotowania (Dzień 3)", priority: 20 },
  { day: 17, month: 6, type: SlotType.MIDWEEK, comp: CompetitionType.TRANSFER_WINDOW, label: "Letnie przygotowania (Dzień 4)", priority: 20 },
  { day: 18, month: 6, type: SlotType.MIDWEEK, comp: CompetitionType.TRANSFER_WINDOW, label: "Letnie przygotowania (Dzień 5)", priority: 20 },
  { day: 19, month: 6, type: SlotType.WEEKEND, comp: CompetitionType.LEAGUE, label: "Liga: Kolejka 1", priority: 10 },
  { day: 26, month: 6, type: SlotType.WEEKEND, comp: CompetitionType.LEAGUE, label: "Liga: Kolejka 2", priority: 10 },
  { day: 28, month: 6, type: SlotType.MIDWEEK, comp: CompetitionType.POLISH_CUP, label: "LOSOWANIE PUCHARU POLSKI 1/64", priority: 40 },

  // --- SIERPIEŃ ---
  { day: 2,  month: 7, type: SlotType.WEEKEND, comp: CompetitionType.LEAGUE, label: "Liga: Kolejka 3", priority: 10 },
  { day: 9,  month: 7, type: SlotType.WEEKEND, comp: CompetitionType.LEAGUE, label: "Liga: Kolejka 4", priority: 10 },
  { day: 16, month: 7, type: SlotType.WEEKEND, comp: CompetitionType.POLISH_CUP, label: "Puchar Polski: 1/64", priority: 50 },
  { day: 18, month: 7, type: SlotType.MIDWEEK, comp: CompetitionType.POLISH_CUP, label: "LOSOWANIE PUCHARU POLSKI 1/32", priority: 40 },
  { day: 23, month: 7, type: SlotType.WEEKEND, comp: CompetitionType.LEAGUE, label: "Liga: Kolejka 5", priority: 10 },
  { day: 30, month: 7, type: SlotType.WEEKEND, comp: CompetitionType.LEAGUE, label: "Liga: Kolejka 6", priority: 10 },

  // --- WRZESIEŃ ---
  { day: 4,  month: 8, type: SlotType.MIDWEEK, comp: CompetitionType.BREAK, label: "REPREZENTACJA", priority: 30 },
  { day: 6,  month: 8, type: SlotType.WEEKEND, comp: CompetitionType.LEAGUE, label: "Liga: Kolejka 7", priority: 10 },
  { day: 7,  month: 8, type: SlotType.WEEKEND, comp: CompetitionType.BREAK, label: "REPREZENTACJA", priority: 30 },
  { day: 13, month: 8, type: SlotType.WEEKEND, comp: CompetitionType.LEAGUE, label: "Liga: Kolejka 8", priority: 10 },
  { day: 20, month: 8, type: SlotType.WEEKEND, comp: CompetitionType.POLISH_CUP, label: "Puchar Polski: 1/32", priority: 50 },
  { day: 22, month: 8, type: SlotType.MIDWEEK, comp: CompetitionType.POLISH_CUP, label: "LOSOWANIE PUCHARU POLSKI 1/16", priority: 40 },
  { day: 27, month: 8, type: SlotType.WEEKEND, comp: CompetitionType.LEAGUE, label: "Liga: Kolejka 9. Zamknięcie okna transferowego", priority: 60 },

  // --- PAŹDZIERNIK ---
  { day: 4,  month: 9, type: SlotType.WEEKEND, comp: CompetitionType.LEAGUE, label: "Liga: Kolejka 10", priority: 10 },
  { day: 11, month: 9, type: SlotType.WEEKEND, comp: CompetitionType.LEAGUE, label: "Liga: Kolejka 11", priority: 10 },
  { day: 14, month: 9, type: SlotType.MIDWEEK, comp: CompetitionType.BREAK, label: "REPREZENTACJA", priority: 30 },
  { day: 18, month: 9, type: SlotType.WEEKEND, comp: CompetitionType.POLISH_CUP, label: "Puchar Polski: 1/16", priority: 50 },
  { day: 20, month: 9, type: SlotType.MIDWEEK, comp: CompetitionType.POLISH_CUP, label: "LOSOWANIE PUCHARU POLSKI 1/8", priority: 40 },
  { day: 25, month: 9, type: SlotType.WEEKEND, comp: CompetitionType.LEAGUE, label: "Liga: Kolejka 12", priority: 10 },

  // --- LISTOPAD ---
  { day: 1,  month: 10, type: SlotType.WEEKEND, comp: CompetitionType.LEAGUE, label: "Liga: Kolejka 13", priority: 10 },
  { day: 8,  month: 10, type: SlotType.WEEKEND, comp: CompetitionType.LEAGUE, label: "Liga: Kolejka 14", priority: 10 },
  { day: 14, month: 10, type: SlotType.MIDWEEK, comp: CompetitionType.BREAK, label: "REPREZENTACJA", priority: 30 },
  { day: 15, month: 10, type: SlotType.WEEKEND, comp: CompetitionType.POLISH_CUP, label: "Puchar Polski: 1/8", priority: 50 },
  { day: 17, month: 10, type: SlotType.MIDWEEK, comp: CompetitionType.BREAK, label: "REPREZENTACJA", priority: 30 },
  { day: 21, month: 10, type: SlotType.MIDWEEK, comp: CompetitionType.POLISH_CUP, label: "LOSOWANIE PUCHARU POLSKI 1/4", priority: 40 },
  { day: 22, month: 10, type: SlotType.WEEKEND, comp: CompetitionType.LEAGUE, label: "Liga: Kolejka 15", priority: 10 },
  { day: 29, month: 10, type: SlotType.WEEKEND, comp: CompetitionType.LEAGUE, label: "Liga: Kolejka 16", priority: 10 },

  // --- GRUDZIEŃ ---
  { day: 6,  month: 11, type: SlotType.WEEKEND, comp: CompetitionType.LEAGUE, label: "Liga: Kolejka 17", priority: 10 },
  { day: 7,  month: 11, type: SlotType.MIDWEEK, comp: CompetitionType.BOARD, label: "Zimowa sesja Zarządu", priority: 80 },
  { day: 8,  month: 11, type: SlotType.MIDWEEK, comp: CompetitionType.TRANSFER_WINDOW, label: "Otwarcie zimowego okna transferowego", priority: 60 },
  { day: 15, month: 11, type: SlotType.WEEKEND, comp: CompetitionType.BREAK, label: "Początek Przerwy Zimowej", priority: 100 },

  // --- STYCZEŃ ---
  { day: 15, month: 0, type: SlotType.MIDWEEK, comp: CompetitionType.FRIENDLY, label: "SPARING", priority: 20 },
  { day: 18, month: 0, type: SlotType.WEEKEND, comp: CompetitionType.FRIENDLY, label: "SPARING", priority: 20 },
  { day: 22, month: 0, type: SlotType.MIDWEEK, comp: CompetitionType.FRIENDLY, label: "SPARING", priority: 20 },
  { day: 25, month: 0, type: SlotType.WEEKEND, comp: CompetitionType.FRIENDLY, label: "SPARING", priority: 20 },
  { day: 31, month: 0, type: SlotType.WEEKEND, comp: CompetitionType.LEAGUE, label: "Liga: Kolejka 18", priority: 10 },

  // --- LUTY ---
  { day: 7,  month: 1, type: SlotType.WEEKEND, comp: CompetitionType.LEAGUE, label: "Liga: Kolejka 19", priority: 10 },
  { day: 14, month: 1, type: SlotType.WEEKEND, comp: CompetitionType.LEAGUE, label: "Liga: Kolejka 20", priority: 10 },
  { day: 21, month: 1, type: SlotType.WEEKEND, comp: CompetitionType.LEAGUE, label: "Liga: Kolejka 21", priority: 10 },
  { day: 28, month: 1, type: SlotType.WEEKEND, comp: CompetitionType.LEAGUE, label: "Liga: Kolejka 22", priority: 10 },

  // --- MARZEC ---
  { day: 1,  month: 2, type: SlotType.MIDWEEK, comp: CompetitionType.BOARD, label: "ZEBRANIE ZARZĄDU KLUBU", priority: 80 },
  { day: 7,  month: 2, type: SlotType.WEEKEND, comp: CompetitionType.LEAGUE, label: "Liga: Kolejka 23", priority: 10 },
  { day: 14, month: 2, type: SlotType.WEEKEND, comp: CompetitionType.POLISH_CUP, label: "Puchar Polski: 1/4", priority: 50 },
  { day: 16, month: 2, type: SlotType.MIDWEEK, comp: CompetitionType.POLISH_CUP, label: "LOSOWANIE PUCHARU POLSKI 1/2", priority: 40 },
  { day: 17, month: 2, type: SlotType.MIDWEEK, comp: CompetitionType.BREAK, label: "REPREZENTACJA", priority: 30 },
  { day: 20, month: 2, type: SlotType.MIDWEEK, comp: CompetitionType.BREAK, label: "REPREZENTACJA", priority: 30 },
  { day: 21, month: 2, type: SlotType.WEEKEND, comp: CompetitionType.LEAGUE, label: "Liga: Kolejka 24", priority: 10 },
  { day: 28, month: 2, type: SlotType.WEEKEND, comp: CompetitionType.LEAGUE, label: "Liga: Kolejka 25", priority: 10 },

  // --- KWIECIEŃ ---
  { day: 4,  month: 3, type: SlotType.WEEKEND, comp: CompetitionType.LEAGUE, label: "Liga: Kolejka 26", priority: 10 },
  { day: 11, month: 3, type: SlotType.WEEKEND, comp: CompetitionType.LEAGUE, label: "Liga: Kolejka 27", priority: 10 },
  { day: 18, month: 3, type: SlotType.WEEKEND, comp: CompetitionType.POLISH_CUP, label: "Puchar Polski: 1/2", priority: 55 },
  { day: 19, month: 3, type: SlotType.MIDWEEK, comp: CompetitionType.POLISH_CUP, label: "Ogłoszenie finalistów Pucharu Polski", priority: 70 },
  { day: 25, month: 3, type: SlotType.WEEKEND, comp: CompetitionType.LEAGUE, label: "Liga: Kolejka 28", priority: 10 },

  // --- MAJ ---
  { day: 2,  month: 4, type: SlotType.WEEKEND, comp: CompetitionType.LEAGUE, label: "Liga: Kolejka 29", priority: 10 },
  { day: 9,  month: 4, type: SlotType.WEEKEND, comp: CompetitionType.LEAGUE, label: "Liga: Kolejka 30", priority: 10 },
  { day: 13, month: 4, type: SlotType.MIDWEEK, comp: CompetitionType.LEAGUE, label: "Liga: Kolejka 31", priority: 15 },
  { day: 16, month: 4, type: SlotType.WEEKEND, comp: CompetitionType.LEAGUE, label: "Liga: Kolejka 32", priority: 10 },
  { day: 20, month: 4, type: SlotType.MIDWEEK, comp: CompetitionType.LEAGUE, label: "Liga: Kolejka 33", priority: 15 },
  { day: 23, month: 4, type: SlotType.WEEKEND, comp: CompetitionType.LEAGUE, label: "Liga: Kolejka 34", priority: 90 },
  { day: 30, month: 4, type: SlotType.WEEKEND, comp: CompetitionType.POLISH_CUP, label: "Finał Pucharu Polski", priority: 95 },

  // --- CZERWIEC ---
  { day: 1,  month: 5, type: SlotType.MIDWEEK, comp: CompetitionType.BOARD, label: "ZEBRANIE ZARZĄDU KLUBU", priority: 80 },
  { day: 7,  month: 5, type: SlotType.MIDWEEK, comp: CompetitionType.BREAK, label: "REPREZENTACJA", priority: 30 },
  { day: 10, month: 5, type: SlotType.MIDWEEK, comp: CompetitionType.TRANSFER_WINDOW, label: "PODSUMOWANIE SEZONU", priority: 60 },
  { day: 11, month: 5, type: SlotType.MIDWEEK, comp: CompetitionType.BREAK, label: "REPREZENTACJA", priority: 30 },
  { day: 30, month: 5, type: SlotType.MIDWEEK, comp: CompetitionType.OFF_SEASON, label: "ZAKOŃCZENIE SEZONU/URLOPY", priority: 100 }
];