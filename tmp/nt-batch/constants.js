"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePlaceholderPlayersForClub = exports.UNEMPLOYED_MANAGER_CLUB = exports.UNEMPLOYED_MANAGER_CLUB_ID = exports.STATIC_NA_CLUBS = exports.STATIC_AFRICAN_CLUBS = exports.STATIC_ASIAN_CLUBS = exports.STATIC_SA_CLUBS = exports.STATIC_CONF_CLUBS = exports.STATIC_EL_CLUBS = exports.STATIC_CL_CLUBS = exports.STATIC_CLUBS = exports.STATIC_LEAGUES = exports.START_DATE = exports.STATIC_NATIONAL_TEAMS = exports.REGION_NATIONALITY_LABEL = void 0;
const types_1 = require("./types");
const pl_clubs_1 = require("./resources/static_db/clubs/pl_clubs");
const ChampionsLeagueTeams_1 = require("./resources/static_db/clubs/ChampionsLeagueTeams");
const EuropeLeagueTeams_1 = require("./resources/static_db/clubs/EuropeLeagueTeams");
const ConferenceLeagueTeams_1 = require("./resources/static_db/clubs/ConferenceLeagueTeams");
const SouthamericanTeams_1 = require("./resources/static_db/clubs/SouthamericanTeams");
const asian_teams_1 = require("./resources/static_db/clubs/asian_teams");
const african_teams_1 = require("./resources/static_db/clubs/african_teams");
const northAME_teams_1 = require("./resources/static_db/clubs/northAME_teams");
// TUTAJ WSTAW IMPORTY DRUŻYN NARODOWYCH
const FinanceService_1 = require("./services/FinanceService");
const NationalTeamsEurope_1 = require("./resources/static_db/NationalTeams/NationalTeamsEurope");
const NationalTeamsAfrica_1 = require("./resources/static_db/NationalTeams/NationalTeamsAfrica");
const NationalTeamsAFC_1 = require("./resources/static_db/NationalTeams/NationalTeamsAFC");
const NationalTeamsCONCACAF_1 = require("./resources/static_db/NationalTeams/NationalTeamsCONCACAF");
const NationalTeamsCONMEBOL_1 = require("./resources/static_db/NationalTeams/NationalTeamsCONMEBOL");
const NationalTeamsOFC_1 = require("./resources/static_db/NationalTeams/NationalTeamsOFC");
// (Dodaj resztę importów analogicznie...)
exports.REGION_NATIONALITY_LABEL = {
    [types_1.Region.POLAND]: 'Polska',
    [types_1.Region.GERMANY]: 'Niemcy',
    [types_1.Region.SPAIN]: 'Hiszpania',
    [types_1.Region.ENGLAND]: 'Anglia',
    [types_1.Region.ITALY]: 'Włochy',
    [types_1.Region.FRANCE]: 'Francja',
    [types_1.Region.BALKANS]: 'Bałkany',
    [types_1.Region.CZ_SK]: 'Czechy/Słowacja',
    [types_1.Region.SSA]: 'Afryka Subsaharyjska',
    [types_1.Region.IBERIA]: 'Półwysep Iberyjski',
    [types_1.Region.MEXICO]: 'Meksyk',
    [types_1.Region.SWEDEN]: 'Szwecja',
    [types_1.Region.SCANDINAVIA]: 'Skandynawia',
    [types_1.Region.EX_USSR]: 'Europa Wschodnia',
    [types_1.Region.JAPAN]: 'Japonia',
    [types_1.Region.KOREA]: 'Korea',
    [types_1.Region.ARGENTINA]: 'Argentyna',
    [types_1.Region.BRAZIL]: 'Brazylia',
    [types_1.Region.TURKEY]: 'Turcja',
    [types_1.Region.ARABIA]: 'Arabia',
    [types_1.Region.FINLAND]: 'Finlandia',
    [types_1.Region.GEORGIA]: 'Gruzja',
    [types_1.Region.ARMENIA]: 'Armenia',
    [types_1.Region.ALBANIA]: 'Albania',
    [types_1.Region.ROMANIA]: 'Rumunia',
    [types_1.Region.BALTIC]: 'Kraje Bałtyckie',
    [types_1.Region.BENELUX]: 'Benelux',
    [types_1.Region.HUNGARIAN]: 'Węgry',
    [types_1.Region.MALTESE]: 'Malta',
    [types_1.Region.ISRAELI]: 'Izrael',
    [types_1.Region.GREEK]: 'Grecja',
    [types_1.Region.AZERBAIJANI]: 'Azerbejdżan',
    [types_1.Region.KAZAKH]: 'Kazachstan',
    [types_1.Region.SOUTH_AMERICAN]: 'Ameryka Południowa',
};
const generateNTId = (name) => `NT_${name.toUpperCase().replace(/\s+/g, '_')}`;
const processNT = (data) => data.map(t => ({
    ...t,
    id: generateNTId(t.name),
    colorsHex: t.colors,
    stadiumName: t.stadium,
    stadiumCapacity: t.capacity
}));
exports.STATIC_NATIONAL_TEAMS = [
    ...processNT(NationalTeamsEurope_1.NATIONAL_TEAMS_EUROPE),
    ...processNT(NationalTeamsAfrica_1.NATIONAL_TEAMS_AFRICA),
    ...processNT(NationalTeamsCONCACAF_1.NATIONAL_TEAMS_CONCACAF),
    ...processNT(NationalTeamsCONMEBOL_1.NATIONAL_TEAMS_CONMEBOL),
    ...processNT(NationalTeamsOFC_1.NATIONAL_TEAMS_OFC),
    ...processNT(NationalTeamsAFC_1.NATIONAL_TEAMS_AFC)
];
// ---------------------------------------------------------------------------
// STATIC DATABASE (SEED DATA)
// This file acts as the JSON loader stub mentioned in the requirements.
// ---------------------------------------------------------------------------
exports.START_DATE = new Date('2025-07-01');
// 1. League Definitions
exports.STATIC_LEAGUES = [
    { id: 'L_PL_1', name: 'Polish League 1', level: types_1.LeagueLevel.TIER_1, teamIds: [] },
    { id: 'L_PL_2', name: 'Polish League 2', level: types_1.LeagueLevel.TIER_2, teamIds: [] },
    { id: 'L_PL_3', name: 'Polish League 3', level: types_1.LeagueLevel.TIER_3, teamIds: [] },
    { id: 'L_PL_4', name: 'Regional League', level: types_1.LeagueLevel.TIER_4_HIDDEN, teamIds: [] },
    { id: 'L_CL', name: 'UEFA Champions League', level: types_1.LeagueLevel.EUROPEAN, teamIds: [] },
];
// 2. Club Loading Logic (Stage 4)
// Helper to generate a placeholder club if real data runs out
const generatePlaceholderClub = (leagueId, index, tier) => {
    const id = `PL_TIER${tier}_PLACEHOLDER_${String(index).padStart(3, '0')}`;
    return {
        id,
        name: `Klub Placeholder ${index}`,
        shortName: `P${index}`,
        leagueId,
        tier,
        colorsHex: ['#808080', '#FFFFFF', '#000000'],
        budget: FinanceService_1.FinanceService.calculateInitialBudget(tier, 1),
        stadiumName: "Stadion Miejski TBD",
        stadiumCapacity: 1000,
        reputation: 1,
        isDefaultActive: true,
        colorPrimary: '#808080',
        colorSecondary: '#FFFFFF',
        rosterIds: [],
        stats: {
            points: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, played: 0,
            form: []
        },
        boardStrictness: Math.floor(Math.random() * 10) + 1,
        signingBonusPool: 0
    };
};
const loadClubsForTier = (tier, leagueId, limit) => {
    const rawClubs = pl_clubs_1.RAW_PL_CLUBS.filter(c => c.tier === tier);
    const clubs = [];
    // 1. Process Real Clubs
    rawClubs.forEach((raw, index) => {
        const isActive = index < limit;
        const assignedLeagueId = isActive ? leagueId : 'NONE';
        const club = {
            id: (0, pl_clubs_1.generateClubId)(raw.name),
            name: raw.name,
            shortName: raw.name.substring(0, 3).toUpperCase(),
            leagueId: assignedLeagueId,
            tier: raw.tier,
            colorsHex: raw.colors,
            stadiumName: raw.stadium,
            stadiumCapacity: raw.capacity,
            reputation: raw.reputation,
            isDefaultActive: isActive,
            budget: FinanceService_1.FinanceService.calculateInitialBudget(tier, raw.reputation),
            boardStrictness: Math.floor(Math.random() * 10) + 1,
            signingBonusPool: FinanceService_1.FinanceService.calculateInitialSigningPool(FinanceService_1.FinanceService.calculateInitialBudget(tier, raw.reputation), raw.reputation),
            colorPrimary: raw.colors[0],
            colorSecondary: raw.colors[1] || '#FFFFFF',
            rosterIds: [],
            stats: {
                points: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, played: 0,
                form: []
            }
        };
        clubs.push(club);
    });
    // 2. Add Placeholders ONLY if tier < 4 (Tiers 1-3 require exactly 18 teams)
    // For Tier 4, we only want real clubs. 
    if (tier < 4) {
        const activeCount = clubs.filter(c => c.isDefaultActive).length;
        if (activeCount < limit) {
            const missing = limit - activeCount;
            for (let i = 0; i < missing; i++) {
                clubs.push(generatePlaceholderClub(leagueId, i + 1, tier));
            }
        }
    }
    return clubs;
};
// Load Clubs based on Rules: 18, 18, 18, 100
// Increased Tier 4 limit to 100 but placeholders are disabled for it.
const clubsTier1 = loadClubsForTier(1, 'L_PL_1', 18);
const clubsTier2 = loadClubsForTier(2, 'L_PL_2', 18);
const clubsTier3 = loadClubsForTier(3, 'L_PL_3', 18);
const clubsTier4 = loadClubsForTier(4, 'L_PL_4', 100);
exports.STATIC_CLUBS = [
    ...clubsTier1,
    ...clubsTier2,
    ...clubsTier3,
    ...clubsTier4
];
exports.STATIC_CL_CLUBS = ChampionsLeagueTeams_1.RAW_CHAMPIONS_LEAGUE_CLUBS.map(raw => {
    const budget = FinanceService_1.FinanceService.calculateEuropeanInitialBudget(raw.tier, raw.reputation, raw.country, raw.name, raw.capacity);
    return {
        id: (0, ChampionsLeagueTeams_1.generateEuropeanClubId)(raw.name),
        name: raw.name,
        shortName: raw.name.split(' ').pop()?.substring(0, 6).toUpperCase() || raw.name.substring(0, 6).toUpperCase(),
        leagueId: 'L_CL',
        tier: raw.tier,
        colorsHex: raw.colors,
        stadiumName: raw.stadium,
        stadiumCapacity: raw.capacity,
        reputation: raw.reputation,
        country: raw.country,
        isDefaultActive: true,
        colorPrimary: raw.colors[0],
        colorSecondary: raw.colors[1] || '#FFFFFF',
        rosterIds: [],
        budget,
        boardStrictness: 5,
        signingBonusPool: FinanceService_1.FinanceService.calculateInitialSigningPool(budget, raw.reputation),
        stats: { points: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, played: 0, form: [] },
        isInPolishCup: false,
    };
});
exports.STATIC_EL_CLUBS = EuropeLeagueTeams_1.RAW_EUROPA_LEAGUE_CLUBS.map(raw => {
    const budget = FinanceService_1.FinanceService.calculateEuropeanInitialBudget(raw.tier, raw.reputation, raw.country, raw.name, raw.capacity);
    return {
        id: (0, EuropeLeagueTeams_1.generateELClubId)(raw.name),
        name: raw.name,
        shortName: raw.name.split(' ').pop()?.substring(0, 6).toUpperCase() || raw.name.substring(0, 6).toUpperCase(),
        leagueId: 'L_EL',
        tier: raw.tier,
        colorsHex: raw.colors,
        stadiumName: raw.stadium,
        stadiumCapacity: raw.capacity,
        reputation: raw.reputation,
        country: raw.country,
        isDefaultActive: true,
        colorPrimary: raw.colors[0],
        colorSecondary: raw.colors[1] || '#FFFFFF',
        rosterIds: [],
        budget,
        boardStrictness: 5,
        signingBonusPool: FinanceService_1.FinanceService.calculateInitialSigningPool(budget, raw.reputation),
        stats: { points: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, played: 0, form: [] },
        isInPolishCup: false,
    };
});
exports.STATIC_CONF_CLUBS = ConferenceLeagueTeams_1.RAW_CONFERENCE_LEAGUE_CLUBS.map(raw => {
    const budget = FinanceService_1.FinanceService.calculateEuropeanInitialBudget(raw.tier, raw.reputation, raw.country, raw.name, raw.capacity);
    return {
        id: (0, ConferenceLeagueTeams_1.generateCONFClubId)(raw.name),
        name: raw.name,
        shortName: raw.name.split(' ').pop()?.substring(0, 6).toUpperCase() || raw.name.substring(0, 6).toUpperCase(),
        leagueId: 'L_CONF',
        tier: raw.tier,
        colorsHex: raw.colors,
        stadiumName: raw.stadium,
        stadiumCapacity: raw.capacity,
        reputation: raw.reputation,
        country: raw.country,
        isDefaultActive: true,
        colorPrimary: raw.colors[0],
        colorSecondary: raw.colors[1] || '#FFFFFF',
        rosterIds: [],
        budget,
        boardStrictness: 5,
        signingBonusPool: FinanceService_1.FinanceService.calculateInitialSigningPool(budget, raw.reputation),
        stats: { points: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, played: 0, form: [] },
        isInPolishCup: false,
    };
});
const buildInternationalClub = (raw, id, leagueId) => {
    const budget = FinanceService_1.FinanceService.calculateInitialBudget(raw.tier, raw.reputation);
    return {
        id,
        name: raw.name,
        shortName: raw.name.split(' ').pop()?.substring(0, 6).toUpperCase() || raw.name.substring(0, 6).toUpperCase(),
        leagueId,
        tier: raw.tier,
        colorsHex: raw.colors,
        stadiumName: raw.stadium,
        stadiumCapacity: raw.capacity,
        reputation: raw.reputation,
        country: raw.country,
        isDefaultActive: true,
        colorPrimary: raw.colors[0],
        colorSecondary: raw.colors[1] || '#FFFFFF',
        rosterIds: [],
        budget,
        boardStrictness: 5,
        signingBonusPool: FinanceService_1.FinanceService.calculateInitialSigningPool(budget, raw.reputation),
        stats: { points: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, played: 0, form: [] },
        isInPolishCup: false,
    };
};
exports.STATIC_SA_CLUBS = SouthamericanTeams_1.CLUBS_SOUTH_AMERICA.map(raw => buildInternationalClub(raw, (0, SouthamericanTeams_1.generateSAClubId)(raw.name), 'L_SA'));
exports.STATIC_ASIAN_CLUBS = asian_teams_1.CLUBS_ASIAN.map(raw => buildInternationalClub(raw, (0, asian_teams_1.generateAsianClubId)(raw.name), 'L_ASIA'));
exports.STATIC_AFRICAN_CLUBS = african_teams_1.CLUBS_AFRICAN.map(raw => buildInternationalClub(raw, (0, african_teams_1.generateAfricanClubId)(raw.name), 'L_AFRICA'));
exports.STATIC_NA_CLUBS = northAME_teams_1.CLUBS_NORTH_AMERICA.map(raw => buildInternationalClub(raw, (0, northAME_teams_1.generateNorthAmericaClubId)(raw.name), 'L_NA'));
exports.UNEMPLOYED_MANAGER_CLUB_ID = 'UNEMPLOYED_MANAGER';
exports.UNEMPLOYED_MANAGER_CLUB = {
    id: exports.UNEMPLOYED_MANAGER_CLUB_ID,
    name: 'Bez klubu',
    shortName: 'BEZ',
    leagueId: 'NONE',
    tier: 99,
    colorsHex: ['#334155', '#1e293b', '#0f172a'],
    stadiumName: '',
    stadiumCapacity: 0,
    reputation: 0,
    isDefaultActive: false,
    colorPrimary: '#334155',
    colorSecondary: '#1e293b',
    rosterIds: [],
    stats: { points: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, played: 0, form: [] },
    boardStrictness: 0,
    signingBonusPool: 0,
    budget: 0,
};
// Populate league teamIds (Only include active teams in the league structure)
exports.STATIC_LEAGUES.forEach(l => {
    l.teamIds = exports.STATIC_CLUBS
        .filter(c => c.leagueId === l.id && c.isDefaultActive)
        .map(c => c.id);
});
// 3. Player Database Generator (Stub)
const generatePlaceholderPlayersForClub = (clubId) => {
    return Array.from({ length: 22 }).map((_, i) => ({
        id: `PL_${clubId}_${i}`,
        firstName: `Firstname_${i}`,
        lastName: `Lastname_${clubId}_${i}`,
        age: 18 + Math.floor(Math.random() * 15),
        clubId,
        nationality: types_1.Region.POLAND,
        position: i === 0 || i === 1 ? types_1.PlayerPosition.GK : types_1.PlayerPosition.MID,
        overallRating: 50 + Math.floor(Math.random() * 40),
        stats: {
            goals: 0, assists: 0, yellowCards: 0, redCards: 0, cleanSheets: 0, matchesPlayed: 0, minutesPlayed: 0,
            seasonalChanges: {}, ratingHistory: []
        },
        health: {
            status: types_1.HealthStatus.HEALTHY
        },
        attributes: {
            strength: 50, stamina: 50, pace: 50, defending: 50, passing: 50, attacking: 50,
            finishing: 50, technique: 50, vision: 50, dribbling: 50, heading: 50,
            positioning: 50, goalkeeping: 10
        },
        fatigueDebt: 0,
        condition: 100,
        suspensionMatches: 0,
        contractEndDate: new Date(2027, 5, 30).toISOString(),
        annualSalary: 120000,
        boardLockoutUntil: null,
        isUntouchable: false,
        // TUTAJ WSTAW TEN KOD - STARTOWE WARTOŚCI NEGOCJACJI
        negotiationStep: 0,
        negotiationLockoutUntil: null,
        isNegotiationPermanentBlocked: false,
        contractLockoutUntil: null,
        transferLockoutUntil: null,
        freeAgentLockoutUntil: null,
        isOnTransferList: false, // DODANO TO POLE
        marketValue: 100000, // DODANO TO POLE
        history: [] // DODANO TO POLE
    }));
};
exports.generatePlaceholderPlayersForClub = generatePlaceholderPlayersForClub;
