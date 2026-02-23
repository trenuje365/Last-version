
import { Fixture, Club, Player, Lineup, PreMatchStudioData, CompetitionType, PreMatchContext } from '../types';
import { PolandWeatherService } from './PolandWeatherService';
import { RefereeService } from './RefereeService';
import { OddsService } from './OddsService';
import { CommentarySelectionEngine } from './CommentarySelectionEngine';

export const PreMatchStudioService = {
  
  prepareStudioData: async (
    fixture: Fixture, 
    home: Club, 
    away: Club, 
    homeLineup: Lineup, 
    awayLineup: Lineup,
    homePlayers: Player[],
    awayPlayers: Player[]
  ): Promise<PreMatchStudioData> => {
    
    const importance = fixture.leagueId === 'CUP' || fixture.id.includes('SUPER') ? 5 : 3;
    const seed = `${fixture.id}_${fixture.date.getTime()}`;

    // 1. Weather & Referee
    const weather = PolandWeatherService.getWeather(fixture.date, seed);
    const referee = RefereeService.assignReferee(seed, importance);

    // 2. Odds
    const odds = await OddsService.getOdds(home.name, away.name, fixture.date, fixture.leagueId === 'CUP' ? CompetitionType.POLISH_CUP : CompetitionType.LEAGUE);

    // 3. Build Context for Commentary
    const context: PreMatchContext = {
      competitionType: fixture.leagueId === 'CUP' ? CompetitionType.POLISH_CUP : CompetitionType.LEAGUE,
      importanceTier: importance,
      tableGap: Math.abs(home.stats.points - away.stats.points),
      seasonPhase: fixture.date.getMonth() < 10 ? 'START' : 'END',
      homeForm: "WWLDW", // Placeholder
      awayForm: "LLDDW",
      underdogFlag: home.reputation < away.reputation - 2,
      injuryCountHome: homePlayers.filter(p => p.health.status === 'INJURED').length,
      injuryCountAway: awayPlayers.filter(p => p.health.status === 'INJURED').length
    };

    // 4. Generate Studio Transcript
    const transcript = CommentarySelectionEngine.selectLines(context, home.name, away.name, referee);

    return {
      fixture,
      homeClub: home,
      awayClub: away,
      homeLineup,
      awayLineup,
      homePlayers,
      awayPlayers,
      weather,
      referee,
      odds,
      studioTranscript: transcript
    };
  }
};
