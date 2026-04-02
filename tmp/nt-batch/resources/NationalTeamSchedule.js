"use strict";
/**
 * NationalTeamSchedule.ts
 *
 * Centralny rejestr meczów reprezentacji narodowych, kluczowany rokiem (seasonStartYear).
 *
 * Zasada działania:
 *   - Słownik NT_SCHEDULE_BY_YEAR jest kluczowany wartością `seasonStartYear`
 *     (rok, w którym sezon się ZACZYNA — np. 2025 dla sezonu 2025/26).
 *   - Każdy wpis to lista dni meczowych (NTMatchDay) z konkretnymi meczami.
 *   - month używa formatu JavaScript (0-11): 8 = wrzesień, 9 = październik, 10 = listopad.
 *   - competitionLabel to etykieta wyświetlana graczowi (np. "Kwalifikacje MŚ 2026 – Gr. G").
 *   - polishGroupOnly: gdy true, widok pokazuje TYLKO mecze z grupy Polski.
 *     Gdy false (np. finał MŚ), pokazuje wszystkie mecze z listy.
 *
 * Jak dodać nowy rok / nowe rozgrywki:
 *   1. Dodaj nowy klucz do NT_SCHEDULE_BY_YEAR, np. 2026: [...].
 *   2. Wypełnij listę NTMatchDay[] zgodnie z harmonogramem FIFA/UEFA.
 *   3. Nic więcej nie musisz zmieniać — reszta systemu pobierze dane automatycznie.
 *
 * Jak działa integracja z grą:
 *   - CalendarEngine wykrywa BREAK slot z labelką "REPREZENTACJA" i zwraca EventKind.NATIONAL_TEAM_MATCH.
 *   - GameContext w advanceDay wywołuje NationalTeamSimulator.simulateMatchDay(matchDay).
 *   - Wyniki są przechowywane w stanie gry i wyświetlane w NationalTeamResultsView.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NT_SCHEDULE_BY_YEAR = void 0;
exports.getNTMatchDayForDate = getNTMatchDayForDate;
// ─── Dane ─────────────────────────────────────────────────────────────────────
/**
 * Harmonogram meczów reprezentacji kluczowany rokiem startowym sezonu.
 *
 * Klucz: seasonStartYear (rok w którym zaczyna się sezon, np. 2025 dla 2025/26).
 * Wartość: lista dni meczowych (NTMatchDay[]).
 *
 * Stan na start gry (lipiec 2025): 3 kolejki zostały już rozegrane (marzec 2025),
 * więc w sezonie 2025/26 pozostały kolejki 4–9 (wrzesień, październik, listopad 2025).
 */
exports.NT_SCHEDULE_BY_YEAR = {
    // ── Sezon 2025/26 — Kwalifikacje do Mistrzostw Świata 2026, Grupa G ─────────
    // Polska, Holandia, Finlandia, Litwa, Malta
    // Kolejki 4–9 (kolejki 1–3 rozegrano w marcu 2025, przed startem gry)
    2025: [
        {
            // Kolejka 4: 4 września 2025
            day: 4,
            month: 8, // wrzesień
            competitionLabel: 'Kwalifikacje MŚ 2026 – Gr. G',
            matches: [
                { home: 'Holandia', away: 'Polska' },
                { home: 'Litwa', away: 'Malta' },
            ],
        },
        {
            // Kolejka 5: 7 września 2025
            day: 7,
            month: 8, // wrzesień
            competitionLabel: 'Kwalifikacje MŚ 2026 – Gr. G',
            matches: [
                { home: 'Polska', away: 'Finlandia' },
                { home: 'Litwa', away: 'Holandia' },
            ],
        },
        {
            // Kolejka 6: 8 października 2025
            day: 8,
            month: 9, // październik
            competitionLabel: 'Kwalifikacje MŚ 2026 – Gr. G',
            matches: [
                { home: 'Finlandia', away: 'Litwa' },
                { home: 'Malta', away: 'Holandia' },
            ],
        },
        {
            // Kolejka 7: 11 października 2025
            day: 11,
            month: 9, // październik
            competitionLabel: 'Kwalifikacje MŚ 2026 – Gr. G',
            matches: [
                { home: 'Holandia', away: 'Finlandia' },
                { home: 'Litwa', away: 'Polska' },
            ],
        },
        {
            // Kolejka 8: 14 listopada 2025
            day: 14,
            month: 10, // listopad
            competitionLabel: 'Kwalifikacje MŚ 2026 – Gr. G',
            matches: [
                { home: 'Finlandia', away: 'Malta' },
                { home: 'Polska', away: 'Holandia' },
            ],
        },
        {
            // Kolejka 9: 17 listopada 2025
            day: 17,
            month: 10, // listopad
            competitionLabel: 'Kwalifikacje MŚ 2026 – Gr. G',
            matches: [
                { home: 'Holandia', away: 'Litwa' },
                { home: 'Malta', away: 'Polska' },
            ],
        },
    ],
    // ── Sezon 2026/27 — PRZYKŁAD (do uzupełnienia) ──────────────────────────────
    // Np. Liga Narodów, kwalifikacje Euro 2028 itp.
    // 2026: [
    //   { day: 5, month: 8, competitionLabel: 'Liga Narodów UEFA – Gr. B', matches: [...] },
    // ],
};
/**
 * Pomocnicza funkcja — zwraca NTMatchDay dla danej daty i roku, lub null jeśli brak.
 *
 * @param date    - aktualna data gry
 * @param year    - seasonStartYear (rok startowy sezonu)
 * @returns NTMatchDay lub null
 */
function getNTMatchDayForDate(date, year) {
    const schedule = exports.NT_SCHEDULE_BY_YEAR[year];
    if (!schedule)
        return null;
    const day = date.getDate();
    const month = date.getMonth(); // 0-11
    return schedule.find(md => md.day === day && md.month === month) ?? null;
}
