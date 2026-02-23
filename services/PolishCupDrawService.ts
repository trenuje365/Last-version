import { Club, Fixture, MatchStatus, CompetitionType } from '../types';

export const PolishCupDrawService = {
  /**
   * Przygotowuje listę 128 uczestników dla rundy 1/64.
   */
  getInitialParticipants: (clubs: Club[]): string[] => {
    const tier1 = clubs.filter(c => c.leagueId === 'L_PL_1').map(c => c.id);
    const tier2 = clubs.filter(c => c.leagueId === 'L_PL_2').map(c => c.id);
    const tier3 = clubs.filter(c => c.leagueId === 'L_PL_3').map(c => c.id);
    const tier4Pool = clubs.filter(c => c.leagueId === 'L_PL_4');

    // 18 + 18 + 18 = 54. Potrzebujemy 128 - 54 = 74 z Tier 4.
    const selectedTier4 = [...tier4Pool]
      .sort((a, b) => a.id.localeCompare(b.id))
      .slice(0, 74)
      .map(c => c.id);

    return [...tier1, ...tier2, ...tier3, ...selectedTier4];
  },

  /**
   * Losuje pary z podanej listy uczestników.
   * Używa prostego generatora pseudo-losowego z ziarnem (seed), aby wynik był stały dla danej rundy w danym dniu.
   */
  drawPairs: (participantIds: string[], clubs: Club[], date: Date, roundLabel: string, sessionSeed: number): Fixture[] => {
    // Iniekcja unikalnego ziarna sesji dla pełnej losowości przy każdym starcie nowej gry
    const seedStr = roundLabel + date.getFullYear() + sessionSeed;
    let hash = 0;
    for (let i = 0; i < seedStr.length; i++) {
      hash = ((hash << 5) - hash) + seedStr.charCodeAt(i);
      hash |= 0;
    }

    const seededRandom = () => {
      const x = Math.sin(hash++) * 10000;
      return x - Math.floor(x);
    };

    // Fisher-Yates Shuffle (Senior Grade) - eliminuje bias standardowego sortowania
    const shuffled = [...participantIds];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(seededRandom() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const fixtures: Fixture[] = [];

    const getTierValue = (clubId: string) => {
      const c = clubs.find(x => x.id === clubId);
      if (!c) return 4;
      if (c.leagueId === 'L_PL_1') return 1;
      if (c.leagueId === 'L_PL_2') return 2;
      if (c.leagueId === 'L_PL_3') return 3;
      return 4;
    };

    const cleanRoundLabel = roundLabel.replace("LOSOWANIE ", "");

    for (let i = 0; i < shuffled.length; i += 2) {
      const teamA = shuffled[i];
      const teamB = shuffled[i + 1];

      const tierA = getTierValue(teamA);
      const tierB = getTierValue(teamB);

      let homeTeamId = teamA;
      let awayTeamId = teamB;

      // Zasada: Niższa liga gości wyższą ligę (standard pucharowy)
      if (tierA > tierB) {
        homeTeamId = teamA;
        awayTeamId = teamB;
      } else if (tierB > tierA) {
        homeTeamId = teamB;
        awayTeamId = teamA;
      }

      fixtures.push({
        id: `CUP_${cleanRoundLabel.replace(/\s+/g, '_')}_${i}`,
        leagueId: CompetitionType.POLISH_CUP,
        homeTeamId,
        awayTeamId,
        date: new Date(date),
        status: MatchStatus.SCHEDULED,
        homeScore: null,
        awayScore: null
      });
    }

    return fixtures;
  }
};