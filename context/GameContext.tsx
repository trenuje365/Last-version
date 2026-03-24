import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { 
  ViewState, Club, League, Player, Lineup, Fixture, 
  SeasonTemplate, LeagueSchedule, PlayerNextEvent, EventKind, MatchSummary, LeagueRoundResults, ManagerProfile, MatchLiveState,
  MailMessage, MatchStatus, MailType, CompetitionType,
Coach, TrainingIntensity,
PendingNegotiation, NegotiationStatus,
HealthStatus,
PlayerPosition, EuropeanStatus
} from '../types';
import { RAW_CHAMPIONS_LEAGUE_CLUBS, generateEuropeanClubId } from '../resources/static_db/clubs/ChampionsLeagueTeams';
import { RAW_EUROPA_LEAGUE_CLUBS, generateELClubId } from '../resources/static_db/clubs/EuropeLeagueTeams';
import { ELDrawService } from '../LECupEngine/ELDrawService';
import { CONFDrawService } from '../LECupEngine/CONFDrawService';
import { RAW_CONFERENCE_LEAGUE_CLUBS, generateCONFClubId } from '../resources/static_db/clubs/ConferenceLeagueTeams';
import { STATIC_CLUBS, STATIC_LEAGUES, STATIC_CL_CLUBS, STATIC_EL_CLUBS, STATIC_CONF_CLUBS, START_DATE } from '../constants';
import { SeasonTemplateGenerator } from '../services/SeasonTemplateGenerator';
import { LeagueScheduleGenerator } from '../services/LeagueScheduleGenerator';
import { CalendarEngine } from '../services/CalendarEngine';
import { SquadGeneratorService } from '../services/SquadGeneratorService';
import { LineupService } from '../services/LineupService';
import { BackgroundMatchProcessor } from '../services/BackgroundMatchProcessor';
import { DebugLoggerService } from '../services/DebugLoggerService';
import { BackgroundMatchProcessorPolishCup } from '../services/BackgroundMatchProcessorPolishCup';
import { RecoveryService } from '../services/RecoveryService';
import { MailService, SeasonSummaryData } from '../services/MailService';
import { TrainingService } from '../services/TrainingService';
import { SeasonTransitionService } from '../services/SeasonTransitionService';
import { LeagueStatsService } from '../services/LeagueStatsService';
import { FinanceService } from '../services/FinanceService';
import { PolishCupDrawService } from '../services/PolishCupDrawService';
import { CLDrawService } from '../services/CLDrawService';
import { SuperCupService } from '../services/SuperCupService';
import { CoachService } from '../services/CoachService';
import { RefereeService } from '../services/RefereeService';
import { FreeAgentService } from '../services/FreeAgentService';
import { AiContractService } from '@/services/AiContractService';
import { BackgroundMatchProcessorCL } from '../services/BackgroundMatchProcessorCL';
import { ScoutAssistantService } from '../services/ScoutAssistantService';
import { ChampionshipHistoryService } from '../data/championship_history';

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
  activeGroupDraw: { id: string, label: string, date: Date, groups: string[][] } | null;
  clGroups: string[][] | null;
  activeELGroupDraw: { id: string, label: string, date: Date, groups: string[][] } | null;
  elGroups: string[][] | null;
  activeConfGroupDraw: { id: string, label: string, date: Date, groups: string[][] } | null;
  confGroups: string[][] | null;
  supercupWinners: { season: string; winner: string; year: number; }[];
  addSupercupWinner: (season: string, winner: string, year: number) => void;

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
  confirmCLDraw: (pairs: Fixture[]) => void;
  confirmELDraw: (pairs: Fixture[]) => void;
  confirmELR2QDraw: (pairs: Fixture[]) => void;
  confirmCLGroupDraw: () => void;
  confirmELGroupDraw: () => void;
  confirmELR16Draw: () => void;
    confirmCLR16Draw: () => void;
  confirmCLQFDraw: () => void;
  confirmCLSFDraw: () => void;
  confirmELQFDraw: () => void;
  confirmELSFDraw: () => void;
  confirmELFinalDraw: () => void;
  confirmCONFDraw: (pairs: Fixture[]) => void;
  confirmCONFR2QDraw: (pairs: Fixture[]) => void;
  confirmCONFGroupDraw: () => void;
  confirmCONFR16Draw: () => void;
  confirmCONFQFDraw: () => void;
  confirmCONFSFDraw: () => void;
  confirmCONFFinalDraw: () => void;
  confirmSeasonEnd: () => void;
  elHistoryInitialRound: string | null;
  setElHistoryInitialRound: (round: string | null) => void;

  processBackgroundCupMatches: () => void;
    processCLMatchDay: () => void;
  updatePlayer: (clubId: string, playerId: string, newData: Partial<Player>) => void;
  toggleTransferList: (playerId: string) => void;
  pendingNegotiations: PendingNegotiation[];
setPendingNegotiations: React.Dispatch<React.SetStateAction<PendingNegotiation[]>>;
finalizeFreeAgentContract: (mailId: string) => void;

 europeanStatus: Record<string, EuropeanStatus>;
  setEuropeanStatus: React.Dispatch<React.SetStateAction<Record<string, EuropeanStatus>>>;
  addFinanceLog: (clubId: string, description: string, amount: number, date?: Date, previousBalance?: number) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentDate, setCurrentDate] = useState<Date>(START_DATE);
  const [sessionSeed, setSessionSeed] = useState<number>(0);
  const [viewState, setViewState] = useState<ViewState>(ViewState.START_MENU);
  const [previousViewState, setPreviousViewState] = useState<ViewState | null>(null);
  const [clubs, setClubs] = useState<Club[]>([...STATIC_CLUBS, ...STATIC_CL_CLUBS, ...STATIC_EL_CLUBS, ...STATIC_CONF_CLUBS]);
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
 const [europeanStatus, setEuropeanStatus] = useState<Record<string, EuropeanStatus>>({});
  // Polish Cup & Persistent Events State
  const [cupParticipants, setCupParticipants] = useState<string[]>([]);
  const [activeCupDraw, setActiveCupDraw] = useState<{ id: string, label: string, date: Date, pairs: Fixture[] } | null>(null);
  const [activeGroupDraw, setActiveGroupDraw] = useState<{ id: string, label: string, date: Date, groups: string[][] } | null>(null);
  const [clGroups, setClGroups] = useState<string[][] | null>(null);
  const [activeELGroupDraw, setActiveELGroupDraw] = useState<{ id: string, label: string, date: Date, groups: string[][] } | null>(null);
  const [elGroups, setElGroups] = useState<string[][] | null>(null);
  const [activeConfGroupDraw, setActiveConfGroupDraw] = useState<{ id: string, label: string, date: Date, groups: string[][] } | null>(null);
  const [confGroups, setConfGroups] = useState<string[][] | null>(null);
  const [processedDrawIds, setProcessedDrawIds] = useState<string[]>([]);
  const [globalFixtures, setGlobalFixtures] = useState<Fixture[]>([]);
  const [elHistoryInitialRound, setElHistoryInitialRound] = useState<string | null>(null);
 const [currentPolishChampionId, setCurrentPolishChampionId] = useState<string>('PL_LECH_POZNAN');
 const [currentPolishCupWinnerId, setCurrentPolishCupWinnerId] = useState<string>('PL_LEGIA_WARSZAWA');
 // Polskie drużyny do CONF R2Q: sezon 1 = Jagiellonia + Raków, kolejne sezony = 2. i 3. miejsce Ekstraklasy z zabezpieczeniem PP
 const [confR2QPolishTeamIds, setConfR2QPolishTeamIds] = useState<string[]>(['PL_JAGIELLONIA_BIALYSTOK', 'PL_RAKOW_CZESTOCHOWA']);
 const [supercupWinners, setSupercupWinners] = useState<{ season: string; winner: string; year: number; }[]>(() => {
    // Załaduj z localStorage przy inicjalizacji
    try {
      const stored = localStorage?.getItem('fm_championship_history');
      if (stored) {
        const all = JSON.parse(stored) as any[];
        return all.filter(e => e.competition === 'SUPERPUCHAR_POLSKI') || [];
      }
    } catch (e) {
      console.error('Failed to load supercup winners from localStorage:', e);
    }
    // Fallback na dane domyślne
    return [
      { season: '2023/2024', winner: 'Jagiellonia Białystok', year: 2024 }
    ];
  });

  // Guard: zapobiega wielokrotnemu uruchomieniu processLeagueEvent dla tej samej daty
  const lastProcessedLeagueDateRef = React.useRef<string | null>(null);

  // Helper do dodawania logów finansowych
  const addFinanceLog = useCallback((clubId: string, description: string, amount: number, date?: Date, previousBalance?: number) => {
    const logDate = (date || currentDate).toISOString().split('T')[0];
    
    // Jeśli previousBalance nie podany, pobierz z klubu
    let prevBalance = previousBalance;
    if (prevBalance === undefined) {
      const club = clubs.find(c => c.id === clubId);
      // Jeśli operacja zwiększała budżet, to poprzednie saldo = obecne - kwota
      // Jeśli operacja zmniejszała budżet, to poprzednie saldo = obecne - (-kwota) = obecne + kwota
      prevBalance = club ? club.budget - amount : 0;
    }
    
    const newLog = {
      id: Math.random().toString(36).substr(2, 9),
      date: logDate,
      amount: amount,
      type: amount >= 0 ? 'INCOME' as const : 'EXPENSE' as const,
      description: description,
      previousBalance: prevBalance
    };

    setClubs(prev => prev.map(c => 
      c.id === clubId 
        ? { ...c, financeHistory: [newLog, ...(c.financeHistory || [])].slice(0, 50) } 
        : c
    ));
  }, [currentDate, clubs]);

  const addSupercupWinner = useCallback((season: string, winner: string, year: number) => {
    setSupercupWinners(prev => {
      const exists = prev.some(w => w.season === season);
      if (exists) {
        return prev.map(w => w.season === season ? { season, winner, year } : w);
      }
      return [...prev, { season, winner, year }];
    });
  }, []);

  // Guard: śledzi ID maili już wysłanych w trakcie sesji (by nie duplikować przy stale closure)
  const sentMailIdsRef = React.useRef<Set<string>>(new Set());

  // Memoized allFixtures
  const allFixtures = useMemo(() => {
    const allLeagueFixtures = Object.values(leagueSchedules).flatMap(s => s.matchdays.flatMap(m => m.fixtures));
    return [...allLeagueFixtures, ...globalFixtures];
  }, [leagueSchedules, globalFixtures]);

const getOrGenerateSquad = useCallback((clubId: string): Player[] => {
    if (players[clubId]) return players[clubId];

    // Sprawdź czy to klub europejski (CL)
    const rawCL = RAW_CHAMPIONS_LEAGUE_CLUBS.find(c => generateEuropeanClubId(c.name) === clubId);
    if (rawCL) {
        const newSquad = SquadGeneratorService.generateEuropeanSquad(clubId, rawCL.tier, rawCL.reputation, rawCL.country);
        setPlayers(prev => ({ ...prev, [clubId]: newSquad }));
        return newSquad;
    }

    const rawEL = RAW_EUROPA_LEAGUE_CLUBS.find(c => generateELClubId(c.name) === clubId);
    if (rawEL) {
        const newSquad = SquadGeneratorService.generateEuropeanSquad(clubId, rawEL.tier, rawEL.reputation, rawEL.country);
        setPlayers(prev => ({ ...prev, [clubId]: newSquad }));
        return newSquad;
    }

    const rawCONF = RAW_CONFERENCE_LEAGUE_CLUBS.find(c => generateCONFClubId(c.name) === clubId);
    if (rawCONF) {
        const newSquad = SquadGeneratorService.generateEuropeanSquad(clubId, rawCONF.tier, rawCONF.reputation, rawCONF.country);
        setPlayers(prev => ({ ...prev, [clubId]: newSquad }));
        return newSquad;
    }

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
    const coachData = CoachService.generateInitialCoaches([...STATIC_CLUBS, ...STATIC_CL_CLUBS, ...STATIC_EL_CLUBS, ...STATIC_CONF_CLUBS]);
    setCoaches(coachData.coaches);
    setClubs(coachData.updatedClubs);
   


 const initialFreeAgents = FreeAgentService.generatePool(99);
    setPlayers(prev => ({ ...prev, 'FREE_AGENTS': initialFreeAgents }));


    setSeasonTemplate(template);
    setSeasonNumber(1);
    const initialSchedules = generateSchedules(template, STATIC_CLUBS);
    setLeagueSchedules(initialSchedules);

 // Generuj składy dla klubów Ligi Mistrzów
    const europeanPlayers: Record<string, Player[]> = {};
    RAW_CHAMPIONS_LEAGUE_CLUBS.forEach(club => {
      const clubId = generateEuropeanClubId(club.name);
            europeanPlayers[clubId] = SquadGeneratorService.generateEuropeanSquad(clubId, club.tier, club.reputation, club.country);
    });
    RAW_EUROPA_LEAGUE_CLUBS.forEach(club => {
      const clubId = generateELClubId(club.name);
      europeanPlayers[clubId] = SquadGeneratorService.generateEuropeanSquad(clubId, club.tier, club.reputation, club.country);
    });
    RAW_CONFERENCE_LEAGUE_CLUBS.forEach(club => {
      const clubId = generateCONFClubId(club.name);
      europeanPlayers[clubId] = SquadGeneratorService.generateEuropeanSquad(clubId, club.tier, club.reputation, club.country);
    });
    setPlayers(prev => ({ ...prev, ...europeanPlayers }));

    setMessages([]);
    setProcessedDrawIds([]);
    const initialSuperCup = SuperCupService.generateFixture(2025, STATIC_CLUBS);
    setGlobalFixtures([initialSuperCup]);
    setClubs([...STATIC_CLUBS.map(c => ({ ...c, isInPolishCup: false })), ...STATIC_CL_CLUBS, ...STATIC_EL_CLUBS, ...STATIC_CONF_CLUBS]);
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
    let cupLoserId: string | undefined;
    if (cupFinal) {
     const hScore = cupFinal.homeScore || 0;
      const aScore = cupFinal.awayScore || 0;
      let homeWin = hScore > aScore;

      // Jeśli w regulaminowym czasie był remis, sprawdź rzuty karne
      if (hScore === aScore && cupFinal.homePenaltyScore !== undefined) {
        homeWin = cupFinal.homePenaltyScore > (cupFinal.awayPenaltyScore || 0);
      }
      cupWinnerId = homeWin ? cupFinal.homeTeamId : cupFinal.awayTeamId;
      cupLoserId = homeWin ? cupFinal.awayTeamId : cupFinal.homeTeamId;
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

    const summaryMail = MailService.generateSeasonSummaryMail(summaryData);
    setMessages(prev => [summaryMail, ...prev]);

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
      
      // Obliczanie rankingu klubu w nowej lidze (po potencjalnym awansie/spadku)
      let leagueRanking = 10;
      let currentLeagueStandings: Club[] = [];
      
      if (newLeagueId === 'L_PL_1') {
        currentLeagueStandings = standingsL1;
      } else if (newLeagueId === 'L_PL_2') {
        currentLeagueStandings = standingsL2;
      } else if (newLeagueId === 'L_PL_3') {
        currentLeagueStandings = standingsL3;
      }
      
      if (currentLeagueStandings.length > 0) {
        leagueRanking = currentLeagueStandings.findIndex(c => c.id === club.id) + 1 || leagueRanking;
      }
      
      const seasonalAwardRank = leagueRanking;
      let nextSeasonInjection = FinanceService.calculateSeasonalIncome(newTier, newReputation, seasonalAwardRank);
      
      // Bonusy ligowe (tylko dla Ekstraklasy - tier 1)
      let leagueBonusAmount = 0;
      if (newTier === 1 && newLeagueId === 'L_PL_1') {
        leagueBonusAmount = FinanceService.calculateLeagueFinishBonus(leagueRanking, newTier);
        nextSeasonInjection += leagueBonusAmount;
      }
      
      // Bonusy za Puchar Polski
      let cupBonusAmount = 0;
      if (club.id === cupWinnerId) {
        cupBonusAmount = FinanceService.calculatePolishCupBonus('WINNER');
        nextSeasonInjection += cupBonusAmount;
      }

      // Tworzymy logi finansowe dla bonusów
      const financeLogsToAdd: any[] = [];
      let currentBalance = club.budget;

      const seasonalLog = {
        id: Math.random().toString(36).substring(2, 9),
        date: currentDate.toISOString().split('T')[0],
        amount: nextSeasonInjection,
        type: 'INCOME' as const,
        description: `Zastrzyk finansowy (TV, Sponsoring, Nagrody)`,
        previousBalance: currentBalance
      };
      financeLogsToAdd.push(seasonalLog);

      // Jeśli są bonusy ligowe lub pucharowe, dodaj je jako osobne wpisy
      if (leagueBonusAmount > 0) {
        currentBalance += nextSeasonInjection - leagueBonusAmount; // Uwzględniamy inne przychody
        financeLogsToAdd.push({
          id: Math.random().toString(36).substring(2, 9),
          date: currentDate.toISOString().split('T')[0],
          amount: leagueBonusAmount,
          type: 'INCOME' as const,
          description: `Nagroda za ${leagueRanking === 1 ? 'Mistrzostwo Polski' : (leagueRanking === 2 ? '2. miejsce w Ekstraklasie' : (leagueRanking === 3 ? '3. miejsce w Ekstraklasie' : (leagueRanking === 4 ? '4. miejsce w Ekstraklasie' : `${leagueRanking}. miejsce w Ekstraklasie`)))}`,
          previousBalance: currentBalance
        });
      }
      
      if (cupBonusAmount > 0) {
        currentBalance = currentBalance - (leagueBonusAmount > 0 ? leagueBonusAmount : 0) + nextSeasonInjection;
        financeLogsToAdd.push({
          id: Math.random().toString(36).substring(2, 9),
          date: currentDate.toISOString().split('T')[0],
          amount: cupBonusAmount,
          type: 'INCOME' as const,
          description: `Nagroda za zwycięstwo w Pucharze Polski`,
          previousBalance: currentBalance
        });
      }

      return {
        ...club,
        leagueId: newLeagueId,
        reputation: newReputation,
        budget: club.budget + nextSeasonInjection,
        financeHistory: [...financeLogsToAdd, ...(club.financeHistory || [])].slice(0, 50),
        stats: { points: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, played: 0, form: [] },
        isInPolishCup: false 
      };
    });

    setCoaches(updatedCoaches);
    setClubs(updatedClubs);

// Reset europejskiego statusu — wszyscy z powrotem biorą udział w LM na nowy sezon
    const freshEuropeanStatus: Record<string, EuropeanStatus> = {};
    RAW_CHAMPIONS_LEAGUE_CLUBS.forEach(club => {
      const clubId = generateEuropeanClubId(club.name);
      freshEuropeanStatus[clubId] = {
        isInChampionsLeague: true,
        isInEuropeanLeague: false,
        isInConferenceLeague: false,
        isInChampionsLeagueNextPhase: false,
        isInEuropeanLeagueNextPhase: false,
        isInConferenceLeagueNextPhase: false,
      };
    });
    setEuropeanStatus(freshEuropeanStatus);

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
    if (champion?.id) setCurrentPolishChampionId(champion.id);

    // Ustal kto idzie do LE R2Q: zwycięzca PP, chyba że jest też mistrzem — wtedy przegrany finału
    if (cupWinnerId) {
      const polishCupR2QId = (cupWinnerId === champion?.id && cupLoserId) ? cupLoserId : cupWinnerId;
      setCurrentPolishCupWinnerId(polishCupR2QId);
    }

    // Ustal 2 polskie drużyny do CONF R2Q: 2. i 3. miejsce Ekstraklasy
    // Jeśli drużyna z 2. lub 3. miejsca wygrała PP (gra w LE), zastępujemy ją 4. miejscem
    {
      const lePolishTeamId = cupWinnerId
        ? ((cupWinnerId === champion?.id && cupLoserId) ? cupLoserId : cupWinnerId)
        : null;

      const candidates: string[] = [];
      let replacementIndex = 3; // index 3 = 4. miejsce (0-based)

      for (let i = 1; i < standingsL1.length && candidates.length < 2; i++) {
        const candidateId = standingsL1[i].id;
        if (candidateId === lePolishTeamId) {
          // Ta drużyna idzie do LE — pomijamy, bierzemy następną z listy
          const replacement = standingsL1[replacementIndex];
          if (replacement && !candidates.includes(replacement.id) && replacement.id !== lePolishTeamId) {
            candidates.push(replacement.id);
            replacementIndex++;
          }
        } else {
          candidates.push(candidateId);
        }
      }

      if (candidates.length > 0) {
        setConfR2QPolishTeamIds(candidates.slice(0, 2));
      }
    }


        const seasonEndDate = new Date(newYear - 1, 5, 30); // 30 czerwca kończącego się sezonu
    const transitionResult = SeasonTransitionService.processSquadTransition(players, updatedClubs, seasonEndDate, userTeamId);
    setPlayers(transitionResult.updatedPlayers);

    // Zwolnieni zawodnicy → wolni agenci
    if (transitionResult.releasedPlayers.length > 0) {
      setPlayers(prev => ({
        ...prev,
        'FREE_AGENTS': [...(prev['FREE_AGENTS'] || []), ...transitionResult.releasedPlayers]
      }));
    }

if (userTeamId) {
      const myRetirements = transitionResult.retirementLogs.filter(log => log.clubId === userTeamId);
      const userClub = updatedClubs.find(c => c.id === userTeamId);
      const retirementMail = MailService.generateRetirementReportMail(myRetirements, userClub?.name || "");
      setMessages(prev => [retirementMail, ...prev]);
    }




    // 6. Poczta
    if (userTeamId) {
      const newEndMails: MailMessage[] = [];

      // Email jeśli gracz wygrał ligę
      if (champion?.id === userTeamId) {
        const userClub = clubs.find(c => c.id === userTeamId);
        const leagueChampionMail = MailService.createFromTemplate('board_league_champion', {
          'CLUB': userClub?.name || ''
        });
        newEndMails.push(leagueChampionMail);
      }

      if (newEndMails.length > 0) {
        setMessages(prev => [...newEndMails, ...prev]);
      }
    }
    RefereeService.applyEndOfSeasonAdjustments();
    RefereeService.resetSeasonStats();
    
    // Zapisz zwycięzców do historii
    const seasonKey = `${newYear - 1}/${newYear}`;
    if (champion?.name) {
      // Znajdź drugie miejsce w Ekstraklasie
      const secondPlace = standingsL1[1];
      ChampionshipHistoryService.addEkstraklasaChampion(
        seasonKey,
        champion.name,
        secondPlace?.name || 'Nieznany',
        newYear
      );
    }
    
    if (cupWinnerId) {
      const cupWinner = updatedClubs.find(c => c.id === cupWinnerId);
      if (cupWinner?.name) {
        ChampionshipHistoryService.addCupChampion(seasonKey, 'PUCHAR_POLSKI', cupWinner.name, newYear);
      }
    }
    // Superpuchar będzie uzupełniany po meczu (na razie tylko zwycięzcy ligi i pucharu)
    
    setRoundResults({});
    sentMailIdsRef.current = new Set();
    lastProcessedLeagueDateRef.current = null;
    setConfGroups(null);
    setActiveConfGroupDraw(null);
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

   const welcomeMail = MailService.generateWelcomeMail(club, squad, currentDate);
const fanMail = MailService.generateFanWelcomeMail(club, squad, currentDate); // Tę funkcję zaraz dopiszemy
setMessages([welcomeMail, fanMail]);

    navigateTo(ViewState.DASHBOARD);
  };

  const updateLineup = (clubId: string, lineup: Lineup) => {
    setLineups(prev => ({ ...prev, [clubId]: lineup }));
  };

  const addRoundResults = useCallback((results: LeagueRoundResults) => {
    DebugLoggerService.log('ROUND_SAVE', `dateKey=${results.dateKey} | L1=${results.league1Results.length} | L2=${results.league2Results.length} | L3=${results.league3Results.length}`, true);
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

  const processCLMatchDay = useCallback(() => {
    // null zamiast userTeamId — gracz kliknął "Symuluj", więc symulujemy WSZYSTKIE mecze
    // łącznie z drużyną gracza (brak trybu live dla CL)
    const clResult = BackgroundMatchProcessorCL.processChampionsLeagueEvent(
      currentDate, null, allFixtures, clubs, sessionSeed
    );
    setGlobalFixtures(prev => {
      const clMap = new Map(clResult.updatedFixtures.map(f => [f.id, f]));
      return prev.map(f => {
        const clF = clMap.get(f.id);
        if (clF && (
          clF.status !== f.status ||
          clF.homeScore !== f.homeScore ||
          clF.awayScore !== f.awayScore ||
          clF.homePenaltyScore !== f.homePenaltyScore ||
          clF.awayPenaltyScore !== f.awayPenaltyScore
        )) {
          return clF;
        }
        return f;
      });
    });
  }, [currentDate, userTeamId, allFixtures, clubs, sessionSeed]);

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
    if (viewState === ViewState.CUP_DRAW || viewState === ViewState.CL_DRAW || viewState === ViewState.EL_DRAW || viewState === ViewState.EL_R2Q_DRAW || viewState === ViewState.CONF_DRAW || viewState === ViewState.CONF_R2Q_DRAW || viewState === ViewState.CONF_GROUP_DRAW || viewState === ViewState.CONF_R16_DRAW || viewState === ViewState.CONF_QF_DRAW || viewState === ViewState.CONF_SF_DRAW) return;

    const dateToProcess = new Date(currentDate);
    // Czy to automatyczny skok (jumpToDate/jumpToNextEvent) — NIE ręczny klik gracza?
    const isAutoJumping = targetJumpTime !== null;

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

        // ── Email o finale Pucharu Polski (wysyłany dzień po finale) ─────────────
    if (userTeamId) {
      const cupFinalFixture = allFixtures.find(f =>
        f.id.includes('CUP_Puchar_Polski:_FINAŁ') &&
        f.status === MatchStatus.FINISHED
      );
      if (cupFinalFixture) {
        const dayAfterFinal = new Date(cupFinalFixture.date);
        dayAfterFinal.setDate(dayAfterFinal.getDate() + 1);
        if (dayAfterFinal.toDateString() === dateToProcess.toDateString()) {
          const cupFinalMailKey = 'CUP_FINAL_SENT';
          if (!sentMailIdsRef.current.has(cupFinalMailKey)) {
            const hScore = cupFinalFixture.homeScore || 0;
            const aScore = cupFinalFixture.awayScore || 0;
            let homeWin = hScore > aScore;
            if (hScore === aScore && cupFinalFixture.homePenaltyScore !== undefined) {
              homeWin = cupFinalFixture.homePenaltyScore > (cupFinalFixture.awayPenaltyScore || 0);
            }
            const cupWinnerIdLocal = homeWin ? cupFinalFixture.homeTeamId : cupFinalFixture.awayTeamId;
            const penScore = cupFinalFixture.homePenaltyScore !== undefined
              ? `${hScore}:${aScore} (${cupFinalFixture.homePenaltyScore}:${cupFinalFixture.awayPenaltyScore} k.)`
              : `${hScore}:${aScore}`;
            const cupMail = MailService.generateCupFinalMail(
              cupFinalFixture.homeTeamId,
              cupFinalFixture.awayTeamId,
              penScore,
              userTeamId,
              cupWinnerIdLocal
            );
            sentMailIdsRef.current.add(cupFinalMailKey);
            setMessages(prev => [cupMail, ...prev]);
          }
        }
      }
    }

    // Automatyczne generowanie finału Pucharu po wyłonieniu finalistów
    // (zawsze w okolicach daty 9 kwietnia, ale sprawdzamy na bieżąco)
    if (!globalFixtures.some(f => f.id.includes('FINAŁ'))) {
      const finalists = clubs.filter(c => c.isInPolishCup);
      if (finalists.length === 2) {
        // Data finału: 2 maja danego roku
        const finalDate = new Date(dateToProcess.getFullYear(), 4, 2);
        if (finalDate > dateToProcess) {
          const finalFixture: Fixture = {
            id: 'CUP_Puchar_Polski:_FINAŁ_AUTO',
            leagueId: CompetitionType.POLISH_CUP,
            homeTeamId: finalists[0].id,
            awayTeamId: finalists[1].id,
            date: finalDate,
            status: MatchStatus.SCHEDULED,
            homeScore: null,
            awayScore: null
          };
          setGlobalFixtures(prev => [...prev, finalFixture]);
        }
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CALENDAR ENGINE: Jedyne źródło prawdy — co dzieje się dziś?
    // ─────────────────────────────────────────────────────────────────────────
    const primaryEvent = CalendarEngine.getPrimaryEventForDate(
      dateToProcess, seasonTemplate, allFixtures, userTeamId, clubs
    );

    // skipDayAdvance = true oznacza że data NIE zostanie przesunięta
    // (gracz musi jeszcze zagrać mecz lub potwierdzić akcję tego dnia)
    let skipDayAdvance = false;

    if (primaryEvent?.participation === 'player') {
      setTargetJumpTime(null);
      const slot = primaryEvent.slot;

      switch (slot.competition) {

        // ── LE: Losowanie Rundy 1 Preeliminacyjnej ──────────────────────────
        case CompetitionType.EL_R1Q_DRAW: {
          if (processedDrawIds.includes(slot.id)) break;
          const elTeamIds = ELDrawService.getEligibleTeams(RAW_EUROPA_LEAGUE_CLUBS, sessionSeed);
          const elPairs = ELDrawService.drawPairs(elTeamIds, clubs, dateToProcess, sessionSeed);
          setActiveCupDraw({ id: slot.id, label: slot.label, date: dateToProcess, pairs: elPairs });
          setProcessedDrawIds(prev => [...prev, slot.id]);
          navigateTo(ViewState.EL_DRAW);
          skipDayAdvance = true; break;
        }

        // ── LK: Losowanie Rundy 1 Preeliminacyjnej ──────────────────────────
        case CompetitionType.CONF_R1Q_DRAW: {
          if (processedDrawIds.includes(slot.id)) break;
          const confTeamIds = CONFDrawService.getEligibleTeams(RAW_CONFERENCE_LEAGUE_CLUBS, sessionSeed);
          const confPairs = CONFDrawService.drawPairs(confTeamIds, RAW_CONFERENCE_LEAGUE_CLUBS, clubs, dateToProcess, sessionSeed);
          setActiveCupDraw({ id: slot.id, label: slot.label, date: dateToProcess, pairs: confPairs });
          setProcessedDrawIds(prev => [...prev, slot.id]);
          navigateTo(ViewState.CONF_DRAW);
          skipDayAdvance = true; break;
        }

        // ── LK: Mecze Rundy 1 (gracz nie uczestniczy — auto-symulacja) ──────
        case CompetitionType.CONF_R1Q:
        case CompetitionType.CONF_R1Q_RETURN: {
          const alreadyPlayedCONF = allFixtures.some(f =>
            f.date.toDateString() === dateToProcess.toDateString() &&
            (f.leagueId === CompetitionType.CONF_R1Q || f.leagueId === CompetitionType.CONF_R1Q_RETURN) &&
            f.status === MatchStatus.FINISHED
          );
          if (!alreadyPlayedCONF) {
            processCLMatchDay();
          }
          break;
        }

        // ── LK: Losowanie Rundy 2 Preeliminacyjnej ──────────────────────────
        case CompetitionType.CONF_R2Q_DRAW: {
          if (processedDrawIds.includes(slot.id)) break;
          const confR2QPool = CONFDrawService.getR2QPool(RAW_CONFERENCE_LEAGUE_CLUBS, allFixtures, confR2QPolishTeamIds, sessionSeed);
          const confR2QPairs = CONFDrawService.drawR2QPairs(confR2QPool, RAW_CONFERENCE_LEAGUE_CLUBS, clubs, dateToProcess, sessionSeed);
          setActiveCupDraw({ id: slot.id, label: slot.label, date: dateToProcess, pairs: confR2QPairs });
          setProcessedDrawIds(prev => [...prev, slot.id]);
          navigateTo(ViewState.CONF_R2Q_DRAW);
          skipDayAdvance = true; break;
        }

        // ── LK: Mecze Rundy 2 (gracz nie uczestniczy — auto-symulacja) ──────
        case CompetitionType.CONF_R2Q:
        case CompetitionType.CONF_R2Q_RETURN: {
          const alreadyPlayedCONFR2Q = allFixtures.some(f =>
            f.date.toDateString() === dateToProcess.toDateString() &&
            (f.leagueId === CompetitionType.CONF_R2Q || f.leagueId === CompetitionType.CONF_R2Q_RETURN) &&
            f.status === MatchStatus.FINISHED
          );
          if (!alreadyPlayedCONFR2Q) {
            processCLMatchDay();
          }
          break;
        }

        // ── LK: Losowanie Fazy Grupowej ─────────────────────────────────────
        case CompetitionType.CONF_GROUP_DRAW: {
          if (processedDrawIds.includes(slot.id)) break;
          const confR2QWinners = CONFDrawService.getGroupStagePool(allFixtures);
          const confGroupsResult = CONFDrawService.drawGroupStage(confR2QWinners, RAW_CONFERENCE_LEAGUE_CLUBS, clubs, sessionSeed);
          setActiveConfGroupDraw({ id: slot.id, label: slot.label, date: dateToProcess, groups: confGroupsResult });
          setProcessedDrawIds(prev => [...prev, slot.id]);
          navigateTo(ViewState.CONF_GROUP_DRAW);
          skipDayAdvance = true; break;
        }

        // ── LK: Faza Grupowa (auto-symulacja) ──────────────────────────────
        case CompetitionType.CONF_GROUP_STAGE: {
          const alreadyPlayedCONFGS = allFixtures.some(f =>
            f.date.toDateString() === dateToProcess.toDateString() &&
            f.leagueId === CompetitionType.CONF_GROUP_STAGE &&
            f.status === MatchStatus.FINISHED
          );
          if (!alreadyPlayedCONFGS) { processCLMatchDay(); }
          break;
        }

        // ── LK: Losowanie 1/8 Finału ────────────────────────────────────────
        case CompetitionType.CONF_R16_DRAW: {
          if (processedDrawIds.includes(slot.id)) break;
          if (!confGroups) break; // faza grupowa jeszcze nie zakończona
          setProcessedDrawIds(prev => [...prev, slot.id]);
          navigateTo(ViewState.CONF_R16_DRAW);
          skipDayAdvance = true; break;
        }

        // ── LK: 1/8 Finału (mecze — auto-symulacja) ─────────────────────────
        case CompetitionType.CONF_R16:
        case CompetitionType.CONF_R16_RETURN: {
          const alreadyPlayedCONFR16 = allFixtures.some(f =>
            f.date.toDateString() === dateToProcess.toDateString() &&
            (f.leagueId === CompetitionType.CONF_R16 || f.leagueId === CompetitionType.CONF_R16_RETURN) &&
            f.status === MatchStatus.FINISHED
          );
          if (!alreadyPlayedCONFR16) {
            processCLMatchDay();
          }
          break;
        }

        // ── LK: Losowanie 1/4 Finału ────────────────────────────────────────
        case CompetitionType.CONF_QF_DRAW: {
          if (processedDrawIds.includes(slot.id)) break;
          setProcessedDrawIds(prev => [...prev, slot.id]);
          navigateTo(ViewState.CONF_QF_DRAW);
          skipDayAdvance = true; break;
        }

        // ── LK: 1/4 Finału (mecze — auto-symulacja) ─────────────────────────
        case CompetitionType.CONF_QF:
        case CompetitionType.CONF_QF_RETURN: {
          const alreadyPlayedCONFQF = allFixtures.some(f =>
            f.date.toDateString() === dateToProcess.toDateString() &&
            (f.leagueId === CompetitionType.CONF_QF || f.leagueId === CompetitionType.CONF_QF_RETURN) &&
            f.status === MatchStatus.FINISHED
          );
          if (!alreadyPlayedCONFQF) {
            processCLMatchDay();
          }
          break;
        }

        // ── LK: Losowanie 1/2 Finału ─────────────────────────────────────────
        case CompetitionType.CONF_SF_DRAW: {
          if (processedDrawIds.includes(slot.id)) break;
          setProcessedDrawIds(prev => [...prev, slot.id]);
          navigateTo(ViewState.CONF_SF_DRAW);
          skipDayAdvance = true; break;
        }

        // ── LK: 1/2 Finału (mecze — auto-symulacja) ──────────────────────────
        case CompetitionType.CONF_SF:
        case CompetitionType.CONF_SF_RETURN: {
          const alreadyPlayedCONFSF = allFixtures.some(f =>
            f.date.toDateString() === dateToProcess.toDateString() &&
            (f.leagueId === CompetitionType.CONF_SF || f.leagueId === CompetitionType.CONF_SF_RETURN) &&
            f.status === MatchStatus.FINISHED
          );
          if (!alreadyPlayedCONFSF) {
            processCLMatchDay();
          }
          break;
        }

        // ── LK: Ogłoszenie Finalistów ─────────────────────────────────────
        case CompetitionType.CONF_FINAL_DRAW: {
          if (processedDrawIds.includes(slot.id)) break;
          const confFinalAlreadyExists = allFixtures.some(f => f.leagueId === CompetitionType.CONF_FINAL);
          if (!confFinalAlreadyExists) {
            const sfWinnersCONF = CONFDrawService.getSFWinners(allFixtures);
            const sfPoolCONF = CONFDrawService.getSFParticipants(allFixtures);
            const safeSFWinnersCONF = CONFDrawService.guaranteeWinners(sfWinnersCONF, sfPoolCONF, 2);
            if (safeSFWinnersCONF.length === 2) {
              const finalDate = new Date(currentDate.getFullYear(), 4, 27);
              const finalFixtureCONF = CONFDrawService.generateFinalFixture(
                safeSFWinnersCONF[0], safeSFWinnersCONF[1], finalDate, finalDate.getFullYear()
              );
              setGlobalFixtures(prev => [...prev, finalFixtureCONF]);
            }
          }
          setProcessedDrawIds(prev => [...prev, slot.id]);
          navigateTo(ViewState.CONF_FINAL_DRAW);
          skipDayAdvance = true; break;
        }

        // ── LK: FINAŁ ─────────────────────────────────────────────────────
        case CompetitionType.CONF_FINAL: {
          const confFinalFixture = allFixtures.find(f => f.leagueId === CompetitionType.CONF_FINAL);
          if (!confFinalFixture) break;
          const alreadyPlayedCONFFinal = confFinalFixture.status === MatchStatus.FINISHED;
          if (!alreadyPlayedCONFFinal) {
            processCLMatchDay();
          }
          if (alreadyPlayedCONFFinal) {
            const mailKey = `CONF_FINAL_RESULT_${confFinalFixture.date.getFullYear()}`;
            if (!sentMailIdsRef.current.has(mailKey)) {
              sentMailIdsRef.current.add(mailKey);
              const h = confFinalFixture.homeScore ?? 0;
              const a = confFinalFixture.awayScore ?? 0;
              let winnerId: string;
              if (h > a) winnerId = confFinalFixture.homeTeamId;
              else if (a > h) winnerId = confFinalFixture.awayTeamId;
              else winnerId = (confFinalFixture.homePenaltyScore ?? 0) >= (confFinalFixture.awayPenaltyScore ?? 0)
                ? confFinalFixture.homeTeamId : confFinalFixture.awayTeamId;
              const winner = clubs.find(c => c.id === winnerId);
              const mail: MailMessage = {
                id: mailKey,
                sender: 'UEFA',
                role: 'Biuro Rozgrywek UEFA',
                subject: `Zdobywca Ligi Konferencji ${confFinalFixture.date.getFullYear()}`,
                body: `Finał Ligi Konferencji zakończony. Zdobywcą Ligi Konferencji ${confFinalFixture.date.getFullYear()} został ${winner?.name ?? winnerId}.`,
                date: new Date(currentDate),
                isRead: false,
                type: MailType.SYSTEM,
                priority: 100,
              };
              setMessages(prev => [mail, ...prev]);
            }
          }
          break;
        }

        // ── LE: Losowanie Rundy 2 Preeliminacyjnej ──────────────────────────
        case CompetitionType.EL_R2Q_DRAW: {
          if (processedDrawIds.includes(slot.id)) break;
          const elR2QPool = ELDrawService.getR2QPool(RAW_EUROPA_LEAGUE_CLUBS, allFixtures, currentPolishCupWinnerId);
          const elR2QPairs = ELDrawService.drawR2QPairs(elR2QPool, clubs, dateToProcess, sessionSeed);
          setActiveCupDraw({ id: slot.id, label: slot.label, date: dateToProcess, pairs: elR2QPairs });
          setProcessedDrawIds(prev => [...prev, slot.id]);
          navigateTo(ViewState.EL_R2Q_DRAW);
          skipDayAdvance = true; break;
        }

        // ── LE: Losowanie Fazy Grupowej ─────────────────────────────────────
        case CompetitionType.EL_GROUP_DRAW: {
          if (processedDrawIds.includes(slot.id)) break;
          const elR2QWinners = ELDrawService.getGroupStagePool(allFixtures);
          const elGroups = ELDrawService.drawGroupStage(elR2QWinners, RAW_EUROPA_LEAGUE_CLUBS, clubs, sessionSeed);
          setActiveELGroupDraw({ id: slot.id, label: slot.label, date: dateToProcess, groups: elGroups });
          setProcessedDrawIds(prev => [...prev, slot.id]);
          navigateTo(ViewState.EL_GROUP_DRAW);
          skipDayAdvance = true; break;
        }

        // ── LE: Losowanie 1/8 Finału ────────────────────────────────────────
        case CompetitionType.EL_R16_DRAW: {
          if (processedDrawIds.includes(slot.id)) break;
          if (!elGroups) break; // faza grupowa jeszcze nie zakończona
          setProcessedDrawIds(prev => [...prev, slot.id]);
          navigateTo(ViewState.EL_R16_DRAW);
          skipDayAdvance = true; break;
        }

        // ── LE: Losowanie 1/4 Finału ────────────────────────────────────────
        case CompetitionType.EL_QF_DRAW: {
          if (processedDrawIds.includes(slot.id)) break;
          setProcessedDrawIds(prev => [...prev, slot.id]);
          navigateTo(ViewState.EL_QF_DRAW);
          skipDayAdvance = true; break;
        }

        // ── LE: 1/4 Finału (mecze) ──────────────────────────────────────────
        case CompetitionType.EL_QF:
        case CompetitionType.EL_QF_RETURN: {
          const alreadyPlayedELQF = allFixtures.some(f =>
            f.date.toDateString() === dateToProcess.toDateString() &&
            (f.leagueId === CompetitionType.EL_QF || f.leagueId === CompetitionType.EL_QF_RETURN) &&
            f.status === MatchStatus.FINISHED
          );
          if (!alreadyPlayedELQF) {
            if (isAutoJumping) { setTargetJumpTime(null); navigateTo(ViewState.DASHBOARD); skipDayAdvance = true; break; }
            navigateTo(ViewState.PRE_MATCH_CL_STUDIO);
            skipDayAdvance = true; break;
          }
          break;
        }

        // ── LE: Losowanie 1/2 Finału ────────────────────────────────────────
        case CompetitionType.EL_SF_DRAW: {
          if (processedDrawIds.includes(slot.id)) break;
          setProcessedDrawIds(prev => [...prev, slot.id]);
          navigateTo(ViewState.EL_SF_DRAW);
          skipDayAdvance = true; break;
        }

        // ── LE: 1/2 Finału (mecze) ──────────────────────────────────────────
        case CompetitionType.EL_SF:
        case CompetitionType.EL_SF_RETURN: {
          const alreadyPlayedELSF = allFixtures.some(f =>
            f.date.toDateString() === dateToProcess.toDateString() &&
            (f.leagueId === CompetitionType.EL_SF || f.leagueId === CompetitionType.EL_SF_RETURN) &&
            f.status === MatchStatus.FINISHED
          );
          if (!alreadyPlayedELSF) {
            if (isAutoJumping) { setTargetJumpTime(null); navigateTo(ViewState.DASHBOARD); skipDayAdvance = true; break; }
            navigateTo(ViewState.PRE_MATCH_CL_STUDIO);
            skipDayAdvance = true; break;
          }
          if (slot.competition === CompetitionType.EL_SF_RETURN) {
            const allSFReturnDone = allFixtures
              .filter(f => f.leagueId === CompetitionType.EL_SF_RETURN)
              .every(f => f.status === MatchStatus.FINISHED);
            if (allSFReturnDone) {
              const finalAlreadyExists = allFixtures.some(f => f.leagueId === CompetitionType.EL_FINAL);
              if (!finalAlreadyExists) {
                const sfWinnersEL = ELDrawService.getSFWinners(allFixtures);
                const sfPoolEL = ELDrawService.getSFParticipants(allFixtures);
                const safeSFWinnersEL = ELDrawService.guaranteeWinners(sfWinnersEL, sfPoolEL, 2);
                if (safeSFWinnersEL.length === 2) {
                  const finalDateEL = new Date(dateToProcess.getFullYear(), 4, 20);
                  const finalFixtureEL = ELDrawService.generateFinalFixture(
                    safeSFWinnersEL[0], safeSFWinnersEL[1], finalDateEL, finalDateEL.getFullYear()
                  );
                  setGlobalFixtures(prev => [...prev, finalFixtureEL]);
                }
              }
            }
          }
          break;
        }

        // ── LE: Ogłoszenie Finalistów ────────────────────────────────────────
        case CompetitionType.EL_FINAL_DRAW: {
          if (processedDrawIds.includes(slot.id)) break;
          const elFinalAlreadyExists = allFixtures.some(f => f.leagueId === CompetitionType.EL_FINAL);
          if (!elFinalAlreadyExists) {
            const sfWinnersEL2 = ELDrawService.getSFWinners(allFixtures);
            const sfPoolEL2 = ELDrawService.getSFParticipants(allFixtures);
            const safeSFWinnersEL2 = ELDrawService.guaranteeWinners(sfWinnersEL2, sfPoolEL2, 2);
            if (safeSFWinnersEL2.length === 2) {
              const finalDateEL2 = new Date(dateToProcess.getFullYear(), 4, 20);
              const finalFixtureEL2 = ELDrawService.generateFinalFixture(
                safeSFWinnersEL2[0], safeSFWinnersEL2[1], finalDateEL2, finalDateEL2.getFullYear()
              );
              setGlobalFixtures(prev => [...prev, finalFixtureEL2]);
            }
          }
          setProcessedDrawIds(prev => [...prev, slot.id]);
          navigateTo(ViewState.EL_FINAL_DRAW);
          skipDayAdvance = true; break;
        }

        // ── LE: FINAŁ ────────────────────────────────────────────────────────
        case CompetitionType.EL_FINAL: {
          const elFinalFixture = allFixtures.find(f => f.leagueId === CompetitionType.EL_FINAL);
          if (!elFinalFixture) break;
          const alreadyPlayedELFinal = elFinalFixture.status === MatchStatus.FINISHED;
          if (!alreadyPlayedELFinal) {
            if (isAutoJumping) { setTargetJumpTime(null); navigateTo(ViewState.DASHBOARD); skipDayAdvance = true; break; }
            navigateTo(ViewState.PRE_MATCH_CL_STUDIO);
            skipDayAdvance = true; break;
          }
          if (userTeamId) {
            const mailKey = `EL_FINAL_RESULT_${elFinalFixture.date.getFullYear()}`;
            if (!sentMailIdsRef.current.has(mailKey)) {
              sentMailIdsRef.current.add(mailKey);
              const h = elFinalFixture.homeScore ?? 0;
              const a = elFinalFixture.awayScore ?? 0;
              let winnerId: string;
              if (h > a) winnerId = elFinalFixture.homeTeamId;
              else if (a > h) winnerId = elFinalFixture.awayTeamId;
              else winnerId = (elFinalFixture.homePenaltyScore ?? 0) >= (elFinalFixture.awayPenaltyScore ?? 0)
                ? elFinalFixture.homeTeamId : elFinalFixture.awayTeamId;
              const winner = clubs.find(c => c.id === winnerId);
              const isUserWinner = winnerId === userTeamId;
              const mail: MailMessage = {
                id: mailKey,
                sender: 'UEFA',
                role: 'Biuro Rozgrywek UEFA',
                subject: `Zdobywca Ligi Europy ${elFinalFixture.date.getFullYear()}`,
                body: isUserWinner
                  ? `GRATULACJE! Twój klub zdobył Ligę Europy ${elFinalFixture.date.getFullYear()}!`
                  : `Finał Ligi Europy zakończony. Zdobywcą Ligi Europy ${elFinalFixture.date.getFullYear()} został ${winner?.name ?? winnerId}.`,
                date: new Date(currentDate),
                isRead: false,
                type: MailType.SYSTEM,
                priority: 100,
              };
              setMessages(prev => [mail, ...prev]);
            }
          }
          break;
        }

        // ── LM: Losowanie Rundy 1 Preeliminacyjnej ──────────────────────────
        case CompetitionType.CHAMPIONS_LEAGUE_DRAW: {
          if (processedDrawIds.includes(slot.id)) break;
          const eligibleIds = CLDrawService.getEligibleTeams(RAW_CHAMPIONS_LEAGUE_CLUBS);
          const pairs = CLDrawService.drawPairs(eligibleIds, clubs, dateToProcess, sessionSeed);
          setActiveCupDraw({ id: slot.id, label: slot.label, date: dateToProcess, pairs });
          setProcessedDrawIds(prev => [...prev, slot.id]);
          navigateTo(ViewState.CL_DRAW);
          skipDayAdvance = true; break;
        }

        // ── LM: Losowanie Rundy 2 Preeliminacyjnej ──────────────────────────
        case CompetitionType.CL_R2Q_DRAW: {
          if (processedDrawIds.includes(slot.id)) break;
          const r2qPool = CLDrawService.getR2QPool(
            RAW_CHAMPIONS_LEAGUE_CLUBS, allFixtures, currentPolishChampionId, userTeamId,
          );
          const r2qPairs = CLDrawService.drawR2QPairs(
            r2qPool, currentPolishChampionId, RAW_CHAMPIONS_LEAGUE_CLUBS, clubs, dateToProcess, sessionSeed,
          );
          setActiveCupDraw({ id: slot.id, label: slot.label, date: dateToProcess, pairs: r2qPairs });
          setProcessedDrawIds(prev => [...prev, slot.id]);
          navigateTo(ViewState.CL_DRAW);
          skipDayAdvance = true; break;
        }

        // ── LM: Losowanie Fazy Grupowej ─────────────────────────────────────
        case CompetitionType.CL_GROUP_DRAW: {
          if (processedDrawIds.includes(slot.id)) break;
          const r2qWinners = CLDrawService.getGroupStagePool(allFixtures, RAW_CHAMPIONS_LEAGUE_CLUBS);
          const groups = CLDrawService.drawGroupStage(
            r2qWinners, RAW_CHAMPIONS_LEAGUE_CLUBS, clubs, sessionSeed,
          );
          setActiveGroupDraw({ id: slot.id, label: slot.label, date: dateToProcess, groups });
          setProcessedDrawIds(prev => [...prev, slot.id]);
          navigateTo(ViewState.CL_GROUP_DRAW);
          skipDayAdvance = true; break;
        }

        // ── LM: Faza Grupowa (mecz gracza) ──────────────────────────────────
        case CompetitionType.CL_GROUP_STAGE: {
          const alreadyPlayed = allFixtures.some(f =>
            f.date.toDateString() === dateToProcess.toDateString() &&
            f.leagueId === CompetitionType.CL_GROUP_STAGE &&
            f.status === MatchStatus.FINISHED
          );
          if (!alreadyPlayed) {
            if (isAutoJumping) { setTargetJumpTime(null); navigateTo(ViewState.DASHBOARD); skipDayAdvance = true; break; }
            navigateTo(ViewState.PRE_MATCH_CL_STUDIO);
            skipDayAdvance = true; break;
          }

          break;
        }

 // ── LM: Losowanie 1/8 Finału ────────────────────────────────────────
        case CompetitionType.CL_R16_DRAW: {
          if (processedDrawIds.includes(slot.id)) break;
          if (!clGroups) break; // faza grupowa jeszcze nie zakończona
          setProcessedDrawIds(prev => [...prev, slot.id]);
          navigateTo(ViewState.CL_R16_DRAW);
          skipDayAdvance = true; break;
        }

        // ── LM: 1/8 Finału (mecze) ──────────────────────────────────────────
        case CompetitionType.CL_R16:
        case CompetitionType.CL_R16_RETURN: {
          const alreadyPlayed = allFixtures.some(f =>
            f.date.toDateString() === dateToProcess.toDateString() &&
            (f.leagueId === CompetitionType.CL_R16 || f.leagueId === CompetitionType.CL_R16_RETURN) &&
            f.status === MatchStatus.FINISHED
          );
          if (!alreadyPlayed) {
            if (isAutoJumping) { setTargetJumpTime(null); navigateTo(ViewState.DASHBOARD); skipDayAdvance = true; break; }
            navigateTo(ViewState.PRE_MATCH_CL_STUDIO);
            skipDayAdvance = true; break;
          }
            break;
        }

        // ── LM: Losowanie 1/4 Finału ────────────────────────────────────────
        case CompetitionType.CL_QF_DRAW: {
          if (processedDrawIds.includes(slot.id)) break;
          setProcessedDrawIds(prev => [...prev, slot.id]);
          navigateTo(ViewState.CL_QF_DRAW);
          skipDayAdvance = true; break;
        }

        // ── LM: 1/4 Finału (mecze) ──────────────────────────────────────────
        case CompetitionType.CL_QF:
        case CompetitionType.CL_QF_RETURN: {
          const alreadyPlayed = allFixtures.some(f =>
            f.date.toDateString() === dateToProcess.toDateString() &&
            (f.leagueId === CompetitionType.CL_QF || f.leagueId === CompetitionType.CL_QF_RETURN) &&
            f.status === MatchStatus.FINISHED
          );
          if (!alreadyPlayed) {
            if (isAutoJumping) { setTargetJumpTime(null); navigateTo(ViewState.DASHBOARD); skipDayAdvance = true; break; }
            navigateTo(ViewState.PRE_MATCH_CL_STUDIO);
            skipDayAdvance = true; break;
          }
                   break;
        }

        // ── LM: Losowanie 1/2 Finału ────────────────────────────────────────
        case CompetitionType.CL_SF_DRAW: {
          if (processedDrawIds.includes(slot.id)) break;
          setProcessedDrawIds(prev => [...prev, slot.id]);
          navigateTo(ViewState.CL_SF_DRAW);
          skipDayAdvance = true; break;
        }

        // ── LM: Ogłoszenie Finalistów ────────────────────────────────────────
        case CompetitionType.CL_FINAL_DRAW: {
          if (processedDrawIds.includes(slot.id)) break;
          // Wygeneruj fixture finałowy jeśli jeszcze nie istnieje
          const finalAlreadyExists = allFixtures.some(f => f.leagueId === CompetitionType.CL_FINAL);
          if (!finalAlreadyExists) {
            const sfWinners = CLDrawService.getSFWinners(allFixtures);
            const sfPool2 = CLDrawService.getSFParticipants(allFixtures);
            const safeSFWinners2 = CLDrawService.guaranteeWinners(sfWinners, sfPool2, 2);
            if (safeSFWinners2.length === 2) {
              const finalDate = new Date(dateToProcess.getFullYear(), 4, 30);
              const finalFixture = CLDrawService.generateFinalFixture(
                safeSFWinners2[0], safeSFWinners2[1], finalDate, finalDate.getFullYear()
              );
              setGlobalFixtures(prev => [...prev, finalFixture]);
            }
          }
          setProcessedDrawIds(prev => [...prev, slot.id]);
          navigateTo(ViewState.CL_FINAL_DRAW);
          skipDayAdvance = true; break;
        }

        // ── LM: 1/2 Finału (mecze) ──────────────────────────────────────────
              // ── LM: 1/2 Finału (mecze) ──────────────────────────────────────────
        case CompetitionType.CL_SF:
        case CompetitionType.CL_SF_RETURN: {
          const alreadyPlayed = allFixtures.some(f =>
            f.date.toDateString() === dateToProcess.toDateString() &&
            (f.leagueId === CompetitionType.CL_SF || f.leagueId === CompetitionType.CL_SF_RETURN) &&
            f.status === MatchStatus.FINISHED
          );
          if (!alreadyPlayed) {
            if (isAutoJumping) { setTargetJumpTime(null); navigateTo(ViewState.DASHBOARD); skipDayAdvance = true; break; }
            navigateTo(ViewState.PRE_MATCH_CL_STUDIO);
            skipDayAdvance = true; break;
          }
          // Po rewanżu 1/2 finału: wygeneruj finał i pokaż parę finałową
          if (slot.competition === CompetitionType.CL_SF_RETURN) {
            const allSFReturnDone = allFixtures
              .filter(f => f.leagueId === CompetitionType.CL_SF_RETURN)
              .every(f => f.status === MatchStatus.FINISHED);
            if (allSFReturnDone) {
              const finalAlreadyExists = allFixtures.some(f => f.leagueId === CompetitionType.CL_FINAL);
              if (!finalAlreadyExists) {
                const sfWinners = CLDrawService.getSFWinners(allFixtures);
                const sfPool = CLDrawService.getSFParticipants(allFixtures);
                const safeSFWinners = CLDrawService.guaranteeWinners(sfWinners, sfPool, 2);
                if (safeSFWinners.length === 2) {
                  const finalDate = new Date(dateToProcess.getFullYear(), 4, 30);
                  const finalFixture = CLDrawService.generateFinalFixture(
                    safeSFWinners[0], safeSFWinners[1], finalDate, finalDate.getFullYear()
                  );
                  setGlobalFixtures(prev => [...prev, finalFixture]);
                }
              }
              // Finaliści zostaną ogłoszeni 18 kwietnia przez dedykowany slot CL_FINAL_DRAW
            }
          }
          break;
        }

        // ── LM: FINAŁ ────────────────────────────────────────────────────────
        case CompetitionType.CL_FINAL: {
          const finalFixture = allFixtures.find(f => f.leagueId === CompetitionType.CL_FINAL);
          
       
          const alreadyPlayed = finalFixture.status === MatchStatus.FINISHED;
          if (!alreadyPlayed) {
            if (isAutoJumping) { setTargetJumpTime(null); navigateTo(ViewState.DASHBOARD); skipDayAdvance = true; break; }
            navigateTo(ViewState.PRE_MATCH_CL_FINAL);
            skipDayAdvance = true; break;
          }
          // Finał rozegrany — wyślij mail o zwycięzcy (raz)
          if (userTeamId) {
            const mailKey = `CL_FINAL_RESULT_${finalFixture.date.getFullYear()}`;
            if (!sentMailIdsRef.current.has(mailKey)) {
              sentMailIdsRef.current.add(mailKey);
              const h = finalFixture.homeScore ?? 0;
              const a = finalFixture.awayScore ?? 0;
              const hasPens = finalFixture.homePenaltyScore != null;
              let winnerId: string;
              if (h > a) winnerId = finalFixture.homeTeamId;
              else if (a > h) winnerId = finalFixture.awayTeamId;
              else winnerId = (finalFixture.homePenaltyScore ?? 0) >= (finalFixture.awayPenaltyScore ?? 0)
                ? finalFixture.homeTeamId : finalFixture.awayTeamId;
              const winner = clubs.find(c => c.id === winnerId);
              const isUserWinner = winnerId === userTeamId;
              const mail: MailMessage = {
                id: mailKey,
                sender: 'UEFA',
                role: 'Biuro Rozgrywek UEFA',
                subject: `Mistrz Europy ${finalFixture.date.getFullYear()}`,
                body: isUserWinner
                  ? `GRATULACJE! Twój klub zdobył Puchar Europy! Jesteście Mistrzem Europy ${finalFixture.date.getFullYear()}!`
                  : `Finał Ligi Mistrzów zakończony. Mistrzem Europy ${finalFixture.date.getFullYear()} został ${winner?.name ?? winnerId}.`,
                date: new Date(currentDate),
                isRead: false,
                type: MailType.SYSTEM,
                priority: 100,
              };
              setMessages(prev => [mail, ...prev]);
            }
          }
          break;
        }






        // ── LM: Mecze preeliminacyjne (gracz uczestniczy) ───────────────────
        case CompetitionType.CL_R1Q:
        case CompetitionType.CL_R1Q_RETURN:
        case CompetitionType.CL_R2Q:
        case CompetitionType.CL_R2Q_RETURN: {
          if (isAutoJumping) { setTargetJumpTime(null); navigateTo(ViewState.DASHBOARD); skipDayAdvance = true; break; }
          navigateTo(ViewState.PRE_MATCH_CL_STUDIO);
          skipDayAdvance = true; break;
        }

        // ── Puchar Polski: Losowanie ─────────────────────────────────────────
        case CompetitionType.POLISH_CUP: {
          if (slot.label.toUpperCase().includes('LOSOWANIE')) {
            if (processedDrawIds.includes(slot.id)) break;
            let participants: string[] = [];
            if (slot.label.includes('1/64')) {
              participants = PolishCupDrawService.getInitialParticipants(clubs);
            } else {
              participants = clubs.filter(c => c.isInPolishCup).map(c => c.id);
              if (participants.length === 0) participants = cupParticipants;
            }
            const cupDrawMapping: Record<string, string> = {
              'LOSOWANIE PUCHARU POLSKI 1/64': 'Puchar Polski: 1/64',
              'LOSOWANIE PUCHARU POLSKI 1/32': 'Puchar Polski: 1/32',
              'LOSOWANIE PUCHARU POLSKI 1/16': 'Puchar Polski: 1/16',
              'LOSOWANIE PUCHARU POLSKI 1/8':  'Puchar Polski: 1/8',
              'LOSOWANIE PUCHARU POLSKI 1/4':  'Puchar Polski: 1/4',
              'LOSOWANIE PUCHARU POLSKI 1/2':  'Puchar Polski: 1/2',
            };
            const matchLabel = cupDrawMapping[slot.label] || slot.label.replace('LOSOWANIE ', '');
            const matchSlot = seasonTemplate?.slots.find(s => s.label === matchLabel);
            const cupPairs = PolishCupDrawService.drawPairs(
              participants, clubs, matchSlot?.start || dateToProcess, matchLabel, sessionSeed,
            );
            setActiveCupDraw({ id: slot.id, label: slot.label, date: dateToProcess, pairs: cupPairs });
            setCupParticipants(participants);
            navigateTo(ViewState.CUP_DRAW);
            skipDayAdvance = true; break;
          }
          // Ogłoszenie finalistów PP — pokaż ekran finalistów (raz)
          if (slot.label.toUpperCase().includes('OGŁOSZENIE') || slot.label.toUpperCase().includes('OGLOSZENIE')) {
            if (processedDrawIds.includes(slot.id)) break;
            setProcessedDrawIds(prev => [...prev, slot.id]);
            navigateTo(ViewState.POLISH_CUP_FINALISTS);
            skipDayAdvance = true; break;
          }
          // Dzień meczowy PP — gracz uczestniczy
          // Jeśli to automatyczny skok: zatrzymaj i wróć na Dashboard (gracz edytuje skład)
          if (isAutoJumping) { setTargetJumpTime(null); navigateTo(ViewState.DASHBOARD); skipDayAdvance = true; break; }
          navigateTo(ViewState.PRE_MATCH_CUP_STUDIO);
          skipDayAdvance = true; break;
        }

        // ── Superpuchar (gracz uczestniczy) ────────────────────────────────
        case CompetitionType.SUPER_CUP: {
          if (isAutoJumping) { setTargetJumpTime(null); navigateTo(ViewState.DASHBOARD); skipDayAdvance = true; break; }
          navigateTo(ViewState.PRE_MATCH_CUP_STUDIO);
          skipDayAdvance = true; break;
        }

        // ── Zakończenie sezonu — pauza, gracz czyta emaile i klika "Nowy sezon" ──
              case CompetitionType.OFF_SEASON: {
          setTargetJumpTime(null);

          // ── Podsumowanie sezonu (wysyłane raz, 30 czerwca) ─────────────────
          if (userTeamId) {
            const currentYear = dateToProcess.getFullYear();
            const seasonSummaryKey = `SEASON_SUMMARY_${currentYear}`;
            if (!sentMailIdsRef.current.has(seasonSummaryKey)) {
              const standingsL1 = [...clubs]
                .filter(c => c.leagueId === 'L_PL_1')
                .sort((a, b) => b.stats.points - a.stats.points || b.stats.goalDifference - a.stats.goalDifference || b.stats.goalsFor - a.stats.goalsFor);
              const standingsL2 = [...clubs].filter(c => c.leagueId === 'L_PL_2')
                .sort((a, b) => b.stats.points - a.stats.points || b.stats.goalDifference - a.stats.goalDifference);
              const standingsL3 = [...clubs].filter(c => c.leagueId === 'L_PL_3')
                .sort((a, b) => b.stats.points - a.stats.points || b.stats.goalDifference - a.stats.goalDifference);

              const getAwardsLocal = (leagueId: string, leagueName: string) => {
                const rows = LeagueStatsService.getPlayersForLeague(leagueId, clubs, players);
                const topScorer = LeagueStatsService.getTopScorers(rows, 1)[0]?.player;
                const topAssistant = LeagueStatsService.getTopAssists(rows, 1)[0]?.player;
                return {
                  leagueName,
                  topScorer: { name: topScorer ? `${topScorer.firstName} ${topScorer.lastName}` : 'Brak', goals: topScorer?.stats.goals || 0 },
                  topAssistant: { name: topAssistant ? `${topAssistant.firstName} ${topAssistant.lastName}` : 'Brak', assists: topAssistant?.stats.assists || 0 }
                };
              };

              const summaryDataLocal: SeasonSummaryData = {
                year: currentYear - 1,
                championName: standingsL1[0]?.name || 'Nieznany',
                promotions: [
                  { from: '1. Liga', to: 'Ekstraklasy', teams: standingsL2.slice(0, 3).map(t => t.name) },
                  { from: '2. Liga', to: '1. Ligi', teams: standingsL3.slice(0, 3).map(t => t.name) },
                  { from: 'Regionalna', to: '2. Ligi', teams: [] }
                ],
                relegations: [
                  { from: 'Ekstraklasy', to: '1. Ligi', teams: standingsL1.slice(15, 18).map(t => t.name) },
                  { from: '1. Ligi', to: '2. Ligi', teams: standingsL2.slice(15, 18).map(t => t.name) },
                  { from: '2. Ligi', to: 'Regionalnej', teams: standingsL3.slice(14, 18).map(t => t.name) }
                ],
                leagueAwards: [
                  getAwardsLocal('L_PL_1', 'Ekstraklasa'),
                  getAwardsLocal('L_PL_2', '1. Liga'),
                  getAwardsLocal('L_PL_3', '2. Liga')
                ]
              };

              const summaryMail = MailService.generateSeasonSummaryMail(summaryDataLocal);
              sentMailIdsRef.current.add(seasonSummaryKey);
              setMessages(prev => [summaryMail, ...prev]);
            }
          }

          navigateTo(ViewState.DASHBOARD);
          return; // Data NIE zostaje przesunięta — gracz musi potwierdzić
        }

        default:
          break;
      }
    }

    // ── Puchar Polski / Superpuchar / LM / LE: background — zatrzymaj auto-skok ─────
    // Gracz musi ręcznie kliknąć przycisk na Dashboardzie (wyniki).
    if (isAutoJumping &&
        primaryEvent?.participation === 'background' &&
        (primaryEvent.slot.competition === CompetitionType.POLISH_CUP ||
         primaryEvent.slot.competition === CompetitionType.SUPER_CUP ||
         primaryEvent.slot.competition === CompetitionType.CL_R1Q ||
         primaryEvent.slot.competition === CompetitionType.CL_R1Q_RETURN ||
         primaryEvent.slot.competition === CompetitionType.CL_R2Q ||
         primaryEvent.slot.competition === CompetitionType.CL_R2Q_RETURN ||
         primaryEvent.slot.competition === CompetitionType.CL_GROUP_STAGE ||
         primaryEvent.slot.competition === CompetitionType.CL_R16 ||
         primaryEvent.slot.competition === CompetitionType.CL_R16_RETURN ||
         primaryEvent.slot.competition === CompetitionType.CL_QF ||
         primaryEvent.slot.competition === CompetitionType.CL_QF_RETURN ||
         primaryEvent.slot.competition === CompetitionType.CL_SF ||
         primaryEvent.slot.competition === CompetitionType.CL_SF_RETURN ||
         primaryEvent.slot.competition === CompetitionType.EL_R1Q ||
         primaryEvent.slot.competition === CompetitionType.EL_R1Q_RETURN ||
         primaryEvent.slot.competition === CompetitionType.EL_R2Q ||
         primaryEvent.slot.competition === CompetitionType.EL_R2Q_RETURN ||
         primaryEvent.slot.competition === CompetitionType.EL_GROUP_STAGE ||
         primaryEvent.slot.competition === CompetitionType.CONF_GROUP_STAGE ||
         primaryEvent.slot.competition === CompetitionType.EL_R16 ||
         primaryEvent.slot.competition === CompetitionType.EL_R16_RETURN ||
         primaryEvent.slot.competition === CompetitionType.EL_QF ||
         primaryEvent.slot.competition === CompetitionType.EL_QF_RETURN ||
         primaryEvent.slot.competition === CompetitionType.EL_SF ||
         primaryEvent.slot.competition === CompetitionType.EL_SF_RETURN ||
         primaryEvent.slot.competition === CompetitionType.EL_FINAL ||
         primaryEvent.slot.competition === CompetitionType.CONF_R16 ||
         primaryEvent.slot.competition === CompetitionType.CONF_R16_RETURN ||
         primaryEvent.slot.competition === CompetitionType.CONF_QF ||
         primaryEvent.slot.competition === CompetitionType.CONF_QF_RETURN ||
         primaryEvent.slot.competition === CompetitionType.CONF_SF ||
         primaryEvent.slot.competition === CompetitionType.CONF_SF_RETURN ||
         primaryEvent.slot.competition === CompetitionType.CONF_FINAL)) {
      setTargetJumpTime(null);
      return;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 1. GUARD + SYMULACJA + FINANSE — wykonywane ZAWSZE, niezależnie od eventu dnia.
    //    Dzięki temu pensje, squad review i inne zadania dnia nie są pomijane
    //    gdy tego samego dnia jest losowanie (LE/LM/PP) lub mecz.
    // ─────────────────────────────────────────────────────────────────────────
    const dateKey = dateToProcess.toDateString();
    if (lastProcessedLeagueDateRef.current === dateKey) {
      DebugLoggerService.log('GUARD', `ZABLOKOWANO advanceDay dla: ${dateKey} (stale closure)`);
      return;
    }
    DebugLoggerService.log('GUARD', `advanceDay PRZECHODZI dla: ${dateKey}`);
    lastProcessedLeagueDateRef.current = dateKey;

    const simulation = BackgroundMatchProcessor.processLeagueEvent(dateToProcess, userTeamId, allFixtures, clubs, players, lineups, seasonNumber, coaches, sessionSeed);
    
    // 2. Obliczanie regeneracji kondycji i urazów
    const diffTime = Math.abs(dateToProcess.getTime() - lastRecoveryDate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const recoveryDelta = diffDays > 0 ? diffDays : 1;
    const recoveredPlayers = RecoveryService.applyDailyRecovery(simulation.updatedPlayers, dateToProcess, activeIntensity, recoveryDelta);

    // 3. Budowanie finalnego wyniku
    // 2 lipca: automatyczny przegląd składów AI na początku sezonu
    let postReviewPlayers = recoveredPlayers;
    let postReviewClubs = simulation.updatedClubs;
    // 20 lipca: przedsprzedaż karnetów sezonowych (przed Kolejką 1 — 24 lipca)
    if (dateToProcess.getMonth() === 6 && dateToProcess.getDate() === 20) {
      const seasonYear = dateToProcess.getFullYear();
      const seasonLabel = `${seasonYear}/${String(seasonYear + 1).slice(2)}`;
      postReviewClubs = postReviewClubs.map(club => {
        const tier = parseInt(club.leagueId.split('_')[2] || '1');
        const seasonTicketRevenue = FinanceService.calculateSeasonTicketRevenue(club.stadiumCapacity, club.reputation, tier);
        const ticketsSold = Math.floor(club.stadiumCapacity * (0.10 + ((club.reputation / 10) * 0.20)));
        const newFinanceLog = {
          id: Math.random().toString(36).substr(2, 9),
          date: dateToProcess.toISOString().split('T')[0],
          amount: seasonTicketRevenue,
          type: 'INCOME' as const,
          description: `Przedsprzedaż karnetów: ${ticketsSold.toLocaleString('pl-PL')} szt.`,
          previousBalance: club.budget
        };
        return {
          ...club,
          budget: club.budget + seasonTicketRevenue,
          financeHistory: [newFinanceLog, ...(club.financeHistory || [])].slice(0, 50)
        };
      });
      // E-mail do gracza z raportem
      if (userTeamId) {
        const userClub = postReviewClubs.find(c => c.id === userTeamId);
        if (userClub) {
          const tier = parseInt(userClub.leagueId.split('_')[2] || '1');
          const ticketMail = MailService.generateSeasonTicketMail(
            { name: userClub.name, stadiumName: userClub.stadiumName, stadiumCapacity: userClub.stadiumCapacity, reputation: userClub.reputation },
            tier,
            seasonLabel,
            dateToProcess
          );
          setMessages(prev => [ticketMail, ...prev]);
        }
      }
    }

    // 20 lipca: roczny wynajem stref VIP i lóż (Skybox)
    // Warunek: tylko Ekstraklasa (tier 1) i pojemność stadionu > 15 000
    if (dateToProcess.getMonth() === 6 && dateToProcess.getDate() === 20) {
      postReviewClubs = postReviewClubs.map(club => {
        const tier = parseInt(club.leagueId.split('_')[2] || '1');
        if (tier !== 1 || club.stadiumCapacity <= 15_000) return club;
        const vipRevenue = FinanceService.calculateVIPBoxRevenue(club.stadiumCapacity, club.reputation);
        const newFinanceLog = {
          id: Math.random().toString(36).substr(2, 9),
          date: dateToProcess.toISOString().split('T')[0],
          amount: vipRevenue,
          type: 'INCOME' as const,
          description: `Wynajem stref VIP i lóż (Skybox) — sezon`,
          previousBalance: club.budget
        };
        return {
          ...club,
          budget: club.budget + vipRevenue,
          financeHistory: [newFinanceLog, ...(club.financeHistory || [])].slice(0, 50)
        };
      });
    }

    if (dateToProcess.getMonth() === 6 && dateToProcess.getDate() === 2) {
      const review = AiContractService.performSeasonSquadReview(postReviewClubs, postReviewPlayers, userTeamId);
      postReviewClubs = review.updatedClubs;
      postReviewPlayers = review.updatedPlayers;
      DebugLoggerService.log('SQUAD_REVIEW', `Przegląd składów AI (2 lipca) wykonany.`, true);
      
      // Wyplata pensji zawodników na start sezonu
      postReviewClubs = postReviewClubs.map(club => {
        const squad = postReviewPlayers[club.id] || [];
        const totalSalaries = FinanceService.calculateTotalSalaries(squad);
        
        // Obliczanie wynagrodzenia trenera (1-3 * 2.5% budżetu rocznie)
        const trainerSalaryFactor = (1 + Math.random() * 2) * 0.025; // 2.5% - 7.5%
        const trainerSalary = Math.floor(club.budget * trainerSalaryFactor);
        
        const totalCost = totalSalaries + trainerSalary;
        const newBudget = club.budget - totalCost;
        
        // Tworzymy wpisy do finansów
        const financeLogsToAdd: any[] = [];
        
        if (totalSalaries > 0) {
          financeLogsToAdd.push({
            id: Math.random().toString(36).substr(2, 9),
            date: dateToProcess.toISOString().split('T')[0],
            amount: -totalSalaries,
            type: 'EXPENSE' as const,
            description: `Pensje zawodników za sezon`,
            previousBalance: club.budget
          });
        }
        
        if (trainerSalary > 0) {
          financeLogsToAdd.push({
            id: Math.random().toString(36).substr(2, 9),
            date: dateToProcess.toISOString().split('T')[0],
            amount: -trainerSalary,
            type: 'EXPENSE' as const,
            description: `Wynagrodzenie sztabu trenera`,
            previousBalance: club.budget - totalSalaries
          });
        }
        
        return {
          ...club,
          budget: newBudget,
          financeHistory: [...financeLogsToAdd, ...(club.financeHistory || [])].slice(0, 50)
        };
      });
    }

const finalResult: SimulationOutput = {
      ...simulation,
      updatedClubs: postReviewClubs,
      updatedPlayers: postReviewPlayers,
      // TUTAJ WSTAW TEN KOD
      newOffers: simulation.newOffers || []
      // KONIEC KODU
    };
    
    // 4. Aktualizacja wszystkich stanów za jednym razem (applySimulationResult)
       // 4. Aktualizacja wszystkich stanów za jednym razem (applySimulationResult)
    applySimulationResult(finalResult);

    // 4b. Symulacja meczów CL w tle (11 i 15 lipca)
    const clResult = BackgroundMatchProcessorCL.processChampionsLeagueEvent(
      dateToProcess, userTeamId, allFixtures, clubs, sessionSeed
    );
    // WAŻNE: używamy functional update + porównania, aby nie nadpisać wyników ligowych
    // (clResult.updatedFixtures zawiera WSZYSTKIE fixtures ze starego allFixtures)
    setGlobalFixtures(prev => {
      const clMap = new Map(clResult.updatedFixtures.map(f => [f.id, f]));
      return prev.map(f => {
        const clF = clMap.get(f.id);
        if (clF && (
          clF.status !== f.status ||
          clF.homeScore !== f.homeScore ||
          clF.awayScore !== f.awayScore ||
          clF.homePenaltyScore !== f.homePenaltyScore ||
          clF.awayPenaltyScore !== f.awayPenaltyScore
        )) {
          return clF;
        }
        return f;
      });
    });

    // Przetwarzanie bonusów za Superpuchar Polski
    const updatedClubsForSuperCup = finalResult.updatedClubs.map(club => {
      const superCupFixture = clResult.updatedFixtures.find(f => f.leagueId === 'SUPER_CUP' && f.status === MatchStatus.FINISHED);
      
      if (superCupFixture && (club.id === superCupFixture.homeTeamId || club.id === superCupFixture.awayTeamId)) {
        // Sprawdzenie czy bonus za Superpuchar był już kiedykolwiek przyznany (ignorujemy datę)
        const bonusAlreadyApplied = club.financeHistory?.some(entry => 
          entry.description === 'Nagroda za zwycięstwo w Superpucharze Polski' || 
          entry.description === 'Nagroda za udział w Superpucharze Polski'
        );
        
        if (bonusAlreadyApplied) {
          return club;
        }
        
        let isWinner = false;
        
        // Sprawdzenie czy klub wygrał w regulaminowym czasie
        if (club.id === superCupFixture.homeTeamId && (superCupFixture.homeScore || 0) > (superCupFixture.awayScore || 0)) {
          isWinner = true;
        } else if (club.id === superCupFixture.awayTeamId && (superCupFixture.awayScore || 0) > (superCupFixture.homeScore || 0)) {
          isWinner = true;
        }
        
        // Sprawdzenie dla rzutów karnych w przypadku remisu
        if (!isWinner && superCupFixture.homeScore === superCupFixture.awayScore && superCupFixture.homePenaltyScore !== undefined) {
          if (club.id === superCupFixture.homeTeamId && (superCupFixture.homePenaltyScore || 0) > (superCupFixture.awayPenaltyScore || 0)) {
            isWinner = true;
          } else if (club.id === superCupFixture.awayTeamId && (superCupFixture.awayPenaltyScore || 0) > (superCupFixture.homePenaltyScore || 0)) {
            isWinner = true;
          }
        }
        
        const bonusAmount = FinanceService.calculateSuperCupBonus(isWinner);
        
        const financeLog = {
          id: Math.random().toString(36).substring(2, 9),
          date: dateToProcess.toISOString().split('T')[0],
          amount: bonusAmount,
          type: 'INCOME' as const,
          description: isWinner ? 'Nagroda za zwycięstwo w Superpucharze Polski' : 'Nagroda za udział w Superpucharze Polski',
          previousBalance: club.budget
        };
        
        return {
          ...club,
          budget: club.budget + bonusAmount,
          financeHistory: [financeLog, ...(club.financeHistory || [])].slice(0, 50)
        };
      }
      
      return club;
    });
    
    setClubs(updatedClubsForSuperCup);

    // 5. Integracja NOWYCH OFERT AI do stanu

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
      const newMails = MailService.generateDailyMails(dateToProcess, userClub, recoveredPlayers, finalResult.updatedClubs, userRank, confidence, recentFixture, messages);
      if (newMails.length > 0) setMessages(prev => [...newMails, ...prev]);
    }

    const nextDay = new Date(currentDate);
    nextDay.setDate(nextDay.getDate() + 1);
    // Nowy sezon jest teraz uruchamiany przez confirmSeasonEnd (przycisk "NOWY SEZON" na Dashboardzie)
    // Fallback: jeśli data jakoś przeskoczyła bez zatrzymania na OFF_SEASON (np. save z przyszłości)
    // if (nextDay.getMonth() === 6 && nextDay.getDate() === 1) startNextSeason(nextDay.getFullYear());

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


    // --- SCOUT ASSISTANT: Raport przedmeczowy (dzień przed meczem ligowym lub pucharowym) ---
    if (userTeamId) {
      const tomorrowStr = nextDay.toDateString();
      const tomorrowFixture = allFixtures.find(f =>
        f.date.toDateString() === tomorrowStr &&
        f.status === 'SCHEDULED' &&
        (f.homeTeamId === userTeamId || f.awayTeamId === userTeamId) &&
        (typeof f.leagueId === 'string' && (
          f.leagueId.startsWith('L_PL_') ||
          f.leagueId === 'POLISH_CUP' ||
          f.leagueId === 'SUPER_CUP' ||
          (f.leagueId.startsWith('CL_') && !f.leagueId.endsWith('_DRAW'))
        ))
      );

      if (tomorrowFixture) {
        const scoutMailKey = `SCOUT_REPORT_${tomorrowFixture.id}`;
        if (!sentMailIdsRef.current.has(scoutMailKey)) {
          const opponentId = tomorrowFixture.homeTeamId === userTeamId
            ? tomorrowFixture.awayTeamId
            : tomorrowFixture.homeTeamId;
          const opponentClub = clubs.find(c => c.id === opponentId);
          const opponentPlayers = players[opponentId] || [];
          const opponentLineup = lineups[opponentId];
          const userPlayersList = players[userTeamId] || [];
          const userLineup = lineups[userTeamId];

          if (opponentClub && opponentLineup && userLineup) {
            const clLeagueNames: Record<string, string> = {
              'CL_R1Q': 'LM - Kwalifikacje R1',
              'CL_R1Q_RETURN': 'LM - Kwalifikacje R1 Rewanż',
              'CL_R2Q': 'LM - Kwalifikacje R2',
              'CL_R2Q_RETURN': 'LM - Kwalifikacje R2 Rewanż',
              'CL_GROUP_STAGE': 'Liga Mistrzów - Faza Grupowa',
              'CL_R16': 'Liga Mistrzów - 1/8 Finału',
              'CL_R16_RETURN': 'LM - 1/8 Finału Rewanż',
              'CL_QF': 'Liga Mistrzów - Ćwierćfinał',
              'CL_QF_RETURN': 'LM - Ćwierćfinał Rewanż',
              'CL_SF': 'Liga Mistrzów - Półfinał',
              'CL_SF_RETURN': 'LM - Półfinał Rewanż',
              'CL_FINAL': 'Liga Mistrzów - Finał',
            };
            const leagueName = tomorrowFixture.leagueId === 'L_PL_1' ? 'Ekstraklasa'
              : tomorrowFixture.leagueId === 'L_PL_2' ? '1. Liga'
              : tomorrowFixture.leagueId === 'L_PL_3' ? '2. Liga'
              : tomorrowFixture.leagueId === 'POLISH_CUP' ? 'Puchar Polski'
              : tomorrowFixture.leagueId === 'SUPER_CUP' ? 'Superpuchar'
              : clLeagueNames[tomorrowFixture.leagueId as string] ?? 'Liga Mistrzów';
            const opponentLeagueStandings = [...clubs]
              .filter(c => c.leagueId === opponentClub.leagueId)
              .sort((a, b) => b.stats.points - a.stats.points || b.stats.goalDifference - a.stats.goalDifference);
            const opponentLeaguePosition = opponentLeagueStandings.findIndex(c => c.id === opponentClub.id) + 1;
            const scoutMail = ScoutAssistantService.generatePreMatchReport({
              opponentClub,
              opponentPlayers,
              opponentLineup,
              userPlayers: userPlayersList,
              userLineup,
              matchDate: tomorrowFixture.date,
              managerName: managerProfile?.firstName || 'Managerze',
              clubs,
              opponentLeaguePosition,
              opponentLeaguePoints: opponentClub.stats.points,
              opponentLeagueGoalDiff: opponentClub.stats.goalDifference,
              leagueName,
            });
            sentMailIdsRef.current.add(scoutMailKey);
            setMessages(prev => [scoutMail, ...prev]);
          }
        }
      }
    }
    // --- END SCOUT ASSISTANT ---

    // Nie przesuwamy daty jeśli gracz musi jeszcze zagrać mecz lub potwierdzić akcję tego dnia
    if (skipDayAdvance) {
      // Resetuj GUARD ref — następne wywołanie advanceDay dla tej samej daty
      // MUSI przejść i faktycznie przesunąć datę (slot będzie już w processedDrawIds)
      lastProcessedLeagueDateRef.current = '';
      return;
    }

    setCurrentDate(nextDay);
    setLastRecoveryDate(new Date(dateToProcess));
  }, [currentDate, userTeamId, allFixtures, applySimulationResult, startNextSeason, viewState, seasonTemplate, cupParticipants, clubs, processedDrawIds, navigateTo, globalFixtures, targetJumpTime]);


   const confirmCLGroupDraw = () => {
    if (!activeGroupDraw) return;
    // Zapisz grupy trwale przed wyczyszczeniem activeGroupDraw
    setClGroups(activeGroupDraw.groups);

    // Generuj fixtury fazy grupowej (6 kolejek)
    const year = activeGroupDraw.date.getFullYear();
    const matchdayDates = [
      new Date(year, 8,  18),  // MD1 — 18 września
      new Date(year, 9,  17),  // MD2 — 17 października
      new Date(year, 9,  25),  // MD3 — 25 października
      new Date(year, 10, 25),  // MD4 — 25 listopada
      new Date(year, 11,  4),  // MD5 — 4 grudnia
      new Date(year, 11, 14),  // MD6 — 14 grudnia
    ];
    const groupFixtures = CLDrawService.generateGroupStageFixtures(
      activeGroupDraw.groups,
      matchdayDates,
      year,
    );
    setGlobalFixtures(prev => [...prev, ...groupFixtures]);

    setProcessedDrawIds(prev => [...prev, activeGroupDraw.id]);
    setActiveGroupDraw(null);
    if (userTeamId) {
      const mail: MailMessage = {
        id: `CL_GROUP_DRAW_${Date.now()}`,
        sender: 'UEFA',
        role: 'Biuro Rozgrywek UEFA',
        subject: 'Losowanie Fazy Grupowej Ligi Mistrzów',
        body: `Zakończono ceremonię losowania fazy grupowej Ligi Mistrzów. Sprawdź skład swojej grupy.`,
        date: new Date(currentDate),
        isRead: false,
        type: MailType.SYSTEM,
        priority: 85
      };
      setMessages(prev => [mail, ...prev]);
    }
    const nextDay = new Date(currentDate);
    nextDay.setDate(nextDay.getDate() + 1);
    setCurrentDate(nextDay);
    navigateTo(ViewState.DASHBOARD);
  };

  const confirmELGroupDraw = () => {
    if (!activeELGroupDraw) return;
    setElGroups(activeELGroupDraw.groups);

    const year = activeELGroupDraw.date.getFullYear();
    const matchdayDates = [
      new Date(year, 8,  19),  // MD1 — 19 września
      new Date(year, 9,  18),  // MD2 — 18 października
      new Date(year, 9,  26),  // MD3 — 26 października
      new Date(year, 10, 26),  // MD4 — 26 listopada
      new Date(year, 11,  5),  // MD5 — 5 grudnia
      new Date(year, 11, 15),  // MD6 — 15 grudnia
    ];
    const groupFixtures = ELDrawService.generateGroupStageFixtures(
      activeELGroupDraw.groups,
      matchdayDates,
      year,
    );
    setGlobalFixtures(prev => [...prev, ...groupFixtures]);

    setProcessedDrawIds(prev => [...prev, activeELGroupDraw.id]);
    setActiveELGroupDraw(null);
    if (userTeamId) {
      const mail: MailMessage = {
        id: `EL_GROUP_DRAW_${Date.now()}`,
        sender: 'UEFA',
        role: 'Biuro Rozgrywek UEFA',
        subject: 'Losowanie Fazy Grupowej Ligi Europy',
        body: `Zakończono ceremonię losowania fazy grupowej Ligi Europy. Sprawdź skład swojej grupy.`,
        date: new Date(currentDate),
        isRead: false,
        type: MailType.SYSTEM,
        priority: 82
      };
      setMessages(prev => [mail, ...prev]);
    }
    const nextDayEL = new Date(currentDate);
    nextDayEL.setDate(nextDayEL.getDate() + 1);
    setCurrentDate(nextDayEL);
    navigateTo(ViewState.DASHBOARD);
  };

  const confirmCONFGroupDraw = () => {
    if (!activeConfGroupDraw) return;
    setConfGroups(activeConfGroupDraw.groups);
    const year = activeConfGroupDraw.date.getFullYear();
    const matchdayDates = [
      new Date(year, 8,  20),
      new Date(year, 9,  19),
      new Date(year, 9,  27),
      new Date(year, 10, 27),
      new Date(year, 11,  6),
      new Date(year, 11, 16),
    ];
    const groupFixtures = CONFDrawService.generateGroupStageFixtures(activeConfGroupDraw.groups, matchdayDates, year);
    setGlobalFixtures(prev => [...prev, ...groupFixtures]);
    setProcessedDrawIds(prev => [...prev, activeConfGroupDraw.id]);
    setActiveConfGroupDraw(null);
    if (userTeamId) {
      const mail: MailMessage = {
        id: `CONF_GROUP_DRAW_${Date.now()}`,
        sender: 'UEFA',
        role: 'Biuro Rozgrywek UEFA',
        subject: 'Losowanie Fazy Grupowej Ligi Konferencji',
        body: `Zakończono ceremonię losowania fazy grupowej Ligi Konferencji UEFA. Sprawdź skład swojej grupy.`,
        date: new Date(currentDate),
        isRead: false,
        type: MailType.SYSTEM,
        priority: 84
      };
      setMessages(prev => [mail, ...prev]);
    }
    const nextDay = new Date(currentDate);
    nextDay.setDate(nextDay.getDate() + 1);
    setCurrentDate(nextDay);
    navigateTo(ViewState.DASHBOARD);
  };

  const confirmCONFR16Draw = useCallback(() => {
    if (!confGroups) return;
    const drawYear = currentDate.getFullYear();
    const leg1Date = new Date(drawYear + 1, 0, 21); // 21 stycznia
    const leg2Date = new Date(drawYear + 1, 0, 29); // 29 stycznia
    const fixtureYear = drawYear + 1;

    const r16Fixtures = CONFDrawService.generateCONFR16Fixtures(
      confGroups, allFixtures, leg1Date, leg2Date, fixtureYear,
    );
    setGlobalFixtures(prev => [...prev, ...r16Fixtures]);

    if (userTeamId) {
      const isUserIn = r16Fixtures.some(
        f => f.leagueId === CompetitionType.CONF_R16 &&
             (f.homeTeamId === userTeamId || f.awayTeamId === userTeamId)
      );
      const mail: MailMessage = {
        id: `CONF_R16_DRAW_${Date.now()}`,
        sender: 'UEFA',
        role: 'Biuro Rozgrywek UEFA',
        subject: 'Losowanie 1/8 Finału Ligi Konferencji',
        body: isUserIn
          ? 'Twój klub awansował do 1/8 finału Ligi Konferencji! Sprawdź swojego rywala w historii LK.'
          : 'Przeprowadzono losowanie 1/8 finału Ligi Konferencji. Sprawdź pary w historii LK.',
        date: new Date(currentDate),
        isRead: false,
        type: MailType.SYSTEM,
        priority: 87,
      };
      setMessages(prev => [mail, ...prev]);
    }

    const nextDay = new Date(currentDate);
    nextDay.setDate(nextDay.getDate() + 1);
    setCurrentDate(nextDay);
    navigateTo(ViewState.DASHBOARD);
  }, [confGroups, allFixtures, currentDate, userTeamId, navigateTo]);

  const confirmCONFQFDraw = useCallback(() => {
    const drawYear = currentDate.getFullYear();
    const leg1Date = new Date(drawYear, 1, 18); // 18 lutego
    const leg2Date = new Date(drawYear, 2, 4);  // 4 marca
    const fixtureYear = drawYear;

    const r16Winners = CONFDrawService.getR16Winners(allFixtures);
    const r16Pool = CONFDrawService.getR16Participants(allFixtures);
    const safeR16Winners = CONFDrawService.guaranteeWinners(r16Winners, r16Pool, 8);
    const qfFixtures = CONFDrawService.generateCONFQFFixtures(
      safeR16Winners, leg1Date, leg2Date, fixtureYear, sessionSeed,
    );
    setGlobalFixtures(prev => [...prev, ...qfFixtures]);

    if (userTeamId) {
      const isUserIn = qfFixtures.some(
        f => f.leagueId === CompetitionType.CONF_QF &&
             (f.homeTeamId === userTeamId || f.awayTeamId === userTeamId)
      );
      const mail: MailMessage = {
        id: `CONF_QF_DRAW_${Date.now()}`,
        sender: 'UEFA',
        role: 'Biuro Rozgrywek UEFA',
        subject: 'Losowanie 1/4 Finału Ligi Konferencji',
        body: isUserIn
          ? 'Twój klub awansował do 1/4 finału Ligi Konferencji! Sprawdź swojego rywala w historii LK.'
          : 'Przeprowadzono losowanie 1/4 finału Ligi Konferencji. Sprawdź pary w historii LK.',
        date: new Date(currentDate),
        isRead: false,
        type: MailType.SYSTEM,
        priority: 86,
      };
      setMessages(prev => [mail, ...prev]);
    }

    const nextDay = new Date(currentDate);
    nextDay.setDate(nextDay.getDate() + 1);
    setCurrentDate(nextDay);
    navigateTo(ViewState.DASHBOARD);
  }, [allFixtures, currentDate, userTeamId, sessionSeed, navigateTo]);

  const confirmCONFSFDraw = useCallback(() => {
    const drawYear = currentDate.getFullYear();
    const leg1Date = new Date(drawYear, 2, 28); // 28 marca
    const leg2Date = new Date(drawYear, 3, 17); // 17 kwietnia
    const fixtureYear = drawYear;

    const qfWinners = CONFDrawService.getQFWinners(allFixtures);
    const qfPool = CONFDrawService.getQFParticipants(allFixtures);
    const safeQFWinners = CONFDrawService.guaranteeWinners(qfWinners, qfPool, 4);
    const sfFixtures = CONFDrawService.generateCONFSFFixtures(
      safeQFWinners, leg1Date, leg2Date, fixtureYear, sessionSeed,
    );
    setGlobalFixtures(prev => [...prev, ...sfFixtures]);

    if (userTeamId) {
      const isUserIn = sfFixtures.some(
        f => f.leagueId === CompetitionType.CONF_SF &&
             (f.homeTeamId === userTeamId || f.awayTeamId === userTeamId)
      );
      const mail: MailMessage = {
        id: `CONF_SF_DRAW_${Date.now()}`,
        sender: 'UEFA',
        role: 'Biuro Rozgrywek UEFA',
        subject: 'Losowanie 1/2 Finału Ligi Konferencji',
        body: isUserIn
          ? 'Twój klub awansował do 1/2 finału Ligi Konferencji! Sprawdź swojego rywala w historii LK.'
          : 'Przeprowadzono losowanie 1/2 finału Ligi Konferencji. Sprawdź pary w historii LK.',
        date: new Date(currentDate),
        isRead: false,
        type: MailType.SYSTEM,
        priority: 88,
      };
      setMessages(prev => [mail, ...prev]);
    }

    const nextDay = new Date(currentDate);
    nextDay.setDate(nextDay.getDate() + 1);
    setCurrentDate(nextDay);
    navigateTo(ViewState.DASHBOARD);
  }, [allFixtures, currentDate, userTeamId, sessionSeed, navigateTo]);

  const confirmELR16Draw = useCallback(() => {
    if (!elGroups) return;
    const drawYear = currentDate.getFullYear();
    const leg1Date = new Date(drawYear + 1, 0, 20); // 20 stycznia
    const leg2Date = new Date(drawYear + 1, 0, 26); // 26 stycznia
    const fixtureYear = drawYear + 1;

    const r16Fixtures = ELDrawService.generateELR16Fixtures(
      elGroups, allFixtures, leg1Date, leg2Date, fixtureYear,
    );
    setGlobalFixtures(prev => [...prev, ...r16Fixtures]);

    if (userTeamId) {
      const isUserIn = r16Fixtures.some(
        f => f.leagueId === CompetitionType.EL_R16 &&
             (f.homeTeamId === userTeamId || f.awayTeamId === userTeamId)
      );
      const mail: MailMessage = {
        id: `EL_R16_DRAW_${Date.now()}`,
        sender: 'UEFA',
        role: 'Biuro Rozgrywek UEFA',
        subject: 'Losowanie 1/8 Finału Ligi Europy',
        body: isUserIn
          ? 'Twój klub awansował do 1/8 finału Ligi Europy! Sprawdź swojego rywala w historii LE.'
          : 'Przeprowadzono losowanie 1/8 finału Ligi Europy. Sprawdź pary w historii LE.',
        date: new Date(currentDate),
        isRead: false,
        type: MailType.SYSTEM,
        priority: 88,
      };
      setMessages(prev => [mail, ...prev]);
    }

    const nextDay = new Date(currentDate);
    nextDay.setDate(nextDay.getDate() + 1);
    setCurrentDate(nextDay);
    navigateTo(ViewState.DASHBOARD);
  }, [allFixtures, currentDate, elGroups, userTeamId, navigateTo]);

  const confirmCLR16Draw = useCallback(() => {
    if (!clGroups) return;
    // Draw jest w grudniu roku Y → mecze są w styczniu roku Y+1
    const drawYear = currentDate.getFullYear();
    const leg1Date = new Date(drawYear + 1, 0, 19); // 19 stycznia
    const leg2Date = new Date(drawYear + 1, 0, 25); // 25 stycznia
    const fixtureYear = drawYear + 1;

    const r16Fixtures = CLDrawService.generateR16Fixtures(
      clGroups, allFixtures, leg1Date, leg2Date, fixtureYear,
    );
    setGlobalFixtures(prev => [...prev, ...r16Fixtures]);

    if (userTeamId) {
      const isUserIn = r16Fixtures.some(
        f => f.leagueId === CompetitionType.CL_R16 &&
             (f.homeTeamId === userTeamId || f.awayTeamId === userTeamId)
      );
      const mail: MailMessage = {
        id: `CL_R16_DRAW_${Date.now()}`,
        sender: 'UEFA',
        role: 'Biuro Rozgrywek UEFA',
        subject: 'Losowanie 1/8 Finału Ligi Mistrzów',
        body: isUserIn
          ? 'Twój klub awansował do 1/8 finału Ligi Mistrzów! Sprawdź swojego rywala w historii LM.'
          : 'Przeprowadzono losowanie 1/8 finału Ligi Mistrzów. Sprawdź pary w historii LM.',
        date: new Date(currentDate),
        isRead: false,
        type: MailType.SYSTEM,
        priority: 90,
      };
      setMessages(prev => [mail, ...prev]);
    }

        const nextDay = new Date(currentDate);
    nextDay.setDate(nextDay.getDate() + 1);
    setCurrentDate(nextDay);
        navigateTo(ViewState.DASHBOARD);
  }, [allFixtures, currentDate, userTeamId, sessionSeed, navigateTo]);

  const confirmCLQFDraw = useCallback(() => {
    const drawYear = currentDate.getFullYear();
    const leg1Date = new Date(drawYear, 1, 16); // 16 lutego
    const leg2Date = new Date(drawYear, 2, 2);  // 2 marca
    const fixtureYear = drawYear;

    const r16Winners = CLDrawService.getR16Winners(allFixtures);
    const r16Pool = CLDrawService.getR16Participants(allFixtures);
    const safeR16Winners = CLDrawService.guaranteeWinners(r16Winners, r16Pool, 8);
    const qfFixtures = CLDrawService.generateQFFixtures(
      safeR16Winners, leg1Date, leg2Date, fixtureYear, sessionSeed,
    );
    setGlobalFixtures(prev => [...prev, ...qfFixtures]);

    if (userTeamId) {
      const isUserIn = qfFixtures.some(
        f => f.leagueId === CompetitionType.CL_QF &&
             (f.homeTeamId === userTeamId || f.awayTeamId === userTeamId)
      );
      const mail: MailMessage = {
        id: `CL_QF_DRAW_${Date.now()}`,
        sender: 'UEFA',
        role: 'Biuro Rozgrywek UEFA',
        subject: 'Losowanie 1/4 Finału Ligi Mistrzów',
        body: isUserIn
          ? 'Twój klub awansował do 1/4 finału Ligi Mistrzów! Sprawdź swojego rywala w historii LM.'
          : 'Przeprowadzono losowanie 1/4 finału Ligi Mistrzów. Sprawdź pary w historii LM.',
        date: new Date(currentDate),
        isRead: false,
        type: MailType.SYSTEM,
        priority: 90,
      };
      setMessages(prev => [mail, ...prev]);
    }

    const nextDay = new Date(currentDate);
    nextDay.setDate(nextDay.getDate() + 1);
    setCurrentDate(nextDay);
    navigateTo(ViewState.DASHBOARD);
  }, [allFixtures, currentDate, userTeamId, sessionSeed, navigateTo]);

  const confirmCLSFDraw = useCallback(() => {
    const drawYear = currentDate.getFullYear();
    const leg1Date = new Date(drawYear, 2, 26); // 26 marca
    const leg2Date = new Date(drawYear, 3, 15); // 15 kwietnia
    const fixtureYear = drawYear;

    const qfWinners = CLDrawService.getQFWinners(allFixtures);
    const qfPool = CLDrawService.getQFParticipants(allFixtures);
    const safeQFWinners = CLDrawService.guaranteeWinners(qfWinners, qfPool, 4);
    const sfFixtures = CLDrawService.generateSFFixtures(
      safeQFWinners, leg1Date, leg2Date, fixtureYear, sessionSeed,
    );
    setGlobalFixtures(prev => [...prev, ...sfFixtures]);

    if (userTeamId) {
      const isUserIn = sfFixtures.some(
        f => f.leagueId === CompetitionType.CL_SF &&
             (f.homeTeamId === userTeamId || f.awayTeamId === userTeamId)
      );
      const mail: MailMessage = {
        id: `CL_SF_DRAW_${Date.now()}`,
        sender: 'UEFA',
        role: 'Biuro Rozgrywek UEFA',
        subject: 'Losowanie 1/2 Finału Ligi Mistrzów',
        body: isUserIn
          ? 'Twój klub awansował do 1/2 finału Ligi Mistrzów! Sprawdź swojego rywala w historii LM.'
          : 'Przeprowadzono losowanie 1/2 finału Ligi Mistrzów. Sprawdź pary w historii LM.',
        date: new Date(currentDate),
        isRead: false,
        type: MailType.SYSTEM,
        priority: 90,
      };
      setMessages(prev => [mail, ...prev]);
    }

    const nextDay = new Date(currentDate);
    nextDay.setDate(nextDay.getDate() + 1);
    setCurrentDate(nextDay);
    navigateTo(ViewState.DASHBOARD);
  }, [allFixtures, currentDate, userTeamId, sessionSeed, navigateTo]);

  const confirmELQFDraw = useCallback(() => {
    const drawYear = currentDate.getFullYear();
    const leg1Date = new Date(drawYear, 1, 17); // 17 lutego
    const leg2Date = new Date(drawYear, 2, 3);  // 3 marca
    const fixtureYear = drawYear;

    const r16Winners = ELDrawService.getR16Winners(allFixtures);
    const r16Pool = ELDrawService.getR16Participants(allFixtures);
    const safeR16Winners = ELDrawService.guaranteeWinners(r16Winners, r16Pool, 8);
    const qfFixtures = ELDrawService.generateQFFixtures(
      safeR16Winners, leg1Date, leg2Date, fixtureYear, sessionSeed,
    );
    setGlobalFixtures(prev => [...prev, ...qfFixtures]);

    if (userTeamId) {
      const isUserIn = qfFixtures.some(
        f => f.leagueId === CompetitionType.EL_QF &&
             (f.homeTeamId === userTeamId || f.awayTeamId === userTeamId)
      );
      const mail: MailMessage = {
        id: `EL_QF_DRAW_${Date.now()}`,
        sender: 'UEFA',
        role: 'Biuro Rozgrywek UEFA',
        subject: 'Losowanie 1/4 Finału Ligi Europy',
        body: isUserIn
          ? 'Twój klub awansował do 1/4 finału Ligi Europy! Sprawdź swojego rywala w historii LE.'
          : 'Przeprowadzono losowanie 1/4 finału Ligi Europy. Sprawdź pary w historii LE.',
        date: new Date(currentDate),
        isRead: false,
        type: MailType.SYSTEM,
        priority: 88,
      };
      setMessages(prev => [mail, ...prev]);
    }

    const nextDay = new Date(currentDate);
    nextDay.setDate(nextDay.getDate() + 1);
    setCurrentDate(nextDay);
    navigateTo(ViewState.DASHBOARD);
  }, [allFixtures, currentDate, userTeamId, sessionSeed, navigateTo]);

  const confirmELSFDraw = useCallback(() => {
    const drawYear = currentDate.getFullYear();
    const leg1Date = new Date(drawYear, 2, 27); // 27 marca
    const leg2Date = new Date(drawYear, 3, 16); // 16 kwietnia
    const fixtureYear = drawYear;

    const qfWinners = ELDrawService.getQFWinners(allFixtures);
    const qfPool = ELDrawService.getQFParticipants(allFixtures);
    const safeQFWinners = ELDrawService.guaranteeWinners(qfWinners, qfPool, 4);
    const sfFixtures = ELDrawService.generateSFFixtures(
      safeQFWinners, leg1Date, leg2Date, fixtureYear, sessionSeed,
    );
    setGlobalFixtures(prev => [...prev, ...sfFixtures]);

    if (userTeamId) {
      const isUserIn = sfFixtures.some(
        f => f.leagueId === CompetitionType.EL_SF &&
             (f.homeTeamId === userTeamId || f.awayTeamId === userTeamId)
      );
      const mail: MailMessage = {
        id: `EL_SF_DRAW_${Date.now()}`,
        sender: 'UEFA',
        role: 'Biuro Rozgrywek UEFA',
        subject: 'Losowanie 1/2 Finału Ligi Europy',
        body: isUserIn
          ? 'Twój klub awansował do 1/2 finału Ligi Europy! Sprawdź swojego rywala w historii LE.'
          : 'Przeprowadzono losowanie 1/2 finału Ligi Europy. Sprawdź pary w historii LE.',
        date: new Date(currentDate),
        isRead: false,
        type: MailType.SYSTEM,
        priority: 88,
      };
      setMessages(prev => [mail, ...prev]);
    }

    const nextDay = new Date(currentDate);
    nextDay.setDate(nextDay.getDate() + 1);
    setCurrentDate(nextDay);
    navigateTo(ViewState.DASHBOARD);
  }, [allFixtures, currentDate, userTeamId, sessionSeed, navigateTo]);

  const confirmELFinalDraw = useCallback(() => {
    const finalAlreadyExists = allFixtures.some(f => f.leagueId === CompetitionType.EL_FINAL);
    if (!finalAlreadyExists) {
      const sfWinners = ELDrawService.getSFWinners(allFixtures);
      const sfPool = ELDrawService.getSFParticipants(allFixtures);
      const safeSFWinners = ELDrawService.guaranteeWinners(sfWinners, sfPool, 2);
      if (safeSFWinners.length === 2) {
        const finalDate = new Date(currentDate.getFullYear(), 4, 20);
        const finalFixture = ELDrawService.generateFinalFixture(
          safeSFWinners[0], safeSFWinners[1], finalDate, finalDate.getFullYear()
        );
        setGlobalFixtures(prev => [...prev, finalFixture]);
      }
    }

    if (userTeamId) {
      const sfWinners = ELDrawService.getSFWinners(allFixtures);
      const isUserIn = sfWinners.includes(userTeamId);
      const mail: MailMessage = {
        id: `EL_FINAL_DRAW_${Date.now()}`,
        sender: 'UEFA',
        role: 'Biuro Rozgrywek UEFA',
        subject: 'Ogłoszenie Finalistów Ligi Europy',
        body: isUserIn
          ? 'Twój klub awansował do Finału Ligi Europy! Sprawdź szczegóły w historii LE.'
          : 'Ogłoszono finaliśtów Ligi Europy. Sprawdź parę finałową w historii LE.',
        date: new Date(currentDate),
        isRead: false,
        type: MailType.SYSTEM,
        priority: 90,
      };
      setMessages(prev => [mail, ...prev]);
    }

    const nextDay = new Date(currentDate);
    nextDay.setDate(nextDay.getDate() + 1);
    setCurrentDate(nextDay);
    navigateTo(ViewState.DASHBOARD);
  }, [allFixtures, currentDate, userTeamId, navigateTo]);

  const confirmCONFFinalDraw = useCallback(() => {
    const finalAlreadyExists = allFixtures.some(f => f.leagueId === CompetitionType.CONF_FINAL);
    if (!finalAlreadyExists) {
      const sfWinners = CONFDrawService.getSFWinners(allFixtures);
      const sfPool = CONFDrawService.getSFParticipants(allFixtures);
      const safeSFWinners = CONFDrawService.guaranteeWinners(sfWinners, sfPool, 2);
      if (safeSFWinners.length === 2) {
        const finalDate = new Date(currentDate.getFullYear(), 4, 27);
        const finalFixture = CONFDrawService.generateFinalFixture(
          safeSFWinners[0], safeSFWinners[1], finalDate, finalDate.getFullYear()
        );
        setGlobalFixtures(prev => [...prev, finalFixture]);
      }
    }
    if (userTeamId) {
      const sfWinners = CONFDrawService.getSFWinners(allFixtures);
      const isUserIn = sfWinners.includes(userTeamId);
      const mail: MailMessage = {
        id: `CONF_FINAL_DRAW_${Date.now()}`,
        sender: 'UEFA',
        role: 'Biuro Rozgrywek UEFA',
        subject: 'Ogłoszenie Finalistów Ligi Konferencji',
        body: isUserIn
          ? 'Twój klub awansował do Finału Ligi Konferencji! Sprawdź szczegóły w historii LK.'
          : 'Ogłoszono finalistów Ligi Konferencji. Sprawdź parę finałową w historii LK.',
        date: new Date(currentDate),
        isRead: false,
        type: MailType.SYSTEM,
        priority: 90,
      };
      setMessages(prev => [mail, ...prev]);
    }
    const nextDay = new Date(currentDate);
    nextDay.setDate(nextDay.getDate() + 1);
    setCurrentDate(nextDay);
    navigateTo(ViewState.DASHBOARD);
  }, [allFixtures, currentDate, userTeamId, navigateTo]);

  const confirmSeasonEnd = useCallback(() => {
    const nextSeasonYear = currentDate.getFullYear() + 1;
    // Uruchom nowy sezon i przesuń datę na 1 lipca
    // Przegląd składów AI zostanie wykonany automatycznie 2 lipca przez advanceDay
    startNextSeason(nextSeasonYear);
    setCurrentDate(new Date(nextSeasonYear, 6, 1));
  }, [currentDate, userTeamId, startNextSeason]);

  const confirmCupDraw = (pairs: Fixture[]) => {
    if (!activeCupDraw) return;
    
    const participantIds = new Set<string>();
    pairs.forEach(f => { participantIds.add(f.homeTeamId); participantIds.add(f.awayTeamId); });
    
    setClubs(prev => prev.map(c => ({
       ...c,
       isInPolishCup: participantIds.has(c.id)
    })));

       setGlobalFixtures(prev => [...prev, ...pairs]);

    // ── Tworzenie fixtures meczowych po losowaniu ──
    const year = currentDate.getFullYear();
  


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

  const confirmCLDraw = (pairs: Fixture[]) => {
    if (!activeCupDraw) return;
    setGlobalFixtures(prev => [...prev, ...pairs]);

    const year = currentDate.getFullYear();
    const matchFixtures: Fixture[] = [];
    const isR2Q = pairs.length > 0 && pairs[0].leagueId === CompetitionType.CL_R2Q_DRAW;

    pairs.forEach((pair, i) => {
      const pairNum = i + 1;
      if (isR2Q) {
        matchFixtures.push({
          id: `CL_R2Q_MATCH_${pairNum}_${year}`,
          leagueId: CompetitionType.CL_R2Q,
          homeTeamId: pair.homeTeamId,
          awayTeamId: pair.awayTeamId,
          date: new Date(year, 6, 27),  // 27 lipca
          status: MatchStatus.SCHEDULED,
          homeScore: null,
          awayScore: null,
        });
        matchFixtures.push({
          id: `CL_R2Q_MATCH_${pairNum}_${year}_RETURN`,
          leagueId: CompetitionType.CL_R2Q_RETURN,
          homeTeamId: pair.awayTeamId,
          awayTeamId: pair.homeTeamId,
          date: new Date(year, 7, 14),  // 14 sierpnia
          status: MatchStatus.SCHEDULED,
          homeScore: null,
          awayScore: null,
        });
      } else {
        matchFixtures.push({
          id: `CL_R1Q_MATCH_${pairNum}_${year}`,
          leagueId: CompetitionType.CL_R1Q,
          homeTeamId: pair.homeTeamId,
          awayTeamId: pair.awayTeamId,
          date: new Date(year, 6, 11),
          status: MatchStatus.SCHEDULED,
          homeScore: null,
          awayScore: null,
        });
        matchFixtures.push({
          id: `CL_R1Q_MATCH_${pairNum}_${year}_RETURN`,
          leagueId: CompetitionType.CL_R1Q_RETURN,
          homeTeamId: pair.awayTeamId,
          awayTeamId: pair.homeTeamId,
          date: new Date(year, 6, 15),
          status: MatchStatus.SCHEDULED,
          homeScore: null,
          awayScore: null,
        });
      }
    });
    setGlobalFixtures(prev => [...prev, ...matchFixtures]);
    // ── koniec ──


    setProcessedDrawIds(prev => [...prev, activeCupDraw.id]);
    setActiveCupDraw(null);
    if (userTeamId) {
      const isUserIn = pairs.some(f => f.homeTeamId === userTeamId || f.awayTeamId === userTeamId);
      const mail: MailMessage = {
        id: `CL_DRAW_${Date.now()}`,
        sender: 'UEFA',
        role: 'Biuro Rozgrywek UEFA',
        subject: 'Zakończono losowanie Ligi Mistrzów',
        body: isUserIn
          ? `Wylosowano pary rundy wstępnej Ligi Mistrzów. Nasz zespół trafił na przeciwnika. Szczegóły dostępne w drabince rozgrywek.`
          : `Zakończono ceremonię losowania rundy wstępnej Ligi Mistrzów. Zapraszamy do zapoznania się z wylosowanymi parami.`,
        date: new Date(currentDate),
        isRead: false,
        type: MailType.SYSTEM,
        priority: 85
      };
      setMessages(prev => [mail, ...prev]);
    }
    const nextDay = new Date(currentDate);
    nextDay.setDate(nextDay.getDate() + 1);
    setCurrentDate(nextDay);
    navigateTo(ViewState.DASHBOARD);
  };

  // ── Liga Europy: potwierdzenie losowania R1Q ─────────────────────────────
  const confirmELDraw = (pairs: Fixture[]) => {
    if (!activeCupDraw) return;

    // Zapisz pary (draw fixtures)
    setGlobalFixtures(prev => [...prev, ...pairs]);

    const year = currentDate.getFullYear();
    const matchFixtures: Fixture[] = [];

    pairs.forEach((pair, i) => {
      const pairNum = i + 1;
      matchFixtures.push({
        id: `EL_R1Q_MATCH_${pairNum}_${year}`,
        leagueId: CompetitionType.EL_R1Q,
        homeTeamId: pair.homeTeamId,
        awayTeamId: pair.awayTeamId,
        date: new Date(year, 6, 5),   // 5 lipca
        status: MatchStatus.SCHEDULED,
        homeScore: null,
        awayScore: null,
      });
      matchFixtures.push({
        id: `EL_R1Q_MATCH_${pairNum}_${year}_RETURN`,
        leagueId: CompetitionType.EL_R1Q_RETURN,
        homeTeamId: pair.awayTeamId,
        awayTeamId: pair.homeTeamId,
        date: new Date(year, 6, 10),  // 10 lipca
        status: MatchStatus.SCHEDULED,
        homeScore: null,
        awayScore: null,
      });
    });
    setGlobalFixtures(prev => [...prev, ...matchFixtures]);

    setProcessedDrawIds(prev => [...prev, activeCupDraw.id]);
    setActiveCupDraw(null);

    if (userTeamId) {
      const mail: MailMessage = {
        id: `EL_DRAW_${Date.now()}`,
        sender: 'UEFA',
        role: 'Biuro Rozgrywek UEFA',
        subject: 'Zakończono losowanie Ligi Europy — Runda 1',
        body: 'Zakończono ceremonię losowania Rundy 1 Kwalifikacyjnej Ligi Europy UEFA. Zapraszamy do zapoznania się z wylosowanymi parami.',
        date: new Date(currentDate),
        isRead: false,
        type: MailType.SYSTEM,
        priority: 82,
      };
      setMessages(prev => [mail, ...prev]);
    }

    const nextDay = new Date(currentDate);
    nextDay.setDate(nextDay.getDate() + 1);
    setCurrentDate(nextDay);
    navigateTo(ViewState.DASHBOARD);
  };

  // ── Liga Konferencji: potwierdzenie losowania R1Q ────────────────────────
  const confirmCONFDraw = (pairs: Fixture[]) => {
    if (!activeCupDraw) return;

    // Zapisz pary (draw fixtures)
    setGlobalFixtures(prev => [...prev, ...pairs]);

    const year = currentDate.getFullYear();
    const matchFixtures: Fixture[] = [];

    pairs.forEach((pair, i) => {
      const pairNum = i + 1;
      matchFixtures.push({
        id: `CONF_R1Q_MATCH_${pairNum}_${year}`,
        leagueId: CompetitionType.CONF_R1Q,
        homeTeamId: pair.homeTeamId,
        awayTeamId: pair.awayTeamId,
        date: new Date(year, 6, 14),   // 14 lipca
        status: MatchStatus.SCHEDULED,
        homeScore: null,
        awayScore: null,
      });
      matchFixtures.push({
        id: `CONF_R1Q_MATCH_${pairNum}_${year}_RETURN`,
        leagueId: CompetitionType.CONF_R1Q_RETURN,
        homeTeamId: pair.awayTeamId,
        awayTeamId: pair.homeTeamId,
        date: new Date(year, 6, 17),  // 17 lipca
        status: MatchStatus.SCHEDULED,
        homeScore: null,
        awayScore: null,
      });
    });
    setGlobalFixtures(prev => [...prev, ...matchFixtures]);

    setProcessedDrawIds(prev => [...prev, activeCupDraw.id]);
    setActiveCupDraw(null);

    if (userTeamId) {
      const mail: MailMessage = {
        id: `CONF_DRAW_${Date.now()}`,
        sender: 'UEFA',
        role: 'Biuro Rozgrywek UEFA',
        subject: 'Zakończono losowanie Ligi Konferencji — Runda 1',
        body: 'Zakończono ceremonię losowania Rundy 1 Kwalifikacyjnej Ligi Konferencji UEFA. Zapraszamy do zapoznania się z wylosowanymi parami.',
        date: new Date(currentDate),
        isRead: false,
        type: MailType.SYSTEM,
        priority: 87,
      };
      setMessages(prev => [mail, ...prev]);
    }

    const nextDay = new Date(currentDate);
    nextDay.setDate(nextDay.getDate() + 1);
    setCurrentDate(nextDay);
    navigateTo(ViewState.DASHBOARD);
  };

  // ── Liga Konferencji: potwierdzenie losowania R2Q ───────────────────────
  const confirmCONFR2QDraw = (pairs: Fixture[]) => {
    if (!activeCupDraw) return;

    setGlobalFixtures(prev => [...prev, ...pairs]);

    const year = currentDate.getFullYear();
    const matchFixtures: Fixture[] = [];

    pairs.forEach((pair, i) => {
      const pairNum = i + 1;
      matchFixtures.push({
        id: `CONF_R2Q_MATCH_${pairNum}_${year}`,
        leagueId: CompetitionType.CONF_R2Q,
        homeTeamId: pair.homeTeamId,
        awayTeamId: pair.awayTeamId,
        date: new Date(year, 6, 28),   // 28 lipca
        status: MatchStatus.SCHEDULED,
        homeScore: null,
        awayScore: null,
      });
      matchFixtures.push({
        id: `CONF_R2Q_MATCH_${pairNum}_${year}_RETURN`,
        leagueId: CompetitionType.CONF_R2Q_RETURN,
        homeTeamId: pair.awayTeamId,
        awayTeamId: pair.homeTeamId,
        date: new Date(year, 7, 16),  // 16 sierpnia
        status: MatchStatus.SCHEDULED,
        homeScore: null,
        awayScore: null,
      });
    });
    setGlobalFixtures(prev => [...prev, ...matchFixtures]);

    setProcessedDrawIds(prev => [...prev, activeCupDraw.id]);
    setActiveCupDraw(null);

    if (userTeamId) {
      const mail: MailMessage = {
        id: `CONF_R2Q_DRAW_${Date.now()}`,
        sender: 'UEFA',
        role: 'Biuro Rozgrywek UEFA',
        subject: 'Zakończono losowanie Ligi Konferencji — Runda 2',
        body: 'Zakończono ceremonię losowania Rundy 2 Kwalifikacyjnej Ligi Konferencji UEFA. Zapraszamy do zapoznania się z wylosowanymi parami.',
        date: new Date(currentDate),
        isRead: false,
        type: MailType.SYSTEM,
        priority: 87,
      };
      setMessages(prev => [mail, ...prev]);
    }

    const nextDay = new Date(currentDate);
    nextDay.setDate(nextDay.getDate() + 1);
    setCurrentDate(nextDay);
    navigateTo(ViewState.DASHBOARD);
  };

  // ── Liga Europy: potwierdzenie losowania R2Q ─────────────────────────────
  const confirmELR2QDraw = (pairs: Fixture[]) => {

    setGlobalFixtures(prev => [...prev, ...pairs]);

    const year = currentDate.getFullYear();
    const matchFixtures: Fixture[] = [];

    pairs.forEach((pair, i) => {
      const pairNum = i + 1;
      matchFixtures.push({
        id: `EL_R2Q_MATCH_${pairNum}_${year}`,
        leagueId: CompetitionType.EL_R2Q,
        homeTeamId: pair.homeTeamId,
        awayTeamId: pair.awayTeamId,
        date: new Date(year, 7, 8),   // 8 sierpnia
        status: MatchStatus.SCHEDULED,
        homeScore: null,
        awayScore: null,
      });
      matchFixtures.push({
        id: `EL_R2Q_MATCH_${pairNum}_${year}_RETURN`,
        leagueId: CompetitionType.EL_R2Q_RETURN,
        homeTeamId: pair.awayTeamId,
        awayTeamId: pair.homeTeamId,
        date: new Date(year, 7, 15),  // 15 sierpnia
        status: MatchStatus.SCHEDULED,
        homeScore: null,
        awayScore: null,
      });
    });
    setGlobalFixtures(prev => [...prev, ...matchFixtures]);

    setProcessedDrawIds(prev => [...prev, activeCupDraw.id]);
    setActiveCupDraw(null);

    if (userTeamId) {
      const mail: MailMessage = {
        id: `EL_R2Q_DRAW_${Date.now()}`,
        sender: 'UEFA',
        role: 'Biuro Rozgrywek UEFA',
        subject: 'Zakończono losowanie Ligi Europy — Runda 2',
        body: 'Zakończono ceremonię losowania Rundy 2 Kwalifikacyjnej Ligi Europy UEFA. Zapraszamy do zapoznania się z wylosowanymi parami.',
        date: new Date(currentDate),
        isRead: false,
        type: MailType.SYSTEM,
        priority: 82,
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
    setClubs(prev => prev.map(c => c.id === userTeamId ? { 
      ...c, 
      budget: c.budget - bonus,
      financeHistory: [
        {
          id: Math.random().toString(36).substr(2, 9),
          date: currentDate.toISOString().split('T')[0],
          amount: -bonus,
          type: 'EXPENSE' as const,
          description: `Bonus za podpis: ${playerToSign.lastName}`
        },
        ...(c.financeHistory || [])
      ].slice(0, 50)
    } : c));

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
      const ev = CalendarEngine.getNextPlayerEvent(currentDate, userTeamId, tier, leagueSchedules, seasonTemplate, allFixtures, clubs);
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
      setMessages, pendingNegotiations, setPendingNegotiations, finalizeFreeAgentContract, europeanStatus, setEuropeanStatus,
            markMessageRead, deleteMessage, setActiveTrainingId, confirmCupDraw, confirmCLDraw, confirmELDraw, confirmELR2QDraw, confirmCONFDraw, confirmCONFR2QDraw, activeGroupDraw,
    confirmCLGroupDraw, confirmELGroupDraw, confirmELR16Draw, confirmCLQFDraw, confirmCLSFDraw, confirmCLR16Draw, confirmELQFDraw, confirmELSFDraw, confirmELFinalDraw, confirmCONFGroupDraw, confirmCONFR16Draw, confirmCONFQFDraw, confirmCONFSFDraw, confirmCONFFinalDraw, confirmSeasonEnd, clGroups, activeELGroupDraw, elGroups, activeConfGroupDraw, confGroups, processBackgroundCupMatches, processCLMatchDay, sessionSeed, updatePlayer, toggleTransferList, addFinanceLog, supercupWinners, addSupercupWinner, elHistoryInitialRound, setElHistoryInitialRound
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


