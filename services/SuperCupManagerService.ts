import { Fixture, MatchStatus, ViewState } from '../types';

export const SuperCupManagerService = {
  // Pobiera fixture dla aktualnego sezonu
  getCurrentFixture: (fixtures: Fixture[], year: number) => {
    return fixtures.find(f => f.id === `SUPER_CUP_${year}`);
  },

  // Sprawdza czy gracz gra w tym meczu
  isUserParticipant: (fixture: Fixture, userTeamId: string | null) => {
    if (!userTeamId || !fixture) return false;
    return fixture.homeTeamId === userTeamId || fixture.awayTeamId === userTeamId;
  },

  // Logika decyzji dla przycisku
  handleAction: (
    fixture: Fixture, 
    userTeamId: string | null, 
    navigateTo: (v: ViewState) => void,
    processBackground: () => void
  ) => {
    const isUserIn = SuperCupManagerService.isUserParticipant(fixture, userTeamId);
    if (isUserIn) {
      navigateTo(ViewState.PRE_MATCH_CUP_STUDIO);
    } else {
      processBackground(); // Rozegranie w tle
      navigateTo(ViewState.SCORE_RESULTS_POLISH_CUP);
    }
  }
};