import {
  Coach,
  HealthStatus,
  InjurySeverity,
  MatchCardEntry,
  MatchEvent,
  MatchEventType,
  MatchGoalEntry,
  MatchHistoryEntry,
  MatchInjuryEntry,
  MatchSubstitutionEntry,
  NationalTeam,
  NTMatchResult,
  Player,
  PlayerPosition,
} from '../types';
import { NTGroupMatch, NTMatchDay } from '../resources/NationalTeamSchedule';
import { LineupService } from './LineupService';
import { NationalTeamEnvironmentService } from './NationalTeamEnvironmentService';
import { NationalTeamLineupService } from './NationalTeamLineupService';
import { TacticRepository } from '../resources/tactics_db';

export interface NationalTeamMatchDaySimulation {
  results: NTMatchResult[];
  updatedPlayers: Record<string, Player[]>;
  matchHistoryEntries: MatchHistoryEntry[];
}

type Side = 'HOME' | 'AWAY';
type Loc = { clubId: string; index: number };
type Metrics = { att: number; build: number; create: number; def: number; press: number; gk: number; ment: number; aggr: number; avgFat: number; active: number };
type LiveTeam = {
  side: Side;
  team: NationalTeam;
  coach: Coach | null;
  squad: Player[];
  activeXI: (string | null)[];
  bench: string[];
  tacticId: string;
  fatigue: Record<string, number>;
  debt: Record<string, number>;
  minutes: Record<string, number>;
  yellows: Record<string, number>;
  sentOff: Set<string>;
  subs: number;
  penaltyTakerId: string | null;
};

class Rng {
  private s: number;
  constructor(seed: number) { this.s = seed >>> 0 || 1; }
  next(): number { this.s = (this.s * 1664525 + 1013904223) >>> 0; return this.s / 0x100000000; }
  int(min: number, max: number): number { return Math.floor(this.next() * (max - min + 1)) + min; }
}

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const hash = (v: string) => {
  let h = 0;
  for (let i = 0; i < v.length; i++) h = ((h << 5) - h + v.charCodeAt(i)) | 0;
  return h >>> 0;
};
const nameOf = (p?: Player | null) => p ? `${p.firstName} ${p.lastName}` : 'Unknown';
const fatMul = (f: number) => 0.52 + 0.48 * Math.pow(clamp(f, 0, 100) / 100, 1.25);

const clonePlayer = (p: Player): Player => ({
  ...p,
  stats: { ...p.stats },
  health: { ...p.health, injury: p.health.injury ? { ...p.health.injury } : undefined },
  history: [...p.history],
  freeAgentClubLockouts: p.freeAgentClubLockouts ? { ...p.freeAgentClubLockouts } : undefined,
});

const cloneMap = (m: Record<string, Player[]>) => {
  const out: Record<string, Player[]> = {};
  for (const [k, v] of Object.entries(m)) out[k] = [...v];
  return out;
};

const locMap = (m: Record<string, Player[]>) => {
  const out: Record<string, Loc> = {};
  for (const [clubId, squad] of Object.entries(m)) squad.forEach((p, index) => { out[p.id] = { clubId, index }; });
  return out;
};

const fallbackCoach = (teamId: string): Coach => ({
  id: `NT_COACH_${teamId}`,
  firstName: 'National',
  lastName: 'Coach',
  age: 50,
  nationality: 'INT',
  nationalityFlag: '',
  attributes: { experience: 50, decisionMaking: 50, motivation: 50, training: 50 },
  history: [],
  currentClubId: null,
  currentNationalTeamId: teamId,
  isNationalTeamCoach: true,
  hiredDate: new Date(2025, 0, 1).toISOString(),
  blacklist: {},
  favoriteTactics: { offensive: '4-3-3 Atak', neutral: '4-4-2', defensive: '5-3-2' },
});

const activePlayers = (lt: LiveTeam) => lt.activeXI.map(id => lt.squad.find(p => p.id === id) ?? null).filter(Boolean) as Player[];
const slotIndex = (lt: LiveTeam, playerId: string) => lt.activeXI.findIndex(id => id === playerId);
const slotRole = (lt: LiveTeam, playerId: string) => {
  const idx = slotIndex(lt, playerId);
  return idx >= 0 ? (TacticRepository.getById(lt.tacticId).slots[idx]?.role ?? PlayerPosition.MID) : PlayerPosition.MID;
};

const weighted = (players: Player[], rng: Rng, score: (p: Player) => number): Player | null => {
  const items = players.map(p => ({ p, s: Math.max(0, score(p)) })).filter(x => x.s > 0);
  if (!items.length) return null;
  const total = items.reduce((a, b) => a + b.s, 0);
  let roll = rng.next() * total;
  for (const item of items) {
    roll -= item.s;
    if (roll <= 0) return item.p;
  }
  return items[items.length - 1].p;
};

const metrics = (lt: LiveTeam): Metrics => {
  const act = activePlayers(lt);
  if (!act.length) return { att: 20, build: 20, create: 20, def: 20, press: 20, gk: 20, ment: 20, aggr: 20, avgFat: 0, active: 0 };
  let att = 0; let build = 0; let create = 0; let def = 0; let press = 0; let gk = 0; let ment = 0; let aggr = 0; let fat = 0;
  act.forEach(p => {
    const f = lt.fatigue[p.id] ?? p.condition ?? 100;
    const m = fatMul(f);
    const role = slotRole(lt, p.id);
    const ra = role === PlayerPosition.FWD ? 1.2 : role === PlayerPosition.MID ? 1.0 : role === PlayerPosition.DEF ? 0.72 : 0.18;
    const rd = role === PlayerPosition.DEF ? 1.2 : role === PlayerPosition.MID ? 0.96 : role === PlayerPosition.FWD ? 0.62 : 0.4;
    const rm = role === PlayerPosition.MID ? 1.18 : role === PlayerPosition.DEF ? 0.82 : role === PlayerPosition.FWD ? 0.88 : 0.25;
    att += (p.attributes.attacking * 0.19 + p.attributes.finishing * 0.23 + p.attributes.positioning * 0.14 + p.attributes.technique * 0.11 + p.attributes.dribbling * 0.1 + p.attributes.pace * 0.08 + p.attributes.heading * 0.07 + p.attributes.passing * 0.04 + p.attributes.vision * 0.04) * m * ra;
    build += (p.attributes.passing * 0.2 + p.attributes.vision * 0.18 + p.attributes.technique * 0.16 + p.attributes.dribbling * 0.1 + p.attributes.workRate * 0.11 + p.attributes.stamina * 0.08 + p.attributes.crossing * 0.08 + p.attributes.mentality * 0.09) * m * rm;
    create += (p.attributes.vision * 0.2 + p.attributes.technique * 0.17 + p.attributes.passing * 0.16 + p.attributes.dribbling * 0.13 + p.attributes.attacking * 0.09 + p.attributes.crossing * 0.1 + p.attributes.mentality * 0.08 + p.attributes.workRate * 0.07) * m * rm;
    def += (p.attributes.defending * 0.24 + p.attributes.positioning * 0.18 + p.attributes.strength * 0.11 + p.attributes.stamina * 0.1 + p.attributes.heading * 0.08 + p.attributes.pace * 0.08 + p.attributes.aggression * 0.08 + p.attributes.mentality * 0.08 + p.attributes.workRate * 0.05) * m * rd;
    press += (p.attributes.workRate * 0.22 + p.attributes.stamina * 0.18 + p.attributes.aggression * 0.17 + p.attributes.pace * 0.14 + p.attributes.mentality * 0.13 + p.attributes.leadership * 0.08 + p.attributes.strength * 0.08) * m;
    if (role === PlayerPosition.GK || p.position === PlayerPosition.GK) gk += (p.attributes.goalkeeping * 0.62 + p.attributes.positioning * 0.18 + p.attributes.mentality * 0.1 + p.attributes.passing * 0.1) * m;
    ment += (p.attributes.mentality * 0.58 + p.attributes.leadership * 0.22 + p.attributes.workRate * 0.2) * m;
    aggr += p.attributes.aggression * m;
    fat += f;
  });
  const missingPlayers = Math.max(0, 11 - act.length);
  if (missingPlayers > 0) {
    att *= Math.max(0.34, 1 - missingPlayers * 0.16);
    build *= Math.max(0.38, 1 - missingPlayers * 0.14);
    create *= Math.max(0.34, 1 - missingPlayers * 0.15);
    def *= Math.max(0.42, 1 - missingPlayers * 0.12);
    press *= Math.max(0.36, 1 - missingPlayers * 0.15);
    ment *= Math.max(0.7, 1 - missingPlayers * 0.06);
  }
  return { att, build, create, def, press, gk: gk || 24, ment, aggr, avgFat: fat / act.length, active: act.length };
};

const eventPush = (timeline: MatchEvent[], minute: number, teamSide: Side, type: MatchEventType, text: string, primaryPlayerId?: string, secondaryPlayerId?: string) => {
  timeline.push({ minute, teamSide, type, text, primaryPlayerId, secondaryPlayerId });
};

const goalEntry = (scorer: Player, teamId: string, minute: number, isPenalty: boolean, assistant?: Player | null): MatchGoalEntry => ({
  playerId: scorer.id,
  playerName: nameOf(scorer),
  minute,
  teamId,
  isPenalty,
  assistantId: assistant?.id,
  assistantName: assistant ? nameOf(assistant) : undefined,
});

const pickCreator = (lt: LiveTeam, rng: Rng) => weighted(activePlayers(lt).filter(p => p.position !== PlayerPosition.GK), rng, p => {
  const role = slotRole(lt, p.id);
  const rb = role === PlayerPosition.MID ? 1.18 : role === PlayerPosition.FWD ? 1.08 : 0.9;
  return (p.attributes.passing * 1.45 + p.attributes.vision * 1.4 + p.attributes.technique * 1.25 + p.attributes.dribbling * 0.95 + p.attributes.crossing * 0.82 + p.attributes.attacking * 0.7 + p.attributes.workRate * 0.45) * fatMul(lt.fatigue[p.id] ?? 100) * rb;
});
const pickShooter = (lt: LiveTeam, rng: Rng) => weighted(activePlayers(lt).filter(p => p.position !== PlayerPosition.GK), rng, p => {
  const role = slotRole(lt, p.id);
  const rb = role === PlayerPosition.FWD ? 1.22 : role === PlayerPosition.MID ? 0.95 : 0.7;
  return (p.attributes.finishing * 1.65 + p.attributes.attacking * 1.35 + p.attributes.positioning * 1.15 + p.attributes.technique * 0.9 + p.attributes.heading * 0.7 + p.attributes.pace * 0.55 + p.attributes.mentality * 0.45) * fatMul(lt.fatigue[p.id] ?? 100) * rb;
});
const pickDefender = (lt: LiveTeam, rng: Rng) => weighted(activePlayers(lt).filter(p => p.position !== PlayerPosition.GK), rng, p => (p.attributes.defending * 1.45 + p.attributes.positioning * 1.2 + p.attributes.strength * 0.8 + p.attributes.pace * 0.72 + p.attributes.aggression * 0.68 + p.attributes.heading * 0.55 + p.attributes.mentality * 0.55) * fatMul(lt.fatigue[p.id] ?? 100));
const pickKeeper = (lt: LiveTeam) => lt.squad.find(p => p.id === lt.activeXI[0]) ?? null;
const pickPenalty = (lt: LiveTeam, rng: Rng) => {
  const act = activePlayers(lt).filter(p => p.position !== PlayerPosition.GK);
  const fixed = lt.penaltyTakerId ? act.find(p => p.id === lt.penaltyTakerId) ?? null : null;
  return fixed ?? weighted(act, rng, p => (p.attributes.penalties * 2.2 + p.attributes.finishing * 1.1 + p.attributes.technique * 0.9 + p.attributes.mentality * 0.8) * fatMul(lt.fatigue[p.id] ?? 100));
};

const removeFromPitch = (lt: LiveTeam, playerId: string) => { lt.activeXI = lt.activeXI.map(id => id === playerId ? null : id); };

const benchReplacement = (lt: LiveTeam, requiredRole: PlayerPosition, minute: number, losing: boolean) => {
  const bench = lt.bench.map(id => lt.squad.find(p => p.id === id) ?? null).filter(Boolean) as Player[];
  if (!bench.length) return null;
  const sorted = [...bench].sort((a, b) => {
    const sa = LineupService.calculateFitScore(a, requiredRole) + (lt.fatigue[a.id] ?? a.condition ?? 100) * 0.75 + (losing && a.position === PlayerPosition.FWD ? 10 : 0) + (losing && a.position === PlayerPosition.MID ? 6 : 0);
    const sb = LineupService.calculateFitScore(b, requiredRole) + (lt.fatigue[b.id] ?? b.condition ?? 100) * 0.75 + (losing && b.position === PlayerPosition.FWD ? 10 : 0) + (losing && b.position === PlayerPosition.MID ? 6 : 0);
    return sb - sa;
  });
  return sorted.find(p => p.position === requiredRole) ?? (minute >= 72 && losing ? sorted.find(p => p.position !== PlayerPosition.GK) ?? sorted[0] : sorted[0]);
};

const doSub = (lt: LiveTeam, slotIdx: number, incoming: Player, minute: number, subs: MatchSubstitutionEntry[], timeline: MatchEvent[]) => {
  const outId = lt.activeXI[slotIdx];
  const outgoing = lt.squad.find(p => p.id === outId) ?? null;
  lt.activeXI[slotIdx] = incoming.id;
  lt.bench = lt.bench.filter(id => id !== incoming.id);
  lt.subs += 1;
  lt.minutes[incoming.id] = lt.minutes[incoming.id] ?? 0;
  subs.push({ playerOutId: outgoing?.id, playerOutName: nameOf(outgoing), playerInId: incoming.id, playerInName: nameOf(incoming), minute, teamId: lt.team.id });
  eventPush(timeline, minute, lt.side, MatchEventType.SUBSTITUTION, `${lt.team.name}: ${nameOf(incoming)} for ${nameOf(outgoing)}`, incoming.id, outgoing?.id);
};

const maybeSub = (lt: LiveTeam, minute: number, homeScore: number, awayScore: number, subs: MatchSubstitutionEntry[], timeline: MatchEvent[]) => {
  if (lt.subs >= 5 || !lt.bench.length || minute < 46) return;
  const act = activePlayers(lt).filter(p => p.position !== PlayerPosition.GK);
  const losing = lt.side === 'HOME' ? homeScore < awayScore : awayScore < homeScore;
  const threshold = minute >= 75 ? 76 : minute >= 60 ? 70 : 63;
  const injured = act.find(p => (lt.fatigue[p.id] ?? 100) < 32) ?? null;
  const yellowRisk = minute >= 68 ? [...act].filter(p => (lt.yellows[p.id] ?? 0) > 0).sort((a, b) => ((b.attributes.aggression * 0.8) + (100 - (lt.fatigue[b.id] ?? 100))) - ((a.attributes.aggression * 0.8) + (100 - (lt.fatigue[a.id] ?? 100))))[0] ?? null : null;
  const tired = act.map(p => ({ p, f: lt.fatigue[p.id] ?? 100 })).filter(x => x.f < threshold).sort((a, b) => a.f - b.f)[0]?.p ?? null;
  const target = injured ?? yellowRisk ?? tired;
  if (!target) return;
  const idx = slotIndex(lt, target.id);
  if (idx < 0) return;
  const req = TacticRepository.getById(lt.tacticId).slots[idx]?.role ?? target.position;
  const incoming = benchReplacement(lt, req, minute, losing);
  if (!incoming) return;
  const cur = LineupService.calculateFitScore(target, req) * fatMul(lt.fatigue[target.id] ?? 100);
  const inc = LineupService.calculateFitScore(incoming, req) * fatMul(lt.fatigue[incoming.id] ?? incoming.condition ?? 100);
  if (!injured && inc < cur * 0.84 && !losing) return;
  doSub(lt, idx, incoming, minute, subs, timeline);
};

const fatigueTick = (lt: LiveTeam, minute: number, weatherInt: number, trailing: boolean) => {
  lt.activeXI.forEach((id, idx) => {
    if (!id) return;
    const p = lt.squad.find(x => x.id === id);
    if (!p) return;
    const role = TacticRepository.getById(lt.tacticId).slots[idx]?.role ?? p.position;
    let drain = 0.18;
    if (role === PlayerPosition.DEF) drain *= 1.18;
    if (role === PlayerPosition.MID) drain *= 1.25;
    if (role === PlayerPosition.FWD) drain *= 1.14;
    if (role === PlayerPosition.GK) drain *= 0.22;
    drain *= 0.85 + (p.attributes.workRate / 100) * 0.35;
    drain *= 1.28 - Math.pow((p.attributes.stamina || 50) / 100, 1.15) * 0.42;
    drain *= 1 + weatherInt * 0.22;
    drain *= 1 + lt.sentOff.size * 0.09;
    if (trailing && minute >= 70) drain *= 1.06;
    lt.fatigue[id] = clamp((lt.fatigue[id] ?? p.condition ?? 100) - drain, 0, 100);
    lt.debt[id] = (lt.debt[id] ?? 0) + (drain * 0.42) + ((100 - p.attributes.stamina) * 0.01);
    lt.minutes[id] = (lt.minutes[id] ?? 0) + 1;
  });
};

const maybeInjury = (lt: LiveTeam, minute: number, weatherInt: number, homeScore: number, awayScore: number, rng: Rng, injuries: MatchInjuryEntry[], subs: MatchSubstitutionEntry[], timeline: MatchEvent[]) => {
  const act = activePlayers(lt).filter(p => p.position !== PlayerPosition.GK);
  if (!act.length) return;
  const avgFat = act.reduce((s, p) => s + (lt.fatigue[p.id] ?? 100), 0) / act.length;
  const chance = 0.0032 + weatherInt * 0.002 + Math.max(0, 68 - avgFat) * 0.00006;
  if (rng.next() >= chance) return;
  const injured = weighted(act, rng, p => (100 - (lt.fatigue[p.id] ?? 100)) * 1.2 + p.attributes.workRate * 0.42 + (100 - p.attributes.stamina) * 0.7 + (p.fatigueDebt || 0) * 0.5);
  if (!injured) return;
  const f = lt.fatigue[injured.id] ?? 100;
  const severe = rng.next() < (0.2 + Math.max(0, 52 - f) * 0.008 + weatherInt * 0.1);
  const days = severe ? rng.int(18, 75) : rng.int(3, 16);
  const type = severe ? 'Muscle tear' : 'Muscle knock';
  injuries.push({ playerId: injured.id, playerName: nameOf(injured), minute, teamId: lt.team.id, severity: severe ? InjurySeverity.SEVERE : InjurySeverity.LIGHT, days, type });
  eventPush(timeline, minute, lt.side, severe ? MatchEventType.INJURY_SEVERE : MatchEventType.INJURY_LIGHT, `${nameOf(injured)} injured for ${lt.team.name}`, injured.id);
  if (!severe && f > 46 && minute < 82) return;
  const idx = slotIndex(lt, injured.id);
  const req = idx >= 0 ? (TacticRepository.getById(lt.tacticId).slots[idx]?.role ?? injured.position) : injured.position;
  const losing = lt.side === 'HOME' ? homeScore < awayScore : awayScore < homeScore;
  const incoming = lt.subs < 5 ? benchReplacement(lt, req, minute, losing) : null;
  if (incoming && idx >= 0) doSub(lt, idx, incoming, minute, subs, timeline);
  else removeFromPitch(lt, injured.id);
};

const maybeCardOrPenalty = (att: LiveTeam, def: LiveTeam, minute: number, weatherInt: number, rng: Rng, goals: MatchGoalEntry[], cards: MatchCardEntry[], timeline: MatchEvent[], homeRef: { value: number }, awayRef: { value: number }) => {
  const creator = pickCreator(att, rng);
  const defender = pickDefender(def, rng);
  if (!creator || !defender) return;
  const defenderFatigue = def.fatigue[defender.id] ?? 100;
  const defTrailing = def.side === 'HOME' ? homeRef.value < awayRef.value : awayRef.value < homeRef.value;
  const lateChasing = defTrailing && minute >= 65;
  const creatorCtl = creator.attributes.dribbling * 1.12 + creator.attributes.technique * 1.02 + creator.attributes.pace * 0.82 + creator.attributes.attacking * 0.7 + creator.attributes.mentality * 0.45;
  const defenderCtl = defender.attributes.defending * 1.1 + defender.attributes.positioning * 0.95 + defender.attributes.aggression * 0.42 + defender.attributes.strength * 0.58 + defender.attributes.mentality * 0.44;
  const alreadyBooked = (def.yellows[defender.id] ?? 0) > 0;
  const duelEdge = clamp((creatorCtl - defenderCtl) / 180, -0.18, 0.32);
  const fatigueRisk = clamp((72 - defenderFatigue) / 90, 0, 0.32);
  const recklessness = clamp(
    (defender.attributes.aggression / 100) * 0.36 +
    ((100 - defender.attributes.mentality) / 100) * 0.24 +
    ((100 - defender.attributes.defending) / 100) * 0.08 +
    fatigueRisk +
    weatherInt * 0.1 +
    (lateChasing ? 0.06 : 0),
    0.08,
    0.92
  );
  const foulChance = clamp(
    0.12 + Math.max(0, duelEdge) * 0.28 + recklessness * 0.18,
    0.1,
    0.3
  );
  if (rng.next() >= foulChance) return;
  const foulSeverity = clamp(
    0.2 + Math.max(0, duelEdge) * 0.44 + recklessness * 0.4 + (alreadyBooked ? 0.02 : 0),
    0.14,
    0.98
  );
  const cardChance = clamp(
    0.1 + Math.max(0, foulSeverity - 0.24) * 0.42,
    0.08,
    0.34
  );
  const directRedChance = clamp(0.0016 + Math.max(0, foulSeverity - 0.84) * 0.03 + weatherInt * 0.0015, 0.0012, 0.012);
  const directRed = rng.next() < directRedChance;
  if (directRed) {
    cards.push({ playerId: defender.id, playerName: nameOf(defender), minute, teamId: def.team.id, type: 'RED' });
    eventPush(timeline, minute, def.side, MatchEventType.RED_CARD, `${nameOf(defender)} sent off for ${def.team.name}`, defender.id);
    def.sentOff.add(defender.id);
    removeFromPitch(def, defender.id);
  } else if (rng.next() < cardChance) {
    if (alreadyBooked) {
      cards.push({ playerId: defender.id, playerName: nameOf(defender), minute, teamId: def.team.id, type: 'SECOND_YELLOW' });
      eventPush(timeline, minute, def.side, MatchEventType.RED_CARD, `${nameOf(defender)} sent off for ${def.team.name}`, defender.id);
      def.sentOff.add(defender.id);
      removeFromPitch(def, defender.id);
    } else {
      def.yellows[defender.id] = (def.yellows[defender.id] ?? 0) + 1;
      cards.push({ playerId: defender.id, playerName: nameOf(defender), minute, teamId: def.team.id, type: 'YELLOW' });
      eventPush(timeline, minute, def.side, MatchEventType.YELLOW_CARD, `${nameOf(defender)} booked for ${def.team.name}`, defender.id);
    }
  }
  const penChance = clamp(
    0.009 + Math.max(0, creator.attributes.pace + creator.attributes.dribbling + creator.attributes.attacking - defender.attributes.positioning - defender.attributes.pace - defender.attributes.defending) / 3000 + Math.max(0, foulSeverity - 0.5) * 0.014 + weatherInt * 0.003,
    0.006,
    0.032
  );
  if (rng.next() >= penChance) return;
  const taker = pickPenalty(att, rng);
  const keeper = pickKeeper(def);
  if (!taker || !keeper) return;
  const scoreChance = clamp(0.63 + ((taker.attributes.penalties * 1.6 + taker.attributes.finishing * 0.8 + taker.attributes.mentality * 0.7 + taker.attributes.technique * 0.55) - (keeper.attributes.goalkeeping * 1.42 + keeper.attributes.positioning * 0.82 + keeper.attributes.mentality * 0.56)) / 360 + (att.side === 'HOME' ? 0.02 : 0) - weatherInt * 0.03, 0.48, 0.9);
  eventPush(timeline, minute, att.side, MatchEventType.PENALTY_AWARDED, `Penalty for ${att.team.name}`, taker.id, defender.id);
  if (rng.next() < scoreChance) {
    goals.push(goalEntry(taker, att.team.id, minute, true));
    eventPush(timeline, minute, att.side, MatchEventType.PENALTY_SCORED, `${nameOf(taker)} scores the penalty for ${att.team.name}`, taker.id);
    if (att.side === 'HOME') homeRef.value += 1; else awayRef.value += 1;
  } else {
    eventPush(timeline, minute, att.side, MatchEventType.PENALTY_MISSED, `${nameOf(taker)} misses the penalty for ${att.team.name}`, taker.id);
  }
};

const maybeGoal = (att: LiveTeam, def: LiveTeam, minute: number, weatherInt: number, rng: Rng, goals: MatchGoalEntry[], timeline: MatchEvent[], attM: Metrics, defM: Metrics, scoreRef: { value: number }) => {
  const creator = pickCreator(att, rng);
  const shooter = pickShooter(att, rng);
  const defender = pickDefender(def, rng);
  const keeper = pickKeeper(def);
  if (!creator || !shooter || !defender || !keeper) return;
  const prog = creator.attributes.passing * 0.78 + creator.attributes.vision * 0.74 + creator.attributes.technique * 0.64 + creator.attributes.dribbling * 0.58 + attM.build * 0.018 + attM.create * 0.016 + (att.coach?.attributes.decisionMaking ?? 50) * 0.18;
  const disrupt = defender.attributes.defending * 0.72 + defender.attributes.positioning * 0.68 + defender.attributes.pace * 0.42 + defM.def * 0.02 + defM.press * 0.01 + (def.coach?.attributes.decisionMaking ?? 50) * 0.16;
  const numbersAdvantage = def.sentOff.size - att.sentOff.size;
  const phaseChance = clamp(0.14 + (prog - disrupt) / 980 + (att.side === 'HOME' ? 0.015 : 0) + Math.max(0, numbersAdvantage) * 0.03 - weatherInt * 0.025, 0.07, 0.28);
  if (rng.next() >= phaseChance) return;
  const shot = shooter.attributes.finishing * 0.92 + shooter.attributes.attacking * 0.75 + shooter.attributes.positioning * 0.65 + shooter.attributes.technique * 0.56 + shooter.attributes.heading * 0.26 + creator.attributes.vision * 0.18 + creator.attributes.passing * 0.18 + attM.att * 0.022 + attM.create * 0.015 + (att.coach?.attributes.motivation ?? 50) * 0.18;
  const prev = keeper.attributes.goalkeeping * 0.94 + keeper.attributes.positioning * 0.58 + defM.def * 0.022 + defender.attributes.defending * 0.32 + defender.attributes.positioning * 0.22 + weatherInt * 4;
  const onTarget = clamp(0.2 + (shot - prev) / 920 + Math.max(0, 100 - (att.fatigue[shooter.id] ?? 100)) * -0.001 - weatherInt * 0.035, 0.1, 0.42);
  if (rng.next() >= onTarget) return;
  const goalChance = clamp(0.1 + (shot - prev) / 760 + (att.side === 'HOME' ? 0.01 : 0) + Math.max(0, numbersAdvantage) * 0.04 - weatherInt * 0.02, 0.05, 0.24);
  if (rng.next() < goalChance) {
    const assistant = creator.id !== shooter.id ? creator : null;
    goals.push(goalEntry(shooter, att.team.id, minute, false, assistant));
    eventPush(timeline, minute, att.side, MatchEventType.GOAL, `${nameOf(shooter)} scores for ${att.team.name}`, shooter.id, assistant?.id);
    scoreRef.value += 1;
  }
};

const updatePlayers = (updated: Record<string, Player[]>, locs: Record<string, Loc>, date: Date, home: LiveTeam, away: LiveTeam, goals: MatchGoalEntry[], cards: MatchCardEntry[], injuries: MatchInjuryEntry[]) => {
  const goalBy: Record<string, number> = {}; const assistBy: Record<string, number> = {}; const yellowBy: Record<string, number> = {}; const redBy: Record<string, number> = {}; const injBy: Record<string, MatchInjuryEntry> = {};
  goals.forEach(g => { if (g.playerId) goalBy[g.playerId] = (goalBy[g.playerId] ?? 0) + 1; if (g.assistantId) assistBy[g.assistantId] = (assistBy[g.assistantId] ?? 0) + 1; });
  cards.forEach(c => { if (!c.playerId) return; if (c.type === 'YELLOW') yellowBy[c.playerId] = (yellowBy[c.playerId] ?? 0) + 1; else if (c.type === 'SECOND_YELLOW') { yellowBy[c.playerId] = (yellowBy[c.playerId] ?? 0) + 1; redBy[c.playerId] = (redBy[c.playerId] ?? 0) + 1; } else redBy[c.playerId] = (redBy[c.playerId] ?? 0) + 1; });
  injuries.forEach(i => { if (i.playerId) injBy[i.playerId] = i; });
  [home, away].forEach(lt => {
    const ids = new Set<string>([...Object.keys(lt.minutes), ...(lt.activeXI.filter(Boolean) as string[])]);
    ids.forEach(id => {
      const loc = locs[id];
      if (!loc || !updated[loc.clubId]?.[loc.index]) return;
      const next = clonePlayer(updated[loc.clubId][loc.index]);
      const mins = lt.minutes[id] ?? 0;
      if (mins > 0) { next.stats.matchesPlayed += 1; next.stats.minutesPlayed += mins; }
      next.stats.goals += goalBy[id] ?? 0;
      next.stats.assists += assistBy[id] ?? 0;
      next.stats.yellowCards += yellowBy[id] ?? 0;
      next.stats.redCards += redBy[id] ?? 0;
      if (lt.fatigue[id] !== undefined) next.condition = clamp(lt.fatigue[id], 0, 100);
      if (lt.debt[id] !== undefined) { next.fatigueDebt = clamp((next.fatigueDebt ?? 0) + lt.debt[id], 0, 100); next.condition = Math.min(next.condition, 100 - next.fatigueDebt); }
      if (injBy[id]) {
        const injury = injBy[id];
        next.health = { status: HealthStatus.INJURED, injury: { type: injury.type, daysRemaining: injury.days, severity: injury.severity, injuryDate: date.toISOString(), totalDays: injury.days, conditionAtInjury: next.condition } };
      }
      updated[loc.clubId][loc.index] = next;
    });
  });
};

const fallback = (match: NTGroupMatch, comp: string, date: Date, seed: number): NTMatchResult => {
  const rng = new Rng(hash(`${match.home}|${match.away}|${seed}`));
  return { home: match.home, away: match.away, homeGoals: rng.int(0, 3), awayGoals: rng.int(0, 3), competitionLabel: comp, matchId: `NT_FALLBACK_${date.getTime()}_${hash(match.home + match.away)}`, goals: [], cards: [], substitutions: [], injuries: [], timeline: [] };
};

const singleMatch = (match: NTGroupMatch, md: NTMatchDay, date: Date, seed: number, season: number, updated: Record<string, Player[]>, locs: Record<string, Loc>, byName: Map<string, NationalTeam>, coaches: Record<string, Coach>) => {
  const homeTeam = byName.get(match.home) ?? null;
  const awayTeam = byName.get(match.away) ?? null;
  if (!homeTeam || !awayTeam) return { result: fallback(match, md.competitionLabel, date, seed), history: null as MatchHistoryEntry | null };
  const squadOf = (team: NationalTeam) => team.squadPlayerIds.map(id => { const loc = locs[id]; return loc ? updated[loc.clubId]?.[loc.index] ?? null : null; }).filter(Boolean) as Player[];
  const homeSquad = squadOf(homeTeam); const awaySquad = squadOf(awayTeam);
  if (homeSquad.length < 11 || awaySquad.length < 11) return { result: fallback(match, md.competitionLabel, date, seed), history: null as MatchHistoryEntry | null };
  const homeCoach = homeTeam.coachId ? (coaches[homeTeam.coachId] ?? fallbackCoach(homeTeam.id)) : fallbackCoach(homeTeam.id);
  const awayCoach = awayTeam.coachId ? (coaches[awayTeam.coachId] ?? fallbackCoach(awayTeam.id)) : fallbackCoach(awayTeam.id);
  const hs = NationalTeamLineupService.buildMatchSelection(homeTeam, homeSquad, homeCoach);
  const as = NationalTeamLineupService.buildMatchSelection(awayTeam, awaySquad, awayCoach);
  const envSeed = `${seed}|${homeTeam.id}|${awayTeam.id}`;
  const weather = NationalTeamEnvironmentService.getWeather(date, homeTeam, awayTeam, md.competitionLabel, envSeed);
  const attendance = NationalTeamEnvironmentService.estimateAttendance(homeTeam, awayTeam, md.competitionLabel, weather, envSeed);
  const rng = new Rng(hash(`${envSeed}|${attendance}|${weather.description}`));
  const matchId = ['NT', date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0'), homeTeam.id, awayTeam.id].join('_');
  const home: LiveTeam = { side: 'HOME', team: homeTeam, coach: homeCoach, squad: homeSquad, activeXI: [...hs.lineup.startingXI], bench: [...hs.lineup.bench], tacticId: hs.lineup.tacticId, fatigue: Object.fromEntries(homeSquad.map(p => [p.id, p.condition ?? 100])), debt: {}, minutes: {}, yellows: {}, sentOff: new Set<string>(), subs: 0, penaltyTakerId: hs.penaltyTakerId };
  const away: LiveTeam = { side: 'AWAY', team: awayTeam, coach: awayCoach, squad: awaySquad, activeXI: [...as.lineup.startingXI], bench: [...as.lineup.bench], tacticId: as.lineup.tacticId, fatigue: Object.fromEntries(awaySquad.map(p => [p.id, p.condition ?? 100])), debt: {}, minutes: {}, yellows: {}, sentOff: new Set<string>(), subs: 0, penaltyTakerId: as.penaltyTakerId };
  const goals: MatchGoalEntry[] = []; const cards: MatchCardEntry[] = []; const injuries: MatchInjuryEntry[] = []; const substitutions: MatchSubstitutionEntry[] = []; const timeline: MatchEvent[] = [];
  const homeScore = { value: 0 }; const awayScore = { value: 0 };
  let addedTime = 2; let stop = 0.5;
  for (let minute = 1; minute <= 90 + addedTime; minute++) {
    if (minute === 46 || (minute >= 58 && minute <= 88 && minute % 7 === 0)) { maybeSub(home, minute, homeScore.value, awayScore.value, substitutions, timeline); maybeSub(away, minute, homeScore.value, awayScore.value, substitutions, timeline); }
    const hm = metrics(home); const am = metrics(away);
    const phases = 1 + (rng.next() < clamp(0.06 + (hm.press + am.press) / 5200 + ((homeCoach.attributes.motivation + awayCoach.attributes.motivation) / 1200), 0.08, 0.34) ? 1 : 0);
    for (let i = 0; i < phases; i++) {
      const homeInit = clamp(0.48 + (hm.build - am.press) / 2400 + (hm.create - am.def) / 2600 + (hm.ment - am.ment) / 3000 + (homeCoach.attributes.decisionMaking - awayCoach.attributes.decisionMaking) / 900 + Math.max(0, away.sentOff.size - home.sentOff.size) * 0.055 + 0.045, 0.22, 0.78);
      const att = rng.next() < homeInit ? home : away;
      const def = att.side === 'HOME' ? away : home;
      const attM = att.side === 'HOME' ? hm : am;
      const defM = def.side === 'HOME' ? hm : am;
      const duelChance = clamp(0.065 + (attM.press + defM.aggr) / 16000 + (weather.weatherIntensity ?? 0) * 0.01, 0.065, 0.14);
      if (rng.next() < duelChance) { maybeCardOrPenalty(att, def, minute, weather.weatherIntensity ?? 0, rng, goals, cards, timeline, homeScore, awayScore); stop += 0.08; }
      else {
        maybeGoal(att, def, minute, weather.weatherIntensity ?? 0, rng, goals, timeline, attM, defM, att.side === 'HOME' ? homeScore : awayScore);
        const last = timeline[timeline.length - 1];
        if (last?.minute === minute && (last.type === MatchEventType.GOAL || last.type === MatchEventType.PENALTY_SCORED)) stop += 0.22;
      }
    }
    maybeInjury(home, minute, weather.weatherIntensity ?? 0, homeScore.value, awayScore.value, rng, injuries, substitutions, timeline);
    maybeInjury(away, minute, weather.weatherIntensity ?? 0, homeScore.value, awayScore.value, rng, injuries, substitutions, timeline);
    fatigueTick(home, minute, weather.weatherIntensity ?? 0, homeScore.value < awayScore.value);
    fatigueTick(away, minute, weather.weatherIntensity ?? 0, awayScore.value < homeScore.value);
    addedTime = clamp(2 + Math.floor(stop), 2, 7);
  }
  updatePlayers(updated, locs, date, home, away, goals, cards, injuries);
  const result: NTMatchResult = { home: homeTeam.name, away: awayTeam.name, homeGoals: homeScore.value, awayGoals: awayScore.value, competitionLabel: md.competitionLabel, matchId, homeTeamId: homeTeam.id, awayTeamId: awayTeam.id, venue: homeTeam.stadiumName, attendance, weather, addedTime, goals: [...goals].sort((a, b) => a.minute - b.minute), cards: [...cards].sort((a, b) => a.minute - b.minute), substitutions: [...substitutions].sort((a, b) => a.minute - b.minute), injuries: [...injuries].sort((a, b) => a.minute - b.minute), timeline: [...timeline].sort((a, b) => a.minute - b.minute) };
  const history: MatchHistoryEntry = { matchId, date: date.toDateString(), season, competition: md.competitionLabel, homeTeamId: homeTeam.id, awayTeamId: awayTeam.id, homeScore: homeScore.value, awayScore: awayScore.value, attendance, venue: homeTeam.stadiumName, weather, addedTime, goals: result.goals ?? [], cards: result.cards ?? [], substitutions: result.substitutions ?? [], injuries: result.injuries ?? [], timeline: result.timeline ?? [] };
  return { result, history };
};

export const NationalTeamSimulator = {
  simulateMatchDay: (
    matchDay: NTMatchDay,
    dateSeed: number,
    currentDate: Date,
    nationalTeams: NationalTeam[],
    players: Record<string, Player[]>,
    coaches: Record<string, Coach>,
    seasonNumber: number,
    sessionSeed: number = 0
  ): NationalTeamMatchDaySimulation => {
    const updatedPlayers = cloneMap(players);
    const locs = locMap(updatedPlayers);
    const byName = new Map<string, NationalTeam>(nationalTeams.map(team => [team.name, team]));
    const results: NTMatchResult[] = [];
    const matchHistoryEntries: MatchHistoryEntry[] = [];
    matchDay.matches.forEach((match, idx) => {
      const matchSeed = hash(`${sessionSeed}|${dateSeed}|${idx}|${match.home}|${match.away}`);
      const { result, history } = singleMatch(match, matchDay, currentDate, matchSeed, seasonNumber, updatedPlayers, locs, byName, coaches);
      results.push(result);
      if (history) matchHistoryEntries.push(history);
    });
    return { results, updatedPlayers, matchHistoryEntries };
  },
};
