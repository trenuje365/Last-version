import { Club, Player, TransferContractInput } from '../types';

type SquadRole = 'STAR' | 'FIRST_TEAM' | 'ROTATION' | 'BACKUP';

interface PlayerDecisionResult {
  accepted: boolean;
  reason: string;
  stayScore: number;
  offerScore: number;
  targetRole: SquadRole;
}

export interface PlayerNegotiationPlan {
  willingToTalk: boolean;
  reason: string;
  targetRole: SquadRole;
  desiredSalary: number;
  desiredBonus: number;
  desiredYears: number;
}

const roundMoney = (value: number) => Math.max(50_000, Math.round(value / 5_000) * 5_000);

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const roleScore = (role: SquadRole): number => {
  switch (role) {
    case 'STAR':
      return 18;
    case 'FIRST_TEAM':
      return 12;
    case 'ROTATION':
      return 5;
    default:
      return -8;
  }
};

const roleLevel = (role: SquadRole): number => {
  switch (role) {
    case 'STAR':
      return 4;
    case 'FIRST_TEAM':
      return 3;
    case 'ROTATION':
      return 2;
    default:
      return 1;
  }
};

const contractScore = (years: number): number => {
  if (years >= 4) return 8;
  if (years === 3) return 6;
  if (years === 2) return 4;
  return 1;
};

const getAgeFinancialWeights = (age: number) => {
  if (age <= 23) {
    return { salary: 0.38, bonus: 0.12, years: 0.25, total: 0.25 };
  }

  if (age <= 29) {
    return { salary: 0.32, bonus: 0.18, years: 0.20, total: 0.30 };
  }

  return { salary: 0.22, bonus: 0.28, years: 0.22, total: 0.28 };
};

export const TransferPlayerDecisionService = {
  buildNegotiationPlan: (
    player: Player,
    currentClub: Club,
    targetClub: Club,
    currentSquad: Player[],
    targetSquad: Player[],
    currentDate: Date
  ): PlayerNegotiationPlan => {
    const currentRole = TransferPlayerDecisionService.estimateRole(player, currentSquad);
    const targetRole = TransferPlayerDecisionService.estimateRole(player, targetSquad);
    const currentSalaryBase = Math.max(player.annualSalary, 1);
    const currentRoleLevel = roleLevel(currentRole);
    const targetRoleLevel = roleLevel(targetRole);
    const reputationDelta = targetClub.reputation - currentClub.reputation;
    const isForeignMove =
      !!currentClub.country &&
      !!targetClub.country &&
      currentClub.country !== targetClub.country;
    const isNotFirstTeamPlayer = currentRole === 'ROTATION' || currentRole === 'BACKUP';
    const canAcceptSidewaysOrLowerMove = !!player.isOnTransferList || isNotFirstTeamPlayer;
    const daysLeft = Math.floor(
      (new Date(player.contractEndDate).getTime() - currentDate.getTime()) / 86_400_000
    );

    if (reputationDelta < -2) {
      return {
        willingToTalk: false,
        reason: 'Zawodnik nie chce schodzic sportowo tak nisko. Reputacja nowego klubu jest zbyt wyraznie slabsza od obecnego.',
        targetRole,
        desiredSalary: roundMoney(currentSalaryBase),
        desiredBonus: roundMoney(currentSalaryBase * 0.5),
        desiredYears: 3
      };
    }

    if (reputationDelta < 0 && !canAcceptSidewaysOrLowerMove) {
      return {
        willingToTalk: false,
        reason: 'Zawodnik nie jest gotowy odejsc do slabszego reputacyjnie klubu, dopoki regularnie liczy sie w obecnym zespole.',
        targetRole,
        desiredSalary: roundMoney(currentSalaryBase),
        desiredBonus: roundMoney(currentSalaryBase * 0.6),
        desiredYears: 3
      };
    }

    if (reputationDelta === 0 && !isForeignMove && !canAcceptSidewaysOrLowerMove) {
      return {
        willingToTalk: false,
        reason: 'Przy podobnej reputacji zawodnik nie widzi wystarczajacego awansu sportowego. Taki ruch mialby sens glownie do zagranicznego klubu lub po utracie miejsca w skladzie.',
        targetRole,
        desiredSalary: roundMoney(currentSalaryBase * 1.2),
        desiredBonus: roundMoney(currentSalaryBase * 0.7),
        desiredYears: 3
      };
    }

    let desiredYears = 3;
    if (player.age <= 22) desiredYears = 5;
    else if (player.age <= 27) desiredYears = 4;
    else if (player.age <= 30) desiredYears = 3;
    else if (player.age <= 34) desiredYears = 2;
    else desiredYears = 1;

    if (daysLeft > 0 && daysLeft < 365) {
      desiredYears = Math.max(2, desiredYears - 1);
    }

    let salaryMultiplier = 1.10;
    if (reputationDelta > 0) salaryMultiplier += 0.08;
    if (reputationDelta === 0 && isForeignMove) salaryMultiplier += 0.18;
    if (reputationDelta < 0) salaryMultiplier += 0.30;
    if (player.isOnTransferList) salaryMultiplier -= 0.08;
    if (isNotFirstTeamPlayer) salaryMultiplier -= 0.06;
    if (targetRoleLevel > currentRoleLevel) salaryMultiplier -= 0.06;
    if (targetRoleLevel < currentRoleLevel) salaryMultiplier += 0.10;

    let bonusMultiplier = 0.35;
    if (player.age >= 24 && player.age <= 29) bonusMultiplier = 0.55;
    else if (player.age >= 30 && player.age <= 33) bonusMultiplier = 0.90;
    else if (player.age >= 34) bonusMultiplier = 1.20;

    if (reputationDelta < 0) bonusMultiplier += 0.35;
    else if (reputationDelta === 0 && isForeignMove) bonusMultiplier += 0.18;
    else if (reputationDelta === 0) bonusMultiplier += 0.08;

    const desiredSalary = roundMoney(currentSalaryBase * salaryMultiplier);
    const desiredBonus = roundMoney(currentSalaryBase * bonusMultiplier);
    let negotiationReason = `Moj klient jest gotow rozmawiac. Oczekuje kontraktu na ${desiredYears} ${desiredYears === 1 ? 'rok' : 'lata'}.`;
    if (reputationDelta < 0) {
      negotiationReason = 'Moj klient rozwaza ten ruch tylko dlatego, ze jego pozycja w obecnym klubie nie jest mocna lub zostal wystawiony na liste transferowa. W takim przypadku oczekuje wyraznie lepszych warunkow finansowych.';
    } else if (reputationDelta === 0 && isForeignMove) {
      negotiationReason = 'Moj klient jest zainteresowany tym kierunkiem, ale przy klubie o podobnej reputacji oczekuje wyraznie lepszego kontraktu.';
    } else if (reputationDelta > 0) {
      negotiationReason = `Moj klient widzi tu awans sportowy, ale oczekuje kontraktu na ${desiredYears} ${desiredYears === 1 ? 'rok' : 'lata'} i warunkow adekwatnych do tego kroku.`;
    }

    return {
      willingToTalk: true,
      reason: negotiationReason,
      targetRole,
      desiredSalary,
      desiredBonus,
      desiredYears
    };
  },

  evaluateMove: (
    offer: TransferContractInput,
    player: Player,
    currentClub: Club,
    targetClub: Club,
    currentSquad: Player[],
    targetSquad: Player[],
    currentDate: Date
  ): PlayerDecisionResult => {
    const negotiationPlan = TransferPlayerDecisionService.buildNegotiationPlan(
      player,
      currentClub,
      targetClub,
      currentSquad,
      targetSquad,
      currentDate
    );

    if (!negotiationPlan.willingToTalk) {
      return {
        accepted: false,
        reason: negotiationPlan.reason,
        stayScore: 0,
        offerScore: 0,
        targetRole: negotiationPlan.targetRole
      };
    }

    const currentRole = TransferPlayerDecisionService.estimateRole(player, currentSquad);
    const currentSalaryBase = Math.max(player.annualSalary, 1);
    const reputationDelta = targetClub.reputation - currentClub.reputation;
    const isForeignMove =
      !!currentClub.country &&
      !!targetClub.country &&
      currentClub.country !== targetClub.country;

    const salaryFit = clamp(offer.salary / Math.max(negotiationPlan.desiredSalary, 1), 0, 1.3);
    const bonusFit = clamp(offer.bonus / Math.max(negotiationPlan.desiredBonus, 1), 0, 1.35);
    const yearsFit = clamp(offer.years / Math.max(negotiationPlan.desiredYears, 1), 0.5, 1.2);
    const financialWeights = getAgeFinancialWeights(player.age);

    const financialFit =
      salaryFit * financialWeights.salary +
      bonusFit * financialWeights.bonus +
      yearsFit * (financialWeights.years + financialWeights.total);

    let salaryScore = 0;
    if (salaryFit >= 1.12) salaryScore = 18;
    else if (salaryFit >= 1.0) salaryScore = 12;
    else if (salaryFit >= 0.92) salaryScore = 5;
    else salaryScore = -10;

    let bonusScore = 0;
    if (bonusFit >= 1.15) bonusScore = 12;
    else if (bonusFit >= 1.0) bonusScore = 8;
    else if (bonusFit >= 0.85) bonusScore = 3;
    else bonusScore = -6;

    let yearsScore = 0;
    if (yearsFit >= 1.0) yearsScore = 8;
    else if (yearsFit >= 0.85) yearsScore = 3;
    else yearsScore = -8;

    const daysLeft = Math.floor(
      (new Date(player.contractEndDate).getTime() - currentDate.getTime()) / 86_400_000
    );
    const contractPressure = daysLeft > 0 && daysLeft < 365 ? 7 : 0;
    const transferListPressure = player.isOnTransferList ? 10 : 0;
    const reputationScore = Math.max(-20, Math.min(22, reputationDelta * 7));
    const foreignBonus = reputationDelta === 0 && isForeignMove ? 6 : 0;

    const stayScore =
      currentClub.reputation * 7 +
      roleScore(currentRole) +
      Math.min(16, Math.round(currentSalaryBase / 110_000)) -
      contractPressure -
      transferListPressure;

    const offerScore =
      targetClub.reputation * 7 +
      roleScore(negotiationPlan.targetRole) +
      salaryScore +
      bonusScore +
      yearsScore +
      contractScore(offer.years) +
      reputationScore +
      foreignBonus +
      Math.round((financialFit - 1) * 35);

    const margin = offerScore - stayScore;
    const requiredFinancialFit = player.age >= 30 ? 0.98 : 0.92;
    const lowerClubMoveWithoutPremium = reputationDelta < 0 && financialFit < 1.02;
    const flatForeignMoveWithoutUpgrade = reputationDelta === 0 && isForeignMove && financialFit < 0.96;

    if (
      financialFit < requiredFinancialFit ||
      lowerClubMoveWithoutPremium ||
      flatForeignMoveWithoutUpgrade ||
      margin < 0
    ) {
      let reason = 'Zawodnik uznal, ze warunki kontraktu i projekt sportowy nie sa dla niego wystarczajaco korzystne.';

      if (lowerClubMoveWithoutPremium) {
        reason = 'Zawodnik moglby zejsc do slabszego reputacyjnie klubu tylko za wyraznie lepsza pensje, mocny bonus za podpis i odpowiednia dlugosc kontraktu.';
      } else if (player.age >= 30 && yearsFit < 1) {
        reason = 'Na tym etapie kariery zawodnik oczekuje mocniejszego zabezpieczenia gwarantowanego okresu kontraktu.';
      } else if (bonusFit < 0.9 && player.age >= 29) {
        reason = 'Dla starszego zawodnika bonus za podpis jest zbyt niski wzgledem ryzyka zmiany klubu.';
      } else if (salaryFit < 0.95) {
        reason = 'Roczna pensja jest zbyt daleka od finansowych oczekiwan zawodnika.';
      }

      return {
        accepted: false,
        reason,
        stayScore,
        offerScore,
        targetRole: negotiationPlan.targetRole
      };
    }

    return {
      accepted: true,
      reason: `Zawodnik zaakceptowal warunki. Oferta spelnia jego oczekiwania finansowe i daje realna perspektywe roli ${negotiationPlan.targetRole.toLowerCase()}.`,
      stayScore,
      offerScore,
      targetRole: negotiationPlan.targetRole
    };
  },

  estimateRole: (
    player: Player,
    squad: Player[]
  ): SquadRole => {
    const samePosition = squad
      .filter(p => p.position === player.position && p.id !== player.id)
      .sort((a, b) => b.overallRating - a.overallRating);

    const betterPlayers = samePosition.filter(p => p.overallRating > player.overallRating).length;

    if (betterPlayers === 0) return 'STAR';
    if (betterPlayers <= 1) return 'FIRST_TEAM';
    if (betterPlayers <= 3) return 'ROTATION';
    return 'BACKUP';
  }
};
