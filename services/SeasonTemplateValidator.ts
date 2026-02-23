
import { SeasonTemplate, CompetitionType } from '../types';

export const SeasonTemplateValidator = {
  validate: (template: SeasonTemplate): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    const slots = template.slots;

    // Helper to determine if an overlap is permissible
    // e.g. A TRANSFER_WINDOW can happen during a LEAGUE or BREAK.
    // e.g. A FRIENDLY can happen during a BREAK.
    const isOverlapPermissible = (typeA: CompetitionType, typeB: CompetitionType): boolean => {
      const allowedOverlaps = [
        CompetitionType.BREAK, 
        CompetitionType.OFF_SEASON,
        CompetitionType.TRANSFER_WINDOW
      ];
      
      // If either slot is a "status" or "activity" slot that naturally runs in parallel, ignore overlap
      if (allowedOverlaps.includes(typeA) || allowedOverlaps.includes(typeB)) {
        return true;
      }
      return false;
    };

    // 1. Check for Overlaps (Modified for permissibility)
    // Sort by time first to ensure sequential check logic holds
    const sortedSlots = [...slots].sort((a, b) => a.start.getTime() - b.start.getTime());

    for (let i = 0; i < sortedSlots.length - 1; i++) {
      const current = sortedSlots[i];
      // Check against subsequent slots that start before this one ends
      for (let j = i + 1; j < sortedSlots.length; j++) {
        const next = sortedSlots[j];
        
        // Optimization: if next starts after current ends, no need to check further
        if (next.start > current.end) break;

        // Overlap detected
        if (current.end >= next.start) {
           if (!isOverlapPermissible(current.competition, next.competition)) {
             errors.push(`Overlap detected: ${current.label} (${current.competition}) overlaps with ${next.label} (${next.competition})`);
           }
        }
      }
    }

    // 2. Count League Slots
    const leagueSlots = slots.filter(s => s.competition === CompetitionType.LEAGUE).length;
    if (leagueSlots < 34) {
      errors.push(`Insufficient League Slots: Found ${leagueSlots}, expected at least 34.`);
    }

    // 3. Check Winter Break for League
    // (Still enforce NO League Matches during the Break slot itself)
    const breakSlot = slots.find(s => s.competition === CompetitionType.BREAK);
    if (breakSlot) {
      const leagueDuringBreak = slots.some(s => 
        s.competition === CompetitionType.LEAGUE && 
        s.start >= breakSlot.start && 
        s.end <= breakSlot.end
      );
      if (leagueDuringBreak) {
        errors.push("Found League matches scheduled during Winter Break.");
      }
    }

    // 4. Super Cup Timing
    const superCup = slots.find(s => s.competition === CompetitionType.SUPER_CUP);
    const firstLeague = slots.find(s => s.competition === CompetitionType.LEAGUE && s.label.includes("1"));
    
    if (superCup && firstLeague) {
        const diffTime = Math.abs(firstLeague.start.getTime() - superCup.start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        if (diffDays < 6 || diffDays > 8) {
           errors.push(`Super Cup is not approx 1 week before League Start. Diff: ${diffDays} days.`);
        }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
};
