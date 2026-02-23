
import React, { useState, useMemo, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { ViewState, Player } from '../../types';

export const EditorView: React.FC = () => {
  const { clubs, players, getOrGenerateSquad, updatePlayer, navigateTo } = useGame();
// -> tutaj wstaw kod
  const [selectedTier, setSelectedTier] = useState<string>('1');
  const [selectedClubId, setSelectedClubId] = useState<string>('');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState<number>(20);
  // -> tutaj wstaw kod
  const [position, setPosition] = useState('');

  // Logika filtrowania klubów na podstawie wybranej ligi
 const filteredClubs = useMemo(() => {
    return clubs.filter(c => c.leagueId === `L_PL_${selectedTier}`);
  }, [clubs, selectedTier]);

  // Pobieranie listy piłkarzy dla wybranego klubu
  const clubPlayers = useMemo(() => {
    if (!selectedClubId) return [];
    // Upewniamy się, że skład istnieje w pamięci
    return getOrGenerateSquad(selectedClubId);
  }, [selectedClubId, getOrGenerateSquad, players]);

  // Załadowanie danych wybranego piłkarza do pól edycji
  useEffect(() => {
    if (selectedPlayerId && selectedClubId) {
      const p = clubPlayers.find(player => player.id === selectedPlayerId);
      if (p) {
        setFirstName(p.firstName);
        setLastName(p.lastName);
        setAge(p.age);
        // -> tutaj wstaw kod
        setPosition(p.position);
      }
    } else {
      setFirstName('');
      setLastName('');
      setAge(20);
    }
  }, [selectedPlayerId, clubPlayers, selectedClubId]);

  const handleSave = () => {
    if (!selectedClubId || !selectedPlayerId) return;
    
    updatePlayer(selectedClubId, selectedPlayerId, {
      firstName,
      lastName,
      age
    });

    alert(`Zapisano zmiany dla: ${firstName} ${lastName}`);
  };

  return (
    <div className="h-screen w-full bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* BACKGROUND DECOR */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-600/10 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-2xl bg-slate-900/60 border border-white/10 rounded-[40px] backdrop-blur-3xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* HEADER */}
        <div className="p-8 border-b border-white/5 bg-white/5 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black italic text-white uppercase tracking-tighter">Edytor Piłkarzy</h1>
            <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mt-1">NARZĘDZIE ADMINISTRACYJNE</p>
          </div>
          <button 
            onClick={() => navigateTo(ViewState.DASHBOARD)}
            className="px-6 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase text-slate-400 hover:text-white transition-all"
          >
            Wróć
          </button>
        </div>

        {/* CONTENT */}
        <div className="p-10 space-y-8">
          
          {/* SELECTORS ROW */}
          {/* -> tutaj wstaw kod (Filtr Ligi) */}
          <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Wybierz Poziom Ligi</label>
              <div className="flex gap-2">
                {['1', '2', '3', '4'].map(tier => (
                  <button
                    key={tier}
                    onClick={() => { setSelectedTier(tier); setSelectedClubId(''); setSelectedPlayerId(''); }}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all border ${selectedTier === tier ? 'bg-blue-600 border-blue-400 text-white' : 'bg-black/40 border-white/10 text-slate-500'}`}
                  >
                    LIGA {tier}
                  </button>
                ))}
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Wybierz Klub</label>
           <select 
                value={selectedClubId}
                onChange={(e) => { setSelectedClubId(e.target.value); setSelectedPlayerId(''); }}
                className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:border-blue-500/50 transition-all cursor-pointer"
              >
                <option value="">-- WYBIERZ KLUB --</option>
                {/* ZAMIENIONO clubs na filteredClubs */}
                {filteredClubs.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Wybierz Piłkarza</label>
              <select 
                value={selectedPlayerId}
                disabled={!selectedClubId}
               onChange={(e) => setSelectedPlayerId(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:border-blue-500/50 transition-all cursor-pointer disabled:opacity-20 custom-scrollbar"
              >
              <option value="">-- WYBIERZ ZAWODNIKA --</option>
                {clubPlayers.map(p => (
                  // -> tutaj wstaw kod (Dodano [p.position])
                  <option key={p.id} value={p.id}>[{p.position}] {p.lastName} {p.firstName} (OVR: {p.overallRating})</option>
                ))}
              </select>
            </div>
          </div>

          {/* EDIT FORM */}
          <div className={`space-y-6 transition-all duration-500 ${selectedPlayerId ? 'opacity-100 translate-y-0' : 'opacity-20 pointer-events-none translate-y-4'}`}>
            <div className="h-px bg-white/5 w-full" />
            
            <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl flex items-center justify-between">
               <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Pozycja na boisku</span>
               <span className="text-xl font-black text-white italic">{position}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Imię</label>
                <input 
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:border-emerald-500/50 transition-all uppercase italic"
                  placeholder="WPISZ IMIĘ..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Nazwisko</label>
                <input 
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:border-emerald-500/50 transition-all uppercase italic"
                  placeholder="WPISZ NAZWISKO..."
                />
              </div>
            </div>

            <div className="space-y-2">
               <div className="flex justify-between items-center px-1">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Wiek</label>
                 <span className="text-xl font-black text-emerald-400 font-mono italic">{age}</span>
               </div>
               <input 
                 type="range"
                 min="15"
                 max="45"
                 value={age}
                 onChange={(e) => setAge(parseInt(e.target.value))}
                 className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
               />
            </div>

            <button 
              onClick={handleSave}
              className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white font-black italic uppercase tracking-widest rounded-2xl shadow-2xl shadow-emerald-900/20 transition-all active:scale-95 mt-4 border-b-4 border-emerald-800"
            >
              ZAPISZ ZMIANY W BAZIE 💾
            </button>
          </div>
        </div>

      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; height: 18px; width: 18px; border-radius: 50%; background: #10b981; cursor: pointer; border: 2px solid white; }
      `}</style>
    </div>
  );
};
