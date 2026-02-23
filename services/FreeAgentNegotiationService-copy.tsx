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

  // Generuje dane o tym, kiedy agent odpowie
  createNegotiationEntry: (player: Player, club: Club, salary: number, bonus: number, years: number, currentDate: Date): PendingNegotiation => {
    const daysToWait = 3 + Math.floor(Math.random() * 12); // 3-14 dni
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