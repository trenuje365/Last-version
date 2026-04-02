"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SquadGeneratorService = exports.SquadValidator = exports.MAX_SQUAD_SIZE = exports.MIN_SQUAD_SIZE = void 0;
const types_1 = require("../types");
const NameGeneratorService_1 = require("./NameGeneratorService");
const PlayerAttributesGenerator_1 = require("./PlayerAttributesGenerator");
const constants_1 = require("../constants");
const FinanceService_1 = require("./FinanceService");
// STAGE 2 CONSTANTS
exports.MIN_SQUAD_SIZE = 29;
exports.MAX_SQUAD_SIZE = 35;
const FOREIGNER_COUNT = 10;
// Regiony dozwolone dla cudzoziemców w polskich klubach (bez Francji, Niemiec, Anglii, Włoch)
const POLISH_CLUB_FOREIGN_REGIONS = [
    types_1.Region.BALKANS,
    types_1.Region.CZ_SK,
    types_1.Region.SSA,
    types_1.Region.IBERIA,
    types_1.Region.SCANDINAVIA,
    types_1.Region.EX_USSR,
    types_1.Region.SPAIN,
    types_1.Region.JAPAN,
    types_1.Region.KOREA,
    types_1.Region.ARGENTINA,
    types_1.Region.BRAZIL,
    types_1.Region.TURKEY,
    types_1.Region.ARABIA,
    types_1.Region.FINLAND,
    types_1.Region.GEORGIA,
    types_1.Region.ARMENIA,
    types_1.Region.ALBANIA,
    types_1.Region.ROMANIA,
    types_1.Region.BALTIC,
    types_1.Region.BENELUX,
    types_1.Region.HUNGARIAN,
    types_1.Region.MALTESE,
    types_1.Region.ISRAELI,
    types_1.Region.GREEK,
    types_1.Region.AZERBAIJANI,
    types_1.Region.KAZAKH,
];
const getRandomPolishClubForeignRegion = (leagueTier) => {
    const brazilWeight = leagueTier <= 2 ? 5 : 0;
    const argentinaWeight = 1;
    const others = POLISH_CLUB_FOREIGN_REGIONS.filter(r => r !== types_1.Region.BRAZIL && r !== types_1.Region.ARGENTINA);
    const otherWeight = (100 - brazilWeight - argentinaWeight) / others.length;
    const roll = Math.random() * 100;
    if (roll < brazilWeight)
        return types_1.Region.BRAZIL;
    if (roll < brazilWeight + argentinaWeight)
        return types_1.Region.ARGENTINA;
    const idx = Math.floor((roll - brazilWeight - argentinaWeight) / otherWeight);
    return others[Math.min(idx, others.length - 1)];
};
const GK_COUNT = 4;
const DEF_COUNT = 10;
const MID_COUNT = 10;
const FWD_COUNT = 9;
const buildStandardSlots = () => [
    ...Array(3).fill({ pos: types_1.PlayerPosition.GK }),
    ...Array(8).fill({ pos: types_1.PlayerPosition.DEF }),
    ...Array(10).fill({ pos: types_1.PlayerPosition.MID }),
    ...Array(9).fill({ pos: types_1.PlayerPosition.FWD }),
];
const getLocalRegionForInternationalClub = (country, continent) => {
    const map = {
        ARG: types_1.Region.ARGENTINA,
        BRA: types_1.Region.BRAZIL,
        URU: types_1.Region.SOUTH_AMERICAN,
        COL: types_1.Region.SOUTH_AMERICAN,
        ECU: types_1.Region.SOUTH_AMERICAN,
        CHI: types_1.Region.SOUTH_AMERICAN,
        PAR: types_1.Region.SOUTH_AMERICAN,
        PER: types_1.Region.SOUTH_AMERICAN,
        BOL: types_1.Region.SOUTH_AMERICAN,
        VEN: types_1.Region.SOUTH_AMERICAN,
        JPN: types_1.Region.JAPAN,
        KOR: types_1.Region.KOREA,
        PRK: types_1.Region.KOREA,
        KSA: types_1.Region.ARABIA,
        UAE: types_1.Region.ARABIA,
        QAT: types_1.Region.ARABIA,
        OMA: types_1.Region.ARABIA,
        KUW: types_1.Region.ARABIA,
        IRQ: types_1.Region.ARABIA,
        IRN: types_1.Region.ARABIA,
        JOR: types_1.Region.ARABIA,
        LBN: types_1.Region.ARABIA,
        SYR: types_1.Region.ARABIA,
        YEM: types_1.Region.ARABIA,
        AFG: types_1.Region.ARABIA,
        BGD: types_1.Region.ARABIA,
        IND: types_1.Region.ARABIA,
        NPL: types_1.Region.ARABIA,
        PAK: types_1.Region.ARABIA,
        LKA: types_1.Region.ARABIA,
        MDV: types_1.Region.ARABIA,
        CHN: types_1.Region.JAPAN,
        HKG: types_1.Region.JAPAN,
        IDN: types_1.Region.JAPAN,
        THA: types_1.Region.JAPAN,
        VIE: types_1.Region.JAPAN,
        MYS: types_1.Region.JAPAN,
        PHL: types_1.Region.JAPAN,
        SGP: types_1.Region.JAPAN,
        KHM: types_1.Region.JAPAN,
        LAO: types_1.Region.JAPAN,
        MMR: types_1.Region.JAPAN,
        MNG: types_1.Region.JAPAN,
        BTN: types_1.Region.JAPAN,
        KAZ: types_1.Region.KAZAKH,
        KGZ: types_1.Region.KAZAKH,
        TJK: types_1.Region.KAZAKH,
        UZB: types_1.Region.KAZAKH,
        TKM: types_1.Region.KAZAKH,
        EGY: types_1.Region.ARABIA,
        TUN: types_1.Region.ARABIA,
        MAR: types_1.Region.ARABIA,
        ALG: types_1.Region.ARABIA,
        LBY: types_1.Region.ARABIA,
        MRT: types_1.Region.ARABIA,
        SDN: types_1.Region.ARABIA,
        USA: types_1.Region.ENGLAND,
        CAN: types_1.Region.ENGLAND,
        MEX: types_1.Region.MEXICO,
        CRC: types_1.Region.IBERIA,
        HON: types_1.Region.IBERIA,
        GUA: types_1.Region.IBERIA,
        SLV: types_1.Region.IBERIA,
        NIC: types_1.Region.IBERIA,
        PAN: types_1.Region.IBERIA,
        DOM: types_1.Region.IBERIA,
        CUB: types_1.Region.IBERIA,
        JAM: types_1.Region.ENGLAND,
        TTO: types_1.Region.ENGLAND,
        HAI: types_1.Region.FRANCE,
    };
    if (map[country])
        return map[country];
    if (continent === 'Africa')
        return types_1.Region.SSA;
    if (continent === 'North America')
        return types_1.Region.IBERIA;
    if (continent === 'South America')
        return types_1.Region.SOUTH_AMERICAN;
    return types_1.Region.ARABIA;
};
const getForeignRegionForInternationalClub = (continent, clubCountry) => {
    if (clubCountry !== 'MEX') {
        const mexicoChance = continent === 'North America' ? 0.18 : 0.03;
        if (Math.random() < mexicoChance) {
            return types_1.Region.MEXICO;
        }
    }
    const pools = {
        Asia: [types_1.Region.JAPAN, types_1.Region.KOREA, types_1.Region.ARABIA, types_1.Region.KAZAKH, types_1.Region.SSA, types_1.Region.IBERIA, types_1.Region.BRAZIL],
        Africa: [types_1.Region.SSA, types_1.Region.ARABIA, types_1.Region.IBERIA, types_1.Region.FRANCE, types_1.Region.ENGLAND, types_1.Region.BRAZIL],
        'North America': [types_1.Region.IBERIA, types_1.Region.ENGLAND, types_1.Region.BRAZIL, types_1.Region.ARGENTINA, types_1.Region.FRANCE],
        'South America': [types_1.Region.SOUTH_AMERICAN, types_1.Region.BRAZIL, types_1.Region.ARGENTINA, types_1.Region.IBERIA, types_1.Region.ENGLAND],
    };
    const pool = pools[continent];
    return pool[Math.floor(Math.random() * pool.length)];
};
const getRandomGlobalClubForeignRegion = (mexicoChance = 0) => {
    if (mexicoChance > 0 && Math.random() < mexicoChance) {
        return types_1.Region.MEXICO;
    }
    return NameGeneratorService_1.NameGeneratorService.getRandomForeignRegion();
};
exports.SquadValidator = {
    isValidSize: (count) => count >= 29 && count <= 35,
    validateComposition: (players) => {
        const gk = players.filter(p => p.position === types_1.PlayerPosition.GK).length;
        const def = players.filter(p => p.position === types_1.PlayerPosition.DEF).length;
        const mid = players.filter(p => p.position === types_1.PlayerPosition.MID).length;
        const fwd = players.filter(p => p.position === types_1.PlayerPosition.FWD).length;
        return (gk >= 2 &&
            def >= 6 &&
            mid >= 6 &&
            fwd >= 4);
    }
};
exports.SquadGeneratorService = {
    generateSquadForClub: (clubId) => {
        const usedNames = new Set();
        const clubInfo = constants_1.STATIC_CLUBS.find(c => c.id === clubId);
        let leagueTier = 4;
        let clubRep = 1;
        if (clubInfo) {
            if (clubInfo.leagueId === 'L_PL_1')
                leagueTier = 1;
            else if (clubInfo.leagueId === 'L_PL_2')
                leagueTier = 2;
            else if (clubInfo.leagueId === 'L_PL_3')
                leagueTier = 3;
            else
                leagueTier = 4;
            clubRep = clubInfo.reputation;
        }
        // 1. Define composition slots
        const targetSize = Math.floor(Math.random() * (exports.MAX_SQUAD_SIZE - exports.MIN_SQUAD_SIZE + 1)) + exports.MIN_SQUAD_SIZE;
        const slots = [];
        for (let i = 0; i < targetSize; i++) {
            let pos;
            if (i < 3)
                pos = types_1.PlayerPosition.GK;
            else if (i < 11)
                pos = types_1.PlayerPosition.DEF;
            else if (i < 19)
                pos = types_1.PlayerPosition.MID;
            else if (i < 26)
                pos = types_1.PlayerPosition.FWD;
            else {
                const extra = i - 26;
                if (extra === 0)
                    pos = types_1.PlayerPosition.GK;
                else if (extra % 3 === 1)
                    pos = types_1.PlayerPosition.DEF;
                else if (extra % 3 === 2)
                    pos = types_1.PlayerPosition.MID;
                else
                    pos = types_1.PlayerPosition.FWD;
            }
            slots.push({ pos, isForeign: false });
        }
        const indices = Array.from({ length: slots.length }, (_, i) => i);
        // Fisher-Yates shuffle
        for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }
        for (let i = 0; i < FOREIGNER_COUNT; i++) {
            if (indices[i] !== undefined) {
                slots[indices[i]].isForeign = true;
            }
        }
        // 2. Generate Players (Temporary pool for weight calculation)
        const squadBase = slots.map((slot, index) => {
            let namePair;
            let fullName;
            let region = slot.isForeign ? getRandomPolishClubForeignRegion(leagueTier) : types_1.Region.POLAND;
            let attempts = 0;
            do {
                namePair = NameGeneratorService_1.NameGeneratorService.getRandomName(region);
                fullName = `${namePair.firstName} ${namePair.lastName}`;
                attempts++;
            } while (usedNames.has(fullName) && attempts < 50);
            usedNames.add(fullName);
            const age = 16 + Math.floor(Math.random() * 20);
            const genData = PlayerAttributesGenerator_1.PlayerAttributesGenerator.generateAttributes(slot.pos, leagueTier, clubRep, age);
            return {
                id: `PL_${clubId}_${String(index).padStart(2, '0')}`,
                firstName: namePair.firstName,
                lastName: namePair.lastName,
                clubId: clubId,
                position: slot.pos,
                nationality: region,
                age: age,
                fatigueDebt: 0,
                overallRating: genData.overall,
                attributes: genData.attributes,
                stats: {
                    matchesPlayed: 0,
                    minutesPlayed: 0,
                    goals: 0,
                    assists: 0,
                    yellowCards: 0,
                    redCards: 0,
                    cleanSheets: 0,
                    seasonalChanges: {},
                    ratingHistory: []
                },
                health: {
                    status: types_1.HealthStatus.HEALTHY
                },
                condition: 100,
                suspensionMatches: 0,
                // Kontrakt wygasa za 1-3 lata (30 czerwca)
                contractEndDate: new Date(new Date().getFullYear() + 1 + Math.floor(Math.random() * 3), 5, 30).toISOString(),
                history: [{
                        clubName: clubInfo?.name || "Nieznany Klub",
                        clubId: clubId,
                        fromYear: 2024,
                        fromMonth: 7,
                        toYear: null,
                        toMonth: null
                    }]
            };
        });
        // TALENT MECHANIC: Tier 3/4 — 5% szans na 1 talent, 1% szans na 2. talent
        if (leagueTier >= 3) {
            const TALENT_CONFIG = { minBase: 70, maxBase: 80, hardCap: 88 };
            const injectTalent = (squad) => {
                const idx = Math.floor(Math.random() * squad.length);
                const p = squad[idx];
                const talentAge = 17 + Math.floor(Math.random() * 7);
                const genData = PlayerAttributesGenerator_1.PlayerAttributesGenerator.generateAttributes(p.position, leagueTier, clubRep, talentAge, false, TALENT_CONFIG);
                squad[idx] = { ...p, age: talentAge, overallRating: genData.overall, attributes: genData.attributes };
            };
            if (Math.random() < 0.05) {
                injectTalent(squadBase);
                if (Math.random() < 0.01) {
                    injectTalent(squadBase);
                }
            }
        }
        // 3. Logic: Distribute Wage Pool based on Weights
        // Fundusz płac to 42% całkowitego budżetu klubu
        const clubBudget = clubInfo?.budget || 5000000;
        const wagePool = FinanceService_1.FinanceService.getWagePool(clubBudget);
        // Oblicz sumę wag wszystkich wygenerowanych zawodników
        const totalSquadWeight = squadBase.reduce((sum, p) => sum + FinanceService_1.FinanceService.calculateSalaryWeight(p.overallRating, p.age), 0);
        // Przypisz finalną pensję każdemu graczowi proporcjonalnie do jego wagi (OVR + Wiek)
        const finalSquad = squadBase.map(p => ({
            ...p,
            annualSalary: Math.floor((FinanceService_1.FinanceService.calculateSalaryWeight(p.overallRating, p.age) / totalSquadWeight) * wagePool),
            marketValue: FinanceService_1.FinanceService.calculateMarketValue(p, clubRep, leagueTier)
        }));
        if (!exports.SquadValidator.isValidSize(finalSquad.length)) {
            console.warn(`Squad size invalid for ${clubId}: ${finalSquad.length}`);
        }
        return finalSquad;
    },
    generateEuropeanSquad: (clubId, tier, reputation, country) => {
        const usedNames = new Set();
        const europeanClubInfo = [...constants_1.STATIC_CL_CLUBS, ...constants_1.STATIC_EL_CLUBS, ...constants_1.STATIC_CONF_CLUBS].find(c => c.id === clubId);
        // Mapa kraju → lokalna pula regionów (losowanie nazw lokalnych zawodników)
        const countryToLocalPool = {
            'ENG': [types_1.Region.ENGLAND], 'SCO': [types_1.Region.ENGLAND], 'WAL': [types_1.Region.ENGLAND],
            'NIR': [types_1.Region.ENGLAND], 'IRL': [types_1.Region.ENGLAND],
            'GIB': [types_1.Region.IBERIA],
            'GER': [types_1.Region.GERMANY], 'AUT': [types_1.Region.GERMANY], 'LIE': [types_1.Region.GERMANY],
            'LUX': [types_1.Region.FRANCE, types_1.Region.GERMANY],
            'SUI': [types_1.Region.FRANCE, types_1.Region.GERMANY, types_1.Region.ITALY],
            'ESP': [types_1.Region.SPAIN], 'AND': [types_1.Region.IBERIA], 'POR': [types_1.Region.IBERIA],
            'FRA': [types_1.Region.FRANCE], 'ITA': [types_1.Region.ITALY], 'SMR': [types_1.Region.ITALY],
            'NOR': [types_1.Region.SCANDINAVIA], 'SWE': [types_1.Region.SWEDEN], 'DEN': [types_1.Region.SCANDINAVIA],
            'ISL': [types_1.Region.SCANDINAVIA], 'FRO': [types_1.Region.SCANDINAVIA],
            'FIN': [types_1.Region.FINLAND], 'TUR': [types_1.Region.TURKEY],
            'GEO': [types_1.Region.GEORGIA], 'ARM': [types_1.Region.ARMENIA],
            'ALB': [types_1.Region.ALBANIA], 'KOS': [types_1.Region.ALBANIA], 'ROU': [types_1.Region.ROMANIA],
            'SRB': [types_1.Region.BALKANS], 'CRO': [types_1.Region.BALKANS], 'BIH': [types_1.Region.BALKANS],
            'MKD': [types_1.Region.BALKANS], 'MNE': [types_1.Region.BALKANS], 'GRE': [types_1.Region.GREEK],
            'BUL': [types_1.Region.BALKANS], 'SVN': [types_1.Region.BALKANS],
            'CYP': [types_1.Region.TURKEY, types_1.Region.GREEK],
            'MLT': [types_1.Region.MALTESE],
            'LTU': [types_1.Region.BALTIC], 'LAT': [types_1.Region.BALTIC], 'EST': [types_1.Region.BALTIC],
            'UKR': [types_1.Region.EX_USSR], 'RUS': [types_1.Region.EX_USSR], 'BLR': [types_1.Region.EX_USSR],
            'MDA': [types_1.Region.EX_USSR, types_1.Region.BALKANS, types_1.Region.ROMANIA],
            'KAZ': [types_1.Region.KAZAKH], 'AZE': [types_1.Region.AZERBAIJANI],
            'CZE': [types_1.Region.CZ_SK], 'SVK': [types_1.Region.CZ_SK],
            'HUN': [types_1.Region.HUNGARIAN],
            'NED': [types_1.Region.BENELUX], 'BEL': [types_1.Region.BENELUX],
            'ISR': [types_1.Region.ISRAELI],
        };
        const localPool = countryToLocalPool[country] ?? null;
        const balkanCountries = ['SRB', 'CRO', 'BIH', 'MKD', 'MNE', 'GRE', 'BUL', 'SVN'];
        const eightyPercentCountries = ['CYP', 'SUI'];
        const localRatio = !localPool ? 0
            : balkanCountries.includes(country) ? 0.7
                : eightyPercentCountries.includes(country) ? 0.8
                    : (0.4 + Math.random() * 0.2);
        const localCount = Math.round(30 * localRatio);
        console.log(`[Squad] ${clubId} | country=${country} | localPool=${localPool} | localCount=${localCount}/30`);
        // Stały skład: 3 GK, 8 DEF, 10 MID, 9 FWD = 30
        const slots = [
            ...Array(3).fill({ pos: types_1.PlayerPosition.GK }),
            ...Array(8).fill({ pos: types_1.PlayerPosition.DEF }),
            ...Array(10).fill({ pos: types_1.PlayerPosition.MID }),
            ...Array(9).fill({ pos: types_1.PlayerPosition.FWD }),
        ];
        const polishRoll = Math.random();
        const polishCount = polishRoll < 0.01 ? 3 : polishRoll < 0.05 ? 2 : polishRoll < 0.10 ? 1 : 0;
        const polishSlots = new Set();
        while (polishSlots.size < polishCount) {
            polishSlots.add(Math.floor(Math.random() * 30));
        }
        const getSouthAmericanBoostedRegion = () => {
            if (Math.random() < 0.005)
                return types_1.Region.MEXICO;
            const swedenChance = ['ENG', 'ITA', 'NED', 'GER', 'AUT', 'FRA', 'BEL'].includes(country) ? 0.08 : 0.005;
            if (country !== 'SWE' && Math.random() < swedenChance)
                return types_1.Region.SWEDEN;
            const brazilWeight = country === 'POR' ? 25 : country === 'ITA' ? 12 : country === 'ESP' ? 10 : 1;
            const argentinaWeight = country === 'POR' ? 10 : country === 'ITA' ? 8 : country === 'ESP' ? 15 : 1;
            const beneluxWeight = ['ENG', 'GER', 'FRA', 'ITA', 'ESP'].includes(country) ? 5 : 1;
            const totalWeight = brazilWeight + argentinaWeight + beneluxWeight + 28;
            const roll = Math.random() * totalWeight;
            if (roll < brazilWeight)
                return types_1.Region.BRAZIL;
            if (roll < brazilWeight + argentinaWeight)
                return types_1.Region.ARGENTINA;
            if (roll < brazilWeight + argentinaWeight + beneluxWeight)
                return types_1.Region.BENELUX;
            return getRandomGlobalClubForeignRegion();
        };
        const squad = slots.map((slot, index) => {
            const isLocal = localPool !== null && index < localCount;
            let region;
            if (polishSlots.has(index)) {
                region = types_1.Region.POLAND;
            }
            else if (isLocal) {
                region = localPool[Math.floor(Math.random() * localPool.length)];
            }
            else {
                region = getSouthAmericanBoostedRegion();
            }
            let namePair;
            let fullName;
            let attempts = 0;
            do {
                namePair = NameGeneratorService_1.NameGeneratorService.getRandomName(region);
                fullName = `${namePair.firstName} ${namePair.lastName}`;
                attempts++;
            } while (usedNames.has(fullName) && attempts < 50);
            usedNames.add(fullName);
            const age = 17 + Math.floor(Math.random() * 18); // 17-34
            const genData = PlayerAttributesGenerator_1.PlayerAttributesGenerator.generateAttributes(slot.pos, tier, reputation, age, true);
            return {
                id: `EU_CL_${clubId}_${String(index).padStart(2, '0')}`,
                firstName: namePair.firstName,
                lastName: namePair.lastName,
                clubId,
                position: slot.pos,
                nationality: region,
                age,
                fatigueDebt: 0,
                overallRating: region === types_1.Region.SWEDEN ? Math.min(genData.overall, 93) : genData.overall,
                attributes: genData.attributes,
                stats: {
                    matchesPlayed: 0, minutesPlayed: 0, goals: 0, assists: 0,
                    yellowCards: 0, redCards: 0, cleanSheets: 0,
                    seasonalChanges: {}, ratingHistory: []
                },
                health: { status: types_1.HealthStatus.HEALTHY },
                condition: 100,
                suspensionMatches: 0,
                contractEndDate: new Date(new Date().getFullYear() + 1 + Math.floor(Math.random() * 3), 5, 30).toISOString(),
                annualSalary: 0,
                marketValue: 0,
                isUntouchable: true,
                negotiationStep: 0,
                negotiationLockoutUntil: null,
                contractLockoutUntil: null,
                boardLockoutUntil: null,
                isNegotiationPermanentBlocked: false,
                transferLockoutUntil: null,
                freeAgentLockoutUntil: null,
                freeAgentClubLockouts: {},
                history: []
            };
        });
        // TALENT MECHANIC: Tier 3/4 — 5% szans na 1 talent, 1% szans na 2. talent
        if (tier >= 3) {
            const TALENT_CONFIG = { minBase: 70, maxBase: 80, hardCap: 88 };
            const injectTalentEU = (s) => {
                const idx = Math.floor(Math.random() * s.length);
                const p = s[idx];
                const talentAge = 17 + Math.floor(Math.random() * 7);
                const genData = PlayerAttributesGenerator_1.PlayerAttributesGenerator.generateAttributes(p.position, tier, reputation, talentAge, true, TALENT_CONFIG);
                s[idx] = { ...p, age: talentAge, overallRating: genData.overall, attributes: genData.attributes };
            };
            if (Math.random() < 0.05) {
                injectTalentEU(squad);
                if (Math.random() < 0.01) {
                    injectTalentEU(squad);
                }
            }
        }
        const clubBudget = europeanClubInfo?.budget ?? FinanceService_1.FinanceService.calculateEuropeanInitialBudget(tier, reputation, country, europeanClubInfo?.name, europeanClubInfo?.stadiumCapacity);
        const wagePool = FinanceService_1.FinanceService.getWagePool(clubBudget);
        const totalSquadWeight = squad.reduce((sum, p) => sum + FinanceService_1.FinanceService.calculateSalaryWeight(p.overallRating, p.age), 0);
        return squad.map(p => ({
            ...p,
            annualSalary: Math.floor((FinanceService_1.FinanceService.calculateSalaryWeight(p.overallRating, p.age) / totalSquadWeight) * wagePool),
            marketValue: FinanceService_1.FinanceService.calculateMarketValue(p, reputation, tier)
        }));
    },
    generateSouthAmericanSquad: (clubId, tier, reputation, country) => {
        const usedNames = new Set();
        const countryToLocalRegion = {
            'ARG': types_1.Region.ARGENTINA,
            'BRA': types_1.Region.BRAZIL,
        };
        const localRegion = countryToLocalRegion[country] ?? types_1.Region.SOUTH_AMERICAN;
        const totalSlots = 30;
        const localCount = Math.round(totalSlots * 0.75); // 23
        const saCount = Math.round(totalSlots * 0.20); // 6
        // foreignCount = 30 - 23 - 6 = 1
        const slots = [
            ...Array(3).fill({ pos: types_1.PlayerPosition.GK }),
            ...Array(8).fill({ pos: types_1.PlayerPosition.DEF }),
            ...Array(10).fill({ pos: types_1.PlayerPosition.MID }),
            ...Array(9).fill({ pos: types_1.PlayerPosition.FWD }),
        ];
        const squad = slots.map((slot, index) => {
            let region;
            if (index < localCount) {
                region = localRegion;
            }
            else if (index < localCount + saCount) {
                region = types_1.Region.SOUTH_AMERICAN;
            }
            else {
                region = getRandomGlobalClubForeignRegion(0.05);
            }
            let namePair;
            let fullName;
            let attempts = 0;
            do {
                namePair = NameGeneratorService_1.NameGeneratorService.getRandomName(region);
                fullName = `${namePair.firstName} ${namePair.lastName}`;
                attempts++;
            } while (usedNames.has(fullName) && attempts < 50);
            usedNames.add(fullName);
            const age = 17 + Math.floor(Math.random() * 18);
            const genData = PlayerAttributesGenerator_1.PlayerAttributesGenerator.generateAttributes(slot.pos, tier, reputation, age, true);
            return {
                id: `SA_${clubId}_${String(index).padStart(2, '0')}`,
                firstName: namePair.firstName,
                lastName: namePair.lastName,
                clubId,
                position: slot.pos,
                nationality: region,
                age,
                fatigueDebt: 0,
                overallRating: genData.overall,
                attributes: genData.attributes,
                stats: {
                    matchesPlayed: 0, minutesPlayed: 0, goals: 0, assists: 0,
                    yellowCards: 0, redCards: 0, cleanSheets: 0,
                    seasonalChanges: {}, ratingHistory: []
                },
                health: { status: types_1.HealthStatus.HEALTHY },
                condition: 100,
                suspensionMatches: 0,
                contractEndDate: new Date(new Date().getFullYear() + 1 + Math.floor(Math.random() * 3), 5, 30).toISOString(),
                annualSalary: 0,
                marketValue: 0,
                isUntouchable: true,
                negotiationStep: 0,
                negotiationLockoutUntil: null,
                contractLockoutUntil: null,
                boardLockoutUntil: null,
                isNegotiationPermanentBlocked: false,
                transferLockoutUntil: null,
                freeAgentLockoutUntil: null,
                freeAgentClubLockouts: {},
                history: []
            };
        });
        const clubBudget = FinanceService_1.FinanceService.calculateInitialBudget(tier, reputation);
        const wagePool = FinanceService_1.FinanceService.getWagePool(clubBudget);
        const totalSquadWeight = squad.reduce((sum, p) => sum + FinanceService_1.FinanceService.calculateSalaryWeight(p.overallRating, p.age), 0);
        return squad.map(p => ({
            ...p,
            annualSalary: Math.floor((FinanceService_1.FinanceService.calculateSalaryWeight(p.overallRating, p.age) / totalSquadWeight) * wagePool),
            marketValue: FinanceService_1.FinanceService.calculateMarketValue(p, reputation, tier)
        }));
    },
    generateIntercontinentalSquad: (clubId, tier, reputation, country, continent) => {
        const usedNames = new Set();
        const localRegion = getLocalRegionForInternationalClub(country, continent);
        const slots = buildStandardSlots();
        const localCount = country === 'MEX' ? Math.round(slots.length * 0.8) : 21;
        const squad = slots.map((slot, index) => {
            let region;
            if (index < localCount) {
                region = localRegion;
            }
            else if (index < localCount + 6) {
                region = getForeignRegionForInternationalClub(continent, country);
            }
            else {
                region = getRandomGlobalClubForeignRegion(country === 'MEX' ? 0 : 0.02);
            }
            let namePair;
            let fullName;
            let attempts = 0;
            do {
                namePair = NameGeneratorService_1.NameGeneratorService.getRandomName(region);
                fullName = `${namePair.firstName} ${namePair.lastName}`;
                attempts++;
            } while (usedNames.has(fullName) && attempts < 50);
            usedNames.add(fullName);
            const age = 17 + Math.floor(Math.random() * 18);
            const genData = PlayerAttributesGenerator_1.PlayerAttributesGenerator.generateAttributes(slot.pos, tier, reputation, age, true);
            return {
                id: `INT_${clubId}_${String(index).padStart(2, '0')}`,
                firstName: namePair.firstName,
                lastName: namePair.lastName,
                clubId,
                position: slot.pos,
                nationality: region,
                age,
                fatigueDebt: 0,
                overallRating: genData.overall,
                attributes: genData.attributes,
                stats: {
                    matchesPlayed: 0, minutesPlayed: 0, goals: 0, assists: 0,
                    yellowCards: 0, redCards: 0, cleanSheets: 0,
                    seasonalChanges: {}, ratingHistory: []
                },
                health: { status: types_1.HealthStatus.HEALTHY },
                condition: 100,
                suspensionMatches: 0,
                contractEndDate: new Date(new Date().getFullYear() + 1 + Math.floor(Math.random() * 3), 5, 30).toISOString(),
                annualSalary: 0,
                marketValue: 0,
                isUntouchable: true,
                negotiationStep: 0,
                negotiationLockoutUntil: null,
                contractLockoutUntil: null,
                boardLockoutUntil: null,
                isNegotiationPermanentBlocked: false,
                transferLockoutUntil: null,
                freeAgentLockoutUntil: null,
                freeAgentClubLockouts: {},
                history: []
            };
        });
        const clubBudget = FinanceService_1.FinanceService.calculateInitialBudget(tier, reputation);
        const wagePool = FinanceService_1.FinanceService.getWagePool(clubBudget);
        const totalSquadWeight = squad.reduce((sum, p) => sum + FinanceService_1.FinanceService.calculateSalaryWeight(p.overallRating, p.age), 0);
        return squad.map(p => ({
            ...p,
            annualSalary: Math.floor((FinanceService_1.FinanceService.calculateSalaryWeight(p.overallRating, p.age) / totalSquadWeight) * wagePool),
            marketValue: FinanceService_1.FinanceService.calculateMarketValue(p, reputation, tier)
        }));
    }
};
