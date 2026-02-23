import { MatchLiveState, MatchContext, Player, PlayerPosition, MatchEventType, MatchLogEntry, WeatherSnapshot } from '../types';

export const MatchEngineService = {
  calculateFatigueStep: (state: MatchLiveState, ctx: MatchContext, weather?: WeatherSnapshot): { home: Record<string, number>, away: Record<string, number> } => {
    const homeFatigue = { ...state.homeFatigue };
    const awayFatigue = { ...state.awayFatigue };

    // Pressure Multiplier: Teams under heavy momentum pressure (>75% for opponent) drain faster
    const homePressureFactor = state.momentum < -75 ? 1.35 : 1.0;
    const awayPressureFactor = state.momentum > 75 ? 1.35 : 1.0;

    const update = (players: Player[], fatigueMap: Record<string, number>, sideLineup: (string | null)[], pressureFactor: number) => {
      players.forEach(p => {
        if (!sideLineup.includes(p.id)) return;

        const current = fatigueMap[p.id] !== undefined ? fatigueMap[p.id] : 100;
        
        let drain = 0.17 * pressureFactor;

        if (p.position === PlayerPosition.DEF) drain *= 1.35;
        if (p.position === PlayerPosition.MID) drain *= 1.35;
        if (p.position === PlayerPosition.FWD) drain *= 1.20;
 // Bramkarz męczy się o 90% wolniej (logika stała)
        if (p.position === PlayerPosition.GK) drain *= 0.07;

        // TUTAJ WSTAW TEN KOD - Losowy czynnik zmęczenia dla każdego (zakres 0.8x - 1.2x)
        const intensityChaos = 0.8 + (Math.random() * 0.4);
        drain *= intensityChaos;

        const staminaBonus = Math.pow((p.attributes.stamina || 50) / 100, 2); 
        const efficiency = 1.3 - (staminaBonus * 0.6); 
        
        drain *= efficiency;

        if (weather && weather.precipitationChance > 0) drain *= 1.08;
        if (weather && weather.tempC > 30) drain *= 1.10;

        fatigueMap[p.id] = Math.max(0, current - drain);
      });
    };

    update(ctx.homePlayers, homeFatigue, state.homeLineup.startingXI, homePressureFactor);
    update(ctx.awayPlayers, awayFatigue, state.awayLineup.startingXI, awayPressureFactor);

    return { home: homeFatigue, away: awayFatigue };
  },

  generateCommentary: (minute: number, seed: number, homeShort: string, awayShort: string): MatchLogEntry | null => {
    if (minute % 9 !== 0 || minute === 0) return null;

    const phrases = [
      "[{TEAM}] kontroluje tempo gry dzięki świetnej technice w środku pola.",
      "Defensywa [{TEAM}] czyta grę bezbłędnie, blokując każdą próbę ataku.",
      "Siła fizyczna zawodników [{TEAM}] pozwala im wygrywać większość pojedynków.",
      "[{TEAM}] szuka szybkich skrzydeł, wykorzystując szybkość swoich napastników.",
      "Bramkarz [{TEAM}] dyryguje obroną, świetnie się ustawiając.",
      "Wizja gry pomocników [{TEAM}] imponuje, szukają prostopadłych podań.",
      "Mocny pressing [{TEAM}] zmusza rywala do błędów technicznych.",
      "[{TEAM}] dominuje fizycznie, spychając przeciwnika pod własne pole karne.",
      "Elegancka gra [{TEAM}], piłka chodzi od nogi do nogi jak po sznurku.",
      "Znakomite ustawienie defensywne [{TEAM}] uniemożliwia oddanie strzału."
    ];

    const teamSide: 'HOME' | 'AWAY' = (minute + seed) % 2 === 0 ? 'HOME' : 'AWAY';
    const teamName = teamSide === 'HOME' ? homeShort : awayShort;
    
    const idx = (minute + seed) % phrases.length;
    const text = phrases[idx].replace("{TEAM}", teamName);

    return {
      id: `LOG_GENERIC_${minute}_${seed}`,
      minute,
      text,
      teamSide,
      type: MatchEventType.GENERIC
    };
  }
};