
import React, { useState, useMemo } from 'react';
import { useGame } from '../../context/GameContext';
import { ViewState, LeagueLevel, Club } from '../../types';
import { Button } from '../ui/Button';

export const LeagueTables: React.FC = () => {
  const { leagues, clubs, leagueSchedules, navigateTo, viewClubDetails, userTeamId, seasonTemplate } = useGame();

  const myClub = clubs.find(c => c.id === userTeamId);
  const displayLeagues = leagues.filter(l => l.level !== LeagueLevel.TIER_4_HIDDEN);
  
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>(displayLeagues[0]?.id || 'L_PL_1');
  const [viewMode, setViewMode] = useState<'TABLE' | 'SCHEDULE'>('TABLE');
  const [selectedRound, setSelectedRound] = useState<number>(1);

  const selectedLeague = displayLeagues.find(l => l.id === selectedLeagueId);
  const getTier = (lid: string) => parseInt(lid.split('_')[2]);
  const currentSchedule = selectedLeague ? leagueSchedules[getTier(selectedLeague.id)] : null;

  const seasonYearLabel = useMemo(() => {
    if (!seasonTemplate) return "2025/26";
    const startYear = seasonTemplate.seasonStartYear;
    return `${startYear}/${String(startYear + 1).slice(2)}`;
  }, [seasonTemplate]);

  const sortedClubs = useMemo(() => {
    return clubs
      .filter(c => c.leagueId === selectedLeagueId)
      .sort((a, b) => b.stats.points - a.stats.points || b.stats.goalDifference - a.stats.goalDifference);
  }, [clubs, selectedLeagueId]);

  const leagueColor = useMemo(() => {
    if (selectedLeagueId === 'L_PL_1') return '#fbbf24'; // Gold for Ekstraklasa
    if (selectedLeagueId === 'L_PL_2') return '#3b82f6'; // Blue for 1. Liga
    return '#10b981'; // Green for 2. Liga
  }, [selectedLeagueId]);

  return (
    <div className="h-[1080px] max-w-[1920px] mx-auto flex flex-col gap-4 animate-fade-in overflow-hidden relative bg-transparent">
      
      {/* BACKGROUND DYNAMIC LAYER */}
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
        <div 
          className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[150px] opacity-20 transition-all duration-1000"
          style={{ background: leagueColor }}
        />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
      </div>

      {/* HEADER SECTION */}
      <div className="flex items-center justify-between px-8 py-5 bg-white/5 rounded-[32px] border border-white/10 backdrop-blur-3xl shrink-0 shadow-2xl">
         <div className="flex items-center gap-6">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl shadow-inner">
               {viewMode === 'TABLE' ? '📊' : '📅'}
            </div>
            <div>
               <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white leading-none">
                 {viewMode === 'TABLE' ? 'Tabele Ligowe' : 'Terminarz'}
               </h1>
               <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: leagueColor }}>
                    {selectedLeague?.name.toUpperCase()}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-white/20" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Sezon {seasonYearLabel}</span>
               </div>
            </div>
         </div>

         {/* NAVIGATION CONTROLS */}
         <div className="flex items-center gap-4">
            <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5 shadow-inner">
               <button 
                  onClick={() => setViewMode('TABLE')}
                  className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                    ${viewMode === 'TABLE' ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-500 hover:text-slate-300'}`}
               >
                 Tabela
               </button>
               <button 
                  onClick={() => setViewMode('SCHEDULE')}
                  className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                    ${viewMode === 'SCHEDULE' ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-500 hover:text-slate-300'}`}
               >
                 Terminarz
               </button>
               <button 
                  onClick={() => navigateTo(ViewState.REFEREE_LIST)}
                  className="px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-slate-500 hover:text-slate-300"
               >
                 Lista Sędziów
               </button>
            </div>

            <div className="w-px h-10 bg-white/10 mx-2" />

            <button 
              onClick={() => navigateTo(ViewState.DASHBOARD)}
              className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all active:scale-95"
            >
              &larr; Wyjdź
            </button>
         </div>
      </div>

      {/* LEAGUE SELECTOR PILLS */}
      <div className="flex gap-2 px-2 shrink-0">
        {displayLeagues.map(l => (
          <button
            key={l.id}
            onClick={() => { setSelectedLeagueId(l.id); setSelectedRound(1); }}
            className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border
              ${selectedLeagueId === l.id 
                ? 'bg-slate-900 border-white/20 text-white shadow-2xl scale-[1.02]' 
                : 'bg-black/20 border-white/5 text-slate-500 hover:text-slate-300 hover:bg-black/40'
              }
            `}
          >
            {l.name.replace('Polish League ', '')}
          </button>
        ))}
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 overflow-hidden flex flex-col gap-4">
        
        {viewMode === 'TABLE' ? (
          <div className="flex-1 bg-slate-900/30 rounded-[40px] border border-white/5 backdrop-blur-2xl shadow-2xl flex flex-col overflow-hidden">
             <div className="overflow-y-auto custom-scrollbar flex-1 p-6 flex flex-col items-center">
                <div className="w-full max-w-6xl">
                    <table className="w-full text-left border-separate border-spacing-y-2 table-fixed">
                       <thead className="sticky top-0 z-20">
                          <tr className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                             <th className="pb-4 pl-6 w-14">#</th>
                             <th className="pb-4 text-left w-auto">Drużyna</th>
                             <th className="pb-4 text-center w-12">M</th>
                             <th className="pb-4 text-center w-10">W</th>
                             <th className="pb-4 text-center w-10">R</th>
                             <th className="pb-4 text-center w-10">P</th>
                             <th className="pb-4 text-center w-24">Bramki</th>
                             <th className="pb-4 text-center w-14">+/-</th>
                             <th className="pb-4 text-center w-32">Forma</th>
                             <th className="pb-4 text-center w-20 pr-6" style={{ color: leagueColor }}>Pkt</th>
                          </tr>
                       </thead>
                       <tbody>
                          {sortedClubs.map((club, index) => {
                            const isUserTeam = club.id === userTeamId;
                            return (
                              <tr 
                                key={club.id}
                             onClick={() => viewClubDetails(club.id)}
                                className={`group relative h-16 transition-all duration-300 cursor-pointer
                                  ${isUserTeam ? 'bg-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)]' : ''}
                                  ${((selectedLeagueId === 'L_PL_2' || selectedLeagueId === 'L_PL_3') && index < 2) ? 'bg-yellow-600/30 border-l-4 border-yellow-500' : 
                                    ((selectedLeagueId === 'L_PL_2' || selectedLeagueId === 'L_PL_3') && index >= 2 && index < 6) ? 'bg-blue-900/40 border-l-4 border-blue-600' :
                                    (selectedLeagueId === 'L_PL_3' ? index >= 14 : index >= 15) ? 'bg-red-900/40 border-l-4 border-red-600' : 'hover:bg-white/[0.03]'}`}
                              >
                                 <td className="pl-6 relative z-10">
                                    <span className={`font-black font-mono text-sm ${index < 3 ? 'text-emerald-400' : (index > 14 ? 'text-red-500' : 'text-slate-500')}`}>
                                      {String(index + 1).padStart(2, '0')}
                                    </span>
                                 </td>

                                 <td className="relative z-10 overflow-hidden">
                                    <div className="flex items-center gap-4">
                                       <div className="flex flex-col w-1.5 h-8 rounded-full overflow-hidden border border-white/10 shrink-0">
                                          <div style={{ backgroundColor: club.colorsHex[0] }} className="flex-1" />
                                          <div style={{ backgroundColor: club.colorsHex[1] || club.colorsHex[0] }} className="flex-1" />
                                       </div>
                                       <div className="flex flex-col min-w-0">
                                         <span className="text-sm font-black text-white uppercase italic tracking-tight group-hover:text-blue-400 transition-colors truncate flex items-center gap-2">
                                            {club.name}
                                            {selectedLeagueId === 'L_PL_1' && index === 0 && sortedClubs.length > 1 && 
                                              club.stats.points > (sortedClubs[1].stats.points + (34 - sortedClubs[1].stats.played) * 3) && (
                                              <div className="flex items-center gap-1.5 shrink-0">
                                                <span className="text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]">⭐</span>
                                                <span className="bg-yellow-400 text-slate-950 text-[7px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-tighter leading-none shadow-lg">Mistrz Polski</span>
                                              </div>
                                            )}

{(selectedLeagueId === 'L_PL_1' || selectedLeagueId === 'L_PL_2') && 
                                              index > 14 && 
                                              sortedClubs[14] &&
                                              (club.stats.points + (34 - club.stats.played) * 3) < sortedClubs[14].stats.points && (
                                              <div className="flex items-center gap-1.5 shrink-0">
                                                <span className="bg-red-600 text-white text-[7px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-tighter leading-none shadow-lg animate-pulse">SPADEK</span>
                                              </div>
                                            )}


                                          </span>
                                          {isUserTeam && <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mt-0.5">Twoja Drużyna</span>}
                                       </div>
                                    </div>
                                 </td>

                                 <td className="text-center font-bold text-slate-400 font-mono text-sm relative z-10">{club.stats.played}</td>
                                 <td className="text-center font-bold text-slate-500 font-mono text-xs relative z-10">{club.stats.wins}</td>
                                 <td className="text-center font-bold text-slate-500 font-mono text-xs relative z-10">{club.stats.draws}</td>
                                 <td className="text-center font-bold text-slate-500 font-mono text-xs relative z-10">{club.stats.losses}</td>
                                 <td className="text-center font-bold text-slate-600 font-mono text-[10px] relative z-10">{club.stats.goalsFor}:{club.stats.goalsAgainst}</td>
                                 <td className="text-center font-bold text-slate-500 font-mono text-xs relative z-10">
                                    {club.stats.goalDifference > 0 ? `+${club.stats.goalDifference}` : club.stats.goalDifference}
                                 </td>
                                 {/* -> tutaj wstaw kod */}
                                <td className="text-center relative z-10">
                                    <div className="flex justify-center gap-1">
                                       {(club.stats.form || []).map((res, i) => (
                                          <div key={i} className={`w-5 h-5 rounded flex items-center justify-center text-[9px] font-black text-white shadow-sm
                                             ${res === 'W' ? 'bg-emerald-500' : res === 'R' ? 'bg-amber-500' : 'bg-rose-500'}`}>
                                             {res}
                                          </div>
                                       ))}
                                    </div>
                                 </td>
                                 <td className="text-center pr-6 relative z-10">
                                    <span className="text-lg font-black font-mono tabular-nums group-hover:scale-110 transition-transform inline-block" style={{ color: isUserTeam ? '#10b981' : 'white' }}>
                                       {club.stats.points}
                                    </span>
                                 </td>
                              </tr>
                            );
                          })}
                       </tbody>
                    </table>
                </div>
             </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col gap-4 min-h-0">
             <div className="bg-slate-900/50 p-6 rounded-[32px] border border-white/5 backdrop-blur-2xl flex items-center justify-between shrink-0 shadow-xl max-w-4xl mx-auto w-full">
                <button 
                  disabled={selectedRound <= 1}
                  onClick={() => setSelectedRound(r => r - 1)}
                  className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 disabled:opacity-20 transition-all active:scale-90"
                >
                  &larr;
                </button>
                
                <div className="text-center">
                   <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">
                      Kolejka {selectedRound} <span className="text-slate-700 mx-2">/</span> 34
                   </h3>
                   <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mt-1">
                      {currentSchedule?.matchdays[selectedRound-1]?.start.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })}
                   </p>
                </div>

                <button 
                  disabled={selectedRound >= 34}
                  onClick={() => setSelectedRound(r => r + 1)}
                  className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 disabled:opacity-20 transition-all active:scale-90"
                >
                  &rarr;
                </button>
             </div>

             <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 max-w-7xl mx-auto">
                   {currentSchedule?.matchdays[selectedRound-1]?.fixtures.map((fixture) => {
                      const home = clubs.find(c => c.id === fixture.homeTeamId)!;
                      const away = clubs.find(c => c.id === fixture.awayTeamId)!;
                      const isFinished = fixture.status === 'FINISHED';

                      return (
                        <div key={fixture.id} className="group relative h-28 bg-slate-900/40 rounded-[30px] border border-white/5 overflow-hidden transition-all hover:scale-[1.01] hover:border-white/10 shadow-lg">
                           <div className="absolute inset-0 opacity-10 pointer-events-none flex">
                              <div className="flex-1" style={{ background: `linear-gradient(90deg, ${home.colorsHex[0]}, transparent)` }} />
                              <div className="flex-1" style={{ background: `linear-gradient(-90deg, ${away.colorsHex[0]}, transparent)` }} />
                           </div>

                           <div className="relative h-full flex items-center px-10 gap-8">
                              <div 
                                className="flex-1 flex items-center justify-end gap-6 cursor-pointer group/team"
                                onClick={() => viewClubDetails(home.id)}
                              >
                                 <div className="text-right">
                                    <span className="block text-sm font-black text-white uppercase italic truncate max-w-[150px] group-hover/team:text-blue-400 transition-colors">{home.name}</span>
                                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1">Gospodarz</span>
                                 </div>
                                 <div className="w-2 h-12 rounded-full shadow-2xl shrink-0" style={{ backgroundColor: home.colorsHex[0] }} />
                              </div>

                              <div className="w-32 flex flex-col items-center justify-center shrink-0">
                                 <div className="bg-black/60 px-6 py-2.5 rounded-2xl border border-white/10 backdrop-blur-md shadow-2xl group-hover:scale-110 transition-transform">
                                    {isFinished ? (
                                      <span className="text-2xl font-black font-mono text-emerald-400 tracking-tighter tabular-nums">
                                        {fixture.homeScore} : {fixture.awayScore}
                                      </span>
                                    ) : (
                                      <span className="text-xl font-black italic text-slate-700 tracking-widest">VS</span>
                                    )}
                                 </div>
                                 {!isFinished && <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest mt-2">NADCHODZĄCY</span>}
                              </div>

                              <div 
                                className="flex-1 flex items-center justify-start gap-6 cursor-pointer group/team"
                                onClick={() => viewClubDetails(away.id)}
                              >
                                 <div className="w-2 h-12 rounded-full shadow-2xl shrink-0" style={{ backgroundColor: away.colorsHex[0] }} />
                                 <div className="text-left">
                                    <span className="block text-sm font-black text-white uppercase italic truncate max-w-[150px] group-hover/team:text-blue-400 transition-colors">{away.name}</span>
                                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1">Gość</span>
                                 </div>
                              </div>
                           </div>
                        </div>
                      );
                   })}
                </div>
             </div>
          </div>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }
        
        @keyframes fade-in { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
};
