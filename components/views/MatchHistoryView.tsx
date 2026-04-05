
import React, { useState, useMemo, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { ViewState, MatchHistoryEntry, MatchEventType, CompetitionType } from '../../types';
import { MatchHistoryService } from '../../services/MatchHistoryService';
import { ChampionshipHistoryService } from '../../data/championship_history';
import historiaBg from '../../Graphic/themes/historia.png';


export const MatchHistoryView: React.FC = () => {
  const { navigateTo, clubs, nationalTeams, seasonNumber, supercupWinners } = useGame();
  const [selectedLeague, setSelectedLeague] = useState<string>('ALL');
  const [selectedSeason, setSelectedSeason] = useState<number>(seasonNumber);
  const [selectedMatch, setSelectedMatch] = useState<MatchHistoryEntry | null>(null);
  const [viewMode, setViewMode] = useState<'matches' | 'champions'>('matches');
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const history = useMemo(() => MatchHistoryService.getAll(), [refreshTrigger]);
  const championshipHistory = useMemo(() => ChampionshipHistoryService.getAll(), [refreshTrigger, supercupWinners]);
  
  // SUPERPUCHAR POLSKI - ostatni mecz turnieju
  const supercupWinnersFromMatches = useMemo(() => {
    const supercupMatches = history.filter(m => 
      m.competition.includes('SUPER') &&
      m.homeScore !== null
    );
    
    const winners: Record<string, any> = {};
    supercupMatches.forEach(match => {
      let winnerId: string | null = null;
      
      if (match.homeScore > match.awayScore) {
        winnerId = match.homeTeamId;
      } else if (match.awayScore > match.homeScore) {
        winnerId = match.awayTeamId;
      } else if (match.homePenaltyScore !== undefined && match.awayPenaltyScore !== undefined) {
        winnerId = match.homePenaltyScore > match.awayPenaltyScore ? match.homeTeamId : match.awayTeamId;
      }
      
      if (winnerId) {
        const winnerClub = clubs.find(c => c.id === winnerId);
        if (winnerClub) {
          const date = new Date(match.date);
          const month = date.getMonth();
          const year = date.getFullYear();
          const seasonStart = month >= 6 ? year : year - 1;
          const seasonKey = `${seasonStart}/${seasonStart + 1}`;
          
          winners[seasonKey] = {
            season: seasonKey,
            winner: winnerClub.name,
            year: seasonStart + 1
          };
        }
      }
    });
    
    const result = Object.values(winners);
    console.log('⚡ Superpuchar winners:', result);
    return result;
  }, [history, clubs]);

  // EKSTRAKLASA - Zwycięzca sezonu z localStorage
  const ekstraklasaWinner = useMemo(() => {
    try {
      const stored = localStorage?.getItem('fm_championship_history');
      const history = stored ? JSON.parse(stored) : [];
      const winners = history
        .filter((c: any) => c.competition === 'EKSTRAKLASA')
        .sort((a: any, b: any) => b.year - a.year);
      console.log('🥇 Ekstraklasa winners:', winners);
      return winners;
    } catch (e) {
      console.error('Failed to load Ekstraklasa winners:', e);
      return [];
    }
  }, [refreshTrigger]);

  // PUCHAR POLSKI - Ostatni mecz (finał)
  const pucharWinner = useMemo(() => {
    const cupMatches = history.filter(m => 
      m.competition.includes('PUCHAR') && 
      !m.competition.includes('SUPER') &&
      m.homeScore !== null
    );
    
    const winners: Record<string, any> = {};
    cupMatches.forEach(match => {
      let winnerId: string | null = null;
      
      if (match.homeScore > match.awayScore) {
        winnerId = match.homeTeamId;
      } else if (match.awayScore > match.homeScore) {
        winnerId = match.awayTeamId;
      } else if (match.homePenaltyScore !== undefined && match.awayPenaltyScore !== undefined) {
        winnerId = match.homePenaltyScore > match.awayPenaltyScore ? match.homeTeamId : match.awayTeamId;
      }
      
      if (winnerId) {
        const winnerClub = clubs.find(c => c.id === winnerId);
        if (winnerClub) {
          const date = new Date(match.date);
          const month = date.getMonth();
          const year = date.getFullYear();
          const seasonStart = month >= 6 ? year : year - 1;
          const seasonKey = `${seasonStart}/${seasonStart + 1}`;
          
          winners[seasonKey] = {
            season: seasonKey,
            winner: winnerClub.name,
            year: seasonStart + 1
          };
        }
      }
    });
    
    const result = Object.values(winners);
    console.log('🏆 Puchar Polski winners:', result);
    return result;
  }, [history, clubs]);

  // LIGA MISTRZÓW - Finał (ostatni mecz CL_FINAL)
  const clWinner = useMemo(() => {
    const clMatches = history.filter(m => 
      m.competition.includes('LIGA_MISTRZOW') || m.competition.includes('FINAL') &&
      m.homeScore !== null
    );
    
    const winners: Record<string, any> = {};
    clMatches.forEach(match => {
      let winnerId: string | null = null;
      let runnerId: string | null = null;
      
      if (match.homeScore > match.awayScore) {
        winnerId = match.homeTeamId;
        runnerId = match.awayTeamId;
      } else if (match.awayScore > match.homeScore) {
        winnerId = match.awayTeamId;
        runnerId = match.homeTeamId;
      } else if (match.homePenaltyScore !== undefined && match.awayPenaltyScore !== undefined) {
        winnerId = match.homePenaltyScore > match.awayPenaltyScore ? match.homeTeamId : match.awayTeamId;
        runnerId = match.homePenaltyScore > match.awayPenaltyScore ? match.awayTeamId : match.homeTeamId;
      }
      
      if (winnerId && runnerId) {
        const winnerClub = clubs.find(c => c.id === winnerId);
        const runnerClub = clubs.find(c => c.id === runnerId);
        
        if (winnerClub && runnerClub) {
          const date = new Date(match.date);
          const year = date.getFullYear();
          const seasonStart = year;
          const seasonKey = `${seasonStart}/${seasonStart + 1}`;
          
          winners[seasonKey] = {
            season: seasonKey,
            winner: winnerClub.name,
            runnerUp: runnerClub.name,
            year: seasonStart + 1
          };
        }
      }
    });
    
    const result = Object.values(winners).sort((a, b) => b.year - a.year);
    console.log('⭐ Liga Mistrzów:', result);
    return result;
  }, [history, clubs]);

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
      
      if (selectedLeague === 'CL') return matchSeason && m.competition.startsWith('CL_');
      if (selectedLeague === 'EL') return matchSeason && m.competition.startsWith('EL_');
      if (selectedLeague === 'CONF') return matchSeason && m.competition.startsWith('CONF_');
      if (selectedLeague === 'NT') return matchSeason && (nationalTeams.some(t => t.id === m.homeTeamId) || nationalTeams.some(t => t.id === m.awayTeamId));

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
  } else if (comp.startsWith('CL_')) compName = 'LIGA MISTRZÓW';
  else if (comp.startsWith('EL_')) compName = 'LIGA EUROPY';
  else if (comp.startsWith('CONF_')) compName = 'LIGA KONFERENCJI';
  else if (nationalTeams.some(t => t.id === matches[0].homeTeamId) || nationalTeams.some(t => t.id === matches[0].awayTeamId)) compName = comp;

  // Dodaj datę do labelu (opcjonalnie, ale czytelniej)
  groups.push({
    label: `${compName} • ${matches[0].date}`,
    matches
  });
});

    return groups; 
  }, [history, selectedLeague]);

  const getClub = (id: string) => clubs.find(c => c.id === id) || nationalTeams.find(t => t.id === id);

  return (
    <>
    <div className="fixed inset-0 -z-10">
      <div className="absolute inset-0 bg-cover bg-center scale-105" style={{ backgroundImage: `url(${historiaBg})` }} />
      <div className="absolute inset-0 bg-black/85" />
    </div>
    <div className="h-[calc(100vh-3rem)] max-w-[1400px] mx-auto flex flex-col gap-4 animate-fade-in text-white">
      {/* HEADER */}
      <div className="relative flex items-center justify-between px-8 py-5 bg-white/5 rounded-[32px] border border-white/10 shrink-0 shadow-2xl">
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

      <div className="relative flex-1 flex gap-6 min-h-0">
        {/* SIDEBAR FILTERS */}
        <div className="w-64 flex flex-col gap-3 shrink-0 bg-slate-900/20 rounded-[35px] border border-white/5 p-6">
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
              { id: 'POLISH_CUP', label: 'PUCHAR POLSKI', icon: '🛡️' },
              { id: 'CL', label: 'LIGA MISTRZÓW', icon: '⭐' },
              { id: 'EL', label: 'PUCHAR LIGI EUROPY', icon: '🟠' },
              { id: 'CONF', label: 'PUCHAR LIGI KONFERENCJI', icon: '🟢' },
              { id: 'NT', label: 'MECZE MIĘDZYNARODOWE', icon: '🌐' }
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
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-900/10 rounded-[40px] border border-white/5">
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
                      {ekstraklasaWinner.map((entry, idx) => (
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
                      {pucharWinner.sort((a, b) => b.year - a.year).map((entry, idx) => (
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
                      {supercupWinnersFromMatches.sort((a, b) => b.year - a.year).map((entry, idx) => (
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
                        <th className="px-6 py-3 text-left text-xs font-black text-white uppercase tracking-widest">Finalista</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clWinner.sort((a, b) => b.year - a.year).map((entry, idx) => (
                        <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="px-6 py-3 text-sm font-black text-slate-300">{entry.season}</td>
                          <td className="px-6 py-3 text-sm font-black text-yellow-400">{entry.winner}</td>
                          <td className="px-6 py-3 text-sm font-black text-slate-400">{entry.runner || '-'}</td>
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
      {selectedMatch && (() => {
        const homeClub = getClub(selectedMatch.homeTeamId);
        const awayClub = getClub(selectedMatch.awayTeamId);
        return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-md p-6 animate-fade-in" onClick={() => setSelectedMatch(null)}>
           <div className="max-w-6xl w-full border border-white/15 rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden relative" onClick={e => e.stopPropagation()} style={{ background: `linear-gradient(135deg, ${homeClub?.colorsHex?.[0] ?? '#0f172a'}33 0%, #0f172a 40%, #0f172a 60%, ${awayClub?.colorsHex?.[0] ?? '#0f172a'}33 100%)` }}>
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] via-transparent to-transparent pointer-events-none" />

              {/* Nagłówek */}
              <div className="pt-8 px-8 pb-0 text-center">
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">{selectedMatch.competition.replace('L_PL_', 'LIGA ')}</p>
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 mt-0.5">{selectedMatch.date}</p>
              </div>

              {/* Karta meczu */}
              <div className="px-8 py-6">

                 {/* Meta-bar */}
                 <div className="mb-4 flex items-center justify-between text-[10px] font-black uppercase tracking-wider">
                    <div className="flex gap-6 text-slate-400">
                       <span>Stadion: <span className="text-white">{homeClub?.stadiumName}</span></span>
                       {selectedMatch.attendance && <span>Widzów: <span className="text-white">{selectedMatch.attendance.toLocaleString('pl-PL')}</span></span>}
                    </div>
                    {selectedMatch.refereeName && (
                      <span className="text-slate-400">Sędzia: <span className="text-white">{selectedMatch.refereeName}</span></span>
                    )}
                 </div>

                 {/* Drużyny + wynik */}
                 <div className="flex items-center justify-between">
                    <div className="flex-1 flex items-center justify-end gap-3">
                       <span className="font-black italic uppercase tracking-tighter text-2xl text-white leading-tight text-right">{homeClub?.name}</span>
                       {homeClub?.logoFile
                         ? <img src={new URL(`../../Graphic/logo/${homeClub.logoFile}`, import.meta.url).href} alt="" className="w-10 h-10 object-contain shrink-0" />
                         : <div className="w-10 h-10 rounded-xl border border-white/10 flex flex-col overflow-hidden shrink-0">
                             <div className="flex-1" style={{ backgroundColor: homeClub?.colorsHex[0] }} />
                             <div className="flex-1" style={{ backgroundColor: homeClub?.colorsHex[1] || homeClub?.colorsHex[0] }} />
                           </div>
                       }
                    </div>
                    <div className="flex items-center gap-2 mx-8 min-w-[120px] justify-center">
                       <span className="text-2xl font-black tabular-nums text-white">{selectedMatch.homeScore}</span>
                       <span className="text-slate-500 text-xl font-black">:</span>
                       <span className="text-2xl font-black tabular-nums text-white">{selectedMatch.awayScore}</span>
                    </div>
                    <div className="flex-1 flex items-center justify-start gap-3">
                       {awayClub?.logoFile
                         ? <img src={new URL(`../../Graphic/logo/${awayClub.logoFile}`, import.meta.url).href} alt="" className="w-10 h-10 object-contain shrink-0" />
                         : <div className="w-10 h-10 rounded-xl border border-white/10 flex flex-col overflow-hidden shrink-0">
                             <div className="flex-1" style={{ backgroundColor: awayClub?.colorsHex[0] }} />
                             <div className="flex-1" style={{ backgroundColor: awayClub?.colorsHex[1] || awayClub?.colorsHex[0] }} />
                           </div>
                       }
                       <span className="font-black italic uppercase tracking-tighter text-2xl text-white leading-tight">{awayClub?.name}</span>
                    </div>
                 </div>

                 {/* Karne / dogrywka */}
                 {selectedMatch.homePenaltyScore !== undefined && (
                   <div className="text-center mt-1">
                      <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">k. {selectedMatch.homePenaltyScore}:{selectedMatch.awayPenaltyScore}</span>
                   </div>
                 )}
                 {selectedMatch.homePenaltyScore === undefined && selectedMatch.goals.some(g => g.minute > 95) && (
                   <div className="text-center mt-1">
                      <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">po dogrywce</span>
                   </div>
                 )}

                 {/* Zdarzenia */}
                 {(() => {
                    const homeGoals = selectedMatch.goals.filter(g => g.teamId === selectedMatch.homeTeamId).sort((a, b) => a.minute - b.minute);
                    const awayGoals = selectedMatch.goals.filter(g => g.teamId === selectedMatch.awayTeamId).sort((a, b) => a.minute - b.minute);
                    const homeCards = selectedMatch.cards.filter(c => c.teamId === selectedMatch.homeTeamId).sort((a, b) => a.minute - b.minute);
                    const awayCards = selectedMatch.cards.filter(c => c.teamId === selectedMatch.awayTeamId).sort((a, b) => a.minute - b.minute);

                    if (!homeGoals.length && !awayGoals.length && !homeCards.length && !awayCards.length) return null;

                    return (
                      <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-3">
                         {(homeGoals.length > 0 || awayGoals.length > 0) && (
                           <div className="grid grid-cols-2 gap-6">
                              <div className="flex flex-wrap gap-x-3 gap-y-1 justify-start text-left text-sm text-slate-200">
                                 {homeGoals.map(g => (
                                   <span key={`hg-${g.minute}-${g.playerName}`} className="inline-flex items-center gap-1.5">
                                      <span className="text-[13px] text-emerald-300">⚽</span>
                                      <span>{g.minute}' {g.playerName}{(g as any).isPenalty ? ' (k.)' : ''}</span>
                                   </span>
                                 ))}
                              </div>
                              <div className="flex flex-wrap gap-x-3 gap-y-1 justify-end text-right text-sm text-slate-200">
                                 {awayGoals.map(g => (
                                   <span key={`ag-${g.minute}-${g.playerName}`} className="inline-flex items-center gap-1.5">
                                      <span className="text-[13px] text-emerald-300">⚽</span>
                                      <span>{g.minute}' {g.playerName}{(g as any).isPenalty ? ' (k.)' : ''}</span>
                                   </span>
                                 ))}
                              </div>
                           </div>
                         )}
                         {(homeCards.length > 0 || awayCards.length > 0) && (
                           <div className="grid grid-cols-2 gap-6">
                              <div className="flex flex-wrap gap-x-3 gap-y-1 justify-start text-left text-xs text-slate-300">
                                 {homeCards.map(c => (
                                   <span key={`hc-${c.minute}-${c.type}`} className="inline-flex items-center gap-1.5">
                                      <span>{c.type === 'YELLOW' ? '🟨' : '🟥'}</span>
                                      <span>{c.minute}' {c.playerName}{c.type === 'SECOND_YELLOW' ? ' (2. żółta)' : ''}</span>
                                   </span>
                                 ))}
                              </div>
                              <div className="flex flex-wrap gap-x-3 gap-y-1 justify-end text-right text-xs text-slate-300">
                                 {awayCards.map(c => (
                                   <span key={`ac-${c.minute}-${c.type}`} className="inline-flex items-center gap-1.5">
                                      <span>{c.type === 'YELLOW' ? '🟨' : '🟥'}</span>
                                      <span>{c.minute}' {c.playerName}{c.type === 'SECOND_YELLOW' ? ' (2. żółta)' : ''}</span>
                                   </span>
                                 ))}
                              </div>
                           </div>
                         )}
                      </div>
                    );
                 })()}
              </div>

              {/* Zamknij */}
              <div className="px-8 pb-8 text-center">
                 <button onClick={() => setSelectedMatch(null)} className="px-16 py-3 bg-white text-slate-900 font-black italic uppercase tracking-widest rounded-2xl text-xs hover:scale-105 transition-all shadow-xl active:scale-95">
                    Zamknij raport
                 </button>
              </div>
           </div>
        </div>
        );
      })()}

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
    </>
  );
};
