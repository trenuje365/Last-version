
import { Fixture, Club, Player, MatchStatus, Lineup, CompetitionType, LeagueRoundResults, MatchResult, HealthStatus, InjurySeverity, Referee, WeatherSnapshot, Coach } from '../types';
import { DebugLoggerService } from './DebugLoggerService';
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
import { AiScoutingService } from './AiScoutingService';

export const BackgroundMatchProcessor = {
  processLeagueEvent: (
    currentDate: Date,
    userTeamId: string | null,
    fixtures: Fixture[],
    clubs: Club[],
    playersMap: Record<string, Player[]>,
    lineups: Record<string, Lineup>,
    seasonNumber: number,
    coaches: Record<string, Coach>,
    // Opcjonalne ziarno sesji — używane przez scouting transferowy.
    // Jeśli nie podane, scouting działa z seed=0 (mniej różnorodny, ale funkcjonalny).
    sessionSeed: number = 0
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
    const CL_COMPETITION_IDS = new Set([
      CompetitionType.CL_R1Q, CompetitionType.CL_R1Q_RETURN,
      CompetitionType.CL_R2Q, CompetitionType.CL_R2Q_RETURN,
      CompetitionType.CL_GROUP_DRAW, CompetitionType.CL_GROUP_STAGE,
      CompetitionType.CHAMPIONS_LEAGUE_DRAW,
      CompetitionType.CL_R16_DRAW, CompetitionType.CL_R16, CompetitionType.CL_R16_RETURN,
      CompetitionType.CL_QF_DRAW, CompetitionType.CL_QF, CompetitionType.CL_QF_RETURN,
      CompetitionType.CL_SF_DRAW, CompetitionType.CL_SF, CompetitionType.CL_SF_RETURN,
      CompetitionType.CL_FINAL_DRAW, CompetitionType.CL_FINAL,
      CompetitionType.EL_R1Q_DRAW, CompetitionType.EL_R1Q, CompetitionType.EL_R1Q_RETURN,
      CompetitionType.EL_R2Q_DRAW, CompetitionType.EL_R2Q, CompetitionType.EL_R2Q_RETURN,
      CompetitionType.EL_GROUP_DRAW, CompetitionType.EL_GROUP_STAGE,
      CompetitionType.EL_R16_DRAW, CompetitionType.EL_R16, CompetitionType.EL_R16_RETURN,
      CompetitionType.EL_QF_DRAW, CompetitionType.EL_QF, CompetitionType.EL_QF_RETURN,
      CompetitionType.EL_SF_DRAW, CompetitionType.EL_SF, CompetitionType.EL_SF_RETURN,
      CompetitionType.EL_FINAL_DRAW, CompetitionType.EL_FINAL,
      CompetitionType.CONF_R1Q_DRAW, CompetitionType.CONF_R1Q, CompetitionType.CONF_R1Q_RETURN,
      CompetitionType.CONF_R2Q_DRAW, CompetitionType.CONF_R2Q, CompetitionType.CONF_R2Q_RETURN,
      CompetitionType.CONF_GROUP_DRAW, CompetitionType.CONF_GROUP_STAGE,
      CompetitionType.CONF_R16_DRAW, CompetitionType.CONF_R16, CompetitionType.CONF_R16_RETURN,
      CompetitionType.CONF_QF_DRAW, CompetitionType.CONF_QF, CompetitionType.CONF_QF_RETURN,
      CompetitionType.CONF_SF_DRAW, CompetitionType.CONF_SF, CompetitionType.CONF_SF_RETURN,
      CompetitionType.CONF_FINAL_DRAW, CompetitionType.CONF_FINAL,
    ]);
    const todayFixtures = fixtures.filter(f =>
      f.date.toDateString() === dateStr &&
      f.status === MatchStatus.SCHEDULED &&
      !CL_COMPETITION_IDS.has(f.leagueId as CompetitionType)
    );
    
    // DEBUG
    DebugLoggerService.log('BMP', `processLeagueEvent: ${dateStr} | SCHEDULED: ${todayFixtures.length} | TOTAL fixtures: ${fixtures.length}`, true);
    const newLineups = AiMatchPreparationService.prepareAllTeams(clubs, playersMap, lineups, userTeamId);
if (todayFixtures.length === 0) {
      const contractUpdate = AiContractService.processClubsContracts(clubs, playersMap, currentDate, userTeamId);
      const recruitmentUpdate = AiContractService.processAiRecruitment(contractUpdate.updatedClubs, contractUpdate.updatedPlayers, currentDate, userTeamId);
      const resolvedUpdate = AiContractService.resolveAiFreeAgentNegotiations(recruitmentUpdate.updatedClubs, recruitmentUpdate.updatedPlayers, currentDate, userTeamId);
      const financingUpdate = AiContractService.processAiSquadFinancing(resolvedUpdate.updatedClubs, resolvedUpdate.updatedPlayers, currentDate, userTeamId);
      const transferSigningsUpdate = AiContractService.processAiTransferListSignings(financingUpdate.updatedClubs, financingUpdate.updatedPlayers, currentDate, userTeamId);
      const interestedTargetingUpdate = AiContractService.processAiInterestedPlayerTargeting(transferSigningsUpdate.updatedClubs, transferSigningsUpdate.updatedPlayers, currentDate, userTeamId);
      const transferResolvedUpdate = AiContractService.resolveAiTransferPending(interestedTargetingUpdate.updatedClubs, interestedTargetingUpdate.updatedPlayers, currentDate, userTeamId);

      // Miesięczna aktualizacja zainteresowań transferowych (tylko 1. dzień miesiąca).
      // AI-kluby przeglądają rynek i aktualizują swoje listy obserwowanych zawodników.
      let scoutedPlayers = transferResolvedUpdate.updatedPlayers;
      if (currentDate.getDate() === 1) {
        scoutedPlayers = AiScoutingService.updateTransferInterests(
          transferResolvedUpdate.updatedClubs,
          transferResolvedUpdate.updatedPlayers,
          currentDate,
          userTeamId,
          sessionSeed
        );
        scoutedPlayers = AiContractService.processMonthlyPlayerReview(
          transferResolvedUpdate.updatedClubs,
          scoutedPlayers,
          currentDate,
          userTeamId
        ).updatedPlayers;
      }

      return {
        updatedFixtures: fixtures,
        updatedClubs: transferResolvedUpdate.updatedClubs,
        updatedPlayers: scoutedPlayers,
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

      const yellowsInMatch = result.cards.filter(c => c.type === MatchEventType.YELLOW_CARD).length;
      const redsInMatch = result.cards.filter(c => c.type === MatchEventType.RED_CARD).length;
      const refereeRating = RefereeService.generateMatchRating(assignedRef);
      RefereeService.recordMatchStats(assignedRef.id, refereeRating, yellowsInMatch, redsInMatch);

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

      const homeMatchExpenses = FinanceService.calculateMatchdayExpenses(home, true, attendance);
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
          const { revenue: ticketRevenue, avgPrice: ticketAvgPrice } = isHome
            ? FinanceService.calculateMatchTicketRevenueForClub(fixture.attendance || 0, c)
            : { revenue: 0, avgPrice: 0 };
          const additionalRevenues = isHome ? FinanceService.calculateMatchdayAdditionalRevenuesForClub(fixture.attendance || 0, c) : null;
          const additionalTotal = additionalRevenues ? (additionalRevenues.catering + additionalRevenues.merchandising + additionalRevenues.programs + additionalRevenues.parking) : 0;
          const netChange = ticketRevenue + additionalTotal - matchExpenses;

          // Tworzymy logi finansowe z poprzednim saldem
          const financeLogsToAdd: any[] = [];
          let runningBalance = c.budget; // Saldo przed operacjami
          
          if (isHome) {
            // 🏟️ Przychody z biletów
            if (ticketRevenue > 0) {
              financeLogsToAdd.push({
                id: Math.random().toString(36).substr(2, 9),
                date: currentDate.toISOString().split('T')[0],
                amount: ticketRevenue,
                type: 'INCOME' as const,
                description: `Bilety (vs ${away.name}): ${fixture.attendance || 0} widzów @ ${ticketAvgPrice} PLN`,  
                previousBalance: runningBalance
              });
              runningBalance += ticketRevenue;
            }

            // 🍔 Catering i Hospitality
            if (additionalRevenues && additionalRevenues.catering > 0) {
              financeLogsToAdd.push({
                id: Math.random().toString(36).substr(2, 9),
                date: currentDate.toISOString().split('T')[0],
                amount: additionalRevenues.catering,
                type: 'INCOME' as const,
                description: `Catering i Hospitality (vs ${away.name})`,
                previousBalance: runningBalance
              });
              runningBalance += additionalRevenues.catering;
            }

            // 👕 Merchandising
            if (additionalRevenues && additionalRevenues.merchandising > 0) {
              financeLogsToAdd.push({
                id: Math.random().toString(36).substr(2, 9),
                date: currentDate.toISOString().split('T')[0],
                amount: additionalRevenues.merchandising,
                type: 'INCOME' as const,
                description: `Sklep kibica — merchandising (vs ${away.name})`,
                previousBalance: runningBalance
              });
              runningBalance += additionalRevenues.merchandising;
            }

            // 📰 Programy meczowe i reklamy LED
            if (additionalRevenues && additionalRevenues.programs > 0) {
              financeLogsToAdd.push({
                id: Math.random().toString(36).substr(2, 9),
                date: currentDate.toISOString().split('T')[0],
                amount: additionalRevenues.programs,
                type: 'INCOME' as const,
                description: `Programy meczowe i reklamy LED (vs ${away.name})`,
                previousBalance: runningBalance
              });
              runningBalance += additionalRevenues.programs;
            }

            // 🅿️ Parkingi i fanzony
            if (additionalRevenues && additionalRevenues.parking > 0) {
              financeLogsToAdd.push({
                id: Math.random().toString(36).substr(2, 9),
                date: currentDate.toISOString().split('T')[0],
                amount: additionalRevenues.parking,
                type: 'INCOME' as const,
                description: `Parkingi i strefa kibica (vs ${away.name})`,
                previousBalance: runningBalance
              });
              runningBalance += additionalRevenues.parking;
            }
            
            // 💰 Koszty organizacji
            if (matchExpenses > 0) {
              financeLogsToAdd.push({
                id: Math.random().toString(36).substr(2, 9),
                date: currentDate.toISOString().split('T')[0],
                amount: -matchExpenses,
                type: 'EXPENSE' as const,
                description: `Koszty organizacji meczu`,
                previousBalance: runningBalance
              });
              runningBalance -= matchExpenses;
            }
          } else {
            // 🚌 Koszty wyjazdu (away)
            financeLogsToAdd.push({
              id: Math.random().toString(36).substr(2, 9),
              date: currentDate.toISOString().split('T')[0],
              amount: -matchExpenses,
              type: 'EXPENSE' as const,
              description: `Koszty wyjazdu`,
              previousBalance: runningBalance
            });
            runningBalance -= matchExpenses;
          }

          return {
            ...c,
            budget: c.budget + netChange,
            financeHistory: [...financeLogsToAdd, ...(c.financeHistory || [])].slice(0, 50),
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
                 const basePenalty = injury.severity === InjurySeverity.SEVERE ? 55 : 20;
                 const randomExtra = Math.floor(Math.random() * 15); 
                 const condAfterPenalty = Math.max(0, updatedP.condition - (basePenalty + randomExtra));
                updatedP.health = {
                    status: HealthStatus.INJURED,
                    injury: {
                       type: injury.type,
                       daysRemaining: injury.days,
                       severity: injury.severity,
                       injuryDate: currentDate.toISOString(), 
                       totalDays: injury.days,
                       conditionAtInjury: condAfterPenalty
                    }
                 };
                 updatedP.condition = condAfterPenalty;
              }
              return updatedP;
           });
        }
      }
    });

    const contractResult = AiContractService.processClubsContracts(currentClubs, currentPlayers, currentDate, userTeamId);

    const finalUpdate = AiContractService.processAiRecruitment(contractResult.updatedClubs, contractResult.updatedPlayers, currentDate, userTeamId);
    const resolvedFinal = AiContractService.resolveAiFreeAgentNegotiations(finalUpdate.updatedClubs, finalUpdate.updatedPlayers, currentDate, userTeamId);
    const financingFinal = AiContractService.processAiSquadFinancing(resolvedFinal.updatedClubs, resolvedFinal.updatedPlayers, currentDate, userTeamId);
    const transferSigningsFinal = AiContractService.processAiTransferListSignings(financingFinal.updatedClubs, financingFinal.updatedPlayers, currentDate, userTeamId);
    const interestedTargetingFinal = AiContractService.processAiInterestedPlayerTargeting(transferSigningsFinal.updatedClubs, transferSigningsFinal.updatedPlayers, currentDate, userTeamId);
    const transferResolvedFinal = AiContractService.resolveAiTransferPending(interestedTargetingFinal.updatedClubs, interestedTargetingFinal.updatedPlayers, currentDate, userTeamId);

    currentClubs = transferResolvedFinal.updatedClubs;
    currentPlayers = transferResolvedFinal.updatedPlayers;
    const newOffers = finalUpdate.newOffers;

    // Miesięczna aktualizacja zainteresowań transferowych — dotyczy też dni meczowych.
    if (currentDate.getDate() === 1) {
      currentPlayers = AiScoutingService.updateTransferInterests(
        currentClubs,
        currentPlayers,
        currentDate,
        userTeamId,
        sessionSeed
      );
      currentPlayers = AiContractService.processMonthlyPlayerReview(
        currentClubs,
        currentPlayers,
        currentDate,
        userTeamId
      ).updatedPlayers;
    }

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
