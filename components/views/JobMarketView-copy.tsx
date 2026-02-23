
import React, { useMemo, useState } from 'react';
import { useGame } from '../../context/GameContext';
import { ViewState, PlayerPosition, Player } from '../../types';

export const JobMarketView: React.FC = () => {
  const { coaches, clubs, navigateTo, viewCoachDetails, viewClubDetails, players, viewPlayerDetails } = useGame();

  // Filtry Piłkarzy - Nowa struktura zakresowa
  const [searchTermPlayers, setSearchTermPlayers] = useState('');
  const [posFilter, setPosFilter] = useState('ALL');
  
  // Stan dla Listy Transferowej
  const [searchTermTransfer, setSearchTermTransfer] = useState('');

  const initialFilters = {
    age: { min: 16, max: 45 },
    pace: { min: 1, max: 99 },
    strength: { min: 1, max: 99 },
    stamina: { min: 1, max: 99 },
    defending: { min: 1, max: 99 },
    passing: { min: 1, max: 99 },
    attacking: { min: 1, max: 99 },
    finishing: { min: 1, max: 99 },
    technique: { min: 1, max: 99 },
    dribbling: { min: 1, max: 99 },
    vision: { min: 1, max: 99 },
    positioning: { min: 1, max: 99 },
    goalkeeping: { min: 1, max: 99 }
  };

  const [filters, setFilters] = useState(initialFilters);

  // SKASOWANO KOD: const [searchTermCoaches, setSearchTermCoaches] = useState('');

  const handleFilterChange = (key: keyof typeof filters, field: 'min' | 'max', value: number) => {
    let val = isNaN(value) ? (field === 'min' ? 1 : 99) : value;
    const limitMin = key === 'age' ? 16 : 1;
    const limitMax = key === 'age' ? 45 : 99;
    
    val = Math.max(limitMin, Math.min(limitMax, val));

    setFilters(prev => {
      const newState = { ...prev, [key]: { ...prev[key], [field]: val } };
      // Gwarancja: min <= max
      if (field === 'min' && newState[key].min > newState[key].max) newState[key].max = newState[key].min;
      if (field === 'max' && newState[key].max < newState[key].min) newState[key].min = newState[key].max;
      return newState;
    });
  };

  const filteredCoaches = useMemo(() => {
    let list = Object.values(coaches).filter(c => !c.currentClubId);
    // SKASOWANO KOD: Filtrowanie trenerów po nazwisku
    return list.sort((a,b) => b.attributes.experience - a.attributes.experience);
  }, [coaches]);

  const clubsWithoutCoaches = useMemo(() => 
    clubs.filter(c => !c.coachId).sort((a,b) => b.reputation - a.reputation)
  , [clubs]);

  // TUTAJ WSTAW TEN KOD: Logika pustej listy transferowej
  const transferListedPlayers = useMemo(() => {
    const all = Object.values(players).flat();
    return all
      .filter(p => p.isOnTransferList)
      .sort((a,b) => b.overallRating - a.overallRating);
  }, [players]);

  const freeAgentPlayers = useMemo(() => {
    let list = [...(players['FREE_AGENTS'] || [])];
    if (searchTermPlayers) {
      list = list.filter(p => p.lastName.toLowerCase().includes(searchTermPlayers.toLowerCase()) || p.firstName.toLowerCase().includes(searchTermPlayers.toLowerCase()));
    }
    if (posFilter !== 'ALL') {
      list = list.filter(p => p.position === posFilter);
    }
    list = list.filter(p => 
      p.age >= filters.age.min && p.age <= filters.age.max &&
      p.attributes.pace >= filters.pace.min && p.attributes.pace <= filters.pace.max &&
      p.attributes.strength >= filters.strength.min && p.attributes.strength <= filters.strength.max &&
      p.attributes.stamina >= filters.stamina.min && p.attributes.stamina <= filters.stamina.max &&
      p.attributes.defending >= filters.defending.min && p.attributes.defending <= filters.defending.max &&
      p.attributes.passing >= filters.passing.min && p.attributes.passing <= filters.passing.max &&
      p.attributes.attacking >= filters.attacking.min && p.attributes.attacking <= filters.attacking.max &&
      p.attributes.finishing >= filters.finishing.min && p.attributes.finishing <= filters.finishing.max &&
      p.attributes.technique >= filters.technique.min && p.attributes.technique <= filters.technique.max &&
      p.attributes.dribbling >= filters.dribbling.min && p.attributes.dribbling <= filters.dribbling.max &&
      p.attributes.vision >= filters.vision.min && p.attributes.vision <= filters.vision.max &&
      p.attributes.positioning >= filters.positioning.min && p.attributes.positioning <= filters.positioning.max &&
      p.attributes.goalkeeping >= filters.goalkeeping.min && p.attributes.goalkeeping <= filters.goalkeeping.max
    );
    
    return list.sort((a, b) => b.overallRating - a.overallRating);
  }, [players, searchTermPlayers, posFilter, filters]);

  const getPosTheme = (pos: PlayerPosition) => {
    switch (pos) {
      case PlayerPosition.GK: return { color: 'text-amber-400', bg: 'bg-amber-500', glow: 'shadow-amber-500/40' };
      case PlayerPosition.DEF: return { color: 'text-blue-400', bg: 'bg-blue-500', glow: 'shadow-blue-500/40' };
      case PlayerPosition.MID: return { color: 'text-emerald-400', bg: 'bg-emerald-500', glow: 'shadow-emerald-500/40' };
      case PlayerPosition.FWD: return { color: 'text-rose-400', bg: 'bg-rose-500', glow: 'shadow-rose-500/40' };
      default: return { color: 'text-white', bg: 'bg-slate-500', glow: 'shadow-white/20' };
    }
  };

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden relative font-sans text-white bg-black">
      
      {/* BACKGROUND - NO BLUR */}
      <div className="fixed inset-0 bg-cover bg-center z-0" style={{ backgroundImage: "url('https://i.ibb.co/JwgrBtvC/biuro2-1.png')" }} />
      <div className="fixed inset-0 bg-slate-950/60 z-1" />

      {/* INTERFACE CONTENT */}
      <div className="relative z-10 h-full flex flex-col p-4 overflow-hidden">
        
        {/* HEADER */}
        <header className="flex items-center justify-between mb-4 shrink-0 bg-white/[0.03] border border-white/10 rounded-[30px] p-5 shadow-2xl">
          <div className="flex items-center gap-6">
            <div className="text-3xl animate-pulse">🛰️</div>
            <div>
              <h1 className="text-3xl font-black italic uppercase tracking-tighter leading-none">CENTRUM <span className="text-emerald-400">TRANSFEROWE</span></h1>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.5em] mt-1">Baza danych PZPN • Rynek Zawodników</p>
            </div>
          </div>
          <button 
            onClick={() => navigateTo(ViewState.DASHBOARD)} 
            className="px-8 py-3 bg-white/[0.05] border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white/[0.15] transition-all shadow-xl active:scale-95 group"
          >
            <span className="group-hover:text-emerald-400 transition-colors">&larr; Pulpit</span>
          </button>
        </header>

        <div className="flex-1 flex gap-4 min-h-0">
          
          {/* COLUMN 1: ATTRIBUTE FILTERS */}
          <aside className="w-80 bg-white/[0.02] border border-white/10 rounded-[35px] p-6 flex flex-col shadow-2xl shrink-0">
            <div className="flex items-center gap-3 mb-4 px-1">
              <span className="text-emerald-400 text-sm">⚙️</span>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-300">Wyszukaj zawodnika</h3>
            </div>

            <div className="space-y-6 flex-1 overflow-y-auto custom-scrollbar pr-4">
              <div className="bg-black/40 p-3 rounded-xl border border-white/5 shadow-inner">
                <input 
                  type="text" 
                  placeholder="SZUKAJ PIŁKARZA..." 
                  value={searchTermPlayers}
                  onChange={(e) => setSearchTermPlayers(e.target.value)}
                  className="bg-transparent border-none outline-none text-[10px] font-black text-white w-full placeholder:text-slate-700 uppercase tracking-widest"
                />
              </div>

              {/* Age Range Filter */}
              <div className="space-y-1">
                <div className="flex justify-between items-center px-1 relative h-6">
                  <input type="number" value={filters.age.min} onChange={(e) => handleFilterChange('age', 'min', parseInt(e.target.value))} className="bg-transparent border-none w-10 text-left text-sm font-black text-emerald-400 outline-none tabular-nums" />
                  <span className="absolute left-1/2 -translate-x-1/2 text-[9px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Zakres Wieku</span>
                  <input type="number" value={filters.age.max} onChange={(e) => handleFilterChange('age', 'max', parseInt(e.target.value))} className="bg-transparent border-none w-10 text-right text-sm font-black text-rose-400 outline-none tabular-nums" />
                </div>
                <div className="relative h-8 flex items-center px-1">
                   <div className="absolute w-full h-1 bg-white/5 rounded-full" />
                   <div 
                      className="absolute h-1 bg-emerald-500/30 rounded-full" 
                      style={{ 
                        left: `${((filters.age.min - 16) / (45 - 16)) * 100}%`, 
                        right: `${100 - ((filters.age.max - 16) / (45 - 16)) * 100}%` 
                      }} 
                   />
                   <input type="range" min="16" max="45" value={filters.age.min} onChange={(e) => handleFilterChange('age', 'min', parseInt(e.target.value))} className="dual-range-input accent-emerald-500" style={{ zIndex: filters.age.min > 30 ? 5 : 4 }} />
                   <input type="range" min="16" max="45" value={filters.age.max} onChange={(e) => handleFilterChange('age', 'max', parseInt(e.target.value))} className="dual-range-input accent-rose-500" />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 pt-4 border-t border-white/5">
                {[
                  { k: 'pace', l: 'Szybkość' }, { k: 'strength', l: 'Siła' }, { k: 'stamina', l: 'Kondycja' },
                  { k: 'defending', l: 'Obrona' }, { k: 'passing', l: 'Podania' }, { k: 'attacking', l: 'Atak' },
                  { k: 'finishing', l: 'Wykończenie' }, { k: 'technique', l: 'Technika' }, { k: 'dribbling', l: 'Drybling' },
                  { k: 'vision', l: 'Wizja' }, { k: 'positioning', l: 'Ustawianie' }, { k: 'goalkeeping', l: 'Bramkarstwo' }
                ].map(attr => (
                  <div key={attr.k} className="space-y-1 group">
                    <div className="flex justify-between items-center px-1 relative h-6">
                      <input type="number" value={filters[attr.k as keyof typeof filters].min} onChange={(e) => handleFilterChange(attr.k as any, 'min', parseInt(e.target.value))} className="bg-transparent border-none w-10 text-left text-sm font-black text-blue-400 outline-none tabular-nums" />
                      <span className="absolute left-1/2 -translate-x-1/2 text-[9px] font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-300 transition-colors whitespace-nowrap">{attr.l}</span>
                      <input type="number" value={filters[attr.k as keyof typeof filters].max} onChange={(e) => handleFilterChange(attr.k as any, 'max', parseInt(e.target.value))} className="bg-transparent border-none w-10 text-right text-sm font-black text-indigo-400 outline-none tabular-nums" />
                    </div>
                    <div className="relative h-8 flex items-center px-1">
                      <div className="absolute w-full h-1 bg-white/5 rounded-full" />
                      <div 
                        className="absolute h-1 bg-blue-500/20 rounded-full" 
                        style={{ 
                          left: `${((filters[attr.k as keyof typeof filters].min - 1) / (99 - 1)) * 100}%`, 
                          right: `${100 - ((filters[attr.k as keyof typeof filters].max - 1) / (99 - 1)) * 100}%` 
                        }} 
                      />
                      <input type="range" min="1" max="99" value={filters[attr.k as keyof typeof filters].min} onChange={(e) => handleFilterChange(attr.k as any, 'min', parseInt(e.target.value))} className="dual-range-input accent-blue-500" style={{ zIndex: filters[attr.k as keyof typeof filters].min > 50 ? 5 : 4 }} />
                      <input type="range" min="1" max="99" value={filters[attr.k as keyof typeof filters].max} onChange={(e) => handleFilterChange(attr.k as any, 'max', parseInt(e.target.value))} className="dual-range-input accent-indigo-500" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <button 
              onClick={() => setFilters(initialFilters)}
              className="mt-4 w-full py-3 bg-white/[0.05] border border-white/10 rounded-xl text-[8px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-white hover:bg-white/[0.08] transition-all"
            >
              Resetuj filtry
            </button>
          </aside>

          {/* COLUMN 2: FREE AGENTS */}
          <section className="flex-1 bg-white/[0.02] border border-white/10 rounded-[40px] flex flex-col overflow-hidden shadow-2xl relative">
            <div className="p-5 border-b border-white/10 flex flex-col gap-3 bg-white/[0.02]">
              <h2 className="text-[10px] font-black text-white uppercase tracking-widest text-center italic">Wolni Agenci</h2>
              <div className="text-[10px] flex bg-black/30 p-2 rounded-xl border border-white/5">
                {['ALL', 'GK', 'DEF', 'MID', 'FWD'].map(pos => (
                  <button 
                    key={pos} onClick={() => setPosFilter(pos)}
                    className={`px-2 py-1 rounded-lg text-[11px] font-black transition-all ${posFilter === pos ? 'bg-white text-black' : 'text-slate-600 hover:text-slate-300'}`}
                  >
                    {pos}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
              {freeAgentPlayers.map((player, index) => {
                const theme = getPosTheme(player.position);
                return (
                  <div 
                    key={player.id} 
                    onClick={() => viewPlayerDetails(player.id)}
                    className={`group relative p-4 bg-black/20 rounded-xl border border-white/5 hover:border-emerald-500/30 transition-all cursor-pointer overflow-hidden shadow-lg`}
                  >
                    <div className="relative z-10 flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <span className="text-[8px] font-mono text-slate-600 w-5 shrink-0 group-hover:text-emerald-500 transition-colors">
                            {String(index + 1).padStart(2, '0')}.
                          </span>
                          <div className={`w-0.5 h-6 rounded-full ${theme.bg} ${theme.glow} shrink-0`} />
                          <div className="min-w-0">
                             <span className="block text-sm font-black text-white uppercase italic truncate max-w-[130px] group-hover:text-emerald-400 transition-colors leading-tight">
                               {player.lastName} {player.firstName}
                             </span>
                             <span className={`text-[12px] font-black uppercase tracking-tighter ${theme.color}`}>
                               {player.position} • {player.overallRating} OVR
                             </span>
                          </div>
                       </div>
                       <div className="text-right">
                          <span className="block text-xs font-black font-mono text-emerald-400 tabular-nums leading-none tracking-tighter">{player.age}L</span>
                       </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* COLUMN 3: TRANSFER LIST */}
          <section className="flex-[1.5] bg-white/[0.02] border border-white/10 rounded-[40px] flex flex-col overflow-hidden shadow-2xl relative">
            <div className="p-6 border-b border-white/10 flex flex-col gap-4 bg-white/[0.02]">
              <div className="flex justify-between items-center">
                 <h2 className="text-xs font-black text-white uppercase tracking-[0.3em] italic">Lista Transferowa</h2>
                 <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest">Rynek klubowy</span>
              </div>
              <div className="bg-black/40 p-3 rounded-xl border border-white/5 shadow-inner">
                <input 
                  type="text" 
                  placeholder="FILTRUJ LISTĘ..." 
                  value={searchTermTransfer}
                  onChange={(e) => setSearchTermTransfer(e.target.value)}
                  className="bg-transparent border-none outline-none text-[10px] font-black text-white w-full placeholder:text-slate-800 uppercase tracking-widest"
                />
              </div>
            </div>

            {/* TUTAJ WSTAW TEN KOD - DYNAMICZNA LISTA TRANSFEROWA */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
              {transferListedPlayers.length > 0 ? (
                transferListedPlayers
                  .filter(p => 
                    p.lastName.toLowerCase().includes(searchTermTransfer.toLowerCase()) || 
                    p.firstName.toLowerCase().includes(searchTermTransfer.toLowerCase())
                  )
                  .map((player, index) => {
                    const theme = getPosTheme(player.position);
                    const club = clubs.find(c => c.id === player.clubId);
                    return (
                      <div 
                        key={player.id} 
                        onClick={() => viewPlayerDetails(player.id)}
                        className="group relative p-4 bg-black/40 rounded-xl border border-white/5 hover:border-amber-500/30 transition-all cursor-pointer overflow-hidden shadow-lg"
                      >
                        {/* Identity Glow */}
                        <div 
                          className="absolute inset-0 opacity-0 group-hover:opacity-5 pointer-events-none transition-opacity"
                          style={{ background: `linear-gradient(90deg, #f59e0b, transparent)` }}
                        />

                        <div className="relative z-10 flex items-center justify-between">
                           <div className="flex items-center gap-4">
                              <div className={`w-0.5 h-8 rounded-full ${theme.bg} ${theme.glow} shrink-0`} />
                              <div className="min-w-0">
                                 <span className="block text-sm font-black text-white uppercase italic truncate max-w-[130px] group-hover:text-amber-400 transition-colors leading-tight">
                                   {player.lastName} {player.firstName}
                                 </span>
                                 <div className="flex items-center gap-2">
                                   <span className={`text-[10px] font-black uppercase tracking-tighter ${theme.color}`}>
                                     {player.position} • {player.overallRating} OVR
                                   </span>
                                   <span className="text-[12px] text-slate-500 uppercase tracking-widest">• {club?.name || 'Bez klubu'}</span>
                                 </div>
                              </div>
                           </div>
                           <div className="flex flex-col items-end">
                              <span className="text-[10px] font-black text-amber-500 italic tabular-nums animate-pulse">LISTA</span>
                              <span className="text-[8px] font-black text-slate-600 uppercase">{player.age}L</span>
                           </div>
                        </div>
                      </div>
                    );
                  })
              ) : (
                <div className="h-full flex flex-col items-center justify-center opacity-10 py-10">
                   <span className="text-6xl mb-4">📑</span>
                   <p className="text-sm font-black uppercase tracking-[0.3em] italic text-center">Brak dostępnych ofert na liście transferowej</p>
                </div>
              )}
            </div>
            {/* KONIEC WSTAWKI */}
          </section>

          {/* COLUMN 4: FREE COACHES (USUNIĘTO WYSZUKIWARKĘ) */}
          <section className="flex-1 bg-white/[0.02] border border-white/10 rounded-[40px] flex flex-col overflow-hidden shadow-2xl relative">
            <div className="p-6 border-b border-white/10 flex flex-col gap-4 bg-white/[0.02]">
              <div className="flex justify-between items-center">
                 <h2 className="text-xl font-black text-white italic uppercase tracking-tight leading-none">Trenerzy</h2>
                 <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full">
                    <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest">{filteredCoaches.length} DOSTĘPNYCH</span>
                 </div>
              </div>
              {/* SKASOWANO KOD: Wyszukiwarka trenerów */}
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
              <div className="flex flex-col">
                {filteredCoaches.map((coach, index) => (
                  <button 
                    key={coach.id} 
                    onClick={() => viewCoachDetails(coach.id)} 
                    className="group w-full flex items-center justify-between py-3 px-6 border-b border-white/[0.03] hover:bg-white/[0.04] transition-all text-left"
                  >
                    <div className="flex items-center gap-6 min-w-0">
                       <span className="text-[10px] font-mono text-slate-600 shrink-0 group-hover:text-blue-500 transition-colors w-6">
                          {String(index + 1).padStart(2, '0')}.
                       </span>
                       <div className="flex flex-col">
                          <span className="text-sm font-black text-slate-200 uppercase italic truncate group-hover:text-blue-400 transition-colors">
                            {coach.firstName} {coach.lastName}
                          </span>
                          <span className="text-[7px] text-slate-600 font-black uppercase tracking-[0.3em]">
                             {coach.nationalityFlag} {coach.nationality}
                          </span>
                       </div>
                    </div>
                    
                    <div className="flex items-center gap-4 shrink-0">
                       <div className="text-right">
                          <span className="text-xs font-black font-mono text-blue-400 tabular-nums italic">EXP: {coach.attributes.experience}</span>
                       </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </section>

        </div>

        {/* SYSTEM STATUS FOOTER */}
        <footer className="relative z-10 mt-4 h-9 bg-white/[0.02] rounded-full border border-white/10 flex items-center justify-center px-10 shadow-2xl shrink-0">
           <div className="flex gap-12 text-[6.5px] font-black text-slate-600 uppercase tracking-[0.4em]">
              <span className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" /> System Transferowy aktywny</span>
              <span className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-emerald-500 shadow-[0_0_18px_rgba(16,185,129,0.4)]" /> Skauting Real-Time 24/7</span>
              <span className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" /> Autoryzacja PZPN v2.9</span>
           </div>
        </footer>

      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        
        .dual-range-input {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 0;
          position: absolute;
          background: none;
          pointer-events: none;
          outline: none;
        }
        
        .dual-range-input::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          pointer-events: auto;
          box-shadow: 0 0 10px rgba(0,0,0,0.5);
          border: 2px solid currentColor;
        }
        
        input::-webkit-outer-spin-button, input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type=number] {
          -moz-appearance: textfield;
        }
      `}</style>
    </div>
  );
};
