import { Club } from '@/types';
import { Player } from '../types';

// ============================================================
// PARAMETRY KOSZTÓW DNIA MECZOWEGO  —  pogrupowane wg. ligi
// ============================================================
// Tier 1 = Ekstraklasa, Tier 2 = 1. Liga, Tier 3 = 2. Liga, Tier 4 = Regionalna
//
// Koszty rosną progresywnie w zależności od:
//   • ligi (tier)
//   • reputacji klubu (representuje wielkość klubu i infrastrukturę)
//   • frekwencji (attendance) — osób na trybunach
//   • współczynnika obciążenia stadionu (fill-rate multiplier)
//
// PRZYKŁADY (home):
//   Legia/Lech (rep=10, tier=1, att~22k)   ≈ 350–400 tys. zł  (max ~700 tys.)
//   Średniak Ekstraklasy (rep=6, att~7k)   ≈ 200–250 tys. zł
//   1. Liga Średni klub (rep=5, att~5k)     ≈ 55–80 tys. zł
//   2. Liga klub (rep=4, att~2k)            ≈ 14–20 tys. zł
// ============================================================
// ============================================================
// PARAMETRY PRZYCHODÓW DODATKOWYCH DNIA MECZOWEGO
// ============================================================
// Przychody per kibic (PLN/fan) przy meczu domowym.
// Tier 1 = Ekstraklasa, Tier 2 = 1. Liga, Tier 3 = 2. Liga, Tier 4 = Regionalna
//
// Mnożnik reputacji:  repMultiplier = 0.8 + (rep / 10) * 0.4
// Losowość:           random factor  0.80–1.20 (osobny dla każdej kategorii)
//
// PRZYKŁADY (przy attendance ~22k, rep=9, tier=1 — Legia/Lech):
//   Catering+Hospitality: ~85–130 tys. zł
//   Merchandising:        ~35–55  tys. zł
//   Programy + LED:       ~10–18  tys. zł
//   Parkingi + fanzony:   ~12–20  tys. zł
//
// PRZYKŁADY (attendance ~7k, rep=5, tier=1 — średniak Ekstraklasy):
//   Catering+Hospitality: ~22–40  tys. zł
//   Merchandising:        ~10–17  tys. zł
//   Programy + LED:       ~3–5    tys. zł
//   Parkingi + fanzony:   ~3–5    tys. zł
// ============================================================
export const MATCHDAY_ADDITIONAL_REVENUE_PARAMS = {
  //                             tier: [  0,    1,    2,    3,    4 ]
  cateringPerFan:                      [  0,  4.5,  2.0,  1.2,  0.5],
  merchandisingPerFan:                 [  0,  2.0,  0.8,  0.4, 0.15],
  programsPerFan:                      [  0,  0.6,  0.3,  0.4, 0.07],
  parkingPerFan:                       [  0,  0.7,  0.4, 0.25,  0.1],
} as const;

// ============================================================
// PARAMETRY ROCZNYCH PRZYCHODÓW VIP / LOŻE
// ============================================================
// Wynajem lóż (Skybox) – płatne raz na sezon (start sezonu).
// Dostęp: tylko kluby grające w Ekstraklasie (tier 1)
//         ORAZ stadiumCapacity > 15 000 miejsc.
//
// Zakres: 240 000 – 450 000 PLN/rok (zależnie od rep i rozmiaru stadionu)
// ============================================================
export const VIP_BOX_REVENUE_PARAMS = {
  base:            150_000,
  repScale:        200_000,   // * (rep / 10)
  capacityScale:    60_000,   // * (capacity / 40 000)
  minRevenue:      240_000,
  maxRevenue:      500_000,
} as const;

export const MATCHDAY_COST_PARAMS = {
  home: {
    //                       tier: [  0,       1,       2,      3,     4  ]
    baseCost:                     [  0,  50_000,  15_000,  5_000, 1_500],
    perFanCost:                   [  0,       9,     4.5,    2.0,   0.8],  // PLN za kibica
    repScale:                     [  0,  12_000,   4_000,  1_200,   400],  // PLN * reputacja
    minFloor:                     [  0, 200_000,  40_000, 10_000, 3_500],  // minim. koszt meczu u siebie
    maxCap:                       [  0, 700_000, 220_000, 70_000,20_000],  // maks. koszt meczu u siebie
  },
  away: {
    baseCost:                     [  0,  35_000,  12_000,  5_000, 1_500],  // koszty bazy wyjazdu
    repScale:                     [  0,   3_500,   1_500,    600,   150],  // wkład reputacji w koszty
    maxCap:                       [  0, 140_000,  55_000, 20_000, 7_000],  // maks. koszt wyjazdu
  },
} as const;

export const FinanceService = {
  /**
   * Oblicza budżet początkowy na podstawie poziomu ligi i reputacji (1-10)
   */
  calculateInitialBudget: (tier: number, reputation: number): number => {
    let min = 0;
    let max = 0;

    switch (tier) {
      case 1: // Ekstraklasa
        min = 50000000;
        max = 217000000;
        break;
      case 2: // 1 Liga
        min = 20000000;
        max = 70000000;
        break;
      case 3: // 2 Liga
        min = 10000000;
        max = 45000000;
        break;
      case 4: // Tier 4
        min = 800000;
        max = 10000000;
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
  calculateNewgenSalary: (clubBudget: number, overall: number, age: number): number => {
    const wagePool = FinanceService.getWagePool(clubBudget);
    const avgSquadSalary = wagePool / 31;

    const youthDiscount =
      age <= 17 ? 0.38 :
      age <= 19 ? 0.46 :
      age <= 21 ? 0.58 :
      0.72;

    const overallModifier = Math.min(1.2, Math.max(0.55, 0.55 + ((overall - 45) * 0.03)));

    let salary = avgSquadSalary * youthDiscount * overallModifier;

    if (overall >= 70) {
      const starBonus = 1.12 + Math.min(0.18, (overall - 70) * 0.02);
      salary *= starBonus;
    }

    const fairMarketSalary = FinanceService.getFairMarketSalary(overall);
    const fairMarketCapMultiplier = overall >= 70 ? 0.55 : 0.40;
    const cappedSalary = Math.min(salary, fairMarketSalary * fairMarketCapMultiplier);

    return Math.max(15_000, Math.round(cappedSalary / 5_000) * 5_000);
  },

  // Koszty organizacji meczu — progresywna formuła wg. ligi, reputacji i frekwencji
  // attendance (opcjonalne) — liczba kibiców na trybunach (dla meczów u siebie)
  calculateMatchdayExpenses: (club: any, isHome: boolean, attendance?: number): number => {
    const tier = Math.min(4, Math.max(1, parseInt((club.leagueId as string).split('_')[2] || '4')));
    const p = MATCHDAY_COST_PARAMS;

    if (isHome) {
      const att = attendance ?? 0;
      const fillRate = club.stadiumCapacity > 0 ? att / club.stadiumCapacity : 0;

      // Współczynnik obciążenia — im wyższe obciążenie stadionu, tym nieproporcjonalnie
      // większe koszty ochrony, stewardów, logistyki i hospitality
      const fillMultiplier =
        fillRate >= 0.95 ? 1.50 :
        fillRate >= 0.85 ? 1.30 :
        fillRate >= 0.70 ? 1.10 : 1.00;

      const rawCost =
        (p.home.baseCost[tier] +
         att * p.home.perFanCost[tier] +
         club.reputation * p.home.repScale[tier]) * fillMultiplier;

      return Math.min(
        p.home.maxCap[tier],
        Math.max(p.home.minFloor[tier], Math.floor(rawCost))
      );
    }

    // Wyjazd — koszty transportu, zakwaterowania, diet zawodników i sztabu
    const rawCost =
      p.away.baseCost[tier] +
      club.reputation * p.away.repScale[tier];

    return Math.min(p.away.maxCap[tier], Math.floor(rawCost));
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
    const isPolishClub = player.clubId.startsWith('PL_');
    let baseValue = 0;
    if (ovr >= 80) baseValue = 15000000 + (ovr - 80) * 1300000;
    else if (ovr >= 75) baseValue = 8500000 + (ovr - 75) * 840000;
    else if (ovr >= 70) baseValue = 4200000 + (ovr - 70) * 860000;
    else baseValue = 50000 + (ovr / 70) * 4150000;

    let multiplier = 1.0;
    switch (tier) {
      case 1:
        multiplier = 1.15;
        break;
      case 2:
        multiplier = 0.72;
        break;
      case 3:
        multiplier = 0.30;
        break;
      case 4:
        multiplier = 0.12;
        break;
      case 5:
        multiplier = 0.08;
        break;
      default:
        multiplier = 0.18;
        break;
    }

    if (reputation > 5) multiplier += (reputation - 5) * 0.03;
    else if (reputation < 4) multiplier -= (4 - reputation) * 0.02;

    const tierCap = isPolishClub
      ? ({
          1: 50_000_000,
          2: 12_000_000,
          3: 3_000_000,
          4: 600_000
        } as Record<number, number | undefined>)[tier]
      : ({
          1: 120_000_000,
          2: 18_000_000,
          3: 6_000_000,
          4: 2_000_000,
          5: 800_000
        } as Record<number, number | undefined>)[tier];

    const randomFactor = 0.97 + (Math.random() * 0.06);
    const rawValue = baseValue * multiplier * randomFactor;
    const cappedValue = tierCap ? Math.min(rawValue, tierCap) : rawValue;
    return Math.round(cappedValue / 100) * 100;
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
    const expectedSalary = player.annualSalary > 0 
  ? player.annualSalary 
  : FinanceService.getFairMarketSalary(player.overallRating);
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
    // 1. BLOKADA KSIĘGOWEGO: proponowana pensja > 25% budżetu transferowego
    // (Nie porównujemy łącznego funduszu płac do budżetu – to są zupełnie różne pojęcia finansowe)
    const salaryCap = club.budget * 0.25;
    if (proposedSalary > salaryCap) {
      return { approved: false, reason: `DYREKTOR FINANSOWY: Proponowana pensja przekracza 25% naszego budżetu transferowego (limit: ${Math.floor(salaryCap).toLocaleString()} PLN).` };
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

  evaluateRenewalBoardDecision: (player: Player, proposedSalary: number, proposedBonus: number, squad: Player[], club: Club): { approved: boolean, reason: string } => {
    // 1/365 szansa że "zwariowany prezes" zatwierdza cokolwiek
    if (Math.random() < (1 / 365)) {
      return { approved: true, reason: "PREZES: Wiecie co, idę na całość. Podpisujemy!" };
    }

    const currentWageBill = FinanceService.calculateCurrentWageBill(squad);
    const wageBillAfter = currentWageBill - player.annualSalary + proposedSalary;

    // 1. FUNDUSZ PŁAC: łączne pensje po przedłużeniu > 65% budżetu
    if (wageBillAfter > club.budget * 0.65) {
      return {
        approved: false,
        reason: "DYREKTOR FINANSOWY: Łączny fundusz płac po tej podwyżce przekroczyłby nasze możliwości budżetowe."
      };
    }

    // 2. SKOK PENSJI: nowa pensja > 2× obecna pensja zawodnika
    if (proposedSalary > player.annualSalary * 2 && player.annualSalary > 0) {
      return {
        approved: false,
        reason: `PREZES: Podwojenie pensji to za duży skok naraz. Zawodnik zarabia teraz ${player.annualSalary.toLocaleString()} PLN — wróćcie z rozsądniejszą propozycją.`
      };
    }

    // 3. HIERARCHIA PŁAC: nowa pensja > 1.5× max w składzie (tylko dla OVR < 80)
    const highestSalary = squad.length > 0 ? Math.max(...squad.map(p => p.annualSalary)) : 0;
    if (proposedSalary > highestSalary * 1.5 && highestSalary > 0 && player.overallRating < 80) {
      return {
        approved: false,
        reason: `PREZES: Ten zawodnik zarabiałby więcej niż 1.5x tyle co najlepiej opłacany gracz w zespole (${highestSalary.toLocaleString()} PLN). Szatnia tego nie zaakceptuje.`
      };
    }

    // 4. BONUS: > 30% wolnego budżetu
    if (proposedBonus > club.budget * 0.30) {
      return {
        approved: false,
        reason: "DYREKTOR FINANSOWY: Bonus za podpis jest zbyt wysoki wobec aktualnych rezerw gotówkowych klubu."
      };
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
  },

  evaluateReleaseVsList: (player: Player): 'RELEASE' | 'TRANSFER_LIST' => {
    // Jeśli zawodnik jest wart więcej niż połowa jego rocznej pensji -> próbujemy sprzedać
    const marketValue = player.marketValue || 0;
    const releaseCost = player.annualSalary * 0.4;
    
    if (marketValue > player.annualSalary * 0.5) {
      return 'TRANSFER_LIST';
    }
    return 'RELEASE';
  },

  // Funkcja zwraca cenę biletu jednorazowego w zależności od ligi i reputacji
  calculateTicketPrice: (tier: number, reputation: number): number => {
    let basePrice = 0;
    
    switch (tier) {
      case 1: // Ekstraklasa
        basePrice = 20 + (reputation / 10) * 160; // 20-180 PLN
        break;
      case 2: // 1 Liga
        const ekstraPrice = 20 + (reputation / 10) * 160;
        basePrice = ekstraPrice * (0.4 + (reputation / 10) * 0.2); // 40-60% poniżej
        break;
      case 3: // 2 Liga i niższe
        const refPrice = 20 + (reputation / 10) * 160;
        basePrice = refPrice * (0.15 + (reputation / 10) * 0.25); // 60-85% poniżej
        break;
      default:
        basePrice = 40;
    }
    
    return Math.floor(basePrice);
  },

  // Przychód z biletów jednorazowych
  calculateMatchTicketRevenue: (attendance: number, tier: number, reputation: number): { revenue: number; avgPrice: number } => {
    const maxPrice = FinanceService.calculateTicketPrice(tier, reputation);
    const minPrice = 20;
    const avgPrice = Math.floor(minPrice + Math.random() * (maxPrice - minPrice));
    return { revenue: Math.floor(attendance * avgPrice), avgPrice };
  },

  // Przychód z karnetów na sezon (tylko dla gospodarza)
  calculateSeasonTicketRevenue: (stadiumCapacity: number, reputation: number, tier: number): number => {
    // Karnetami kupuje się od 10%-30% pojemności stadionu w zaledości od reputacji
    let percentageOfCapacity = 0.10 + ((reputation / 10) * 0.20); // 10-30%
    
    // Cena sezonu od 200 do 1300 PLN
    const singlePrice = FinanceService.calculateTicketPrice(tier, reputation);
    const matchesPerSeason = 19; // Średnia liczba meczów u siebie
    const seasonTicketPrice = singlePrice * matchesPerSeason;
    const minSeasonPrice = 200;
    const maxSeasonPrice = 1300;
    
    const finalSeasonPrice = Math.max(minSeasonPrice, Math.min(maxSeasonPrice, seasonTicketPrice));
    const seasonTicketsSold = Math.floor(stadiumCapacity * percentageOfCapacity);
    
    return Math.floor(seasonTicketsSold * finalSeasonPrice);
  },

  // Dodatkowe przychody dnia meczowego per mecz domowy:
  // catering, merchandising, programy/LED, parkingi — proporcjonalne do frekwencji
  calculateMatchdayAdditionalRevenues: (attendance: number, tier: number, reputation: number): {
    catering: number;
    merchandising: number;
    programs: number;
    parking: number;
  } => {
    const t = Math.min(4, Math.max(1, tier));
    const p = MATCHDAY_ADDITIONAL_REVENUE_PARAMS;
    const repMultiplier = 0.8 + (reputation / 10) * 0.4;

    const rand = () => 0.80 + Math.random() * 0.40;

    const catering      = Math.floor(attendance * p.cateringPerFan[t]      * repMultiplier * rand());
    const merchandising = Math.floor(attendance * p.merchandisingPerFan[t] * repMultiplier * rand());
    const programs      = Math.floor(attendance * p.programsPerFan[t]      * repMultiplier * rand());
    const parking       = Math.floor(attendance * p.parkingPerFan[t]       * repMultiplier * rand());

    return { catering, merchandising, programs, parking };
  },

  // Roczny przychód z wynajmu stref VIP i lóż (Skybox).
  // Warunki: tier === 1 (Ekstraklasa) ORAZ stadiumCapacity > 15 000
  calculateVIPBoxRevenue: (stadiumCapacity: number, reputation: number): number => {
    const p = VIP_BOX_REVENUE_PARAMS;
    const raw = p.base + (reputation / 10) * p.repScale + (stadiumCapacity / 40_000) * p.capacityScale;
    const jitter = 0.85 + Math.random() * 0.30;
    return Math.min(p.maxRevenue, Math.max(p.minRevenue, Math.floor(raw * jitter)));
  },

  // Bonusy za pozycję końcową w lidze (Ekstraklasa)
  calculateLeagueFinishBonus: (position: number, tier: number): number => {
    // Bonusy tylko dla Ekstraklasy (tier 1)
    if (tier !== 1) return 0;
    
    const bonuses: Record<number, number> = {
      1: 35000000 + Math.random() * 3000000, // 35-38 mln
      2: 28000000 + Math.random() * 4000000, // 28-32 mln
      3: 24000000 + Math.random() * 4000000, // 24-28 mln
      4: 20000000 + Math.random() * 5000000, // 20-25 mln
    };
    
    if (bonuses[position]) return Math.floor(bonuses[position]);
    
    // Dla pozycji 5-18: zmniejszające się bonusy
    if (position > 4) {
      const baseBonus = 10000000;
      const decrement = 500000 * (position - 4);
      return Math.max(0, Math.floor(baseBonus - decrement));
    }
    
    return 0;
  },

  // Bonusy za Puchar Polski
  calculatePolishCupBonus: (cupPosition: 'WINNER' | 'FINALIST' | 'SEMIFINALIST' | 'QUARTERFINALIST' | 'ROUND_8' | 'ROUND_16' | 'ROUND_32' | 'ROUND_64'): number => {
    const bonuses: Record<string, number> = {
      'WINNER': 5000000,
      'FINALIST': 1000000,
      'SEMIFINALIST': 380000,
      'QUARTERFINALIST': 190000,
      'ROUND_8': 90000,
      'ROUND_16': 45000,
      'ROUND_32': 20000,
      'ROUND_64': 10000,
    };
    
    return bonuses[cupPosition] || 0;
  },

  // Bonus za Superpuchar Polski
  calculateSuperCupBonus: (isWinner: boolean): number => {
    return isWinner ? 200000 : 100000;
  },

  // Premie UEFA za Puchary Europejskie (sezon 2025/26, przeliczone na PLN wg kursu 4,25 EUR/PLN)
  calculateEuropeanPrizeMoney: (
    competition: 'CL' | 'EL' | 'CONF',
    event: 'Q1_ADVANCE' | 'Q2_ADVANCE' | 'GROUP_STAGE_ENTRY' | 'WIN' | 'DRAW' | 'KO_PLAYOFF' | 'R16' | 'QF' | 'SF' | 'FINALIST' | 'WINNER'
  ): number => {
    const EUR_PLN = 4.25;
    const prizes: Record<string, Record<string, number>> = {
      CL: {
        Q1_ADVANCE:        Math.round(400_000    * EUR_PLN), //   1 700 000
        Q2_ADVANCE:        Math.round(1_000_000  * EUR_PLN), //   4 250 000
        GROUP_STAGE_ENTRY: Math.round(18_620_000 * EUR_PLN), //  79 135 000
        WIN:               Math.round(2_100_000  * EUR_PLN), //   8 925 000
        DRAW:              Math.round(700_000    * EUR_PLN), //   2 975 000
        KO_PLAYOFF:        Math.round(1_100_000  * EUR_PLN), //   4 675 000
        R16:               Math.round(11_000_000 * EUR_PLN), //  46 750 000
        QF:                Math.round(12_500_000 * EUR_PLN), //  53 125 000
        SF:                Math.round(15_000_000 * EUR_PLN), //  63 750 000
        FINALIST:          Math.round(18_500_000 * EUR_PLN), //  78 625 000
        WINNER:            Math.round(25_000_000 * EUR_PLN), // 106 250 000
      },
      EL: {
        Q1_ADVANCE:        Math.round(100_000    * EUR_PLN), //     425 000
        Q2_ADVANCE:        Math.round(250_000    * EUR_PLN), //   1 062 500
        GROUP_STAGE_ENTRY: Math.round(4_310_000  * EUR_PLN), //  18 317 500
        WIN:               Math.round(630_000    * EUR_PLN), //   2 677 500
        DRAW:              Math.round(210_000    * EUR_PLN), //     892 500
        KO_PLAYOFF:        Math.round(500_000    * EUR_PLN), //   2 125 000
        R16:               Math.round(1_500_000  * EUR_PLN), //   6 375 000
        QF:                Math.round(2_200_000  * EUR_PLN), //   9 350 000
        SF:                Math.round(3_900_000  * EUR_PLN), //  16 575 000
        FINALIST:          Math.round(6_100_000  * EUR_PLN), //  25 925 000
        WINNER:            Math.round(5_200_000  * EUR_PLN), //  22 100 000
      },
      CONF: {
        Q1_ADVANCE:        Math.round(75_000     * EUR_PLN), //     318 750
        Q2_ADVANCE:        Math.round(150_000    * EUR_PLN), //     637 500
        GROUP_STAGE_ENTRY: Math.round(3_170_000  * EUR_PLN), //  13 472 500
        WIN:               Math.round(400_000    * EUR_PLN), //   1 700 000
        DRAW:              Math.round(133_000    * EUR_PLN), //     565 250
        KO_PLAYOFF:        Math.round(200_000    * EUR_PLN), //     850 000
        R16:               Math.round(800_000    * EUR_PLN), //   3 400 000
        QF:                Math.round(1_300_000  * EUR_PLN), //   5 525 000
        SF:                Math.round(2_500_000  * EUR_PLN), //  10 625 000
        FINALIST:          Math.round(4_000_000  * EUR_PLN), //  17 000 000
        WINNER:            Math.round(3_000_000  * EUR_PLN), //  12 750 000
      },
    };
    return prizes[competition]?.[event] ?? 0;
  },

};
