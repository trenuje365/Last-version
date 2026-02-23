import { Player, PlayerPosition, Club, HealthStatus, Region, RetirementInfo } from '../types';
import { NameGeneratorService } from './NameGeneratorService';
import { PlayerAttributesGenerator } from './PlayerAttributesGenerator';
import { FinanceService } from './FinanceService';

export const SeasonTransitionService = {
  /**
   * Przetwarza przejście zawodników między sezonami: emerytury i nowi gracze.
   */
  processSquadTransition: (
    playersMap: Record<string, Player[]>,
    clubs: Club[]
  ): { updatedPlayers: Record<string, Player[]>, retirementLogs: RetirementInfo[] } => {
    const updatedMap = { ...playersMap };
    const logs: RetirementInfo[] = [];

    for (const clubId in updatedMap) {
      const club = clubs.find(c => c.id === clubId);
      if (!club) continue;

      // Wyciągamy poziom ligowy dla generatora atrybutów
      let leagueTier = 4;
      if (club.leagueId === 'L_PL_1') leagueTier = 1;
      else if (club.leagueId === 'L_PL_2') leagueTier = 2;
      else if (club.leagueId === 'L_PL_3') leagueTier = 3;

      const currentSquad = updatedMap[clubId];
      const nextSquad: Player[] = [];

      currentSquad.forEach(player => {
        // Logika emerytury: > 35 lat + losowa decyzja (0,1)
        if (player.age >= 35 && Math.random() < 0.5) {
          // Zawodnik odchodzi - generujemy Newgena na jego miejsce
        const newgen = SeasonTransitionService.generateNewgen(
            clubId, 
            player.position, 
            leagueTier, 
            club.reputation,
            nextSquad.length,
            
          );
          nextSquad.push(newgen);
          logs.push({
            oldPlayerName: `${player.firstName} ${player.lastName}`,
            oldPlayerAge: player.age,
            newPlayerName: `${newgen.firstName} ${newgen.lastName}`,
            newPlayerOverall: newgen.overallRating,
            clubId: clubId
          });
        } else {
          // Zawodnik zostaje - starzeje się o rok i resetuje statystyki
          nextSquad.push({
            ...player,
            age: player.age + 1,
            condition: 100, // Pełna regeneracja na start sezonu
            suspensionMatches: 0, // Reset kar ligowych
            stats: {
              ...player.stats,
              goals: 0,
              assists: 0,
              yellowCards: 0,
              redCards: 0,
              cleanSheets: 0,
              matchesPlayed: 0,
              minutesPlayed: 0,
              seasonalChanges: {},
               ratingHistory: []  // Reset limitu rozwoju treningowego
            }
          });
        }
      });

      updatedMap[clubId] = nextSquad;
    }

    return { updatedPlayers: updatedMap, retirementLogs: logs };
  },

  /**
   * Tworzy nowego, młodego zawodnika w miejsce emeryta.
   */
  generateNewgen: (
    clubId: string, 
    position: PlayerPosition, 
    tier: number, 
    reputation: number,
    index: number
  ): Player => {
    const region = Math.random() < 0.85 ? Region.POLAND : NameGeneratorService.getRandomForeignRegion();
    const namePair = NameGeneratorService.getRandomName(region);
    
    // Nowe atrybuty w oparciu o poziom ligowy
    const age = 16 + Math.floor(Math.random() * 6);
    const genData = PlayerAttributesGenerator.generateAttributes(position, tier, reputation, age);

    const salary = Math.floor((FinanceService.getWagePool(reputation * 10000000) / 28) * (genData.overall / 65));
    
    const newPlayer: Player = {
      id: `NEWGEN_${clubId}_${Date.now()}_${index}`,
      firstName: namePair.firstName,
      lastName: namePair.lastName,
      clubId: clubId,
      position: position,
      nationality: region,
      age: age,
      fatigueDebt: 0,
      overallRating: genData.overall,
      attributes: genData.attributes,
      condition: 100,
      suspensionMatches: 0,
      annualSalary: salary,
      contractEndDate: new Date(new Date().getFullYear() + 4, 5, 30).toISOString(),
      health: { status: HealthStatus.HEALTHY },
      stats: {
        goals: 0, assists: 0, yellowCards: 0, redCards: 0, cleanSheets: 0, matchesPlayed: 0, minutesPlayed: 0,
        seasonalChanges: {},  ratingHistory: [] 
      },
      history: [{
        clubName: "Akademia",
        clubId: clubId,
        fromYear: new Date().getFullYear(),
        fromMonth: 7,
        toYear: null,
        toMonth: null
      }],
      boardLockoutUntil: null,
      isUntouchable: false,
      negotiationStep: 0,
      negotiationLockoutUntil: null,
      contractLockoutUntil: null,
      isNegotiationPermanentBlocked: false,
      transferLockoutUntil: null,
      freeAgentLockoutUntil: null,
      isOnTransferList: false
    };

    newPlayer.marketValue = FinanceService.calculateMarketValue(newPlayer, reputation, tier);

    return newPlayer;
  },


/**
   * Tworzy słabego, tymczasowego bramkarza w sytuacji kryzysowej.
   */
  generateEmergencyGK: (clubId: string, tier: number, reputation: number): Player => {
    const namePair = NameGeneratorService.getRandomName(Region.POLAND);
    // Generujemy atrybuty dla najniższego poziomu (Tier 4, Rep 1)
   const genData = PlayerAttributesGenerator.generateAttributes(PlayerPosition.GK, tier, reputation, 18);
    
    // Wymuszamy OVR w zakresie 45-56
    const forcedOvr = 45 + Math.floor(Math.random() * 12);
    
    return {
      id: `EMERGENCY_GK_${Date.now()}`,
      firstName: namePair.firstName,
      lastName: namePair.lastName,
      age: 18,
      clubId,
      position: PlayerPosition.GK,
      nationality: Region.POLAND,
      overallRating: forcedOvr,
      attributes: genData.attributes,
      condition: 100,
      fatigueDebt: 0,
      suspensionMatches: 0,
      annualSalary: 15000,
      contractEndDate: new Date(new Date().getFullYear(), 11, 31).toISOString(),
      health: { status: HealthStatus.HEALTHY },
      stats: { goals: 0, assists: 0, yellowCards: 0, redCards: 0, cleanSheets: 0, matchesPlayed: 0, minutesPlayed: 0, seasonalChanges: {}, ratingHistory: []  },
      history: [{ clubName: "Akademia", clubId: clubId, fromYear: new Date().getFullYear(), fromMonth: 7, toYear: null, toMonth: null }],
      boardLockoutUntil: null,
      isUntouchable: false,
      negotiationStep: 0,
      negotiationLockoutUntil: null,
      contractLockoutUntil: null,
      isNegotiationPermanentBlocked: false,
      transferLockoutUntil: null,
      freeAgentLockoutUntil: null,
      isOnTransferList: false
    };
  }
};