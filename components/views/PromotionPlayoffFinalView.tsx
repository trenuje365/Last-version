import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { getClubLogo } from '../../resources/ClubLogoAssets';
import EkstraklasaBg from '../../Graphic/themes/ekstraklasa.png';
import { PlayoffPair, PromotionPlayoffSingleMatchResult } from '../../types';

// Sekcja helpera — bezpieczne doklejanie alfa do koloru klubu
const withAlpha = (color: string | undefined, alpha: number): string => {
  if (!color) return `rgba(148,163,184,${alpha})`;
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const normalized = hex.length === 3 ? hex.split('').map(c => c + c).join('') : hex;
    const r = parseInt(normalized.slice(0, 2), 16);
    const g = parseInt(normalized.slice(2, 4), 16);
    const b = parseInt(normalized.slice(4, 6), 16);
    if ([r, g, b].some(v => Number.isNaN(v))) return `rgba(148,163,184,${alpha})`;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return `rgba(148,163,184,${alpha})`;
};

// Sekcja helpera — pozycja klubu w drabince barażowej
const getClubPosition = (pairs: PlayoffPair[], clubId: string): number | null => {
  for (const pair of pairs) {
    if (pair.homeId === clubId) return pair.homePos;
    if (pair.awayId === clubId) return pair.awayPos;
  }
  return null;
};

// Sekcja helpera — opis sposobu rozstrzygnięcia finału
const getDecisionLabel = (result: PromotionPlayoffSingleMatchResult): string => {
  if (result.decidedBy === 'EXTRA_TIME') return 'po dogrywce';
  if (result.decidedBy === 'PENALTIES' && result.penalties) return `karne ${result.penalties.homeShots}:${result.penalties.awayShots}`;
  return '90 minut';
};

// Sekcja helpera — logo lub tarcza zastępcza klubu
const renderBadge = (clubId: string, name: string, colors: string[]) => {
  const logo = getClubLogo(clubId);
  if (logo) {
    return (
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden shadow-2xl shrink-0">
        <img src={logo} alt={name} className="w-11 h-11 object-contain" />
      </div>
    );
  }

  return (
    <div className="w-14 h-14 rounded-2xl border border-white/10 flex flex-col overflow-hidden shadow-2xl shrink-0">
      <div className="flex-1" style={{ backgroundColor: colors[0] }} />
      <div className="flex-1" style={{ backgroundColor: colors[1] || colors[0] }} />
    </div>
  );
};

interface FinalCardProps {
  title: string;
  targetLeague: string;
  result: PromotionPlayoffSingleMatchResult;
  pairs: PlayoffPair[];
  accentText: string;
  accentBorder: string;
  accentBg: string;
  userTeamId: string | null;
  clubs: ReturnType<typeof useGame>['clubs'];
}

// Sekcja pojedynczej karty finału barażowego
const FinalCard: React.FC<FinalCardProps> = ({ title, targetLeague, result, pairs, accentText, accentBorder, accentBg, userTeamId, clubs }) => {
  const homeClub = clubs.find(c => c.id === result.homeId);
  const awayClub = clubs.find(c => c.id === result.awayId);
  if (!homeClub || !awayClub) return null;

  const homePos = getClubPosition(pairs, homeClub.id);
  const awayPos = getClubPosition(pairs, awayClub.id);
  const winnerClub = result.winnerId === homeClub.id ? homeClub : awayClub;
  const isUserMatch = homeClub.id === userTeamId || awayClub.id === userTeamId;

  const bg = `linear-gradient(135deg,
    ${withAlpha(homeClub.colorsHex?.[0], 0.22)} 0%,
    rgba(2,6,23,0.58) 50%,
    ${withAlpha(awayClub.colorsHex?.[0], 0.22)} 100%)`;

  return (
    <div
      className={`relative rounded-[30px] border p-6 ${isUserMatch ? `${accentBorder} shadow-[0_0_40px_rgba(16,185,129,0.12)]` : 'border-white/8'}`}
      style={{ backgroundImage: bg }}
    >
      <div className="flex items-center justify-between gap-4 mb-5">
        <div>
          <h2 className={`text-2xl font-black uppercase italic tracking-tight ${accentText}`}>{title}</h2>
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-500 mt-2">{getDecisionLabel(result)}</p>
        </div>
        <span className={`px-3 py-2 rounded-2xl text-[9px] font-black uppercase tracking-[0.3em] border ${accentBorder} ${accentText}`}>
          4 czerwca
        </span>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 flex items-center justify-end gap-3 min-w-0">
          <div className="text-right min-w-0">
            <span className={`block text-[16px] font-black uppercase italic truncate ${result.winnerId === homeClub.id ? 'text-white' : 'text-slate-400'}`}>
              {homeClub.name}
            </span>
            <span className="block text-[9px] font-black uppercase tracking-[0.25em] text-slate-500 mt-1">
              {homePos ? `${homePos}. miejsce` : 'finalista'}
            </span>
          </div>
          {renderBadge(homeClub.id, homeClub.name, homeClub.colorsHex || [])}
        </div>

        <div className="px-3 shrink-0 text-center">
          <div className="flex items-center gap-2">
            <span className={`text-4xl font-black tabular-nums ${result.winnerId === homeClub.id ? 'text-white' : 'text-slate-500'}`}>{result.homeGoals}</span>
            <span className="text-slate-600 font-black">:</span>
            <span className={`text-4xl font-black tabular-nums ${result.winnerId === awayClub.id ? 'text-white' : 'text-slate-500'}`}>{result.awayGoals}</span>
          </div>
          <span className="block text-[8px] font-black uppercase tracking-[0.35em] text-slate-600 mt-1">finał</span>
        </div>

        <div className="flex-1 flex items-center justify-start gap-3 min-w-0">
          {renderBadge(awayClub.id, awayClub.name, awayClub.colorsHex || [])}
          <div className="text-left min-w-0">
            <span className={`block text-[16px] font-black uppercase italic truncate ${result.winnerId === awayClub.id ? 'text-white' : 'text-slate-400'}`}>
              {awayClub.name}
            </span>
            <span className="block text-[9px] font-black uppercase tracking-[0.25em] text-slate-500 mt-1">
              {awayPos ? `${awayPos}. miejsce` : 'finalista'}
            </span>
          </div>
        </div>
      </div>

      <div className={`mt-6 rounded-[24px] border px-5 py-5 ${accentBorder} ${accentBg}`}>
        <span className="block text-[9px] font-black uppercase tracking-[0.4em] text-slate-500">awans do {targetLeague}</span>
        <span className={`block text-2xl font-black uppercase italic mt-2 ${accentText}`}>{winnerClub.name}</span>
      </div>

      {isUserMatch && (
        <div className="absolute left-[-2px] top-1/2 -translate-y-1/2 w-1 h-12 bg-emerald-500 rounded-full shadow-[0_0_20px_rgba(16,185,129,1)]" />
      )}
    </div>
  );
};

// Sekcja głównego widoku finałów baraży awansowych
export const PromotionPlayoffFinalView: React.FC = () => {
  const { promotionPlayoffFinalResults, activePlayoffDraw, confirmPromotionPlayoffFinal, clubs, userTeamId } = useGame();
  const [isFinishing, setIsFinishing] = useState(false);

  if (!promotionPlayoffFinalResults || !activePlayoffDraw) return null;

  const handleFinish = () => {
    if (isFinishing) return;
    setIsFinishing(true);
    confirmPromotionPlayoffFinal();
  };

  return (
    <div className="h-screen w-full bg-slate-950 flex flex-col animate-fade-in overflow-hidden relative">
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${EkstraklasaBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center top',
            filter: 'brightness(0.28)',
          }}
        />
        <div className="absolute inset-0 bg-slate-950/72" />
        <div className="absolute top-[-15%] left-[-10%] w-[55%] h-[55%] rounded-full blur-[180px] opacity-[0.08] bg-amber-500" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[160px] opacity-[0.08] bg-sky-500" />
      </div>

      <div className="bg-slate-900/60 border-b border-white/10 p-8 backdrop-blur-3xl shrink-0 flex items-center justify-between shadow-2xl relative z-10">
        <div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white leading-none">
            Finały Barażowe
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-amber-400 text-[10px] font-black uppercase tracking-[0.5em]">4 czerwca</span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">Dwa finały · dwa awanse</span>
          </div>
        </div>

        <button
          disabled={isFinishing}
          onClick={handleFinish}
          className="px-8 py-3 rounded-2xl bg-white/5 border border-white/10 text-[11px] font-black uppercase tracking-[0.3em] text-slate-300 hover:bg-white/10 hover:text-white transition-all disabled:opacity-50"
        >
          Dalej →
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10 p-8">
        <div className="max-w-5xl mx-auto grid grid-cols-1 gap-6">
          <FinalCard
            title="Finał Barażowy — Ekstraklasa"
            targetLeague="L_PL_1"
            result={promotionPlayoffFinalResults.ekstraklasaFinal}
            pairs={activePlayoffDraw.ekstraklasaPlayoffs}
            accentText="text-amber-300"
            accentBorder="border-amber-400/30"
            accentBg="bg-amber-500/8"
            userTeamId={userTeamId}
            clubs={clubs}
          />

          <FinalCard
            title="Finał Barażowy — 1. Liga"
            targetLeague="L_PL_2"
            result={promotionPlayoffFinalResults.ligaOneFinal}
            pairs={activePlayoffDraw.ligaOnePlayoffs}
            accentText="text-sky-300"
            accentBorder="border-sky-400/30"
            accentBg="bg-sky-500/8"
            userTeamId={userTeamId}
            clubs={clubs}
          />
        </div>
      </div>

      <div className="bg-black/40 border-t border-white/5 p-4 flex justify-center shrink-0 backdrop-blur-md relative z-10">
        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">Zwycięzcy finałów awansują od nowego sezonu</p>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.8s ease-out forwards; }
      `}</style>
    </div>
  );
};
