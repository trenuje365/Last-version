import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { ViewState } from '../../types';
import { TRAINING_CYCLES } from '../../data/training_definitions_pl';

export const TrainingView: React.FC = () => {
  const { navigateTo, activeTrainingId, setActiveTrainingId, clubs, userTeamId, activeIntensity, setTrainingIntensity, players, updatePlayer, viewPlayerDetails } = useGame();
  const [selectedId, setSelectedId] = useState<string | null>(activeTrainingId);
  const teamPlayers = (userTeamId ? players[userTeamId] : []) || [];

  const myClub = clubs.find(c => c.id === userTeamId);
  const currentCycle = TRAINING_CYCLES.find(c => c.id === selectedId) || null;

  const ATTR_LABELS: Record<string, string> = {
    strength: 'Siła', stamina: 'Kondycja', pace: 'Szybkość', defending: 'Obrona',
    passing: 'Podania', attacking: 'Atak', finishing: 'Wykończenie', technique: 'Technika',
    vision: 'Wizja', dribbling: 'Drybling', heading: 'Gra głową', positioning: 'Ustawianie',
    goalkeeping: 'Bramkarstwo', freeKicks: 'Rzuty wolne', penalties: 'Jedenastki',
    corners: 'Rożne', aggression: 'Agresja', crossing: 'Dośrodkowania',
    leadership: 'Przywództwo', mentality: 'Mentalność', workRate: 'Pracowitość'
  };
  const TRAINABLE_ATTRS = Object.entries(ATTR_LABELS);

  const ATTR_ABBR: Record<string, string> = {
    strength: 'SIŁ', stamina: 'KON', pace: 'SZY', defending: 'OBR',
    heading: 'GŁW', positioning: 'UST', goalkeeping: 'BRA', passing: 'POD',
    technique: 'TEC', vision: 'WIZ', dribbling: 'DRY', crossing: 'DŚR',
    attacking: 'ATK', finishing: 'WYK', freeKicks: 'RWL', corners: 'RŻN',
    penalties: 'KRN', aggression: 'AGR', leadership: 'PRZ', mentality: 'MEN', workRate: 'PRC'
  };
  const COLS = Object.keys(ATTR_ABBR);

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
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/95 via-slate-950/85 to-slate-950" />
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
        
        {/* LEWA STRONA: LISTA ZAWODNIKÓW */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-4">

              {/* FOKUS INDYWIDUALNY ZAWODNIKÓW */}
              <div className="pb-20">
                <span className="block text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4 px-1">Fokus Indywidualny Zawodników</span>
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="text-[9px] font-bold border-collapse" style={{ minWidth: 'max-content' }}>
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="py-2 px-3 text-left text-slate-500 uppercase tracking-widest sticky left-0 bg-slate-950 z-10 whitespace-nowrap">ZAWODNIK</th>
                        {COLS.map(k => (
                          <th key={k} className="py-2 px-2 text-center text-slate-500 uppercase tracking-widest font-black">{ATTR_ABBR[k]}</th>
                        ))}
                        <th className="py-2 px-3 text-center text-slate-500 uppercase tracking-widest sticky right-0 bg-slate-950 z-10">FOKUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...teamPlayers].sort((a, b) => {
                        const ord: Record<string, number> = { GK: 0, DEF: 1, MID: 2, FWD: 3 };
                        return (ord[a.position] ?? 4) - (ord[b.position] ?? 4);
                      }).map((player, idx) => {
                        const posColor = player.position === 'GK' ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                          : player.position === 'DEF' ? 'bg-blue-500/20 border-blue-500/40 text-blue-400'
                          : player.position === 'MID' ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                          : 'bg-rose-500/20 border-rose-500/40 text-rose-400';
                        const stickyBg = idx % 2 === 0 ? 'bg-slate-950' : 'bg-[#090e1a]';
                        return (
                          <tr key={player.id} className={`border-b border-white/5 hover:bg-white/5 transition-colors ${idx % 2 !== 0 ? 'bg-white/[0.02]' : ''}`}>
                            <td className={`py-2 px-3 sticky left-0 z-10 whitespace-nowrap ${stickyBg}`}>
                              <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border mr-2 ${posColor}`}>{player.position}</span>
                              <button onClick={() => viewPlayerDetails(player.id)} className="font-black text-white hover:text-emerald-400 transition-colors cursor-pointer">{player.firstName[0]}. {player.lastName}</button>
                              <span className="ml-2 text-slate-500 font-bold">OVR {player.overallRating}</span>
                            </td>
                            {COLS.map(k => {
                              const val = (player.attributes[k as keyof typeof player.attributes] as number) ?? 0;
                              const color = val >= 85 ? 'text-emerald-400' : val >= 75 ? 'text-white' : val >= 60 ? 'text-amber-400' : 'text-rose-400';
                              return <td key={k} className={`py-2 px-2 text-center tabular-nums ${color}`}>{val}</td>;
                            })}
                            <td className={`py-2 px-2 sticky right-0 z-10 ${stickyBg}`}>
                              <select
                                value={player.trainingFocus || ''}
                                onChange={e => updatePlayer(userTeamId!, player.id, { trainingFocus: (e.target.value as any) || null })}
                                className="bg-slate-800 border border-white/10 text-white text-[9px] font-black rounded-lg px-2 py-1 outline-none cursor-pointer hover:border-emerald-500/40 transition-all"
                              >
                                <option value="">— Brak —</option>
                                {TRAINABLE_ATTRS.map(([key, label]) => (
                                  <option key={key} value={key}>{label}</option>
                                ))}
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
        </div>

        {/* PRAWA STRONA: PROGRAMY + DIAGNOSTYKA */}
        <div className="w-[680px] shrink-0 flex flex-col gap-4 overflow-y-auto custom-scrollbar animate-slide-left pb-20">

           {/* SIATKA PROGRAMÓW TRENINGOWYCH */}
           <div className="grid grid-cols-2 gap-3">
              {TRAINING_CYCLES.map(cycle => {
                const isActive = activeTrainingId === cycle.id;
                const isSelected = selectedId === cycle.id;
                return (
                  <button
                    key={cycle.id}
                    onClick={() => setSelectedId(cycle.id)}
                    className={`group relative p-3 rounded-2xl border transition-all duration-300 text-left overflow-hidden
                      ${isSelected
                        ? 'bg-emerald-600/15 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
                        : 'bg-slate-900/40 border-white/5 hover:border-white/20 hover:bg-slate-900/60'}
                    `}
                  >
                    {/* OPIS NA HOVER */}
                    <div className="absolute inset-0 rounded-2xl p-3 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center z-20 pointer-events-none" style={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.12)' }}>
                      <p className="text-[10px] text-white font-medium leading-relaxed text-center italic">"{cycle.description}"</p>
                    </div>

                    <div className="relative z-10 flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-2xl shrink-0 transition-transform group-hover:scale-110
                        ${isSelected ? 'bg-emerald-500 border border-emerald-300 text-white' : 'bg-slate-800 border border-white/10'}`}>
                        {cycle.icon}
                      </div>
                      <div className="flex-1 min-w-0 flex items-center gap-2">
                        <h4 className="text-sm font-black text-white uppercase italic tracking-tighter truncate">{cycle.name}</h4>
                        {isActive && (
                          <span className="bg-blue-600/20 text-blue-400 text-[7px] px-2 py-0.5 rounded-full border border-blue-500/30 font-black tracking-widest uppercase shrink-0">OBECNY</span>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <div className="absolute right-0 top-0 bottom-0 w-1 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,1)]" />
                    )}
                  </button>
                );
              })}
           </div>

           {/* PANEL DIAGNOSTYKI */}
           <div className="bg-slate-900/60 rounded-[40px] border border-white/10 backdrop-blur-3xl p-5 flex flex-col gap-4 shadow-[0_50px_100px_rgba(0,0,0,0.7)]">

              {/* PANEL INTENSYWNOŚCI */}
              <div className="bg-black/40 p-3 rounded-[20px] border border-white/5">
                 <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] mb-2 block px-1">Intensywność</span>
                 <div className="flex gap-2">
                    {[
                      { id: 'LIGHT', label: 'LEKKI', color: 'border-emerald-500/50 text-emerald-400', active: 'bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.4)]' },
                      { id: 'NORMAL', label: 'NORMALNY', color: 'border-blue-500/50 text-blue-400', active: 'bg-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.4)]' },
                      { id: 'HEAVY', label: 'CIĘŻKI', color: 'border-rose-500/50 text-rose-400', active: 'bg-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.4)]' }
                    ].map(btn => (
                       <button
                          key={btn.id}
                          onClick={() => setTrainingIntensity(btn.id as any)}
                          className={`flex-1 py-2 rounded-lg text-[9px] font-black transition-all border ${activeIntensity === btn.id ? btn.active : `bg-white/5 ${btn.color} hover:bg-white/10`}`}
                       >
                          {btn.label}
                       </button>
                    ))}
                 </div>
              </div>

              {currentCycle ? (
                <div className="flex flex-col gap-3 animate-fade-in">

                  {/* PRIORYTETOWE */}
                  <div>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] block mb-2 px-1">Priorytet</span>
                    <div className="flex flex-wrap gap-1.5">
                      {currentCycle.primaryAttributes.map(attr => (
                        <span key={attr} className="text-[9px] font-black px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 uppercase italic tracking-tight">
                          + {ATTR_LABELS[attr] || attr}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* WSPIERAJĄCE */}
                  <div>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] block mb-2 px-1">Wsparcie</span>
                    <div className="flex flex-wrap gap-1.5">
                      {currentCycle.secondaryAttributes.map(attr => (
                        <span key={attr} className="text-[9px] font-black px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 uppercase italic tracking-tight">
                          + {ATTR_LABELS[attr] || attr}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* OBCIĄŻENIE */}
                  {(() => {
                    let totalRisk = currentCycle.fatigueRisk;
                    if (activeIntensity === 'HEAVY') totalRisk += 0.3;
                    if (activeIntensity === 'LIGHT') totalRisk -= 0.2;
                    totalRisk = Math.max(0.1, Math.min(1.0, totalRisk));
                    const color = totalRisk > 0.7 ? 'text-rose-500' : totalRisk > 0.4 ? 'text-amber-500' : 'text-emerald-500';
                    const barColor = totalRisk > 0.7 ? 'bg-gradient-to-r from-rose-600 to-rose-400' : totalRisk > 0.4 ? 'bg-gradient-to-r from-amber-600 to-amber-400' : 'bg-gradient-to-r from-emerald-600 to-emerald-400';
                    return (
                      <div className="bg-black/20 p-3 rounded-2xl border border-white/5">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Obciążenie</span>
                          <span className={`text-base font-black italic tabular-nums ${color}`}>{Math.round(totalRisk * 100)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden border border-white/10">
                          <div className={`h-full rounded-full transition-all duration-1000 ${barColor}`} style={{ width: `${totalRisk * 100}%` }} />
                        </div>
                      </div>
                    );
                  })()}

                  {/* BONUS REGENERACJI */}
                  {currentCycle.recoveryBonus && (
                    <div className="p-3 bg-gradient-to-br from-blue-600/20 to-blue-900/10 border border-blue-500/30 rounded-2xl flex items-center gap-3">
                       <div className="text-2xl">🧘</div>
                       <div>
                          <span className="block text-[8px] font-black text-blue-400 uppercase tracking-[0.3em] mb-0.5">Regeneracja</span>
                          <span className="text-[10px] font-black text-white italic uppercase tracking-tight">+50% odzysk sił</span>
                       </div>
                    </div>
                  )}

                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center opacity-30 py-8">
                   <div className="text-5xl mb-4">🔬</div>
                   <p className="text-xs font-black uppercase tracking-[0.3em] italic text-slate-500">Wybierz cykl</p>
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