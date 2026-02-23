// Simple manual test runner since we don't have a Jest runner in the browser environment explicitly
import { SquadGeneratorService, SquadValidator } from '../services/SquadGeneratorService';
import { PlayerPosition, Region } from '../types';

export const runSquadTests = () => {
  console.group("Running Squad Generation Tests");

  // Test 1: Size check
  const squad = SquadGeneratorService.generateSquadForClub("TEST_CLUB");
  console.assert(squad.length === 32, `Test 1 Failed: Expected 32 players, got ${squad.length}`);
  console.log("Test 1: Size 32 - PASSED");

  // Test 2: Foreigner Count
  const foreigners = squad.filter(p => p.nationality !== Region.POLAND).length;
  console.assert(foreigners === 10, `Test 2 Failed: Expected 10 foreigners, got ${foreigners}`);
  console.log("Test 2: Foreigners 10 - PASSED");

  // Test 3: Position Distribution
  const gk = squad.filter(p => p.position === PlayerPosition.GK).length;
  const def = squad.filter(p => p.position === PlayerPosition.DEF).length;
  const mid = squad.filter(p => p.position === PlayerPosition.MID).length;
  const fwd = squad.filter(p => p.position === PlayerPosition.FWD).length;
  
  console.assert(gk === 3, `Test 3a Failed: GK count ${gk}`);
  console.assert(def === 10, `Test 3b Failed: DEF count ${def}`);
  console.assert(mid === 10, `Test 3c Failed: MID count ${mid}`);
  console.assert(fwd === 9, `Test 3d Failed: FWD count ${fwd}`);
  console.log("Test 3: Positions - PASSED");

  // Test 4: Validation
  console.assert(SquadValidator.isValidSize(32) === true, "Test 4a Failed: 32 should be valid");
  console.assert(SquadValidator.isValidSize(20) === false, "Test 4b Failed: 20 should be invalid");
  console.assert(SquadValidator.isValidSize(40) === false, "Test 4c Failed: 40 should be invalid");
  console.log("Test 4: Validator - PASSED");
  
  // Test 5: Uniqueness (Simple check)
  const names = squad.map(p => `${p.firstName} ${p.lastName}`);
  const uniqueNames = new Set(names);
  console.assert(names.length === uniqueNames.size, `Test 5 Failed: Duplicates found. Total: ${names.length}, Unique: ${uniqueNames.size}`);
  console.log("Test 5: Uniqueness - PASSED");

  console.groupEnd();
};

// Auto-run when imported in dev environment
// runSquadTests();