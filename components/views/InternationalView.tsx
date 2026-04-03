import React, { useMemo, useState } from 'react';
import { useGame } from '../../context/GameContext';
import { NT_SCHEDULE_BY_YEAR } from '../../resources/NationalTeamSchedule';
import { MatchHistoryService } from '../../services/MatchHistoryService';
import polskaBgImg from '../../Graphic/themes/polska.png';

const SUBHEADING = 'text-[10px] font-black uppercase tracking-[0.25em] text-slate-500';
const POLAND_GROUP_LABEL = 'Grupa G';

interface Tournament {
  id: string;
  label: string;
}

interface PlayedMatch {
  round: number;
  dateLabel: string;
  home: string;
  away: string;
  homeGoals: number;
  awayGoals: number;
}

interface GroupTeam {
  name: string;
  M: number;
  W: number;
  D: number;
  L: number;
  GF: number;
  GA: number;
  pts: number;
}

const TOURNAMENTS: Tournament[] = [
  { id: 'wcq2026', label: 'Kwalifikacje do MŚ 2026' },
];

const WCQ_PLAYED: PlayedMatch[] = [
  { round: 1, dateLabel: '21 MAR', home: 'Malta', away: 'Finlandia', homeGoals: 0, awayGoals: 1 },
  { round: 1, dateLabel: '21 MAR', home: 'Polska', away: 'Litwa', homeGoals: 1, awayGoals: 0 },
  { round: 2, dateLabel: '24 MAR', home: 'Polska', away: 'Malta', homeGoals: 2, awayGoals: 0 },
  { round: 2, dateLabel: '24 MAR', home: 'Litwa', away: 'Finlandia', homeGoals: 2, awayGoals: 2 },
  { round: 3, dateLabel: '7 CZE', home: 'Finlandia', away: 'Holandia', homeGoals: 0, awayGoals: 2 },
  { round: 3, dateLabel: '7 CZE', home: 'Malta', away: 'Litwa', homeGoals: 0, awayGoals: 0 },
  { round: 4, dateLabel: '10 CZE', home: 'Finlandia', away: 'Polska', homeGoals: 2, awayGoals: 1 },
  { round: 4, dateLabel: '10 CZE', home: 'Holandia', away: 'Malta', homeGoals: 8, awayGoals: 0 },
];

const MONTH_SHORT: Record<number, string> = {
  0: 'STY',
  1: 'LUT',
  2: 'MAR',
  3: 'KWI',
  4: 'MAJ',
  5: 'CZE',
  6: 'LIP',
  7: 'SIE',
  8: 'WRZ',
  9: 'PAŹ',
  10: 'LIS',
  11: 'GRU',
};

const fixtureKey = (home: string, away: string) => `${home}__${away}`;

function computeStandings(played: PlayedMatch[]): GroupTeam[] {
  const map: Record<string, GroupTeam> = {};

  const ensure = (name: string) => {
    if (!map[name]) {
      map[name] = { name, M: 0, W: 0, D: 0, L: 0, GF: 0, GA: 0, pts: 0 };
    }
  };

  for (const match of played) {
    ensure(match.home);
    ensure(match.away);

    const home = map[match.home];
    const away = map[match.away];

    home.M += 1;
    away.M += 1;
    home.GF += match.homeGoals;
    home.GA += match.awayGoals;
    away.GF += match.awayGoals;
    away.GA += match.homeGoals;

    if (match.homeGoals > match.awayGoals) {
      home.W += 1;
      away.L += 1;
      home.pts += 3;
    } else if (match.homeGoals < match.awayGoals) {
      away.W += 1;
      home.L += 1;
      away.pts += 3;
    } else {
      home.D += 1;
      away.D += 1;
      home.pts += 1;
      away.pts += 1;
    }
  }

  return Object.values(map).sort(
    (a, b) => b.pts - a.pts || (b.GF - b.GA) - (a.GF - a.GA) || b.GF - a.GF
  );
}

const formatDateLabel = (dateValue: string) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getDate()} ${MONTH_SHORT[date.getMonth()] ?? '???'}`;
};

const StandingRow: React.FC<{ team: GroupTeam; rank: number }> = ({ team, rank }) => {
  const isPoland = team.name === 'Polska';
  const gd = team.GF - team.GA;
  const gdDisplay = gd > 0 ? `+${gd}` : `${gd}`;
  const rowCellClass =
    rank === 1 ? 'bg-amber-400/30' :
    rank === 2 ? 'bg-sky-400/20' :
    '';
  const firstCellClass =
    rank === 1 ? 'border-l-4 border-amber-300' :
    rank === 2 ? 'border-l-4 border-sky-400' :
    '';
  const rankColor =
    rank === 1 ? 'text-amber-300' :
    rank === 2 ? 'text-sky-400' :
    'text-slate-500';

  return (
    <tr className="h-12 transition-all hover:bg-white/[0.02]">
      <td className={`pl-6 w-12 ${rowCellClass} ${firstCellClass}`}>
        <span className={`font-black font-mono text-sm ${rankColor}`}>
          {String(rank).padStart(2, '0')}
        </span>
      </td>
      <td className={`text-left min-w-[140px] ${rowCellClass}`}>
        <span className={`text-sm font-black uppercase italic tracking-tight ${isPoland ? 'text-amber-300' : 'text-slate-300'}`}>
          {team.name}
        </span>
      </td>
      <td className={`text-center font-bold text-slate-400 font-mono text-sm w-10 ${rowCellClass}`}>{team.M}</td>
      <td className={`text-center font-bold text-slate-500 font-mono text-xs w-10 ${rowCellClass}`}>{team.W}</td>
      <td className={`text-center font-bold text-slate-500 font-mono text-xs w-10 ${rowCellClass}`}>{team.D}</td>
      <td className={`text-center font-bold text-slate-500 font-mono text-xs w-10 ${rowCellClass}`}>{team.L}</td>
      <td className={`text-center font-bold text-slate-600 font-mono text-[10px] w-16 ${rowCellClass}`}>{team.GF}:{team.GA}</td>
      <td className={`text-center font-bold text-slate-500 font-mono text-xs w-14 ${rowCellClass}`}>{gdDisplay}</td>
      <td className={`text-center pr-6 w-16 ${rowCellClass}`}>
        <span className={`text-lg font-black font-mono tabular-nums ${isPoland ? 'text-amber-300' : 'text-slate-300'}`}>
          {team.pts}
        </span>
      </td>
    </tr>
  );
};

interface ScheduleCardProps {
  home: string;
  away: string;
  dateLabel: string;
  played: boolean;
  homeGoals?: number;
  awayGoals?: number;
}

const ScheduleCard: React.FC<ScheduleCardProps> = ({ home, away, dateLabel, played, homeGoals, awayGoals }) => {
  const isPolandGame = home === 'Polska' || away === 'Polska';

  return (
    <div
      className={`flex items-center h-16 px-6 rounded-2xl mb-2 border transition-all ${
        isPolandGame ? 'bg-white/[0.07] border-white/15' : 'bg-white/[0.02] border-white/[0.04]'
      }`}
    >
      <div className="w-20 shrink-0 text-left">
        <p className={`text-[9px] font-black uppercase tracking-widest ${played ? 'text-slate-400' : 'text-blue-500'}`}>
          {dateLabel}
        </p>
        <p className={`text-[8px] font-black uppercase tracking-wider mt-0.5 ${played ? 'text-slate-600' : 'text-slate-700'}`}>
          {played ? 'FT' : '–'}
        </p>
      </div>

      <div className="flex-1 text-right pr-4">
        <span className={`text-sm font-black uppercase italic tracking-tight ${home === 'Polska' ? 'text-white' : 'text-slate-300'}`}>
          {home}
        </span>
      </div>

      <div className="w-24 flex justify-center items-center shrink-0">
        {played ? (
          <div className="bg-black/50 px-4 py-1.5 rounded-xl border border-white/10">
            <span className="text-base font-black font-mono text-emerald-400 tabular-nums tracking-tight">
              {homeGoals} : {awayGoals}
            </span>
          </div>
        ) : (
          <span className="text-xs font-black italic text-slate-700 tracking-widest">VS</span>
        )}
      </div>

      <div className="flex-1 text-left pl-4">
        <span className={`text-sm font-black uppercase italic tracking-tight ${away === 'Polska' ? 'text-white' : 'text-slate-300'}`}>
          {away}
        </span>
      </div>
    </div>
  );
};

const InternationalView: React.FC = () => {
  const { nationalTeams, currentDate, lastNTMatchResults } = useGame();
  const [activeTournament, setActiveTournament] = useState<string>('wcq2026');
  const upcomingSchedule = NT_SCHEDULE_BY_YEAR[2025] ?? [];

  const { standings, playedRounds, scheduledResults, maxPlayedRound } = useMemo(() => {
    const scheduleMeta = new Map<string, { round: number; dateLabel: string }>();
    upcomingSchedule.forEach((matchDay, roundOffset) => {
      const round = 5 + roundOffset;
      const dateLabel = `${matchDay.day} ${MONTH_SHORT[matchDay.month] ?? '???'}`;
      matchDay.matches.forEach(match => {
        scheduleMeta.set(fixtureKey(match.home, match.away), { round, dateLabel });
      });
    });

    const groupTeams = new Set<string>();
    WCQ_PLAYED.forEach(match => {
      groupTeams.add(match.home);
      groupTeams.add(match.away);
    });
    upcomingSchedule.forEach(matchDay => {
      matchDay.matches.forEach(match => {
        groupTeams.add(match.home);
        groupTeams.add(match.away);
      });
    });

    const ntNameById = new Map(nationalTeams.map(team => [team.id, team.name]));
    const historyMatches = MatchHistoryService.getAll()
      .filter(entry =>
        entry.competition.includes('Kwalifikacje') &&
        groupTeams.has(ntNameById.get(entry.homeTeamId) ?? '') &&
        groupTeams.has(ntNameById.get(entry.awayTeamId) ?? '')
      )
      .map<PlayedMatch | null>(entry => {
        const home = ntNameById.get(entry.homeTeamId) ?? '';
        const away = ntNameById.get(entry.awayTeamId) ?? '';
        if (!home || !away) return null;

        const meta = scheduleMeta.get(fixtureKey(home, away));
        return {
          round: meta?.round ?? 0,
          dateLabel: meta?.dateLabel ?? formatDateLabel(entry.date),
          home,
          away,
          homeGoals: entry.homeScore,
          awayGoals: entry.awayScore,
        };
      })
      .filter((match): match is PlayedMatch => !!match);

    const playedByKey = new Map<string, PlayedMatch>();
    [...WCQ_PLAYED, ...historyMatches].forEach(match => {
      playedByKey.set(fixtureKey(match.home, match.away), match);
    });

    const groupedPlayed: Record<number, PlayedMatch[]> = {};
    [...playedByKey.values()].forEach(match => {
      if (!groupedPlayed[match.round]) groupedPlayed[match.round] = [];
      groupedPlayed[match.round].push(match);
    });

    const roundsPlayed = [...playedByKey.values()].map(match => match.round).filter(round => round > 0);

    return {
      standings: computeStandings([...playedByKey.values()]),
      playedRounds: groupedPlayed,
      scheduledResults: playedByKey,
      maxPlayedRound: roundsPlayed.length ? Math.max(...roundsPlayed) : 4,
    };
  }, [nationalTeams, currentDate, lastNTMatchResults, upcomingSchedule]);

  return (
    <div className="relative flex-1 bg-slate-900/30 rounded-[40px] border border-white/5 shadow-2xl flex flex-col overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-[0.22] pointer-events-none"
        style={{ backgroundImage: `url(${polskaBgImg})` }}
      />
      <div className="absolute inset-0 bg-slate-950/35 pointer-events-none" />

      <div className="relative z-10 flex gap-2 px-6 pt-5 pb-0 shrink-0 border-b border-white/5">
        {TOURNAMENTS.map(tournament => (
          <button
            key={tournament.id}
            onClick={() => setActiveTournament(tournament.id)}
            className={`px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all border-b-2 -mb-px rounded-t-xl ${
              activeTournament === tournament.id
                ? 'border-amber-400 text-white bg-white/[0.04]'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            {tournament.label}
          </button>
        ))}
      </div>

      {activeTournament === 'wcq2026' && (
        <div className="relative z-10 flex-1 overflow-y-auto custom-scrollbar p-6">
          <div className="max-w-5xl mx-auto flex flex-col gap-8">
            <section>
              <div className="flex items-center gap-3 mb-4">
                <span className={SUBHEADING}>{POLAND_GROUP_LABEL}</span>
                <div className="flex-1 h-px bg-white/5" />
                <span className={SUBHEADING}>Po kolejce {maxPlayedRound} z 10</span>
              </div>

              <div className="bg-black/20 rounded-[28px] border border-white/5 overflow-hidden">
                <table className="w-full text-left border-separate border-spacing-y-0 table-fixed">
                  <thead>
                    <tr className={`${SUBHEADING} h-10`}>
                      <th className="pl-6 w-12">#</th>
                      <th className="text-left min-w-[140px]">Drużyna</th>
                      <th className="text-center w-10">M</th>
                      <th className="text-center w-10">W</th>
                      <th className="text-center w-10">R</th>
                      <th className="text-center w-10">P</th>
                      <th className="text-center w-16">Bramki</th>
                      <th className="text-center w-14">+/-</th>
                      <th className="text-center w-16 pr-6 text-amber-400">Pkt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((team, index) => (
                      <StandingRow key={team.name} team={team} rank={index + 1} />
                    ))}
                  </tbody>
                </table>

                <div className="flex gap-6 px-6 py-3 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-amber-300/20 border border-amber-300/50" />
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Bezpośredni awans (1)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-sky-400/20 border border-sky-400/40" />
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Baraże (2)</span>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-4">
                <span className={SUBHEADING}>Terminarz — {POLAND_GROUP_LABEL}</span>
                <div className="flex-1 h-px bg-white/5" />
              </div>

              {Object.entries(playedRounds)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([roundNum, matches]) => (
                  <div key={roundNum} className="mb-6">
                    <p className={`${SUBHEADING} mb-3`}>Kolejka {roundNum}</p>
                    {matches.map(match => (
                      <ScheduleCard
                        key={fixtureKey(match.home, match.away)}
                        home={match.home}
                        away={match.away}
                        dateLabel={match.dateLabel}
                        played={true}
                        homeGoals={match.homeGoals}
                        awayGoals={match.awayGoals}
                      />
                    ))}
                  </div>
                ))}

              {upcomingSchedule.map((matchDay, roundOffset) => {
                const roundNum = 5 + roundOffset;
                const dateLabel = `${matchDay.day} ${MONTH_SHORT[matchDay.month] ?? '???'}`;
                const matchesForRound = matchDay.matches.filter(match => !scheduledResults.has(fixtureKey(match.home, match.away)));
                if (!matchesForRound.length) return null;

                return (
                  <div key={roundNum} className="mb-6">
                    <p className={`${SUBHEADING} mb-3`}>Kolejka {roundNum}</p>
                    {matchesForRound.map(match => (
                      <ScheduleCard
                        key={fixtureKey(match.home, match.away)}
                        home={match.home}
                        away={match.away}
                        dateLabel={dateLabel}
                        played={false}
                      />
                    ))}
                  </div>
                );
              })}
            </section>
          </div>
        </div>
      )}
    </div>
  );
};

export default InternationalView;
