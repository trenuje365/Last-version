import React, { useEffect, useState, useMemo } from 'react';
import { useGame } from '../../context/GameContext';
import { ViewState, Player, Club, Lineup, Tactic } from '../../types';
import { TacticRepository } from '../../resources/tactics_db';
import { LineupService } from '../../services/LineupService';
import { PlayerPresentationService } from '../../services/PlayerPresentationService';
import { TeamResultsModal } from '../modals/TeamResultsModal';

export const ClubDetails: React.FC = () => {
   const { viewedClubId, clubs, getOrGenerateSquad, lineups, updateLineup, navigateTo, viewPlayerDetails, coaches, viewCoachDetails, currentDate } = useGame();
  
  const [startingXI, setStartingXI] = useState<Player[]>([]);
  const [bench, setBench] = useState<Player[]>([]);
  const [reserves, setReserves] = useState<Player[]>([]);
  const [currentTactic, setCurrentTactic] = useState<Tactic | null>(null);
  const [currentLineup, setCurrentLineup] = useState<Lineup | null>(null);
  const [isResultsModalOpen, setIsResultsModalOpen] = useState(false);

  const club = useMemo(() => clubs.find(c => c.id === viewedClubId), [clubs, viewedClubId]);

  const clubCoach = useMemo(() => {
    if (!club || !club.coachId) return null;
    return coaches[club.coachId];
  }, [club, coaches]);

  useEffect(() => {
    if (viewedClubId) {
      const allPlayers = getOrGenerateSquad(viewedClubId);
      let lineup = lineups[viewedClubId];
      if (!lineup) {
        lineup = LineupService.autoPickLineup(viewedClubId, allPlayers);
        updateLineup(viewedClubId, lineup);
      }
      setCurrentLineup(lineup);
      setCurrentTactic(TacticRepository.getById(lineup.tacticId));

      const sXI = lineup.startingXI.map(id => allPlayers.find(p => p.id === id)).filter(Boolean) as Player[];
      const sBench = PlayerPresentationService.sortPlayers(lineup.bench.map(id => allPlayers.find(p => p.id === id)).filter(Boolean) as Player[]);
      const sRes = PlayerPresentationService.sortPlayers(lineup.reserves.map(id => allPlayers.find(p => p.id === id)).filter(Boolean) as Player[]);

      setStartingXI(sXI);
      setBench(sBench);
      setReserves(sRes);
    }
  }, [viewedClubId, getOrGenerateSquad, lineups, updateLineup]);

  if (!club) return <div className="h-screen flex items-center justify-center text-slate-500 font-black uppercase tracking-widest">Klub nie znaleziony...</div>;

  const handleBack = () => {
    if (club.leagueId === 'L_PL_4') {
      navigateTo(ViewState.HIDDEN_LEAGUE);
    } else {
      navigateTo(ViewState.LEAGUE_TABLES);
    }
  };

  const renderPlayerRow = (player: Player, label: string) => {
    const healthInfo = PlayerPresentationService.getHealthDisplay(player);
    const condColor = PlayerPresentationService.getConditionColorClass(player.condition);

    const isNegotiationBlocked = player.isNegotiationPermanentBlocked;
    const isCooldownActive = player.negotiationLockoutUntil && new Date(currentDate) < new Date(player.negotiationLockoutUntil);
    const hasAttemptsUsed = (player.negotiationStep || 0) > 0 && !isNegotiationBlocked && !isCooldownActive;
    
    return (
      <tr 
        key={player.id} 
        onClick={() => viewPlayerDetails(player.id)}
        className="group relative h-14 border-b border-white/5 transition-all cursor-pointer hover:bg-white/[0.03]"
      >
        <td className="pl-6 w-12 relative z-10">
           <span className="text-[9px] font-black text-slate-600 uppercase tracking-tighter">{label}</span>
        </td>
        <td className={`w-14 font-mono font-black text-[10px] relative z-10 ${PlayerPresentationService.getPositionColorClass(player.position)}`}>
          {player.position}
        </td>
      <td className="relative z-10">
           <div className="flex items-center gap-2">
              <span className="text-sm font-black text-white uppercase italic group-hover:text-blue-400 transition-colors">
                {player.lastName} <span className="opacity-40 font-medium text-[10px]">{player.firstName}</span>
              </span>

{player.isOnTransferList && (
        <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-[7px] font-black rounded-sm border border-amber-500/30 shadow-sm animate-pulse">
          LISTA
        </span>
      )}


              {isNegotiationBlocked && (
                <span className="px-1.5 py-0.5 bg-red-500/20 text-red-500 text-[6px] font-black rounded-sm border border-red-500/30">⛔</span>
              )}
              {isCooldownActive && (
                <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-500 text-[6px] font-black rounded-sm border border-amber-500/30">⏳</span>
              )}
              {hasAttemptsUsed && (
                <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-[6px] font-black rounded-sm border border-blue-500/30">📝</span>
              )}
           </div>
        </td>
         <td className="w-10 text-center relative z-10 font-mono text-[13px] text-slate-500">{player.stats.matchesPlayed}</td>
        <td className="w-10 text-center relative z-10 font-mono text-[13px] text-emerald-500 font-bold">{player.stats.goals}</td>
        <td className="w-10 text-center relative z-10 font-mono text-[13px] text-blue-400">{player.stats.assists}</td>
        <td className="w-10 text-center relative z-10 font-mono text-[13px] text-amber-500">{player.stats.yellowCards}</td>
        <td className="w-16 text-center relative z-10">
           <span className="text-xs font-black text-slate-400 font-mono italic">{player.overallRating}</span>
        </td>
        <td className="w-28 text-center relative z-10">
           <span className={`text-[9px] font-black uppercase tracking-widest ${healthInfo.colorClass}`}>{healthInfo.text}</span>
        </td>
         <td className="w-16 text-center relative z-10">
           <span className="text-sm font-black text-blue-400 font-mono italic">
              {player.stats.ratingHistory && player.stats.ratingHistory.length > 0 
                ? (player.stats.ratingHistory.reduce((a, b) => a + b, 0) / player.stats.ratingHistory.length).toFixed(1)
                : '-'}
           </span>
        </td>
        <td className="pr-6 w-24 relative z-10">
           <div className="w-full h-1 bg-black/40 rounded-full overflow-hidden">
              <div className={`h-full ${condColor} transition-all duration-1000`} style={{ width: `${player.condition}%` }} />
           </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="h-[calc(100vh-3rem)] max-w-[1600px] mx-auto flex flex-col gap-4 animate-fade-in overflow-hidden relative">
      
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
        <div 
          className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[150px] opacity-20 transition-all duration-1000"
          style={{ background: club.colorsHex[0] }}
        />
        <div className="absolute left-10 bottom-[-10%] text-[25rem] font-black italic text-white/[0.02] select-none pointer-events-none">
           {club.shortName}
        </div>
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
      </div>

      <div className="flex items-center justify-between px-8 py-5 bg-white/5 rounded-[32px] border border-white/10 backdrop-blur-3xl shrink-0 shadow-2xl">
         <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl flex flex-col overflow-hidden border border-white/20 shadow-2xl transform -rotate-3">
               <div className="flex-1" style={{ backgroundColor: club.colorsHex[0] }} />
               <div className="flex-1" style={{ backgroundColor: club.colorsHex[1] || club.colorsHex[0] }} />
            </div>
            <div>
               <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white leading-none">
                 {club.name}
               </h1>
               <div className="flex items-center gap-4 mt-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500">
                    STATUS: {club.isDefaultActive ? 'AKTYWNY' : 'INAKTYWNY'}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                  <div className="flex items-center gap-2">
                     <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">REPUTACJA:</span>
                     <div className="flex gap-0.5">
                        {Array.from({length: 10}).map((_, i) => (
                           <div key={i} className={`w-1.5 h-3 rounded-sm ${i < club.reputation ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-white/5'}`} />
                        ))}
                     </div>
                  </div>
               </div>
            </div>
         </div>

       <div className="flex gap-4">
            <button 
              onClick={() => setIsResultsModalOpen(true)}
              className="px-8 py-4 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-[10px] font-black uppercase tracking-widest text-blue-400 hover:bg-blue-600/30 transition-all active:scale-95 shadow-lg"
            >
              📊 Wyniki
            </button>
            <button 
              onClick={handleBack}
              className="px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all active:scale-95 shadow-lg"
            >
              &larr; Powrót
            </button>
         </div>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        <div className="w-80 flex flex-col gap-5 shrink-0">
           <div 
             onClick={() => clubCoach && viewCoachDetails(clubCoach.id)}
             className={`p-6 bg-slate-900/40 rounded-[35px] border border-white/5 backdrop-blur-2xl relative overflow-hidden group shadow-2xl transition-all ${clubCoach ? 'cursor-pointer hover:border-blue-500/30 hover:bg-slate-800/60' : ''}`}
           >
              <div className="absolute right-[-15px] bottom-[-15px] text-7xl opacity-[0.03] rotate-12 pointer-events-none group-hover:opacity-[0.06] transition-opacity">👨‍💼</div>
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4">Sztab Szkoleniowy</h3>
              
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-blue-600/20 flex items-center justify-center text-2xl border border-blue-500/20 shadow-inner">
                    👨‍💼
                 </div>
                 <div className="min-w-0">
                    <span className="block text-[8px] font-black text-blue-500 uppercase tracking-widest mb-0.5">TRENER GŁÓWNY</span>
                    <span className="text-sm font-black text-white uppercase italic truncate block">
                       {clubCoach ? `${clubCoach.firstName} ${clubCoach.lastName}` : 'WAKAT'}
                    </span>
                 </div>
              </div>
              {clubCoach && (
                <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
                   <span className="text-[8px] font-black text-slate-600 uppercase">Exp: {clubCoach.attributes.experience}</span>
                   <span className="text-[9px] font-black text-blue-400 uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">Profil →</span>
                </div>
              )}
           </div>

           <div className="p-8 bg-slate-900/40 rounded-[35px] border border-white/5 backdrop-blur-2xl relative overflow-hidden group shadow-2xl">
              <div className="absolute right-[-20px] bottom-[-20px] text-8xl opacity-[0.03] rotate-12 pointer-events-none">🏟️</div>
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-6">Infrastruktura</h3>
              
              <div className="space-y-6">
                 <div>
                    <span className="block text-[8px] font-black text-blue-500 uppercase tracking-widest mb-1">STADION GŁÓWNY</span>
                    <span className="text-lg font-black text-white italic uppercase tracking-tight leading-tight block">{club.stadiumName}</span>
                 </div>
                 <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                    <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">POJEMNOŚĆ</span>
                    <span className="text-3xl font-black font-mono text-emerald-400 tabular-nums">{club.stadiumCapacity.toLocaleString()}</span>
                 </div>
              </div>
           </div>

           {currentTactic && currentLineup && (
             <div className="flex-1 bg-slate-900/40 rounded-[35px] border border-white/5 backdrop-blur-2xl flex flex-col p-6 overflow-hidden shadow-2xl relative">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4">Taktyka</h3>
                <div className="flex-1 relative rounded-2xl border border-white/10 overflow-hidden shadow-inner bg-[#064e3b]">
                   <div className="absolute inset-0 opacity-20" style={{ 
                      backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 10%, #059669 10%, #059669 20%)',
                      backgroundSize: '100% 100%'
                   }} />
                   
                   {currentTactic.slots.map((slot, idx) => {
                      const pId = currentLineup.startingXI[idx];
                      if (!pId) return null;
                      return (
                        <div 
                           key={idx}
                           className="absolute w-4 h-4 rounded-full border border-white/50 shadow-lg"
                           style={{ 
                             left: `${slot.x * 100}%`, 
                             top: `${slot.y * 100}%`,
                             transform: 'translate(-50%, -50%)',
                             backgroundColor: club.colorsHex[0]
                           }}
                        />
                      );
                   })}
                </div>
                <div className="mt-4 text-center">
                   <span className="text-xs font-black text-emerald-500 italic uppercase tracking-tighter">{currentTactic.name}</span>
                </div>
             </div>
           )}
        </div>

        <div className="flex-1 flex flex-col gap-4 min-w-0">
           <div className="flex-1 bg-slate-900/30 rounded-[40px] border border-white/5 backdrop-blur-2xl shadow-2xl flex flex-col overflow-hidden">
              <div className="px-8 py-5 border-b border-white/5 flex justify-between items-center bg-white/5">
                 <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white">Kadra Zespołu</h3>
                 <div className="flex gap-4">
                    <span className="text-[9px] font-bold text-slate-500 uppercase">11 WYJŚCIOWA</span>
                    <span className="text-[9px] font-bold text-slate-500 uppercase">9 REZERWOWYCH</span>
                 </div>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                 <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 z-20 bg-slate-900/90 backdrop-blur-md">
                       <tr className="text-[8px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">
                          <th className="py-3 pl-6">TYP</th>
                          <th className="py-3">POZ</th>
                          <th className="py-3">NAZWISKO</th>
                           <th className="py-3 text-center w-10 text-[10px] opacity-60">ME</th>
                          <th className="py-3 text-center w-10 text-[10px] opacity-60">⚽</th>
                          <th className="py-3 text-center w-10 text-[10px] opacity-60">AS</th>
                          <th className="py-3 text-center w-10 text-[10px] opacity-60">🟨</th>
                          <th className="py-3 text-center w-10 text-[10px] opacity-60">ŚOC</th>
                          <th className="py-3 text-center">OVR</th>
                           <th className="py-3 text-center">NOTA</th> 
                          <th className="py-3 text-center">ZDROWIE</th>
                         
                          <th className="py-3 pr-6">FORMA</th>
                       </tr>
                    </thead>
                    <tbody>
                       {startingXI.map(p => renderPlayerRow(p, 'START'))}
                       <tr className="bg-black/20"><td colSpan={6} className="py-2 px-6 text-[8px] font-black text-blue-500 uppercase tracking-[0.3em]">Ławka rezerwowych</td></tr>
                       {bench.map(p => renderPlayerRow(p, 'SUB'))}
                       <tr className="bg-black/20"><td colSpan={6} className="py-2 px-6 text-[8px] font-black text-slate-600 uppercase tracking-[0.3em]">Pozostali zawodnicy</td></tr>
                       {reserves.map(p => renderPlayerRow(p, 'RES'))}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>
      </div>

      <TeamResultsModal 
        isOpen={isResultsModalOpen} 
        onClose={() => setIsResultsModalOpen(false)} 
        club={club} 
      />

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }
        @keyframes fade-in { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
};