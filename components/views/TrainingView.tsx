import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { ViewState } from '../../types';
import { TRAINING_CYCLES } from '../../data/training_definitions_pl';

export const TrainingView: React.FC = () => {
  const { navigateTo, activeTrainingId, setActiveTrainingId, clubs, userTeamId, activeIntensity, setTrainingIntensity } = useGame();
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
    <div className="fixed inset-0 w-full h-full flex flex-col animate-fade-in overflow-hidden relative bg-slate-950 font-sans">
      
      {/* TŁO KINEMATYCZNE */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div 
          className="absolute inset-0 bg-cover bg-center scale-110"
          style={{ backgroundImage: "url('https://i.ibb.co/VcMTs5c6/traning.png')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-950/60 to-slate-950" />
        <div className="absolute inset-0 backdrop-blur-[2px]" />
      </div>

      {/* NAGŁÓWEK TECHNICZNY */}
      <header className="relative z-20 flex items-center justify-between px-12 py-8 border-b border-white/10 bg-white/5 backdrop-blur-3xl shrink-0 shadow-2xl">
         <div className="flex items-center gap-8">
            <div className="w-16 h-16 rounded-[22px] bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-3xl shadow-inner animate-pulse-slow">
               🏋️‍♂️
            </div>
            <div className="flex flex-col">
               <div className="flex items-center gap-3">
                  <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white leading-none">
                    Centrum <span className="text-emerald-500">Treningowe</span>
                  </h1>
                  <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
                     <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                     <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">System Aktywny</span>
                  </div>
               </div>
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-2">Optymalizacja Rozwoju • {myClub?.name.toUpperCase()}</p>
            </div>
         </div>

         <div className="flex items-center gap-6">
            <button 
              onClick={() => navigateTo(ViewState.DASHBOARD)}
              className="px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-95"
            >
              &larr; Anuluj zmiany
            </button>
            <button 
              onClick={handleSave}
              disabled={!selectedId}
              className="px-14 py-5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-20 text-white font-black italic uppercase tracking-tighter text-lg transition-all hover:scale-105 active:scale-95 shadow-[0_20px_50px_rgba(16,185,129,0.4)] border-b-4 border-emerald-900"
            >
              ZATWIERDŹ PROGRAM 🏁
            </button>
         </div>
      </header>

      {/* GŁÓWNA PRZESTRZEŃ ROBOCZA */}
      <div className="relative z-10 flex-1 flex gap-8 p-12 min-h-0 overflow-hidden">
        
        {/* LEWA STRONA: LISTA CYKLI */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-4">
           <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 pb-20">
              {TRAINING_CYCLES.map(cycle => {
                const isActive = activeTrainingId === cycle.id;
                const isSelected = selectedId === cycle.id;
                
                return (
                  <button
                    key={cycle.id}
                    onClick={() => setSelectedId(cycle.id)}
                    className={`group relative p-8 rounded-[45px] border transition-all duration-500 text-left overflow-hidden
                      ${isSelected 
                        ? 'bg-emerald-600/15 border-emerald-500/50 shadow-[0_0_40px_rgba(16,185,129,0.15)] scale-[1.02]' 
                        : 'bg-slate-900/40 border-white/5 hover:border-white/20 hover:bg-slate-900/60'}
                    `}
                  >
                    <div className="absolute right-[-20px] bottom-[-20px] text-9xl opacity-[0.03] group-hover:opacity-[0.07] transition-opacity rotate-12 pointer-events-none">
                       {cycle.icon}
                    </div>

                    <div className="relative z-10 flex items-start gap-8">
                       <div className={`w-20 h-20 rounded-[30px] flex items-center justify-center text-5xl shadow-2xl transition-transform group-hover:scale-110 group-hover:rotate-3 
                        ${isSelected ? 'bg-emerald-500 border-2 border-emerald-300 shadow-emerald-500/30 text-white' : 'bg-slate-800 border border-white/10'}`}>
                          {cycle.icon}
                       </div>
                       <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-4 mb-2">
                             <h4 className="text-2xl font-black text-white uppercase italic tracking-tighter truncate">{cycle.name}</h4>
                             {isActive && (
                               <span className="bg-blue-600/20 text-blue-400 text-[8px] px-3 py-1 rounded-full border border-blue-500/30 font-black tracking-widest uppercase shadow-lg">OBECNY</span>
                             )}
                          </div>
                          <p className="text-sm text-slate-400 font-medium leading-relaxed italic pr-6 opacity-80">
                             "{cycle.description}"
                          </p>
                       </div>
                    </div>
                    
                    {isSelected && (
                      <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,1)]" />
                    )}
                  </button>
                );
              })}
           </div>
        </div>

        {/* PRAWA STRONA: DIAGNOSTYKA SZCZEGÓŁOWA */}
        <div className="w-[500px] shrink-0 flex flex-col animate-slide-left">
           <div className="flex-1 bg-slate-900/60 rounded-[60px] border border-white/10 backdrop-blur-3xl p-12 flex flex-col shadow-[0_50px_100px_rgba(0,0,0,0.7)] relative overflow-hidden group">
              
              <div className="absolute top-0 right-0 p-10 opacity-[0.02] text-[15rem] font-black italic text-white select-none pointer-events-none">DANE</div>

              {/* PANEL INTENSYWNOŚCI (STAGE 1 PRO) */}
              <div className="relative z-20 mb-8 bg-black/40 p-4 rounded-[30px] border border-white/5">
                 <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] mb-3 block px-2">Poziom Intensywności</span>
                 <div className="flex gap-2">
                    {[
                      { id: 'LIGHT', label: 'LEKKI', color: 'border-emerald-500/50 text-emerald-400', active: 'bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.4)]' },
                      { id: 'NORMAL', label: 'NORMALNY', color: 'border-blue-500/50 text-blue-400', active: 'bg-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.4)]' },
                      { id: 'HEAVY', label: 'CIĘŻKI', color: 'border-rose-500/50 text-rose-400', active: 'bg-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.4)]' }
                    ].map(btn => (
                       <button
                          key={btn.id}
                          onClick={() => setTrainingIntensity(btn.id as any)}
                          className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all border ${activeIntensity === btn.id ? btn.active : `bg-white/5 ${btn.color} hover:bg-white/10`}`}
                       >
                          {btn.label}
                       </button>
                    ))}
                 </div>
              </div>

              {currentCycle ? (
                <div className="relative z-10 flex flex-col h-full animate-fade-in">
                  <div className="flex justify-between items-start mb-12">
                     <div>
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.5em] block mb-2">ANALIZA POTENCJAŁU</span>
                        <h3 className="text-5xl font-black text-white italic uppercase tracking-tighter leading-none">
                           Raport<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-700">Wpływu</span>
                        </h3>
                     </div>
                     <div className="w-16 h-16 rounded-3xl bg-black/40 border border-white/10 flex items-center justify-center text-3xl shadow-inner">📊</div>
                  </div>
                  
                  <div className="space-y-12 flex-1">
                    {/* ATYBUTY WZROSTU */}
                    <div className="space-y-6">
                       <span className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] px-1">Prognozowane przyrosty</span>
                       <div className="grid grid-cols-2 gap-4">
                          {currentCycle.primaryAttributes.map(attr => (
                            <div key={attr} className="bg-emerald-500/10 border border-emerald-500/20 px-6 py-4 rounded-[28px] group hover:bg-emerald-500/20 transition-all shadow-lg">
                               <div className="flex items-center gap-2 mb-1">
                                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                  <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">PRIORYTET</span>
                               </div>
                               <span className="text-sm font-black text-white uppercase italic tracking-tighter group-hover:text-emerald-300 transition-colors">+ {attr}</span>
                            </div>
                          ))}
                          {currentCycle.secondaryAttributes.map(attr => (
                            <div key={attr} className="bg-blue-500/10 border border-blue-500/20 px-6 py-4 rounded-[28px] group hover:bg-blue-500/20 transition-all shadow-lg">
                               <div className="flex items-center gap-2 mb-1">
                                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                  <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest">WSPARCIE</span>
                               </div>
                               <span className="text-sm font-black text-white uppercase italic tracking-tighter group-hover:text-blue-300 transition-colors">+ {attr}</span>
                            </div>
                          ))}
                       </div>
                    </div>

                    {/* METRYKA STRESU (DYNAMICZNA) */}
                    <div className="space-y-6 bg-black/20 p-8 rounded-[40px] border border-white/5">
                       <div className="flex justify-between items-center px-1">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Obciążenie organizmu</span>
                          {(() => {
                             let totalRisk = currentCycle.fatigueRisk;
                             if (activeIntensity === 'HEAVY') totalRisk += 0.3;
                             if (activeIntensity === 'LIGHT') totalRisk -= 0.2;
                             totalRisk = Math.max(0.1, Math.min(1.0, totalRisk));
                             
                             return (
                                <span className={`text-3xl font-black italic tabular-nums ${totalRisk > 0.7 ? 'text-rose-500 shadow-rose-500/20' : (totalRisk > 0.4 ? 'text-amber-500' : 'text-emerald-500')}`}>
                                   {Math.round(totalRisk * 100)}%
                                </span>
                             );
                          })()}
                       </div>
                       <div className="h-4 w-full bg-black/40 rounded-full overflow-hidden p-1 border border-white/10 shadow-inner">
                          {(() => {
                             let totalRisk = currentCycle.fatigueRisk;
                             if (activeIntensity === 'HEAVY') totalRisk += 0.3;
                             if (activeIntensity === 'LIGHT') totalRisk -= 0.2;
                             totalRisk = Math.max(0.1, Math.min(1.0, totalRisk));
                             
                             return (
                               <div 
                                  className={`h-full rounded-full transition-all duration-1000 shadow-[0_0_20px_rgba(0,0,0,0.5)]
                                     ${totalRisk > 0.7 ? 'bg-gradient-to-r from-rose-600 to-rose-400' : 
                                       (totalRisk > 0.4 ? 'bg-gradient-to-r from-amber-600 to-amber-400' : 
                                        'bg-gradient-to-r from-emerald-600 to-emerald-400')}`} 
                                  style={{ width: `${totalRisk * 100}%` }} 
                               />
                             );
                          })()}
                       </div>
                       <p className="text-[10px] text-slate-500 font-bold italic leading-relaxed text-center px-4">
                          Intensywność cyklu wpływa na szybkość regeneracji energii oraz bazowe ryzyko urazów w trakcie mikrocyklu.
                       </p>
                    </div>

                    {/* BONUSY SPECJALNE */}
                    {currentCycle.recoveryBonus && (
                      <div className="p-8 bg-gradient-to-br from-blue-600/20 to-blue-900/10 border border-blue-500/30 rounded-[40px] flex items-center gap-8 shadow-2xl animate-pulse-slow">
                         <div className="text-6xl drop-shadow-[0_0_20px_rgba(59,130,246,0.6)]">🧘</div>
                         <div>
                            <span className="block text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-2">SPECJALNY EFEKT REGENERACJI</span>
                            <span className="text-lg font-black text-white italic uppercase tracking-tighter leading-tight">Maksymalne tempo odzyskiwania sił (+50%)</span>
                         </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-12 pt-8 border-t border-white/10 flex items-center justify-between">
                     <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">KOD PROCEDURY</span>
                        <span className="text-xs font-mono text-slate-500 font-bold">{currentCycle.id}</span>
                     </div>
                     <div className="px-5 py-2 bg-white/5 rounded-full border border-white/10">
                        <span className="text-[8px] font-black text-slate-500 tracking-widest uppercase">FM_LAB_2025</span>
                     </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30 animate-pulse">
                   <div className="text-[10rem] mb-12">🔬</div>
                   <p className="text-xl font-black uppercase tracking-[0.5em] italic text-slate-500">Wybierz cykl treningowy,<br/><span className="text-sm tracking-[0.3em]">aby rozpocząć symulację</span></p>
                </div>
              )}
           </div>
        </div>
      </div>

      {/* FOOTER TICKER */}
      <footer className="h-12 bg-black/60 border-t border-white/5 flex items-center px-12 overflow-hidden shrink-0 relative z-20">
         <div className="bg-emerald-600 px-5 py-1.5 rounded-full mr-10 shrink-0 shadow-lg shadow-emerald-900/40">
            <span className="text-[10px] font-black text-white uppercase tracking-widest italic">MONITORING_TRENINGU_NA_ZYWO</span>
         </div>
         <div className="flex-1 whitespace-nowrap overflow-hidden opacity-30">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.6em] animate-ticker">
               ANALIZA WYDOLNOŚCIOWA • KONTROLA OBCIĄŻEŃ • REGENERACJA MIĘŚNIOWA • SZLIFOWANIE TAKTYKI • BRAK ANOMALII W SYSTEMIE • ROZWÓJ MŁODZIEŻY
            </p>
         </div>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
        
        @keyframes fade-in { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
        .animate-fade-in { animation: fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        
        @keyframes slide-left { from { opacity: 0; transform: translateX(60px); } to { opacity: 1; transform: translateX(0); } }
        .animate-slide-left { animation: slide-left 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        
        @keyframes pulse-slow { 0%, 100% { transform: scale(1); opacity: 0.8; } 50% { transform: scale(1.02); opacity: 1; } }
        .animate-pulse-slow { animation: pulse-slow 8s infinite ease-in-out; }

        @keyframes ticker {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-ticker { animation: ticker 40s linear infinite; }
      `}</style>
    </div>
  );
};