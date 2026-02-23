
import { League, LeagueLevel, Club, Player, PlayerPosition, Region, HealthStatus, PlayerAttributes, NationalTeam } from './types';
import { RAW_PL_CLUBS, generateClubId } from './resources/static_db/clubs/pl_clubs';
// TUTAJ WSTAW IMPORTY DRUŻYN NARODOWYCH
import { FinanceService } from './services/FinanceService';
import { NATIONAL_TEAMS_EUROPE } from './resources/static_db/NationalTeams/NationalTeamsEurope';
import { NATIONAL_TEAMS_AFRICA } from './resources/static_db/NationalTeams/NationalTeamsAfrica';
import { NATIONAL_TEAMS_AFC } from './resources/static_db/NationalTeams/NationalTeamsAFC';
import { NATIONAL_TEAMS_CONCACAF } from './resources/static_db/NationalTeams/NationalTeamsCONCACAF';
import { NATIONAL_TEAMS_CONMEBOL } from './resources/static_db/NationalTeams/NationalTeamsCONMEBOL';
import { NATIONAL_TEAMS_OFC } from './resources/static_db/NationalTeams/NationalTeamsOFC';

// (Dodaj resztę importów analogicznie...)

const generateNTId = (name: string) => `NT_${name.toUpperCase().replace(/\s+/g, '_')}`;

const processNT = (data: any[]): NationalTeam[] => data.map(t => ({
  ...t,
  id: generateNTId(t.name),
  colorsHex: t.colors,
  stadiumName: t.stadium,
  stadiumCapacity: t.capacity
}));

export const STATIC_NATIONAL_TEAMS: NationalTeam[] = [
  ...processNT(NATIONAL_TEAMS_EUROPE),
  ...processNT(NATIONAL_TEAMS_AFRICA),
  ...processNT(NATIONAL_TEAMS_CONCACAF),
  ...processNT(NATIONAL_TEAMS_CONMEBOL),
  ...processNT(NATIONAL_TEAMS_OFC),
  ...processNT(NATIONAL_TEAMS_AFC)
];

// ---------------------------------------------------------------------------
// STATIC DATABASE (SEED DATA)
// This file acts as the JSON loader stub mentioned in the requirements.
// ---------------------------------------------------------------------------

export const START_DATE = new Date('2025-07-9');

// 1. League Definitions
export const STATIC_LEAGUES: League[] = [
  { id: 'L_PL_1', name: 'Polish League 1', level: LeagueLevel.TIER_1, teamIds: [] },
  { id: 'L_PL_2', name: 'Polish League 2', level: LeagueLevel.TIER_2, teamIds: [] },
  { id: 'L_PL_3', name: 'Polish League 3', level: LeagueLevel.TIER_3, teamIds: [] },
  { id: 'L_PL_4', name: 'Regional League', level: LeagueLevel.TIER_4_HIDDEN, teamIds: [] },
];

// 2. Club Loading Logic (Stage 4)

// Helper to generate a placeholder club if real data runs out
const generatePlaceholderClub = (leagueId: string, index: number, tier: number): Club => {
  const id = `PL_TIER${tier}_PLACEHOLDER_${String(index).padStart(3, '0')}`;
  return {
    id,
    name: `Klub Placeholder ${index}`,
    shortName: `P${index}`,
    leagueId,
    colorsHex: ['#808080', '#FFFFFF', '#000000'],
    budget: FinanceService.calculateInitialBudget(tier, 1),
    stadiumName: "Stadion Miejski TBD",
    stadiumCapacity: 1000,
    reputation: 1,
    isDefaultActive: true,
    colorPrimary: '#808080',
    colorSecondary: '#FFFFFF',
    rosterIds: [],
    stats: {
    points: 0,wins: 0,draws: 0,losses: 0,goalsFor: 0,goalsAgainst: 0,goalDifference: 0,played: 0,
    form: []
},
    boardStrictness: Math.floor(Math.random() * 10) + 1,
    signingBonusPool: 0
  };
};

const loadClubsForTier = (tier: number, leagueId: string, limit: number): Club[] => {
  const rawClubs = RAW_PL_CLUBS.filter(c => c.tier === tier);
  const clubs: Club[] = [];

  // 1. Process Real Clubs
  rawClubs.forEach((raw, index) => {
    const isActive = index < limit;
    const assignedLeagueId = isActive ? leagueId : 'NONE';

    const club: Club = {
      id: generateClubId(raw.name),
      name: raw.name,
      shortName: raw.name.substring(0, 3).toUpperCase(),
      leagueId: assignedLeagueId,
      colorsHex: raw.colors,
      stadiumName: raw.stadium,
      stadiumCapacity: raw.capacity,
      reputation: raw.reputation,
      isDefaultActive: isActive,
      budget: FinanceService.calculateInitialBudget(tier, raw.reputation),
      boardStrictness: Math.floor(Math.random() * 10) + 1,
      signingBonusPool: FinanceService.calculateInitialSigningPool(
        FinanceService.calculateInitialBudget(tier, raw.reputation), 
        raw.reputation
      ),
      colorPrimary: raw.colors[0],
      colorSecondary: raw.colors[1] || '#FFFFFF',
      rosterIds: [],
      stats: {
points: 0,wins: 0,draws: 0,losses: 0,goalsFor: 0,goalsAgainst: 0,goalDifference: 0,played: 0,
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

export const STATIC_CLUBS: Club[] = [
  ...clubsTier1,
  ...clubsTier2,
  ...clubsTier3,
  ...clubsTier4
];

// Populate league teamIds (Only include active teams in the league structure)
STATIC_LEAGUES.forEach(l => {
  l.teamIds = STATIC_CLUBS
    .filter(c => c.leagueId === l.id && c.isDefaultActive)
    .map(c => c.id);
});

// 3. Player Database Generator (Stub)
export const generatePlaceholderPlayersForClub = (clubId: string): Player[] => {
  return Array.from({ length: 22 }).map((_, i) => ({
    id: `PL_${clubId}_${i}`,
    firstName: `Firstname_${i}`,
    lastName: `Lastname_${clubId}_${i}`,
    age: 18 + Math.floor(Math.random() * 15),
    clubId,
    nationality: Region.POLAND,
    position: i === 0 || i === 1 ? PlayerPosition.GK : PlayerPosition.MID,
    overallRating: 50 + Math.floor(Math.random() * 40),
    stats: {
      goals: 0, assists: 0, yellowCards: 0, redCards: 0, cleanSheets: 0, matchesPlayed: 0, minutesPlayed: 0,
      seasonalChanges: {}, ratingHistory: [] 
    },
    health: {
      status: HealthStatus.HEALTHY
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
    marketValue: 100000,     // DODANO TO POLE
    history: []              // DODANO TO POLE
  }));
};
