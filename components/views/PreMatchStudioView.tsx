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

// Import lokalnych zdjęć piłkarzy
import { getPlayerCardImage } from '../../resources/PlayerCardAssets';
import { getClubLogo } from '../../resources/ClubLogoAssets';
import bojo2Pitch from '../../Graphic/themes/bojo2.png';

// Import lokalnego tła
import startMecz from '../../Graphic/themes/start-mecz.png';

// Zwraca kolor tekstu (secondary lub biały/czarny) zapewniający kontrast z tłem
const getContrastTextColor = (bgHex: string, secondaryHex: string): string => {
  const parse = (hex: string) => {
    const h = hex.replace('#', '');
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return { r, g, b };
  };
  const luminance = ({ r, g, b }: { r: number; g: number; b: number }) =>
    0.299 * r + 0.587 * g + 0.114 * b;
  const bgLum = luminance(parse(bgHex));
  const secLum = luminance(parse(secondaryHex));
  const diff = Math.abs(bgLum - secLum);
  if (diff > 60) return secondaryHex;
  return bgLum > 128 ? '#000000' : '#ffffff';
};

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
        fixture, home, away, hLineup, aLineup, hPlayers, aPlayers, clubs
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

  const getJerseyUrl = (clubId: string, hex: string) => getPlayerCardImage(clubId, hex);

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
          className="absolute inset-0 bg-cover bg-center scale-100 opacity-20"
          style={{ backgroundImage: `url(${startMecz})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/50 via-transparent to-slate-950/80" />
      </div>

      {/* HEADER SECTION */}
      <header className="relative z-20 shrink-0 w-full max-w-[1850px] mx-auto pt-6 px-6">
        <div className="bg-slate-900/30 border border-white/10 rounded-[35px] shadow-2xl backdrop-blur-[1px]">
           <div className="flex items-center justify-between h-20 px-10">
              <div className="flex items-center flex-1">
                 <div className="relative z-10 shrink-0 -mr-6">
                   {getClubLogo(data.homeClub.id) ? (
                     <img src={getClubLogo(data.homeClub.id)} alt={data.homeClub.name} className="w-[115px] h-[115px] object-contain transform -rotate-6 drop-shadow-2xl opacity-80" />
                   ) : (
                     <div className="w-12 h-12 rounded-[15px] border-2 border-white/20 overflow-hidden flex flex-col transform -rotate-3">
                       <div style={{ backgroundColor: matchKits.home.primary }} className="flex-1" />
                       <div style={{ backgroundColor: matchKits.home.secondary }} className="flex-1" />
                     </div>
                   )}
                 </div>
                 <div className="relative z-0 pl-8">
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

              <div className="flex items-center flex-1 justify-end text-right">
                 <div className="relative z-0 pr-8">
                    <h2 className="text-5xl font-black italic uppercase tracking-tighter text-white leading-none">{data.awayClub.name}</h2>
                    <span className="text-[11px] font-black text-emerald-400 uppercase tracking-widest mt-1 block">GOŚCIE</span>
                 </div>
                 <div className="relative z-10 shrink-0 -ml-6">
                   {getClubLogo(data.awayClub.id) ? (
                     <img src={getClubLogo(data.awayClub.id)} alt={data.awayClub.name} className="w-[115px] h-[115px] object-contain transform rotate-6 drop-shadow-2xl opacity-80" />
                   ) : (
                     <div className="w-12 h-12 rounded-[15px] border-2 border-white/20 overflow-hidden flex flex-col transform rotate-3">
                       <div style={{ backgroundColor: matchKits.away.primary }} className="flex-1" />
                       <div style={{ backgroundColor: matchKits.away.secondary }} className="flex-1" />
                     </div>
                   )}
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
                    src={getJerseyUrl(data.homeClub.id, matchKits.home.primary)} 
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
                  className="w-full aspect-[2/3] rounded-none relative shadow-[0_80px_100px_rgba(0,0,0,0.7)] overflow-visible group/pitch opacity-80"
                  style={{ transform: 'rotateX(25deg)', transformOrigin: 'center center' }}
                >
                  {/* Grafika boiska */}
                  <img src={bojo2Pitch} alt="boisko" className="absolute inset-0 w-full h-full object-fill" style={{ transform: 'scale(1.15, 1.035)' }} />

                  {/* Ikonki Gospodarzy */}
                  {homeTactic.slots.map((slot, i) => {
                    const player = homeXI[i];
                    return (
                      <div 
                        key={`h-${i}`} 
                        className="absolute w-[29px] h-[29px] rounded-full border border-white/60 shadow-2xl flex flex-col overflow-hidden transform hover:scale-125 transition-transform z-20" 
                        style={{ 
                          left: `${slot.x * 100}%`, 
                          top: `calc(${(slot.y * 0.44 + 0.53) * 100}% - ${slot.role === PlayerPosition.FWD ? 50 : slot.role === PlayerPosition.MID ? 25 : slot.role === PlayerPosition.GK ? -5 : 15}px)`, 
                          transform: 'translate(-50%, -50%)',
                          WebkitFontSmoothing: 'antialiased',
                        }}
                      >
                        <div className="h-[80%] w-full flex items-center justify-center" style={{ backgroundColor: matchKits.home.primary }}>
                          <span className="text-[7px] font-black" style={{ color: getContrastTextColor(matchKits.home.primary, matchKits.home.secondary) }}>{player?.overallRating || '??'}</span>
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
                          top: `calc(${(0.47 - slot.y * 0.44) * 100}% - 10px)`, 
                          transform: 'translate(-50%, -50%)',
                          WebkitFontSmoothing: 'antialiased',
                        }}
                      >
                        <div className="h-[80%] w-full flex items-center justify-center" style={{ backgroundColor: matchKits.away.primary }}>
                          <span className="text-[7px] font-black" style={{ color: getContrastTextColor(matchKits.away.primary, matchKits.away.secondary) }}>{player?.overallRating || '??'}</span>
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
                    src={getJerseyUrl(data.awayClub.id, matchKits.away.primary)} 
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

           {/* PANEL PRZYCISKÓW */}
           <div className="w-full max-w-5xl bg-slate-900/30 rounded-[35px] border border-white/10 p-4 flex items-center justify-center gap-4 backdrop-blur-[1px] shadow-2xl shrink-0">
              <button
                onClick={() => setShowExpertCommentary(true)}
                className="flex-1 px-10 py-8 rounded-[40px] bg-blue-600/30 border-b-8 border-blue-900 text-blue-400 font-black italic text-xl uppercase tracking-tighter transition-all hover:scale-105 active:scale-95 shadow-xl flex items-center justify-center gap-3"
              >
                🎙️ ANALIZA EKSPERTÓW
              </button>
              <button
                onClick={() => navigateTo(ViewState.MATCH_LIVE)}
                className="group relative flex-1 px-10 py-8 rounded-[40px] bg-white text-slate-950 font-black italic text-xl uppercase tracking-tighter transition-all hover:scale-105 active:scale-95 shadow-[0_20px_60px_rgba(255,255,255,0.2)] border-b-8 border-slate-300 overflow-hidden animate-shimmer"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative z-10 flex items-center justify-center gap-3">
                  ROZPOCZNIJ MECZ <span className="text-2xl group-hover:rotate-12 transition-transform">⚽</span>
                </span>
              </button>
              <button
                onClick={() => navigateTo(ViewState.SQUAD_VIEW)}
                className="flex-1 px-10 py-8 rounded-[40px] bg-emerald-600/30 border-b-8 border-emerald-900 text-emerald-400 font-black italic text-xl uppercase tracking-tighter transition-all hover:scale-105 active:scale-95 shadow-xl flex items-center justify-center gap-3"
              >
                ✏️ ZMIEŃ SKŁAD
              </button>
           </div>

           {/* PANEL TYPY BUKMACHERÓW */}
           <div className="w-full max-w-5xl bg-slate-900/30 rounded-[35px] border border-white/10 py-3 px-8 flex items-center justify-center gap-4 backdrop-blur-[1px] shadow-2xl shrink-0">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mr-4">TYPY BUKMACHERÓW</span>
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
