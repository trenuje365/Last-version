
import { MatchSummary, PlayerPerformance, PlayerPosition, MatchEventType } from '../types';
import { POSTMATCH_EXPERT_COMMENTS_DB, ExpertComment } from '../data/postmatch_expert_comments_pl';

export const PostMatchCommentSelector = {
  /**
   * Calculates a match rating (1.0 - 10.0) based on performance data.
   */
  calculateRating: (p: PlayerPerformance, teamGoalsAgainst: number): number => {
    let r = 6.0;
    

    
// Universal Events
    r += p.goals * 1.5;
    r += p.assists * 0.8;
    
    // Universal Penalties
    r -= p.yellowCards * 0.5;
    r -= p.redCards * 3.0;
    r -= p.missedPenalties * 2.0;

    // Failsafe for other positions (not affected by unit rules yet)
    if (p.position === PlayerPosition.MID || p.position === PlayerPosition.FWD) {
       r += (Math.random() * 1.0 - 0.5); // Subtle variation
    }
    
    return Math.min(10.0, Math.max(1.0, parseFloat(r.toFixed(1))));
  },

  /**
   * Calculates the Man of the Match based on points.
   */
  calculateMOTM: (summary: MatchSummary): PlayerPerformance | null => {
    const allPlayers = [...summary.homePlayers, ...summary.awayPlayers];
    if (allPlayers.length === 0) return null;

    return [...allPlayers].sort((a, b) => (b.rating || 0) - (a.rating || 0))[0];
  },

  /**
   * Generates tags based on match data to filter commentary.
   */
  generateTags: (summary: MatchSummary): string[] => {
    const tags: string[] = [];
    const isUserHome = summary.homeClub.id === summary.userTeamId;
    const userScore = isUserHome ? summary.homeScore : summary.awayScore;
    const oppScore = isUserHome ? summary.awayScore : summary.homeScore;
    const diff = userScore - oppScore;

    // Sprawdzamy czy był remis i czy doszło do karnych (kluczowe w pucharach)
    const isPenaltyWin = (userScore === oppScore) && (
      (isUserHome && (summary.homePenaltyScore || 0) > (summary.awayPenaltyScore || 0)) ||
      (!isUserHome && (summary.awayPenaltyScore || 0) > (summary.homePenaltyScore || 0))
    );
    const wentToPenalties = (userScore === oppScore) && summary.homePenaltyScore !== undefined;

    // Result Tags (Puchary nie znają remisu jako wyniku końcowego)
    if (diff > 0 || isPenaltyWin) {
      tags.push('WIN');
    } else if (diff === 0 && !wentToPenalties) {
      tags.push('DRAW');
    } else {
      tags.push('LOSS');
    }

    // Goal Diff / Match Shape Tags
    const absDiff = Math.abs(diff);
    if (absDiff >= 4) {
      tags.push('BLOWOUT');
    } else if (wentToPenalties || absDiff <= 1) {
      tags.push('CLOSE_GAME');
    } else if (absDiff === 2) {
      tags.push('COMFORT_WIN');
    } else {
      tags.push('DOMINANT_WIN');
    }

    // Goal Total Tags
    const totalGoals = summary.homeScore + summary.awayScore;
    if (totalGoals >= 6 && diff === 0 && !wentToPenalties) tags.push('HIGH_SCORE_DRAW');
    if (totalGoals >= 5) tags.push('GOAL_FEST');
    else if (totalGoals <= 1) tags.push('LOW_SCORING');

    // Clean Sheet for user's team
    if ((isUserHome && summary.awayScore === 0) || (!isUserHome && summary.homeScore === 0)) {
      tags.push('CLEAN_SHEET');
    }

    // Discipline
    const totalYellows = summary.homeStats.yellowCards + summary.awayStats.yellowCards;
    if (totalYellows >= 7) tags.push('STRICT_REFEREE');
    else if (totalYellows >= 5) tags.push('MANY_YELLOWS');
    const userRedCards = isUserHome ? summary.homeStats.redCards : summary.awayStats.redCards;
    if (userRedCards > 0) tags.push('RED_CARD_USER');
    if (summary.homeStats.redCards > 0 || summary.awayStats.redCards > 0) tags.push('RED_CARD');

    // Player feats
    const allPlayers = [...summary.homePlayers, ...summary.awayPlayers];
    if (allPlayers.some(p => p.goals >= 3)) tags.push('HATTRICK');
    else if (allPlayers.some(p => p.goals === 2)) tags.push('BRACE');
    if (allPlayers.some(p => p.assists >= 2)) tags.push('TOP_ASSISTS');

    // Severe injury in match timeline
    if (summary.timeline.some(e => e.type === MatchEventType.INJURY_SEVERE)) {
      tags.push('SEVERE_INJURY');
    }

    // Late penalty (minute >= 80)
    if (summary.timeline.some(e =>
      (e.type === MatchEventType.PENALTY_SCORED ||
       e.type === MatchEventType.PENALTY_MISSED ||
       e.type === MatchEventType.PENALTY_AWARDED) &&
      e.minute >= 80
    )) tags.push('LATE_PENALTY');

    // Goal timeline analysis
    const allGoalEvents = [
      ...summary.homeGoals.map(g => ({ minute: g.minute, side: 'HOME' as const })),
      ...summary.awayGoals.map(g => ({ minute: g.minute, side: 'AWAY' as const })),
    ].sort((a, b) => a.minute - b.minute);

    if (diff !== 0 && !isPenaltyWin) {
      // Last-minute winner: track the last goal that put the eventual winner ahead
      // (from level or behind) and check whether it happened in minute >= 80
      const winnerSide = summary.homeScore > summary.awayScore ? 'HOME' : 'AWAY';
      let lastDecisiveMinute = -1;
      let runH = 0; let runA = 0;
      for (const g of allGoalEvents) {
        const prevDiff = runH - runA;
        if (g.side === 'HOME') runH++; else runA++;
        const newDiff = runH - runA;
        if (g.side === winnerSide) {
          const winnerNowLeading = winnerSide === 'HOME' ? newDiff > 0 : newDiff < 0;
          const winnerWasNotLeading = winnerSide === 'HOME' ? prevDiff <= 0 : prevDiff >= 0;
          if (winnerNowLeading && winnerWasNotLeading) lastDecisiveMinute = g.minute;
        } else {
          // Opponent goal – reset if winner loses the lead
          if (winnerSide === 'HOME' ? newDiff <= 0 : newDiff >= 0) lastDecisiveMinute = -1;
        }
      }
      if (lastDecisiveMinute >= 80) tags.push('LAST_MINUTE_WINNER');

      // Comeback win: user was losing at some point but came back and won
      if (diff > 0) {
        let runH2 = 0; let runA2 = 0;
        for (const g of allGoalEvents) {
          if (g.side === 'HOME') runH2++; else runA2++;
          const uS = isUserHome ? runH2 : runA2;
          const oS = isUserHome ? runA2 : runH2;
          if (oS > uS) { tags.push('COMEBACK_WIN'); break; }
        }
      }
    }

    return tags;
  },

  /**
   * Selects a professional comment matching the generated tags.
   */
  selectComment: (summary: MatchSummary): string => {
    const tags = PostMatchCommentSelector.generateTags(summary);
    const RESULT_TAGS = ['WIN', 'DRAW', 'LOSS'];
    // Shape/condition tags that are exclusive: if a comment declares one, the match must also have it
    const EXCLUSIVE_SHAPE_TAGS = new Set([
      'CLOSE_GAME', 'DOMINANT_WIN', 'COMFORT_WIN', 'CLEAN_SHEET',
      'LOW_SCORING', 'GOAL_FEST', 'HIGH_SCORE_DRAW', 'BLOWOUT',
      'LAST_MINUTE_WINNER', 'LATE_PENALTY', 'COMEBACK_WIN',
      'HATTRICK', 'BRACE', 'RED_CARD', 'RED_CARD_USER',
      'SEVERE_INJURY', 'SHOTS_DOMINANCE', 'STRICT_REFEREE',
      'MANY_YELLOWS', 'TOP_ASSISTS', 'PENALTY_MISSED',
    ]);
    let pool = POSTMATCH_EXPERT_COMMENTS_DB.filter(c => {
      // Reject comments whose result tag (WIN/DRAW/LOSS) conflicts with this match's result
      const hasConflictingResult = c.tags.some(t => RESULT_TAGS.includes(t) && !tags.includes(t));
      if (hasConflictingResult) return false;
      // Reject comments that require a specific condition the match doesn't have
      const hasConflictingShape = c.tags.some(t => EXCLUSIVE_SHAPE_TAGS.has(t) && !tags.includes(t));
      if (hasConflictingShape) return false;
      return c.tags.some(t => tags.includes(t));
    });
    if (pool.length === 0) {
      pool = POSTMATCH_EXPERT_COMMENTS_DB.filter(c => c.tags.includes('GENERIC'));
    }
    const seed = summary.matchId.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const index = seed % pool.length;
    return pool[index].text;
  }
};
