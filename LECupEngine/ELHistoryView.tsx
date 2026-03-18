import React, { useMemo, useState } from 'react';
import { useGame } from '../context/GameContext';
import { CompetitionType, MatchStatus, ViewState } from '../types';
import { ChampionshipHistoryService } from '../data/championship_history';
import { RAW_EUROPA_LEAGUE_CLUBS, generateELClubId } from '../resources/static_db/clubs/EuropeLeagueTeams';

// ── Pary dwumeczowe ────────────────────────────────────────────────────────
interface ELPair {
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
  AND: 'AND',
};

const getCountryCode = (clubId: string): string => {
  const raw = RAW_EUROPA_LEAGUE_CLUBS.find(c => generateELClubId(c.name) === clubId);
  return raw ? (COUNTRY_NAMES[raw.country] ?? raw.country) : '';
};

// ── Rundy LE ───────────────────────────────────────────────────────────────
const EL_ROUNDS = [
  { key: 'R1Q', label: 'R1Q', sublabel: '1. Runda Kwalifikacyjna', accent: '#f97316' },
  // Kolejne rundy będą tu dodawane
] as const;

const GLASS = 'bg-slate-950/40 backdrop-blur-2xl border border-white/8 rounded-[32px] relative overflow-hidden';

export const ELHistoryView: React.FC = () => {
  const { fixtures, clubs, navigateTo } = useGame();
  const [activeTab, setActiveTab] = useState<'bracket' | 'history'>('bracket');
  const [selectedRoundKey, setSelectedRoundKey] = useState<string>('R1Q');

  // ── EL fixtures ──────────────────────────────────────────────────────────
  const elFixtures = useMemo(
    () =>
      fixtures.filter(
        f =>
          f.leagueId === CompetitionType.EL_R1Q ||
          f.leagueId === CompetitionType.EL_R1Q_RETURN,
      ),
    [fixtures],
  );

  // ── Pary R1Q ─────────────────────────────────────────────────────────────
  const r1qPairs = useMemo((): ELPair[] => {
    const firstLegs = elFixtures.filter(f => f.leagueId === CompetitionType.EL_R1Q);
    return firstLegs.map(leg1 => {
      const ret = elFixtures.find(f => f.id === leg1.id + '_RETURN');
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
        leg2: ret
          ? {
              homeScore: ret.homeScore ?? null,
              awayScore: ret.awayScore ?? null,
              homePenaltyScore: ret.homePenaltyScore,
              awayPenaltyScore: ret.awayPenaltyScore,
              date: ret.date instanceof Date ? ret.date : new Date(ret.date),
              status: ret.status,
            }
          : undefined,
      };
    });
  }, [elFixtures]);

  // ── Historia ─────────────────────────────────────────────────────────────
  const history = useMemo(
    () => ChampionshipHistoryService.getAll().filter(e => e.competition === 'LIGA_EUROPY'),
    [],
  );

  const getClub = (id: string) => clubs.find(c => c.id === id);

  // ── Agregat pary ─────────────────────────────────────────────────────────
  const getAggregate = (pair: ELPair) => {
    if (!pair.leg1 || pair.leg1.status !== MatchStatus.FINISHED || pair.leg1.homeScore === null) return null;
    const aTotal = pair.leg1.homeScore + ((pair.leg2?.status === MatchStatus.FINISHED && pair.leg2.awayScore !== null) ? pair.leg2.awayScore : 0);
    const bTotal = pair.leg1.awayScore! + ((pair.leg2?.status === MatchStatus.FINISHED && pair.leg2.homeScore !== null) ? pair.leg2.homeScore : 0);
    let winner: string | null = null;
    if (pair.leg2?.status === MatchStatus.FINISHED) {
      if (aTotal > bTotal) winner = pair.teamAId;
      else if (bTotal > aTotal) winner = pair.teamBId;
      else if (pair.leg2.homePenaltyScore != null && pair.leg2.awayPenaltyScore != null) {
        winner = pair.leg2.homePenaltyScore > pair.leg2.awayPenaltyScore ? pair.teamBId : pair.teamAId;
      }
    }
    return { aTotal, bTotal, winner };
  };

  const pairsForRound = selectedRoundKey === 'R1Q' ? r1qPairs : [];

  const formatDate = (d: Date) =>
    d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' });

  return (
    <div className="h-screen w-full bg-slate-950 flex flex-col overflow-hidden relative">

      {/* Tło */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-15%] left-[-5%] w-[60%] h-[60%] rounded-full blur-[200px] opacity-8 bg-orange-600" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] rounded-full blur-[160px] opacity-6 bg-orange-500" />
      </div>

      <div className="relative z-10 flex flex-col h-full p-5 gap-4">

        {/* HEADER */}
        <div className={GLASS + ' p-5 shrink-0 flex items-center justify-between'}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-2xl">
              🍊
            </div>
            <div>
              <p className="text-orange-400 text-[8px] font-black uppercase tracking-[0.5em]">UEFA Europa League</p>
              <h1 className="text-2xl font-black italic uppercase tracking-tighter text-white leading-none">
                Rozgrywki & Historia
              </h1>
            </div>
          </div>
          <button
            onClick={() => navigateTo(ViewState.DASHBOARD)}
            className="px-8 py-3 bg-orange-500 hover:bg-orange-400 text-white font-black italic uppercase tracking-widest rounded-2xl shadow-lg transition-all hover:scale-105 active:scale-95 text-sm"
          >
            POWRÓT →
          </button>
        </div>

        {/* TAB BAR */}
        <div className="flex gap-3 shrink-0">
          {(['bracket', 'history'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab
                  ? 'bg-orange-500 text-white shadow-[0_0_30px_rgba(249,115,22,0.3)]'
                  : 'bg-white/[0.04] text-slate-400 hover:bg-white/[0.07] border border-white/8'
              }`}
            >
              {tab === 'bracket' ? '🏆 Bieżący Sezon' : '📜 Historia'}
            </button>
          ))}
        </div>

        {/* ── BRACKET TAB ─────────────────────────────────────────────────── */}
        {activeTab === 'bracket' && (
          <div className="flex-1 flex flex-col gap-4 overflow-hidden">

            {/* Round picker */}
            <div className="flex gap-2 shrink-0">
              {EL_ROUNDS.map(r => (
                <button
                  key={r.key}
                  onClick={() => setSelectedRoundKey(r.key)}
                  className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    selectedRoundKey === r.key
                      ? 'text-slate-900 shadow-lg'
                      : 'bg-white/[0.03] text-slate-500 border border-white/8 hover:bg-white/[0.06]'
                  }`}
                  style={selectedRoundKey === r.key ? { backgroundColor: r.accent } : {}}
                >
                  {r.label}
                  <span className="block text-[7px] opacity-70 mt-0.5 normal-case font-semibold">{r.sublabel}</span>
                </button>
              ))}
            </div>

            {/* Pary */}
            <div className="flex-1 overflow-y-auto">
              {pairsForRound.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-600">
                  <span className="text-4xl">⏳</span>
                  <p className="text-sm font-black uppercase tracking-widest">Losowanie nie odbyło się jeszcze</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 pb-8 pr-2">
                  {pairsForRound.map((pair, idx) => {
                    const clubA = getClub(pair.teamAId);
                    const clubB = getClub(pair.teamBId);
                    if (!clubA || !clubB) return null;
                    const agg = getAggregate(pair);

                    return (
                      <div
                        key={pair.pairId}
                        className="relative flex flex-col p-4 rounded-[24px] border bg-white/[0.02] border-white/6 hover:border-orange-500/20 transition-all"
                      >
                        {/* Numer */}
                        <div className="absolute top-[-8px] left-[-8px] w-6 h-6 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center text-[10px] font-black text-slate-500">
                          {idx + 1}
                        </div>

                        {/* Drużyny */}
                        {[{ club: clubA, id: pair.teamAId, isWinner: agg?.winner === pair.teamAId },
                          { club: clubB, id: pair.teamBId, isWinner: agg?.winner === pair.teamBId }].map(({ club, id, isWinner }, ti) => (
                          <div key={id} className={`flex items-center gap-3 py-2 ${ti === 0 ? 'border-b border-white/5' : ''}`}>
                            <div className="w-8 h-8 rounded-lg border border-white/10 flex flex-col overflow-hidden shrink-0">
                              <div className="flex-1" style={{ backgroundColor: club.colorsHex[0] }} />
                              <div className="flex-1" style={{ backgroundColor: club.colorsHex[1] || club.colorsHex[0] }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-[12px] font-black uppercase italic truncate tracking-tight ${isWinner ? 'text-orange-300' : 'text-white'}`}>
                                {club.name}
                              </p>
                              <p className="text-[8px] text-slate-500 uppercase tracking-widest">{getCountryCode(id)}</p>
                            </div>
                            {/* Agregat */}
                            {agg && (
                              <span className={`text-lg font-black tabular-nums ${isWinner ? 'text-orange-400' : 'text-slate-500'}`}>
                                {ti === 0 ? agg.aTotal : agg.bTotal}
                              </span>
                            )}
                          </div>
                        ))}

                        {/* Wyniki meczów */}
                        <div className="flex gap-2 mt-3">
                          {pair.leg1 && (
                            <div className="flex-1 bg-white/[0.03] rounded-xl px-3 py-2 text-center">
                              <p className="text-[7px] text-slate-500 uppercase tracking-widest mb-1">
                                {pair.leg1.date ? formatDate(pair.leg1.date) : '5 lip'}
                              </p>
                              <p className={`text-[13px] font-black tabular-nums ${pair.leg1.status === MatchStatus.FINISHED ? 'text-white' : 'text-slate-600'}`}>
                                {pair.leg1.status === MatchStatus.FINISHED
                                  ? `${pair.leg1.homeScore ?? '-'} : ${pair.leg1.awayScore ?? '-'}`
                                  : '– : –'}
                              </p>
                            </div>
                          )}
                          {pair.leg2 && (
                            <div className="flex-1 bg-white/[0.03] rounded-xl px-3 py-2 text-center">
                              <p className="text-[7px] text-slate-500 uppercase tracking-widest mb-1">
                                {pair.leg2.date ? formatDate(pair.leg2.date) : '10 lip'}
                              </p>
                              <p className={`text-[13px] font-black tabular-nums ${pair.leg2.status === MatchStatus.FINISHED ? 'text-white' : 'text-slate-600'}`}>
                                {pair.leg2.status === MatchStatus.FINISHED
                                  ? `${pair.leg2.homeScore ?? '-'} : ${pair.leg2.awayScore ?? '-'}`
                                  : '– : –'}
                              </p>
                              {pair.leg2.homePenaltyScore != null && (
                                <p className="text-[7px] text-orange-400 font-black mt-0.5">
                                  K: {pair.leg2.homePenaltyScore} – {pair.leg2.awayPenaltyScore}
                                </p>
                              )}
                            </div>
                          )}
                          {!pair.leg1 && !pair.leg2 && (
                            <div className="flex-1 bg-white/[0.02] rounded-xl px-3 py-2 text-center">
                              <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest">Oczekuje</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── HISTORIA TAB ─────────────────────────────────────────────────── */}
        {activeTab === 'history' && (
          <div className="flex-1 overflow-y-auto">
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-600">
                <span className="text-4xl">📜</span>
                <p className="text-sm font-black uppercase tracking-widest">Brak danych historycznych</p>
                <p className="text-xs text-slate-700">Historia będzie tu uzupełniana po każdym sezonie</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-8 pr-2">
                {history.map((entry, i) => (
                  <div key={i} className="flex flex-col p-5 rounded-[24px] border bg-white/[0.02] border-white/6 hover:border-orange-500/20 transition-all gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black text-orange-400/70 uppercase tracking-widest">{entry.season}</span>
                      <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Liga Europy UEFA</span>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">Zwycięzca</p>
                      <p className="text-lg font-black italic uppercase text-orange-300">{entry.winner}</p>
                    </div>
                    {entry.runnerUp && (
                      <div>
                        <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">Finalista</p>
                        <p className="text-sm font-black italic uppercase text-slate-400">{entry.runnerUp}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
