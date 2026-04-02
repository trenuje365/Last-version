import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import PucharPolskiBg from '../../Graphic/themes/PucharPolski.png';
import { getClubLogo } from '../../resources/ClubLogoAssets';

const withAlpha = (color: string | undefined, alpha: number): string => {
  if (!color) return `rgba(148,163,184,${alpha})`;

  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const normalized = hex.length === 3
      ? hex.split('').map(char => char + char).join('')
      : hex;

    const r = parseInt(normalized.slice(0, 2), 16);
    const g = parseInt(normalized.slice(2, 4), 16);
    const b = parseInt(normalized.slice(4, 6), 16);

    if ([r, g, b].some(value => Number.isNaN(value))) {
      return `rgba(148,163,184,${alpha})`;
    }

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  const rgbMatch = color.match(/rgba?\(([^)]+)\)/i);
  if (rgbMatch) {
    const [r, g, b] = rgbMatch[1]
      .split(',')
      .slice(0, 3)
      .map(value => parseFloat(value.trim()));

    if ([r, g, b].every(value => Number.isFinite(value))) {
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
  }

  return `rgba(148,163,184,${alpha})`;
};

const getPairBackground = (homeColors: string[], awayColors: string[], isUserPair: boolean): string => {
  const homePrimary = homeColors[0] || '#475569';
  const homeSecondary = homeColors[1] || homePrimary;
  const awayPrimary = awayColors[0] || '#475569';
  const awaySecondary = awayColors[1] || awayPrimary;
  const centerTint = isUserPair ? 'rgba(16,185,129,0.12)' : 'rgba(15,23,42,0.34)';

  return `
    linear-gradient(
      135deg,
      ${withAlpha(homePrimary, 0.22)} 0%,
      ${withAlpha(homeSecondary, 0.12)} 28%,
      ${centerTint} 50%,
      ${withAlpha(awaySecondary, 0.12)} 72%,
      ${withAlpha(awayPrimary, 0.22)} 100%
    )
  `;
};

const getLeagueTag = (leagueId?: string): string => {
  switch (leagueId) {
    case 'L_PL_1':
      return 'EKS';
    case 'L_PL_2':
      return '1L';
    case 'L_PL_3':
      return '2L';
    case 'L_PL_4':
      return '3L';
    default: {
      const tier = leagueId?.split('_')[2];
      return tier ? `${tier}L` : 'LIGA';
    }
  }
};

const getLeagueTagClassName = (leagueId?: string): string => {
  switch (leagueId) {
    case 'L_PL_1':
      return 'border-amber-300/25 bg-gradient-to-r from-amber-300/20 to-yellow-500/20 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.14)]';
    case 'L_PL_2':
      return 'border-rose-200/25 bg-gradient-to-r from-white/20 to-red-500/20 text-rose-100 shadow-[0_0_12px_rgba(244,63,94,0.16)]';
    case 'L_PL_3':
      return 'border-sky-300/25 bg-gradient-to-r from-sky-400/20 to-blue-500/20 text-sky-100 shadow-[0_0_12px_rgba(59,130,246,0.16)]';
    case 'L_PL_4':
      return 'border-emerald-300/25 bg-gradient-to-r from-emerald-400/20 to-lime-500/20 text-emerald-100 shadow-[0_0_12px_rgba(16,185,129,0.16)]';
    default:
      return 'border-white/15 bg-white/10 text-slate-200 shadow-[0_0_12px_rgba(255,255,255,0.08)]';
  }
};

export const CupDrawView: React.FC = () => {
  const { activeCupDraw, confirmCupDraw, clubs, userTeamId } = useGame();
  const [isFinishing, setIsFinishing] = useState(false);

  if (!activeCupDraw) return null;

  const pairs = activeCupDraw.pairs;
  const getClub = (id: string) => clubs.find(c => c.id === id);
  const renderClubBadge = (clubId: string, clubName: string, colorsHex: string[], rotationClassName: string) => {
    const logo = getClubLogo(clubId);

    if (logo) {
      return (
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden shadow-2xl shrink-0 ${rotationClassName}`}>
          <img src={logo} alt={clubName} className="w-8 h-8 object-contain" />
        </div>
      );
    }

    return (
      <div className={`w-10 h-10 rounded-xl border border-white/10 flex flex-col overflow-hidden shadow-2xl shrink-0 ${rotationClassName}`}>
        <div className="flex-1" style={{ backgroundColor: colorsHex[0] }} />
        <div className="flex-1" style={{ backgroundColor: colorsHex[1] || colorsHex[0] }} />
      </div>
    );
  };

  const handleFinish = () => {
    if (isFinishing) return;
    setIsFinishing(true);
    confirmCupDraw(pairs);
  };

  return (
    <div className="h-screen w-full bg-slate-950 flex flex-col animate-fade-in overflow-hidden relative selection:bg-rose-500 selection:text-white">
      
      {/* Background for Puchar Polski */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute inset-0" 
          style={{ 
            backgroundImage: `url(${PucharPolskiBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'brightness(0.35)'
          }} 
        />
        <div className="absolute inset-0 bg-slate-950/60" />
      </div>

      {/* Header */}
      <div className="bg-slate-900/60 border-b border-white/10 p-8 backdrop-blur-3xl shrink-0 flex items-center justify-between shadow-2xl relative z-10">
         <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-3xl shadow-inner shadow-rose-500/10">
               🏆
            </div>
            <div>
               <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white leading-none">
                  Ceremonia Losowania
               </h1>
               <div className="flex items-center gap-3 mt-2">
                  <span className="text-rose-500 text-[10px] font-black uppercase tracking-[0.5em]">{activeCupDraw.label}</span>
                  <span className="w-1 h-1 rounded-full bg-white/20" />
                  <span className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">Siedziba PZPN, Warszawa</span>
               </div>
            </div>
         </div>

         <button 
           disabled={isFinishing}
           onClick={handleFinish}
           className={`group relative px-12 py-5 bg-white text-slate-900 font-black italic uppercase tracking-widest rounded-2xl shadow-[0_20px_50px_rgba(255,255,255,0.1)] transition-all hover:scale-105 active:scale-95 flex items-center gap-4 overflow-hidden ${isFinishing ? 'opacity-50 cursor-not-allowed' : ''}`}
         >
           <span className="relative z-10 text-lg">{isFinishing ? 'PRZETWARZANIE...' : 'ZAKOŃCZ CEREMONIĘ →'}</span>
           {!isFinishing && <div className="absolute inset-0 bg-gradient-to-tr from-rose-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />}
         </button>
      </div>

      {/* Main Content: Scrollable list of Pairs */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-10">
         <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 max-w-[1800px] mx-auto pb-20">
            {pairs.map((pair, idx) => {
              const home = getClub(pair.homeTeamId);
              const away = getClub(pair.awayTeamId);
              
              if (!home || !away) return null;
              
              const isUserPair = home.id === userTeamId || away.id === userTeamId;
              const homeLeagueTag = getLeagueTag(home.leagueId);
              const awayLeagueTag = getLeagueTag(away.leagueId);
              const homeLeagueTagClass = getLeagueTagClassName(home.leagueId);
              const awayLeagueTagClass = getLeagueTagClassName(away.leagueId);
              const pairBackground = getPairBackground(home.colorsHex, away.colorsHex, isUserPair);

              return (
                <div 
                  key={pair.id} 
                  className={`
                    group relative flex items-center justify-between p-4 rounded-[28px] border transition-all duration-300
                    ${isUserPair 
                      ? 'bg-emerald-500/10 border-emerald-500/40 shadow-[0_0_40px_rgba(16,185,129,0.1)] scale-[1.03] z-20' 
                      : 'border-white/5 hover:border-white/10'}
                  `}
                  style={{ backgroundImage: pairBackground }}
                >
                  <div className="absolute left-[-10px] top-[-10px] w-7 h-7 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center text-[11px] font-black text-slate-500 group-hover:text-rose-500 transition-colors shadow-2xl">
                     {idx + 1}
                  </div>

                  <div className="flex-1 flex items-center justify-end gap-4 pr-3 min-w-0">
                     <div className="text-right min-w-0">
                        <span className={`block text-[13px] font-black uppercase italic truncate tracking-tight transition-colors ${isUserPair ? 'text-emerald-400' : 'text-white group-hover:text-rose-400'}`}>
                           {home.name}
                        </span>
                        <span className={`mt-1 inline-flex items-center rounded-full border px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.25em] ${homeLeagueTagClass}`}>
                          {homeLeagueTag}
                        </span>
                     </div>
                     {renderClubBadge(home.id, home.name, home.colorsHex, 'group-hover:rotate-3 transition-transform')}
                  </div>

                  <div className="w-12 h-12 rounded-full bg-black/60 border border-white/10 flex items-center justify-center backdrop-blur-xl shadow-2xl shrink-0 z-10 mx-2">
                     <span className="text-[11px] font-black italic text-slate-700 tracking-tighter group-hover:text-rose-500 transition-colors">VS</span>
                  </div>

                  <div className="flex-1 flex items-center justify-start gap-4 pl-3 min-w-0">
                     {renderClubBadge(away.id, away.name, away.colorsHex, 'group-hover:-rotate-3 transition-transform')}
                     <div className="text-left min-w-0">
                        <span className={`block text-[13px] font-black uppercase italic truncate tracking-tight transition-colors ${isUserPair ? 'text-emerald-400' : 'text-white group-hover:text-rose-400'}`}>
                           {away.name}
                        </span>
                        <span className={`mt-1 inline-flex items-center rounded-full border px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.25em] ${awayLeagueTagClass}`}>
                          {awayLeagueTag}
                        </span>
                     </div>
                  </div>

                  {isUserPair && (
                    <div className="absolute left-[-2px] top-1/2 -translate-y-1/2 w-1 h-12 bg-emerald-500 rounded-full shadow-[0_0_20px_rgba(16,185,129,1)]" />
                  )}
                </div>
              );
            })}
         </div>
      </div>

      <div className="bg-black/40 border-t border-white/5 p-4 flex justify-center shrink-0 backdrop-blur-md">
         <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em]">Wszystkie pary zostały zapisane w oficjalnym rejestrze PZPN</p>
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
