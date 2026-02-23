import React, { useMemo } from 'react';
import { useGame } from '../../context/GameContext';
import { ViewState, CompetitionType, SlotType, Club, Fixture } from '../../types';
import { Button } from '../ui/Button';

export const CalendarDebugView: React.FC = () => {
  const { seasonTemplate, navigateTo, clubs, userTeamId, currentDate, leagueSchedules, fixtures } = useGame();

  const userClub = useMemo(() => clubs.find(c => c.id === userTeamId), [clubs, userTeamId]);
  
  const userTier = useMemo(() => {
    if (!userClub) return 1;
    const parts = userClub.leagueId.split('_');
    return parseInt(parts[parts.length - 1]) || 1;
  }, [userClub]);

  const userSchedule = useMemo(() => leagueSchedules[userTier], [leagueSchedules, userTier]);

  const getClub = (id: string) => clubs.find(c => c.id === id);

  const slots = useMemo(() => {
    return seasonTemplate ? seasonTemplate.slots : [];
  }, [seasonTemplate]);

  const activeTodaySlotId = useMemo(() => {
    const today = new Date(currentDate).setHours(0,0,0,0);
    const activeSlots = slots.filter(s => {
      const start = new Date(s.start).setHours(0,0,0,0);
      const end = new Date(s.end).setHours(0,0,0,0);
      return today >= start && today <= end;
    });

    if (activeSlots.length === 0) return null;
    return activeSlots.sort((a, b) => b.priority - a.priority)[0].id;
  }, [slots, currentDate]);

  if (!seasonTemplate) return (
    <div className="h-screen flex items-center justify-center bg-slate-950">
       <p className="text-slate-500 font-black uppercase tracking-widest">Inicjalizacja systemu kalendarza...</p>
    </div>
  );

  const getCompTheme = (comp: CompetitionType, label: string) => {
    // --- PRE-SEASON PREPARATION (STAGE 1 PRO) ---
    if (label === "Przygotowanie do sezonu") {
      return { 
        color: 'text-amber-500', 
        bg: 'bg-amber-500/10', 
        border: 'border-amber-500/20', 
        icon: '🏃‍♂️' 
      };
    }
    if (label.includes('LOSOWANIE')) {
      return { color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20', icon: '🎲' };
    }
    
    switch (comp) {
      case CompetitionType.LEAGUE: 
        return { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: '⚽' };
      case CompetitionType.POLISH_CUP: 
        return { color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', icon: '🏆' };
      case CompetitionType.SUPER_CUP: 
        return { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: '✨' };
      case CompetitionType.EURO_CUP: 
        return { color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', icon: '🌍' };
      case CompetitionType.TRANSFER_WINDOW: 
        return { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: '📝' };
      case CompetitionType.BREAK: 
        return { color: 'text-slate-500', bg: 'bg-slate-500/5', border: 'border-slate-500/10', icon: '❄️' };
      case CompetitionType.OFF_SEASON: 
        return { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', icon: '🏖️' };
        case CompetitionType.BOARD:
        return { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: '🏛️' };
      default: 
        return { color: 'text-white', bg: 'bg-white/10', border: 'border-white/20', icon: '📅' };
    }
  };

 const getUserMatchForSlot = (slot: any) => {
    if (!userTeamId) return null;

    // ZABEZPIECZENIE: Nie pokazuj plakietki meczu w wierszu losowania
    if (slot.label.includes("LOSOWANIE")) return null;

    let foundFixture: Fixture | undefined;

    // A) MECZE LIGOWE
    if (slot.competition === CompetitionType.LEAGUE && userSchedule) {
      const roundMatch = slot.label.match(/Kolejka (\d+)/);
      if (roundMatch) {
        const roundNum = parseInt(roundMatch[1]);
        const matchday = userSchedule.matchdays[roundNum - 1];
        if (matchday) {
          foundFixture = matchday.fixtures.find(f => f.homeTeamId === userTeamId || f.awayTeamId === userTeamId);
        }
      }
    }

    // B) MECZE PUCHAROWE I INNE Z GLOBALNEJ LISTY
    if (!foundFixture) {
      const slotDateStr = slot.start.toDateString();
      foundFixture = fixtures.find(f => 
        f.date.toDateString() === slotDateStr && 
        (f.homeTeamId === userTeamId || f.awayTeamId === userTeamId) &&
        f.leagueId === slot.competition
      );
    }

    if (foundFixture) {
      const isHome = foundFixture.homeTeamId === userTeamId;
      const opponentId = isHome ? foundFixture.awayTeamId : foundFixture.homeTeamId;
      const opponent = clubs.find(c => c.id === opponentId);
      return { opponent, isHome, fixture: foundFixture };
    }
    
    return null;
  };

  return (
    <div className="h-[calc(100vh-3rem)] max-w-[1400px] mx-auto flex flex-col gap-4 animate-fade-in overflow-hidden relative">
      
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
        <div 
          className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[150px] opacity-20 transition-all duration-1000"
          style={{ background: userClub?.colorsHex[0] || '#3b82f6' }}
        />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      <div className="flex items-center justify-between px-8 py-5 bg-white/5 rounded-[32px] border border-white/10 backdrop-blur-3xl shrink-0 shadow-2xl">
         <div className="flex items-center gap-6">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl shadow-inner transform -rotate-3">
               📅
            </div>
            <div>
               <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white leading-none">
                 Planer Sezonowy
               </h1>
               <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500">
                    STATUS: OPERACYJNY
                  </span>
                  <span className="w-1 h-1 rounded-full bg-white/20" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
                    SEZON {seasonTemplate.seasonStartYear}/{String(seasonTemplate.seasonStartYear + 1).slice(2)}
                  </span>
               </div>
            </div>
         </div>

         <button 
           onClick={() => navigateTo(ViewState.DASHBOARD)}
           className="px-8 py-3 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all active:scale-95 shadow-lg"
         >
           &larr; Powrót do pulpitu
         </button>
      </div>

      <div className="flex-1 bg-slate-900/30 rounded-[40px] border border-white/5 backdrop-blur-2xl shadow-2xl overflow-hidden flex flex-col">
         <div className="overflow-y-auto custom-scrollbar flex-1 p-8">
            <div className="max-w-4xl mx-auto space-y-3">
               {slots.map((slot) => {
                 const theme = getCompTheme(slot.competition, slot.label);
                 const isTodayActive = activeTodaySlotId === slot.id;
                 const userMatch = getUserMatchForSlot(slot);
                 const isSuperCup = slot.competition === CompetitionType.SUPER_CUP;
                 const scFix = isSuperCup ? fixtures.find(f => f.leagueId === CompetitionType.SUPER_CUP) : null;
                 
                 return (
                   <div 
                     key={slot.id} 
                     className={`
                       group relative flex items-center gap-6 p-4 rounded-[24px] border transition-all duration-300
                       ${isTodayActive 
                         ? 'bg-white/10 border-white/30 shadow-[0_0_30px_rgba(255,255,255,0.1)] scale-[1.02] z-10' 
                         : 'bg-black/20 border-white/5 hover:border-white/10 hover:bg-black/40'}
                     `}
                   >
                     <div className="absolute right-6 top-1/2 -translate-y-1/2 text-5xl font-black italic text-white/[0.02] pointer-events-none select-none group-hover:text-white/[0.04] transition-colors">
                        {slot.competition.substring(0, 3)}
                     </div>

                     <div className="w-24 shrink-0 flex flex-col items-center justify-center border-r border-white/10 pr-6">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter mb-0.5">
                           {slot.start.toLocaleDateString('pl-PL', { month: 'short' }).toUpperCase()}
                        </span>
                        <span className={`text-2xl font-black font-mono tracking-tighter ${isTodayActive ? 'text-white' : 'text-slate-300'}`}>
                           {slot.start.getDate()}
                        </span>
                        <div className={`h-1 w-4 rounded-full mt-2 ${isTodayActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-800'}`} />
                     </div>

                     <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                           <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${theme.bg} ${theme.color}`}>
                              {slot.competition}
                           </span>
                           {slot.slotType === SlotType.MIDWEEK && (
                             <span className="text-[8px] font-bold text-slate-600 bg-black/40 px-1.5 py-0.5 rounded border border-white/5">MIDWEEK</span>
                           )}
                        </div>
                        
                        <div className="flex items-center gap-4">
                           <h3 className={`text-lg font-black italic uppercase tracking-tight truncate ${isTodayActive ? 'text-white' : 'text-slate-200 group-hover:text-white'}`}>
                              {theme.icon} {slot.label}
                           </h3>
                           
                           {(userMatch && !isSuperCup) && (
                              <div className="animate-slide-up flex items-center gap-3 bg-blue-600/10 border border-blue-500/20 px-3 py-1.5 rounded-xl shadow-lg">
                                 <span className={`px-2 py-0.5 rounded-md text-[8px] font-black ${userMatch.isHome ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                    {userMatch.isHome ? 'DOM' : 'WYJ'}
                                 </span>
                                 <div className="flex items-center gap-2">
                                    <div className="flex flex-col w-1 h-4 rounded-full overflow-hidden">
                                       <div className="flex-1" style={{ backgroundColor: userMatch.opponent?.colorsHex[0] }} />
                                       <div className="flex-1" style={{ backgroundColor: userMatch.opponent?.colorsHex[1] || userMatch.opponent?.colorsHex[0] }} />
                                    </div>
                                    
                                    <span className="text-[10px] font-black text-white italic uppercase tracking-tighter flex items-center gap-2">
                    vs {userMatch.opponent?.name}
                    {userMatch.fixture.status === 'FINISHED' && (
                       <span className="ml-1 px-1.5 py-0.5 bg-black/40 rounded border border-white/10 text-[9px] font-mono font-black text-emerald-400 shadow-inner">
                          {userMatch.fixture.homeScore}:{userMatch.fixture.awayScore}
                       </span>
                    )}
                 </span>

                                 </div>
                              </div>
                           )}

                           {scFix && (
                              <div className="animate-slide-up flex items-center gap-4 bg-amber-600/10 border border-amber-500/20 px-4 py-2 rounded-2xl shadow-xl">
                                 <div className="flex items-center gap-3">
                                    <span className="text-[11px] font-black text-white uppercase italic">{getClub(scFix.homeTeamId)?.name}</span>
                                    <div className="bg-black/60 px-3 py-1 rounded-lg border border-white/10 shadow-inner">
                                       <span className="text-xs font-black font-mono text-amber-400">
                                          {scFix.status === 'FINISHED' ? `${scFix.homeScore}:${scFix.awayScore}` : 'vs'}
                                       </span>
                                    </div>
                                    <span className="text-[11px] font-black text-white uppercase italic">{getClub(scFix.awayTeamId)?.name}</span>
                                 </div>
                              </div>
                           )}
                        </div>
                     </div>

                     <div className="text-right shrink-0">
                        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Zakres dat</div>
                        <div className="font-mono text-[10px] text-slate-400">
                           {slot.start.toLocaleDateString()} &mdash; {slot.end.toLocaleDateString()}
                        </div>
                        <div className="mt-2 flex justify-end gap-1">
                           {Array.from({ length: 5 }).map((_, i) => (
                             <div 
                               key={i} 
                               className={`w-1 h-3 rounded-full ${i < slot.priority / 20 ? theme.color.replace('text', 'bg') : 'bg-slate-800'}`} 
                             />
                           ))}
                        </div>
                     </div>

                     {isTodayActive && (
                       <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 rounded-l-full shadow-[4px_0_15px_rgba(16,185,129,0.5)]" />
                     )}
                   </div>
                 );
               })}
            </div>
         </div>
      </div>

      <div className="flex justify-center gap-6 py-2 px-8 bg-black/20 rounded-2xl border border-white/5 backdrop-blur-xl shrink-0">
         {[
           { label: 'Liga', color: 'bg-blue-400' },
           { label: 'Puchary', color: 'bg-rose-400' },
           { label: 'Losowania', color: 'bg-pink-400' },
           { label: 'Transfery', color: 'bg-emerald-400' },
           { label: 'Przerwy', color: 'bg-slate-500' }
         ].map(item => (
           <div key={item.label} className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${item.color}`} />
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{item.label}</span>
           </div>
         ))}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }
        @keyframes fade-in { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes slide-up { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        .animate-slide-up { animation: slide-up 0.4s ease-out forwards; }
      `}</style>
    </div>
  );
};