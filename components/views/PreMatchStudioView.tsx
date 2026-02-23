import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useGame } from '../../context/GameContext';
import { ViewState, PreMatchStudioData, PlayerPosition, Player, Club, CommentaryCategory } from '../../types';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { PreMatchStudioService } from '../../services/PreMatchStudioService';
import { TacticRepository } from '../../resources/tactics_db';
import { PlayerPresentationService } from '../../services/PlayerPresentationService';
import { KitSelectionService } from '../../services/KitSelectionService';
import { LineupService } from '../../services/LineupService';
import { AttendanceService } from '../../services/AttendanceService';

export const PreMatchStudioView: React.FC = () => {
  const { navigateTo, userTeamId, clubs, fixtures, players, lineups, currentDate, viewRefereeDetails } = useGame();
  const [data, setData] = useState<PreMatchStudioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showExpertCommentary, setShowExpertCommentary] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = async () => {
      const fixture = fixtures.find(f => 
        f.status === 'SCHEDULED' && 
        f.date.toDateString() === currentDate.toDateString() &&
        (f.homeTeamId === userTeamId || f.awayTeamId === userTeamId)
      );

      if (!fixture) {
        navigateTo(ViewState.DASHBOARD);
        return;
      }

      const home = clubs.find(c => c.id === fixture.homeTeamId)!;
      const away = clubs.find(c => c.id === fixture.awayTeamId)!;
      const hPlayers = players[home.id] || [];
      const aPlayers = players[away.id] || [];
      
      let hLineup = lineups[home.id];
      let aLineup = lineups[away.id];
      
      if (!hLineup) hLineup = LineupService.autoPickLineup(home.id, hPlayers);
      if (!aLineup) aLineup = LineupService.autoPickLineup(away.id, aPlayers);
      
      const studioData = await PreMatchStudioService.prepareStudioData(
        fixture, home, away, hLineup, aLineup, hPlayers, aPlayers
      );
      setData(studioData);
      setLoading(false);
    };

    init();
  }, [userTeamId, clubs, fixtures, players, lineups, currentDate, navigateTo]);

  const matchKits = useMemo(() => {
    if (!data) return null;
    return KitSelectionService.selectOptimalKits(data.homeClub, data.awayClub);
  }, [data]);

  
  const estimatedAttendance = useMemo(() => {
    if (!data) return 0;
    // Znajdujemy wszystkie kluby z tej samej ligi co gospodarz
    const leagueClubs = clubs.filter(c => c.leagueId === data.homeClub.leagueId);
    // Sortujemy je, żeby sprawdzić, które miejsce zajmuje gospodarz
    const sorted = [...leagueClubs].sort((a, b) => b.stats.points - a.stats.points || b.stats.goalDifference - a.stats.goalDifference);
    const homeRank = sorted.findIndex(c => c.id === data.homeClub.id) + 1;
    // Wywołujemy kalkulator frekwencji
    return AttendanceService.calculate(data.homeClub, homeRank, data.weather);
  }, [data, clubs]);

  if (loading || !data || !matchKits) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-950 text-white">
        <div className="text-center animate-pulse">
          <div className="w-20 h-20 border-t-4 border-l-4 border-blue-500 rounded-full animate-spin mx-auto mb-6 shadow-[0_0_30px_rgba(59,130,246,0.5)]"></div>
          <p className="text-2xl font-black italic uppercase tracking-tighter">Transmisja na żywo</p>
        </div>
      </div>
    );
  }

  const getJerseyUrl = (hex: string) => {
    const jerseyGallery = [
      { hex: '#ffffff', url: 'https://i.ibb.co/PvSRwngm/player1-white.jpg' },
      { hex: '#000000', url: 'https://i.ibb.co/qFLXNMXm/player1-black.jpg' },
      { hex: '#ff0000', url: 'https://i.ibb.co/1fqNVfyG/player1-red.jpg' },
      { hex: '#0000ff', url: 'https://i.ibb.co/5Xbzn6CT/player1-blue.jpg' },
      { hex: '#ffff00', url: 'https://i.ibb.co/SwxQFgnd/player1-yellow.jpg' },
      { hex: '#008000', url: 'https://i.ibb.co/nNwZ3HtH/player1-green.jpg' },
      { hex: '#ff5f1f', url: 'https://i.ibb.co/wr4sNvtp/player1-orange.jpg' },
    ];
    let bestMatch = jerseyGallery[0];
    let minDistance = Infinity;
    jerseyGallery.forEach(item => {
      const distance = KitSelectionService.getColorDistance(hex, item.hex);
      if (distance < minDistance) {
        minDistance = distance;
        bestMatch = item;
      }
    });
    return bestMatch.url;
  };

  const homeXI = data.homeLineup.startingXI.map(id => data.homePlayers.find(p => p.id === id)).filter(Boolean) as Player[];
  const awayXI = data.awayLineup.startingXI.map(id => data.awayPlayers.find(p => p.id === id)).filter(Boolean) as Player[];
  const homeBench = data.homeLineup.bench.map(id => data.homePlayers.find(p => p.id === id)).filter(Boolean) as Player[];
  const awayBench = data.awayLineup.bench.map(id => data.awayPlayers.find(p => p.id === id)).filter(Boolean) as Player[];

  const homeTactic = TacticRepository.getById(data.homeLineup.tacticId);
  const awayTactic = TacticRepository.getById(data.awayLineup.tacticId);

  const UnifiedPlayerList = ({ club, xi, bench, side }: { club: Club, xi: Player[], bench: Player[], side: 'left' | 'right' }) => (
    <div className={`w-80 shrink-0 bg-slate-900/30 rounded-[40px] border border-white/10 backdrop-blur-[1px] shadow-2xl flex flex-col overflow-hidden h-full`}>
      <div className="p-5 border-b border-white/5 bg-white/5 flex justify-between items-center">
         <span className="text-[10px] font-black uppercase text-blue-400"></span>
         <div className="flex gap-1">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: club.colorsHex[0] }} />
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: club.colorsHex[1] || club.colorsHex[0] }} />
         </div>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-1">
        {/* Starting XI Section */}
        <div className="pb-2">
          <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] mb-2 block ml-2">Jedenastka Wyjściowa</span>
          {xi.map(p => (
            <div key={p.id} className={`flex items-center gap-3 p-2 rounded-xl bg-white/[0.03] border border-white/[0.05] group hover:bg-white/[0.08] transition-all ${side === 'right' ? 'flex-row-reverse text-right' : ''}`}>
               <span className={`w-8 font-black font-mono text-[9px] ${PlayerPresentationService.getPositionColorClass(p.position)}`}>{p.position}</span>
               <span className="text-[12px] font-bold text-white uppercase italic tracking-tight truncate group-hover:text-blue-400">
                  {p.firstName} {p.lastName}
               </span>
            </div>
          ))}
        </div>
        
        {/* Bench Section */}
        <div className="pt-2 border-t border-white/5">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2 block ml-2">Rezerwowi</span>
          {bench.map(p => (
            <div key={p.id} className={`flex items-center gap-3 p-2 rounded-xl bg-black/20 opacity-60 group hover:opacity-100 transition-all ${side === 'right' ? 'flex-row-reverse text-right' : ''}`}>
               <span className="w-8 font-black font-mono text-[8px] text-slate-500">{p.position}</span>
               <span className="text-[9px] font-medium text-slate-300 uppercase truncate">
                  {p.firstName} {p.lastName}
               </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen w-full bg-slate-950 text-slate-100 flex flex-col animate-fade-in overflow-hidden relative font-sans">
      
      {/* CINEMATIC BACKGROUND */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-black">
        <div 
          className="absolute inset-0 bg-[url('https://i.ibb.co/gbVfTSxR/start-mecz.png')] bg-cover bg-center scale-100 opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/50 via-transparent to-slate-950/80" />
      </div>

      {/* HEADER SECTION */}
      <header className="relative z-20 shrink-0 w-full max-w-[1850px] mx-auto pt-6 px-6">
        <div className="bg-slate-900/30 border border-white/10 rounded-[35px] overflow-hidden shadow-2xl backdrop-blur-[1px]">
           <div className="flex items-center justify-between h-20 px-10">
              <div className="flex items-center gap-6 flex-1">
                 <div className="w-12 h-12 rounded-[15px] border-2 border-white/20 overflow-hidden flex flex-col transform -rotate-3">
                    <div style={{ backgroundColor: matchKits.home.primary }} className="flex-1" />
                    <div style={{ backgroundColor: matchKits.home.secondary }} className="flex-1" />
                 </div>
                 <div>
                    <h2 className="text-5xl font-black italic uppercase tracking-tighter text-white leading-none">{data.homeClub.name}</h2>
                    <span className="text-[11px] font-black text-blue-400 uppercase tracking-widest mt-1 block">GOSPODARZE</span>
                 </div>
              </div>

              <div className="flex flex-col items-center justify-center px-12 border-x border-white/5 bg-black/30 h-full">
                 <div className="flex items-center gap-3 mb-1">
                    <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse shadow-[0_0_10px_rgba(220,38,38,1)]" />
                    <span className="text-[13px] font-black text-white font-mono tracking-[0.4em] uppercase">STUDIO PRZEDMECZOWE</span>
                 </div>
                 <span className="text-[12px] font-black text-slate-500 uppercase tracking-widest">{currentDate.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>

              <div className="flex items-center gap-6 flex-1 justify-end text-right">
                 <div>
                    <h2 className="text-5xl font-black italic uppercase tracking-tighter text-white leading-none">{data.awayClub.name}</h2>
                    <span className="text-[11px] font-black text-emerald-400 uppercase tracking-widest mt-1 block">GOŚCIE</span>
                 </div>
                 <div className="w-12 h-12 rounded-[15px] border-2 border-white/20 overflow-hidden flex flex-col transform rotate-3">
                    <div style={{ backgroundColor: matchKits.away.primary }} className="flex-1" />
                    <div style={{ backgroundColor: matchKits.away.secondary }} className="flex-1" />
                 </div>
              </div>
           </div>
           <div className="bg-black/30 border-t border-white/5 p-2.5 px-10 flex justify-between items-center text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">
              <div className="flex gap-10">
                 <span>🏟️ {data.homeClub.stadiumName}</span>


                 <span>👥 WIDZÓW: {estimatedAttendance.toLocaleString()}</span>

                 <span>🌡️ {data.weather.tempC}°C • {data.weather.description.toUpperCase()}</span>
                 <span onClick={() => viewRefereeDetails(data.referee.id)} className="cursor-pointer hover:text-blue-400 transition-colors">⚖️ SĘDZIA: {data.referee.firstName} {data.referee.lastName}</span>
              </div>
              <div className="flex items-center gap-4">
                 <span>TRANSMISJA: HD BROADCAST 1080P</span>
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
           </div>
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <main className="relative z-10 flex-1 w-full max-w-[1850px] mx-auto flex gap-6 px-6 py-4 min-h-0">
        
        <UnifiedPlayerList club={data.homeClub} xi={homeXI} bench={homeBench} side="left" />

        {/* CENTER COLUMN */}
        <div className="flex-1 flex flex-col gap-6 items-center min-w-0">
           <div className="w-full flex items-center justify-between gap-2 animate-fade-in flex-1 min-h-0">
              <div className="relative group shrink-0 self-center -mr-20 z-20">
                 <div className="absolute -inset-4 bg-blue-500/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                 <img 
                    src={getJerseyUrl(matchKits.home.primary)} 
                    className="
      w-48 h-72 lg:w-64 lg:h-[450px] 
      object-cover rounded-[50px] 
      border-2 border-white/20 
      shadow-[0_40px_80px_rgba(0,0,0,0.7)] 
      transform perspective-[1000px] rotate-y-[12deg] -rotate-[2deg]
      group-hover:rotate-y-0 group-hover:rotate-0 
      transition-transform duration-700 
      hover:scale-[1.02] opacity-80
    "
                    style={{ boxShadow: `0 0 50px ${matchKits.home.primary}44` }}
                    alt="Star Home" 
                 />
                 <div className="absolute bottom-6 left-6 right-6 bg-slate-900/30 backdrop-blur-[1px] p-4 rounded-3xl border border-white/10 shadow-2xl">
                    <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest leading-none mb-1">KLUCZOWY ZAWODNIK</p>
                    <p className="text-xl font-black text-white italic uppercase tracking-tighter truncate">
                       {[...homeXI].sort((a,b) => b.overallRating - a.overallRating)[0]?.lastName}
                    </p>
                 </div>
              </div>

              {/* BOISKO 3D Z KOMPLETNYMI LINIAMI I OŚWIETLENIEM */}
              <div className="flex-1 max-w-[350px] flex items-center justify-center py-10" style={{ perspective: '1200px' }}>
                <div 
                  className="w-full aspect-[2/3] bg-emerald-950/50 rounded-[40px] border-[8px] border-white/10 relative shadow-[0_80px_100px_rgba(0,0,0,0.7)] overflow-hidden backdrop-blur-sm group/pitch"
                  style={{ transform: 'rotateX(25deg)', transformOrigin: 'center center' }}
                >
                  {/* Tło murawy i efekt Glass Gloss */}
                  <div className="absolute inset-0 bg-emerald-900/40" style={{ backgroundImage: 'repeating-linear-gradient(0deg, rgba(5,150,105,0.1) 0%, rgba(5,150,105,0.1) 10%, rgba(4,120,87,0.1) 10%, rgba(4,120,87,0.1) 20%)' }} />
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none z-10" />
                  
                  {/* DYNAMICZNE OŚWIETLENIE STADIONOWE */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.15),transparent_60%)] pointer-events-none z-10" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(255,255,255,0.15),transparent_60%)] pointer-events-none z-10" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.05),transparent_80%)] pointer-events-none z-10" />

                  {/* KOMPLETNE LINIE BOISKA */}
                  <div className="absolute inset-0 pointer-events-none p-4 opacity-40">
                    {/* Obwód i linia środkowa */}
                    <div className="absolute inset-4 border-2 border-white rounded-sm" />
                    <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-white -translate-y-1/2" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 border-2 border-white rounded-full" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full" />

                    {/* GÓRA (Gospodarze) */}
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[55%] h-[18%] border-2 border-white border-t-0" /> {/* Pole karne */}
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[25%] h-[7%] border-2 border-white border-t-0" /> {/* Pole bramkowe */}
                    <div className="absolute top-[22%] left-1/2 -translate-x-1/2 w-24 h-8 border-2 border-white border-t-0 rounded-b-full clip-path-arc-top" style={{ clipPath: 'inset(50% 0 0 0)' }} /> {/* Łuk */}
                    <div className="absolute top-[14%] left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full" /> {/* Punkt karny */}

                    {/* DÓŁ (Goście) */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[55%] h-[18%] border-2 border-white border-b-0" /> {/* Pole karne */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[25%] h-[7%] border-2 border-white border-b-0" /> {/* Pole bramkowe */}
                    <div className="absolute bottom-[22%] left-1/2 -translate-x-1/2 w-24 h-8 border-2 border-white border-b-0 rounded-t-full" style={{ clipPath: 'inset(0 0 50% 0)' }} /> {/* Łuk */}
                    <div className="absolute bottom-[14%] left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full" /> {/* Punkt karny */}
                  </div>

                  {/* Ikonki Gospodarzy */}
                  {homeTactic.slots.map((slot, i) => {
                    const player = homeXI[i];
                    return (
                      <div 
                        key={`h-${i}`} 
                        className="absolute w-6 h-6 rounded-full border border-white/60 shadow-2xl flex flex-col overflow-hidden transform hover:scale-125 transition-transform z-20" 
                        style={{ 
                          left: `${slot.x * 100}%`, 
                          top: `${(slot.y * 0.44 + 0.53) * 100}%`, 
                          transform: 'translate(-50%, -50%) rotateX(-25deg)',
                        }}
                      >
                        <div className="h-[80%] w-full flex items-center justify-center" style={{ backgroundColor: matchKits.home.primary }}>
                          <span className="text-[7px] font-black text-white drop-shadow-md">{player?.overallRating || '??'}</span>
                        </div>
                        <div className="h-[20%] w-full" style={{ backgroundColor: matchKits.home.secondary }} />
                      </div>
                    );
                  })}

                  {/* Ikonki Gości */}
                  {awayTactic.slots.map((slot, i) => {
                    const player = awayXI[i];
                    return (
                      <div 
                        key={`a-${i}`} 
                        className="absolute w-6 h-6 rounded-full border border-white/60 shadow-2xl flex flex-col overflow-hidden transform hover:scale-125 transition-transform z-20" 
                        style={{ 
                          left: `${slot.x * 100}%`, 
                          top: `${(0.47 - slot.y * 0.44) * 100}%`, 
                          transform: 'translate(-50%, -50%) rotateX(-25deg)',
                        }}
                      >
                        <div className="h-[80%] w-full flex items-center justify-center" style={{ backgroundColor: matchKits.away.primary }}>
                          <span className="text-[7px] font-black text-white drop-shadow-md">{player?.overallRating || '??'}</span>
                        </div>
                        <div className="h-[20%] w-full" style={{ backgroundColor: matchKits.away.secondary }} />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="relative group shrink-0 self-center -ml-20 z-20">
                 <div className="absolute -inset-4 bg-emerald-500/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                 <img 
                    src={getJerseyUrl(matchKits.away.primary)} 
                    className="
      w-48 h-72 lg:w-64 lg:h-[450px] 
      object-cover rounded-[50px] 
      border-2 border-white/20 
      shadow-[0_40px_80px_rgba(0,0,0,0.7)] 
      transform perspective-[1000px] rotate-y-[-12deg] rotate-[2deg]
      group-hover:rotate-y-0 group-hover:rotate-0 
      transition-transform duration-700 
      hover:scale-[1.02] opacity-80
    " 
                    style={{ boxShadow: `0 0 50px ${matchKits.away.primary}44` }}
                    alt="Star Away" 
                 />
                 <div className="absolute bottom-6 left-6 right-6 bg-slate-900/30 backdrop-blur-[1px] p-4 rounded-3xl border border-white/10 shadow-2xl text-right">
                    <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest leading-none mb-1">KLUCZOWY ZAWODNIK</p>
                    <p className="text-xl font-black text-white italic uppercase tracking-tighter truncate">
                       {[...awayXI].sort((a,b) => b.overallRating - a.overallRating)[0]?.lastName}
                    </p>
                 </div>
              </div>
           </div>

           <div className="w-full max-w-5xl bg-slate-900/30 rounded-[35px] border border-white/10 p-3 flex items-center justify-between backdrop-blur-[1px] shadow-2xl shrink-0 mt-auto">
              <div className="flex items-center gap-12 pl-8">
                 <div className="flex flex-col">
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mb-3 px-1">TYPY BUKMACHERÓW</span>
                    <div className="flex gap-4">
                       {[
                         { l: '1', v: data.odds?.homeWin || '2.15', c: 'text-blue-400' },
                         { l: 'X', v: data.odds?.draw || '3.40', c: 'text-slate-400' },
                         { l: '2', v: data.odds?.awayWin || '3.10', c: 'text-emerald-400' }
                       ].map(o => (
                         <div key={o.l} className="bg-black/30 px-6 py-2.5 rounded-2xl border border-white/5 flex items-center gap-4 hover:border-white/20 hover:bg-black/80 transition-all cursor-help group/bet shadow-inner">
                            <span className={`text-xs ${o.c} font-black`}>{o.l}</span>
                            <span className="text-lg font-black font-mono text-white group-hover:scale-110 transition-transform tabular-nums">{o.v}</span>
                         </div>
                       ))}
                    </div>
                 </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setShowExpertCommentary(true)}
                  className="px-10 py-8 rounded-[40px] bg-blue-600/30 border-b-8 border-blue-900 text-blue-400 font-black italic text-xl uppercase tracking-tighter transition-all hover:scale-105 active:scale-95 shadow-xl flex items-center justify-center gap-3"
                >
                  🎙️ SPRAWDŻ ANALIZĘ EKSPERTÓW
                </button>

                <button 
                   onClick={() => navigateTo(ViewState.MATCH_LIVE)}
                   className="group relative px-20 py-8 rounded-[40px] bg-white text-slate-950 font-black italic text-2xl uppercase tracking-tighter transition-all hover:scale-105 active:scale-95 shadow-[0_20px_60px_rgba(255,255,255,0.2)] border-b-8 border-slate-300 overflow-hidden animate-shimmer"
                >
                   <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                   <span className="relative z-10 flex items-center gap-6">
                      ROZPOCZNIJ MECZ <span className="text-4xl group-hover:rotate-12 transition-transform">⚽</span>
                   </span>
                </button>
              </div>
           </div>
        </div>

        <UnifiedPlayerList club={data.awayClub} xi={awayXI} bench={awayBench} side="right" />

      </main>

      {/* DEDICATED BOTTOM CONTAINER */}
      <div className="w-full h-32 bg-black/30 shrink-0 border-t border-white/5 relative z-10">
         <div className="h-full w-full max-w-[1850px] mx-auto flex items-center px-12 justify-between">
            <div className="flex gap-16">
               <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] mb-1">Status transmisji</span>
                  <span className="text-sm font-black text-emerald-400 italic uppercase">NA ŻYWO</span>
               </div>
               <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] mb-1">Sędzia Główny</span>
                  <span className="text-sm font-black text-white italic uppercase">{data.referee.firstName} {data.referee.lastName}</span>
               </div>
            </div>
            <div className="text-right">
               <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1 italic">"AKADEMIA PIŁKARSKA RKS ORZEŁ"</p>
               <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">REKLAMA</span>
            </div>
         </div>
      </div>

      {/* EXPERT COMMENTARY MODAL */}
      {showExpertCommentary && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-[1px] p-6 animate-fade-in" onClick={() => setShowExpertCommentary(false)}>
          <div className="max-w-4xl w-full bg-slate-900/30 border border-white/10 rounded-[50px] shadow-[0_50px_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col relative" onClick={e => e.stopPropagation()}>
            <div className="p-10 border-b border-white/5 bg-white/5 flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-black italic text-white uppercase tracking-tighter">Analiza Przedmeczowa</h2>
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] mt-1">Transmisja ze Studia Telewizyjnego</p>
              </div>
              <button onClick={() => setShowExpertCommentary(false)} className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-red-500/20 hover:text-red-500 transition-all text-3xl font-light">&times;</button>
            </div>
            <div className="flex-1 overflow-y-auto p-10 max-h-[70vh] custom-scrollbar space-y-8">
              {data.studioTranscript.map((line, idx) => (
                <div key={idx} className="flex gap-6 animate-slide-up" style={{ animationDelay: `${idx * 0.1}s` }}>
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-900 border-2 border-blue-400 flex items-center justify-center font-black text-2xl text-white italic shadow-lg shrink-0">
                    {line.speaker.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xs font-black text-blue-400 uppercase tracking-widest">{line.speaker}</span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest border border-white/10 px-2 rounded-full">{line.category}</span>
                    </div>
                    <p className="text-lg text-slate-200 italic font-medium leading-relaxed">"{line.text}"</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-8 bg-black/30 border-t border-white/5 text-center">
              <button onClick={() => setShowExpertCommentary(false)} className="px-12 py-4 bg-white text-slate-900 font-black italic uppercase tracking-widest text-xs rounded-2xl hover:scale-105 transition-all active:scale-95 shadow-xl">Zamknij Studio</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
        
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 1.2s cubic-bezier(0.16, 1, 0.3, 1); }

        @keyframes slide-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-slide-up { animation: slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

        @keyframes shimmer {
          0% { transform: translateX(-100%) skewX(-15deg); }
          100% { transform: translateX(250%) skewX(-15deg); }
        }
        .animate-shimmer::after {
          content: '';
          position: absolute;
          top: 0; left: 0; width: 40%; height: 100%;
          background: linear-gradient(to right, transparent, rgba(255,255,255,0.4), transparent);
          animation: shimmer 3s infinite linear;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
};
