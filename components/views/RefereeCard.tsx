
import React, { useMemo } from 'react';
import { useGame } from '../../context/GameContext';
import { ViewState, Region } from '../../types';
import { RefereeService } from '../../services/RefereeService';

export const RefereeCard: React.FC = () => {
  const { viewedRefereeId, navigateTo, previousViewState } = useGame();

  const referee = useMemo(() => {
    if (!viewedRefereeId) return null;
    return RefereeService.pool.find(r => r.id === viewedRefereeId);
  }, [viewedRefereeId]);

  if (!referee) return null;

  const AttrBar = ({ label, value, colorClass }: { label: string, value: number, colorClass?: string }) => {
    let barColor = colorClass || "bg-slate-700";
    let glowClass = "";
    if (!colorClass) {
        if (value >= 80) { barColor = "bg-emerald-400"; glowClass = "shadow-[0_0_12px_rgba(52,211,153,0.6)]"; }
        else if (value >= 65) { barColor = "bg-blue-400"; }
        else if (value >= 50) { barColor = "bg-amber-400"; }
        else if (value > 0) { barColor = "bg-red-500"; }
    }
    
    return (
      <div className="group flex flex-col gap-1.5 mb-3">
        <div className="flex justify-between items-center px-1">
           <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-300 transition-colors">{label}</span>
           <span className={`text-xs font-black font-mono ${value >= 80 ? 'text-emerald-400' : 'text-white'}`}>{value}</span>
        </div>
        <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
           <div className={`h-full transition-all duration-1000 ${barColor} ${glowClass}`} style={{ width: `${value}%` }} />
        </div>
      </div>
    );
  };

  // Calculate a mock "Referee Reputation" based on consistency
  const refereeLevel = Math.round((referee.consistency * 0.6) + (referee.strictness * 0.2) + (referee.advantageTendency * 0.2));

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/95 backdrop-blur-xl p-6 animate-fade-in overflow-y-auto custom-scrollbar">
      
      {/* Background Dynamic Identity */}
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[150px] opacity-10 bg-slate-700" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] opacity-5 bg-blue-900" />
      </div>

      <div className="max-w-5xl w-full bg-slate-900 rounded-[45px] border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col md:flex-row min-h-[750px]">
        
        {/* LEFT COLUMN: VISUAL SHOWCASE */}
        <div className="w-full md:w-[40%] relative flex flex-col items-center justify-between p-12 border-r border-white/5 overflow-hidden">
           {/* Big Initials in background */}
           <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none">
              <span className="text-[30rem] font-black italic select-none">REF</span>
           </div>

           <div className="relative z-10 text-center w-full">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-8">
                 <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                 <span className="text-[8px] font-black uppercase tracking-[0.3em] text-white/60">Profil Arbitra PZPN</span>
              </div>
              
              <h2 className="text-5xl font-black text-white italic uppercase tracking-tighter leading-[0.8] mb-2 drop-shadow-2xl">
                 {referee.firstName}<br/>
                 <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-300 to-slate-600">{referee.lastName}</span>
              </h2>
              
              <div className="flex items-center justify-center gap-4 mt-6">
                 <div className="px-4 py-1 rounded-xl border-2 border-slate-500/30 bg-slate-500/10 font-black italic tracking-tighter text-lg text-slate-300">
                    SĘDZIA GŁÓWNY
                 </div>
                 <div className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">
                    {referee.age} lat • {referee.nationality}
                 </div>
              </div>
           </div>

           {/* OVERALL CIRCLE */}
           <div className="relative z-10 group mt-12 mb-12">
              <div className="absolute inset-[-15px] bg-white/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="w-48 h-48 rounded-full border-8 border-white/5 flex flex-col items-center justify-center shadow-2xl relative bg-slate-950 overflow-hidden">
                 <div className="absolute inset-0 opacity-10 bg-gradient-to-tr from-slate-700 to-transparent" />
                 <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 relative z-10">Ranga</span>
                 <span className="text-8xl font-black text-white italic tracking-tighter leading-none relative z-10 drop-shadow-lg">{refereeLevel}</span>
                 <div className="absolute bottom-4 h-1 w-12 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,1)]" />
              </div>
           </div>

           <div className="relative z-10 w-full flex flex-col gap-3">
              <div className="flex items-center justify-between p-5 bg-black/40 rounded-[28px] border border-white/5">
                 <div className="flex flex-col gap-1">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Organizacja</span>
                    <span className="text-xs font-black text-white italic uppercase tracking-tight">Kolegium Sędziów PZPN</span>
                 </div>
                 <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-xl border border-white/10 shadow-lg">
                    ⚖️
                 </div>
              </div>
              <button 
                onClick={() => navigateTo(previousViewState || ViewState.PRE_MATCH_STUDIO)}
                className="w-full py-5 rounded-[28px] bg-white text-slate-900 font-black italic uppercase tracking-widest text-xs transition-all hover:scale-[1.02] active:scale-95 shadow-2xl"
              >
                Zamknij Kartę &times;
              </button>
           </div>
        </div>

        {/* RIGHT COLUMN: ATTRIBUTES & STATS */}
        <div className="flex-1 bg-black/20 p-10 overflow-y-auto custom-scrollbar flex flex-col gap-10">
           
           {/* ATTRIBUTES GRID */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
              <div className="col-span-2 mb-4">
                 <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
                    <span className="w-8 h-px bg-blue-500/30" /> Profil Dyscyplinarny
                 </h3>
              </div>
              
              <div className="space-y-4">
                 <AttrBar label="Surowość (Rygor)" value={referee.strictness} />
                 <AttrBar label="Konsekwencja" value={referee.consistency} />
              </div>

              <div className="space-y-4">
                 <AttrBar label="Przywilej korzyści" value={referee.advantageTendency} />
                 <AttrBar label="Doświadczenie" value={refereeLevel + 10} />
              </div>

              <div className="col-span-2 mt-6 pt-6 border-t border-white/5">
                 <p className="text-[11px] text-slate-400 leading-relaxed italic p-5 bg-white/[0.02] rounded-2xl border border-white/5">
                    "Arbiter znany z {referee.strictness > 70 ? 'bardzo surowego' : (referee.strictness < 40 ? 'liberalnego' : 'zrównoważonego')} podejścia do walki w kontakcie. 
                    {referee.consistency > 75 ? ' Gwarantuje wysoką powtarzalność decyzji przez pełne 90 minut.' : ' Może miewać wahania formy w decydujących momentach spotkania.'}"
                 </p>
              </div>
           </div>

           {/* SEASON STATS TILES */}
           <div className="flex flex-col gap-6">
              <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.4em] mb-2 flex items-center gap-3">
                 <span className="w-8 h-px bg-amber-500/30" /> Historia Prowadzenia
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                 {[
                   { label: 'Żółte / mecz', val: (referee.strictness / 20).toFixed(1), icon: '🟨', color: 'text-amber-400' },
                   { label: 'Czerwone', val: Math.floor(referee.strictness / 35), icon: '🟥', color: 'text-red-500' },
                   { label: 'Karne / mecz', val: (referee.strictness / 80).toFixed(1), icon: '⚽', color: 'text-white' },
                 ].map((s, i) => (
                    <div key={i} className="bg-slate-900/40 p-5 rounded-3xl border border-white/5 text-center group hover:border-white/10 transition-all">
                       <span className="text-xl mb-2 block transform group-hover:scale-125 transition-transform">{s.icon}</span>
                       <span className={`text-2xl font-black font-mono block ${s.color || 'text-white'}`}>{s.val}</span>
                       <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest mt-1">{s.label}</span>
                    </div>
                 ))}
              </div>
           </div>
        </div>

      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }
        @keyframes fade-in { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
        .animate-fade-in { animation: fade-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
};
