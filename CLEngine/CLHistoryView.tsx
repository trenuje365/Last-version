import React, { useMemo, useState } from 'react';
import { useGame } from '../context/GameContext';
import { CompetitionType, MatchStatus, ViewState } from '../types';
import LigaMistrzowBg from '../Graphic/themes/liga_mistrzow.png';

// ── Rundy — na razie tylko R1Q. Kolejne dodaj tutaj. ──────────────────────
const CL_ROUNDS = [
  {
    key: 'R1Q',
    label: 'R1Q',
    sublabel: '1. Runda Kwalifikacyjna',
    accent: '#3b82f6',
  },
  {
    key: 'R2Q',
    label: 'R2Q',
    sublabel: '2. Runda Kwalifikacyjna',
    accent: '#8b5cf6',
  },
  {
    key: 'GS',
    label: 'GS',
    sublabel: 'Faza Grupowa',
    accent: '#f59e0b',
  },

  {
    key: 'R16',
    label: '1/8',
    sublabel: '1/8 Finału',
    accent: '#ef4444',
  },
  {
    key: 'QF',
    label: '1/4',
    sublabel: '1/4 Finału',
    accent: '#f97316',
  },
  {
    key: 'SF',
    label: '1/2',
    sublabel: '1/2 Finału',
    accent: '#a855f7',
  },

 {
    key: 'FINAL',
    label: 'Final',
    sublabel: 'Finał',
    accent: '#fbbf24',
  },

] as const;

// ── Para dwumeczowa ───────────────────────────────────────────────────────
interface CLPair {
  pairId: string;
  teamAId: string;
  teamBId: string;
  leg1?: { homeScore: number | null; awayScore: number | null; date: Date; status: MatchStatus };
  leg2?: {
    homeScore: number | null;
    awayScore: number | null;
    homePenaltyScore?: number | null;
    awayPenaltyScore?: number | null;
    date: Date;
    status: MatchStatus;
  };
}

export const CLHistoryView: React.FC = () => {
  const { fixtures, clubs, userTeamId, navigateTo, clGroups } = useGame();
  const [selectedRoundKey, setSelectedRoundKey] = useState<string>('R1Q');

   const GROUP_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const [selectedGroup, setSelectedGroup] = useState<number>(0);
  const [gsMatchdayTab, setGsMatchdayTab] = useState<number>(1); // 1..6

  // Oblicz tabelę grupy z fixturów
  const computeGroupTable = (groupTeams: string[], fixtures: typeof clFixtures) => {
    const stats: Record<string, { played: number; w: number; d: number; l: number; gf: number; ga: number; pts: number }> = {};
    groupTeams.forEach(id => { stats[id] = { played: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 }; });

    fixtures.forEach(f => {
      if (f.leagueId !== CompetitionType.CL_GROUP_STAGE) return;
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

  const getCountryForClub = (id: string): string => {
    // Próbujemy wyciągnąć kraj z nazwy id (np. ENG, ESP) lub zostawiamy puste
    return '';
  };

  // ── Filtruj fixtury CL ───────────────────────────────────────────────────
const clFixtures = useMemo(
    () =>
      fixtures.filter(
        f =>
          f.leagueId === CompetitionType.CL_R1Q ||
          f.leagueId === CompetitionType.CL_R1Q_RETURN ||
          f.leagueId === CompetitionType.CL_R2Q ||
          f.leagueId === CompetitionType.CL_R2Q_RETURN ||
                  f.leagueId === CompetitionType.CL_R16 ||
          f.leagueId === CompetitionType.CL_R16_RETURN ||
          f.leagueId === CompetitionType.CL_QF ||
          f.leagueId === CompetitionType.CL_QF_RETURN ||
          f.leagueId === CompetitionType.CL_SF ||
          f.leagueId === CompetitionType.CL_SF_RETURN
            || f.leagueId === CompetitionType.CL_FINAL
      ),
    [fixtures]
  );

  // ── Buduj pary z 1. meczów + rewanży ────────────────────────────────────
  const pairs = useMemo((): CLPair[] => {
    const firstLegs = clFixtures.filter(f => f.leagueId === CompetitionType.CL_R1Q);

    return firstLegs.map(leg1 => {
      const returnLeg = clFixtures.find(f => f.id === leg1.id + '_RETURN');

      return {
        pairId: leg1.id,
        // W 1. meczu: home = Team A, away = Team B
        teamAId: leg1.homeTeamId,
        teamBId: leg1.awayTeamId,
        leg1: {
          homeScore: leg1.homeScore ?? null,
          awayScore: leg1.awayScore ?? null,
          date: leg1.date instanceof Date ? leg1.date : new Date(leg1.date),
          status: leg1.status,
        },
        leg2: returnLeg
          ? {
              homeScore: returnLeg.homeScore ?? null,
              awayScore: returnLeg.awayScore ?? null,
              homePenaltyScore: returnLeg.homePenaltyScore,
              awayPenaltyScore: returnLeg.awayPenaltyScore,
              date: returnLeg.date instanceof Date ? returnLeg.date : new Date(returnLeg.date),
              status: returnLeg.status,
            }
          : undefined,
      };
    });
  }, [clFixtures]);



  // ── Buduj pary R2Q ───────────────────────────────────────────────────────
  const r2qPairs = useMemo((): CLPair[] => {
    const firstLegs = clFixtures.filter(f => f.leagueId === CompetitionType.CL_R2Q);
    return firstLegs.map(leg1 => {
      const returnLeg = clFixtures.find(f => f.id === leg1.id + '_RETURN');
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
        leg2: returnLeg
          ? {
              homeScore: returnLeg.homeScore ?? null,
              awayScore: returnLeg.awayScore ?? null,
              homePenaltyScore: returnLeg.homePenaltyScore,
              awayPenaltyScore: returnLeg.awayPenaltyScore,
              date: returnLeg.date instanceof Date ? returnLeg.date : new Date(returnLeg.date),
              status: returnLeg.status,
            }
          : undefined,
      };
    });
  }, [clFixtures]);

  const r16Pairs = useMemo((): CLPair[] => {
    const firstLegs = clFixtures.filter(f => f.leagueId === CompetitionType.CL_R16);
    return firstLegs.map(leg1 => {
      const returnLeg = clFixtures.find(f => f.id === leg1.id + '_RETURN');
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
        leg2: returnLeg
          ? {
              homeScore: returnLeg.homeScore ?? null,
              awayScore: returnLeg.awayScore ?? null,
              homePenaltyScore: returnLeg.homePenaltyScore,
              awayPenaltyScore: returnLeg.awayPenaltyScore,
              date: returnLeg.date instanceof Date ? returnLeg.date : new Date(returnLeg.date),
              status: returnLeg.status,
            }
          : undefined,
      };
    });
    }, [clFixtures]);

  const qfPairs = useMemo((): CLPair[] => {
    const firstLegs = clFixtures.filter(f => f.leagueId === CompetitionType.CL_QF);
    return firstLegs.map(leg1 => {
      const returnLeg = clFixtures.find(f => f.id === leg1.id + '_RETURN');
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
        leg2: returnLeg
          ? {
              homeScore: returnLeg.homeScore ?? null,
              awayScore: returnLeg.awayScore ?? null,
              homePenaltyScore: returnLeg.homePenaltyScore,
              awayPenaltyScore: returnLeg.awayPenaltyScore,
              date: returnLeg.date instanceof Date ? returnLeg.date : new Date(returnLeg.date),
              status: returnLeg.status,
            }
          : undefined,
      };
    });
  }, [clFixtures]);

  const sfPairs = useMemo((): CLPair[] => {
    const firstLegs = clFixtures.filter(f => f.leagueId === CompetitionType.CL_SF);
    return firstLegs.map(leg1 => {
      const returnLeg = clFixtures.find(f => f.id === leg1.id + '_RETURN');
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
        leg2: returnLeg
          ? {
              homeScore: returnLeg.homeScore ?? null,
              awayScore: returnLeg.awayScore ?? null,
              homePenaltyScore: returnLeg.homePenaltyScore,
              awayPenaltyScore: returnLeg.awayPenaltyScore,
              date: returnLeg.date instanceof Date ? returnLeg.date : new Date(returnLeg.date),
              status: returnLeg.status,
            }
          : undefined,
      };
    });
  }, [clFixtures]);

  // ── Finał (jeden mecz) ─────────────────────────────────────────────────
  const finalFixtures = useMemo(
    () => clFixtures.filter(f => f.leagueId === CompetitionType.CL_FINAL),
    [clFixtures]
  );

  // ── Oblicz agregat i zwycięzcę ───────────────────────────────────────────
  const getAggregate = (pair: CLPair) => {
    if (
      !pair.leg1 ||
      pair.leg1.status !== MatchStatus.FINISHED ||
      pair.leg1.homeScore === null ||
      pair.leg1.awayScore === null
    ) {
      return null;
    }

    // Agregat A = gole A w domu (leg1.home) + gole A na wyjeździe (leg2.away)
    const teamATotal =
      pair.leg1.homeScore +
      (pair.leg2?.status === MatchStatus.FINISHED && pair.leg2.awayScore !== null
        ? pair.leg2.awayScore
        : 0);

    // Agregat B = gole B na wyjeździe (leg1.away) + gole B w domu (leg2.home)
    const teamBTotal =
      pair.leg1.awayScore +
      (pair.leg2?.status === MatchStatus.FINISHED && pair.leg2.homeScore !== null
        ? pair.leg2.homeScore
        : 0);

    const returnDone = pair.leg2?.status === MatchStatus.FINISHED;

    let winnerId: string | null = null;
    if (returnDone) {
      if (teamATotal > teamBTotal) {
        winnerId = pair.teamAId;
      } else if (teamBTotal > teamATotal) {
        winnerId = pair.teamBId;
      } else if (
        pair.leg2 &&
        pair.leg2.homePenaltyScore != null &&
        pair.leg2.awayPenaltyScore != null
      ) {
        // karne: w rewanżu home = Team B, away = Team A
        winnerId =
          pair.leg2.homePenaltyScore > pair.leg2.awayPenaltyScore
            ? pair.teamBId
            : pair.teamAId;
      } else {
        // Fallback: karne nie zostały zapisane mimo remisu — awansuje Team A (gospodarz 1. meczu)
        winnerId = pair.teamAId;
      }
    }

    return { teamATotal, teamBTotal, returnDone, winnerId };
  };

  const getClub = (id: string) => clubs.find(c => c.id === id);
  const fmtDate = (d: Date) =>
    d.toLocaleDateString('pl-PL', { day: '2-digit', month: 'short' });
  const isUserPair = (pair: CLPair) =>
    pair.teamAId === userTeamId || pair.teamBId === userTeamId;

  const r1qDone = pairs.filter(p => p.leg2?.status === MatchStatus.FINISHED).length;

  const r2qDone = r2qPairs.filter(p => p.leg2?.status === MatchStatus.FINISHED).length;

  const gsAvailable = !!clGroups && clGroups.length > 0;
 const r16Available = r16Pairs.length > 0;
  const r16Done = r16Pairs.filter(p => p.leg2?.status === MatchStatus.FINISHED).length;
  const qfAvailable = qfPairs.length > 0;
  const qfDone = qfPairs.filter(p => p.leg2?.status === MatchStatus.FINISHED).length;
  const sfAvailable = sfPairs.length > 0;
  const sfDone = sfPairs.filter(p => p.leg2?.status === MatchStatus.FINISHED).length;
  const finalAvailable = finalFixtures.length > 0;
  const finalDone = finalFixtures.filter(f => f.status === MatchStatus.FINISHED).length;

  // ── Empty state ──────────────────────────────────────────────────────────

  // ── Empty state ──────────────────────────────────────────────────────────
  if (pairs.length === 0) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-950 text-white animate-fade-in">
        <div className="text-7xl mb-6 opacity-30">⭐</div>
        <h2 className="text-xl font-black uppercase tracking-[0.3em] text-slate-500 mb-3">
          Liga Mistrzów
        </h2>
        <p className="text-slate-700 text-[11px] font-black uppercase tracking-widest">
          Losowanie jeszcze nie zostało przeprowadzone
        </p>
        <button
          onClick={() => navigateTo(ViewState.LEAGUE_TABLES)}
          className="mt-12 px-8 py-3 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all active:scale-95"
        >
          &larr; Powrót
        </button>
      </div>
    );
  }

  return (
    <div className="h-[1080px] max-w-[1920px] mx-auto flex flex-col gap-0 animate-fade-in overflow-hidden relative">

      {/* BACKGROUND */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${LigaMistrzowBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center top',
            filter: 'brightness(0.2)',
          }}
        />
        <div className="absolute inset-0 bg-slate-950/89" />
        <div className="absolute top-[-15%] left-[-10%] w-[55%] h-[55%] rounded-full blur-[220px] opacity-[0.18] bg-blue-800" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full blur-[160px] opacity-[0.10] bg-indigo-600" />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* HEADER */}
      <div className="relative z-10 flex items-center justify-between px-8 py-5 bg-slate-900/60 border-b border-white/[0.07] backdrop-blur-3xl shrink-0 shadow-2xl">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-2xl shadow-inner shrink-0">
            ⭐
          </div>
          <div>
            <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white leading-none">
              Liga Mistrzów
            </h1>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-[9px] font-black uppercase tracking-[0.5em] text-blue-500">
                Eliminacje — Drabinka
              </span>
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-600">
                {pairs.length} par · {clFixtures.length} mecze
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => navigateTo(ViewState.LEAGUE_TABLES)}
          className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all active:scale-95"
        >
          &larr; Powrót
        </button>
      </div>

      {/* MAIN LAYOUT */}
      <div className="relative z-10 flex flex-1 overflow-hidden">

        {/* LEFT SIDEBAR */}
        <div className="w-56 shrink-0 flex flex-col bg-black/20 border-r border-white/[0.05] overflow-y-auto">
          <div className="px-4 pt-5 pb-3">
            <p className="text-[8px] font-black uppercase tracking-[0.4em] text-slate-600">Rundy</p>
          </div>
          <div className="flex flex-col gap-0.5 px-2 pb-4">
           {CL_ROUNDS.map(round => {
              const isActive = selectedRoundKey === round.key;
                        const activePairs = round.key === 'R2Q' ? r2qPairs : round.key === 'R16' ? r16Pairs : round.key === 'QF' ? qfPairs : round.key === 'SF' ? sfPairs : round.key === 'FINAL' ? [] : pairs;
              const total = round.key === 'GS' ? (clGroups?.length ?? 0) : round.key === 'FINAL' ? finalFixtures.length : round.key === 'R16' ? r16Pairs.length : round.key === 'QF' ? qfPairs.length : round.key === 'SF' ? sfPairs.length : activePairs.length;
              const done = round.key === 'R2Q' ? r2qDone : round.key === 'GS' ? (gsAvailable ? total : 0) : round.key === 'FINAL' ? finalDone : round.key === 'R16' ? r16Done : round.key === 'QF' ? qfDone : round.key === 'SF' ? sfDone : r1qDone;
              const progress = round.key === 'GS' ? (gsAvailable ? 100 : 0) : round.key === 'FINAL' ? (finalAvailable ? (finalDone / Math.max(finalFixtures.length, 1) * 100) : 0) : round.key === 'R16' ? (r16Available ? (r16Done / Math.max(r16Pairs.length, 1) * 100) : 0) : round.key === 'QF' ? (qfAvailable ? (qfDone / Math.max(qfPairs.length, 1) * 100) : 0) : round.key === 'SF' ? (sfAvailable ? (sfDone / Math.max(sfPairs.length, 1) * 100) : 0) : total > 0 ? (done / total) * 100 : 0;
              const hasUser = round.key === 'GS'
                ? (clGroups?.some(g => g.includes(userTeamId ?? '')) ?? false)
                : round.key === 'FINAL'
                  ? finalFixtures.some(f => f.homeTeamId === userTeamId || f.awayTeamId === userTeamId)
                  : activePairs.some(isUserPair);

              return (
                <button
                  key={round.key}
                  onClick={() => setSelectedRoundKey(round.key)}
                  className={`relative w-full text-left px-3 py-3 rounded-xl transition-all group overflow-hidden
                    ${isActive
                      ? 'bg-white/10 border border-white/15 shadow-lg'
                      : 'border border-transparent hover:bg-white/[0.04]'
                    }`}
                >
                  {isActive && (
                    <div
                      className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full"
                      style={{ backgroundColor: round.accent }}
                    />
                  )}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className={`text-[13px] font-black italic tracking-tight leading-none ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                        {round.label}
                      </div>
                      <div className={`text-[8px] font-black uppercase tracking-widest mt-0.5 ${isActive ? 'text-slate-400' : 'text-slate-600'}`}>
                        {round.sublabel}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {hasUser && done < total && (
                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                      )}
                      {done === total && total > 0 && (
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      )}
                      <span className="text-[8px] font-black text-slate-600 tabular-nums">{done}/{total}</span>
                    </div>
                  </div>
                  <div className="mt-2 h-[2px] bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${progress}%`, backgroundColor: round.accent }}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {/* LEGENDA */}
          <div className="mt-auto px-4 py-4 border-t border-white/[0.05]">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-600">Zakończona</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0" />
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-600">Twoja para</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT — PARY / GRUPY */}
        <div className="flex-1 flex flex-col overflow-hidden">
       <div className="px-8 py-4 border-b border-white/[0.05] flex items-center gap-4 shrink-0">
            <div
              className="w-2 h-8 rounded-full"
              style={{ backgroundColor:
                selectedRoundKey === 'GS' ? '#f59e0b'
                : selectedRoundKey === 'R2Q' ? '#8b5cf6'
                : selectedRoundKey === 'R16' ? '#ef4444'
                : selectedRoundKey === 'QF' ? '#f97316'
                : selectedRoundKey === 'SF' ? '#a855f7'
                : selectedRoundKey === 'FINAL' ? '#fbbf24'
                : '#3b82f6'
              }}
            />
            <div>
              <h2 className="text-xl font-black italic uppercase tracking-tighter text-white leading-none">
                {selectedRoundKey === 'GS'
                  ? 'Faza Grupowa — 8 Grup'
                  : selectedRoundKey === 'R16'
                    ? '1/8 Finału — Dwumecze'
                    : selectedRoundKey === 'QF'
                      ? '1/4 Finału — Dwumecze'
                      : selectedRoundKey === 'SF'
                        ? '1/2 Finału — Dwumecze'
                        : selectedRoundKey === 'FINAL'
                          ? 'Finał Ligi Mistrzów'
                          : selectedRoundKey === 'R2Q' ? '2.' : '1.'} {selectedRoundKey !== 'GS' && selectedRoundKey !== 'R16' && selectedRoundKey !== 'QF' && selectedRoundKey !== 'SF' && selectedRoundKey !== 'FINAL' && 'Runda Kwalifikacyjna — Dwumecze'}
              </h2>
              <span className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-600">
                {selectedRoundKey === 'GS'
                  ? gsAvailable ? '8 grup · 32 drużyny' : 'Losowanie jeszcze nie odbyło się'
                  : selectedRoundKey === 'R16'
                    ? r16Available ? `${r16Done}/${r16Pairs.length} par rozegranych` : 'Losowanie jeszcze nie odbyło się'
                    : selectedRoundKey === 'QF'
                      ? qfAvailable ? `${qfDone}/${qfPairs.length} par rozegranych` : 'Losowanie jeszcze nie odbyło się'
                      : selectedRoundKey === 'SF'
                        ? sfAvailable ? `${sfDone}/${sfPairs.length} par rozegranych` : 'Losowanie jeszcze nie odbyło się'
                        : selectedRoundKey === 'FINAL'
                          ? finalAvailable ? (finalDone > 0 ? 'Finał rozegrany' : 'Finał jeszcze nie rozegrany') : 'Finał jeszcze nie zaplanowany'
                          : selectedRoundKey === 'R2Q'
                            ? `${r2qDone}/${r2qPairs.length} par rozegranych`
                            : `${r1qDone}/${pairs.length} par rozegranych`
                }
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* ── FAZA GRUPOWA ── */}
            {selectedRoundKey === 'GS' ? (
              <div className="max-w-5xl mx-auto py-4 px-6">
                {!gsAvailable ? (
                  <div className="flex flex-col items-center justify-center h-64 gap-4">
                    <div className="text-5xl opacity-20">🏆</div>
                    <p className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-600">
                      Losowanie fazy grupowej nie zostało jeszcze przeprowadzone
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 pb-8">

                    {/* Selector grup */}
                    <div className="flex gap-2 flex-wrap">
                      {GROUP_LABELS.map((lbl, gi) => (
                        <button
                          key={gi}
                          onClick={() => setSelectedGroup(gi)}
                          className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest border transition-all
                            ${selectedGroup === gi
                              ? 'bg-yellow-400/20 border-yellow-400/50 text-yellow-300'
                              : 'border-white/10 text-slate-500 hover:text-white hover:border-white/20'
                            }
                            ${clGroups![gi]?.includes(userTeamId ?? '') ? 'ring-1 ring-amber-400/40' : ''}
                          `}
                        >
                          Gr. {lbl}
                        </button>
                      ))}
                    </div>

                    {/* Tabelka grupy */}
                    {(() => {
                      const group = clGroups![selectedGroup];
                      const table = computeGroupTable(group, fixtures);
                      return (
                        <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
                          <div className="px-4 py-3 border-b border-white/10 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-yellow-400/20 border border-yellow-400/30 flex items-center justify-center text-sm font-black text-yellow-400">
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
                                <th className="px-2 py-2 text-center w-10 font-black text-yellow-500">Pkt</th>
                              </tr>
                            </thead>
                            <tbody>
                              {table.map((row, ri) => {
                                const club = clubs.find(c => c.id === row.id);
                                const isUser = row.id === userTeamId;
                                const promotes = ri < 2;
                                return (
                                  <tr key={row.id} className={`border-b border-white/[0.04] transition-colors
                                    ${isUser ? 'bg-amber-400/10' : promotes ? 'bg-blue-600/5' : 'hover:bg-white/[0.02]'}`}>
                                    <td className="px-4 py-2 text-center">
                                      <span className={`text-[9px] font-black ${promotes ? 'text-blue-400' : 'text-slate-600'}`}>{ri + 1}</span>
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
                                        {promotes && <span className="ml-1 text-[7px] font-black text-blue-400 uppercase tracking-widest shrink-0">AWANS</span>}
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
                    <div className="flex gap-2 mb-1">
                      {[1,2,3,4,5,6].map(md => (
                        <button
                          key={md}
                          onClick={() => setGsMatchdayTab(md)}
                          className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all
                            ${gsMatchdayTab === md
                              ? 'bg-blue-600/20 border-blue-500/40 text-blue-300'
                              : 'border-white/10 text-slate-600 hover:text-white'
                            }`}
                        >
                          K{md}
                        </button>
                      ))}
                    </div>

                    {/* Lista meczów wybranej kolejki w wybranej grupie */}
                    {(() => {
                      const groupLetter = 'ABCDEFGH'[selectedGroup];
                      const mdFixtures = fixtures.filter(f =>
                        f.leagueId === CompetitionType.CL_GROUP_STAGE &&
                        f.id.includes(`CL_GS_G${groupLetter}_MD${gsMatchdayTab}_`)
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
                                <span className={`text-[12px] font-black uppercase italic flex-1 text-right truncate
                                  ${f.homeTeamId === userTeamId ? 'text-amber-300' : 'text-slate-200'}`}>
                                  {home?.name ?? f.homeTeamId}
                                </span>
                                <div className="mx-4 text-center shrink-0">
                                  {f.status === MatchStatus.FINISHED
                                    ? <span className="text-[14px] font-black text-white tabular-nums">{f.homeScore} : {f.awayScore}</span>
                                    : <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">vs</span>
                                  }
                                </div>
                                <span className={`text-[12px] font-black uppercase italic flex-1 text-left truncate
                                  ${f.awayTeamId === userTeamId ? 'text-amber-300' : 'text-slate-200'}`}>
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


                 
                
              
            ) : selectedRoundKey === 'R16' ? (
              <div className="max-w-3xl mx-auto py-4 px-6">
                {!r16Available ? (
                  <div className="flex flex-col items-center justify-center h-64 gap-4">
                    <div className="text-5xl opacity-20">🏆</div>
                    <p className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-600">
                      Losowanie 1/8 Finału jeszcze nie zostało przeprowadzone
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 pb-8">
                    {r16Pairs.map((pair, i) => {
                      const clubA = getClub(pair.teamAId);
                      const clubB = getClub(pair.teamBId);
                      const agg = getAggregate(pair);
                      const isUser = isUserPair(pair);
                      const pairLabels = ['A vs C','B vs D','C vs A','D vs B','E vs G','F vs H','G vs E','H vs F'];
                      const leg1Done = pair.leg1?.status === MatchStatus.FINISHED;
                      const leg2Done = pair.leg2?.status === MatchStatus.FINISHED;

                      return (
                        <div
                          key={pair.pairId}
                          className={`rounded-2xl border p-4 transition-colors
                            ${isUser ? 'border-amber-400/30 bg-amber-400/5' : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'}`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[8px] font-black uppercase tracking-[0.4em] text-slate-600">
                              Para {i + 1} · {pairLabels[i]}
                            </span>
                            {agg?.winnerId && (
                              <span className="text-[8px] font-black uppercase tracking-widest text-emerald-400">
                                Awans: {getClub(agg.winnerId)?.name}
                              </span>
                            )}
                          </div>

                          {/* 1. mecz: teamA = gospodarz */}
                          <div className="flex items-center gap-3 mb-1">
                            <span className="text-[8px] text-slate-600 w-8 shrink-0">M1</span>
                            <span className={`text-[11px] font-black uppercase italic flex-1 text-right truncate ${pair.teamAId === userTeamId ? 'text-amber-300' : 'text-slate-300'}`}>
                              {clubA?.name ?? pair.teamAId}
                            </span>
                            <span className="w-16 text-center text-[13px] font-black text-white tabular-nums">
                              {leg1Done ? `${pair.leg1?.homeScore} : ${pair.leg1?.awayScore}` : '– : –'}
                            </span>
                            <span className={`text-[11px] font-black uppercase italic flex-1 truncate ${pair.teamBId === userTeamId ? 'text-amber-300' : 'text-slate-300'}`}>
                              {clubB?.name ?? pair.teamBId}
                            </span>
                          </div>

                          {/* Rewanż: teamB = gospodarz */}
                          <div className="flex items-center gap-3">
                            <span className="text-[8px] text-slate-600 w-8 shrink-0">M2</span>
                            <span className={`text-[11px] font-black uppercase italic flex-1 text-right truncate ${pair.teamBId === userTeamId ? 'text-amber-300' : 'text-slate-300'}`}>
                              {clubB?.name ?? pair.teamBId}
                            </span>
                            <span className="w-16 text-center text-[13px] font-black text-white tabular-nums">
                              {leg2Done ? `${pair.leg2?.homeScore} : ${pair.leg2?.awayScore}` : '– : –'}
                            </span>
                            <span className={`text-[11px] font-black uppercase italic flex-1 truncate ${pair.teamAId === userTeamId ? 'text-amber-300' : 'text-slate-300'}`}>
                              {clubA?.name ?? pair.teamAId}
                            </span>
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
         


                       ) : selectedRoundKey === 'QF' ? (
              <div className="max-w-3xl mx-auto py-4 px-6">
                {!qfAvailable ? (
                  <div className="flex flex-col items-center justify-center h-64 gap-4">
                    <div className="text-5xl opacity-20">⚡</div>
                    <p className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-600">
                      Losowanie 1/4 Finału jeszcze nie zostało przeprowadzone
                    </p>
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
                        <div
                          key={pair.pairId}
                          className={`rounded-2xl border p-4 transition-colors
                            ${isUser ? 'border-amber-400/30 bg-amber-400/5' : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'}`}
                        >
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

                          {/* 1. mecz: teamA = gospodarz */}
                          <div className="flex items-center gap-3 mb-1">
                            <span className="text-[8px] text-slate-600 w-8 shrink-0">M1</span>
                            <span className={`text-[11px] font-black uppercase italic flex-1 text-right truncate ${pair.teamAId === userTeamId ? 'text-amber-300' : 'text-slate-300'}`}>
                              {clubA?.name ?? pair.teamAId}
                            </span>
                            <span className="w-16 text-center text-[13px] font-black text-white tabular-nums">
                              {leg1Done ? `${pair.leg1?.homeScore} : ${pair.leg1?.awayScore}` : '– : –'}
                            </span>
                            <span className={`text-[11px] font-black uppercase italic flex-1 truncate ${pair.teamBId === userTeamId ? 'text-amber-300' : 'text-slate-300'}`}>
                              {clubB?.name ?? pair.teamBId}
                            </span>
                          </div>

                          {/* Rewanż: teamB = gospodarz */}
                          <div className="flex items-center gap-3">
                            <span className="text-[8px] text-slate-600 w-8 shrink-0">M2</span>
                            <span className={`text-[11px] font-black uppercase italic flex-1 text-right truncate ${pair.teamBId === userTeamId ? 'text-amber-300' : 'text-slate-300'}`}>
                              {clubB?.name ?? pair.teamBId}
                            </span>
                            <span className="w-16 text-center text-[13px] font-black text-white tabular-nums">
                              {leg2Done ? `${pair.leg2?.homeScore} : ${pair.leg2?.awayScore}` : '– : –'}
                            </span>
                            <span className={`text-[11px] font-black uppercase italic flex-1 truncate ${pair.teamAId === userTeamId ? 'text-amber-300' : 'text-slate-300'}`}>
                              {clubA?.name ?? pair.teamAId}
                            </span>
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

            ) : selectedRoundKey === 'SF' ? (
              <div className="max-w-3xl mx-auto py-4 px-6">
                {!sfAvailable ? (
                  <div className="flex flex-col items-center justify-center h-64 gap-4">
                    <div className="text-5xl opacity-20">🌟</div>
                    <p className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-600">
                      Losowanie 1/2 Finału jeszcze nie zostało przeprowadzone
                    </p>
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
                        <div
                          key={pair.pairId}
                          className={`rounded-2xl border p-4 transition-colors
                            ${isUser ? 'border-amber-400/30 bg-amber-400/5' : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'}`}
                        >
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
                            <span className={`text-[11px] font-black uppercase italic flex-1 text-right truncate ${pair.teamAId === userTeamId ? 'text-amber-300' : 'text-slate-300'}`}>
                              {clubA?.name ?? pair.teamAId}
                            </span>
                            <span className="w-16 text-center text-[13px] font-black text-white tabular-nums">
                              {leg1Done ? `${pair.leg1?.homeScore} : ${pair.leg1?.awayScore}` : '– : –'}
                            </span>
                            <span className={`text-[11px] font-black uppercase italic flex-1 truncate ${pair.teamBId === userTeamId ? 'text-amber-300' : 'text-slate-300'}`}>
                              {clubB?.name ?? pair.teamBId}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-[8px] text-slate-600 w-8 shrink-0">M2</span>
                            <span className={`text-[11px] font-black uppercase italic flex-1 text-right truncate ${pair.teamBId === userTeamId ? 'text-amber-300' : 'text-slate-300'}`}>
                              {clubB?.name ?? pair.teamBId}
                            </span>
                            <span className="w-16 text-center text-[13px] font-black text-white tabular-nums">
                              {leg2Done ? `${pair.leg2?.homeScore} : ${pair.leg2?.awayScore}` : '– : –'}
                            </span>
                            <span className={`text-[11px] font-black uppercase italic flex-1 truncate ${pair.teamAId === userTeamId ? 'text-amber-300' : 'text-slate-300'}`}>
                              {clubA?.name ?? pair.teamAId}
                            </span>
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

            ) : selectedRoundKey === 'FINAL' ? (
              <div className="max-w-2xl mx-auto py-8 px-6">
                {!finalAvailable ? (
                  <div className="flex flex-col items-center justify-center h-64 gap-4">
                    <div className="text-5xl opacity-20">🏆</div>
                    <p className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-600">
                      Finał jeszcze nie został zaplanowany
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {finalFixtures.map(f => {
                      const home = getClub(f.homeTeamId);
                      const away = getClub(f.awayTeamId);
                      const isUser = f.homeTeamId === userTeamId || f.awayTeamId === userTeamId;
                      const finished = f.status === MatchStatus.FINISHED;
                      return (
                        <div
                          key={f.id}
                          className={`rounded-3xl border p-8 text-center backdrop-blur-sm
                            ${isUser ? 'border-amber-400/50 bg-amber-400/5 shadow-[0_0_60px_-10px_rgba(245,158,11,0.4)]' : 'border-white/10 bg-white/[0.03]'}`}
                        >
                          <div className="text-[8px] font-black uppercase tracking-[0.5em] text-amber-400 mb-6">🏆 Finał Ligi Mistrzów</div>
                          <div className="flex items-center justify-center gap-6">
                            <div className="flex-1 flex flex-col items-end gap-2">
                              <div className="flex items-center gap-3">
                                <span className={`text-xl font-black italic uppercase tracking-tight ${f.homeTeamId === userTeamId ? 'text-amber-300' : 'text-white'}`}>
                                  {home?.name ?? f.homeTeamId}
                                </span>
                                <div className="w-8 h-8 rounded-lg border border-white/20 flex flex-col overflow-hidden shrink-0">
                                  <div className="flex-1" style={{ backgroundColor: home?.colorsHex?.[0] ?? '#333' }} />
                                  <div className="flex-1" style={{ backgroundColor: home?.colorsHex?.[1] ?? '#555' }} />
                                </div>
                              </div>
                            </div>
                            <div className="shrink-0 flex flex-col items-center gap-1">
                              {finished ? (
                                <>
                                  <span className="text-5xl font-black text-white tabular-nums">{f.homeScore} : {f.awayScore}</span>
                                  {f.homePenaltyScore != null && (
                                    <span className="text-[11px] font-black text-slate-400">karne: {f.homePenaltyScore} : {f.awayPenaltyScore}</span>
                                  )}
                                </>
                              ) : (
                                <span className="text-2xl font-black text-slate-700 uppercase tracking-widest">vs</span>
                              )}
                              <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-1">
                                {f.date ? (f.date instanceof Date ? f.date : new Date(f.date)).toLocaleDateString('pl-PL', { day: '2-digit', month: 'long', year: 'numeric' }) : ''}
                              </span>
                            </div>
                            <div className="flex-1 flex flex-col items-start gap-2">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg border border-white/20 flex flex-col overflow-hidden shrink-0">
                                  <div className="flex-1" style={{ backgroundColor: away?.colorsHex?.[0] ?? '#333' }} />
                                  <div className="flex-1" style={{ backgroundColor: away?.colorsHex?.[1] ?? '#555' }} />
                                </div>
                                <span className={`text-xl font-black italic uppercase tracking-tight ${f.awayTeamId === userTeamId ? 'text-amber-300' : 'text-white'}`}>
                                  {away?.name ?? f.awayTeamId}
                                </span>
                              </div>
                            </div>
                          </div>
                          {finished && (() => {
                            let winnerId: string | null = null;
                            const hs = f.homeScore as number;
                            const as_ = f.awayScore as number;
                            if (hs > as_) winnerId = f.homeTeamId;
                            else if (as_ > hs) winnerId = f.awayTeamId;
                            else if (f.homePenaltyScore != null && f.awayPenaltyScore != null) {
                              winnerId = f.homePenaltyScore > f.awayPenaltyScore ? f.homeTeamId : f.awayTeamId;
                            }
                            const winner = winnerId ? getClub(winnerId) : null;
                            return winner ? (
                              <div className="mt-6 pt-4 border-t border-white/10">
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-400">🏆 Mistrz Europy: {winner.name}</span>
                              </div>
                            ) : null;
                          })()}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
            <div className="max-w-4xl mx-auto py-4 px-6 flex flex-col gap-2">
              {(selectedRoundKey === 'R2Q' ? r2qPairs : pairs).map(pair => {
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
                            <span className="px-2 py-0.5 rounded-lg bg-blue-600/80 text-[7px] font-black uppercase tracking-widest text-white border border-blue-400/40">
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
                            <span className={agg.winnerId === pair.teamAId ? 'text-blue-400' : ''}>
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
                            {fmtDate(pair.leg1!.date)}
                          </span>
                          {leg1Done ? (
                            <span className="text-[12px] font-black tabular-nums text-slate-300">
                              {pair.leg1!.homeScore} : {pair.leg1!.awayScore}
                            </span>
                          ) : (
                            <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest">vs</span>
                          )}
                          <span className="text-[7px] font-black uppercase tracking-widest text-blue-600/70 w-14 text-left">
                            1. mecz
                          </span>
                        </div>

                        {/* Rewanż */}
                        {pair.leg2 && (
                          <div className="flex items-center gap-2 w-full justify-center">
                            <span className="text-[7px] font-black uppercase tracking-widest text-slate-600 w-14 text-right">
                              {fmtDate(pair.leg2.date)}
                            </span>
                            {leg2Done ? (
                              <div className="flex flex-col items-center">
                                {/* W rewanżu: home = Team B, away = Team A — pokazujemy z perspektywy Team A (lewa strona) */}
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
                            <span className="text-[7px] font-black uppercase tracking-widest text-blue-600/70 w-14 text-left">
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
                            <span className="px-2 py-0.5 rounded-lg bg-blue-600/80 text-[7px] font-black uppercase tracking-widest text-white border border-blue-400/40">
                              AWANS
                            </span>
                          )}
                        </div>
                        {agg && (
                          <span className="text-[9px] font-black tabular-nums text-slate-500">
                            Agregat:{' '}
                            <span className={agg.winnerId === pair.teamBId ? 'text-blue-400' : ''}>
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