import { Club, Player, PlayerPosition, TransferClubBidInput, TransferTiming } from '../types';
import { FinanceService } from './FinanceService';

interface SellerDecisionResult {
  verdict: 'REJECT' | 'COUNTER' | 'ACCEPT';
  reason: string;
  askingPrice: number;
}

interface SellerOpeningStance {
  allowTalks: boolean;
  reason: string;
  askingPrice: number;
}

interface SellerNegotiationContext {
  currentAskingPrice?: number;
  attemptNumber?: number;
  maxAttempts?: number;
}

const MIN_POSITION_DEPTH: Record<PlayerPosition, number> = {
  GK: 2,
  DEF: 5,
  MID: 4,
  FWD: 3
};

const roundToNearest50k = (value: number) => Math.round(Math.max(100_000, value) / 50_000) * 50_000;
const getTimingPriceMultiplier = (timing: TransferTiming): number => {
  switch (timing) {
    case TransferTiming.IN_SIX_MONTHS:
      return 1.08;
    case TransferTiming.IN_TWELVE_MONTHS:
      return 1.20;
    case TransferTiming.CONTRACT_END:
      return 0;
    default:
      return 1;
  }
};

const getTimingLabel = (timing: TransferTiming): string => {
  switch (timing) {
    case TransferTiming.IN_SIX_MONTHS:
      return 'za 6 miesiecy';
    case TransferTiming.IN_TWELVE_MONTHS:
      return 'za 12 miesiecy';
    case TransferTiming.CONTRACT_END:
      return 'po wygasnieciu obecnej umowy';
    default:
      return 'natychmiast';
  }
};

export const TransferSellerLogicService = {
  generateNegotiationAttemptLimit: (): number => Math.floor(Math.random() * 7) + 1,

  getNegotiationStance: (
    player: Player,
    sellerClub: Club,
    buyerClub: Club,
    sellerSquad: Player[],
    currentDate: Date,
    timing: TransferTiming = TransferTiming.IMMEDIATE
  ): SellerOpeningStance => {
    const baseAskingPrice = TransferSellerLogicService.estimateAskingPrice(
      player,
      sellerClub,
      sellerSquad,
      currentDate
    );
    const askingPrice = roundToNearest50k(baseAskingPrice * getTimingPriceMultiplier(timing));

    const sortedSquad = [...sellerSquad].sort((a, b) => b.overallRating - a.overallRating);
    const playerRank = Math.max(0, sortedSquad.findIndex(item => item.id === player.id));
    const isBestPlayer = playerRank === 0;
    const isTopThree = playerRank <= 2;
    const isTopEleven = playerRank <= 10;
    const sameLeague = sellerClub.leagueId === buyerClub.leagueId;
    const reputationGap = buyerClub.reputation - sellerClub.reputation;
    const daysLeft = Math.floor(
      (new Date(player.contractEndDate).getTime() - currentDate.getTime()) / 86_400_000
    );
    const sellerNeedsCash = sellerClub.budget < Math.max(askingPrice * 0.7, 4_000_000);

    if (timing === TransferTiming.CONTRACT_END && player.isNegotiationPermanentBlocked && daysLeft <= 365) {
      return {
        allowTalks: true,
        askingPrice: 0,
        reason: `Zawodnik odmowil przedluzenia umowy. Klub nie zada odstepnego za transfer po wygasnieciu kontraktu.`
      };
    }

    const blocksShortDelaySale =
      timing === TransferTiming.IMMEDIATE || timing === TransferTiming.IN_SIX_MONTHS;

    const protectedRivalSale =
      sameLeague &&
      !player.isOnTransferList &&
      !sellerNeedsCash &&
      (player.isUntouchable || isBestPlayer) &&
      reputationGap <= 1 &&
      daysLeft > 365;

    if (protectedRivalSale && blocksShortDelaySale) {
      return {
        allowTalks: false,
        askingPrice,
        reason: `Klub nie podejmie rozmow. ${sellerClub.name} nie zamierza sprzedawac kluczowego zawodnika bezposredniemu rywalowi z ligi w tym terminie.`
      };
    }

    const protectedTopElevenSale =
      sameLeague &&
      !player.isOnTransferList &&
      !sellerNeedsCash &&
      isTopEleven &&
      reputationGap <= 0 &&
      daysLeft > 365;

    if (protectedTopElevenSale && blocksShortDelaySale) {
      return {
        allowTalks: false,
        askingPrice,
        reason: `Klub nie jest sklonny sprzedac waznego zawodnika do ligowego rywala w tym terminie.`
      };
    }

    if ((protectedRivalSale || protectedTopElevenSale) && timing === TransferTiming.IN_TWELVE_MONTHS) {
      const delayedAskingPrice = roundToNearest50k(askingPrice * 1.20);
      return {
        allowTalks: true,
        askingPrice: delayedAskingPrice,
        reason: `Klub nie chce sprzedawac tego zawodnika od razu, ale dopuszcza transfer ${getTimingLabel(timing)}. Cena wyjsciowa wynosi ${delayedAskingPrice.toLocaleString()} PLN.`
      };
    }

    if (
      sameLeague &&
      isTopThree &&
      !player.isOnTransferList &&
      reputationGap <= 1
    ) {
      return {
        allowTalks: true,
        askingPrice,
        reason: `Klub dopuszcza rozmowy o transferze ${getTimingLabel(timing)}, ale tylko przy ofercie wyjatkowej. Cena wyjsciowa wynosi ${askingPrice.toLocaleString()} PLN.`
      };
    }

    return {
      allowTalks: true,
      askingPrice,
      reason: `Klub jest gotow rozmawiac o transferze ${getTimingLabel(timing)}. Cena wyjsciowa wynosi ${askingPrice.toLocaleString()} PLN.`
    };
  },

  estimateAskingPrice: (
    player: Player,
    sellerClub: Club,
    sellerSquad: Player[],
    currentDate: Date
  ): number => {
    const tier = FinanceService.getClubTier(sellerClub);
    const baseValue = FinanceService.calculateMarketValue(player, sellerClub.reputation, tier);

    let multiplier = 1.0;
    const daysLeft = Math.floor(
      (new Date(player.contractEndDate).getTime() - currentDate.getTime()) / 86_400_000
    );

    if (player.isOnTransferList) multiplier -= 0.18;
    if (daysLeft > 0 && daysLeft < 180) multiplier -= 0.20;
    else if (daysLeft > 0 && daysLeft < 365) multiplier -= 0.10;

    if (player.age <= 22) multiplier += 0.16;
    if (player.age >= 31) multiplier -= 0.12;
    if (player.isUntouchable) multiplier += 0.30;

    const sortedSquad = [...sellerSquad].sort((a, b) => b.overallRating - a.overallRating);
    const top11Ids = sortedSquad.slice(0, 11).map(p => p.id);
    if (top11Ids.includes(player.id)) multiplier += 0.14;

    const samePosition = sellerSquad.filter(p => p.position === player.position && p.id !== player.id);
    const bestReplacement = samePosition.sort((a, b) => b.overallRating - a.overallRating)[0];
    const minimumDepth = MIN_POSITION_DEPTH[player.position];

    if (samePosition.length < minimumDepth) multiplier += 0.18;
    if (!bestReplacement) multiplier += 0.12;
    if (bestReplacement && player.overallRating - bestReplacement.overallRating >= 6) multiplier += 0.10;

    const financialPressure = sellerClub.budget < Math.max(baseValue * 0.75, 3_000_000);
    if (financialPressure) multiplier -= 0.05;

    let minimumMultiplier = player.isOnTransferList ? 0.82 : 1.0;
    if (daysLeft > 365 && !player.isOnTransferList) {
      minimumMultiplier = Math.max(minimumMultiplier, 1.02);
    }

    if (top11Ids.includes(player.id)) minimumMultiplier = Math.max(minimumMultiplier, 1.08);
    if (sortedSquad.slice(0, 3).some(p => p.id === player.id)) minimumMultiplier = Math.max(minimumMultiplier, 1.15);
    if (player.isUntouchable || sortedSquad[0]?.id === player.id) minimumMultiplier = Math.max(minimumMultiplier, 1.25);

    const rawPrice = Math.max(100_000, baseValue * Math.max(multiplier, minimumMultiplier));
    return Math.round(rawPrice / 50_000) * 50_000;
  },

  evaluateSellerDecision: (
    offer: TransferClubBidInput,
    player: Player,
    sellerClub: Club,
    buyerClub: Club,
    sellerSquad: Player[],
    currentDate: Date,
    negotiationContext?: SellerNegotiationContext
  ): SellerDecisionResult => {
    const openingStance = TransferSellerLogicService.getNegotiationStance(
      player,
      sellerClub,
      buyerClub,
      sellerSquad,
      currentDate,
      offer.timing
    );
    if (!openingStance.allowTalks) {
      return {
        verdict: 'REJECT',
        askingPrice: openingStance.askingPrice,
        reason: openingStance.reason
      };
    }

    const askingPrice = roundToNearest50k(
      negotiationContext?.currentAskingPrice || openingStance.askingPrice
    );
    const attemptNumber = Math.max(1, negotiationContext?.attemptNumber || 1);
    const maxAttempts = Math.max(1, negotiationContext?.maxAttempts || 3);
    const ratio = offer.fee / Math.max(askingPrice, 1);
    if (offer.fee >= askingPrice) {
      return {
        verdict: 'ACCEPT',
        askingPrice,
        reason: `Klub zaakceptowal warunki odstepnego. Ustalona cena: ${offer.fee.toLocaleString()} PLN.`
      };
    }

    if (ratio < 0.60) {
      return {
        verdict: 'REJECT',
        askingPrice,
        reason: `Oferta zostala odebrana jako niepowazna. Klub oczekuje minimum ${askingPrice.toLocaleString()} PLN.`
      };
    }

    if (attemptNumber >= maxAttempts) {
      return {
        verdict: 'REJECT',
        askingPrice,
        reason: `Klub uznal, ze stanowiska obu stron sa zbyt odlegle i konczy rozmowy. Oczekiwana cena nie spadla ponizej ${askingPrice.toLocaleString()} PLN.`
      };
    }

    const negotiationVariance = 1 + ((Math.random() * 0.04) - 0.02);
    const counterPrice = roundToNearest50k(askingPrice * negotiationVariance);
    const normalizedCounterPrice = Math.max(
      roundToNearest50k(askingPrice * 0.97),
      Math.min(roundToNearest50k(askingPrice * 1.03), counterPrice)
    );

    return {
      verdict: 'COUNTER',
      askingPrice: normalizedCounterPrice,
      reason: `Klub nie zaakceptuje ${offer.fee.toLocaleString()} PLN. Oczekiwana cena to ${normalizedCounterPrice.toLocaleString()} PLN.`
    };
  }
};
