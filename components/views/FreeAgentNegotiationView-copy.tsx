import React, { useMemo, useState } from 'react';
import { useGame } from '../../context/GameContext';
import { ViewState } from '../../types';
import { FreeAgentNegotiationService } from '../../services/FreeAgentNegotiationService';
import { FinanceService } from '@/services/FinanceService';

export const FreeAgentNegotiationView: React.FC = () => {
  const { viewedPlayerId, players, clubs, navigateTo, userTeamId, currentDate, setPendingNegotiations, updatePlayer } = useGame();

  // Dane zawodnika i klubu
  const player = useMemo(() => (players['FREE_AGENTS'] || []).find(p => p.id === viewedPlayerId), [players, viewedPlayerId]);
  const myClub = useMemo(() => clubs.find(c => c.id === userTeamId), [clubs, userTeamId]);

  // Dynamiczne limity oparte na finansach klubu
  const maxSalaryAllowed = useMemo(() => {
    if (!myClub || !player) return 500000;
    const fair = FinanceService.getFairMarketSalary(player.overallRating);
    
    let budgetMultiplier = 0.25; // Standardowo 25% budżetu na jedną pensję
    let fairMultiplier = 4;      // Standardowo 4x wycena rynkowa

    // Jeśli klub jest bardzo bogaty (>150 mln) i zawodnik to gwiazda (OVR > 75)
    if (myClub.budget > 150000000 && player.overallRating > 75) {
      budgetMultiplier = 0.40; // Zarząd pozwala wydać aż 40% budżetu
      fairMultiplier = 8;      // Pozwala przepłacić aż 8-krotnie, byle go pozyskać
    }

    const logicLimit = fair * fairMultiplier;
    const budgetLimit = myClub.budget * budgetMultiplier;
    return Math.floor(Math.min(logicLimit, budgetLimit));
  }, [myClub, player]);

  const maxBonusAllowed = useMemo(() => {
    if (!myClub || !player) return 0;
    const ovrFactor = Math.pow(player.overallRating / 80, 2);
    const scaledMax = myClub.signingBonusPool * ovrFactor;
    return Math.floor(Math.min(myClub.signingBonusPool, scaledMax));
  }, [myClub, player]);

  // Stan formularza
  const [salary, setSalary] = useState(() => {
    const suggested = player ? player.overallRating * 1800 : 50000;
    return Math.min(suggested, maxSalaryAllowed);
  });
  const [bonus, setBonus] = useState(() => Math.min(25000, maxBonusAllowed));
  const [years, setYears] = useState(2);
  const [isSending, setIsSending] = useState(false);
  const [agentReaction, setAgentReaction] = useState<{ type: string, msg: string } | null>(null);

  // LOGIKA WSTĘPNEGO ZAINTERESOWANIA (Gatekeeping)
  const isInterested = useMemo(() => {
    // Jeśli to gwiazda (OVR > 70) i mały klub (REP < 5)
    if (player && player.overallRating > 70 && myClub && myClub.reputation < 5) {
      // 1% szansy na to, że jednak zechce rozmawiać (99% na blokadę)
      const interestRoll = Math.random();
      if (interestRoll > 0.01) return false;
    }
    return true;
  }, [player, myClub]);

  if (!player || !myClub) return null;

  const [boardVeto, setBoardVeto] = useState<{ msg: string } | null>(null);

  const handleConfirm = () => {
    if (!isInterested) return;

    // 1. SPRAWDZENIE BLOKADY CZASOWEJ
    if (player.freeAgentLockoutUntil && new Date(currentDate) < new Date(player.freeAgentLockoutUntil)) {
       setBoardVeto({ msg: `ZAWODNIK ODRZUCIŁ TWOJĄ POPRZEDNIĄ OFERTĘ. POWRÓT DO ROZMÓW MOŻLIWY DOPIERO ZA ROK: ${new Date(player.freeAgentLockoutUntil).toLocaleDateString()}` });
       return;
    }

    const mySquad = players[userTeamId!] || [];
    if (mySquad.length >= 30) {
      setBoardVeto({ 
        msg: "ZARZĄD NIE ZEZWALA NA ZATRUDNIENIE, PONIEWAŻ UWAŻA, ŻE MAMY WYSTARCZAJĄCA LICZBĘ ZAWODNIKÓW. JEŚLI CHCIALBY PAN ZATRUDNIĆ NOWYCH ZAWODNIKÓW, MUSI PAN PRZETASOWAĆ OBECNY SKŁAD." 
      });
      return;
    }

    const avgSquadSalary = mySquad.length > 0 ? mySquad.reduce((s, p) => s + p.annualSalary, 0) / mySquad.length : 120000;
    
    const boardCheck = FinanceService.evaluateFASigningBoardDecision(player, salary, bonus, mySquad, myClub);
    if (!boardCheck.approved) {
      setBoardVeto({ msg: boardCheck.reason });
      return;
    }

    setIsSending(true);
    
    const expected = FinanceService.calculateFAExpectations(player, myClub.reputation, avgSquadSalary);
    const ratio = salary / expected;
    
    let reaction = { type: 'GOOD', msg: "Dziękujemy. Przeanalizujemy te warunki i wrócimy z odpowiedzią." };
    if (ratio < 0.45) reaction = { type: 'INSULT', msg: "Czy to jest jakiś żart? Przykro mi to powiedzieć ale wykazaliście się Państwo totalnym brakiem profesjonalizmu! Na tym kończymy nasze rozmowy." };
    else if (ratio < 0.7) reaction = { type: 'WEAK', msg: "Cóż... oferta nie jest zbyt atrakcyjna. Potrzebujemy troche czasu aby ją przedyskutować." };

    setTimeout(() => {
      setAgentReaction(reaction);
      
      if (reaction.type === 'INSULT') {
        const lockoutDate = new Date(currentDate);
        lockoutDate.setFullYear(lockoutDate.getFullYear() + 1);
        
        updatePlayer('FREE_AGENTS', player.id, { 
          freeAgentLockoutUntil: lockoutDate.toISOString(),
          isNegotiationPermanentBlocked: true 
        });
      }

      if (reaction.type !== 'INSULT') {
        const newNeg = FreeAgentNegotiationService.createNegotiationEntry(
          player, myClub, salary, bonus, years, currentDate, players[userTeamId!] || []
        );
        setPendingNegotiations(prev => [...prev, newNeg]);
      }
      setIsSending(false);
    }, 1500);
  };

  return (
    <div className="h-screen w-full bg-slate-950 flex items-center justify-center p-6 animate-fade-in overflow-hidden relative">
      <div className="absolute inset-0 bg-[url('https://i.ibb.co/JwgrBtvC/biuro2-1.png')] bg-cover bg-center opacity-20" />
      
      <div className="max-w-4xl w-full bg-slate-900/90 border border-white/10 rounded-[50px] backdrop-blur-3xl shadow-2xl p-12 flex flex-col gap-10 relative z-10">
        
        <header className="flex justify-between items-center border-b border-white/5 pb-8">
          <div>
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em]">Biuro Negocjacji</span>
            <h2 className="text-4xl font-black italic text-white uppercase tracking-tighter mt-1">{player.firstName} {player.lastName}</h2>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{player.position} • {player.overallRating} OVR • Wolny Agent</p>
          </div>
          <button onClick={() => navigateTo(ViewState.JOB_MARKET)} className="px-6 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase text-slate-400 hover:text-white transition-all">Anuluj</button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {!isInterested ? (
            <div className="col-span-2 bg-red-600/10 border-2 border-red-600/30 p-12 rounded-[40px] text-center animate-pulse">
               <div className="text-7xl mb-6">🧑‍💼</div>
               <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-4">MÓJ KLIENT NIE JEST ZAINTERESOWANY GRĄ W WASZEJ DRUŻYNIE</h3>
               <p className="text-slate-400 text-lg italic max-w-2xl mx-auto">
                 "Z całym szacunkiem, ale poziom sportowy oraz reputacja Państwa klubu nie odpowiadają ambicjom mojego klienta. Szukamy wyzwań w znacznie silniejszych ligach."
               </p>
            </div>
          ) : (
            <>
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pensja Roczna</span>
                    <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-xl border border-white/10">
                       <input 
                        type="number"
                        value={salary}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setSalary(Math.min(val, maxSalaryAllowed));
                        }}
                        className="bg-transparent border-none outline-none text-xl font-black text-emerald-400 font-mono italic w-32 text-right"
                       />
                       <span className="text-xs font-black text-slate-500">PLN</span>
                    </div>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max={maxSalaryAllowed} 
                    step="5000" 
                    value={salary} 
                    onChange={(e) => setSalary(parseInt(e.target.value))} 
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500" 
                  />
                  <div className="flex justify-between px-1">
                    <span className="text-[8px] font-bold text-slate-600 uppercase">Min: 0</span>
                    <span className="text-[8px] font-bold text-slate-600 uppercase">Limit Zarządu: {maxSalaryAllowed.toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Bonus za podpis</span>
                    <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-xl border border-white/10">
                       <input 
                        type="number"
                        value={bonus}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setBonus(Math.min(val, maxBonusAllowed));
                        }}
                        className="bg-transparent border-none outline-none text-xl font-black text-blue-400 font-mono italic w-32 text-right"
                       />
                       <span className="text-xs font-black text-slate-500">PLN</span>
                    </div>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max={maxBonusAllowed} 
                    step="1000" 
                    value={bonus} 
                    onChange={(e) => setBonus(parseInt(e.target.value))} 
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500" 
                  />
                  <div className="flex justify-between px-1">
                    <span className="text-[8px] font-bold text-slate-600 uppercase">Brak</span>
                    <span className="text-[8px] font-bold text-slate-600 uppercase">Limit (OVR): {maxBonusAllowed.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-8 bg-black/20 p-8 rounded-[40px] border border-white/5">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block text-center mb-4">Długość Kontraktu</span>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(y => (
                    <button key={y} onClick={() => setYears(y)} className={`flex-1 py-4 rounded-2xl font-black border transition-all ${years === y ? 'bg-white text-black border-white shadow-lg' : 'bg-black/40 text-slate-500 border-white/5 hover:border-white/20'}`}>
                      {y} {y === 1 ? 'Rok' : 'Lata'}
                    </button>
                  ))}
                </div>
                <div className="mt-6 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl text-center">
                   <p className="text-[14px] text-slate-500 font-black italic text-white">"Zarząd pozwala na przeznaczenie do 25% budżetu na jedną pensję wolnego agenta. Bonusy za podpis są ograniczone klasą sportową zawodnika."</p>
                </div>
              </div>
            </>
          )}
        </div>

        <button 
          onClick={handleConfirm}
          disabled={isSending || !isInterested}
          className={`w-full py-6 rounded-[30px] font-black italic text-2xl uppercase tracking-tighter transition-all shadow-2xl border-b-8 active:scale-95 
            ${!isInterested 
              ? 'bg-slate-800 border-slate-900 text-slate-500 cursor-not-allowed' 
              : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-800'}`}
        >
          {isSending ? 'PRZESYŁANIE OFERTY...' : !isInterested ? 'BRAK ZAINTERESOWANIA ZE STRONY AGENTA 🚫' : 'WYŚLIJ OFERTĘ DO AGENTA 💼'}
        </button>
      </div>

      {agentReaction && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in p-6">
          <div className={`max-w-md w-full p-10 rounded-[40px] border-2 shadow-2xl text-center flex flex-col items-center gap-6 ${agentReaction.type === 'INSULT' ? 'border-red-500 bg-red-950/20' : 'border-emerald-500 bg-slate-900'}`}>
            <div className="text-6xl mb-2">{agentReaction.type === 'INSULT' ? '🧑‍💼' : '💼'}</div>
            <h3 className="text-2xl font-black uppercase italic text-white">Odpowiedź Agenta</h3>
            <p className="text-slate-300 italic">"{agentReaction.msg}"</p>
            <button 
              onClick={() => navigateTo(ViewState.DASHBOARD)}
              className="mt-4 w-full py-4 bg-white text-black font-black uppercase rounded-2xl hover:scale-105 transition-all shadow-xl"
            >
              Zrozumiałem
            </button>
          </div>
        </div>
      )}

      {boardVeto && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-lg animate-fade-in p-6">
          <div className="max-w-md w-full p-10 rounded-[40px] border-2 border-red-500 bg-slate-900 shadow-[0_0_100px_rgba(239,68,68,0.2)] text-center flex flex-col items-center gap-6">
            <div className="w-20 h-20 rounded-3xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-5xl shadow-inner">🏛️</div>
            <h3 className="text-2xl font-black uppercase italic text-red-500 tracking-tighter">VETO ZARZĄDU</h3>
            <p className="text-slate-300 italic font-medium leading-relaxed">"{boardVeto.msg}"</p>
            <button 
              onClick={() => setBoardVeto(null)}
              className="mt-4 w-full py-5 bg-red-600 text-white font-black uppercase rounded-2xl hover:bg-red-500 transition-all shadow-xl border-b-4 border-red-900 active:scale-95"
            >
              SKORYGUJĘ OFERTĘ
            </button>
          </div>
        </div>
      )}
    </div>
  );
};