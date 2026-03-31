import { Club, Player, PlayerPosition, Region, PlayerStats, HealthStatus } from '../types';
import { NameGeneratorService } from './NameGeneratorService';
import { PlayerAttributesGenerator } from './PlayerAttributesGenerator';
import { STATIC_CLUBS, STATIC_CL_CLUBS, STATIC_EL_CLUBS, STATIC_CONF_CLUBS } from '../constants';
import { FinanceService } from './FinanceService';

// STAGE 2 CONSTANTS
export const MIN_SQUAD_SIZE = 29;
export const MAX_SQUAD_SIZE = 35;
const FOREIGNER_COUNT = 10;

// Regiony dozwolone dla cudzoziemców w polskich klubach (bez Francji, Niemiec, Anglii, Włoch)
const POLISH_CLUB_FOREIGN_REGIONS: Region[] = [
  Region.BALKANS,
  Region.CZ_SK,
  Region.SSA,
  Region.IBERIA,
  Region.SCANDINAVIA,
  Region.EX_USSR,
  Region.SPAIN,
  Region.JAPAN,
  Region.KOREA,
  Region.ARGENTINA,
  Region.BRAZIL,
  Region.TURKEY,
  Region.ARABIA,
  Region.FINLAND,
  Region.GEORGIA,
  Region.ARMENIA,
  Region.ALBANIA,
  Region.ROMANIA,
  Region.BALTIC,
  Region.BENELUX,
  Region.HUNGARIAN,
  Region.MALTESE,
  Region.ISRAELI,
  Region.GREEK,
  Region.AZERBAIJANI,
  Region.KAZAKH,
];
const getRandomPolishClubForeignRegion = (leagueTier: number): Region => {
  const brazilWeight    = leagueTier <= 2 ? 5 : 0;
  const argentinaWeight = 1;
  const others = POLISH_CLUB_FOREIGN_REGIONS.filter(r => r !== Region.BRAZIL && r !== Region.ARGENTINA);
  const otherWeight = (100 - brazilWeight - argentinaWeight) / others.length;
  const roll = Math.random() * 100;
  if (roll < brazilWeight) return Region.BRAZIL;
  if (roll < brazilWeight + argentinaWeight) return Region.ARGENTINA;
  const idx = Math.floor((roll - brazilWeight - argentinaWeight) / otherWeight);
  return others[Math.min(idx, others.length - 1)];
};
const GK_COUNT = 4;
const DEF_COUNT = 10;
const MID_COUNT = 10;
const FWD_COUNT = 9;

export const SquadValidator = {
  isValidSize: (count: number) => count >= 29 && count <= 35,
  
  validateComposition: (players: Player[]): boolean => {
    const gk = players.filter(p => p.position === PlayerPosition.GK).length;
    const def = players.filter(p => p.position === PlayerPosition.DEF).length;
    const mid = players.filter(p => p.position === PlayerPosition.MID).length;
    const fwd = players.filter(p => p.position === PlayerPosition.FWD).length;

    return (
      gk >= 2 &&
      def >= 6 &&
      mid >= 6 &&
      fwd >= 4
    );
  }
};

export const SquadGeneratorService = {
  generateSquadForClub: (clubId: string): Player[] => {
    const usedNames = new Set<string>();

    const clubInfo = STATIC_CLUBS.find(c => c.id === clubId);
    let leagueTier = 4;
    let clubRep = 1;

    if (clubInfo) {
       if (clubInfo.leagueId === 'L_PL_1') leagueTier = 1;
       else if (clubInfo.leagueId === 'L_PL_2') leagueTier = 2;
       else if (clubInfo.leagueId === 'L_PL_3') leagueTier = 3;
       else leagueTier = 4;
       
       clubRep = clubInfo.reputation;
    }

    // 1. Define composition slots
    const targetSize = Math.floor(Math.random() * (MAX_SQUAD_SIZE - MIN_SQUAD_SIZE + 1)) + MIN_SQUAD_SIZE;
    const slots: { pos: PlayerPosition; isForeign: boolean }[] = [];

    for (let i = 0; i < targetSize; i++) {
        let pos: PlayerPosition;
        if (i < 3) pos = PlayerPosition.GK;
        else if (i < 11) pos = PlayerPosition.DEF;
        else if (i < 19) pos = PlayerPosition.MID;
        else if (i < 26) pos = PlayerPosition.FWD;
        else {
            const extra = i - 26;
            if (extra === 0) pos = PlayerPosition.GK;
            else if (extra % 3 === 1) pos = PlayerPosition.DEF;
            else if (extra % 3 === 2) pos = PlayerPosition.MID;
            else pos = PlayerPosition.FWD;
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
        let region = slot.isForeign ? getRandomPolishClubForeignRegion(leagueTier) : Region.POLAND;

        let attempts = 0;
        do {
            namePair = NameGeneratorService.getRandomName(region);
            fullName = `${namePair.firstName} ${namePair.lastName}`;
            attempts++;
        } while (usedNames.has(fullName) && attempts < 50);

        usedNames.add(fullName);

       const age = 16 + Math.floor(Math.random() * 20);
        const genData = PlayerAttributesGenerator.generateAttributes(slot.pos, leagueTier, clubRep, age);


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
              status: HealthStatus.HEALTHY
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

        } as Player;
    });

    // TALENT MECHANIC: Tier 3/4 — 5% szans na 1 talent, 1% szans na 2. talent
    if (leagueTier >= 3) {
      const TALENT_CONFIG = { minBase: 70, maxBase: 80, hardCap: 88 };
      const injectTalent = (squad: typeof squadBase) => {
        const idx = Math.floor(Math.random() * squad.length);
        const p = squad[idx];
        const talentAge = 17 + Math.floor(Math.random() * 7);
        const genData = PlayerAttributesGenerator.generateAttributes(p.position, leagueTier, clubRep, talentAge, false, TALENT_CONFIG);
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
    const wagePool = FinanceService.getWagePool(clubBudget);
    
    // Oblicz sumę wag wszystkich wygenerowanych zawodników
    const totalSquadWeight = squadBase.reduce((sum, p) => 
      sum + FinanceService.calculateSalaryWeight(p.overallRating, p.age), 0
    );

    // Przypisz finalną pensję każdemu graczowi proporcjonalnie do jego wagi (OVR + Wiek)
    const finalSquad = squadBase.map(p => ({
        ...p,
        annualSalary: Math.floor((FinanceService.calculateSalaryWeight(p.overallRating, p.age) / totalSquadWeight) * wagePool),
marketValue: FinanceService.calculateMarketValue(p, clubRep, leagueTier)

    })) as Player[];

    if (!SquadValidator.isValidSize(finalSquad.length)) {
        console.warn(`Squad size invalid for ${clubId}: ${finalSquad.length}`);
    }

       return finalSquad;
  },

  generateEuropeanSquad: (clubId: string, tier: number, reputation: number, country: string): Player[] => {
    const usedNames = new Set<string>();
    const europeanClubInfo = [...STATIC_CL_CLUBS, ...STATIC_EL_CLUBS, ...STATIC_CONF_CLUBS].find(c => c.id === clubId);

    // Mapa kraju → lokalna pula regionów (losowanie nazw lokalnych zawodników)
    const countryToLocalPool: Partial<Record<string, Region[]>> = {
      'ENG': [Region.ENGLAND], 'SCO': [Region.ENGLAND], 'WAL': [Region.ENGLAND],
      'NIR': [Region.ENGLAND], 'IRL': [Region.ENGLAND],
      'GIB': [Region.IBERIA],
      'GER': [Region.GERMANY], 'AUT': [Region.GERMANY], 'LIE': [Region.GERMANY],
      'LUX': [Region.FRANCE, Region.GERMANY],
      'SUI': [Region.FRANCE, Region.GERMANY, Region.ITALY],
      'ESP': [Region.SPAIN], 'AND': [Region.IBERIA], 'POR': [Region.IBERIA],
      'FRA': [Region.FRANCE], 'ITA': [Region.ITALY], 'SMR': [Region.ITALY],
      'NOR': [Region.SCANDINAVIA], 'SWE': [Region.SCANDINAVIA], 'DEN': [Region.SCANDINAVIA],
      'ISL': [Region.SCANDINAVIA], 'FRO': [Region.SCANDINAVIA],
      'FIN': [Region.FINLAND], 'TUR': [Region.TURKEY],
      'GEO': [Region.GEORGIA], 'ARM': [Region.ARMENIA],
      'ALB': [Region.ALBANIA], 'KOS': [Region.ALBANIA], 'ROU': [Region.ROMANIA],
      'SRB': [Region.BALKANS], 'CRO': [Region.BALKANS], 'BIH': [Region.BALKANS],
      'MKD': [Region.BALKANS], 'MNE': [Region.BALKANS], 'GRE': [Region.GREEK],
      'BUL': [Region.BALKANS], 'SVN': [Region.BALKANS],
      'CYP': [Region.TURKEY, Region.GREEK],
      'MLT': [Region.MALTESE],
      'LTU': [Region.BALTIC], 'LAT': [Region.BALTIC], 'EST': [Region.BALTIC],
      'UKR': [Region.EX_USSR], 'RUS': [Region.EX_USSR], 'BLR': [Region.EX_USSR],
      'MDA': [Region.EX_USSR, Region.BALKANS, Region.ROMANIA],
      'KAZ': [Region.KAZAKH], 'AZE': [Region.AZERBAIJANI],
      'CZE': [Region.CZ_SK], 'SVK': [Region.CZ_SK],
      'HUN': [Region.HUNGARIAN],
      'NED': [Region.BENELUX], 'BEL': [Region.BENELUX],
      'ISR': [Region.ISRAELI],
    };
    const localPool = countryToLocalPool[country] ?? null;
    const balkanCountries = ['SRB','CRO','BIH','MKD','MNE','GRE','BUL','SVN'];
    const eightyPercentCountries = ['CYP','SUI'];
    const localRatio = !localPool ? 0
      : balkanCountries.includes(country) ? 0.7
      : eightyPercentCountries.includes(country) ? 0.8
      : (0.4 + Math.random() * 0.2);
    const localCount = Math.round(30 * localRatio);
    console.log(`[Squad] ${clubId} | country=${country} | localPool=${localPool} | localCount=${localCount}/30`);

    // Stały skład: 3 GK, 8 DEF, 10 MID, 9 FWD = 30
    const slots: { pos: PlayerPosition }[] = [
      ...Array(3).fill({ pos: PlayerPosition.GK }),
      ...Array(8).fill({ pos: PlayerPosition.DEF }),
      ...Array(10).fill({ pos: PlayerPosition.MID }),
      ...Array(9).fill({ pos: PlayerPosition.FWD }),
    ];

    const polishRoll = Math.random();
    const polishCount = polishRoll < 0.01 ? 3 : polishRoll < 0.05 ? 2 : polishRoll < 0.10 ? 1 : 0;
    const polishSlots = new Set<number>();
    while (polishSlots.size < polishCount) {
      polishSlots.add(Math.floor(Math.random() * 30));
    }

    const getSouthAmericanBoostedRegion = (): Region => {
      const brazilWeight    = country === 'POR' ? 25 : country === 'ITA' ? 12 : country === 'ESP' ? 10 : 1;
      const argentinaWeight = country === 'POR' ? 10 : country === 'ITA' ?  8 : country === 'ESP' ? 15 : 1;
      const beneluxWeight   = ['ENG','GER','FRA','ITA','ESP'].includes(country) ? 5 : 1;
      const totalWeight = brazilWeight + argentinaWeight + beneluxWeight + 28;
      const roll = Math.random() * totalWeight;
      if (roll < brazilWeight) return Region.BRAZIL;
      if (roll < brazilWeight + argentinaWeight) return Region.ARGENTINA;
      if (roll < brazilWeight + argentinaWeight + beneluxWeight) return Region.BENELUX;
      return NameGeneratorService.getRandomForeignRegion();
    };

       const squad = slots.map((slot, index) => {
      const isLocal = localPool !== null && index < localCount;
      let region: Region;
      if (polishSlots.has(index)) {
        region = Region.POLAND;
      } else if (isLocal) {
        region = localPool[Math.floor(Math.random() * localPool.length)];
      } else {
        region = getSouthAmericanBoostedRegion();
      }
      let namePair;
      let fullName;
      let attempts = 0;
      do {
        namePair = NameGeneratorService.getRandomName(region);
        fullName = `${namePair.firstName} ${namePair.lastName}`;
        attempts++;
      } while (usedNames.has(fullName) && attempts < 50);
      usedNames.add(fullName);

      const age = 17 + Math.floor(Math.random() * 18); // 17-34
      const genData = PlayerAttributesGenerator.generateAttributes(slot.pos, tier, reputation, age, true);

      return {
        id: `EU_CL_${clubId}_${String(index).padStart(2, '0')}`,
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
        health: { status: HealthStatus.HEALTHY },
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
        history: []
      } as Player;
    });

    // TALENT MECHANIC: Tier 3/4 — 5% szans na 1 talent, 1% szans na 2. talent
    if (tier >= 3) {
      const TALENT_CONFIG = { minBase: 70, maxBase: 80, hardCap: 88 };
      const injectTalentEU = (s: typeof squad) => {
        const idx = Math.floor(Math.random() * s.length);
        const p = s[idx];
        const talentAge = 17 + Math.floor(Math.random() * 7);
        const genData = PlayerAttributesGenerator.generateAttributes(p.position, tier, reputation, talentAge, true, TALENT_CONFIG);
        s[idx] = { ...p, age: talentAge, overallRating: genData.overall, attributes: genData.attributes };
      };
      if (Math.random() < 0.05) {
        injectTalentEU(squad);
        if (Math.random() < 0.01) {
          injectTalentEU(squad);
        }
      }
    }

    const clubBudget = europeanClubInfo?.budget ?? FinanceService.calculateEuropeanInitialBudget(
      tier,
      reputation,
      country,
      europeanClubInfo?.name,
      europeanClubInfo?.stadiumCapacity
    );
    const wagePool = FinanceService.getWagePool(clubBudget);
    const totalSquadWeight = squad.reduce((sum, p) =>
      sum + FinanceService.calculateSalaryWeight(p.overallRating, p.age), 0
    );

    return squad.map(p => ({
      ...p,
      annualSalary: Math.floor((FinanceService.calculateSalaryWeight(p.overallRating, p.age) / totalSquadWeight) * wagePool),
      marketValue: FinanceService.calculateMarketValue(p, reputation, tier)
    })) as Player[];
  },

  generateSouthAmericanSquad: (clubId: string, tier: number, reputation: number, country: string): Player[] => {
    const usedNames = new Set<string>();

    const countryToLocalRegion: Partial<Record<string, Region>> = {
      'ARG': Region.ARGENTINA,
      'BRA': Region.BRAZIL,
    };
    const localRegion = countryToLocalRegion[country] ?? Region.SOUTH_AMERICAN;

    const totalSlots = 30;
    const localCount = Math.round(totalSlots * 0.75); // 23
    const saCount    = Math.round(totalSlots * 0.20); // 6
    // foreignCount = 30 - 23 - 6 = 1

    const slots: { pos: PlayerPosition }[] = [
      ...Array(3).fill({ pos: PlayerPosition.GK }),
      ...Array(8).fill({ pos: PlayerPosition.DEF }),
      ...Array(10).fill({ pos: PlayerPosition.MID }),
      ...Array(9).fill({ pos: PlayerPosition.FWD }),
    ];

    const squad = slots.map((slot, index) => {
      let region: Region;
      if (index < localCount) {
        region = localRegion;
      } else if (index < localCount + saCount) {
        region = Region.SOUTH_AMERICAN;
      } else {
        region = NameGeneratorService.getRandomForeignRegion();
      }

      let namePair;
      let fullName;
      let attempts = 0;
      do {
        namePair = NameGeneratorService.getRandomName(region);
        fullName = `${namePair.firstName} ${namePair.lastName}`;
        attempts++;
      } while (usedNames.has(fullName) && attempts < 50);
      usedNames.add(fullName);

      const age = 17 + Math.floor(Math.random() * 18);
      const genData = PlayerAttributesGenerator.generateAttributes(slot.pos, tier, reputation, age, true);

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
        health: { status: HealthStatus.HEALTHY },
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
        history: []
      } as Player;
    });

    return squad;
  }
};
