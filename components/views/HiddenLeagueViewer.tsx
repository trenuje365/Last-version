
import React, { useState, useMemo } from 'react';
import { useGame } from '../../context/GameContext';
import { Button } from '../ui/Button';
import { ViewState, Club } from '../../types';

export const HiddenLeagueViewer: React.FC = () => {
  const { clubs, viewClubDetails, navigateTo } = useGame();
  const [search, setSearch] = useState('');
  
  const tier4Clubs = useMemo(() => {
    const base = clubs.filter(c => c.leagueId === 'L_PL_4');
    if (!search) return base;
    return base.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
  }, [clubs, search]);

  return (
    <div className="h-screen bg-slate-950 flex flex-col animate-fade-in overflow-hidden">
      {/* Header Section */}
      <div className="bg-slate-900/50 border-b border-white/5 p-6 backdrop-blur-xl shrink-0 z-20">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-6">
             <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-2xl border border-white/10 shadow-inner">
                🗺️
             </div>
             <div>
                <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white leading-none">
                  Liga Regionalna
                </h1>
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] mt-1.5 opacity-70">
                  Tier 4 • {tier4Clubs.length} Zespołów w bazie
                </p>
             </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
             <div className="relative flex-1 md:w-80 group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30 group-focus-within:opacity-100 transition-opacity">🔍</span>
                <input 
                  type="text"
                  placeholder="Szukaj klubu (np. Kotwica, Polonia...)"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm font-bold text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                />
             </div>
             <Button variant="secondary" onClick={() => navigateTo(ViewState.DASHBOARD)} className="px-8 whitespace-nowrap border border-white/5 bg-slate-800/50">
                &larr; Wyjdź
             </Button>
          </div>
        </div>
      </div>

      {/* Main List Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        <div className="max-w-[1600px] mx-auto">
          {tier4Clubs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
              {tier4Clubs.map(club => (
                <button
                  key={club.id}
                  onClick={() => viewClubDetails(club.id)}
                  className="group relative h-20 bg-slate-900/40 rounded-2xl border border-white/5 overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_10px_30px_rgba(0,0,0,0.3)] hover:border-white/20 text-left"
                >
                  {/* Subtle Background Identity Code */}
                  <div className="absolute right-[-10px] top-[-10px] text-5xl font-black italic text-white/[0.03] select-none group-hover:text-white/[0.06] transition-colors">
                    {club.shortName}
                  </div>

                  {/* Hover Color Flash */}
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none"
                    style={{ background: `linear-gradient(90deg, ${club.colorsHex[0]}, transparent)` }}
                  />

                  {/* Left Color Indicator */}
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 overflow-hidden">
                     <div style={{ backgroundColor: club.colorsHex[0] }} className="h-full w-full" />
                  </div>

                  <div className="relative h-full flex items-center px-6 gap-4">
                     {/* Mini Colors Badge */}
                     <div className="flex flex-col w-1.5 h-8 rounded-full overflow-hidden border border-white/10 shrink-0">
                        <div style={{ backgroundColor: club.colorsHex[0] }} className="flex-1" />
                        <div style={{ backgroundColor: club.colorsHex[1] || club.colorsHex[0] }} className="flex-1" />
                     </div>

                     <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-black text-slate-100 uppercase italic truncate leading-tight group-hover:text-white">
                          {club.name}
                        </h3>
                        <div className="flex items-center gap-3 mt-1">
                           <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{club.stadiumName}</span>
                           <span className="w-1 h-1 rounded-full bg-slate-800" />
                           <span className="text-[9px] font-black text-emerald-500/70 font-mono">{club.stadiumCapacity.toLocaleString()}</span>
                        </div>
                     </div>

                     <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-xs">→</span>
                     </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="h-[60vh] flex flex-col items-center justify-center opacity-20">
               <span className="text-6xl mb-4">🏜️</span>
               <p className="text-xl font-black uppercase tracking-[0.3em] italic">Brak wyników</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }
      `}</style>
    </div>
  );
};
