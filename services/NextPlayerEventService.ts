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
    const prepDate = new Date(currentDate.getFullYear(), 6, 9).setHours(0, 0, 0, 0);
    if (prepDate >= now) {
      potentialEvents.push({
        startDate: new Date(currentDate.getFullYear(), 6, 9),
        endDate: new Date(currentDate.getFullYear(), 6, 9),
        kind: EventKind.NONE, // Dzień informacyjny, nie wymaga meczu
        label: "Przygotowanie do sezonu"
      });
    }
    
    
    // --- TWOJA NOWA LOGIKA (STAGE 1 PRO) ---
    // Definiujemy 16 sierpnia jako "twardą datę" pucharową
    const cupDate = new Date(currentDate.getFullYear(), 7, 16).setHours(0, 0, 0, 0);
    if (cupDate >= now) {
      potentialEvents.push({
        startDate: new Date(currentDate.getFullYear(), 7, 16),
        endDate: new Date(currentDate.getFullYear(), 7, 16),
        kind: EventKind.MATCH_POLISH_CUP,
        label: "Puchar Polski: 1/64"
      });
    }
    // --- 1/32 Pucharu Polski Twarda data
    const cupDate2 = new Date(currentDate.getFullYear(), 8, 20).setHours(0, 0, 0, 0);
    if (cupDate2 >= now) {
      potentialEvents.push({
        startDate: new Date(currentDate.getFullYear(), 8, 20),
        endDate: new Date(currentDate.getFullYear(), 8, 20),
        kind: EventKind.MATCH_POLISH_CUP,
        label: "Puchar Polski: 1/32"
      });
    }
// --- 1/16 Pucharu Polski Twarda data
    const cupDate3 = new Date(currentDate.getFullYear(), 9, 18).setHours(0, 0, 0, 0); // Miesiąc 9 = Październik
    if (cupDate3 >= now) {
      potentialEvents.push({
        startDate: new Date(currentDate.getFullYear(), 9, 18),
        endDate: new Date(currentDate.getFullYear(), 9, 18),
        kind: EventKind.MATCH_POLISH_CUP,
        label: "Puchar Polski: 1/16"
      });
    }
// --- 1/8 Pucharu Polski Twarda data
    const cupDate4 = new Date(currentDate.getFullYear(), 10, 15).setHours(0, 0, 0, 0); // Miesiąc 10 = Listopad
    if (cupDate4 >= now) {
      potentialEvents.push({
        startDate: new Date(currentDate.getFullYear(), 10, 15),
        endDate: new Date(currentDate.getFullYear(), 10, 15),
        kind: EventKind.MATCH_POLISH_CUP,
        label: "Puchar Polski: 1/8"
      });
    }
    // --- 1/4 Pucharu Polski Twarda data
    const cupDate5 = new Date(currentDate.getFullYear(), 2, 14).setHours(0, 0, 0, 0); // Miesiąc 2 = Marzec
    if (cupDate5 >= now) {
      potentialEvents.push({
        startDate: new Date(currentDate.getFullYear(), 2, 14),
        endDate: new Date(currentDate.getFullYear(), 2, 14),
        kind: EventKind.MATCH_POLISH_CUP,
        label: "Puchar Polski: 1/4"
      });
    }

    // --- 1/2 Pucharu Polski Twarda data
    const cupDate6 = new Date(currentDate.getFullYear(), 3, 18).setHours(0, 0, 0, 0); // Miesiąc 3 = Kwiecień
    if (cupDate6 >= now) {
      potentialEvents.push({
        startDate: new Date(currentDate.getFullYear(), 3, 18),
        endDate: new Date(currentDate.getFullYear(), 3, 18),
        kind: EventKind.MATCH_POLISH_CUP,
        label: "Puchar Polski: 1/2"
      });
    }
// --- Finał Pucharu Polski Twarda data
    const cupDateFinal = new Date(currentDate.getFullYear(), 4, 30).setHours(0, 0, 0, 0); // Miesiąc 4 = Maj
    if (cupDateFinal >= now) {
      potentialEvents.push({
        startDate: new Date(currentDate.getFullYear(), 4, 30),
        endDate: new Date(currentDate.getFullYear(), 4, 30),
        kind: EventKind.MATCH_POLISH_CUP,
        label: "Puchar Polski: FINAŁ"
      });
    }
    // --- KONIEC WKLEJANIA ---

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
            const foundSuperCup = fixtures.find(f => f.id === `SUPER_CUP_${currentYear}`);
            const stillToPlay = foundSuperCup ? foundSuperCup.status !== MatchStatus.FINISHED : true;
            // Sprawdzamy sztywną datę 12 lipca
            const isSuperCupDay = new Date(currentYear, 6, 12).setHours(0,0,0,0) === slotStart;
            
            if (isSuperCupDay && stillToPlay) {
              relevant = true;
              kind = EventKind.MATCH_SUPER_CUP;
            }
            break;
// KONIEC ZMIANY

         case CompetitionType.TRANSFER_WINDOW:
  relevant = true;
  kind = EventKind.TRANSFER_WINDOW;
  // Jeśli label zawiera "Letnie przygotowania", silnik Dashboardu może to specjalnie wyświetlić
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
        [EventKind.TRANSFER_WINDOW]: 7,
        [EventKind.OFF_SEASON]: 6,
        [EventKind.MATCH_POLISH_CUP]: 5, // Not used yet
        [EventKind.MATCH_EURO]: 4,       // Not used yet
        [EventKind.NONE]: 0
      };

      return priority[b.kind] - priority[a.kind];
    })[0];
  }
};