import { Club, Player, PendingNegotiation, PlayerPosition, TransferTiming, TransferClubBidInput, TransferContractInput } from '../types';
import { FinanceService as FinanceLogic } from './FinanceService';
import { TransferSellerLogicService } from './TransferSellerLogicService';
import { TransferPlayerDecisionService } from './TransferPlayerDecisionService';

/**
 * Sprawdza czy aktualnie trwa okno transferowe.
 * Nie dotyczy wolnych agentów — ci mogą być podpisywani przez cały rok.
 *
 * Letnie:  1 lipca  (m6, d1)  — 8 września  (m8, d8)  włącznie
 * Zimowe: 12 stycznia (m0, d12) — 13 lutego (m1, d13) włącznie
 */
const _isTransferWindowOpen = (currentDate: Date): boolean => {
  const month = currentDate.getMonth();
  const day = currentDate.getDate();

  const isSummer =
    (month === 6 && day >= 1) ||
    month === 7 ||
    (month === 8 && day <= 8);

  const isWinter =
    (month === 0 && day >= 12) ||
    (month === 1 && day <= 13);

  return isSummer || isWinter;
};

const _hasActiveTransferLockout = (player: Player, currentDate: Date): boolean => {
  return !!player.transferLockoutUntil && currentDate < new Date(player.transferLockoutUntil);
};

const _buildTransferLockoutUntil = (currentDate: Date): string => {
  const lockoutDate = new Date(currentDate);
  lockoutDate.setMonth(lockoutDate.getMonth() + 3);
  return lockoutDate.toISOString();
};

export const AiContractService = {
  /**
   * Przetwarza wszystkie kluby AI w poszukiwaniu kończących się kontraktów.
   */
  processClubsContracts: (
    clubs: Club[],
    playersMap: Record<string, Player[]>,
    currentDate: Date,
    userTeamId: string | null
  ): { updatedClubs: Club[], updatedPlayers: Record<string, Player[]> } => {
    
    let updatedClubs = [...clubs];
    let updatedPlayersMap = { ...playersMap };

    updatedClubs = updatedClubs.map(club => {
      // Pomijamy klub gracza i kluby bez przypisanych piłkarzy
      if (club.id === userTeamId || !updatedPlayersMap[club.id]) return club;

      let currentClub = { ...club };
      const squad = updatedPlayersMap[club.id];

      updatedPlayersMap[club.id] = squad.map(player => {
        const p = { ...player };
        
        // 1. Sprawdzenie czy kontrakt wygasa (poniżej 365 dni)
        const daysLeft = Math.floor((new Date(p.contractEndDate).getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysLeft > 365) return p;

        // 2. Blokady: Czy zawodnik chce w ogóle rozmawiać?
        const isLocked = p.negotiationLockoutUntil && currentDate < new Date(p.negotiationLockoutUntil);
        if (isLocked || p.isNegotiationPermanentBlocked) return p;

        // 3. Obliczanie oferty AI
        // AI oferuje podwyżkę 10-25% zależnie od reputacji klubu
        const salaryMultiplier = 1.10 + (club.reputation / 100);
        const proposedSalary = Math.floor(p.annualSalary * salaryMultiplier);
        
        // Bonus za podpis - AI oferuje ok 50% tego co zawodnik chce, o ile klub ma kasę
        const baseDemand = FinanceLogic.calculatePlayerBonusDemand(p, proposedSalary, club.reputation);
        const proposedBonus = Math.floor(baseDemand * 0.75);

        // Czy klub ma na to pieniądze w puli bonusowej?
        if (proposedBonus > currentClub.signingBonusPool) return p;

        // 4. Ewaluacja silnikiem gry
        const newEndDate = new Date(currentDate.getFullYear() + 2, 5, 30).toISOString(); // Nowa umowa na +2 lata
        const result = FinanceLogic.evaluateContractLogic(p, proposedSalary, proposedBonus, newEndDate, currentDate, club.reputation);

        if (result.accepted) {
          // SUKCES: Piłkarz zostaje
          currentClub.signingBonusPool -= proposedBonus;
          currentClub.budget -= proposedBonus;
          return {
            ...p,
            annualSalary: proposedSalary,
            contractEndDate: newEndDate,
            negotiationStep: 0,
            isOnTransferList: false // Zdejmij z listy jeśli podpisał
          };
        } else {
          // PORAŻKA: Zwiększ licznik prób
          const nextStep = (p.negotiationStep || 0) + 1;
          const lockout = new Date(currentDate);
          lockout.setDate(lockout.getDate() + 21); // Blokada na 3 tygodnie

          const permanentBlock = nextStep >= 3;
          
          return {
            ...p,
            negotiationStep: nextStep,
            negotiationLockoutUntil: lockout.toISOString(),
            isNegotiationPermanentBlocked: permanentBlock,
            isOnTransferList: permanentBlock // Jeśli obraził się na amen -> trafia na listę transferową
          };
        }
      });

      return currentClub;
    });

    return { updatedClubs, updatedPlayers: updatedPlayersMap };
  },

  // TUTAJ WSTAW TEN KOD - SYSTEM REKRUTACJI FAIR PLAY
  /**
   * Analizuje wolnych agentów i generuje oferty oczekujące dla klubów AI.
   */
processAiRecruitment: (
    clubs: Club[],
    playersMap: Record<string, Player[]>,
    currentDate: Date,
    userTeamId: string | null
  ): { updatedClubs: Club[], updatedPlayers: Record<string, Player[]>, newOffers: PendingNegotiation[] } => {
    let updatedClubs = [...clubs];
    let updatedPlayersMap = { ...playersMap };
    const newOffers: PendingNegotiation[] = []; // AI nie używa już flow PendingNegotiation

    const freeAgents = updatedPlayersMap['FREE_AGENTS'] || [];
    if (freeAgents.length === 0) return { updatedClubs, updatedPlayers: updatedPlayersMap, newOffers };

    updatedClubs = updatedClubs.map(club => {
      if (club.id === userTeamId) return club;

      // DYNAMICZNA diagnoza potrzeb kadrowych:
      // klub szuka nie tylko brakow ilosciowych, ale tez upgrade'u na zbyt slabej pozycji.
      const squad = updatedPlayersMap[club.id] || [];
      const positions: PlayerPosition[] = [
        PlayerPosition.GK,
        PlayerPosition.DEF,
        PlayerPosition.MID,
        PlayerPosition.FWD
      ];
      const minCounts: Record<string, number> = { GK: 2, DEF: 5, MID: 4, FWD: 3 };
      const idealOvr = 30 + club.reputation * 4.5;
      const positionsNeeded = positions.filter(pos => {
        const posSquad = squad.filter(p => p.position === pos);
        if (posSquad.length < minCounts[pos]) return true;

        const weakest = [...posSquad].sort((a, b) => a.overallRating - b.overallRating)[0];
        return !!weakest && weakest.overallRating < idealOvr - 2;
      });

      if (positionsNeeded.length === 0) return club;

      // OGRANICZENIE CZĘSTOTLIWOŚCI: klub może mieć tylko 1 aktywną negocjację z wolnym agentem
      const alreadyNegotiating = freeAgents.some(fa => fa.aiNegotiationClubId === club.id);
      if (alreadyNegotiating) return club;

      if (club.budget <= 250_000) return club;

      // Szukanie kandydata: pasująca pozycja, OVR w zasięgu, nie jest już w negocjacji z innym AI, brak blokady
      const candidate = freeAgents.find(fa => {
        if (!positionsNeeded.includes(fa.position as PlayerPosition)) return false;
        if (fa.overallRating > idealOvr + 7 || fa.overallRating < idealOvr - 12) return false;
        if (fa.aiNegotiationClubId) return false;
        if (fa.freeAgentLockoutUntil && new Date(fa.freeAgentLockoutUntil) >= currentDate) return false;

        const posSquad = squad.filter(p => p.position === fa.position);
        const weakestExisting = [...posSquad].sort((a, b) => a.overallRating - b.overallRating)[0];
        const hasShortage = posSquad.length < minCounts[fa.position];
        const isUpgrade = !!weakestExisting && fa.overallRating >= weakestExisting.overallRating + 2;

        return hasShortage || isUpgrade;
      });

      if (!candidate) return club;

      // Oznacz wolnego agenta jako "w negocjacji" — okno 4 dni dla gracza na kontr-ofertę
      const responseDate = new Date(currentDate);
      responseDate.setDate(responseDate.getDate() + 4);

      const faList = updatedPlayersMap['FREE_AGENTS'];
      const idx = faList.findIndex(p => p.id === candidate.id);
      if (idx !== -1) {
        updatedPlayersMap['FREE_AGENTS'] = faList.map((p, i) =>
          i === idx
            ? { ...p, aiNegotiationClubId: club.id, aiNegotiationResponseDate: responseDate.toISOString() }
            : p
        );
      }

      return club;
    });

    return { updatedClubs, updatedPlayers: updatedPlayersMap, newOffers };
  },

/**
   * Rozwiązuje zakończone negocjacje AI z wolnymi agentami.
   * Wywoływana codziennie. Gdy aiNegotiationResponseDate <= dziś:
   *   - Ocenia akceptację oferty używając reputacji AI-klubu
   *   - Jeśli TAK: przenosi zawodnika do składu AI-klubu
   *   - Jeśli NIE: czyści pola, ustawia blokadę 90 dni
   */
  resolveAiFreeAgentNegotiations: (
    clubs: Club[],
    playersMap: Record<string, Player[]>,
    currentDate: Date,
    userTeamId: string | null
  ): { updatedClubs: Club[], updatedPlayers: Record<string, Player[]> } => {
    let updatedClubs = [...clubs];
    let updatedPlayersMap = { ...playersMap };

    const freeAgents = updatedPlayersMap['FREE_AGENTS'] || [];
    const today = currentDate.getTime();

    const due = freeAgents.filter(fa =>
      fa.aiNegotiationClubId &&
      fa.aiNegotiationResponseDate &&
      new Date(fa.aiNegotiationResponseDate).getTime() <= today
    );

    if (due.length === 0) return { updatedClubs, updatedPlayers: updatedPlayersMap };

    for (const fa of due) {
      const aiClub = updatedClubs.find(c => c.id === fa.aiNegotiationClubId);

      if (!aiClub || aiClub.id === userTeamId) {
        // Klub nie istnieje lub to klub gracza — wyczyść flagi
        updatedPlayersMap['FREE_AGENTS'] = (updatedPlayersMap['FREE_AGENTS'] || []).map(p =>
          p.id === fa.id ? { ...p, aiNegotiationClubId: undefined, aiNegotiationResponseDate: undefined } : p
        );
        continue;
      }

      const proposedSalary = FinanceLogic.getFairMarketSalary(fa.overallRating);
      const proposedBonus = Math.floor(proposedSalary * 0.4);
      const newEndDate = new Date(currentDate.getFullYear() + 2, 5, 30).toISOString();

      if (aiClub.budget < proposedBonus + proposedSalary) {
        // Brak środków — wyczyść flagę
        updatedPlayersMap['FREE_AGENTS'] = (updatedPlayersMap['FREE_AGENTS'] || []).map(p =>
          p.id === fa.id ? { ...p, aiNegotiationClubId: undefined, aiNegotiationResponseDate: undefined } : p
        );
        continue;
      }

      const result = FinanceLogic.evaluateContractLogic(fa, proposedSalary, proposedBonus, newEndDate, currentDate, aiClub.reputation);

      if (result.accepted) {
        // Przenieś zawodnika do składu AI-klubu
        updatedPlayersMap['FREE_AGENTS'] = (updatedPlayersMap['FREE_AGENTS'] || []).filter(p => p.id !== fa.id);

        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1;
        const updatedHistory = [...(fa.history || [])];
        if (updatedHistory.length > 0) {
          updatedHistory[updatedHistory.length - 1] = {
            ...updatedHistory[updatedHistory.length - 1],
            toYear: currentYear,
            toMonth: currentMonth
          };
        }
        updatedHistory.push({
          clubName: aiClub.name,
          clubId: aiClub.id,
          fromYear: currentYear,
          fromMonth: currentMonth,
          toYear: null,
          toMonth: null
        });

        const signedPlayer: Player = {
          ...fa,
          clubId: aiClub.id,
          annualSalary: proposedSalary,
          contractEndDate: newEndDate,
          aiNegotiationClubId: undefined,
          aiNegotiationResponseDate: undefined,
          isOnTransferList: false,
          history: updatedHistory,
          transferLockoutUntil: _buildTransferLockoutUntil(currentDate)
        };

        updatedPlayersMap[aiClub.id] = [...(updatedPlayersMap[aiClub.id] || []), signedPlayer];

        updatedClubs = updatedClubs.map(c =>
          c.id === aiClub.id ? { ...c, budget: c.budget - proposedBonus } : c
        );
      } else {
        // Odrzucenie — blokada 90 dni
        const lockout = new Date(currentDate);
        lockout.setDate(lockout.getDate() + 90);
        updatedPlayersMap['FREE_AGENTS'] = (updatedPlayersMap['FREE_AGENTS'] || []).map(p =>
          p.id === fa.id
            ? { ...p, aiNegotiationClubId: undefined, aiNegotiationResponseDate: undefined, freeAgentLockoutUntil: lockout.toISOString() }
            : p
        );
      }
    }

    return { updatedClubs, updatedPlayers: updatedPlayersMap };
  },

  /**
   * Przygotowanie finansowania zakupów.
   * Dla klubów z potrzebami kadrowymi ale zbyt niskim budżetem — listuje na sprzedaż
   * najbardziej zbędnego zawodnika, aby wygospodarować środki na wzmocnienie.
   * Wywoływana codziennie (stagger co 7 dni per klub).
   */
  processAiSquadFinancing: (
    clubs: Club[],
    playersMap: Record<string, Player[]>,
    currentDate: Date,
    userTeamId: string | null
  ): { updatedClubs: Club[], updatedPlayers: Record<string, Player[]> } => {
    let updatedClubs = [...clubs];
    let updatedPlayersMap = { ...playersMap };

    const hashClubFin = (id: string): number => {
      let h = 0;
      for (let i = 0; i < id.length; i++) h = ((h << 5) - h + id.charCodeAt(i)) | 0;
      return Math.abs(h);
    };

    const dayOfYear = Math.floor(
      (currentDate.getTime() - new Date(currentDate.getFullYear(), 0, 0).getTime()) / 86_400_000
    );

    for (const club of updatedClubs) {
      if (club.id === userTeamId) continue;
      const finStagger = _isTransferWindowOpen(currentDate) ? 5 : 14;
      if ((dayOfYear + hashClubFin(club.id)) % finStagger !== 0) continue;

      const squad = updatedPlayersMap[club.id] || [];
      const positions: PlayerPosition[] = [
        PlayerPosition.GK,
        PlayerPosition.DEF,
        PlayerPosition.MID,
        PlayerPosition.FWD
      ];
      const minCounts: Record<string, number> = { GK: 2, DEF: 5, MID: 4, FWD: 3 };
      const idealOvr = 30 + club.reputation * 4.5;

      const hasNeeds = positions.some(pos => {
        const posSquad = squad.filter(p => p.position === pos);
        if (posSquad.length < minCounts[pos]) return true;
        const weakest = [...posSquad].sort((a, b) => a.overallRating - b.overallRating)[0];
        return weakest && weakest.overallRating < idealOvr - 1;
      });

      if (!hasNeeds) continue;

      // Szacowany minimalny koszt wzmocnienia dla tego poziomu reputacji
      const estimatedMinCost = FinanceLogic.getFairMarketSalary(idealOvr - 8) * 6;
      if (club.budget >= estimatedMinCost * 0.5) continue;

      // Szukaj najbardziej zbędnego zawodnika: pozycja z nadmiarem, najniższy stosunek OVR do pensji
      const expendable = squad
        .filter(p =>
          !p.isUntouchable &&
          !p.isOnTransferList &&
          !p.transferPendingClubId &&
          squad.filter(s => s.position === p.position).length > minCounts[p.position]
        )
        .sort((a, b) => {
          const scoreA = a.overallRating - (a.annualSalary / 100_000);
          const scoreB = b.overallRating - (b.annualSalary / 100_000);
          return scoreA - scoreB;
        })[0];

      if (!expendable) continue;

      updatedPlayersMap[club.id] = (updatedPlayersMap[club.id] || []).map(p =>
        p.id === expendable.id ? { ...p, isOnTransferList: true } : p
      );
    }

    return { updatedClubs, updatedPlayers: updatedPlayersMap };
  },

  /**
   * Szuka okazji transferowych na liście transferowej dla każdego AI-klubu.
   * Wywoływana codziennie — wewnętrzny stagger (hash klubu % 4) sprawia, że
   * każdy klub sprawdza rynek co ~4 dni w inny dzień cyklu.
   *
   * Logika:
   *   - Dynamiczna diagnoza potrzeb kadrowych
   *   - Normalny zakres OVR: [idealOvr-8, idealOvr+10]
   *   - Bargain hunting: [idealOvr+10, idealOvr+20] tylko gdy cena ≤ 35% budżetu
   *   - Pełna symulacja: getNegotiationStance → evaluateSellerDecision → evaluateMove
   *   - Jeśli obie strony akceptują → tag TRSF (transferPendingClubId + transferReportDate +3 dni)
   */
  processAiTransferListSignings: (
    clubs: Club[],
    playersMap: Record<string, Player[]>,
    currentDate: Date,
    userTeamId: string | null
  ): { updatedClubs: Club[], updatedPlayers: Record<string, Player[]> } => {
    let updatedClubs = [...clubs];
    let updatedPlayersMap = { ...playersMap };

    // Poza oknem transferowym — brak negocjacji między klubami
    if (!_isTransferWindowOpen(currentDate)) {
      return { updatedClubs, updatedPlayers: updatedPlayersMap };
    }

    const hashClub = (id: string): number => {
      let h = 0;
      for (let i = 0; i < id.length; i++) {
        h = ((h << 5) - h + id.charCodeAt(i)) | 0;
      }
      return Math.abs(h);
    };

    const dayOfYear = Math.floor(
      (currentDate.getTime() - new Date(currentDate.getFullYear(), 0, 0).getTime()) / 86_400_000
    );

    // Zbuduj płaską listę zawodników z listy transferowej (bez wolnych agentów i drużyny gracza)
    const transferListed: Player[] = Object.entries(updatedPlayersMap)
      .filter(([clubId]) => clubId !== 'FREE_AGENTS' && clubId !== userTeamId)
      .flatMap(([, squad]) => squad)
      .filter(p =>
        p.isOnTransferList &&
        !p.transferPendingClubId &&
        p.clubId !== userTeamId
      );

    if (transferListed.length === 0) return { updatedClubs, updatedPlayers: updatedPlayersMap };

    // Mutable kopia listy by usuwać zajętych kandydatów w trakcie pętli
    const available = [...transferListed];

    const sellerClubMap = new Map(updatedClubs.map(c => [c.id, c]));

    for (const club of clubs) {
      if (club.id === userTeamId) continue;

      // Stagger: w oknie co 2 dni (pilność), poza oknem funkcja już wychodziła wcześniej
      if ((dayOfYear + hashClub(club.id)) % 2 !== 0) continue;

      // Strategia rekrutacyjna: deterministyczna per klub, różna dla każdego agenta
      // 0=bargain hunter, 1=youth investor, 2=star chaser, 3=pragmatist
      const clubStrategy = hashClub(club.id) % 4;

      const squad = updatedPlayersMap[club.id] || [];
      if (squad.length >= 28) continue;
      if (club.budget <= 250_000) continue;

      // Dynamiczna diagnoza potrzeb
      const positions: PlayerPosition[] = [
        PlayerPosition.GK,
        PlayerPosition.DEF,
        PlayerPosition.MID,
        PlayerPosition.FWD
      ];
      const minCounts: Record<string, number> = { GK: 2, DEF: 5, MID: 4, FWD: 3 };
      const idealOvr = 30 + club.reputation * 4.5;
      // Trigger gdy brakuje zawodników LUB gdy najsłabszy na pozycji jest poniżej ideału (upgrade)
      const positionsToCheck = positions.filter(pos => {
        const posSquad = squad.filter(p => p.position === pos);
        if (posSquad.length < minCounts[pos]) return true;
        const weakest = [...posSquad].sort((a, b) => a.overallRating - b.overallRating)[0];
        return weakest && weakest.overallRating < idealOvr - 1;
      });
      if (positionsToCheck.length === 0) continue;

      // Oceń kandydatów
      const candidates = available.filter(p => {
        if (p.clubId === club.id) return false;
        if (_hasActiveTransferLockout(p, currentDate)) return false;
        if (!positionsToCheck.includes(p.position as PlayerPosition)) return false;

        const normalRange = p.overallRating >= idealOvr - 8 && p.overallRating <= idealOvr + 10;
        const bargainRange = p.overallRating > idealOvr + 10 && p.overallRating <= idealOvr + 20;
        if (!normalRange && !bargainRange) return false;

        // Kandydat musi być lepszy od obecnego najsłabszego na tej pozycji (upgrade check)
        const posSquad = (updatedPlayersMap[club.id] || []).filter(sq => sq.position === p.position);
        const weakestExisting = [...posSquad].sort((a, b) => a.overallRating - b.overallRating)[0];
        if (posSquad.length >= minCounts[p.position] && weakestExisting && p.overallRating <= weakestExisting.overallRating) return false;

        const sellerClub = sellerClubMap.get(p.clubId || '');
        if (!sellerClub) return false;

        const sellerSquad = updatedPlayersMap[p.clubId || ''] || [];
        const askingPrice = TransferSellerLogicService.estimateAskingPrice(p, sellerClub, sellerSquad, currentDate);
        const proposedSalary = FinanceLogic.getFairMarketSalary(p.overallRating);

        const budgetCapNormal = clubStrategy === 2 ? 0.65 : 0.50;
        const budgetCapBargain = clubStrategy === 2 ? 0.45 : 0.35;
        if (bargainRange && askingPrice > club.budget * budgetCapBargain) return false;
        if (normalRange && askingPrice > club.budget * budgetCapNormal) return false;
        if (clubStrategy === 1 && p.age > 26) return false;
        if (club.budget < askingPrice + proposedSalary) return false;

        return true;
      });

      if (candidates.length === 0) continue;

      // Wybierz kandydata wg strategii agenta rekrutacyjnego
      let sortedCandidates = [...candidates];
      if (clubStrategy === 1) {
        // Youth investor: najmłodszy, potem najwyższy OVR
        sortedCandidates.sort((a, b) => a.age - b.age || b.overallRating - a.overallRating);
      } else if (clubStrategy === 0) {
        // Bargain hunter: lista transferowa i wygasające kontrakty najpierw, potem tańszy OVR
        sortedCandidates.sort((a, b) => {
          const aVal = (a.isOnTransferList ? 20 : 0) + (new Date(a.contractEndDate).getTime() - currentDate.getTime() < 365 * 86_400_000 ? 10 : 0);
          const bVal = (b.isOnTransferList ? 20 : 0) + (new Date(b.contractEndDate).getTime() - currentDate.getTime() < 365 * 86_400_000 ? 10 : 0);
          return bVal - aVal || a.overallRating - b.overallRating;
        });
      } else {
        // Star chaser / pragmatist: najwyższy OVR
        sortedCandidates.sort((a, b) => b.overallRating - a.overallRating);
      }
      const best = sortedCandidates[0];
      const sellerClub = sellerClubMap.get(best.clubId || '');
      if (!sellerClub) continue;

      const sellerSquad = updatedPlayersMap[best.clubId || ''] || [];
      const askingPrice = TransferSellerLogicService.estimateAskingPrice(best, sellerClub, sellerSquad, currentDate);

      // Sprawdź czy sprzedający dopuszcza rozmowy
      const stance = TransferSellerLogicService.getNegotiationStance(
        best, sellerClub, club, sellerSquad, currentDate, TransferTiming.IMMEDIATE
      );
      if (!stance.allowTalks) continue;

      // AI płaci pełną cenę wywoławczą
      const bidInput: TransferClubBidInput = { fee: stance.askingPrice, timing: TransferTiming.IMMEDIATE };
      const sellerDecision = TransferSellerLogicService.evaluateSellerDecision(
        bidInput, best, sellerClub, club, sellerSquad, currentDate
      );
      if (sellerDecision.verdict !== 'ACCEPT') continue;

      // Sprawdź czy zawodnik chce przejść
      const proposedSalary = FinanceLogic.getFairMarketSalary(best.overallRating);
      const proposedBonus = Math.floor(proposedSalary * 0.4);
      const contractYears = best.age <= 27 ? 3 : best.age <= 31 ? 2 : 1;
      const contractInput: TransferContractInput = { salary: proposedSalary, bonus: proposedBonus, years: contractYears };

      const playerDecision = TransferPlayerDecisionService.evaluateMove(
        contractInput, best, sellerClub, club, sellerSquad, squad, currentDate
      );
      if (!playerDecision.accepted) continue;

      // Obie strony OK → tag TRSF + data meldunku za 3 dni
      const reportDate = new Date(currentDate);
      reportDate.setDate(reportDate.getDate() + 3);

      const sellerClubId = best.clubId || '';
      updatedPlayersMap[sellerClubId] = (updatedPlayersMap[sellerClubId] || []).map(p =>
        p.id === best.id
          ? { ...p, transferPendingClubId: club.id, transferReportDate: reportDate.toISOString() }
          : p
      );

      // Usuń zawodnika z dostępnej listy by inne kluby go nie wybrały w tej samej iteracji
      const idx = available.findIndex(p => p.id === best.id);
      if (idx !== -1) available.splice(idx, 1);

      // Opłata transferowa płatna natychmiast przy podpisaniu umowy
      updatedClubs = updatedClubs.map(c => {
        if (c.id === club.id) return { ...c, budget: c.budget - askingPrice };
        if (c.id === sellerClubId) return { ...c, budget: c.budget + askingPrice };
        return c;
      });
    }

    return { updatedClubs, updatedPlayers: updatedPlayersMap };
  },

  /**
   * Realizuje zainteresowania transferowe AI — kluby próbują pozyskać zawodników
   * z interestedClubs którzy NIE są na liście transferowej.
   * Uzupełnia processAiTransferListSignings który obsługuje tylko isOnTransferList.
   * Wywoływana codziennie (stagger co 6 dni per klub).
   */
  processAiInterestedPlayerTargeting: (
    clubs: Club[],
    playersMap: Record<string, Player[]>,
    currentDate: Date,
    userTeamId: string | null
  ): { updatedClubs: Club[], updatedPlayers: Record<string, Player[]> } => {
    let updatedClubs = [...clubs];
    let updatedPlayersMap = { ...playersMap };

    // Poza oknem transferowym — brak podejść do zawodników z interestedClubs
    if (!_isTransferWindowOpen(currentDate)) {
      return { updatedClubs, updatedPlayers: updatedPlayersMap };
    }

    const hashClubInt = (id: string): number => {
      let h = 0;
      for (let i = 0; i < id.length; i++) h = ((h << 5) - h + id.charCodeAt(i)) | 0;
      return Math.abs(h);
    };

    const dayOfYear = Math.floor(
      (currentDate.getTime() - new Date(currentDate.getFullYear(), 0, 0).getTime()) / 86_400_000
    );

    const sellerClubMap = new Map(updatedClubs.map(c => [c.id, c]));

    for (const club of clubs) {
      if (club.id === userTeamId) continue;
      if ((dayOfYear + hashClubInt(club.id)) % 3 !== 0) continue;
      if (club.budget <= 500_000) continue;

      const squad = updatedPlayersMap[club.id] || [];
      if (squad.length >= 28) continue;

      // Jeden aktywny zakup na raz
      const alreadyBuying = Object.values(updatedPlayersMap)
        .flat()
        .some(p => p.transferPendingClubId === club.id);
      if (alreadyBuying) continue;

      const idealOvr = 30 + club.reputation * 4.5;
      const positions = [PlayerPosition.GK, PlayerPosition.DEF, PlayerPosition.MID, PlayerPosition.FWD];
      const minCounts: Record<string, number> = { GK: 2, DEF: 5, MID: 4, FWD: 3 };

      const positionsToCheck = positions.filter(pos => {
        const posSquad = squad.filter(p => p.position === pos);
        if (posSquad.length < minCounts[pos]) return true;
        const weakest = [...posSquad].sort((a, b) => a.overallRating - b.overallRating)[0];
        return weakest && weakest.overallRating < idealOvr - 1;
      });
      if (positionsToCheck.length === 0) continue;

      // Kandydaci: gracze z interestedClubs zawierającym ten klub, niewystawieni na listę
      const targets = Object.entries(updatedPlayersMap)
        .filter(([cId]) => cId !== 'FREE_AGENTS' && cId !== club.id && cId !== userTeamId)
        .flatMap(([, sq]) => sq)
        .filter(p =>
          (p.interestedClubs || []).includes(club.id) &&
          !_hasActiveTransferLockout(p, currentDate) &&
          !p.isOnTransferList &&
          !p.transferPendingClubId &&
          positionsToCheck.includes(p.position as PlayerPosition) &&
          p.overallRating >= idealOvr - 8 &&
          p.overallRating <= idealOvr + 12
        );

      if (targets.length === 0) continue;

      const target = [...targets].sort((a, b) => b.overallRating - a.overallRating)[0];
      const sellerClub = sellerClubMap.get(target.clubId || '');
      if (!sellerClub) continue;

      const sellerSquad = updatedPlayersMap[target.clubId || ''] || [];
      const askingPrice = TransferSellerLogicService.estimateAskingPrice(target, sellerClub, sellerSquad, currentDate);
      const proposedSalary = FinanceLogic.getFairMarketSalary(target.overallRating);

      if (club.budget < askingPrice + proposedSalary) continue;
      if (askingPrice > club.budget * 0.55) continue;

      const stance = TransferSellerLogicService.getNegotiationStance(
        target, sellerClub, club, sellerSquad, currentDate, TransferTiming.IMMEDIATE
      );
      if (!stance.allowTalks) continue;

      const bidInput: TransferClubBidInput = { fee: stance.askingPrice, timing: TransferTiming.IMMEDIATE };
      const sellerDecision = TransferSellerLogicService.evaluateSellerDecision(
        bidInput, target, sellerClub, club, sellerSquad, currentDate
      );
      if (sellerDecision.verdict !== 'ACCEPT') continue;

      const proposedBonus = Math.floor(proposedSalary * 0.4);
      const contractYears = target.age <= 27 ? 3 : target.age <= 31 ? 2 : 1;
      const contractInput: TransferContractInput = { salary: proposedSalary, bonus: proposedBonus, years: contractYears };

      const playerDecision = TransferPlayerDecisionService.evaluateMove(
        contractInput, target, sellerClub, club, sellerSquad, squad, currentDate
      );
      if (!playerDecision.accepted) continue;

      const reportDate = new Date(currentDate);
      reportDate.setDate(reportDate.getDate() + 3);

      const sellerClubId = target.clubId || '';
      updatedPlayersMap[sellerClubId] = (updatedPlayersMap[sellerClubId] || []).map(p =>
        p.id === target.id
          ? { ...p, transferPendingClubId: club.id, transferReportDate: reportDate.toISOString() }
          : p
      );

      // Opłata transferowa płatna natychmiast przy podpisaniu umowy
      updatedClubs = updatedClubs.map(c => {
        if (c.id === club.id) return { ...c, budget: c.budget - askingPrice };
        if (c.id === sellerClubId) return { ...c, budget: c.budget + askingPrice };
        return c;
      });
    }

    return { updatedClubs, updatedPlayers: updatedPlayersMap };
  },

  /**
   * Wykonuje oczekujące transfery AI (tag TRSF) gdy transferReportDate <= dziś.
   * Wywoływana codziennie.
   *
   * Przy wykonaniu:
   *   - Ponowna weryfikacja budżetu kupującego (mógł zmaleć w międzyczasie)
   *   - Przenosi zawodnika ze składu sprzedającego do kupującego
   *   - Rozlicza opłatę transferową między klubami
   *   - Czyści tagi TRSF
   */
  resolveAiTransferPending: (
    clubs: Club[],
    playersMap: Record<string, Player[]>,
    currentDate: Date,
    userTeamId: string | null
  ): { updatedClubs: Club[], updatedPlayers: Record<string, Player[]> } => {
    let updatedClubs = [...clubs];
    let updatedPlayersMap = { ...playersMap };
    const today = currentDate.getTime();

    // Okno transferowe zamknięte — zawodnicy z tagiem TRSF czekają, nie są przenoszeni
    if (!_isTransferWindowOpen(currentDate)) {
      return { updatedClubs, updatedPlayers: updatedPlayersMap };
    }

    for (const sellerClubId of Object.keys(updatedPlayersMap)) {
      if (sellerClubId === 'FREE_AGENTS') continue;

      const squad = updatedPlayersMap[sellerClubId] || [];
      const due = squad.filter(p =>
        p.transferPendingClubId &&
        p.transferReportDate &&
        new Date(p.transferReportDate).getTime() <= today
      );

      for (const player of due) {
        const buyerClubId = player.transferPendingClubId!;
        const buyerClub = updatedClubs.find(c => c.id === buyerClubId);
        const sellerClub = updatedClubs.find(c => c.id === sellerClubId);

        if (!buyerClub || !sellerClub) {
          updatedPlayersMap[sellerClubId] = (updatedPlayersMap[sellerClubId] || []).map(p =>
            p.id === player.id ? { ...p, transferPendingClubId: undefined, transferReportDate: undefined } : p
          );
          continue;
        }

        const proposedSalary = FinanceLogic.getFairMarketSalary(player.overallRating);
        const proposedBonus = Math.floor(proposedSalary * 0.4);

        // Opłata transferowa została już pobrana przy podpisaniu umowy (processAiTransferListSignings / processAiInterestedPlayerTargeting)
        // Weryfikacja: czy kupujący ma środki na bonus dla zawodnika przy meldunku
        if (buyerClub.budget < proposedBonus) {
          updatedPlayersMap[sellerClubId] = (updatedPlayersMap[sellerClubId] || []).map(p =>
            p.id === player.id ? { ...p, transferPendingClubId: undefined, transferReportDate: undefined } : p
          );
          continue;
        }

        const contractYears = player.age <= 27 ? 3 : player.age <= 31 ? 2 : 1;
        const newEndDate = new Date(currentDate.getFullYear() + contractYears, 5, 30).toISOString();

        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1;
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
          clubId: buyerClubId,
          fromYear: currentYear,
          fromMonth: currentMonth,
          toYear: null,
          toMonth: null
        });

        const transferredPlayer: Player = {
          ...player,
          clubId: buyerClubId,
          annualSalary: proposedSalary,
          contractEndDate: newEndDate,
          transferPendingClubId: undefined,
          transferReportDate: undefined,
          isOnTransferList: false,
          history: updatedHistory,
          transferLockoutUntil: _buildTransferLockoutUntil(currentDate)
        };

        // Przenieś zawodnika
        updatedPlayersMap[sellerClubId] = (updatedPlayersMap[sellerClubId] || []).filter(p => p.id !== player.id);
        updatedPlayersMap[buyerClubId] = [...(updatedPlayersMap[buyerClubId] || []), transferredPlayer];

        // Tylko bonus dla zawodnika przy meldunku — opłata transferowa zapłacona już przy podpisaniu
        updatedClubs = updatedClubs.map(c => {
          if (c.id === buyerClubId) return { ...c, budget: c.budget - proposedBonus };
          return c;
        });
      }
    }

    return { updatedClubs, updatedPlayers: updatedPlayersMap };
  },

/**
   * Miesięczny przegląd wydajności zawodników AI-klubów.
   * Wywoływany 1. dnia każdego miesiąca.
   *
   * Zawodnik trafia na listę transferową jeśli spełni JEDNO z kryteriów:
   *   A) Wydajnościowe — słabe statystyki sezonowe (min. 6 meczów):
   *      - FWD: goals/gp < 0.08
   *      - MID: (goals+assists)/gp < 0.07
   *      - DEF/GK: średnia ratingHistory (ostatnie 5) < 5.5
   *   B) Brak gry — mniej niż 35% oczekiwanych meczów i nie kontuzjowany
   *
   * Zabezpieczenia (anty-chaos):
   *   - isUntouchable → nigdy nie wystawiony
   *   - Minimalna głębokość składu: GK≥2, DEF≥4, MID≥4, FWD≥2
   *   - Losowość 30–50% per zawodnik per miesiąc (seed deterministyczny)
   *   - Max 2 zawodników wystawionych per klub per miesiąc
   */
  processMonthlyPlayerReview: (
    clubs: Club[],
    playersMap: Record<string, Player[]>,
    currentDate: Date,
    userTeamId: string | null
  ): { updatedPlayers: Record<string, Player[]> } => {
    const updatedPlayersMap = { ...playersMap };

    // Miesiące od startu sezonu (sezon startuje lipiec = miesiąc 6)
    const currentMonth = currentDate.getMonth();
    const monthsIntoSeason = currentMonth >= 6
      ? currentMonth - 6
      : currentMonth + 6; // styczeń–czerwiec = 6–11 miesięcy

    // Za mało danych — nie oceniamy przez pierwsze 2 miesiące sezonu
    if (monthsIntoSeason < 2) return { updatedPlayers: updatedPlayersMap };

    // Oczekiwana liczba meczów ligowych na ten moment sezonu (~2 mecze/miesiąc)
    const expectedMatches = monthsIntoSeason * 2;

    for (const club of clubs) {
      if (club.id === userTeamId) continue;
      const squad = updatedPlayersMap[club.id];
      if (!squad || squad.length === 0) continue;

      // Liczniki głębokości składu (ochrona minimalna)
      const counts = {
        GK:  squad.filter(p => p.position === 'GK').length,
        DEF: squad.filter(p => p.position === 'DEF').length,
        MID: squad.filter(p => p.position === 'MID').length,
        FWD: squad.filter(p => p.position === 'FWD').length,
      };
      const minCounts = { GK: 2, DEF: 4, MID: 4, FWD: 2 };

      let listedThisMonth = 0;
      const updatedSquad = squad.map(player => {
        // Nie listujemy więcej niż 2 w miesiącu
        if (listedThisMonth >= 2) return player;

        // Pomijamy zawodników już na liście lub nietykalnych
        if (player.isOnTransferList || player.isUntouchable) return player;

        // Minimalna głębokość — jeśli wystawienie zejdzie poniżej minimum, pomijamy
        const posKey = player.position as keyof typeof counts;
        if (counts[posKey] <= minCounts[posKey]) return player;

        const gp = player.stats.matchesPlayed;

        // Kryterium B: brak gry (nie licząc kontuzjowanych)
        const playRatio = gp / Math.max(1, expectedMatches);
        const isRarelyPlaying = playRatio < 0.35 && player.health.status !== 'INJURED';

        // Kryterium A: słaba wydajność (min. 6 meczów)
        let isPoorPerformer = false;
        if (gp >= 6) {
          if (player.position === 'FWD') {
            isPoorPerformer = (player.stats.goals / gp) < 0.08;
          } else if (player.position === 'MID') {
            isPoorPerformer = ((player.stats.goals + player.stats.assists) / gp) < 0.07;
          } else {
            // DEF / GK — średnia ratingHistory
            const hist = player.stats.ratingHistory || [];
            if (hist.length >= 5) {
              const avgRating = hist.slice(-5).reduce((s, r) => s + r, 0) / 5;
              isPoorPerformer = avgRating < 5.5;
            }
          }
        }

        if (!isRarelyPlaying && !isPoorPerformer) return player;

        // Losowość 30–50% — nie wszystkie kluby reagują w tym samym miesiącu
        const monthKey = currentDate.getFullYear() * 100 + (currentDate.getMonth() + 1);
        const seed = Math.abs(
          (monthKey * 31337) ^
          player.id.split('').reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0) ^
          club.id.split('').reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0)
        );
        const rand = (Math.sin(seed) * 10000);
        const chance = rand - Math.floor(rand);
        const listingChance = 0.30 + (club.reputation / 100) * 0.20; // 30–50%
        if (chance > listingChance) return player;

        // Wystawiamy na listę transferową
        counts[posKey]--;
        listedThisMonth++;
        return { ...player, isOnTransferList: true };
      });

      updatedPlayersMap[club.id] = updatedSquad;
    }

    return { updatedPlayers: updatedPlayersMap };
  },

performSeasonSquadReview: (
    clubs: Club[],
    playersMap: Record<string, Player[]>,
    currentDate: Date,
    userTeamId: string | null
  ): { updatedClubs: Club[], updatedPlayers: Record<string, Player[]> } => {
    let updatedClubs = [...clubs];
    let updatedPlayersMap = { ...playersMap };

    updatedClubs = updatedClubs.map(club => {
      if (club.id === userTeamId) return club;

      const squad = updatedPlayersMap[club.id] || [];
      if (squad.length === 0) return club;

      const counts = {
        GK: squad.filter(p => p.position === 'GK').length,
        DEF: squad.filter(p => p.position === 'DEF').length,
        MID: squad.filter(p => p.position === 'MID').length,
        FWD: squad.filter(p => p.position === 'FWD').length
      };

      const rankedSquad = [...squad].sort((a, b) => {
        const scoreA = a.overallRating - (a.age - 18) * 1.5;
        const scoreB = b.overallRating - (b.age - 18) * 1.5;
        return scoreA - scoreB;
      });

      const numToRemove = Math.floor(Math.random() * 5);
      let removedCount = 0;
      let finalSquad = [...squad];
      let currentClub = { ...club };

      for (const candidate of rankedSquad) {
        if (removedCount >= numToRemove) break;

        let canRemove = false;
        if (candidate.position === 'GK' && counts.GK > 3) canRemove = true;
        else if (candidate.position === 'DEF' && counts.DEF > 7) canRemove = true;
        else if (candidate.position === 'MID' && counts.MID > 7) canRemove = true;
        else if (candidate.position === 'FWD' && counts.FWD > 4) canRemove = true;

        if (canRemove) {
          const decision = FinanceLogic.evaluateReleaseVsList(candidate);
          
          if (decision === 'RELEASE') {
            const cost = candidate.annualSalary * 0.4;
            if (currentClub.budget >= cost) {
              const updatedHistory = [...(candidate.history || [])];
              const currentYear = currentDate.getFullYear();
              const currentMonth = currentDate.getMonth() + 1;

              if (updatedHistory.length > 0) {
                updatedHistory[updatedHistory.length - 1] = {
                  ...updatedHistory[updatedHistory.length - 1],
                  toYear: currentYear,
                  toMonth: currentMonth
                };
              }

              updatedHistory.push({
                clubName: 'BEZ KLUBU',
                clubId: 'FREE_AGENTS',
                fromYear: currentYear,
                fromMonth: currentMonth,
                toYear: null,
                toMonth: null
              });

              const releasedPlayer: Player = {
                ...candidate,
                clubId: 'FREE_AGENTS',
                annualSalary: 0,
                contractEndDate: '',
                marketValue: 0,
                negotiationStep: 0,
                isNegotiationPermanentBlocked: false,
                isOnTransferList: false,
                interestedClubs: [],
                transferPendingClubId: undefined,
                transferReportDate: undefined,
                history: updatedHistory
              };

              currentClub.budget -= cost;
              finalSquad = finalSquad.filter(p => p.id !== candidate.id);
              updatedPlayersMap['FREE_AGENTS'] = [...(updatedPlayersMap['FREE_AGENTS'] || []), releasedPlayer];
            }
          } else {
            finalSquad = finalSquad.map(p => p.id === candidate.id ? { ...p, isOnTransferList: true } : p);
          }
          
          counts[candidate.position as keyof typeof counts]--;
          removedCount++;
        }
      }

      currentClub.squadNeeds = {
        GK: Math.max(0, 3 - counts.GK),
        DEF: Math.max(0, 7 - counts.DEF),
        MID: Math.max(0, 7 - counts.MID),
        FWD: Math.max(0, 4 - counts.FWD)
      };

      updatedPlayersMap[club.id] = finalSquad;
      return currentClub;
    });

    return { updatedClubs, updatedPlayers: updatedPlayersMap };
  }

};
