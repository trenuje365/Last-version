import { Club } from '@/types-reference';
import { Player } from '../types';

export const FinanceService = {
  /**
   * Oblicza budżet początkowy na podstawie poziomu ligi i reputacji (1-10)
   */
  calculateInitialBudget: (tier: number, reputation: number): number => {
    let min = 0;
    let max = 0;

    switch (tier) {
      case 1: // Ekstraklasa
        min = 24000000;
        max = 217000000;
        break;
      case 2: // 1 Liga
        min = 9000000;
        max = 18000000;
        break;
      case 3: // 2 Liga
        min = 1000000;
        max = 3000000;
        break;
      case 4: // Tier 4
        min = 80000;
        max = 500000;
        break;
      default:
        min = 1000000;
        max = 5000000;
    }

    const reputationFactor = (Math.min(10, Math.max(1, reputation)) - 1) / 9;
    const baseBudget = min + (max - min) * reputationFactor;
    const variability = 0.95 + (Math.random() * 0.1);
   
    return Math.floor(baseBudget * variability);
  },

  getWagePool: (totalBudget: number): number => {
    return totalBudget * 0.45;
  },

  calculateTotalSalaries: (squad: Player[]): number => {
    return squad.reduce((sum, p) => sum + (p.annualSalary || 0), 0);
  },

  calculateAvailableFunds: (totalBudget: number, squad: Player[]): number => {
    const expenses = FinanceService.calculateTotalSalaries(squad);
    return totalBudget - expenses;
  },

  calculateSalaryWeight: (ovr: number, age: number): number => {
    const baseWeight = Math.pow(Math.max(1, ovr - 35), 1.5);
    const ageMod = age < 20 ? 0.8 : 1.0;
    return baseWeight * ageMod;
  },

  calculateMatchdayExpenses: (club: any, isHome: boolean): number => {
    const reputationBase = club.reputation * 15000;
    if (isHome) {
      const stadiumOps = club.stadiumCapacity * 12;
      return Math.floor(reputationBase + stadiumOps);
    }
    const travelCosts = 10000 + (club.reputation * 7000);
    return Math.floor(travelCosts);
  },

  calculateSeasonalIncome: (tier: number, reputation: number, rank: number): number => {
    const tvRights = [0, 35000000, 15000000, 6000000, 2000000][tier] || 1000000;
    const sponsorship = reputation * 4000000;
    const prizeMoney = Math.max(0, (19 - rank) * 1500000);
    return Math.floor(tvRights + sponsorship + prizeMoney);
  },

  calculateMarketValue: (player: Player, reputation: number, tier: number): number => {
    if (player.clubId === 'FREE_AGENTS') return 0;
    const ovr = player.overallRating;
    let baseValue = 0;
    if (ovr >= 80) baseValue = 15000000 + (ovr - 80) * 1300000;
    else if (ovr >= 75) baseValue = 8500000 + (ovr - 75) * 840000;
    else if (ovr >= 70) baseValue = 4200000 + (ovr - 70) * 860000;
    else baseValue = 50000 + (ovr / 70) * 4150000;
    let multiplier = 1.0;
    if (tier === 1) multiplier += 0.15;
    if (tier === 3) multiplier -= 0.10;
    if (reputation > 5) multiplier += (reputation - 5) * 0.05;
    const randomFactor = 0.97 + (Math.random() * 0.06);
    return Math.round((baseValue * multiplier * randomFactor) / 100) * 100;
  },

  /**
   * Board Intervention Engine (BIE)
   * Oblicza WOZ (Wskaźnik Oporu Zarządu)
   */
  evaluateReleaseRequest: (player: Player, club: Club, squad: Player[]): { 
    status: 'APPROVED' | 'WARNING' | 'SOFT_BLOCK' | 'VETO', 
    woz: number, 
    reason: string 
  } => {
    const penalty = Math.floor(player.annualSalary * 0.4);
    const budget = club.budget;
    
    // 1. Wektor Finansowy (45%) - Ból budżetowy
    const financialPain = (penalty / budget) * 100;
    let financialScore = financialPain * 4; 
    if (financialPain > 20) financialScore += 50; 

    // 2. Wektor Sportowy (40%) - Status w kadrze
    const avgOvr = squad.reduce((acc, p) => acc + p.overallRating, 0) / squad.length;
    const starGap = player.overallRating - avgOvr;
    let sportScore = 0;
    if (starGap > 10) sportScore = 95; 
    else if (starGap > 5) sportScore = 50;
    else if (starGap < -5) sportScore = -20;

    // 3. Wektor Osobowości Zarządu (10%)
    const strictnessScore = (club.boardStrictness - 5) * 10;

    // 4. Czynnik Chaosu (5%)
    const chaosScore = (Math.random() * 20) - 10;

    let woz = Math.max(0, Math.min(100, (financialScore * 0.45) + (sportScore * 0.40) + (strictnessScore * 0.10) + chaosScore));

    const top11Ids = [...squad].sort((a, b) => b.overallRating - a.overallRating).slice(0, 11).map(p => p.id);
    const isPillar = top11Ids.includes(player.id);
    
    // Mechanizm Top 11 Elite Lock: 95% szansy na twardy opór zarządu przy próbie zwolnienia filaru drużyny
    if (isPillar && Math.random() > 0.05) {
      woz = Math.max(woz, 90); 
    }
    
    // Dodatkowy twardy warunek dla statusu Nietykalnego (isUntouchable) - 99% szansy na blokadę
    if (player.isUntouchable && Math.random() > 0.01) {
      woz = 100;
    }

    if (woz < 30) return { status: 'APPROVED', woz, reason: "Zarząd akceptuje Pana decyzję. Koszty są akceptowalne, a zawodnik nie jest kluczowy dla wizerunku klubu." };
    if (woz < 60) return { status: 'WARNING', woz, reason: "Zarząd ma pewne wątpliwości co do opłacalności tego ruchu. Ostatecznie ufa Pana osądowi, ale oczekuje wyników." };
    if (woz < 85) return { status: 'SOFT_BLOCK', woz, reason: "Wniosek odrzucony. Obecnie nie możemy sobie pozwolić na taką stratę finansową. Proszę spróbować za 3 miesiące." };
    return { status: 'VETO', woz, reason: "ABSOLUTNE VETO! Ten zawodnik jest ikoną klubu, a koszty jego zwolnienia zrujnowałyby nasz budżet transferowy!" };
  },

  /**
   * Oblicza ile klub ma w puli na bonusy za podpis (5-10% budżetu)
   */
  calculateInitialSigningPool: (budget: number, reputation: number): number => {
    // Im większa reputacja, tym zarząd chętniej rezerwuje więcej (do 10%)
    const repFactor = (reputation / 10) * 0.05; 
    const finalPercent = 0.05 + repFactor; 
    return Math.floor(budget * finalPercent);
  },

  /**
   * Oblicza ile zawodnik żąda za sam podpis (25-100% pensji)
   */
  calculatePlayerBonusDemand: (player: Player, proposedSalary: number, clubReputation: number): number => {
    // Losowa baza 25-100%
    let basePercent = 0.25 + (Math.random() * 0.75);
    
    // Modyfikator Reputacji: Jeśli klub > 8, zawodnik rząda min. 60%
    if (clubReputation > 8) {
      basePercent = Math.max(0.60, basePercent);
    }

    let demand = proposedSalary * basePercent;

    // Modyfikator Overall: Gwiazdy (>75) rzadają o 15% więcej
    if (player.overallRating > 75) {
      demand *= 1.15;
    }

    return Math.floor(demand);
  },

  /**
   * Sprawdza czy oferta nie jest "manipulacją" (poniżej 40% żądań)
   */
  isOfferInsulting: (proposedBonus: number, demand: number): boolean => {
    return proposedBonus < (demand * 0.4);
  },

  /**
   * Główny silnik prawdopodobieństwa akceptacji (FM HARDCORE MODE)
   */
  evaluateContractLogic: (
    player: Player, 
    newSalary: number, 
    newBonus: number,
    newEndDate: string, 
    currentDate: Date,
    clubReputation: number
  ): { accepted: boolean, reason: string, demands: { salary: number, bonus: number } | null } => {
    const now = currentDate.getTime();
    const currentEnd = new Date(player.contractEndDate).getTime();
    const newEnd = new Date(newEndDate).getTime();
    
    // 1. Oczekiwania zawodnika (punkt odniesienia to obecna pensja)
    const expectedSalary = player.annualSalary;
    const expectedBonus = FinanceService.calculatePlayerBonusDemand(player, expectedSalary, clubReputation);

    // --- TUTAJ WSTAW LOGIKĘ: WARUNEK LOSOWY (1 SZANSA NA 10 PRZY MAX -15%) ---
    const isSalaryWithin15Percent = newSalary >= expectedSalary * 0.85;
    const isBonusWithin15Percent = newBonus >= expectedBonus * 0.85;
    
    if (isSalaryWithin15Percent && isBonusWithin15Percent && Math.random() < 0.10) {
      return {
        accepted: true,
        reason: "Mój klient liczył na nieco lepsze warunki, ale po namyśle uznaliśmy, że ten zespół jest wart pewnych ustępstw finansowych. Podpisujemy!",
        demands: null
      };
    }
    // --- KONIEC WARUNKU LOSOWEGO ---
    
    // 2. Składowe satysfakcji (1.0 = 100% zadowolenia)
    const salaryScore = newSalary / expectedSalary;
    const bonusScore = expectedBonus > 0 ? (newBonus / expectedBonus) : 1.1;

    // 3. Mechanizm Dynamicznej Wymienności (Interchangeability)
    // Nadwyżka w pensji (powyżej 100%) rekompensuje brak bonusu w skali 1:2.5
    const salarySurplus = Math.max(0, salaryScore - 1.0);
    const effectiveBonusScore = bonusScore + (salarySurplus * 2.5);

    // Dodanie odwrotnej wymienności: Bonus -> Pensja
    const bonusSurplus = Math.max(0, bonusScore - 1.0);
    const effectiveSalaryScore = salaryScore + (bonusSurplus * 0.12); // Wysoki bonus łagodzi ból nieco niższej pensji

    // 4. Test "Progu Godności" (Hard Block)
    if (effectiveSalaryScore < 0.65) {
      return { 
        accepted: false, 
        reason: "Nie traktujecie mnie powaznie wiec nie będziemy o niczym rozmawiac. Do widzenia!",
        demands: null
      };
    }
    
    // Bonus może być zerowy, JEŚLI pensja jest wystarczająco wysoka (min. 115% oczekiwań)
    if (newBonus < (expectedBonus * 0.2) && effectiveSalaryScore < 1.15) {
      return { 
        accepted: false, 
        reason: "Mój agent uważa, że kwota za sam podpis jest zdecydowanie za niska. Proszę o przedstawienie nowej oferty uwzględniającej godny bonus.",
        demands: { salary: Math.ceil(expectedSalary * 1.05), bonus: expectedBonus }
      };
    }

    // 5. Wagi Satysfakcji zależne od Wieku
    let wSal = 0.6, wBon = 0.3, wLen = 0.1;
    if (player.age >= 32) {
      wSal = 0.4; wBon = 0.5; wLen = 0.1; // Weterani cenią gotówkę "na stół"
    } else if (player.age <= 23) {
      wSal = 0.7; wBon = 0.1; wLen = 0.2; // Młodzi chcą wysokiej pensji i statusu
    }

    // 6. Ocena Długości
    const proposedYears = (newEnd - now) / (365 * 24 * 60 * 60 * 1000);
    const remainingYears = (currentEnd - now) / (365 * 24 * 60 * 60 * 1000);
    
    let lengthScore = 1.0;
    if (proposedYears < remainingYears) lengthScore = 0.5; 
    if (player.age > 33 && proposedYears >= 2) lengthScore = 1.3; // Starsi kochają stabilizację

    // 7. Wynik Końcowy (Final Score)
    const finalScore = (effectiveSalaryScore * wSal) + (effectiveBonusScore * wBon) + (lengthScore * wLen);
  // 8. System Kontroferty (Zgodnie z wymaganiem: 9/10 przypadków rząda 5-25% WIĘCEJ niż obecna pensja)
    const isDemandingHigher = Math.random() < 0.9;

    let demandSalary = expectedSalary;
    let demandBonus = expectedBonus;

    if (isDemandingHigher) {
      const multiplier = 1.05 + (Math.random() * 0.15); // 1.05 do 1.20
      demandSalary = Math.ceil(expectedSalary * multiplier);
      demandBonus = Math.ceil(expectedBonus * multiplier);
    } else {
      demandSalary = expectedSalary;
      demandBonus = expectedBonus;
    }

    const demands = {
      salary: demandSalary,
      bonus: demandBonus
    };

    if (finalScore >= 0.98) { 
      return { accepted: true, reason: "Zgadzam się na te warunki.", demands: null };
    }

    if (finalScore >= 0.70) { 
       return { 
         accepted: false, 
         reason: "Jesteśmy blisko porozumienia, ale mój klient oczekuje lepszych kwot, biorąc pod uwagę jego status w zespole. Oto nasze oczekiwania.",
         demands 
       };
    }

    return { 
      accepted: false, 
      reason: "Z całym szacunkiem, ale te warunki są nieakceptowalne. Proszę o przedstawienie oferty godnej zawodnika tej klasy.", 
      demands: finalScore > 0.4 ? demands : null 
    };
  },

  // Oblicza sumę wszystkich pensji w drużynie
  calculateCurrentWageBill: (squad: Player[]): number => {
    return squad.reduce((sum, p) => sum + (p.annualSalary || 0), 0);
  },

  // Oblicza rynkową wartość pensji dla danego OVR (punkt odniesienia dla Zarządu)
   getFairMarketSalary: (ovr: number): number => {
    const base = Math.pow(ovr / 50, 4) * 125000;
    return Math.floor(base);
  },

  calculateFAExpectations: (player: Player, clubReputation: number, avgSquadSalary: number): number => {
    // Podstawa: OVR do kwadratu (wykładniczy wzrost żądań)
    const base = Math.pow(player.overallRating, 2.9) * 0.45;
    // Podatek od reputacji: Jeśli klub ma niską sławę, gracz chce więcej "odszkodowania"
    const repTax = (10 - clubReputation) * 0.05;
    // Kotwica płacowa: Agent patrzy ile zarabiają inni w Twoim klubie
    const anchor = (avgSquadSalary * 0.3) + (base * 0.7);
    // Czynnik losowy (Chaos) +/- 15%
    const chaos = 0.85 + (Math.random() * 0.3);
    return Math.floor(anchor * (1 + repTax) * chaos);
  },

  evaluateFASigningBoardDecision: (player: Player, proposedSalary: number, proposedBonus: number, squad: Player[], club: Club): { approved: boolean, reason: string } => {
    const currentWageBill = FinanceService.calculateCurrentWageBill(squad);
    const newTotalWageBill = currentWageBill + proposedSalary;
    
    // 1. BLOKADA KSIĘGOWEGO (Budżet ogólny)
    const budgetSafetyLimit = club.budget * 0.70;
    if (newTotalWageBill > budgetSafetyLimit) {
      return { approved: false, reason: "DYREKTOR FINANSOWY: Niestety nie możemy sobie pozwolić na taki wydatek." };
    }

    // 2. BLOKADA STRUKTURALNA (Porównanie z liderami płac)
    const highestSalary = squad.length > 0 ? Math.max(...squad.map(p => p.annualSalary)) : 0;
    if (proposedSalary > highestSalary * 2 && highestSalary > 0 && player.overallRating < 82) {
      return {
        approved: false,
        reason: `PREZES: Ta oferta zniszczy naszą hierarchię w szatni! Nie damy nowemu graczowi dwa razy więcej niż zarabia nasz najlepszy zawodnik (${highestSalary.toLocaleString()} PLN).`
      };
    }

    // 3. OCENA WARTOŚCI RYNKOWEJ (Usunięto lukę dla OVR 78+)
    const fairSalary = FinanceService.getFairMarketSalary(player.overallRating);
    const overpayRatio = proposedSalary / fairSalary;
    const allowedOverpay = 1.2 + ((10 - club.boardStrictness) / 10); // Max 2.1x przy bardzo luźnym zarządzie

    if (overpayRatio > allowedOverpay) {
      return {
        approved: false,
        reason: `ZARZĄD: Ta kwota to absurd! Sugerowana pensja rynkowa dla OVR ${player.overallRating} to ok. ${fairSalary.toLocaleString()} PLN. Nie pozwolimy na taką niegospodarność.`
      };
    }

    if (proposedBonus > club.budget * 0.5) {
      return { approved: false, reason: "ZARZĄD: Bonus za podpis jest zbyt wysoki w stosunku do wolnej gotówki w klubie." };
    }

    return { approved: true, reason: "" };
  },

  classifyFAOffer: (proposed: number, expected: number): 'IDEAL' | 'ATTRACTIVE' | 'AVERAGE' | 'WEAK' | 'INSULT' => {
    const ratio = proposed / expected;
    if (ratio >= 1.1) return 'IDEAL';
    if (ratio >= 0.9) return 'ATTRACTIVE';
    if (ratio >= 0.7) return 'AVERAGE';
    if (ratio >= 0.45) return 'WEAK';
    return 'INSULT';
  },

  compareMultipleOffers: (offers: any[], clubs: Club[]): any => {
    return [...offers].sort((a, b) => {
      const clubA = clubs.find(c => c.id === a.clubId);
      const clubB = clubs.find(c => c.id === b.clubId);
      
      const repA = clubA ? clubA.reputation : 1;
      const repB = clubB ? clubB.reputation : 1;

      // Algorytm atrakcyjności: Pensja + połowa bonusu + bonus za prestiż klubu
      const scoreA = a.salary + (a.bonus / 2) + (repA * 50000);
      const scoreB = b.salary + (b.bonus / 2) + (repB * 50000);
      
      return scoreB - scoreA; 
    })[0];
  }
};