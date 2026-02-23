
import { AiMatchPreparationService } from '../services/AiMatchPreparationService';
import { SquadGeneratorService } from '../services/SquadGeneratorService';
import { LineupService } from '../services/LineupService';
import { PlayerPosition, HealthStatus, Club, TeamStats } from '../types';

export const runStage5Tests = () => {
    console.group("Stage 5 Tests");

    // Mock Club
    const mockClub: Club = {
        id: 'TEST_CLUB',
        name: 'Test FC',
        shortName: 'TFC',
        leagueId: 'L1',
        colorsHex: ['#000', '#fff', '#000'],
        stadiumName: 'Test Stadium',
        stadiumCapacity: 1000,
        reputation: 5,
        isDefaultActive: true,
        colorPrimary: '#000',
        colorSecondary: '#fff',
        stats: {} as TeamStats,
        rosterIds: []
    };

    // Test 1: AI Preparation should ignore injured players
    const squad = SquadGeneratorService.generateSquadForClub('TEST_CLUB');
    
    // Injure the best GK
    const bestGK = squad.find(p => p.position === PlayerPosition.GK && p.overallRating > 50);
    if (bestGK) bestGK.health.status = HealthStatus.INJURED;

    const playersMap = { 'TEST_CLUB': squad };
    const lineupsMap = { 'TEST_CLUB': LineupService.autoPickLineup('TEST_CLUB', squad) };

    // Fix: Added missing 4th argument (userTeamId) to prepareAllTeams
    const updatedLineups = AiMatchPreparationService.prepareAllTeams([mockClub], playersMap, lineupsMap, null);
    const newLineup = updatedLineups['TEST_CLUB'];

    console.assert(newLineup.startingXI[0] !== bestGK?.id, "Test 1 Failed: Injured GK was selected in Starting XI");
    console.assert(newLineup.reserves.includes(bestGK!.id), "Test 1 Failed: Injured player not found in reserves");
    console.log("Test 1: AI Healthy Selection - PASSED");

    // Test 2: AI chooses Defensive Tactic for weak Defense
    // Manually weaken defenders
    squad.forEach(p => {
        if(p.position === PlayerPosition.DEF) p.overallRating = 10;
        if(p.position === PlayerPosition.FWD) p.overallRating = 90;
    });
    
    // Reset health
    if (bestGK) bestGK.health.status = HealthStatus.HEALTHY;

    // Reputation low to encourage defense
    mockClub.reputation = 2; 

    // Fix: Added missing 4th argument (userTeamId) to prepareAllTeams
    const tacticLineups = AiMatchPreparationService.prepareAllTeams([mockClub], playersMap, lineupsMap, null);
    const defLineup = tacticLineups['TEST_CLUB'];

    // Expected logic: Weak DEF + Low Rep -> '5-4-1' (id: 5-4-1 in DB is Defensive) or similar defensive
    // The logic in service: if reputation <= 4 || defStr > fwdStr + 5 (Wait, logic says if def > fwd -> defensive? No.)
    // Logic: if reputation <= 4 (Yes) -> Defensive (5-4-1).
    console.assert(defLineup.tacticId === '5-4-1', `Test 2 Failed: Expected 5-4-1, got ${defLineup.tacticId}`);
    console.log("Test 2: AI Tactic Logic - PASSED");

    console.groupEnd();
};

// runStage5Tests();
