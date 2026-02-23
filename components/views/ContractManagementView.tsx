
import React, { useMemo, useState } from 'react';
import { useGame } from '../../context/GameContext';
import { ViewState } from '../../types';
import { FinanceService } from '../../services/FinanceService';
import { MailService } from '../../services/MailService';

export const ContractManagementView: React.FC = () => {
  const { 
    viewedPlayerId, players, clubs, navigateTo, 
    currentDate, setPlayers, setClubs, lineups, updateLineup, setMessages 
  } = useGame();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [boardDecision, setBoardDecision] = useState<{status: string, reason: string, woz: number} | null>(null);

  const [managementMode, setManagementMode] = useState<'RELEASE' | 'NEGOTIATE'>('NEGOTIATE');
  const [offerSalary, setOfferSalary] = useState(0);
  const [offerBonus, setOfferBonus] = useState(0);
  const [offerYears, setOfferYears] = useState(1);
  const [negotiationMessage, setNegotiationMessage] = useState<string | null>(null);
  const [counterOffer, setCounterOffer] = useState<{salary: number, bonus: number} | null>(null);
  const [isOfferSent, setIsOfferSent] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const data = useMemo(() => {
    if (!viewedPlayerId) return null;
    for (const clubId in players) {
      const player = players[clubId].find(p => p.id === viewedPlayerId);
      if (player) return { player, club: clubs.find(c => c.id === clubId)! };
    }
    return null;
  }, [viewedPlayerId, players, clubs]);

  // FIX: Dependency changed to viewedPlayerId to prevent reset on state update
  React.useEffect(() => {
    if (data?.player) {
      setOfferSalary(data.player.annualSalary);
      setOfferBonus(0);
      setOfferYears(1);
      setNegotiationMessage(null);
      setCounterOffer(null);
      setIsOfferSent(false);
      setShowSuccessModal(false);
    }
  }, [viewedPlayerId]);

  if (!data) return null;
  const { player, club } = data;

  const squad = players[club.id] || [];
  const penaltyAmount = Math.floor(player.annualSalary * 0.4);
  const isSquadTooSmall = squad.length <= 24;

  const isLocked = player.boardLockoutUntil && new Date(currentDate) < new Date(player.boardLockoutUntil);
  const lockDateLabel = player.boardLockoutUntil ? new Date(player.boardLockoutUntil).toLocaleDateString('pl-PL') : "";

  const requestBoardApproval = () => {
    setIsProcessing(true);
    
    setTimeout(() => {
      const decision = FinanceService.evaluateReleaseRequest(player, club, squad);
      setBoardDecision(decision);
      setIsProcessing(false);
      
      const boardMail = MailService.generateBoardDecisionMail(player, club, decision);
      setMessages(prev => [boardMail, ...prev]);

      if (decision.status === 'VETO') {
        setClubs(prev => prev.map(c => c.id === club.id ? { ...c, reputation: Math.max(1, c.reputation - 0.2) } : c));
      }
      
      if (decision.status === 'SOFT_BLOCK' || decision.status === 'VETO') {
        const lockoutDate = new Date(currentDate);
        lockoutDate.setMonth(lockoutDate.getMonth() + (decision.status === 'VETO' ? 6 : 3));
        
        setPlayers(prev => {
          const updated = { ...prev };
          updated[club.id] = updated[club.id].map(p => 
            p.id === player.id ? { ...p, boardLockoutUntil: lockoutDate.toISOString() } : p
          );
          return updated;
        });
      }
    }, 1500);
  };

  const handleSendOffer = () => {
    if (!data) return;
    const { player, club } = data;

    setIsProcessing(true);
    setNegotiationMessage(null);

    setTimeout(() => {
      setIsProcessing(false);
      setIsOfferSent(true);

      const playerDemand = FinanceService.calculatePlayerBonusDemand(player, offerSalary, club.reputation);

      if (FinanceService.isOfferInsulting(offerBonus, playerDemand)) {
        setPlayers(prev => ({
          ...prev,
          [club.id]: prev[club.id].map(p => p.id === player.id ? { ...p, isNegotiationPermanentBlocked: true } : p)
        }));
        setNegotiationMessage("Nie traktujecie mnie powaznie wiec nie będziemy o niczym rozmawiac. Do widzenia!");
        setCounterOffer(null);
        return;
      }

      const newEndDate = new Date(currentDate.getFullYear() + offerYears, 5, 30).toISOString();
      const decision = FinanceService.evaluateContractLogic(
        player, 
        offerSalary, 
        offerBonus, 
        newEndDate, 
        currentDate, 
        club.reputation
      );

      setCounterOffer(decision.demands);

      if (decision.accepted) {
        const lockoutDate = new Date(currentDate);
        lockoutDate.setMonth(lockoutDate.getMonth() + 6);

        setPlayers(prev => ({
          ...prev,
          [club.id]: prev[club.id].map(p => p.id === player.id ? { 
            ...p, 
            annualSalary: offerSalary, 
            contractEndDate: newEndDate,
            negotiationStep: 0,
            contractLockoutUntil: lockoutDate.toISOString() 
          } : p)
        }));
        setClubs(prev => prev.map(c => c.id === club.id ? { 
          ...c, 
          budget: c.budget - offerBonus,
          signingBonusPool: Math.max(0, c.signingBonusPool - offerBonus) 
        } : c));
        
        setNegotiationMessage(decision.reason);
        setShowSuccessModal(true);
      } else {
        const nextStep = (player.negotiationStep || 0) + 1;
        
        let lockoutDateStr: string | null = null;
        if (!decision.demands || nextStep >= 3) {
          const d = new Date(currentDate);
          d.setDate(d.getDate() + 14);
          lockoutDateStr = d.toISOString();
        }

        setPlayers(prev => ({
          ...prev,
          [club.id]: prev[club.id].map(p => p.id === player.id ? { 
            ...p, 
            negotiationStep: nextStep,
            negotiationLockoutUntil: lockoutDateStr 
          } : p)
        }));

        if (nextStep >= 3) {
          setNegotiationMessage("Chyba się jednak nie dogadamy. Próbowaliśmy kilka razy, ale Twoje oferty są nieakceptowalne. Do widzenia.");
          setCounterOffer(null);
        } else {
          setNegotiationMessage(decision.reason);
        }
      }
    }, 1200);
  };

  const handleReleasePlayer = () => {
    if (!boardDecision || (boardDecision.status !== 'APPROVED' && boardDecision.status !== 'WARNING')) return;

    setClubs(prev => prev.map(c => c.id === club.id ? { ...c, budget: c.budget - penaltyAmount } : c));
   const playerToRelease = squad.find(p => p.id === viewedPlayerId)!;
    
    // AKTUALIZACJA HISTORII - TUTAJ WSTAW TEN KOD
    const updatedHistory = [...(playerToRelease.history || [])];
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    // 1. Zamknij obecny kontrakt
    if (updatedHistory.length > 0) {
      updatedHistory[updatedHistory.length - 1] = {
        ...updatedHistory[updatedHistory.length - 1],
        toYear: currentYear,
        toMonth: currentMonth
      };
    }

    // 2. Dodaj wpis o bezrobociu
    updatedHistory.push({
      clubName: "BEZ KLUBU",
      clubId: 'FREE_AGENTS',
      fromYear: currentYear,
      fromMonth: currentMonth,
      toYear: null,
      toMonth: null
    });

    const releasedPlayer = { 
      ...playerToRelease, 
      clubId: 'FREE_AGENTS', 
      annualSalary: 0, 
      contractEndDate: '', 
      marketValue: 0,
      negotiationStep: 0,
      isNegotiationPermanentBlocked: false,
      history: updatedHistory // Podpinamy nową historię
    };

    setPlayers(prev => ({
      ...prev,
      [club.id]: prev[club.id].filter(p => p.id !== viewedPlayerId),
      'FREE_AGENTS': [...(prev['FREE_AGENTS'] || []), releasedPlayer]
    }));

    if (lineups[club.id]) {
      const old = lineups[club.id];
      updateLineup(club.id, {
        ...old,
        startingXI: old.startingXI.map(id => id === viewedPlayerId ? null : id),
        bench: old.bench.filter(id => id !== viewedPlayerId),
        reserves: old.reserves.filter(id => id !== viewedPlayerId)
      });
    }
    navigateTo(ViewState.SQUAD_VIEW);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5';
      case 'WARNING': return 'text-amber-400 border-amber-500/30 bg-amber-500/5';
      case 'SOFT_BLOCK': return 'text-orange-500 border-orange-500/30 bg-orange-500/5';
      case 'VETO': return 'text-red-500 border-red-500/30 bg-red-500/5';
      default: return 'text-slate-400 border-white/10';
    }
  };

  return (
    <div className="h-screen w-full bg-slate-950 flex items-center justify-center p-6 animate-fade-in relative overflow-hidden">
      
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[150px] opacity-10 bg-blue-600" />
        <div className="absolute inset-0 bg-[url('https://i.ibb.co/JwgrBtvC/biuro2-1.png')] bg-cover bg-center opacity-20" />
      </div>

      <div className="max-w-5xl w-full bg-slate-900/90 border border-white/10 rounded-[50px] backdrop-blur-3xl shadow-2xl relative z-10 overflow-hidden flex flex-col h-[850px]">
        
        <div className="p-10 border-b border-white/5 bg-white/5 flex justify-between items-center shrink-0">
           <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-3xl bg-black/40 flex items-center justify-center text-3xl shadow-inner">🏛️</div>
              <div>
                 <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em]">Panel Kontraktowy • {club.name}</span>
                 <h2 className="text-3xl font-black italic text-white uppercase tracking-tighter mt-1">{player.firstName} {player.lastName}</h2>
              </div>
           </div>
           <button 
             onClick={() => navigateTo(ViewState.SQUAD_VIEW)} 
             className="px-8 py-3 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase text-slate-400 hover:text-white transition-all active:scale-95 shadow-lg"
           >
             Powrót do kadry
           </button>
        </div>

        <div className="flex-1 p-10 flex gap-10 overflow-hidden">
           <div className="w-80 space-y-6 shrink-0">
              <div className="p-8 bg-black/40 rounded-[40px] border border-white/5 text-center relative overflow-hidden group">
                 <div className="absolute top-0 left-0 w-full h-1 bg-blue-500/50" />
                 <span className="text-[8px] font-black text-slate-500 uppercase block mb-4 tracking-[0.3em]">AKTUALNE WARUNKI</span>
                 <h3 className="text-2xl font-black text-white uppercase italic leading-tight">{player.lastName}</h3>
                 <p className="text-[10px] font-bold text-slate-400 mt-1">{player.overallRating} OVR • {player.age} lat</p>
                 <div className="mt-6 pt-6 border-t border-white/5 flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                       <span className="text-[9px] font-black text-slate-600 uppercase">Pensja:</span>
                       <span className="text-xs font-black text-emerald-400 font-mono">{player.annualSalary.toLocaleString()} PLN</span>
                    </div>
                    <div className="flex justify-between items-center">
                       <span className="text-[9px] font-black text-slate-600 uppercase">Wygasa:</span>
                       <span className="text-xs font-black text-white italic">{new Date(player.contractEndDate).getFullYear()}</span>
                    </div>
                 </div>
              </div>

              <div className="p-8 bg-black/40 rounded-[40px] border border-white/5 shadow-lg">
                 <span className="text-[8px] font-black text-slate-500 uppercase block mb-2 tracking-widest">BUDŻET KLUBU</span>
                 <span className="text-xl font-black text-emerald-400 font-mono italic tabular-nums">{club.budget.toLocaleString()} <span className="text-[10px] opacity-50">PLN</span></span>
              </div>

              <div className="p-6 bg-blue-600/5 border border-blue-500/10 rounded-3xl text-center">
                 <p className="text-[9px] text-slate-500 font-medium italic leading-relaxed">
                   "W negocjacjach liczy się cierpliwość. Zawodnik po 3 odrzuconych ofertach zakończy rozmowy na dłuższy czas."
                 </p>
              </div>
           </div>

           <div className="flex-1 flex flex-col gap-6 overflow-hidden">
              <div className="flex bg-black/40 p-1 rounded-2xl border border-white/5 shrink-0">
                 <button 
                    onClick={() => { setManagementMode('NEGOTIATE'); setBoardDecision(null); }}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all ${managementMode === 'NEGOTIATE' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                 >
                    NEGOCJUJ KONTRAKT
                 </button>
                 <button 
                    onClick={() => setManagementMode('RELEASE')}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all ${managementMode === 'RELEASE' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                 >
                    ROZWIĄŻ UMOWĘ
                 </button>
              </div>

              {managementMode === 'RELEASE' ? (
                <div className="flex-1 flex flex-col items-center justify-center p-12 bg-white/[0.02] border border-white/5 rounded-[50px] text-center gap-8">
                   {!boardDecision ? (
                      isLocked ? (
                        <div className="space-y-4 animate-pulse">
                           <div className="text-6xl">⏳</div>
                           <h4 className="text-2xl font-black text-red-500 uppercase italic">Zablokowane</h4>
                           <p className="text-sm text-slate-500">Zarząd odrzucił poprzedni wniosek. Spróbuj ponownie po {lockDateLabel}.</p>
                        </div>
                      ) : (
                        <>
                           <div className="text-5xl">📄</div>
                           <div className="max-w-md">
                              <h4 className="text-2xl font-black text-white uppercase italic">Wniosek do Zarządu</h4>
                              <p className="text-sm text-slate-400 mt-2">Rozwiązanie kontraktu kosztuje 40% rocznej pensji: <b>{penaltyAmount.toLocaleString()} PLN</b>.</p>
                           </div>
                           {isSquadTooSmall ? (
                              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-[10px] font-black uppercase">
                                 Blokada: Minimalna kadra (24 zawodników)
                              </div>
                           ) : (
                              <button onClick={requestBoardApproval} disabled={isProcessing} className="px-16 py-6 rounded-[30px] bg-red-600 hover:bg-red-500 text-white font-black italic uppercase text-lg shadow-2xl border-b-8 border-red-900 transition-all active:scale-95">
                                 {isProcessing ? 'ANALIZA FINANSOWA...' : 'WYŚLIJ PROŚBĘ O ZWOLNIENIE'}
                              </button>
                           )}
                        </>
                      )
                   ) : (
                      <div className={`flex-1 w-full p-8 rounded-[40px] border-2 flex flex-col gap-6 ${getStatusColor(boardDecision.status)}`}>
                         <div className="flex justify-between items-center">
                            <h4 className="text-3xl font-black italic uppercase">{boardDecision.status}</h4>
                            <span className="text-2xl font-black font-mono">{Math.round(boardDecision.woz)}/100</span>
                         </div>
                         <p className="text-lg italic text-white flex-1 flex items-center justify-center">"{boardDecision.reason}"</p>
                         <div className="flex gap-4">
                            <button onClick={() => setBoardDecision(null)} className="flex-1 py-4 rounded-2xl bg-black/20 text-[10px] font-black uppercase">Anuluj</button>
                            {(boardDecision.status === 'APPROVED' || boardDecision.status === 'WARNING') && (
                               <button onClick={handleReleasePlayer} className="flex-[2] py-4 rounded-2xl bg-red-600 text-white font-black uppercase italic border-b-4 border-red-800">POTWIERDŹ ZWOLNIENIE ❌</button>
                            )}
                         </div>
                      </div>
                   )}
                </div>
              ) : (
                <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-[50px] p-8 flex flex-col gap-6 relative overflow-y-auto custom-scrollbar">
                   
                   { (player.isNegotiationPermanentBlocked || (player.negotiationStep || 0) >= 3 || (player.negotiationLockoutUntil && new Date(currentDate) < new Date(player.negotiationLockoutUntil))) && !isOfferSent ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-center gap-6 animate-fade-in py-12">
                         <span className="text-7xl">⛔</span>
                         <h4 className="text-3xl font-black text-red-500 uppercase italic">Rozmowy Wstrzymane</h4>
                         <p className="text-slate-300 italic text-lg max-w-sm">
                            {player.isNegotiationPermanentBlocked 
                               ? "Nie traktujecie mnie powaznie wiec nie będziemy o niczym rozmawiac. Do widzenia!" 
                               : (player.negotiationStep >= 3 
                                  ? "Wykorzystałeś wszystkie próby w tym sezonie." 
                                  : `Zawodnik musi przemyśleć poprzednią ofertę. Powrót do rozmów możliwy po ${new Date(player.negotiationLockoutUntil!).toLocaleDateString()}.`
                               )
                            }
                         </p>
                         <button onClick={() => navigateTo(ViewState.SQUAD_VIEW)} className="mt-4 px-10 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase text-slate-500 hover:text-white transition-all">Powrót do kadry</button>
                      </div>
                   ) : (
                      <>
                        <div className="flex justify-between items-end shrink-0">
                           <div>
                              <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em]">OFERTA KONTRAKTOWA</span>
                              <h4 className="text-2xl font-black text-white italic uppercase tracking-tighter mt-1">Zaproponuj warunki</h4>
                           </div>
                           <div className="flex flex-col items-end">
                              <span className="text-[8px] font-black text-slate-600 uppercase mb-1">PROCES NEGOCJACJI</span>
                              <span className="text-[10px] font-black text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                                 PRÓBA {player.negotiationStep || 0} / 3
                              </span>
                           </div>
                        </div>

                        <div className="space-y-8 shrink-0">
                           <div className="space-y-4">
                              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Długość Nowej Umowy (Lata)</span>
                              <div className="flex gap-2">
                                 {[1, 2, 3, 4, 5].map(y => (
                                    <button 
                                       key={y} onClick={() => setOfferYears(y)}
                                       className={`flex-1 py-4 rounded-2xl font-black border transition-all ${offerYears === y ? 'bg-white text-black border-white shadow-xl scale-105' : 'bg-black/40 text-slate-500 border-white/5 hover:border-white/20'}`}
                                    >
                                       {y}
                                    </button>
                                 ))}
                              </div>
                           </div>

                           <div className="space-y-4">
                              <div className="flex justify-between items-end px-1">
                                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nowa Pensja Roczna</span>
                                 <div className="text-right">
                                    <span className="text-2xl font-black text-blue-400 font-mono italic">{offerSalary.toLocaleString()}</span>
                                    <span className="text-[10px] text-slate-600 ml-2 font-black">PLN / ROK</span>
                                 </div>
                              </div>
                              <input 
                                 type="range" min={Math.floor(player.annualSalary * 0.5)} max={Math.floor(player.annualSalary * 3)} step={5000}
                                 value={offerSalary} onChange={(e) => setOfferSalary(parseInt(e.target.value))}
                                 className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                              />
                           </div>

                           <div className="space-y-4">
                              <div className="flex justify-between items-end px-1">
                                 <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Jednorazowy Bonus za podpis</span>
                                    <span className="text-[8px] font-black text-emerald-500 uppercase mt-1">Dostępna pula: {club.signingBonusPool.toLocaleString()} PLN</span>
                                 </div>
                                 <div className="text-right">
                                    <span className="text-2xl font-black text-emerald-400 font-mono italic">{offerBonus.toLocaleString()}</span>
                                    <span className="text-[10px] text-slate-600 ml-2 font-black">PLN</span>
                                 </div>
                              </div>
                              <input 
                                 type="range" min={0} max={club.signingBonusPool} step={1000}
                                 value={offerBonus} onChange={(e) => setOfferBonus(parseInt(e.target.value))}
                                 className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                              />
                           </div>
                        </div>

                        <div className="mt-4 pb-4">
                           {negotiationMessage && (
                              <div className="space-y-4 mb-6">
                                 <div className="p-6 bg-white/5 border border-white/10 rounded-3xl text-sm italic text-slate-200 animate-slide-up flex gap-4 items-start shadow-xl">
                                    <span className="text-2xl">💬</span>
                                    <div className="flex-1">
                                       <p>"{negotiationMessage}"</p>
                                       {isOfferSent && !showSuccessModal && (
                                          <button 
                                             onClick={() => setIsOfferSent(false)}
                                             className="mt-3 text-[10px] font-black text-blue-400 uppercase tracking-widest hover:text-blue-300 transition-colors"
                                          >
                                             &larr; Skoryguj ofertę i spróbuj ponownie
                                          </button>
                                       )}
                                    </div>
                                 </div>
                                 
                                 {counterOffer && (
                                    <div className="p-6 bg-blue-600/10 border border-blue-500/30 rounded-3xl animate-slide-up flex flex-col gap-3 shadow-inner group">
                                       <div className="flex justify-between items-center">
                                          <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Wymagania Agenta:</span>
                                          <button 
                                             onClick={() => {
                                                setOfferSalary(counterOffer.salary);
                                                setOfferBonus(counterOffer.bonus);
                                                setIsOfferSent(false);
                                             }}
                                             className="text-[8px] font-black bg-blue-600 text-white px-3 py-1 rounded-full hover:bg-blue-500 transition-all shadow-lg active:scale-95"
                                          >
                                             ZASTOSUJ ŻĄDANIA AGENTA ✅
                                          </button>
                                       </div>
                                       <div className="flex justify-between items-center">
                                          <div className="flex flex-col">
                                             <span className="text-[8px] text-slate-500 uppercase font-bold">Pensja roczna:</span>
                                             <span className="text-sm font-black text-white font-mono">{counterOffer.salary.toLocaleString()} PLN</span>
                                          </div>
                                          <div className="flex flex-col text-right">
                                             <span className="text-[8px] text-slate-500 uppercase font-bold">Bonus za podpis:</span>
                                             <span className="text-sm font-black text-emerald-400 font-mono">{counterOffer.bonus.toLocaleString()} PLN</span>
                                          </div>
                                       </div>
                                       <p className="text-[9px] text-slate-500 italic mt-1">"To są nasze ostateczne warunki w tej turze negocjacji."</p>
                                    </div>
                                 )}
                              </div>
                           )}
                           
                           {/* Przycisk akcji głównej */}
                           { (!isOfferSent || isProcessing) && (
                              <button 
                                 onClick={handleSendOffer} 
                                 disabled={isProcessing || (offerBonus > club.signingBonusPool && club.signingBonusPool > 0)}
                                 className="w-full py-6 rounded-[30px] bg-emerald-600 hover:bg-emerald-500 text-white font-black italic text-xl uppercase tracking-tighter transition-all shadow-2xl border-b-8 border-emerald-900 flex items-center justify-center gap-4 active:scale-95 disabled:opacity-30"
                              >
                                 {isProcessing ? 'PRZESYŁANIE OFERTY...' : 'ZŁÓŻ OFERTĘ KONTRAKTOWĄ 📝'}
                              </button>
                           )}

                           { isOfferSent && !isProcessing && !showSuccessModal && (
                              <div className="flex gap-4">
                                 <button 
                                    onClick={() => navigateTo(ViewState.SQUAD_VIEW)}
                                    className="flex-1 py-4 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white"
                                 >
                                    Wróć później
                                 </button>
                                 <button 
                                    onClick={() => setIsOfferSent(false)}
                                    className="flex-[2] py-4 rounded-2xl bg-blue-600 text-white font-black uppercase italic tracking-tighter shadow-lg border-b-4 border-blue-800 active:scale-95"
                                 >
                                    RENEGOCJUJ WARUNKI ✍️
                                 </button>
                              </div>
                           )}
                        </div>
                      </>
                   )}
                </div>
              )}
           </div>
        </div>

      </div>

      {/* SUCCESS MODAL */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-6 animate-fade-in">
          <div className="max-w-md w-full bg-slate-900 border border-emerald-500/40 rounded-[50px] shadow-[0_0_100px_rgba(16,185,129,0.3)] p-12 text-center flex flex-col items-center gap-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500" />
            <div className="w-28 h-28 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-6xl shadow-2xl animate-bounce">
              🖋️
            </div>
            <div>
              <h3 className="text-3xl font-black italic text-white uppercase tracking-tighter">UMOWA PODPISANA!</h3>
              <div className="h-px w-12 bg-emerald-500/50 mx-auto my-4" />
              <p className="text-slate-300 text-sm leading-relaxed italic">
                "{negotiationMessage}"
              </p>
            </div>
            <div className="w-full space-y-3">
              <div className="flex justify-between p-5 bg-white/5 rounded-2xl border border-white/5 shadow-inner">
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nowa Pensja:</span>
                 <span className="text-sm font-black text-emerald-400 font-mono">{offerSalary.toLocaleString()} PLN</span>
              </div>
              <div className="flex justify-between p-5 bg-white/5 rounded-2xl border border-white/5 shadow-inner">
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Długość:</span>
                 <span className="text-sm font-black text-white italic">{offerYears} {offerYears === 1 ? 'ROK' : (offerYears < 5 ? 'LATA' : 'LAT')}</span>
              </div>
            </div>
            <button 
              onClick={() => navigateTo(ViewState.SQUAD_VIEW)}
              className="w-full py-6 bg-emerald-600 text-white font-black uppercase italic rounded-3xl hover:bg-emerald-500 transition-all shadow-[0_20px_40px_rgba(16,185,129,0.2)] active:scale-95 border-b-8 border-emerald-800 text-xl tracking-tighter"
            >
              POWRÓT DO KADRY 🏁
            </button>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; height: 22px; width: 22px; border-radius: 50%; background: #fff; cursor: pointer; border: 4px solid currentColor; box-shadow: 0 0 15px rgba(0,0,0,0.5); }
        @keyframes slide-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-slide-up { animation: slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.6s ease-out; }
      `}</style>
    </div>
  );
};
