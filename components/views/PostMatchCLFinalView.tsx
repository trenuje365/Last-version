import React, { useMemo, useEffect, useRef } from 'react';
import { useGame } from '../../context/GameContext';
import { ViewState, CompetitionType, MatchStatus } from '../../types';
import { ChampionshipHistoryService } from '../../data/championship_history';
import ligaMistrzowBg from '../../Graphic/themes/Liga_mistrzow.png';

const GLASS_CARD = "bg-slate-950/40 backdrop-blur-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-[40px] relative overflow-hidden";
const GLOSS_LAYER = "absolute inset-0 bg-gradient-to-br from-white/[0.05] via-transparent to-transparent pointer-events-none";

export const PostMatchCLFinalView: React.FC = () => {
  const { fixtures, clubs, currentDate, navigateTo, advanceDay } = useGame();
  const savedMatchesRef = useRef<Set<string>>(new Set());

  const finalFixture = useMemo(() => {
    return fixtures.find(f =>
      f.date.toDateString() === currentDate.toDateString() &&
      f.status === MatchStatus.FINISHED &&
      f.leagueId === CompetitionType.CL_FINAL
    ) ?? null;
  }, [fixtures, currentDate]);

  const getClub = (id: string) => clubs.find(c => c.id === id);

  const getWinnerId = () => {
    if (!finalFixture) return null;
    const h = finalFixture.homeScore ?? 0;
    const a = finalFixture.awayScore ?? 0;
    if (h > a) return finalFixture.homeTeamId;
    if (a > h) return finalFixture.awayTeamId;
    if (finalFixture.homePenaltyScore != null && finalFixture.awayPenaltyScore != null) {
      return finalFixture.homePenaltyScore > finalFixture.awayPenaltyScore
        ? finalFixture.homeTeamId
        : finalFixture.awayTeamId;
    }
    return null;
  };

  // Zapisz zwycięzcę finału Ligi Mistrzów do historii (tylko raz dla każdego meczu)
  useEffect(() => {
    if (finalFixture && !savedMatchesRef.current.has(finalFixture.id)) {
      const winnerId = getWinnerId();
      if (winnerId) {
        const winnerClub = clubs.find(c => c.id === winnerId);
        const month = currentDate.getMonth();
        const year = currentDate.getFullYear();
        const seasonLabel = `${year}/${year + 1}`;

        if (winnerClub) {
          console.log('💾 Saving CL Final winner:', {
            seasonLabel,
            winner: winnerClub.name,
            timestamp: new Date().toISOString()
          });

          ChampionshipHistoryService.addCLChampion(seasonLabel, winnerClub.name, year + 1);
          savedMatchesRef.current.add(finalFixture.id);
        }
      }
    }
  }, [finalFixture, clubs, currentDate]);

  const handleContinue = () => {
    advanceDay();
    navigateTo(ViewState.DASHBOARD);
  };

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden relative">

      {/* TŁO */}
      <div className="fixed inset-0 z-0">
        <img src={ligaMistrzowBg} alt="" className="w-full h-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-slate-950/40 to-slate-950/90" />
      </div>

      <div className="relative z-10 flex flex-col h-full p-6 gap-4">

        {/* HEADER */}
        <div className={GLASS_CARD + " p-6 flex items-center justify-between shrink-0"}>
          <div className={GLOSS_LAYER} />
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-3xl">
              🏆
            </div>
            <div>
              <p className="text-amber-400 text-[9px] font-black uppercase tracking-[0.5em]">UEFA Champions League · Wyniki</p>
              <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white leading-none">
                Finał Ligi Mistrzów · Wynik
              </h1>
              <p className="text-slate-400 text-xs mt-1">{currentDate.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
          </div>
          <button
            onClick={handleContinue}
            className="px-10 py-4 bg-white hover:bg-slate-100 text-slate-900 font-black italic uppercase tracking-widest rounded-2xl shadow-2xl transition-all hover:scale-105 active:scale-95 text-sm"
          >
            KONTYNUUJ →
          </button>
        </div>

        {/* WYNIK */}
        <div className={GLASS_CARD + " flex-1 overflow-y-auto p-6"}>
          <div className={GLOSS_LAYER} />
          <div className="relative z-10 max-w-3xl mx-auto">
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-500 mb-5 text-center">
              Finał · Wynik oficjalny
            </p>
            {finalFixture ? (() => {
              const home = getClub(finalFixture.homeTeamId);
              const away = getClub(finalFixture.awayTeamId);
              if (!home || !away) return null;
              const winnerId = getWinnerId();
              const hasPens = finalFixture.homePenaltyScore != null;
              const homeWins = winnerId === finalFixture.homeTeamId;
              const awayWins = winnerId === finalFixture.awayTeamId;
              return (
                <div className="flex flex-col px-6 py-6 bg-white/[0.03] border border-white/[0.05] rounded-3xl gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 justify-end">
                      {homeWins && (
                        <span className="text-amber-400 text-[9px] font-black uppercase tracking-[0.3em]">🏆 MISTRZ EUROPY</span>
                      )}
                      <span className={`font-bold text-sm ${homeWins ? 'text-white' : 'text-slate-400'}`}>{home.name}</span>
                    </div>
                    <div className="px-8 text-center">
                      <span className="text-2xl font-black text-white">
                        {finalFixture.homeScore} – {finalFixture.awayScore}
                      </span>
                      {hasPens && (
                        <p className="text-amber-400 text-[9px] font-black uppercase tracking-widest mt-1">
                          Karne: {finalFixture.homePenaltyScore} – {finalFixture.awayPenaltyScore}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 flex-1">
                      <span className={`font-bold text-sm ${awayWins ? 'text-white' : 'text-slate-400'}`}>{away.name}</span>
                      {awayWins && (
                        <span className="text-amber-400 text-[9px] font-black uppercase tracking-[0.3em]">🏆 MISTRZ EUROPY</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })() : (
              <p className="text-slate-400 text-center">Brak wyniku finałowego.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};