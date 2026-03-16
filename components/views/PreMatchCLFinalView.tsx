import React, { useMemo } from 'react';
import { useGame } from '../../context/GameContext';
import { ViewState, CompetitionType, MatchStatus } from '../../types';
import ligaMistrzowBg from '../../Graphic/themes/liga_mistrzow.png';

const GLASS_CARD = "bg-slate-950/40 backdrop-blur-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-[40px] relative overflow-hidden";
const GLOSS_LAYER = "absolute inset-0 bg-gradient-to-br from-white/[0.05] via-transparent to-transparent pointer-events-none";

export const PreMatchCLFinalView: React.FC = () => {
  const { fixtures, clubs, currentDate, navigateTo, processCLMatchDay } = useGame();

  const finalFixture = useMemo(() => {
    return fixtures.find(f =>
      f.date.toDateString() === currentDate.toDateString() &&
      f.status === MatchStatus.SCHEDULED &&
      f.leagueId === CompetitionType.CL_FINAL
    ) ?? null;
  }, [fixtures, currentDate]);

  const getClub = (id: string) => clubs.find(c => c.id === id);

  const handleSimulate = () => {
    processCLMatchDay();
    navigateTo(ViewState.POST_MATCH_CL_FINAL);
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
              <p className="text-amber-400 text-[9px] font-black uppercase tracking-[0.5em]">UEFA Champions League</p>
              <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white leading-none">
                Finał Ligi Mistrzów
              </h1>
              <p className="text-slate-400 text-xs mt-1">{currentDate.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
          </div>
          <button
            onClick={handleSimulate}
            className="px-10 py-4 bg-amber-400 hover:bg-amber-300 text-slate-900 font-black italic uppercase tracking-widest rounded-2xl shadow-2xl transition-all hover:scale-105 active:scale-95 text-sm"
          >
            SYMULUJ MECZ →
          </button>
        </div>

        {/* MECZ */}
        <div className={GLASS_CARD + " flex-1 overflow-y-auto p-6"}>
          <div className={GLOSS_LAYER} />
          <div className="relative z-10 max-w-3xl mx-auto">
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-500 mb-5 text-center">
              Finał · Mecz jednorazowy
            </p>
            {finalFixture ? (() => {
              const home = getClub(finalFixture.homeTeamId);
              const away = getClub(finalFixture.awayTeamId);
              if (!home || !away) return null;
              return (
                <div className="flex items-center justify-between px-6 py-4 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] rounded-3xl transition-colors group">
                  <div className="flex items-center gap-3 flex-1 justify-end">
                    <span className="text-white font-bold text-sm text-right">{home.name}</span>
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-base">⚽</div>
                  </div>
                  <div className="px-6 text-slate-500 font-black text-lg">vs</div>
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-base">⚽</div>
                    <span className="text-white font-bold text-sm">{away.name}</span>
                  </div>
                </div>
              );
            })() : (
              <p className="text-slate-400 text-center">Brak zaplanowanego meczu finałowego.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};