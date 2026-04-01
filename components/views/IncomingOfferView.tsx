import React, { useMemo, useState } from 'react';
import { useGame } from '../../context/GameContext';
import { IncomingOfferStatus, TransferTiming, ViewState, Player } from '../../types';
import { FinanceService } from '../../services/FinanceService';
import { IncomingTransferService } from '../../services/IncomingTransferService';

const COUNTER_STEPS = [5_000, 10_000, 20_000, 50_000, 100_000];

const REPUTATION_LABELS: Record<number, string> = {
  1: '★☆☆☆☆',
  2: '★★☆☆☆',
  3: '★★★☆☆',
  4: '★★★★☆',
  5: '★★★★★',
};

export const IncomingOfferView: React.FC = () => {
  const {
    viewedIncomingOfferId,
    incomingOffers,
    players,
    clubs,
    leagues,
    userTeamId,
    currentDate,
    navigateWithoutHistory,
    respondToIncomingOffer,
    confirmIncomingTransfer,
  } = useGame();

  const offer = useMemo(
    () => incomingOffers.find(o => o.id === viewedIncomingOfferId) ?? null,
    [incomingOffers, viewedIncomingOfferId]
  );

  const data = useMemo(() => {
    if (!offer || !userTeamId) return null;

    let player = null as Player | null;
    for (const clubId in players) {
      const found = players[clubId].find(p => p.id === offer.playerId);
      if (found) { player = found; break; }
    }
    if (!player) return null;

    const sellerClub = clubs.find(c => c.id === userTeamId) ?? null;
    const buyerClub = clubs.find(c => c.id === offer.buyerClubId) ?? null;
    if (!sellerClub || !buyerClub) return null;

    const buyerLeague = leagues.find(l => l.id === buyerClub.leagueId);
    const marketValue = FinanceService.calculateMarketValue(
      player,
      sellerClub.reputation,
      FinanceService.getClubTier(sellerClub)
    );

    return { player, sellerClub, buyerClub, buyerLeague, marketValue };
  }, [offer, userTeamId, players, clubs, leagues]);

  const [counterFee, setCounterFee] = useState<number>(() => offer?.fee ?? 0);
  const [counterStep, setCounterStep] = useState<number>(50_000);
  const [showCounter, setShowCounter] = useState(false);

  if (!offer || !data) return null;

  const { player, sellerClub, buyerClub, buyerLeague, marketValue } = data;

  const timingLabel = IncomingTransferService.getTimingLabel(offer.timing);
  const repLabel = REPUTATION_LABELS[Math.round(buyerClub.reputation)] ?? '★☆☆☆☆';

  const isPendingResponse =
    offer.status === IncomingOfferStatus.EMAIL_SENT ||
    offer.status === IncomingOfferStatus.REMINDER_SENT;

  const isAICountered = offer.status === IncomingOfferStatus.AI_COUNTERED;

  const isNegotiating = offer.status === IncomingOfferStatus.NEGOTIATION_IN_PROGRESS;

  const isAwaiting = offer.status === IncomingOfferStatus.AWAITING_CONFIRMATION;

  const isCounterPending = offer.status === IncomingOfferStatus.COUNTER_PENDING_AI;

  const handleAccept = () => {
    respondToIncomingOffer(offer.id, 'accept');
  };

  const handleReject = () => {
    respondToIncomingOffer(offer.id, 'reject');
  };

  const handleSubmitCounter = () => {
    respondToIncomingOffer(offer.id, 'counter', counterFee);
    setShowCounter(false);
  };

  const handleConfirm = () => {
    confirmIncomingTransfer(offer.id, true);
  };

  const handleRejectConfirm = () => {
    confirmIncomingTransfer(offer.id, false);
  };

  const currentDisplayFee = isAICountered ? (offer.aiCounterFee ?? offer.fee) : offer.fee;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://i.ibb.co/JwgrBtvC/biuro2-1.png')] bg-cover bg-center opacity-20" />
      <div className="absolute inset-0 bg-black/55" />

      <div className="relative z-10 w-full max-w-4xl bg-slate-900/85 border border-white/10 rounded-[42px] shadow-[0_40px_120px_rgba(0,0,0,0.75)] overflow-hidden">

        {/* Header */}
        <div className="p-8 border-b border-white/10 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-400">Oferta Transferowa</span>
            <h1 className="text-3xl font-black italic uppercase tracking-tight mt-2">
              {player.firstName} {player.lastName}
            </h1>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mt-2">
              {player.position} · {player.overallRating} OVR · wiek {player.age}
            </p>
          </div>
          <button
            onClick={() => navigateWithoutHistory(ViewState.DASHBOARD)}
            className="px-6 py-3 rounded-2xl bg-white text-slate-900 font-black uppercase tracking-widest text-xs"
          >
            Zamknij
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8">

          {/* Lewa kolumna — dane */}
          <div className="space-y-4">

            {/* Nacisk zarządu */}
            {offer.boardPressure && (
              <div className="rounded-[20px] border border-red-500/40 bg-red-500/10 p-4">
                <p className="text-[9px] font-black uppercase tracking-[0.35em] text-red-400 mb-1">Nacisk Zarządu</p>
                <p className="text-xs text-red-300 leading-relaxed">
                  Zarząd rozważa sprzedaż. Odrzucenie oferty może negatywnie wpłynąć na zaufanie zarządu.
                </p>
              </div>
            )}

            {/* Kupujący klub */}
            <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
              <p className="text-[9px] font-black uppercase tracking-[0.35em] text-slate-500 mb-4">Kupujący Klub</p>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400">Klub</span>
                  <span className="font-black text-white text-right">{buyerClub.name}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400">Liga</span>
                  <span className="font-black text-slate-200 text-right">{buyerLeague?.name ?? buyerClub.leagueId}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400">Reputacja</span>
                  <span className="font-black text-amber-400 text-right">{repLabel}</span>
                </div>
              </div>
            </div>

            {/* Zawodnik */}
            <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
              <p className="text-[9px] font-black uppercase tracking-[0.35em] text-slate-500 mb-4">Zawodnik</p>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400">OVR</span>
                  <span className="font-black text-white text-right">{player.overallRating}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400">Wiek</span>
                  <span className="font-black text-white text-right">{player.age} lat</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400">Wartość rynkowa</span>
                  <span className="font-black text-emerald-400 text-right">{marketValue.toLocaleString('pl-PL')} PLN</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400">Kontrakt do</span>
                  <span className="font-black text-white text-right">
                    {new Date(player.contractEndDate).toLocaleDateString('pl-PL')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Prawa kolumna — oferta + akcje */}
          <div className="space-y-4">

            {/* Szczegóły oferty */}
            <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
              <p className="text-[9px] font-black uppercase tracking-[0.35em] text-slate-500 mb-4">Oferta</p>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400">Proponowana kwota</span>
                  <span className="font-black text-2xl text-amber-400 text-right">
                    {currentDisplayFee.toLocaleString('pl-PL')} PLN
                  </span>
                </div>
                {isAICountered && offer.counterFee && (
                  <div className="flex justify-between gap-4 text-xs">
                    <span className="text-slate-500">Nasza kontra</span>
                    <span className="text-slate-400 text-right">{offer.counterFee.toLocaleString('pl-PL')} PLN</span>
                  </div>
                )}
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400">Termin przejścia</span>
                  <span className="font-black text-white text-right">{timingLabel}</span>
                </div>
                {offer.negotiationRound > 0 && (
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-400">Runda negocjacji</span>
                    <span className="font-black text-slate-300 text-right">{offer.negotiationRound} / 3</span>
                  </div>
                )}
              </div>
            </div>

            {/* Stany terminalne */}
            {offer.status === IncomingOfferStatus.EXPIRED && (
              <div className="rounded-[20px] border border-slate-500/40 bg-slate-500/10 p-4 text-center">
                <p className="text-xs text-slate-400">Oferta wygasła z powodu braku odpowiedzi.</p>
              </div>
            )}
            {offer.status === IncomingOfferStatus.REJECTED_BY_MANAGER && (
              <div className="rounded-[20px] border border-red-500/30 bg-red-500/10 p-4 text-center">
                <p className="text-xs text-red-300">Oferta została odrzucona.</p>
              </div>
            )}
            {offer.status === IncomingOfferStatus.PLAYER_REFUSED && (
              <div className="rounded-[20px] border border-orange-500/30 bg-orange-500/10 p-4 text-center">
                <p className="text-xs text-orange-300">Zawodnik odmówił rozmów z {buyerClub.name}.</p>
              </div>
            )}
            {offer.status === IncomingOfferStatus.COMPLETED && (
              <div className="rounded-[20px] border border-emerald-500/40 bg-emerald-500/10 p-4 text-center">
                <p className="text-xs text-emerald-400 font-black">Transfer zakończony pomyślnie.</p>
              </div>
            )}
            {offer.status === IncomingOfferStatus.REJECTED_AT_CONFIRM && (
              <div className="rounded-[20px] border border-slate-500/40 bg-slate-500/10 p-4 text-center">
                <p className="text-xs text-slate-400">Transfer odrzucony na etapie zatwierdzenia.</p>
              </div>
            )}

            {/* Oczekiwanie na odpowiedź AI */}
            {isCounterPending && (
              <div className="rounded-[20px] border border-amber-500/30 bg-amber-500/10 p-4 text-center">
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-amber-400 mb-1">W toku</p>
                <p className="text-xs text-amber-200">{buyerClub.name} rozpatruje naszą kontrofertę. Odpowiedź jutro.</p>
              </div>
            )}

            {/* Negocjacje z zawodnikiem w tle */}
            {isNegotiating && (
              <div className="rounded-[20px] border border-blue-500/30 bg-blue-500/10 p-4 text-center">
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-blue-400 mb-1">Negocjacje trwają</p>
                <p className="text-xs text-blue-200">
                  {buyerClub.name} negocjuje bezpośrednio z {player.firstName} {player.lastName}.
                  Poinformujemy Pana o wynikach w ciągu 2-3 dni.
                </p>
              </div>
            )}

            {/* Zatwierdzenie transferu */}
            {isAwaiting && (
              <div className="rounded-[20px] border border-emerald-500/40 bg-emerald-500/10 p-5 space-y-4">
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-emerald-400">Zawodnik się zgodził</p>
                <p className="text-xs text-emerald-200 leading-relaxed">
                  {player.firstName} {player.lastName} zaakceptował warunki {buyerClub.name}.
                  Kwota transferu: <span className="font-black">{offer.fee.toLocaleString('pl-PL')} PLN</span>.
                  Czy zatwierdza Pan ten transfer?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleConfirm}
                    className="flex-1 py-3 rounded-2xl bg-emerald-500 text-white font-black uppercase tracking-widest text-xs hover:bg-emerald-400 transition-colors"
                  >
                    Zatwierdź transfer
                  </button>
                  <button
                    onClick={handleRejectConfirm}
                    className="flex-1 py-3 rounded-2xl bg-white/10 text-white font-black uppercase tracking-widest text-xs hover:bg-white/15 transition-colors"
                  >
                    Odrzuć
                  </button>
                </div>
              </div>
            )}

            {/* Główne przyciski akcji */}
            {(isPendingResponse || isAICountered) && !showCounter && (
              <div className="space-y-3">
                <button
                  onClick={handleAccept}
                  className="w-full py-4 rounded-2xl bg-emerald-500 text-white font-black uppercase tracking-widest text-xs hover:bg-emerald-400 transition-colors"
                >
                  Akceptuj ofertę
                </button>
                {offer.negotiationRound < 3 && (
                  <button
                    onClick={() => {
                      setCounterFee(currentDisplayFee);
                      setShowCounter(true);
                    }}
                    className="w-full py-4 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-black uppercase tracking-widest text-xs hover:bg-amber-500/30 transition-colors"
                  >
                    Podbij cenę ({offer.negotiationRound + 1}/3)
                  </button>
                )}
                <button
                  onClick={handleReject}
                  className="w-full py-4 rounded-2xl bg-white/8 border border-white/10 text-slate-400 font-black uppercase tracking-widest text-xs hover:bg-white/12 transition-colors"
                >
                  Odrzuć ofertę{offer.boardPressure ? ' (kara: -8 zaufania zarządu)' : ''}
                </button>
              </div>
            )}

            {/* Panel podbijania ceny */}
            {showCounter && (
              <div className="rounded-[28px] border border-amber-500/30 bg-amber-500/5 p-5 space-y-4">
                <p className="text-[9px] font-black uppercase tracking-[0.35em] text-amber-400">Twoja kontroferta</p>

                {/* Wybór kroku */}
                <div>
                  <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-2">Krok zmiany</p>
                  <div className="flex gap-2 flex-wrap">
                    {COUNTER_STEPS.map(step => (
                      <button
                        key={step}
                        onClick={() => setCounterStep(step)}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-colors ${
                          counterStep === step
                            ? 'bg-amber-500 text-white'
                            : 'bg-white/8 text-slate-400 hover:bg-white/12'
                        }`}
                      >
                        {step >= 1000 ? `${step / 1000}k` : step}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Przyciski +/- i kwota */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setCounterFee(prev => Math.max(currentDisplayFee, prev - counterStep))}
                    className="w-12 h-12 rounded-2xl bg-white/8 text-white font-black text-xl hover:bg-white/15 transition-colors flex items-center justify-center"
                  >
                    −
                  </button>
                  <div className="flex-1 text-center">
                    <p className="text-2xl font-black text-white">{counterFee.toLocaleString('pl-PL')}</p>
                    <p className="text-[9px] text-slate-500 uppercase tracking-widest">PLN</p>
                  </div>
                  <button
                    onClick={() => setCounterFee(prev => prev + counterStep)}
                    className="w-12 h-12 rounded-2xl bg-white/8 text-white font-black text-xl hover:bg-white/15 transition-colors flex items-center justify-center"
                  >
                    +
                  </button>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleSubmitCounter}
                    className="flex-1 py-3 rounded-2xl bg-amber-500 text-white font-black uppercase tracking-widest text-xs hover:bg-amber-400 transition-colors"
                  >
                    Wyślij kontrofertę
                  </button>
                  <button
                    onClick={() => setShowCounter(false)}
                    className="px-5 py-3 rounded-2xl bg-white/8 text-slate-400 font-black uppercase tracking-widest text-xs hover:bg-white/12 transition-colors"
                  >
                    Wróć
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
