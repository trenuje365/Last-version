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
// Import potrzebny do detekcji dnia meczowego reprezentacji
import { NT_SCHEDULE_BY_YEAR } from '../resources/NationalTeamSchedule';

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
      if (ev.participation === 'info') continue;        // pomijamy czysto informacyjne
      if (ev.participation === 'background') continue;  // pomijamy tło — te dni auto-przeskakują podczas jumpToDate

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
          f => f.id.startsWith(`SUPER_CUP_${year}`) && f.status === MatchStatus.SCHEDULED,
        );
        if (!fixture) return null;
        const isUserIn = fixture.homeTeamId === userTeamId || fixture.awayTeamId === userTeamId;

        return {
          slot,
          kind: EventKind.MATCH_SUPER_CUP,
          participation: isUserIn ? 'player' : 'background',
          targetView: ViewState.PRE_MATCH_CUP_STUDIO,
          fixture,
          opponentClubId: isUserIn
            ? fixture.homeTeamId === userTeamId
              ? fixture.awayTeamId
              : fixture.homeTeamId
            : undefined,
          isHome: isUserIn ? fixture.homeTeamId === userTeamId : undefined,
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
        const hasAnyCupToday = allFixtures.some(
          f =>
            f.date.toDateString() === dateStr &&
            f.leagueId === CompetitionType.POLISH_CUP &&
            f.status === MatchStatus.SCHEDULED,
        );
        if (!hasAnyCupToday) return null;
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
      // ── LE: LOSOWANIE R1Q ─────────────────────────────────────────────────────
      case CompetitionType.EL_R1Q_DRAW: {
        return {
          slot,
          kind: EventKind.CL_DRAW,
          participation: 'player',
          targetView: ViewState.EL_DRAW,
        };
      }

      // ── LE: LOSOWANIE R2Q ─────────────────────────────────────────────────────
      case CompetitionType.EL_R2Q_DRAW: {
        return {
          slot,
          kind: EventKind.CL_DRAW,
          participation: 'player',
          targetView: ViewState.EL_R2Q_DRAW,
        };
      }

      // ── LE: MECZE PREELIMINACYJNE R1Q ─────────────────────────────────────
      case CompetitionType.EL_R1Q:
      case CompetitionType.EL_R1Q_RETURN: {
        const leagueIdELR1Q = slot.competition as string;
        const fixtureELR1Q = allFixtures.find(
          f =>
            f.date.toDateString() === dateStr &&
            f.leagueId === leagueIdELR1Q &&
            (f.homeTeamId === userTeamId || f.awayTeamId === userTeamId) &&
            f.status === MatchStatus.SCHEDULED,
        );
        const hasAnyELR1Q = allFixtures.some(
          f =>
            f.date.toDateString() === dateStr &&
            (f.leagueId === CompetitionType.EL_R1Q || f.leagueId === CompetitionType.EL_R1Q_RETURN) &&
            f.status === MatchStatus.SCHEDULED,
        );
        if (!fixtureELR1Q && !hasAnyELR1Q) return null;
        return {
          slot,
          kind: EventKind.MATCH_EURO,
          participation: fixtureELR1Q ? 'player' : 'background',
          targetView: ViewState.PRE_MATCH_EL_STUDIO,
          fixture: fixtureELR1Q,
          opponentClubId: fixtureELR1Q
            ? fixtureELR1Q.homeTeamId === userTeamId
              ? fixtureELR1Q.awayTeamId
              : fixtureELR1Q.homeTeamId
            : undefined,
          isHome: fixtureELR1Q ? fixtureELR1Q.homeTeamId === userTeamId : undefined,
        };
      }

      // ── LE: MECZE PREELIMINACYJNE R2Q ─────────────────────────────────────
      case CompetitionType.EL_R2Q:
      case CompetitionType.EL_R2Q_RETURN: {
        const leagueIdELR2Q = slot.competition as string;
        const fixtureELR2Q = allFixtures.find(
          f =>
            f.date.toDateString() === dateStr &&
            f.leagueId === leagueIdELR2Q &&
            (f.homeTeamId === userTeamId || f.awayTeamId === userTeamId) &&
            f.status === MatchStatus.SCHEDULED,
        );
        const hasAnyELR2Q = allFixtures.some(
          f =>
            f.date.toDateString() === dateStr &&
            (f.leagueId === CompetitionType.EL_R2Q || f.leagueId === CompetitionType.EL_R2Q_RETURN) &&
            f.status === MatchStatus.SCHEDULED,
        );
        if (!fixtureELR2Q && !hasAnyELR2Q) return null;
        return {
          slot,
          kind: EventKind.MATCH_EURO,
          participation: fixtureELR2Q ? 'player' : 'background',
          targetView: ViewState.PRE_MATCH_EL_STUDIO,
          fixture: fixtureELR2Q,
          opponentClubId: fixtureELR2Q
            ? fixtureELR2Q.homeTeamId === userTeamId
              ? fixtureELR2Q.awayTeamId
              : fixtureELR2Q.homeTeamId
            : undefined,
          isHome: fixtureELR2Q ? fixtureELR2Q.homeTeamId === userTeamId : undefined,
        };
      }

      // ── LE: LOSOWANIE FAZY GRUPOWEJ ───────────────────────────────────────
      case CompetitionType.EL_GROUP_DRAW: {
        return {
          slot,
          kind: EventKind.CL_DRAW,
          participation: 'player',
          targetView: ViewState.EL_GROUP_DRAW,
        };
      }

      // ── LE: FAZA GRUPOWA ──────────────────────────────────────────────────
      case CompetitionType.EL_GROUP_STAGE: {
        const fixtureELGS = allFixtures.find(
          f =>
            f.date.toDateString() === dateStr &&
            f.leagueId === CompetitionType.EL_GROUP_STAGE &&
            (f.homeTeamId === userTeamId || f.awayTeamId === userTeamId) &&
            f.status === MatchStatus.SCHEDULED,
        );
        const hasAnyELGS = allFixtures.some(
          f =>
            f.date.toDateString() === dateStr &&
            f.leagueId === CompetitionType.EL_GROUP_STAGE &&
            f.status === MatchStatus.SCHEDULED,
        );
        if (!fixtureELGS && !hasAnyELGS) return null;
        return {
          slot,
          kind: EventKind.MATCH_EURO,
          participation: fixtureELGS ? 'player' : 'background',
          targetView: ViewState.PRE_MATCH_EL_STUDIO,
          fixture: fixtureELGS,
          opponentClubId: fixtureELGS
            ? fixtureELGS.homeTeamId === userTeamId
              ? fixtureELGS.awayTeamId
              : fixtureELGS.homeTeamId
            : undefined,
          isHome: fixtureELGS ? fixtureELGS.homeTeamId === userTeamId : undefined,
        };
      }

      // ── LE: LOSOWANIE 1/8 FINAŁU ─────────────────────────────────────────
      case CompetitionType.EL_R16_DRAW: {
        return {
          slot,
          kind: EventKind.CL_DRAW,
          participation: 'player',
          targetView: ViewState.EL_R16_DRAW,
        };
      }

      // ── LE: 1/8 FINAŁU ───────────────────────────────────────────────────
      case CompetitionType.EL_R16:
      case CompetitionType.EL_R16_RETURN: {
        const leagueIdELR16 = slot.competition as string;
        const fixtureELR16 = allFixtures.find(
          f =>
            f.date.toDateString() === dateStr &&
            f.leagueId === leagueIdELR16 &&
            (f.homeTeamId === userTeamId || f.awayTeamId === userTeamId) &&
            f.status === MatchStatus.SCHEDULED,
        );
        const hasAnyELR16 = allFixtures.some(
          f =>
            f.date.toDateString() === dateStr &&
            (f.leagueId === CompetitionType.EL_R16 || f.leagueId === CompetitionType.EL_R16_RETURN) &&
            f.status === MatchStatus.SCHEDULED,
        );
        if (!fixtureELR16 && !hasAnyELR16) return null;
        return {
          slot,
          kind: EventKind.MATCH_EURO,
          participation: fixtureELR16 ? 'player' : 'background',
          targetView: ViewState.PRE_MATCH_EL_STUDIO,
          fixture: fixtureELR16,
          opponentClubId: fixtureELR16
            ? fixtureELR16.homeTeamId === userTeamId
              ? fixtureELR16.awayTeamId
              : fixtureELR16.homeTeamId
            : undefined,
          isHome: fixtureELR16 ? fixtureELR16.homeTeamId === userTeamId : undefined,
        };
      }

      // ── LE: LOSOWANIE 1/4 FINAŁU ─────────────────────────────────────────
      case CompetitionType.EL_QF_DRAW: {
        return {
          slot,
          kind: EventKind.CL_DRAW,
          participation: 'player',
          targetView: ViewState.EL_QF_DRAW,
        };
      }

      // ── LE: LOSOWANIE 1/2 FINAŁU ─────────────────────────────────────────
      case CompetitionType.EL_SF_DRAW: {
        return {
          slot,
          kind: EventKind.CL_DRAW,
          participation: 'player',
          targetView: ViewState.EL_SF_DRAW,
        };
      }

      // ── LE: OGŁOSZENIE FINALISTÓW ─────────────────────────────────────────
      case CompetitionType.EL_FINAL_DRAW: {
        return {
          slot,
          kind: EventKind.CL_DRAW,
          participation: 'player',
          targetView: ViewState.EL_FINAL_DRAW,
        };
      }

      // ── LE: 1/4 FINAŁU ───────────────────────────────────────────────────
      case CompetitionType.EL_QF:
      case CompetitionType.EL_QF_RETURN:
      // ── LE: 1/2 FINAŁU ───────────────────────────────────────────────────
      case CompetitionType.EL_SF:
      case CompetitionType.EL_SF_RETURN: {
        const leagueIdEL = slot.competition as string;
        const fixtureEL = allFixtures.find(
          f =>
            f.date.toDateString() === dateStr &&
            f.leagueId === leagueIdEL &&
            (f.homeTeamId === userTeamId || f.awayTeamId === userTeamId) &&
            f.status === MatchStatus.SCHEDULED,
        );
        const hasAnyEL = allFixtures.some(
          f =>
            f.date.toDateString() === dateStr &&
            f.leagueId === leagueIdEL &&
            f.status === MatchStatus.SCHEDULED,
        );
        if (!fixtureEL && !hasAnyEL) return null;
        return {
          slot,
          kind: EventKind.MATCH_EURO,
          participation: fixtureEL ? 'player' : 'background',
          targetView: ViewState.PRE_MATCH_EL_STUDIO,
          fixture: fixtureEL,
          opponentClubId: fixtureEL
            ? fixtureEL.homeTeamId === userTeamId
              ? fixtureEL.awayTeamId
              : fixtureEL.homeTeamId
            : undefined,
          isHome: fixtureEL ? fixtureEL.homeTeamId === userTeamId : undefined,
        };
      }

      // ── LE: FINAŁ ─────────────────────────────────────────────────────────
      case CompetitionType.EL_FINAL: {
        const fixtureELFinal = allFixtures.find(
          f =>
            f.date.toDateString() === dateStr &&
            f.leagueId === CompetitionType.EL_FINAL &&
            (f.homeTeamId === userTeamId || f.awayTeamId === userTeamId) &&
            f.status === MatchStatus.SCHEDULED,
        );
        return {
          slot,
          kind: EventKind.MATCH_EURO,
          participation: 'player',
          targetView: ViewState.PRE_MATCH_EL_STUDIO,
          fixture: fixtureELFinal,
          opponentClubId: fixtureELFinal
            ? fixtureELFinal.homeTeamId === userTeamId
              ? fixtureELFinal.awayTeamId
              : fixtureELFinal.homeTeamId
            : undefined,
          isHome: fixtureELFinal ? fixtureELFinal.homeTeamId === userTeamId : undefined,
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

      // ── LK: LOSOWANIE R1Q ─────────────────────────────────────────────────
      case CompetitionType.CONF_R1Q_DRAW: {
        return {
          slot,
          kind: EventKind.CL_DRAW,
          participation: 'player',
          targetView: ViewState.CONF_DRAW,
        };
      }

      // ── LK: MECZE PREELIMINACYJNE R1Q ────────────────────────────────────
      case CompetitionType.CONF_R1Q:
      case CompetitionType.CONF_R1Q_RETURN: {
        const leagueIdCONFR1Q = slot.competition as string;
        const fixtureCONFR1Q = allFixtures.find(
          f =>
            f.date.toDateString() === dateStr &&
            f.leagueId === leagueIdCONFR1Q &&
            (f.homeTeamId === userTeamId || f.awayTeamId === userTeamId) &&
            f.status === MatchStatus.SCHEDULED,
        );
        const hasAnyCONFR1Q = allFixtures.some(
          f =>
            f.date.toDateString() === dateStr &&
            (f.leagueId === CompetitionType.CONF_R1Q || f.leagueId === CompetitionType.CONF_R1Q_RETURN) &&
            f.status === MatchStatus.SCHEDULED,
        );
        if (!fixtureCONFR1Q && !hasAnyCONFR1Q) return null;
        return {
          slot,
          kind: EventKind.MATCH_EURO,
          participation: fixtureCONFR1Q ? 'player' : 'background',
          targetView: ViewState.PRE_MATCH_CONF_STUDIO,
          fixture: fixtureCONFR1Q,
          opponentClubId: fixtureCONFR1Q
            ? fixtureCONFR1Q.homeTeamId === userTeamId
              ? fixtureCONFR1Q.awayTeamId
              : fixtureCONFR1Q.homeTeamId
            : undefined,
          isHome: fixtureCONFR1Q ? fixtureCONFR1Q.homeTeamId === userTeamId : undefined,
        };
      }

      // ── LK: LOSOWANIE R2Q ─────────────────────────────────────────────────
      case CompetitionType.CONF_R2Q_DRAW: {
        return {
          slot,
          kind: EventKind.CL_DRAW,
          participation: 'player',
          targetView: ViewState.CONF_R2Q_DRAW,
        };
      }

      // ── LK: MECZE PREELIMINACYJNE R2Q ────────────────────────────────────
      case CompetitionType.CONF_R2Q:
      case CompetitionType.CONF_R2Q_RETURN: {
        const leagueIdCONFR2Q = slot.competition as string;
        const fixtureCONFR2Q = allFixtures.find(
          f =>
            f.date.toDateString() === dateStr &&
            f.leagueId === leagueIdCONFR2Q &&
            (f.homeTeamId === userTeamId || f.awayTeamId === userTeamId) &&
            f.status === MatchStatus.SCHEDULED,
        );
        const hasAnyCONFR2Q = allFixtures.some(
          f =>
            f.date.toDateString() === dateStr &&
            (f.leagueId === CompetitionType.CONF_R2Q || f.leagueId === CompetitionType.CONF_R2Q_RETURN) &&
            f.status === MatchStatus.SCHEDULED,
        );
        if (!fixtureCONFR2Q && !hasAnyCONFR2Q) return null;
        return {
          slot,
          kind: EventKind.MATCH_EURO,
          participation: fixtureCONFR2Q ? 'player' : 'background',
          targetView: ViewState.PRE_MATCH_CONF_STUDIO,
          fixture: fixtureCONFR2Q,
          opponentClubId: fixtureCONFR2Q
            ? fixtureCONFR2Q.homeTeamId === userTeamId
              ? fixtureCONFR2Q.awayTeamId
              : fixtureCONFR2Q.homeTeamId
            : undefined,
          isHome: fixtureCONFR2Q ? fixtureCONFR2Q.homeTeamId === userTeamId : undefined,
        };
      }

      // ── LK: LOSOWANIE FAZY GRUPOWEJ ───────────────────────────────────────
      case CompetitionType.CONF_GROUP_DRAW: {
        return { slot, kind: EventKind.CL_DRAW, participation: 'player', targetView: ViewState.CONF_GROUP_DRAW };
      }

      // ── LK: FAZA GRUPOWA ──────────────────────────────────────────────────
      case CompetitionType.CONF_GROUP_STAGE: {
        const fixtureCONFGS = allFixtures.find(
          f =>
            f.date.toDateString() === dateStr &&
            f.leagueId === CompetitionType.CONF_GROUP_STAGE &&
            (f.homeTeamId === userTeamId || f.awayTeamId === userTeamId) &&
            f.status === MatchStatus.SCHEDULED,
        );
        const hasAnyCONFGS = allFixtures.some(f =>
          f.date.toDateString() === dateStr &&
          f.leagueId === CompetitionType.CONF_GROUP_STAGE &&
          f.status === MatchStatus.SCHEDULED,
        );
        if (!fixtureCONFGS && !hasAnyCONFGS) return null;
        return {
          slot,
          kind: EventKind.MATCH_EURO,
          participation: fixtureCONFGS ? 'player' : 'background',
          targetView: ViewState.PRE_MATCH_CONF_STUDIO,
          fixture: fixtureCONFGS,
          opponentClubId: fixtureCONFGS
            ? fixtureCONFGS.homeTeamId === userTeamId
              ? fixtureCONFGS.awayTeamId
              : fixtureCONFGS.homeTeamId
            : undefined,
          isHome: fixtureCONFGS ? fixtureCONFGS.homeTeamId === userTeamId : undefined,
        };
      }

      // ── LK: LOSOWANIE 1/8 FINAŁU ─────────────────────────────────────────
      case CompetitionType.CONF_R16_DRAW: {
        return {
          slot,
          kind: EventKind.CL_DRAW,
          participation: 'player',
          targetView: ViewState.CONF_R16_DRAW,
        };
      }

      // ── LK: 1/8 FINAŁU ───────────────────────────────────────────────────
      case CompetitionType.CONF_R16:
      case CompetitionType.CONF_R16_RETURN: {
        const leagueIdCONFR16 = slot.competition as string;
        const fixtureCONFR16 = allFixtures.find(f =>
          f.date.toDateString() === dateStr &&
          f.leagueId === leagueIdCONFR16 &&
          (f.homeTeamId === userTeamId || f.awayTeamId === userTeamId) &&
          f.status === MatchStatus.SCHEDULED,
        );
        const hasAnyCONFR16 = allFixtures.some(f =>
          f.date.toDateString() === dateStr &&
          (f.leagueId === CompetitionType.CONF_R16 || f.leagueId === CompetitionType.CONF_R16_RETURN) &&
          f.status === MatchStatus.SCHEDULED,
        );
        if (!fixtureCONFR16 && !hasAnyCONFR16) return null;
        return {
          slot,
          kind: EventKind.MATCH_EURO,
          participation: fixtureCONFR16 ? 'player' : 'background',
          targetView: ViewState.PRE_MATCH_CONF_STUDIO,
          fixture: fixtureCONFR16,
          opponentClubId: fixtureCONFR16
            ? fixtureCONFR16.homeTeamId === userTeamId
              ? fixtureCONFR16.awayTeamId
              : fixtureCONFR16.homeTeamId
            : undefined,
          isHome: fixtureCONFR16 ? fixtureCONFR16.homeTeamId === userTeamId : undefined,
        };
      }

      // ── LK: LOSOWANIE 1/4 FINAŁU ─────────────────────────────────────────
      case CompetitionType.CONF_QF_DRAW: {
        return {
          slot,
          kind: EventKind.CL_DRAW,
          participation: 'player',
          targetView: ViewState.CONF_QF_DRAW,
        };
      }

      // ── LK: 1/4 FINAŁU ───────────────────────────────────────────────────
      case CompetitionType.CONF_QF:
      case CompetitionType.CONF_QF_RETURN: {
        const leagueIdCONFQF = slot.competition as string;
        const fixtureCONFQF = allFixtures.find(f =>
          f.date.toDateString() === dateStr &&
          f.leagueId === leagueIdCONFQF &&
          (f.homeTeamId === userTeamId || f.awayTeamId === userTeamId) &&
          f.status === MatchStatus.SCHEDULED,
        );
        const hasAnyCONFQF = allFixtures.some(f =>
          f.date.toDateString() === dateStr &&
          (f.leagueId === CompetitionType.CONF_QF || f.leagueId === CompetitionType.CONF_QF_RETURN) &&
          f.status === MatchStatus.SCHEDULED,
        );
        if (!fixtureCONFQF && !hasAnyCONFQF) return null;
        return {
          slot,
          kind: EventKind.MATCH_EURO,
          participation: fixtureCONFQF ? 'player' : 'background',
          targetView: ViewState.PRE_MATCH_CONF_STUDIO,
          fixture: fixtureCONFQF,
          opponentClubId: fixtureCONFQF
            ? fixtureCONFQF.homeTeamId === userTeamId
              ? fixtureCONFQF.awayTeamId
              : fixtureCONFQF.homeTeamId
            : undefined,
          isHome: fixtureCONFQF ? fixtureCONFQF.homeTeamId === userTeamId : undefined,
        };
      }

      // ── LK: LOSOWANIE 1/2 FINAŁU ─────────────────────────────────────────
      case CompetitionType.CONF_SF_DRAW: {
        return {
          slot,
          kind: EventKind.CL_DRAW,
          participation: 'player',
          targetView: ViewState.CONF_SF_DRAW,
        };
      }

      // ── LK: 1/2 FINAŁU ───────────────────────────────────────────────────
      case CompetitionType.CONF_SF:
      case CompetitionType.CONF_SF_RETURN: {
        const leagueIdCONFSF = slot.competition as string;
        const fixtureCONFSF = allFixtures.find(f =>
          f.date.toDateString() === dateStr &&
          f.leagueId === leagueIdCONFSF &&
          (f.homeTeamId === userTeamId || f.awayTeamId === userTeamId) &&
          f.status === MatchStatus.SCHEDULED,
        );
        const hasAnyCONFSF = allFixtures.some(f =>
          f.date.toDateString() === dateStr &&
          (f.leagueId === CompetitionType.CONF_SF || f.leagueId === CompetitionType.CONF_SF_RETURN) &&
          f.status === MatchStatus.SCHEDULED,
        );
        if (!fixtureCONFSF && !hasAnyCONFSF) return null;
        return {
          slot,
          kind: EventKind.MATCH_EURO,
          participation: fixtureCONFSF ? 'player' : 'background',
          targetView: ViewState.PRE_MATCH_CONF_STUDIO,
          fixture: fixtureCONFSF,
          opponentClubId: fixtureCONFSF
            ? fixtureCONFSF.homeTeamId === userTeamId
              ? fixtureCONFSF.awayTeamId
              : fixtureCONFSF.homeTeamId
            : undefined,
          isHome: fixtureCONFSF ? fixtureCONFSF.homeTeamId === userTeamId : undefined,
        };
      }

      // ── LK: OGŁOSZENIE FINALISTÓW ─────────────────────────────────────────
      case CompetitionType.CONF_FINAL_DRAW: {
        return {
          slot,
          kind: EventKind.CL_DRAW,
          participation: 'player',
          targetView: ViewState.CONF_FINAL_DRAW,
        };
      }

      // ── LK: FINAŁ ─────────────────────────────────────────────────────────
      case CompetitionType.CONF_FINAL: {
        const fixtureCONFFinal = allFixtures.find(f =>
          f.date.toDateString() === dateStr &&
          f.leagueId === CompetitionType.CONF_FINAL &&
          f.status === MatchStatus.SCHEDULED,
        );
        if (!fixtureCONFFinal) return null;
        const userInCONFFinal = fixtureCONFFinal.homeTeamId === userTeamId || fixtureCONFFinal.awayTeamId === userTeamId;
        return {
          slot,
          kind: EventKind.MATCH_EURO,
          participation: userInCONFFinal ? 'player' : 'background',
          targetView: ViewState.PRE_MATCH_CONF_STUDIO,
          fixture: userInCONFFinal ? fixtureCONFFinal : undefined,
          opponentClubId: userInCONFFinal
            ? fixtureCONFFinal.homeTeamId === userTeamId
              ? fixtureCONFFinal.awayTeamId
              : fixtureCONFFinal.homeTeamId
            : undefined,
          isHome: userInCONFFinal ? fixtureCONFFinal.homeTeamId === userTeamId : undefined,
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
      // Jeśli slot ma labelkę "REPREZENTACJA" i w NT_SCHEDULE_BY_YEAR istnieje
      // wpis dla tej daty i roku, traktuj go jako dzień meczowy reprezentacji
      // (symulacja w tle, gracz widzi wyniki). W przeciwnym razie to zwykły dzień przerwy.
      case CompetitionType.BREAK: {
        if (slot.label === 'REPREZENTACJA') {
          // Wyciągnij rok i miesiąc/dzień ze slotu (slot.start ma prawidłową datę po SeasonTemplateGenerator)
          const slotYear  = slot.start.getFullYear();
          const slotMonth = slot.start.getMonth(); // 0-11
          const slotDay   = slot.start.getDate();
          const yearSchedule = NT_SCHEDULE_BY_YEAR[slotYear];
          const hasMatchDay = yearSchedule
            ? yearSchedule.some(md => md.day === slotDay && md.month === slotMonth)
            : false;

          if (hasMatchDay) {
            // Mecze reprezentacji zaplanowane na ten dzień — symuluj w tle
            return {
              slot,
              kind: EventKind.NATIONAL_TEAM_MATCH,
              participation: 'background',
              targetView: ViewState.NATIONAL_TEAM_RESULTS,
            };
          }
        }
        // Brak meczów (np. przerwa zimowa, wolny dzień) — zwykły dzień informacyjny
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
