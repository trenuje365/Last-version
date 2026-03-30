import React, { useEffect, useMemo, useState } from 'react';
import { useGame } from '../../context/GameContext';
import { TransferOfferStatus, TransferTiming, ViewState } from '../../types';
import { FinanceService } from '../../services/FinanceService';
import { TransferPlayerDecisionService } from '../../services/TransferPlayerDecisionService';

interface NegotiationFeedback {
  ok: boolean;
  message: string;
  status: TransferOfferStatus | 'VALIDATION_ERROR';
}

export const TransferPlayerNegotiationView: React.FC = () => {
  const {
    viewedPlayerId,
    players,
    clubs,
    currentDate,
    userTeamId,
    transferOffers,
    finalizeTransferNegotiation,
    navigateWithoutHistory
  } = useGame();

  const playerData = useMemo(() => {
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

    const offer = transferOffers.find(
      item =>
        item.playerId === player.id &&
        item.buyerClubId === userTeamId &&
        (
          item.status === TransferOfferStatus.PLAYER_NEGOTIATION ||
          item.status === TransferOfferStatus.PLAYER_REJECTED ||
          item.status === TransferOfferStatus.AGREED_PRECONTRACT ||
          item.status === TransferOfferStatus.COMPLETED
        )
    ) || null;

    return {
      player,
      offer,
      buyerClub: clubs.find(c => c.id === userTeamId) || null,
      sellerClub: clubs.find(c => c.id === (offer?.sellerClubId || player.clubId)) || null
    };
  }, [viewedPlayerId, userTeamId, players, transferOffers, clubs]);

  const { player, offer, buyerClub, sellerClub } = playerData || {};
  const currentSquad = useMemo(() => {
    if (!sellerClub) return [];
    return players[sellerClub.id] || [];
  }, [players, sellerClub]);
  const targetSquad = useMemo(() => {
    if (!buyerClub) return [];
    return players[buyerClub.id] || [];
  }, [players, buyerClub]);
  const negotiationPlan = useMemo(() => {
    if (!player || !buyerClub || !sellerClub) return null;
    return TransferPlayerDecisionService.buildNegotiationPlan(
      player,
      sellerClub,
      buyerClub,
      currentSquad,
      targetSquad,
      currentDate
    );
  }, [player, buyerClub, sellerClub, currentSquad, targetSquad, currentDate]);
  const transferTimingLabel = useMemo(() => {
    if (!offer) return '';
    switch (offer.timing) {
      case TransferTiming.IN_SIX_MONTHS:
        return 'Transfer za 6 miesiecy';
      case TransferTiming.IN_TWELVE_MONTHS:
        return 'Transfer za 12 miesiecy';
      case TransferTiming.CONTRACT_END:
        return 'Umowa po koncu obecnej umowy';
      default:
        return 'Transfer natychmiastowy';
    }
  }, [offer]);

  const suggestedSalary = useMemo(() => {
    if (negotiationPlan) return negotiationPlan.desiredSalary;
    if (!player || !buyerClub) return 100_000;
    const fairSalary = FinanceService.getFairMarketSalary(player.overallRating);
    return Math.min(
      Math.floor(buyerClub.budget * 0.25),
      Math.max(player.annualSalary || 100_000, fairSalary)
    );
  }, [negotiationPlan, player, buyerClub]);

  const maxSalary = useMemo(() => {
    if (!player || !buyerClub) return 500_000;
    const fairSalary = FinanceService.getFairMarketSalary(player.overallRating);
    return Math.floor(Math.min(buyerClub.budget * 0.25, fairSalary * 2.2));
  }, [player, buyerClub]);

  const maxBonus = useMemo(() => buyerClub?.signingBonusPool || 0, [buyerClub]);

  const [salary, setSalary] = useState(100_000);
  const [bonus, setBonus] = useState(0);
  const [years, setYears] = useState(3);
  const [feedback, setFeedback] = useState<NegotiationFeedback | null>(null);

  useEffect(() => {
    if (!player) return;
    setSalary(Math.min(maxSalary, Math.max(50_000, suggestedSalary)));
    setBonus(Math.min(maxBonus, negotiationPlan?.desiredBonus || Math.round((player.annualSalary || 100_000) * 0.25)));
    setYears(negotiationPlan?.desiredYears || 3);
    setFeedback(null);
  }, [player?.id, suggestedSalary, maxSalary, maxBonus, negotiationPlan?.desiredBonus, negotiationPlan?.desiredYears]);

  if (!playerData || !player || !offer || !buyerClub || !sellerClub) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="max-w-xl rounded-[32px] border border-white/10 bg-slate-900/90 p-8 text-center">
          <p className="text-xl font-black uppercase">Brak aktywnej zgody klubu</p>
          <p className="text-sm text-slate-300 mt-3">
            Najpierw uzgodnij kwote transferu z klubem sprzedajacym.
          </p>
          <button
            onClick={() => navigateWithoutHistory(ViewState.TRANSFER_OFFER)}
            className="mt-6 px-6 py-3 rounded-2xl bg-white text-slate-900 font-black uppercase tracking-widest text-xs"
          >
            Wroc do rozmow klubow
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = () => {
    const result = finalizeTransferNegotiation(offer.id, { salary, bonus, years });
    setFeedback({
      ok: result.ok,
      message: result.message,
      status: result.status
    });
  };

  const isCompleted = feedback?.status === TransferOfferStatus.COMPLETED || offer.status === TransferOfferStatus.COMPLETED;
  const isRejected = feedback?.status === TransferOfferStatus.PLAYER_REJECTED || offer.status === TransferOfferStatus.PLAYER_REJECTED;
  const isPreContractAgreed = feedback?.status === TransferOfferStatus.AGREED_PRECONTRACT || offer.status === TransferOfferStatus.AGREED_PRECONTRACT;
  const canSubmit =
    offer.status === TransferOfferStatus.PLAYER_NEGOTIATION &&
    !isCompleted &&
    !!negotiationPlan?.willingToTalk;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://i.ibb.co/JwgrBtvC/biuro2-1.png')] bg-cover bg-center opacity-20" />
      <div className="absolute inset-0 bg-black/55" />

      <div className="relative z-10 w-full max-w-5xl bg-slate-900/85 border border-white/10 rounded-[42px] shadow-[0_40px_120px_rgba(0,0,0,0.75)] overflow-hidden">
        <div className="p-8 border-b border-white/10 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400">Negocjacje z Zawodnikiem</span>
            <h1 className="text-3xl font-black italic uppercase tracking-tight mt-2">
              {player.firstName} {player.lastName}
            </h1>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mt-2">
              {offer.timing === TransferTiming.IMMEDIATE
                ? `Kwota uzgodniona z klubem: ${offer.fee.toLocaleString()} PLN`
                : `${transferTimingLabel} od ${new Date(offer.effectiveDate || player.contractEndDate).toLocaleDateString('pl-PL')}`}
            </p>
          </div>
          <button
            onClick={() => navigateWithoutHistory(ViewState.TRANSFER_OFFER)}
            className="px-6 py-3 rounded-2xl bg-white text-slate-900 font-black uppercase tracking-widest text-xs"
          >
            Powrot
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_1.2fr] gap-8 p-8">
          <div className="space-y-4">
            <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
              <p className="text-[9px] font-black uppercase tracking-[0.35em] text-slate-500">Uzgodnione z klubem</p>
              <div className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400">Klub sprzedajacy</span>
                  <span className="font-black text-white text-right">{sellerClub.name}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400">Twoj klub</span>
                  <span className="font-black text-white text-right">{buyerClub.name}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400">Odstepne</span>
                  <span className="font-black text-emerald-400 text-right">
                    {offer.timing === TransferTiming.CONTRACT_END ? 'Brak odstepnego' : `${offer.fee.toLocaleString()} PLN`}
                  </span>
                </div>
                {offer.timing !== TransferTiming.IMMEDIATE && offer.effectiveDate ? (
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-400">Data dolaczenia</span>
                    <span className="font-black text-emerald-400 text-right">{new Date(offer.effectiveDate).toLocaleDateString('pl-PL')}</span>
                  </div>
                ) : null}
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400">Aktualna pensja</span>
                  <span className="font-black text-white text-right">{player.annualSalary.toLocaleString()} PLN</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400">Pula bonusow</span>
                  <span className="font-black text-amber-400 text-right">{buyerClub.signingBonusPool.toLocaleString()} PLN</span>
                </div>
                {negotiationPlan?.willingToTalk && (
                  <>
                    <div className="flex justify-between gap-4">
                      <span className="text-slate-400">Zadana pensja</span>
                      <span className="font-black text-blue-400 text-right">{negotiationPlan.desiredSalary.toLocaleString()} PLN</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-slate-400">Zadany bonus</span>
                      <span className="font-black text-amber-300 text-right">{negotiationPlan.desiredBonus.toLocaleString()} PLN</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-slate-400">Preferowane lata</span>
                      <span className="font-black text-white text-right">{negotiationPlan.desiredYears}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
              <p className="text-[9px] font-black uppercase tracking-[0.35em] text-slate-500">Stanowisko Agenta</p>
              <div className="mt-4 text-sm text-slate-300 space-y-2">
                <p>{negotiationPlan?.reason || 'Moj klient analizuje projekt sportowy i warunki finansowe.'}</p>
                {negotiationPlan?.willingToTalk && (
                  <>
                    <p>
                      Oczekiwana pensja: {(negotiationPlan?.desiredSalary || 0).toLocaleString()} PLN rocznie.
                    </p>
                    <p>
                      Oczekiwany bonus za podpis: {(negotiationPlan?.desiredBonus || 0).toLocaleString()} PLN.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6 space-y-6">
            {negotiationPlan?.willingToTalk && (
              <>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-400">Pensja roczna</span>
                    <span className="text-xl font-black text-blue-400 font-mono">{salary.toLocaleString()} PLN</span>
                  </div>
                  <input
                    type="range"
                    min="50000"
                    max={Math.max(50000, maxSalary)}
                    step="5000"
                    value={salary}
                    onChange={e => setSalary(parseInt(e.target.value, 10))}
                    className="w-full accent-blue-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-400">Bonus za podpis</span>
                    <span className="text-xl font-black text-amber-400 font-mono">{bonus.toLocaleString()} PLN</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={Math.max(0, maxBonus)}
                    step="5000"
                    value={bonus}
                    onChange={e => setBonus(parseInt(e.target.value, 10))}
                    className="w-full accent-amber-500"
                  />
                </div>

                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-400 block mb-3">Dlugosc kontraktu</span>
                  <div className="grid grid-cols-5 gap-2">
                    {[1, 2, 3, 4, 5].map(option => (
                      <button
                        key={option}
                        onClick={() => setYears(option)}
                        className={`py-3 rounded-2xl border text-sm font-black transition-all ${
                          years === option
                            ? 'bg-white text-black border-white'
                            : 'bg-black/30 text-slate-400 border-white/10 hover:border-white/30'
                        }`}
                      >
                        {option}L
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {!negotiationPlan?.willingToTalk && (
              <div className="rounded-[24px] border border-red-500/30 bg-red-500/10 p-5">
                <p className="text-sm font-black uppercase tracking-[0.2em]">Zawodnik nie chce rozmawiac</p>
                <p className="text-sm text-slate-200 mt-3 whitespace-pre-wrap">{negotiationPlan?.reason}</p>
              </div>
            )}

            {(feedback || offer.playerReason) && (
              <div
                className={`rounded-[24px] border p-5 ${
                  isCompleted || isPreContractAgreed ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'
                }`}
              >
                <p className="text-sm font-black uppercase tracking-[0.2em]">
                  {isCompleted
                    ? 'Transfer dopiety'
                    : isPreContractAgreed
                      ? 'Umowa podpisana'
                      : isRejected
                        ? 'Zawodnik odmawia'
                        : 'Status negocjacji'}
                </p>
                <p className="text-sm text-slate-200 mt-3 whitespace-pre-wrap">{feedback?.message || offer.playerReason}</p>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="w-full py-4 rounded-[24px] bg-emerald-600 hover:bg-emerald-500 text-white font-black italic uppercase tracking-[0.25em] text-sm shadow-xl transition-all disabled:opacity-50"
            >
              {isCompleted
                ? 'Transfer zakonczony'
                : isPreContractAgreed
                  ? 'Umowa od przyszlej daty podpisana'
                : isRejected
                  ? 'Negocjacje zakonczone'
                  : !negotiationPlan?.willingToTalk
                    ? 'ZERWANIE ROZMÓW'
                    : 'PRZEDSTAW OFERTĘ'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
