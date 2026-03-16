
import { Fixture, Club, Player, Lineup, PreMatchStudioData, CompetitionType, PreMatchContext, OddsSnapshot } from '../types';
import { PolandWeatherService } from './PolandWeatherService';
import { RefereeService } from './RefereeService';
import { OddsService } from './OddsService';
import { CommentarySelectionEngine } from './CommentarySelectionEngine';

function calcFormScore(form: ('W' | 'R' | 'P')[]): number {
  const last5 = form.slice(-5);
  const pts = last5.reduce((acc, r) => acc + (r === 'W' ? 3 : r === 'R' ? 1 : 0), 0);
  return last5.length > 0 ? pts / (last5.length * 3) : 0.5;
}

function calcSimulatedOdds(
  homeRank: number, awayRank: number, totalTeams: number,
  homeForm: ('W' | 'R' | 'P')[], awayForm: ('W' | 'R' | 'P')[],
  homeKeyInjuries: number, awayKeyInjuries: number
): OddsSnapshot {
  const posHome = totalTeams > 1 ? (totalTeams - homeRank) / (totalTeams - 1) : 0.5;
  const posAway = totalTeams > 1 ? (totalTeams - awayRank) / (totalTeams - 1) : 0.5;
  const formHome = calcFormScore(homeForm);
  const formAway = calcFormScore(awayForm);
  const injPenHome = Math.min(homeKeyInjuries * 0.06, 0.20);
  const injPenAway = Math.min(awayKeyInjuries * 0.06, 0.20);
  const strHome = Math.max(0.04, posHome * 0.55 + formHome * 0.30 - injPenHome + 0.08);
  const strAway = Math.max(0.04, posAway * 0.55 + formAway * 0.30 - injPenAway);
  const gap = Math.abs(strHome - strAway);
  const drawComponent = 0.15 + (1 - gap) * 0.25;
  const total = strHome + strAway + drawComponent;
  const MARGIN = 1.05;
  return {
    homeWin: (MARGIN / (strHome / total)).toFixed(2),
    draw: (MARGIN / (drawComponent / total)).toFixed(2),
    awayWin: (MARGIN / (strAway / total)).toFixed(2)
  };
}

export const PreMatchStudioService = {
  
  prepareStudioData: async (
    fixture: Fixture, 
    home: Club, 
    away: Club, 
    homeLineup: Lineup, 
    awayLineup: Lineup,
    homePlayers: Player[],
    awayPlayers: Player[],
    allClubs: Club[] = []
  ): Promise<PreMatchStudioData> => {
    
    const importance = fixture.leagueId === 'CUP' || fixture.id.includes('SUPER') ? 5 : 3;
    const seed = `${fixture.id}_${fixture.date.getTime()}`;

    // 1. Weather & Referee
    const weather = PolandWeatherService.getWeather(fixture.date, seed);
    const referee = RefereeService.assignReferee(seed, importance);

    // 2. Odds
    let odds = await OddsService.getOdds(home.name, away.name, fixture.date, fixture.leagueId === 'CUP' ? CompetitionType.POLISH_CUP : CompetitionType.LEAGUE);

    if (odds === null && fixture.leagueId !== 'CUP') {
      const leagueClubs = allClubs.filter(c => c.leagueId === home.leagueId);
      const sorted = [...leagueClubs].sort((a, b) => b.stats.points - a.stats.points || b.stats.goalDifference - a.stats.goalDifference);
      const homeRank = sorted.findIndex(c => c.id === home.id) + 1;
      const awayRank = sorted.findIndex(c => c.id === away.id) + 1;
      const homeKeyInjuries = homePlayers.filter(p => p.overallRating >= 75 && p.health.status === 'INJURED').length;
      const awayKeyInjuries = awayPlayers.filter(p => p.overallRating >= 75 && p.health.status === 'INJURED').length;
      odds = calcSimulatedOdds(homeRank, awayRank, leagueClubs.length, home.stats.form, away.stats.form, homeKeyInjuries, awayKeyInjuries);
    }

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
