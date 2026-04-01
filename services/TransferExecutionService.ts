import { Club, Player, TransferOffer } from '../types';
import { FinanceService } from './FinanceService';

interface TransferExecutionResult {
  updatedClubs: Club[];
  updatedPlayers: Record<string, Player[]>;
}

const buildFinanceLog = (
  amount: number,
  description: string,
  date: Date,
  previousBalance: number
) => ({
  id: Math.random().toString(36).substr(2, 9),
  date: date.toISOString().split('T')[0],
  amount,
  type: amount >= 0 ? ('INCOME' as const) : ('EXPENSE' as const),
  description,
  previousBalance
});

export const TransferExecutionService = {
  finalizeTransfer: (
    offer: TransferOffer,
    clubs: Club[],
    playersMap: Record<string, Player[]>,
    currentDate: Date
  ): TransferExecutionResult => {
    const buyerClub = clubs.find(c => c.id === offer.buyerClubId);
    const sellerClub = clubs.find(c => c.id === offer.sellerClubId);
    const sellerSquad = playersMap[offer.sellerClubId] || [];
    const buyerSquad = playersMap[offer.buyerClubId] || [];
    const player = sellerSquad.find(p => p.id === offer.playerId);

    if (!buyerClub || !sellerClub || !player || !offer.salary || offer.bonus === undefined || !offer.years) {
      return { updatedClubs: clubs, updatedPlayers: playersMap };
    }

    const newEndDate = new Date(currentDate.getFullYear() + offer.years, 5, 30).toISOString();
    const transferLockoutDate = new Date(currentDate);
    transferLockoutDate.setMonth(transferLockoutDate.getMonth() + 3);
    const transferOfferBanDate = new Date(currentDate);
    transferOfferBanDate.setFullYear(transferOfferBanDate.getFullYear() + 1);
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    const buyerTier = FinanceService.getClubTier(buyerClub);

    const updatedHistory = [...(player.history || [])];
    if (updatedHistory.length > 0) {
      updatedHistory[updatedHistory.length - 1] = {
        ...updatedHistory[updatedHistory.length - 1],
        toYear: currentYear,
        toMonth: currentMonth
      };
    }
    updatedHistory.push({
      clubName: buyerClub.name,
      clubId: buyerClub.id,
      fromYear: currentYear,
      fromMonth: currentMonth,
      toYear: null,
      toMonth: null
    });

    const transferredPlayer: Player = {
      ...player,
      clubId: buyerClub.id,
      annualSalary: offer.salary,
      contractEndDate: newEndDate,
      marketValue: FinanceService.calculateMarketValue(player, buyerClub.reputation, buyerTier),
      history: updatedHistory,
      isOnTransferList: false,
      interestedClubs: [],
      transferLockoutUntil: transferLockoutDate.toISOString(),
      transferOfferBanUntil: transferOfferBanDate.toISOString()
    };

    const updatedPlayers: Record<string, Player[]> = {
      ...playersMap,
      [sellerClub.id]: sellerSquad.filter(p => p.id !== player.id),
      [buyerClub.id]: [...buyerSquad, transferredPlayer]
    };

    const updatedClubs = clubs.map(club => {
      if (club.id === buyerClub.id) {
        const buyerFeeLog = buildFinanceLog(
          -offer.fee,
          `Kwota transferu za ${player.firstName} ${player.lastName}`,
          currentDate,
          club.budget
        );
        const buyerBonusLog = buildFinanceLog(
          -offer.bonus,
          `Bonus za podpis dla ${player.firstName} ${player.lastName}`,
          currentDate,
          club.budget - offer.fee
        );

        return {
          ...club,
          budget: club.budget - offer.fee - offer.bonus,
          signingBonusPool: Math.max(0, club.signingBonusPool - offer.bonus),
          rosterIds: [...club.rosterIds, player.id],
          financeHistory: [buyerBonusLog, buyerFeeLog, ...(club.financeHistory || [])].slice(0, 50)
        };
      }

      if (club.id === sellerClub.id) {
        const sellerIncomeLog = buildFinanceLog(
          offer.fee,
          `Sprzedaż zawodnika ${player.firstName} ${player.lastName}`,
          currentDate,
          club.budget
        );

        return {
          ...club,
          budget: club.budget + offer.fee,
          rosterIds: club.rosterIds.filter(id => id !== player.id),
          financeHistory: [sellerIncomeLog, ...(club.financeHistory || [])].slice(0, 50)
        };
      }

      return club;
    });

    return { updatedClubs, updatedPlayers };
  }
};
