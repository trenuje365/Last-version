"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NationalTeamEnvironmentService = void 0;
const CLIMATE_BY_CONTINENT = {
    europe: {
        winter: [-6, 6],
        spring: [4, 18],
        summer: [14, 30],
        autumn: [3, 18],
        rainBias: 0.22,
        windBias: 0.18,
    },
    africa: {
        winter: [13, 29],
        spring: [18, 34],
        summer: [20, 38],
        autumn: [17, 33],
        rainBias: 0.14,
        windBias: 0.14,
    },
    asia: {
        winter: [-3, 16],
        spring: [8, 27],
        summer: [18, 36],
        autumn: [7, 25],
        rainBias: 0.18,
        windBias: 0.16,
    },
    'north america': {
        winter: [-4, 13],
        spring: [7, 24],
        summer: [17, 34],
        autumn: [6, 22],
        rainBias: 0.17,
        windBias: 0.19,
    },
    'south america': {
        winter: [8, 24],
        spring: [13, 29],
        summer: [19, 34],
        autumn: [12, 28],
        rainBias: 0.18,
        windBias: 0.13,
    },
    oceania: {
        winter: [7, 18],
        spring: [11, 23],
        summer: [17, 29],
        autumn: [10, 22],
        rainBias: 0.19,
        windBias: 0.17,
    },
};
const DEFAULT_PROFILE = {
    winter: [2, 12],
    spring: [8, 21],
    summer: [16, 30],
    autumn: [7, 19],
    rainBias: 0.18,
    windBias: 0.16,
};
const hashString = (value) => {
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
        hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0;
    }
    return hash >>> 0;
};
const createSeeded = (seed) => {
    let state = hashString(seed) || 1;
    return () => {
        state = (state * 1664525 + 1013904223) >>> 0;
        return state / 0x100000000;
    };
};
const getSeasonKey = (month) => {
    if (month === 11 || month <= 1)
        return 'winter';
    if (month >= 2 && month <= 4)
        return 'spring';
    if (month >= 5 && month <= 7)
        return 'summer';
    return 'autumn';
};
const clamp = (value, min, max) => {
    return Math.max(min, Math.min(max, value));
};
exports.NationalTeamEnvironmentService = {
    getWeather: (date, homeTeam, awayTeam, competitionLabel, seed) => {
        const rng = createSeeded([
            seed,
            homeTeam.name,
            awayTeam.name,
            competitionLabel,
            date.toISOString(),
        ].join('|'));
        const profile = CLIMATE_BY_CONTINENT[homeTeam.continent.toLowerCase()] ?? DEFAULT_PROFILE;
        const seasonKey = getSeasonKey(date.getMonth());
        const [minTemp, maxTemp] = profile[seasonKey];
        const tempC = Math.round(minTemp + rng() * (maxTemp - minTemp));
        const windKmh = Math.round(4 + rng() * (18 + profile.windBias * 80));
        const wetRoll = rng();
        const stormRoll = rng();
        let description = 'Clear sky';
        let precipitationChance = 0;
        let weatherIntensity = 0;
        if (stormRoll < profile.rainBias * 0.14) {
            description = tempC <= 1 ? 'Snow storm' : 'Thunderstorm';
            precipitationChance = 100;
            weatherIntensity = 1.0;
        }
        else if (wetRoll < profile.rainBias) {
            description = tempC <= 1 ? 'Snowfall' : 'Heavy rain';
            precipitationChance = 100;
            weatherIntensity = 0.72;
        }
        else if (wetRoll < profile.rainBias + 0.18) {
            description = tempC <= 1 ? 'Sleet' : 'Light rain';
            precipitationChance = 85;
            weatherIntensity = 0.36;
        }
        else if (windKmh >= 34) {
            description = 'Strong wind';
            precipitationChance = 15;
            weatherIntensity = 0.28;
        }
        else if (tempC >= 31) {
            description = 'Heat';
            precipitationChance = 0;
            weatherIntensity = 0.48;
        }
        else if (tempC <= -3) {
            description = 'Frost';
            precipitationChance = 0;
            weatherIntensity = 0.32;
        }
        else if (rng() < 0.25) {
            description = 'Cloudy';
            precipitationChance = 10;
            weatherIntensity = 0.06;
        }
        return {
            tempC,
            precipitationChance,
            windKmh,
            description,
            weatherIntensity,
        };
    },
    estimateAttendance: (homeTeam, awayTeam, competitionLabel, weather, seed) => {
        const rng = createSeeded([
            seed,
            homeTeam.name,
            awayTeam.name,
            competitionLabel,
            weather.description,
        ].join('|'));
        const repFactor = clamp((homeTeam.reputation + awayTeam.reputation) / 38, 0.45, 0.95);
        const prestigeBonus = /world cup|mś|euro|liga narodow|nations/i.test(competitionLabel) ? 0.12 : 0.04;
        const weatherPenalty = weather.weatherIntensity && weather.weatherIntensity >= 0.7
            ? 0.18
            : weather.weatherIntensity && weather.weatherIntensity >= 0.35
                ? 0.08
                : 0.0;
        const fillRatio = clamp(0.42 + repFactor * 0.42 + prestigeBonus - weatherPenalty + ((rng() - 0.5) * 0.12), 0.22, 0.98);
        return Math.max(1000, Math.round(homeTeam.stadiumCapacity * fillRatio));
    },
};
