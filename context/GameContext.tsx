import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { 
  ViewState, Club, League, Player, Lineup, Fixture, 
  SeasonTemplate, LeagueSchedule, PlayerNextEvent, EventKind, MatchSummary, LeagueRoundResults, ManagerProfile, MatchLiveState,
  MailMessage, MatchStatus, MailType, CompetitionType,
Coach, TrainingIntensity,
PendingNegotiation, NegotiationStatus,
HealthStatus,
PlayerPosition
} from '../types';
import { STATIC_CLUBS, STATIC_LEAGUES, START_DATE } from '../constants';
import { SeasonTemplateGenerator } from '../services/SeasonTemplateGenerator';
import { LeagueScheduleGenerator } from '../services/LeagueScheduleGenerator';
import { NextPlayerEventService } from '../services/NextPlayerEventService';
import { SquadGeneratorService } from '../services/SquadGeneratorService';
import { LineupService } from '../services/LineupService';
import { BackgroundMatchProcessor } from '../services/BackgroundMatchProcessor';
import { BackgroundMatchProcessorPolishCup } from '../services/BackgroundMatchProcessorPolishCup';
import { RecoveryService } from '../services/RecoveryService';
import { MailService, SeasonSummaryData } from '../services/MailService';
import { TrainingService } from '../services/TrainingService';
import { SeasonTransitionService } from '../services/SeasonTransitionService';
import { LeagueStatsService } from '../services/LeagueStatsService';
import { FinanceService } from '../services/FinanceService';
import { PolishCupDrawService } from '../services/PolishCupDrawService';
import { SuperCupService } from '../services/SuperCupService';
import { CoachService } from '../services/CoachService';
import { FreeAgentService } from '../services/FreeAgentService';
import { AiContractService } from '@/services/AiContractService';

interface SimulationOutput {
  updatedFixtures: Fixture[];
  updatedClubs: Club[];
  updatedPlayers: Record<string, Player[]>;
  updatedLineups: Record<string, Lineup>;
  // TUTAJ WSTAW TEN KOD
  newOffers: PendingNegotiation[];
  ratings?: Record<string, number>;
  // KONIEC KODU
  seasonNumber: number;
  roundResults: LeagueRoundResults | null;
}

interface GameContextType {
  currentDate: Date;
  viewState: ViewState;
  sessionSeed: number;
  previousViewState: ViewState | null;
  clubs: Club[];
  leagues: League[];
  players: Record<string, Player[]>;
  lineups: Record<string, Lineup>;
  fixtures: Fixture[];
  userTeamId: string | null;
  seasonTemplate: SeasonTemplate | null;
  leagueSchedules: Record<number, LeagueSchedule>;
  nextEvent: PlayerNextEvent | null;
  viewedClubId: string | null;
  viewedPlayerId: string | null;
  viewedCoachId: string | null;
  viewedRefereeId: string | null;
  lastRecoveryDate: Date;
  lastMatchSummary: MatchSummary | null;
  coaches: Record<string, Coach>;
  roundResults: Record<string, LeagueRoundResults>;
  isJumping: boolean;
  managerProfile: ManagerProfile | null;
  seasonNumber: number;
  activeMatchState: MatchLiveState | null;
  messages: MailMessage[];
  activeTrainingId: string | null;
  cupParticipants: string[];
  activeCupDraw: { id: string, label: string, date: Date, pairs: Fixture[] } | null;

  activeIntensity: TrainingIntensity;
  setTrainingIntensity: (intensity: TrainingIntensity) => void;
  
  startNewGame: () => void;
  saveManagerProfile: (profile: ManagerProfile) => void;
  selectUserTeam: (clubId: string) => void;
  advanceDay: () => void;
  jumpToDate: (date: Date) => void;
  jumpToNextEvent: () => void;
  navigateTo: (view: ViewState) => void;
  updateLineup: (clubId: string, lineup: Lineup) => void;
  viewClubDetails: (clubId: string) => void;
  viewPlayerDetails: (playerId: string) => void;
   viewCoachDetails: (coachId: string) => void;
  viewRefereeDetails: (refId: string) => void;
  getOrGenerateSquad: (clubId: string) => Player[];
  setPlayers: React.Dispatch<React.SetStateAction<Record<string, Player[]>>>;
  setLastMatchSummary: (summary: MatchSummary | null) => void;
   setClubs: React.Dispatch<React.SetStateAction<Club[]>>;
  addRoundResults: (results: LeagueRoundResults) => void;
  applySimulationResult: (result: SimulationOutput) => void;
  setActiveMatchState: React.Dispatch<React.SetStateAction<MatchLiveState | null>>;
  setMessages: React.Dispatch<React.SetStateAction<MailMessage[]>>;
  markMessageRead: (id: string) => void;
  deleteMessage: (id: string) => void;
  setActiveTrainingId: (id: string | null) => void;
  confirmCupDraw: (pairs: Fixture[]) => void;
  processBackgroundCupMatches: () => void;
  updatePlayer: (clubId: string, playerId: string, newData: Partial<Player>) => void;
  toggleTransferList: (playerId: string) => void;
  pendingNegotiations: PendingNegotiation[];
setPendingNegotiations: React.Dispatch<React.SetStateAction<PendingNegotiation[]>>;
finalizeFreeAgentContract: (mailId: string) => void;

}




const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentDate, setCurrentDate] = useState<Date>(START_DATE);
  const [sessionSeed, setSessionSeed] = useState<number>(0);
  const [viewState, setViewState] = useState<ViewState>(ViewState.START_MENU);
  const [previousViewState, setPreviousViewState] = useState<ViewState | null>(null);
  const [clubs, setClubs] = useState<Club[]>(STATIC_CLUBS);
  const [leagues, setLeagues] = useState<League[]>(STATIC_LEAGUES);
  const [players, setPlayers] = useState<Record<string, Player[]>>({});
  const [lineups, setLineups] = useState<Record<string, Lineup>>({});
  const [userTeamId, setUserTeamId] = useState<string | null>(null);
  const [seasonTemplate, setSeasonTemplate] = useState<SeasonTemplate | null>(null);
  const [leagueSchedules, setLeagueSchedules] = useState<Record<number, LeagueSchedule>>({});
  const [nextEvent, setNextEvent] = useState<PlayerNextEvent | null>(null);
  const [viewedClubId, setViewedClubId] = useState<string | null>(null);
  const [viewedPlayerId, setViewedPlayerId] = useState<string | null>(null);
  const [viewedCoachId, setViewedCoachId] = useState<string | null>(null);
  const [viewedRefereeId, setViewedRefereeId] = useState<string | null>(null);
  const [lastRecoveryDate, setLastRecoveryDate] = useState<Date>(START_DATE);
  const [lastMatchSummary, setLastMatchSummary] = useState<MatchSummary | null>(null);
  const [coaches, setCoaches] = useState<Record<string, Coach>>({});
  const [roundResults, setRoundResults] = useState<Record<string, LeagueRoundResults>>({});
  const [managerProfile, setManagerProfile] = useState<ManagerProfile | null>(null);
  const [seasonNumber, setSeasonNumber] = useState<number>(1);
  const [activeMatchState, setActiveMatchState] = useState<MatchLiveState | null>(null);
  const [messages, setMessages] = useState<MailMessage[]>([]);
  const [targetJumpTime, setTargetJumpTime] = useState<number | null>(null);
  const [activeTrainingId, setActiveTrainingId] = useState<string | null>('T_TACTICAL_PERIOD');

const [activeIntensity, setActiveIntensity] = useState<TrainingIntensity>(TrainingIntensity.NORMAL);
 const [pendingNegotiations, setPendingNegotiations] = useState<PendingNegotiation[]>([]);
  // Polish Cup & Persistent Events State
  const [cupParticipants, setCupParticipants] = useState<string[]>([]);
  const [activeCupDraw, setActiveCupDraw] = useState<{ id: string, label: string, date: Date, pairs: Fixture[] } | null>(null);
  const [processedDrawIds, setProcessedDrawIds] = useState<string[]>([]);
  const [globalFixtures, setGlobalFixtures] = useState<Fixture[]>([]);

  // Memoized allFixtures
  const allFixtures = useMemo(() => {
    const allLeagueFixtures = Object.values(leagueSchedules).flatMap(s => s.matchdays.flatMap(m => m.fixtures));
    return [...allLeagueFixtures, ...globalFixtures];
  }, [leagueSchedules, globalFixtures]);

  const getOrGenerateSquad = useCallback((clubId: string): Player[] => {
    if (players[clubId]) return players[clubId];
    const newSquad = SquadGeneratorService.generateSquadForClub(clubId);
    setPlayers(prev => ({ ...prev, [clubId]: newSquad }));
    return newSquad;
  }, [players]);

  const navigateTo = useCallback((view: ViewState) => {
    setPreviousViewState(viewState);
    setViewState(view);
  }, [viewState]);

  const generateSchedules = (template: SeasonTemplate, currentClubs: Club[]): Record<number, LeagueSchedule> => {
    const schedules: Record<number, LeagueSchedule> = {};
    [1, 2, 3].forEach(tier => {
      const league = STATIC_LEAGUES.find(l => l.id === `L_PL_${tier}`);
      if (league) {
        const tierClubs = currentClubs.filter(c => c.leagueId === league.id);
        schedules[tier] = LeagueScheduleGenerator.generate(tierClubs, template, tier, league.id);
      }
    });
    return schedules;
  };

  const startNewGame = () => {
    const startYear = 2025;
    setSessionSeed(Math.floor(Math.random() * 1000000));
    const template = SeasonTemplateGenerator.generate(startYear);
    // -> tutaj wstaw kod
    const coachData = CoachService.generateInitialCoaches(STATIC_CLUBS);
    setCoaches(coachData.coaches);
    setClubs(coachData.updatedClubs);
    
 const initialFreeAgents = FreeAgentService.generatePool(99);
    setPlayers(prev => ({ ...prev, 'FREE_AGENTS': initialFreeAgents }));


    setSeasonTemplate(template);
    setSeasonNumber(1);
    const initialSchedules = generateSchedules(template, STATIC_CLUBS);
    setLeagueSchedules(initialSchedules);
    setMessages([]);
    setProcessedDrawIds([]);
    const initialSuperCup = SuperCupService.generateFixture(2025, STATIC_CLUBS);
    setGlobalFixtures([initialSuperCup]);
    setClubs(STATIC_CLUBS.map(c => ({ ...c, isInPolishCup: false })));
    navigateTo(ViewState.MANAGER_CREATION);
  };

  const startNextSeason = useCallback((newYear: number) => {
    // 1. Zidentyfikuj Mistrza i zdobywcę Pucharu PRZED zresetowaniem stanu
    const standingsL1 = [...clubs]
      .filter(c => c.leagueId === 'L_PL_1')
      .sort((a, b) => b.stats.points - a.stats.points || b.stats.goalDifference - a.stats.goalDifference || b.stats.goalsFor - a.stats.goalsFor);
    
    const champion = standingsL1[0];

    // Szukamy Finału Pucharu Polski w rozegranych meczach (CompetitionType.POLISH_CUP)
    const cupFinal = allFixtures.find(f => 
      f.leagueId === CompetitionType.POLISH_CUP && 
      f.status === MatchStatus.FINISHED &&
      f.id.includes("CUP_Puchar_Polski:_FINAŁ")
    );
    
    let cupWinnerId: string | undefined;
    if (cupFinal) {
     const hScore = cupFinal.homeScore || 0;
      const aScore = cupFinal.awayScore || 0;
      let homeWin = hScore > aScore;

      // Jeśli w regulaminowym czasie był remis, sprawdź rzuty karne
      if (hScore === aScore && cupFinal.homePenaltyScore !== undefined) {
        homeWin = cupFinal.homePenaltyScore > (cupFinal.awayPenaltyScore || 0);
      }
      cupWinnerId = homeWin ? cupFinal.homeTeamId : cupFinal.awayTeamId;
    }

    // 2. Logika awansów i spadków
    const standingsL2 = [...clubs].filter(c => c.leagueId === 'L_PL_2').sort((a, b) => b.stats.points - a.stats.points || b.stats.goalDifference - a.stats.goalDifference);
    const standingsL3 = [...clubs].filter(c => c.leagueId === 'L_PL_3').sort((a, b) => b.stats.points - a.stats.points || b.stats.goalDifference - a.stats.goalDifference);
    const potentialL4 = clubs.filter(c => c.leagueId === 'L_PL_4');

    const relegatedTeamsL1 = standingsL1.slice(15, 18);
    const promotedTeamsL2 = standingsL2.slice(0, 3);
    const relegatedTeamsL2 = standingsL2.slice(15, 18);
    const promotedTeamsL3 = standingsL3.slice(0, 3);
    const relegatedTeamsL3 = standingsL3.slice(14, 18);
    const promotedFromL4Teams = [...potentialL4].sort(() => Math.random() - 0.5).slice(0, 4);

    const relegateFromL1Ids = relegatedTeamsL1.map(c => c.id);
    const promoteFromL2Ids = promotedTeamsL2.map(c => c.id);
    const relegateFromL2Ids = relegatedTeamsL2.map(c => c.id);
    const promoteFromL3Ids = promotedTeamsL3.map(c => c.id);
    const relegateFromL3Ids = relegatedTeamsL3.map(c => c.id);
    const promoteFromL4Ids = promotedFromL4Teams.map(c => c.id);

    // 3. Budowa raportu
    const getAwards = (leagueId: string, leagueName: string) => {
      const rows = LeagueStatsService.getPlayersForLeague(leagueId, clubs, players);
      const topScorer = LeagueStatsService.getTopScorers(rows, 1)[0]?.player;
      const topAssistant = LeagueStatsService.getTopAssists(rows, 1)[0]?.player;
      return {
        leagueName,
        topScorer: { name: topScorer ? `${topScorer.firstName} ${topScorer.lastName}` : 'Brak', goals: topScorer?.stats.goals || 0 },
        topAssistant: { name: topAssistant ? `${topAssistant.firstName} ${topAssistant.lastName}` : 'Brak', assists: topAssistant?.stats.assists || 0 }
      };
    };

    const summaryData: SeasonSummaryData = {
      year: newYear - 1,
      championName: champion?.name || 'Nieznany',
      promotions: [
        { from: '1. Liga', to: 'Ekstraklasy', teams: promotedTeamsL2.map(t => t.name) },
        { from: '2. Liga', to: '1. Ligi', teams: promotedTeamsL3.map(t => t.name) },
        { from: 'Regionalna', to: '2. Ligi', teams: promotedFromL4Teams.map(t => t.name) }
      ],
      relegations: [
        { from: 'Ekstraklasy', to: '1. Ligi', teams: relegatedTeamsL1.map(t => t.name) },
        { from: '1. Ligi', to: '2. Ligi', teams: relegatedTeamsL2.map(t => t.name) },
        { from: '2. Ligi', to: 'Regionalnej', teams: relegatedTeamsL3.map(t => t.name) }
      ],
      leagueAwards: [getAwards('L_PL_1', 'Ekstraklasa'), getAwards('L_PL_2', '1. Liga'), getAwards('L_PL_3', '2. Liga')]
    };

    // 4. Aktualizacja Klubów i Lig
// 4. Aktualizacja Klubów i Trenerów (Nagrody i Kary)
    const updatedCoaches = { ...coaches };
    
    // Funkcja pomocnicza do zmiany parametrów trenera
    const adjustCoach = (coachId: string | undefined, min: number, max: number) => {
      if (!coachId || !updatedCoaches[coachId]) return;
      const amount = Math.floor(Math.random() * (max - min + 1)) + min;
      const c = updatedCoaches[coachId];
      Object.keys(c.attributes).forEach(attr => {
        const key = attr as keyof typeof c.attributes;
        c.attributes[key] = Math.max(1, Math.min(99, c.attributes[key] + amount));
      });
    };

    const updatedClubs = clubs.map(club => {
      let newLeagueId = club.leagueId;
      let newReputation = club.reputation;
      const isUser = club.id === userTeamId;

      // Logika awansów / spadków i kar/nagród dla trenerów AI
      if (relegateFromL1Ids.includes(club.id)) { 
        newLeagueId = 'L_PL_2'; newReputation = Math.max(1, newReputation - 1); 
        if (!isUser) adjustCoach(club.coachId, -1, -1);
      }
      else if (promoteFromL2Ids.includes(club.id)) { 
        newLeagueId = 'L_PL_1'; newReputation = Math.min(10, newReputation + 1); 
        if (!isUser) adjustCoach(club.coachId, 1, 2);
      }
      else if (relegateFromL2Ids.includes(club.id)) { 
        newLeagueId = 'L_PL_3'; newReputation = Math.max(1, newReputation - 1); 
        if (!isUser) adjustCoach(club.coachId, -1, -1);
      }
      else if (promoteFromL3Ids.includes(club.id)) { 
        newLeagueId = 'L_PL_2'; newReputation = Math.min(10, newReputation + 1); 
        if (!isUser) adjustCoach(club.coachId, 1, 2);
      }
      else if (relegateFromL3Ids.includes(club.id)) { 
        newLeagueId = 'L_PL_4'; newReputation = Math.max(1, newReputation - 1); 
        if (!isUser) adjustCoach(club.coachId, -1, -1);
      }
      else if (promoteFromL4Ids.includes(club.id)) { 
        newLeagueId = 'L_PL_3'; newReputation = Math.min(10, newReputation + 1); 
        if (!isUser) adjustCoach(club.coachId, 1, 2);
      }

      // Nagroda za Mistrzostwo i Puchar
      if (!isUser) {
        if (club.id === champion?.id) adjustCoach(club.coachId, 1, 3);
        if (club.id === cupWinnerId) adjustCoach(club.coachId, 1, 3);
      }

      const newTier = parseInt(newLeagueId.split('_')[2]) || 4;
      const seasonalAwardRank = standingsL1.findIndex(c => c.id === club.id) + 1 || 10;
      const nextSeasonInjection = FinanceService.calculateSeasonalIncome(newTier, newReputation, seasonalAwardRank);

      return {
        ...club,
        leagueId: newLeagueId,
        reputation: newReputation,
        budget: club.budget + nextSeasonInjection,
        stats: { points: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, played: 0, form: [] },
        isInPolishCup: false 
      };
    });

    setCoaches(updatedCoaches);
    setClubs(updatedClubs);
    setLeagues(prevLeagues => prevLeagues.map(l => ({
      ...l,
      teamIds: updatedClubs.filter(c => c.leagueId === l.id && c.isDefaultActive).map(c => c.id)
    })));

    setSeasonNumber(prev => prev + 1);
    const newTemplate = SeasonTemplateGenerator.generate(newYear);
    setSeasonTemplate(newTemplate);
    const newSchedules = generateSchedules(newTemplate, updatedClubs);
    setLeagueSchedules(newSchedules);

    // 5. Generowanie meczu Superpucharu na nowy sezon
    const nextSuperCup = SuperCupService.generateFixture(newYear, updatedClubs, champion?.id, cupWinnerId);
    setGlobalFixtures([nextSuperCup]); // Czyścimy stare puchary, zostawiamy tylko nowy Superpuchar

    const transitionResult = SeasonTransitionService.processSquadTransition(players, updatedClubs);
    setPlayers(transitionResult.updatedPlayers);

if (userTeamId) {
      const myRetirements = transitionResult.retirementLogs.filter(log => log.clubId === userTeamId);
      const userClub = updatedClubs.find(c => c.id === userTeamId);
      const retirementMail = MailService.generateRetirementReportMail(myRetirements, userClub?.name || "");
      setMessages(prev => [retirementMail, ...prev]);
    }




    // 6. Poczta
    if (userTeamId) {
      const globalSummaryMail = MailService.generateSeasonSummaryMail(summaryData);
      setMessages(prev => [globalSummaryMail, ...prev]);
    }
    setRoundResults({});
  }, [clubs, players, userTeamId, allFixtures]);

  const saveManagerProfile = (profile: ManagerProfile) => {
    setManagerProfile(profile);
    navigateTo(ViewState.TEAM_SELECTION);
  };

const selectUserTeam = (clubId: string) => {
    setUserTeamId(clubId);
    const club = clubs.find(c => c.id === clubId)!;
    const squad = getOrGenerateSquad(clubId);

    const lineup = LineupService.autoPickLineup(clubId, squad);
    setLineups(prev => ({ ...prev, [clubId]: lineup }));
    
    const otherLineups: Record<string, Lineup> = {};
    STATIC_CLUBS.filter(c => c.isDefaultActive && c.id !== clubId).forEach(c => {
      const s = getOrGenerateSquad(c.id);
      otherLineups[c.id] = LineupService.autoPickLineup(c.id, s);
    });
    setLineups(prev => ({ ...prev, ...otherLineups }));

   const welcomeMail = MailService.generateWelcomeMail(club, squad);
const fanMail = MailService.generateFanWelcomeMail(club, squad); // Tę funkcję zaraz dopiszemy
setMessages([welcomeMail, fanMail]);

    navigateTo(ViewState.DASHBOARD);
  };

  const updateLineup = (clubId: string, lineup: Lineup) => {
    setLineups(prev => ({ ...prev, [clubId]: lineup }));
  };

  const addRoundResults = useCallback((results: LeagueRoundResults) => {
    setRoundResults(prev => ({ ...prev, [results.dateKey]: results }));
  }, []);

  const applySimulationResult = useCallback((simulation: SimulationOutput) => {
    setClubs(simulation.updatedClubs);
    
   let finalPlayers = simulation.updatedPlayers;

 if (simulation.ratings) {
      for (const clubId in finalPlayers) {
        finalPlayers[clubId] = finalPlayers[clubId].map(p => {
          if (simulation.ratings && simulation.ratings[p.id]) {
            const hist = p.stats.ratingHistory || [];
            return { ...p, stats: { ...p.stats, ratingHistory: [...hist, simulation.ratings[p.id]] } };
          }
          return p;
        });
      }
    }


    if (userTeamId) {
      // TUTAJ WSTAW TEN KOD
      const userClub = simulation.updatedClubs.find(c => c.id === userTeamId);
      const tier = parseInt(userClub?.leagueId.split('_')[2] || '1');
      
      finalPlayers = TrainingService.processTrainingEffects(
        finalPlayers, 
        userTeamId, 
        activeTrainingId, 
        lastMatchSummary,
        userClub?.reputation || 5, 
        tier,
        activeIntensity                       
      );
      // KONIEC WSTAWKI
    }

    setPlayers(prev => {
      return { ...prev, ...finalPlayers };
    });
    
     const refinedLineups = { ...lineups };
    if (simulation.updatedLineups && Object.keys(simulation.updatedLineups).length > 0) {
      Object.assign(refinedLineups, simulation.updatedLineups);
    }
    Object.keys(refinedLineups).forEach(clubId => {
      const squad = finalPlayers[clubId];
      if (squad) {
        if (clubId === userTeamId) {
          refinedLineups[clubId] = LineupService.evictSuspendedPlayers(refinedLineups[clubId], squad);
        } else {
          refinedLineups[clubId] = LineupService.repairLineup(refinedLineups[clubId], squad);
        }
      }
    });
    setLineups(refinedLineups);
    
    if (simulation.roundResults) {
      addRoundResults(simulation.roundResults);
    }

    setLeagueSchedules(prevSchedules => {
      const updatedSchedules: Record<number, LeagueSchedule> = { ...prevSchedules };
      Object.keys(updatedSchedules).forEach(tier => {
        const t = parseInt(tier);
        const sched = updatedSchedules[t];
        if (sched) {
          updatedSchedules[t] = {
            ...sched,
            matchdays: sched.matchdays.map(md => ({
              ...md,
              fixtures: md.fixtures.map(f => {
                const updated = simulation.updatedFixtures.find(uf => uf.id === f.id);
                return updated || f;
              })
            }))
          };
        }
      });
      return updatedSchedules;
    });
    setGlobalFixtures(prev => prev.map(f => simulation.updatedFixtures.find(uf => uf.id === f.id) || f));
  }, [addRoundResults, userTeamId, activeTrainingId, lastMatchSummary, lineups]);

  const processBackgroundCupMatches = useCallback(() => {
    // Added sessionSeed as the 7th argument
    const result = BackgroundMatchProcessorPolishCup.processCupEvent(currentDate, userTeamId, allFixtures, clubs, players, lineups, sessionSeed, seasonNumber);
    
    setGlobalFixtures(prev => prev.map(f => result.updatedFixtures.find(uf => uf.id === f.id) || f));
    setPlayers(result.updatedPlayers);
    setLineups(result.updatedLineups);
    setClubs(result.updatedClubs);
  }, [currentDate, userTeamId, allFixtures, clubs, players, lineups, sessionSeed]);

    const processNegotiationResponses = (simDate: Date) => {
    const today = new Date(simDate).setHours(0,0,0,0);
    const finished = pendingNegotiations.filter(n => new Date(n.responseDate).setHours(0,0,0,0) <= today);
    
    if (finished.length === 0) return;

    finished.forEach(neg => {
      const player = Object.values(players).flat().find(p => p.id === neg.playerId);
      const userClub = clubs.find(c => c.id === userTeamId);
      
      if (!player || !userClub) return;

      const decision = FinanceService.evaluateContractLogic(
        player, neg.salary, neg.bonus, 
        new Date(simDate.getFullYear() + neg.years, 5, 30).toISOString(), 
        simDate, userClub.reputation
      );

      const mail: MailMessage = {
        id: `MAIL_NEG_${neg.id}`,
        sender: `Agent gracza ${player.lastName}`,
        role: 'Agencja Menadżerska',
        subject: decision.accepted ? 'Decyzja w sprawie kontraktu: ZGODA' : 'Decyzja w sprawie kontraktu: ODMOWA',
        body: decision.reason,
        date: new Date(simDate),
        isRead: false,
        type: MailType.SYSTEM,
        priority: 95,
        metadata: {
          type: 'CONTRACT_OFFER',
          negotiationId: neg.id,
          accepted: decision.accepted,
          salary: neg.salary,
          years: neg.years,
          bonus: neg.bonus,
           responseDate: neg.responseDate,
          status: decision.accepted ? NegotiationStatus.ACCEPTED : NegotiationStatus.REJECTED,
          isAiOffer: false,
          playerId: player.id
        }
      };

 setMessages(prev => [mail, ...prev]);

    // JEŚLI OFERTA ZOSTAŁA ODRZUCONA (metadata.accepted jest false) I JEST TO WOLNY AGENT
      if (!decision.accepted && player.clubId === 'FREE_AGENTS') {
        const lockoutDate = new Date(simDate);
        lockoutDate.setFullYear(lockoutDate.getFullYear() + 1);
        
        setPlayers(prevPlayers => {
          const updated = { ...prevPlayers };
          updated['FREE_AGENTS'] = (updated['FREE_AGENTS'] || []).map(p => 
            p.id === player.id ? { ...p, freeAgentLockoutUntil: lockoutDate.toISOString(), isNegotiationPermanentBlocked: true } : p
          );
          return updated;
        });
      }
    });

    setPendingNegotiations(prev => prev.filter(n => !finished.find(f => f.id === n.id)));
  };

  const advanceDay = useCallback(() => {
    if (viewState === ViewState.CUP_DRAW) return;

    const dateToProcess = new Date(currentDate);

    processNegotiationResponses(dateToProcess);
    

// --- EMERGENCY GK PROTOCOL (STAGE 1 PRO) ---
    if (userTeamId) {
      const userSquad = players[userTeamId] || [];
      const realGks = userSquad.filter(p => p.position === PlayerPosition.GK && !p.id.startsWith('EMERGENCY_GK_'));
      const availableRealGks = realGks.filter(p => p.health.status === HealthStatus.HEALTHY && p.suspensionMatches === 0);
      const emergencyGk = userSquad.find(p => p.id.startsWith('EMERGENCY_GK_'));

      // 1. Wykrycie kryzysu (Brak GK)
      if (availableRealGks.length === 0 && !emergencyGk) {
         const userClub = clubs.find(c => c.id === userTeamId)!;
         const tier = parseInt(userClub.leagueId.split('_')[2] || '4');
         const newJunior = SeasonTransitionService.generateEmergencyGK(userTeamId, tier, userClub.reputation);
         
         setPlayers(prev => ({ ...prev, [userTeamId]: [...(prev[userTeamId] || []), newJunior] }));
         
         // Automatyczne wstawienie do składu, aby odblokować przycisk meczu
         const currentLineup = lineups[userTeamId];
         if (currentLineup) {
           updateLineup(userTeamId, {
             ...currentLineup,
             startingXI: [newJunior.id, ...currentLineup.startingXI.slice(1)]
           });
         }

         const hireMail = MailService.createFromTemplate('staff_emergency_gk_hired', { 'PLAYER': newJunior.lastName });
         setMessages(prev => [hireMail, ...prev]);
      }
      
      // 2. Powrót do normalności (Cleanup)
      // Warunek: Realny GK zdrowy, bez kartek i kondycja >= 90%
      if (emergencyGk && realGks.some(p => p.health.status === HealthStatus.HEALTHY && p.suspensionMatches === 0 && p.condition >= 90)) {
         setPlayers(prev => ({ ...prev, [userTeamId]: (prev[userTeamId] || []).filter(p => p.id !== emergencyGk.id) }));
         
         const currentLineup = lineups[userTeamId];
         if (currentLineup) {
           updateLineup(userTeamId, {
             ...currentLineup,
             startingXI: currentLineup.startingXI.map(id => id === emergencyGk.id ? null : id)
           });
         }

         const fireMail = MailService.createFromTemplate('staff_emergency_gk_fired', { 'PLAYER': emergencyGk.lastName });
         setMessages(prev => [fireMail, ...prev]);
      }
    }
    // --- END OF EMERGENCY GK PROTOCOL ---


    // Automatyczne generowanie finału po półfinałach (19 kwietnia)
    if (dateToProcess.getMonth() === 3 && dateToProcess.getDate() === 19) {
      if (!globalFixtures.some(f => f.id.includes("FINAŁ"))) {
        const finalists = clubs.filter(c => c.isInPolishCup);
        if (finalists.length === 2) {
          const finalFixture: Fixture = {
            id: "CUP_Puchar_Polski:_FINAŁ_AUTO",
            leagueId: CompetitionType.POLISH_CUP,
            homeTeamId: finalists[0].id,
            awayTeamId: finalists[1].id,
            date: new Date(dateToProcess.getFullYear(), 4, 30), 
            status: MatchStatus.SCHEDULED,
            homeScore: null,
            awayScore: null
          };
          setGlobalFixtures(prev => [...prev, finalFixture]);
        }
      }
    }

    if (seasonTemplate) {
      const drawSlot = seasonTemplate.slots.find(s => 
        s.start.toDateString() === dateToProcess.toDateString() && 
        s.label.includes("LOSOWANIE") &&
        !processedDrawIds.includes(s.id)
      );

      if (drawSlot) {
        setTargetJumpTime(null);
        let participants: string[] = [];
        if (drawSlot.label.includes("1/64")) {
           participants = PolishCupDrawService.getInitialParticipants(clubs);
        } else {
           participants = clubs.filter(c => c.isInPolishCup).map(c => c.id);
           if (participants.length === 0) participants = cupParticipants; 
        }
        
        const cupDrawMapping: Record<string, string> = {
          "LOSOWANIE PUCHARU POLSKI 1/64": "Puchar Polski: 1/64",
          "LOSOWANIE PUCHARU POLSKI 1/32": "Puchar Polski: 1/32",
          "LOSOWANIE PUCHARU POLSKI 1/16": "Puchar Polski: 1/16",
          "LOSOWANIE PUCHARU POLSKI 1/8": "Puchar Polski: 1/8",
          "LOSOWANIE PUCHARU POLSKI 1/4": "Puchar Polski: 1/4",
          "LOSOWANIE PUCHARU POLSKI 1/2": "Puchar Polski: 1/2"
        };
        
        const matchLabel = cupDrawMapping[drawSlot.label] || drawSlot.label.replace("LOSOWANIE ", "");
        const matchSlot = seasonTemplate.slots.find(s => s.label === matchLabel);
       const pairs = PolishCupDrawService.drawPairs(
          participants, 
          clubs, 
          matchSlot?.start || dateToProcess, 
          matchLabel,
          sessionSeed // Przekazujemy unikalny klucz sesji wygenerowany przy starcie kariery
        );
        
        setActiveCupDraw({ id: drawSlot.id, label: drawSlot.label, date: dateToProcess, pairs });
        setCupParticipants(participants);
        navigateTo(ViewState.CUP_DRAW);
        return; 
      }
    }

// 1. Obliczanie wyniku symulacji (Używamy aktualnych stanów z zewnątrz setterów)
    const simulation = BackgroundMatchProcessor.processLeagueEvent(dateToProcess, userTeamId, allFixtures, clubs, players, lineups, seasonNumber, coaches);
    
    // 2. Obliczanie regeneracji kondycji i urazów
    const diffTime = Math.abs(dateToProcess.getTime() - lastRecoveryDate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const recoveryDelta = diffDays > 0 ? diffDays : 1;
    const recoveredPlayers = RecoveryService.applyDailyRecovery(simulation.updatedPlayers, dateToProcess, activeIntensity, recoveryDelta);

    // 3. Budowanie finalnego wyniku
const finalResult: SimulationOutput = {
      ...simulation,
      updatedPlayers: recoveredPlayers,
      // TUTAJ WSTAW TEN KOD
      newOffers: simulation.newOffers || []
      // KONIEC KODU
    };
    
    // 4. Aktualizacja wszystkich stanów za jednym razem (applySimulationResult)
    applySimulationResult(finalResult);

    // 5. Integracja NOWYCH OFERT AI do stanu
    if (finalResult.newOffers && finalResult.newOffers.length > 0) {
      setPendingNegotiations(prev => [...prev, ...finalResult.newOffers]);
    }

    // 6. Generowanie Raportu Dnia i Poczty (używamy finalResult zamiast result)
    if (userTeamId) {
      const userClub = finalResult.updatedClubs.find(c => c.id === userTeamId)!;
      const leagueClubs = finalResult.updatedClubs.filter(c => c.leagueId === userClub.leagueId);
      const sorted = [...leagueClubs].sort((a,b) => b.stats.points - a.stats.points || b.stats.goalDifference - a.stats.goalDifference);
      const userRank = sorted.findIndex(c => c.id === userTeamId) + 1;
      
      const resultScore = (userClub.stats.wins * 4) - (userClub.stats.losses * 6);
      const rankImpact = (18 - userRank) * 2;
      const confidence = Math.min(100, Math.max(5, 75 + resultScore + rankImpact - (userClub.reputation * 2)));
      
      const recentFixture = allFixtures.find(f => f.date.toDateString() === dateToProcess.toDateString() && (f.homeTeamId === userTeamId || f.awayTeamId === userTeamId));
      
      // Zastosowanie recoveredPlayers zapewnia świeże dane w mailach
      const newMails = MailService.generateDailyMails(dateToProcess, userClub, recoveredPlayers, finalResult.updatedClubs, userRank, confidence, recentFixture);
      if (newMails.length > 0) setMessages(prev => [...newMails, ...prev]);
    }

    const nextDay = new Date(currentDate);
    nextDay.setDate(nextDay.getDate() + 1);
    // Skok do nowego sezonu następuje 9 lipca
    if (nextDay.getMonth() === 6 && nextDay.getDate() === 9) startNextSeason(nextDay.getFullYear());

    // STAGE 1 PRO: Board Review at Checkpoints (Rounds 17, 24, 34)
 
// NOWA LOGIKA: SESJE ZARZĄDU (7 Grudnia, 1 Marca, 1 Czerwca)
    const isBoardMeeting = (nextDay.getMonth() === 11 && nextDay.getDate() === 7) || // 7 Grudnia
                           (nextDay.getMonth() === 2 && nextDay.getDate() === 1) ||  // 1 Marca
                           (nextDay.getMonth() === 5 && nextDay.getDate() === 1);   // 1 Czerwca

    if (isBoardMeeting) {
      const updatedCoaches = { ...coaches };
      const updatedClubsList = [...clubs];
      const newMails: MailMessage[] = [];

      updatedClubsList.forEach(club => {
        if (club.id === userTeamId || !club.coachId) return;
        
        const coach = updatedCoaches[club.coachId];
        
        // 6-MIESIĘCZNY OKRES OCHRONNY (Immunitet)
        const hireDate = new Date(coach.hiredDate);
        const diffTime = Math.abs(nextDay.getTime() - hireDate.getTime());
        const diffMonths = diffTime / (1000 * 60 * 60 * 24 * 30.44);
        const isProtected = diffMonths < 6;

        if (isProtected) return; // Zarząd nawet nie otwiera teczki tego trenera

        const leagueClubs = updatedClubsList.filter(c => c.leagueId === club.leagueId);
        const sorted = [...leagueClubs].sort((a,b) => b.stats.points - a.stats.points || b.stats.goalDifference - a.stats.goalDifference);
        const rank = sorted.findIndex(c => c.id === club.id) + 1;

        const evaluation = CoachService.evaluatePerformance(club, coach, rank);
        
        if (evaluation.fire) {

// ZASTĄP TEN KOD (sekcja zwolnienia AI) TYM KODEM:
          // 1. Wyślij informację do mediów
           const playerClub = updatedClubsList.find(c => c.id === userTeamId);
          const playerTier = parseInt(playerClub?.leagueId.split('_')[2] || '4');
          const firingClubTier = parseInt(club.leagueId.split('_')[2] || '4');

          // Wiadomość trafia do skrzynki tylko, jeśli liga zwolnienia jest równa lub wyższa (niższy Tier) niż gracza
          if (firingClubTier <= playerTier) {
            newMails.push(MailService.generateCoachFiredMail(club.name, `${coach.firstName} ${coach.lastName}`, rank));
          }
          // 2. Wykonaj fizyczne zwolnienie
          Object.keys(coach.attributes).forEach(attr => {
            const key = attr as keyof typeof coach.attributes;
            coach.attributes[key] = Math.max(1, coach.attributes[key] - 1);
          });
          
          coach.blacklist[club.id] = nextDay.getFullYear() + 5;
          coach.currentClubId = null;
          coach.history[coach.history.length-1].toYear = nextDay.getFullYear();
          coach.history[coach.history.length-1].toMonth = nextDay.getMonth()+1;
          // Szukanie następcy
          const candidates = Object.values(updatedCoaches).filter(c => 
            !c.currentClubId && (!c.blacklist[club.id] || c.blacklist[club.id] <= nextDay.getFullYear())
          );
          const replacement = candidates.sort((a,b) => b.attributes.experience - a.attributes.experience)[0];
          
          if (replacement) {
            replacement.currentClubId = club.id;
            replacement.history.push({
              clubId: club.id, clubName: club.name,
              fromYear: nextDay.getFullYear(), fromMonth: nextDay.getMonth()+1,
              toYear: null, toMonth: null
            });
            club.coachId = replacement.id;
          }
        }
      });
        if (newMails.length > 0) setMessages(prev => [...newMails, ...prev]);
      setCoaches(updatedCoaches);
      setClubs(updatedClubsList);
    }

  if (nextDay.getMonth() === 6 && nextDay.getDate() === 10) {
      const review = AiContractService.performSeasonSquadReview(clubs, players, userTeamId);
      setClubs(review.updatedClubs);
      setPlayers(review.updatedPlayers);
    }

    setCurrentDate(nextDay);
    setLastRecoveryDate(new Date(dateToProcess));
  }, [currentDate, userTeamId, allFixtures, applySimulationResult, startNextSeason, viewState, seasonTemplate, cupParticipants, clubs, processedDrawIds, navigateTo, globalFixtures]);

  const confirmCupDraw = (pairs: Fixture[]) => {
    if (!activeCupDraw) return;
    
    const participantIds = new Set<string>();
    pairs.forEach(f => { participantIds.add(f.homeTeamId); participantIds.add(f.awayTeamId); });
    
    setClubs(prev => prev.map(c => ({
       ...c,
       isInPolishCup: participantIds.has(c.id)
    })));

    setGlobalFixtures(prev => [...prev, ...pairs]);
    setProcessedDrawIds(prev => [...prev, activeCupDraw.id]);
    setActiveCupDraw(null);
    
    if (userTeamId) {
      const isUserIn = pairs.some(f => f.homeTeamId === userTeamId || f.awayTeamId === userTeamId);
      const mail: MailMessage = { 
        id: `CUP_DRAW_${Date.now()}`, 
        sender: 'Sekretariat PZPN', 
        role: 'Biuro Rozgrywek', 
        subject: 'Zakończono losowanie Pucharu Polski', 
        body: isUserIn ? `Wylosowano pary nadchodzącej rundy. Nasz zespół trafił na kolejnego przeciwnika. Szczegóły w terminarzu.` : `Zakończono losowanie kolejnej rundy Pucharu Polski. Nasz zespół niestety odpadł z rozgrywek.`, 
        date: new Date(currentDate), 
        isRead: false, 
        type: MailType.SYSTEM, 
        priority: 80 
      };
      setMessages(prev => [mail, ...prev]);
    }

    const nextDay = new Date(currentDate);
    nextDay.setDate(nextDay.getDate() + 1);
    setCurrentDate(nextDay);
    navigateTo(ViewState.DASHBOARD);
  };

  const markMessageRead = (id: string) => setMessages(prev => prev.map(m => m.id === id ? { ...m, isRead: true } : m));
  const deleteMessage = (id: string) => setMessages(prev => prev.filter(m => m.id !== id));
 const updatePlayer = (clubId: string, playerId: string, newData: Partial<Player>) => {
    setPlayers(prev => ({
      ...prev,
      [clubId]: prev[clubId].map(p => p.id === playerId ? { ...p, ...newData } : p)
    }));
  };

  const toggleTransferList = (playerId: string) => {
    if (!userTeamId) return;
    const squad = players[userTeamId] || [];
    const player = squad.find(p => p.id === playerId);
    if (player) {
      updatePlayer(userTeamId, playerId, { isOnTransferList: !player.isOnTransferList });
    }
  };

const finalizeFreeAgentContract = useCallback((mailId: string) => {
    const mail = messages.find(m => m.id === mailId);
    // TUTAJ WSTAW TEN KOD (Weryfikacja typu metadanych)
    if (!mail || !mail.metadata || mail.metadata.type !== 'CONTRACT_OFFER' || !userTeamId) return;

    const { playerId, salary, years, bonus } = mail.metadata;
    // KONIEC KODU
    const freeAgents = players['FREE_AGENTS'] || [];
    const playerToSign = freeAgents.find(p => p.id === playerId);

    if (!playerToSign) return;

    // 1. Zabierz bonus z budżetu klubu
    setClubs(prev => prev.map(c => c.id === userTeamId ? { ...c, budget: c.budget - bonus } : c));

    // 2. Przygotuj dane piłkarza (nowy klub, pensja, data)
    const newEndDate = new Date(currentDate.getFullYear() + years, 5, 30).toISOString();
   // AKTUALIZACJA HISTORII - TUTAJ WSTAW TEN KOD
    const updatedHistory = [...(playerToSign.history || [])];
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    const userClub = clubs.find(c => c.id === userTeamId);

    // 1. Zamknij okres bezrobocia
    if (updatedHistory.length > 0) {
      updatedHistory[updatedHistory.length - 1] = {
        ...updatedHistory[updatedHistory.length - 1],
        toYear: currentYear,
        toMonth: currentMonth
      };
    }

    // 2. Dodaj nowy klub do historii
    updatedHistory.push({
      clubName: userClub?.name || "Nieznany Klub",
      clubId: userTeamId,
      fromYear: currentYear,
      fromMonth: currentMonth,
      toYear: null,
      toMonth: null
    });

    const updatedPlayer = { 
      ...playerToSign, 
      clubId: userTeamId, 
      annualSalary: salary, 
      contractEndDate: newEndDate,
      marketValue: FinanceService.calculateMarketValue(playerToSign, 5, 1),
      history: updatedHistory // Podpinamy zaktualizowaną historię
    };

    // 3. Przenieś piłkarza: usuń z wolnych, dodaj do klubu
    setPlayers(prev => ({
      ...prev,
      ['FREE_AGENTS']: prev['FREE_AGENTS'].filter(p => p.id !== playerId),
      [userTeamId]: [...(prev[userTeamId] || []), updatedPlayer]
    }));

    // 4. Usuń wiadomość e-mail
    setMessages(prev => prev.filter(m => m.id !== mailId));

    alert(`Transfer sfinalizowany! ${playerToSign.firstName} ${playerToSign.lastName} dołączył do kadry.`);
  }, [messages, players, userTeamId, currentDate]);


  useEffect(() => {
    if (targetJumpTime !== null && viewState !== ViewState.CUP_DRAW) {
      const today = new Date(currentDate).setHours(0,0,0,0);
      if (today < targetJumpTime) {
        const timer = setTimeout(() => {
          advanceDay();
        }, 5);
        return () => clearTimeout(timer);
      } else {
        setTargetJumpTime(null);
      }
    }
  }, [currentDate, targetJumpTime, advanceDay, viewState]);

  const jumpToDate = (date: Date) => setTargetJumpTime(new Date(date).setHours(0,0,0,0));
  const jumpToNextEvent = () => {
    if (nextEvent) {
       const today = new Date(currentDate).setHours(0, 0, 0, 0);
       const eventDate = new Date(nextEvent.startDate).setHours(0, 0, 0, 0);
       if (eventDate <= today) advanceDay();
       else jumpToDate(nextEvent.startDate);
    } else advanceDay();
  };

  const viewClubDetails = (clubId: string) => { setViewedClubId(clubId); navigateTo(ViewState.CLUB_DETAILS); };
  const viewPlayerDetails = (playerId: string) => { setViewedPlayerId(playerId); navigateTo(ViewState.PLAYER_CARD); };
  const viewCoachDetails = (coachId: string) => { setViewedCoachId(coachId); navigateTo(ViewState.COACH_CARD); };
  const viewRefereeDetails = (refId: string) => { setViewedRefereeId(refId); navigateTo(ViewState.REFEREE_CARD); };

  useEffect(() => {
    if (userTeamId && seasonTemplate) {
      const userClub = clubs.find(c => c.id === userTeamId);
      const tierStr = userClub?.leagueId.split('_')[2];
      const tier = tierStr ? parseInt(tierStr) : 1;
      const ev = NextPlayerEventService.getNextEvent(currentDate, userTeamId, tier, leagueSchedules, seasonTemplate, allFixtures);
      setNextEvent(ev);
    }
  }, [currentDate, userTeamId, leagueSchedules, seasonTemplate, clubs, allFixtures]);

  return (
    <GameContext.Provider value={{
      currentDate, viewState, clubs, leagues, players, viewCoachDetails, coaches, lineups, fixtures: allFixtures, userTeamId, seasonTemplate, leagueSchedules, nextEvent,
    viewedClubId, viewedPlayerId, viewedCoachId, viewedRefereeId, previousViewState, lastMatchSummary, roundResults, isJumping: targetJumpTime !== null,
      lastRecoveryDate,
      managerProfile, seasonNumber, activeMatchState, messages, activeTrainingId, cupParticipants, activeCupDraw,
      activeIntensity, setTrainingIntensity: setActiveIntensity,
      startNewGame, saveManagerProfile, selectUserTeam, advanceDay, jumpToDate, jumpToNextEvent, navigateTo, updateLineup, viewClubDetails, viewPlayerDetails, viewRefereeDetails, getOrGenerateSquad,
      setPlayers, setClubs, setLastMatchSummary, addRoundResults, applySimulationResult, setActiveMatchState, 
      setMessages, pendingNegotiations, setPendingNegotiations, finalizeFreeAgentContract,
      markMessageRead, deleteMessage, setActiveTrainingId, confirmCupDraw, processBackgroundCupMatches, sessionSeed, updatePlayer,toggleTransferList
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) throw new Error('useGame must be used within a GameProvider');
  return context;
};


