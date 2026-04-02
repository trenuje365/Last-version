import { Coach, Lineup, NationalTeam, Player } from '../types';
import { LineupService } from './LineupService';

export interface NationalTeamMatchSelection {
  lineup: Lineup;
  captainId: string | null;
  penaltyTakerId: string | null;
  freeKickTakerId: string | null;
}

const pickBestFromXi = (
  squad: Player[],
  lineup: Lineup,
  scoreFn: (player: Player) => number
): string | null => {
  const xiPlayers = lineup.startingXI
    .map(id => squad.find(player => player.id === id) ?? null)
    .filter(Boolean) as Player[];

  if (xiPlayers.length === 0) {
    return null;
  }

  return [...xiPlayers]
    .sort((a, b) => scoreFn(b) - scoreFn(a))[0]
    ?.id ?? null;
};

export const NationalTeamLineupService = {
  buildMatchSelection: (
    team: NationalTeam,
    squad: Player[],
    coach: Coach | null
  ): NationalTeamMatchSelection => {
    const tacticId = team.tacticId || '4-4-2';
    const initialLineup = LineupService.autoPickLineup(team.id, squad, tacticId, coach);
    const lineup = LineupService.repairLineup(initialLineup, squad);

    return {
      lineup,
      captainId: pickBestFromXi(
        squad,
        lineup,
        player => (
          player.attributes.leadership * 1.9 +
          player.attributes.mentality * 1.3 +
          player.attributes.workRate * 0.7 +
          player.overallRating * 0.6
        )
      ),
      penaltyTakerId: pickBestFromXi(
        squad,
        lineup,
        player => (
          player.attributes.penalties * 2.1 +
          player.attributes.finishing * 1.2 +
          player.attributes.technique * 0.9 +
          player.attributes.mentality * 0.8
        )
      ),
      freeKickTakerId: pickBestFromXi(
        squad,
        lineup,
        player => (
          player.attributes.freeKicks * 2.0 +
          player.attributes.technique * 1.1 +
          player.attributes.passing * 0.8 +
          player.attributes.vision * 0.7
        )
      ),
    };
  },
};
