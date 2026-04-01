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

  getTimingLabel(timing: TransferTiming): string {
    return TIMING_LABELS[timing] ?? timing;
  },

  getClubTier(club: Club): number {
    return FinanceService.getClubTier(club);
  },

  /**
   * Sprawdza czy klub AI powinien złożyć ofertę za danego zawodnika danego dnia.
   * Zwraca true jeśli oferta powinna być złożona (losowe prawdopodobieństwo).
   */
  shouldGenerateOffer(
    player: Player,
    buyerClub: Club,
    sellerClub: Club,
    activeIncomingOffers: IncomingTransferOffer[],
    seed: number,
    currentDate: Date | string
  ): boolean {
    // Blokuj jeśli już istnieje aktywna oferta od tego samego kupującego za tego samego zawodnika
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
    if (hasActiveOffer) return false;

    // Blokuj jeśli zawodnik jest zablokowany transferowo
    if (
      player.transferLockoutUntil &&
      new Date(currentDate) < new Date(player.transferLockoutUntil)
    ) return false;

    // Kupujący musi mieć mniejszy skład (max 30) i być innym klubem
    if (buyerClub.rosterIds.length >= 30) return false;
    if (buyerClub.id === sellerClub.id) return false;

    // Bazowe prawdopodobieństwo
    let prob = 0.004;

    // Modyfikatory
    if (player.isOnTransferList) prob *= 3.0;
    if (player.interestedClubs?.includes(buyerClub.id)) prob *= 3.0;
    if (player.overallRating >= 75) prob *= 2.0;
    if (player.contractEndDate) {
      const daysLeft = IncomingTransferService.daysUntil(player.contractEndDate, currentDate);
      if (daysLeft < 180) prob *= 1.8;
    }

    // Klub AI z wyższą reputacją ma większy apetyt
    if (buyerClub.reputation > sellerClub.reputation) prob *= 1.3;

    // Determinizm per klub per dzień (seed oparty o id klubu + dzień)
    const rng = IncomingTransferService.seededRandom(seed);
    return rng < prob;
  },

  /**
   * Oblicza ofertę AI: kwotę, aiMaxFee, urgency, timing.
   */
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

    // Urgency 1-3
    const urgency = rng1 < 0.25 ? 1 : rng1 < 0.65 ? 2 : 3;

    // Mnożnik kwoty wg urgency
    let feeMin: number, feeMax: number;
    if (urgency === 1) { feeMin = 0.55; feeMax = 0.85; }
    else if (urgency === 2) { feeMin = 0.85; feeMax = 1.15; }
    else { feeMin = 1.15; feeMax = 1.60; }

    const feeMultiplier = feeMin + rng2 * (feeMax - feeMin);
    const fee = Math.round(marketValue * feeMultiplier / 1000) * 1000;

    // aiMaxFee — elastyczność AI na kontrę gracza
    const maxMultiplier = 1.10 + rng3 * 0.20; // 1.10 - 1.30
    const aiMaxFee = Math.min(
      Math.round(fee * maxMultiplier / 1000) * 1000,
      buyerClub.budget
    );

    // Timing
    const timing = IncomingTransferService.selectTiming(isInsideTransferWindow, rng1, rng2);

    return { fee, aiMaxFee, aiUrgency: urgency as 1 | 2 | 3, timing };
  },

  selectTiming(isInsideWindow: boolean, rng1: number, rng2: number): TransferTiming {
    if (isInsideWindow) {
      if (rng2 < 0.45) return TransferTiming.IMMEDIATE;
      if (rng2 < 0.75) return TransferTiming.IN_SIX_MONTHS;
      return TransferTiming.IN_TWELVE_MONTHS;
    }
    // Poza oknem — nie może być IMMEDIATE
    if (rng2 < 0.55) return TransferTiming.IN_SIX_MONTHS;
    return TransferTiming.IN_TWELVE_MONTHS;
  },

  /**
   * Sprawdza czy zarząd naciska na sprzedaż.
   */
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

  /**
   * Odpowiedź AI na kontrę gracza (po 1 dniu).
   * Zwraca: 'ACCEPT' | 'COUNTER' | 'REJECT' oraz ewentualną nową kwotę.
   */
  processAICounterResponse(
    offer: IncomingTransferOffer,
    seed: number
  ): { verdict: 'ACCEPT' | 'COUNTER' | 'REJECT'; newFee?: number } {
    const currentDemand = offer.counterFee ?? offer.fee;

    // Jeśli żądanie gracza mieści się w budżecie AI — akceptuje
    if (currentDemand <= offer.aiMaxFee) {
      return { verdict: 'ACCEPT', newFee: currentDemand };
    }

    // Przekracza aiMaxFee
    const rng = IncomingTransferService.seededRandom(seed);

    // Urgency 3 — AI jest bardziej elastyczne
    if (offer.aiUrgency === 3 && rng < 0.40) {
      // AI lekko podbija swoje max ale nie dorówna żądaniu
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

  /**
   * Symuluje wynik negocjacji z zawodnikiem w tle.
   * Wynik zależy od reputacji kupującego vs sprzedającego.
   */
  simulatePlayerNegotiation(
    player: Player,
    buyerClub: Club,
    sellerClub: Club,
    seed: number,
    currentDate: Date | string
  ): 'accepted' | 'refused' {
    const rng = IncomingTransferService.seededRandom(seed);
    const repDelta = buyerClub.reputation - sellerClub.reputation;

    // Baza akceptacji
    let acceptChance = 0.55;

    if (repDelta >= 3) acceptChance = 0.85;
    else if (repDelta >= 1) acceptChance = 0.70;
    else if (repDelta === 0) acceptChance = 0.55;
    else if (repDelta === -1) acceptChance = 0.40;
    else acceptChance = 0.25;

    // Korekty
    if (player.isOnTransferList) acceptChance += 0.15;
    const daysLeft = IncomingTransferService.daysUntil(player.contractEndDate, currentDate);
    if (daysLeft < 180) acceptChance += 0.10;

    acceptChance = Math.min(0.95, Math.max(0.05, acceptChance));
    return rng < acceptChance ? 'accepted' : 'refused';
  },

  /**
   * Przetwarza timery aktywnych ofert dla bieżącego dnia.
   * Zwraca oferty ze zaktualizowanymi statusami oraz listę akcji do wykonania.
   */
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

  seededRandom(seed: number): number {
    const x = Math.sin(seed + 1) * 10000;
    return x - Math.floor(x);
  },
};
