import React, { useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { ViewState } from '../types';
import { CONFDrawService } from './CONFDrawService';
import LigaKonferencjiBg from '../Graphic/themes/Liga_konferencji.png';

const GLASS_CARD = "bg-slate-950/40 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-[40px] relative overflow-hidden";
const GLOSS_LAYER = "absolute inset-0 bg-gradient-to-br from-white/[0.05] via-transparent to-transparent pointer-events-none";

export const CONFFinalDrawView: React.FC = () => {
  const { clubs, fixtures, userTeamId, navigateTo, confirmCONFFinalDraw } = useGame();

  const getClub = (id: string) => clubs.find(c => c.id === id);

  const finalists = useMemo(() => CONFDrawService.getSFWinners(fixtures), [fixtures]);

  const clubA = finalists[0] ? getClub(finalists[0]) : null;
  const clubB = finalists[1] ? getClub(finalists[1]) : null;

  const userIsFinalist = finalists.includes(userTeamId ?? '');

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden relative">

      {/* TŁO */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${LigaKonferencjiBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'brightness(0.4)'
          }}
        />
        <div className="absolute inset-0 bg-slate-950/60" />
      </div>

      <div className="relative z-10 flex flex-col h-full p-6 gap-4">

        {/* HEADER */}
        <div className={GLASS_CARD + " p-6 flex items-center justify-between shrink-0"}>
          <div className={GLOSS_LAYER} />
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-3xl">
              🟢
            </div>
            <div>
              <p className="text-emerald-500 text-[9px] font-black uppercase tracking-[0.5em]">UEFA Conference League</p>
              <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white leading-none">
                Finał Ligi Konferencji
              </h1>
              <p className="text-slate-400 text-xs mt-1">
                Para finałowa wyłoniona · Mecz jednorazowy · 27 maja
              </p>
            </div>
          </div>
          <button
            onClick={confirmCONFFinalDraw}
            className="px-10 py-4 bg-emerald-500 hover:bg-emerald-400 text-white font-black italic uppercase tracking-widest rounded-2xl shadow-2xl transition-all hover:scale-105 active:scale-95 text-sm"
          >
            DALEJ →
          </button>
        </div>

        {/* FINALIŚCI */}
        <div className={GLASS_CARD + " flex-1 flex flex-col items-center justify-center p-8 gap-8"}>
          <div className={GLOSS_LAYER} />
          <div className="relative z-10 w-full max-w-2xl flex flex-col gap-6">

            <p className="text-[9px] font-black uppercase tracking-[0.5em] text-slate-500 text-center">
              Finał Ligi Konferencji · 27 maja
            </p>

            {userIsFinalist && (
              <div className="text-center">
                <span className="inline-block px-5 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-[0.4em]">
                  🎉 Twój klub awansował do Finału!
                </span>
              </div>
            )}

            {/* Para finałowa */}
            {clubA && clubB ? (
              <div className="flex items-center px-6 py-6 bg-white/[0.04] border border-white/[0.08] rounded-3xl gap-4">

                {/* Klub A */}
                <div className="flex items-center gap-3 flex-1 justify-end">
                  {finalists[0] === userTeamId && (
                    <span className="text-amber-400 text-[9px] font-black uppercase tracking-[0.3em] shrink-0">TY</span>
                  )}
                  <span className="text-xl font-black uppercase italic tracking-tight text-white text-right truncate">
                    {clubA.name}
                  </span>
                  <div
                    className="w-4 h-8 rounded-full border border-white/10 shrink-0"
                    style={{ backgroundColor: clubA.colorsHex?.[0] ?? '#555' }}
                  />
                </div>

                {/* VS */}
                <div className="w-20 flex flex-col items-center shrink-0">
                  <span className="text-2xl font-black text-slate-500 uppercase tracking-widest">vs</span>
                </div>

                {/* Klub B */}
                <div className="flex items-center gap-3 flex-1 justify-start">
                  <div
                    className="w-4 h-8 rounded-full border border-white/10 shrink-0"
                    style={{ backgroundColor: clubB.colorsHex?.[0] ?? '#555' }}
                  />
                  <span className="text-xl font-black uppercase italic tracking-tight text-white truncate">
                    {clubB.name}
                  </span>
                  {finalists[1] === userTeamId && (
                    <span className="text-amber-400 text-[9px] font-black uppercase tracking-[0.3em] shrink-0">TY</span>
                  )}
                </div>

              </div>
            ) : (
              <div className="text-center text-slate-500 text-sm">
                Brak danych finalistów — sprawdź wyniki 1/2 finału.
              </div>
            )}

            <p className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-600 text-center mt-2">
              Miejsce: Neutralny stadion · Format: Mecz jednorazowy · Ew. dogrywka i rzuty karne
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
