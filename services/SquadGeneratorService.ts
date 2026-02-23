import { Club, Player, PlayerPosition, Region, PlayerStats, HealthStatus } from '../types';
import { NameGeneratorService } from './NameGeneratorService';
import { PlayerAttributesGenerator } from './PlayerAttributesGenerator';
import { STATIC_CLUBS } from '../constants';
import { FinanceService } from './FinanceService';

// STAGE 2 CONSTANTS
export const MIN_SQUAD_SIZE = 29;
export const MAX_SQUAD_SIZE = 35;
const FOREIGNER_COUNT = 10;
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
        let region = slot.isForeign ? NameGeneratorService.getRandomForeignRegion() : Region.POLAND;

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
  }
};