import { Player, Club, PendingNegotiation, NegotiationStatus } from '../types';

export const FreeAgentNegotiationService = {
  // Sprawdza czy zawodnik w ogóle chce rozmawiać (Gatekeeping)
  evaluateInitialInterest: (player: Player, club: Club): { interested: boolean, message: string } => {
    // Jeśli zawodnik ma OVR > 75 a klub ma reputację < 5 -> 1% szansy
    if (player.overallRating > 69 && club.reputation < 5) {
      if (Math.random() > 0.01) {
        return { 
          interested: false, 
          message: "Mój klient nie jest zainteresowany grą na tym poziomie rozgrywkowym. Szukamy klubu o większej renomie." 
        };
      }
    }
    return { interested: true, message: "" };
  },

 createNegotiationEntry: (player: Player, club: Club, salary: number, bonus: number, years: number, currentDate: Date, squad: Player[]): PendingNegotiation => {
    // Obliczamy średnią płac w Twoim klubie dla agenta
    const avgSalary = squad.length > 0 ? squad.reduce((s, p) => s + p.annualSalary, 0) / squad.length : 120000;
    
    // Pobieramy "Złotą Liczbę" (oczekiwania)
    const expected = (player.overallRating * 2000); // Prosta baza dla prototypu
    
    // Klasyfikacja Twojej oferty
    const rating = (salary / expected);
    
    // Im gorsza oferta, tym agent dłużej "zwleka" (lub szybciej odrzuca)
    let daysToWait = 2;
    if (rating < 0.5) daysToWait = 1; // Natychmiastowe odrzucenie
    else if (rating < 0.9) daysToWait = 7 + Math.floor(Math.random() * 7);
    else daysToWait = 3 + Math.floor(Math.random() * 3);

    const responseDate = new Date(currentDate);
    responseDate.setDate(responseDate.getDate() + daysToWait);

    return {
      id: `NEG_${Date.now()}_${player.id}`,
      playerId: player.id,
      clubId: club.id,
      salary,
      bonus,
      years,
      responseDate: responseDate.toISOString(),
      status: NegotiationStatus.PENDING
    };
  }
};