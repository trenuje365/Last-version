import { Coach, Region, Club, MatchHistoryEntry, CoachHistoryEntry } from '../types';
import { NameGeneratorService } from './NameGeneratorService';

const TACTICS_OFFENSIVE = ['4-3-3 Atak', '3-4-3', 'Wysoki Pressing', 'Total Football', '4-1-2-1-2'];
const TACTICS_NEUTRAL   = ['4-4-2', '4-3-3 Zrównoważona', '3-5-2', '4-5-1', '4-2-3-1', '5-3-2'];
const TACTICS_DEFENSIVE = ['5-4-1', '5-3-2 Blok', '4-4-2 Kontratak', 'Niski Blok', '4-5-1 Defensywna', '3-6-1'];

const randomTactic = (list: string[]) => list[Math.floor(Math.random() * list.length)];

export const CoachService = {
  generateInitialCoaches: (clubs: Club[]): { coaches: Record<string, Coach>, updatedClubs: Club[] } => {
    const coaches: Record<string, Coach> = {};
    const coachList: Coach[] = [];

    for (let i = 0; i < 1500; i++) {
      coachList.push(CoachService.createRandomCoach(i < 180));
    }

const updatedClubs = [...clubs];
    // Inicjalizujemy wszystkich trenerów w mapie obiektów
    coachList.forEach(c => { coaches[c.id] = c; });

   // Losowe przypisanie trenerów do klubów na podstawie progów reputacji
    updatedClubs.forEach(club => {
      let minExp = 0;
      let maxExp = 55;

      if (club.leagueId === 'L_CL' || club.leagueId === 'L_EL' || club.leagueId === 'L_CONF') {
        // Trenerzy dla klubów europejskich — wg reputacji (koreluje z tier)
        if (club.reputation >= 18) { minExp = 80; maxExp = 99; }       // Tier 1 top (Real, Bayern, PSG)
        else if (club.reputation >= 15) { minExp = 70; maxExp = 88; }  // Tier 1 (Porto, Benfica)
        else if (club.reputation >= 12) { minExp = 48; maxExp = 75; }  // Tier 2 (Club Brugge, Dinamo)
        else { minExp = 10; maxExp = 60; }                             // Tier 3/4 (Sheriff, Žalgiris)
      } else {
        // Polskie kluby — stara logika
        if (club.reputation >= 7) maxExp = 72;
        else if (club.reputation >= 4) maxExp = 65;
      }

      // Szukamy wolnych trenerów spełniających kryterium doświadczenia
    // Dla europejskich Tier 1 i 2 (reputacja >= 12) — trener nie może być Polakiem
      const excludePolish = (club.leagueId === 'L_CL' || club.leagueId === 'L_EL' || club.leagueId === 'L_CONF') && club.reputation >= 12;

      const isPolishClub = club.leagueId !== 'L_CL' && club.leagueId !== 'L_EL' && club.leagueId !== 'L_CONF';
      const polishCandidates = isPolishClub ? coachList.filter(c =>
        c.attributes.experience >= minExp &&
        c.attributes.experience <= maxExp &&
        c.currentClubId === null &&
        c.nationality === Region.POLAND
      ) : [];
      const candidates = polishCandidates.length > 0
        ? polishCandidates
        : coachList.filter(c =>
            c.attributes.experience >= minExp &&
            c.attributes.experience <= maxExp &&
            c.currentClubId === null &&
            (!excludePolish || c.nationality !== Region.POLAND)
          );

           // Jeśli nie znaleziono trenera — stopniowo obniżaj minExp o 5 aż do znalezienia
      let finalCandidates = candidates;
      let searchMinExp = minExp;
      while (finalCandidates.length === 0 && searchMinExp > 0) {
        searchMinExp = Math.max(0, searchMinExp - 5);
              finalCandidates = coachList.filter(c =>
          c.attributes.experience >= searchMinExp &&
          c.attributes.experience <= maxExp &&
          c.currentClubId === null &&
          (!excludePolish || c.nationality !== Region.POLAND)
        );
      }
      // Ostateczny failsafe — jeśli nadal brak, bierzemy jakiegokolwiek wolnego
      const coach = finalCandidates.length > 0
        ? finalCandidates[Math.floor(Math.random() * finalCandidates.length)]
        : coachList.find(c => c.currentClubId === null);
          if (coach) {
        coach.currentClubId = club.id;
        coach.history.push({
          clubId: club.id, clubName: club.name,
          fromYear: 2025, fromMonth: 7, toYear: null, toMonth: null
        });
        club.coachId = coach.id;

        // Dla europejskich Tier 1 (rep >= 18) — każdy atrybut poniżej 80 losujemy między 80-99
        if ((club.leagueId === 'L_CL' || club.leagueId === 'L_EL' || club.leagueId === 'L_CONF') && club.reputation >= 18) {
          const attrs = coach.attributes;
          const keys: (keyof typeof attrs)[] = ['experience', 'decisionMaking', 'motivation', 'training'];
          keys.forEach(key => {
            if (attrs[key] < 80) {
              attrs[key] = 80 + Math.floor(Math.random() * 20);
            }
          });
        }
      }
    });
    return { coaches, updatedClubs };
  },

createRandomCoach: (isPolish: boolean): Coach => {
    const region = isPolish ? Region.POLAND : NameGeneratorService.getRandomForeignRegion();
    const namePair = NameGeneratorService.getRandomName(region);
    return {
      id: `COACH_${Math.random().toString(36).substr(2, 9)}`,
      firstName: namePair.firstName,
      lastName: namePair.lastName,
      age: 35 + Math.floor(Math.random() * 35),
      nationality: region,
      nationalityFlag: isPolish ? '🇵🇱' : '🌍',
      currentClubId: null,
      currentNationalTeamId: null,
      isNationalTeamCoach: false,
      hiredDate: new Date('2025-07-01').toISOString(), // Domyślna data startu sezonu
      blacklist: {},
      attributes: {
        experience: 20 + Math.floor(Math.random() * 75),
        decisionMaking: 30 + Math.floor(Math.random() * 60),
        motivation: 40 + Math.floor(Math.random() * 55),
        training: 35 + Math.floor(Math.random() * 60)
      },
      favoriteTactics: {
        offensive: randomTactic(TACTICS_OFFENSIVE),
        neutral: randomTactic(TACTICS_NEUTRAL),
        defensive: randomTactic(TACTICS_DEFENSIVE)
      },
      history: []
    };
  },

  generateNationalTeamCoaches: (): Coach[] => {
    // Generuje ~500 trenerów dedykowanych reprezentacjom narodowym (overhead dla 208 drużyn)
    // Rozłożonych proporcjonalnie po 5 przedziałach doświadczenia odpowiadających reputacji NT
    const tiers = [
      { minExp: 85, maxExp: 99, count: 100 }, // rep 18-20: światowe potęgi
      { minExp: 65, maxExp: 84, count: 100 }, // rep 14-17: silne reprezentacje
      { minExp: 40, maxExp: 64, count: 120 }, // rep 10-13: średnie reprezentacje
      { minExp: 20, maxExp: 39, count: 100 }, // rep 6-9:  słabe reprezentacje
      { minExp: 5,  maxExp: 19, count: 80  }, // rep 1-5:  najsłabsze reprezentacje
    ];
    const result: Coach[] = [];
    tiers.forEach(({ minExp, maxExp, count }) => {
      for (let i = 0; i < count; i++) {
        const region = NameGeneratorService.getRandomForeignRegion();
        const namePair = NameGeneratorService.getRandomName(region);
        const exp = minExp + Math.floor(Math.random() * (maxExp - minExp + 1));
        result.push({
          id: `NT_COACH_${Math.random().toString(36).substr(2, 9)}`,
          firstName: namePair.firstName,
          lastName: namePair.lastName,
          age: 35 + Math.floor(Math.random() * 35),
          nationality: region,
          nationalityFlag: '🌍',
          currentClubId: null,
          currentNationalTeamId: null,
          isNationalTeamCoach: true,
          hiredDate: new Date('2025-07-01').toISOString(),
          blacklist: {},
          attributes: {
            experience: exp,
            decisionMaking: 20 + Math.floor(Math.random() * 79),
            motivation: 20 + Math.floor(Math.random() * 79),
            training: 20 + Math.floor(Math.random() * 79)
          },
          favoriteTactics: {
            offensive: randomTactic(TACTICS_OFFENSIVE),
            neutral: randomTactic(TACTICS_NEUTRAL),
            defensive: randomTactic(TACTICS_DEFENSIVE)
          },
          history: []
        });
      }
    });
    return result;
  },

  evaluatePerformance: (club: Club, coach: Coach, rank: number): { fire: boolean, reason: string } => {
    const expectedRank = Math.max(1, 15 - club.reputation);
    const distance = rank - expectedRank;
    
    // Kryzys: miejsce gorsze o 5 niż oczekiwane
    if (distance >= 8) {
      const chance = Math.random();
      if (chance < 0.4) return { fire: true, reason: "Brak wyników sportowych i niezadowolenie kibiców." };
    }

    // Katastrofa: strefa spadkowa przy wysokiej reputacji
    if (rank >= 16 && club.reputation >= 7) {
      if (Math.random() < 0.7) return { fire: true, reason: "Kompromitująca pozycja w tabeli względem potencjału." };
    }

    return { fire: false, reason: "" };
  }
};