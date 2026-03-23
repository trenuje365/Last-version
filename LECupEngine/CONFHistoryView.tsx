import React, { useMemo, useState } from 'react';
import { useGame } from '../context/GameContext';
import { CompetitionType, MatchStatus, ViewState } from '../types';
import { RAW_CONFERENCE_LEAGUE_CLUBS, generateCONFClubId } from '../resources/static_db/clubs/ConferenceLeagueTeams';
import LigaKonferencjiBg from '../Graphic/themes/Liga_konferencji.png';

interface CONFPair {
  pairId: string;
  teamAId: string;
  teamBId: string;
  leg1?: {
    homeScore: number | null;
    awayScore: number | null;
    date: Date;
    status: MatchStatus;
  };
  leg2?: {
    homeScore: number | null;
    awayScore: number | null;
    homePenaltyScore?: number | null;
    awayPenaltyScore?: number | null;
    date: Date;
    status: MatchStatus;
  };
}

const COUNTRY_NAMES: Record<string, string> = {
  ALB: 'ALB', ARM: 'ARM', AUT: 'AUT', AZE: 'AZE',
  BEL: 'BEL', BIH: 'BIH', BLR: 'BLR', BUL: 'BUL',
  CRO: 'CRO', CYP: 'CYP', CZE: 'CZE', DEN: 'DEN',
  ENG: 'ENG', ESP: 'ESP', EST: 'EST', FIN: 'FIN',
  FRA: 'FRA', FRO: 'FRO', GEO: 'GEO', GER: 'GER',
  GIB: 'GIB', GRE: 'GRE', HUN: 'HUN', IRL: 'IRL',
  ISL: 'ISL', ISR: 'ISR', ITA: 'ITA', KAZ: 'KAZ',
  KOS: 'KOS', LAT: 'LAT', LIE: 'LIE', LTU: 'LTU',
  LUX: 'LUX', MDA: 'MDA', MKD: 'MKD', MLT: 'MLT',
  MNE: 'MNE', NED: 'NED', NOR: 'NOR', POR: 'POR',
  ROU: 'ROU', RUS: 'RUS', SCO: 'SCO', SMR: 'SMR',
  SRB: 'SRB', SUI: 'SUI', SVK: 'SVK', SVN: 'SVN',
  SWE: 'SWE', TUR: 'TUR', UKR: 'UKR', WAL: 'WAL',
  AND: 'AND', POL: 'POL',
};

const getCountryCode = (clubId: string): string => {
  if (clubId.startsWith('PL_')) return 'POL';
  const raw = RAW_CONFERENCE_LEAGUE_CLUBS.find(c => generateCONFClubId(c.name) === clubId);
  return raw ? (COUNTRY_NAMES[raw.country] ?? raw.country) : '';
};

const CONF_ROUNDS = [
  { key: 'R1Q', label: 'R1Q', sublabel: '1. Runda Kwalifikacyjna', accent: '#10b981' },
  { key: 'R2Q', label: 'R2Q', sublabel: '2. Runda Kwalifikacyjna', accent: '#34d399' },
] as const;

type CONFRoundKey = typeof CONF_ROUNDS[number]['key'];

export const CONFHistoryView: React.FC = () => {
  const { fixtures, clubs, userTeamId, navigateTo } = useGame();
  const [activeRound, setActiveRound] = useState<CONFRoundKey>('R1Q');

  // Filtruj mecze LK R1Q
  const r1qFixtures = useMemo(
    () => fixtures.filter(f =>
      f.leagueId === CompetitionType.CONF_R1Q ||
      f.leagueId === CompetitionType.CONF_R1Q_RETURN,
    ),
    [fixtures],
  );

  // Filtruj mecze LK R2Q
  const r2qFixtures = useMemo(
    () => fixtures.filter(f =>
      f.leagueId === CompetitionType.CONF_R2Q ||
      f.leagueId === CompetitionType.CONF_R2Q_RETURN,
    ),
    [fixtures],
  );

  const allConfFixtures = useMemo(() => [...r1qFixtures, ...r2qFixtures], [r1qFixtures, r2qFixtures]);

  // Buduj pary R1Q
  const r1qPairs = useMemo((): CONFPair[] => {
    return r1qFixtures.filter(f => f.leagueId === CompetitionType.CONF_R1Q).map(leg1 => {
      const ret = r1qFixtures.find(f => f.id === leg1.id + '_RETURN');
      return {
        pairId: leg1.id,
        teamAId: leg1.homeTeamId,
        teamBId: leg1.awayTeamId,
        leg1: {
          homeScore: leg1.homeScore ?? null,
          awayScore: leg1.awayScore ?? null,
          date: leg1.date instanceof Date ? leg1.date : new Date(leg1.date),
          status: leg1.status,
        },
        leg2: ret ? {
          homeScore: ret.homeScore ?? null,
          awayScore: ret.awayScore ?? null,
          homePenaltyScore: ret.homePenaltyScore,
          awayPenaltyScore: ret.awayPenaltyScore,
          date: ret.date instanceof Date ? ret.date : new Date(ret.date),
          status: ret.status,
        } : undefined,
      };
    });
  }, [r1qFixtures]);

  // Buduj pary R2Q
  const r2qPairs = useMemo((): CONFPair[] => {
    return r2qFixtures.filter(f => f.leagueId === CompetitionType.CONF_R2Q).map(leg1 => {
      const ret = r2qFixtures.find(f => f.id === leg1.id + '_RETURN');
      return {
        pairId: leg1.id,
        teamAId: leg1.homeTeamId,
        teamBId: leg1.awayTeamId,
        leg1: {
          homeScore: leg1.homeScore ?? null,
          awayScore: leg1.awayScore ?? null,
          date: leg1.date instanceof Date ? leg1.date : new Date(leg1.date),
          status: leg1.status,
        },
        leg2: ret ? {
          homeScore: ret.homeScore ?? null,
          awayScore: ret.awayScore ?? null,
          homePenaltyScore: ret.homePenaltyScore,
          awayPenaltyScore: ret.awayPenaltyScore,
          date: ret.date instanceof Date ? ret.date : new Date(ret.date),
          status: ret.status,
        } : undefined,
      };
    });
  }, [r2qFixtures]);

  const getClub = (id: string) => clubs.find(c => c.id === id);

  const formatDate = (d: Date) => d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' });

  const isUserPair = (pair: CONFPair) => pair.teamAId === userTeamId || pair.teamBId === userTeamId;

  const getAggregate = (pair: CONFPair) => {
    if (!pair.leg1 || pair.leg1.status !== MatchStatus.FINISHED || pair.leg1.homeScore === null || pair.leg1.awayScore === null) return null;
    const teamATotal = pair.leg1.homeScore + (pair.leg2?.status === MatchStatus.FINISHED && pair.leg2.awayScore !== null ? pair.leg2.awayScore : 0);
    const teamBTotal = pair.leg1.awayScore + (pair.leg2?.status === MatchStatus.FINISHED && pair.leg2.homeScore !== null ? pair.leg2.homeScore : 0);
    const returnDone = pair.leg2?.status === MatchStatus.FINISHED;
    let winnerId: string | null = null;
    if (returnDone) {
      if (teamATotal > teamBTotal) winnerId = pair.teamAId;
      else if (teamBTotal > teamATotal) winnerId = pair.teamBId;
      else if (pair.leg2?.homePenaltyScore != null && pair.leg2.awayPenaltyScore != null) {
        winnerId = pair.leg2.homePenaltyScore > pair.leg2.awayPenaltyScore ? pair.teamBId : pair.teamAId;
      } else winnerId = pair.teamAId;
    }
    return { teamATotal, teamBTotal, returnDone, winnerId };
  };

  const r1qDone = r1qPairs.filter(p => p.leg2?.status === MatchStatus.FINISHED).length;
  const r2qDone = r2qPairs.filter(p => p.leg2?.status === MatchStatus.FINISHED).length;

  const activePairs = activeRound === 'R1Q' ? r1qPairs : r2qPairs;
  const activeDone = activeRound === 'R1Q' ? r1qDone : r2qDone;
  const activeRoundLabel = activeRound === 'R1Q' ? '1. Runda Kwalifikacyjna' : '2. Runda Kwalifikacyjna';

  const getPairsForRound = (key: CONFRoundKey) => key === 'R1Q' ? r1qPairs : r2qPairs;
  const getDoneForRound = (key: CONFRoundKey) => key === 'R1Q' ? r1qDone : r2qDone;

  return (
    <div className="h-screen w-full bg-slate-950 flex flex-col overflow-hidden relative">

      {/* Tło */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${LigaKonferencjiBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center top',
            filter: 'brightness(0.4)',
          }}
        />
        <div className="absolute inset-0 bg-slate-950/60" />
        <div className="absolute top-[-15%] left-[-5%] w-[60%] h-[60%] rounded-full blur-[200px] opacity-[0.12] bg-emerald-600" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] rounded-full blur-[160px] opacity-[0.1] bg-teal-500" />
      </div>

      {/* HEADER */}
      <div className="relative z-10 flex items-center justify-between px-8 py-5 bg-slate-900/60 border-b border-white/[0.07] backdrop-blur-3xl shrink-0 shadow-2xl">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-2xl shadow-inner shrink-0">🟢</div>
          <div>
            <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white leading-none">Liga Konferencji</h1>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-[9px] font-black uppercase tracking-[0.5em] text-emerald-500">UEFA Conference League</span>
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-600">{allConfFixtures.length} mecze</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => navigateTo(ViewState.DASHBOARD)}
          className="px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-black italic uppercase tracking-widest rounded-2xl shadow-lg transition-all hover:scale-105 active:scale-95 text-sm"
        >
          POWRÓT →
        </button>
      </div>

      {/* GŁÓWNY OBSZAR */}
      <div className="relative z-10 flex flex-1 overflow-hidden">

        {/* SIDEBAR */}
        <div className="w-52 shrink-0 flex flex-col bg-black/20 border-r border-white/[0.05] overflow-y-auto">
          <div className="px-4 pt-5 pb-3">
            <p className="text-[8px] font-black uppercase tracking-[0.4em] text-slate-600">Rundy</p>
          </div>
          <div className="flex flex-col gap-0.5 px-2 pb-4">
            {CONF_ROUNDS.map(round => {
              const pairs = getPairsForRound(round.key);
              const done = getDoneForRound(round.key);
              const total = pairs.length;
              const progress = total > 0 ? (done / total) * 100 : 0;
              const hasUser = pairs.some(isUserPair);
              const isActive = activeRound === round.key;
              return (
                <button
                  key={round.key}
                  onClick={() => setActiveRound(round.key)}
                  className={`relative w-full text-left px-3 py-3 rounded-xl border overflow-hidden transition-all
                    ${isActive
                      ? 'bg-white/10 border-white/15 shadow-lg'
                      : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10'
                    }`}
                >
                  <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full" style={{ backgroundColor: isActive ? round.accent : 'transparent' }} />
                  <div className="flex items-center justify-between">
                    <div>
                      <div className={`text-[13px] font-black italic tracking-tight leading-none ${isActive ? 'text-white' : 'text-slate-400'}`}>{round.label}</div>
                      <div className="text-[8px] font-black uppercase tracking-widest mt-0.5 text-slate-500">{round.sublabel}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {hasUser && done < total && total > 0 && <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />}
                      {done === total && total > 0 && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                      {total === 0 && <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />}
                      <span className="text-[8px] font-black text-slate-600 tabular-nums">{done}/{total}</span>
                    </div>
                  </div>
                  <div className="mt-2 h-[2px] bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, backgroundColor: round.accent }} />
                  </div>
                </button>
              );
            })}
          </div>
          <div className="mt-auto px-4 py-4 border-t border-white/[0.05]">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" /><span className="text-[8px] font-black uppercase tracking-widest text-slate-600">Zakończona</span></div>
              <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0" /><span className="text-[8px] font-black uppercase tracking-widest text-slate-600">Twoja para</span></div>
            </div>
          </div>
        </div>

        {/* PRAWA STRONA */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Sub-header */}
          <div className="px-8 py-4 border-b border-white/[0.05] flex items-center gap-4 shrink-0">
            <div className="w-2 h-8 rounded-full bg-emerald-500" />
            <div>
              <h2 className="text-xl font-black italic uppercase tracking-tighter text-white leading-none">
                {activeRoundLabel} — Dwumecze
              </h2>
              <span className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-600">
                {activePairs.length > 0 ? `${activeDone}/${activePairs.length} par rozegranych` : 'Losowanie jeszcze nie odbyło się'}
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {activePairs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-600">
                <span className="text-4xl">⏳</span>
                <p className="text-sm font-black uppercase tracking-widest">Losowanie nie odbyło się jeszcze</p>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto py-4 px-6 flex flex-col gap-2">
                {activePairs.map(pair => {
                  const teamA = getClub(pair.teamAId);
                  const teamB = getClub(pair.teamBId);
                  const agg = getAggregate(pair);
                  const isUser = isUserPair(pair);
                  const aColor = teamA?.colorsHex?.[0] ?? '#334155';
                  const bColor = teamB?.colorsHex?.[0] ?? '#334155';
                  const leg1Done = pair.leg1?.status === MatchStatus.FINISHED;
                  const leg2Done = pair.leg2?.status === MatchStatus.FINISHED;
                  return (
                    <div
                      key={pair.pairId}
                      className={`group relative rounded-2xl border overflow-hidden backdrop-blur-sm transition-all
                        ${isUser
                          ? 'border-amber-400/60 shadow-[0_0_40px_-4px_rgba(245,158,11,0.4)]'
                          : leg2Done
                            ? 'border-white/[0.07] hover:border-white/[0.12]'
                            : 'border-white/[0.04] hover:border-white/[0.07]'
                        }`}
                    >
                      {/* GLASS BACKGROUND */}
                      <div className="absolute inset-0 z-0 pointer-events-none">
                        {isUser ? (
                          <div className="absolute inset-0 bg-gradient-to-r from-amber-600/30 via-amber-500/25 to-amber-600/30" />
                        ) : (
                          <>
                            <div
                              className="absolute inset-y-0 left-0 w-1/2"
                              style={{ background: `linear-gradient(to right, ${aColor}20, ${aColor}05, transparent)` }}
                            />
                            <div
                              className="absolute inset-y-0 right-0 w-1/2"
                              style={{ background: `linear-gradient(to left, ${bColor}20, ${bColor}05, transparent)` }}
                            />
                          </>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] via-white/[0.01] to-transparent" />
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                        <div className="absolute inset-x-0 bottom-0 h-px bg-black/30" />
                      </div>

                      {isUser && (
                        <div className="absolute left-0 top-3 bottom-3 w-[3px] z-20 rounded-full bg-amber-400 ml-1" />
                      )}

                      <div className="relative z-10 flex items-stretch px-5 py-4 gap-4">

                        {/* TEAM A */}
                        <div className="flex-1 flex flex-col items-end gap-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {agg?.winnerId === pair.teamAId && (
                              <span className="px-2 py-0.5 rounded-lg bg-emerald-500/80 text-[7px] font-black uppercase tracking-widest text-white border border-emerald-400/40">
                                AWANS
                              </span>
                            )}
                            <span className={`text-[13px] font-black uppercase italic tracking-tight truncate
                              ${agg ? agg.winnerId === pair.teamAId ? 'text-white' : 'text-slate-500' : 'text-slate-200'}`}>
                              {teamA?.name ?? pair.teamAId}
                            </span>
                            <div className="w-[3px] h-8 rounded-full shrink-0 opacity-60" style={{ backgroundColor: aColor }} />
                          </div>
                          {agg && (
                            <span className="text-[9px] font-black tabular-nums text-slate-500">
                              Agregat:{' '}
                              <span className={agg.winnerId === pair.teamAId ? 'text-emerald-400' : ''}>
                                {agg.teamATotal}
                              </span>
                            </span>
                          )}
                        </div>

                        {/* ŚRODEK */}
                        <div className="w-52 shrink-0 flex flex-col items-center justify-center gap-1.5">
                          {/* 1. mecz */}
                          <div className="flex items-center gap-2 w-full justify-center">
                            <span className="text-[7px] font-black uppercase tracking-widest text-slate-600 w-14 text-right">
                              {pair.leg1 ? formatDate(pair.leg1.date) : ''}
                            </span>
                            {leg1Done ? (
                              <span className="text-[12px] font-black tabular-nums text-slate-300">
                                {pair.leg1!.homeScore} : {pair.leg1!.awayScore}
                              </span>
                            ) : (
                              <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest">vs</span>
                            )}
                            <span className="text-[7px] font-black uppercase tracking-widest text-emerald-600/70 w-14 text-left">
                              1. mecz
                            </span>
                          </div>

                          {/* Rewanż */}
                          {pair.leg2 && (
                            <div className="flex items-center gap-2 w-full justify-center">
                              <span className="text-[7px] font-black uppercase tracking-widest text-slate-600 w-14 text-right">
                                {formatDate(pair.leg2.date)}
                              </span>
                              {leg2Done ? (
                                <div className="flex flex-col items-center">
                                  <span className="text-[12px] font-black tabular-nums text-slate-300">
                                    {pair.leg2.awayScore} : {pair.leg2.homeScore}
                                  </span>
                                  {pair.leg2.homePenaltyScore != null && pair.leg2.awayPenaltyScore != null && (
                                    <span className="text-[7px] font-black uppercase tracking-widest text-rose-500 -mt-0.5">
                                      k. {pair.leg2.awayPenaltyScore}:{pair.leg2.homePenaltyScore}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest">vs</span>
                              )}
                              <span className="text-[7px] font-black uppercase tracking-widest text-emerald-600/70 w-14 text-left">
                                Rewanż
                              </span>
                            </div>
                          )}

                          {/* Agregat łączny */}
                          {agg && leg2Done && (
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <div className="flex-1 h-px bg-white/10" />
                              <span className="text-[9px] font-black tabular-nums text-slate-400">
                                {agg.teamATotal} — {agg.teamBTotal}
                              </span>
                              <div className="flex-1 h-px bg-white/10" />
                            </div>
                          )}
                        </div>

                        {/* TEAM B */}
                        <div className="flex-1 flex flex-col items-start gap-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="w-[3px] h-8 rounded-full shrink-0 opacity-60" style={{ backgroundColor: bColor }} />
                            <span className={`text-[13px] font-black uppercase italic tracking-tight truncate
                              ${agg ? agg.winnerId === pair.teamBId ? 'text-white' : 'text-slate-500' : 'text-slate-200'}`}>
                              {teamB?.name ?? pair.teamBId}
                            </span>
                            {agg?.winnerId === pair.teamBId && (
                              <span className="px-2 py-0.5 rounded-lg bg-emerald-500/80 text-[7px] font-black uppercase tracking-widest text-white border border-emerald-400/40">
                                AWANS
                              </span>
                            )}
                          </div>
                          {agg && (
                            <span className="text-[9px] font-black tabular-nums text-slate-500">
                              Agregat:{' '}
                              <span className={agg.winnerId === pair.teamBId ? 'text-emerald-400' : ''}>
                                {agg.teamBTotal}
                              </span>
                            </span>
                          )}
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
