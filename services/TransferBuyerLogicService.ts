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
        return { approved: false, reason: 'Temu zawodnikowi niedługo kończy się kontrakt. Czy nie lepiej poczekać, aż będzie do wzięcia za darmo ?' };
      }

      if (daysLeft > 365) {
        return { approved: false, reason: 'Warunki można zaproponować dopiero w ostatnim roku kontraktu zawodnika.' };
      }

      return { approved: true, reason: '' };
    }

    if (!Number.isFinite(offer.fee) || offer.fee <= 0) {
      return { approved: false, reason: 'Kwota odstępnego musi być większa od zera.' };
    }

    if (buyerSquad.length >= 30) {
      return { approved: false, reason: 'Nasz zarząd nie pozwala złożyć tej oferty, ponieważ mam już szeroką kadrę.' };
    }

    if (offer.fee > buyerClub.budget) {
      return {
        approved: false,
        reason: `Kwota odstępnego (${offer.fee.toLocaleString()} PLN) przekracza budżet klubu.`
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
        reason: `Ta oferta jest nierealna finansowo. Klub nie zgodzi się wydać ${offer.fee.toLocaleString()} PLN za zawodnika o tej wycenie.`
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
      return { approved: false, reason: 'Roczna pensja musi być większa od zera.' };
    }

    if (!Number.isFinite(contract.bonus) || contract.bonus < 0) {
      return { approved: false, reason: 'Bonus za podpis nie może być ujemny.' };
    }

    if (!Number.isFinite(contract.years) || contract.years < 1 || contract.years > 5) {
      return { approved: false, reason: 'Długość kontraktu musi mieścić się w przedziale 1-5 lat.' };
    }

    if (contract.bonus > buyerClub.signingBonusPool) {
      return {
        approved: false,
        reason: `Bonus za podpis przekracza dostępną pulę (${buyerClub.signingBonusPool.toLocaleString()} PLN).`
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
        reason: 'Nie możemy się zgodzić na ten transfer. Ta transakcja zbyt mocno obciążyłaby fundusz płac.'
      };
    }

    return { approved: true, reason: '' };
  }
};
