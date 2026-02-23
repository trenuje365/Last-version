
import { LeagueSchedule, CompetitionType } from '../types';

export const LeagueScheduleValidator = {
  validate: (schedule: LeagueSchedule): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // 1. Check Round Count
    if (schedule.matchdays.length !== 34) {
       errors.push(`Invalid Round Count: Expected 34, got ${schedule.matchdays.length}`);
    }

    const teamMatchCounts: Record<string, number> = {};
    const teamHomeCounts: Record<string, number> = {};
    const teamAwayCounts: Record<string, number> = {};
    const playedPairs = new Set<string>(); // "A-B"

    schedule.matchdays.forEach(md => {
       // 2. Check Fixtures per Matchday
       if (md.fixtures.length !== 9) {
          errors.push(`Round ${md.roundNumber} has invalid match count: ${md.fixtures.length} (Expected 9)`);
       }

       const teamsInRound = new Set<string>();

       md.fixtures.forEach(fix => {
          // 3. Count Matches per Team
          teamMatchCounts[fix.homeTeamId] = (teamMatchCounts[fix.homeTeamId] || 0) + 1;
          teamMatchCounts[fix.awayTeamId] = (teamMatchCounts[fix.awayTeamId] || 0) + 1;
          
          teamHomeCounts[fix.homeTeamId] = (teamHomeCounts[fix.homeTeamId] || 0) + 1;
          teamAwayCounts[fix.awayTeamId] = (teamAwayCounts[fix.awayTeamId] || 0) + 1;

          // 4. Check Duplicate Teams in Round
          if (teamsInRound.has(fix.homeTeamId)) errors.push(`Round ${md.roundNumber}: Team ${fix.homeTeamId} plays twice.`);
          if (teamsInRound.has(fix.awayTeamId)) errors.push(`Round ${md.roundNumber}: Team ${fix.awayTeamId} plays twice.`);
          teamsInRound.add(fix.homeTeamId);
          teamsInRound.add(fix.awayTeamId);

          // 5. Check Pair Uniqueness (Directional)
          const pairKey = `${fix.homeTeamId}-${fix.awayTeamId}`;
          if (playedPairs.has(pairKey)) {
             errors.push(`Duplicate Fixture: ${pairKey} happens more than once.`);
          }
          playedPairs.add(pairKey);
       });
    });

    // 6. Verify Totals
    Object.keys(teamMatchCounts).forEach(teamId => {
       if (teamMatchCounts[teamId] !== 34) {
          errors.push(`Team ${teamId} has incorrect total matches: ${teamMatchCounts[teamId]} (Expected 34).`);
       }
       if (teamHomeCounts[teamId] !== 17) {
         errors.push(`Team ${teamId} has unbalanced home matches: ${teamHomeCounts[teamId]} (Expected 17).`);
       }
       if (teamAwayCounts[teamId] !== 17) {
         errors.push(`Team ${teamId} has unbalanced away matches: ${teamAwayCounts[teamId]} (Expected 17).`);
       }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }
};
