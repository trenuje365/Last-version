import React, { useState, useEffect, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { ViewState, PreMatchStudioData, Player, Club, PlayerPosition } from '../types';
import { PreMatchStudioService } from '../services/PreMatchStudioService';
import { TacticRepository } from '../resources/tactics_db';
import { PlayerPresentationService } from '../services/PlayerPresentationService';
import { KitSelectionService } from '../services/KitSelectionService';
import { PolandWeatherService } from '../services/PolandWeatherService';

export const PreMatchCupStudioView: React.FC = () => {
  const { 
    navigateTo, 
    userTeamId, 
    clubs, 
    fixtures, 
    players, 
    lineups, 
    currentDate, 
    viewRefereeDetails,
    nextEvent 
  } = useGame();

  const [data, setData] = useState<PreMatchStudioData | null>(null);
  const [loading, setLoading] = useState(true);

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
      const hLineup = lineups[home.id]!;
      const aLineup = lineups[away.id]!;

      const studioData = await PreMatchStudioService.prepareStudioData(
        fixture, home, away, hLineup, aLineup, hPlayers, aPlayers
      );
      
      const seasonalWeather = PolandWeatherService.getWeather(currentDate, fixture.id);
      setData({ ...studioData, weather: seasonalWeather });
      setLoading(false);
    };

    init();
  }, [userTeamId, clubs, fixtures, players, lineups, currentDate, navigateTo]);

  const roundTitle = useMemo(() => {
    if (!nextEvent) return "WALKA O AWANS";
    const label = nextEvent.label;
    if (label.toLowerCase().includes("superpuchar")) return "SUPERPUCHAR POLSKI";
    if (label.includes("1/64")) return "1/64 PUCHARU POLSKI";
    if (label.includes("1/32")) return "1/32 PUCHARU POLSKI";
    if (label.includes("1/16")) return "1/16 PUCHARU POLSKI";
    if (label.includes("1/8")) return "1/8 PUCHARU POLSKI";
    if (label.includes("1/4")) return "ĆWIERĆFINAŁ PUCHARU POLSKI";
    if (label.includes("1/2")) return "PÓŁFINAŁ PUCHARU POLSKI";
    if (label.includes("FINAŁ")) return "FINAŁ PUCHARU POLSKI";
    return label.toUpperCase();
  }, [nextEvent]);

  const matchKits = useMemo(() => {
    if (!data) return null;
    return KitSelectionService.selectOptimalKits(data.homeClub, data.awayClub);
  }, [data]);

  const squadDetails = useMemo(() => {
    if (!data) return null;
    const hXI = data.homeLineup.startingXI.map(id => data.homePlayers.find(p => p.id === id)).filter(Boolean) as Player[];
    const aXI = data.awayLineup.startingXI.map(id => data.awayPlayers.find(p => p.id === id)).filter(Boolean) as Player[];
    const hBench = data.homeLineup.bench.map(id => data.homePlayers.find(p => p.id === id)).filter(Boolean) as Player[];
    const aBench = data.awayLineup.bench.map(id => data.awayPlayers.find(p => p.id === id)).filter(Boolean) as Player[];

    const getLineStrength = (squad: Player[], pos: string) => {
      const filtered = squad.filter(p => p.position === pos);
      if (filtered.length === 0) return 50;
      return Math.round(filtered.reduce((acc, p) => acc + p.overallRating, 0) / filtered.length);
    };

    const hStats = { def: getLineStrength(hXI, 'DEF'), mid: getLineStrength(hXI, 'MID'), att: getLineStrength(hXI, 'FWD') };
    const aStats = { def: getLineStrength(aXI, 'DEF'), mid: getLineStrength(aXI, 'MID'), att: getLineStrength(aXI, 'FWD') };

    const hAvg = Math.round(hXI.reduce((acc, p) => acc + p.overallRating, 0) / hXI.length);
    const aAvg = Math.round(aXI.reduce((acc, p) => acc + p.overallRating, 0) / aXI.length);

    return { hXI, aXI, hBench, aBench, hStats, aStats, hAvg, aAvg };
  }, [data]);

  const bettingData = useMemo(() => {
    if (!data || !squadDetails) return null;
    const { hAvg, aAvg, hStats, aStats } = squadDetails;
   const hRep = data.homeClub.reputation;
    const aRep = data.awayClub.reputation;

    // -> tutaj wstaw kod
    const getTierVal = (cid: string) => {
      const c = clubs.find(x => x.id === cid);
      if (c?.leagueId.includes('L_PL_1')) return 1;
      if (c?.leagueId.includes('L_PL_2')) return 2;
      if (c?.leagueId.includes('L_PL_3')) return 3;
      return 4;
    };
    const tierGap = Math.abs(getTierVal(data.homeClub.id) - getTierVal(data.awayClub.id));
    const tierMod = tierGap >= 3 ? 2.8 : tierGap === 2 ? 1.8 : tierGap === 1 ? 1.3 : 1.0;

    // Formuła Wykładnicza: Jakość rośnie nieliniowo
    let hPower = Math.pow(hAvg + hRep, 2.6) * (getTierVal(data.homeClub.id) < getTierVal(data.awayClub.id) ? tierMod : 1);
    let aPower = Math.pow(aAvg + aRep, 2.6) * (getTierVal(data.awayClub.id) < getTierVal(data.homeClub.id) ? tierMod : 1);
    
    if (!data.fixture.id.includes("FINAŁ")) hPower *= 1.15; // Bonus domowy w potędze
    // KONIEC

    // DODATKOWO: Sprawdzamy przewagę w formacjach (Atak/Pomoc/Obrona)
    // Jeśli AI ma lepszą każdą formację, musi dostać dodatkowy boost do siły
    if (aStats.att > hStats.att) aPower += 2;
    if (aStats.mid > hStats.mid) aPower += 2;
    if (aStats.def > hStats.def) aPower += 2;
    const total = hPower + aPower;
    let hProb = (hPower / total) * 100;
    let aProb = (aPower / total) * 100;
    let dProb = 25; 
    const scale = 75 / (hProb + aProb);
    hProb *= scale;
    aProb *= scale;
    const odds1 = (100 / hProb).toFixed(2);
    const oddsX = (100 / dProb).toFixed(2);
    const odds2 = (100 / aProb).toFixed(2);
    return { odds1, oddsX, odds2, hProb, dProb, aProb };
  }, [data, squadDetails]);

  const estimatedAttendance = useMemo(() => {
    if (!data) return 0;
    const base = data.homeClub.stadiumCapacity * (0.65 + (data.homeClub.reputation / 28));
    const weatherPenalty = data.weather.description.toLowerCase().includes('deszcz') ? 0.85 : 1.0;
    const variation = 0.95 + (Math.random() * 0.1);
    return Math.floor(Math.min(data.homeClub.stadiumCapacity, base * weatherPenalty * variation));
  }, [data]);

  if (loading || !data || !matchKits || !squadDetails || !bettingData) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-950 text-white font-black uppercase italic tracking-tighter">
        Inicjalizacja Systemów Pucharowych...
      </div>
    );
  }

  const formatPlayerName = (p: Player) => `${p.firstName.charAt(0)}. ${p.lastName}`;

  // -> ZASTĄP TEN KOD (Inteligentne mapowanie kolorów na zdjęcia koszulek)
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
      // Używamy profesjonalnej metody dystansu barwnego z KitSelectionService
      const distance = KitSelectionService.getColorDistance(hex, item.hex);
      if (distance < minDistance) {
        minDistance = distance;
        bestMatch = item;
      }
    });

    return bestMatch.url;
  };

  return (
    <div className="h-screen w-full text-slate-100 flex flex-col p-6 animate-fade-in overflow-hidden relative selection:bg-rose-500">

      <div className="fixed inset-0 z-[-1] bg-slate-950 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[url('https://i.ibb.co/mCvsmhwf/puchar-Polski2.png')] bg-cover bg-center scale-110 opacity-70 mix-blend-luminosity" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/80 to-slate-950" />
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-rose-600/10 blur-[150px] animate-pulse" />
      </div>

      <header className="relative mb-8 shrink-0 w-full max-w-[1600px] mx-auto">
        <div className="bg-slate-900/60 border border-white/10 rounded-[40px] overflow-hidden shadow-2xl backdrop-blur-3xl">
           <div className="flex items-stretch justify-between h-20">
              <div className="flex-1 flex items-center justify-start gap-8 px-12">
                 <div className="w-12 h-12 rounded-2xl border-2 border-white/10 overflow-hidden flex flex-col shadow-2xl transform -rotate-3" style={{ backgroundColor: matchKits.home.primary }}>
                    <div style={{ backgroundColor: matchKits.home.secondary }} className="flex-1" />
                 </div>
                 <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white drop-shadow-md">{data.homeClub.name}</h2>
              </div>
              <div className="px-16 flex flex-col justify-center items-center border-x border-white/5 bg-rose-950/20 relative">
                 <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-rose-600 animate-pulse shadow-[0_0_10px_rgba(225,29,72,1)]" />
                    <span className="text-xs font-black text-white font-mono tracking-[0.3em] uppercase">PUCHAR POLSKI LIVE</span>
                 </div>
                 <div className="h-1 w-24 bg-rose-500 rounded-full shadow-[0_0_15px_rgba(225,29,72,0.5)]" />
              </div>
              <div className="flex-1 flex items-center justify-end gap-8 px-12">
                 <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white text-right drop-shadow-md">{data.awayClub.name}</h2>
                 <div className="w-12 h-12 rounded-2xl border-2 border-white/10 overflow-hidden flex flex-col shadow-2xl transform rotate-3" style={{ backgroundColor: matchKits.away.primary }}>
                    <div style={{ backgroundColor: matchKits.away.secondary }} className="flex-1" />
                 </div>
              </div>
           </div>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center gap-12 max-w-[1600px] mx-auto w-full min-h-0">
        <div className="w-72 bg-slate-900/40 rounded-[35px] border border-white/5 p-6 backdrop-blur-2xl flex flex-col gap-4 overflow-hidden">
           <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">SKŁAD</h4>
           <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
             {squadDetails.hXI.map(p => (
               <div key={p.id} className="flex items-center gap-3 py-1.5 border-b border-white/[0.02]">
                 <span className={`font-mono font-black text-[9px] w-6 ${PlayerPresentationService.getPositionColorClass(p.position)}`}>{p.position}</span>
                 <span className="text-xs font-bold text-white uppercase italic truncate">{formatPlayerName(p)}</span>
               </div>
             ))}
             <div className="mt-4 pt-4 border-t border-white/5 space-y-1">
                <h5 className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-2 text-center opacity-50">Rezerwowi</h5>
                {squadDetails.hBench.map(p => (
                  <div key={p.id} className="flex items-center gap-3 py-1 opacity-50 hover:opacity-100 transition-opacity">
                    <span className="font-mono text-[8px] w-6 text-slate-500">{p.position}</span>
                    <span className="text-[10px] font-medium text-slate-400 uppercase truncate">{formatPlayerName(p)}</span>
                  </div>
                ))}
             </div>
           </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center gap-6">
           <div className="flex items-center justify-center gap-12 w-full max-w-3xl animate-slide-up">
              <div className="relative group">
                 <div className="absolute inset-0 bg-rose-600/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                 <img src={getJerseyUrl(matchKits.home.primary)} alt="Home" className="w-44 h-64 object-cover rounded-3xl border-2 border-white/10 shadow-2xl relative z-10 transform -rotate-2" />
              </div>
              <div className="flex-1 space-y-6">
                 {[
                   { label: 'OBRONA', h: squadDetails.hStats.def, a: squadDetails.aStats.def },
                   { label: 'POMOC', h: squadDetails.hStats.mid, a: squadDetails.aStats.mid },
                   { label: 'ATAK', h: squadDetails.hStats.att, a: squadDetails.aStats.att }
                 ].map(stat => (
                    <div key={stat.label} className="space-y-1.5">
                       <div className="flex justify-between px-1">
                          <span className="text-[10px] font-black text-white italic">{stat.h}</span>
                          <span className="text-[8px] font-black text-slate-500 tracking-widest">{stat.label}</span>
                          <span className="text-[10px] font-black text-white italic">{stat.a}</span>
                       </div>
                       <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden flex p-0.5 border border-white/5">
                          <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${(stat.h / (stat.h + stat.a)) * 100}%`, backgroundColor: matchKits.home.primary }} />
                          <div className="flex-1" />
                          <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${(stat.a / (stat.h + stat.a)) * 100}%`, backgroundColor: matchKits.away.primary }} />
                       </div>
                    </div>
                 ))}
              </div>
              <div className="relative group">
                 <div className="absolute inset-0 bg-blue-600/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                 <img src={getJerseyUrl(matchKits.away.primary)} alt="Away" className="w-44 h-64 object-cover rounded-3xl border-2 border-white/10 shadow-2xl relative z-10 transform rotate-2" />
              </div>
           </div>

           <div className="text-center space-y-2">
              <span className="text-rose-500 font-black uppercase tracking-[0.5em] text-[10px] block">STUDIO PRZEDMECZOWE</span>
              <h3 className="text-5xl font-black italic text-white uppercase tracking-tighter leading-none">{roundTitle}</h3>
           </div>

           <button onClick={() => navigateTo(ViewState.MATCH_LIVE_CUP)} className="group relative px-20 py-5 rounded-[30px] bg-rose-600 hover:bg-rose-500 text-white font-black italic text-xl uppercase tracking-tighter transition-all hover:scale-105 active:scale-95 shadow-[0_20px_60px_rgba(225,29,72,0.3)] border-b-8 border-rose-800">ROZPOCZNIJ MECZ 🏆</button>

           <div className="flex items-stretch justify-center gap-4 w-full max-w-4xl animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <div className="bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-center flex-1">
                 <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Pogoda</span>
                 <div className="flex items-center justify-center gap-3">
                    <span className="text-2xl">{data.weather.description.toLowerCase().includes('deszcz') ? '🌧️' : '☀️'}</span>
                    <span className="text-lg font-black text-white italic uppercase">{data.weather.tempC}°C</span>
                 </div>
              </div>
              <div className="bg-black/40 border border-white/10 rounded-2xl px-8 py-4 text-center flex-[2]">
                 <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Miejsce Rozegrania</span>
                 <span className="text-lg font-black text-white italic uppercase truncate block">{(nextEvent?.label.includes("FINAŁ") || nextEvent?.label.toUpperCase().includes("SUPERPUCHAR")) ? "PGE Narodowy, Warszawa" : data.homeClub.stadiumName}</span>
              </div>
              <div className="bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-center flex-1">
                 <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Widzowie</span>
                 <div className="flex items-center justify-center gap-3">
                    <span className="text-2xl">🏟️</span>
                    <span className="text-lg font-black text-white italic">{estimatedAttendance.toLocaleString()}</span>
                 </div>
              </div>
           </div>

           <div className="w-full max-w-4xl space-y-4 animate-slide-up" style={{ animationDelay: '0.6s' }}>
              <div className="flex items-stretch justify-center gap-4">
                 {[
                   { label: '1', rate: bettingData.odds1 },
                   { label: 'X', rate: bettingData.oddsX },
                   { label: '2', rate: bettingData.odds2 }
                 ].map((bet, i) => (
                    <div key={i} className="bg-slate-900/60 border border-white/10 rounded-2xl px-6 py-4 flex-1 flex flex-col items-center justify-center group hover:bg-slate-800 transition-all cursor-default">
                       <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">TYP {bet.label}</span>
                       <span className="text-2xl font-black text-white italic tabular-nums group-hover:text-emerald-400 transition-colors">{bet.rate}</span>
                    </div>
                 ))}
              </div>
              
              <div className="space-y-1.5">
                 <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden flex p-0.5 border border-white/5 shadow-inner">
                    <div className="h-full rounded-l-full transition-all duration-1000 shadow-[0_0_10px_rgba(0,0,0,0.5)]" style={{ width: `${bettingData.hProb}%`, backgroundColor: matchKits.home.primary }} />
                    <div className="h-full transition-all duration-1000 bg-slate-700/50" style={{ width: `${bettingData.dProb}%` }} />
                    <div className="h-full rounded-r-full transition-all duration-1000 shadow-[0_0_10px_rgba(0,0,0,0.5)]" style={{ width: `${bettingData.aProb}%`, backgroundColor: matchKits.away.primary }} />
                 </div>
                 <div className="flex justify-between px-2">
                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Szanse Gospodarzy ({Math.round(bettingData.hProb)}%)</span>
                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Remis ({Math.round(bettingData.dProb)}%)</span>
                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Szanse Gości ({Math.round(bettingData.aProb)}%)</span>
                 </div>
              </div>
           </div>
        </div>

        <div className="w-72 bg-slate-900/40 rounded-[35px] border border-white/5 p-6 backdrop-blur-2xl flex flex-col gap-4 overflow-hidden">
           <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">SKŁAD</h4>
           <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 text-right">
             {squadDetails.aXI.map(p => (
               <div key={p.id} className="flex items-center gap-3 py-1.5 border-b border-white/[0.02] flex-row-reverse">
                 <span className={`font-mono font-black text-[9px] w-6 ${PlayerPresentationService.getPositionColorClass(p.position)}`}>{p.position}</span>
                 <span className="text-xs font-bold text-white uppercase italic truncate">{formatPlayerName(p)}</span>
               </div>
             ))}
             <div className="mt-4 pt-4 border-t border-white/5 space-y-1">
                <h5 className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-2 text-center opacity-50">Rezerwowi</h5>
                {squadDetails.aBench.map(p => (
                  <div key={p.id} className="flex items-center gap-3 py-1 flex-row-reverse opacity-50 hover:opacity-100 transition-opacity">
                    <span className="font-mono text-[8px] w-6 text-slate-500">{p.position}</span>
                    <span className="text-[10px] font-medium text-slate-400 uppercase truncate">{formatPlayerName(p)}</span>
                  </div>
                ))}
             </div>
           </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 1s ease-out forwards; }
        @keyframes slide-up { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-slide-up { animation: slide-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
};
