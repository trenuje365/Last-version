import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';

export const CupDrawView: React.FC = () => {
  const { activeCupDraw, confirmCupDraw, clubs, userTeamId } = useGame();
  const [isFinishing, setIsFinishing] = useState(false);

  if (!activeCupDraw) return null;

  const pairs = activeCupDraw.pairs;
  const getClub = (id: string) => clubs.find(c => c.id === id);

  const handleFinish = () => {
    if (isFinishing) return;
    setIsFinishing(true);
    confirmCupDraw(pairs);
  };

  return (
    <div className="h-screen w-full bg-slate-950 flex flex-col animate-fade-in overflow-hidden relative selection:bg-rose-500 selection:text-white">
      
      {/* Cinematic Background Atmosphere */}
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full blur-[200px] opacity-10 bg-rose-600" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[150px] opacity-10 bg-slate-400" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
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
         <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 max-w-[1800px] mx-auto pb-20">
            {pairs.map((pair, idx) => {
              const home = getClub(pair.homeTeamId);
              const away = getClub(pair.awayTeamId);
              
              if (!home || !away) return null;
              
              const isUserPair = home.id === userTeamId || away.id === userTeamId;

              return (
                <div 
                  key={pair.id} 
                  className={`
                    group relative flex items-center justify-between p-4 rounded-[28px] border transition-all duration-300
                    ${isUserPair 
                      ? 'bg-emerald-500/10 border-emerald-500/40 shadow-[0_0_40px_rgba(16,185,129,0.1)] scale-[1.03] z-20' 
                      : 'bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.05]'}
                  `}
                >
                  <div className="absolute left-[-10px] top-[-10px] w-7 h-7 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center text-[11px] font-black text-slate-500 group-hover:text-rose-500 transition-colors shadow-2xl">
                     {idx + 1}
                  </div>

                  <div className="flex-1 flex items-center justify-end gap-4 pr-3 min-w-0">
                     <div className="text-right min-w-0">
                        <span className={`block text-[13px] font-black uppercase italic truncate tracking-tight transition-colors ${isUserPair ? 'text-emerald-400' : 'text-white group-hover:text-rose-400'}`}>
                           {home.name}
                        </span>
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1">Tier {home.leagueId.split('_')[2] || '4'}</span>
                     </div>
                     <div className="w-10 h-10 rounded-xl border border-white/10 flex flex-col overflow-hidden shadow-2xl shrink-0 group-hover:rotate-3 transition-transform">
                        <div className="flex-1" style={{ backgroundColor: home.colorsHex[0] }} />
                        <div className="flex-1" style={{ backgroundColor: home.colorsHex[1] || home.colorsHex[0] }} />
                     </div>
                  </div>

                  <div className="w-12 h-12 rounded-full bg-black/60 border border-white/10 flex items-center justify-center backdrop-blur-xl shadow-2xl shrink-0 z-10 mx-2">
                     <span className="text-[11px] font-black italic text-slate-700 tracking-tighter group-hover:text-rose-500 transition-colors">VS</span>
                  </div>

                  <div className="flex-1 flex items-center justify-start gap-4 pl-3 min-w-0">
                     <div className="w-10 h-10 rounded-xl border border-white/10 flex flex-col overflow-hidden shadow-2xl shrink-0 group-hover:-rotate-3 transition-transform">
                        <div className="flex-1" style={{ backgroundColor: away.colorsHex[0] }} />
                        <div className="flex-1" style={{ backgroundColor: away.colorsHex[1] || away.colorsHex[0] }} />
                     </div>
                     <div className="text-left min-w-0">
                        <span className={`block text-[13px] font-black uppercase italic truncate tracking-tight transition-colors ${isUserPair ? 'text-emerald-400' : 'text-white group-hover:text-rose-400'}`}>
                           {away.name}
                        </span>
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1">Tier {away.leagueId.split('_')[2] || '4'}</span>
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