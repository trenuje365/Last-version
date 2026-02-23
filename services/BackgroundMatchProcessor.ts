
import { Fixture, Club, Player, MatchStatus, Lineup, CompetitionType, LeagueRoundResults, MatchResult, HealthStatus, InjurySeverity, Referee, WeatherSnapshot, Coach } from '../types';
import { LeagueBackgroundMatchEngine } from './LeagueBackgroundMatchEngine';
import { LeagueBackgroundMatchEngineV2 } from './LeagueBackgroundMatchEngine-ver2';
import { RefereeService } from './RefereeService';
import { PlayerStatsService } from './PlayerStatsService';
import { MatchHistoryService } from './MatchHistoryService';
import { AiMatchPreparationService } from './AiMatchPreparationService';
import { AiContractService } from './AiContractService';
import { MatchEventType } from '../types';
import { AttendanceService } from './AttendanceService';
import { PolandWeatherService } from './PolandWeatherService';
import { FinanceService } from './FinanceService';
import { PendingNegotiation } from '@/types';

export const BackgroundMatchProcessor = {
  processLeagueEvent: (
    currentDate: Date,
    userTeamId: string | null,
    fixtures: Fixture[],
    clubs: Club[],
    playersMap: Record<string, Player[]>,
    lineups: Record<string, Lineup>,
    seasonNumber: number,
    coaches: Record<string, Coach>
  ): { 
    updatedFixtures: Fixture[], 
    updatedClubs: Club[], 
    updatedPlayers: Record<string, Player[]>,
    updatedLineups: Record<string, Lineup>,
    newOffers: PendingNegotiation[],
    roundResults: LeagueRoundResults | null,
    seasonNumber: number,
    ratings: Record<string, number>;
  } => {
    
    const dateStr = currentDate.toDateString();
    const todayFixtures = fixtures.filter(f => f.date.toDateString() === dateStr && f.status === MatchStatus.SCHEDULED);
    
    // Nawet jeśli nie ma meczów dzisiaj, odświeżamy składy pod kątem zawieszeń (np. po wczorajszej kolejce)
    const newLineups = AiMatchPreparationService.prepareAllTeams(clubs, playersMap, lineups, userTeamId);
if (todayFixtures.length === 0) {
      const contractUpdate = AiContractService.processClubsContracts(clubs, playersMap, currentDate, userTeamId);
      const recruitmentUpdate = AiContractService.processAiRecruitment(contractUpdate.updatedClubs, contractUpdate.updatedPlayers, currentDate, userTeamId);

      return { 
        updatedFixtures: fixtures, 
        updatedClubs: recruitmentUpdate.updatedClubs, 
        updatedPlayers: recruitmentUpdate.updatedPlayers, 
        updatedLineups: newLineups, 
        newOffers: recruitmentUpdate.newOffers, 
        seasonNumber: seasonNumber,
        roundResults: null,
        ratings: {} 
      };
    }

    // 1. Obliczamy rankingi dla wszystkich lig przed symulacją
    const getStandings = (leagueId: string) => {
      return [...clubs]
        .filter(c => c.leagueId === leagueId)
        .sort((a, b) => b.stats.points - a.stats.points || b.stats.goalDifference - a.stats.goalDifference);
    };

    const standingsMap: Record<string, Club[]> = {
      'L_PL_1': getStandings('L_PL_1'),
      'L_PL_2': getStandings('L_PL_2'),
      'L_PL_3': getStandings('L_PL_3'),
    };

    // 2. Generujemy pogodę dla całego dnia meczowego
    const weather = PolandWeatherService.getWeather(currentDate, currentDate.toDateString());
    
    let currentFixtures = [...fixtures];
    let currentClubs = [...clubs];
    let currentPlayers = { ...playersMap };

    const roundResults: LeagueRoundResults = {
      dateKey: dateStr,
      league1Results: [],
      league2Results: [],
      league3Results: []
    };

    todayFixtures.forEach(fixture => {
      // Pomiń mecz gracza (widok MatchLiveView sam o to dba)
      if (fixture.homeTeamId === userTeamId || fixture.awayTeamId === userTeamId) return;

      const home = currentClubs.find(c => c.id === fixture.homeTeamId)!;
      const away = currentClubs.find(c => c.id === fixture.awayTeamId)!;
      const hPlayers = currentPlayers[home.id] || [];
      const aPlayers = currentPlayers[away.id] || [];
      const hLineup = newLineups[home.id];
      const aLineup = newLineups[away.id];

     if (!hLineup || !aLineup) return;

      const clubSalt = home.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const matchHash = fixture.id.split('').reduce((a, b) => (a << 5) - a + b.charCodeAt(0), 0);
      const seed = (matchHash ^ clubSalt) ^ (currentDate.getTime() / 1000 | 0);
      
      // --- PRZYGOTOWANIE DANYCH DLA V2 ---
      const hCoach = coaches[home.coachId || ''] || { attributes: { experience: 50, decisionMaking: 50, motivation: 50 } };
      const aCoach = coaches[away.coachId || ''] || { attributes: { experience: 50, decisionMaking: 50, motivation: 50 } };
      const assignedRef = RefereeService.assignReferee(fixture.id, 3);

      // --- WYBÓR SILNIKA (ODKOMENTUJ WŁAŚCIWY) ---
      
      // STARY SILNIK V1:
      // const result = LeagueBackgroundMatchEngine.simulate(fixture, home, away, hPlayers, aPlayers, hLineup, aLineup, seed);

      // NOWY SILNIK V2.0:
      const result = LeagueBackgroundMatchEngineV2.simulate(
        fixture, home, away, hPlayers, aPlayers, hLineup, aLineup, 
        hCoach as any, aCoach as any, assignedRef, weather, seed
      );

      // Obliczamy miejsce gospodarza w tabeli
      const leagueStandings = standingsMap[fixture.leagueId as string] || [];
      const homeRank = leagueStandings.findIndex(c => c.id === home.id) + 1 || 10; 
      const attendance = AttendanceService.calculate(home, homeRank, weather);

      MatchHistoryService.logMatch({
        season: seasonNumber,
        matchId: fixture.id,
        date: currentDate.toDateString(),
        competition: fixture.leagueId,
        homeTeamId: home.id,
        awayTeamId: away.id,
        homeScore: result.homeScore,
        awayScore: result.awayScore,
        attendance: attendance,
        goals: result.scorers.map(s => {
          const p = (currentPlayers[home.id].concat(currentPlayers[away.id])).find(x => x.id === s.playerId);
          return {
            playerName: p ? `${p.firstName.charAt(0)}. ${p.lastName}` : 'Nieznany',
            minute: s.minute,
            teamId: p ? p.clubId : '?',
            isPenalty: s.isPenalty 
          };
        }),
        cards: (() => {
   // Logika filtrowania kartek: Jeśli zawodnik ma dostać drugą żółtą, raportujemy tylko Czerwoną (Stage 1 PRO)
          const playerMatchCards: Record<string, string[]> = {};
          const finalCards: any[] = [];

          result.cards.forEach(c => {
            const pId = c.playerId;
            if (!playerMatchCards[pId]) playerMatchCards[pId] = [];
            
            const p = (currentPlayers[home.id].concat(currentPlayers[away.id])).find(x => x.id === pId);
            const playerName = p ? `${p.firstName.charAt(0)}. ${p.lastName}` : 'Nieznany';

            if (c.type === MatchEventType.YELLOW_CARD) {
              if (playerMatchCards[pId].includes('YELLOW')) {
                // To jest druga żółta -> zamień na czerwoną w statystyce i nie dodawaj żółtej
                finalCards.push({ playerName, minute: c.minute, teamId: p?.clubId || '?', type: 'SECOND_YELLOW' });
              } else {
                playerMatchCards[pId].push('YELLOW');
                finalCards.push({ playerName, minute: c.minute, teamId: p?.clubId || '?', type: 'YELLOW' });
              }
            } else {
              finalCards.push({ playerName, minute: c.minute, teamId: p?.clubId || '?', type: 'RED' });
            }
          });
          return finalCards;
        })()
      });
      currentFixtures = currentFixtures.map(f => f.id === fixture.id ? { 
        ...f, 
        homeScore: result.homeScore, 
        awayScore: result.awayScore, 
        status: MatchStatus.FINISHED 
      } : f);

      const homeMatchExpenses = FinanceService.calculateMatchdayExpenses(home, true);
      const awayMatchExpenses = FinanceService.calculateMatchdayExpenses(away, false);

      const matchResult: MatchResult = {
        homeTeamName: home.name,
        awayTeamName: away.name,
        homeScore: result.homeScore,
        awayScore: result.awayScore,
        homeColors: home.colorsHex,
        awayColors: away.colorsHex
      };

      if (fixture.leagueId === 'L_PL_1') roundResults.league1Results.push(matchResult);
      else if (fixture.leagueId === 'L_PL_2') roundResults.league2Results.push(matchResult);
      else if (fixture.leagueId === 'L_PL_3') roundResults.league3Results.push(matchResult);
      else if (fixture.leagueId === CompetitionType.SUPER_CUP) {
         roundResults.league1Results.push(matchResult);
      }
      currentClubs = currentClubs.map(c => {
        if (c.id === home.id || c.id === away.id) {
          const isHome = c.id === home.id;
          const pts = isHome 
            ? (result.homeScore > result.awayScore ? 3 : (result.homeScore === result.awayScore ? 1 : 0))
            : (result.awayScore > result.homeScore ? 3 : (result.awayScore === result.homeScore ? 1 : 0));
          
          const resultChar: "W" | "R" | "P" = pts === 3 ? 'W' : (pts === 1 ? 'R' : 'P');
          const newForm = [...(c.stats.form || []), resultChar].slice(-5) as ("W" | "R" | "P")[];

          const matchExpenses = isHome ? homeMatchExpenses : awayMatchExpenses;
          return {
            ...c,
            budget: c.budget - matchExpenses,
            stats: {
              ...c.stats,
              played: c.stats.played + 1,
              wins: c.stats.wins + (pts === 3 ? 1 : 0),
              draws: c.stats.draws + (pts === 1 ? 1 : 0),
              losses: c.stats.losses + (pts === 0 ? 1 : 0),
              goalsFor: c.stats.goalsFor + (isHome ? result.homeScore : result.awayScore),
              goalsAgainst: c.stats.goalsAgainst + (isHome ? result.awayScore : result.homeScore),
              goalDifference: c.stats.goalDifference + (isHome ? result.homeScore - result.awayScore : result.awayScore - result.homeScore),
              points: c.stats.points + pts,
              form: newForm
            }
          };
        }
        return c;
      });

      // Aktualizacja statystyk zawodników
    // Uwzględnienie rezerwowych w statystykach meczowych
 
      currentPlayers = PlayerStatsService.processMatchDayEndForClub(currentPlayers, home.id, result.playedPlayerIds.filter(id => hPlayers.some(p => p.id === id)));
      currentPlayers = PlayerStatsService.processMatchDayEndForClub(currentPlayers, away.id, result.playedPlayerIds.filter(id => aPlayers.some(p => p.id === id)));
      
      result.scorers.forEach(s => {
        currentPlayers = PlayerStatsService.applyGoal(currentPlayers, s.playerId, s.assistId);
      });

      result.cards.forEach(card => {
        currentPlayers = PlayerStatsService.applyCard(currentPlayers, card.playerId, card.type);
      });





      // Zmęczenie i kontuzje
      for (const clubId in currentPlayers) {
        if (clubId === home.id || clubId === away.id) {
           currentPlayers[clubId] = currentPlayers[clubId].map(p => {
              let updatedP = { ...p };
              
              if (result.fatigue[p.id] !== undefined) {
   // TUTAJ WSTAW TEN KOD: Nadpisujemy kondycję zamiast odejmować
   updatedP.condition = result.fatigue[p.id];
}
              if (result.fatigueDebtMap && result.fatigueDebtMap[p.id]) {
                 updatedP.fatigueDebt = Math.min(100, (updatedP.fatigueDebt || 0) + result.fatigueDebtMap[p.id]);
              }

// TUTAJ WSTAW TEN KOD - Rejestracja noty w historii sezonu
   if (result.ratings && result.ratings[p.id]) {
                 if (!updatedP.stats.ratingHistory) updatedP.stats.ratingHistory = [];
                 updatedP.stats.ratingHistory.push(result.ratings[p.id]);
              }

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
                 const randomExtra = Math.floor(Math.random() * 15); 
                 updatedP.condition = Math.max(0, updatedP.condition - (basePenalty + randomExtra));
              }
              return updatedP;
           });
        }
      }
    });

    const contractResult = AiContractService.processClubsContracts(currentClubs, currentPlayers, currentDate, userTeamId);

 const finalUpdate = AiContractService.processAiRecruitment(contractResult.updatedClubs, contractResult.updatedPlayers, currentDate, userTeamId);

       currentClubs = finalUpdate.updatedClubs;
    currentPlayers = finalUpdate.updatedPlayers;
 const newOffers = finalUpdate.newOffers;
    return { 
      
      updatedFixtures: currentFixtures, 
      updatedClubs: currentClubs, 
      updatedPlayers: currentPlayers, 
      updatedLineups: newLineups,
      newOffers: newOffers,
      roundResults: roundResults,
      seasonNumber: seasonNumber,
      ratings: {} 
    };
  }
};
