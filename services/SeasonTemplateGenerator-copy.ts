import { CalendarSlot, SeasonTemplate, SlotType, CompetitionType } from '../types';

// Helper to manipulate dates without mutation
const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const getDayOfWeek = (date: Date): number => date.getDay(); // 0 = Sun, 1 = Mon, ... 6 = Sat

/**
 * Returns the Weekend Range (Sat-Sun) containing the given date.
 */
const getWeekendContaining = (date: Date): { start: Date; end: Date } => {
  const day = date.getDay(); // 0-6
  const result = new Date(date);
  
  if (day === 6) {
    return { start: new Date(result), end: addDays(result, 1) };
  } else if (day === 0) {
    return { start: addDays(result, -1), end: new Date(result) };
  } else {
    const diff = 6 - day;
    const sat = addDays(result, diff);
    return { start: sat, end: addDays(sat, 1) };
  }
};

/**
 * Returns the Midweek Range (Wed-Thu) for the week of the given date.
 */
const getMidweekForWeek = (date: Date): { start: Date; end: Date } => {
  const day = date.getDay();
  const diff = 3 - day;
  const wed = addDays(date, diff);
  return { start: wed, end: addDays(wed, 1) };
};

export const SeasonTemplateGenerator = {
  generate: (seasonStartYear: number): SeasonTemplate => {
    const slots: CalendarSlot[] = [];
    let slotCounter = 0;

    // Career Start: July 11
    const careerStartDate = new Date(seasonStartYear, 6, 9);
    
    // League Start Anchor: July 19
    const leagueStartAnchor = new Date(seasonStartYear, 6, 19);
    const leagueRound1Weekend = getWeekendContaining(leagueStartAnchor);
    
    // Winter Break Anchor: Dec 5
    const winterBreakAnchor = new Date(seasonStartYear, 11, 5);
    const autumnLastLeagueWeekend = getWeekendContaining(winterBreakAnchor);
    const winterBreakStart = addDays(autumnLastLeagueWeekend.end, 1);
    const winterBreakEnd = new Date(seasonStartYear + 1, 0, 29);
    
    // Spring Start Anchor: Jan 30
    const springStartAnchor = new Date(seasonStartYear + 1, 0, 30);
    const springFirstLeagueWeekend = getWeekendContaining(springStartAnchor);
    
    // League End Anchor: May 23
    const leagueEndAnchor = new Date(seasonStartYear + 1, 4, 23);
    const lastLeagueWeekend = getWeekendContaining(leagueEndAnchor);

    const addSlot = (start: Date, end: Date, type: SlotType, comp: CompetitionType, label: string, priority: number, meta?: any) => {
      slots.push({
        id: `SLOT_${seasonStartYear}_${slotCounter++}`,
        start,
        end,
        slotType: type,
        competition: comp,
        label,
        priority,
        metadata: meta
      });
    };

    // --- POLISH CUP DRAWS (NEW) ---
    // --- PRE-SEASON PREPARATION (STAGE 1 PRO) ---
    addSlot(
      new Date(seasonStartYear, 6, 9), // 9 Lipca
      new Date(seasonStartYear, 6, 9), 
      SlotType.MIDWEEK, 
      CompetitionType.BREAK, 
      "Przygotowanie do sezonu", 
      100
    );
     // --- END OF PRE-SEASON PREPARATION (STAGE 1 PRO) ---
    addSlot(new Date(seasonStartYear, 6, 28), new Date(seasonStartYear, 6, 28), SlotType.MIDWEEK, CompetitionType.POLISH_CUP, "LOSOWANIE PUCHARU POLSKI 1/64", 40);
    addSlot(new Date(seasonStartYear, 7, 18), new Date(seasonStartYear, 7, 18), SlotType.MIDWEEK, CompetitionType.POLISH_CUP, "LOSOWANIE PUCHARU POLSKI 1/32", 40);
    addSlot(new Date(seasonStartYear, 8, 22), new Date(seasonStartYear, 8, 22), SlotType.MIDWEEK, CompetitionType.POLISH_CUP, "LOSOWANIE PUCHARU POLSKI 1/16", 40);
    addSlot(new Date(seasonStartYear, 9, 20), new Date(seasonStartYear, 9, 20), SlotType.MIDWEEK, CompetitionType.POLISH_CUP, "LOSOWANIE PUCHARU POLSKI 1/8", 40);
    addSlot(new Date(seasonStartYear, 10, 17), new Date(seasonStartYear, 10, 17), SlotType.MIDWEEK, CompetitionType.POLISH_CUP, "LOSOWANIE PUCHARU POLSKI 1/4", 40);
    addSlot(new Date(seasonStartYear + 1, 2, 16), new Date(seasonStartYear + 1, 2, 16), SlotType.MIDWEEK, CompetitionType.POLISH_CUP, "LOSOWANIE PUCHARU POLSKI 1/2", 40);

    // Winter Break & Activities
    addSlot(winterBreakStart, winterBreakEnd, SlotType.WEEKEND, CompetitionType.BREAK, "Przerwa Zimowa", 100);
    const winterFirstWeekMidweek = getMidweekForWeek(addDays(winterBreakStart, 7));
    addSlot(winterFirstWeekMidweek.start, winterFirstWeekMidweek.end, SlotType.MIDWEEK, CompetitionType.TRANSFER_WINDOW, "Okno Transferowe (Zima I)", 60);
    const midBreakTimestamp = (winterBreakStart.getTime() + winterBreakEnd.getTime()) / 2;
    const midBreakWeekend = getWeekendContaining(new Date(midBreakTimestamp));
    addSlot(midBreakWeekend.start, midBreakWeekend.end, SlotType.WEEKEND, CompetitionType.FRIENDLY, "Sparing Zimowy", 50);
    const winterLastWeekMidweek = getMidweekForWeek(addDays(winterBreakEnd, -7));
    addSlot(winterLastWeekMidweek.start, winterLastWeekMidweek.end, SlotType.MIDWEEK, CompetitionType.TRANSFER_WINDOW, "Okno Transferowe (Zima II)", 60);

    // Super Cup & Cup Final
 const superCupDate = new Date(seasonStartYear, 6, 12);
    addSlot(superCupDate, superCupDate, SlotType.WEEKEND, CompetitionType.SUPER_CUP, "Superpuchar Polski", 90);
    
for (let d = 14; d <= 18; d++) {
  const prepDate = new Date(seasonStartYear, 6, d); // Miesiąc 6 to Lipiec
  addSlot(
    prepDate, 
    prepDate, 
    SlotType.MIDWEEK, 
    CompetitionType.TRANSFER_WINDOW, 
    "Letnie przygotowania i transfery", 
    75
  );
}

    // SZTYWNY FINAŁ: 30 MAJA
    const polishCupFinalDate = new Date(seasonStartYear + 1, 4, 30); 
    addSlot(polishCupFinalDate, polishCupFinalDate, SlotType.WEEKEND, CompetitionType.POLISH_CUP, "Puchar Polski: FINAŁ", 90);
    
    addSlot(addDays(polishCupFinalDate, 1), new Date(seasonStartYear + 1, 5, 30), SlotType.WEEKEND, CompetitionType.OFF_SEASON, "Przerwa Posezonowa / Urlopy", 100);
    const isBusy = (start: Date, end: Date): boolean => {
      return slots.some(s => {
        if (s.competition === CompetitionType.BREAK || s.competition === CompetitionType.OFF_SEASON || s.competition === CompetitionType.TRANSFER_WINDOW || s.competition === CompetitionType.FRIENDLY || s.label.includes("LOSOWANIE")) {
          return false;
        }
        return (start <= s.end && end >= s.start);
      });
    };

    const scheduleCupRound = (baseDate: Date, offsetWeeks: number, label: string) => {
      let targetStart = addDays(baseDate, offsetWeeks * 7);
      let range = getWeekendContaining(targetStart);
      let safety = 0;
      while (isBusy(range.start, range.end) && safety < 10) {
        targetStart = addDays(targetStart, 7);
        range = getWeekendContaining(targetStart);
        safety++;
      }
      addSlot(range.start, range.end, SlotType.WEEKEND, CompetitionType.POLISH_CUP, label, 50);
    };
    // --- STAGE 1 PRO: SZTYWNE DATY PUCHARU POLSKI ---
    const year = seasonStartYear;
    const nextYear = seasonStartYear + 1;

    addSlot(new Date(year, 7, 16), new Date(year, 7, 16), SlotType.WEEKEND, CompetitionType.POLISH_CUP, "Puchar Polski: 1/64", 50);
    addSlot(new Date(year, 8, 20), new Date(year, 8, 20), SlotType.WEEKEND, CompetitionType.POLISH_CUP, "Puchar Polski: 1/32", 50);
    addSlot(new Date(year, 9, 18), new Date(year, 9, 18), SlotType.WEEKEND, CompetitionType.POLISH_CUP, "Puchar Polski: 1/16", 50);
    addSlot(new Date(year, 10, 15), new Date(year, 10, 15), SlotType.WEEKEND, CompetitionType.POLISH_CUP, "Puchar Polski: 1/8", 50);
    addSlot(new Date(nextYear, 2, 14), new Date(nextYear, 2, 14), SlotType.WEEKEND, CompetitionType.POLISH_CUP, "Puchar Polski: 1/4", 50);
    addSlot(new Date(nextYear, 3, 18), new Date(nextYear, 3, 18), SlotType.WEEKEND, CompetitionType.POLISH_CUP, "Puchar Polski: 1/2", 50);

    const scheduleEuroRound = (baseDate: Date, offsetWeeks: number, label: string) => {
      let targetStart = addDays(baseDate, offsetWeeks * 7);
      let range = getMidweekForWeek(targetStart);
      let safety = 0;
      while (isBusy(range.start, range.end) && safety < 10) {
        targetStart = addDays(targetStart, 7);
        range = getMidweekForWeek(targetStart);
        safety++;
      }
      addSlot(range.start, range.end, SlotType.MIDWEEK, CompetitionType.EURO_CUP, label, 60);
    };

    scheduleEuroRound(leagueRound1Weekend.start, 3, "Euro: 1/64");
    scheduleEuroRound(leagueRound1Weekend.start, 8, "Euro: 1/32");
    scheduleEuroRound(leagueRound1Weekend.start, 12, "Euro: 1/16");
    scheduleEuroRound(springFirstLeagueWeekend.start, 3, "Euro: 1/8");
    scheduleEuroRound(springFirstLeagueWeekend.start, 7, "Euro: 1/4");
    scheduleEuroRound(springFirstLeagueWeekend.start, 10, "Euro: 1/2");
    addSlot(getMidweekForWeek(addDays(lastLeagueWeekend.start, -4)).start, getMidweekForWeek(addDays(lastLeagueWeekend.start, -4)).end, SlotType.MIDWEEK, CompetitionType.EURO_CUP, "Euro: FINAŁ", 60);

    const rawLeagueSlots: CalendarSlot[] = [];
    let current = new Date(leagueRound1Weekend.start);
    const seasonEnd = new Date(lastLeagueWeekend.end);

    while (current <= seasonEnd) {
       if (!(current >= winterBreakStart && current <= winterBreakEnd)) {
          const range = getWeekendContaining(current);
          if (!isBusy(range.start, range.end)) {
             rawLeagueSlots.push({ id: `TEMP_${rawLeagueSlots.length}`, start: range.start, end: range.end, slotType: SlotType.WEEKEND, competition: CompetitionType.LEAGUE, label: "TEMP", priority: 10 });
          }
       }
       current = addDays(current, 7);
    }

    const needed = 34 - rawLeagueSlots.length;
    if (needed > 0) {
       let added = 0;
       let scanDate = addDays(new Date(leagueRound1Weekend.start), 7);
       while (scanDate <= seasonEnd && added < needed) {
          if (!(scanDate >= winterBreakStart && scanDate <= winterBreakEnd)) {
             const mw = getMidweekForWeek(scanDate);
             if (!isBusy(mw.start, mw.end)) {
                rawLeagueSlots.push({ id: `TEMP_MW_${added}`, start: mw.start, end: mw.end, slotType: SlotType.MIDWEEK, competition: CompetitionType.LEAGUE, label: "TEMP", priority: 10 });
                added++;
             }
          }
          scanDate = addDays(scanDate, 7);
       }
    }

    rawLeagueSlots.sort((a, b) => a.start.getTime() - b.start.getTime()).forEach((slot, index) => {
        slot.label = `Liga: Kolejka ${index + 1}`;
        slot.id = `SLOT_${seasonStartYear}_LEAGUE_${index + 1}`;
        slots.push(slot);
    });

    slots.sort((a, b) => a.start.getTime() - b.start.getTime());

    return { seasonStartYear, careerStartDate, slots };
  }
};