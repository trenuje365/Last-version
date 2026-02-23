import { MatchLiveState, PlayerPosition } from '../types';

export const TacticalBrainService = {
  // --- FILAR I: DYNAMIKA WYNIKOWA (SCORE) ---
  SCORE_RULES: [
    {
      id: 'S1', // Dominacja
      trigger: (diff: number, min: number) => diff >= 3,
      action: { mindset: 'NEUTRAL', tempo: 'SLOW', intensity: 'CAUTIOUS' },
      log: "AI: Pełna kontrola, rywale oszczędzają siły."
    },
    {
      id: 'S4', // Obrona Częstochowy
      trigger: (diff: number, min: number) => diff === 1 && min > 80,
      action: { mindset: 'DEFENSIVE', tempo: 'SLOW', intensity: 'AGGRESSIVE' },
      log: "AI: Rywale murują bramkę i grają brutalnie na czas!"
    },
    {
      id: 'S8', // Ryzyko Taktyczne
      trigger: (diff: number, min: number) => diff === -1 && min > 75,
      action: { mindset: 'OFFENSIVE', tempo: 'FAST', intensity: 'AGGRESSIVE' },
      log: "AI: Przeciwnik stawia wszystko na jedną kartę!"
    },
    {
      id: 'S9', // Alarm / Desperacja
      trigger: (diff: number, min: number) => diff <= -2,
      action: { mindset: 'OFFENSIVE', tempo: 'FAST', intensity: 'NORMAL' },
      log: "AI: Rywale rzucają się do desperackiego odrabiania strat."
    },
    // [SLOT S10] - Miejsce na przyszłe warunki wynikowe
  ],

  // --- FILAR II: INTELIGENCJA MOMENTUM ---
  MOMENTUM_RULES: [
    {
      id: 'M1', // Przerwanie nawałnicy gracza
      trigger: (mom: number) => mom > 67,
      action: { intensity: 'AGGRESSIVE', tempo: 'SLOW' },
      log: "AI: Rywale próbują brutalnie przerwać Twój rytm gry!"
    },
    {
      id: 'M2', // Wykorzystanie słabości gracza
      trigger: (mom: number) => mom < 25,
      action: { mindset: 'OFFENSIVE', intensity: 'AGGRESSIVE' },
      log: "AI: Przeciwnik wyczuł Twój kryzys i przyciska mocniej!"
    },
    // [SLOT M3] - Miejsce na przyszłe warunki momentum
  ],

  // --- FILAR III: PSYCHOLOGIA I ZDARZENIA ---
  EVENT_RULES: [
    {
      id: 'E1', // Efekt skrzydeł po golu kontaktowym
      trigger: (s: MatchLiveState, diff: number) => (s.minute - (s.lastGoalBoostMinute || 0) < 10) && diff === -1,
      action: { mindset: 'OFFENSIVE', tempo: 'FAST' },
      log: "AI: Bramka kontaktowa dodała rywalom skrzydeł! Atakują z furią!"
    },
    // [SLOT E2] - Miejsce na czerwone kartki, kontuzje itp.
  ],

  // --- FILAR IV: NORMALIZACJA (POWRÓT DO BAZY) ---
  NORMALIZATION: {
    id: 'N1',
    mindset: 'NEUTRAL',
    tempo: 'NORMAL',
    intensity: 'NORMAL'
  },

  // FUNKCJA PROCESUJĄCA
  calculate: (state: MatchLiveState, isAway: boolean) => {
    const diff = isAway ? (state.awayScore - state.homeScore) : (state.homeScore - state.awayScore);
    const mom = state.momentum;

    // Kolejność sprawdzania: Events -> Momentum -> Score
    const e = TacticalBrainService.EVENT_RULES.find(r => r.trigger(state, diff));
    if (e) return { ...e.action, id: e.id, log: e.log };

    const m = TacticalBrainService.MOMENTUM_RULES.find(r => r.trigger(mom));
    if (m) return { ...m.action, id: m.id, log: m.log };

    const s = TacticalBrainService.SCORE_RULES.find(r => r.trigger(diff, state.minute));
    if (s) return { ...s.action, id: s.id, log: s.log };

    return { ...TacticalBrainService.NORMALIZATION, log: null };
  }
};