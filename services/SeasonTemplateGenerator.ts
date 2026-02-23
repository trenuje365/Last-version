import { CalendarSlot, SeasonTemplate, SlotType, CompetitionType } from '../types';

// Helper to manipulate dates without mutation
const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};


import { FIXED_SEASON_EVENTS } from '../resources/FixedSeasonDates';

export const SeasonTemplateGenerator = {
  generate: (seasonStartYear: number): SeasonTemplate => {
    const careerStartDate = new Date(seasonStartYear, 6, 9);
    
    const slots: CalendarSlot[] = FIXED_SEASON_EVENTS.map((event, index) => {
      // Logika mijania lat: miesiące 0-5 (styczeń-czerwiec) to rok następny
      const year = event.month <= 5 ? seasonStartYear + 1 : seasonStartYear;
      const date = new Date(year, event.month, event.day);
      
      return {
        id: `SLOT_${seasonStartYear}_${index}`,
        start: date,
        end: date, // W nowym systemie operujemy na konkretnych dniach
        slotType: event.type,
        competition: event.comp,
        label: event.label,
        priority: event.priority
      };
    });

    return { 
      seasonStartYear, 
      careerStartDate, 
      slots: slots.sort((a, b) => a.start.getTime() - b.start.getTime()) 
    };
  }
};

