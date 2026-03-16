/**
 * CalendarEngine — jedyne źródło prawdy dla kalendarza gry.
 *
 * Zasada działania:
 *   - Nowy sezon rozpoczyna się 1 lipca, kończy 30 czerwca.
 *   - Wszystkie daty zdarzeń pochodzą z FixedSeasonDates → SeasonTemplateGenerator → CalendarSlot[].
 *   - Dla każdego dnia silnik sprawdza, które sloty przypadają na ten dzień.
 *   - Dla każdego slotu określa "participation":
 *       'player'     — gracz uczestniczy aktywnie (pokaż widok)
 *       'background' — zdarzenie symulowane w tle automatycznie
 *       'info'       — dzień informacyjny / administracyjny (tylko przesuń datę)
 *
 * Publiczne API:
 *   CalendarEngine.getEventsForDate(...)  → CalendarEvent[]
 *   CalendarEngine.getNextPlayerEvent(...)→ PlayerNextEvent | null
 */

import {
  CompetitionType,
  EventKind,
  ViewState,
  Fixture,
  MatchStatus,
  Club,
  SeasonTemplate,
  CalendarSlot,
  LeagueSchedule,
  PlayerNextEvent,
} from '../types';

// ─── Typy publiczne ──────────────────────────────────────────────────────────

export type CalendarParticipation = 'player' | 'background' | 'info';

export interface CalendarEvent {
  /** Oryginalny slot z SeasonTemplate (zawiera datę, label, priority). */
  slot: CalendarSlot;
  /** Rodzaj zdarzenia używany przez Dashboard / advanceDay. */
  kind: EventKind;
  /** Czy gracz uczestniczy aktywnie, zdarzenie idzie w tle, czy to dzień informacyjny. */
  participation: CalendarParticipation;
  /** Widok, do którego należy przejść gdy participation === 'player'. */
  targetView: ViewState;
  /** Konkretny mecz gracza (jeśli znaleziony). */
  fixture?: Fixture;
  /** ID drużyny przeciwnej (dla meczów). */
  opponentClubId?: string;
  /** Czy gracz gra u siebie. */
  isHome?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Zamienia datę na string porównywalny dni (bez czasu). */
const sameDay = (a: Date, b: Date): boolean =>
  a.toDateString() === b.toDateString();

/** Zwraca timestamp dla początku dnia. */
const startOfDay = (d: Date): number => new Date(d).setHours(0, 0, 0, 0);

// ─── Silnik ───────────────────────────────────────────────────────────────────

export const CalendarEngine = {

  /**
   * Zwraca wszystkie zdarzenia przypadające na dany dzień.
   * Jeżeli żaden slot nie pasuje, zwraca tablicę pustą → czyli zwykły dzień, przesuń datę.
   */
  getEventsForDate(
    date: Date,
    seasonTemplate: SeasonTemplate | null,
    allFixtures: Fixture[],
    userTeamId: string | null,
    clubs: Club[],
  ): CalendarEvent[] {
    if (!seasonTemplate || !userTeamId) return [];

    const slots = seasonTemplate.slots.filter(s => sameDay(s.start, date));
    if (slots.length === 0) return [];

    const results: CalendarEvent[] = [];
    for (const slot of slots) {
      const ev = this._resolveSlot(slot, date, allFixtures, userTeamId, clubs);
      if (ev) results.push(ev);
    }

    // Sortuj: najpierw 'player', potem 'background', na końcu 'info'
    const order: Record<CalendarParticipation, number> = { player: 0, background: 1, info: 2 };
    results.sort((a, b) => order[a.participation] - order[b.participation]);

    return results;
  },

  /**
   * Zwraca następne zdarzenie, w którym gracz uczestniczy aktywnie lub w tle.
   * Używane przez Dashboard do wyświetlenia przycisku "Następny mecz".
   * 'info' jest pomijane — nie chcemy zatrzymywać gracza na dniach transferowych.
   */
  getNextPlayerEvent(
    currentDate: Date,
    userTeamId: string,
    userTier: number,
    schedules: Record<number, LeagueSchedule>,
    seasonTemplate: SeasonTemplate | null,
    allFixtures: Fixture[],
    clubs: Club[],
  ): PlayerNextEvent | null {
    if (!seasonTemplate || !userTeamId) return null;

    const now = startOfDay(currentDate);

    // Wszystkie przyszłe sloty w kolejności chronologicznej
    const upcoming = [...seasonTemplate.slots]
      .filter(s => startOfDay(s.start) >= now)
      .sort((a, b) => a.start.getTime() - b.start.getTime());

    for (const slot of upcoming) {
      // Dla ligowych kolejek: używamy schedules jako źródła daty i przeciwnika
      if (slot.competition === CompetitionType.LEAGUE) {
        const schedule = schedules[userTier];
        if (!schedule) continue;

        // Szukamy najbliższego matchdaya z fixtures gracza
        const matchday = schedule.matchdays.find(md => {
          const mdStart = startOfDay(md.start);
          return (
            mdStart >= now &&
            md.fixtures.some(
              f =>
                (f.homeTeamId === userTeamId || f.awayTeamId === userTeamId) &&
                f.status === MatchStatus.SCHEDULED,
            )
          );
        });

        if (!matchday) continue;

        const fixture = matchday.fixtures.find(
          f =>
            (f.homeTeamId === userTeamId || f.awayTeamId === userTeamId) &&
            f.status === MatchStatus.SCHEDULED,
        );

        return {
          startDate: matchday.start,
          endDate: matchday.end,
          kind: EventKind.MATCH_LEAGUE,
          label: `Liga: Kolejka ${matchday.roundNumber}`,
          opponentClubId: fixture
            ? fixture.homeTeamId === userTeamId
              ? fixture.awayTeamId
              : fixture.homeTeamId
            : undefined,
          isHome: fixture ? fixture.homeTeamId === userTeamId : undefined,
        };
      }

      // Dla pozostałych slotów: rozwiązujemy uczestnictwo
      const ev = this._resolveSlot(slot, slot.start, allFixtures, userTeamId, clubs);
      if (!ev) continue;
      if (ev.participation === 'info') continue; // pomijamy czysto informacyjne

      return {
        startDate: slot.start,
        endDate: slot.end,
        kind: ev.kind,
        label: slot.label,
        competition: slot.competition as CompetitionType,
        opponentClubId: ev.opponentClubId,
        isHome: ev.isHome,
      };
    }

    return null;
  },

  /**
   * Wewnętrzna metoda: mapuje CalendarSlot → CalendarEvent.
   * Zawiera całą logikę uczestnictwa dla każdego typu zawodów.
   */
  _resolveSlot(
    slot: CalendarSlot,
    date: Date,
    allFixtures: Fixture[],
    userTeamId: string,
    clubs: Club[],
  ): CalendarEvent | null {
    const dateStr = date.toDateString();
    const userClub = clubs.find(c => c.id === userTeamId);

    switch (slot.competition) {

      // ── LIGA ───────────────────────────────────────────────────────────────
      case CompetitionType.LEAGUE: {
        const fixture = allFixtures.find(
          f =>
            f.date.toDateString() === dateStr &&
            f.leagueId === userClub?.leagueId &&
            (f.homeTeamId === userTeamId || f.awayTeamId === userTeamId) &&
            f.status === MatchStatus.SCHEDULED,
        );
        return {
          slot,
          kind: EventKind.MATCH_LEAGUE,
          participation: fixture ? 'player' : 'background',
          targetView: ViewState.PRE_MATCH_STUDIO,
          fixture,
          opponentClubId: fixture
            ? fixture.homeTeamId === userTeamId
              ? fixture.awayTeamId
              : fixture.homeTeamId
            : undefined,
          isHome: fixture ? fixture.homeTeamId === userTeamId : undefined,
        };
      }

      // ── SUPERPUCHAR ────────────────────────────────────────────────────────
      case CompetitionType.SUPER_CUP: {
        const year = date.getFullYear();
        const fixture = allFixtures.find(
          f => f.id === `SUPER_CUP_${year}` && f.status === MatchStatus.SCHEDULED,
        );
        const isUserIn = !!fixture &&
          (fixture.homeTeamId === userTeamId || fixture.awayTeamId === userTeamId);

        return {
          slot,
          kind: EventKind.MATCH_SUPER_CUP,
          participation: isUserIn ? 'player' : 'background',
          targetView: ViewState.PRE_MATCH_CUP_STUDIO,
          fixture,
          opponentClubId: isUserIn && fixture
            ? fixture.homeTeamId === userTeamId
              ? fixture.awayTeamId
              : fixture.homeTeamId
            : undefined,
          isHome: isUserIn && fixture ? fixture.homeTeamId === userTeamId : undefined,
        };
      }

      // ── PUCHAR POLSKI ──────────────────────────────────────────────────────
      case CompetitionType.POLISH_CUP: {
        // Losowanie — gracz zawsze widzi UI
        if (slot.label.toUpperCase().includes('LOSOWANIE')) {
          return {
            slot,
            kind: EventKind.CUP_DRAW,
            participation: 'player',
            targetView: ViewState.CUP_DRAW,
          };
        }

        // Ogłoszenie finalistów PP — gracz widzi ekran finalistów
        if (slot.label.toUpperCase().includes('OGŁOSZENIE') || slot.label.toUpperCase().includes('OGLOSZENIE')) {
          return {
            slot,
            kind: EventKind.CUP_DRAW,
            participation: 'player',
            targetView: ViewState.POLISH_CUP_FINALISTS,
          };
        }

        // Dzień meczowy Pucharu
        const fixture = allFixtures.find(
          f =>
            f.date.toDateString() === dateStr &&
            f.leagueId === CompetitionType.POLISH_CUP &&
            (f.homeTeamId === userTeamId || f.awayTeamId === userTeamId) &&
            f.status === MatchStatus.SCHEDULED,
        );
        const isUserIn = !!userClub?.isInPolishCup && !!fixture;

        return {
          slot,
          kind: EventKind.MATCH_POLISH_CUP,
          participation: isUserIn ? 'player' : 'background',
          targetView: isUserIn
            ? ViewState.PRE_MATCH_CUP_STUDIO
            : ViewState.SCORE_RESULTS_POLISH_CUP,
          fixture: fixture ?? undefined,
          opponentClubId: fixture
            ? fixture.homeTeamId === userTeamId
              ? fixture.awayTeamId
              : fixture.homeTeamId
            : undefined,
          isHome: fixture ? fixture.homeTeamId === userTeamId : undefined,
        };
      }

      // ── LM: LOSOWANIE R1Q ─────────────────────────────────────────────────
      case CompetitionType.CHAMPIONS_LEAGUE_DRAW: {
        return {
          slot,
          kind: EventKind.CL_DRAW,
          participation: 'player',
          targetView: ViewState.CL_DRAW,
        };
      }

      // ── LM: LOSOWANIE R2Q ─────────────────────────────────────────────────
      case CompetitionType.CL_R2Q_DRAW: {
        return {
          slot,
          kind: EventKind.CL_DRAW,
          participation: 'player',
          targetView: ViewState.CL_DRAW,
        };
      }

      // ── LM: LOSOWANIE FAZY GRUPOWEJ ───────────────────────────────────────
      case CompetitionType.CL_GROUP_DRAW: {
        return {
          slot,
          kind: EventKind.CL_DRAW,
          participation: 'player',
          targetView: ViewState.CL_GROUP_DRAW,
        };
      }

      // ── LM: MECZE PREELIMINACYJNE ─────────────────────────────────────────
      case CompetitionType.CL_R1Q:
      case CompetitionType.CL_R1Q_RETURN:
      case CompetitionType.CL_R2Q:
      case CompetitionType.CL_R2Q_RETURN: {
        const leagueId = slot.competition as string;
        const fixture = allFixtures.find(
          f =>
            f.date.toDateString() === dateStr &&
            f.leagueId === leagueId &&
            (f.homeTeamId === userTeamId || f.awayTeamId === userTeamId) &&
            f.status === MatchStatus.SCHEDULED,
        );
        return {
          slot,
          kind: EventKind.MATCH_EURO,
          participation: fixture ? 'player' : 'background',
          targetView: ViewState.PRE_MATCH_CL_STUDIO,
          fixture,
          opponentClubId: fixture
            ? fixture.homeTeamId === userTeamId
              ? fixture.awayTeamId
              : fixture.homeTeamId
            : undefined,
          isHome: fixture ? fixture.homeTeamId === userTeamId : undefined,
        };
      }

      // ── LM: FAZA GRUPOWA ──────────────────────────────────────────────────
      case CompetitionType.CL_GROUP_STAGE: {
        // Pomiń jeśli fixtury grupy nie zostały jeszcze wygenerowane
        const hasAnyScheduled = allFixtures.some(
          f =>
            f.date.toDateString() === dateStr &&
            f.leagueId === CompetitionType.CL_GROUP_STAGE &&
            f.status === MatchStatus.SCHEDULED,
        );
        if (!hasAnyScheduled) return null;

        const fixture = allFixtures.find(
          f =>
            f.date.toDateString() === dateStr &&
            f.leagueId === CompetitionType.CL_GROUP_STAGE &&
            (f.homeTeamId === userTeamId || f.awayTeamId === userTeamId) &&
            f.status === MatchStatus.SCHEDULED,
        );
        return {
          slot,
          kind: EventKind.MATCH_EURO,
          participation: fixture ? 'player' : 'background',
          targetView: ViewState.PRE_MATCH_CL_STUDIO,
          fixture,
          opponentClubId: fixture
            ? fixture.homeTeamId === userTeamId
              ? fixture.awayTeamId
              : fixture.homeTeamId
            : undefined,
          isHome: fixture ? fixture.homeTeamId === userTeamId : undefined,
        };
      }


 // ── LM: LOSOWANIE 1/8 FINAŁU ──────────────────────────────────────────
      case CompetitionType.CL_R16_DRAW: {
        return {
          slot,
          kind: EventKind.CL_DRAW,
          participation: 'player',
          targetView: ViewState.CL_R16_DRAW,
        };
      }


 // ── LM: LOSOWANIE 1/4 FINAŁU ──────────────────────────────────────────
      case CompetitionType.CL_QF_DRAW: {
        return {
          slot,
          kind: EventKind.CL_DRAW,
          participation: 'player',
          targetView: ViewState.CL_QF_DRAW,
        };
      }

       // ── LM: LOSOWANIE 1/2 FINAŁU ──────────────────────────────────────────
      case CompetitionType.CL_SF_DRAW: {
        return {
          slot,
          kind: EventKind.CL_DRAW,
          participation: 'player',
          targetView: ViewState.CL_SF_DRAW,
        };
      }

      // ── LM: OGŁOSZENIE FINALISTÓW ──────────────────────────────────────────
      case CompetitionType.CL_FINAL_DRAW: {
        return {
          slot,
          kind: EventKind.CL_DRAW,
          participation: 'player',
          targetView: ViewState.CL_FINAL_DRAW,
        };
      }

      // ── LM: FINAŁ ─────────────────────────────────────────────────────────
      case CompetitionType.CL_FINAL: {
        // Finał jest zawsze zdarzeniem 'player' — nawet jeśli fixture nie istnieje jeszcze
        // (jest tworzony dopiero w advanceDay po wyznaczeniu zwycięzców SF).
        // Gdyby zwrócić 'background', blok case CompetitionType.CL_FINAL w advanceDay
        // nigdy by nie wszedł i fixture finałowy nigdy by nie powstał.
        const fixture = allFixtures.find(
          f =>
            f.date.toDateString() === dateStr &&
            f.leagueId === CompetitionType.CL_FINAL &&
            (f.homeTeamId === userTeamId || f.awayTeamId === userTeamId) &&
            f.status === MatchStatus.SCHEDULED,
        );
        return {
          slot,
          kind: EventKind.MATCH_EURO,
          participation: 'player',
          targetView: ViewState.PRE_MATCH_CL_FINAL,
          fixture,
          opponentClubId: fixture
            ? fixture.homeTeamId === userTeamId
              ? fixture.awayTeamId
              : fixture.homeTeamId
            : undefined,
          isHome: fixture ? fixture.homeTeamId === userTeamId : undefined,
        };
      }

      // ── LM: 1/8 FINAŁU ────────────────────────────────────────────────────
      case CompetitionType.CL_R16:
      case CompetitionType.CL_R16_RETURN:
      // ── LM: 1/4 FINAŁU ────────────────────────────────────────────────────
      case CompetitionType.CL_QF:
      case CompetitionType.CL_QF_RETURN:
      // ── LM: 1/2 FINAŁU ────────────────────────────────────────────────────
      case CompetitionType.CL_SF:
      case CompetitionType.CL_SF_RETURN: {
        const leagueId = slot.competition as string;
        const fixture = allFixtures.find(
          f =>
            f.date.toDateString() === dateStr &&
            f.leagueId === leagueId &&
            (f.homeTeamId === userTeamId || f.awayTeamId === userTeamId) &&
            f.status === MatchStatus.SCHEDULED,
        );
        return {
          slot,
          kind: EventKind.MATCH_EURO,
          participation: fixture ? 'player' : 'background',
          targetView: ViewState.PRE_MATCH_CL_STUDIO,
          fixture,
          opponentClubId: fixture
            ? fixture.homeTeamId === userTeamId
              ? fixture.awayTeamId
              : fixture.homeTeamId
            : undefined,
          isHome: fixture ? fixture.homeTeamId === userTeamId : undefined,
        };
      }



      // ── SPARING ────────────────────────────────────────────────────────────
      // Sparingi nie mają fixtures w systemie — traktowane jako dni informacyjne (auto-advance)
      case CompetitionType.FRIENDLY: {
        return {
          slot,
          kind: EventKind.MATCH_FRIENDLY,
          participation: 'info',
          targetView: ViewState.DASHBOARD,
        };
      }

      // ── OKNO TRANSFEROWE (dzień informacyjny) ─────────────────────────────
      case CompetitionType.TRANSFER_WINDOW: {
        return {
          slot,
          kind: EventKind.TRANSFER_WINDOW,
          participation: 'info',
          targetView: ViewState.DASHBOARD,
        };
      }

      // ── ZAKOŃCZENIE SEZONU (30 czerwca) — gracz musi kliknąć "Nowy sezon" ────
      case CompetitionType.OFF_SEASON: {
        return {
          slot,
          kind: EventKind.OFF_SEASON,
          participation: 'player',
          targetView: ViewState.DASHBOARD,
        };
      }

      // ── PRZERWA / REPREZENTACJA ────────────────────────────────────────────
      case CompetitionType.BREAK: {
        return {
          slot,
          kind: EventKind.NONE,
          participation: 'info',
          targetView: ViewState.DASHBOARD,
        };
      }

      // ── ZARZĄD ────────────────────────────────────────────────────────────
      case CompetitionType.BOARD: {
        return {
          slot,
          kind: EventKind.NONE,
          participation: 'info',
          targetView: ViewState.DASHBOARD,
        };
      }

      // ── Nieznany typ (przyszłe rozszerzenia) ──────────────────────────────
      default:
        return null;
    }
  },

  /**
   * Zwraca najwyżej priorytetowe zdarzenie dnia (participation === 'player' lub 'background').
   * Używane przez advanceDay do podjęcia decyzji co zrobić z danym dniem.
   * Ignoruje sloty 'info' — te są traktowane jako zwykłe dni.
   */
  getPrimaryEventForDate(
    date: Date,
    seasonTemplate: SeasonTemplate | null,
    allFixtures: Fixture[],
    userTeamId: string | null,
    clubs: Club[],
  ): CalendarEvent | null {
    const events = this.getEventsForDate(date, seasonTemplate, allFixtures, userTeamId, clubs);
    // getEventsForDate już sortuje: player → background → info
    const actionable = events.filter(e => e.participation !== 'info');
    return actionable[0] ?? null;
  },
};
