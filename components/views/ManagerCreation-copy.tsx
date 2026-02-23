import React, { useState, useMemo } from 'react';
import { useGame } from '../../context/GameContext';
import { ViewState, ManagerProfile } from '../../types';

const EUROPEAN_COUNTRIES = [
  { name: 'Albania', flag: '🇦🇱' }, { name: 'Andora', flag: '🇦🇩' }, { name: 'Austria', flag: '🇦🇹' },
  { name: 'Belgia', flag: '🇧🇪' }, { name: 'Białoruś', flag: '🇧🇾' }, { name: 'Bośnia i Hercegowina', flag: '🇧🇦' },
  { name: 'Bułgaria', flag: '🇧🇬' }, { name: 'Chorwacja', flag: '🇭🇷' }, { name: 'Cypr', flag: '🇨🇾' },
  { name: 'Czarnogóra', flag: '🇲🇪' }, { name: 'Czechy', flag: '🇨🇿' }, { name: 'Dania', flag: '🇩🇰' },
  { name: 'Estonia', flag: '🇪🇪' }, { name: 'Finlandia', flag: '🇫🇮' }, { name: 'Francja', flag: '🇫🇷' },
  { name: 'Grecja', flag: '🇬🇷' }, { name: 'Hiszpania', flag: '🇪🇸' }, { name: 'Holandia', flag: '🇳🇱' },
  { name: 'Irlandia', flag: '🇮🇪' }, { name: 'Islandia', flag: '🇮🇸' }, { name: 'Kosowo', flag: '🇽🇰' },
  { name: 'Liechtenstein', flag: '🇱🇮' }, { name: 'Litwa', flag: '🇱🇹' }, { name: 'Luksemburg', flag: '🇱🇺' },
  { name: 'Łotwa', flag: '🇱🇻' }, { name: 'Macedonia Północna', flag: '🇲🇰' }, { name: 'Malta', flag: '🇲🇹' },
  { name: 'Mołdawia', flag: '🇲🇩' }, { name: 'Monako', flag: '🇲🇨' }, { name: 'Niemcy', flag: '🇩🇪' },
  { name: 'Norwegia', flag: '🇳🇴' }, { name: 'Polska', flag: '🇵🇱' }, { name: 'Portugalia', flag: '🇵🇹' },
  { name: 'Rosja', flag: '🇷🇺' }, { name: 'Rumunia', flag: '🇷🇴' }, { name: 'San Marino', flag: '🇸🇲' },
  { name: 'Serbia', flag: '🇷🇸' }, { name: 'Słowacja', flag: '🇸🇰' }, { name: 'Słowenia', flag: '🇸🇮' },
  { name: 'Szwajcaria', flag: '🇨🇭' }, { name: 'Szwecja', flag: '🇸🇪' }, { name: 'Ukraina', flag: '🇺🇦' },
  { name: 'Watykan', flag: '🇻🇦' }, { name: 'Węgry', flag: '🇭🇺' }, { name: 'Wielka Brytania', flag: '🇬🇧' },
  { name: 'Włochy', flag: '🇮🇹' }
].sort((a, b) => a.name.localeCompare(b.name));

export const ManagerCreation: React.FC = () => {
  const { saveManagerProfile, navigateTo } = useGame();
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState(40);
  const [selectedCountry, setSelectedCountry] = useState(EUROPEAN_COUNTRIES.find(c => c.name === 'Polska')!);
  const [searchCountry, setSearchCountry] = useState('');

  const filteredCountries = useMemo(() => {
    return EUROPEAN_COUNTRIES.filter(c => 
      c.name.toLowerCase().includes(searchCountry.toLowerCase())
    );
  }, [searchCountry]);

  const isValid = firstName.trim().length > 1 && lastName.trim().length > 1;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid) {
      saveManagerProfile({
        firstName,
        lastName,
        age,
        nationality: selectedCountry.name,
        nationalityFlag: selectedCountry.flag
      });
    }
  };

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-950 overflow-hidden relative">
      
      {/* BACKGROUND */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 bg-[url('https://i.ibb.co/QSDrqzw/Theme.jpg')] bg-cover bg-center opacity-20 mix-blend-luminosity animate-pulse-slow"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/90 to-slate-950" />
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 blur-[150px] animate-pulse" />
      </div>

      <div className="relative z-10 w-full max-w-6xl px-6 animate-fade-in flex flex-col items-center">
        
        {/* Badge */}
        <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/5 border border-white/10 mb-6 backdrop-blur-xl">
           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,1)]" />
           <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">Profil Nowego Menadżera</span>
        </div>

        <h1 className="text-6xl md:text-8xl font-black italic text-white uppercase tracking-tighter leading-none mb-10 text-center">
          STWÓRZ<br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-400 to-slate-600">NOWY PROFIL</span>
        </h1>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full bg-white/5 border border-white/10 rounded-[40px] p-8 md:p-12 backdrop-blur-3xl shadow-2xl overflow-hidden relative">
          
          <div className="absolute top-0 right-0 p-8 opacity-[0.02] text-9xl font-black italic pointer-events-none select-none">
             COACH
          </div>

          {/* Left: Text Data */}
          <div className="space-y-6 relative z-10">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Imię</label>
              <input 
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="IMIĘ..."
                className="bg-black/40 border border-white/10 rounded-2xl p-5 text-xl font-black text-white italic placeholder:text-slate-800 outline-none focus:border-emerald-500/50 transition-all uppercase tracking-tighter"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Nazwisko</label>
              <input 
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="NAZWISKO..."
                className="bg-black/40 border border-white/10 rounded-2xl p-5 text-xl font-black text-white italic placeholder:text-slate-800 outline-none focus:border-emerald-500/50 transition-all uppercase tracking-tighter"
              />
            </div>

            <div className="flex flex-col gap-4 bg-black/20 p-6 rounded-3xl border border-white/5">
              <div className="flex justify-between items-center">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Wiek</label>
                 <span className="text-2xl font-black text-emerald-400 font-mono italic">{age} <span className="text-[10px] text-slate-600 ml-1">LAT</span></span>
              </div>
              <input 
                type="range"
                min="25"
                max="75"
                value={age}
                onChange={(e) => setAge(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between text-[8px] font-bold text-slate-700 uppercase tracking-widest">
                <span>Junior (25)</span>
                <span>Weteran (75)</span>
              </div>
            </div>
          </div>

          {/* Right: Nationality */}
          <div className="flex flex-col h-[400px] relative z-10">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Narodowość</label>
            
            <div className="bg-black/40 border border-white/10 rounded-3xl overflow-hidden flex flex-col flex-1">
               <div className="p-4 border-b border-white/5 bg-white/5">
                 <input 
                   type="text"
                   value={searchCountry}
                   onChange={(e) => setSearchCountry(e.target.value)}
                   placeholder="SZUKAJ KRAJU W EUROPIE..."
                   className="w-full bg-transparent text-xs font-black text-white placeholder:text-slate-600 outline-none uppercase tracking-widest"
                 />
               </div>

               <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                  {filteredCountries.map(country => (
                    <button
                      key={country.name}
                      type="button"
                      onClick={() => setSelectedCountry(country)}
                      className={`w-full flex items-center justify-between p-3.5 rounded-xl transition-all border
                        ${selectedCountry.name === country.name 
                          ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg' 
                          : 'hover:bg-white/5 border-transparent text-slate-500'}
                      `}
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-2xl drop-shadow-md">{country.flag}</span>
                        <span className="text-sm font-black uppercase italic tracking-tighter">{country.name}</span>
                      </div>
                    </button>
                  ))}
               </div>
            </div>

            <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-4 animate-pulse">
               <span className="text-3xl">{selectedCountry.flag}</span>
               <div>
                  <span className="block text-[8px] font-black text-emerald-400 uppercase tracking-widest leading-none mb-1">Narodowość</span>
                  <span className="text-xl font-black text-white italic uppercase tracking-tighter">{selectedCountry.name}</span>
               </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="lg:col-span-2 flex flex-col md:flex-row gap-4 mt-4">
             <button 
                type="button"
                onClick={() => navigateTo(ViewState.START_MENU)}
                className="flex-1 py-5 rounded-2xl bg-white/5 border border-white/10 text-white font-black italic uppercase tracking-widest text-xs hover:bg-white/10 transition-all active:scale-95"
             >
                Anuluj
             </button>
             <button 
                type="submit"
                disabled={!isValid}
                className={`flex-[3] py-5 rounded-2xl font-black italic uppercase tracking-widest text-xl transition-all active:scale-95 shadow-2xl
                  ${isValid 
                    ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-600/30 cursor-pointer border-b-4 border-emerald-800' 
                    : 'bg-slate-900 text-slate-700 cursor-not-allowed border-b-4 border-slate-950'}
                `}
             >
                {isValid ? 'ZATWIERDŹ I WYBIERZ KLUB →' : 'WPROWADŹ DANE TRENERA'}
             </button>
          </div>
        </form>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }
        @keyframes fade-in { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 1s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes pulse-slow { 0%, 100% { transform: scale(1.1); } 50% { transform: scale(1.15); } }
        .animate-pulse-slow { animation: pulse-slow 20s infinite ease-in-out; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; height: 20px; width: 20px; border-radius: 50%; background: #10b981; cursor: pointer; border: 3px solid white; box-shadow: 0 0 15px rgba(16,185,129,0.5); }
      `}</style>
    </div>
  );
};