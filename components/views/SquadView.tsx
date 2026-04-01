import React, { useState, useMemo } from 'react';
import { useGame } from '../../context/GameContext';
import { ViewState, PlayerPosition, Player, HealthStatus, InjurySeverity } from '../../types';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { TacticRepository } from '../../resources/tactics_db';
import { LineupService } from '../../services/LineupService';
import { PlayerPresentationService } from '../../services/PlayerPresentationService';
import { TeamAnalysisService } from '../../services/TeamAnalysisService';
import szatnia from '../../Graphic/themes/szatnia.png';
import { getClubLogo } from '../../resources/ClubLogoAssets';
import { TeamAnalysisModal } from './TeamAnalysisModal';

export const SquadView: React.FC = () => {
  const { players, userTeamId, clubs, setClubs, navigateTo, lineups, updateLineup, viewPlayerDetails, currentDate } = useGame();
  
  const myClub = useMemo(() => clubs.find(c => c.id === userTeamId), [clubs, userTeamId]);
  const myPlayers = userTeamId ? players[userTeamId] : [];
  const myLineup = userTeamId ? lineups[userTeamId] : null;

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; playerId: string; loc: 'START' | 'BENCH' | 'RES' } | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ id: string | null, index?: number, loc: 'START' | 'BENCH' | 'RES' } | null>(null);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);

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
            return;
         }
         // Sprawdź kontuzje (SEVERE lub daysRemaining > 2)
         if (clickedPlayer.health.status === HealthStatus.INJURED && (clickedPlayer.health.injury?.severity === InjurySeverity.SEVERE || (clickedPlayer.health.injury?.daysRemaining ?? 0) > 2)) {
            return;
         }
         // Sprawdź przemęczenie (kondycja < 60)
         if (clickedPlayer.condition < 60) {
            return;
         }
      }
      setSelectedSlot({ id: pId, index, loc });
    } else {
      const sourcePlayer = selectedSlot.id ? myPlayers.find(p => p.id === selectedSlot.id) : null;
      
      // Walidacja przy wstawianiu zawodnika z Rezerw do składu
      if (sourcePlayer && selectedSlot.loc === 'RES' && loc !== 'RES') {
         if ((sourcePlayer.suspensionMatches || 0) > 0) {
            setSelectedSlot(null);
            return;
         }
         if (sourcePlayer.health.status === HealthStatus.INJURED && (sourcePlayer.health.injury?.severity === InjurySeverity.SEVERE || (sourcePlayer.health.injury?.daysRemaining ?? 0) > 2)) {
            setSelectedSlot(null);
            return;
         }
         // Sprawdź przemęczenie (kondycja < 60)
         if (sourcePlayer.condition < 60) {
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
      fixSpecialRoles(newLineup.startingXI);
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

  const fixSpecialRoles = (newStartingXI: (string | null)[]) => {
    if (!userTeamId || !myClub) return;
    const xiIds = newStartingXI.filter((id): id is string => id !== null);
    const xiPlayers = myPlayers.filter(p => xiIds.includes(p.id));
    if (xiPlayers.length === 0) return;
    setClubs(prev => prev.map(c => {
      if (c.id !== userTeamId) return c;
      const captainId = c.captainId && xiIds.includes(c.captainId)
        ? c.captainId
        : [...xiPlayers].sort((a, b) => b.attributes.leadership - a.attributes.leadership)[0]?.id ?? null;
      const penaltyTakerId = c.penaltyTakerId && xiIds.includes(c.penaltyTakerId)
        ? c.penaltyTakerId
        : [...xiPlayers].sort((a, b) => b.attributes.finishing - a.attributes.finishing)[0]?.id ?? null;
      const freeKickTakerId = c.freeKickTakerId && xiIds.includes(c.freeKickTakerId)
        ? c.freeKickTakerId
        : [...xiPlayers].sort((a, b) => b.attributes.freeKicks - a.attributes.freeKicks)[0]?.id ?? null;
      return { ...c, captainId, penaltyTakerId, freeKickTakerId };
    }));
  };

  const handleAutoPick = () => {
    if(!userTeamId) return;
    const newLineup = { ...LineupService.autoPickLineup(userTeamId, myPlayers, currentTactic.id) };
    updateLineup(userTeamId, newLineup);
    fixSpecialRoles(newLineup.startingXI);
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

  const teamAnalysisReport = useMemo(() => {
    if (!myClub || myPlayers.length === 0) return null;
    return TeamAnalysisService.analyzeSquad(myClub, myPlayers, currentDate);
  }, [myClub, myPlayers, currentDate]);

  if (!myLineup || !userTeamId || !myClub) return null;

  const getPositionGroup = (role: string): string => {
    if (role === 'GK') return 'GK';
    if (['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(role) || role.startsWith('DEF')) return 'DEF';
    if (['CM', 'CDM', 'CAM', 'LM', 'RM'].includes(role) || role.startsWith('MID')) return 'MID';
    return 'FWD';
  };

  const renderPlayerRow = (pId: string | null, label: string, loc: 'START' | 'BENCH' | 'RES', index?: number) => {
    const player = pId ? getPlayerById(pId) : null;
    const isSelected = selectedSlot?.loc === loc && (loc === 'START' ? selectedSlot.index === index : selectedSlot.id === pId);
    const selectedRole = selectedSlot?.loc === 'START' ? currentTactic.slots[selectedSlot.index]?.role : null;
    const isHighlighted = !isSelected && selectedRole && (loc === 'BENCH' || loc === 'RES') && player
      && !(( player.suspensionMatches || 0) > 0)
      && !(player.health.status === HealthStatus.INJURED && player.health.injury?.severity === InjurySeverity.SEVERE)
      && !(player.condition < 60)
      && getPositionGroup(player.position) === getPositionGroup(selectedRole);

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
    const pendingTransferClub = player.transferPendingClubId
      ? clubs.find(c => c.id === player.transferPendingClubId)
      : null;
    const hasPendingTransfer = !!player.transferPendingClubId && !!player.transferReportDate;
    const isSuspended = (player.suspensionMatches || 0) > 0;
    const isSevereInjured = player.health.status === HealthStatus.INJURED && player.health.injury?.severity === InjurySeverity.SEVERE;
    const isOverfatigued = player.condition < 60;
    const isOutOfPosition = loc === 'START' && getPositionGroup(player.position) !== getPositionGroup(label);

    return (
      <tr
        key={player.id}
        onClick={() => handlePlayerClick(player.id, loc, index)}
        onDoubleClick={() => handlePlayerDoubleClick(player.id)}
        onContextMenu={(e) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, playerId: player.id, loc }); }}
        className={`group relative h-14 border-b border-white/5 transition-all cursor-pointer
          ${isSelected ? 'bg-blue-600/20 ring-1 ring-inset ring-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.1)]' : isHighlighted ? 'bg-emerald-500/10 ring-1 ring-inset ring-emerald-400/60 shadow-[0_0_16px_rgba(52,211,153,0.15)]' : isOutOfPosition ? 'bg-amber-500/10 ring-1 ring-inset ring-amber-500/40' : 'hover:bg-white/[0.03]'}
          ${(isSuspended || isSevereInjured || isOverfatigued) ? 'opacity-30 grayscale' : ''}`}
      >
        <td className="pl-6 w-12 relative z-10">
           <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">{label}</span>
        </td>
        <td className={`w-14 font-mono font-black text-[11px] relative z-10 ${PlayerPresentationService.getPositionColorClass(player.position)}`}>
          {player.position}
        </td>
        <td className="relative z-10 w-52">
           <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <span className={`text-sm font-black uppercase italic tracking-tight transition-colors ${(isSuspended || isSevereInjured || isOverfatigued) ? 'text-slate-500' : 'text-white group-hover:text-blue-400'}`}>
                  {player.lastName}
                </span>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{player.firstName}</span>
              </div>
              {myClub?.captainId === player.id && (
                <span className="w-5 h-5 rounded-full bg-blue-900 border border-blue-400 flex items-center justify-center text-[9px] font-black text-white shrink-0" title="Kapitan">C</span>
              )}
              {myClub?.penaltyTakerId === player.id && (
                <span className="px-1.5 py-0.5 bg-emerald-900/60 text-emerald-400 text-[8px] font-black rounded border border-emerald-500/40 shrink-0 leading-none" title="Egzekutor karnych">PK</span>
              )}
              {myClub?.freeKickTakerId === player.id && (
                <span className="px-1.5 py-0.5 bg-amber-900/60 text-amber-400 text-[8px] font-black rounded border border-amber-500/40 shrink-0 leading-none" title="Egzekutor wolnych">FK</span>
              )}
              {player.isOnTransferList && (
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-500 text-[8px] font-black rounded border border-amber-500/30 shadow-sm shrink-0 leading-none">
                     LISTA
                </span>
              )}
              {hasPendingTransfer && (
                <span
                  title={`Transfer do ${pendingTransferClub?.name ?? player.transferPendingClubId}${player.transferReportDate ? `\nData przejscia: ${new Date(player.transferReportDate).toLocaleDateString('pl-PL')}` : ''}`}
                  className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[8px] font-black rounded border border-emerald-500/30 shadow-sm shrink-0 leading-none cursor-help"
                >
                  TRS
                </span>
              )}
              {/* Badge zainteresowania transferowego — pojawia się gdy ≥1 klub AI obserwuje zawodnika */}
              {player.interestedClubs && player.interestedClubs.length > 0 && (
                <span
                  title={`Zainteresowane kluby:\n${player.interestedClubs.map(id => clubs.find(c => c.id === id)?.name ?? id).join('\n')}`}
                  className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-[8px] font-black rounded border border-blue-500/30 shadow-sm shrink-0 leading-none cursor-help"
                >
                  INT
                </span>
              )}
           </div>
        </td>
        <td className="relative z-10 px-2 w-36">
          <div className="flex gap-[6px]">
            <div className="flex flex-col items-center w-[22px]">
              <span className="text-[12px] font-black font-mono text-slate-300 leading-none">{player.stats.matchesPlayed}</span>
            </div>
            <div className="flex flex-col items-center w-[22px]">
              <span className="text-[12px] font-black font-mono text-emerald-400 leading-none">{player.stats.goals}</span>
            </div>
            <div className="flex flex-col items-center w-[22px]">
              <span className="text-[12px] font-black font-mono text-blue-400 leading-none">{player.stats.assists}</span>
            </div>
            <div className="flex flex-col items-center w-[22px]">
              <span className="text-[12px] font-black font-mono text-yellow-400 leading-none">{player.stats.yellowCards}</span>
            </div>
            <div className="flex flex-col items-center w-[22px]">
              <span className="text-[12px] font-black font-mono text-red-500 leading-none">{player.stats.redCards}</span>
            </div>
          </div>
        </td>
        <td className="relative z-10 px-3">
          <div className="flex gap-[6px]">
            {([
              player.attributes.pace,
              player.attributes.passing,
              player.attributes.defending,
              player.attributes.attacking,
              player.attributes.leadership,
              player.attributes.aggression,
            ] as number[]).map((val, i) => (
              <div key={i} className="flex items-center justify-center w-[22px]">
                <span className={`text-[12px] font-black font-mono leading-none ${val >= 75 ? 'text-emerald-400' : val >= 55 ? 'text-amber-400' : 'text-red-400'}`}>{val}</span>
              </div>
            ))}
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

  const handleContextAction = (action: 'captain' | 'penalty' | 'freekick') => {
    if (!contextMenu || !userTeamId || !myClub) return;
    setClubs(prev => prev.map(c => c.id !== userTeamId ? c : {
      ...c,
      captainId:       action === 'captain'   ? contextMenu.playerId : c.captainId,
      penaltyTakerId:  action === 'penalty'   ? contextMenu.playerId : c.penaltyTakerId,
      freeKickTakerId: action === 'freekick'  ? contextMenu.playerId : c.freeKickTakerId,
    }));
    setContextMenu(null);
  };

  return (
    <div className="h-screen w-full flex flex-col p-6 animate-fade-in overflow-hidden relative font-sans text-slate-100">
      
      {/* 1. KINETYCZNE TŁO (BEZ ZMIAN URL) */}
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
       <div 
  className="absolute inset-0 bg-cover bg-center opacity-[0.15] mix-blend-screen scale-110"
  style={{ backgroundImage: `url(${szatnia})` }}
/>
        <div 
          className="absolute top-[-10%] right-[-10%] w-[70%] h-[70%] rounded-full blur-[180px] opacity-25 animate-pulse-slow transition-all duration-[3000ms]" 
          style={{ background: myClub.colorsHex[0] }} 
        />
        <div className="absolute left-[-5%] bottom-[-5%] text-[30rem] font-black italic text-white/[0.015] select-none pointer-events-none tracking-tighter">{myClub.shortName}</div>
      </div>

      {/* 2. BROADCAST HEADER */}
      <header className="relative overflow-visible flex items-center justify-between px-10 py-[4px] bg-slate-900/40 rounded-[40px] border border-white/10 backdrop-blur-3xl shrink-0 shadow-2xl mb-6">
         {/* Club logo / colors — floats over everything */}
         {getClubLogo(myClub.id) ? (
           <div className="absolute left-6 top-1/2 -translate-y-1/2" style={{ zIndex: 9999, pointerEvents: 'none' }}>
             <div className="absolute inset-[-10px] rounded-3xl blur-xl opacity-20" style={{ backgroundColor: myClub.colorsHex[0] }} />
             <img
               src={getClubLogo(myClub.id)}
               alt={myClub.name}
               className="w-[172px] h-[172px] object-contain drop-shadow-2xl relative"
               style={{ transform: 'rotate(-12deg)' }}
             />
           </div>
         ) : (
           <div className="absolute left-6 top-1/2 -translate-y-1/2 group" style={{ zIndex: 9999 }}>
             <div className="absolute inset-[-10px] rounded-3xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity" style={{ backgroundColor: myClub.colorsHex[0] }} />
             <div className="w-20 h-20 rounded-[28px] flex flex-col overflow-hidden border-2 border-white/20 shadow-2xl transform group-hover:rotate-6 transition-transform duration-500 relative">
               <div style={{ backgroundColor: myClub.colorsHex[0] }} className="flex-1" />
               <div style={{ backgroundColor: myClub.colorsHex[1] || myClub.colorsHex[0] }} className="flex-1" />
             </div>
           </div>
         )}
         <div className="flex items-center gap-8">
            <div className="w-[140px] shrink-0" />
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
            <button
              onClick={() => setIsAnalysisOpen(true)}
              className="relative group px-8 py-5 rounded-[24px] bg-emerald-600/10 border border-emerald-500/30 text-[11px] font-black uppercase italic tracking-widest text-emerald-300 hover:bg-emerald-600/20 hover:border-emerald-400 transition-all active:scale-95 shadow-xl overflow-hidden"
            >
               <span className="relative z-10 flex items-center gap-3">ANALIZA DRUŻYNY</span>
               <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
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

           <div className="w-full h-full max-w-[550px] aspect-[2/3.2] relative rounded-none border-0 overflow-hidden shadow-[0_100px_150px_rgba(0,0,0,0.8)] transform perspective-[1500px] rotateX(15deg)" style={{ backgroundColor: 'rgba(5, 61, 1, 0.65)' }}>
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
                    <div className={`absolute -top-[20px] whitespace-nowrap px-[10px] py-[2px] rounded-none shadow-2xl text-[9px] font-black border transition-all duration-500
                       ${!player ? 'bg-rose-600 border-rose-400 text-white animate-pulse' : `bg-black/80 border-white/20 ${
                         slot.role === PlayerPosition.GK ? 'text-yellow-400' :
                         slot.role === PlayerPosition.DEF ? 'text-blue-400' :
                         slot.role === PlayerPosition.MID ? 'text-emerald-400' :
                         'text-red-400'
                       }`}`}>
                       {!player ? 'VACANT' : slot.role}
                    </div>
                    
                    {/* Position Warning Glow */}
                    {isOutOfPosition && (
                      <div className="absolute inset-0 w-24 h-24 rounded-full bg-amber-500/10 border-2 border-amber-500/30 blur-md animate-pulse -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2" />
                    )}

                    {/* Tactical Node */}
                    <div
                       className={`relative w-14 h-14 rounded-full flex items-center justify-center shadow-2xl border-[3px] transition-all duration-500 overflow-hidden
                         ${isSelected ? 'scale-110' : ''}
                         ${!player ? 'border-dashed border-rose-500/40 bg-rose-950/20' : ''}
                         ${isOutOfPosition && !isSelected ? 'border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.3)]' : ''}
                       `}
                       style={isSelected ? { background: '#ffffff', borderColor: '#ffffff' } : player ? { borderColor: myClub.colorsHex[1] || myClub.colorsHex[0] } : {}}
                    >
                       {/* Kit layers: shirt (top 3/4) + shorts (bottom 1/4) */}
                       {player && !isSelected && (
                         <>
                           <div className="absolute inset-0" style={{ backgroundColor: myClub.colorsHex[0], bottom: '25%' }} />
                           <div className="absolute left-0 right-0 bottom-0 h-[25%]" style={{ backgroundColor: myClub.colorsHex[1] || myClub.colorsHex[0] }} />
                         </>
                       )}

                       <span
                         className={`text-xl font-black italic relative z-10 ${isSelected ? 'text-slate-900' : (player ? 'text-white' : 'text-rose-500')}`}
                         style={player && !isSelected ? { textShadow: '0 1px 4px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.7)' } : {}}
                       >
                         {player ? player.overallRating : '!'}
                       </span>

                       {/* Mini Energy Bar inside Node */}
                       {player && (
                         <div className="absolute bottom-0 left-0 w-full h-1 bg-black/40 z-10">
                            <div className={`h-full ${PlayerPresentationService.getConditionColorClass(player.condition)}`} style={{ width: `${player.condition}%` }} />
                         </div>
                       )}
                    </div>

                    {/* Name Label */}
                    <div className="-mt-[7px]">
                       <span className={`text-[10px] font-black uppercase italic tracking-widest whitespace-nowrap drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] ${!player ? 'text-rose-400' : (isOutOfPosition ? 'text-amber-200' : 'text-white')}`}>
                          {player ? player.lastName : 'DEPLOY UNIT'}
                       </span>
                    </div>
                  </div>
                );
              })}
           </div>
        </div>

{/* RIGHT: SQUAD MANAGEMENT (GLASS LISTS) */}
        <div className="flex-1 flex flex-col gap-6 min-w-0 overflow-y-auto custom-scrollbar">
           
           {/* STARTING XI LIST */}
           <div className="shrink-0 bg-slate-900/40 rounded-[50px] border border-white/10 backdrop-blur-3xl shadow-2xl flex flex-col overflow-hidden relative">
              <div className="px-8 py-3 border-b border-white/10 flex items-center bg-white/5 relative z-10">
                 <div className="w-1.5 h-5 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
              </div>
              <div className="overflow-hidden relative z-10">
                 <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 bg-white/[0.02]">
                        <th className="pl-6 w-12 py-2" />
                        <th className="w-14 py-2" />
                        <th className="w-52 py-2">
                          <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-500">Zawodnik</span>
                        </th>
                        <th className="px-2 w-36 py-2">
                          <div className="flex gap-[6px]">
                            {([['M','text-slate-400'],['G','text-emerald-600'],['A','text-blue-600'],['ŻK','text-yellow-600'],['CK','text-red-700']] as [string,string][]).map(([lbl,cls]) => (
                              <div key={lbl} className={`w-[22px] text-center text-[8px] font-black uppercase tracking-tighter ${cls}`}>{lbl}</div>
                            ))}
                          </div>
                        </th>
                        <th className="px-3 py-2">
                          <div className="flex gap-[6px]">
                            {(['PAC','PAS','DEF','ATK','LDR','AGR'] as const).map(lbl => (
                              <div key={lbl} className="w-[22px] text-center text-[8px] font-black uppercase tracking-tighter text-slate-400">{lbl}</div>
                            ))}
                          </div>
                        </th>
                        <th className="w-24 text-center py-2">
                          <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500">Zdrowie</span>
                        </th>
                        <th className="w-16 text-center py-2">
                          <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500">Ocena</span>
                        </th>
                        <th className="pr-6 w-32 py-2">
                          <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500">Kondycja</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.03]">
                       {myLineup.startingXI.map((pid, idx) => renderPlayerRow(pid, currentTactic.slots[idx].role, 'START', idx))}
                    </tbody>
                 </table>
              </div>
           </div>
           
           {/* BENCH */}
           <div className="shrink-0 bg-slate-900/40 rounded-[45px] border border-white/10 backdrop-blur-3xl shadow-2xl flex flex-col overflow-hidden relative">
              <div className="px-6 py-4 border-b border-white/10 bg-black/20 flex justify-between items-center relative z-10">
                 <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">Ławka</h3>
                 <div className="bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/30">
                    <span className="text-[10px] font-black font-mono text-blue-400">{benchPlayers.length} / 9</span>
                 </div>
              </div>
              <div className="overflow-hidden relative z-10">
                 <table className="w-full text-left border-collapse">
                    <thead>
                      <tr>
                        <th className="pl-6 w-12" />
                        <th className="w-14" />
                        <th className="w-52" />
                        <th className="px-2 w-36" />
                        <th className="px-3 py-1">
                          <div className="flex gap-[6px]">
                            {(['PAC','PAS','DEF','ATK','LDR','AGR'] as const).map(lbl => (
                              <div key={lbl} className="w-[22px] text-center text-[8px] font-black uppercase tracking-tighter text-slate-600">{lbl}</div>
                            ))}
                          </div>
                        </th>
                        <th className="w-24" />
                        <th className="w-16" />
                        <th className="pr-6 w-32" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.03]">
                      {benchPlayers.map(pid => renderPlayerRow(pid, 'SUB', 'BENCH'))}
                      {benchPlayers.length === 0 && (
                        <tr><td className="py-10 text-center opacity-10 font-black uppercase italic text-xs tracking-widest">Pusta Ławka</td></tr>
                      )}
                    </tbody>
                 </table>
              </div>
           </div>

           {/* RESERVES */}
           <div className="shrink-0 bg-slate-900/40 rounded-[45px] border border-white/10 backdrop-blur-3xl shadow-2xl flex flex-col overflow-hidden relative">
              <div className="px-6 py-4 border-b border-white/10 bg-black/20 flex justify-between items-center relative z-10">
                 <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Rezerwy</h3>
                 <span className="text-[10px] font-black font-mono text-slate-700 uppercase tracking-widest">KADRA: {reservePlayersSorted.length}</span>
              </div>
              <div className="overflow-hidden relative z-10">
                 <table className="w-full text-left border-collapse">
                    <thead>
                      <tr>
                        <th className="pl-6 w-12" />
                        <th className="w-14" />
                        <th className="w-52" />
                        <th className="px-2 w-36" />
                        <th className="px-3 py-1">
                          <div className="flex gap-[6px]">
                            {(['PAC','PAS','DEF','ATK','LDR','AGR'] as const).map(lbl => (
                              <div key={lbl} className="w-[22px] text-center text-[8px] font-black uppercase tracking-tighter text-slate-600">{lbl}</div>
                            ))}
                          </div>
                        </th>
                        <th className="w-24" />
                        <th className="w-16" />
                        <th className="pr-6 w-32" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.03]">
                      {reservePlayersSorted.map(pid => renderPlayerRow(pid, 'RES', 'RES'))}
                      {reservePlayersSorted.length === 0 && (
                        <tr><td className="py-10 text-center opacity-10 font-black uppercase italic text-xs tracking-widest">Brak zawodników</td></tr>
                      )}
                    </tbody>
                 </table>
              </div>
           </div>

        </div>
</div>

      {/* FOOTER DIAGNOSTIC BAR */}
      <footer className="mt-6 h-6 bg-white/5 rounded-full border border-white/10 backdrop-blur-xl flex items-center justify-between px-12 shrink-0 shadow-2xl relative overflow-hidden">
         <div className="absolute inset-0 opacity-[0.03] animate-ticker" style={{ backgroundImage: 'linear-gradient(90deg, transparent, white, transparent)', backgroundSize: '200% 100%' }} />
         <div className="flex gap-12 text-[7px] font-black text-slate-600 uppercase tracking-[0.6em] relative z-10">
            <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" /> Taktyki gotowe</span>
            <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Optymalizacja składu</span>
            <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Gotowi do gry</span>
         </div>
         <div className="text-[8px] font-black text-blue-500 uppercase tracking-widest relative z-10 italic">PZPN</div>
      </footer>

      {contextMenu && (
        <div
          className="fixed z-[9999] bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden py-1 min-w-[220px]"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onMouseLeave={() => setContextMenu(null)}
        >
          {contextMenu.loc === 'START' && (
            <button onClick={() => handleContextAction('captain')} className="w-full px-4 py-2.5 text-left text-[11px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-colors flex items-center gap-3">
              <span className="w-5 h-5 rounded-full bg-blue-900 border border-blue-400 flex items-center justify-center text-[9px] font-black text-white shrink-0">C</span>
              Mianuj Kapitana
            </button>
          )}
          <button onClick={() => handleContextAction('penalty')} className="w-full px-4 py-2.5 text-left text-[11px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-colors flex items-center gap-3">
            <span className="text-base">⚽</span> Wyznacz do karnych
          </button>
          <button onClick={() => handleContextAction('freekick')} className="w-full px-4 py-2.5 text-left text-[11px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-colors flex items-center gap-3">
            <span className="text-base">🎯</span> Wyznacz do wolnych
          </button>
        </div>
      )}

      {isAnalysisOpen && myClub && teamAnalysisReport && (
        <TeamAnalysisModal
          club={myClub}
          report={teamAnalysisReport}
          onClose={() => setIsAnalysisOpen(false)}
        />
      )}

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
