"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayerAttributesGenerator = exports.REGION_PROFILE = exports.EUROPEAN_TIER_CONFIG = void 0;
const types_1 = require("../types");
// Constants for Generation Caps and Base Levels per Tier
// Adjusted to meet Polish League realism requirements:
// Tier 1 (Ekstraklasa): OVR > 75 is rare. Avg ~64-68.
// Tier 2 (1. Liga): OVR > 70 is rare. Avg ~58-62.
// Tier 3 (2. Liga): OVR > 65 is rare. Avg ~50-55.
// Tier 4 (Regional): OVR > 55 is rare. Avg ~40-48.
const TIER_CONFIG = {
    1: { minBase: 58, maxBase: 71, hardCap: 77 },
    2: { minBase: 50, maxBase: 64, hardCap: 71 },
    3: { minBase: 42, maxBase: 56, hardCap: 66 },
    4: { minBase: 30, maxBase: 48, hardCap: 56 },
};
exports.EUROPEAN_TIER_CONFIG = {
    1: { minBase: 80, maxBase: 92, hardCap: 99 },
    2: { minBase: 60, maxBase: 76, hardCap: 87 },
    3: { minBase: 50, maxBase: 66, hardCap: 77 },
    4: { minBase: 38, maxBase: 54, hardCap: 67 },
    5: { minBase: 28, maxBase: 44, hardCap: 57 },
};
// Profil regionu: baseOffset obniża bazę generowania, starChance to szansa na “iskrę talentu” per atrybut.
// Dotyczy wyłącznie syntetycznych zawodników kadry narodowej (generatePlayerForNT).
exports.REGION_PROFILE = {
    // Elite
    [types_1.Region.SPAIN]: { baseOffset: 0, starChance: 0.10 },
    [types_1.Region.FRANCE]: { baseOffset: 0, starChance: 0.10 },
    [types_1.Region.ENGLAND]: { baseOffset: 0, starChance: 0.10 },
    [types_1.Region.GERMANY]: { baseOffset: 0, starChance: 0.10 },
    [types_1.Region.ITALY]: { baseOffset: 0, starChance: 0.10 },
    [types_1.Region.BRAZIL]: { baseOffset: 0, starChance: 0.10 },
    [types_1.Region.ARGENTINA]: { baseOffset: 0, starChance: 0.10 },
    // Wysoki
    [types_1.Region.IBERIA]: { baseOffset: -2, starChance: 0.06 },
    [types_1.Region.MEXICO]: { baseOffset: -2, starChance: 0.06 },
    [types_1.Region.SWEDEN]: { baseOffset: -4, starChance: 0.04 },
    [types_1.Region.BENELUX]: { baseOffset: 0, starChance: 0.10 },
    // Dobry
    [types_1.Region.SCANDINAVIA]: { baseOffset: -4, starChance: 0.04 },
    [types_1.Region.CZ_SK]: { baseOffset: -4, starChance: 0.04 },
    [types_1.Region.SSA]: { baseOffset: -4, starChance: 0.04 },
    [types_1.Region.KOREA]: { baseOffset: -4, starChance: 0.04 },
    // Średnio
    [types_1.Region.POLAND]: { baseOffset: -6, starChance: 0.03 },
    [types_1.Region.BALKANS]: { baseOffset: -6, starChance: 0.03 },
    [types_1.Region.EX_USSR]: { baseOffset: -6, starChance: 0.03 },
    [types_1.Region.TURKEY]: { baseOffset: -6, starChance: 0.03 },
    [types_1.Region.JAPAN]: { baseOffset: -6, starChance: 0.03 },
    // Poniżej Średnio
    [types_1.Region.GREEK]: { baseOffset: -8, starChance: 0.02 },
    [types_1.Region.ROMANIA]: { baseOffset: -8, starChance: 0.02 },
    [types_1.Region.HUNGARIAN]: { baseOffset: -8, starChance: 0.02 },
    [types_1.Region.ISRAELI]: { baseOffset: -8, starChance: 0.02 },
    [types_1.Region.FINLAND]: { baseOffset: -8, starChance: 0.02 },
    // Niski
    [types_1.Region.ARABIA]: { baseOffset: -10, starChance: 0.015 },
    [types_1.Region.GEORGIA]: { baseOffset: -10, starChance: 0.015 },
    [types_1.Region.ALBANIA]: { baseOffset: -10, starChance: 0.015 },
    [types_1.Region.ARMENIA]: { baseOffset: -10, starChance: 0.015 },
    [types_1.Region.BALTIC]: { baseOffset: -10, starChance: 0.015 },
    // Bardzo niski
    [types_1.Region.AZERBAIJANI]: { baseOffset: -13, starChance: 0.010 },
    [types_1.Region.KAZAKH]: { baseOffset: -13, starChance: 0.010 },
    // Dno
    [types_1.Region.MALTESE]: { baseOffset: -16, starChance: 0.005 },
};
// Attribute Profiles (Weights for generation 0.0 - 1.0)
const PROFILES = {
    [types_1.PlayerPosition.GK]: {
        goalkeeping: 1.0, positioning: 0.8, strength: 0.7, passing: 0.4,
        pace: 0.3, finishing: 0.1, attacking: 0.1, defending: 0.2,
        freeKicks: 0.1, talent: 0.5, penalties: 0.4, corners: 0.1,
        aggression: 0.5, crossing: 0.1, leadership: 0.5, mentality: 0.8, workRate: 0.7
    },
    [types_1.PlayerPosition.DEF]: {
        defending: 1.0, strength: 0.9, stamina: 0.8, positioning: 0.8, heading: 0.8,
        pace: 0.6, passing: 0.5, technique: 0.4, vision: 0.3,
        finishing: 0.15, attacking: 0.1,
        goalkeeping: 0.05,
        freeKicks: 0.45, talent: 0.5, penalties: 0.4, corners: 0.3,
        aggression: 0.8, crossing: 0.4, leadership: 0.6, mentality: 0.7, workRate: 0.8
    },
    [types_1.PlayerPosition.MID]: {
        passing: 1.0, vision: 0.9, technique: 0.9, stamina: 0.9, dribbling: 0.8,
        positioning: 0.7, attacking: 0.7, pace: 0.6, defending: 0.5, finishing: 0.5, goalkeeping: 0.05,
        freeKicks: 0.7, talent: 0.7, penalties: 0.5, corners: 0.7,
        aggression: 0.6, crossing: 0.8, leadership: 0.7, mentality: 0.8, workRate: 0.9
    },
    [types_1.PlayerPosition.FWD]: {
        finishing: 1.0, attacking: 0.9, pace: 0.9, dribbling: 0.8, heading: 0.7, technique: 0.7,
        positioning: 0.8, stamina: 0.6, strength: 0.6, passing: 0.5, defending: 0.2, goalkeeping: 0.05,
        freeKicks: 0.6, talent: 0.8, penalties: 0.8, corners: 0.4,
        aggression: 0.7, crossing: 0.4, leadership: 0.5, mentality: 0.7, workRate: 0.7
    }
};
// Weights for calculating Overall Rating
const OVR_WEIGHTS = {
    [types_1.PlayerPosition.GK]: { goalkeeping: 0.85, positioning: 0.10, passing: 0.05 },
    [types_1.PlayerPosition.DEF]: { defending: 0.35, positioning: 0.20, strength: 0.15, heading: 0.10, pace: 0.10, passing: 0.10 },
    [types_1.PlayerPosition.MID]: { passing: 0.30, vision: 0.20, technique: 0.15, dribbling: 0.10, defending: 0.10, stamina: 0.10, attacking: 0.05 },
    [types_1.PlayerPosition.FWD]: { finishing: 0.35, attacking: 0.25, pace: 0.15, dribbling: 0.10, heading: 0.10, strength: 0.05 }
};
exports.PlayerAttributesGenerator = {
    generateAttributes: (position, leagueTier, clubReputation, age, isEuropean = false, talentConfig, regionProfile) => {
        // 1. Determine Base Level based on Tier
        const configTable = isEuropean ? exports.EUROPEAN_TIER_CONFIG : TIER_CONFIG;
        const config = talentConfig ?? (configTable[leagueTier] || configTable[4]);
        // Reputation Bonus (0 to 5)
        const repBonus = Math.min(5, Math.max(0, clubReputation - 2));
        const tierBase = config.minBase + Math.random() * (config.maxBase - config.minBase) + repBonus + (regionProfile?.baseOffset ?? 0);
        // 2. Generate individual attributes based on Profile
        const profile = PROFILES[position];
        const generated = {};
        // Rare defender archetypes: most defenders stay average on set pieces,
        // but a small subset can spawn as genuine specialists.
        const isDefFreeKickSpecialist = position === types_1.PlayerPosition.DEF && Math.random() < 0.10;
        const isDefPenaltySpecialist = position === types_1.PlayerPosition.DEF && Math.random() < 0.05;
        const allKeys = [
            'strength', 'stamina', 'pace', 'defending', 'passing', 'attacking',
            'finishing', 'technique', 'vision', 'dribbling', 'heading', 'positioning', 'goalkeeping',
            'freeKicks', 'talent', 'penalties', 'corners', 'aggression', 'crossing', 'leadership', 'mentality', 'workRate'
        ];
        allKeys.forEach(key => {
            // SPECIAL RULES
            if (['pace', 'strength', 'stamina'].includes(key)) {
                // 1. Podstawowy zakres 45-99 niezależnie od ligi
                let val = 45 + Math.floor(Math.random() * 55);
                // 2. Modyfikator profilu (tendencja dla pozycji)
                const weight = profile[key] || 0.5;
                if (weight >= 0.8)
                    val += 5;
                if (weight <= 0.3)
                    val -= 10;
                // 3. Twarde limity wiekowe (Kaskada PRO)
                if (age >= 35)
                    val = Math.min(val, 80);
                else if (age > 33)
                    val = Math.min(val, 87);
                else if (age > 30)
                    val = Math.min(val, 91);
                generated[key] = Math.max(45, Math.min(99, val));
                return;
            }
            if (position === types_1.PlayerPosition.GK && ['dribbling', 'heading', 'attacking', 'finishing'].includes(key)) {
                generated[key] = Math.floor(Math.random() * 32) + 1;
                return;
            }
            if (key === 'goalkeeping' && position !== types_1.PlayerPosition.GK) {
                generated[key] = Math.floor(Math.random() * 15) + 1;
                return;
            }
            if (position === types_1.PlayerPosition.DEF && key === 'freeKicks' && isDefFreeKickSpecialist) {
                generated[key] = Math.floor(60 + Math.random() * 26); // 60-85
                return;
            }
            if (position === types_1.PlayerPosition.DEF && key === 'penalties' && isDefPenaltySpecialist) {
                generated[key] = Math.floor(55 + Math.random() * 31); // 55-85
                return;
            }
            // STANDARD ATTRIBUTE GENERATION
            const weight = profile[key] !== undefined ? profile[key] : 0.5;
            let value = tierBase;
            if (weight >= 0.8) {
                value += Math.random() * 12;
            }
            else if (weight >= 0.5) {
                value += (Math.random() * 8) - 4;
            }
            else if (weight >= 0.35) {
                value -= (Math.random() * 15) + 5;
            }
            else {
                const multiplier = 0.4 + (weight * 0.5);
                value = (tierBase * multiplier) + ((Math.random() * 10) - 5);
            }
            const attrCap = position === types_1.PlayerPosition.DEF && (key === 'freeKicks' || key === 'penalties')
                ? 85
                : config.hardCap;
            value = Math.max(1, Math.min(Math.floor(value), attrCap));
            if (Math.random() < (regionProfile?.starChance ?? 0.04)) {
                value = Math.min(99, value + Math.floor(Math.random() * 12) + 3);
            }
            generated[key] = value;
        });
        const finalAttributes = generated;
        const overall = exports.PlayerAttributesGenerator.calculateOverall(finalAttributes, position);
        return { attributes: finalAttributes, overall };
    },
    calculateOverall: (attrs, position) => {
        const weights = OVR_WEIGHTS[position];
        let weightedSum = 0;
        let totalWeight = 0;
        // Use Object.entries for type-safe iteration over Partial Record
        Object.entries(weights).forEach(([key, w]) => {
            const k = key;
            const weightVal = w || 0;
            weightedSum += attrs[k] * weightVal;
            totalWeight += weightVal;
        });
        if (totalWeight === 0)
            return 50;
        return Math.round(weightedSum / totalWeight);
    }
};
