import React from 'react';
import { useGame } from '../../context/GameContext';

export const GameNotification: React.FC = () => {
  const { gameNotification, clearGameNotification } = useGame();

  if (!gameNotification) return null;

  const toneStyles = {
    success: {
      badge: 'text-emerald-300',
      glow: 'from-emerald-500/30 via-emerald-400/10 to-transparent',
      accent: 'bg-emerald-400',
      border: 'border-emerald-400/20'
    },
    info: {
      badge: 'text-sky-300',
      glow: 'from-sky-500/30 via-sky-400/10 to-transparent',
      accent: 'bg-sky-400',
      border: 'border-sky-400/20'
    },
    warning: {
      badge: 'text-amber-300',
      glow: 'from-amber-500/30 via-amber-400/10 to-transparent',
      accent: 'bg-amber-400',
      border: 'border-amber-400/20'
    }
  }[gameNotification.tone];

  return (
    <div className="pointer-events-none fixed inset-x-0 top-5 z-[1400] flex justify-center px-4">
      <div className={`pointer-events-auto relative w-full max-w-2xl overflow-hidden rounded-[30px] border bg-slate-950/88 shadow-[0_40px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl ${toneStyles.border}`}>
        <div className={`absolute inset-0 bg-gradient-to-r ${toneStyles.glow} opacity-80`} />
        <div className="absolute inset-x-0 top-0 h-px bg-white/10" />

        <div className="relative flex items-start gap-4 p-5 sm:p-6">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[22px] border border-white/10 bg-white/5 shadow-inner">
            <div className={`h-3 w-3 rounded-full ${toneStyles.accent} shadow-[0_0_18px_currentColor]`} />
          </div>

          <div className="min-w-0 flex-1">
            <div className={`text-[10px] font-black uppercase tracking-[0.38em] ${toneStyles.badge}`}>
              Centrum transferowe
            </div>
            <h3 className="mt-2 text-xl font-black uppercase italic tracking-tight text-white sm:text-2xl">
              {gameNotification.title}
            </h3>
            <p className="mt-2 max-w-xl text-sm font-medium leading-relaxed text-slate-300 sm:text-[15px]">
              {gameNotification.message}
            </p>
          </div>

          <button
            onClick={clearGameNotification}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-sm font-black text-slate-300 transition-all hover:scale-105 hover:border-white/30 hover:bg-white/10 hover:text-white"
          >
            X
          </button>
        </div>
      </div>
    </div>
  );
};
