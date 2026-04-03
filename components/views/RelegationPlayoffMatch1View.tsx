import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { getClubLogo } from '../../resources/ClubLogoAssets';
import EkstraklasaBg from '../../Graphic/themes/ekstraklasa.png';
import { RelegationPlayoffLegResult } from '../../types';

// ── WIDOK WYNIKÓW 1. MECZÓW BARAŻOWYCH (26 MAJA) ───────────────────────────────
// Pokazuje wyniki dwóch meczów:
//   Para A: 13. miejsce 2.Ligi vs losowy klub 3.Ligi
//   Para B: 14. miejsce 2.Ligi vs losowy klub 3.Ligi
// Przycisk "Dalej" → advanceDay → następny dzień

// ── HELPER — tło gradientowe z kolorów dwóch klubów ──────────────────────────
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

// ── KARTA POJEDYNCZEGO MECZU ──────────────────────────────────────────────────
interface MatchCardProps {
  result: RelegationPlayoffLegResult;
  pairIndex: number; // 0 = Para A (13. msc), 1 = Para B (14. msc)
  userTeamId: string | null;
  clubs: ReturnType<typeof useGame>['clubs'];
}

const MatchCard: React.FC<MatchCardProps> = ({ result, pairIndex, userTeamId, clubs }) => {
  const homeClub = clubs.find(c => c.id === result.homeId);
  const awayClub = clubs.find(c => c.id === result.awayId);
  if (!homeClub || !awayClub) return null;

  const homeLogo = getClubLogo(homeClub.id);
  const awayLogo = getClubLogo(awayClub.id);
  const isUserMatch = homeClub.id === userTeamId || awayClub.id === userTeamId;

  const bg = `linear-gradient(135deg,
    ${withAlpha(homeClub.colorsHex?.[0], 0.25)} 0%,
    rgba(2,6,23,0.5) 50%,
    ${withAlpha(awayClub.colorsHex?.[0], 0.25)} 100%)`;

  const renderBadge = (clubId: string, name: string, colors: string[]) => {
    const logo = getClubLogo(clubId);
    if (logo) return (
      <div className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden shadow-2xl shrink-0">
        <img src={logo} alt={name} className="w-10 h-10 object-contain" />
      </div>
    );
    return (
      <div className="w-12 h-12 rounded-xl border border-white/10 flex flex-col overflow-hidden shadow-2xl shrink-0">
        <div className="flex-1" style={{ backgroundColor: colors[0] }} />
        <div className="flex-1" style={{ backgroundColor: colors[1] || colors[0] }} />
      </div>
    );
  };

  // Który klub wygrał 1. mecz (tylko informacja — wynik dwumeczu znany po rewanżu)
  const homeWinsLeg = result.homeGoals > result.awayGoals;
  const awayWinsLeg = result.awayGoals > result.homeGoals;

  return (
    <div
      className={`relative flex items-center justify-between p-5 rounded-[28px] border transition-all duration-300 ${
        isUserMatch
          ? 'border-emerald-500/40 shadow-[0_0_40px_rgba(16,185,129,0.12)]'
          : 'border-white/8'
      }`}
      style={{ backgroundImage: bg }}
    >
      {/* Numer pary */}
      <div className="absolute left-[-10px] top-[-10px] w-7 h-7 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center text-[11px] font-black text-slate-500 shadow-2xl">
        {pairIndex + 1}
      </div>

      {/* Gospodarz (2.Liga) */}
      <div className="flex-1 flex items-center justify-end gap-3 pr-3 min-w-0">
        <div className="text-right min-w-0">
          <span className={`block text-[14px] font-black uppercase italic truncate tracking-tight ${homeWinsLeg ? 'text-white' : 'text-slate-400'}`}>
            {homeClub.name}
          </span>
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 mt-0.5 block">
            {pairIndex === 0 ? '13. msc' : '14. msc'} • 2. LIGA
          </span>
        </div>
        {renderBadge(homeClub.id, homeClub.name, homeClub.colorsHex || [])}
      </div>

      {/* Wynik */}
      <div className="flex flex-col items-center gap-1 px-4 shrink-0">
        <div className="flex items-center gap-3">
          <span className={`text-3xl font-black tabular-nums ${homeWinsLeg ? 'text-white' : 'text-slate-500'}`}>
            {result.homeGoals}
          </span>
          <span className="text-[11px] font-black text-slate-600 italic">:</span>
          <span className={`text-3xl font-black tabular-nums ${awayWinsLeg ? 'text-white' : 'text-slate-500'}`}>
            {result.awayGoals}
          </span>
        </div>
        <span className="text-[8px] font-black uppercase tracking-[0.4em] text-slate-600">1. mecz</span>
      </div>

      {/* Gość (3.Liga) */}
      <div className="flex-1 flex items-center justify-start gap-3 pl-3 min-w-0">
        {renderBadge(awayClub.id, awayClub.name, awayClub.colorsHex || [])}
        <div className="text-left min-w-0">
          <span className={`block text-[14px] font-black uppercase italic truncate tracking-tight ${awayWinsLeg ? 'text-white' : 'text-slate-400'}`}>
            {awayClub.name}
          </span>
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 mt-0.5 block">
            3. LIGA • GOŚĆ
          </span>
        </div>
      </div>

      {/* Zielona kreska po lewej jeśli mecz gracza */}
      {isUserMatch && (
        <div className="absolute left-[-2px] top-1/2 -translate-y-1/2 w-1 h-12 bg-emerald-500 rounded-full shadow-[0_0_20px_rgba(16,185,129,1)]" />
      )}
    </div>
  );
};

// ── GŁÓWNY WIDOK ─────────────────────────────────────────────────────────────
export const RelegationPlayoffMatch1View: React.FC = () => {
  const { relegationPlayoffFirstLegResults, confirmRelegationPlayoffMatch1, clubs, userTeamId } = useGame();
  const [isFinishing, setIsFinishing] = useState(false);

  if (!relegationPlayoffFirstLegResults) return null;

  const handleFinish = () => {
    if (isFinishing) return;
    setIsFinishing(true);
    confirmRelegationPlayoffMatch1();
  };

  return (
    <div className="h-screen w-full bg-slate-950 flex flex-col animate-fade-in overflow-hidden relative">

      {/* Tło */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${EkstraklasaBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center top',
            filter: 'brightness(0.3)',
          }}
        />
        <div className="absolute inset-0 bg-slate-950/65" />
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[200px] opacity-[0.08] bg-rose-700" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[150px] opacity-[0.07] bg-white" />
      </div>

      {/* Header */}
      <div className="bg-slate-900/60 border-b border-white/10 p-8 backdrop-blur-3xl shrink-0 flex items-center justify-between shadow-2xl relative z-10">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-rose-700/20 border border-rose-600/30 flex items-center justify-center text-3xl shadow-inner">
            ⚠️
          </div>
          <div>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white leading-none">
              Baraże o Utrzymanie
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-rose-400 text-[10px] font-black uppercase tracking-[0.5em]">1. mecze · 26 maja</span>
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <span className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">2. Liga vs 3. Liga — utrzymanie</span>
            </div>
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

      {/* Treść */}
      <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10 p-8">

        {/* Info o rewanżach */}
        <div className="mb-6 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-400">
            Rewanże — 29 maja • Gospodarz rewanżu: drużyna 3.Ligi • Remis w agregacie → dogrywka i rzuty karne
          </p>
        </div>

        {/* Mecze */}
        <div className="grid grid-cols-1 gap-5 max-w-3xl mx-auto">
          <MatchCard
            result={relegationPlayoffFirstLegResults.pair0}
            pairIndex={0}
            userTeamId={userTeamId}
            clubs={clubs}
          />
          <MatchCard
            result={relegationPlayoffFirstLegResults.pair1}
            pairIndex={1}
            userTeamId={userTeamId}
            clubs={clubs}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="bg-black/40 border-t border-white/5 p-4 flex justify-center shrink-0 backdrop-blur-md relative z-10">
        <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em]">Rewanże 29 maja · Zwycięzca dwumeczu gra w 2.Lidze</p>
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
