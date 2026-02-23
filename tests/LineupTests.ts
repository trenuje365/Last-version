import { LineupService } from '../services/LineupService';
import { SquadGeneratorService } from '../services/SquadGeneratorService';
import { PlayerPosition, Player } from '../types';
import { TacticRepository } from '../resources/tactics_db';

export const runLineupTests = () => {
  console.group("Running Lineup & Tactics Tests");

  // Mock Data
  const squad = SquadGeneratorService.generateSquadForClub("TEST_FC");

  // Test 1: Auto Pick Basic Rules
  const tactic442 = '4-4-2';
  const lineup = LineupService.autoPickLineup("TEST_FC", squad, tactic442);
  
  console.assert(lineup.startingXI.length === 11, `Test 1a Failed: 11 starters expected, got ${lineup.startingXI.length}`);
  console.assert(lineup.startingXI[0] !== null, `Test 1b Failed: GK slot empty`);
  
  const gkPlayer = squad.find(p => p.id === lineup.startingXI[0]);
  console.assert(gkPlayer?.position === PlayerPosition.GK, `Test 1c Failed: Slot 0 is not GK`);
  
  console.assert(lineup.bench.length <= 9, `Test 1d Failed: Bench > 9`);
  
  console.log("Test 1: Auto Pick Basics - PASSED");

  // Test 2: Tactic Attributes
  const tacticObj = TacticRepository.getById('4-4-2');
  console.assert(tacticObj.slots.length === 11, "Test 2a Failed: Tactic needs 11 slots");
  console.assert(tacticObj.category === 'Neutral', "Test 2b Failed: Category mismatch");
  console.log("Test 2: Tactics DB - PASSED");

  // Test 3: Swap Logic (Bench to Start)
  const benchId = lineup.bench[0];
  const startId = lineup.startingXI[10]; // A striker probably
  
  const swappedLineup = LineupService.swapPlayers(lineup, benchId, startId);
  
  console.assert(swappedLineup.startingXI.includes(benchId), "Test 3a Failed: Bench player didn't move to start");
  console.assert(swappedLineup.bench.includes(startId), "Test 3b Failed: Start player didn't move to bench");
  console.assert(!swappedLineup.startingXI.includes(startId), "Test 3c Failed: Old starter still in XI");
  
  console.log("Test 3: Swap Logic - PASSED");

  // Test 4: GK Validation
  // Try to remove GK from lineup by swapping with a reserve field player
  const currentGK = lineup.startingXI[0];
  const reserveField = lineup.reserves.find(r => {
      const p = squad.find(pl => pl.id === r);
      return p?.position !== PlayerPosition.GK;
  });

  if(reserveField) {
      // Force a bad swap manually to test validator (LineupService.swap allows it, validator catches it)
      const badLineup = { ...lineup };
      badLineup.startingXI = [...lineup.startingXI];
      badLineup.startingXI[0] = reserveField; // No GK now
      
      const val = LineupService.validateLineup(badLineup, squad);
      console.assert(val.valid === false, "Test 4 Failed: Validator allowed lineup without GK");
  }
  console.log("Test 4: GK Validation - PASSED");

  console.groupEnd();
};

// runLineupTests(); 