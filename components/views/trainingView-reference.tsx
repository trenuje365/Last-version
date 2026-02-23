import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { ViewState } from '../../types';
import { TRAINING_CYCLES } from '../../data/training_definitions_pl';

export const TrainingView: React.FC = () => {
  const { navigateTo, activeTrainingId, setActiveTrainingId, clubs, userTeamId } = useGame();
  const [selectedId, setSelectedId] = useState<string | null>(activeTrainingId);

  const myClub = clubs.find(c => c.id === userTeamId);
  const currentCycle = TRAINING_CYCLES.find(c => c.id === selectedId) || null;

  const handleSave = () => {
    if (selectedId) {
      setActiveTrainingId(selectedId);
      navigateTo(ViewState.DASHBOARD);
    }
  };

  return (
    <div className="h-[1080px] max-w-[1920px] mx-auto flex flex-col gap-4 animate-fade-in overflow-hidden relative bg-transparent font-sans">
      
      {/* 1. CINEMATIC BACKGROUND LAYER - Changed to FIXED to bypass App.tsx padding */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div 
          className="absolute inset-0 bg-cover bg-center scale-105"
          style={{ backgroundImage: "url('https://i.ibb.co/VcMTs5c6/traning.png')" }}
        />
        {/* TUTAJ WSTAW TEN KOD - Czarna nakładka 50% przezroczystości */}
        <div className="absolute inset-0 bg-black/50" />
        {/* KONIEC KODU DO WSTAWIENIA */}
      </div>

      {/* 2. TOP TECHNICAL NAV */}
      <header className="relative z-20 flex items-center justify-between px-12 py-8 backdrop-blur-md border-b border-white/5 bg-white/5 shrink-0">
         <div className="flex items-center gap-8">
            <div className="flex flex-col">
               <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,1)]" />
                  <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white leading-none">
                    Performance <span className="text-emerald-500">Lab</span>
                  </h1>
               </div>
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-2">Centrum Zarządzania Kadrami • {myClub?.name.toUpperCase()}</p>
            </div>
         </div>

         <div className="flex items-center gap-6">
            <button 
              onClick={() => navigateTo(ViewState.DASHBOARD)}
              className="px-8 py-3 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-95"
            >
              &larr; Anuluj i wróć
            </button>
            <button 
              onClick={handleSave}
              disabled={!selectedId}
              className="px-12 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 text-white font-black italic uppercase tracking-tighter text-sm transition-all hover:scale-105 active:scale-95 shadow-[0_20px_50px_rgba(16,185,129,0.3)] border-b-4 border-emerald-800"
            >
              ZATWIERDŹ PROGRAM 🏁
            </button>
         </div>
      </header>

      {/* 3. MAIN WORKSPACE */}
      <div className="relative z-10 flex-1 flex gap-8 p-12 min-h-0 overflow-hidden">
        
        {/* Left: Cycle Selector (The Grid) */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-4">
           <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 pb-10">
              {TRAINING_CYCLES.map(cycle => {
                const isActive = activeTrainingId === cycle.id;
                const isSelected = selectedId === cycle.id;
                
                return (
                  <button
                    key={cycle.id}
                    onClick={() => setSelectedId(cycle.id)}
                    className={`group relative p-8 rounded-[40px] border transition-all duration-500 text-left overflow-hidden
                      ${isSelected 
                        ? 'bg-emerald-600/10 border-emerald-500/50 shadow-[0_0_40px_rgba(16,185,129,0.1)] scale-[1.02]' 
                        : 'bg-slate-900/40 border-white/5 hover:border-white/20 hover:bg-slate-900/60'}
                    `}
                  >
                    {/* Background Visual Ornament */}
                    <div className="absolute right-[-10px] bottom-[-10px] text-8xl opacity-[0.03] group-hover:opacity-[0.06] transition-opacity rotate-12">
                       {cycle.icon}
                    </div>

                    <div className="relative z-10 flex items-start gap-6">
                       <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center text-4xl shadow-2xl transition-transform group-hover:scale-110 group-hover:rotate-3 
                        ${isSelected ? 'bg-emerald-500 border-2 border-emerald-300 shadow-emerald-500/20' : 'bg-slate-800 border border-white/10'}`}>
                          {cycle.icon}
                       </div>
                       <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                             <h4 className="text-lg font-black text-white uppercase italic tracking-tight truncate">{cycle.name}</h4>
                             {isActive && (
                               <span className="bg-blue-600/20 text-blue-400 text-[8px] px-2 py-0.5 rounded-full border border-blue-500/30 font-black tracking-widest uppercase">AKTYWNY</span>
                             )}
                          </div>
                          <p className="text-[11px] text-slate-500 font-medium line-clamp-2 leading-relaxed italic pr-4">
                             "{cycle.description}"
                          </p>
                       </div>
                    </div>
                    
                    {/* Status Dot */}
                    {isSelected && (
                      <div className="absolute right-8 top-1/2 -translate-y-1/2 w-1 h-12 bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,1)]" />
                    )}
                  </button>
                );
              })}
           </div>
        </div>

        {/* Right: Detailed Analysis Panel */}
        <div className="w-[450px] shrink-0 flex flex-col animate-slide-left">
           <div className="flex-1 bg-slate-900/60 rounded-[50px] border border-white/10 backdrop-blur-3xl p-10 flex flex-col shadow-[0_50px_100px_rgba(0,0,0,0.5)] relative overflow-hidden group">
              
              {/* Internal Diagnostic Grid Backdrop */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

              {currentCycle ? (
                <div className="relative z-10 flex flex-col h-full animate-fade-in">
                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] mb-4">DIAGNOSTYKA PROGRAMU</span>
                  <h3 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-10 leading-none">
                     Raport<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-500">Wpływu</span>
                  </h3>
                  
                  <div className="space-y-10 flex-1">
                    {/* Growth Indicators */}
                    <div className="space-y-6">
                       <span className="block text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">PRIORYTETY ROZWOJOWE</span>
                       <div className="grid grid-cols-2 gap-3">
                          {currentCycle.primaryAttributes.map(attr => (
                            <div key={attr} className="bg-emerald-500/10 border border-emerald-500/20 px-5 py-3 rounded-2xl group hover:bg-emerald-500/20 transition-all">
                               <span className="block text-[8px] font-black text-emerald-500 uppercase tracking-widest mb-1">SKOK ATOMOWY</span>
                               <span className="text-xs font-black text-white uppercase italic tracking-tighter group-hover:text-emerald-400 transition-colors">+ {attr}</span>
                            </div>
                          ))}
                          {currentCycle.secondaryAttributes.map(attr => (
                            <div key={attr} className="bg-blue-500/10 border border-blue-500/20 px-5 py-3 rounded-2xl group hover:bg-blue-500/20 transition-all">
                               <span className="block text-[8px] font-black text-blue-400 uppercase tracking-widest mb-1">WZROST LEKKI</span>
                               <span className="text-xs font-black text-white uppercase italic tracking-tighter group-hover:text-blue-400 transition-colors">+ {attr}</span>
                            </div>
                          ))}
                       </div>
                    </div>

                    {/* Stress Meter */}
                    <div className="space-y-6">
                       <div className="flex justify-between items-center">
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">OBCIĄŻENIE SYSTEMU (STRESS)</span>
                          <span className={`text-xl font-black italic tabular-nums ${currentCycle.fatigueRisk > 0.7 ? 'text-rose-500' : (currentCycle.fatigueRisk > 0.4 ? 'text-amber-500' : 'text-emerald-500')}`}>
                             {Math.round(currentCycle.fatigueRisk * 100)}%
                          </span>
                       </div>
                       <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/5">
                          <div 
                             className={`h-full rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(0,0,0,0.5)]
                                ${currentCycle.fatigueRisk > 0.7 ? 'bg-gradient-to-r from-rose-600 to-rose-400' : 
                                  (currentCycle.fatigueRisk > 0.4 ? 'bg-gradient-to-r from-amber-600 to-amber-400' : 
                                   'bg-gradient-to-r from-emerald-600 to-emerald-400')}`} 
                             style={{ width: `${currentCycle.fatigueRisk * 100}%` }} 
                          />
                       </div>
                       <p className="text-[10px] text-slate-500 font-bold italic leading-relaxed">
                          * Wysokie obciążenie zwiększa szansę na urazy przeciążeniowe podczas treningów.
                       </p>
                    </div>

                    {/* Special Bonuses */}
                    {currentCycle.recoveryBonus && (
                      <div className="p-6 bg-gradient-to-br from-blue-600/20 to-blue-900/10 border border-blue-500/30 rounded-[30px] flex items-center gap-6 animate-pulse">
                         <div className="text-4xl drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">🧘</div>
                         <div>
                            <span className="block text-[9px] font-black text-blue-400 uppercase tracking-[0.2em] mb-1">EFEKT SPECJALNY</span>
                            <span className="text-sm font-black text-white italic uppercase tracking-tight leading-tight">Maksymalna regeneracja kondycji (+50%)</span>
                         </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-10 pt-10 border-t border-white/5 flex items-center justify-between">
                     <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">KOD PROCEDURY</span>
                        <span className="text-xs font-mono text-slate-400">TRN-LAB-{selectedId?.split('_')[1]}</span>
                     </div>
                     <div className="w-12 h-12 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center text-xl grayscale opacity-20">📡</div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30 animate-pulse">
                   <div className="text-8xl mb-8">🔍</div>
                   <p className="text-sm font-black uppercase tracking-[0.4em] italic text-slate-500">Wybierz cykl operacyjny,<br/>aby rozpocząć analizę</p>
                </div>
              )}
           </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        @keyframes fade-in { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
        .animate-fade-in { animation: fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes slide-left { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: translateX(0); } }
        .animate-slide-left { animation: slide-left 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes pulse-slow { 0%, 100% { transform: scale(1.05); } 50% { transform: scale(1.08); } }
        .animate-pulse-slow { animation: pulse-slow 15s infinite ease-in-out; }
      `}</style>
    </div>
  );
};