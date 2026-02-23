
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
    const base = referees;
    if (!search) return base;
    return base.filter(r => 
      `${r.firstName} ${r.lastName}`.toLowerCase().includes(search.toLowerCase())
    );
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
        <div className="max-w-xl mx-auto">
           <div className="flex flex-col">
              {filteredReferees.map((ref, index) => (
                <button
                  key={ref.id}
                  onClick={() => viewRefereeDetails(ref.id)}
                  className="group flex items-center gap-4 py-2.5 px-4 border-b border-white/[0.03] hover:bg-white/[0.03] transition-all text-left"
                >
                   <span className="text-[10px] font-mono text-slate-600 w-6 shrink-0 group-hover:text-blue-500 transition-colors">
                     {String(index + 1).padStart(2, '0')}.
                   </span>
                   
                   <span className="text-xs font-bold text-slate-300 uppercase italic tracking-tight group-hover:text-white transition-colors">
                      {ref.firstName} {ref.lastName}
                   </span>

                   <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Szczegóły →</span>
                   </div>
                </button>
              ))}
              
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
