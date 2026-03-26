import React, { useMemo } from 'react';
import { useGame } from '../../context/GameContext';
import { CompetitionType } from '../../types';
import { CLDrawService } from '../../services/CLDrawService';
import ligaMistrzowBg from '../../Graphic/themes/cl_theme.png';

const GLASS_CARD = "bg-slate-950/40 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-[40px] relative overflow-hidden";
const GLOSS_LAYER = "absolute inset-0 bg-gradient-to-br from-white/[0.05] via-transparent to-transparent pointer-events-none";

export const CLSFDrawView: React.FC = () => {
  const { clubs, fixtures, confirmCLSFDraw, userTeamId, sessionSeed } = useGame();

  const getClub = (id: string) => clubs.find(c => c.id === id);

  const qfWinners = useMemo(() => CLDrawService.getQFWinners(fixtures), [fixtures]);

  const pairs = useMemo(() => {
    if (qfWinners.length < 2) return [];
    const shuffled = [...qfWinners];
    let s = sessionSeed ^ 0xabcdef12;
    for (let i = shuffled.length - 1; i > 0; i--) {
      s = (s * 1664525 + 1013904223) & 0xffffffff;
      const j = Math.abs(s) % (i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const result: { teamA: string; teamB: string }[] = [];
    for (let i = 0; i < shuffled.length - 1; i += 2) {
      if (shuffled[i] && shuffled[i + 1]) {
        result.push({ teamA: shuffled[i], teamB: shuffled[i + 1] });
      }
    }
    return result;
  }, [qfWinners, sessionSeed]);

  if (qfWinners.length === 0) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-950 text-white">
        <p className="text-slate-500 text-sm">Brak zwycięzców 1/4 finału — sprawdź czy wszystkie mecze zostały rozegrane.</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden relative">
      {/* TŁO */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${ligaMistrzowBg})`,
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
            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-3xl">
              🌟
            </div>
            <div>
              <p className="text-purple-400 text-[9px] font-black uppercase tracking-[0.5em]">UEFA Champions League</p>
              <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white leading-none">
                Losowanie 1/2 Finału
              </h1>
              <p className="text-slate-400 text-xs mt-1">
                Pełne losowanie bez koszyczków · Format dwumeczowy
              </p>
            </div>
          </div>
          <button
            onClick={confirmCLSFDraw}
            className="px-10 py-4 bg-purple-600 hover:bg-purple-500 text-white font-black italic uppercase tracking-widest rounded-2xl shadow-2xl transition-all hover:scale-105 active:scale-95 text-sm"
          >
            POTWIERDŹ →
          </button>
        </div>

        {/* PARY */}
        <div className={GLASS_CARD + " flex-1 overflow-y-auto p-6"}>
          <div className={GLOSS_LAYER} />
          <div className="relative z-10 max-w-3xl mx-auto">
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-500 mb-5 text-center">
              2 pary · 1. mecz: 26 marca · Rewanż: 15 kwietnia
            </p>
            <div className="flex flex-col gap-3">
              {pairs.map((pair, i) => {
                const clubA = getClub(pair.teamA);
                const clubB = getClub(pair.teamB);
                const isUserIn = pair.teamA === userTeamId || pair.teamB === userTeamId;

                return (
                  <div
                    key={i}
                    className={`flex items-center px-6 py-4 rounded-3xl border transition-colors
                      ${isUserIn
                        ? 'bg-amber-400/10 border-amber-400/30'
                        : 'bg-white/[0.03] border-white/[0.05] hover:bg-white/[0.06]'}`}
                  >
                    <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-600 w-16 shrink-0">
                      Para {i + 1}
                    </span>

                    <div className="flex items-center gap-3 flex-1 justify-end">
                      {isUserIn && pair.teamA === userTeamId && (
                        <span className="text-amber-400 text-[9px] font-black uppercase tracking-[0.3em]">TY</span>
                      )}
                      <span className="text-sm font-black uppercase italic tracking-tight text-white text-right truncate max-w-[180px]">
                        {clubA?.name ?? pair.teamA}
                      </span>
                      <div className="w-3 h-6 rounded-full border border-white/10 shrink-0"
                        style={{ backgroundColor: clubA?.colorsHex?.[0] ?? '#555' }} />
                    </div>

                    <div className="w-20 flex flex-col items-center shrink-0">
                      <span className="text-xs font-black text-slate-500 uppercase tracking-widest">vs</span>
                    </div>

                    <div className="flex items-center gap-3 flex-1 justify-start">
                      <div className="w-3 h-6 rounded-full border border-white/10 shrink-0"
                        style={{ backgroundColor: clubB?.colorsHex?.[0] ?? '#555' }} />
                      <span className="text-sm font-black uppercase italic tracking-tight text-white truncate max-w-[180px]">
                        {clubB?.name ?? pair.teamB}
                      </span>
                      {isUserIn && pair.teamB === userTeamId && (
                        <span className="text-amber-400 text-[9px] font-black uppercase tracking-[0.3em]">TY</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-600 mt-6 text-center">
              Lewa drużyna = gospodarz 1. meczu · Prawa drużyna = gospodarz rewanżu
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};