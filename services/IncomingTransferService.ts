import {
  Club,
  Player,
  IncomingTransferOffer,
  IncomingOfferStatus,
  TransferTiming,
} from '../types';
import { FinanceService } from './FinanceService';

const TIMING_LABELS: Record<TransferTiming, string> = {
  [TransferTiming.IMMEDIATE]: 'Natychmiast',
  [TransferTiming.IN_SIX_MONTHS]: 'Na kolejne okno transferowe',
  [TransferTiming.IN_TWELVE_MONTHS]: 'Od początku kolejnego sezonu',
  [TransferTiming.CONTRACT_END]: 'Po wygaśnięciu kontraktu',
};

export const IncomingTransferService = {
  buildOfferSeed(
    currentDate: Date | string,
    buyerClubId: string,
    playerId: string
  ): number {
    const dateKey = typeof currentDate === 'string'
      ? currentDate
      : currentDate.toISOString().split('T')[0];
    return IncomingTransferService.hashString(`${dateKey}::${buyerClubId}::${playerId}`);
  },

  getTimingLabel(timing: TransferTiming): string {
    return TIMING_LABELS[timing] ?? timing;
  },

  getClubTier(club: Club): number {
    return FinanceService.getClubTier(club);
  },

  shouldGenerateOffer(
    player: Player,
    buyerClub: Club,
    sellerClub: Club,
    activeIncomingOffers: IncomingTransferOffer[],
    seed: number,
    currentDate: Date | string
  ): { shouldGenerate: boolean; source: 'SHORTLIST' | 'SPONTANEOUS' | null } {
    const hasActiveOffer = activeIncomingOffers.some(
      o =>
        o.playerId === player.id &&
        o.buyerClubId === buyerClub.id &&
        o.status !== IncomingOfferStatus.EXPIRED &&
        o.status !== IncomingOfferStatus.REJECTED_BY_MANAGER &&
        o.status !== IncomingOfferStatus.COMPLETED &&
        o.status !== IncomingOfferStatus.REJECTED_AT_CONFIRM &&
        o.status !== IncomingOfferStatus.PLAYER_REFUSED
    );
    if (hasActiveOffer) return { shouldGenerate: false, source: null };

    if (
      player.transferLockoutUntil &&
      new Date(currentDate) < new Date(player.transferLockoutUntil)
    ) {
      return { shouldGenerate: false, source: null };
    }

    if (player.transferPendingClubId) {
      return { shouldGenerate: false, source: null };
    }

    if (buyerClub.rosterIds.length >= 30) return { shouldGenerate: false, source: null };
    if (buyerClub.id === sellerClub.id) return { shouldGenerate: false, source: null };

    const isShortlisted = !!player.interestedClubs?.includes(buyerClub.id);
    const isExceptionalTarget = IncomingTransferService.isExceptionalSpontaneousTarget(
      player,
      buyerClub,
      sellerClub,
      currentDate
    );

    let prob = 0.004;
    let source: 'SHORTLIST' | 'SPONTANEOUS' | null = null;

    if (player.isOnTransferList) prob *= 3.0;
    if (player.overallRating >= 75) prob *= 2.0;
    if (player.contractEndDate) {
      const daysLeft = IncomingTransferService.daysUntil(player.contractEndDate, currentDate);
      if (daysLeft < 180) prob *= 1.8;
    }

    if (buyerClub.reputation > sellerClub.reputation) prob *= 1.3;

    if (isShortlisted) {
      prob *= 3.0;
      prob *= 0.85;
      source = 'SHORTLIST';
    } else {
      if (!isExceptionalTarget) {
        return { shouldGenerate: false, source: null };
      }

      const discoveryRoll = IncomingTransferService.seededRandom(seed + 17);
      if (discoveryRoll >= 0.15) {
        return { shouldGenerate: false, source: null };
      }

      prob *= 0.15;
      source = 'SPONTANEOUS';
    }

    const rng = IncomingTransferService.seededRandom(seed);
    const shouldGenerate = rng < prob;
    return {
      shouldGenerate,
      source: shouldGenerate ? source : null,
    };
  },

  calculateOffer(
    player: Player,
    buyerClub: Club,
    sellerClub: Club,
    isInsideTransferWindow: boolean,
    seed: number
  ): Pick<IncomingTransferOffer, 'fee' | 'aiMaxFee' | 'aiUrgency' | 'timing'> {
    const sellerTier = IncomingTransferService.getClubTier(sellerClub);
    const marketValue = FinanceService.calculateMarketValue(player, sellerClub.reputation, sellerTier);

    const rng1 = IncomingTransferService.seededRandom(seed + 1);
    const rng2 = IncomingTransferService.seededRandom(seed + 2);
    const rng3 = IncomingTransferService.seededRandom(seed + 3);

    const urgency = rng1 < 0.25 ? 1 : rng1 < 0.65 ? 2 : 3;

    let feeMin: number;
    let feeMax: number;
    if (urgency === 1) {
      feeMin = 0.55;
      feeMax = 0.85;
    } else if (urgency === 2) {
      feeMin = 0.85;
      feeMax = 1.15;
    } else {
      feeMin = 1.15;
      feeMax = 1.60;
    }

    const feeMultiplier = feeMin + rng2 * (feeMax - feeMin);
    const fee = Math.round(marketValue * feeMultiplier / 1000) * 1000;

    const maxMultiplier = 1.10 + rng3 * 0.20;
    const aiMaxFee = Math.min(
      Math.round(fee * maxMultiplier / 1000) * 1000,
      buyerClub.budget
    );

    const timing = IncomingTransferService.selectTiming(isInsideTransferWindow, rng1, rng2);

    return { fee, aiMaxFee, aiUrgency: urgency as 1 | 2 | 3, timing };
  },

  selectTiming(isInsideWindow: boolean, _rng1: number, rng2: number): TransferTiming {
    if (isInsideWindow) {
      if (rng2 < 0.45) return TransferTiming.IMMEDIATE;
      if (rng2 < 0.75) return TransferTiming.IN_SIX_MONTHS;
      return TransferTiming.IN_TWELVE_MONTHS;
    }
    if (rng2 < 0.55) return TransferTiming.IN_SIX_MONTHS;
    return TransferTiming.IN_TWELVE_MONTHS;
  },

  evaluateBoardPressure(
    offer: Pick<IncomingTransferOffer, 'fee'>,
    player: Player,
    sellerClub: Club
  ): boolean {
    const sellerTier = IncomingTransferService.getClubTier(sellerClub);
    if (sellerClub.budget < 0) return true;
    const marketValue = FinanceService.calculateMarketValue(player, sellerClub.reputation, sellerTier);
    if (offer.fee > marketValue * 1.8) return true;
    return false;
  },

  processAICounterResponse(
    offer: IncomingTransferOffer,
    seed: number
  ): { verdict: 'ACCEPT' | 'COUNTER' | 'REJECT'; newFee?: number } {
    const currentDemand = offer.counterFee ?? offer.fee;

    if (currentDemand <= offer.aiMaxFee) {
      return { verdict: 'ACCEPT', newFee: currentDemand };
    }

    const rng = IncomingTransferService.seededRandom(seed);

    if (offer.aiUrgency === 3 && rng < 0.40) {
      const compromise = Math.round(offer.aiMaxFee * (1.02 + rng * 0.05) / 1000) * 1000;
      if (compromise < currentDemand) {
        return { verdict: 'COUNTER', newFee: compromise };
      }
      return { verdict: 'ACCEPT', newFee: offer.aiMaxFee };
    }

    if (offer.aiUrgency === 2 && rng < 0.20) {
      const compromise = Math.round(offer.aiMaxFee * (1.01 + rng * 0.03) / 1000) * 1000;
      if (compromise < currentDemand) {
        return { verdict: 'COUNTER', newFee: compromise };
      }
      return { verdict: 'ACCEPT', newFee: offer.aiMaxFee };
    }

    return { verdict: 'REJECT' };
  },

  simulatePlayerNegotiation(
    player: Player,
    buyerClub: Club,
    sellerClub: Club,
    seed: number,
    currentDate: Date | string
  ): 'accepted' | 'refused' {
    const rng = IncomingTransferService.seededRandom(seed);
    const repDelta = buyerClub.reputation - sellerClub.reputation;

    let acceptChance = 0.55;

    if (repDelta >= 3) acceptChance = 0.85;
    else if (repDelta >= 1) acceptChance = 0.70;
    else if (repDelta === 0) acceptChance = 0.55;
    else if (repDelta === -1) acceptChance = 0.40;
    else acceptChance = 0.25;

    if (player.isOnTransferList) acceptChance += 0.15;
    const daysLeft = IncomingTransferService.daysUntil(player.contractEndDate, currentDate);
    if (daysLeft < 180) acceptChance += 0.10;

    acceptChance = Math.min(0.95, Math.max(0.05, acceptChance));
    return rng < acceptChance ? 'accepted' : 'refused';
  },

  processDailyTimers(
    offers: IncomingTransferOffer[],
    currentDateStr: string
  ): {
    updatedOffers: IncomingTransferOffer[];
    actions: Array<{
      type:
        | 'SEND_REMINDER'
        | 'EXPIRE'
        | 'PROCESS_AI_COUNTER'
        | 'RESOLVE_PLAYER_NEGOTIATION';
      offerId: string;
    }>;
  } {
    const today = new Date(currentDateStr);
    const actions: Array<{
      type:
        | 'SEND_REMINDER'
        | 'EXPIRE'
        | 'PROCESS_AI_COUNTER'
        | 'RESOLVE_PLAYER_NEGOTIATION';
      offerId: string;
    }> = [];

    const updatedOffers = offers.map(offer => {
      const updated = { ...offer };

      if (offer.status === IncomingOfferStatus.EMAIL_SENT) {
        const emailDate = new Date(offer.emailSentAt);
        const daysPassed = IncomingTransferService.daysBetween(emailDate, today);
        if (daysPassed >= 5) {
          updated.status = IncomingOfferStatus.REMINDER_SENT;
          updated.reminderSentAt = currentDateStr;
          actions.push({ type: 'SEND_REMINDER', offerId: offer.id });
        }
      } else if (offer.status === IncomingOfferStatus.REMINDER_SENT) {
        const reminderDate = new Date(offer.reminderSentAt!);
        const daysPassed = IncomingTransferService.daysBetween(reminderDate, today);
        if (daysPassed >= 3) {
          updated.status = IncomingOfferStatus.EXPIRED;
          actions.push({ type: 'EXPIRE', offerId: offer.id });
        }
      } else if (offer.status === IncomingOfferStatus.COUNTER_PENDING_AI) {
        const counterDate = new Date(offer.playerNegotiationStartedAt ?? offer.createdAt);
        const daysPassed = IncomingTransferService.daysBetween(counterDate, today);
        if (daysPassed >= 1) {
          actions.push({ type: 'PROCESS_AI_COUNTER', offerId: offer.id });
        }
      } else if (offer.status === IncomingOfferStatus.NEGOTIATION_IN_PROGRESS) {
        if (offer.playerNegotiationResolvesAt) {
          const resolveDate = new Date(offer.playerNegotiationResolvesAt);
          if (today >= resolveDate) {
            actions.push({ type: 'RESOLVE_PLAYER_NEGOTIATION', offerId: offer.id });
          }
        }
      }

      return updated;
    });

    return { updatedOffers, actions };
  },

  daysUntil(isoDate: string, referenceDate: Date | string = new Date()): number {
    const target = new Date(isoDate);
    const now = new Date(referenceDate);
    return Math.floor((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  },

  daysBetween(from: Date, to: Date): number {
    return Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
  },

  addDays(isoDate: string, days: number): string {
    const d = new Date(isoDate);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  },

  isExceptionalSpontaneousTarget(
    player: Player,
    buyerClub: Club,
    sellerClub: Club,
    currentDate: Date | string
  ): boolean {
    const daysLeft = IncomingTransferService.daysUntil(player.contractEndDate, currentDate);
    const isElitePlayer = player.overallRating >= 80;
    const isWonderkid = player.age <= 21 && player.overallRating >= 72;
    const isContractOpportunity = daysLeft > 0 && daysLeft < 150 && player.overallRating >= 70;
    const isStepUpMove = buyerClub.reputation >= sellerClub.reputation + 4 && player.overallRating >= 74;

    return isElitePlayer || isWonderkid || isContractOpportunity || isStepUpMove;
  },

  hashString(value: string): number {
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      hash = (hash * 31 + value.charCodeAt(i)) | 0;
    }
    return Math.abs(hash);
  },

  seededRandom(seed: number): number {
    const x = Math.sin(seed + 1) * 10000;
    return x - Math.floor(x);
  },
};
