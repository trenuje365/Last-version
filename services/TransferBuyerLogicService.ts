import { Club, Player, TransferClubBidInput, TransferContractInput, TransferTiming } from '../types';
import { FinanceService } from './FinanceService';

interface BuyerValidationResult {
  approved: boolean;
  reason: string;
}

export const TransferBuyerLogicService = {
  validateClubBid: (
    player: Player,
    buyerClub: Club,
    buyerSquad: Player[],
    offer: TransferClubBidInput,
    currentDate?: Date
  ): BuyerValidationResult => {
    if (player.clubId === buyerClub.id) {
      return { approved: false, reason: 'Ten zawodnik jest juz czescia twojej druzyny.' };
    }

    if (player.clubId === 'FREE_AGENTS') {
      return { approved: false, reason: 'Wolnych agentow nalezy negocjowac w osobnym module kontraktowym.' };
    }

    if (offer.timing === TransferTiming.CONTRACT_END) {
      const daysLeft = currentDate
        ? Math.floor((new Date(player.contractEndDate).getTime() - currentDate.getTime()) / 86_400_000)
        : 9999;

      if (daysLeft <= 0) {
        return { approved: false, reason: 'Ten zawodnik zaraz konczy umowe. Poczekaj, az bedzie wolnym agentem.' };
      }

      if (daysLeft > 365) {
        return { approved: false, reason: 'Takie porozumienie mozna podpisac dopiero w ostatnim roku kontraktu zawodnika.' };
      }

      return { approved: true, reason: '' };
    }

    if (!Number.isFinite(offer.fee) || offer.fee <= 0) {
      return { approved: false, reason: 'Kwota odstepnego musi byc wieksza od zera.' };
    }

    if (buyerSquad.length >= 30) {
      return { approved: false, reason: 'Nie mozesz zlozyc oferty. Kadra liczy juz 30 zawodnikow.' };
    }

    if (offer.fee > buyerClub.budget) {
      return {
        approved: false,
        reason: `Kwota odstepnego (${offer.fee.toLocaleString()} PLN) przekracza budzet klubu.`
      };
    }

    const fairFee = Math.max(
      player.marketValue || 0,
      Math.max(50_000, FinanceService.getFairMarketSalary(player.overallRating) * 6)
    );
    const maxFeeMultiplier = player.age <= 21 || player.overallRating >= 80 ? 3.5 : 2.8;
    const hardCap = fairFee * maxFeeMultiplier;

    if (offer.fee > hardCap) {
      return {
        approved: false,
        reason: `Ta oferta jest nierealna finansowo. Klub nie zgodzi sie wydac ${offer.fee.toLocaleString()} PLN za zawodnika o tej wycenie.`
      };
    }

    return { approved: true, reason: '' };
  },

  validateContractTerms: (
    player: Player,
    buyerClub: Club,
    buyerSquad: Player[],
    contract: TransferContractInput
  ): BuyerValidationResult => {
    if (!Number.isFinite(contract.salary) || contract.salary <= 0) {
      return { approved: false, reason: 'Roczna pensja musi byc wieksza od zera.' };
    }

    if (!Number.isFinite(contract.bonus) || contract.bonus < 0) {
      return { approved: false, reason: 'Bonus za podpis nie moze byc ujemny.' };
    }

    if (!Number.isFinite(contract.years) || contract.years < 1 || contract.years > 5) {
      return { approved: false, reason: 'Dlugosc kontraktu musi miescic sie w przedziale 1-5 lat.' };
    }

    if (contract.bonus > buyerClub.signingBonusPool) {
      return {
        approved: false,
        reason: `Bonus za podpis przekracza dostepna pule (${buyerClub.signingBonusPool.toLocaleString()} PLN).`
      };
    }

    const boardDecision = FinanceService.evaluateFASigningBoardDecision(
      player,
      contract.salary,
      contract.bonus,
      buyerSquad,
      buyerClub
    );

    if (!boardDecision.approved) {
      return { approved: false, reason: boardDecision.reason };
    }

    const wageBillAfter = FinanceService.calculateCurrentWageBill(buyerSquad) + contract.salary;
    if (wageBillAfter > buyerClub.budget * 0.7) {
      return {
        approved: false,
        reason: 'Ta transakcja zbyt mocno obciazylaby fundusz plac po dodaniu nowej pensji.'
      };
    }

    return { approved: true, reason: '' };
  }
};
