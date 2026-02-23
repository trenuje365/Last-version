
import { WeatherSnapshot } from '../types';

export const PolandWeatherService = {
  getWeather: (date: Date, seedStr: string): WeatherSnapshot => {
    const month = date.getMonth(); // 0-11
    
    // Simple deterministic random from seed
    let hash = 0;
    for (let i = 0; i < seedStr.length; i++) {
      hash = ((hash << 5) - hash) + seedStr.charCodeAt(i);
      hash |= 0;
    }
    const rand = (Math.abs(hash) % 100) / 100;

    // Monthly Baseline (Warsaw approximation)
    const configs: Record<number, { minT: number, maxT: number, precip: number }> = {
      0: { minT: -5, maxT: 2, precip: 0.4 }, // Jan
      1: { minT: -4, maxT: 4, precip: 0.35 }, // Feb
      2: { minT: 0, maxT: 9, precip: 0.3 }, // Mar
      3: { minT: 5, maxT: 15, precip: 0.35 }, // Apr
      4: { minT: 10, maxT: 20, precip: 0.45 }, // May
      5: { minT: 14, maxT: 24, precip: 0.5 }, // Jun
      6: { minT: 16, maxT: 26, precip: 0.45 }, // Jul
      7: { minT: 15, maxT: 25, precip: 0.4 }, // Aug
      8: { minT: 10, maxT: 19, precip: 0.35 }, // Sep
      9: { minT: 5, maxT: 13, precip: 0.3 }, // Oct
      10: { minT: 1, maxT: 7, precip: 0.4 }, // Nov
      11: { minT: -2, maxT: 3, precip: 0.45 } // Dec
    };

    const config = configs[month];
    const temp = Math.floor(config.minT + rand * (config.maxT - config.minT));
    const isRaining = rand < config.precip;
    const wind = Math.floor(rand * 40);

    let desc = "Bezchmurnie";
    if (isRaining) {
      desc = temp < 1 ? "Opady śniegu" : (rand > 0.8 ? "Ulewny deszcz" : "Lekki deszcz");
    } else if (rand > 0.6) {
      desc = "Zachmurzenie umiarkowane";
    }

    return {
      tempC: temp,
      precipitationChance: isRaining ? 100 : 0,
      windKmh: wind,
      description: desc
    };
  }
};
