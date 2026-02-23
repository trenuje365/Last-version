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


// 1. Sprawdzanie wszystkich slotów z szablonu sezonu
    if (seasonTemplate) {
      seasonTemplate.slots.forEach(slot => {
        const slotStart = new Date(slot.start).setHours(0, 0, 0, 0);
        if (slotStart < now) return;

        let kind = EventKind.NONE;
        let label = slot.label;
        let opponentClubId: string | undefined;
        let isHome: boolean | undefined;

        // Mapowanie typów rozgrywek na EventKind
        switch (slot.competition) {
          case CompetitionType.LEAGUE:
            kind = EventKind.MATCH_LEAGUE;
            // Szukanie przeciwnika w terminarzu
            const roundMatch = label.match(/Kolejka (\d+)/);
            if (roundMatch) {
              const roundNum = parseInt(roundMatch[1]);
              const matchday = schedules[userTier]?.matchdays[roundNum - 1];
              const fix = matchday?.fixtures.find(f => f.homeTeamId === userTeamId || f.awayTeamId === userTeamId);
              if (fix) {
                opponentClubId = fix.homeTeamId === userTeamId ? fix.awayTeamId : fix.homeTeamId;
                isHome = fix.homeTeamId === userTeamId;
              }
            }
            break;
          case CompetitionType.POLISH_CUP:
            kind = EventKind.MATCH_POLISH_CUP;
            break;
          case CompetitionType.SUPER_CUP:
            kind = EventKind.MATCH_SUPER_CUP;
            break;
          case CompetitionType.TRANSFER_WINDOW:
            kind = EventKind.TRANSFER_WINDOW;
            break;
        }

        // ZABEZPIECZENIE: Filtrujemy zdarzenia, które nie mają jeszcze logiki (np. REPREZENTACJA)
        // Jeśli etykieta to "REPREZENTACJA", nie dodajemy jej jako "Next Stop" - Dashboard pokaże "NASTĘPNY DZIEŃ"
        if (label === "REPREZENTACJA") return;

        potentialEvents.push({
          startDate: slot.start,
          endDate: slot.start,
          kind: kind,
          label: label,
          opponentClubId,
          isHome
        });
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