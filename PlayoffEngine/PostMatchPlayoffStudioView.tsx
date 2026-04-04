import React, { useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { ViewState } from '../types';
import { getClubLogo } from '../resources/ClubLogoAssets';
import EkstraklasaBg from '../Graphic/themes/ekstraklasa.png';

// ── POST-MATCH STUDIO — BARAŻOWY MECZ GRACZA ────────────────────────────────
// Wyświetla wynik interaktywnego meczu barażowego.
// Dla RELEGATION_LEG2 — pokazuje zagregowany wynik dwumeczu.
// Przycisk "Dalej" → widok obserwacyjny (inne wyniki) → advanceDay

const withAlpha = (color: string | undefined, alpha: number): string => {
  if (!color) return `rgba(148,163,184,${alpha})`;
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const n = hex.length === 3 ? hex.split('').map(c => c + c).join('') : hex;
    const r = parseInt(n.slice(0, 2), 16);
    const g = parseInt(n.slice(2, 4), 16);
    const b = parseInt(n.slice(4, 6), 16);
    if ([r, g, b].some(v => Number.isNaN(v))) return `rgba(148,163,184,${alpha})`;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return `rgba(148,163,184,${alpha})`;
};

export const PostMatchPlayoffStudioView: React.FC = () => {
  const {
    navigateTo,
    userTeamId,
    lastMatchSummary,
    activePlayoffMatch,
    setActivePlayoffMatch,
    relegationPlayoffFinalResult,
    clubs,
  } = useGame();

  if (!lastMatchSummary || !activePlayoffMatch) {
    navigateTo(ViewState.DASHBOARD);
    return null;
  }

  const { homeClub, awayClub, homeScore, awayScore, homePenaltyScore, awayPenaltyScore, homeGoals, awayGoals } = lastMatchSummary;
  const { matchType, pairIndex, firstLegResult } = activePlayoffMatch;

  const isLeg2 = matchType === 'RELEGATION_LEG2';
  const isPromotion = matchType === 'PROMOTION_SEMI' || matchType === 'PROMOTION_FINAL';

  const isPenalties = homePenaltyScore !== undefined && (homePenaltyScore > 0 || (awayPenaltyScore || 0) > 0);
  const isExtraTime = homeGoals.some(g => g.minute > 90) || awayGoals.some(g => g.minute > 90);

  // Kto wygrał ten mecz
  const matchWinnerId = useMemo(() => {
    if (isPenalties) {
      return (homePenaltyScore || 0) > (awayPenaltyScore || 0) ? homeClub.id : awayClub.id;
    }
    if (homeScore > awayScore) return homeClub.id;
    if (awayScore > homeScore) return awayClub.id;
    return null;
  }, [homeScore, awayScore, homePenaltyScore, awayPenaltyScore, homeClub.id, awayClub.id, isPenalties]);

  // Agregat po dwóch meczach (tylko LEG2)
  const aggregateInfo = useMemo(() => {
    if (!isLeg2 || !firstLegResult) return null;
    // firstLeg.homeId = L3 (gospodarze w leg1), firstLeg.awayId = L4
    // leg2: homeClub = L4 (gra u siebie), awayClub = L3
    const l3Id = firstLegResult.homeId;
    const l4Id = firstLegResult.awayId;
    const l3InLeg2Goals = awayScore; // L3 gra jako gość w leg2
    const l4InLeg2Goals = homeScore; // L4 gra jako gospodarz w leg2
    const l3Agg = firstLegResult.homeGoals + l3InLeg2Goals;
    const l4Agg = firstLegResult.awayGoals + l4InLeg2Goals;
    const outcome = relegationPlayoffFinalResult
      ? (pairIndex === 0 ? relegationPlayoffFinalResult.pair0 : relegationPlayoffFinalResult.pair1)
      : null;
    const winnerId = outcome?.winnerId ?? (l3Agg > l4Agg ? l3Id : l4Agg > l3Agg ? l4Id : null);
    const decidedBy = outcome?.decidedBy ?? 'AGGREGATE';
    const penalties = outcome?.penalties;
    return { l3Id, l4Id, l3Agg, l4Agg, winnerId, decidedBy, penalties };
  }, [isLeg2, firstLegResult, homeScore, awayScore, relegationPlayoffFinalResult, pairIndex]);

  // Widok obserwacyjny po kliknięciu "Dalej"
  const nextObservationView = useMemo(() => {
    if (matchType === 'RELEGATION_LEG1') return ViewState.RELEGATION_PLAYOFF_MATCH_1;
    if (matchType === 'RELEGATION_LEG2') return ViewState.RELEGATION_PLAYOFF_MATCH_2;
    if (matchType === 'PROMOTION_SEMI') return ViewState.PROMOTION_PLAYOFF_SEMI_VIEW;
    return ViewState.PROMOTION_PLAYOFF_FINAL_VIEW;
  }, [matchType]);

  const matchTitle = useMemo(() => {
    if (matchType === 'RELEGATION_LEG1') return 'BARAŻ O UTRZYMANIE — 1. MECZ';
    if (matchType === 'RELEGATION_LEG2') return 'BARAŻ O UTRZYMANIE — REWANŻ';
    if (matchType === 'PROMOTION_SEMI') return 'BARAŻ O AWANS — PÓŁFINAŁ';
    return 'BARAŻ O AWANS — FINAŁ';
  }, [matchType]);

  const userClub = userTeamId === homeClub.id ? homeClub : awayClub;
  const opponentClub = userTeamId === homeClub.id ? awayClub : homeClub;
  const userScore = userTeamId === homeClub.id ? homeScore : awayScore;
  const oppScore = userTeamId === homeClub.id ? awayScore : homeScore;
  const userWonMatch = matchWinnerId === userTeamId;

  // Kto awansował / utrzymał się
  const finalWinnerId = isLeg2 && aggregateInfo ? aggregateInfo.winnerId : matchWinnerId;
  const userWonTie = finalWinnerId === userTeamId;

  const bg = `linear-gradient(135deg,
    ${withAlpha(homeClub.colorsHex?.[0], 0.25)} 0%,
    rgba(2,6,23,0.6) 50%,
    ${withAlpha(awayClub.colorsHex?.[0], 0.25)} 100%)`;

  const accentColor = isPromotion
    ? (userWonTie ? 'emerald' : 'red')
    : (userWonTie ? 'emerald' : 'red');

  const handleDalej = () => {
    setActivePlayoffMatch(null);
    navigateTo(nextObservationView);
  };

  return (
    <div className="h-screen w-full text-slate-100 flex flex-col overflow-hidden relative" style={{ background: 'rgb(2,6,23)' }}>

      {/* Tło */}
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-cover bg-center scale-110 opacity-30" style={{ backgroundImage: `url(${EkstraklasaBg})` }} />
        <div className="absolute inset-0" style={{ backgroundImage: bg }} />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/70 to-slate-950" />
      </div>

      {/* Nagłówek */}
      <header className="shrink-0 w-full max-w-[1100px] mx-auto px-6 pt-6">
        <div className="text-center mb-2">
          <span className={`text-[10px] font-black tracking-[0.4em] uppercase ${isPromotion ? 'text-emerald-400' : 'text-amber-400'}`}>
            {matchTitle}
          </span>
        </div>

        {/* Wynik meczu */}
        <div className="bg-slate-900/70 border border-white/10 rounded-[40px] overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between px-8 py-5">
            {/* Gospodarz */}
            <div className="flex-1 flex items-center gap-4">
              {getClubLogo(homeClub.id) && <img src={getClubLogo(homeClub.id)} alt={homeClub.name} className="w-12 h-12 object-contain" />}
              <div>
                <div className="text-2xl font-black italic uppercase tracking-tight text-white">{homeClub.name}</div>
                {homeClub.id === userTeamId && <div className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Twoja drużyna</div>}
              </div>
            </div>

            {/* Wynik */}
            <div className="flex flex-col items-center px-8">
              <div className="text-5xl font-black text-white tracking-tighter">
                {homeScore} : {awayScore}
              </div>
              {isPenalties && (
                <div className="text-sm font-black text-amber-400 mt-1">
                  (karne {homePenaltyScore}:{awayPenaltyScore})
                </div>
              )}
              {!isPenalties && isExtraTime && (
                <div className="text-xs text-slate-400 mt-1 font-black uppercase">po dogrywce</div>
              )}
              {matchWinnerId && (
                <div className={`mt-2 text-[10px] font-black uppercase tracking-widest px-3 py-0.5 rounded-full ${
                  matchWinnerId === userTeamId ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40' : 'bg-red-900/30 text-red-400 border border-red-500/30'
                }`}>
                  {matchWinnerId === userTeamId ? 'Wygrałeś ten mecz' : 'Przegrałeś ten mecz'}
                </div>
              )}
            </div>

            {/* Gość */}
            <div className="flex-1 flex items-center justify-end gap-4">
              <div className="text-right">
                <div className="text-2xl font-black italic uppercase tracking-tight text-white">{awayClub.name}</div>
                {awayClub.id === userTeamId && <div className="text-[10px] font-black text-amber-400 uppercase tracking-widest text-right">Twoja drużyna</div>}
              </div>
              {getClubLogo(awayClub.id) && <img src={getClubLogo(awayClub.id)} alt={awayClub.name} className="w-12 h-12 object-contain" />}
            </div>
          </div>
        </div>
      </header>

      {/* Sekcja agregatu (tylko LEG2) */}
      {isLeg2 && aggregateInfo && (
        <div className="shrink-0 w-full max-w-[1100px] mx-auto px-6 mt-4">
          <div className="bg-amber-950/40 border border-amber-500/30 rounded-[28px] px-8 py-4">
            <div className="text-center text-[10px] font-black text-amber-400 uppercase tracking-widest mb-3">Wynik dwumeczu</div>
            <div className="flex items-center justify-center gap-6">
              {/* L3 */}
              <div className="flex items-center gap-3">
                {getClubLogo(aggregateInfo.l3Id) && <img src={getClubLogo(aggregateInfo.l3Id)} alt="" className="w-8 h-8 object-contain" />}
                <div className="text-center">
                  <div className="text-3xl font-black text-white">{aggregateInfo.l3Agg}</div>
                  <div className="text-[9px] text-slate-400 uppercase">2. Liga</div>
                </div>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-slate-400 font-black text-xl">—</span>
                <span className="text-[9px] text-slate-500 uppercase mt-1">agregat</span>
              </div>
              {/* L4 */}
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <div className="text-3xl font-black text-white">{aggregateInfo.l4Agg}</div>
                  <div className="text-[9px] text-slate-400 uppercase">3. Liga</div>
                </div>
                {getClubLogo(aggregateInfo.l4Id) && <img src={getClubLogo(aggregateInfo.l4Id)} alt="" className="w-8 h-8 object-contain" />}
              </div>
            </div>
            {aggregateInfo.decidedBy === 'PENALTIES' && aggregateInfo.penalties && (
              <div className="text-center mt-2 text-xs text-amber-400 font-black">
                Rzuty karne: {aggregateInfo.penalties.homeShots}:{aggregateInfo.penalties.awayShots}
              </div>
            )}
            {aggregateInfo.winnerId && (
              <div className={`mt-3 text-center text-sm font-black uppercase tracking-widest ${
                aggregateInfo.winnerId === userTeamId ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {(() => {
                  const winnerClub = clubs.find(c => c.id === aggregateInfo.winnerId);
                  const isL3Winner = aggregateInfo.winnerId === aggregateInfo.l3Id;
                  return aggregateInfo.winnerId === userTeamId
                    ? `✓ ${winnerClub?.name} UTRZYMUJE SIĘ w lidze`
                    : `✗ ${winnerClub?.name} ${isL3Winner ? 'utrzymuje się' : 'AWANSUJE do wyższej ligi'}`;
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Gole w meczu */}
      <div className="shrink-0 w-full max-w-[1100px] mx-auto px-6 mt-4">
        <div className="bg-slate-900/50 border border-white/8 rounded-[24px] px-6 py-4">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Gole</div>
          {[...homeGoals, ...awayGoals]
            .sort((a, b) => a.minute - b.minute)
            .map((g, i) => {
              const isHome = homeGoals.includes(g);
              return (
                <div key={i} className={`flex items-center gap-3 py-1 ${isHome ? 'justify-start' : 'justify-end'}`}>
                  {isHome && getClubLogo(homeClub.id) && <img src={getClubLogo(homeClub.id)} alt="" className="w-5 h-5 object-contain" />}
                  <span className="text-xs text-slate-300">{g.playerName ?? 'Nieznany'}</span>
                  <span className="text-xs font-black text-white">{g.minute}&apos;</span>
                  {!isHome && getClubLogo(awayClub.id) && <img src={getClubLogo(awayClub.id)} alt="" className="w-5 h-5 object-contain" />}
                </div>
              );
            })
          }
          {homeGoals.length === 0 && awayGoals.length === 0 && (
            <div className="text-xs text-slate-500 text-center py-2">Brak goli</div>
          )}
        </div>
      </div>

      {/* Przycisk Dalej */}
      <div className="flex-1 flex items-end justify-center pb-8">
        <button
          onClick={handleDalej}
          className="px-14 py-4 rounded-[20px] font-black italic uppercase tracking-widest text-base shadow-2xl transition-all hover:scale-[1.02] active:scale-95 border-b-4 bg-slate-700 border-slate-900 text-white hover:bg-slate-600"
        >
          Dalej → wyniki innych meczów
        </button>
      </div>
    </div>
  );
};
