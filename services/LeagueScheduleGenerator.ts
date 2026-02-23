
import { Club, SeasonTemplate, LeagueSchedule, Matchday, Fixture, MatchStatus, CompetitionType } from '../types';

export const LeagueScheduleGenerator = {

  generate: (
    clubs: Club[], 
    seasonTemplate: SeasonTemplate, 
    leagueTier: number,
    leagueId: string
  ): LeagueSchedule => {
    
    // 1. Validation of Clubs
    if (clubs.length !== 18) {
      throw new Error(`League Generation Error: Expected 18 active clubs for Tier ${leagueTier}, got ${clubs.length}`);
    }

    // 2. Extract League Slots
    // Filter strictly for League Slots and Sort Chronologically
    const leagueSlots = seasonTemplate.slots
      .filter(s => s.competition === CompetitionType.LEAGUE)
      .sort((a, b) => a.start.getTime() - b.start.getTime());

    if (leagueSlots.length < 34) {
       throw new Error(`League Generation Error: Season Template has only ${leagueSlots.length} league slots. 34 required.`);
    }

    // 3. Generate Pairings (Circle Method)
    // Create an array of team indices [0, 1, ... 17]
    const ids = clubs.map(c => c.id);
    const n = ids.length;
    const numRounds = n - 1; // 17 rounds per half-season
    const matchesPerRound = n / 2;

    // Use a shuffled copy of IDs to ensure random seeding each season
    // (Simple Fisher-Yates for seeding)
    for (let i = n - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [ids[i], ids[j]] = [ids[j], ids[i]];
    }

    const firstHalfFixtures: Array<Array<{ home: string, away: string }>> = [];

    // Circle Method Implementation
    // Fixed element: ids[0]
    // Rotating elements: ids[1]...ids[17]
    let rotating = ids.slice(1);
    const fixed = ids[0];

    for (let round = 0; round < numRounds; round++) {
      const roundMatches: { home: string, away: string }[] = [];

      // Match for the fixed team
      // Alternate home/away for the fixed team to maintain balance
      if (round % 2 === 0) {
        roundMatches.push({ home: fixed, away: rotating[rotating.length - 1] });
      } else {
        roundMatches.push({ home: rotating[rotating.length - 1], away: fixed });
      }

      // Matches for rotating teams
      for (let i = 0; i < (n / 2) - 1; i++) {
         const teamA = rotating[i];
         const teamB = rotating[rotating.length - 2 - i];
         
         // Alternate home/away based on round for better distribution
         if (round % 2 === 0) {
            roundMatches.push({ home: teamA, away: teamB });
         } else {
            roundMatches.push({ home: teamB, away: teamA });
         }
      }

      firstHalfFixtures.push(roundMatches);

      // Rotate the array (Shift right: last becomes first)
      const last = rotating.pop();
      if (last) rotating.unshift(last);
    }

    // 4. Build Matchdays (Autumn + Spring)
    const matchdays: Matchday[] = [];

    // Process Rounds 1-34
    for (let i = 0; i < 34; i++) {
       const slot = leagueSlots[i];
       const roundNum = i + 1;
       const isSecondHalf = i >= 17;
       
       // Calculate index in the 17-round cycle
       const cycleIndex = isSecondHalf ? (i - 17) : i;
       
       // Get pairings
       const basePairings = firstHalfFixtures[cycleIndex];
       
       const fixtures: Fixture[] = basePairings.map((pair, idx) => {
          // Swap home/away for second half of season
          const homeId = isSecondHalf ? pair.away : pair.home;
          const awayId = isSecondHalf ? pair.home : pair.away;
          
          return {
             id: `FIX_${leagueId}_R${roundNum}_M${idx}`,
             leagueId: leagueId,
             homeTeamId: homeId,
             awayTeamId: awayId,
             date: slot.start, // All matches start at slot start date (simplified)
             status: MatchStatus.SCHEDULED,
             homeScore: null,
             awayScore: null
          };
       });

       matchdays.push({
         roundNumber: roundNum,
         start: slot.start,
         end: slot.end,
         slotType: slot.slotType,
         fixtures: fixtures
       });
    }

    return {
       seasonStartYear: seasonTemplate.seasonStartYear,
       leagueTier,
       matchdays
    };
  }
};
