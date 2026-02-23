
import React, { useState, useMemo, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { Button } from '../ui/Button';
import { ViewState, Club } from '../../types';

export const TeamSelection: React.FC = () => {
  const { clubs, selectUserTeam, navigateTo } = useGame();
  
  const [selectedLeagueTier, setSelectedLeagueTier] = useState<number>(1);
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);

  // Filter clubs: Active only, and belongs to selected tier. 
  const filteredClubs = useMemo(() => {
    return clubs.filter(c => 
      c.isDefaultActive && 
      ((selectedLeagueTier === 1 && c.leagueId === 'L_PL_1') ||
       (selectedLeagueTier === 2 && c.leagueId === 'L_PL_2') ||
       (selectedLeagueTier === 3 && c.leagueId === 'L_PL_3'))
    );
  }, [clubs, selectedLeagueTier]);

  // Set default selection when tier changes
  useEffect(() => {
    if (filteredClubs.length > 0 && (!selectedClubId || !filteredClubs.find(c => c.id === selectedClubId))) {
      setSelectedClubId(filteredClubs[0].id);
    }
  }, [selectedLeagueTier, filteredClubs, selectedClubId]);

  const selectedClub = useMemo(() => 
    clubs.find(c => c.id === selectedClubId), 
    [clubs, selectedClubId]
  );

  const handleRandomize = () => {
    if (filteredClubs.length > 0) {
      const random = filteredClubs[Math.floor(Math.random() * filteredClubs.length)];
      setSelectedClubId(random.id);
    }
  };

  const handleConfirm = () => {
    if (selectedClubId) {
      selectUserTeam(selectedClubId);
    }
  };

 return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-950 overflow-hidden relative">
      
      {/* BACKGROUND */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 bg-[url('https://i.ibb.co/SwVxryY1/retro-mecz.png')] bg-cover bg-center opacity-20 mix-blend-luminosity animate-pulse-slow"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/20 to-slate-950" />
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 blur-[150px] animate-pulse" />
      </div>

      {/* Header - Fixed Height */}

 
      <div className="bg-slate-900/20 border-b border-white/5 p-6 backdrop-blur-xl shrink-0 z-20">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-black italic uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-500">
              Wybór Drużyny
            </h1>
            <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mt-1">
              ROZPOCZNIJ NOWĄ KARIERĘ • SEZON 2025/26
            </p>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3].map(tier => (
                <button
                  key={tier}
                  onClick={() => setSelectedLeagueTier(tier)}
                  className={`px-6 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all border
                    ${selectedLeagueTier === tier 
                      ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' 
                      : 'bg-slate-900/50 border-white/5 text-slate-500 hover:text-slate-300'
                    }
                  `}
                >
                  {tier}. LIGA
                </button>
              ))}
          </div>
        </div>
      </div>

      {/* Main Layout: Visual Identity Stream */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT: Identity Stream Sidebar */}
        <div className="w-80 md:w-96 bg-black/20 border-r border-white/5 flex flex-col z-10 backdrop-blur-sm">
           <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
              {filteredClubs.map(club => {
                const isSelected = selectedClubId === club.id;
                return (
                  <button
                    key={club.id}
                    onClick={() => setSelectedClubId(club.id)}
                    className={`group relative w-full h-16 rounded-xl overflow-hidden transition-all duration-300 border
                      ${isSelected 
                        ? 'bg-slate-900 border-white/20 shadow-2xl scale-[1.02]' 
                        : 'bg-slate-900/40 border-white/5 hover:border-white/10 hover:bg-slate-900/60'
                      }
                    `}
                  >
                    {/* Background Identity Code */}
                    <div className="absolute right-[-5px] top-[-5px] text-4xl font-black italic text-white/[0.03] select-none group-hover:text-white/[0.06] transition-colors">
                      {club.shortName}
                    </div>

                    {/* Left Color Indicator */}
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 overflow-hidden">
                       <div style={{ backgroundColor: club.colorsHex[0] }} className="h-full w-full" />
                    </div>

                    {/* Active/Hover Color Flash */}
                    <div 
                      className={`absolute inset-0 transition-opacity pointer-events-none ${isSelected ? 'opacity-10' : 'opacity-0 group-hover:opacity-5'}`}
                      style={{ background: `linear-gradient(90deg, ${club.colorsHex[0]}, transparent)` }}
                    />
                    
                    <div className="relative h-full flex items-center px-5 gap-3">
                       <div className="flex flex-col w-1 h-6 rounded-full overflow-hidden border border-white/10 shrink-0">
                          <div style={{ backgroundColor: club.colorsHex[0] }} className="flex-1" />
                          <div style={{ backgroundColor: club.colorsHex[1] || club.colorsHex[0] }} className="flex-1" />
                       </div>
                       <div className="flex-1 text-left min-w-0">
                          <div className={`text-xs font-black uppercase italic truncate tracking-tight transition-colors ${isSelected ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                            {club.name}
                          </div>
                          <div className="text-[8px] font-bold text-slate-600 uppercase tracking-widest mt-0.5">
                             STADION: {club.stadiumName}
                          </div>
                       </div>
                       {isSelected && (
                         <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,1)]" />
                       )}
                    </div>
                  </button>
                );
              })}
           </div>

           {/* Sidebar Footer */}
           <div className="p-4 border-t border-white/5 flex gap-2 bg-slate-900/50 backdrop-blur-xl">
             <Button variant="ghost" onClick={() => navigateTo(ViewState.START_MENU)} size="sm" className="flex-1 text-[9px] uppercase font-black tracking-[0.2em] border border-white/5 hover:bg-white/5">
               ANULUJ
             </Button>
             <Button variant="secondary" onClick={handleRandomize} size="sm" className="flex-1 text-[9px] uppercase font-black tracking-[0.2em] bg-white/5 border border-white/10 hover:bg-white/10">
               LOSUJ 🎲
             </Button>
           </div>
        </div>

        {/* RIGHT: Modern Showcase Area */}
        <div className="flex-1 relative flex flex-col items-center justify-center p-12 overflow-hidden bg-slate-950">
           {/* Background Dynamic Decoration */}
           {selectedClub && (
             <div className="absolute inset-0 z-0">
               <div 
                 className="absolute inset-0 opacity-20 transition-all duration-1000"
                 style={{ 
                   background: `radial-gradient(circle at 70% 30%, ${selectedClub.colorsHex[0]} 0%, transparent 45%),
                               radial-gradient(circle at 20% 80%, ${selectedClub.colorsHex[1] || '#3b82f6'} 0%, transparent 45%)`
                 }}
               />
               <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[120px]" />
               
               {/* Cyber Grid lines */}
               <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
             </div>
           )}

           {selectedClub ? (
             <div className="relative z-10 w-full max-w-5xl animate-slide-up flex flex-col md:flex-row gap-16 items-center">
                {/* Big Visual Identity Card */}
                <div className="relative group shrink-0">
                   <div className="absolute inset-[-20px] bg-white/5 rounded-[60px] blur-2xl opacity-0 group-hover:opacity-50 transition-opacity duration-700" />
                   
                   <div className="w-64 h-64 md:w-80 md:h-80 rounded-[50px] shadow-[0_30px_60px_rgba(0,0,0,0.5)] relative overflow-hidden border-4 border-white/10 transform -rotate-1 transition-transform duration-700 group-hover:rotate-0">
                      <div className="absolute inset-0 flex flex-col">
                        <div style={{ backgroundColor: selectedClub.colorsHex[0] }} className="flex-1" />
                        <div style={{ backgroundColor: selectedClub.colorsHex[1] || selectedClub.colorsHex[0] }} className="flex-1" />
                        <div style={{ backgroundColor: selectedClub.colorsHex[2] || selectedClub.colorsHex[1] || selectedClub.colorsHex[0] }} className="flex-1" />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/20 to-transparent" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-8xl md:text-[11rem] font-black text-white italic tracking-tighter drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)] select-none opacity-90">
                          {selectedClub.shortName}
                        </span>
                      </div>
                   </div>

                   {/* Stats Badges floating around */}
                   <div className="absolute -right-6 -bottom-6 bg-slate-900 border border-white/10 p-4 rounded-3xl shadow-2xl backdrop-blur-xl animate-float">
                      <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Pojemność</span>
                      <span className="text-xl font-black text-emerald-400 font-mono">{selectedClub.stadiumCapacity.toLocaleString()}</span>
                   </div>
                </div>

                {/* Details Showcase */}
                <div className="flex-1 text-center md:text-left">
                   <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/60 text-[9px] font-black tracking-[0.3em] uppercase mb-6 backdrop-blur-md">
                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                      {selectedLeagueTier}. Liga Polska
                   </div>
                   
                   <h2 className="text-6xl md:text-8xl font-black text-white italic uppercase tracking-tighter leading-[0.85] mb-8 drop-shadow-2xl">
                      {selectedClub.name}
                   </h2>
                   
                   <p className="text-sm text-slate-400 font-medium leading-relaxed max-w-md mb-10 opacity-80">
                      Zarządzaj jednym z najbardziej rozpoznawalnych klubów w regionie. Twoim zadaniem jest przywrócenie blasku tej legendarnej marce i dominacja na krajowych boiskach.
                   </p>

                   <div className="flex flex-col sm:flex-row gap-4">
                      <button 
                        onClick={handleConfirm}
                        style={{ 
                          background: `linear-gradient(135deg, ${selectedClub.colorsHex[0]} 0%, ${selectedClub.colorsHex[1] || '#3b82f6'} 100%)`,
                          boxShadow: `0 20px 50px -15px ${selectedClub.colorsHex[0]}99`
                        }}
                        className="px-12 py-5 rounded-2xl text-white font-black italic text-xl uppercase tracking-tighter transition-all hover:scale-105 active:scale-95 shadow-2xl border border-white/20 flex items-center justify-center gap-3"
                      >
                        PODPISZ KONTRAKT ✏️
                      </button>
                   </div>
                </div>
             </div>
           ) : (
             <div className="text-slate-800 font-black italic uppercase tracking-[0.5em] text-4xl animate-pulse">
                Wybierz Klub
             </div>
           )}
        </div>
      </div>

    <style>{`
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1.1); opacity: 0.12; }
          50% { transform: scale(1.18); opacity: 0.18; }
        }
        .animate-pulse-slow { animation: pulse-slow 20s infinite ease-in-out; }

        @keyframes slide-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-slide-up { animation: slide-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-float { animation: float 4s ease-in-out infinite; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }
      `}</style>
    </div>
  );
};
