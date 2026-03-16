import React, { useMemo } from 'react';
import { useGame } from '../../context/GameContext';
import { CompetitionType, MatchStatus, ViewState } from '../../types';
import { CLDrawService } from '../../services/CLDrawService';
import ligaMistrzowBg from '../../Graphic/themes/liga_mistrzow.png';

const GLASS_CARD = "bg-slate-950/40 backdrop-blur-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-[40px] relative overflow-hidden";
const GLOSS_LAYER = "absolute inset-0 bg-gradient-to-br from-white/[0.05] via-transparent to-transparent pointer-events-none";

const GROUP_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

export const CLR16DrawView: React.FC = () => {
  const { clubs, fixtures, clGroups, confirmCLR16Draw, userTeamId } = useGame();

  const getClub = (id: string) => clubs.find(c => c.id === id);

  const pairs = useMemo(() => {
    if (!clGroups) return [];
    return CLDrawService.computeR16Pairs(clGroups, fixtures);
  }, [clGroups, fixtures]);

  // Dla każdej pary — oblicz z której grupy pochodzi winner i runner-up
  const getPairLabel = (i: number) => {
    const matchups = [
      { w: 'A', r: 'C' }, { w: 'B', r: 'D' }, { w: 'C', r: 'A' }, { w: 'D', r: 'B' },
      { w: 'E', r: 'G' }, { w: 'F', r: 'H' }, { w: 'G', r: 'E' }, { w: 'H', r: 'F' },
    ];
    const m = matchups[i];
    return m ? `Zw. Gr. ${m.w} vs 2. Gr. ${m.r}` : `Para ${i + 1}`;
  };

  if (!clGroups) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-950 text-white">
        <p className="text-slate-500 text-sm">Faza grupowa nie została jeszcze zakończona.</p>
      </div>
    );
  }

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
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-3xl">
              🏆
            </div>
            <div>
              <p className="text-red-400 text-[9px] font-black uppercase tracking-[0.5em]">UEFA Champions League</p>
              <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white leading-none">
                Losowanie 1/8 Finału
              </h1>
              <p className="text-slate-400 text-xs mt-1">
                Zwycięzcy grup vs Wicemistrzowie · Format dwumeczowy
              </p>
            </div>
          </div>
          <button
            onClick={confirmCLR16Draw}
            className="px-10 py-4 bg-red-500 hover:bg-red-400 text-white font-black italic uppercase tracking-widest rounded-2xl shadow-2xl transition-all hover:scale-105 active:scale-95 text-sm"
          >
            POTWIERDŹ →
          </button>
        </div>

        {/* PARY */}
        <div className={GLASS_CARD + " flex-1 overflow-y-auto p-6"}>
          <div className={GLOSS_LAYER} />
          <div className="relative z-10 max-w-3xl mx-auto">
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-500 mb-5 text-center">
              8 par · 1. mecz: 19 stycznia · Rewanż: 25 stycznia
            </p>
            <div className="flex flex-col gap-3">
              {pairs.map((pair, i) => {
                const winner = getClub(pair.winnerId);
                const runner = getClub(pair.runnerId);
                const isUserIn =
                  pair.winnerId === userTeamId || pair.runnerId === userTeamId;

                return (
                  <div
                    key={i}
                    className={`flex items-center px-6 py-4 rounded-3xl border transition-colors
                      ${isUserIn
                        ? 'bg-amber-400/10 border-amber-400/30'
                        : 'bg-white/[0.03] border-white/[0.05] hover:bg-white/[0.06]'}`}
                  >
                    {/* Label */}
                    <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-600 w-28 shrink-0">
                      {getPairLabel(i)}
                    </span>
                    {/* Runner-up (1. mecz gospodarz) */}
                    <div className="flex items-center gap-3 flex-1 justify-end">
                      <span className={`text-xs font-black uppercase italic tracking-tight text-right truncate max-w-[160px]
                        ${pair.runnerId === userTeamId ? 'text-amber-300' : 'text-slate-300'}`}>
                        {runner?.name ?? pair.runnerId}
                      </span>
                      <div
                        className="w-3 h-8 rounded-full border border-white/10 shrink-0"
                        style={{ backgroundColor: runner?.colorsHex?.[0] ?? '#555' }}
                      />
                      <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest shrink-0 w-8 text-center">
                        2M
                      </span>
                    </div>
                    {/* VS */}
                    <div className="w-12 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-black text-slate-500 uppercase">vs</span>
                    </div>
                    {/* Winner */}
                    <div className="flex items-center gap-3 flex-1 justify-start">
                      <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest shrink-0 w-8 text-center">
                        1M
                      </span>
                      <div
                        className="w-3 h-8 rounded-full border border-white/10 shrink-0"
                        style={{ backgroundColor: winner?.colorsHex?.[0] ?? '#555' }}
                      />
                      <span className={`text-xs font-black uppercase italic tracking-tight truncate max-w-[160px]
                        ${pair.winnerId === userTeamId ? 'text-amber-300' : 'text-slate-300'}`}>
                        {winner?.name ?? pair.winnerId}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-center text-[8px] text-slate-600 font-black uppercase tracking-widest mt-6">
              2M = Gospodarz 1. meczu (wicemistrz grupy) · 1M = Gospodarz rewanżu (mistrz grupy)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};