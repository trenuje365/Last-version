
import { Fixture, Club, Player, MatchStatus, Lineup, CompetitionType, HealthStatus, InjurySeverity } from '../types';
import { LeagueBackgroundMatchEngine } from './LeagueBackgroundMatchEngine';
import { PolandWeatherService } from './PolandWeatherService';
import { PlayerStatsService } from './PlayerStatsService';
import { AiMatchPreparationService } from './AiMatchPreparationService';
import { MatchHistoryService } from './MatchHistoryService';
import { MatchEventType } from '../types';
import { GoalAttributionService } from './GoalAttributionService';

/**
 * Procesor dla rozgrywek Pucharu Polski i Superpucharu w tle.
 * Używa pełnego silnika ligowego + pucharowe modyfikatory dla większego dramatu i realizmu.
 */
export const BackgroundMatchProcessorPolishCup = {
  processCupEvent: (
    currentDate: Date,
    userTeamId: string | null,
    fixtures: Fixture[],
    clubs: Club[],
    playersMap: Record<string, Player[]>,
    lineups: Record<string, Lineup>,
    careerSeed: number,
    seasonNumber: number 
  ): {
    updatedFixtures: Fixture[], 
    updatedPlayers: Record<string, Player[]>,
    updatedLineups: Record<string, Lineup>,
    updatedClubs: Club[]
  } => {
    
    const dateStr = currentDate.toDateString();
    const todayCupFixtures = fixtures.filter(f => 
      f.date.toDateString() === dateStr && 
      f.status === MatchStatus.SCHEDULED &&
      (f.leagueId === CompetitionType.POLISH_CUP || f.leagueId === CompetitionType.SUPER_CUP) &&
      f.homeTeamId !== userTeamId && 
      f.awayTeamId !== userTeamId
    );

    let currentFixtures = [...fixtures];
    let currentPlayers = { ...playersMap };
    let currentClubs = [...clubs];
    
    const newLineups = AiMatchPreparationService.prepareAllTeams(clubs, playersMap, lineups, userTeamId);

    if (todayCupFixtures.length === 0) {
      return { updatedFixtures: fixtures, updatedPlayers: playersMap, updatedLineups: newLineups, updatedClubs: currentClubs };
    }

    todayCupFixtures.forEach(fixture => {
      const home = currentClubs.find(c => c.id === fixture.homeTeamId)!;
      const away = currentClubs.find(c => c.id === fixture.awayTeamId)!;
      const hPlayers = currentPlayers[home.id] || [];
      const aPlayers = currentPlayers[away.id] || [];
      const hLineup = newLineups[home.id];
      const aLineup = newLineups[away.id];

      if (!hLineup || !aLineup) return;

      // Seed dla powtarzalności
      const clubSalt = home.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const matchHash = fixture.id.split('').reduce((a, b) => (a << 5) - a + b.charCodeAt(0), 0);
      const seed = (matchHash ^ clubSalt) ^ (currentDate.getTime() / 1000 | 0) ^ careerSeed;
      const seededRng = (offset: number) => {
        let t = (seed + offset) | 0;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
      };

      // POGODA – dynamiczna
      const weatherSeed = `${fixture.id}_${currentDate.getTime()}`;
      const weather = PolandWeatherService.getWeather(currentDate, weatherSeed);
      const isBadWeather = weather.precipitationChance > 50 || weather.tempC < 2;
      const weatherEqualizer = isBadWeather ? 0.75 : 1.0;

      // ATUT WŁASNEGO STADIONU – wyłączony w finale i Superpucharze
      const isNeutralVenue = fixture.leagueId === CompetitionType.SUPER_CUP || fixture.id.includes("FINAŁ");
      const homeAdvantage = isNeutralVenue ? 1.0 : 1.05;

      // Podstawowa symulacja 90 minut
      let result = LeagueBackgroundMatchEngine.simulate(
        fixture, home, away, hPlayers, aPlayers, hLineup, aLineup, seed
      );

      // Zastosuj pogodę i atut stadionu do bazowego wyniku
      result.homeScore = Math.round(result.homeScore * weatherEqualizer * homeAdvantage);
      result.awayScore = Math.round(result.awayScore * weatherEqualizer);

      // GIANT-KILLING – rzadkie sensacje
      const reputationDiff = Math.abs(home.reputation - away.reputation);
      if (reputationDiff >= 3) {
        const boost = 1.0 + (reputationDiff * 0.01); // max +10–15%
        if (home.reputation < away.reputation) {
          result.homeScore = Math.round(result.homeScore * boost);
        } else if (away.reputation < home.reputation) {
          result.awayScore = Math.round(result.awayScore * boost);
        }
      }

      // NAPIĘCIE PUCHAROWE – więcej czerwonych kartek
      result.cards = result.cards.map(card => {
        if (card.type === MatchEventType.YELLOW_CARD && seededRng(card.minute + 123) < 0.12) {
          return { ...card, type: MatchEventType.RED_CARD };
        }
        return card;
      });

      // MORALE DYNAMICZNE – aktualizacja po każdej bramce
      const sortedGoals = [...result.scorers].sort((a, b) => a.minute - b.minute);

      let currentHomeScore = 0;
      let currentAwayScore = 0;

      const homePlayerIds = new Set(hPlayers.map(p => p.id));

      sortedGoals.forEach(goal => {
        if (homePlayerIds.has(goal.playerId)) {
          currentHomeScore++;
        } else {
          currentAwayScore++;
        }

        // Przegrywanie ≥3 → przeciwnik +20% goli (więcej błędów)
        if (currentHomeScore - currentAwayScore >= 3) {
          result.awayScore = Math.round(result.awayScore * 1.2);
        } else if (currentAwayScore - currentHomeScore >= 3) {
          result.homeScore = Math.round(result.homeScore * 1.2);
        }
      });

      // DOGRYWKA
      let finalHomeScore = result.homeScore;
      let finalAwayScore = result.awayScore;
      let penaltyHome: number | undefined;
      let penaltyAway: number | undefined;

      if (result.homeScore === result.awayScore) {
        const extraTimeSeed = seed ^ 12345;
        const extraTime = LeagueBackgroundMatchEngine.simulate(
          fixture, home, away, hPlayers, aPlayers, hLineup, aLineup, extraTimeSeed
        );

        const etHomeGoals = Math.round(extraTime.homeScore * 0.35);
        const etAwayGoals = Math.round(extraTime.awayScore * 0.35);

        finalHomeScore += etHomeGoals;
        finalAwayScore += etAwayGoals;

        // Dodajemy gole z dogrywki do listy strzelców (minuty 91–120)
        const addExtraTimeGoals = (count: number, isHome: boolean) => {
          for (let i = 0; i < count; i++) {
            const sideOffset = isHome ? 0 : 1000;
            const scorer = GoalAttributionService.pickScorer(
              isHome ? hPlayers : aPlayers,
              isHome ? hLineup.startingXI as string[] : aLineup.startingXI as string[],
              false,
              () => seededRng(sideOffset + 9000 + i)
            );
            const assistant = GoalAttributionService.pickAssistant(
              isHome ? hPlayers : aPlayers,
              isHome ? hLineup.startingXI as string[] : aLineup.startingXI as string[],
              scorer.id,
              false,
              () => seededRng(sideOffset + 10000 + i)
            );
            const minute = 91 + Math.floor(seededRng(sideOffset + 11000 + i) * 30); // 91–120
            result.scorers.push({
              playerId: scorer.id,
              assistId: assistant?.id,
              minute,
              isPenalty: false
            });
          }
        };

        addExtraTimeGoals(etHomeGoals, true);
        addExtraTimeGoals(etAwayGoals, false);
      }

      // SUROWA KARA ZA CZERWONE KARTKI
      const getRedCardsCount = (targetClubId: string) => {
        return result.cards.filter(c => {
          const player = (currentPlayers[home.id] || []).concat(currentPlayers[away.id] || [])
            .find(p => p.id === c.playerId);
          return player?.clubId === targetClubId && c.type === MatchEventType.RED_CARD;
        }).length;
      };

      const homeRedCards = getRedCardsCount(home.id);
      const awayRedCards = getRedCardsCount(away.id);

      if (homeRedCards > 0) {
        let baseMultiplier = 1.0;
        if (homeRedCards === 1) baseMultiplier = 0.4;
        else if (homeRedCards === 2) baseMultiplier = 0.15;
        else if (homeRedCards >= 3) baseMultiplier = 0.01;

        const randomFactor = 0.9 + seededRng(999) * 0.2;
        finalHomeScore = Math.max(0, Math.round(finalHomeScore * baseMultiplier * randomFactor));
      }

      if (awayRedCards > 0) {
        let baseMultiplier = 1.0;
        if (awayRedCards === 1) baseMultiplier = 0.4;
        else if (awayRedCards === 2) baseMultiplier = 0.15;
        else if (awayRedCards >= 3) baseMultiplier = 0.01;

        const randomFactor = 0.9 + seededRng(888) * 0.2;
        finalAwayScore = Math.max(0, Math.round(finalAwayScore * baseMultiplier * randomFactor));
      }

      // FINALNA WERYFIKACJA KARNYCH (PO WSZYSTKICH KARACH)
      if (finalHomeScore === finalAwayScore) {
        const repBias = (home.reputation - away.reputation) * 0.004;
        const roll = seededRng(777) - repBias;
        if (roll < 0.35) { penaltyHome = 5; penaltyAway = 4; }
        else if (roll < 0.70) { penaltyHome = 4; penaltyAway = 5; }
        else if (roll < 0.82) { penaltyHome = 4; penaltyAway = 3; }
        else if (roll < 0.94) { penaltyHome = 3; penaltyAway = 4; }
        else { penaltyHome = 3; penaltyAway = 2; }
      }

      // Poprawne liczenie bramek przypisanych do zawodników danej drużyny
      const getScoredByTeam = (teamPlayers: Player[]) => {
        const teamIds = new Set(teamPlayers.map(p => p.id));
        return result.scorers.filter(s => teamIds.has(s.playerId)).length;
      };

      const missingHome = finalHomeScore - getScoredByTeam(hPlayers);
      const missingAway = finalAwayScore - getScoredByTeam(aPlayers);

      // Funkcja dopisująca brakujące nazwiska do raportu (np. po zmianie wyniku przez czerwone kartki)
      const fillMissingGoals = (count: number, teamPlayers: Player[], lineup: Lineup, isHome: boolean) => {
        for (let i = 0; i < count; i++) {
          const scorer = GoalAttributionService.pickScorer(teamPlayers, lineup.startingXI as string[], false, () => seededRng(8000 + i + (isHome ? 0 : 500)));
          result.scorers.push({
            playerId: scorer.id,
            minute: Math.floor(seededRng(9000 + i) * 88) + 2,
            isPenalty: false
          });
        }
      };

      // Funkcja usuwająca nadmiarowe nazwiska (np. gdy czerwona kartka zredukowała wynik)
      const trimExcessGoals = (excess: number, teamPlayers: Player[]) => {
        const teamIds = new Set(teamPlayers.map(p => p.id));
        let removed = 0;
        // Przeszukujemy od końca, by usuwać najpóźniejsze bramki
        for (let i = result.scorers.length - 1; i >= 0 && removed < excess; i--) {
          if (teamIds.has(result.scorers[i].playerId)) {
            result.scorers.splice(i, 1);
            removed++;
          }
        }
      };

      if (missingHome > 0) fillMissingGoals(missingHome, hPlayers, hLineup, true);
      else if (missingHome < 0) trimExcessGoals(Math.abs(missingHome), hPlayers);

      if (missingAway > 0) fillMissingGoals(missingAway, aPlayers, aLineup, false);
      else if (missingAway < 0) trimExcessGoals(Math.abs(missingAway), aPlayers);

      MatchHistoryService.logMatch({
        matchId: fixture.id,
        date: currentDate.toDateString(),
        competition: fixture.leagueId,
        homeTeamId: home.id,
        season: seasonNumber,
        awayTeamId: away.id,
        homeScore: finalHomeScore,
        awayScore: finalAwayScore,
        homePenaltyScore: penaltyHome,
        awayPenaltyScore: penaltyAway,
        goals: result.scorers.map(s => {
          const p = (currentPlayers[home.id].concat(currentPlayers[away.id])).find(x => x.id === s.playerId);
          return {
            playerName: p ? `${p.firstName.charAt(0)}. ${p.lastName}` : 'Nieznany',
            minute: s.minute,
            teamId: p ? p.clubId : '?',
            isPenalty: !!s.isPenalty
          };
        }),
        cards: (() => {
          const playerYellowCount: Record<string, number> = {};
          return result.cards.map(c => {
            const p = (currentPlayers[home.id].concat(currentPlayers[away.id])).find(x => x.id === c.playerId);
            const pId = c.playerId;
            let finalType: 'YELLOW' | 'RED' | 'SECOND_YELLOW' = c.type === MatchEventType.YELLOW_CARD ? 'YELLOW' : 'RED';
            
            if (finalType === 'YELLOW') {
              playerYellowCount[pId] = (playerYellowCount[pId] || 0) + 1;
              if (playerYellowCount[pId] === 2) finalType = 'SECOND_YELLOW';
            }

            return {
              playerName: p ? `${p.firstName.charAt(0)}. ${p.lastName}` : 'Nieznany',
              minute: c.minute,
              teamId: p ? p.clubId : '?',
              type: finalType as any
            };
          });
        })()
      });

      // AKTUALIZACJA TERMINARZA
      currentFixtures = currentFixtures.map(f => f.id === fixture.id ? { 
        ...f, 
        homeScore: finalHomeScore, 
        awayScore: finalAwayScore,
        homePenaltyScore: penaltyHome,
        awayPenaltyScore: penaltyAway,
        status: MatchStatus.FINISHED 
      } : f);

      // AWANS
      const isHomeWinner = penaltyHome !== undefined 
        ? penaltyHome > penaltyAway! 
        : finalHomeScore > finalAwayScore;

      currentClubs = currentClubs.map(c => {
        if (c.id === home.id) return { ...c, isInPolishCup: isHomeWinner };
        if (c.id === away.id) return { ...c, isInPolishCup: !isHomeWinner };
        return c;
      });

      // STATYSTYKI GRACZY
      const participatingIdsHome = [...hLineup.startingXI].filter(Boolean) as string[];
      const participatingIdsAway = [...aLineup.startingXI].filter(Boolean) as string[];
      
      currentPlayers = PlayerStatsService.processMatchDayEndForClub(currentPlayers, home.id, participatingIdsHome);
      currentPlayers = PlayerStatsService.processMatchDayEndForClub(currentPlayers, away.id, participatingIdsAway);

      result.scorers.forEach(s => {
        currentPlayers = PlayerStatsService.applyGoal(currentPlayers, s.playerId, s.assistId);
      });

      result.cards.forEach(card => {
        if (card.type === MatchEventType.RED_CARD) {
          currentPlayers = PlayerStatsService.applyCard(currentPlayers, card.playerId, card.type);
        }
      });

     for (const clubId of [home.id, away.id]) {
        currentPlayers[clubId] = currentPlayers[clubId].map(p => {
          let updatedP = { ...p };
          
          // 1. Nalicz drenaż z meczu
        if (result.fatigue[p.id] !== undefined) {
   // TUTAJ WSTAW TEN KOD: Nadpisujemy kondycję zamiast odejmować
   updatedP.condition = Math.max(0, updatedP.condition - result.fatigue[p.id]);
}

          // 2. Nalicz dług (z mapy wygenerowanej w silniku)
          if (result.fatigueDebtMap && result.fatigueDebtMap[p.id]) {
             updatedP.fatigueDebt = Math.min(100, (updatedP.fatigueDebt || 0) + result.fatigueDebtMap[p.id]);
          }

          // 3. TWARDY CAPPING po meczu (gdyby drenaż był mniejszy niż dług)
          const maxCap = 100 - (updatedP.fatigueDebt || 0);
          updatedP.condition = Math.min(maxCap, updatedP.condition);
          
          const injury = result.injuries.find(inj => inj.playerId === p.id);
          if (injury) {
            updatedP.health = {
              status: HealthStatus.INJURED,
              injury: {
                type: injury.type,
                daysRemaining: injury.days,
                severity: injury.severity,
                injuryDate: currentDate.toISOString(), 
                totalDays: injury.days                 
              }
            };
            const basePenalty = injury.severity === InjurySeverity.SEVERE ? 55 : 20;
            const randomExtra = Math.floor(seededRng(1234) * 15);
            updatedP.condition = Math.max(0, updatedP.condition - (basePenalty + randomExtra));
          }
          return updatedP;
        });
      }
    });

    return { 
      updatedFixtures: currentFixtures, 
      updatedPlayers: currentPlayers, 
      updatedLineups: newLineups,
      updatedClubs: currentClubs
    };
  }
};
