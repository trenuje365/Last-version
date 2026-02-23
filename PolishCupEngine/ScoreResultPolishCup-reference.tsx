
import React, { useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { ViewState, CompetitionType, MatchStatus } from '../types';

export const ScoreResultsPolishCup: React.FC = () => {
 const { fixtures, clubs, currentDate, navigateTo, jumpToNextEvent, userTeamId, jumpToDate, setActiveMatchState: setMatchState } = useGame();

  const cupResults = useMemo(() => {
    const dateStr = currentDate.toDateString();
    return fixtures.filter(f => 
      f.date.toDateString() === dateStr && 
    (f.leagueId === CompetitionType.POLISH_CUP || f.leagueId === CompetitionType.SUPER_CUP) &&
      f.status === MatchStatus.FINISHED &&
      f.homeTeamId !== userTeamId &&
      f.awayTeamId !== userTeamId
    );
  }, [fixtures, currentDate, userTeamId]);

  const getClub = (id: string) => clubs.find(c => c.id === id);

// Znajdź funkcję: const handleNext = () => {
// Zastąp ją tym kodem:

// W pliku PolishCupEngine/ScoreResultsPolishCup.tsx, zmień funkcję handleNext (ok. linii 23)
const handleNext = () => {
  setMatchState(null); 
  // Dynamiczny skok do następnego wydarzenia (zamiast sztywnego 19 lipca)
  // zapobiega utknięciu w martwych dniach w sezonach 2+
  jumpToNextEvent();
  navigateTo(ViewState.DASHBOARD);
};

  return (
    <div className="h-screen w-full bg-slate-950 flex flex-col p-6 animate-fade-in overflow-hidden relative selection:bg-rose-500">
      
      {/* Background Decor */}
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full blur-[200px] opacity-10 bg-rose-600" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      <header className="bg-slate-900/60 border border-white/10 p-6 rounded-[35px] backdrop-blur-3xl shrink-0 flex items-center justify-between shadow-2xl mb-6">
         <div className="flex items-center gap-6">
            <div className="w-12 h-12 rounded-2xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-2xl shadow-inner">
               📡
            </div>
            <div>
               <h1 className="text-2xl font-black italic uppercase tracking-tighter text-white leading-none">
                  Wyniki Rundy Pucharowej
               </h1>
               <p className="text-rose-500 text-[9px] font-black uppercase tracking-[0.5em] mt-1.5">MULTILIGA PUCHARU POLSKI</p>
            </div>
         </div>

         <button 
           onClick={handleNext}
           className="px-10 py-3.5 bg-white text-slate-900 font-black italic uppercase tracking-widest rounded-2xl shadow-2xl transition-all hover:scale-105 active:scale-95 text-sm"
         >
           KONTYNUUJ →
         </button>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-900/20 rounded-[40px] border border-white/5 backdrop-blur-md">
         <div className="flex flex-col max-w-4xl mx-auto py-6">
            {cupResults.length > 0 ? (
              cupResults.map((result, idx) => {
                const home = getClub(result.homeTeamId);
                const away = getClub(result.awayTeamId);
                if (!home || !away) return null;

                const hasPens = result.homePenaltyScore !== undefined && result.awayPenaltyScore !== undefined;
                
                // Logika wyłonienia zwycięzcy (złote wyróżnienie)
                const isHomeWinner = hasPens 
                  ? result.homePenaltyScore! > result.awayPenaltyScore!
                  : result.homeScore! > result.awayScore!;
                
                const isAwayWinner = !isHomeWinner;

                return (
                  <div 
                    key={result.id} 
                    className="flex items-center justify-between py-2.5 px-8 border-b border-white/[0.03] hover:bg-white/[0.03] transition-colors group"
                  >
                     {/* Home Team */}
                     <div className={`flex-1 text-right truncate text-[11px] uppercase italic tracking-tight transition-colors ${isHomeWinner ? 'text-amber-400 font-black' : 'text-slate-400 group-hover:text-slate-200'}`}>
                        {home.name}
                     </div>

                     {/* Result Center */}
                     <div className="w-40 flex flex-col items-center shrink-0">
                        <div className="flex items-center gap-4">
                           <div className="w-1.5 h-4 rounded-full overflow-hidden border border-white/10">
                              <div style={{ backgroundColor: home.colorsHex[0] }} className="h-full w-full" />
                           </div>
                           <span className="text-sm font-black font-mono text-white tracking-tighter tabular-nums">
                              {result.homeScore} : {result.awayScore}
                           </span>
                           <div className="w-1.5 h-4 rounded-full overflow-hidden border border-white/10">
                              <div style={{ backgroundColor: away.colorsHex[0] }} className="h-full w-full" />
                           </div>
                        </div>
                        {hasPens && (
                           <span className="text-[8px] font-black text-rose-500 uppercase mt-0.5 tracking-widest">
                              rzuty karne {result.homePenaltyScore}:{result.awayPenaltyScore}
                           </span>
                        )}
                     </div>

                     {/* Away Team */}
                     <div className={`flex-1 text-left truncate text-[11px] uppercase italic tracking-tight transition-colors ${isAwayWinner ? 'text-amber-400 font-black' : 'text-slate-400 group-hover:text-slate-200'}`}>
                        {away.name}
                     </div>
                  </div>
                );
              })
            ) : (
              <div className="h-64 flex flex-col items-center justify-center opacity-20">
                 <span className="text-6xl mb-4">🏜️</span>
                 <p className="text-sm font-black uppercase tracking-[0.2em] italic text-center">Brak innych meczów w tej rundzie</p>
              </div>
            )}
         </div>
      </div>

      <div className="bg-black/20 p-4 flex justify-center shrink-0">
         <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.4em]">Wszystkie wyniki zostały zatwierdzone przez komisję ligi</p>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.8s ease-out forwards; }
      `}</style>
    </div>
  );
};
