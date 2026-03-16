/**
 * @deprecated Zastąpiony przez CalendarEngine.getNextPlayerEvent (services/CalendarEngine.ts).
 * Plik zachowany jako archiwum. Nie używać w nowym kodzie.
 * Ostatnio używany w: GameContext.tsx (do 2026-03-02, zastąpiony przez CalendarEngine).
 */
import { 
  PlayerNextEvent, 
  MatchStatus,
  EventKind, 
  LeagueSchedule, 
  SeasonTemplate, 
  CompetitionType, 
  Fixture,
  SlotType 
} from '../types';

export const NextPlayerEventService = {
    getNextEvent: (
    currentDate: Date,
    userTeamId: string,
    userTier: number,
    schedules: Record<number, LeagueSchedule>,
    seasonTemplate: SeasonTemplate | null,
    fixtures: Fixture[] = []
  ): PlayerNextEvent => {
    const potentialEvents: PlayerNextEvent[] = [];
    const now = new Date(currentDate).setHours(0, 0, 0, 0);
    // --- PRE-SEASON PREPARATION (STAGE 1 PRO) ---
    const prepDate = new Date(currentDate.getFullYear(), 6, 1).setHours(0, 0, 0, 0);
    if (prepDate >= now) {
      potentialEvents.push({
        startDate: new Date(currentDate.getFullYear(), 6, 1),
        endDate: new Date(currentDate.getFullYear(), 5, 30),
        kind: EventKind.NONE, // Dzień informacyjny, nie wymaga meczu
        label: "Przygotowanie do sezonu"
      });
    }
    
    
  

    // 1. Check League Matches
    const schedule = schedules[userTier];
    if (schedule) {
      const nextMatchday = schedule.matchdays.find(md => {
        const mdStart = new Date(md.start).setHours(0, 0, 0, 0);
        return mdStart >= now && md.fixtures.some(f => f.homeTeamId === userTeamId || f.awayTeamId === userTeamId);
      });

      if (nextMatchday) {
        const fixture = nextMatchday.fixtures.find(f => f.homeTeamId === userTeamId || f.awayTeamId === userTeamId);
        if (fixture) {
          potentialEvents.push({
            startDate: nextMatchday.start,
            endDate: nextMatchday.end,
            kind: EventKind.MATCH_LEAGUE,
            opponentClubId: fixture.homeTeamId === userTeamId ? fixture.awayTeamId : fixture.homeTeamId,
            isHome: fixture.homeTeamId === userTeamId,
            label: `Liga: Kolejka ${nextMatchday.roundNumber}`
          });
        }
      }
    }

    // 2. Check Season Template (Super Cup, Transfers, Friendlies, etc.)
    if (seasonTemplate) {
      seasonTemplate.slots.forEach(slot => {
        const slotStart = new Date(slot.start).setHours(0, 0, 0, 0);
        if (slotStart < now) return;

        // Filter based on relevance to player
        let relevant = false;
        let kind = EventKind.NONE;

        switch (slot.competition) {

 // ZASTĄP GO TYM KODEM:
          case CompetitionType.SUPER_CUP:
            const currentYear = currentDate.getFullYear();
            const foundSuperCup = fixtures.find(f => f.id.startsWith(`SUPER_CUP_${currentYear}`));
            const stillToPlay = foundSuperCup ? foundSuperCup.status !== MatchStatus.FINISHED : true;
            // Sprawdzamy sztywną datę 12 lipca
            const isSuperCupDay = new Date(currentYear, 6, 12).setHours(0,0,0,0) === slotStart;
            
            if (isSuperCupDay && stillToPlay) {
              relevant = true;
              kind = EventKind.MATCH_SUPER_CUP;
            }
            break;
// KONIEC ZMIANY

                  case CompetitionType.CHAMPIONS_LEAGUE_DRAW:
            relevant = true;
            kind = EventKind.CL_DRAW;
            break;
          case CompetitionType.CL_R1Q:
          case CompetitionType.CL_R1Q_RETURN:
          case CompetitionType.CL_R2Q:
          case CompetitionType.CL_R2Q_RETURN:
            relevant = true;
            kind = EventKind.MATCH_EURO;
            break;
          case CompetitionType.CL_GROUP_STAGE: {
            const hasScheduledCLGs = fixtures.some(f =>
              f.date.toDateString() === slot.start.toDateString() &&
              f.leagueId === CompetitionType.CL_GROUP_STAGE &&
              f.status === MatchStatus.SCHEDULED
            );
            if (hasScheduledCLGs) {
              relevant = true;
              kind = EventKind.MATCH_EURO;
            }
            break;
          }
          case CompetitionType.TRANSFER_WINDOW:
  relevant = true;
  kind = EventKind.TRANSFER_WINDOW;
  // Jeśli label zawiera "Letnie przygotowania", silnik Dashboardu może to specjalnie wyświetlić
  break;
       case CompetitionType.POLISH_CUP:
            if (!slot.label.includes("LOSOWANIE") && !slot.label.includes("Ogłoszenie")) {
              const hasUserCupFixture = fixtures.some(f =>
                f.date.toDateString() === slot.start.toDateString() &&
                f.leagueId === CompetitionType.POLISH_CUP &&
                (f.homeTeamId === userTeamId || f.awayTeamId === userTeamId) &&
                f.status === MatchStatus.SCHEDULED
              );
              if (hasUserCupFixture) {
                relevant = true;
                kind = EventKind.MATCH_POLISH_CUP;
              }
            }
            break;
          case CompetitionType.FRIENDLY:
            relevant = true;
            kind = EventKind.MATCH_FRIENDLY;
            break;
          case CompetitionType.OFF_SEASON:
            relevant = true;
            kind = EventKind.OFF_SEASON;
            break;
        }

        if (relevant) {
          potentialEvents.push({
            startDate: slot.start,
            endDate: slot.end,
            kind: kind,
            label: slot.label
          });
        }
      });
    }

    // 3. Sort and Select Best
    if (potentialEvents.length === 0) {
      return {
        startDate: currentDate,
        endDate: currentDate,
        kind: EventKind.NONE,
        label: "Brak zaplanowanych zdarzeń"
      };
    }

    // Sort by Date, then Priority (Matches > Others)
    return potentialEvents.sort((a, b) => {
      const dateDiff = a.startDate.getTime() - b.startDate.getTime();
      if (dateDiff !== 0) return dateDiff;
      
      const priority: Record<EventKind, number> = {
        [EventKind.MATCH_SUPER_CUP]: 10,
        [EventKind.MATCH_LEAGUE]: 9,
        [EventKind.MATCH_FRIENDLY]: 8,
        [EventKind.CL_DRAW]: 8,
        [EventKind.CUP_DRAW]: 7,
        [EventKind.TRANSFER_WINDOW]: 7,
        [EventKind.OFF_SEASON]: 6,
        [EventKind.MATCH_POLISH_CUP]: 5,
        [EventKind.MATCH_EURO]: 4,
        [EventKind.NONE]: 0
      };

      return priority[b.kind] - priority[a.kind];
    })[0];
  }
};