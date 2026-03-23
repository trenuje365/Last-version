import React, { useEffect, useMemo, useState } from 'react';
import { useGame } from '../context/GameContext';
import { CompetitionType, MatchStatus, ViewState } from '../types';
import { ChampionshipHistoryService } from '../data/championship_history';
import { RAW_EUROPA_LEAGUE_CLUBS, generateELClubId } from '../resources/static_db/clubs/EuropeLeagueTeams';
import LigaEuropaBg from '../Graphic/themes/LigaEuropa.png';

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

// ── Matematycznie pewny awans do 1/8 (top-2 w grupie) ──────────────────────
// Drużyna na pozycji `position` (0-based) ma pewny awans, gdy żaden
// z rywali spoza top-2 nie może matematycznie dosięgnąć jej punktów.
// Każda drużyna rozgrywa 6 meczów grupowych; `row.played` pochodzi
// z computeGroupTable i obejmuje wyłącznie zakończone mecze grupowe.
const hasClinched = (
  position: number,
  table: { pts: number; played: number }[],
): boolean => {
  if (position >= 2) return false;
  const teamPts = table[position].pts;
  for (let i = 2; i < table.length; i++) {
    const rival = table[i];
    const remaining = Math.max(0, 6 - rival.played);
    if (rival.pts + 3 * remaining >= teamPts) return false; // rywal może dosięgnąć
  }
  return true;
};

// ── Rundy LE ───────────────────────────────────────────────────────────────
const EL_ROUNDS = [
  { key: 'R1Q',    label: 'R1Q',   sublabel: '1. Runda Kwalifikacyjna', accent: '#f97316' },
  { key: 'R2Q',    label: 'R2Q',   sublabel: '2. Runda Kwalifikacyjna', accent: '#ea580c' },
  { key: 'GS',     label: 'GS',    sublabel: 'Faza Grupowa',            accent: '#f59e0b' },
  { key: 'R16',    label: '1/8',   sublabel: '1/8 Finału',              accent: '#ef4444' },
  { key: 'QF',     label: '1/4',   sublabel: '1/4 Finału',              accent: '#e11d48' },
  { key: 'SF',     label: '1/2',   sublabel: '1/2 Finału',              accent: '#9333ea' },
  { key: 'FINAL',  label: 'FINAŁ', sublabel: 'Finał Ligi Europy',       accent: '#f59e0b' },
] as const;

const GROUP_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

export const ELHistoryView: React.FC = () => {
  const { fixtures, clubs, navigateTo, elGroups, userTeamId, elHistoryInitialRound, setElHistoryInitialRound } = useGame();
  const [activeTab, setActiveTab] = useState<'bracket' | 'history'>('bracket');
  const [selectedRoundKey, setSelectedRoundKey] = useState<string>(elHistoryInitialRound ?? 'R1Q');
  useEffect(() => {
    if (elHistoryInitialRound) {
      setSelectedRoundKey(elHistoryInitialRound);
      setElHistoryInitialRound(null);
    }
  }, [elHistoryInitialRound]);
  const [selectedGroup, setSelectedGroup] = useState<number>(0);
  const [gsMatchdayTab, setGsMatchdayTab] = useState<number>(1);

  // ── Oblicz tabelę grupy ─────────────────────────────────────────────────
  const computeGroupTable = (groupTeams: string[]) => {
    const stats: Record<string, { played: number; w: number; d: number; l: number; gf: number; ga: number; pts: number }> = {};
    groupTeams.forEach(id => { stats[id] = { played: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 }; });
    fixtures.forEach(f => {
      if (f.leagueId !== CompetitionType.EL_GROUP_STAGE) return;
      if (f.status !== MatchStatus.FINISHED) return;
      if (!groupTeams.includes(f.homeTeamId) || !groupTeams.includes(f.awayTeamId)) return;
      const h = stats[f.homeTeamId];
      const a = stats[f.awayTeamId];
      const hs = f.homeScore as number;
      const as_ = f.awayScore as number;
      h.played++; a.played++;
      h.gf += hs; h.ga += as_; a.gf += as_; a.ga += hs;
      if (hs > as_) { h.w++; h.pts += 3; a.l++; }
      else if (hs < as_) { a.w++; a.pts += 3; h.l++; }
      else { h.d++; a.d++; h.pts++; a.pts++; }
    });
    return groupTeams
      .map(id => ({ id, ...stats[id] }))
      .sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf);
  };

  // ── Filtruj fixtury LE ───────────────────────────────────────────────────
  const elFixtures = useMemo(
    () => fixtures.filter(f =>
      f.leagueId === CompetitionType.EL_R1Q ||
      f.leagueId === CompetitionType.EL_R1Q_RETURN ||
      f.leagueId === CompetitionType.EL_R2Q ||
      f.leagueId === CompetitionType.EL_R2Q_RETURN ||
      f.leagueId === CompetitionType.EL_GROUP_STAGE ||
      f.leagueId === CompetitionType.EL_R16 ||
      f.leagueId === CompetitionType.EL_R16_RETURN ||
      f.leagueId === CompetitionType.EL_QF ||
      f.leagueId === CompetitionType.EL_QF_RETURN ||
      f.leagueId === CompetitionType.EL_SF ||
      f.leagueId === CompetitionType.EL_SF_RETURN ||
      f.leagueId === CompetitionType.EL_FINAL,
    ),
    [fixtures],
  );

  // ── Pary R1Q ─────────────────────────────────────────────────────────────
  const r1qPairs = useMemo((): ELPair[] => {
    return elFixtures.filter(f => f.leagueId === CompetitionType.EL_R1Q).map(leg1 => {
      const ret = elFixtures.find(f => f.id === leg1.id + '_RETURN');
      return {
        pairId: leg1.id, teamAId: leg1.homeTeamId, teamBId: leg1.awayTeamId,
        leg1: { homeScore: leg1.homeScore ?? null, awayScore: leg1.awayScore ?? null, date: leg1.date instanceof Date ? leg1.date : new Date(leg1.date), status: leg1.status },
        leg2: ret ? { homeScore: ret.homeScore ?? null, awayScore: ret.awayScore ?? null, homePenaltyScore: ret.homePenaltyScore, awayPenaltyScore: ret.awayPenaltyScore, date: ret.date instanceof Date ? ret.date : new Date(ret.date), status: ret.status } : undefined,
      };
    });
  }, [elFixtures]);

  // ── Pary R2Q ─────────────────────────────────────────────────────────────
  const r2qPairs = useMemo((): ELPair[] => {
    return elFixtures.filter(f => f.leagueId === CompetitionType.EL_R2Q).map(leg1 => {
      const ret = elFixtures.find(f => f.id === leg1.id + '_RETURN');
      return {
        pairId: leg1.id, teamAId: leg1.homeTeamId, teamBId: leg1.awayTeamId,
        leg1: { homeScore: leg1.homeScore ?? null, awayScore: leg1.awayScore ?? null, date: leg1.date instanceof Date ? leg1.date : new Date(leg1.date), status: leg1.status },
        leg2: ret ? { homeScore: ret.homeScore ?? null, awayScore: ret.awayScore ?? null, homePenaltyScore: ret.homePenaltyScore, awayPenaltyScore: ret.awayPenaltyScore, date: ret.date instanceof Date ? ret.date : new Date(ret.date), status: ret.status } : undefined,
      };
    });
  }, [elFixtures]);

  // ── Pary R16 ─────────────────────────────────────────────────────────────
  const r16Pairs = useMemo((): ELPair[] => {
    return elFixtures.filter(f => f.leagueId === CompetitionType.EL_R16).map(leg1 => {
      const ret = elFixtures.find(f => f.id === leg1.id + '_RETURN');
      return {
        pairId: leg1.id, teamAId: leg1.homeTeamId, teamBId: leg1.awayTeamId,
        leg1: { homeScore: leg1.homeScore ?? null, awayScore: leg1.awayScore ?? null, date: leg1.date instanceof Date ? leg1.date : new Date(leg1.date), status: leg1.status },
        leg2: ret ? { homeScore: ret.homeScore ?? null, awayScore: ret.awayScore ?? null, homePenaltyScore: ret.homePenaltyScore, awayPenaltyScore: ret.awayPenaltyScore, date: ret.date instanceof Date ? ret.date : new Date(ret.date), status: ret.status } : undefined,
      };
    });
  }, [elFixtures]);
  // ── Pary QF ─────────────────────────────────────────────────────
  const qfPairs = useMemo((): ELPair[] => {
    return elFixtures.filter(f => f.leagueId === CompetitionType.EL_QF).map(leg1 => {
      const ret = elFixtures.find(f => f.id === leg1.id + '_RETURN');
      return {
        pairId: leg1.id, teamAId: leg1.homeTeamId, teamBId: leg1.awayTeamId,
        leg1: { homeScore: leg1.homeScore ?? null, awayScore: leg1.awayScore ?? null, date: leg1.date instanceof Date ? leg1.date : new Date(leg1.date), status: leg1.status },
        leg2: ret ? { homeScore: ret.homeScore ?? null, awayScore: ret.awayScore ?? null, homePenaltyScore: ret.homePenaltyScore, awayPenaltyScore: ret.awayPenaltyScore, date: ret.date instanceof Date ? ret.date : new Date(ret.date), status: ret.status } : undefined,
      };
    });
  }, [elFixtures]);

  // ── Pary SF ─────────────────────────────────────────────────────
  const sfPairs = useMemo((): ELPair[] => {
    return elFixtures.filter(f => f.leagueId === CompetitionType.EL_SF).map(leg1 => {
      const ret = elFixtures.find(f => f.id === leg1.id + '_RETURN');
      return {
        pairId: leg1.id, teamAId: leg1.homeTeamId, teamBId: leg1.awayTeamId,
        leg1: { homeScore: leg1.homeScore ?? null, awayScore: leg1.awayScore ?? null, date: leg1.date instanceof Date ? leg1.date : new Date(leg1.date), status: leg1.status },
        leg2: ret ? { homeScore: ret.homeScore ?? null, awayScore: ret.awayScore ?? null, homePenaltyScore: ret.homePenaltyScore, awayPenaltyScore: ret.awayPenaltyScore, date: ret.date instanceof Date ? ret.date : new Date(ret.date), status: ret.status } : undefined,
      };
    });
  }, [elFixtures]);

  // ── Finał ─────────────────────────────────────────────────────
  const finalFixture = useMemo(
    () => elFixtures.find(f => f.leagueId === CompetitionType.EL_FINAL) ?? null,
    [elFixtures],
  );
  // ── Historia ─────────────────────────────────────────────────────────────
  const history = useMemo(
    () => ChampionshipHistoryService.getAll().filter(e => e.competition === 'LIGA_EUROPY'),
    [],
  );

  const getClub = (id: string) => clubs.find(c => c.id === id);
  const formatDate = (d: Date) => d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' });
  const isUserPair = (pair: ELPair) => pair.teamAId === userTeamId || pair.teamBId === userTeamId;

  // ── Agregat pary ─────────────────────────────────────────────────────────
  const getAggregate = (pair: ELPair) => {
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

  // ── Liczniki ─────────────────────────────────────────────────────────────
  const r1qDone = r1qPairs.filter(p => p.leg2?.status === MatchStatus.FINISHED).length;
  const r2qDone = r2qPairs.filter(p => p.leg2?.status === MatchStatus.FINISHED).length;
  const gsAvailable = !!elGroups && elGroups.length > 0;
  const r16Available = r16Pairs.length > 0;
  const r16Done = r16Pairs.filter(p => p.leg2?.status === MatchStatus.FINISHED).length;
  const qfAvailable = qfPairs.length > 0;
  const qfDone = qfPairs.filter(p => p.leg2?.status === MatchStatus.FINISHED).length;
  const sfAvailable = sfPairs.length > 0;
  const sfDone = sfPairs.filter(p => p.leg2?.status === MatchStatus.FINISHED).length;
  const finalAvailable = !!finalFixture;
  const finalDone = finalFixture?.status === MatchStatus.FINISHED ? 1 : 0;

  const getRoundMeta = (key: string) => {
    if (key === 'R1Q') return { total: r1qPairs.length, done: r1qDone, available: r1qPairs.length > 0, progress: r1qPairs.length > 0 ? (r1qDone / r1qPairs.length) * 100 : 0 };
    if (key === 'R2Q') return { total: r2qPairs.length, done: r2qDone, available: r2qPairs.length > 0, progress: r2qPairs.length > 0 ? (r2qDone / r2qPairs.length) * 100 : 0 };
    if (key === 'GS')  return { total: elGroups?.length ?? 0, done: gsAvailable ? (elGroups?.length ?? 0) : 0, available: gsAvailable, progress: gsAvailable ? 100 : 0 };
    if (key === 'R16') return { total: r16Pairs.length, done: r16Done, available: r16Available, progress: r16Available ? (r16Done / Math.max(r16Pairs.length, 1)) * 100 : 0 };
    if (key === 'QF') return { total: qfPairs.length, done: qfDone, available: qfAvailable, progress: qfAvailable ? (qfDone / Math.max(qfPairs.length, 1)) * 100 : 0 };
    if (key === 'SF') return { total: sfPairs.length, done: sfDone, available: sfAvailable, progress: sfAvailable ? (sfDone / Math.max(sfPairs.length, 1)) * 100 : 0 };
    if (key === 'FINAL') return { total: finalAvailable ? 1 : 0, done: finalDone, available: finalAvailable, progress: finalDone > 0 ? 100 : 0 };
    return { total: 0, done: 0, available: false, progress: 0 };
  };

  const pairsForKey = (key: string): ELPair[] => {
    if (key === 'R1Q') return r1qPairs;
    if (key === 'R2Q') return r2qPairs;
    if (key === 'R16') return r16Pairs;
    if (key === 'QF') return qfPairs;
    if (key === 'SF') return sfPairs;
    return [];
  };

  const R16_PAIR_LABELS = ['1A–2C','1B–2D','1C–2A','1D–2B','1E–2G','1F–2H','1G–2E','1H–2F'];

  return (
    <div className="h-screen w-full bg-slate-950 flex flex-col overflow-hidden relative">

      {/* Tło */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${LigaEuropaBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center top',
            filter: 'brightness(0.4)',
          }}
        />
        <div className="absolute inset-0 bg-slate-950/60" />
        <div className="absolute top-[-15%] left-[-5%] w-[60%] h-[60%] rounded-full blur-[200px] opacity-[0.12] bg-orange-600" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] rounded-full blur-[160px] opacity-[0.1] bg-orange-500" />
      </div>

      {/* HEADER */}
      <div className="relative z-10 flex items-center justify-between px-8 py-5 bg-slate-900/60 border-b border-white/[0.07] backdrop-blur-3xl shrink-0 shadow-2xl">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-2xl shadow-inner shrink-0">🟠</div>
          <div>
            <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white leading-none">Liga Europy</h1>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-[9px] font-black uppercase tracking-[0.5em] text-orange-500">UEFA Europa League</span>
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-600">{elFixtures.length} mecze</span>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          {(['bracket', 'history'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab ? 'bg-orange-500 text-white shadow-[0_0_30px_rgba(249,115,22,0.3)]' : 'bg-white/[0.04] text-slate-400 hover:bg-white/[0.07] border border-white/[0.08]'
              }`}>
              {tab === 'bracket' ? '🏆 Bieżący Sezon' : '📜 Historia'}
            </button>
          ))}
          <button onClick={() => navigateTo(ViewState.DASHBOARD)}
            className="px-8 py-3 bg-orange-500 hover:bg-orange-400 text-white font-black italic uppercase tracking-widest rounded-2xl shadow-lg transition-all hover:scale-105 active:scale-95 text-sm">
            POWRÓT →
          </button>
        </div>
      </div>

      {/* ── BRACKET ─────────────────────────────────────────────────────────── */}
      {activeTab === 'bracket' && (
        <div className="relative z-10 flex flex-1 overflow-hidden">

          {/* SIDEBAR */}
          <div className="w-52 shrink-0 flex flex-col bg-black/20 border-r border-white/[0.05] overflow-y-auto">
            <div className="px-4 pt-5 pb-3">
              <p className="text-[8px] font-black uppercase tracking-[0.4em] text-slate-600">Rundy</p>
            </div>
            <div className="flex flex-col gap-0.5 px-2 pb-4">
              {EL_ROUNDS.map(round => {
                const isActive = selectedRoundKey === round.key;
                const meta = getRoundMeta(round.key);
                const hasUser = round.key === 'GS'
                  ? (elGroups?.some(g => g.includes(userTeamId ?? '')) ?? false)
                  : round.key === 'FINAL'
                  ? (finalFixture ? (finalFixture.homeTeamId === userTeamId || finalFixture.awayTeamId === userTeamId) : false)
                  : pairsForKey(round.key).some(isUserPair);
                return (
                  <button key={round.key} onClick={() => setSelectedRoundKey(round.key)}
                    className={`relative w-full text-left px-3 py-3 rounded-xl transition-all group overflow-hidden
                      ${isActive ? 'bg-white/10 border border-white/15 shadow-lg' : 'border border-transparent hover:bg-white/[0.04]'}`}
                  >
                    {isActive && <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full" style={{ backgroundColor: round.accent }} />}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className={`text-[13px] font-black italic tracking-tight leading-none ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>{round.label}</div>
                        <div className={`text-[8px] font-black uppercase tracking-widest mt-0.5 ${isActive ? 'text-slate-400' : 'text-slate-600'}`}>{round.sublabel}</div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {hasUser && meta.done < meta.total && <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />}
                        {meta.done === meta.total && meta.total > 0 && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                        <span className="text-[8px] font-black text-slate-600 tabular-nums">{meta.done}/{meta.total}</span>
                      </div>
                    </div>
                    <div className="mt-2 h-[2px] bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${meta.progress}%`, backgroundColor: round.accent }} />
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
              <div className="w-2 h-8 rounded-full" style={{ backgroundColor: EL_ROUNDS.find(r => r.key === selectedRoundKey)?.accent ?? '#f97316' }} />
              <div>
                <h2 className="text-xl font-black italic uppercase tracking-tighter text-white leading-none">
                  {selectedRoundKey === 'GS' ? 'Faza Grupowa — 8 Grup'
                    : selectedRoundKey === 'R16' ? '1/8 Finału — Dwumecze'
                    : selectedRoundKey === 'QF' ? '1/4 Finału — Dwumecze'
                    : selectedRoundKey === 'SF' ? '1/2 Finału — Dwumecze'
                    : selectedRoundKey === 'FINAL' ? 'Finał Ligi Europy'
                    : selectedRoundKey === 'R2Q' ? '2. Runda Kwalifikacyjna — Dwumecze'
                    : '1. Runda Kwalifikacyjna — Dwumecze'}
                </h2>
                <span className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-600">
                  {selectedRoundKey === 'GS'
                    ? (gsAvailable ? '8 grup · 32 drużyny' : 'Losowanie jeszcze nie odbyło się')
                    : selectedRoundKey === 'R16'
                    ? (r16Available ? `${r16Done}/${r16Pairs.length} par rozegranych` : 'Losowanie jeszcze nie odbyło się')
                    : selectedRoundKey === 'QF'
                    ? (qfAvailable ? `${qfDone}/${qfPairs.length} par rozegranych` : 'Losowanie jeszcze nie odbyło się')
                    : selectedRoundKey === 'SF'
                    ? (sfAvailable ? `${sfDone}/${sfPairs.length} par rozegranych` : 'Losowanie jeszcze nie odbyło się')
                    : selectedRoundKey === 'FINAL'
                    ? (finalAvailable ? (finalDone ? 'Mecz został rozegrany' : 'Mecz zaplanowany') : 'Finał nie został jeszcze ogłoszony')
                    : `${getRoundMeta(selectedRoundKey).done}/${getRoundMeta(selectedRoundKey).total} par rozegranych`}
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">

              {/* ── FAZA GRUPOWA ─────────────────────────────────────────── */}
              {selectedRoundKey === 'GS' && (
                <div className="max-w-5xl mx-auto py-4 px-6">
                  {!gsAvailable ? (
                    <div className="flex flex-col items-center justify-center h-64 gap-4">
                      <div className="text-5xl opacity-20">🟠</div>
                      <p className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-600">Losowanie fazy grupowej nie zostało jeszcze przeprowadzone</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4 pb-8">
                      {/* Selector grup */}
                      <div className="flex gap-2 flex-wrap">
                        {GROUP_LABELS.map((lbl, gi) => (
                          <button key={gi} onClick={() => setSelectedGroup(gi)}
                            className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest border transition-all
                              ${selectedGroup === gi ? 'bg-orange-400/20 border-orange-400/50 text-orange-300' : 'border-white/10 text-slate-500 hover:text-white hover:border-white/20'}
                              ${elGroups![gi]?.includes(userTeamId ?? '') ? 'ring-1 ring-amber-400/40' : ''}`}
                          >
                            Gr. {lbl}
                          </button>
                        ))}
                      </div>

                      {/* Tabela grupy */}
                      {(() => {
                        const group = elGroups![selectedGroup];
                        const table = computeGroupTable(group);
                        return (
                          <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
                            <div className="px-4 py-3 border-b border-white/10 flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-orange-400/20 border border-orange-400/30 flex items-center justify-center text-sm font-black text-orange-400">
                                {GROUP_LABELS[selectedGroup]}
                              </div>
                              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Tabela — Grupa {GROUP_LABELS[selectedGroup]}</span>
                            </div>
                            <table className="w-full text-[11px]">
                              <thead>
                                <tr className="border-b border-white/5 text-slate-600 text-[8px] uppercase tracking-widest">
                                  <th className="px-4 py-2 text-left w-6">#</th>
                                  <th className="px-4 py-2 text-left">Drużyna</th>
                                  <th className="px-2 py-2 text-center w-8">M</th>
                                  <th className="px-2 py-2 text-center w-8">W</th>
                                  <th className="px-2 py-2 text-center w-8">R</th>
                                  <th className="px-2 py-2 text-center w-8">P</th>
                                  <th className="px-2 py-2 text-center w-12">Br.</th>
                                  <th className="px-2 py-2 text-center w-10 font-black text-orange-400">Pkt</th>
                                </tr>
                              </thead>
                              <tbody>
                                {table.map((row, ri) => {
                                  const club = clubs.find(c => c.id === row.id);
                                  const isUser = row.id === userTeamId;
                                  const promotes = ri < 2;
                                  return (
                                    <tr key={row.id} className={`border-b border-white/[0.04] transition-colors
                                      ${isUser ? 'bg-amber-400/10' : promotes ? 'bg-orange-600/5' : 'hover:bg-white/[0.02]'}`}>
                                      <td className="px-4 py-2 text-center">
                                        <span className={`text-[9px] font-black ${promotes ? 'text-orange-400' : 'text-slate-600'}`}>{ri + 1}</span>
                                      </td>
                                      <td className="px-4 py-2">
                                        <div className="flex items-center gap-2">
                                          <div className="w-5 h-5 rounded-md border border-white/10 flex flex-col overflow-hidden shrink-0">
                                            <div className="flex-1" style={{ backgroundColor: club?.colorsHex?.[0] ?? '#333' }} />
                                            <div className="flex-1" style={{ backgroundColor: club?.colorsHex?.[1] ?? '#555' }} />
                                          </div>
                                          <span className={`font-black uppercase italic text-[11px] truncate ${isUser ? 'text-amber-300' : promotes ? 'text-white' : 'text-slate-300'}`}>
                                            {club?.name ?? row.id}
                                          </span>
                                          <span className="text-[7px] text-slate-600 uppercase">{getCountryCode(row.id)}</span>
                                          {hasClinched(ri, table) && <span className="ml-1 text-[7px] font-black text-orange-400 uppercase tracking-widest shrink-0">✓ AWANS</span>}
                                        </div>
                                      </td>
                                      <td className="px-2 py-2 text-center text-slate-500">{row.played}</td>
                                      <td className="px-2 py-2 text-center text-slate-400">{row.w}</td>
                                      <td className="px-2 py-2 text-center text-slate-400">{row.d}</td>
                                      <td className="px-2 py-2 text-center text-slate-400">{row.l}</td>
                                      <td className="px-2 py-2 text-center text-slate-500">{row.gf}:{row.ga}</td>
                                      <td className="px-2 py-2 text-center font-black text-white">{row.pts}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        );
                      })()}

                      {/* Selector kolejek */}
                      <div className="flex gap-2">
                        {[1,2,3,4,5,6].map(md => (
                          <button key={md} onClick={() => setGsMatchdayTab(md)}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all
                              ${gsMatchdayTab === md ? 'bg-orange-500/20 border-orange-500/40 text-orange-300' : 'border-white/10 text-slate-600 hover:text-white'}`}>
                            K{md}
                          </button>
                        ))}
                      </div>

                      {/* Mecze wybranej kolejki */}
                      {(() => {
                        const groupLetter = GROUP_LABELS[selectedGroup];
                        const mdFixtures = fixtures.filter(f =>
                          f.leagueId === CompetitionType.EL_GROUP_STAGE &&
                          f.id.includes(`EL_GS_G${groupLetter}_MD${gsMatchdayTab}_`)
                        );
                        if (mdFixtures.length === 0) return (
                          <div className="p-4 text-center text-slate-700 text-[10px] font-black uppercase tracking-widest">
                            Brak meczów / kolejka jeszcze nie rozegrana
                          </div>
                        );
                        return (
                          <div className="flex flex-col gap-2">
                            {mdFixtures.map(f => {
                              const home = clubs.find(c => c.id === f.homeTeamId);
                              const away = clubs.find(c => c.id === f.awayTeamId);
                              const isUser = f.homeTeamId === userTeamId || f.awayTeamId === userTeamId;
                              return (
                                <div key={f.id} className={`flex items-center justify-between p-3 rounded-xl border
                                  ${isUser ? 'border-amber-400/40 bg-amber-400/10' : 'border-white/5 bg-white/[0.02]'}`}>
                                  <span className={`text-[12px] font-black uppercase italic flex-1 text-right truncate ${f.homeTeamId === userTeamId ? 'text-amber-300' : 'text-slate-200'}`}>
                                    {home?.name ?? f.homeTeamId}
                                  </span>
                                  <div className="mx-4 text-center shrink-0">
                                    {f.status === MatchStatus.FINISHED
                                      ? <span className="text-[14px] font-black text-white tabular-nums">{f.homeScore} : {f.awayScore}</span>
                                      : <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">vs</span>}
                                  </div>
                                  <span className={`text-[12px] font-black uppercase italic flex-1 text-left truncate ${f.awayTeamId === userTeamId ? 'text-amber-300' : 'text-slate-200'}`}>
                                    {away?.name ?? f.awayTeamId}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}

              {/* ── 1/8 FINAŁU ───────────────────────────────────────────── */}
              {selectedRoundKey === 'R16' && (
                <div className="max-w-3xl mx-auto py-4 px-6">
                  {!r16Available ? (
                    <div className="flex flex-col items-center justify-center h-64 gap-4">
                      <div className="text-5xl opacity-20">🟠</div>
                      <p className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-600">Losowanie 1/8 Finału jeszcze nie zostało przeprowadzone</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 pb-8">
                      {r16Pairs.map((pair, i) => {
                        const clubA = getClub(pair.teamAId);
                        const clubB = getClub(pair.teamBId);
                        const agg = getAggregate(pair);
                        const isUser = isUserPair(pair);
                        const leg1Done = pair.leg1?.status === MatchStatus.FINISHED;
                        const leg2Done = pair.leg2?.status === MatchStatus.FINISHED;
                        return (
                          <div key={pair.pairId}
                            className={`rounded-2xl border p-4 transition-colors
                              ${isUser ? 'border-amber-400/30 bg-amber-400/5' : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'}`}>
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-[8px] font-black uppercase tracking-[0.4em] text-slate-600">
                                Para {i + 1} · {R16_PAIR_LABELS[i]}
                              </span>
                              {agg?.winnerId && (
                                <span className="text-[8px] font-black uppercase tracking-widest text-emerald-400">
                                  Awans: {getClub(agg.winnerId)?.name}
                                </span>
                              )}
                            </div>
                            {/* M1: teamA gospodarz */}
                            <div className="flex items-center gap-3 mb-1">
                              <span className="text-[8px] text-slate-600 w-8 shrink-0">M1</span>
                              <span className={`text-[11px] font-black uppercase italic flex-1 text-right truncate ${pair.teamAId === userTeamId ? 'text-orange-300' : 'text-slate-300'}`}>{clubA?.name ?? pair.teamAId}</span>
                              <span className="w-16 text-center text-[13px] font-black text-white tabular-nums">{leg1Done ? `${pair.leg1?.homeScore} : ${pair.leg1?.awayScore}` : '– : –'}</span>
                              <span className={`text-[11px] font-black uppercase italic flex-1 truncate ${pair.teamBId === userTeamId ? 'text-orange-300' : 'text-slate-300'}`}>{clubB?.name ?? pair.teamBId}</span>
                            </div>
                            {/* M2: teamB gospodarz */}
                            <div className="flex items-center gap-3">
                              <span className="text-[8px] text-slate-600 w-8 shrink-0">M2</span>
                              <span className={`text-[11px] font-black uppercase italic flex-1 text-right truncate ${pair.teamBId === userTeamId ? 'text-orange-300' : 'text-slate-300'}`}>{clubB?.name ?? pair.teamBId}</span>
                              <span className="w-16 text-center text-[13px] font-black text-white tabular-nums">{leg2Done ? `${pair.leg2?.homeScore} : ${pair.leg2?.awayScore}` : '– : –'}</span>
                              <span className={`text-[11px] font-black uppercase italic flex-1 truncate ${pair.teamAId === userTeamId ? 'text-orange-300' : 'text-slate-300'}`}>{clubA?.name ?? pair.teamAId}</span>
                            </div>
                            {agg && (
                              <div className="mt-2 pt-2 border-t border-white/[0.05] flex justify-center">
                                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">
                                  Agregat: {agg.teamATotal} : {agg.teamBTotal}
                                  {pair.leg2?.awayPenaltyScore != null ? ` · k. ${pair.leg2.awayPenaltyScore}:${pair.leg2.homePenaltyScore}` : ''}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ── 1/4 FINAŁU ───────────────────────────────────────────── */}
              {selectedRoundKey === 'QF' && (
                <div className="max-w-3xl mx-auto py-4 px-6">
                  {!qfAvailable ? (
                    <div className="flex flex-col items-center justify-center h-64 gap-4">
                      <div className="text-5xl opacity-20">🟠</div>
                      <p className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-600">Losowanie 1/4 Finału jeszcze nie zostało przeprowadzone</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 pb-8">
                      {qfPairs.map((pair, i) => {
                        const clubA = getClub(pair.teamAId);
                        const clubB = getClub(pair.teamBId);
                        const agg = getAggregate(pair);
                        const isUser = isUserPair(pair);
                        const leg1Done = pair.leg1?.status === MatchStatus.FINISHED;
                        const leg2Done = pair.leg2?.status === MatchStatus.FINISHED;
                        return (
                          <div key={pair.pairId}
                            className={`rounded-2xl border p-4 transition-colors
                              ${isUser ? 'border-amber-400/30 bg-amber-400/5' : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'}`}>
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-[8px] font-black uppercase tracking-[0.4em] text-slate-600">
                                Para {i + 1}
                              </span>
                              {agg?.winnerId && (
                                <span className="text-[8px] font-black uppercase tracking-widest text-emerald-400">
                                  Awans: {getClub(agg.winnerId)?.name}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mb-1">
                              <span className="text-[8px] text-slate-600 w-8 shrink-0">M1</span>
                              <span className={`text-[11px] font-black uppercase italic flex-1 text-right truncate ${pair.teamAId === userTeamId ? 'text-orange-300' : 'text-slate-300'}`}>{clubA?.name ?? pair.teamAId}</span>
                              <span className="w-16 text-center text-[13px] font-black text-white tabular-nums">{leg1Done ? `${pair.leg1?.homeScore} : ${pair.leg1?.awayScore}` : '– : –'}</span>
                              <span className={`text-[11px] font-black uppercase italic flex-1 truncate ${pair.teamBId === userTeamId ? 'text-orange-300' : 'text-slate-300'}`}>{clubB?.name ?? pair.teamBId}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-[8px] text-slate-600 w-8 shrink-0">M2</span>
                              <span className={`text-[11px] font-black uppercase italic flex-1 text-right truncate ${pair.teamBId === userTeamId ? 'text-orange-300' : 'text-slate-300'}`}>{clubB?.name ?? pair.teamBId}</span>
                              <span className="w-16 text-center text-[13px] font-black text-white tabular-nums">{leg2Done ? `${pair.leg2?.homeScore} : ${pair.leg2?.awayScore}` : '– : –'}</span>
                              <span className={`text-[11px] font-black uppercase italic flex-1 truncate ${pair.teamAId === userTeamId ? 'text-orange-300' : 'text-slate-300'}`}>{clubA?.name ?? pair.teamAId}</span>
                            </div>
                            {agg && (
                              <div className="mt-2 pt-2 border-t border-white/[0.05] flex justify-center">
                                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">
                                  Agregat: {agg.teamATotal} : {agg.teamBTotal}
                                  {pair.leg2?.awayPenaltyScore != null ? ` · k. ${pair.leg2.awayPenaltyScore}:${pair.leg2.homePenaltyScore}` : ''}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ── 1/2 FINAŁU ───────────────────────────────────────────── */}
              {selectedRoundKey === 'SF' && (
                <div className="max-w-3xl mx-auto py-4 px-6">
                  {!sfAvailable ? (
                    <div className="flex flex-col items-center justify-center h-64 gap-4">
                      <div className="text-5xl opacity-20">🟠</div>
                      <p className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-600">Losowanie 1/2 Finału jeszcze nie zostało przeprowadzone</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 pb-8">
                      {sfPairs.map((pair, i) => {
                        const clubA = getClub(pair.teamAId);
                        const clubB = getClub(pair.teamBId);
                        const agg = getAggregate(pair);
                        const isUser = isUserPair(pair);
                        const leg1Done = pair.leg1?.status === MatchStatus.FINISHED;
                        const leg2Done = pair.leg2?.status === MatchStatus.FINISHED;
                        return (
                          <div key={pair.pairId}
                            className={`rounded-2xl border p-4 transition-colors
                              ${isUser ? 'border-amber-400/30 bg-amber-400/5' : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'}`}>
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-[8px] font-black uppercase tracking-[0.4em] text-slate-600">
                                Para {i + 1}
                              </span>
                              {agg?.winnerId && (
                                <span className="text-[8px] font-black uppercase tracking-widest text-emerald-400">
                                  Awans: {getClub(agg.winnerId)?.name}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mb-1">
                              <span className="text-[8px] text-slate-600 w-8 shrink-0">M1</span>
                              <span className={`text-[11px] font-black uppercase italic flex-1 text-right truncate ${pair.teamAId === userTeamId ? 'text-orange-300' : 'text-slate-300'}`}>{clubA?.name ?? pair.teamAId}</span>
                              <span className="w-16 text-center text-[13px] font-black text-white tabular-nums">{leg1Done ? `${pair.leg1?.homeScore} : ${pair.leg1?.awayScore}` : '– : –'}</span>
                              <span className={`text-[11px] font-black uppercase italic flex-1 truncate ${pair.teamBId === userTeamId ? 'text-orange-300' : 'text-slate-300'}`}>{clubB?.name ?? pair.teamBId}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-[8px] text-slate-600 w-8 shrink-0">M2</span>
                              <span className={`text-[11px] font-black uppercase italic flex-1 text-right truncate ${pair.teamBId === userTeamId ? 'text-orange-300' : 'text-slate-300'}`}>{clubB?.name ?? pair.teamBId}</span>
                              <span className="w-16 text-center text-[13px] font-black text-white tabular-nums">{leg2Done ? `${pair.leg2?.homeScore} : ${pair.leg2?.awayScore}` : '– : –'}</span>
                              <span className={`text-[11px] font-black uppercase italic flex-1 truncate ${pair.teamAId === userTeamId ? 'text-orange-300' : 'text-slate-300'}`}>{clubA?.name ?? pair.teamAId}</span>
                            </div>
                            {agg && (
                              <div className="mt-2 pt-2 border-t border-white/[0.05] flex justify-center">
                                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">
                                  Agregat: {agg.teamATotal} : {agg.teamBTotal}
                                  {pair.leg2?.awayPenaltyScore != null ? ` · k. ${pair.leg2.awayPenaltyScore}:${pair.leg2.homePenaltyScore}` : ''}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ── FINAŁ ────────────────────────────────────────────────── */}
              {selectedRoundKey === 'FINAL' && (
                <div className="max-w-3xl mx-auto py-4 px-6">
                  {!finalAvailable ? (
                    <div className="flex flex-col items-center justify-center h-64 gap-4">
                      <div className="text-5xl opacity-20">🟠</div>
                      <p className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-600">Finał nie został jeszcze ogłoszony</p>
                    </div>
                  ) : (() => {
                    const clubA = getClub(finalFixture!.homeTeamId);
                    const clubB = getClub(finalFixture!.awayTeamId);
                    const finalDoneFlag = finalFixture!.status === MatchStatus.FINISHED;
                    const isUserInFinal = finalFixture!.homeTeamId === userTeamId || finalFixture!.awayTeamId === userTeamId;
                    return (
                      <div className="flex flex-col gap-3 pb-8">
                        <div className={`rounded-2xl border p-6 transition-colors
                          ${isUserInFinal ? 'border-amber-400/30 bg-amber-400/5' : 'border-white/[0.06] bg-white/[0.02]'}`}>
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-[8px] font-black uppercase tracking-[0.4em] text-slate-600">Finał Ligi Europy</span>
                            {finalDoneFlag && finalFixture!.homeScore !== null && (
                              <span className="text-[8px] font-black uppercase tracking-widest text-emerald-400">
                                Zwycięzca: {finalFixture!.homeScore! > finalFixture!.awayScore! ? (clubA?.name ?? finalFixture!.homeTeamId) : finalFixture!.awayScore! > finalFixture!.homeScore! ? (clubB?.name ?? finalFixture!.awayTeamId) : (finalFixture!.homePenaltyScore ?? 0) > (finalFixture!.awayPenaltyScore ?? 0) ? (clubA?.name ?? finalFixture!.homeTeamId) : (clubB?.name ?? finalFixture!.awayTeamId)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 justify-center">
                            <span className={`text-[14px] font-black uppercase italic flex-1 text-right truncate
                              ${finalFixture!.homeTeamId === userTeamId ? 'text-orange-300' : 'text-slate-300'}`}>
                              {clubA?.name ?? finalFixture!.homeTeamId}
                            </span>
                            <div className="w-24 text-center shrink-0">
                              {finalDoneFlag && finalFixture!.homeScore !== null
                                ? <span className="text-[20px] font-black text-white tabular-nums">{finalFixture!.homeScore} : {finalFixture!.awayScore}</span>
                                : <span className="text-[14px] font-black text-slate-600 uppercase tracking-widest">VS</span>
                              }
                              {finalDoneFlag && finalFixture!.homePenaltyScore != null && finalFixture!.awayPenaltyScore != null && (
                                <div className="text-[8px] font-black text-rose-400 uppercase tracking-widest mt-0.5">
                                  k. {finalFixture!.homePenaltyScore}:{finalFixture!.awayPenaltyScore}
                                </div>
                              )}
                            </div>
                            <span className={`text-[14px] font-black uppercase italic flex-1 text-left truncate
                              ${finalFixture!.awayTeamId === userTeamId ? 'text-orange-300' : 'text-slate-300'}`}>
                              {clubB?.name ?? finalFixture!.awayTeamId}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* ── R1Q / R2Q — pary dwumeczowe ─────────────────────────── */}
              {(selectedRoundKey === 'R1Q' || selectedRoundKey === 'R2Q') && (() => {
                const pairs = pairsForKey(selectedRoundKey);
                if (pairs.length === 0) return (
                  <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-600">
                    <span className="text-4xl">⏳</span>
                    <p className="text-sm font-black uppercase tracking-widest">Losowanie nie odbyło się jeszcze</p>
                  </div>
                );
                return (
                  <div className="max-w-4xl mx-auto py-4 px-6 flex flex-col gap-2">
                    {pairs.map(pair => {
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
                                  <span className="px-2 py-0.5 rounded-lg bg-orange-500/80 text-[7px] font-black uppercase tracking-widest text-white border border-orange-400/40">
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
                                  <span className={agg.winnerId === pair.teamAId ? 'text-orange-400' : ''}>
                                    {agg.teamATotal}
                                  </span>
                                </span>
                              )}
                            </div>

                            {/* ŚRODEK */}
                            <div className="w-52 shrink-0 flex flex-col items-center justify-center gap-1.5">
                              {/* 1. mecz: teamA gospodarz → homeScore=A, awayScore=B */}
                              <div className="flex items-center gap-2 w-full justify-center">
                                <span className="text-[7px] font-black uppercase tracking-widest text-slate-600 w-14 text-right">
                                  {formatDate(pair.leg1!.date)}
                                </span>
                                {leg1Done ? (
                                  <span className="text-[12px] font-black tabular-nums text-slate-300">
                                    {pair.leg1!.homeScore} : {pair.leg1!.awayScore}
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest">vs</span>
                                )}
                                <span className="text-[7px] font-black uppercase tracking-widest text-orange-600/70 w-14 text-left">
                                  1. mecz
                                </span>
                              </div>

                              {/* Rewanż: teamB gospodarz → homeScore=B, awayScore=A — pokazujemy A:B */}
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
                                  <span className="text-[7px] font-black uppercase tracking-widest text-orange-600/70 w-14 text-left">
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
                                  <span className="px-2 py-0.5 rounded-lg bg-orange-500/80 text-[7px] font-black uppercase tracking-widest text-white border border-orange-400/40">
                                    AWANS
                                  </span>
                                )}
                              </div>
                              {agg && (
                                <span className="text-[9px] font-black tabular-nums text-slate-500">
                                  Agregat:{' '}
                                  <span className={agg.winnerId === pair.teamBId ? 'text-orange-400' : ''}>
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
                );
              })()}

            </div>
          </div>
        </div>
      )}

      {/* ── HISTORIA ─────────────────────────────────────────────────────────── */}
      {activeTab === 'history' && (
        <div className="relative z-10 flex-1 overflow-y-auto p-6">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-600">
              <span className="text-4xl">📜</span>
              <p className="text-sm font-black uppercase tracking-widest">Brak danych historycznych</p>
              <p className="text-xs text-slate-700">Historia będzie tu uzupełniana po każdym sezonie</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-8">
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
  );
};
