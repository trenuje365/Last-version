
import React, { useState, useMemo, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { ViewState, MatchHistoryEntry, MatchEventType, CompetitionType } from '../../types';
import { MatchHistoryService } from '../../services/MatchHistoryService';
import { ChampionshipHistoryService } from '../../data/championship_history';

export const MatchHistoryView: React.FC = () => {
  const { navigateTo, clubs, seasonNumber, supercupWinners } = useGame();
  const [selectedLeague, setSelectedLeague] = useState<string>('ALL');
  const [selectedSeason, setSelectedSeason] = useState<number>(seasonNumber);
  const [selectedMatch, setSelectedMatch] = useState<MatchHistoryEntry | null>(null);
  const [viewMode, setViewMode] = useState<'matches' | 'champions'>('matches');
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const history = useMemo(() => MatchHistoryService.getAll(), [refreshTrigger]);
  const championshipHistory = useMemo(() => ChampionshipHistoryService.getAll(), [refreshTrigger, supercupWinners]);

  // Odśwież dane gdy komponent się montuje
  useEffect(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  // Odśwież dane gdy przełączamy na widok zwycięzców
  useEffect(() => {
    if (viewMode === 'champions') {
      setRefreshTrigger(prev => prev + 1);
    }
  }, [viewMode]);

  // Odśwież dane gdy zmienią się supercupWinners
  useEffect(() => {
    setRefreshTrigger(prev => prev + 1);
  }, [supercupWinners]);
  
  const groupedHistory = useMemo(() => {
    const base = history.filter(m => {
      const matchSeason = m.season === selectedSeason;
      if (selectedLeague === 'ALL') return matchSeason;
      
  // Superpuchar i Puchar Polski pod jednym filtrem pucharowym
      if (selectedLeague === 'POLISH_CUP') {
        return matchSeason && (
          m.competition.includes('CUP') || 
          m.competition.includes('PUCHAR') || 
          m.competition.includes('SUPER')
        );
      }
      
      return matchSeason && m.competition === selectedLeague;
    });
    
    const groups: { label: string, matches: MatchHistoryEntry[] }[] = [];
    const map = new Map<string, MatchHistoryEntry[]>();

    const newestFirst = [...base].reverse();

    newestFirst.forEach(m => {
      const key = `${m.competition}_${m.date}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    });

   map.forEach((matches, key) => {
  let compName = 'NIEZNANE ROZGRYWKI';

  const comp = matches[0].competition;

  if (comp.includes('L_PL_1')) compName = 'EKSTRAKLASA';
  else if (comp.includes('L_PL_2')) compName = '1. LIGA';
  else if (comp.includes('L_PL_3')) compName = '2. LIGA';
  else if (comp === CompetitionType.POLISH_CUP || comp.includes('POLISH_CUP') || comp.includes('CUP')) {
    compName = 'PUCHAR POLSKI';
  } else if (comp === CompetitionType.SUPER_CUP || comp.includes('SUPER_CUP')) {
    compName = 'SUPERPUCHAR POLSKI';
  }

  // Dodaj datę do labelu (opcjonalnie, ale czytelniej)
  groups.push({
    label: `${compName} • ${matches[0].date}`,
    matches
  });
});

    return groups; 
  }, [history, selectedLeague]);

  const getClub = (id: string) => clubs.find(c => c.id === id);

  return (
    <div className="h-[calc(100vh-3rem)] max-w-[1400px] mx-auto flex flex-col gap-4 animate-fade-in text-white">
      {/* HEADER */}
      <div className="flex items-center justify-between px-8 py-5 bg-white/5 rounded-[32px] border border-white/10 backdrop-blur-3xl shrink-0 shadow-2xl">
        <div className="flex items-center gap-6">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl shadow-inner">📜</div>
          <div>
            <h1 className="text-3xl font-black italic uppercase tracking-tighter">Historia wyników</h1>
            <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em]">ARCHIWUM ROZGRYWEK</p>
          </div>
        </div>
        <button 
          onClick={() => navigateTo(ViewState.DASHBOARD)} 
          className="px-8 py-3 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all active:scale-95"
        >
          &larr; Wyjdź
        </button>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        {/* SIDEBAR FILTERS */}
        <div className="w-64 flex flex-col gap-3 shrink-0 bg-slate-900/40 rounded-[35px] border border-white/5 p-6 backdrop-blur-xl">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] mb-2 px-2">Kategorie</span>
            <button 
              onClick={() => { setViewMode('champions'); setSelectedLeague('ALL'); }} 
              className={`flex items-center gap-4 px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border
                ${viewMode === 'champions' 
                  ? 'bg-yellow-600 border-yellow-400 text-white shadow-lg translate-x-2' 
                  : 'bg-white/5 border-transparent text-slate-500 hover:bg-white/10 hover:text-slate-300'}`}
            >
              <span className="text-lg opacity-60">👑</span>
              ZWYCIĘZCY
            </button>
            {viewMode === 'matches' && [
              { id: 'ALL', label: 'WSZYSTKO', icon: '🌍' },
              { id: 'L_PL_1', label: 'EKSTRAKLASA', icon: '🏆' },
              { id: 'L_PL_2', label: '1. LIGA', icon: '🥈' },
              { id: 'L_PL_3', label: '2. LIGA', icon: '🥉' },
              { id: 'POLISH_CUP', label: 'PUCHAR POLSKI', icon: '🛡️' }
            ].map(l => (
              <button 
                key={l.id} 
                onClick={() => { setViewMode('matches'); setSelectedLeague(l.id); }} 
                className={`flex items-center gap-4 px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border
                  ${selectedLeague === l.id && viewMode === 'matches'
                    ? 'bg-blue-600 border-blue-400 text-white shadow-lg translate-x-2' 
                    : 'bg-white/5 border-transparent text-slate-500 hover:bg-white/10 hover:text-slate-300'}`}
              >
                <span className="text-lg opacity-60">{l.icon}</span>
                {l.label}
              </button>
            ))}

            <div className="mt-auto p-4 bg-black/20 rounded-2xl border border-white/5">
               <span className="text-[8px] font-bold text-slate-600 uppercase block mb-1">{viewMode === 'matches' ? 'Statystyka' : 'Historia'}</span>
               <span className="text-xl font-black italic text-white">{viewMode === 'matches' ? history.length : championshipHistory.length} <span className="text-[10px] opacity-40">{viewMode === 'matches' ? 'MECZÓW' : 'WPISÓW'}</span></span>
            </div>
        </div>

        {/* MATCH LIST */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-900/20 rounded-[40px] border border-white/5 backdrop-blur-md">
          {viewMode === 'matches' ? (
            <>
              <div className="px-8 pt-8 flex gap-4">
                 {Array.from({length: seasonNumber}, (_, i) => i + 1).map(s => (
                   <button 
                     key={s}
                     onClick={() => setSelectedSeason(s)}
                     className={`px-6 py-2 rounded-xl text-[10px] font-black transition-all ${selectedSeason === s ? 'bg-white text-black' : 'bg-white/5 text-slate-500'}`}
                   >
                     SEZON {s}
                   </button>
                 ))}
              </div>
              <div className="p-8 space-y-10">
                {groupedHistory.length > 0 ? groupedHistory.map((group, gIdx) => (
              <div key={gIdx} className="space-y-4">
                <div className="flex items-center gap-6 px-4">
                  <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.5em] whitespace-nowrap">{group.label}</span>
                  <div className="h-px bg-white/5 flex-1" />
                  <span className="text-[10px] font-mono text-slate-600 italic uppercase">{group.matches[0].date}</span>
                </div>
                
                <div className="grid grid-cols-1 gap-3">
                  {group.matches.map((m, i) => {
                    const home = getClub(m.homeTeamId);
                    const away = getClub(m.awayTeamId);
                    return (
                      <div 
                        key={i} 
                        onClick={() => setSelectedMatch(m)} 
                        className={`group relative p-5 bg-slate-900/40 rounded-3xl border border-white/5 hover:border-white/20 cursor-pointer flex justify-between items-center transition-all duration-300
                          ${selectedMatch?.matchId === m.matchId ? 'ring-2 ring-blue-500 bg-blue-900/20 shadow-2xl scale-[1.01]' : 'hover:scale-[1.005]'}`}
                      >
                        <div className="flex-1 flex justify-center items-center gap-8">
                          <div className="flex items-center gap-4 w-56 justify-end">
                             <span className="truncate uppercase italic font-black text-sm text-slate-300 group-hover:text-white transition-colors">{home?.name || 'Nieznany'}</span>
                             <div className="w-2 h-8 rounded-full shadow-lg shrink-0" style={{ backgroundColor: home?.colorsHex[0] || '#ccc' }} />
                          </div>
                          
                          <div className="bg-black/60 px-6 py-3 rounded-2xl text-emerald-400 font-mono text-xl shadow-inner min-w-[100px] text-center border border-white/10 group-hover:border-blue-500/30 transition-all tabular-nums">
  {m.homeScore} <span className="text-slate-700 mx-1">:</span> {m.awayScore}
  {m.homePenaltyScore !== undefined ? (
    <span className="text-[9px] block text-rose-500 mt-1 font-black uppercase tracking-tighter">
      k. {m.homePenaltyScore}:{m.awayPenaltyScore}
    </span>
  ) : m.goals.some(g => g.minute > 95) ? (
    <span className="text-[9px] block text-yellow-500 mt-1 font-black uppercase tracking-tighter">
      po dogr.
    </span>
  ) : null}
</div>

                          <div className="flex items-center gap-4 w-56 justify-start">
                             <div className="w-2 h-8 rounded-full shadow-lg shrink-0" style={{ backgroundColor: away?.colorsHex[0] || '#ccc' }} />
                             <span className="truncate uppercase italic font-black text-sm text-slate-300 group-hover:text-white transition-colors">{away?.name || 'Nieznany'}</span>
                          </div>
                        </div>

                        <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1">
                           <span className="text-blue-500 text-xl">→</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )) : (
                <div className="h-64 flex flex-col items-center justify-center opacity-20">
                 <span className="text-8xl mb-6">🏜️</span>
                 <p className="text-xl font-black uppercase tracking-[0.4em] italic text-center">Brak rozegranych meczów</p>
              </div>
            )}
              </div>
            </>
          ) : (
            // CHAMPIONS VIEW
            <div className="p-8 space-y-12">
              {/* EKSTRAKLASA */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">🏆</span>
                  <h3 className="text-lg font-black uppercase tracking-wider italic text-white">EKSTRAKLASA</h3>
                </div>
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/40">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-blue-600/20 border-b border-white/5">
                        <th className="px-6 py-3 text-left text-xs font-black text-white uppercase tracking-widest">Sezon</th>
                        <th className="px-6 py-3 text-left text-xs font-black text-white uppercase tracking-widest">Zwycięzca</th>
                        <th className="px-6 py-3 text-left text-xs font-black text-white uppercase tracking-widest">II Miejsce</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ChampionshipHistoryService.getByCompetition('EKSTRAKLASA').map((entry, idx) => (
                        <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="px-6 py-3 text-sm font-black text-slate-300">{entry.season}</td>
                          <td className="px-6 py-3 text-sm font-black text-yellow-400">{entry.winner}</td>
                          <td className="px-6 py-3 text-sm font-black text-slate-400">{entry.runnerUp}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* PUCHAR POLSKI */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">🛡️</span>
                  <h3 className="text-lg font-black uppercase tracking-wider italic text-white">PUCHAR POLSKI</h3>
                </div>
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/40">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-purple-600/20 border-b border-white/5">
                        <th className="px-6 py-3 text-left text-xs font-black text-white uppercase tracking-widest">Sezon</th>
                        <th className="px-6 py-3 text-left text-xs font-black text-white uppercase tracking-widest">Zdobywca</th>
                      </tr>
                    </thead>
                    <tbody>
                      {championshipHistory.filter(c => c.competition === 'PUCHAR_POLSKI').sort((a, b) => b.year - a.year).map((entry, idx) => (
                        <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="px-6 py-3 text-sm font-black text-slate-300">{entry.season}</td>
                          <td className="px-6 py-3 text-sm font-black text-yellow-400">{entry.winner}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SUPERPUCHAR POLSKI */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">⚡</span>
                  <h3 className="text-lg font-black uppercase tracking-wider italic text-white">SUPERPUCHAR POLSKI</h3>
                </div>
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/40">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-yellow-600/20 border-b border-white/5">
                        <th className="px-6 py-3 text-left text-xs font-black text-white uppercase tracking-widest">Sezon</th>
                        <th className="px-6 py-3 text-left text-xs font-black text-white uppercase tracking-widest">Zwycięzca</th>
                      </tr>
                    </thead>
                    <tbody>
                      {supercupWinners.sort((a, b) => b.year - a.year).map((entry, idx) => (
                        <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="px-6 py-3 text-sm font-black text-slate-300">{entry.season}</td>
                          <td className="px-6 py-3 text-sm font-black text-yellow-400">{entry.winner}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* LIGA MISTRZÓW */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">🌟</span>
                  <h3 className="text-lg font-black uppercase tracking-wider italic text-white">LIGA MISTRZÓW UEFA</h3>
                </div>
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/40">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-indigo-600/20 border-b border-white/5">
                        <th className="px-6 py-3 text-left text-xs font-black text-white uppercase tracking-widest">Sezon</th>
                        <th className="px-6 py-3 text-left text-xs font-black text-white uppercase tracking-widest">Zwycięzca</th>
                      </tr>
                    </thead>
                    <tbody>
                      {championshipHistory.filter(c => c.competition === 'LIGA_MISTRZOW').sort((a, b) => b.year - a.year).map((entry, idx) => (
                        <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="px-6 py-3 text-sm font-black text-slate-300">{entry.season}</td>
                          <td className="px-6 py-3 text-sm font-black text-yellow-400">{entry.winner}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
      </div>

      </div>

      {/* DETAIL MODAL */}
      {selectedMatch && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/95 backdrop-blur-xl p-6 animate-fade-in" onClick={() => setSelectedMatch(null)}>
           <div className="max-w-2xl w-full bg-slate-900 border border-white/10 rounded-[50px] shadow-[0_50px_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col relative" onClick={e => e.stopPropagation()}>
              
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent" />

              <div className="p-8 bg-white/5 border-b border-white/5 flex items-center justify-between">
                 <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-2xl">📝</div>
                    <div>
                       <h2 className="text-2xl font-black italic uppercase text-white tracking-tighter">Raport Meczowy</h2>
                       <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{selectedMatch.competition.replace('L_PL_', 'LIGA ')} • {selectedMatch.date}</p>
                    </div>
                 </div>
                 <button onClick={() => setSelectedMatch(null)} className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-red-500/20 hover:text-red-500 transition-all text-2xl font-light">&times;</button>
              </div>

              <div className="p-12 flex items-center justify-between bg-black/40 relative">
                 <div className="flex-1 text-center font-black italic text-xl uppercase text-white leading-tight drop-shadow-lg">{getClub(selectedMatch.homeTeamId)?.name}</div>
                 
                 
                 <div className="px-12 py-6 bg-slate-800 rounded-[35px] border border-white/10 text-6xl font-black font-mono text-white shadow-2xl mx-8 tabular-nums">
                    {selectedMatch.homeScore}:{selectedMatch.awayScore}
                 </div>
                 <div className="flex-1 text-center font-black italic text-xl uppercase text-white leading-tight drop-shadow-lg">{getClub(selectedMatch.awayTeamId)?.name}</div>
              </div>
 {/* TUTAJ WSTAW TEN KOD */}
              {selectedMatch.attendance && (
                <div className="px-10 py-4 bg-emerald-500/5 border-b border-white/5 flex justify-between items-center group">
                   <div className="flex items-center gap-3">
                      <span className="text-xl group-hover:scale-110 transition-transform">🏟️</span>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Oficjalna frekwencja:</span>
                   </div>
                   <span className="text-sm font-black text-emerald-400 font-mono tabular-nums italic">
                      {selectedMatch.attendance.toLocaleString()} WIDZÓW
                   </span>
                </div>
              )}
              {/* KONIEC KODU DO WSTAWIENIA */}
              <div className="flex-1 overflow-y-auto p-10 custom-scrollbar space-y-6">
                 {(() => {
                    const allEvents = [
                       ...selectedMatch.goals.map(g => ({ ...g, type: 'GOAL' })),
                       ...selectedMatch.cards.map(c => ({ ...c, type: c.type }))
                    ].sort((a, b) => a.minute - b.minute);

                    if (allEvents.length === 0) return <div className="text-center py-20 opacity-20 italic font-black uppercase tracking-widest">Brak kluczowych zdarzeń</div>;

                    const groups: Record<number, any[]> = {};
                    allEvents.forEach(ev => {
                       if (!groups[ev.minute]) groups[ev.minute] = [];
                       groups[ev.minute].push(ev);
                    });

                    return Object.entries(groups)
                      .sort((a,b) => Number(a[0]) - Number(b[0]))
                      .map(([minute, eventsInMin]) => (
                        <div key={minute} className="grid grid-cols-[1fr_80px_1fr] items-center gap-6 group mb-4">
                           {/* Lewa strona (Gospodarze) */}
                           <div className="text-right space-y-2">
                              {eventsInMin.filter(e => e.teamId === selectedMatch.homeTeamId).map((ev, idx) => (
                                 <div key={idx} className="flex items-center justify-end gap-4 animate-slide-right">
                                    <div className="flex flex-col">
                                       <span className="text-sm font-black text-white uppercase italic tracking-tighter">{ev.playerName}</span>
                                       {ev.type === 'SECOND_YELLOW' && <span className="text-[8px] text-red-500 font-black uppercase">Druga żółta</span>}
                                       {ev.type === 'GOAL' && (ev as any).isPenalty && <span className="text-[8px] text-rose-500 font-black uppercase">Rzut karny</span>}
                                    </div>
                                    <span className="text-2xl drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
                                       {ev.type === 'GOAL' ? '⚽' : (ev.type === 'YELLOW' ? '🟨' : '🟥')}
                                    </span>
                                 </div>
                              ))}
                           </div>

                           {/* Centrum */}
                           <div className="flex justify-center self-start pt-1">
                              <div className="w-12 h-10 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center font-black font-mono text-xs text-blue-400 shadow-inner group-hover:border-blue-500 transition-colors">
                                {minute}'
                              </div>
                           </div>

                           {/* Prawa strona (Goście) */}
                           <div className="text-left space-y-2">
                              {eventsInMin.filter(e => e.teamId === selectedMatch.awayTeamId).map((ev, idx) => (
                                 <div key={idx} className="flex items-center justify-start gap-4 animate-slide-left">
                                    <span className="text-2xl drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
                                       {ev.type === 'GOAL' ? '⚽' : (ev.type === 'YELLOW' ? '🟨' : '🟥')}
                                    </span>
                                    <div className="flex flex-col">
                                       <span className="text-sm font-black text-white uppercase italic tracking-tighter">{ev.playerName}</span>
                                       {ev.type === 'SECOND_YELLOW' && <span className="text-[8px] text-red-500 font-black uppercase">Druga żółta</span>}
                                       {ev.type === 'GOAL' && (ev as any).isPenalty && <span className="text-[8px] text-rose-500 font-black uppercase">Rzut karny</span>}
                                    </div>
                                 </div>
                              ))}
                           </div>
                        </div>
                    ));
                 })()}
              </div>

              <div className="p-8 bg-black/60 border-t border-white/5 text-center shrink-0">
                 <button 
                  onClick={() => setSelectedMatch(null)} 
                  className="px-16 py-4 bg-white text-slate-900 font-black italic uppercase tracking-widest rounded-2xl text-xs hover:scale-105 transition-all shadow-xl active:scale-95"
                 >
                    Zamknij raport
                 </button>
              </div>
           </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slide-left { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes slide-right { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
        .animate-slide-left { animation: slide-left 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-slide-right { animation: slide-right 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
      `}</style>
    </div>
  );
};
