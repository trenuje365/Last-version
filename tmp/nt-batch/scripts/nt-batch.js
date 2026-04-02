"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("../constants");
const NationalTeamSchedule_1 = require("../resources/NationalTeamSchedule");
const types_1 = require("../types");
const CoachService_1 = require("../services/CoachService");
const NationalTeamService_1 = require("../services/NationalTeamService");
const NationalTeamSimulator_1 = require("../services/NationalTeamSimulator");
const SquadGeneratorService_1 = require("../services/SquadGeneratorService");
const ITERATIONS = Number(process.env.NT_BATCH_ITERATIONS ?? 600);
const clonePlayers = (players) => Object.fromEntries(Object.entries(players).map(([clubId, squad]) => [clubId, structuredClone(squad)]));
const buildWorld = () => {
    const players = {};
    constants_1.STATIC_CLUBS.forEach(club => {
        players[club.id] = SquadGeneratorService_1.SquadGeneratorService.generateSquadForClub(club.id);
    });
    const nationalTeams = NationalTeamService_1.NationalTeamService.initializeNationalTeams();
    const ntCoachList = CoachService_1.CoachService.generateNationalTeamCoaches();
    const { updatedTeams, updatedCoaches } = NationalTeamService_1.NationalTeamService.assignCoachesToNationalTeams(nationalTeams, ntCoachList);
    const ntSquadResult = NationalTeamService_1.NationalTeamService.generateAllSquads(updatedTeams, updatedCoaches, players);
    const mergedPlayers = clonePlayers(players);
    mergedPlayers.FREE_AGENTS = structuredClone(ntSquadResult.newPlayers);
    ntSquadResult.playerUpdates.forEach(update => {
        for (const squad of Object.values(mergedPlayers)) {
            const player = squad.find(candidate => candidate.id === update.id);
            if (player) {
                player.assignedNationalTeamId = update.assignedNationalTeamId;
                break;
            }
        }
    });
    const coaches = {};
    Object.values(updatedCoaches).forEach(coach => {
        coaches[coach.id] = structuredClone(coach);
    });
    return {
        nationalTeams: structuredClone(ntSquadResult.updatedTeams),
        players: mergedPlayers,
        coaches,
    };
};
const summarizeMatch = (result) => {
    const cards = result.cards ?? [];
    const yellows = cards.filter(card => card.type === 'YELLOW' || card.type === 'SECOND_YELLOW').length;
    const reds = cards.filter(card => card.type === 'RED' || card.type === 'SECOND_YELLOW').length;
    const awardedPens = (result.timeline ?? []).filter(event => event.type === types_1.MatchEventType.PENALTY_AWARDED).length;
    const scoredPens = (result.goals ?? []).filter(goal => goal.isPenalty).length;
    return {
        goals: result.homeGoals + result.awayGoals,
        yellows,
        reds,
        awardedPens,
        scoredPens,
    };
};
const summary = {
    matches: 0,
    totalGoals: 0,
    totalYellows: 0,
    totalReds: 0,
    totalPensAwarded: 0,
    totalPensScored: 0,
    matchesWithRed: 0,
    matchesWithTwoPlusReds: 0,
    matchesWithSevenPlusYellows: 0,
    maxYellows: 0,
    maxReds: 0,
};
const season = 2025;
const matchDays = NationalTeamSchedule_1.NT_SCHEDULE_BY_YEAR[season] ?? [];
const baseWorld = buildWorld();
for (let iteration = 0; iteration < ITERATIONS; iteration++) {
    for (let idx = 0; idx < matchDays.length; idx++) {
        const matchDay = matchDays[idx];
        const currentDate = new Date(season, matchDay.month, matchDay.day);
        const simulation = NationalTeamSimulator_1.NationalTeamSimulator.simulateMatchDay(matchDay, 100000 + iteration * 100 + idx, currentDate, structuredClone(baseWorld.nationalTeams), clonePlayers(baseWorld.players), structuredClone(baseWorld.coaches), 1);
        simulation.results.forEach(result => {
            const match = summarizeMatch(result);
            summary.matches += 1;
            summary.totalGoals += match.goals;
            summary.totalYellows += match.yellows;
            summary.totalReds += match.reds;
            summary.totalPensAwarded += match.awardedPens;
            summary.totalPensScored += match.scoredPens;
            if (match.reds > 0)
                summary.matchesWithRed += 1;
            if (match.reds >= 2)
                summary.matchesWithTwoPlusReds += 1;
            if (match.yellows >= 7)
                summary.matchesWithSevenPlusYellows += 1;
            summary.maxYellows = Math.max(summary.maxYellows, match.yellows);
            summary.maxReds = Math.max(summary.maxReds, match.reds);
        });
    }
}
const avg = (value) => value / summary.matches;
const pct = (value) => (value / summary.matches) * 100;
console.log(JSON.stringify({
    iterations: ITERATIONS,
    matchDays: matchDays.length,
    matches: summary.matches,
    avgGoalsPerMatch: Number(avg(summary.totalGoals).toFixed(3)),
    avgYellowsPerMatch: Number(avg(summary.totalYellows).toFixed(3)),
    avgRedsPerMatch: Number(avg(summary.totalReds).toFixed(3)),
    avgPensAwardedPerMatch: Number(avg(summary.totalPensAwarded).toFixed(3)),
    avgPensScoredPerMatch: Number(avg(summary.totalPensScored).toFixed(3)),
    pctMatchesWithRed: Number(pct(summary.matchesWithRed).toFixed(2)),
    pctMatchesWithTwoPlusReds: Number(pct(summary.matchesWithTwoPlusReds).toFixed(2)),
    pctMatchesWithSevenPlusYellows: Number(pct(summary.matchesWithSevenPlusYellows).toFixed(2)),
    maxYellowsInMatch: summary.maxYellows,
    maxRedsInMatch: summary.maxReds,
}, null, 2));
process.exit(0);
