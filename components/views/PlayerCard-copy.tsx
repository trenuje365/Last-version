import React, { useMemo } from 'react';
import { useGame } from '../../context/GameContext';
import { ViewState, HealthStatus, PlayerAttributes } from '../../types';     
import { PlayerPresentationService } from '../../services/PlayerPresentationService';
import { FreeAgentNegotiationService } from '../../services/FreeAgentNegotiationService';
import { NegotiationStatus } from '../../types';

export const PlayerCard: React.FC = () => {
 const { viewedPlayerId, players, clubs, navigateTo, previousViewState, userTeamId, toggleTransferList, currentDate, setPendingNegotiations  } = useGame();

  const data = useMemo(() => {
    if (!viewedPlayerId) return null;
   for (const clubId in players) {
      const player = players[clubId].find(p => p.id === viewedPlayerId);
      if (player) {
        let clubData = clubs.find(c => c.id === clubId);
        
        if (clubId === 'FREE_AGENTS') {
          clubData = {
            id: 'FREE_AGENTS',
            name: 'Bezrobotny',
            shortName: 'FREE',
            leagueId: 'NONE',
            colorsHex: ['#475569', '#1e293b'], 
            stadiumName: 'Brak',
            stadiumCapacity: 0,
            reputation: 0,
            isDefaultActive: true,
            rosterIds: [],
            stats: { points: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, played: 0, form: [] },
            budget: 0, boardStrictness: 0, signingBonusPool: 0
          };
        }
        return { player, club: clubData! };
      }
    }
    return null;
  }, [viewedPlayerId, players, clubs]);

  if (!data) return null;
 const isMatchContext = previousViewState === ViewState.MATCH_LIVE || previousViewState === ViewState.MATCH_LIVE_CUP;
  const { player, club } = data;
const [showHistory, setShowHistory] = React.useState(false);
  const isContractLocked = player.contractLockoutUntil && new Date(currentDate) < new Date(player.contractLockoutUntil);

  const healthInfo = PlayerPresentationService.getHealthDisplay(player);
  const condColor = PlayerPresentationService.getConditionColorClass(player.condition);

  const AttrBar = ({ label, value }: { label: string, value: number }) => {
    let colorClass = "bg-slate-700";
    let glowClass = "";
    if (value >= 80) { colorClass = "bg-emerald-400"; glowClass = "shadow-[0_0_12px_rgba(52,211,153,0.6)]"; }
    else if (value >= 65) { colorClass = "bg-blue-400"; }
    else if (value >= 50) { colorClass = "bg-amber-400"; }
    else if (value > 0) { colorClass = "bg-red-500"; }
    
    return (
      <div className="group flex flex-col gap-1.5 mb-3">
        <div className="flex justify-between items-center px-1">
           <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-300 transition-colors">{label}</span>
           <span className={`text-xs font-black font-mono ${value >= 80 ? 'text-emerald-400' : 'text-white'}`}>{value}</span>
        </div>
        <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
           <div className={`h-full transition-all duration-1000 ${colorClass} ${glowClass}`} style={{ width: `${value}%` }} />
        </div>
      </div>
    );
  };

  const attrs = player.attributes || {} as PlayerAttributes;



  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/95 backdrop-blur-xl p-6 animate-fade-in overflow-y-auto custom-scrollbar">
      
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[150px] opacity-10" style={{ background: club.colorsHex[0] }} />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] opacity-5" style={{ background: club.colorsHex[1] }} />
      </div>

      <div className="max-w-5xl w-full bg-slate-900 rounded-[45px] border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col md:flex-row min-h-[750px]">
        
           <div className="w-full md:w-[40%] relative flex flex-col items-center justify-between p-12 border-r border-white/5 overflow-hidden">
           <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none">
              <span className="text-[30rem] font-black italic select-none">{player.position}</span>
           </div>

           <div className="relative z-10 text-center w-full">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-8">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-[8px] font-black uppercase tracking-[0.3em] text-white/60">Profil Zawodnika PZPN</span>
              </div>
              {player.isOnTransferList && (
                <div className="mb-4 animate-pulse">
                   <span className="bg-amber-500 text-black text-[10px] font-black px-4 py-1 rounded-full shadow-[0_0_20px_rgba(245,158,11,0.5)]">
                     LISTA TRANSFEROWA
                   </span>
                </div>
              )}

              <h2 className="text-5xl font-black text-white italic uppercase tracking-tighter leading-[0.8] mb-2 drop-shadow-2xl">
                 {player.firstName}<br/>
                 <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-400 to-slate-600">{player.lastName}</span>
              </h2>
              
              <div className="flex items-center justify-center gap-4 mt-6">
                 <div className={`px-4 py-1 rounded-xl border-2 font-black italic tracking-tighter text-lg ${PlayerPresentationService.getPositionBadgeClass(player.position)}`}>
                    {player.position}
                 </div>
                 <div className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">
                    {player.age} lat • {player.nationality}
                 </div>
              </div>
           </div>

           <div className="relative z-10 group mt-12 mb-12">
              <div className="absolute inset-[-15px] bg-white/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="w-48 h-48 rounded-full border-8 border-white/5 flex flex-col items-center justify-center shadow-2xl relative bg-slate-950 overflow-hidden">
                 <div className="absolute inset-0 opacity-10" style={{ background: `linear-gradient(135deg, ${club.colorsHex[0]}, transparent)` }} />
                 <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 relative z-10">Rating</span>
                 <span className="text-8xl font-black text-white italic tracking-tighter leading-none relative z-10 drop-shadow-lg">{player.overallRating}</span>
                 <div className="absolute bottom-4 h-1 w-12 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,1)]" />
              </div>
           </div>

           <div className="relative z-10 w-full flex flex-col gap-3">
            <div className="flex items-center justify-between p-5 bg-black/40 rounded-[28px] border border-white/5">
                 <div className="flex flex-col gap-1">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Status Kontraktu</span>
                    <span className="text-xs font-black text-white italic uppercase tracking-tight">
                       {club.id === 'FREE_AGENTS' ? 'Wolny Agent' : club.name}
                    </span>
                 </div>
                 <div className="w-10 h-10 rounded-xl flex flex-col overflow-hidden border border-white/20 shadow-lg">
                    {club.id === 'FREE_AGENTS' ? (
                      <div className="flex-1 bg-slate-700 flex items-center justify-center text-xs">🚫</div>
                    ) : (
                      <>
                        <div style={{ backgroundColor: club.colorsHex[0] }} className="flex-1" />
                        <div style={{ backgroundColor: club.colorsHex[1] || club.colorsHex[0] }} className="flex-1" />
                      </>
                    )}
                 </div>
              </div>

<button 
                onClick={() => setShowHistory(!showHistory)}
                className="w-full py-4 rounded-[28px] bg-blue-600/20 border border-blue-500/30 text-blue-400 font-black italic uppercase tracking-widest text-[10px] transition-all hover:bg-blue-600/30 active:scale-95 shadow-xl mb-1"
              >
                {showHistory ? 'Ukryj Historię ↑' : 'Historia Zawodnika 📜'}
              </button>

              <button 
                onClick={() => navigateTo(previousViewState || ViewState.DASHBOARD)}
                className="w-full py-5 rounded-[28px] bg-white text-slate-900 font-black italic uppercase tracking-widest text-xs transition-all hover:scale-[1.02] active:scale-95 shadow-2xl"
              >
                Zamknij Kartę &times;
              </button>
           </div>
        </div>



       

        <div className="flex-1 bg-black/20 p-10 overflow-y-auto custom-scrollbar flex flex-col gap-10">
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
              <div className="col-span-2 mb-4">
                 <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
                    <span className="w-8 h-px bg-blue-500/30" /> Atrybuty Techniczne
                 </h3>
              </div>
              
              <div className="space-y-4">
                 <AttrBar label="Szybkość" value={attrs.pace} />
                 <AttrBar label="Siła" value={attrs.strength} />
                 <AttrBar label="Kondycja" value={attrs.stamina} />
                 <AttrBar label="Obrona" value={attrs.defending} />
                 <AttrBar label="Podania" value={attrs.passing} />
              </div>

              <div className="space-y-4">
                 <AttrBar label="Atak" value={attrs.attacking} />
                 <AttrBar label="Wykończenie" value={attrs.finishing} />
                 <AttrBar label="Technika" value={attrs.technique} />
                 <AttrBar label="Drybling" value={attrs.dribbling} />
                 <AttrBar label="Wizja" value={attrs.vision} />
              </div>

              <div className="col-span-2 grid grid-cols-2 gap-8 mt-6 pt-6 border-t border-white/5">
                 <AttrBar label="Ustawianie się" value={attrs.positioning} />
                 <AttrBar label="Bramkarstwo" value={attrs.goalkeeping} />
              </div>
           </div>

           <div className="flex flex-col gap-6">
              <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] mb-2 flex items-center gap-3">
                 <span className="w-8 h-px bg-emerald-500/30" /> Statystyki Sezonowe
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                 {[
                   { label: 'Mecze', val: player.stats.matchesPlayed, icon: '📅' },
                   { label: 'Gole', val: player.stats.goals, icon: '⚽', color: 'text-emerald-400' },
                   { label: 'Asysty', val: player.stats.assists, icon: '👟', color: 'text-blue-400' },
                   { label: 'Żółte', val: player.stats.yellowCards, icon: '🟨', color: 'text-amber-400' },
                   { label: 'Czerwone', val: player.stats.redCards, icon: '🟥', color: 'text-red-500' },
                 ].map((s, i) => (
                    <div key={i} className="bg-slate-900/40 p-5 rounded-3xl border border-white/5 text-center group hover:border-white/10 transition-all">
                       <span className="text-xl mb-2 block transform group-hover:scale-125 transition-transform">{s.icon}</span>
                       <span className={`text-2xl font-black font-mono block ${s.color || 'text-white'}`}>{s.val}</span>
                       <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest mt-1">{s.label}</span>
                    </div>
                 ))}
              </div>
           </div>

           <div className="flex flex-col gap-6">
              <h3 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.4em] mb-2 flex items-center gap-3">
                 <span className="w-8 h-px bg-rose-500/30" /> Stan Zdrowia i Gotowość
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="bg-slate-900/40 p-6 rounded-[32px] border border-white/5 flex items-center justify-between">
                    <div>
                       <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Dostępność</span>
                       <span className={`text-xs font-black uppercase italic ${healthInfo.colorClass}`}>{healthInfo.text}</span>
                    </div>

                    {player.health.status === HealthStatus.INJURED && player.health.injury?.injuryDate && (
                      <div className="text-right border-l border-white/5 pl-4">
                        <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Data urazu</span>
                        <span className="text-[10px] font-black text-slate-300 font-mono italic">
                          {new Date(player.health.injury.injuryDate).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' })}
                        </span>
                      </div>
                    )}

                    {player.health.status === HealthStatus.INJURED && (
                      <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 animate-pulse border border-red-500/20">🏥</div>
                    )}
                 </div>

                 <div className="bg-slate-900/40 p-6 rounded-[32px] border border-white/5 flex flex-col justify-center">
                    <div className="flex justify-between items-center mb-2 px-1">
                       <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Kondycja Fizyczna</span>
                       <span className="text-xs font-black font-mono text-white">{Math.round(player.condition)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
                       <div className={`h-full transition-all duration-1000 ${condColor}`} style={{ width: `${player.condition}%` }} />
                    </div>
                 </div>
              </div>
           </div>

           <div className="flex flex-col gap-6">
              <h3 className="text-[10px] font-black text-amber-400 uppercase tracking-[0.4em] mb-2 flex items-center gap-3">
                 <span className="w-8 h-px bg-amber-400/30" /> Kontrakt i Wynagrodzenie
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="bg-slate-900/40 p-6 rounded-[32px] border border-white/5 flex items-center justify-between group hover:border-emerald-500/30 transition-colors">
                    <div>
                       <span className="block text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Roczne Wynagrodzenie</span>
                       <span className="text-sm font-black text-emerald-400 font-mono italic">
                          {player.annualSalary ? player.annualSalary.toLocaleString('pl-PL') : '0'} <span className="text-[10px] opacity-60 ml-1">PLN</span>
                       </span>
                    </div>


         


                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-inner">💰</div>
                 </div>

                 <div className="bg-slate-900/40 p-6 rounded-[32px] border border-white/5 flex items-center justify-between group hover:border-blue-500/30 transition-colors">
                    <div>
                       <span className="block text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Wygaśnięcie Kontraktu</span>
                       <span className="text-sm font-black text-white italic uppercase">
                          {player.contractEndDate ? new Date(player.contractEndDate).toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' }) : 'Brak danych'}
                       </span>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20 shadow-inner">📅</div>
                 </div>

<div className="bg-slate-900/40 p-6 rounded-[32px] border border-emerald-500/20 flex items-center justify-between group hover:border-emerald-500/40 transition-all col-span-1 md:col-span-2 shadow-lg">
                    <div>
                       <span className="block text-[8px] font-black text-emerald-500/60 uppercase tracking-widest mb-1">Aktualna Wartość Rynkowa</span>
                       <span className="text-2xl font-black text-emerald-400 font-mono italic tabular-nums leading-none">
                          {player.marketValue ? player.marketValue.toLocaleString('pl-PL') : '0'} <span className="text-xs opacity-60 ml-1">PLN</span>
                       </span>
                       <p className="text-[7px] text-slate-600 uppercase mt-2 font-bold tracking-tighter">* Wycena na podstawie formy, wieku oraz reputacji ligi</p>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-3xl text-emerald-500 border border-emerald-500/20 shadow-inner">
                       🏷️
                    </div>
                 </div>
                


              </div>

              {player.clubId === userTeamId && !isMatchContext && (
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <button 
                    onClick={() => navigateTo(ViewState.CONTRACT_MANAGEMENT)}
                    className="group relative h-16 bg-red-600/10 border border-red-500/20 rounded-[24px] flex items-center justify-center gap-3 transition-all hover:bg-red-600/20 hover:border-red-500/40 active:scale-95 shadow-xl"
                  >
                    <span className="text-xl group-hover:rotate-12 transition-transform">📄</span>
                    <div className="text-left">
                      <span className="block text-[8px] font-black text-red-500 uppercase tracking-widest">ZAKOŃCZ WSPÓŁPRACĘ</span>
                      <span className="text-[11px] font-black text-white italic uppercase">ROZWIĄŻ KONTRAKT</span>
                    </div>
                  </button>

                  <button 
                    disabled={isContractLocked}
                    onClick={() => navigateTo(ViewState.CONTRACT_MANAGEMENT)}
                    className={`group relative h-16 rounded-[24px] flex items-center justify-center gap-3 transition-all 
                      ${isContractLocked 
                        ? 'bg-slate-800 border-slate-700 opacity-50 cursor-not-allowed' 
                        : 'bg-blue-600/10 border-blue-500/20 hover:bg-blue-600/20 hover:border-blue-500/40 active:scale-95 shadow-xl'
                      }`}
                  >
                    <span className="text-xl group-hover:scale-110 transition-transform">
                      {isContractLocked ? '⏳' : '✍️'}
                    </span>
                    <div className="text-left">
                      <span className="block text-[8px] font-black uppercase tracking-widest">
                        {isContractLocked ? 'BLOKADA CZASOWA' : 'NOWE WARUNKI'}
                      </span>
                      <span className="text-[11px] font-black text-white italic uppercase">
                        {isContractLocked ? 'UMOWA NIEDAWNO PODPISANA' : 'PRZEDŁUŻ UMOWĘ'}
                      </span>
                    </div>
                  </button>
                </div>
              )}
              
        {player.clubId === userTeamId && !isMatchContext && (
                <button 
                  onClick={() => toggleTransferList(player.id)}
                  className={`w-full mt-4 py-4 rounded-[24px] font-black italic uppercase tracking-widest text-[10px] transition-all border-2 active:scale-95
                    ${player.isOnTransferList 
                      ? 'bg-slate-800 border-slate-600 text-slate-400 hover:bg-slate-700' 
                      : 'bg-amber-600/20 border-amber-500/40 text-amber-500 hover:bg-amber-600/30'}`}
                >
                  {player.isOnTransferList ? '❌ Zdejmij z listy transferowej' : '📥 Wystaw na listę transferową'}
                </button>
              )}

           {player.clubId !== userTeamId && !isMatchContext && (
                <div className="mt-4">
                  {player.clubId === 'FREE_AGENTS' ? (
                    <button 
                      disabled={!!(player.freeAgentLockoutUntil && new Date(currentDate) < new Date(player.freeAgentLockoutUntil))}
                      onClick={() => {
                        navigateTo(ViewState.FREE_AGENT_NEGOTIATION);
                      }}
                      className={`w-full py-5 rounded-[28px] font-black italic uppercase tracking-widest text-xs transition-all shadow-2xl border-b-8 
                        ${(player.freeAgentLockoutUntil && new Date(currentDate) < new Date(player.freeAgentLockoutUntil))
                          ? 'bg-slate-800 border-slate-900 text-slate-500 opacity-70 cursor-not-allowed' 
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-800 hover:scale-[1.02] active:scale-95'}`}
                    >
                      {player.freeAgentLockoutUntil && new Date(currentDate) < new Date(player.freeAgentLockoutUntil)
                        ? "Jestem zajęty. Proszę o kontakt w innym terminie."
                        : "OTWÓRZ BIURO NEGOCJACJI 🤝"}
                    </button>



                  ) : (
                    <button 
                      className="w-full py-5 rounded-[28px] bg-blue-600 hover:bg-blue-500 text-white font-black italic uppercase tracking-widest text-xs transition-all hover:scale-[1.02] active:scale-95 shadow-2xl border-b-8 border-blue-800"
                    >
                      ZŁÓŻ OFERTĘ TRANSFEROWĄ 💰
                    </button>
                  )}
                </div>
              )}
           
           
           </div>
        </div>

{showHistory && (
          <div className="absolute left-[48%] top-[10%] w-[20%] max-h-[400px] bg-slate-900/95 border border-blue-500/30 rounded-[35px] shadow-[0_30px_60px_rgba(0,0,0,0.8)] backdrop-blur-2xl z-[300] flex flex-col overflow-hidden animate-slide-up">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-blue-500/10">
              <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em]">Przebieg Kariery</span>
              <button onClick={() => setShowHistory(false)} className="text-slate-500 hover:text-white">&times;</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-3">
              {player.history && player.history.length > 0 ? (
                player.history.map((entry, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group hover:bg-white/10 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-lg bg-black/40 flex items-center justify-center text-lg">⚽</div>
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-white uppercase italic">{entry.clubId === 'FREE_AGENTS' ? 'BEZ KLUBU' : entry.clubName}</span>
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                          {entry.fromMonth}/{entry.fromYear} — {entry.toYear ? `${entry.toMonth}/${entry.toYear}` : '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center opacity-30 italic text-xs font-black uppercase tracking-widest">Brak danych historycznych w rejestrze</div>
              )}
            </div>
          </div>
        )}



      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }
        @keyframes fade-in { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
        .animate-fade-in { animation: fade-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
};