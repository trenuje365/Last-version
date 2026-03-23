
export enum ViewState {
  START_MENU = 'START_MENU',
  MANAGER_CREATION = 'MANAGER_CREATION',
  TEAM_SELECTION = 'TEAM_SELECTION',
  DASHBOARD = 'DASHBOARD',
  LEAGUE_TABLES = 'LEAGUE_TABLES',
  LEAGUE_STATS = 'LEAGUE_STATS',
  CALENDAR_DEBUG = 'CALENDAR_DEBUG',
  SQUAD_VIEW = 'SQUAD_VIEW',
  CLUB_DETAILS = 'CLUB_DETAILS',
  PLAYER_CARD = 'PLAYER_CARD',
  COACH_CARD = 'COACH_CARD',
  JOB_MARKET = 'JOB_MARKET',
  REFEREE_CARD = 'REFEREE_CARD',
  REFEREE_LIST = 'REFEREE_LIST',
  HIDDEN_LEAGUE = 'HIDDEN_LEAGUE',
  TRANSFER_WINDOW = 'TRANSFER_WINDOW',
  PRE_MATCH_STUDIO = 'PRE_MATCH_STUDIO',
  MATCH_LIVE = 'MATCH_LIVE',
  MATCH_PREVIEW = 'MATCH_PREVIEW',
  MATCH_POST = 'MATCH_POST',
  GAME_MANUAL = 'GAME_MANUAL',
  TRAINING_VIEW = 'TRAINING_VIEW',
  CUP_DRAW = 'CUP_DRAW',
  MATCH_HISTORY_BROWSER = 'MATCH_HISTORY_BROWSER',
  PRE_MATCH_CUP_STUDIO = 'PRE_MATCH_CUP_STUDIO',
  MATCH_LIVE_CUP = 'MATCH_LIVE_CUP',
  POST_MATCH_CUP_STUDIO = 'POST_MATCH_CUP_STUDIO',
  SCORE_RESULTS_POLISH_CUP = 'SCORE_RESULTS_POLISH_CUP',
  EDITOR = 'EDITOR',
  CONTRACT_MANAGEMENT = 'CONTRACT_MANAGEMENT',
  FREE_AGENT_NEGOTIATION = 'FREE_AGENT_NEGOTIATION',


  CL_DRAW = 'CL_DRAW',
  POLISH_CUP_BRACKET = 'POLISH_CUP_BRACKET',
  POLISH_CUP_FINALISTS = 'POLISH_CUP_FINALISTS',

  ///champions league 
  CHAMPIONS_LEAGUE_DRAW = 'CHAMPIONS_LEAGUE_DRAW',
  CL_R1Q = 'CL_R1Q',              // ← DODAJ: 1. mecz, Runda 1 Preeliminacyjna
  CL_R1Q_RETURN = 'CL_R1Q_RETURN', // ← DODAJ: Rewanż, Runda 1 Preeliminacyjna
   CL_R2Q_DRAW = 'CL_R2Q_DRAW',
  CL_R2Q = 'CL_R2Q',
  CL_R2Q_RETURN = 'CL_R2Q_RETURN',
  CL_GROUP_DRAW = 'CL_GROUP_DRAW',


   PRE_MATCH_CL_STUDIO = 'PRE_MATCH_CL_STUDIO',
  PRE_MATCH_CL_LIVE_STUDIO = 'PRE_MATCH_CL_LIVE_STUDIO',
  POST_MATCH_CL_STUDIO = 'POST_MATCH_CL_STUDIO',
  MATCH_LIVE_CL = 'MATCH_LIVE_CL',
  CL_BRACKET = 'CL_BRACKET',
  CL_HISTORY = 'CL_HISTORY',
  EL_DRAW = 'EL_DRAW',
  CONF_DRAW = 'CONF_DRAW',
  CONF_R2Q_DRAW = 'CONF_R2Q_DRAW',
  CONF_GROUP_DRAW = 'CONF_GROUP_DRAW',
  CONF_R16_DRAW = 'CONF_R16_DRAW',
  CONF_QF_DRAW = 'CONF_QF_DRAW',
  CONF_SF_DRAW = 'CONF_SF_DRAW',
  CONF_HISTORY = 'CONF_HISTORY',
  EL_R2Q_DRAW = 'EL_R2Q_DRAW',
  EL_GROUP_DRAW = 'EL_GROUP_DRAW',
  EL_R16_DRAW = 'EL_R16_DRAW',
  EL_QF_DRAW = 'EL_QF_DRAW',
  EL_SF_DRAW = 'EL_SF_DRAW',
  EL_FINAL_DRAW = 'EL_FINAL_DRAW',
  EL_HISTORY = 'EL_HISTORY',
  CL_R16_DRAW = 'CL_R16_DRAW',
  CL_QF_DRAW = 'CL_QF_DRAW',
  CL_SF_DRAW = 'CL_SF_DRAW',
  CL_FINAL_DRAW = 'CL_FINAL_DRAW',
  PRE_MATCH_CL_FINAL = 'PRE_MATCH_CL_FINAL',
  POST_MATCH_CL_FINAL = 'POST_MATCH_CL_FINAL',
  EUROPEAN_CLUBS = 'EUROPEAN_CLUBS'
}

export enum MailType {
  BOARD = 'BOARD',
  FANS = 'FANS',
  STAFF = 'STAFF',
  MEDIA = 'MEDIA',
  SYSTEM = 'SYSTEM',
  SCOUT = 'SCOUT'
}
export interface CoachAttributes {
  experience: number;
  decisionMaking: number;
  motivation: number;
  training: number;
}
export interface CoachHistoryEntry {
  clubName: string;
  clubId: string;
  fromYear: number;
  fromMonth: number;
  toYear: number | null; // null = obecnie pracuje
  toMonth: number | null;
}

export interface Coach {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  nationality: string;
  nationalityFlag: string;
  attributes: CoachAttributes;
  history: CoachHistoryEntry[];
  currentClubId: string | null;
  hiredDate: string; // ISO Date String
   blacklist: Record<string, number>;
}

export interface MailMessage {
  id: string;
  sender: string;
  role: string;
  subject: string;
  body: string;
  date: Date;
  isRead: boolean;
  type: MailType;
  priority: number;
   metadata?: {
    type: 'CONTRACT_OFFER';
    negotiationId: string;
    accepted: boolean;
    salary: number;
    years: number;
    bonus: number;
    responseDate: string; 
  status: NegotiationStatus;
  isAiOffer: boolean;
    playerId: string;
  };
}

export enum Region {
  POLAND = 'POLAND',
  BALKANS = 'BALKANS',
  CZ_SK = 'CZ_SK',
  SSA = 'SSA',
  IBERIA = 'IBERIA',
  SCANDINAVIA = 'SCANDINAVIA',
  EX_USSR = 'EX_USSR',
  SPAIN = 'SPAIN',
  ENGLAND = 'ENGLAND',
  GERMANY = 'GERMANY',
  ITALY = 'ITALY',
  FRANCE = 'FRANCE'
}

export enum PlayerPosition {
  GK = 'GK',
  DEF = 'DEF',
  MID = 'MID',
  FWD = 'FWD'
}

export enum HealthStatus {
  HEALTHY = 'HEALTHY',
  INJURED = 'INJURED'
}

export enum MatchStatus {
  SCHEDULED = 'SCHEDULED',
  FINISHED = 'FINISHED'
}

export enum InjurySeverity {
  LIGHT = 'LIGHT',
  SEVERE = 'SEVERE'
}

export enum EventKind {
  MATCH_LEAGUE = 'MATCH_LEAGUE',
  MATCH_SUPER_CUP = 'MATCH_SUPER_CUP',
  MATCH_FRIENDLY = 'MATCH_FRIENDLY',
  MATCH_POLISH_CUP = 'MATCH_POLISH_CUP',
  MATCH_EURO = 'MATCH_EURO',
  TRANSFER_WINDOW = 'TRANSFER_WINDOW',
  OFF_SEASON = 'OFF_SEASON',
  CL_DRAW = 'CL_DRAW',
  CUP_DRAW = 'CUP_DRAW',
  NONE = 'NONE'
}

export enum CompetitionType {
  LEAGUE = 'LEAGUE',
  POLISH_CUP = 'POLISH_CUP',
  SUPER_CUP = 'SUPER_CUP',
  EURO_CUP = 'EURO_CUP',
  BREAK = 'BREAK',
  OFF_SEASON = 'OFF_SEASON',
  TRANSFER_WINDOW = 'TRANSFER_WINDOW',
  FRIENDLY = 'FRIENDLY',
  BOARD = 'BOARD',
  CHAMPIONS_LEAGUE_DRAW = 'CHAMPIONS_LEAGUE_DRAW',
  CL_R1Q = 'CL_R1Q',
  CL_R1Q_RETURN = 'CL_R1Q_RETURN',
  CL_R2Q_DRAW = 'CL_R2Q_DRAW',
  CL_R2Q = 'CL_R2Q',
  CL_R2Q_RETURN = 'CL_R2Q_RETURN',
   CL_GROUP_DRAW = 'CL_GROUP_DRAW',
  CL_GROUP_STAGE = 'CL_GROUP_STAGE',
   CL_R16_DRAW = 'CL_R16_DRAW',
  CL_R16 = 'CL_R16',
  CL_R16_RETURN = 'CL_R16_RETURN',
   CL_QF_DRAW = 'CL_QF_DRAW',         // ← NOWE
  CL_QF = 'CL_QF',                   // ← NOWE
  CL_QF_RETURN = 'CL_QF_RETURN',  
   CL_SF_DRAW = 'CL_SF_DRAW',
  CL_SF = 'CL_SF',
  CL_SF_RETURN = 'CL_SF_RETURN',
  CL_FINAL = 'CL_FINAL',
  CL_FINAL_DRAW = 'CL_FINAL_DRAW',

  // ── Liga Europy UEFA ──────────────────────────────────────────────────────
  EL_R1Q_DRAW = 'EL_R1Q_DRAW',
  EL_R1Q = 'EL_R1Q',
  EL_R1Q_RETURN = 'EL_R1Q_RETURN',
  EL_R2Q_DRAW = 'EL_R2Q_DRAW',
  EL_R2Q = 'EL_R2Q',
  EL_R2Q_RETURN = 'EL_R2Q_RETURN',
  EL_GROUP_DRAW = 'EL_GROUP_DRAW',
  EL_GROUP_STAGE = 'EL_GROUP_STAGE',
  EL_R16_DRAW = 'EL_R16_DRAW',
  EL_R16 = 'EL_R16',
  EL_R16_RETURN = 'EL_R16_RETURN',
  EL_QF_DRAW = 'EL_QF_DRAW',
  EL_QF = 'EL_QF',
  EL_QF_RETURN = 'EL_QF_RETURN',
  EL_SF_DRAW = 'EL_SF_DRAW',
  EL_SF = 'EL_SF',
  EL_SF_RETURN = 'EL_SF_RETURN',
  EL_FINAL_DRAW = 'EL_FINAL_DRAW',
  EL_FINAL = 'EL_FINAL',

  // ── Liga Pucharu Konferencji UEFA ─────────────────────────────────────────
  CONF_R1Q_DRAW = 'CONF_R1Q_DRAW',
  CONF_R1Q = 'CONF_R1Q',
  CONF_R1Q_RETURN = 'CONF_R1Q_RETURN',
  CONF_R2Q_DRAW = 'CONF_R2Q_DRAW',
  CONF_R2Q = 'CONF_R2Q',
  CONF_R2Q_RETURN = 'CONF_R2Q_RETURN',
  CONF_GROUP_DRAW = 'CONF_GROUP_DRAW',
  CONF_GROUP_STAGE = 'CONF_GROUP_STAGE',
  CONF_R16_DRAW = 'CONF_R16_DRAW',
  CONF_R16 = 'CONF_R16',
  CONF_R16_RETURN = 'CONF_R16_RETURN',
  CONF_QF_DRAW = 'CONF_QF_DRAW',
  CONF_QF = 'CONF_QF',
  CONF_QF_RETURN = 'CONF_QF_RETURN',
  CONF_SF_DRAW = 'CONF_SF_DRAW',
  CONF_SF = 'CONF_SF',
  CONF_SF_RETURN = 'CONF_SF_RETURN',
}

export enum SlotType {
  WEEKEND = 'WEEKEND',
  MIDWEEK = 'MIDWEEK'
}

export enum CommentaryCategory {
  INTRO = 'INTRO',
  TACTICS = 'TACTICS',
  FORM = 'FORM',
  INJURIES = 'INJURIES',
  REFEREE = 'REFEREE',
  PREDICTION = 'PREDICTION',
  KEY_PLAYERS = 'KEY_PLAYERS',
  WEATHER = 'WEATHER'
}

export enum LeagueLevel {
  TIER_1 = 'TIER_1',
  TIER_2 = 'TIER_2',
  TIER_3 = 'TIER_3',
  TIER_4_HIDDEN = 'TIER_4_HIDDEN',
  EUROPEAN = 'EUROPEAN'
}

export interface PlayerAttributes {
  strength: number;
  stamina: number;
  pace: number;
  defending: number;
  passing: number;
  attacking: number;
  finishing: number;
  technique: number;
  vision: number;
  dribbling: number;
  heading: number;
  positioning: number;
  goalkeeping: number;
}

export interface PlayerStats {
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  cleanSheets: number;
  matchesPlayed: number;
  minutesPlayed: number;
  seasonalChanges: Record<string, number>;
  ratingHistory: number[]; 
}

// TUTAJ WSTAW TEN KOD:
export interface PlayerHistoryEntry {
  clubName: string;
  clubId: string | 'FREE_AGENTS';
  fromYear: number;
  fromMonth: number;
  toYear: number | null;
  toMonth: number | null;
}

export enum NegotiationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED'
}

export interface PendingNegotiation {
  id: string;
  playerId: string;
  clubId: string;
  salary: number;
  bonus: number;
  years: number;
  responseDate: string; // Data ISO, kiedy agent odpowie
  status: NegotiationStatus;
}

export interface Player {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  clubId: string;
  nationality: Region;
  position: PlayerPosition;
  overallRating: number;
  attributes: PlayerAttributes;
  stats: PlayerStats;
  health: {
    status: HealthStatus;
    injury?: {
      type: string;
      daysRemaining: number;
      severity?: InjurySeverity;
      injuryDate: string; // ISO Date string
      totalDays: number;
      conditionAtInjury?: number; // kondycja w momencie rejestracji kontuzji
    };
  };
  condition: number;
  suspensionMatches: number;
  contractEndDate: string; // Data w formacie ISO
  annualSalary: number;    // Kwota roczna w PLN
  isOnTransferList?: boolean;
  marketValue?: number;
   history: PlayerHistoryEntry[];
    boardLockoutUntil: string | null; // Data ISO, do której nie można ponowić próby zwolnienia
  isUntouchable: boolean;           
  negotiationStep: number;           // Licznik prób (0-3)
  negotiationLockoutUntil: string | null; // Blokada czasowa negocjacji
  contractLockoutUntil: string | null;
  fatigueDebt: number; 
  isNegotiationPermanentBlocked: boolean; // Czy zawodnik obraził się na amen
  transferLockoutUntil: string | null;
  freeAgentLockoutUntil: string | null;
  /** Lista ID klubów aktualnie zainteresowanych pozyskaniem tego zawodnika (aktualizowana ~1x/miesiąc przez AI) */
  interestedClubs?: string[];
}

export interface TeamStats {
  points: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  played: number;
  form: ('W' | 'R' | 'P')[];
}

export interface FinanceLog {
  id: string;
  date: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  description: string;
  previousBalance?: number; // Saldo przed operacją
}

export interface Club {
  id: string;
  name: string;
  shortName: string;
  leagueId: string;
  colorsHex: string[];
  stadiumName: string;
  stadiumCapacity: number;
  reputation: number;
  isDefaultActive: boolean;
  colorPrimary?: string;
  colorSecondary?: string;
  rosterIds: string[];
  coachId?: string;
  stats: TeamStats;
  isInPolishCup?: boolean;
  budget: number; 
  boardStrictness: number;
  signingBonusPool: number; // Pula pieniędzy zarezerwowana tylko na bonusy za podpis
  squadNeeds?: Record<string, number>; 
  financeHistory?: FinanceLog[];
}

export interface EuropeanStatus {
  isInChampionsLeague: boolean;
  isInEuropeanLeague: boolean;
  isInConferenceLeague: boolean;
  isInChampionsLeagueNextPhase: boolean;
  isInEuropeanLeagueNextPhase: boolean;
  isInConferenceLeagueNextPhase: boolean;
}



export interface NationalTeam {
  id: string;
  name: string;
  continent: string;
  tier: number;
  colorsHex: string[];
  stadiumName: string;
  stadiumCapacity: number;
  reputation: number;
}
export interface League {
  id: string;
  name: string;
  level: LeagueLevel;
  teamIds: string[];
}

export interface Fixture {
  id: string;
  leagueId: string | CompetitionType;
  homeTeamId: string;
  awayTeamId: string;
  date: Date;
  status: MatchStatus;
  homeScore: number | null;
  awayScore: number | null;
  // Cup specific metadata
  homePenaltyScore?: number;
  awayPenaltyScore?: number;
  attendance?: number;
}

export interface Lineup {
  clubId: string;
  tacticId: string;
  startingXI: (string | null)[];
  bench: string[];
  reserves: string[];
}

export interface Tactic {
  id: string;
  name: string;
  category: string;
  attackBias: number;
  defenseBias: number;
  pressingIntensity: number;
  slots: {
    index: number;
    role: PlayerPosition;
    x: number;
    y: number;
  }[];
}

export enum MatchEventType {
  SHOT = 'SHOT',
  SHOT_ON_TARGET = 'SHOT_ON_TARGET',
  CORNER = 'CORNER',
  FOUL = 'FOUL',
  OFFSIDE = 'OFFSIDE',
  PENALTY_AWARDED = 'PENALTY_AWARDED',
  PENALTY_SCORED = 'PENALTY_SCORED',
  PENALTY_MISSED = 'PENALTY_MISSED',
  GOAL = 'GOAL',
  PRESSURE = 'PRESSURE',
  SAVE = 'SAVE',
  YELLOW_CARD = 'YELLOW_CARD',
  RED_CARD = 'RED_CARD',
  INJURY_LIGHT = 'INJURY_LIGHT',
  INJURY_SEVERE = 'INJURY_SEVERE',
  SUBSTITUTION = 'SUBSTITUTION',
  GENERIC = 'GENERIC',
  THROW_IN = 'THROW_IN',
  FREE_KICK = 'FREE_KICK',
  FREE_KICK_DANGEROUS = 'FREE_KICK_DANGEROUS',
  SHOT_POST = 'SHOT_POST',
  SHOT_BAR = 'SHOT_BAR',
  HANDBALL = 'HANDBALL',
  FOUL_JERSEY = 'FOUL_JERSEY',
  FOUL_PUSH = 'FOUL_PUSH',
  WINGER_STOPPED = 'WINGER_STOPPED',
  CROSS_NEAR_POST = 'CROSS_NEAR_POST',
  CROSS_FAR_POST = 'CROSS_FAR_POST',
  ONE_ON_ONE_GOAL = 'ONE_ON_ONE_GOAL',
  ONE_ON_ONE_MISS = 'ONE_ON_ONE_MISS',
  ONE_ON_ONE_SAVE = 'ONE_ON_ONE_SAVE',
  DRIBBLING = 'DRIBBLING',
  STUMBLE = 'STUMBLE',
  MISPLACED_PASS = 'MISPLACED_PASS',
  BLUNDER = 'BLUNDER',
  GK_LONG_THROW = 'GK_LONG_THROW',
  MIDFIELD_CONTROL = 'MIDFIELD_CONTROL',
  PLAY_LEFT = 'PLAY_LEFT',
  PLAY_RIGHT = 'PLAY_RIGHT',
  PLAY_BACK = 'PLAY_BACK',
  PLAY_SIDE = 'PLAY_SIDE'
}

export interface MatchLogEntry {
  id: string;
  minute: number;
  text: string;
  teamSide?: 'HOME' | 'AWAY';
  type: MatchEventType;
  playerName?: string;
}

export interface MatchEvent {
  minute: number;
  teamSide: 'HOME' | 'AWAY';
  type: MatchEventType;
  primaryPlayerId?: string;
  secondaryPlayerId?: string;
  text: string;
}

export interface GoalTickerInfo {
  playerName: string;
  scorerId?: string;
  minute: number;
  isPenalty: boolean;
  isMiss?: boolean;
  varDisallowed?: boolean;
  assistantName?: string;
  assistantId?: string;
}
export type InstructionTempo = 'SLOW' | 'NORMAL' | 'FAST';
export type InstructionMindset = 'DEFENSIVE' | 'NEUTRAL' | 'OFFENSIVE';
export type InstructionIntensity = 'CAUTIOUS' | 'NORMAL' | 'AGGRESSIVE';

export interface TacticalInstructions {
  tempo: InstructionTempo;
  mindset: InstructionMindset;
  intensity: InstructionIntensity;
  lastChangeMinute: number;
  expiryMinute: number; 
  tempoExpiry: number;
  mindsetExpiry: number;
  intensityExpiry: number;
  tempoCooldown: number;
  mindsetCooldown: number;
  intensityCooldown: number;
  tempoResponseFactor: number;
  mindsetResponseFactor: number;
  intensityResponseFactor: number;
}
export interface SubstitutionRecord {
  playerOutId: string;
  playerInId: string;
  minute: number;
}

export interface RetirementInfo {
  oldPlayerName: string;
  oldPlayerAge: number;
  newPlayerName: string;
  newPlayerOverall: number;
  clubId: string;
}

export interface MatchLiveState {
  fixtureId: string;
  minute: number;
  period: 1 | 2 | 3 | 4 | 5; // 1,2: Reg, 3,4: ET, 5: Pens
  addedTime: number;
  isPaused: boolean;
  isPausedForEvent: boolean;
  isHalfTime: boolean;
  isFinished: boolean;
  speed: 1 | 2.5 | 3.5 | 5;
  momentum: number;
  momentumPulse: number; 
  homeScore: number;
  awayScore: number;
  homeLineup: Lineup;
  awayLineup: Lineup;
  homeFatigue: Record<string, number>;
  awayFatigue: Record<string, number>;
  playedPlayerIds: string[];
  homeInjuries: Record<string, InjurySeverity>;
  awayInjuries: Record<string, InjurySeverity>;
  playerYellowCards: Record<string, number>;
  sentOffIds: string[];
  homeRiskMode: Record<string, boolean>;
  awayRiskMode: Record<string, boolean>;
  homeUpgradeProb: Record<string, number>;
  awayUpgradeProb: Record<string, number>;
  homeInjuryMin: Record<string, number>;
  awayInjuryMin: Record<string, number>;
  subsCountHome: number;
  subsCountAway: number;
  homeSubsHistory: SubstitutionRecord[];
  awaySubsHistory: SubstitutionRecord[];
  lastAiActionMinute: number;
  aiTacticLocked?: boolean;
  logs: MatchLogEntry[];
  events: MatchEvent[];
  homeGoals: GoalTickerInfo[];
  awayGoals: GoalTickerInfo[];
  flashMessage: string | null;
  sessionSeed: number;
  tacticalImpact: number;
  
  // KO Specific
  isExtraTime?: boolean;
isPenalties?: boolean;
  homePenaltyScore?: number;
  awayPenaltyScore?: number;
  penaltySequence?: { side: 'HOME' | 'AWAY', result: 'SCORED' | 'MISSED' }[];
  // -> tutaj wstaw kod
  aiActiveShout: { 
    id: string; 
    expiryMinute: number; 
    mindset: InstructionMindset; 
    tempo: InstructionTempo; 
    intensity: InstructionIntensity;
    isExpired?: boolean;
  } | null;
  lastGoalBoostMinute: number;
    activeTacticalBoost: number; // Suma aktualnie dodanego momentum (do zwrotu)
  tacticalBoostExpiry: number; // Minuta, w której impuls wygasa i wraca
   liveStats: {
    home: { shots: number; shotsOnTarget: number; corners: number; fouls: number; offsides: number };
    away: { shots: number; shotsOnTarget: number; corners: number; fouls: number; offsides: number };
  };
  momentumSum: number;
  momentumTicks: number;
  // KONIEC WSTAWKI
  // Post-goal suppression + comeback (CUP engine)
  postGoalSuppressionDuration?: number;
  postGoalPenaltyPct?: number;
  comebackPower?: number;
  comebackExpiry?: number;
  comebackSide?: 'HOME' | 'AWAY' | null;
  userInstructions: TacticalInstructions;
}

export interface MatchSummaryTeamStats {
  shots: number;
  shotsOnTarget: number;
  corners: number;
  fouls: number;
  offsides: number;
  yellowCards: number;
  redCards: number;
  possession: number;
}

export interface PlayerPerformance {
  playerId: string;
  name: string;
  position: PlayerPosition;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  missedPenalties: number;
  savedPenalties: number;
  healthStatus: HealthStatus;
  injuryDays?: number;
  fatigue: number;
  rating?: number;
}

export interface MatchSummaryEvent {
  minute: number;
  type: MatchEventType;
  playerName: string;
  assistantName?: string;
  teamSide: 'HOME' | 'AWAY';
  scoreAtMoment?: string;
  varDisallowed?: boolean;
}

export interface MatchSummary {
  matchId: string;
  userTeamId: string;
  homeClub: Club;
  awayClub: Club;
  homeScore: number;
  awayScore: number;
  homeGoals: GoalTickerInfo[];
  awayGoals: GoalTickerInfo[];
  homeStats: MatchSummaryTeamStats;
  awayStats: MatchSummaryTeamStats;
  homePlayers: PlayerPerformance[];
  awayPlayers: PlayerPerformance[];
  timeline: MatchSummaryEvent[];
  attendance?: number;
  // KO Info
  homePenaltyScore?: number;
  awayPenaltyScore?: number;
  isExtraTime?: boolean;
}

export interface MatchResult {
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  homeColors: string[];
  awayColors: string[];
  // KO Result
  homePenaltyScore?: number;
  awayPenaltyScore?: number;
  isExtraTime?: boolean;
}
export interface MatchHistoryEntry {
  matchId: string;
  date: string;
  season: number; 
  competition: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  homePenaltyScore?: number;
  awayPenaltyScore?: number;
  attendance?: number;
  goals: { playerName: string; minute: number; teamId: string; isPenalty: boolean }[];
  cards: { playerName: string; minute: number; teamId: string; type: 'YELLOW' | 'RED' | 'SECOND_YELLOW' }[];
}
export interface LeagueRoundResults {
  dateKey: string;
  league1Results: MatchResult[];
  league2Results: MatchResult[];
  league3Results: MatchResult[];
}

export interface CalendarSlot {
  id: string;
  start: Date;
  end: Date;
  slotType: SlotType;
  competition: CompetitionType;
  label: string;
  priority: number;
  metadata?: any;
}

export interface SeasonTemplate {
  seasonStartYear: number;
  careerStartDate: Date;
  slots: CalendarSlot[];
}

export interface Matchday {
  roundNumber: number;
  start: Date;
  end: Date;
  slotType: SlotType;
  fixtures: Fixture[];
}

export interface LeagueSchedule {
  seasonStartYear: number;
  leagueTier: number;
  matchdays: Matchday[];
}

export interface PlayerNextEvent {
  startDate: Date;
  endDate: Date;
  kind: EventKind;
  label: string;
  competition?: CompetitionType;
  opponentClubId?: string;
  isHome?: boolean;
}

export interface Referee {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  nationality: Region;
  strictness: number;
  consistency: number;
  advantageTendency: number;
  matchRatings: number[];
  totalYellowCardsShown: number;
  totalRedCardsShown: number;
  experience: number; // DOŚWIADCZENIE SĘDZIEGO
}

export interface WeatherSnapshot {
  tempC: number;
  precipitationChance: number;
  windKmh: number;
  description: string;
}

export interface OddsSnapshot {
  homeWin: string;
  draw: string;
  awayWin: string;
}

export interface PreMatchContext {
  competitionType: CompetitionType;
  importanceTier: number;
  tableGap: number;
  seasonPhase: 'START' | 'MID' | 'END';
  homeForm: string;
  awayForm: string;
  underdogFlag: boolean;
  injuryCountHome: number;
  injuryCountAway: number;
}

export interface StudioLine {
  speaker: string;
  category: CommentaryCategory;
  text: string;
}

export interface PreMatchStudioData {
  fixture: Fixture;
  homeClub: Club;
  awayClub: Club;
  homeLineup: Lineup;
  awayLineup: Lineup;
  homePlayers: Player[];
  awayPlayers: Player[];
  weather: WeatherSnapshot;
  referee: Referee;
  odds: OddsSnapshot | null;
  studioTranscript: StudioLine[];
}

export interface MatchContext {
  fixture: Fixture;
  homeClub: Club;
  awayClub: Club;
  homePlayers: Player[];
  awayPlayers: Player[];
  homeAdvantage: boolean;
  competition: CompetitionType;
}

export interface StatRow {
  player: Player;
  club: Club;
}

export interface ManagerProfile {
  firstName: string;
  lastName: string;
  age: number;
  nationality: string;
  nationalityFlag: string;
}

export interface TrainingCycle {
  id: string;
  name: string;
  description: string;
  icon: string;
  primaryAttributes: (keyof PlayerAttributes)[];
  secondaryAttributes: (keyof PlayerAttributes)[];
  fatigueRisk: number; // 0.0 - 1.0
  recoveryBonus?: number; // 0.0 - 1.0
}

export enum TrainingIntensity {
  LIGHT = 'LIGHT',
  NORMAL = 'NORMAL',
  HEAVY = 'HEAVY'
}
