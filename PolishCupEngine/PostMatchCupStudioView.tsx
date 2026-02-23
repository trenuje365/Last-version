
import React, { useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { ViewState, MatchEventType, CompetitionType } from '../types';
import { KitSelectionService } from '../services/KitSelectionService';
import { PostMatchCommentSelector } from './PostMatchCommentSelector';

const GLASS_CARD = "bg-slate-950/40 backdrop-blur-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-[40px] relative overflow-hidden";
const GLOSS_LAYER = "absolute inset-0 bg-gradient-to-br from-white/[0.05] via-transparent to-transparent pointer-events-none";

export const PostMatchCupStudioView: React.FC = () => {
  const { lastMatchSummary, navigateTo, processBackgroundCupMatches, jumpToNextEvent, players } = useGame();

  if (!lastMatchSummary) return null;

  const { 
    homeClub, awayClub, homeScore, awayScore, homeStats, awayStats, 
    homeGoals, awayGoals, homePenaltyScore, awayPenaltyScore,
    timeline, matchId
  } = lastMatchSummary;

  const isSuperCup = matchId.includes('SUPER_CUP');
  const isFinal = matchId.includes('FINAŁ');
  const isDraw = homeScore === awayScore;
  
  // ZASTĄP TEN KOD (Poprawiona logika detekcji karnych i dogrywki)
  const isPenalties = isDraw && homePenaltyScore !== undefined && (homePenaltyScore > 0 || awayPenaltyScore! > 0);
  const isExtraTime = timeline.some(e => e.minute > 90) || isDraw;
  // KONIEC ZMIANY

  // 1. Logika Rundy
  const roundLabel = useMemo(() => {
    if (isSuperCup) return "SUPERPUCHAR POLSKI";
    if (isFinal) return "WIELKI FINAŁ PUCHARU POLSKI";
    const parts = matchId.split('_');
    const round = parts.find(p => p.includes('/') || p.match(/^\d+$/));
    return round ? `PUCHAR POLSKI: ${round.toUpperCase()}` : "PUCHAR POLSKI";
  }, [matchId, isSuperCup, isFinal]);

  // 2. Logika Zwycięzcy (ZASTĄP TEN KOD - Poprawiona hierarchia zwycięstwa)
  const winner = useMemo(() => {
    if (homeScore > awayScore) return homeClub;
    if (awayScore > homeScore) return awayClub;
    // Remis - decydują rzuty karne
    return (homePenaltyScore || 0) > (awayPenaltyScore || 0) ? homeClub : awayClub;
  }, [homeScore, awayScore, homePenaltyScore, awayPenaltyScore, homeClub, awayClub]);
  // KONIEC ZMIANY

  // 3. Kolory pasków (Collision Detection)
  const kitTheme = useMemo(() => {
    const hCol = homeClub.colorsHex[0];
    let aCol = awayClub.colorsHex[0];
    const distance = KitSelectionService.getColorDistance(hCol, aCol);
    if (distance < 180) aCol = awayClub.colorsHex[1] || '#475569';
    return { home: hCol, away: aCol };
  }, [homeClub, awayClub]);

  const handleReturn = () => {
    if (isSuperCup) {
       jumpToNextEvent();
       navigateTo(ViewState.DASHBOARD);
    } else {
       processBackgroundCupMatches();
       navigateTo(ViewState.SCORE_RESULTS_POLISH_CUP);
    }
  };

  const formatPlayerName = (name: string, playerId: string) => {
    if (name.includes('.')) return name; // Już sformatowane przez silnik
    // Próbujemy wyciągnąć imię z globalnej bazy
    const clubId = playerId.split('_')[1] + '_' + (playerId.split('_')[2] || '');
    const pObj = (players[clubId] || []).find(px => px.id === playerId);
    const initial = pObj ? pObj.firstName.charAt(0) : name.charAt(0);
    return `${initial}. ${name}`;
  };

  const EventList = ({ side }: { side: 'HOME' | 'AWAY' }) => {
    // ZASTĄP TEN KOD (Łączenie timeline z GoalTickerInfo dla pewności wyświetlania strzelców)
    const goals = side === 'HOME' ? homeGoals : awayGoals;
    const sideEvents = [...timeline.filter(e => e.teamSide === side)];
    
    // Dodajemy gole z tickerów, jeśli pucharowy silnik ich nie wrzucił do timeline
    goals.forEach(g => {
      const alreadyIn = sideEvents.some(e => e.minute === g.minute && (e.type === MatchEventType.GOAL || e.type === MatchEventType.PENALTY_SCORED));
      if (!alreadyIn && !g.isMiss) {
        sideEvents.push({
          minute: g.minute,
          type: g.isPenalty ? MatchEventType.PENALTY_SCORED : MatchEventType.GOAL,
          playerName: g.playerName,
          teamSide: side,
          playerId: (g as any).playerId || ''
        } as any);
      }
    });

    sideEvents.sort((a, b) => a.minute - b.minute);
    if (sideEvents.length === 0) return null;
    // KONIEC ZMIANY

    return (
      <div className={`space-y-2 ${side === 'AWAY' ? 'text-left' : 'text-right'}`}>
        {sideEvents.map((ev, i) => {
          let icon = "•";
          let color = "text-slate-400";
          let suffix = "";

          if (ev.type === MatchEventType.GOAL || ev.type === MatchEventType.PENALTY_SCORED) {
             icon = "⚽"; color = "text-white";
             if (ev.type === MatchEventType.PENALTY_SCORED) suffix = " (k.)";
          } else if (ev.type === MatchEventType.YELLOW_CARD) {
             icon = "🟨"; color = "text-amber-500";
          } else if (ev.type === MatchEventType.RED_CARD) {
             icon = "🟥"; color = "text-red-500";
          } else if (ev.type === MatchEventType.INJURY_SEVERE || ev.type === MatchEventType.INJURY_LIGHT) {
             icon = "✚"; color = ev.type === MatchEventType.INJURY_SEVERE ? "text-red-600 font-bold" : "text-slate-300";
          }

          return (
            <div key={i} className={`flex items-center gap-3 ${side === 'HOME' ? 'flex-row-reverse' : 'flex-row'}`}>
               <span className={`text-[11px] font-black uppercase italic tracking-tighter ${color}`}>
                  {formatPlayerName(ev.playerName, (ev as any).playerId || '')} {ev.minute}'{suffix}
               </span>
               <span className="text-sm">{icon}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const ThickStatBar = ({ label, h, a }: { label: string, h: number, a: number }) => {
    const total = h + a || 1;
    const hPerc = (h / total) * 100;
    return (
      <div className="w-full relative group">
        <div className="h-10 w-full bg-white/5 backdrop-blur-md rounded-2xl overflow-hidden flex border border-white/10 shadow-inner relative">
          {/* Home Bar */}
          <div 
            className="h-full transition-all duration-1000 flex items-center pl-4" 
            style={{ width: `${hPerc}%`, backgroundColor: `${kitTheme.home}66` }} 
          >
             <span className="text-[11px] font-black text-white drop-shadow-md z-10">{h}</span>
          </div>
          
          {/* Center Label Overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 italic drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
               {label}
             </span>
          </div>

          {/* Away Bar */}
          <div 
            className="h-full transition-all duration-1000 flex items-center justify-end pr-4" 
            style={{ width: `${100 - hPerc}%`, backgroundColor: `${kitTheme.away}66` }} 
          >
             <span className="text-[11px] font-black text-white drop-shadow-md z-10">{a}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen w-full bg-slate-950 flex flex-col items-center p-8 relative overflow-hidden">
      
      {/* 1. BACKGROUND ENGINE */}
      <div className="fixed inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-40 blur-[2px] scale-105" 
          style={{ backgroundImage: `url('https://i.ibb.co/fdSSvHLz/stadion.jpg')` }} 
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/20 to-slate-950" />
      </div>

      <div className="relative z-10 w-full max-w-[1600px] h-full flex flex-col gap-6 animate-fade-in">
        
        {/* 2. ROUND HERO HEADER */}
        <div className="text-center shrink-0 py-4">
           <h1 className="text-6xl md:text-8xl font-black italic text-white/10 uppercase tracking-[0.2em] leading-none select-none">
              {roundLabel}
           </h1>
        </div>

        {/* 3. SCORE CENTRAL UNIT */}
        <div className={`${GLASS_CARD} p-12 shrink-0 mt-[-40px]`}>
           <div className={GLOSS_LAYER} />
           <div className="flex items-center justify-between relative z-10">
              {/* Home */}
              <div className="flex-1 flex flex-col items-end gap-2">
                 <h2 className="text-4xl font-black italic text-white uppercase tracking-tighter text-right">{homeClub.name}</h2>
                 <div className="flex gap-2">
                    <div className="w-1.5 h-6" style={{ backgroundColor: homeClub.colorsHex[0] }} />
                    <div className="w-1.5 h-6" style={{ backgroundColor: homeClub.colorsHex[1] || homeClub.colorsHex[0] }} />
                 </div>
              </div>

              {/* Score Box */}
              <div className="flex flex-col items-center gap-4 px-16">
                 <div className="bg-black/60 px-12 py-6 rounded-[35px] border-x-4 border-rose-600 text-8xl font-black font-mono text-white shadow-2xl tracking-tighter tabular-nums">
                    {homeScore}<span className="text-rose-600 mx-2">:</span>{awayScore}
                 </div>
                 
                 <div className="flex flex-col items-center gap-2">
                    {isExtraTime && (
                       <span className="px-4 py-1 bg-amber-500/20 text-amber-500 border border-amber-500/30 rounded-full text-[10px] font-black uppercase tracking-widest">
                          {isPenalties ? `KARNE ${homePenaltyScore}:${awayPenaltyScore}` : 'PO DOGRYWCE'}
                       </span>
                    )}
                    <div className="bg-emerald-500 text-black px-8 py-1.5 rounded-full font-black uppercase italic tracking-widest text-xs shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                       ZWYCIĘZCA: {winner.name}
                    </div>
                 </div>
              </div>

              {/* Away */}
              <div className="flex-1 flex flex-col items-start gap-2">
                 <h2 className="text-4xl font-black italic text-white uppercase tracking-tighter text-left">{awayClub.name}</h2>
                 <div className="flex gap-2">
                    <div className="w-1.5 h-6" style={{ backgroundColor: awayClub.colorsHex[0] }} />
                    <div className="w-1.5 h-6" style={{ backgroundColor: awayClub.colorsHex[1] || awayClub.colorsHex[0] }} />
                 </div>
              </div>
           </div>

           <div className="mt-8 text-center border-t border-white/5 pt-6 relative z-10">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] flex items-center justify-center gap-4">
                 <span className="text-lg">🏟️</span> 
                 { (isFinal || isSuperCup) ? "PGE NARODOWY, WARSZAWA" : homeClub.stadiumName.toUpperCase() }
              </span>
           </div>
        </div>

        {/* 4. DETAILS GRID */}
        <div className="flex-1 flex gap-6 min-h-0">
           {/* Left Events */}
           <div className={`${GLASS_CARD} w-80 p-8 flex flex-col shrink-0`}>
              <div className={GLOSS_LAYER} />
              <h3 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.4em] mb-6">RAPORT GOSPODARZY</h3>
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                 <EventList side="HOME" />
              </div>
           </div>

           {/* Central Stats */}
           <div className={`${GLASS_CARD} flex-1 p-12 flex flex-col justify-center gap-6`}>
              <div className={GLOSS_LAYER} />
              <ThickStatBar label="Posiadanie Piłki (%)" h={Math.round(homeStats.possession)} a={Math.round(awayStats.possession)} />
              <ThickStatBar label="Strzały Celne" h={homeStats.shotsOnTarget} a={awayStats.shotsOnTarget} />
              <ThickStatBar label="Rzuty Rożne" h={homeStats.corners} a={awayStats.corners} />
              <ThickStatBar label="Przewinienia" h={homeStats.fouls} a={awayStats.fouls} />
           </div>

           {/* Right Events */}
           <div className={`${GLASS_CARD} w-80 p-8 flex flex-col shrink-0`}>
              <div className={GLOSS_LAYER} />
              <h3 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.4em] mb-6">RAPORT GOŚCI</h3>
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                 <EventList side="AWAY" />
              </div>
           </div>
        </div>

        {/* 5. EXPERT & FOOTER */}
        <div className="h-44 shrink-0 flex gap-6">
           <div className={`${GLASS_CARD} flex-1 p-8 flex items-center gap-10`}>
              <div className={GLOSS_LAYER} />
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-emerald-600 to-emerald-900 border-2 border-emerald-400 flex items-center justify-center font-black text-3xl text-white italic shadow-lg shrink-0">H</div>
              <div className="relative">
                 <span className="text-rose-500 text-5xl font-serif absolute -left-8 -top-6 opacity-30">"</span>
                 <p className="text-lg text-slate-200 italic font-medium leading-relaxed">
                   {PostMatchCommentSelector.selectComment(lastMatchSummary)}
                 </p>
                 <span className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mt-4">Analiza: Tomasz Hajto • Studio Pucharowe</span>
              </div>
           </div>

           <button 
             onClick={handleReturn}
             className="w-80 bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 text-white font-black italic uppercase tracking-[0.2em] text-xl rounded-[40px] transition-all hover:scale-105 active:scale-95 shadow-2xl flex items-center justify-center gap-4"
           >
              DALEJ 🏁
           </button>
        </div>

      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        @keyframes fade-in { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
};
