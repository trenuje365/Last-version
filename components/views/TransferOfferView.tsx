import React, { useEffect, useMemo, useState } from 'react';
import { useGame } from '../../context/GameContext';
import { TransferOfferStatus, TransferTiming, ViewState } from '../../types';
import { FinanceService } from '../../services/FinanceService';
import { TransferSellerLogicService } from '../../services/TransferSellerLogicService';

interface TransferFeedback {
  ok: boolean;
  status: TransferOfferStatus | 'VALIDATION_ERROR';
  message: string;
  offerId?: string;
  askingPrice?: number;
}

export const TransferOfferView: React.FC = () => {
  const {
    viewedPlayerId,
    players,
    clubs,
    userTeamId,
    currentDate,
    transferOffers,
    navigateWithoutHistory,
    submitTransferOffer
  } = useGame();

  const data = useMemo(() => {
    if (!viewedPlayerId || !userTeamId) return null;

    let player = null as (typeof players[string][number] | null);
    for (const clubId in players) {
      const found = players[clubId].find(p => p.id === viewedPlayerId);
      if (found) {
        player = found;
        break;
      }
    }

    if (!player) return null;

    return {
      player,
      buyerClub: clubs.find(c => c.id === userTeamId) || null,
      sellerClub: clubs.find(c => c.id === player.clubId) || null
    };
  }, [viewedPlayerId, userTeamId, players, clubs]);

  const { player, buyerClub, sellerClub } = data || {};
  const [timing, setTiming] = useState<TransferTiming>(TransferTiming.IMMEDIATE);
  const hasPendingTransfer = !!player?.transferPendingClubId && !!player?.transferReportDate;

  const sellerOpeningStance = useMemo(() => {
    if (!player || !buyerClub || !sellerClub) return null;

    return TransferSellerLogicService.getNegotiationStance(
      player,
      sellerClub,
      buyerClub,
      players[sellerClub.id] || [],
      currentDate,
      timing
    );
  }, [player, buyerClub, sellerClub, players, currentDate, timing]);

  const latestOffer = useMemo(() => {
    if (!player || !userTeamId) return null;
    return transferOffers.find(
      offer =>
        offer.playerId === player.id &&
        offer.buyerClubId === userTeamId &&
        offer.timing === timing
    ) || null;
  }, [player, transferOffers, userTeamId, timing]);
  const hasAnyActiveAgreement = useMemo(() => {
    if (!player || !userTeamId) return false;
    return transferOffers.some(
      offer =>
        offer.playerId === player.id &&
        offer.buyerClubId === userTeamId &&
        (
          offer.status === TransferOfferStatus.PLAYER_NEGOTIATION ||
          offer.status === TransferOfferStatus.AGREED_PRECONTRACT
        )
    );
  }, [player, transferOffers, userTeamId]);
  const hasFutureAgreement = useMemo(() => {
    if (!player || !userTeamId) return false;
    return transferOffers.some(
      offer =>
        offer.playerId === player.id &&
        offer.buyerClubId === userTeamId &&
        offer.status === TransferOfferStatus.AGREED_PRECONTRACT
    );
  }, [player, transferOffers, userTeamId]);

  const contractEndDate = useMemo(() => player ? new Date(player.contractEndDate) : null, [player]);
  const daysUntilContractEnd = useMemo(() => {
    if (!contractEndDate) return 9999;
    return Math.floor((contractEndDate.getTime() - new Date(currentDate).getTime()) / 86_400_000);
  }, [contractEndDate, currentDate]);
  const canSignPreContract = daysUntilContractEnd > 0 && daysUntilContractEnd <= 365;
  const timingLabel = useMemo(() => {
    switch (timing) {
      case TransferTiming.IN_SIX_MONTHS:
        return 'Za 6 miesiecy';
      case TransferTiming.IN_TWELVE_MONTHS:
        return 'Za 12 miesiecy';
      case TransferTiming.CONTRACT_END:
        return 'Po koncu obecnej umowy';
      default:
        return 'Natychmiast';
    }
  }, [timing]);

  const marketValue = useMemo(() => {
    if (!player || !sellerClub) return 500_000;
    const sellerTier = FinanceService.getClubTier(sellerClub);
    return FinanceService.calculateMarketValue(player, sellerClub.reputation, sellerTier);
  }, [player, sellerClub]);
  const suggestedFee = useMemo(() => {
    if (!player) return 500_000;
    const base = player.isOnTransferList ? marketValue * 0.95 : marketValue * 1.10;
    return Math.round(base / 50_000) * 50_000;
  }, [player, marketValue]);

  const maxFee = useMemo(() => {
    if (!player || !buyerClub) return 1_000_000;
    const fairFee = Math.max(marketValue, FinanceService.getFairMarketSalary(player.overallRating) * 6);
    const multiplier = player.age <= 21 || player.overallRating >= 80 ? 3.5 : 2.8;
    return Math.floor(Math.min(buyerClub.budget, fairFee * multiplier));
  }, [player, buyerClub, marketValue]);

  const [fee, setFee] = useState(() => Math.max(100_000, suggestedFee));
  const [submissionFeedback, setSubmissionFeedback] = useState<TransferFeedback | null>(null);

  useEffect(() => {
    if (!player) return;

    const nextFee = latestOffer?.status === TransferOfferStatus.SELLER_COUNTERED && latestOffer.askingPrice
      ? latestOffer.askingPrice
      : suggestedFee;

    setFee(Math.max(100_000, nextFee));
    setSubmissionFeedback(null);
  }, [player?.id, suggestedFee, latestOffer?.id, latestOffer?.status, latestOffer?.askingPrice, timing]);

  if (!data || !player || !buyerClub || !sellerClub) {
    return null;
  }

  const handleSubmit = () => {
    const result = submitTransferOffer(player.id, {
      fee: timing === TransferTiming.CONTRACT_END ? 0 : fee,
      timing
    });
    setSubmissionFeedback({
      ok: result.ok,
      status: result.status,
      message: result.message,
      offerId: result.offer?.id,
      askingPrice: result.offer?.askingPrice
    });

    if (result.status === TransferOfferStatus.SELLER_COUNTERED && result.offer?.askingPrice) {
      setFee(Math.max(100_000, result.offer.askingPrice));
    }
  };

  const handleOpenNegotiation = () => {
    navigateWithoutHistory(ViewState.TRANSFER_PLAYER_NEGOTIATION);
  };

  const activeStatus = submissionFeedback?.status || latestOffer?.status || null;
  const canOpenNegotiation = activeStatus === TransferOfferStatus.PLAYER_NEGOTIATION;
  const isTransferLocked = !!(player.transferLockoutUntil && new Date(currentDate) < new Date(player.transferLockoutUntil));
  const isTransferOfferBanned = !!(player.transferOfferBanUntil && new Date(currentDate) < new Date(player.transferOfferBanUntil));
  const isUnavailable = player.clubId === userTeamId || player.clubId === 'FREE_AGENTS' || hasPendingTransfer;
  const clubRefusesTalks = timing === TransferTiming.CONTRACT_END
    ? !canSignPreContract
    : sellerOpeningStance?.allowTalks === false;
  const isFutureAgreementSigned = hasFutureAgreement;
  const isTransferCompleted = latestOffer?.status === TransferOfferStatus.COMPLETED;
  const hasPositiveResolution =
    submissionFeedback?.ok ||
    canOpenNegotiation ||
    activeStatus === TransferOfferStatus.AGREED_PRECONTRACT ||
    activeStatus === TransferOfferStatus.COMPLETED;
  const responseBoxClass = hasPositiveResolution
    ? 'bg-emerald-500/10 border-emerald-500/30'
    : activeStatus === TransferOfferStatus.SELLER_COUNTERED
      ? 'bg-amber-500/10 border-amber-500/30'
      : 'bg-red-500/10 border-red-500/30';

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://i.ibb.co/JwgrBtvC/biuro2-1.png')] bg-cover bg-center opacity-20" />
      <div className="absolute inset-0 bg-black/55" />

      <div className="relative z-10 w-full max-w-5xl bg-slate-900/85 border border-white/10 rounded-[42px] shadow-[0_40px_120px_rgba(0,0,0,0.75)] overflow-hidden">
        <div className="p-8 border-b border-white/10 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-400">Negocjacje Klubow</span>
            <h1 className="text-3xl font-black italic uppercase tracking-tight mt-2">
              {player.firstName} {player.lastName}
            </h1>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mt-2">
              {player.position} - {player.overallRating} OVR - {sellerClub.name}
            </p>
          </div>
          <button
            onClick={() => navigateWithoutHistory(ViewState.PLAYER_CARD)}
            className="px-6 py-3 rounded-2xl bg-white text-slate-900 font-black uppercase tracking-widest text-xs"
          >
            Powrot
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_1.2fr] gap-8 p-8">
          <div className="space-y-4">
            <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
              <p className="text-[9px] font-black uppercase tracking-[0.35em] text-slate-500">Stanowisko Klubu</p>
              <div className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400">Klub sprzedajacy</span>
                  <span className="font-black text-white text-right">{sellerClub.name}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400">Wartosc rynkowa</span>
                  <span className="font-black text-emerald-400 text-right">{marketValue.toLocaleString()} PLN</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400">Aktualna pensja</span>
                  <span className="font-black text-white text-right">{player.annualSalary.toLocaleString()} PLN</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400">Kontrakt do</span>
                  <span className="font-black text-white text-right">{new Date(player.contractEndDate).toLocaleDateString('pl-PL')}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400">Budzet twojego klubu</span>
                  <span className="font-black text-blue-400 text-right">{buyerClub.budget.toLocaleString()} PLN</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400">Tryb transferu</span>
                  <span className="font-black text-white text-right">
                    {timingLabel}
                  </span>
                </div>
                {timing !== TransferTiming.IMMEDIATE && contractEndDate ? (
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-400">Planowana data przejscia</span>
                    <span className="font-black text-emerald-400 text-right">
                      {timing === TransferTiming.CONTRACT_END
                        ? contractEndDate.toLocaleDateString('pl-PL')
                        : (() => {
                            const date = new Date(currentDate);
                            if (timing === TransferTiming.IN_SIX_MONTHS) date.setMonth(date.getMonth() + 6);
                            if (timing === TransferTiming.IN_TWELVE_MONTHS) date.setFullYear(date.getFullYear() + 1);
                            return date.toLocaleDateString('pl-PL');
                          })()}
                    </span>
                  </div>
                ) : null}
                {latestOffer?.askingPrice ? (
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-400">Oczekiwana cena</span>
                    <span className="font-black text-amber-400 text-right">{latestOffer.askingPrice.toLocaleString()} PLN</span>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
              <p className="text-[9px] font-black uppercase tracking-[0.35em] text-slate-500">Biuro Zarzadu</p>
              <div className="mt-4 text-sm text-slate-300 space-y-2">
                {timing === TransferTiming.CONTRACT_END ? (
                  canSignPreContract ? (
                    <>
                      <p>Zawodnik wchodzi w ostatni rok kontraktu. Mozesz podpisac z nim umowe obowiazujaca od {contractEndDate?.toLocaleDateString('pl-PL')} bez odstepnego dla obecnego klubu.</p>
                      <p className="text-emerald-300">
                        W tym trybie nie negocjujesz ceny z klubem. Rozmawiasz od razu z zawodnikiem o pensji, bonusie i dlugosci nowej umowy.
                      </p>
                    </>
                  ) : (
                    <p>Ten zawodnik nie wszedl jeszcze w ostatni rok kontraktu. Na razie mozesz rozmawiac tylko o natychmiastowym transferze.</p>
                  )
                ) : (
                  <>
                    <p>{sellerOpeningStance?.reason || `Klub ${sellerClub.name} analizuje, czy w ogole chce wejsc do rozmow.`}</p>
                    {sellerOpeningStance?.allowTalks && sellerOpeningStance.askingPrice > 0 ? (
                      <p className="text-amber-300">
                        Zarzad stawia cene wyjsciowa: {sellerOpeningStance.askingPrice.toLocaleString()} PLN.
                      </p>
                    ) : null}
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6 space-y-6">
            {isUnavailable ? (
              <div className="rounded-[24px] border border-red-500/25 bg-red-500/10 p-6 text-center">
                <p className="text-lg font-black uppercase italic text-white">Tego zawodnika nie obsluzysz w tym module.</p>
                <p className="text-sm text-slate-300 mt-3">
                  {hasPendingTransfer
                    ? `Ten zawodnik ma juz uzgodniony transfer do ${clubs.find(c => c.id === player.transferPendingClubId)?.name || 'innego klubu'} i nie mozna skladac za niego nowej oferty.`
                    : 'Transfery wolnych agentow i zawodnikow z twojego klubu pozostaja w osobnych przeplywach.'}
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setTiming(TransferTiming.IMMEDIATE)}
                    disabled={hasAnyActiveAgreement || isTransferCompleted || isTransferOfferBanned}
                    className={`py-3 rounded-[20px] border text-sm font-black transition-all ${
                      timing === TransferTiming.IMMEDIATE
                        ? 'bg-white text-slate-900 border-white'
                        : 'bg-black/30 text-slate-300 border-white/10 hover:border-white/30'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    Transfer teraz
                  </button>
                  <button
                    onClick={() => setTiming(TransferTiming.IN_SIX_MONTHS)}
                    disabled={hasAnyActiveAgreement || isTransferCompleted || isTransferOfferBanned}
                    className={`py-3 rounded-[20px] border text-sm font-black transition-all ${
                      timing === TransferTiming.IN_SIX_MONTHS
                        ? 'bg-white text-slate-900 border-white'
                        : 'bg-black/30 text-slate-300 border-white/10 hover:border-white/30'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    Za 6 miesiecy
                  </button>
                  <button
                    onClick={() => setTiming(TransferTiming.IN_TWELVE_MONTHS)}
                    disabled={hasAnyActiveAgreement || isTransferCompleted || isTransferOfferBanned}
                    className={`py-3 rounded-[20px] border text-sm font-black transition-all ${
                      timing === TransferTiming.IN_TWELVE_MONTHS
                        ? 'bg-white text-slate-900 border-white'
                        : 'bg-black/30 text-slate-300 border-white/10 hover:border-white/30'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    Za 12 miesiecy
                  </button>
                  <button
                    onClick={() => setTiming(TransferTiming.CONTRACT_END)}
                    disabled={hasAnyActiveAgreement || isTransferCompleted || isTransferOfferBanned}
                    className={`py-3 rounded-[20px] border text-sm font-black transition-all ${
                      timing === TransferTiming.CONTRACT_END
                        ? 'bg-white text-slate-900 border-white'
                        : 'bg-black/30 text-slate-300 border-white/10 hover:border-white/30'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    Bez odstepnego po umowie
                  </button>
                </div>

                {timing !== TransferTiming.CONTRACT_END ? (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-400">Kwota odstepnego</span>
                      <span className="text-xl font-black text-emerald-400 font-mono">{fee.toLocaleString()} PLN</span>
                    </div>
                    <input
                      type="range"
                      min="100000"
                      max={Math.max(100000, maxFee)}
                      step="50000"
                      value={fee}
                      onChange={e => setFee(parseInt(e.target.value, 10))}
                      disabled={isTransferLocked || isTransferOfferBanned || clubRefusesTalks || hasAnyActiveAgreement || isTransferCompleted}
                      className="w-full accent-emerald-500"
                    />
                  </div>
                ) : (
                  <div className="rounded-[24px] border border-emerald-500/20 bg-emerald-500/10 p-5">
                    <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-300">Umowa od przyszlej daty</p>
                    <p className="text-sm text-slate-200 mt-3">
                      Jesli zawodnik zaakceptuje warunki, dolaczy do twojego klubu od {contractEndDate?.toLocaleDateString('pl-PL')}. W tym trybie nie placisz odstepnego.
                    </p>
                  </div>
                )}

                {isTransferLocked && (
                  <div className="rounded-[24px] border border-red-500/30 bg-red-500/10 p-5">
                    <p className="text-sm font-black uppercase tracking-[0.2em]">Rozmowy zablokowane</p>
                    <p className="text-sm text-slate-200 mt-3">
                      Pańska oferta nie jest możliwa do rozpatrzenia przed {new Date(player.transferLockoutUntil!).toLocaleDateString('pl-PL')}.
                    </p>
                  </div>
                )}

                {!isTransferLocked && isTransferOfferBanned && (
                  <div className="rounded-[24px] border border-amber-500/30 bg-amber-500/10 p-5">
                    <p className="text-sm font-black uppercase tracking-[0.2em]">Zawodnik po swiezym transferze</p>
                    <p className="text-sm text-slate-200 mt-3">
                      Ten zawodnik niedawno zmienil klub. Nowa oferta transferowa moze zostac zlozona dopiero po {new Date(player.transferOfferBanUntil!).toLocaleDateString('pl-PL')}.
                    </p>
                  </div>
                )}

                {!isTransferLocked && !isTransferOfferBanned && clubRefusesTalks && (
                  <div className="rounded-[24px] border border-red-500/30 bg-red-500/10 p-5">
                    <p className="text-sm font-black uppercase tracking-[0.2em]">Rozmowy niedostepne</p>
                    <p className="text-sm text-slate-200 mt-3">
                      {timing === TransferTiming.CONTRACT_END
                        ? 'Pre-kontrakt nie jest jeszcze mozliwy. Zawodnik musi wejsc w ostatni rok obecnej umowy.'
                        : sellerOpeningStance?.reason}
                    </p>
                  </div>
                )}

                {(submissionFeedback || latestOffer) && (
                  <div className={`rounded-[24px] border p-5 ${responseBoxClass}`}>
                    <p className="text-sm font-black uppercase tracking-[0.2em]">
                      {activeStatus === TransferOfferStatus.SELLER_COUNTERED
                        ? 'Klub oczekuje wyzszej ceny'
                        : canOpenNegotiation
                          ? 'Kluby porozumialy sie'
                          : activeStatus === TransferOfferStatus.COMPLETED
                            ? 'Transfer sfinalizowany'
                          : activeStatus === TransferOfferStatus.AGREED_PRECONTRACT
                            ? 'Umowa podpisana z przyszla data'
                          : activeStatus === TransferOfferStatus.SELLER_REJECTED
                            ? 'Oferta zatrzymana'
                            : 'Status negocjacji'}
                    </p>
                    <p className="text-sm text-slate-200 mt-3 whitespace-pre-wrap">
                      {submissionFeedback?.message || latestOffer?.sellerReason || 'Brak odpowiedzi.'}
                    </p>
                    {(submissionFeedback?.askingPrice || latestOffer?.askingPrice) && activeStatus !== TransferOfferStatus.PLAYER_NEGOTIATION ? (
                      <p className="text-xs uppercase tracking-[0.2em] text-amber-300 mt-4">
                        Klub oczekiwał {(submissionFeedback?.askingPrice || latestOffer?.askingPrice || 0).toLocaleString()} PLN.
                      </p>
                    ) : null}
                  </div>
                )}

                {canOpenNegotiation ? (
                  <button
                    onClick={handleOpenNegotiation}
                    className="w-full py-4 rounded-[24px] bg-emerald-600 hover:bg-emerald-500 text-white font-black italic uppercase tracking-[0.25em] text-sm shadow-xl transition-all"
                  >
                    Przejdz do rozmowy z zawodnikiem
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={isTransferLocked || isTransferOfferBanned || clubRefusesTalks || hasAnyActiveAgreement || isTransferCompleted}
                    className="w-full py-4 rounded-[24px] bg-blue-600 hover:bg-blue-500 text-white font-black italic uppercase tracking-[0.25em] text-sm shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isTransferLocked
                      ? 'ODRZUCONO'
                      : isTransferOfferBanned
                        ? 'ZAWODNIK PO SWIEZYM TRANSFERZE'
                      : isFutureAgreementSigned
                        ? 'Umowa od przyszlej daty juz podpisana'
                        : hasAnyActiveAgreement
                          ? 'Aktywna rozmowa transferowa'
                        : isTransferCompleted
                          ? 'Transfer juz sfinalizowany'
                      : clubRefusesTalks
                        ? timing === TransferTiming.CONTRACT_END
                          ? 'Pre-kontrakt jeszcze niedostepny'
                          : 'Klub odmawia rozmow'
                        : timing === TransferTiming.CONTRACT_END
                          ? 'Przejdz do rozmowy z zawodnikiem'
                          : timing === TransferTiming.IMMEDIATE
                            ? 'Wyslij oferte do klubu'
                            : 'Negocjuj transfer odroczony'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
