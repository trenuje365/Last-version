
import React, { useState, useMemo } from 'react';
import { useGame } from '../../context/GameContext';
import { ViewState, Player, Club, LeagueLevel } from '../../types';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { LeagueStatsService, StatRow } from '../../services/LeagueStatsService';
import { PlayerPresentationService } from '../../services/PlayerPresentationService';

type StatTab = 'SCORERS' | 'ASSISTS' | 'YELLOW_CARDS' | 'RED_CARDS' | 'INJURIES';

export const LeagueStatsView: React.FC = () => {
  const { leagues, clubs, players, navigateTo, viewPlayerDetails } = useGame();

  const displayLeagues = leagues.filter(l => l.level !== LeagueLevel.TIER_4_HIDDEN);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>(displayLeagues[0]?.id || 'L_PL_1');
  const [activeTab, setActiveTab] = useState<StatTab>('SCORERS');

  const leagueColor = useMemo(() => {
    if (selectedLeagueId === 'L_PL_1') return '#fbbf24'; // Gold
    if (selectedLeagueId === 'L_PL_2') return '#3b82f6'; // Blue
    return '#10b981'; // Green
  }, [selectedLeagueId]);

  const statsData = useMemo(() => {
    const rawData = LeagueStatsService.getPlayersForLeague(selectedLeagueId, clubs, players);
    
    switch (activeTab) {
      case 'SCORERS': return LeagueStatsService.getTopScorers(rawData);
      case 'ASSISTS': return LeagueStatsService.getTopAssists(rawData);
      case 'YELLOW_CARDS': return LeagueStatsService.getYellowCardsList(rawData);
      case 'RED_CARDS': return LeagueStatsService.getRedCardsList(rawData);
      case 'INJURIES': return LeagueStatsService.getInjuryList(rawData);
      default: return [];
    }
  }, [selectedLeagueId, activeTab, clubs, players]);

  return (
    <div className="h-[calc(100vh-3rem)] max-w-[1600px] mx-auto flex flex-col gap-4 animate-fade-in overflow-hidden relative">
      
      {/* BACKGROUND DYNAMIC IDENTITY LAYER */}
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
        <div 
          className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[150px] opacity-20 transition-all duration-1000"
          style={{ background: leagueColor }}
        />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
      </div>

      {/* HEADER SECTION */}
      <div className="flex items-center justify-between px-8 py-5 bg-white/5 rounded-[32px] border border-white/10 backdrop-blur-3xl shrink-0 shadow-2xl">
         <div className="flex items-center gap-6">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl shadow-inner">
               🏆
            </div>
            <div>
               <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white leading-none">
                 Statystyki Ligowe
               </h1>
               <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: leagueColor }}>
                    {displayLeagues.find(l => l.id === selectedLeagueId)?.name.toUpperCase()}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-white/20" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">RANKINGI SEZONU</span>
               </div>
            </div>
         </div>

         <div className="flex items-center gap-4">
            <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5 shadow-inner">
               {displayLeagues.map(l => (
                 <button 
                    key={l.id}
                    onClick={() => setSelectedLeagueId(l.id)}
                    className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                      ${selectedLeagueId === l.id ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-500 hover:text-slate-300'}`}
                 >
                   {l.name.replace('Polish League ', '')}
                 </button>
               ))}
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

      {/* CATEGORY SWITCHER PILLS */}
      <div className="flex gap-2 px-2 shrink-0">
        {[
          { id: 'SCORERS', label: 'STRZELCY', icon: '⚽' },
          { id: 'ASSISTS', label: 'ASYSTY', icon: '👟' },
          { id: 'YELLOW_CARDS', label: 'ŻÓŁTE', icon: '🟨' },
          { id: 'RED_CARDS', label: 'CZERWONE', icon: '🟥' },
          { id: 'INJURIES', label: 'SZPITAL', icon: '🏥' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as StatTab)}
            className={`flex items-center gap-3 px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border
              ${activeTab === tab.id 
                ? 'bg-slate-900 border-white/20 text-white shadow-2xl scale-[1.02]' 
                : 'bg-black/20 border-white/5 text-slate-500 hover:text-slate-300 hover:bg-black/40'
              }
            `}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* MAIN DATA TABLE */}
      <div className="flex-1 bg-slate-900/30 rounded-[40px] border border-white/5 backdrop-blur-2xl shadow-2xl flex flex-col overflow-hidden">
         <div className="overflow-y-auto custom-scrollbar flex-1 p-6 flex flex-col items-center">
            <div className="w-full max-w-6xl">
                <table className="w-full text-left border-separate border-spacing-y-2">
                   <thead className="sticky top-0 z-20">
                      <tr className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                         {activeTab !== 'INJURIES' && <th className="pb-4 pl-6 w-14">#</th>}
                         <th className="pb-4 text-left">Zawodnik</th>
                         <th className="pb-4 text-left">Klub</th>
                         {activeTab === 'SCORERS' && <><th className="pb-4 text-center w-20">Mecze</th><th className="pb-4 text-center w-24 pr-6" style={{ color: leagueColor }}>Gole</th></>}
                         {activeTab === 'ASSISTS' && <><th className="pb-4 text-center w-20">Mecze</th><th className="pb-4 text-center w-24 pr-6" style={{ color: leagueColor }}>Asysty</th></>}
                         {activeTab === 'YELLOW_CARDS' && <><th className="pb-4 text-center w-20">Mecze</th><th className="pb-4 text-center w-24 pr-6 text-yellow-500">Żółte</th></>}
                         {activeTab === 'RED_CARDS' && <><th className="pb-4 text-center w-20">Mecze</th><th className="pb-4 text-center w-24 pr-6 text-red-500">Czerwone</th></>}
                         {activeTab === 'INJURIES' && <><th className="pb-4 text-left">Uraz</th><th className="pb-4 text-center w-32 pr-6">Dni</th></>}
                      </tr>
                   </thead>
                   <tbody>
                      {statsData.map((row, index) => {
                        const { player, club } = row;
                        return (
                          <tr 
                            key={player.id}
                            onClick={() => viewPlayerDetails(player.id)}
                            className="group relative h-20 bg-white/[0.02] hover:bg-white/[0.05] transition-all duration-300 cursor-pointer overflow-hidden"
                          >
                             {/* Hover Identity Glow */}
                             <div 
                               className="absolute inset-0 opacity-0 group-hover:opacity-5 pointer-events-none transition-opacity"
                               style={{ background: `linear-gradient(90deg, ${club.colorsHex[0]}, transparent)` }}
                             />
                             
                             {activeTab !== 'INJURIES' && (
                               <td className="pl-6 relative z-10">
                                  <span className="font-black font-mono text-sm text-slate-500">
                                    {String(index + 1).padStart(2, '0')}
                                  </span>
                               </td>
                             )}

                             <td className="relative z-10">
                                <div className="flex flex-col">
                                   <span className="text-sm font-black text-white uppercase italic tracking-tight group-hover:text-blue-400 transition-colors">
                                     {player.lastName} {player.firstName}
                                   </span>
                                   <span className={`text-[9px] font-bold uppercase tracking-widest ${PlayerPresentationService.getPositionColorClass(player.position)}`}>
                                      {player.position} • {player.age} lat
                                   </span>
                                </div>
                             </td>

                             <td className="relative z-10">
                                <div className="flex items-center gap-3">
                                   <div className="flex flex-col w-1 h-6 rounded-full overflow-hidden border border-white/10 shrink-0">
                                      <div style={{ backgroundColor: club.colorsHex[0] }} className="flex-1" />
                                      <div style={{ backgroundColor: club.colorsHex[1] || club.colorsHex[0] }} className="flex-1" />
                                   </div>
                                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate max-w-[150px]">{club.name}</span>
                                </div>
                             </td>

                             {activeTab === 'SCORERS' && (
                               <>
                                  <td className="text-center font-bold text-slate-500 font-mono text-sm relative z-10">{player.stats.matchesPlayed}</td>
                                  <td className="text-center pr-6 relative z-10">
                                     <span className="text-2xl font-black font-mono text-white tracking-tighter tabular-nums group-hover:scale-110 transition-transform inline-block">
                                        {player.stats.goals}
                                     </span>
                                  </td>
                               </>
                             )}

                             {activeTab === 'ASSISTS' && (
                               <>
                                  <td className="text-center font-bold text-slate-500 font-mono text-sm relative z-10">{player.stats.matchesPlayed}</td>
                                  <td className="text-center pr-6 relative z-10">
                                     <span className="text-2xl font-black font-mono text-white tracking-tighter tabular-nums group-hover:scale-110 transition-transform inline-block">
                                        {player.stats.assists}
                                     </span>
                                  </td>
                               </>
                             )}

                             {activeTab === 'YELLOW_CARDS' && (
                               <>
                                  <td className="text-center font-bold text-slate-500 font-mono text-sm relative z-10">{player.stats.matchesPlayed}</td>
                                  <td className="text-center pr-6 relative z-10">
                                     <span className="text-2xl font-black font-mono text-yellow-500 tracking-tighter tabular-nums group-hover:scale-110 transition-transform inline-block">
                                        {player.stats.yellowCards}
                                     </span>
                                  </td>
                               </>
                             )}

                             {activeTab === 'RED_CARDS' && (
                               <>
                                  <td className="text-center font-bold text-slate-500 font-mono text-sm relative z-10">{player.stats.matchesPlayed}</td>
                                  <td className="text-center pr-6 relative z-10">
                                     <span className="text-2xl font-black font-mono text-red-500 tracking-tighter tabular-nums group-hover:scale-110 transition-transform inline-block">
                                        {player.stats.redCards}
                                     </span>
                                  </td>
                               </>
                             )}

                             {activeTab === 'INJURIES' && (
                               <>
                                  <td className="text-left font-bold text-red-400 italic text-xs relative z-10">{player.health.injury?.type || 'Stłuczenie'}</td>
                                  <td className="text-center pr-6 relative z-10">
                                     <div className="bg-red-500/20 px-3 py-1 rounded-lg border border-red-500/30">
                                        <span className="text-sm font-black font-mono text-red-500 tabular-nums">
                                          {player.health.injury?.daysRemaining}
                                        </span>
                                     </div>
                                  </td>
                               </>
                             )}
                          </tr>
                        );
                      })}
                      {statsData.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-20 text-center opacity-20">
                             <div className="text-4xl mb-4">🏜️</div>
                             <div className="text-sm font-black uppercase tracking-[0.3em] italic">Brak danych w tej kategorii</div>
                          </td>
                        </tr>
                      )}
                   </tbody>
                </table>
            </div>
         </div>
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
