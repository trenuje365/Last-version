import { CompetitionType, SlotType } from '../types';
/**
 * Pismo Święte kalendarza gry.
 * Każde zdarzenie ma zdefiniowaną datę, typ slotu oraz priorytet wyświetlania.
 */
export const FIXED_SEASON_EVENTS = [
    // --- LIPIEC (Przygotowania i Start) ------------------------------------------------------------------------------------------------------------
    { day: 1, month: 6, type: SlotType.MIDWEEK, comp: CompetitionType.BREAK, label: "Przygotowania do nowego sezonu", priority: 100 },
    { day: 2, month: 6, type: SlotType.MIDWEEK, comp: CompetitionType.EL_R1Q_DRAW, label: "LOSOWANIE LE: RUNDA 1 PREELIMINACYJNA", priority: 88 },
    //LIGA MISTRZOW - losowanie 1 rundy preeliminacyjnej 
    { day: 3, month: 6, type: SlotType.MIDWEEK, comp: CompetitionType.CHAMPIONS_LEAGUE_DRAW, label: "LOSOWANIE LM: RUNDA 1 PREELIMINACYJNA", priority: 90 },
    { day: 4, month: 6, type: SlotType.MIDWEEK, comp: CompetitionType.BOARD, label: "ZEBRANIE ZARZĄDU KLUBU", priority: 80 },
    { day: 5, month: 6, type: SlotType.MIDWEEK, comp: CompetitionType.EL_R1Q, label: "LE: R1Q - 1. mecz", priority: 82 },
    { day: 9, month: 6, type: SlotType.MIDWEEK, comp: CompetitionType.TRANSFER_WINDOW, label: "Otwarcie letniego okna transferowego", priority: 60 },
    { day: 10, month: 6, type: SlotType.MIDWEEK, comp: CompetitionType.EL_R1Q_RETURN, label: "LE: R1Q - Rewanż", priority: 82 },
    // LIGA MISTRZOW 1 mecz 1 rudna 
    { day: 11, month: 6, type: SlotType.MIDWEEK, comp: CompetitionType.CL_R1Q, label: "LM: R1Q - 1. mecz", priority: 85 },
    //SUPERPUCHAR POLSKI ///
    { day: 12, month: 6, type: SlotType.WEEKEND, comp: CompetitionType.SUPER_CUP, label: "Mecz o Superpuchar Polski", priority: 95 },
    //LOSOWANIE PUCHARU POLSKI 1/64
    { day: 13, month: 6, type: SlotType.MIDWEEK, comp: CompetitionType.POLISH_CUP, label: "LOSOWANIE PUCHARU POLSKI 1/64", priority: 40 },
    { day: 14, month: 6, type: SlotType.MIDWEEK, comp: CompetitionType.TRANSFER_WINDOW, label: "Letnie przygotowania (Dzień 1)", priority: 20 },
    //Liga mistrzow rewanż 1 rundy 
    { day: 15, month: 6, type: SlotType.MIDWEEK, comp: CompetitionType.CL_R1Q_RETURN, label: "LM: R1Q - Rewanż", priority: 85 },
    ///LOSOWANIE LIGI MISTRZOW 2 RUNDY PREELIMINACYJNEJ
    { day: 16, month: 6, type: SlotType.MIDWEEK, comp: CompetitionType.CL_R2Q_DRAW, label: "LOSOWANIE LM: RUNDA 2 PREELIMINACYJNA", priority: 90 },
    { day: 17, month: 6, type: SlotType.MIDWEEK, comp: CompetitionType.TRANSFER_WINDOW, label: "Letnie przygotowania (Dzień 4)", priority: 20 },
    { day: 18, month: 6, type: SlotType.MIDWEEK, comp: CompetitionType.TRANSFER_WINDOW, label: "Letnie przygotowania (Dzień 5)", priority: 20 },
    // LOSOWANIE LIGI EUROPY 2 RUNDY PREELIMINACYJNEJ
    { day: 19, month: 6, type: SlotType.MIDWEEK, comp: CompetitionType.EL_R2Q_DRAW, label: "LOSOWANIE LE: RUNDA 2 PREELIMINACYJNA", priority: 88 },
    //MECZE 1/64 PUCHARU POLSKI ///
    { day: 20, month: 6, type: SlotType.WEEKEND, comp: CompetitionType.POLISH_CUP, label: "Puchar Polski: 1/64", priority: 50 },
    { day: 24, month: 6, type: SlotType.WEEKEND, comp: CompetitionType.LEAGUE, label: "Liga: Kolejka 1", priority: 10 },
    /// -- LIGA MISTRZOW 2 runda preeliminacyjna 1 mecz
    { day: 27, month: 6, type: SlotType.MIDWEEK, comp: CompetitionType.CL_R2Q, label: "LM: R2Q - 1. mecz", priority: 85 },
    { day: 30, month: 6, type: SlotType.WEEKEND, comp: CompetitionType.LEAGUE, label: "Liga: Kolejka 2", priority: 10 },
    // --- SIERPIEŃ --------------------------------------------------------------------------------------------------------------------------
    { day: 5, month: 7, type: SlotType.WEEKEND, comp: CompetitionType.LEAGUE, label: "Liga: Kolejka 3", priority: 10 },
    // LE 2 runda kwalifikacyjna 1 mecz
    { day: 8, month: 7, type: SlotType.MIDWEEK, comp: CompetitionType.EL_R2Q, label: "LE: R2Q - 1. mecz", priority: 82 },
    { day: 11, month: 7, type: SlotType.WEEKEND, comp: CompetitionType.LEAGUE, label: "Liga: Kolejka 4", priority: 10 },
    ///LOSOWANIE PP 1/32
    { day: 12, month: 7, type: SlotType.MIDWEEK, comp: CompetitionType.POLISH_CUP, label: "LOSOWANIE PUCHARU POLSKI 1/32", priority: 40 },
    //-- LIGA MISTRZOW 2 RUNDA REWANZ 
    { day: 14, month: 7, type: SlotType.MIDWEEK, comp: CompetitionType.CL_R2Q_RETURN, label: "LM: R2Q - Rewanż", priority: 85 },
    // -- LIGA EUROPY 2 RUNDA REWANZ
    { day: 15, month: 7, type: SlotType.MIDWEEK, comp: CompetitionType.EL_R2Q_RETURN, label: "LE: R2Q - Rewanż", priority: 82 },
    // LOSOWANIE FAZ GRUPOWYCH PUCHAROW EUROPEJSKICH LIGA EUROPY
    { day: 17, month: 7, type: SlotType.MIDWEEK, comp: CompetitionType.EL_GROUP_DRAW, label: "LOSOWANIE LE: FAZA GRUPOWA", priority: 88 },
    // LOSOWANIE FAZ GRUPOWYCH PUCHAROW EUROPEJSKICH LIGA MISTRZÓW
    { day: 18, month: 7, type: SlotType.MIDWEEK, comp: CompetitionType.CL_GROUP_DRAW, label: "LOSOWANIE LM: FAZA GRUPOWA", priority: 90 },
    { day: 20, month: 7, type: SlotType.WEEKEND, comp: CompetitionType.LEAGUE, label: "Liga: Kolejka 5", priority: 10 },
    { day: 25, month: 7, type: SlotType.WEEKEND, comp: CompetitionType.LEAGUE, label: "Liga: Kolejka 6", priority: 10 },
    { day: 30, month: 7, type: SlotType.WEEKEND, comp: CompetitionType.LEAGUE, label: "Liga: Kolejka 7", priority: 10 },
    // --- WRZESIEŃ -----------------------------------------------------------------------------------------------------------------------
    // --- REPREZENTAcjA ---
    { day: 4, month: 8, type: SlotType.MIDWEEK, comp: CompetitionType.BREAK, label: "REPREZENTACJA", priority: 30 },
    { day: 7, month: 8, type: SlotType.WEEKEND, comp: CompetitionType.BREAK, label: "REPREZENTACJA", priority: 30 },
    { day: 10, month: 8, type: SlotType.WEEKEND, comp: CompetitionType.LEAGUE, label: "Liga: Kolejka 8", priority: 10 },
    { day: 14, month: 8, type: SlotType.WEEKEND, comp: CompetitionType.POLISH_CUP, label: "Puchar Polski: 1/32", priority: 50 },
    { day: 15, month: 8, type: SlotType.MIDWEEK, comp: CompetitionType.POLISH_CUP, label: "LOSOWANIE PUCHARU POLSKI 1/16", priority: 40 },
    // --- PUCHARY EUROPEJSKIE --- 18 września LIGA MISTRZÓW---- faza grupowa 1 kolejka
    { day: 18, month: 8, type: SlotType.MIDWEEK, comp: CompetitionType.CL_GROUP_STAGE, label: "LM: Faza Grupowa - Kolejka 1", priority: 85 },
    // --- PUCHARY EUROPEJSKIE --- 19 września LIGA EUROPY ---- faza grupowa 1 kolejka
    { day: 19, month: 8, type: SlotType.MIDWEEK, comp: CompetitionType.EL_GROUP_STAGE, label: "LE: Faza Grupowa - Kolejka 1", priority: 82 },
    // --- PUCHARY EUROPEJSKIE --- 20 września LIGA KONFERENCJI ---- faza grupowa
    { day: 22, month: 8, type: SlotType.WEEKEND, comp: CompetitionType.LEAGUE, label: "Liga: Kolejka 9", priority: 10 },
    { day: 26, month: 8, type: SlotType.WEEKEND, comp: CompetitionType.LEAGUE, label: "Liga: Kolejka 10", priority: 10 },
    { day: 30, month: 8, type: SlotType.WEEKEND, comp: CompetitionType.LEAGUE, label: "Liga: Kolejka 11", priority: 10 },
    // --- PAŹDZIERNIK -------------------------------------------------------------------------------------------------------------------
    { day: 1, month: 9, type: SlotType.WEEKEND, comp: CompetitionType.TRANSFER_WINDOW, label: "Zamknięcie okna transferowego", priority: 60 },
    { day: 3, month: 9, type: SlotType.WEEKEND, comp: CompetitionType.POLISH_CUP, label: "Puchar Polski: 1/16", priority: 50 },
    { day: 5, month: 9, type: SlotType.MIDWEEK, comp: CompetitionType.POLISH_CUP, label: "LOSOWANIE PUCHARU POLSKI 1/8", priority: 40 },
    { day: 6, month: 9, type: SlotType.WEEKEND, comp: CompetitionType.LEAGUE, label: "Liga: Kolejka 12", priority: 10 },
    // --- REPREZENTAcjA ---
    { day: 11, month: 9, type: SlotType.MIDWEEK, comp: CompetitionType.BREAK, label: "REPREZENTACJA", priority: 30 },
    { day: 14, month: 9, type: SlotType.WEEKEND, comp: CompetitionType.LEAGUE, label: "Liga: Kolejka 13", priority: 10 },
    // --- PUCHARY EUROPEJSKIE --- 17 pazdziernika LIGA MISTRZÓW----faza grupowa 2 kolejka 
    { day: 17, month: 9, type: SlotType.MIDWEEK, comp: CompetitionType.CL_GROUP_STAGE, label: "LM: Faza Grupowa - Kolejka 2", priority: 85 },
    { day: 21, month: 9, type: SlotType.WEEKEND, comp: CompetitionType.LEAGUE, label: "Liga: Kolejka 14", priority: 10 },
    // --- PUCHARY EUROPEJSKIE --- 18 pazdziernika LIGA EUROPY ----faza grupowa 2 kolejka
    { day: 18, month: 9, type: SlotType.MIDWEEK, comp: CompetitionType.EL_GROUP_STAGE, label: "LE: Faza Grupowa - Kolejka 2", priority: 82 },
    // --- PUCHARY EUROPEJSKIE --- 25 pazdziernika LIGA MISTRZÓW----faza grupowa 3 kolejka
    { day: 25, month: 9, type: SlotType.MIDWEEK, comp: CompetitionType.CL_GROUP_STAGE, label: "LM: Faza Grupowa - Kolejka 3", priority: 85 },
    // --- PUCHARY EUROPEJSKIE --- 26 pazdziernika LIGA EUROPY ----faza grupowa 3 kolejka
    { day: 26, month: 9, type: SlotType.MIDWEEK, comp: CompetitionType.EL_GROUP_STAGE, label: "LE: Faza Grupowa - Kolejka 3", priority: 82 },
    // --- PUCHARY EUROPEJSKIE --- 27 pazdziernika LIGA KONFERENCJI ----faza grupowa 3 runda
    { day: 30, month: 9, type: SlotType.WEEKEND, comp: CompetitionType.LEAGUE, label: "Liga: Kolejka 15", priority: 10 },
    // --- LISTOPAD ------------------------------------------------------------------------------------------------------------
    { day: 3, month: 10, type: SlotType.WEEKEND, comp: CompetitionType.POLISH_CUP, label: "Puchar Polski: 1/8", priority: 50 },
    // --- REPREZENTAcjA ---
    { day: 14, month: 10, type: SlotType.MIDWEEK, comp: CompetitionType.BREAK, label: "REPREZENTACJA", priority: 30 },
    { day: 17, month: 10, type: SlotType.MIDWEEK, comp: CompetitionType.BREAK, label: "REPREZENTACJA", priority: 30 },
    { day: 19, month: 10, type: SlotType.MIDWEEK, comp: CompetitionType.POLISH_CUP, label: "LOSOWANIE PUCHARU POLSKI 1/4", priority: 40 },
    { day: 21, month: 10, type: SlotType.WEEKEND, comp: CompetitionType.LEAGUE, label: "Liga: Kolejka 16", priority: 10 },
    // --- PUCHARY EUROPEJSKIE --- 25 listopad LIGA MISTRZÓW----faza grupowa 4 kolejka
    { day: 25, month: 10, type: SlotType.MIDWEEK, comp: CompetitionType.CL_GROUP_STAGE, label: "LM: Faza Grupowa - Kolejka 4", priority: 85 },
    // --- PUCHARY EUROPEJSKIE --- 26 listopad LIGA EUROPY ----faza grupowa 4 kolejka
    { day: 26, month: 10, type: SlotType.MIDWEEK, comp: CompetitionType.EL_GROUP_STAGE, label: "LE: Faza Grupowa - Kolejka 4", priority: 82 },
    // --- PUCHARY EUROPEJSKIE --- 27 listopad LIGA KONFERENCJI ----faza grupowa 4 runda
    // --- GRUDZIEŃ ----------------------------------------------------------------------------------------------------------------------------
    { day: 1, month: 11, type: SlotType.WEEKEND, comp: CompetitionType.LEAGUE, label: "Liga: Kolejka 17", priority: 10 },
    // --- PUCHARY EUROPEJSKIE --- 4 grudnia LIGA MISTRZÓW----faza grupowa 5 kolejka
    { day: 4, month: 11, type: SlotType.MIDWEEK, comp: CompetitionType.CL_GROUP_STAGE, label: "LM: Faza Grupowa - Kolejka 5", priority: 85 },
    // --- PUCHARY EUROPEJSKIE --- 5 grudnia LIGA EUROPY ----faza grupowa 5 kolejka
    { day: 5, month: 11, type: SlotType.MIDWEEK, comp: CompetitionType.EL_GROUP_STAGE, label: "LE: Faza Grupowa - Kolejka 5", priority: 82 },
    // --- PUCHARY EUROPEJSKIE --- 6 grudnia LIGA KONFERENCJI ----faza grupowa 5 runda
    { day: 10, month: 11, type: SlotType.WEEKEND, comp: CompetitionType.LEAGUE, label: "Liga: Kolejka 18", priority: 10 },
    // --- PUCHARY EUROPEJSKIE --- 14 grudnia LIGA MISTRZÓW----faza grupowa 6 kolejka
    { day: 14, month: 11, type: SlotType.MIDWEEK, comp: CompetitionType.CL_GROUP_STAGE, label: "LM: Faza Grupowa - Kolejka 6", priority: 85 },
    // --- PUCHARY EUROPEJSKIE --- 15 grudnia LIGA EUROPY ----faza grupowa 6 kolejka
    { day: 15, month: 11, type: SlotType.MIDWEEK, comp: CompetitionType.EL_GROUP_STAGE, label: "LE: Faza Grupowa - Kolejka 6", priority: 82 },
    // --- PUCHARY EUROPEJSKIE --- 16 grudnia LIGA KONFERENCJI ----faza grupowa 6 runda
    { day: 17, month: 11, type: SlotType.MIDWEEK, comp: CompetitionType.BOARD, label: "Zimowa sesja Zarządu", priority: 80 },
    { day: 18, month: 11, type: SlotType.WEEKEND, comp: CompetitionType.BREAK, label: "Początek Przerwy Zimowej", priority: 100 },
    { day: 19, month: 11, type: SlotType.MIDWEEK, comp: CompetitionType.CL_R16_DRAW, label: "LOSOWANIE LM: 1/8 FINAŁU", priority: 90 },
    { day: 20, month: 11, type: SlotType.MIDWEEK, comp: CompetitionType.EL_R16_DRAW, label: "LOSOWANIE LE: 1/8 FINAŁU", priority: 88 },
    // --- STYCZEŃ ---------------------------------------------------------------------------------------------------------------------------------------
    { day: 7, month: 0, type: SlotType.MIDWEEK, comp: CompetitionType.FRIENDLY, label: "SPARING", priority: 20 },
    { day: 9, month: 0, type: SlotType.WEEKEND, comp: CompetitionType.FRIENDLY, label: "SPARING", priority: 20 },
    { day: 11, month: 0, type: SlotType.WEEKEND, comp: CompetitionType.FRIENDLY, label: "SPARING", priority: 20 },
    { day: 14, month: 0, type: SlotType.WEEKEND, comp: CompetitionType.FRIENDLY, label: "SPARING", priority: 20 },
    // --- PUCHARY EUROPEJSKIE --- 19 styczen LIGA MISTRZÓW----1/8 finału
    { day: 19, month: 0, type: SlotType.MIDWEEK, comp: CompetitionType.CL_R16, label: "LM: 1/8 Finału - 1. mecz", priority: 85 },
    { day: 20, month: 0, type: SlotType.MIDWEEK, comp: CompetitionType.EL_R16, label: "LE: 1/8 Finału - 1. mecz", priority: 82 },
    // --- PUCHARY EUROPEJSKIE --- 21 styczen LIGA KONFERENCJI ----1/8 finału DO ZAIMPLEMENTOWANIA
    { day: 23, month: 0, type: SlotType.MIDWEEK, comp: CompetitionType.FRIENDLY, label: "SPARING", priority: 20 },
    { day: 24, month: 0, type: SlotType.MIDWEEK, comp: CompetitionType.TRANSFER_WINDOW, label: "Otwarcie zimowego okna transferowego", priority: 60 },
    // --- PUCHARY EUROPEJSKIE --- 25 styczen LIGA MISTRZÓW----1.8 finału REWANZ
    { day: 25, month: 0, type: SlotType.MIDWEEK, comp: CompetitionType.CL_R16_RETURN, label: "LM: 1/8 Finału - Rewanż", priority: 85 },
    { day: 26, month: 0, type: SlotType.MIDWEEK, comp: CompetitionType.EL_R16_RETURN, label: "LE: 1/8 Finału - Rewanż", priority: 82 },
    // --- PUCHARY EUROPEJSKIE --- 27 styczen LIGA KONFERENCJI ----1.8 finału/rewanże DO ZAIMPLEMNTOWANIA
    // ---- 27 styczeń LOSOWANIE 1/4 FINAŁU LIGI MISTRZÓW 
    { day: 27, month: 0, type: SlotType.MIDWEEK, comp: CompetitionType.CL_QF_DRAW, label: "LOSOWANIE LM: 1/4 FINAŁU", priority: 90 },
    // ---- 28 styczeń LOSOWANIE 1/4 FINAŁU LIGI EUROPY
    { day: 28, month: 0, type: SlotType.MIDWEEK, comp: CompetitionType.EL_QF_DRAW, label: "LOSOWANIE LE: 1/4 FINAŁU", priority: 88 },
    { day: 31, month: 0, type: SlotType.WEEKEND, comp: CompetitionType.LEAGUE, label: "Liga: Kolejka 19", priority: 10 },
    // --- LUTY ------------------------------------------------------------------------------------------------------------------------------------------
    { day: 7, month: 1, type: SlotType.WEEKEND, comp: CompetitionType.LEAGUE, label: "Liga: Kolejka 20", priority: 10 },
    { day: 12, month: 1, type: SlotType.WEEKEND, comp: CompetitionType.LEAGUE, label: "Liga: Kolejka 21", priority: 10 },
    // --- PUCHARY EUROPEJSKIE --- 16 LUTY LIGA MISTRZÓW----cwierfinaly 1/4
    { day: 16, month: 1, type: SlotType.MIDWEEK, comp: CompetitionType.CL_QF, label: "LM: 1/4 Finału - 1. mecz", priority: 85 },
    // --- PUCHARY EUROPEJSKIE --- 17 LUTY LIGA EUROPY ----cwierfinaly 1 mecz 1/4
    { day: 17, month: 1, type: SlotType.MIDWEEK, comp: CompetitionType.EL_QF, label: "LE: 1/4 Finału - 1. mecz", priority: 82 },
    // --- PUCHARY EUROPEJSKIE --- 18 LUTY LIGA KONFERENCJI ----cwierfinaly
    { day: 22, month: 1, type: SlotType.WEEKEND, comp: CompetitionType.LEAGUE, label: "Liga: Kolejka 22", priority: 10 },
    { day: 24, month: 1, type: SlotType.WEEKEND, comp: CompetitionType.TRANSFER_WINDOW, label: "Zamknięcie okna transferowego", priority: 60 },
    { day: 28, month: 1, type: SlotType.WEEKEND, comp: CompetitionType.LEAGUE, label: "Liga: Kolejka 23", priority: 10 },
    // --- MARZEC ------------------------------------------------------------------------------------------------------------------------------------------
    { day: 1, month: 2, type: SlotType.MIDWEEK, comp: CompetitionType.BOARD, label: "ZEBRANIE ZARZĄDU KLUBU", priority: 80 },
    // --- PUCHARY EUROPEJSKIE --- 2 MARZEC LIGA MISTRZÓW----cwierfinaly/rewanże 1/4
    { day: 2, month: 2, type: SlotType.MIDWEEK, comp: CompetitionType.CL_QF_RETURN, label: "LM: 1/4 Finału - Rewanż", priority: 85 },
    // --- PUCHARY EUROPEJSKIE --- 3 MARZEC LIGA EUROPY ----cwierfinaly/rewanż 1/4
    { day: 3, month: 2, type: SlotType.MIDWEEK, comp: CompetitionType.EL_QF_RETURN, label: "LE: 1/4 Finału - Rewanż", priority: 82 },
    // --- PUCHARY EUROPEJSKIE --- 4 MARZEC LIGA KONFERENCJI ----cwierfinaly/rewanże
    //=== 6 MARZEC LOSOWANIE PÓŁFINAŁÓW LIGI MISTRZÓW
    { day: 6, month: 2, type: SlotType.MIDWEEK, comp: CompetitionType.CL_SF_DRAW, label: "LOSOWANIE LM: 1/2 FINAŁU", priority: 90 },
    { day: 7, month: 2, type: SlotType.WEEKEND, comp: CompetitionType.POLISH_CUP, label: "Puchar Polski: 1/4", priority: 50 },
    // 8 marzec - losowanie połfinałów Ligi europy 
    { day: 8, month: 2, type: SlotType.MIDWEEK, comp: CompetitionType.EL_SF_DRAW, label: "LOSOWANIE LE: 1/2 FINAŁU", priority: 88 },
    { day: 9, month: 2, type: SlotType.MIDWEEK, comp: CompetitionType.POLISH_CUP, label: "LOSOWANIE PUCHARU POLSKI 1/2", priority: 40 },
    { day: 10, month: 2, type: SlotType.WEEKEND, comp: CompetitionType.LEAGUE, label: "Liga: Kolejka 24", priority: 10 },
    // --- REPREZENTAcjA ---
    { day: 17, month: 2, type: SlotType.MIDWEEK, comp: CompetitionType.BREAK, label: "REPREZENTACJA", priority: 30 },
    { day: 20, month: 2, type: SlotType.MIDWEEK, comp: CompetitionType.BREAK, label: "REPREZENTACJA", priority: 30 },
    { day: 24, month: 2, type: SlotType.WEEKEND, comp: CompetitionType.LEAGUE, label: "Liga: Kolejka 25", priority: 10 },
    // --- PUCHARY EUROPEJSKIE --- 26 Marzec LIGA MISTRZÓW----polfinaly 1/2
    { day: 26, month: 2, type: SlotType.MIDWEEK, comp: CompetitionType.CL_SF, label: "LM: 1/2 Finału - 1. mecz", priority: 85 },
    // 27 MARZEC LIGA EUROPY ----polfinaly - 1 mecz 1/2
    { day: 27, month: 2, type: SlotType.MIDWEEK, comp: CompetitionType.EL_SF, label: "LE: 1/2 Finału - 1. mecz", priority: 82 },
    // --- PUCHARY EUROPEJSKIE --- 28 MARZEC LIGA KONFERENCJI ----polfinaly
    { day: 30, month: 2, type: SlotType.WEEKEND, comp: CompetitionType.LEAGUE, label: "Liga: Kolejka 26", priority: 10 },
    // --- KWIECIEŃ --------------------------------------------------------------------------------------------------------------------------
    { day: 4, month: 3, type: SlotType.WEEKEND, comp: CompetitionType.LEAGUE, label: "Liga: Kolejka 27", priority: 10 },
    { day: 8, month: 3, type: SlotType.WEEKEND, comp: CompetitionType.POLISH_CUP, label: "Puchar Polski: 1/2", priority: 55 },
    { day: 9, month: 3, type: SlotType.MIDWEEK, comp: CompetitionType.POLISH_CUP, label: "Ogłoszenie finalistów Pucharu Polski", priority: 70 },
    { day: 12, month: 3, type: SlotType.WEEKEND, comp: CompetitionType.LEAGUE, label: "Liga: Kolejka 28", priority: 10 },
    // --- PUCHARY EUROPEJSKIE --- 15 Kwiecen LIGA MISTRZÓW----polfinaly/rewanże 1/2
    { day: 15, month: 3, type: SlotType.MIDWEEK, comp: CompetitionType.CL_SF_RETURN, label: "LM: 1/2 Finału - Rewanż", priority: 85 },
    //  16 Kwiecien LIGA EUROPY ----polfinaly rewzn 
    { day: 16, month: 3, type: SlotType.MIDWEEK, comp: CompetitionType.EL_SF_RETURN, label: "LE: 1/2 Finału - Rewanż", priority: 82 },
    // --- PUCHARY EUROPEJSKIE --- 17 Kwiecien LIGA KONFERENCJI ----polfinaly/rewanże
    // --- 18 kwietnia ogloszenienie finalistow ligii mistrzów 
    { day: 18, month: 3, type: SlotType.MIDWEEK, comp: CompetitionType.CL_FINAL_DRAW, label: "OGŁOSZENIE FINALISTÓW LM", priority: 90 },
    // 19 kwietnia ogłoszenie finalistów ligi europy
    { day: 19, month: 3, type: SlotType.MIDWEEK, comp: CompetitionType.EL_FINAL_DRAW, label: "OGŁOSZENIE FINALISTÓW LE", priority: 88 },
    { day: 21, month: 3, type: SlotType.WEEKEND, comp: CompetitionType.LEAGUE, label: "Liga: Kolejka 29", priority: 10 },
    { day: 27, month: 3, type: SlotType.WEEKEND, comp: CompetitionType.LEAGUE, label: "Liga: Kolejka 30", priority: 10 },
    // --- MAJ ------------------------------------------------------------------------------------------------------------------------------------------
    { day: 2, month: 4, type: SlotType.WEEKEND, comp: CompetitionType.POLISH_CUP, label: "Finał Pucharu Polski", priority: 95 },
    { day: 6, month: 4, type: SlotType.MIDWEEK, comp: CompetitionType.LEAGUE, label: "Liga: Kolejka 31", priority: 15 },
    { day: 11, month: 4, type: SlotType.WEEKEND, comp: CompetitionType.LEAGUE, label: "Liga: Kolejka 32", priority: 10 },
    { day: 15, month: 4, type: SlotType.MIDWEEK, comp: CompetitionType.LEAGUE, label: "Liga: Kolejka 33", priority: 15 },
    // --- FINAL PUCHARY EUROPEJSKIE --- 20 Maj LIGA EUROPY ----
    { day: 20, month: 4, type: SlotType.MIDWEEK, comp: CompetitionType.EL_FINAL, label: "LE: Finał", priority: 100 },
    { day: 23, month: 4, type: SlotType.WEEKEND, comp: CompetitionType.LEAGUE, label: "Liga: Kolejka 34", priority: 90 },
    // --- FINAL PUCHARY EUROPEJSKIE --- 27 Maj LIGA KONFERENCJI ----
    // --- FINAL PUCHARY EUROPEJSKIE --- 30 Maj LIGA MISTRZÓW----
    { day: 30, month: 4, type: SlotType.MIDWEEK, comp: CompetitionType.CL_FINAL, label: "LM: Finał", priority: 100 },
    // --- CZERWIEC --------------------------------------------------------------------------------------------------------------------------------------------------
    { day: 1, month: 5, type: SlotType.MIDWEEK, comp: CompetitionType.BOARD, label: "ZEBRANIE ZARZĄDU KLUBU/URLOPY", priority: 80 },
    // --- REPREZENTAcjA ---
    { day: 7, month: 5, type: SlotType.MIDWEEK, comp: CompetitionType.BREAK, label: "REPREZENTACJA", priority: 30 },
    { day: 11, month: 5, type: SlotType.MIDWEEK, comp: CompetitionType.BREAK, label: "REPREZENTACJA", priority: 30 },
    { day: 29, month: 5, type: SlotType.MIDWEEK, comp: CompetitionType.TRANSFER_WINDOW, label: "PODSUMOWANIE SEZONU", priority: 60 },
    { day: 30, month: 5, type: SlotType.MIDWEEK, comp: CompetitionType.OFF_SEASON, label: "ZAKOŃCZENIE SEZONU", priority: 100 }
];
