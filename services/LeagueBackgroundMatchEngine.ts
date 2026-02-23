import { Fixture, Club, Player, PlayerPosition, Lineup, MatchStatus, CompetitionType, MatchEventType, InjurySeverity } from '../types';
import { TacticRepository } from '../resources/tactics_db';
import { GoalAttributionService } from './GoalAttributionService';

export interface BackgroundMatchResult {
  homeScore: number;
  awayScore: number;
  scorers: { playerId: string; assistId?: string; minute: number; isPenalty: boolean }[];
  cards: { playerId: string; type: MatchEventType; minute: number }[];
  injuries: { playerId: string; severity: InjurySeverity; days: number; type: string }[];
  fatigue: Record<string, number>; 
  playedPlayerIds: string[];
  fatigueDebtMap: Record<string, number>;
}

export const LeagueBackgroundMatchEngine = {
  simulate: (
    fixture: Fixture, 
    homeClub: Club, 
    awayClub: Club, 
    homePlayers: Player[], 
    awayPlayers: Player[],
    homeLineup: Lineup,
    awayLineup: Lineup,
    seed: number
  ): BackgroundMatchResult => {
    
    const seededRng = (offset: number) => {
      const x = Math.sin(seed + offset) * 10000;
      return x - Math.floor(x);
    };

    // 1. DYNAMICZNA ZMIENNOŚĆ (MATCH VOLATILITY)
    const chaosRoll = seededRng(7);
    const isChaosMatch = chaosRoll < 0.035; 
    const isStaleMatch = chaosRoll > 0.94;  
    
    const volatilityMult = isChaosMatch ? 1.7 : (isStaleMatch ? 0.5 : 1.0);
    
    const homeDailyForm = (seededRng(11) - 0.5);
    const awayDailyForm = (seededRng(12) - 0.5);

    const getLineStrength = (players: Player[], lineupIds: string[]) => {
      const active = players.filter(p => lineupIds.includes(p.id));
      if (active.length === 0) return { att: 40, def: 40, gk: 40 };

      const att = active.reduce((acc, p) => acc + (p.attributes.attacking + p.attributes.finishing + p.attributes.passing) / 3, 0) / active.length;
      const def = active.reduce((acc, p) => acc + (p.attributes.defending + p.attributes.stamina) / 2, 0) / active.length;
      const gk = players.find(p => p.id === lineupIds[0])?.attributes.goalkeeping || 40;

      return { att, def, gk };
    };

    const hStr = getLineStrength(homePlayers, homeLineup.startingXI as string[]);
    const aStr = getLineStrength(awayPlayers, awayLineup.startingXI as string[]);

    const hTactic = TacticRepository.getById(homeLineup.tacticId);
    const aTactic = TacticRepository.getById(awayLineup.tacticId);

// Faza 1: Wstępne losowanie czerwonych kartek dla potrzeb skorygowania siły zespołu
    let homeRedCards = 0;
    let awayRedCards = 0;

    const preRollCards = (lineupIds: (string | null)[], offset: number) => {
      let reds = 0;
      lineupIds.forEach((pId, idx) => {
        if (!pId) return;
        if (seededRng(offset + idx + 1500) < 0.0033) reds++; // Bezpośrednia czerwona
        else if (seededRng(offset + idx + 1000) < 0.087 && seededRng(offset + idx + 1200) < 0.05) reds++; // Druga żółta
      });
      return reds;
    };

    homeRedCards = preRollCards(homeLineup.startingXI, 10000);
    awayRedCards = preRollCards(awayLineup.startingXI, 20000);

    let xgHome = 1.15 + 0.15 + (homeClub.reputation - awayClub.reputation) * 0.04 + (hTactic.attackBias - 50) / 180 + ((hStr.att - aStr.def) * 0.04) + homeDailyForm;
    let xgAway = 0.95 - 0.15 - (homeClub.reputation - awayClub.reputation) * 0.04 + (aTactic.attackBias - 50) / 180 + ((aStr.att - hStr.def) * 0.04) + awayDailyForm;

    if (xgHome > xgAway + 1.2) xgHome += 0.5; 
    if (xgAway > xgHome + 1.2) xgAway += 0.5;

   // Faza 2: Korekta XG na podstawie czerwonych kartek
    // Każda czerwona kartka to ok. 25% spadku siły ataku i 20% wzrostu szansy na stratę bramki
    const homePenalty = 1 - (homeRedCards * 0.25);
    const awayPenalty = 1 - (awayRedCards * 0.25);
    const homeDefenseWeakness = 1 + (homeRedCards * 0.20);
    const awayDefenseWeakness = 1 + (awayRedCards * 0.20);

    xgHome = xgHome * volatilityMult * homePenalty * awayDefenseWeakness;
    xgAway = xgAway * volatilityMult * awayPenalty * homeDefenseWeakness;

    const getGoals = (xg: number, offset: number) => {
      let g = 0; 
      let cur = Math.max(0.05, Math.min(isChaosMatch ? 5.5 : 3.8, xg + (seededRng(offset) - 0.5) * 0.4));
      for (let i = 0; i < 8; i++) { 
        const prob = cur / (i + 1.15); 
        if (seededRng(offset + 100 + i) < prob) { 
          g++; 
          cur *= (isChaosMatch ? 0.85 : 0.68); 
        } 
      } 
      return g;
    };


const homeScore = getGoals(xgHome, 200);
    const awayScore = getGoals(xgAway, 300);

    // Added isPenalty property to scorers array definition
    const scorers: { playerId: string; assistId?: string; minute: number; isPenalty: boolean }[] = [];
// TUTAJ WSTAW TEN KOD
    const usedGoalMinutes = new Set<number>();
    const usedCardMinutes = new Map<number, number>(); // minuta -> ilość kartek

    const getSafeMinute = (baseMin: number, type: 'GOAL' | 'CARD') => {
      let m = baseMin;
      if (type === 'GOAL') {
        while (usedGoalMinutes.has(m)) {
          m++;
          if (m > 96) m = 1; 
        }
        usedGoalMinutes.add(m);
      } else {
        // Kartki: jeśli minuta zajęta, 1% szansy na kolizję, inaczej przesuń
        const currentCount = usedCardMinutes.get(m) || 0;
        if (currentCount > 0) {
           const allowCollision = seededRng(m + 999) < 0.01;
           if (!allowCollision) {
              while ((usedCardMinutes.get(m) || 0) > 0) {
                m++;
                if (m > 96) m = 1;
              }
           }
        }
        usedCardMinutes.set(m, (usedCardMinutes.get(m) || 0) + 1);
      }
      return m;
    };

  // NOWA LOGIKA: SYMULACJA ZMIAN AI
    const simulateSubs = (lineup: Lineup, teamPlayers: Player[], sideOffset: number) => {
      const subCount = Math.floor(3 + seededRng(sideOffset + 50) * 3); // Losowo 3-5 zmian
      const matchSubs: { min: number; outId: string; inId: string }[] = [];
      const currentXI = [...lineup.startingXI];
      const currentBench = [...lineup.bench];
      const participants = new Set(currentXI.filter(id => id !== null) as string[]);

      for (let i = 0; i < subCount; i++) {
        const subMin = Math.floor(46 + seededRng(sideOffset + i + 100) * 42); // 46-88 min
        const outIdx = Math.floor(1 + seededRng(sideOffset + i + 200) * 10); // Unikamy GK (index 0)
        const playerOutId = currentXI[outIdx];
        if (!playerOutId) continue;

        const tacticSlots = TacticRepository.getById(lineup.tacticId).slots;
        const roleNeeded = tacticSlots[outIdx].role;

        // Szukaj na ławce: 1. Ta sama pozycja, 2. Ktokolwiek z pola
        const subInId = currentBench.find(id => teamPlayers.find(p => p.id === id)?.position === roleNeeded) ||
                        currentBench.find(id => teamPlayers.find(p => p.id === id)?.position !== PlayerPosition.GK);

        if (subInId) {
          matchSubs.push({ min: subMin, outId: playerOutId, inId: subInId });
          currentXI[outIdx] = subInId;
          currentBench.splice(currentBench.indexOf(subInId), 1);
          participants.add(subInId);
        }
      }
      return { matchSubs, allPlayed: Array.from(participants) };
    };

    const homeSubData = simulateSubs(homeLineup, homePlayers, 5000);
    const awaySubData = simulateSubs(awayLineup, awayPlayers, 6000);

    const getActiveLineupAt = (min: number, originalXI: (string|null)[], subs: {min: number, outId: string, inId: string}[]) => {
      const current = [...originalXI];
      subs.filter(s => s.min <= min).forEach(s => {
        const idx = current.indexOf(s.outId);
        if (idx !== -1) current[idx] = s.inId;
      });
      return current.filter(id => id !== null) as string[];
    };

    const attributeGoals = (count: number, teamPlayers: Player[], lineup: Lineup, isHome: boolean, subs: any[]) => {
      for (let i = 0; i < count; i++) {
        const rawMin = Math.floor(1 + seededRng(400 + i + (isHome ? 0 : 500)) * 94);
        const safeMin = getSafeMinute(rawMin, 'GOAL');
        const activeXI = getActiveLineupAt(safeMin, lineup.startingXI, subs);
        
        const scorer = GoalAttributionService.pickScorer(teamPlayers, activeXI, false, () => seededRng(500 + i + (isHome ? 0 : 50)));
        const assistant = GoalAttributionService.pickAssistant(teamPlayers, activeXI, scorer.id, false, () => seededRng(600 + i + (isHome ? 0 : 50)));
        const isPenalty = seededRng(700 + i + (isHome ? 0 : 100)) < 0.02; 
        scorers.push({ playerId: scorer.id, assistId: assistant?.id, minute: safeMin, isPenalty });
      }
    };

    attributeGoals(homeScore, homePlayers, homeLineup, true, homeSubData.matchSubs);
    attributeGoals(awayScore, awayPlayers, awayLineup, false, awaySubData.matchSubs);

    const cards: { playerId: string; type: MatchEventType; minute: number }[] = [];
    const injuries: { playerId: string; severity: InjurySeverity; days: number; type: string }[] = [];
    const fatigue: Record<string, number> = {};
const fatigueDebtMap: Record<string, number> = {};
    const simulateDetails = (lineupIds: (string | null)[], players: Player[], offset: number) => {
      lineupIds.forEach((pId, idx) => {
        if (!pId) return;
        const p = players.find(x => x.id === pId); if (!p) return;
        
        // --- ZŁAGODZONY DRENAŻ KONDYCJI (v2.0) ---
        // Poprzednio: 8.5 + RNG + stamEff(pow 1.5 * 15) + 5.0 (Suma ok. 18-24%)
        // Teraz: 5.0.0 + RNG + stamEff(pow 1.2 * 10) + 2.0 (Suma ok. 11-16%)
        const stamina = p.attributes.stamina || 50;
       const stamEff = Math.pow((100 - stamina) / 100, 1.2) * 10;
         let drain = 2.5 + seededRng(offset + idx) * 1.5 + (stamEff * 0.5) + 1.5;
        
        // --- GK FATIGUE MITIGATION (STAGE 1 PRO) ---
        if (p.position === PlayerPosition.GK) {
           drain *= 0.15; // Bramkarze męczą się o 85% wolniej w meczach w tle
        }
        fatigue[pId] = drain;
           const staminaAttr = p.attributes.stamina || 50;
        const matchDebt = 5 + ((100 - staminaAttr) * 0.15);
        // Mapujemy dług do wyniku symulacji
      fatigueDebtMap[pId] = matchDebt;
        // Faza 3: Synchronizacja wykluczenia z Fazą 1 (używamy identycznego offsetu +1500)
        const isDirectRed = seededRng(offset + idx + 1500) < 0.0033;
        const yellowRoll = seededRng(offset + idx + 1000);
        const isSecondYellow = yellowRoll < 0.0104 && seededRng(offset + idx + 1200) < 0.05;
        const isNormalYellow = yellowRoll < 0.0104 && !isSecondYellow;

        if (isDirectRed) {
       // Używamy offsetu, aby minuta była unikalna dla strony (Home/Away) i meczu
          const m = getSafeMinute(Math.floor(10 + seededRng(offset + idx + 550) * 85), 'CARD');
          cards.push({ playerId: pId, type: MatchEventType.RED_CARD, minute: m });
        } 
        else if (isSecondYellow) {
          const m1 = getSafeMinute(Math.floor(5 + seededRng(offset + idx + 660) * 40), 'CARD');
          const m2 = getSafeMinute(Math.floor(m1 + 10 + seededRng(offset + idx + 770) * 40), 'CARD');
          cards.push({ playerId: pId, type: MatchEventType.YELLOW_CARD, minute: m1 });
          cards.push({ playerId: pId, type: MatchEventType.YELLOW_CARD, minute: m2 });
        } 
        else if (isNormalYellow) {
          const m = getSafeMinute(Math.floor(5 + seededRng(offset + idx + 880) * 90), 'CARD');
          cards.push({ playerId: pId, type: MatchEventType.YELLOW_CARD, minute: m });
        }


        if (seededRng(offset + idx + 2000) < 0.0064) {
           const isSev = seededRng(idx + 3000) < 0.15;
           injuries.push({ playerId: pId, severity: isSev ? InjurySeverity.SEVERE : InjurySeverity.LIGHT, days: isSev ? (14 + Math.floor(seededRng(idx) * 30)) : (2 + Math.floor(seededRng(idx) * 6)), type: isSev ? "Poważny uraz więzadeł" : "Stłuczenie mięśnia" });
        }
      });
    };
    simulateDetails(homeLineup.startingXI, homePlayers, 10000);
    simulateDetails(awayLineup.startingXI, awayPlayers, 20000);

const allPlayedIds = [...homeSubData.allPlayed, ...awaySubData.allPlayed];
    
    return { 
      homeScore, 
      awayScore, 
      scorers, 
      cards, 
      injuries, 
      fatigue, 
      fatigueDebtMap,
      playedPlayerIds: allPlayedIds // Przekazujemy listę do procesora
    };
  }
};