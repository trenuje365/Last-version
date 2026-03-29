import { Club, Player, PlayerPosition, Coach, InstructionTempo, InstructionMindset, InstructionIntensity } from '../types';
import { TacticRepository } from '../resources/tactics_db';

type AiInstructions = { tempo: InstructionTempo; mindset: InstructionMindset; intensity: InstructionIntensity };

const seededRng = (seed: number, minute: number, offset: number = 0): number => {
  let s = seed + minute + offset;
  const x = Math.sin(s) * 10000;
  return x - Math.floor(x);
};

// Reguły spójności: DEFENSIVE nigdy FAST; OFFENSIVE nigdy SLOW ani CAUTIOUS
const enforceConsistency = (m: InstructionMindset, t: InstructionTempo, i: InstructionIntensity): AiInstructions => {
  let tempo = t, mindset = m, intensity = i;
  if (mindset === 'DEFENSIVE' && tempo === 'FAST') tempo = 'NORMAL';
  if (mindset === 'OFFENSIVE') {
    if (tempo === 'SLOW') tempo = 'NORMAL';
    if (intensity === 'CAUTIOUS') intensity = 'NORMAL';
  }
  return { tempo, mindset, intensity };
};

const getTopLineAvg = (players: Player[], pos: PlayerPosition, topN: number): number => {
  const line = players
    .filter(p => p.position === pos)
    .sort((a, b) => b.overallRating - a.overallRating)
    .slice(0, topN);
  if (line.length === 0) return 60;
  return line.reduce((s, p) => s + p.overallRating, 0) / line.length;
};

export const AiCoachTacticsService = {

  // ─── ANALIZA PRZEDMECZOWA ─────────────────────────────────────────────────
  // Trener AI analizuje drużynę gracza i ustawia instrukcje startowe.
  // decisionMaking → jakość analizy; experience → zakres analizowanych sygnałów.
  decidePreMatchInstructions: (
    ownClub: Club,
    ownCoach: Coach | null,
    userClub: Club,
    userPlayers: Player[],
    userTacticId: string,
    seed: number
  ): AiInstructions => {
    const decisionMaking = ownCoach?.attributes.decisionMaking ?? 50;
    const experience = ownCoach?.attributes.experience ?? 50;

    const userFwdAvg = getTopLineAvg(userPlayers, PlayerPosition.FWD, 3);
    const userDefAvg = getTopLineAvg(userPlayers, PlayerPosition.DEF, 4);
    const userTacticDefBias = TacticRepository.getById(userTacticId)?.defenseBias ?? 50;
    const repDiff = ownClub.reputation - userClub.reputation;

    // Suma sygnałów: dodatnia = sugeruje OFFENSIVE, ujemna = sugeruje DEFENSIVE
    let signalScore = 0;

    // Niedoświadczony trener patrzy tylko na reputację (1 sygnał)
    if (experience < 40) {
      signalScore = repDiff >= 2 ? 1 : repDiff <= -2 ? -1 : 0;
    } else {
      // Słaba obrona gracza → atak
      if (userDefAvg < 58) signalScore += 2;
      else if (userDefAvg < 65) signalScore += 1;
      // Mocny atak gracza → obrona
      if (userFwdAvg > 72) signalScore -= 2;
      else if (userFwdAvg > 65) signalScore -= 1;
      // Taktyka gracza
      if (userTacticDefBias > 65) signalScore += 1;
      if (userTacticDefBias < 40) signalScore -= 1;
      // Reputacja
      if (repDiff >= 3) signalScore += 2;
      else if (repDiff >= 1) signalScore += 1;
      else if (repDiff <= -3) signalScore -= 2;
      else if (repDiff <= -1) signalScore -= 1;
    }

    let mindset: InstructionMindset;
    let tempo: InstructionTempo;
    let intensity: InstructionIntensity;

    if (signalScore >= 2) {
      mindset = 'OFFENSIVE'; tempo = 'FAST'; intensity = 'NORMAL';
    } else if (signalScore <= -2) {
      mindset = 'DEFENSIVE'; tempo = 'SLOW'; intensity = 'CAUTIOUS';
    } else {
      mindset = 'NEUTRAL'; tempo = 'NORMAL'; intensity = 'NORMAL';
    }

    // Słaby decisionMaking → losowe odchylenie od analizy
    if (decisionMaking < 40) {
      const rng1 = seededRng(seed, 0, 301);
      if (rng1 < 0.35) {
        const rng2 = seededRng(seed, 0, 302);
        const opts: InstructionMindset[] = ['DEFENSIVE', 'NEUTRAL', 'OFFENSIVE'];
        mindset = opts[Math.floor(rng2 * 3)];
      }
    }

    return enforceConsistency(mindset, tempo, intensity);
  },

  // ─── DECYZJA W TRAKCIE MECZU ─────────────────────────────────────────────
  // Co 10-20 min trener AI ocenia sytuację i aktualizuje instrukcje.
  // Zwraca null jeśli trener decyduje się nic nie zmieniać.
  decideInMatchInstructions: (
    aiScoreDiff: number,       // aiScore - userScore (perspektywa AI)
    aiMomentum: number,        // pozytywny = AI dominuje, ujemny = gracz dominuje
    minute: number,
    decisionMaking: number,
    experience: number,
    lastGoalBoostMinute: number,
    seed: number
  ): AiInstructions | null => {
    const rng1 = seededRng(seed, minute, 401);
    const rng2 = seededRng(seed, minute, 402);
    const rng3 = seededRng(seed, minute, 403);

    // Szansa braku reakcji — słaby trener często się waha
    const noActionChance = decisionMaking < 40 ? 0.40 : decisionMaking < 60 ? 0.15 : 0.05;
    if (rng1 < noActionChance) return null;

    // Doświadczony trener reaguje wcześniej na niekorzystny wynik
    const lateThreshold = experience > 70 ? 40 : experience > 50 ? 55 : 65;

    let mindset: InstructionMindset = 'NEUTRAL';
    let tempo: InstructionTempo = 'NORMAL';
    let intensity: InstructionIntensity = 'NORMAL';

    // Priorytet 1: Gol kontaktowy przy wyniku -1 → impuls
    const recentContactGoal = (minute - lastGoalBoostMinute) < 10 && aiScoreDiff === -1;
    if (recentContactGoal) {
      return enforceConsistency('OFFENSIVE', 'FAST', 'NORMAL');
    }

    // Priorytet 2: Wynikowe
    if (aiScoreDiff <= -2) {
      mindset = 'OFFENSIVE'; tempo = 'FAST'; intensity = 'NORMAL';
    } else if (aiScoreDiff === -1 && minute >= lateThreshold) {
      mindset = 'OFFENSIVE'; tempo = 'FAST'; intensity = 'AGGRESSIVE';
    } else if (aiScoreDiff === -1) {
      mindset = 'OFFENSIVE'; tempo = 'NORMAL'; intensity = 'NORMAL';
    } else if (aiScoreDiff >= 3) {
      mindset = 'NEUTRAL'; tempo = 'SLOW'; intensity = 'CAUTIOUS';
    } else if (aiScoreDiff === 1 && minute > 80) {
      mindset = 'DEFENSIVE'; tempo = 'SLOW'; intensity = 'AGGRESSIVE';
    } else if (aiScoreDiff === 1 && minute > 70) {
      mindset = 'DEFENSIVE'; tempo = 'SLOW'; intensity = 'NORMAL';
    // Priorytet 3: Momentum
    } else if (aiMomentum < -67) {
      // Gracz dominuje — przerwij rytm agresją
      mindset = 'NEUTRAL'; tempo = 'SLOW'; intensity = 'AGGRESSIVE';
    } else if (aiMomentum > 50 && aiScoreDiff === 0) {
      // AI dominuje przy remisie — wykorzystaj impet
      mindset = 'OFFENSIVE'; tempo = 'FAST'; intensity = 'NORMAL';
    } else {
      return null;
    }

    // Odchylenie dla słabego decisionMaking
    if (decisionMaking < 50) {
      const deviationChance = (50 - decisionMaking) / 100;
      if (rng2 < deviationChance) {
        const which = Math.floor(rng3 * 3);
        if (which === 0) {
          const tempos: InstructionTempo[] = ['SLOW', 'NORMAL', 'FAST'];
          tempo = tempos[Math.floor(rng3 * 3)];
        } else if (which === 1) {
          const mindsets: InstructionMindset[] = ['DEFENSIVE', 'NEUTRAL', 'OFFENSIVE'];
          mindset = mindsets[Math.floor(rng3 * 3)];
        } else {
          const intensities: InstructionIntensity[] = ['CAUTIOUS', 'NORMAL', 'AGGRESSIVE'];
          intensity = intensities[Math.floor(rng3 * 3)];
        }
      }
    }

    return enforceConsistency(mindset, tempo, intensity);
  },
};
