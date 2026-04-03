
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
  TRANSFER_OFFER = 'TRANSFER_OFFER',
  TRANSFER_PLAYER_NEGOTIATION = 'TRANSFER_PLAYER_NEGOTIATION',
  INCOMING_OFFER = 'INCOMING_OFFER',


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
  CONF_FINAL_DRAW = 'CONF_FINAL_DRAW',
  EL_HISTORY = 'EL_HISTORY',
  CL_R16_DRAW = 'CL_R16_DRAW',
  CL_QF_DRAW = 'CL_QF_DRAW',
  CL_SF_DRAW = 'CL_SF_DRAW',
  CL_FINAL_DRAW = 'CL_FINAL_DRAW',
  PRE_MATCH_CL_FINAL = 'PRE_MATCH_CL_FINAL',
  POST_MATCH_CL_FINAL = 'POST_MATCH_CL_FINAL',
  EUROPEAN_CLUBS = 'EUROPEAN_CLUBS',
  TRANSFER_NEWS = 'TRANSFER_NEWS',
  PRE_MATCH_EL_STUDIO = 'PRE_MATCH_EL_STUDIO',
  PRE_MATCH_EL_LIVE_STUDIO = 'PRE_MATCH_EL_LIVE_STUDIO',
  MATCH_LIVE_EL = 'MATCH_LIVE_EL',
  POST_MATCH_EL_STUDIO = 'POST_MATCH_EL_STUDIO',
  PRE_MATCH_CONF_STUDIO = 'PRE_MATCH_CONF_STUDIO',
  PRE_MATCH_CONF_LIVE_STUDIO = 'PRE_MATCH_CONF_LIVE_STUDIO',
  MATCH_LIVE_CONF = 'MATCH_LIVE_CONF',
  POST_MATCH_CONF_STUDIO = 'POST_MATCH_CONF_STUDIO',
  // Wyniki meczów reprezentacji (wszystkie mecze grupy danego dnia)
  NATIONAL_TEAM_RESULTS = 'NATIONAL_TEAM_RESULTS',
  PLAYOFF_DRAW = 'PLAYOFF_DRAW',
  PROMOTION_PLAYOFF_SEMI_VIEW = 'PROMOTION_PLAYOFF_SEMI_VIEW',
  PROMOTION_PLAYOFF_FINAL_VIEW = 'PROMOTION_PLAYOFF_FINAL_VIEW',
  // ── BARAŻE O UTRZYMANIE ─────────────────────────────────────────────────
  RELEGATION_PLAYOFF_MATCH_1 = 'RELEGATION_PLAYOFF_MATCH_1', // 26 maja — widok wyników 1. meczów
  RELEGATION_PLAYOFF_MATCH_2 = 'RELEGATION_PLAYOFF_MATCH_2', // 29 maja — widok wyników rewanży + rozstrzygnięcie
}

export interface PlayoffPair {
  homeId: string;
  awayId: string;
  homePos: number;
  awayPos: number;
}
export interface ActivePlayoffDraw {
  ekstraklasaPlayoffs: PlayoffPair[];
  ligaOnePlayoffs: PlayoffPair[];
  relegationPlayoffs: PlayoffPair[];
}

// ── BARAŻE O UTRZYMANIE — typy wyników ─────────────────────────────────────

// Wynik jednego meczu barażowego
export interface RelegationPlayoffLegResult {
  homeId: string;  // ID drużyny gospodarzy
  awayId: string;  // ID drużyny gości
  homeGoals: number;
  awayGoals: number;
}

// Wyniki rzutów karnych (gdy dwumecz zakończy się remisem)
export interface RelegationPlayoffPenalties {
  winnerId: string; // ID drużyny, która wygrała karne
  homeShots: number;
  awayShots: number;
}

// Wyniki 1. meczów (26 maja) — przechowywane w stanie gry do obliczenia agregatu
export interface RelegationPlayoffFirstLegResults {
  pair0: RelegationPlayoffLegResult; // 13. miejsce 2.Ligi vs los. 3.Liga
  pair1: RelegationPlayoffLegResult; // 14. miejsce 2.Ligi vs los. 3.Liga
}

// Pełny wynik jednej pary (po obu meczach)
export interface RelegationPlayoffPairOutcome {
  leg1: RelegationPlayoffLegResult;
  leg2: RelegationPlayoffLegResult;
  winnerId: string;  // ID zwycięzcy dwumeczu
  loserId: string;   // ID przegranego dwumeczu
  decidedBy: 'AGGREGATE' | 'PENALTIES'; // jak rozstrzygnięto
  penalties?: RelegationPlayoffPenalties;
}

// Finalny wynik barażów (po 29 maja) — używany do aktualizacji lig w startNextSeason
export interface RelegationPlayoffFinalResult {
  pair0: RelegationPlayoffPairOutcome;
  pair1: RelegationPlayoffPairOutcome;
}

// Wynik pojedynczego meczu barażowego o awans (półfinał lub finał)
export interface PromotionPlayoffSingleMatchResult {
  homeId: string;
  awayId: string;
  homeGoals: number;
  awayGoals: number;
  decidedBy: 'REGULAR' | 'EXTRA_TIME' | 'PENALTIES';
  penalties?: {
    winnerId: string;
    homeShots: number;
    awayShots: number;
  };
  winnerId: string;
}

// Wyniki półfinałów z 31 maja — potrzebne do wyłonienia finalistów 4 czerwca
export interface PromotionPlayoffSemiResults {
  ekstraklasaSemi0: PromotionPlayoffSingleMatchResult;
  ekstraklasaSemi1: PromotionPlayoffSingleMatchResult;
  ligaOneSemi0: PromotionPlayoffSingleMatchResult;
  ligaOneSemi1: PromotionPlayoffSingleMatchResult;
}

// Wyniki finałów z 4 czerwca — używane do zmian ligowych w startNextSeason
export interface PromotionPlayoffFinalResults {
  ekstraklasaFinal: PromotionPlayoffSingleMatchResult;
  ligaOneFinal: PromotionPlayoffSingleMatchResult;
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
  currentNationalTeamId?: string | null;
  isNationalTeamCoach?: boolean;
  hiredDate: string; // ISO Date String
   blacklist: Record<string, number>;
  favoriteTactics: {
    offensive: string;
    neutral: string;
    defensive: string;
  };
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
    demands?: {
      salary: number;
      bonus: number;
    } | null;
  } | {
    type: 'INCOMING_TRANSFER_OFFER';
    offerId: string;
  };
}

export enum Region {
  POLAND = 'POLAND',
  BALKANS = 'BALKANS',
  CZ_SK = 'CZ_SK',
  SSA = 'SSA',
  IBERIA = 'IBERIA',
  MEXICO = 'MEXICO',
  SWEDEN = 'SWEDEN',
  SCANDINAVIA = 'SCANDINAVIA',
  EX_USSR = 'EX_USSR',
  SPAIN = 'SPAIN',
  ENGLAND = 'ENGLAND',
  GERMANY = 'GERMANY',
  ITALY = 'ITALY',
  FRANCE = 'FRANCE',
  JAPAN = 'JAPAN',
  KOREA = 'KOREA',
  ARGENTINA = 'ARGENTINA',
  BRAZIL = 'BRAZIL',
  TURKEY = 'TURKEY',
  ARABIA = 'ARABIA',
  FINLAND = 'FINLAND',
  GEORGIA = 'GEORGIA',
  ARMENIA = 'ARMENIA',
  ALBANIA = 'ALBANIA',
  ROMANIA = 'ROMANIA',
  BALTIC = 'BALTIC',
  BENELUX = 'BENELUX',
  HUNGARIAN = 'HUNGARIAN',
  MALTESE = 'MALTESE',
  ISRAELI = 'ISRAELI',
  GREEK = 'GREEK',
  AZERBAIJANI = 'AZERBAIJANI',
  KAZAKH = 'KAZAKH',
  SOUTH_AMERICAN = 'SOUTH_AMERICAN'
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
  // Dzień meczowy reprezentacji (symulacja w tle, gracz widzi wyniki)
  NATIONAL_TEAM_MATCH = 'NATIONAL_TEAM_MATCH',
  PLAYOFF_DRAW = 'PLAYOFF_DRAW',
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
  CONF_FINAL_DRAW = 'CONF_FINAL_DRAW',
  CONF_FINAL = 'CONF_FINAL',
  PLAYOFF_DRAW_CEREMONY = 'PLAYOFF_DRAW_CEREMONY',
  PROMOTION_PLAYOFF_31_MAY = 'PROMOTION_PLAYOFF_31_MAY',
  PROMOTION_PLAYOFF_4_JUNE = 'PROMOTION_PLAYOFF_4_JUNE',
  // ── BARAŻE O UTRZYMANIE ─────────────────────────────────────────────────
  RELEGATION_PLAYOFF_1 = 'RELEGATION_PLAYOFF_1', // 26 maja — 1. mecze (13. i 14. 2.Ligi vs 3.Liga)
  RELEGATION_PLAYOFF_2 = 'RELEGATION_PLAYOFF_2', // 29 maja — rewanże + rozstrzygnięcie
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
  freeKicks: number;
  talent: number;
  penalties: number;
  corners: number;
  aggression: number;
  crossing: number;
  leadership: number;
  mentality: number;
  workRate: number;
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

export enum TransferOfferStatus {
  SELLER_REVIEW = 'SELLER_REVIEW',
  SELLER_REJECTED = 'SELLER_REJECTED',
  SELLER_COUNTERED = 'SELLER_COUNTERED',
  SELLER_ACCEPTED = 'SELLER_ACCEPTED',
  PLAYER_NEGOTIATION = 'PLAYER_NEGOTIATION',
  PLAYER_REJECTED = 'PLAYER_REJECTED',
  READY_TO_FINALIZE = 'READY_TO_FINALIZE',
  AGREED_PRECONTRACT = 'AGREED_PRECONTRACT',
  COMPLETED = 'COMPLETED'
}

export enum TransferTiming {
  IMMEDIATE = 'IMMEDIATE',
  IN_SIX_MONTHS = 'IN_SIX_MONTHS',
  IN_TWELVE_MONTHS = 'IN_TWELVE_MONTHS',
  CONTRACT_END = 'CONTRACT_END'
}

export interface TransferOffer {
  id: string;
  playerId: string;
  sellerClubId: string;
  buyerClubId: string;
  fee: number;
  timing: TransferTiming;
  salary?: number;
  bonus?: number;
  years?: number;
  createdAt: string;
  status: TransferOfferStatus;
  effectiveDate?: string;
  askingPrice?: number;
  sellerReason?: string;
  playerReason?: string;
  attemptNumber: number;
  maxAttempts: number;
}

export interface TransferClubBidInput {
  fee: number;
  timing: TransferTiming;
}

export enum IncomingOfferStatus {
  EMAIL_SENT = 'EMAIL_SENT',
  REMINDER_SENT = 'REMINDER_SENT',
  EXPIRED = 'EXPIRED',
  REJECTED_BY_MANAGER = 'REJECTED_BY_MANAGER',
  COUNTER_PENDING_AI = 'COUNTER_PENDING_AI',
  AI_COUNTERED = 'AI_COUNTERED',
  NEGOTIATION_IN_PROGRESS = 'NEGOTIATION_IN_PROGRESS',
  AWAITING_CONFIRMATION = 'AWAITING_CONFIRMATION',
  PLAYER_REFUSED = 'PLAYER_REFUSED',
  COMPLETED = 'COMPLETED',
  REJECTED_AT_CONFIRM = 'REJECTED_AT_CONFIRM',
}

export interface IncomingTransferOffer {
  id: string;
  playerId: string;
  buyerClubId: string;
  fee: number;
  timing: TransferTiming;
  status: IncomingOfferStatus;
  createdAt: string;
  emailSentAt: string;
  reminderSentAt?: string;
  aiMaxFee: number;
  aiUrgency: 1 | 2 | 3;
  counterFee?: number;
  aiCounterFee?: number;
  negotiationRound: number;
  playerNegotiationStartedAt?: string;
  playerNegotiationResolvesAt?: string;
  playerNegotiationResult?: 'accepted' | 'refused';
  boardPressure: boolean;
}

export interface TransferContractInput {
  salary: number;
  bonus: number;
  years: number;
}

export interface TransferOfferSubmissionResult {
  ok: boolean;
  status: TransferOfferStatus | 'VALIDATION_ERROR';
  message: string;
  offer?: TransferOffer;
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
  transferOfferBanUntil?: string | null;
  freeAgentLockoutUntil: string | null;
  freeAgentClubLockouts?: Record<string, string>;
  assignedNationalTeamId?: string | null;
  /** Lista ID klubów aktualnie zainteresowanych pozyskaniem tego zawodnika (aktualizowana ~1x/miesiąc przez AI) */
  interestedClubs?: string[];
  /** ID klubu AI który aktualnie negocjuje z tym wolnym agentem */
  aiNegotiationClubId?: string;
  /** Data ISO do której klub AI czeka na odpowiedź agenta (okno 4 dni dla gracza) */
  aiNegotiationResponseDate?: string;
  /** ID klubu AI który kupuje zawodnika z listy transferowej — tag TRSF, blokuje inne oferty */
  transferPendingClubId?: string;
  /** Data ISO kiedy zawodnik "melduje się" w nowym klubie (currentDate + 3 dni) */
  transferReportDate?: string;
  trainingFocus?: keyof PlayerAttributes | null;
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
  tier?: number;
  colorsHex: string[];
  stadiumName: string;
  stadiumCapacity: number;
  reputation: number;
  country?: string;
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
  captainId?: string | null;
  penaltyTakerId?: string | null;
  freeKickTakerId?: string | null;
  financeHistory?: FinanceLog[];
  europeanBonusPoints?: number;
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
  region: Region;
  coachId: string | null;
  squadPlayerIds: string[];
  tacticId: string | null;
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
export type InstructionPassing = 'SHORT' | 'MIXED' | 'LONG';
export type InstructionPressing = 'NORMAL' | 'PRESSING';

export interface TacticalInstructions {
  tempo: InstructionTempo;
  mindset: InstructionMindset;
  intensity: InstructionIntensity;
  passing: InstructionPassing;
  pressing: InstructionPressing;
  lastChangeMinute: number;
  expiryMinute: number;
  tempoExpiry: number;
  mindsetExpiry: number;
  intensityExpiry: number;
  tempoCooldown: number;
  mindsetCooldown: number;
  intensityCooldown: number;
  passingCooldown: number;
  pressingCooldown: number;
  tempoResponseFactor: number;
  mindsetResponseFactor: number;
  intensityResponseFactor: number;
  passingResponseFactor: number;
  pressingResponseFactor: number;
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
  halftimeTalkApplied?: boolean;
  halftimeMomentumBonus?: number;
  oppHalftimeMomentumBonus?: number;
  aiNextInstructionMinute?: number;
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
export interface MatchGoalEntry {
  playerId?: string;
  playerName: string;
  minute: number;
  teamId: string;
  isPenalty: boolean;
  assistantId?: string;
  assistantName?: string;
}

export interface MatchCardEntry {
  playerId?: string;
  playerName: string;
  minute: number;
  teamId: string;
  type: 'YELLOW' | 'RED' | 'SECOND_YELLOW';
}

export interface MatchSubstitutionEntry {
  playerOutId?: string;
  playerOutName: string;
  playerInId?: string;
  playerInName: string;
  minute: number;
  teamId: string;
}

export interface MatchInjuryEntry {
  playerId?: string;
  playerName: string;
  minute: number;
  teamId: string;
  severity: InjurySeverity;
  days: number;
  type: string;
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
  venue?: string;
  weather?: WeatherSnapshot;
  addedTime?: number;
  goals: MatchGoalEntry[];
  cards: MatchCardEntry[];
  substitutions?: MatchSubstitutionEntry[];
  injuries?: MatchInjuryEntry[];
  timeline?: MatchEvent[];
}
export interface LeagueRoundResults {
  dateKey: string;
  league1Results: MatchResult[];
  league2Results: MatchResult[];
  league3Results: MatchResult[];
}

/**
 * Wynik pojedynczego meczu reprezentacji po symulacji w tle.
 * Przechowywany w GameContext.lastNTMatchResults i wyświetlany w NationalTeamResultsView.
 */
export interface NTMatchResult {
  /** Nazwa drużyny gospodarza (zgodna z NationalTeamSchedule.ts). */
  home: string;
  /** Nazwa drużyny gościa (zgodna z NationalTeamSchedule.ts). */
  away: string;
  /** Gole strzelone przez gospodarza. */
  homeGoals: number;
  /** Gole strzelone przez gościa. */
  awayGoals: number;
  /** Etykieta rozgrywek wyświetlana graczowi, np. "Kwalifikacje MŚ 2026 – Gr. A". */
  competitionLabel: string;
  /** Trwale identyfikowalny identyfikator meczu. */
  matchId?: string;
  /** Id gospodarza i goscia w modelu NationalTeam. */
  homeTeamId?: string;
  awayTeamId?: string;
  /** Stadion i warunki meczu. */
  venue?: string;
  attendance?: number;
  weather?: WeatherSnapshot;
  addedTime?: number;
  /** Szczegolowa historia meczu. */
  goals?: MatchGoalEntry[];
  cards?: MatchCardEntry[];
  substitutions?: MatchSubstitutionEntry[];
  injuries?: MatchInjuryEntry[];
  timeline?: MatchEvent[];
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
  weatherIntensity?: number; // 0.0 = brak wpływu, 1.0 = ekstremalne warunki
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
