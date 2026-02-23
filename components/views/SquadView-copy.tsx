import React, { useState, useMemo } from 'react';
import { useGame } from '../../context/GameContext';
import { ViewState, PlayerPosition, Player, HealthStatus, InjurySeverity } from '../../types';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { TacticRepository } from '../../resources/tactics_db';
import { LineupService } from '../../services/LineupService';
import { PlayerPresentationService } from '../../services/PlayerPresentationService';

export const SquadView: React.FC = () => {
  const { players, userTeamId, clubs, navigateTo, lineups, updateLineup, viewPlayerDetails } = useGame();
  
  const myClub = useMemo(() => clubs.find(c => c.id === userTeamId), [clubs, userTeamId]);
  const myPlayers = userTeamId ? players[userTeamId] : [];
  const myLineup = userTeamId ? lineups[userTeamId] : null;

  const [selectedSlot, setSelectedSlot] = useState<{ id: string | null, index?: number, loc: 'START' | 'BENCH' | 'RES' } | null>(null);

  const currentTactic = useMemo(() => {
    return myLineup ? TacticRepository.getById(myLineup.tacticId) : TacticRepository.getDefault();
  }, [myLineup]);

  const getPlayerById = (id: string | null) => id ? myPlayers.find(p => p.id === id) : null;

  const handlePlayerClick = (pId: string | null, loc: 'START' | 'BENCH' | 'RES', index?: number) => {
    if (!myLineup || !userTeamId) return;

    if (selectedSlot === null) {
      const clickedPlayer = pId ? myPlayers.find(p => p.id === pId) : null;
      if (clickedPlayer && loc === 'RES') {
         // Sprawdź zawieszenia
         if ((clickedPlayer.suspensionMatches || 0) > 0) {
            alert("Ten zawodnik jest zawieszony i nie może zostać wybrany do składu meczowego.");
            return;
         }
         // Sprawdź poważne kontuzje
         if (clickedPlayer.health.status === HealthStatus.INJURED && clickedPlayer.health.injury?.severity === InjurySeverity.SEVERE) {
            alert("Ten zawodnik jest poważnie kontuzjowany i nie jest zdolny do gry.");
            return;
         }
      }
      setSelectedSlot({ id: pId, index, loc });
    } else {
      const sourcePlayer = selectedSlot.id ? myPlayers.find(p => p.id === selectedSlot.id) : null;
      
      // Walidacja przy wstawianiu zawodnika z Rezerw do składu
      if (sourcePlayer && selectedSlot.loc === 'RES' && loc !== 'RES') {
         if ((sourcePlayer.suspensionMatches || 0) > 0) {
            alert("Nie można wstawić zawieszonego gracza do składu.");
            setSelectedSlot(null);
            return;
         }
         if (sourcePlayer.health.status === HealthStatus.INJURED && sourcePlayer.health.injury?.severity === InjurySeverity.SEVERE) {
            alert("Nie można wstawić poważnie kontuzjowanego gracza do składu.");
            setSelectedSlot(null);
            return;
         }
      }

      // Wykonaj uniwersalną zamianę
      const newLineup = LineupService.swapPlayers(
        myLineup, 
        selectedSlot.id, 
        pId, 
        selectedSlot.loc === 'START' ? selectedSlot.index : undefined, 
        loc === 'START' ? index : undefined
      );
      updateLineup(userTeamId, newLineup);
      setSelectedSlot(null);
    }
  };

  const handlePlayerDoubleClick = (playerId: string) => {
    viewPlayerDetails(playerId);
  };

  const handleTacticChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!myLineup || !userTeamId) return;
    const newLineup = { ...myLineup, tacticId: e.target.value };
    updateLineup(userTeamId, newLineup);
  };

  const handleAutoPick = () => {
    if(!userTeamId) return;
    const newLineup = { ...LineupService.autoPickLineup(userTeamId, myPlayers, currentTactic.id) };
    updateLineup(userTeamId, newLineup);
  };

  const benchPlayers = useMemo(() => {
    if (!myLineup) return [];
    const pObjs = myLineup.bench.map(id => getPlayerById(id)).filter(Boolean) as Player[];
    return PlayerPresentationService.sortPlayers(pObjs).map(p => p.id);
  }, [myLineup?.bench, myPlayers]);

  const reservePlayersSorted = useMemo(() => {
    if (!myLineup) return [];
    const pObjs = myLineup.reserves.map(id => getPlayerById(id)).filter(Boolean) as Player[];
    return PlayerPresentationService.sortPlayers(pObjs).map(p => p.id);
  }, [myLineup?.reserves, myPlayers]);

  if (!myLineup || !userTeamId || !myClub) return null;

  const renderPlayerRow = (pId: string | null, label: string, loc: 'START' | 'BENCH' | 'RES', index?: number) => {
    const player = pId ? getPlayerById(pId) : null;
    const isSelected = selectedSlot?.loc === loc && (loc === 'START' ? selectedSlot.index === index : selectedSlot.id === pId);

    if (!player && loc === 'START') {
      return (
        <tr 
          key={`empty-${index}`}
          onClick={() => handlePlayerClick(null, 'START', index)}
          className={`group h-16 border-b border-white/5 cursor-pointer transition-all animate-pulse
            ${isSelected ? 'bg-red-500/30 ring-2 ring-inset ring-red-500' : 'bg-red-500/5 hover:bg-red-500/10'}`}
        >
          <td className="pl-6 w-12 text-[10px] font-black text-red-500/50 uppercase tracking-tighter">{label}</td>
          <td colSpan={4} className="px-4 text-[11px] font-black text-red-500 italic uppercase tracking-widest">
            &gt; SYSTEM_READY_FOR_DEPLOYMENT
          </td>
        </tr>
      );
    }

    if (!player) return null;

    const healthInfo = PlayerPresentationService.getHealthDisplay(player);
    const condColor = PlayerPresentationService.getConditionColorClass(player.condition);
    const isSuspended = (player.suspensionMatches || 0) > 0;
    const isSevereInjured = player.health.status === HealthStatus.INJURED && player.health.injury?.severity === InjurySeverity.SEVERE;
    
    return (
      <tr 
        key={player.id} 
        onClick={() => handlePlayerClick(player.id, loc, index)}
        onDoubleClick={() => handlePlayerDoubleClick(player.id)}
        className={`group relative h-14 border-b border-white/5 transition-all cursor-pointer
          ${isSelected ? 'bg-blue-600/20 ring-1 ring-inset ring-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.1)]' : 'hover:bg-white/[0.03]'}
          ${(isSuspended || isSevereInjured) ? 'opacity-30 grayscale' : ''}`}
      >
        <td className="pl-6 w-12 relative z-10">
           <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">{label}</span>
        </td>
        <td className={`w-14 font-mono font-black text-[11px] relative z-10 ${PlayerPresentationService.getPositionColorClass(player.position)}`}>
          {player.position}
        </td>
        <td className="relative z-10">
           <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <span className={`text-sm font-black uppercase italic tracking-tight transition-colors ${(isSuspended || isSevereInjured) ? 'text-slate-500' : 'text-white group-hover:text-blue-400'}`}>
                  {player.lastName}
                </span>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{player.firstName}</span>
              </div>
              {player.isOnTransferList && (
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-500 text-[8px] font-black rounded border border-amber-500/30 shadow-sm shrink-0 leading-none">
                     LISTA
                </span>
              )}
           </div>
        </td>
        <td className="w-24 text-center relative z-10">
           <span className={`text-[10px] font-black uppercase tracking-widest ${healthInfo.colorClass}`}>{healthInfo.text}</span>
        </td>

{/* TUTAJ WSTAW TEN KOD - Kolumna średniej oceny w wierszu */}
     <td className="w-16 text-center relative z-10">
           <span className="text-sm font-black text-blue-400 font-mono italic">
            
              {player.stats?.ratingHistory?.length > 0 
                ? (player.stats.ratingHistory.reduce((a, b) => a + b, 0) / player.stats.ratingHistory.length).toFixed(1)
                : '-'}
           </span>
        </td>

        <td className="pr-6 w-32 relative z-10">
           <div className="flex items-center gap-3">
             <div className="flex-1 h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
               {/* Warstwa długu przemęczenia - czerwony sufit */}
                <div className="absolute inset-0 bg-red-600/40" style={{ left: `${100 - (player.fatigueDebt || 0)}%` }} />
                {/* Pasek kondycji */}
                <div className={`h-full ${condColor} transition-all duration-1000 relative z-10`} style={{ width: `${player.condition}%` }} />
             </div>
             <div className="flex flex-col items-end min-w-[32px]">
                <span className="text-[10px] font-black font-mono text-white leading-none">{Math.round(player.condition)}%</span>
                {player.fatigueDebt > 5 && (
                  <span className="text-[7px] font-black text-red-500 leading-none mt-0.5">-{Math.round(player.fatigueDebt)}</span>
                )}
             </div>
           </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="h-screen w-full flex flex-col p-6 animate-fade-in overflow-hidden relative font-sans text-slate-100">
      
      {/* 1. KINETYCZNE TŁO (BEZ ZMIAN URL) */}
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
        <div 
          className="absolute inset-0 bg-[url('https://i.ibb.co/C3YtBnv4/team-retro.png')] bg-cover bg-center opacity-[0.15] mix-blend-screen scale-110"
        />
        <div 
          className="absolute top-[-10%] right-[-10%] w-[70%] h-[70%] rounded-full blur-[180px] opacity-25 animate-pulse-slow transition-all duration-[3000ms]" 
          style={{ background: myClub.colorsHex[0] }} 
        />
        <div className="absolute left-[-5%] bottom-[-5%] text-[30rem] font-black italic text-white/[0.015] select-none pointer-events-none tracking-tighter">{myClub.shortName}</div>
      </div>

      {/* 2. BROADCAST HEADER */}
      <header className="flex items-center justify-between px-10 py-6 bg-slate-900/40 rounded-[40px] border border-white/10 backdrop-blur-3xl shrink-0 shadow-2xl mb-6">
         <div className="flex items-center gap-8">
            <div className="relative group">
               <div className="absolute inset-[-10px] rounded-3xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity" style={{ backgroundColor: myClub.colorsHex[0] }} />
               <div className="w-20 h-20 rounded-[28px] flex flex-col overflow-hidden border-2 border-white/20 shadow-2xl transform group-hover:rotate-6 transition-transform duration-500 relative z-10">
                  <div style={{ backgroundColor: myClub.colorsHex[0] }} className="flex-1" />
                  <div style={{ backgroundColor: myClub.colorsHex[1] || myClub.colorsHex[0] }} className="flex-1" />
               </div>
            </div>
            <div>
               <h1 className="text-5xl font-black italic uppercase tracking-tighter text-white leading-none drop-shadow-2xl">Zarządzanie <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-white">Kadrą</span></h1>
               <div className="flex items-center gap-8 mt-3">
                  <span className="text-[11px] font-black uppercase tracking-[0.4em] px-4 py-1 rounded-full bg-white/5 border border-white/10" style={{ color: myClub.colorsHex[0] }}>{myClub.name.toUpperCase()}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">TAKTYKI</span>
                    <select 
                      value={currentTactic.id} 
                      onChange={handleTacticChange} 
                      className="bg-black/60 border border-white/10 text-white text-[13px] font-black uppercase rounded-2xl px-8 py-3 hover:border-blue-500/50 transition-all cursor-pointer outline-none focus:ring-4 focus:ring-blue-500/10 shadow-2xl min-w-[240px] appearance-none italic"
                      style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'white\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\' /%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1.5rem center', backgroundSize: '1rem' }}
                    >
                      {TacticRepository.getAll().map(t => <option key={t.id} value={t.id} className="bg-slate-950">{t.name}</option>)}
                    </select>
                  </div>
               </div>
            </div>
         </div>

         <div className="flex items-center gap-5">
            <button onClick={handleAutoPick} className="relative group px-10 py-5 rounded-[24px] bg-blue-600/10 border border-blue-500/30 text-[11px] font-black uppercase italic tracking-widest text-blue-400 hover:bg-blue-600/20 hover:border-blue-400 transition-all active:scale-95 shadow-xl overflow-hidden">
               <span className="relative z-10 flex items-center gap-3">🪄 AUTO WYBÓR</span>
               <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
            <div className="w-px h-12 bg-white/10 mx-2" />
            <button onClick={() => navigateTo(ViewState.DASHBOARD)} className="px-10 py-5 rounded-[24px] bg-white text-slate-900 font-black uppercase italic tracking-widest text-xs hover:scale-105 transition-all active:scale-95 shadow-[0_20px_40px_rgba(255,255,255,0.1)]">&larr; POWRÓT</button>
         </div>
      </header>

      {/* 3. MAIN TACTICAL WORKSPACE */}
      <div className="flex-1 flex gap-8 min-h-0">
        
        {/* LEFT: THE PITCH (LEVEL PRO VIZ) */}
        <div className="w-[45%] bg-slate-900/40 rounded-[50px] border border-white/10 backdrop-blur-3xl shadow-[0_40px_100px_rgba(0,0,0,0.6)] relative overflow-hidden flex items-center justify-center p-12 shrink-0 group">
           {/* Internal Pitch Lighting */}
           <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />
           <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-emerald-500/5 to-transparent pointer-events-none" />

           <div className="w-full h-full max-w-[550px] aspect-[2/3.2] relative rounded-[40px] border-[12px] border-white/10 overflow-hidden shadow-[0_100px_150px_rgba(0,0,0,0.8)] bg-[#053d2e] transform perspective-[1500px] rotateX(15deg)">
              {/* Pitch Texture & Grid */}
              <div className="absolute inset-0 opacity-[0.15]" style={{ backgroundImage: 'repeating-linear-gradient(0deg, #059669 0%, #059669 10%, #047857 10%, #047857 20%)' }} />
              <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '10% 10%' }} />
              
              {/* Pitch Markings SVG */}
              <svg className="absolute inset-0 w-full h-full opacity-30 pointer-events-none" viewBox="0 0 100 150" fill="none" stroke="white" strokeWidth="0.8">
                 <rect x="2" y="2" width="96" height="146" />
                 <line x1="2" y1="75" x2="98" y2="75" />
                 <circle cx="50" cy="75" r="15" />
                 <circle cx="50" cy="75" r="1" fill="white" />
                 {/* Top Box */}
                 <rect x="20" y="2" width="60" height="25" />
                 <rect x="35" y="2" width="30" height="10" />
                 <path d="M 35 27 Q 50 35 65 27" />
                 {/* Bottom Box */}
                 <rect x="20" y="123" width="60" height="25" />
                 <rect x="35" y="138" width="30" height="10" />
                 <path d="M 35 123 Q 50 115 65 123" />
              </svg>

              {currentTactic.slots.map((slot, idx) => {
                const playerId = myLineup.startingXI[idx];
                const player = getPlayerById(playerId);
                const isSelected = selectedSlot?.loc === 'START' && selectedSlot.index === idx;
                const isOutOfPosition = player && player.position !== slot.role;
                
                return (
                  <div 
                     key={idx}
                     onClick={() => handlePlayerClick(playerId, 'START', idx)}
                     className="absolute flex flex-col items-center justify-center cursor-pointer transition-all duration-700 hover:scale-125 z-20"
                     style={{ 
                        left: `${slot.x * 100}%`, 
                        top: `${slot.y * 100}%`, 
                        transform: 'translate(-50%, -50%) rotateX(-15deg)',
                        filter: isSelected ? 'drop-shadow(0 0 20px rgba(255,255,255,0.4))' : 'none'
                     }}
                  >
                    {/* Role Tag */}
                    <div className={`absolute -top-10 whitespace-nowrap px-3 py-1 rounded-lg shadow-2xl text-[10px] font-black border transition-all duration-500
                       ${!player ? 'bg-rose-600 border-rose-400 text-white animate-pulse' : 'bg-black/80 border-white/20 text-slate-400 group-hover:text-white'}`}>
                       {!player ? 'VACANT' : slot.role}
                    </div>
                    
                    {/* Position Warning Glow */}
                    {isOutOfPosition && (
                      <div className="absolute inset-0 w-24 h-24 rounded-full bg-amber-500/10 border-2 border-amber-500/30 blur-md animate-pulse -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2" />
                    )}

                    {/* Tactical Node */}
                    <div className={`relative w-14 h-14 rounded-3xl flex items-center justify-center shadow-2xl border-[3px] transition-all duration-500 overflow-hidden
                       ${isSelected ? 'bg-white border-white scale-110' : 'bg-slate-950/90 border-white/10'}
                       ${!player ? 'border-dashed border-rose-500/40 bg-rose-950/20' : ''}
                       ${isOutOfPosition && !isSelected ? 'border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.3)]' : ''}
                    `}>
                       {/* Identity Underlay */}
                       {player && !isSelected && (
                          <div className="absolute inset-0 opacity-10" style={{ backgroundColor: myClub.colorsHex[0] }} />
                       )}
                       
                       <span className={`text-xl font-black italic relative z-10 ${isSelected ? 'text-slate-900' : (player ? 'text-white' : 'text-rose-500')}`}>
                         {player ? player.overallRating : '!'}
                       </span>

                       {/* Mini Energy Bar inside Node */}
                       {player && (
                         <div className="absolute bottom-0 left-0 w-full h-1 bg-black/40">
                            <div className={`h-full ${PlayerPresentationService.getConditionColorClass(player.condition)}`} style={{ width: `${player.condition}%` }} />
                         </div>
                       )}
                    </div>

                    {/* Name Label */}
                    <div className={`mt-3 px-4 py-1 rounded-xl border transition-all duration-500 backdrop-blur-md ${!player ? 'bg-rose-500/20 border-rose-500/30' : 'bg-black/70 border-white/10'} ${isOutOfPosition ? 'border-amber-500/40' : ''}`}>
                       <span className={`text-[10px] font-black uppercase italic tracking-widest whitespace-nowrap ${!player ? 'text-rose-400' : (isOutOfPosition ? 'text-amber-200' : 'text-white')}`}>
                          {player ? player.lastName : 'DEPLOY UNIT'}
                       </span>
                    </div>
                  </div>
                );
              })}
           </div>
        </div>

        {/* RIGHT: SQUAD MANAGEMENT (GLASS LISTS) */}
        <div className="flex-1 flex flex-col gap-6 min-w-0">
           
           {/* STARTING XI LIST */}
           <div className="flex-[3] bg-slate-900/40 rounded-[50px] border border-white/10 backdrop-blur-3xl shadow-2xl flex flex-col overflow-hidden relative">
              <div className="px-8 py-5 border-b border-white/10 flex justify-between items-center bg-white/5 relative z-10">
                 <div className="flex items-center gap-4">
                    <div className="w-1.5 h-6 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                    <h3 className="text-xs font-black uppercase tracking-[0.5em] text-white">PIERWSZY SKŁAD <span className="text-slate-500 font-normal ml-2">/ Aktuálne Ustawienie</span></h3>
                 </div>
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Protokół Meczowy v4.9</span>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10">
                 <table className="w-full text-left border-collapse">
                    <tbody className="divide-y divide-white/[0.03]">
                       {myLineup.startingXI.map((pid, idx) => renderPlayerRow(pid, currentTactic.slots[idx].role, 'START', idx))}
                    </tbody>
                 </table>
              </div>
           </div>
           
           {/* SUB & RESERVES GRID */}
           <div className="flex-[2] flex gap-6 min-h-0">
              {/* BENCH */}
              <div className="flex-1 bg-slate-900/40 rounded-[45px] border border-white/10 backdrop-blur-3xl shadow-2xl flex flex-col overflow-hidden relative">
                 <div className="px-6 py-4 border-b border-white/10 bg-black/20 flex justify-between items-center relative z-10">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">Ławka</h3>
                    <div className="bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/30">
                       <span className="text-[10px] font-black font-mono text-blue-400">{benchPlayers.length} / 9</span>
                    </div>
                 </div>
                 <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10">
                    <table className="w-full text-left border-collapse">
                       <tbody className="divide-y divide-white/[0.03]">
                         {benchPlayers.map(pid => renderPlayerRow(pid, 'SUB', 'BENCH'))}
                         {benchPlayers.length === 0 && (
                           <tr><td className="py-20 text-center opacity-10 font-black uppercase italic text-xs tracking-widest">Pusta Ławka</td></tr>
                         )}
                       </tbody>
                    </table>
                 </div>
              </div>

              {/* RESERVES */}
              <div className="flex-1 bg-slate-900/40 rounded-[45px] border border-white/10 backdrop-blur-3xl shadow-2xl flex flex-col overflow-hidden relative">
                 <div className="px-6 py-4 border-b border-white/10 bg-black/20 flex justify-between items-center relative z-10">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Rezerwy</h3>
                    <span className="text-[10px] font-black font-mono text-slate-700 uppercase tracking-widest">KADRA: {reservePlayersSorted.length}</span>
                 </div>
                 <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10">
                    <table className="w-full text-left border-collapse">
                       <tbody className="divide-y divide-white/[0.03]">
                         {reservePlayersSorted.map(pid => renderPlayerRow(pid, 'RES', 'RES'))}
                         {reservePlayersSorted.length === 0 && (
                           <tr><td className="py-20 text-center opacity-10 font-black uppercase italic text-xs tracking-widest">Brak zawodników</td></tr>
                         )}
                       </tbody>
                    </table>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* FOOTER DIAGNOSTIC BAR */}
      <footer className="mt-6 h-12 bg-white/5 rounded-full border border-white/10 backdrop-blur-xl flex items-center justify-between px-12 shrink-0 shadow-2xl relative overflow-hidden">
         <div className="absolute inset-0 opacity-[0.03] animate-ticker" style={{ backgroundImage: 'linear-gradient(90deg, transparent, white, transparent)', backgroundSize: '200% 100%' }} />
         <div className="flex gap-12 text-[7px] font-black text-slate-600 uppercase tracking-[0.6em] relative z-10">
            <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" /> Taktyki gotowe</span>
            <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Optymalizacja składu</span>
            <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Gotowi do gry</span>
         </div>
         <div className="text-[8px] font-black text-blue-500 uppercase tracking-widest relative z-10 italic">PZPN</div>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
        
        @keyframes fade-in { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        
        @keyframes pulse-slow { 0%, 100% { opacity: 0.2; transform: scale(1); } 50% { opacity: 0.3; transform: scale(1.1); } }
        .animate-pulse-slow { animation: pulse-slow 8s infinite ease-in-out; }

        @keyframes ticker { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
        .animate-ticker { animation: ticker 20s linear infinite; }

        .clip-path-arc-top { clip-path: inset(50% 0 0 0); }
      `}</style>
    </div>
  );
};