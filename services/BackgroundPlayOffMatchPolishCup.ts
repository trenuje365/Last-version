import { Club, Coach, HealthStatus, InjurySeverity, Lineup, MatchEventType, Player, PlayerPosition, PromotionPlayoffSingleMatchResult, Referee } from '../types';
import { PolandWeatherService } from './PolandWeatherService';
import { AiMatchPreparationService } from './AiMatchPreparationService';
import { GoalAttributionService } from './GoalAttributionService';
import { TacticRepository } from '../resources/tactics_db';
import { RefereeService } from './RefereeService';
import { LineupService } from './LineupService';

interface PlayoffEngineResult {
  homeScore: number;
  awayScore: number;
  penaltyHome?: number;
  penaltyAway?: number;
  endedAfterExtraTime: boolean;
}

// ============================================================
//  KOPIA SILNIKA PUCHAROWEGO — dostosowana do pojedynczego meczu playoff
//  Zamiast przetwarzać fixtures i statystyki sezonowe, zwraca tylko wynik meczu KO.
// ============================================================

const simulatePlayoffMatchEngine = (
  home: Club,
  away: Club,
  hPlayers: Player[],
  aPlayers: Player[],
  hLineup: Lineup,
  aLineup: Lineup,
  seed: number,
  weatherEqualizer: number,
  isNeutralVenue: boolean
): PlayoffEngineResult => {

  // ── SEEDED RNG ─────────────────────────────────────────────
  let rngState = ((seed ^ 0xdeadbeef) >>> 0) || 1;
  const rng = () => {
    rngState = (rngState * 1664525 + 1013904223) & 0xffffffff;
    return (rngState >>> 0) / 0xffffffff;
  };

  // Sekcja sędziego — ważność jak dla meczu pucharowego o awans
  const referee: Referee = RefereeService.assignReferee(`${home.id}_${away.id}_${seed}`, 3);

  // Sekcja aktywnych składów — mutowalne przez czerwone kartki
  let homeXI: (string | null)[] = [...hLineup.startingXI];
  let awayXI: (string | null)[] = [...aLineup.startingXI];

  // Sekcja liczników meczu
  let homeRedCount = 0;
  let awayRedCount = 0;
  let homeGoals = 0;
  let awayGoals = 0;

  // Sekcja pomocniczych struktur do wewnętrznej symulacji
  const usedGoalMinutes = new Set<number>();
  const cards: { playerId: string; type: MatchEventType; minute: number }[] = [];
  const injuries: { playerId: string; severity: InjurySeverity; days: number; type: string }[] = [];

  // Sekcja siły drużyn na bazie zawodników z wyjściowego składu
  const getTeamStrength = (players: Player[], xi: (string | null)[]) => {
    const active = players.filter(p => xi.includes(p.id));
    if (active.length === 0) return { att: 40, def: 40, gk: 40, overall: 40 };
    const att = active.reduce((s, p) => s + (p.attributes.attacking + p.attributes.finishing + p.attributes.passing) / 3, 0) / active.length;
    const def = active.reduce((s, p) => s + (p.attributes.defending + p.attributes.stamina) / 2, 0) / active.length;
    const gkPlayer = players.find(p => p.id === xi[0]);
    const gk = gkPlayer?.attributes.goalkeeping || 40;
    const overall = (att + def + gk) / 3;
    return { att, def, gk, overall };
  };

  // Sekcja reputacji, taktyki i premii za własne boisko
  const hTactic = TacticRepository.getById(hLineup.tacticId);
  const aTactic = TacticRepository.getById(aLineup.tacticId);
  const homeAdvantageBonus = isNeutralVenue ? 0 : 0.0022;
  const homeDailyForm = (rng() - 0.5) * 0.3;
  const awayDailyForm = (rng() - 0.5) * 0.3;

  // Sekcja czerwonych kartek — wpływ na generowanie XG
  const redCardMultiplier = (redCount: number): number => {
    if (redCount === 0) return 1.0;
    if (redCount === 1) return 0.72;
    if (redCount === 2) return 0.45;
    return 0.25;
  };

  // Sekcja wpływu doświadczenia sędziego na chaos meczu
  const experienceFactor = 1 + (50 - (referee.experience || 50)) / 100;

  // Sekcja XG na minutę — skopiowana i dopasowana z silnika pucharowego
  const computeMinuteXG = () => {
    const hStr = getTeamStrength(hPlayers, homeXI);
    const aStr = getTeamStrength(aPlayers, awayXI);
    const baseXG = 0.014;
    const ATTR_FLOOR = 20;

    const homeAttEff = Math.max(ATTR_FLOOR, hStr.att) / Math.max(ATTR_FLOOR, aStr.def);
    const awayAttEff = Math.max(ATTR_FLOOR, aStr.att) / Math.max(ATTR_FLOOR, hStr.def);
    const avgAttEff = (homeAttEff + awayAttEff) / 2;

    const homeStrMult = Math.pow((homeAttEff / avgAttEff), 1.5);
    const awayStrMult = Math.pow((awayAttEff / avgAttEff), 1.5);

    const REP_FLOOR = 1;
    const repRatio = Math.pow(
      Math.max(REP_FLOOR, home.reputation) / Math.max(REP_FLOOR, away.reputation),
      0.3
    );

    const homeTacticBonus = (hTactic.attackBias - 50) / 5000;
    const awayTacticBonus = (aTactic.attackBias - 50) / 5000;

    const homeXGBase = baseXG * homeStrMult * repRatio
      + homeTacticBonus + homeAdvantageBonus + homeDailyForm * 0.002;
    const awayXGBase = baseXG * awayStrMult / repRatio
      + awayTacticBonus + awayDailyForm * 0.002;

    const homeXGAfterRed = homeXGBase * redCardMultiplier(homeRedCount) * (1 + awayRedCount * 0.18);
    const awayXGAfterRed = awayXGBase * redCardMultiplier(awayRedCount) * (1 + homeRedCount * 0.195);

    const homeXGWeather = homeXGAfterRed * weatherEqualizer;
    const awayXGWeather = awayXGAfterRed * weatherEqualizer;

    return {
      home: Math.max(0.003, homeXGWeather),
      away: Math.max(0.003, awayXGWeather)
    };
  };

  // Sekcja chaosu — im bardziej wyrównane drużyny, tym większa losowość
  const getChaosChance = () => {
    const hStr = getTeamStrength(hPlayers, homeXI);
    const aStr = getTeamStrength(aPlayers, awayXI);
    const strengthDiff = Math.abs(hStr.overall - aStr.overall);
    const DIFF_MAX = 25;
    const equalness = Math.max(0, 1 - strengthDiff / DIFF_MAX);
    const minChaos = 0.02 + equalness * 0.08;
    const maxChaos = 0.10 + equalness * 0.10;
    return (minChaos + rng() * (maxChaos - minChaos)) * experienceFactor;
  };

  // Sekcja nasycenia wyniku — ogranicza skrajne overy
  const getSaturationFactor = () => {
    const totalGoals = homeGoals + awayGoals;
    if (totalGoals <= 3) return 1.0;
    if (totalGoals === 4) return 0.60;
    if (totalGoals === 5) return 0.40;
    if (totalGoals === 6) return 0.28;
    if (totalGoals === 7) return 0.18;
    return 0.10;
  };

  // Sekcja losowania strzelca — zachowana dla charakteru oryginalnego silnika
  const pickScorer = (players: Player[], xi: (string | null)[]) => {
    const activeIds = xi.filter(id => id !== null) as string[];
    return GoalAttributionService.pickScorer(players, activeIds, false, rng);
  };

  const pickAssistant = (players: Player[], xi: (string | null)[], scorerId: string) => {
    const activeIds = xi.filter(id => id !== null) as string[];
    return GoalAttributionService.pickAssistant(players, activeIds, scorerId, false, rng);
  };

  // Sekcja kartek — wewnętrznie wpływa na przebieg meczu
  const maybeGiveCard = (minute: number) => {
    const strictnessFactor = 1 + (referee.strictness - 50) / 100;
    const decisionFactor = 1 + (referee.consistency - 50) / 200;
    const yellowChance = 0.008 * strictnessFactor * decisionFactor;
    const redDirectChance = 0.001 * strictnessFactor * decisionFactor;

    for (const [side, xi] of [
      ['HOME', homeXI],
      ['AWAY', awayXI]
    ] as ['HOME' | 'AWAY', (string | null)[]][]) {
      const activeIds = xi.filter(id => id !== null) as string[];
      if (activeIds.length === 0) continue;

      if (rng() < redDirectChance) {
        const victimId = activeIds[Math.floor(rng() * activeIds.length)];
        cards.push({ playerId: victimId, type: MatchEventType.RED_CARD, minute });

        if (side === 'HOME') {
          homeXI = homeXI.map(id => id === victimId ? null : id);
          homeRedCount++;
        } else {
          awayXI = awayXI.map(id => id === victimId ? null : id);
          awayRedCount++;
        }
      } else if (rng() < yellowChance) {
        const victimId = activeIds[Math.floor(rng() * activeIds.length)];
        const existingYellows = cards.filter(c => c.playerId === victimId && c.type === MatchEventType.YELLOW_CARD).length;

        cards.push({ playerId: victimId, type: MatchEventType.YELLOW_CARD, minute });

        if (existingYellows >= 1) {
          cards.push({ playerId: victimId, type: MatchEventType.RED_CARD, minute });
          if (side === 'HOME') {
            homeXI = homeXI.map(id => id === victimId ? null : id);
            homeRedCount++;
          } else {
            awayXI = awayXI.map(id => id === victimId ? null : id);
            awayRedCount++;
          }
        }
      }
    }
  };

  // Sekcja kontuzji — wpływa tylko na sam przebieg symulacji, bez zmian stanu gry
  const maybeGiveInjury = (minute: number) => {
    const injuryChance = 0.003 * experienceFactor;
    const sides: [Player[], (string | null)[]][] = [
      [hPlayers, homeXI],
      [aPlayers, awayXI]
    ];

    for (const [players, xi] of sides) {
      if (rng() < injuryChance) {
        const activeIds = xi.filter(id => id !== null) as string[];
        if (activeIds.length === 0) continue;
        const healthyIds = activeIds.filter(id => !injuries.find(inj => inj.playerId === id));
        if (healthyIds.length === 0) continue;

        const victimId = healthyIds[Math.floor(rng() * healthyIds.length)];
        const isSevere = rng() < 0.15;
        injuries.push({
          playerId: victimId,
          severity: isSevere ? InjurySeverity.SEVERE : InjurySeverity.LIGHT,
          days: isSevere ? (14 + Math.floor(rng() * 30)) : (2 + Math.floor(rng() * 6)),
          type: isSevere ? 'Poważny uraz więzadeł' : 'Stłuczenie mięśnia'
        });
      }
    }
  };

  // Sekcja symulacji minutowej — 90 minut lub dogrywka
  const simulateMinutes = (fromMinute: number, toMinute: number, minuteScale: number) => {
    for (let minute = fromMinute; minute <= toMinute; minute++) {
      maybeGiveCard(minute);
      maybeGiveInjury(minute);

      const xg = computeMinuteXG();
      const chaos = getChaosChance();
      const saturation = getSaturationFactor();

      const homeChance = xg.home * saturation * minuteScale * (1 + (rng() < chaos ? rng() * 0.1 : 0));
      if (rng() < homeChance) {
        let goalMin = minute;
        while (usedGoalMinutes.has(goalMin) && goalMin <= toMinute + 5) goalMin++;
        usedGoalMinutes.add(goalMin);
        const scorer = pickScorer(hPlayers, homeXI);
        if (scorer) pickAssistant(hPlayers, homeXI, scorer.id);
        homeGoals++;
      }

      const awayChance = xg.away * saturation * minuteScale * (1 + (rng() < chaos ? rng() * 0.1 : 0));
      if (rng() < awayChance) {
        let goalMin = minute;
        while (usedGoalMinutes.has(goalMin) && goalMin <= toMinute + 5) goalMin++;
        usedGoalMinutes.add(goalMin);
        const scorer = pickScorer(aPlayers, awayXI);
        if (scorer) pickAssistant(aPlayers, awayXI, scorer.id);
        awayGoals++;
      }
    }
  };

  // Sekcja regulaminowych 90 minut
  simulateMinutes(1, 90, 1);
  const regularHomeGoals = homeGoals;
  const regularAwayGoals = awayGoals;

  // Sekcja dogrywki — tylko przy remisie po 90 minutach, ze zmniejszoną intensywnością
  let endedAfterExtraTime = false;
  if (homeGoals === awayGoals) {
    simulateMinutes(91, 120, 0.55);
    endedAfterExtraTime = homeGoals !== awayGoals;
  }

  // Sekcja rzutów karnych — pełna seria 5 + sudden death
  let penaltyHome: number | undefined;
  let penaltyAway: number | undefined;

  if (homeGoals === awayGoals) {
    const simulatePenaltySeries = (
      shooters: Player[],
      shooterXI: (string | null)[],
      keeper: Player | undefined
    ): number => {
      const activeShooters = shooterXI
        .filter(id => id !== null)
        .map(id => shooters.find(p => p.id === id))
        .filter((p): p is Player => !!p)
        .slice(0, 5);

      let scored = 0;
      for (const shooter of activeShooters) {
        const finishing = shooter.attributes.finishing || 50;
        const keeperSave = keeper?.attributes.goalkeeping || 50;
        const penChance = 0.75 + (finishing - keeperSave) / 200;
        if (rng() < Math.min(0.95, Math.max(0.40, penChance))) scored++;
      }
      return scored;
    };

    const homeGK = hPlayers.find(p => p.id === homeXI[0]);
    const awayGK = aPlayers.find(p => p.id === awayXI[0]);

    penaltyHome = simulatePenaltySeries(hPlayers, homeXI, awayGK);
    penaltyAway = simulatePenaltySeries(aPlayers, awayXI, homeGK);

    let sudden = 0;
    while (penaltyHome === penaltyAway && sudden < 10) {
      sudden++;
      const hShooter = hPlayers.find(p => homeXI.includes(p.id) && p.position !== PlayerPosition.GK);
      const aShooter = aPlayers.find(p => awayXI.includes(p.id) && p.position !== PlayerPosition.GK);
      const hFinishing = hShooter?.attributes.finishing || 50;
      const aFinishing = aShooter?.attributes.finishing || 50;
      const hSave = awayGK?.attributes.goalkeeping || 50;
      const aSave = homeGK?.attributes.goalkeeping || 50;

      const hScored = rng() < Math.min(0.95, Math.max(0.40, 0.75 + (hFinishing - hSave) / 200));
      const aScored = rng() < Math.min(0.95, Math.max(0.40, 0.75 + (aFinishing - aSave) / 200));

      if (hScored && !aScored) penaltyHome += 1;
      else if (!hScored && aScored) penaltyAway += 1;
    }
  }

  return {
    homeScore: homeGoals,
    awayScore: awayGoals,
    penaltyHome,
    penaltyAway,
    endedAfterExtraTime: endedAfterExtraTime || (regularHomeGoals === regularAwayGoals && homeGoals !== awayGoals),
  };
};

export const BackgroundPlayOffMatchPolishCup = {

  // Sekcja przygotowania składów tylko dla dwóch klubów grających playoff
  preparePlayoffLineups(
    homeClub: Club,
    awayClub: Club,
    playersMap: Record<string, Player[]>,
    currentLineups: Record<string, Lineup>,
    userTeamId: string | null,
    coaches: Record<string, Coach> = {}
  ): Record<string, Lineup> {
    const preparedLineups = AiMatchPreparationService.prepareAllTeams(
      [homeClub, awayClub],
      playersMap,
      currentLineups,
      userTeamId,
      coaches
    );

    [homeClub, awayClub].forEach(club => {
      const squad = playersMap[club.id] || [];
      if (squad.length === 0) return;

      const clubCoach = club.coachId ? (coaches[club.coachId] ?? null) : null;
      const fallbackLineup = LineupService.autoPickLineup(club.id, squad, '4-4-2', clubCoach);
      const sourceLineup = preparedLineups[club.id] || currentLineups[club.id] || fallbackLineup;
      preparedLineups[club.id] = LineupService.repairLineup(sourceLineup, squad);
    });

    return preparedLineups;
  },

  // Sekcja pojedynczego meczu playoff — wynik oparty na skopiowanym silniku KO
  simulatePlayoffMatch(
    currentDate: Date,
    homeClub: Club,
    awayClub: Club,
    playersMap: Record<string, Player[]>,
    preparedLineups: Record<string, Lineup>,
    seed: number,
    stageKey: string
  ): PromotionPlayoffSingleMatchResult {
    const hPlayers = playersMap[homeClub.id] || [];
    const aPlayers = playersMap[awayClub.id] || [];
    const hLineup = preparedLineups[homeClub.id];
    const aLineup = preparedLineups[awayClub.id];

    if (!hLineup || !aLineup) {
      return {
        homeId: homeClub.id,
        awayId: awayClub.id,
        homeGoals: 0,
        awayGoals: 0,
        decidedBy: 'PENALTIES',
        penalties: { winnerId: homeClub.id, homeShots: 5, awayShots: 4 },
        winnerId: homeClub.id,
      };
    }

    const weatherSeed = `${stageKey}_${homeClub.id}_${awayClub.id}_${seed}`;
    const weather = PolandWeatherService.getWeather(currentDate, weatherSeed);
    const isBadWeather = weather.precipitationChance > 50 || weather.tempC < 2;
    const weatherEqualizer = isBadWeather ? 0.82 : 1.0;

    const engineResult = simulatePlayoffMatchEngine(
      homeClub,
      awayClub,
      hPlayers,
      aPlayers,
      hLineup,
      aLineup,
      seed,
      weatherEqualizer,
      false
    );

    if (engineResult.penaltyHome !== undefined && engineResult.penaltyAway !== undefined) {
      const winnerId = engineResult.penaltyHome > engineResult.penaltyAway ? homeClub.id : awayClub.id;
      return {
        homeId: homeClub.id,
        awayId: awayClub.id,
        homeGoals: engineResult.homeScore,
        awayGoals: engineResult.awayScore,
        decidedBy: 'PENALTIES',
        penalties: {
          winnerId,
          homeShots: engineResult.penaltyHome,
          awayShots: engineResult.penaltyAway,
        },
        winnerId,
      };
    }

    return {
      homeId: homeClub.id,
      awayId: awayClub.id,
      homeGoals: engineResult.homeScore,
      awayGoals: engineResult.awayScore,
      decidedBy: engineResult.endedAfterExtraTime ? 'EXTRA_TIME' : 'REGULAR',
      winnerId: engineResult.homeScore > engineResult.awayScore ? homeClub.id : awayClub.id,
    };
  },
};
