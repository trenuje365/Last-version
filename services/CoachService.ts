import { Coach, Region, Club, MatchHistoryEntry, CoachHistoryEntry } from '../types';
import { NameGeneratorService } from './NameGeneratorService';

export const CoachService = {
  generateInitialCoaches: (clubs: Club[]): { coaches: Record<string, Coach>, updatedClubs: Club[] } => {
    const coaches: Record<string, Coach> = {};
    const coachList: Coach[] = [];

    for (let i = 0; i < 250; i++) {
      coachList.push(CoachService.createRandomCoach(i < 180));
    }

const updatedClubs = [...clubs];
    // Inicjalizujemy wszystkich trenerów w mapie obiektów
    coachList.forEach(c => { coaches[c.id] = c; });

    // Losowe przypisanie trenerów do klubów na podstawie progów reputacji
    updatedClubs.forEach(club => {
      let maxExp = 55;
      if (club.reputation >= 7) maxExp = 72;
      else if (club.reputation >= 4) maxExp = 65;

      // Szukamy wolnych trenerów spełniających kryterium doświadczenia
      const candidates = coachList.filter(c => 
        c.attributes.experience <= maxExp && 
        c.currentClubId === null
      );

      // Jeśli nie znaleziono trenera w wąskim zakresie (mało prawdopodobne), 
      // bierzemy jakiegokolwiek wolnego jako failsafe
      const coach = candidates.length > 0 
        ? candidates[Math.floor(Math.random() * candidates.length)]
        : coachList.find(c => c.currentClubId === null);

      if (coach) {
        coach.currentClubId = club.id;
        coach.history.push({
          clubId: club.id, clubName: club.name,
          fromYear: 2025, fromMonth: 7, toYear: null, toMonth: null
        });
        club.coachId = coach.id;
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
      hiredDate: new Date('2025-07-01').toISOString(), // Domyślna data startu sezonu
      blacklist: {},
      attributes: {
        experience: 20 + Math.floor(Math.random() * 75),
        decisionMaking: 30 + Math.floor(Math.random() * 60),
        motivation: 40 + Math.floor(Math.random() * 55),
        training: 35 + Math.floor(Math.random() * 60)
      },
      history: []
    };
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