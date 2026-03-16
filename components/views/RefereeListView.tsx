
import React, { useState, useMemo, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { ViewState, Referee } from '../../types';
import { RefereeService } from '../../services/RefereeService';

export const RefereeListView: React.FC = () => {
  const { navigateTo, viewRefereeDetails } = useGame();
  const [search, setSearch] = useState('');
  const [referees, setReferees] = useState<Referee[]>([]);

  useEffect(() => {
    // Inicjalizacja puli jeśli pusta i pobranie danych
    RefereeService.initializePool();
    setReferees([...RefereeService.pool]);
  }, []);

  const filteredReferees = useMemo(() => {
    const base = !search
      ? referees
      : referees.filter(r =>
          `${r.firstName} ${r.lastName}`.toLowerCase().includes(search.toLowerCase())
        );
    return [...base].sort((a, b) => {
      const rA = RefereeService.getAverageRating(a);
      const rB = RefereeService.getAverageRating(b);
      if (rB === null && rA === null) return 0;
      if (rA === null) return 1;
      if (rB === null) return -1;
      return rB - rA;
    });
  }, [search, referees]);

  return (
    <div className="h-[calc(100vh-3rem)] max-w-[1200px] mx-auto flex flex-col gap-4 animate-fade-in overflow-hidden relative">
      
      {/* BACKGROUND DECOR */}
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      {/* HEADER */}
      <div className="flex items-center justify-between px-8 py-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-3xl shrink-0 shadow-xl">
         <div className="flex items-center gap-4">
            <div className="text-xl">⚖️</div>
            <div>
               <h1 className="text-xl font-black italic uppercase tracking-tighter text-white leading-none">
                  Baza Arbitrów
               </h1>
               <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Kolegium Sędziów PZPN • 2025/26</p>
            </div>
         </div>

         <div className="flex items-center gap-4">
            <div className="relative">
               <input 
                 type="text"
                 placeholder="Szukaj..."
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
                 className="w-48 bg-black/40 border border-white/10 rounded-lg py-1.5 pl-3 pr-3 text-[11px] font-bold text-white placeholder-slate-700 focus:outline-none focus:border-blue-500/50 transition-all"
               />
            </div>
            <button 
              onClick={() => navigateTo(ViewState.LEAGUE_TABLES)}
              className="px-5 py-2 rounded-xl bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all"
            >
              Powrót
            </button>
         </div>
      </div>

      {/* MAIN CONTENT AREA - SIMPLE LIST */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-900/10 rounded-3xl border border-white/5 backdrop-blur-md p-6">
        <div className="w-full">

           {/* HEADER ROW */}
           <div className="flex items-center gap-4 px-4 pb-2 mb-1 border-b border-white/[0.06]">
             <span className="w-6 shrink-0" />
             <span className="flex-1 text-[7px] font-black text-slate-600 uppercase tracking-widest">Imię i Nazwisko</span>
             <span className="w-20 shrink-0 text-center text-[7px] font-black text-amber-600/70 uppercase tracking-widest">Śr. Ocena</span>
             <span className="w-20 shrink-0 text-center text-[7px] font-black text-slate-600 uppercase tracking-widest">Dośw.</span>
             <span className="w-16 shrink-0 text-center text-[7px] font-black text-slate-600 uppercase tracking-widest">Spotkań</span>
             <span className="w-20 shrink-0 text-center text-[7px] font-black text-amber-600/70 uppercase tracking-widest">🟨 / mecz</span>
             <span className="w-20 shrink-0 text-center text-[7px] font-black text-red-600/70 uppercase tracking-widest">🟥 / mecz</span>
             <span className="w-20 shrink-0" />
           </div>

           <div className="flex flex-col">
              {filteredReferees.map((ref, index) => {
                const refLevel = Math.round((ref.consistency * 0.6) + (ref.strictness * 0.2) + (ref.advantageTendency * 0.2));
                const matches = ref.matchRatings.length;
                const avgRating = RefereeService.getAverageRating(ref);
                const yellowPerMatch = matches > 0 ? (ref.totalYellowCardsShown / matches).toFixed(1) : '—';
                const redPerMatch = matches > 0 ? (ref.totalRedCardsShown / matches).toFixed(2) : '—';
                return (
                  <button
                    key={ref.id}
                    onClick={() => viewRefereeDetails(ref.id)}
                    className="group flex items-center gap-4 py-2.5 px-4 border-b border-white/[0.03] hover:bg-white/[0.03] transition-all text-left"
                  >
                     <span className="text-[10px] font-mono text-slate-600 w-6 shrink-0 group-hover:text-blue-500 transition-colors">
                       {String(index + 1).padStart(2, '0')}.
                     </span>
                     
                     <span className="flex-1 text-xs font-bold text-slate-300 uppercase italic tracking-tight group-hover:text-white transition-colors">
                        {ref.firstName} {ref.lastName}
                     </span>

                     <div className="w-20 shrink-0 flex flex-col items-center">
                       <span className={`text-sm font-black font-mono leading-tight ${avgRating !== null ? 'text-amber-400' : 'text-slate-600'}`}>
                         {avgRating !== null ? avgRating : '—'}
                       </span>
                     </div>

                     <div className="w-20 shrink-0 flex flex-col items-center">
                       <span className="text-xs font-black font-mono text-slate-400">{refLevel}</span>
                     </div>

                     <div className="w-16 shrink-0 flex flex-col items-center">
                       <span className="text-xs font-black font-mono text-slate-400">{matches}</span>
                     </div>

                     <div className="w-20 shrink-0 flex flex-col items-center">
                       <span className="text-xs font-black font-mono text-amber-500/80">{yellowPerMatch}</span>
                     </div>

                     <div className="w-20 shrink-0 flex flex-col items-center">
                       <span className="text-xs font-black font-mono text-red-500/80">{redPerMatch}</span>
                     </div>

                     <div className="w-20 shrink-0 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Szczegóły →</span>
                     </div>
                  </button>
                );
              })}
              
              {filteredReferees.length === 0 && (
                <div className="py-20 text-center opacity-20">
                   <p className="text-xs font-black uppercase tracking-widest italic text-slate-500">Nie znaleziono wyników</p>
                </div>
              )}
           </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.4s ease-out forwards; }
      `}</style>
    </div>
  );
};
