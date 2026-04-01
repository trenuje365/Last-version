import { Club, Player, Lineup, HealthStatus, InjurySeverity, PlayerPosition } from '../types';
import { TacticRepository } from '../resources/tactics_db';

/**
 * Raport zwiadowczy AI — co trener AI MYŚLI o drużynie gracza przed meczem.
 * Dokładność zależy od atrybutu `experience` trenera (Option B: progresywny z podłogą).
 *
 * Skala błędów:
 *   exp=99 → 1-5%   | exp=70 → 8-15%
 *   exp=50 → 18-28% | exp=30 → 30-42%
 *   exp=1  → 38-50%
 */
export interface AiScoutReport {
  /** Szacowana siła drużyny gracza (rzeczywista ± błąd%) */
  perceivedPower: number;
  /** Rozpoznana taktyka gracza — może być błędna przy niskim experience */
  perceivedTacticId: string;
  /** Szacowana liczba kontuzjowanych/zawieszonych graczy w kadrze gracza */
  perceivedInjuredCount: number;
  /** Szacowany poziom świeżości fizycznej drużyny gracza */
  perceivedFatigueLevel: 'FRESH' | 'TIRED' | 'EXHAUSTED';
  /** Czy trener AI myśli, że drużyna gracza jest osłabiona (kontuzje/zawieszenia) */
  isPerceivedWeakened: boolean;
  /** Dokładność wywiadu: 0.0 (zupełnie błędny) → 1.0 (perfekcyjny) */
  scoutingAccuracy: number;
  /** Rzeczywisty procent błędu zastosowany do raportu */
  errorMargin: number;
}

export const AiScoutingService = {
  /**
   * Generuje raport zwiadowczy trenera AI na podstawie danych drużyny gracza.
   * Im wyższe `coachExperience`, tym precyzyjniejszy raport.
   */
  generateReport: (
    _playerClub: Club,
    playerPlayers: Player[],
    playerLineup: Lineup,
    coachExperience: number
  ): AiScoutReport => {
    const exp = Math.max(1, Math.min(99, coachExperience));

    // --- BŁĄD SKAUTA (Option B: progresywny z podłogą) ---
    // Segment górny (exp 70-99): małe, precyzyjne błędy
    // Segment dolny (exp 1-70): duże, rosnące błędy
    const minError = exp >= 70
      ? Math.max(1, 1 + (99 - exp) * 0.241)  // 1-8% dla exp 70-99
      : Math.max(1, 8 + (70 - exp) * 0.435); // 8-38% dla exp 1-70

    const range = exp >= 70
      ? 4 + (99 - exp) * 0.10                // zakres 4-7% w górnym segmencie
      : Math.min(12, 7 + (70 - exp) * 0.125); // zakres 7-12% w dolnym segmencie

    const errorMargin = minError + Math.random() * range;
    const scoutingAccuracy = Math.max(0, Math.min(1, 1 - errorMargin / 100));

    // --- DANE REALNE DRUŻYNY GRACZA ---
    const starters = playerLineup.startingXI.filter(Boolean) as string[];
    const starterPlayers = starters
      .map(id => playerPlayers.find(p => p.id === id))
      .filter((p): p is Player => !!p);

    const injuredOrSuspended = playerPlayers.filter(p =>
      p.health.status === HealthStatus.INJURED ||
      p.health.injury?.severity === InjurySeverity.SEVERE ||
      p.suspensionMatches > 0
    );

    const avgCondition = starterPlayers.length > 0
      ? starterPlayers.reduce((sum, p) => sum + p.condition, 0) / starterPlayers.length
      : 80;

    // Siła drużyny: suma (atakowanie + podania + obrona) każdego startującego gracza
    const realPower = starterPlayers.reduce(
      (sum, p) => sum + (p.attributes.attacking + p.attributes.passing + p.attributes.defending), 0
    );

    const realInjuredCount = injuredOrSuspended.length;
    const realWeakened = realInjuredCount >= 3 || starterPlayers.length < 10;

    // --- ZABURZENIE SIŁY (błąd kierunkowy) ---
    const powerErrorDir = Math.random() > 0.5 ? 1 : -1;
    const perceivedPower = Math.max(1, realPower * (1 + powerErrorDir * errorMargin / 100));

    // --- ROZPOZNANIE TAKTYKI ---
    let perceivedTacticId = playerLineup.tacticId;
    if (scoutingAccuracy < 0.75 && Math.random() > scoutingAccuracy) {
      // Trener z niskim exp może błędnie zidentyfikować taktykę rywala
      const allTactics = TacticRepository.getAll();
      const wrongTactics = allTactics.filter(t => t.id !== playerLineup.tacticId);
      if (wrongTactics.length > 0) {
        perceivedTacticId = wrongTactics[Math.floor(Math.random() * wrongTactics.length)].id;
      }
    }

    // --- OCENA ŚWIEŻOŚCI ---
    // Błąd kondycji: ±(errorMargin * 0.5) punktów kondycji
    const conditionError = (Math.random() * 2 - 1) * (errorMargin * 0.5);
    const perceivedCondition = Math.max(50, Math.min(100, avgCondition + conditionError));
    const perceivedFatigueLevel: 'FRESH' | 'TIRED' | 'EXHAUSTED' =
      perceivedCondition >= 82 ? 'FRESH' :
      perceivedCondition >= 67 ? 'TIRED' : 'EXHAUSTED';

    // --- OCENA OSŁABIENIA ---
    let isPerceivedWeakened = realWeakened;
    // Trener z bardzo niską dokładnością może się mylić w obie strony
    if (Math.random() > scoutingAccuracy + 0.30) {
      isPerceivedWeakened = !realWeakened;
    }

    // --- SZACOWANA LICZBA KONTUZJOWANYCH ---
    const injuredCountNoise = Math.round((Math.random() * 2 - 1) * errorMargin * 0.15);
    const perceivedInjuredCount = Math.max(0, realInjuredCount + injuredCountNoise);

    return {
      perceivedPower,
      perceivedTacticId,
      perceivedInjuredCount,
      perceivedFatigueLevel,
      isPerceivedWeakened,
      scoutingAccuracy,
      errorMargin,
    };
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TRANSFER INTEREST SCOUTING — miesięczna aktualizacja zainteresowań klubów AI
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Główna funkcja scoutingu transferowego. Wywoływana raz na miesiąc.
   *
   * Algorytm w skrócie:
   *   1. Wyczyść stare zainteresowania (usuń clubId z interestedClubs każdego gracza)
   *   2. Dla każdego AI-klubu → zdiagnozuj potrzeby kadrowe
   *   3. Z puli wszystkich zawodników w grze → wybierz kandydatów pasujących do potrzeb
   *   4. Oceń kandydatów (OVR, kontrakt, losowość trenera) i wybierz top N
   *   5. Zapisz wynik w polu player.interestedClubs
   *
   * @param clubs        Lista wszystkich klubów w grze
   * @param playersMap   Mapa clubId → Player[] (zawiera też 'FREE_AGENTS')
   * @param currentDate  Aktualna data gry
   * @param userTeamId   ID drużyny gracza (pomijamy przy generowaniu zainteresowań)
   * @param sessionSeed  Ziarno losowości sesji — zapewnia, że każda klubowa "osobowość trenera"
   *                     jest deterministyczna w ramach jednej rozgrywki, ale różna między klubami
   * @returns Zaktualizowana mapa playersMap z wypełnionymi interestedClubs
   */
  updateTransferInterests: (
    clubs: Club[],
    playersMap: Record<string, Player[]>,
    currentDate: Date,
    userTeamId: string | null,
    sessionSeed: number
  ): Record<string, Player[]> => {

    // --- KROK 1: Zbuduj płaską listę wszystkich zawodników w grze ---
    // (kandydaci do obserwacji przez każdy klub)
    const allPlayers: Player[] = Object.values(playersMap).flat();
    if (allPlayers.length === 0) return playersMap;

    // --- KROK 2: Wyczyść poprzednie zainteresowania we wszystkich zawodnikach ---
    // Budujemy nową mapę z pustymi listami zainteresowań,
    // żeby nie kumulować przestarzałych rekordów z poprzedniego miesiąca
    const updatedMap: Record<string, Player[]> = {};
    for (const clubId in playersMap) {
      updatedMap[clubId] = playersMap[clubId].map(p => ({ ...p, interestedClubs: [] }));
    }

    // --- KROK 3: Dla każdego AI-klubu wygeneruj listę obserwowanych zawodników ---
    const tier4ClubIds = new Set(clubs.filter(c => c.leagueId === 'L_PL_4').map(c => c.id));

    for (const club of clubs) {
      // Pomijamy drużynę gracza — gracz sam zarządza swoimi transferami
      if (club.id === userTeamId) continue;

      const squad = updatedMap[club.id] || [];

      // A) Diagnostyka potrzeb kadrowych (zwraca listę pozycji do wzmocnienia z priorytetem)
      const needs = AiScoutingService._diagnoseSquadNeeds(squad, club, currentDate);

      // B) Oblicz limit zainteresowań — bogatszy/silniejszy klub ma więcej "skautów"
      //    Skala: rep 4 → 4 zawodników, rep 10 → 7, rep 20 → 10 (max 10)
      const maxInterests = Math.min(10, Math.max(4, Math.floor(club.reputation * 0.5) + 2));

      // C) "Osobowość" trenera: deterministyczna losowość per klubId + sezon
      //    Każdy trener ma inny "nos do talentów" i inne preferencje
      const coachSeed = sessionSeed + AiScoutingService._hashString(club.id);

      // D) Zbierz kandydatów dla każdej pozycji wymagającej wzmocnienia
      const candidates: { player: Player; score: number }[] = [];

      for (const need of needs) {
        const positionCandidates = AiScoutingService._findCandidatesForPosition(
          need.position,
          need.urgency,
          club,
          allPlayers,
          clubs,
          coachSeed,
          currentDate
        );
        candidates.push(...positionCandidates);
      }

      // E) Jeśli klub nie ma pilnych potrzeb ale ma budżet → "okazjonalne scouting"
      //    Symuluje sytuację gdy skaut natknął się na ciekawego zawodnika przypadkowo
      if (needs.length === 0 && club.budget > 300_000) {
        const opportunistic = AiScoutingService._opportunisticScouting(club, allPlayers, coachSeed);
        candidates.push(...opportunistic);
      }

      // F) Scouting młodych talentów — zawsze aktywny, niezależnie od pilności potrzeb.
      //    Klub może wziąć na oko perspektywicznego gracza z gorszego klubu,
      //    nawet jeśli aktualna kadra jest kompletna.
      const youngTalents = AiScoutingService._youngTalentScouting(club, allPlayers, clubs, coachSeed);
      candidates.push(...youngTalents);

      // G) Scouting gemów z tier 4 — zawodnik zbyt dobry na swoją ligę.
      //    Losowość: nie każdy klub odkryje go w danym miesiącu.
      const tier4Gems = AiScoutingService._tier4GemScouting(club, allPlayers, tier4ClubIds, clubs, coachSeed, currentDate);
      candidates.push(...tier4Gems);

      // H) Sortuj kandydatów po score (malejąco), usuń duplikaty, ogranicz do maxInterests
      const seen = new Set<string>();
      const topCandidates = candidates
        .sort((a, b) => b.score - a.score)
        .filter(c => {
          if (seen.has(c.player.id)) return false;
          seen.add(c.player.id);
          return true;
        })
        .slice(0, maxInterests);

      // G) Zapisz zainteresowanie w polu interestedClubs każdego wybranego zawodnika
      for (const { player } of topCandidates) {
        // Znajdź zawodnika w updatedMap i dodaj club.id do jego listy zainteresowań
        const sourceClubId = player.clubId || 'FREE_AGENTS';
        const list = updatedMap[sourceClubId];
        if (!list) continue;

        const idx = list.findIndex(p => p.id === player.id);
        if (idx === -1) continue;

        // ZABEZPIECZENIE 1: klub nie może figurować jako zainteresowany własnym zawodnikiem
        if (player.clubId === club.id) continue;
        // ZABEZPIECZENIE 2: jeden zawodnik może być obserwowany maksymalnie przez 10 klubów.
        //    Zapobiega sytuacji, że zawodnik ma "całą ligę" na karcie zainteresowanych.
        const existing = list[idx].interestedClubs || [];
        if (existing.length >= 10) continue;
        if (!existing.includes(club.id)) {
          list[idx] = { ...list[idx], interestedClubs: [...existing, club.id] };
        }
      }
    }

    return updatedMap;
  },

  // ─── Prywatne metody pomocnicze ──────────────────────────────────────────────

  /**
   * Diagnozuje słabe punkty składu i zwraca listę potrzeb ze wskazaniem priorytetu.
   *
   * Triggery (kombinacja):
   *   - Zbyt mało zawodników na pozycji (krytyczny niedobór)
   *   - Brak zawodnika z odpowiednim overall na pozycję (jakościowa luka)
   *   - Kluczowy zawodnik długotrminowo kontuzjowany (>21 dni)
   *   - Kontrakt gwiazdy wygasa w ciągu 6 miesięcy (ryzyko utraty)
   *   - Seria przegranych → trener szuka ratunku (forma drużyny)
   */
  _diagnoseSquadNeeds: (
    squad: Player[],
    club: Club,
    currentDate: Date
  ): { position: PlayerPosition; urgency: number }[] => {

    const needs: { position: PlayerPosition; urgency: number }[] = [];
    const positions: PlayerPosition[] = ['GK', 'DEF', 'MID', 'FWD'];

    // Optymalne minimalne liczby zawodników na pozycję
    const minCounts: Record<PlayerPosition, number> = { GK: 2, DEF: 5, MID: 4, FWD: 3 };

    // Idealny OVR dla klubu na podstawie reputacji (ta sama formuła co AiContractService)
    const idealOvr = 30 + club.reputation * 4.5;

    // Forma drużyny: jeśli klub ma ≥3 przegranych z ostatnich 5 meczów → presja na wzmocnienia
    const recentForm = club.stats.form || [];
    const recentLosses = recentForm.slice(-5).filter(r => r === 'P').length;
    const formPressure = recentLosses >= 3 ? 1.3 : 1.0; // mnożnik pilności

    for (const pos of positions) {
      const posSquad = squad.filter(p => p.position === pos);
      const posCount = posSquad.length;

      let urgency = 0;

      // Trigger 1: NIEDOBÓR — za mało zawodników na pozycji
      if (posCount < minCounts[pos]) {
        urgency += 3; // wysoka pilność
      }

      // Trigger 2: JAKOŚCIOWA LUKA — najlepszy zawodnik jest poniżej idealnego OVR
      const bestOvr = posSquad.length > 0 ? Math.max(...posSquad.map(p => p.overallRating)) : 0;
      const ovrGap = idealOvr - bestOvr;
      if (ovrGap > 10) {
        urgency += Math.min(2, ovrGap / 10); // im większa luka, tym wyższa pilność
      }

      // Trigger 3: KONTUZJA KLUCZOWEGO GRACZA — lider pozycji wyłączony na długo
      const keyPlayer = posSquad.sort((a, b) => b.overallRating - a.overallRating)[0];
      if (keyPlayer?.health.status === HealthStatus.INJURED) {
        const daysLeft = keyPlayer.health.injury?.daysRemaining || 0;
        if (daysLeft > 21) {
          urgency += 2; // wyłączony na ponad 3 tygodnie → szukaj zastępstwa
        }
      }

      // Trigger 4: RYZYKO UTRATY — gwiazda ma kończący się kontrakt
      const contractExpiryDays = keyPlayer
        ? Math.floor((new Date(keyPlayer.contractEndDate).getTime() - currentDate.getTime()) / 86_400_000)
        : 999;
      if (contractExpiryDays < 180 && contractExpiryDays > 0) {
        urgency += 1.5; // zawodnik może odejść za 6 miesięcy
      }

      // Zastosuj presję formy
      urgency *= formPressure;

      // Dodaj potrzebę tylko jeśli urgency przekracza próg
      if (urgency > 1.0) {
        needs.push({ position: pos, urgency });
      }
    }

    // Sortuj od najbardziej pilnych
    return needs.sort((a, b) => b.urgency - a.urgency);
  },

  /**
   * Znajduje i ocenia kandydatów pasujących do konkretnej potrzeby pozycyjnej klubu.
   *
   * Scoring kandydata (0–100):
   *   - Dopasowanie OVR do idealnego poziomu klubu          (0–40 pkt)
   *   - Wiek zawodnika (premiujemy potencjał, nie starców)  (0–20 pkt)
   *   - Dostępność (lista transferowa, kończący kontrakt)   (0–20 pkt)
   *   - Losowość "oka trenera" (skauting to nie nauka)      (0–20 pkt)
   */
  _findCandidatesForPosition: (
    position: PlayerPosition,
    urgency: number,
    club: Club,
    allPlayers: Player[],
    allClubs: Club[],
    coachSeed: number,
    currentDate: Date
  ): { player: Player; score: number }[] => {

    const idealOvr = 30 + club.reputation * 4.5;

    // Tolerancja OVR zależy od reputacji: duże kluby szukają dokładnie tego czego chcą,
    // małe są bardziej elastyczne bo mają mniejszy wybór
    const ovrTolerance = club.reputation >= 10 ? 12 : 18;

    const minOvr = idealOvr - ovrTolerance;
    const maxOvr = idealOvr + ovrTolerance;

    // Filtr budżetowy: zawodnik nie może być wart więcej niż 50% budżetu klubu
    const maxAffordableValue = club.budget * 0.5;

    const candidates = allPlayers.filter(p => {
      // Tylko zawodnicy na potrzebnej pozycji
      if (p.position !== position) return false;
      // Nie ze swojej własnej drużyny
      if (p.clubId === club.id) return false;
      // W zasięgu OVR
      if (p.overallRating < minOvr || p.overallRating > maxOvr) return false;
      // W zasięgu finansowym (wartość rynkowa lub wynagrodzenie * 3 jako proxy)
      const estimatedCost = p.marketValue || p.annualSalary * 3;
      const sellerClub = allClubs.find(c => c.id === p.clubId);
      const affordabilityMultiplier = AiScoutingService._getTransferListAffordabilityMultiplier(
        p,
        club,
        sellerClub,
        idealOvr
      );
      if (estimatedCost > maxAffordableValue * affordabilityMultiplier && p.clubId !== 'FREE_AGENTS') return false;
      // Nie kontuzjowany ciężko (klub nie interesuje się kontuzjowanymi na długo)
      if (p.health.status === HealthStatus.INJURED && (p.health.injury?.daysRemaining || 0) > 60) return false;
      return true;
    });

    // Oceń każdego kandydata
    return candidates.map(player => {
      let score = 0;
      const sellerClub = allClubs.find(c => c.id === player.clubId);

      // 1. Dopasowanie OVR (max 40 pkt)
      const ovrDiff = Math.abs(player.overallRating - idealOvr);
      score += Math.max(0, 40 - ovrDiff * 2);

      // 2. Wiek (max 20 pkt) — premiujemy zawodników 19–27 lat (perspektywa i forma szczytowa)
      //    28+ stopniowy spadek, 18– bardzo młody = spory potencjał ale ryzyko
      const age = player.age;
      if (age >= 19 && age <= 27) score += 20;
      else if (age === 18) score += 15;
      else if (age >= 28 && age <= 30) score += 12;
      else if (age >= 31 && age <= 33) score += 6;
      else score += 2;

      // 3. Dostępność (max 20 pkt)
      if (player.isOnTransferList) score += 15; // klub wystawił na sprzedaż
      score += AiScoutingService._getTransferListMarketOpportunityBonus(player, club, sellerClub, idealOvr);
      const daysToExpiry = Math.floor((new Date(player.contractEndDate).getTime() - currentDate.getTime()) / 86_400_000);
      if (daysToExpiry < 180) score += 12; // kontrakt wygasa → łatwiej pozyskać
      else if (daysToExpiry < 365) score += 6;
      if (player.clubId === 'FREE_AGENTS') score += 20; // wolny agent = zero kosztu transferowego

      // 4. Losowość "oka trenera" (max 20 pkt) — deterministyczna per klub + zawodnik
      //    Symuluje: trener może "zakochać się" w graczu którego obserwował na żywo
      const trainerEye = AiScoutingService._seededRandom(coachSeed + AiScoutingService._hashString(player.id)) * 20;
      score += trainerEye;

      // 5. Modyfikator wydajności — scout weryfikuje realne statystyki sezonowe.
      //    Napastnik który nie strzela, pomocnik bez asyst → zainteresowanie spada.
      //    Dobry strzelec / kreatywny pomocnik → zainteresowanie rośnie.
      score *= AiScoutingService._evaluatePlayerPerformance(player);

      // Pilność potrzeby skaluje finalny wynik
      score *= urgency;

      // Modyfikator dla zawodników z LISTY TRANSFEROWEJ powyżej 31 roku życia.
      // Logika: stary zawodnik na liście = niskie zainteresowanie słabszych klubów,
      // CHYBA ŻE jego statystyki pokazują że nadal jest wartościowy.
      if (player.isOnTransferList && player.age > 31) {
        const gp = player.stats.matchesPlayed;
        // Sprawdź czy zawodnik nadal "dowozi" wyniki mimo wieku
        const stillProductive =
          (player.position === 'FWD' && gp >= 5 && player.stats.goals / gp >= 0.25) ||
          (player.position === 'MID' && gp >= 5 && (player.stats.goals + player.stats.assists) / gp >= 0.25) ||
          player.overallRating >= idealOvr + 5; // wysoki OVR ratuje go niezależnie od statystyk

        if (!stillProductive) {
          // Kar za wiek: 32 lat → ×0.70, 33 → ×0.50, 34 → ×0.30, 35+ → ×0.15
          const agePenalty = Math.max(0.15, 1.0 - (player.age - 31) * 0.20);
          score *= agePenalty;
        }
        // Jeśli "still productive" — brak kary (klub jest nadal w cenie mimo wieku)
      }

      return { player, score };
    });
  },

  /**
   * Okazjonalne scouting — klub bez pilnych potrzeb "przypadkowo" odkrywa interesującego zawodnika.
   * Symuluje sytuację gdy skaut jedzie na inny mecz i obserwuje nieoczekiwany talent.
   * Liczba kandydatów: 1–3 (zależnie od reputacji = liczby skautów w klubie).
   */
  _opportunisticScouting: (
    club: Club,
    allPlayers: Player[],
    coachSeed: number
  ): { player: Player; score: number }[] => {

    const idealOvr = 30 + club.reputation * 4.5;
    // Rozszerzona tolerancja — przypadkowe odkrycia mogą być "diamentami w szorstkości"
    const minOvr = idealOvr - 20;
    const maxOvr = idealOvr + 8;

    const pool = allPlayers.filter(p =>
      p.clubId !== club.id &&
      p.overallRating >= minOvr &&
      p.overallRating <= maxOvr &&
      p.health.status !== HealthStatus.INJURED
    );

    if (pool.length === 0) return [];

    // Liczba "przypadkowych odkryć" zależy od reputacji (więcej skautów = więcej szans)
    const discoveryCount = club.reputation >= 10 ? 3 : club.reputation >= 7 ? 2 : 1;

    const results: { player: Player; score: number }[] = [];
    for (let i = 0; i < discoveryCount; i++) {
      // Losowy wybór z puli, deterministyczny per klub per iteracja
      const idx = Math.floor(AiScoutingService._seededRandom(coachSeed + i * 7919) * pool.length);
      const player = pool[idx];
      if (player && !results.some(r => r.player.id === player.id)) {
        // Okazjonalne zainteresowania mają niższy bazowy score
        results.push({ player, score: 20 + AiScoutingService._seededRandom(coachSeed + i) * 15 });
      }
    }
    return results;
  },

  /**
   * Ocenia realną wydajność zawodnika na podstawie statystyk sezonowych.
   * Zwraca mnożnik do score scoutingu:
   *   < 1.0 → zawodnik traci na atrakcyjności (słabe statystyki)
   *   = 1.0 → neutralne (brak danych lub obrońca/bramkarz)
   *   > 1.0 → zawodnik zyskuje na atrakcyjności (świetne statystyki)
   *
   * Stosowany tylko od 8 meczów — mniejsza próbka jest zbyt niestabilna.
   */
  _evaluatePlayerPerformance: (player: Player): number => {
    const gamesPlayed = player.stats.matchesPlayed;

    // Za mało meczów w sezonie → próbka niewystarczająca, nie oceniamy
    if (gamesPlayed < 8) return 1.0;

    const goalsPerGame     = player.stats.goals / gamesPlayed;
    const assistsPerGame   = player.stats.assists / gamesPlayed;
    const contribPerGame   = goalsPerGame + assistsPerGame;

    if (player.position === 'FWD') {
      // Napastnik oceniany GŁÓWNIE po bramkach — to jego podstawowe zadanie
      if (goalsPerGame < 0.08)  return 0.25;  // bardzo słaby strzelec → prawie odpada z radaru
      if (goalsPerGame < 0.18)  return 0.65;  // poniżej oczekiwań
      if (goalsPerGame >= 0.40) return 1.35;  // wybitny strzelec → duże zainteresowanie
      if (goalsPerGame >= 0.28) return 1.15;  // powyżej oczekiwań
      return 1.0;
    }

    if (player.position === 'MID') {
      // Pomocnik oceniany po wkładzie ofensywnym (gole + asysty łącznie)
      if (contribPerGame < 0.08)  return 0.30;  // niekreatywny pomocnik
      if (contribPerGame < 0.18)  return 0.70;
      if (contribPerGame >= 0.35) return 1.25;  // regularnie asystuje/strzela
      if (contribPerGame >= 0.25) return 1.10;
      return 1.0;
    }

    // DEF / GK — brak rzetelnych metryk ofensywnych.
    // Stosujemy kary za kartki jako sygnał problemów z dyscypliną.
    const dangerCards = player.stats.yellowCards + player.stats.redCards * 3;
    const dangerCardsPerGame = dangerCards / gamesPlayed;
    if (dangerCardsPerGame > 0.5) return 0.55; // zbyt często karany → ryzyko transferowe
    if (dangerCardsPerGame > 0.3) return 0.80;
    return 1.0;
  },

  /**
   * Identyfikuje młode talenty (17–21 lat) grające w słabszych klubach niż obserwujący.
   * Symuluje sytuację: skaut leci na mecz 2. ligi i odkrywa 19-latka z OVR jak z Ekstraklasy.
   *
   * Warunki kwalifikacji:
   *   - Wiek 17–21
   *   - OVR ≥ idealOvr obserwującego klubu − 10
   *   - Jego klub ma reputację niższą o ≥2 od obserwującego
   *   - Nie pochodzi z obserwującego klubu
   */
  _youngTalentScouting: (
    club: Club,
    allPlayers: Player[],
    allClubs: Club[],
    coachSeed: number
  ): { player: Player; score: number }[] => {
    const idealOvr = 30 + club.reputation * 4.5;

    const talents = allPlayers.filter(p => {
      // Wyklucz własnych zawodników
      if (p.clubId === club.id) return false;
      // Tylko wąskie okno wiekowe "talent discovery"
      if (p.age < 17 || p.age > 21) return false;
      // OVR musi być sensowny dla obserwującego klubu (nie poniżej progu)
      if (p.overallRating < idealOvr - 10) return false;
      // Kluczowy warunek: gracz jest "za dobry" jak na swój klub
      const playerClub = allClubs.find(c => c.id === p.clubId);
      // Wolny agent kwalifikuje się zawsze (nie ma klubu)
      if (!playerClub) return true;
      // Obserwujący musi być wyraźnie silniejszy (min. 2 pkt reputacji wyżej)
      if (playerClub.reputation > club.reputation - 2) return false;
      return true;
    });

    return talents.map(player => {
      // Score bazowy talent discovery — niższy niż pilna potrzeba pozycyjna,
      // ale wystarczający by znaleźć się na liście obserwowanych
      let score = 30;

      // Bonus za wiek — im młodszy, tym większy potencjał wzrostu
      if      (player.age <= 18) score += 20;
      else if (player.age <= 19) score += 15;
      else if (player.age <= 20) score += 10;
      else                        score += 5;

      // Bonus za OVR powyżej progu — zawodnik "za dobry" na swoją ligę
      const ovrBonus = Math.max(0, player.overallRating - (idealOvr - 10));
      score += Math.min(15, ovrBonus * 1.5);

      // Nie każdy trener zwraca uwagę na tych samych talentów — losowość per scenariusz
      score += AiScoutingService._seededRandom(
        coachSeed + AiScoutingService._hashString(player.id) + 1337
      ) * 10;

      // Modyfikator wydajności działa też dla talentów
      score *= AiScoutingService._evaluatePlayerPerformance(player);

      return { player, score };
    });
  },

  /**
   * Scouting gemów tier 4 — wykrywa zawodników zbyt dobrych na swoją ligę.
   * Wywoływany miesięcznie dla każdego AI-klubu wyższego niż tier 4.
   *
   * Kwalifikacja gema:
   *   - Gra w klubie leagueId='L_PL_4'
   *   - OVR ≥ clubIdealOvr + 12 (zdecydowanie powyżej normy swojego klubu)
   *   - OVR ≥ observingIdealOvr − 25 (nie za słaby dla obserwującego klubu)
   *
   * Scoring (0–70 + mnożnik wydajności):
   *   - Baza: 30 pkt
   *   - OVR gap bonus: min(20, gap × 1.2)
   *   - ratingHistory avg (ostatnie 5): ≥8.0→+20, ≥7.0→+12, ≥6.0→+5, <5.0→−10
   *   - Mnożnik: _evaluatePlayerPerformance
   *
   * Losowość: 12–30% szansy odkrycia per gem per klub per miesiąc.
   * Limit: max 2 gemy per klub per miesiąc z tego kanału.
   */
  _tier4GemScouting: (
    observingClub: Club,
    allPlayers: Player[],
    tier4ClubIds: Set<string>,
    allClubs: Club[],
    coachSeed: number,
    currentDate: Date
  ): { player: Player; score: number }[] => {
    if (observingClub.reputation <= 3) return [];

    const observingIdealOvr = 30 + observingClub.reputation * 4.5;

    const gems = allPlayers.filter(p => {
      if (!tier4ClubIds.has(p.clubId || '')) return false;
      const playerClub = allClubs.find(c => c.id === p.clubId);
      if (!playerClub) return false;
      const clubIdealOvr = 30 + playerClub.reputation * 4.5;
      if (p.overallRating < clubIdealOvr + 12) return false;
      if (p.overallRating < observingIdealOvr - 25) return false;
      if (p.health.status === HealthStatus.INJURED && (p.health.injury?.daysRemaining || 0) > 60) return false;
      return true;
    });

    if (gems.length === 0) return [];

    const monthKey = currentDate.getFullYear() * 100 + (currentDate.getMonth() + 1);
    const discoveryChance = Math.min(0.30, 0.12 + observingClub.reputation * 0.012);

    const discovered: { player: Player; score: number }[] = [];

    for (const player of gems) {
      const discoverySeed = coachSeed + AiScoutingService._hashString(player.id) + monthKey;
      if (AiScoutingService._seededRandom(discoverySeed) > discoveryChance) continue;

      const playerClub = allClubs.find(c => c.id === player.clubId)!;
      const clubIdealOvr = 30 + playerClub.reputation * 4.5;

      let score = 30;

      const ovrGap = player.overallRating - clubIdealOvr;
      score += Math.min(20, ovrGap * 1.2);

      const ratings = player.stats.ratingHistory;
      if (ratings && ratings.length >= 5) {
        const avgRating = ratings.slice(-5).reduce((s, r) => s + r, 0) / 5;
        if      (avgRating >= 8.0) score += 20;
        else if (avgRating >= 7.0) score += 12;
        else if (avgRating >= 6.0) score += 5;
        else if (avgRating < 5.0)  score -= 10;
      }

      score *= AiScoutingService._evaluatePlayerPerformance(player);

      discovered.push({ player, score });
    }

    return discovered
      .sort((a, b) => b.score - a.score)
      .slice(0, 2);
  },

  _getTransferListMarketOpportunityBonus: (
    player: Player,
    buyingClub: Club,
    sellerClub: Club | undefined,
    buyerIdealOvr: number
  ): number => {
    if (!player.isOnTransferList || !sellerClub) return 0;

    const repDelta = sellerClub.reputation - buyingClub.reputation;
    const sellerIdealOvr = 30 + sellerClub.reputation * 4.5;
    const qualityVsSeller = player.overallRating - sellerIdealOvr;

    let bonus = 0;

    if (repDelta >= -1 && repDelta <= 2) bonus += 10;
    else if (repDelta <= 5 && player.overallRating >= buyerIdealOvr - 2) bonus += 5;

    if (sellerClub.reputation >= buyingClub.reputation) bonus += 4;

    if (qualityVsSeller >= 4) bonus += 12;
    else if (qualityVsSeller >= 1) bonus += 8;
    else if (player.overallRating >= buyerIdealOvr + 2) bonus += 4;

    if (player.age <= 29) bonus += 3;
    if (player.age >= 33) bonus -= 2;

    return Math.max(0, bonus);
  },

  _getTransferListAffordabilityMultiplier: (
    player: Player,
    buyingClub: Club,
    sellerClub: Club | undefined,
    buyerIdealOvr: number
  ): number => {
    if (!player.isOnTransferList || !sellerClub) return 1;

    const repDelta = sellerClub.reputation - buyingClub.reputation;
    const sellerIdealOvr = 30 + sellerClub.reputation * 4.5;
    const qualityVsSeller = player.overallRating - sellerIdealOvr;

    let multiplier = 1;

    if (repDelta >= -1 && repDelta <= 2) multiplier += 0.20;
    else if (repDelta <= 5 && player.overallRating >= buyerIdealOvr - 2) multiplier += 0.10;

    if (qualityVsSeller >= 4) multiplier += 0.20;
    else if (qualityVsSeller >= 1) multiplier += 0.10;

    if (player.age <= 28) multiplier += 0.05;

    return Math.min(1.45, multiplier);
  },

  /**
   * Prosty deterministyczny generator pseudolosowy (LCG).
   * Zwraca wartość 0.0–1.0.
   * Gwarantuje że ten sam club + player zawsze daje ten sam wynik w tej samej sesji.
   */
  _seededRandom: (seed: number): number => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  },

  /**
   * Prosty hash stringa → liczba całkowita.
   * Używany do tworzenia unikalnego ziarna per clubId/playerId.
   */
  _hashString: (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0; // konwersja do int32
    }
    return Math.abs(hash);
  },
};
