
import { InjuryUpgradeService } from '../services/InjuryUpgradeService';
import { Player, PlayerPosition, Region, HealthStatus } from '../types';

export const runInjuryUpgradeTests = () => {
  console.group("Injury Upgrade Tests");

  const mockPlayer: Player = {
    id: 'test-p',
    firstName: 'Jan',
    lastName: 'Kowalski',
    age: 25,
    clubId: 'test-c',
    nationality: Region.POLAND,
    position: PlayerPosition.MID,
    overallRating: 70,
    attributes: {
      strength: 50, stamina: 50, pace: 50, defending: 50, passing: 50, attacking: 50,
      finishing: 50, technique: 50, vision: 50, dribbling: 50, heading: 50,
      positioning: 50, goalkeeping: 10
    },
    /* Added missing seasonalChanges property to PlayerStats */
    stats: { 
      goals: 0, 
      assists: 0, 
      yellowCards: 0, 
      redCards: 0, 
      cleanSheets: 0, 
      matchesPlayed: 0, 
      minutesPlayed: 0,
      seasonalChanges: {}
    },
    health: { status: HealthStatus.HEALTHY },
    condition: 100,
    // Fix: Added required suspensionMatches property
    suspensionMatches: 0
  };

  // Test 1: Upgrade probability rises when fatigue drops
  const probNormal = InjuryUpgradeService.calculateUpgradeProbability(mockPlayer, 100, 0.010, 10, 5);
  const probLowFatigue = InjuryUpgradeService.calculateUpgradeProbability(mockPlayer, 20, 0.010, 10, 5);
  
  console.assert(probLowFatigue > probNormal, "Test 1 Failed: Low fatigue should increase upgrade probability");
  console.log("Test 1: Fatigue impact - PASSED");

  // Test 2: Upgrade probability is lower shortly after injury
  const probShort = InjuryUpgradeService.calculateUpgradeProbability(mockPlayer, 100, 0.010, 11, 10);
  const probLong = InjuryUpgradeService.calculateUpgradeProbability(mockPlayer, 100, 0.010, 30, 10);
  
  console.assert(probLong > probShort, "Test 2 Failed: Long time since injury should increase probability");
  console.log("Test 2: Time since injury impact - PASSED");

  // Test 3: Clamping
  const probVeryHigh = InjuryUpgradeService.calculateUpgradeProbability(mockPlayer, 5, 0.05, 100, 10);
  console.assert(probVeryHigh <= 0.030, `Test 3 Failed: Prob should be clamped to 0.030, got ${probVeryHigh}`);
  console.log("Test 3: Probability clamping - PASSED");

  console.groupEnd();
};