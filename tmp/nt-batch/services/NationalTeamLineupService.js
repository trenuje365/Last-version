"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NationalTeamLineupService = void 0;
const LineupService_1 = require("./LineupService");
const pickBestFromXi = (squad, lineup, scoreFn) => {
    const xiPlayers = lineup.startingXI
        .map(id => squad.find(player => player.id === id) ?? null)
        .filter(Boolean);
    if (xiPlayers.length === 0) {
        return null;
    }
    return [...xiPlayers]
        .sort((a, b) => scoreFn(b) - scoreFn(a))[0]
        ?.id ?? null;
};
exports.NationalTeamLineupService = {
    buildMatchSelection: (team, squad, coach) => {
        const tacticId = team.tacticId || '4-4-2';
        const initialLineup = LineupService_1.LineupService.autoPickLineup(team.id, squad, tacticId, coach);
        const lineup = LineupService_1.LineupService.repairLineup(initialLineup, squad);
        return {
            lineup,
            captainId: pickBestFromXi(squad, lineup, player => (player.attributes.leadership * 1.9 +
                player.attributes.mentality * 1.3 +
                player.attributes.workRate * 0.7 +
                player.overallRating * 0.6)),
            penaltyTakerId: pickBestFromXi(squad, lineup, player => (player.attributes.penalties * 2.1 +
                player.attributes.finishing * 1.2 +
                player.attributes.technique * 0.9 +
                player.attributes.mentality * 0.8)),
            freeKickTakerId: pickBestFromXi(squad, lineup, player => (player.attributes.freeKicks * 2.0 +
                player.attributes.technique * 1.1 +
                player.attributes.passing * 0.8 +
                player.attributes.vision * 0.7)),
        };
    },
};
