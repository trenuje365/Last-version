import { TRAINING_CYCLES } from '../data/training_definitions_pl';
import { Player, PlayerAttributes, PlayerPosition, TrainingCycle } from '../types';

type TrainableAttribute = Exclude<keyof PlayerAttributes, 'talent'>;

interface WeightedItem<T> {
  item: T;
  weight: number;
}

export interface TrainingAssistantPlan {
  cycleId: string;
  playerFocuses: Record<string, TrainableAttribute>;
}

const OUTFIELD_CYCLE_IDS = new Set([
  'T_TACTICAL_PERIOD',
  'T_GEGENPRESSING',
  'T_TIKI_TAKA',
  'T_CATENACCIO',
  'T_FINISHING',
  'T_SAQ',
  'T_AIR_DOM',
  'T_SET_PIECES',
  'T_RECOVERY_YOGA',
  'T_HIGH_PRESS',
  'T_COUNTER_ATTACK'
]);

const POSITION_FOCUS_POOLS: Record<PlayerPosition, TrainableAttribute[]> = {
  [PlayerPosition.GK]: ['goalkeeping', 'positioning', 'passing', 'vision', 'stamina', 'mentality', 'leadership'],
  [PlayerPosition.DEF]: ['defending', 'strength', 'positioning', 'heading', 'pace', 'passing', 'workRate', 'aggression', 'crossing'],
  [PlayerPosition.MID]: ['passing', 'technique', 'vision', 'dribbling', 'stamina', 'workRate', 'mentality', 'defending', 'pace', 'crossing', 'attacking', 'freeKicks'],
  [PlayerPosition.FWD]: ['finishing', 'attacking', 'pace', 'dribbling', 'technique', 'heading', 'positioning', 'workRate', 'strength', 'penalties']
};

const ROLE_BONUS: Record<PlayerPosition, Partial<Record<TrainableAttribute, number>>> = {
  [PlayerPosition.GK]: {
    goalkeeping: 20,
    positioning: 12,
    passing: 8,
    vision: 5,
    mentality: 6
  },
  [PlayerPosition.DEF]: {
    defending: 20,
    strength: 12,
    positioning: 13,
    heading: 10,
    pace: 6,
    workRate: 5
  },
  [PlayerPosition.MID]: {
    passing: 18,
    technique: 15,
    vision: 16,
    dribbling: 10,
    stamina: 8,
    mentality: 6,
    attacking: 5,
    defending: 5
  },
  [PlayerPosition.FWD]: {
    finishing: 20,
    attacking: 16,
    pace: 10,
    dribbling: 9,
    technique: 7,
    heading: 7,
    penalties: 4,
    positioning: 8
  }
};

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

const average = (values: number[]): number => {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const averageAttribute = (players: Player[], attr: TrainableAttribute): number =>
  average(players.map(player => player.attributes[attr] ?? 0));

const weightedPick = <T>(items: WeightedItem<T>[], rng: () => number): T => {
  const totalWeight = items.reduce((sum, entry) => sum + entry.weight, 0);

  if (totalWeight <= 0) {
    return items[0].item;
  }

  let roll = rng() * totalWeight;
  for (const entry of items) {
    roll -= entry.weight;
    if (roll <= 0) {
      return entry.item;
    }
  }

  return items[items.length - 1].item;
};

const getCycleScore = (cycle: TrainingCycle, players: Player[], rng: () => number): number => {
  const outfieldPlayers = players.filter(player => player.position !== PlayerPosition.GK);
  const defenders = players.filter(player => player.position === PlayerPosition.DEF);
  const midfielders = players.filter(player => player.position === PlayerPosition.MID);
  const forwards = players.filter(player => player.position === PlayerPosition.FWD);
  const avgAge = average(players.map(player => player.age));
  const avgCondition = average(players.map(player => player.condition));

  const baseNeed =
    average(cycle.primaryAttributes.map(attr => clamp(82 - averageAttribute(players, attr as TrainableAttribute), 0, 35))) * 1.7 +
    average(cycle.secondaryAttributes.map(attr => clamp(80 - averageAttribute(players, attr as TrainableAttribute), 0, 25))) * 1.1;

  let score = 12 + baseNeed;

  switch (cycle.id) {
    case 'T_TACTICAL_PERIOD':
      score += average([
        clamp(82 - averageAttribute(outfieldPlayers, 'vision'), 0, 28),
        clamp(82 - averageAttribute(outfieldPlayers, 'positioning'), 0, 28),
        clamp(80 - averageAttribute(outfieldPlayers, 'passing'), 0, 24)
      ]);
      break;
    case 'T_GEGENPRESSING':
      score += average([
        clamp(82 - averageAttribute(outfieldPlayers, 'stamina'), 0, 32),
        clamp(82 - averageAttribute(outfieldPlayers, 'workRate'), 0, 30),
        clamp(82 - averageAttribute(outfieldPlayers, 'pace'), 0, 28),
        clamp(80 - averageAttribute(outfieldPlayers, 'aggression'), 0, 24)
      ]);
      score -= Math.max(0, 78 - avgCondition) * 0.8;
      score -= Math.max(0, avgAge - 29) * 4;
      break;
    case 'T_TIKI_TAKA':
      score += average([
        clamp(84 - averageAttribute(outfieldPlayers, 'passing'), 0, 34),
        clamp(84 - averageAttribute(outfieldPlayers, 'technique'), 0, 30),
        clamp(82 - averageAttribute(outfieldPlayers, 'vision'), 0, 28),
        clamp(80 - averageAttribute(outfieldPlayers, 'dribbling'), 0, 24)
      ]);
      score += midfielders.length * 0.9;
      break;
    case 'T_CATENACCIO':
      score += average([
        clamp(84 - averageAttribute(defenders, 'defending'), 0, 34),
        clamp(82 - averageAttribute(defenders, 'positioning'), 0, 28),
        clamp(82 - averageAttribute(defenders, 'strength'), 0, 28),
        clamp(80 - averageAttribute(defenders, 'heading'), 0, 22)
      ]);
      score += defenders.length * 1.1;
      break;
    case 'T_FINISHING':
      score += average([
        clamp(84 - averageAttribute(forwards, 'finishing'), 0, 34),
        clamp(82 - averageAttribute(forwards, 'attacking'), 0, 28),
        clamp(80 - averageAttribute(forwards, 'technique'), 0, 22)
      ]);
      score += forwards.length * 1.2;
      break;
    case 'T_SAQ':
      score += average([
        clamp(84 - averageAttribute(outfieldPlayers, 'pace'), 0, 34),
        clamp(82 - averageAttribute(outfieldPlayers, 'dribbling'), 0, 28),
        clamp(80 - averageAttribute(outfieldPlayers, 'stamina'), 0, 22)
      ]);
      score -= Math.max(0, 76 - avgCondition) * 0.6;
      break;
    case 'T_AIR_DOM':
      score += average([
        clamp(84 - averageAttribute(defenders.concat(forwards), 'heading'), 0, 34),
        clamp(82 - averageAttribute(players, 'strength'), 0, 28),
        clamp(80 - averageAttribute(defenders, 'defending'), 0, 24)
      ]);
      break;
    case 'T_SET_PIECES':
      score += average([
        clamp(82 - averageAttribute(players, 'freeKicks'), 0, 26),
        clamp(82 - averageAttribute(players, 'corners'), 0, 26),
        clamp(80 - averageAttribute(players, 'penalties'), 0, 20),
        clamp(80 - averageAttribute(players, 'passing'), 0, 20)
      ]);
      score -= 4;
      break;
    case 'T_RECOVERY_YOGA':
      score += Math.max(0, 82 - avgCondition) * 2.2;
      score += Math.max(0, avgAge - 28) * 2.5;
      break;
    case 'T_HIGH_PRESS':
      score += average([
        clamp(84 - averageAttribute(outfieldPlayers, 'workRate'), 0, 34),
        clamp(82 - averageAttribute(outfieldPlayers, 'aggression'), 0, 28),
        clamp(82 - averageAttribute(outfieldPlayers, 'stamina'), 0, 28),
        clamp(80 - averageAttribute(outfieldPlayers, 'defending'), 0, 22)
      ]);
      score -= Math.max(0, 78 - avgCondition) * 0.7;
      score -= Math.max(0, avgAge - 30) * 4.5;
      break;
    case 'T_COUNTER_ATTACK':
      score += average([
        clamp(84 - averageAttribute(players, 'pace'), 0, 34),
        clamp(82 - averageAttribute(forwards.concat(midfielders), 'attacking'), 0, 28),
        clamp(82 - averageAttribute(forwards, 'finishing'), 0, 28),
        clamp(80 - averageAttribute(outfieldPlayers, 'workRate'), 0, 20)
      ]);
      score += forwards.length * 1.1;
      break;
    default:
      break;
  }

  score *= 0.88 + rng() * 0.24;

  return Math.max(1, score);
};

const chooseCycle = (players: Player[], rng: () => number): TrainingCycle => {
  const cycleCandidates = TRAINING_CYCLES.filter(cycle => OUTFIELD_CYCLE_IDS.has(cycle.id));
  const scored = cycleCandidates
    .map(cycle => ({ cycle, score: getCycleScore(cycle, players, rng) }))
    .sort((left, right) => right.score - left.score)
    .slice(0, 4);

  return weightedPick(
    scored.map(entry => ({
      item: entry.cycle,
      weight: entry.score
    })),
    rng
  );
};

const chooseFocus = (player: Player, cycle: TrainingCycle, rng: () => number): TrainableAttribute => {
  const pool = POSITION_FOCUS_POOLS[player.position];
  const scored = pool
    .map(attr => {
      const attrValue = player.attributes[attr] ?? 0;
      const weakness = clamp(82 - attrValue, 0, 38) * 1.35;
      const teamSync = cycle.primaryAttributes.includes(attr) ? 14 : (cycle.secondaryAttributes.includes(attr) ? 8 : 0);
      const roleBonus = ROLE_BONUS[player.position][attr] ?? 0;
      const ageAdjustment = player.age >= 32 && ['pace', 'stamina', 'workRate'].includes(attr) ? -3 : 0;
      const elitePenalty = attrValue >= 88 ? 8 : attrValue >= 82 ? 4 : 0;
      const jitter = rng() * 6;

      return {
        attr,
        score: Math.max(1, 8 + weakness + teamSync + roleBonus + ageAdjustment + jitter - elitePenalty)
      };
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, 4);

  return weightedPick(
    scored.map(entry => ({
      item: entry.attr,
      weight: entry.score
    })),
    rng
  );
};

export const TrainingAssistantService = {
  buildPlan(players: Player[], rng: () => number = Math.random): TrainingAssistantPlan {
    const cycle = chooseCycle(players, rng);
    const playerFocuses = players.reduce<Record<string, TrainableAttribute>>((acc, player) => {
      acc[player.id] = chooseFocus(player, cycle, rng);
      return acc;
    }, {});

    return {
      cycleId: cycle.id,
      playerFocuses
    };
  }
};
