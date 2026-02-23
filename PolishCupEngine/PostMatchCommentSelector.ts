
import { MatchSummary, PlayerPerformance, PlayerPosition } from '../types';
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

    // Goal Diff Tags - Jeśli doszło do karnych, to ZAWSZE jest to "mecz stykowy"
    const absDiff = Math.abs(diff);
    if (wentToPenalties || absDiff <= 1) {
      tags.push('CLOSE_GAME');
    } else if (absDiff === 2) {
      tags.push('COMFORT_WIN');
    } else {
      tags.push('DOMINANT_WIN');
    }

    // Goal Total Tags
    const totalGoals = summary.homeScore + summary.awayScore;
    if (totalGoals >= 5) tags.push('GOAL_FEST');
    else if (totalGoals <= 1) tags.push('LOW_SCORING');

    // Clean Sheet
    if (summary.homeScore === 0) tags.push('CLEAN_SHEET_AWAY');
    if (summary.awayScore === 0) tags.push('CLEAN_SHEET_HOME');

    // Discipline
    const totalYellows = summary.homeStats.yellowCards + summary.awayStats.yellowCards;
    if (totalYellows >= 5) tags.push('MANY_YELLOWS');
    if (summary.homeStats.redCards > 0 || summary.awayStats.redCards > 0) tags.push('RED_CARD');

    // Player feats
    const allPlayers = [...summary.homePlayers, ...summary.awayPlayers];
    if (allPlayers.some(p => p.goals >= 3)) tags.push('HATTRICK');
    else if (allPlayers.some(p => p.goals === 2)) tags.push('BRACE');
    if (allPlayers.some(p => p.assists >= 2)) tags.push('TOP_ASSISTS');

    return tags;
  },

  /**
   * Selects a professional comment matching the generated tags.
   */
  selectComment: (summary: MatchSummary): string => {
    const tags = PostMatchCommentSelector.generateTags(summary);
    let pool = POSTMATCH_EXPERT_COMMENTS_DB.filter(c => 
      c.tags.some(t => tags.includes(t))
    );
    if (pool.length === 0) {
      pool = POSTMATCH_EXPERT_COMMENTS_DB.filter(c => c.tags.includes('GENERIC'));
    }
    const seed = summary.matchId.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const index = seed % pool.length;
    return pool[index].text;
  }
};
