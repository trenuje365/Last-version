import React, { useMemo, useState } from 'react';
import { useGame } from '../context/GameContext';
import { CompetitionType, MatchStatus, ViewState } from '../types';
import { RAW_CONFERENCE_LEAGUE_CLUBS, generateCONFClubId } from '../resources/static_db/clubs/ConferenceLeagueTeams';
import { CONFDrawService } from './CONFDrawService';
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

const hasClinched = (
  position: number,
  table: { pts: number; played: number }[],
): boolean => {
  if (position >= 2) return false;
  const teamPts = table[position].pts;
  for (let i = 2; i < table.length; i++) {
    const rival = table[i];
    const remaining = Math.max(0, 6 - rival.played);
    if (rival.pts + 3 * remaining >= teamPts) return false;
  }
  return true;
};

const GROUP_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

const CONF_ROUNDS = [
  { key: 'R1Q', label: 'R1Q', sublabel: '1. Runda Kwalifikacyjna', accent: '#10b981' },
  { key: 'R2Q', label: 'R2Q', sublabel: '2. Runda Kwalifikacyjna', accent: '#34d399' },
  { key: 'GS',  label: 'GS',  sublabel: 'Faza Grupowa',            accent: '#34d399' },
  { key: 'R16', label: '1/8', sublabel: '1/8 Finału',              accent: '#06b6d4' },
  { key: 'QF',  label: '1/4', sublabel: '1/4 Finału',              accent: '#10b981' },
  { key: 'SF',  label: '1/2', sublabel: '1/2 Finału',              accent: '#10b981' },
  { key: 'FINAL', label: 'FINAŁ', sublabel: 'Finał Ligi Konferencji', accent: '#10b981' },
] as const;

const R16_PAIR_LABELS = ['1A–2C','1B–2D','1C–2A','1D–2B','1E–2G','1F–2H','1G–2E','1H–2F'];

type CONFRoundKey = typeof CONF_ROUNDS[number]['key'];

export const CONFHistoryView: React.FC = () => {
  const { fixtures, clubs, userTeamId, navigateTo, confGroups } = useGame();
  const [activeRound, setActiveRound] = useState<CONFRoundKey>('R1Q');
  const [selectedGroup, setSelectedGroup] = useState<number>(0);
  const [gsMatchdayTab, setGsMatchdayTab] = useState<number>(1);

  const computeGroupTable = (groupTeams: string[]) => {
    const stats: Record<string, { played: number; w: number; d: number; l: number; gf: number; ga: number; pts: number }> = {};
    groupTeams.forEach(id => { stats[id] = { played: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 }; });
    fixtures.forEach(f => {
      if (f.leagueId !== CompetitionType.CONF_GROUP_STAGE) return;
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

  const gsFixtures = useMemo(
    () => fixtures.filter(f => f.leagueId === CompetitionType.CONF_GROUP_STAGE),
    [fixtures],
  );

  const r16Fixtures = useMemo(
    () => fixtures.filter(f =>
      f.leagueId === CompetitionType.CONF_R16 ||
      f.leagueId === CompetitionType.CONF_R16_RETURN,
    ),
    [fixtures],
  );

  const gsAvailable = !!confGroups && confGroups.length > 0;

  const r16Pairs = useMemo((): CONFPair[] => {
    return r16Fixtures.filter(f => f.leagueId === CompetitionType.CONF_R16).map(leg1 => {
      const ret = r16Fixtures.find(f => f.id === leg1.id + '_RETURN');
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
  }, [r16Fixtures]);

  const r16Available = r16Pairs.length > 0;

  const qfFixtures = useMemo(
    () => fixtures.filter(f =>
      f.leagueId === CompetitionType.CONF_QF ||
      f.leagueId === CompetitionType.CONF_QF_RETURN,
    ),
    [fixtures],
  );

  const qfPairs = useMemo((): CONFPair[] => {
    return qfFixtures.filter(f => f.leagueId === CompetitionType.CONF_QF).map(leg1 => {
      const ret = qfFixtures.find(f => f.id === leg1.id + '_RETURN');
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
  }, [qfFixtures]);

  const qfAvailable = qfPairs.length > 0;

  const sfFixtures = useMemo(
    () => fixtures.filter(f =>
      f.leagueId === CompetitionType.CONF_SF ||
      f.leagueId === CompetitionType.CONF_SF_RETURN,
    ),
    [fixtures],
  );

  const sfPairs = useMemo((): CONFPair[] => {
    return sfFixtures.filter(f => f.leagueId === CompetitionType.CONF_SF).map(leg1 => {
      const ret = sfFixtures.find(f => f.id === leg1.id + '_RETURN');
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
  }, [sfFixtures]);

  const sfAvailable = sfPairs.length > 0;

  const finalFixture = useMemo(
    () => fixtures.find(f => f.leagueId === CompetitionType.CONF_FINAL) ?? null,
    [fixtures],
  );

  const finalAvailable = !!finalFixture;
  const finalDone = finalFixture?.status === MatchStatus.FINISHED ? 1 : 0;

  const allConfFixtures = useMemo(() => [...r1qFixtures, ...r2qFixtures, ...gsFixtures, ...r16Fixtures, ...qfFixtures, ...sfFixtures, ...(finalFixture ? [finalFixture] : [])], [r1qFixtures, r2qFixtures, gsFixtures, r16Fixtures, qfFixtures, sfFixtures, finalFixture]);

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
  const r16Done = r16Pairs.filter(p => p.leg2?.status === MatchStatus.FINISHED).length;
  const qfDone = qfPairs.filter(p => p.leg2?.status === MatchStatus.FINISHED).length;
  const sfDone = sfPairs.filter(p => p.leg2?.status === MatchStatus.FINISHED).length;

  const activePairs = activeRound === 'R1Q' ? r1qPairs : activeRound === 'R2Q' ? r2qPairs : activeRound === 'R16' ? r16Pairs : activeRound === 'QF' ? qfPairs : activeRound === 'SF' ? sfPairs : [];
  const activeDone = activeRound === 'R1Q' ? r1qDone : activeRound === 'R2Q' ? r2qDone : activeRound === 'R16' ? r16Done : activeRound === 'QF' ? qfDone : activeRound === 'SF' ? sfDone : activeRound === 'FINAL' ? finalDone : 0;
  const activeRoundLabel = activeRound === 'R1Q' ? '1. Runda Kwalifikacyjna' : activeRound === 'R2Q' ? '2. Runda Kwalifikacyjna' : activeRound === 'R16' ? '1/8 Finału' : activeRound === 'QF' ? '1/4 Finału' : activeRound === 'SF' ? '1/2 Finału' : activeRound === 'FINAL' ? 'Finał Ligi Konferencji' : 'Faza Grupowa';

  const getPairsForRound = (key: CONFRoundKey) => key === 'R1Q' ? r1qPairs : key === 'R2Q' ? r2qPairs : key === 'R16' ? r16Pairs : key === 'QF' ? qfPairs : key === 'SF' ? sfPairs : [];
  const getDoneForRound = (key: CONFRoundKey) => key === 'R1Q' ? r1qDone : key === 'R2Q' ? r2qDone : key === 'R16' ? r16Done : key === 'QF' ? qfDone : key === 'SF' ? sfDone : key === 'FINAL' ? finalDone : 0;
  const getTotalForRound = (key: CONFRoundKey) => key === 'GS' ? (confGroups?.length ?? 0) : key === 'FINAL' ? (finalFixture ? 1 : 0) : getPairsForRound(key).length;
  const getProgressForRound = (key: CONFRoundKey) => {
    if (key === 'GS') return gsAvailable ? 100 : 0;
    if (key === 'SF') return sfAvailable ? (sfDone / sfPairs.length) * 100 : 0;
    if (key === 'FINAL') return finalAvailable ? (finalDone > 0 ? 100 : 0) : 0;
    const total = getPairsForRound(key).length;
    return total > 0 ? (getDoneForRound(key) / total) * 100 : 0;
  };

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
              const total = getTotalForRound(round.key);
              const progress = getProgressForRound(round.key);
              const hasUser = round.key === 'GS'
                ? (confGroups ?? []).some(g => g.includes(userTeamId ?? ''))
                : round.key === 'FINAL'
                ? !!(finalFixture && (finalFixture.homeTeamId === userTeamId || finalFixture.awayTeamId === userTeamId))
                : pairs.some(isUserPair);
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
                {activeRoundLabel}{activeRound !== 'GS' && activeRound !== 'FINAL' ? ' — Dwumecze' : ''}
              </h2>
              <span className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-600">
                {activeRound === 'GS'
                  ? gsAvailable ? '8 grup • 32 drużyny' : 'Losowanie jeszcze nie odbyło się'
                  : activeRound === 'FINAL'
                  ? (finalAvailable ? (finalDone > 0 ? 'Mecz rozegrany' : 'Mecz jeszcze nie rozegrany') : 'Finał nie został jeszcze ogłoszony')
                  : activeRound === 'R16'
                  ? (r16Available ? `${r16Done}/${r16Pairs.length} par rozegranych` : 'Losowanie jeszcze nie odbyło się')
                  : activeRound === 'QF'
                  ? (qfAvailable ? `${qfDone}/${qfPairs.length} par rozegranych` : 'Losowanie jeszcze nie odbyło się')
                  : activePairs.length > 0 ? `${activeDone}/${activePairs.length} par rozegranych` : 'Losowanie jeszcze nie odbyło się'}
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">

            {/* ── FAZA GRUPOWA ─────────────────────────────────────────── */}
            {activeRound === 'GS' && (
              <div className="max-w-5xl mx-auto py-4 px-6">
                {!gsAvailable ? (
                  <div className="flex flex-col items-center justify-center h-64 gap-4">
                    <div className="text-5xl opacity-20">🟢</div>
                    <p className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-600">Losowanie fazy grupowej nie zostało jeszcze przeprowadzone</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 pb-8">
                    {/* Selector grup */}
                    <div className="flex gap-2 flex-wrap">
                      {GROUP_LABELS.map((lbl, gi) => (
                        <button key={gi} onClick={() => setSelectedGroup(gi)}
                          className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest border transition-all
                            ${selectedGroup === gi ? 'bg-emerald-400/20 border-emerald-400/50 text-emerald-300' : 'border-white/10 text-slate-500 hover:text-white hover:border-white/20'}
                            ${confGroups![gi]?.includes(userTeamId ?? '') ? 'ring-1 ring-amber-400/40' : ''}`}
                        >
                          Gr. {lbl}
                        </button>
                      ))}
                    </div>

                    {/* Tabela grupy */}
                    {(() => {
                      const group = confGroups![selectedGroup];
                      const table = computeGroupTable(group);
                      return (
                        <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
                          <div className="px-4 py-3 border-b border-white/10 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-emerald-400/20 border border-emerald-400/30 flex items-center justify-center text-sm font-black text-emerald-400">
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
                                <th className="px-2 py-2 text-center w-10 font-black text-emerald-400">Pkt</th>
                              </tr>
                            </thead>
                            <tbody>
                              {table.map((row, ri) => {
                                const club = clubs.find(c => c.id === row.id);
                                const isUser = row.id === userTeamId;
                                const promotes = ri < 2;
                                return (
                                  <tr key={row.id} className={`border-b border-white/[0.04] transition-colors
                                    ${isUser ? 'bg-amber-400/10' : promotes ? 'bg-emerald-600/5' : 'hover:bg-white/[0.02]'}`}>
                                    <td className="px-4 py-2 text-center">
                                      <span className={`text-[9px] font-black ${promotes ? 'text-emerald-400' : 'text-slate-600'}`}>{ri + 1}</span>
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
                                        {hasClinched(ri, table) && <span className="ml-1 text-[7px] font-black text-emerald-400 uppercase tracking-widest shrink-0">✓ AWANS</span>}
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
                            ${gsMatchdayTab === md ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' : 'border-white/10 text-slate-600 hover:text-white'}`}>
                          K{md}
                        </button>
                      ))}
                    </div>

                    {/* Mecze wybranej kolejki */}
                    {(() => {
                      const groupLetter = GROUP_LABELS[selectedGroup];
                      const mdFixtures = fixtures.filter(f =>
                        f.leagueId === CompetitionType.CONF_GROUP_STAGE &&
                        f.id.includes(`CONF_GS_G${groupLetter}_MD${gsMatchdayTab}_`)
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
                                    : <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest">vs</span>
                                  }
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
            {activeRound === 'R16' && (
              <div className="max-w-3xl mx-auto py-4 px-6">
                {!r16Available ? (
                  <div className="flex flex-col items-center justify-center h-64 gap-4">
                    <div className="text-5xl opacity-20">🟢</div>
                    <p className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-600">Losowanie 1/8 Finału jeszcze nie zostało przeprowadzone</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 pb-8">
                    <div className="flex flex-wrap gap-2 justify-center mb-2">
                      {R16_PAIR_LABELS.map((lbl, i) => (
                        <span key={i} className="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">
                          {lbl}
                        </span>
                      ))}
                    </div>
                    {r16Pairs.map((pair, i) => {
                      const clubA = clubs.find(c => c.id === pair.teamAId);
                      const clubB = clubs.find(c => c.id === pair.teamBId);
                      const agg = getAggregate(pair);
                      const isUser = isUserPair(pair);
                      const leg1Done = pair.leg1?.status === MatchStatus.FINISHED;
                      const leg2Done = pair.leg2?.status === MatchStatus.FINISHED;
                      return (
                        <div key={pair.pairId} className={`flex items-center px-6 py-4 rounded-3xl border transition-colors
                          ${isUser ? 'bg-amber-400/10 border-amber-400/30' : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]'}`}>
                          <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-600 w-28 shrink-0">
                            {R16_PAIR_LABELS[i] ?? `Para ${i + 1}`}
                          </span>
                          {/* TEAM A */}
                          <div className="flex items-center gap-2 flex-1 justify-end">
                            {agg?.winnerId === pair.teamAId && (
                              <span className="px-2 py-0.5 rounded-lg bg-emerald-500/80 text-[7px] font-black uppercase tracking-widest text-white border border-emerald-400/40">AWANS</span>
                            )}
                            <span className={`text-xs font-black uppercase italic tracking-tight text-right truncate max-w-[150px]
                              ${pair.teamAId === userTeamId ? 'text-amber-300' : agg ? agg.winnerId === pair.teamAId ? 'text-white' : 'text-slate-500' : 'text-slate-300'}`}>
                              {clubA?.name ?? pair.teamAId}
                            </span>
                            <div className="w-3 h-8 rounded-full border border-white/10 shrink-0" style={{ backgroundColor: clubA?.colorsHex?.[0] ?? '#555' }} />
                          </div>
                          {/* WYNIKI */}
                          <div className="w-40 flex flex-col items-center gap-0.5 shrink-0 mx-2">
                            <div className="flex items-center gap-2">
                              {leg1Done
                                ? <span className="text-[12px] font-black tabular-nums text-slate-300">{pair.leg1!.homeScore} : {pair.leg1!.awayScore}</span>
                                : <span className="text-[9px] font-black text-slate-700 uppercase">vs</span>}
                              <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest">1M</span>
                            </div>
                            {pair.leg2 && (
                              <div className="flex items-center gap-2">
                                {leg2Done ? (
                                  <div className="flex flex-col items-center">
                                    <span className="text-[12px] font-black tabular-nums text-slate-300">{pair.leg2.awayScore} : {pair.leg2.homeScore}</span>
                                    {pair.leg2.homePenaltyScore != null && pair.leg2.awayPenaltyScore != null && (
                                      <span className="text-[7px] font-black uppercase tracking-widest text-rose-500 -mt-0.5">
                                        k. {pair.leg2.awayPenaltyScore}:{pair.leg2.homePenaltyScore}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-[9px] font-black text-slate-700 uppercase">vs</span>
                                )}
                                <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest">REW</span>
                              </div>
                            )}
                            {agg && leg2Done && (
                              <span className="text-[9px] font-black text-slate-500 tabular-nums">{agg.teamATotal} — {agg.teamBTotal}</span>
                            )}
                          </div>
                          {/* TEAM B */}
                          <div className="flex items-center gap-2 flex-1 justify-start">
                            <div className="w-3 h-8 rounded-full border border-white/10 shrink-0" style={{ backgroundColor: clubB?.colorsHex?.[0] ?? '#555' }} />
                            <span className={`text-xs font-black uppercase italic tracking-tight truncate max-w-[150px]
                              ${pair.teamBId === userTeamId ? 'text-amber-300' : agg ? agg.winnerId === pair.teamBId ? 'text-white' : 'text-slate-500' : 'text-slate-300'}`}>
                              {clubB?.name ?? pair.teamBId}
                            </span>
                            {agg?.winnerId === pair.teamBId && (
                              <span className="px-2 py-0.5 rounded-lg bg-emerald-500/80 text-[7px] font-black uppercase tracking-widest text-white border border-emerald-400/40">AWANS</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── 1/4 FINAŁU ───────────────────────────────────────────── */}
            {activeRound === 'QF' && (
              <div className="max-w-3xl mx-auto py-4 px-6">
                {!qfAvailable ? (
                  <div className="flex flex-col items-center justify-center h-64 gap-4">
                    <div className="text-5xl opacity-20">🟢</div>
                    <p className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-600">Losowanie 1/4 Finału jeszcze nie zostało przeprowadzone</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 pb-8">
                    {qfPairs.map((pair, i) => {
                      const clubA = clubs.find(c => c.id === pair.teamAId);
                      const clubB = clubs.find(c => c.id === pair.teamBId);
                      const agg = getAggregate(pair);
                      const isUser = isUserPair(pair);
                      const leg1Done = pair.leg1?.status === MatchStatus.FINISHED;
                      const leg2Done = pair.leg2?.status === MatchStatus.FINISHED;
                      return (
                        <div key={pair.pairId} className={`flex items-center px-6 py-4 rounded-3xl border transition-colors
                          ${isUser ? 'bg-amber-400/10 border-amber-400/30' : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]'}`}>
                          <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-600 w-28 shrink-0">
                            {`Para ${i + 1}`}
                          </span>
                          {/* TEAM A */}
                          <div className="flex items-center gap-2 flex-1 justify-end">
                            {agg?.winnerId === pair.teamAId && (
                              <span className="px-2 py-0.5 rounded-lg bg-emerald-500/80 text-[7px] font-black uppercase tracking-widest text-white border border-emerald-400/40">AWANS</span>
                            )}
                            <span className={`text-xs font-black uppercase italic tracking-tight text-right truncate max-w-[150px]
                              ${pair.teamAId === userTeamId ? 'text-amber-300' : agg ? agg.winnerId === pair.teamAId ? 'text-white' : 'text-slate-500' : 'text-slate-300'}`}>
                              {clubA?.name ?? pair.teamAId}
                            </span>
                            <div className="w-3 h-8 rounded-full border border-white/10 shrink-0" style={{ backgroundColor: clubA?.colorsHex?.[0] ?? '#555' }} />
                          </div>
                          {/* WYNIKI */}
                          <div className="w-40 flex flex-col items-center gap-0.5 shrink-0 mx-2">
                            <div className="flex items-center gap-2">
                              {leg1Done
                                ? <span className="text-[12px] font-black tabular-nums text-slate-300">{pair.leg1!.homeScore} : {pair.leg1!.awayScore}</span>
                                : <span className="text-[9px] font-black text-slate-700 uppercase">vs</span>}
                              <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest">1M</span>
                            </div>
                            {pair.leg2 && (
                              <div className="flex items-center gap-2">
                                {leg2Done ? (
                                  <div className="flex flex-col items-center">
                                    <span className="text-[12px] font-black tabular-nums text-slate-300">{pair.leg2.awayScore} : {pair.leg2.homeScore}</span>
                                    {pair.leg2.homePenaltyScore != null && pair.leg2.awayPenaltyScore != null && (
                                      <span className="text-[7px] font-black uppercase tracking-widest text-rose-500 -mt-0.5">
                                        k. {pair.leg2.awayPenaltyScore}:{pair.leg2.homePenaltyScore}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-[9px] font-black text-slate-700 uppercase">vs</span>
                                )}
                                <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest">REW</span>
                              </div>
                            )}
                            {agg && leg2Done && (
                              <span className="text-[9px] font-black text-slate-500 tabular-nums">{agg.teamATotal} — {agg.teamBTotal}</span>
                            )}
                          </div>
                          {/* TEAM B */}
                          <div className="flex items-center gap-2 flex-1 justify-start">
                            <div className="w-3 h-8 rounded-full border border-white/10 shrink-0" style={{ backgroundColor: clubB?.colorsHex?.[0] ?? '#555' }} />
                            <span className={`text-xs font-black uppercase italic tracking-tight truncate max-w-[150px]
                              ${pair.teamBId === userTeamId ? 'text-amber-300' : agg ? agg.winnerId === pair.teamBId ? 'text-white' : 'text-slate-500' : 'text-slate-300'}`}>
                              {clubB?.name ?? pair.teamBId}
                            </span>
                            {agg?.winnerId === pair.teamBId && (
                              <span className="px-2 py-0.5 rounded-lg bg-emerald-500/80 text-[7px] font-black uppercase tracking-widest text-white border border-emerald-400/40">AWANS</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── FINAŁ ────────────────────────────────────────────────── */}
            {activeRound === 'FINAL' && (() => {
              if (!finalFixture) {
                return (
                  <div className="flex flex-col items-center justify-center h-64 gap-4">
                    <div className="text-5xl opacity-20">🟢</div>
                    <p className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-600">Finał nie został jeszcze ogłoszony</p>
                  </div>
                );
              }
              const clubA = clubs.find(c => c.id === finalFixture.homeTeamId);
              const clubB = clubs.find(c => c.id === finalFixture.awayTeamId);
              const finalDoneFlag = finalFixture.status === MatchStatus.FINISHED;
              const isUserInFinal = finalFixture.homeTeamId === userTeamId || finalFixture.awayTeamId === userTeamId;
              return (
                <div className="flex flex-col gap-3 pb-8 max-w-2xl mx-auto py-4 px-6">
                  <div className={`rounded-2xl border p-6 transition-colors
                    ${isUserInFinal ? 'border-amber-400/30 bg-amber-400/5' : 'border-white/[0.06] bg-white/[0.02]'}`}>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[8px] font-black uppercase tracking-[0.4em] text-slate-600">Finał Ligi Konferencji</span>
                      {finalDoneFlag && finalFixture.homeScore !== null && (
                        <span className="text-[8px] font-black uppercase tracking-widest text-emerald-400">
                          Zwycięzca: {finalFixture.homeScore! > finalFixture.awayScore! ? (clubA?.name ?? finalFixture.homeTeamId) : finalFixture.awayScore! > finalFixture.homeScore! ? (clubB?.name ?? finalFixture.awayTeamId) : (finalFixture.homePenaltyScore ?? 0) > (finalFixture.awayPenaltyScore ?? 0) ? (clubA?.name ?? finalFixture.homeTeamId) : (clubB?.name ?? finalFixture.awayTeamId)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 justify-center">
                      <span className={`text-[14px] font-black uppercase italic flex-1 text-right truncate
                        ${finalFixture.homeTeamId === userTeamId ? 'text-amber-300' : 'text-slate-300'}`}>
                        {clubA?.name ?? finalFixture.homeTeamId}
                      </span>
                      <div className="w-24 text-center shrink-0">
                        {finalDoneFlag && finalFixture.homeScore !== null
                          ? <span className="text-[20px] font-black text-white tabular-nums">{finalFixture.homeScore} : {finalFixture.awayScore}</span>
                          : <span className="text-[14px] font-black text-slate-600 uppercase tracking-widest">VS</span>
                        }
                        {finalDoneFlag && finalFixture.homePenaltyScore != null && finalFixture.awayPenaltyScore != null && (
                          <div className="text-[8px] font-black text-rose-400 uppercase tracking-widest mt-0.5">
                            k. {finalFixture.homePenaltyScore}:{finalFixture.awayPenaltyScore}
                          </div>
                        )}
                      </div>
                      <span className={`text-[14px] font-black uppercase italic flex-1 text-left truncate
                        ${finalFixture.awayTeamId === userTeamId ? 'text-amber-300' : 'text-slate-300'}`}>
                        {clubB?.name ?? finalFixture.awayTeamId}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ── RUNDY KWALIFIKACYJNE ──────────────────────────────────── */}
            {activeRound !== 'GS' && activeRound !== 'R16' && activeRound !== 'QF' && activeRound !== 'FINAL' && activePairs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-600">
                <span className="text-4xl">⏳</span>
                <p className="text-sm font-black uppercase tracking-widest">Losowanie nie odbyło się jeszcze</p>
              </div>
            ) : activeRound !== 'GS' && activeRound !== 'R16' && activeRound !== 'QF' && activeRound !== 'FINAL' && (
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
