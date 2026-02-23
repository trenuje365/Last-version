import React, { useState, useMemo } from 'react';
import { Lineup, Player, SubstitutionRecord, PlayerPosition } from '../../types';
import { TacticRepository } from '../../resources/tactics_db';
import { PlayerPresentationService } from '../../services/PlayerPresentationService';
import { LineupService } from '../../services/LineupService';

interface MatchCupTacticsModalProps {
  isOpen: boolean;
  onClose: (newLineup: Lineup, subsCount: number, subsHistory: SubstitutionRecord[]) => void;
  club: any;
  lineup: Lineup;
  players: Player[];
  fatigue: Record<string, number>;
  subsCount: number;
  subsHistory: SubstitutionRecord[];
  minute: number;
  sentOffIds?: string[];
}

export const MatchCupTacticsModal: React.FC<MatchCupTacticsModalProps> = ({ 
  isOpen, onClose, club, lineup, players, fatigue, subsCount, subsHistory, minute, sentOffIds = []
}) => {
  if (!isOpen) return null;

  const [currentLineup, setCurrentLineup] = useState<Lineup>(lineup);
  const [currentSubsCount, setCurrentSubsCount] = useState(subsCount);
  const [currentSubsHistory, setCurrentSubsHistory] = useState<SubstitutionRecord[]>(subsHistory);
  const [selectedSlot, setSelectedSlot] = useState<{ id: string | null, index?: number, loc: 'START' | 'BENCH' } | null>(null);

  const tactic = TacticRepository.getById(currentLineup.tacticId);
  const substitutedOffIds = new Set(currentSubsHistory.map(s => s.playerOutId));

  const registeredIds = new Set([...currentLineup.startingXI.filter(id => id !== null), ...currentLineup.bench]);
  const registeredPlayers = players.filter(p => registeredIds.has(p.id));

  const mySentOffCount = sentOffIds.filter(id => players.some(p => p.id === id)).length;
  const currentOnPitchCount = currentLineup.startingXI.filter(id => id !== null).length;
  const maxAllowedOnPitch = 11 - mySentOffCount;

  const sortedBenchIds = useMemo(() => {
    const benchPlayers = currentLineup.bench
      .map(id => registeredPlayers.find(p => p.id === id))
      .filter((p): p is Player => p !== undefined);
    
    return PlayerPresentationService.sortPlayers(benchPlayers).map(p => p.id);
  }, [currentLineup.bench, registeredPlayers]);

  const handleSlotClick = (pId: string | null, loc: 'START' | 'BENCH', index?: number) => {
    if (selectedSlot === null) {
      if (pId && substitutedOffIds.has(pId)) return;
      setSelectedSlot({ id: pId, index, loc });
    } else {
      const isSub = (selectedSlot.loc !== loc);
      
      if (isSub) {
        if (currentSubsCount >= 5) {
          alert("LIMIT ZMIAN WYCZERPANY!");
          setSelectedSlot(null);
          return;
        }

        const playerEnteringId = selectedSlot.loc === 'BENCH' ? selectedSlot.id : pId;
        const playerLeavingId = selectedSlot.loc === 'START' ? selectedSlot.id : pId;

        if (selectedSlot.loc === 'BENCH' && loc === 'START' && pId === null) {
           if (currentOnPitchCount >= maxAllowedOnPitch) {
              alert("POZYCJA ZABLOKOWANA: WYKLUCZENIE DYSCYPLINARNE");
              setSelectedSlot(null);
              return;
           }
        }

        if (playerEnteringId && substitutedOffIds.has(playerEnteringId)) {
          alert("ZAWODNIK OPUŚCIŁ JUŻ BOISKO!");
          setSelectedSlot(null);
          return;
        }

        if (playerEnteringId) {
          setCurrentSubsCount(prev => prev + 1);
          setCurrentSubsHistory(prev => [
            ...prev, 
            { playerOutId: playerLeavingId || 'NONE', playerInId: playerEnteringId, minute }
          ]);
        }
      }

      const newLineup = LineupService.swapPlayers(currentLineup, selectedSlot.id, pId, selectedSlot.index, index);
      setCurrentLineup(newLineup);
      setSelectedSlot(null);
    }
  };

  const renderTacticalCard = (pId: string | null, expectedRole: string, index?: number, loc: 'START' | 'BENCH' = 'START') => {
    const p = pId ? registeredPlayers.find(player => player.id === pId) : null;
    const isSelected = selectedSlot?.loc === loc && (loc === 'START' ? selectedSlot.index === index : selectedSlot.id === pId);
    const isOut = p && substitutedOffIds.has(p.id);
    const f = p ? (fatigue[p.id] !== undefined ? Math.floor(fatigue[p.id]) : 100) : 0;
    const isRedBlocked = !p && loc === 'START' && currentOnPitchCount >= maxAllowedOnPitch;
    
    const isNaturalPos = p && p.position === expectedRole;
    const isGkMismatch = p && ((p.position === 'GK' && expectedRole !== 'GK') || (p.position !== 'GK' && expectedRole === 'GK'));

    return (
      <div 
        onClick={() => !isRedBlocked && handleSlotClick(pId, loc, index)}
        className={`relative w-full h-20 mb-3 rounded-[24px] transition-all duration-500 group overflow-visible
          ${isSelected 
            ? 'bg-blue-500/20 border-blue-400 shadow-[0_0_30px_rgba(59,130,246,0.3)] scale-[1.02] z-30' 
            : 'bg-white/5 border-white/10 hover:bg-white/[0.08] hover:border-white/20'
          }
          ${isOut ? 'opacity-30 grayscale pointer-events-none' : 'cursor-pointer'}
          ${isRedBlocked ? 'bg-black/60 opacity-80 cursor-not-allowed grayscale' : ''}
          ${p && !isNaturalPos && !isGkMismatch && loc === 'START' ? 'border-amber-500/30' : ''}
          ${isGkMismatch && loc === 'START' ? 'border-rose-500/50 bg-rose-500/5' : ''}
          border backdrop-blur-xl
        `}
      >
        {/* Wskaźnik roli taktycznej */}
        <div className={`absolute -left-6 top-1/2 -translate-y-1/2 w-14 h-14 rounded-2xl flex flex-col items-center justify-center shadow-2xl border-2 z-20 transition-all duration-500
          ${loc === 'BENCH' ? 'hidden' : ''}
          ${!p ? 'bg-slate-900 border-white/10' : (isNaturalPos ? 'bg-emerald-500 border-emerald-300 shadow-emerald-500/20 rotate-0' : 'bg-amber-600 border-amber-400 shadow-amber-600/20 -rotate-12')}
          ${isGkMismatch ? 'bg-rose-700 border-rose-400 shadow-rose-600/30' : ''}
        `}>
           <span className="text-[7px] font-black text-white/40 uppercase tracking-tighter leading-none mb-0.5">SLOT</span>
           <span className="text-sm font-black italic text-white leading-none">{expectedRole}</span>
           {p && !isNaturalPos && !isRedBlocked && (
             <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center text-[8px] animate-bounce shadow-lg">⚠️</div>
           )}
        </div>

        <div className={`absolute inset-0 ${loc === 'START' ? 'pl-10' : ''} p-4 flex items-center gap-4`}>
          <div className="flex-1 min-w-0 flex items-center justify-between">
            <div className="flex flex-col">
              {p ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-white uppercase italic tracking-tighter group-hover:text-blue-300 transition-colors truncate">
                      {p.lastName}
                    </span>
                    {loc === 'START' && !isNaturalPos && (
                      <span className="text-[7px] bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded border border-amber-500/30 font-black">NIEOPTYMALNY</span>
                    )}
                  </div>
                  <span className={`text-[9px] font-bold uppercase tracking-widest ${PlayerPresentationService.getPositionColorClass(p.position)}`}>
                    {p.position} • POZ. NATURALNA
                  </span>
                </>
              ) : (
                <span className={`text-[10px] font-black uppercase italic ${isRedBlocked ? 'text-red-900' : 'text-amber-500 animate-pulse'}`}>
                  {isRedBlocked ? "SYSTEM_ZABLOKOWANY_BRAK" : "PUSTE_GNIAZDO_CZEKA"}
                </span>
              )}
            </div>

            {p && (
              <div className="flex items-center gap-6">
                <div className="flex flex-col items-end">
                   <div className="flex gap-0.5 mb-1.5">
                     {[...Array(5)].map((_, i) => (
                       <div 
                         key={i} 
                         className={`w-2 h-3 rounded-sm border border-black/20 ${f > (i * 20) ? PlayerPresentationService.getConditionColorClass(f) : 'bg-black/40'} transition-all duration-700`}
                       />
                     ))}
                   </div>
                   <span className="text-[7px] font-black text-slate-500 tracking-widest">ENERGIA_JEDNOSTKI</span>
                </div>

                <div className="relative">
                   <div className="absolute inset-0 blur-lg opacity-20 bg-blue-400 group-hover:opacity-40 transition-opacity" />
                   <div className="relative w-11 h-11 bg-black/60 rounded-xl border border-white/10 flex flex-col items-center justify-center shadow-inner">
                      <span className="text-xs font-black italic text-white leading-none">{p.overallRating}</span>
                      <span className="text-[6px] font-black text-blue-500 uppercase mt-0.5 tracking-tighter">OVR</span>
                   </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 overflow-hidden animate-fade-in">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-sm z-[-2]" />
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-30 scale-105 transition-transform duration-[20s] linear animate-pulse-slow" 
        style={{ backgroundImage: "url('https://i.ibb.co/yn1KNYFr/zmiana3.png')" }} 
      />

      <div className="max-w-[1450px] w-full h-[94vh] bg-slate-900/30 backdrop-blur-3xl rounded-[60px] border border-white/15 shadow-[0_50px_100px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden relative">
        
        <header className="px-12 py-8 border-b border-white/5 flex justify-between items-center bg-white/5 relative z-10">
           <div className="flex items-center gap-10">
              <div className="w-20 h-20 rounded-2xl flex flex-col overflow-hidden border-2 border-white/20 shadow-2xl transform rotate-6">
                <div style={{ backgroundColor: club?.colorsHex[0] }} className="flex-1" />
                <div style={{ backgroundColor: club?.colorsHex[1] || club?.colorsHex[0] }} className="flex-1" />
              </div>
              <div>
                 <h1 className="text-5xl font-black italic text-white uppercase tracking-tighter leading-none">
                   Centrum <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-white text-blue-400">Taktyczne</span>
                 </h1>
                 <div className="flex items-center gap-8 mt-4">
                    <div className="flex items-center gap-4">
                       <span className="text-[9px] font-black text-blue-500 uppercase tracking-[0.4em]">WYKORZYSTANE ZMIANY</span>
                       <div className="flex gap-2">
                          {[1,2,3,4,5].map(i => (
                             <div key={i} className={`w-4 h-4 rounded-md border transition-all duration-500 ${i <= currentSubsCount ? 'bg-blue-500 border-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.6)]' : 'bg-black/40 border-white/10'}`} />
                          ))}
                       </div>
                    </div>
                    <div className="h-6 w-px bg-white/10" />
                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest italic">{minute}' MINUTA MECZU</p>
                 </div>
              </div>
           </div>
           
           <button 
             onClick={() => onClose(currentLineup, currentSubsCount, currentSubsHistory)}
             className="relative group px-16 py-6 bg-white text-slate-950 font-black italic uppercase tracking-tighter text-xl rounded-[30px] transition-all hover:scale-105 active:scale-95 shadow-[0_20px_50px_rgba(255,255,255,0.1)] border-b-4 border-slate-300"
           >
             <span className="relative z-10">ZATWIERDŹ ZMIANY ⚡</span>
           </button>
        </header>

        <div className="flex-1 overflow-hidden flex p-10 gap-10 relative z-10">
           
           <aside className="w-80 flex flex-col gap-6 shrink-0">
              <div className="bg-black/40 border border-white/10 rounded-[45px] p-8 flex flex-col gap-8 backdrop-blur-3xl shadow-2xl relative overflow-hidden">
                 <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.5em] px-1">SYSTEM GRY</h3>
                 
                 <div className="space-y-4">
                    <div className="relative group">
                       <select 
                          value={currentLineup.tacticId}
                          onChange={(e) => setCurrentLineup({...currentLineup, tacticId: e.target.value})}
                          className="w-full bg-slate-950/80 border border-white/10 text-white rounded-2xl p-5 text-xs font-black italic uppercase outline-none focus:border-blue-500 transition-all cursor-pointer shadow-2xl appearance-none"
                       >
                          {TacticRepository.getAll().map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                       </select>
                       <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-blue-500 font-black">↓</div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mt-4">
                       <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
                          <span className="block text-[8px] font-black text-slate-600 uppercase mb-1">FORMACJA</span>
                          <span className="text-xl font-black text-white italic">{tactic.id}</span>
                       </div>
                       <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
                          <span className="block text-[8px] font-black text-slate-600 uppercase mb-1">SYNERGIA</span>
                          <span className="text-xl font-black text-emerald-400 italic">94%</span>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-[45px] p-8 flex flex-col justify-center items-center text-center gap-6 group hover:bg-white/[0.04] transition-all">
                 <div className="w-20 h-20 rounded-[28px] bg-white/5 border border-white/10 flex items-center justify-center text-5xl group-hover:scale-110 transition-transform duration-500 shadow-2xl">📋</div>
                 <div>
                   <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest italic mb-3">Dyrektywa Taktyczna</h4>
                   <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                     Analizuj zgodność jednostek z gniazdami. Zawodnicy poza naturalną pozycją otrzymują kary do atrybutów.
                   </p>
                 </div>
              </div>
           </aside>

           <section className="flex-1 flex flex-col gap-6 min-w-0">
              <div className="flex items-center justify-between px-10">
                 <h2 className="text-2xl font-black italic text-white uppercase tracking-tighter">Skład Wyjściowy</h2>
                 <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Aktywne Linki: {currentOnPitchCount}/11</span>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar pl-10 pr-4 pb-12">
                 <div className="grid grid-cols-1 gap-1">
                    {currentLineup.startingXI.map((pid, idx) => (
                      <div key={idx} className="animate-blur-in" style={{ animationDelay: `${idx * 0.04}s` }}>
                        {renderTacticalCard(pid, tactic.slots[idx].role, idx, 'START')}
                      </div>
                    ))}
                 </div>
              </div>
           </section>

           <section className="w-96 flex flex-col gap-6 shrink-0">
              <div className="flex items-center justify-between px-4">
                 <h2 className="text-2xl font-black italic text-slate-400 uppercase tracking-tighter">Rezerwowi</h2>
                 <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Gotowi do wejścia</span>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-12">
                 <div className="grid grid-cols-1 gap-1">
                    {sortedBenchIds.map((pid, idx) => (
                      <div key={pid} className="animate-blur-in" style={{ animationDelay: `${idx * 0.04}s` }}>
                        {renderTacticalCard(pid, 'SUB', undefined, 'BENCH')}
                      </div>
                    ))}
                 </div>
              </div>
           </section>
        </div>

        <footer className="h-14 bg-black/60 border-t border-white/5 flex items-center px-12 overflow-hidden shrink-0">
           <div className="bg-blue-600 px-4 py-1 rounded-full mr-8 shrink-0 shadow-lg shadow-blue-900/40">
              <span className="text-[10px] font-black text-white uppercase tracking-widest italic">STRUMIEŃ DANYCH LIVE</span>
           </div>
           <div className="flex-1 whitespace-nowrap overflow-hidden opacity-30">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.6em] animate-ticker">
                 MATCH_ENGINE_V4.8 • CZUJNIKI_KONDYCJI_AKTYWNE • WERYFIKACJA_GNIAZD_ZAKOŃCZONA • SYNCHRONIZACJA_99.9%
              </p>
           </div>
        </footer>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
        
        @keyframes ticker {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-ticker { animation: ticker 30s linear infinite; }
        
        @keyframes blur-in { 
          from { opacity: 0; filter: blur(8px); transform: translateX(20px); } 
          to { opacity: 1; filter: blur(0); transform: translateX(0); } 
        }
        .animate-blur-in { animation: blur-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

        @keyframes pulse-slow {
          0%, 100% { transform: scale(1.05); }
          50% { transform: scale(1.08); }
        }
        .animate-pulse-slow { animation: pulse-slow 10s infinite ease-in-out; }
      `}</style>
    </div>
  );
};