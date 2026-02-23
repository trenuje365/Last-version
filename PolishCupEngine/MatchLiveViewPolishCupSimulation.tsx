import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { 
  ViewState, MatchLiveState, MatchContext, MatchEventType, 
  Player, HealthStatus, MatchSummary, MatchSummaryEvent, MatchResult,
  Lineup, PlayerPerformance, InjurySeverity, PlayerPosition,
  MatchStatus, SubstitutionRecord, MatchLogEntry,
TacticalInstructions
} from '../types';
import { MatchEngineService } from '../services/MatchEngineService';
import { MomentumService as MomentumServiceCup } from '../services/MomentumSeriveCup';
import { TacticRepository } from '../resources/tactics_db';
import { PlayerPresentationService } from '../services/PlayerPresentationService';
import { GoalAttributionService } from '../services/GoalAttributionService';
import { BackgroundMatchProcessor } from '../services/BackgroundMatchProcessor';
import { RefereeService } from '../services/RefereeService';
import { PolandWeatherService } from '../services/PolandWeatherService';
import { KitSelectionService } from '../services/KitSelectionService';
import { MATCH_COMMENTARY_DB } from '../data/match_commentary_pl';
import { DisciplineService } from '../services/DisciplineService';
import { PostMatchCommentSelector } from './PostMatchCommentSelector';
import { MailService } from '../services/MailService';
import { MatchCupTacticsModal } from '../components/modals/MatchCupTacticsModal';
// -> tutaj wstaw kod (ZMIANA SERWISU NA CUP)
import { AiMatchDecisionCupService } from '../services/AiMatchDecisionCupService';
import { AiMatchPreparationService } from '@/services/AiMatchPreparationService';
import { PlayerAttributes } from '@/types-reference';
import { TacticalBrainService } from '@/services/TacticalBrainService';
import { MatchHistoryService } from '@/services/MatchHistoryService';

const BigJerseyIcon = ({ primary, secondary, size = "w-12 h-12" }: { primary: string, secondary: string, size?: string }) => (
  <div className={`relative ${size} flex items-center justify-center p-1.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md shadow-2xl overflow-hidden`}>
    <svg viewBox="0 0 24 24" className="w-full h-full" fill={primary}>
      <path d="M7 2L2 5v4l3 1v10h14V10l3-1V5l-5-3-2 2-2-2-2 2-2-2z" />
      <path d="M12 4L10 6L12 8L14 6L12 4Z" fill={secondary} fillOpacity="0.6" />
    </svg>
  </div>
);

const getFormationPowerPro = (
  lineup: (string | null)[], 
  teamPlayers: Player[], 
  fatigueMap: Record<string, number>, 
  attrKeys: (keyof PlayerAttributes)[], 
  positions: PlayerPosition[],
  weatherMod: number,
  instructions?: TacticalInstructions
) => {
    let tacticalMult = 1.0;
    if (instructions?.tempo === 'FAST' && positions.includes(PlayerPosition.FWD)) tacticalMult = 1.15;
    if (instructions?.tempo === 'SLOW' && attrKeys.includes('technique')) tacticalMult = 1.20;

  const activePlayers = teamPlayers.filter(p => lineup.includes(p.id) && positions.includes(p.position));
  
  // --- TUTAJ WSTAW TEN KOD (Kara za brak specjalisty) ---
  if (activePlayers.length === 0) return 1; // Drastyczny spadek mocy przy pustej linii

  // Jeśli formacja zawiera bramkę (GK) a w slocie 0 nie ma gracza z pozycją GK -> cała formacja traci 85% mocy
 const hasRealGkInStartingXI = teamPlayers.find(p => p.id === lineup[0])?.position === PlayerPosition.GK;
  
  // Jeśli brak bramkarza, każda formacja (Atak, Pomoc, Obrona) traci moc.
  // Obrona i GK (positions z GK lub DEF) tracą 85%, Atak/Pomoc traci 50% (paraliż decyzyjny).
  const isDefensiveLine = positions.includes(PlayerPosition.GK) || positions.includes(PlayerPosition.DEF);
  
  // TUTAJ WSTAW TEN KOD: KALIBRACJA INTEGRITY (STAGE 1 PRO)
  // Zwiększamy mnożnik z 0.2 do 0.45. Obrona bez GK jest słaba, ale nie przestaje istnieć.
  // TUTAJ WSTAW TEN KOD: KALIBRACJA INTEGRITY (STAGE 1 PRO + LOSOWOŚĆ)

// deklarujemy zmienną na poziomie funkcji (poza if)
let integrityMult = 1.0;

if (!hasRealGkInStartingXI) {
    if (isDefensiveLine) {
        // defensywa / GK → strata 15–25%
        integrityMult = 0.75 + Math.random() * 0.10;
    } else {
        // pomoc / atak → strata 5–17%
        integrityMult = 0.83 + Math.random() * 0.12;
    }
    
    // opcjonalny mały bonus za głęboką linię
    if (isDefensiveLine) {
        integrityMult = Math.min(0.87, integrityMult + 0.02);
    }
}


const startersCount = lineup.filter(id => id !== null).length;
  
  // TUTAJ ZASTĄP TEN KOD (ASYMETRYCZNA KARA ZA CZERWONĄ KARTKĘ)
  // Atak cierpi mocno (0.15 na gracza), ale obrona mniej (0.05 na gracza) - symulacja "parkowania autobusu"
  const isAttack = positions.includes(PlayerPosition.FWD);
  const penaltyPerPlayer = isAttack ? 0.10 : 0.04;
  const numericalPenalty = Math.max(0.78, 1 - (11 - startersCount) * penaltyPerPlayer);
  // KONIEC POPRAWKI

  return activePlayers.reduce((sum, p) => {
    const pFatigue = fatigueMap[p.id] ?? p.condition;
    // Kondycja wpływa na statystyki: 100% kondycji = 100% mocy, 50% = 75% mocy, 0% = 50% mocy
const fatigueMult = 0.2 + (pFatigue / 100) * 0.3; // Kondycja waży więcej w modelu PRO
    const avgAttr = attrKeys.reduce((s, attr) => s + (p.attributes[attr] || 50), 0) / attrKeys.length;
    
    // ZMIANA PRO: Potencjał nieliniowy. Każdy punkt atrybutu powyżej 50 ma coraz większą wagę.
    const powerBase = Math.pow(avgAttr, 1.65); 
    
    return sum + (powerBase * fatigueMult * weatherMod * integrityMult * numericalPenalty);
  }, 0);
};



export const MatchLiveViewPolishCupSimulation: React.FC = () => {
  const { 
    navigateTo, userTeamId, clubs, fixtures, players, 
    lineups, currentDate, setLastMatchSummary, applySimulationResult, viewPlayerDetails, setMessages,
    activeMatchState: matchState, setActiveMatchState: setMatchState,coaches, seasonNumber 
  } = useGame();
  
  const [isFinishing, setIsFinishing] = useState(false);
  const [isCelebratingGoal, setIsCelebratingGoal] = useState(false);
  const [isTacticsOpen, setIsTacticsOpen] = useState(false);
  const [penaltyNotice, setPenaltyNotice] = useState<string | null>(null);
   const [showMissedPenalty, setShowMissedPenalty] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);
 


  const ctx = useMemo(() => {
    const fixture = fixtures.find(f => 
        (f.homeTeamId === userTeamId || f.awayTeamId === userTeamId) &&
        f.date.toDateString() === currentDate.toDateString()
    );
    if (!fixture) return null;
    const home = clubs.find(c => c.id === fixture.homeTeamId)!;
    const away = clubs.find(c => c.id === fixture.awayTeamId)!;
    return {
      fixture, homeClub: home, awayClub: away, homePlayers: players[home.id] || [], awayPlayers: players[away.id] || [], homeAdvantage: true, competition: 'CUP'
    } as any;
  }, [userTeamId, clubs, fixtures, players, currentDate]);

  const userSide = useMemo(() => {
    if (!ctx || !userTeamId) return 'HOME';
    return ctx.homeClub.id === userTeamId ? 'HOME' : 'AWAY';
  }, [ctx, userTeamId]);

  const kitColors = useMemo(() => ctx ? KitSelectionService.selectOptimalKits(ctx.homeClub, ctx.awayClub) : null, [ctx]);
  
  const env = useMemo(() => {
    if (!ctx) return null;
    const seed = `${ctx.fixture.id}_CUP`;
    return { ref: RefereeService.assignReferee(seed, 5), weather: PolandWeatherService.getWeather(ctx.fixture.date, seed) };
  }, [ctx]);

 const isPausedForSevereInjury = useMemo(() => {
    // STAGE 1 PRO FIX: Sprawdzamy logi z obecnej minuty, aby wyświetlić komunikat nawet po usunięciu gracza z murawy
    if (!matchState || !matchState.isPaused || matchState.isHalfTime || matchState.isFinished) return false;
    return matchState.logs.some(l => l.minute === matchState.minute && l.type === MatchEventType.INJURY_SEVERE);
  }, [matchState]);

  useEffect(() => {
   if (ctx && (!matchState || matchState.fixtureId !== ctx.fixture.id)) {
      setMatchState({
        fixtureId: ctx.fixture.id, minute: 0, period: 1, addedTime: 0, isPaused: true, isPausedForEvent: false, isHalfTime: false, isFinished: false,
        speed: 1, momentum: 5, momentumPulse: 0, homeScore: 0, awayScore: 0, homeLineup: lineups[ctx.homeClub.id], awayLineup: lineups[ctx.awayClub.id],
        playedPlayerIds: [],
        homeFatigue: {}, awayFatigue: {}, homeInjuries: {}, awayInjuries: {}, playerYellowCards: {}, sentOffIds: [], homeRiskMode: {}, awayRiskMode: {},
        homeUpgradeProb: {}, awayUpgradeProb: {}, homeInjuryMin: {}, awayInjuryMin: {}, subsCountHome: 0, subsCountAway: 0, homeSubsHistory: [], awaySubsHistory: [],
        lastAiActionMinute: 0, logs: [{ id: 'cup_init', minute: 0, text: "Gwizdek sędziego! Zaczynamy bój o awans!", type: MatchEventType.GENERIC }],
events: [], homeGoals: [], awayGoals: [], flashMessage: null, sessionSeed: Date.now(), tacticalImpact: 1.0,
        isExtraTime: false, isPenalties: false, homePenaltyScore: undefined, awayPenaltyScore: undefined, penaltySequence: [],
        liveStats: {
          home: { shots: 0, shotsOnTarget: 0, corners: 0, fouls: 0, offsides: 0 },
          away: { shots: 0, shotsOnTarget: 0, corners: 0, fouls: 0, offsides: 0 }
        },
        momentumSum: 0,
        momentumTicks: 0,
        // -> tutaj wstaw kod
       
  aiActiveShout: (() => {
           const aiSideSide = userSide === 'HOME' ? 'AWAY' : 'HOME';
           const aiClubObj = aiSideSide === 'AWAY' ? ctx.awayClub : ctx.homeClub;
           const aiCoachObj = coaches[aiClubObj.coachId || ''];
           const aiTacticObj = TacticRepository.getById(lineups[aiClubObj.id].tacticId);

           const coachExp = aiCoachObj?.attributes.experience || 50;
           const chaosChance = (100 - coachExp) / 400 + 0.05; // 5% do 25% szansy na błąd
           const isLogical = Math.random() > chaosChance;

           let mindset: any = 'NEUTRAL';
           let intensity: any = 'NORMAL';
           let tempo: any = 'NORMAL';

           if (isLogical) {
              // Mapowanie logiczne na podstawie biasów taktyki
              if (aiTacticObj.attackBias > 65) mindset = 'OFFENSIVE';
              else if (aiTacticObj.defenseBias > 65) mindset = 'DEFENSIVE';
              
              if (aiTacticObj.pressingIntensity > 65) intensity = 'AGGRESSIVE';
              else if (aiTacticObj.pressingIntensity < 35) intensity = 'CAUTIOUS';
              
              if (aiTacticObj.attackBias > 70) tempo = 'FAST';
              else if (aiTacticObj.defenseBias > 75) tempo = 'SLOW';
           } else {
              // Wybór losowy (błąd trenera)
              const mindsets = ['DEFENSIVE', 'NEUTRAL', 'OFFENSIVE'];
              const intensities = ['CAUTIOUS', 'NORMAL', 'AGGRESSIVE'];
              mindset = mindsets[Math.floor(Math.random() * 3)];
              intensity = intensities[Math.floor(Math.random() * 3)];
           }

           return {
              id: 'PRE_MATCH_INIT',
              expiryMinute: 20 + Math.floor(Math.random() * 15), // Pierwsza rewizja ok 20-35 minuty
              mindset,
              tempo,
              intensity
           };
        })(),


        lastGoalBoostMinute: -15,
        // TUTAJ WSTAW TEN KOD (INICJALIZACJA IMPULSÓW TAKTYCZNYCH)
        activeTacticalBoost: 0,
        tacticalBoostExpiry: 0,
        // KONIEC
        userInstructions: {
tempo: 'NORMAL',
mindset: 'NEUTRAL',
intensity: 'NORMAL',
lastChangeMinute: -5,
expiryMinute: 0
}
      });
    }
  }, [ctx, lineups, matchState, setMatchState]);

  useEffect(() => { logsEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [matchState?.logs]);

  useEffect(() => {
    if (matchState && (matchState.homeScore > 0 || matchState.awayScore > 0) && !matchState.isPenalties) {
      setIsCelebratingGoal(true);
      const timer = setTimeout(() => setIsCelebratingGoal(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [matchState?.homeScore, matchState?.awayScore]);

  const seededRng = (seed: number, minute: number, offset: number = 0) => {
    let s = seed + minute + offset;
    const x = Math.sin(s) * 10000;
    return x - Math.floor(x);
  };

  const handleTacticsClose = (newLineup: Lineup, subsCount: number, subsHistory: SubstitutionRecord[]) => {
    setMatchState(prev => {
      if (!prev) return prev;
      const isHome = userSide === 'HOME';
      return {
        ...prev,
        isPaused: true, 
        homeLineup: isHome ? newLineup : prev.homeLineup,
        awayLineup: !isHome ? newLineup : prev.awayLineup,
        subsCountHome: isHome ? subsCount : prev.subsCountHome,
        subsCountAway: !isHome ? subsCount : prev.subsCountAway,
        homeSubsHistory: isHome ? subsHistory : prev.homeSubsHistory,
        awaySubsHistory: !isHome ? subsHistory : prev.awaySubsHistory
      };
    });
    setIsTacticsOpen(false);
  };
// TO JEST NOWA FUNKCJA DO PRZYCISKU (WKLEJ TUTAJ):
  const startExtraTimeMatch = () => {
    setMatchState(prev => {
      if (!prev) return null;
      return {
        ...prev,
        minute: 90,          // Cofamy licznik na 90
        period: 3,           // Ustawiamy okres na dogrywkę
        isExtraTime: true,   // Włączamy tryb dogrywki
        isPaused: false,     // Puszczamy czas
        isHalfTime: false,
        addedTime: 0,        // Resetujemy doliczony czas dla dogrywki
        logs: [
           { id: `et_start_real_${Date.now()}`, minute: 90, text: "Gwizdek sędziego! Zaczynamy dogrywkę!", type: MatchEventType.GENERIC },
           ...prev.logs
        ]
      };
    });
  };
  // --- TACTICS BATTLE HELPERS ---
  const getTacticStyle = (tacticId: string) => {
    const t = TacticRepository.getById(tacticId);
    if (t.attackBias > 70) return 'ALL-IN';
    if (t.defenseBias > 80) return 'BUS';
    if (t.defenseBias > 60 && t.attackBias < 45) return 'TRAP';
    return 'SOLID';
  };

  const getCounterTacticId = (style: string) => {
    switch (style) {
      case 'ALL-IN': return '5-3-2'; // Kontra na All-In
      case 'BUS': return '4-3-3';    // Rozbijanie autobusu
      case 'SOLID': return '4-1-4-1'; // Walka o dominację
      default: return '4-2-3-1';
    }
  };

  const getPenaltyOrder = (lineup: Lineup, teamPlayers: Player[], sentOffIds: string[]) => {
    const getScore = (p: Player) => (p.attributes.finishing * 1000) + (p.overallRating * 10);

    const onPitch = lineup.startingXI
      .filter((id): id is string => id !== null && !sentOffIds.includes(id))
      .map(id => teamPlayers.find(p => p.id === id))
      .filter((p): p is Player => p !== undefined)
      .sort((a, b) => {
        const diff = getScore(b) - getScore(a);
        return diff !== 0 ? diff : a.lastName.localeCompare(b.lastName);
      });

    let ids = onPitch.map(p => p.id);
    if (ids.length < 5) {
      const onBench = lineup.bench
        .filter(id => !sentOffIds.includes(id))
        .map(id => teamPlayers.find(p => p.id === id))
        .filter((p): p is Player => p !== undefined)
        .sort((a, b) => {
          const diff = getScore(b) - getScore(a);
          return diff !== 0 ? diff : a.lastName.localeCompare(b.lastName);
        });
      ids = [...ids, ...onBench.map(p => p.id)];
    }
    return ids.length > 0 ? ids : (teamPlayers[0] ? [teamPlayers[0].id] : []);
  };

  // LOGIKA RZUTÓW KARNYCH (STEP-BY-STEP)
  useEffect(() => {
    if (!matchState?.isPenalties || matchState.isFinished || isFinishing) return;

    const penInterval = setInterval(() => {
      setMatchState(prev => {
        if (!prev || !ctx) return prev;
        
        const currentRound = prev.penaltySequence?.length || 0;
        const side: 'HOME' | 'AWAY' = (currentRound % 2 === 0) ? 'HOME' : 'AWAY';
        
        // Warunki zakończenia karnych
        const hPens = prev.penaltySequence?.filter(s => s.side === 'HOME' && s.result === 'SCORED').length || 0;
        const aPens = prev.penaltySequence?.filter(s => s.side === 'AWAY' && s.result === 'SCORED').length || 0;
        const hTaken = prev.penaltySequence?.filter(s => s.side === 'HOME').length || 0;
        const aTaken = prev.penaltySequence?.filter(s => s.side === 'AWAY').length || 0;

        // Sprawdzenie czy ktoś już wygrał
        if (hTaken >= 5 && aTaken >= 5 && hTaken === aTaken) {
           if (hPens !== aPens) return { ...prev, isFinished: true, isPaused: true };
        }

        const teamPlayers = side === 'HOME' ? ctx.homePlayers : ctx.awayPlayers;
        const lineup = side === 'HOME' ? prev.homeLineup : prev.awayLineup;
        
        const penaltyOrder = getPenaltyOrder(lineup, teamPlayers, prev.sentOffIds);
        const teamIndex = Math.floor(currentRound / 2);
        const kickerId = penaltyOrder[teamIndex % penaltyOrder.length];
        const kicker = teamPlayers.find(p => p.id === kickerId) || teamPlayers[0];
        
        // Urealistycznienie szansy (82% to średnia światowa) + wpływ atrybutu wykończenia
        const kickerFinishing = kicker.attributes.finishing || 50;
        const baseProb = 0.82 + (kickerFinishing - 50) / 500;
        const isScored = Math.random() < Math.max(0.65, Math.min(0.95, baseProb));
        
       const newSequence = [...(prev.penaltySequence || []), { side, result: isScored ? 'SCORED' as const : 'MISSED' as const }];
        
        // TUTAJ WSTAW TEN KOD (Failsafe z operatorem || 0)
        const newHomePenScore = side === 'HOME' && isScored ? (prev.homePenaltyScore || 0) + 1 : (prev.homePenaltyScore || 0);
        const newAwayPenScore = side === 'AWAY' && isScored ? (prev.awayPenaltyScore || 0) + 1 : (prev.awayPenaltyScore || 0);
        // KONIEC KODU

        const kickerDisplayName = `${kicker.firstName.charAt(0)}. ${kicker.lastName}`;

        return {
          ...prev,
          homePenaltyScore: newHomePenScore,
          awayPenaltyScore: newAwayPenScore,
          penaltySequence: newSequence,
          logs: [{ 
            id: `pen_${currentRound}`, 
            minute: 120, 
            text: `${side === 'HOME' ? ctx.homeClub.shortName : ctx.awayClub.shortName}: ${kickerDisplayName} ${isScored ? 'trafia!' : 'pudłuje!'}`, 
            type: isScored ? MatchEventType.PENALTY_SCORED : MatchEventType.PENALTY_MISSED 
          }, ...prev.logs]
        };
      });
    }, 2000);

    return () => clearInterval(penInterval);
  }, [matchState?.isPenalties, ctx, isFinishing]);

  useEffect(() => {
    if (!matchState || matchState.isPaused || matchState.isPausedForEvent || matchState.isFinished || matchState.isHalfTime || matchState.isPenalties || isFinishing || isCelebratingGoal || isTacticsOpen) return;

    const interval = setInterval(() => {
      setMatchState(prev => {
        if (!prev || !ctx) return prev;
        
        // --- TUTAJ WSTAW TEN KOD (Poprawka klamry i blokada licznika) ---
        const endOfGameMin = prev.isExtraTime ? 120 : (90 + (prev.addedTime || 0));
        if (prev.minute >= endOfGameMin) {
           setIsCelebratingGoal(false);
        }

        // Blokada: Jeśli mecz jest skończony lub czekamy na rzuty karne, nie inkrementuj minut
        if (prev.isFinished || prev.isPenalties) return prev;
        // --- KONIEC KODU ---

   const nextMinute = prev.minute + 1;
        const currentSeed = prev.sessionSeed;

        // TUTAJ WSTAW TEN KOD (ROZWIĄZANIE A: POST-GOAL COOL-OFF)
        // Jeśli od bramki minęło mniej niż 4 minuty, blokujemy fazy ataku (czas wznowienia gry)
        const isCoolingDown = nextMinute - prev.lastGoalBoostMinute < 4;
        if (isCoolingDown) {
            return { 
                ...prev, 
                minute: nextMinute, 
                momentum: prev.momentum * 0.8, // Pasek powoli wraca do centrum
                logs: prev.logs 
            };
        }
        let nextAwayLineup = { ...prev.awayLineup };
        let nextHomeLineup = { ...prev.homeLineup };
        let updatedHomeGoals = [...prev.homeGoals];
        let updatedAwayGoals = [...prev.awayGoals];
        let nextPlayerYellowCards = { ...prev.playerYellowCards };
       let nextSentOffIds = [...prev.sentOffIds];
        let nextHomeInjuries = { ...prev.homeInjuries };
        let nextAwayInjuries = { ...prev.awayInjuries };
        let nextMomentum = prev.momentum;
        // === BALANS 2025 – stałe do łatwego tuningu ===
        const RED_CARD_CHANCE        = 0.0012;   // ~0.12% na minutę
        const SEVERE_INJURY_CHANCE   = 0.0020;
        const LIGHT_INJURY_CHANCE    = 0.0080;
        const YELLOW_CARD_CHANCE     = 0.0100;
        const BASE_EVENT_THRESHOLD   = 0.42;
        const BASE_GOAL_THRESHOLD    = 0.065;
        const MOMENTUM_INERTIA       = 0.88;

        // --- STAGE 1 PRO: OBLICZANIE TECHNIKI DLA LOGIKI TEMPA ---
        const getAvgTech = (lineup: (string | null)[], pool: Player[]) => {
           const active = pool.filter(p => lineup.includes(p.id));
           return active.length > 0 ? active.reduce((s, p) => s + (p.attributes.technique || 50), 0) / active.length : 50;
        };
        const pAvgTech = getAvgTech(userSide === 'HOME' ? nextHomeLineup.startingXI : nextAwayLineup.startingXI, userSide === 'HOME' ? ctx.homePlayers : ctx.awayPlayers);
        const aAvgTech = getAvgTech(userSide === 'HOME' ? nextAwayLineup.startingXI : nextHomeLineup.startingXI, userSide === 'HOME' ? ctx.awayPlayers : ctx.homePlayers);

        // -> tutaj wstaw kod (STAGE 1 PRO: Sumy ataku i obrony dla logiki Tempa Szybkiego)
        const getSumAttr = (ids: (string | null)[], pool: Player[], attr: keyof PlayerAttributes) => {
          const act = pool.filter(p => ids.includes(p.id));
          return act.reduce((s, p) => s + (p.attributes[attr] || 50), 0);
        };


     const pTotalAtt = getSumAttr(userSide === 'HOME' ? nextHomeLineup.startingXI : nextAwayLineup.startingXI, userSide === 'HOME' ? ctx.homePlayers : ctx.awayPlayers, 'attacking');
        const aTotalDef = getSumAttr(userSide === 'HOME' ? nextAwayLineup.startingXI : nextHomeLineup.startingXI, userSide === 'HOME' ? ctx.awayPlayers : ctx.homePlayers, 'defending');

        // -> tutaj wstaw kod
        // --- INICJALIZACJA ZMIENNYCH GLOBALNYCH DLA CYKLU ---
        const aiSide = userSide === 'HOME' ? 'AWAY' : 'HOME';
        const aiClub = aiSide === 'AWAY' ? ctx.awayClub : ctx.homeClub;
        const aiCoach = coaches[aiClub.coachId || ''];
        let updatedLogs: MatchLogEntry[] = [...prev.logs]; // Deklarujemy logs TUTAJ i tylko TUTAJ!
        
        // --- ARCHITEKTURA TACTICAL BRAIN (COACH SHOUTS) ---
        let currentAiShout = prev.aiActiveShout;
        let nextLastAiActionMinute = prev.lastAiActionMinute;
        
       // 1. Sprawdzenie wygasania (Tactical Drift)
        if (currentAiShout && !currentAiShout.isExpired && nextMinute >= currentAiShout.expiryMinute) {
           // STAGE 1 PRO: Tactical Trace - oznaczamy jako wygasłe, by UI wiedziało o fazie analizy
           currentAiShout = { ...currentAiShout, isExpired: true };
           updatedLogs = [{ id: `shout_trace_${nextMinute}`, minute: nextMinute, text: `Trener analizuje sytuację...`, type: MatchEventType.GENERIC }, ...updatedLogs];
        }

        // 2. Kalkulacja nowej decyzji (Reaction Time)
        // STAGE 1 PRO: Tactical Analysis Speed (Best: 18min, Worst: 40min)
        const reactionDelay = 40 - ((aiCoach?.attributes.decisionMaking || 50) * 0.22);
        
        // Blokada: Shout może wystąpić tylko jeśli minęło min. 15 minut od ostatniej dowolnej akcji AI
         const randomShoutCD = 7 + Math.floor(Math.abs(Math.sin(prev.sessionSeed + prev.lastAiActionMinute)) * 9);
        const canShoutNow = nextMinute >= prev.lastAiActionMinute + randomShoutCD;

        // TUTAJ WSTAW TEN KOD - Zmiana !currentAiShout na sprawdzenie wygaśnięcia
        const isSlotAvailable = !currentAiShout || currentAiShout.isExpired;

        if (isSlotAvailable && canShoutNow && nextMinute % Math.floor(reactionDelay) === 0) {
           // Jeśli krzyk nastąpi, aktualizujemy czas ostatniej akcji w locie
           nextLastAiActionMinute = nextMinute; 
           const brainDecision = TacticalBrainService.calculate(prev, userSide === 'HOME') as any; // Rzutowanie na any naprawia błąd intensity
           if (brainDecision.id !== 'N1') { 
              const disciplineDuration = 10 + Math.floor((aiCoach?.attributes.experience || 50) / 10);
              currentAiShout = {
                 id: brainDecision.id,
                 expiryMinute: nextMinute + disciplineDuration,
                 mindset: (brainDecision.mindset || 'NEUTRAL') as any,
                 tempo: (brainDecision.tempo || 'NORMAL') as any,
                 intensity: (brainDecision.intensity || 'NORMAL') as any
              };
              if (brainDecision.log) {
                 updatedLogs = [{ id: `ai_shout_${nextMinute}`, minute: nextMinute, text: brainDecision.log, type: MatchEventType.GENERIC }, ...updatedLogs];
              }
           }
        }
        // KONIEC WSTAWKI

        // -> tutaj wstaw kod (STAGE 1 PRO: Suma Mocy Jedenastki dla logiki Nastawienia)
        const getTeamTotalPower = (ids: (string | null)[], pool: Player[]) => {
           const act = pool.filter(p => ids.includes(p.id));
           return act.reduce((s, p) => s + (p.attributes.attacking + p.attributes.passing + p.attributes.defending), 0);
        };
        const pPower = getTeamTotalPower(userSide === 'HOME' ? nextHomeLineup.startingXI : nextAwayLineup.startingXI, userSide === 'HOME' ? ctx.homePlayers : ctx.awayPlayers);
        const aPower = getTeamTotalPower(userSide === 'HOME' ? nextAwayLineup.startingXI : nextHomeLineup.startingXI, userSide === 'HOME' ? ctx.awayPlayers : ctx.homePlayers);
      

        const powerDiff = pPower - aPower;
       





        const pDefSum = getSumAttr(userSide === 'HOME' ? nextHomeLineup.startingXI : nextAwayLineup.startingXI, userSide === 'HOME' ? ctx.homePlayers : ctx.awayPlayers, 'defending');
        const aAttSum = getSumAttr(userSide === 'HOME' ? nextAwayLineup.startingXI : nextHomeLineup.startingXI, userSide === 'HOME' ? ctx.awayPlayers : ctx.homePlayers, 'attacking');

        // -> TUTAJ WSTAW TEN KOD (STAGE 1 PRO: Sumy Mieszane dla Intensywności Agresywnej)
        const pPassSum = getSumAttr(userSide === 'HOME' ? nextHomeLineup.startingXI : nextAwayLineup.startingXI, userSide === 'HOME' ? ctx.homePlayers : ctx.awayPlayers, 'passing');
        const aPassSum = getSumAttr(userSide === 'HOME' ? nextAwayLineup.startingXI : nextHomeLineup.startingXI, userSide === 'HOME' ? ctx.awayPlayers : ctx.homePlayers, 'passing');
        
        const pAttMid = (userSide === 'HOME' ? pTotalAtt : aAttSum) + (userSide === 'HOME' ? pPassSum : aPassSum);
        const pDefMid = (userSide === 'HOME' ? pDefSum : aTotalDef) + (userSide === 'HOME' ? pPassSum : aPassSum);
        const aAttMid = (userSide === 'AWAY' ? pTotalAtt : aAttSum) + (userSide === 'AWAY' ? pPassSum : aPassSum);
        const aDefMid = (userSide === 'AWAY' ? pDefSum : aTotalDef) + (userSide === 'AWAY' ? pPassSum : aPassSum);

        // -> TUTAJ WSTAW TEN KOD (STAGE 1 PRO: Sumy Techniki dla Intensywności Ostrożnej)
        const pTechSum = getSumAttr(userSide === 'HOME' ? nextHomeLineup.startingXI : nextAwayLineup.startingXI, userSide === 'HOME' ? ctx.homePlayers : ctx.awayPlayers, 'technique');
        const aTechSum = getSumAttr(userSide === 'HOME' ? nextAwayLineup.startingXI : nextHomeLineup.startingXI, userSide === 'HOME' ? ctx.awayPlayers : ctx.homePlayers, 'technique');
        let nextHomeSubsHistory = [...prev.homeSubsHistory];
        let nextAwaySubsHistory = [...prev.awaySubsHistory];
        let nextSubsCountHome = prev.subsCountHome;
        let nextSubsCountAway = prev.subsCountAway;
         let nextIsPaused = prev.isPaused;
        let nextIsPausedForEvent = prev.isPausedForEvent;       
        let localHomeFatigue = { ...prev.homeFatigue };
         let localAwayFatigue = { ...prev.awayFatigue };
/// SYSTEM KAR TAKTYCZNYCH (STAGE 1 PRO) ---
        const homeHasGK = ctx.homePlayers.find(p => p.id === nextHomeLineup.startingXI[0])?.position === PlayerPosition.GK;
        const awayHasGK = ctx.awayPlayers.find(p => p.id === nextAwayLineup.startingXI[0])?.position === PlayerPosition.GK;

        // Bazowe progi progresji (Faza 2)
       let homeProgressionThreshold = 0.55;
        let awayProgressionThreshold = 0.55;

        // TUTAJ WSTAW TEN KOD: STABILIZACJA PROGRESJI
        // Podnosimy próg z 0.35 na 0.48. Rywal będzie miał więcej akcji, ale nie co minutę.
        if (!homeHasGK) awayProgressionThreshold = 0.48; 
        if (!awayHasGK) homeProgressionThreshold = 0.48;

         // Kara do Momentum za brak bramkarza (Panika w obronie)
        if (!homeHasGK) nextMomentum -= 2.5;
        if (!awayHasGK) nextMomentum += 2.5;


        const playerTacticId = userSide === 'HOME' ? prev.homeLineup.tacticId : prev.awayLineup.tacticId;

        let coachEfficiency = 1.0; 
        if (aiCoach) {
           const { experience, decisionMaking } = aiCoach.attributes;
           
           // Margines błędu: 5% szansy na "zacmienie" (Human Error) niezależnie od statystyk
           const humanRoll = seededRng(currentSeed, nextMinute, 444);
           const isError = humanRoll < 0.05;
           
           if (isError) {
              // Błąd proporcjonalny do braku doświadczenia
              coachEfficiency = 0.4 + (experience / 200); // Słaby: 0.5x, Mistrz: 0.9x
           } else {
              // Normalna praca: Decyzyjność pcha zespół do przodu
              // Trener 99 Decyzyjności daje +15% do szansy na akcje
              coachEfficiency = 0.9 + (decisionMaking / 500); 
           }
        }
        // Przerwa po 45 minucie – zawsze działa
  // 1. Moment doliczenia czasu w 1. połowie (wykonuje się raz w 45 min)
        if (nextMinute === 45 && prev.period === 1 && (prev.addedTime === 0 || prev.addedTime === undefined)) {
           const newAdded = Math.floor(Math.random() * 3) + 1; // 1-3 minuty
           return {
             ...prev,
             minute: 45,
             addedTime: newAdded,
             logs: [...prev.logs, { id: `add_time_45`, minute: 45, text: `⏱️ Sędzia dolicza ${newAdded} min. do pierwszej połowy.`, type: MatchEventType.GENERIC }]
           };
        }

        // 2. Przejście do przerwy po doliczonym czasie 1. połowy
        const endOfFirstHalf = 45 + (prev.addedTime || 0);
        if (nextMinute > endOfFirstHalf && prev.period === 1) {
          return {
            ...prev,
            minute: 45,
            isHalfTime: true,
            isPaused: true,
            addedTime: 0, 
            logs: [...prev.logs, { id: `ht_${Date.now()}`, minute: 45, text: "Przerwa – koniec pierwszej połowy", type: MatchEventType.GENERIC }]
          };
        }

// =================================================================
        // POPRAWIONA LOGIKA: KONIEC 2 POŁOWY + STOP NA REMIS (FIX) [cite: 3]
        // =================================================================
        if (!prev.isExtraTime && prev.period <= 2) {
          
          // 1. Moment doliczenia czasu (wykonuje się raz w 90 minucie)
          if (nextMinute === 90 && (prev.addedTime === 0 || prev.addedTime === undefined)) {
             const possible = [2, 3, 4, 5, 6]; 
             const newAdded = possible[Math.floor(Math.random() * possible.length)];
             
             return {
               ...prev,
               minute: 90,
               addedTime: newAdded, // Zapisujemy w stanie meczu, nie w useState
               logs: [
                 ...prev.logs,
                 { id: `add_time_90`, minute: 90, text: `⏱️ Sędzia dolicza ${newAdded} minut!`, type: MatchEventType.GENERIC }
               ]
             };
          }

          // 2. Sprawdzenie czy czas się skończył
          // WAŻNE: Używamy prev.addedTime, bo to jest aktualne w pętli
          const endMinute = 90 + (prev.addedTime || 0);

          if (nextMinute > endMinute) {
             // SCENARIUSZ: REMIS - ZATRZYMUJEMY GRE, CZEKAMY NA KLIKNIĘCIE
             if (prev.homeScore === prev.awayScore) {
               return {
                 ...prev,
                 minute: endMinute, 
                 isPaused: true,    // Pauza
                 isFinished: false, // Mecz trwa dalej (czeka na dogrywkę)
                 logs: [
                   { id: `ft_wait_${Date.now()}`, minute: endMinute, text: `Koniec regulaminowego czasu! Remis ${prev.homeScore}:${prev.awayScore}. Czekamy na dogrywkę.`, type: MatchEventType.GENERIC },
                   ...prev.logs
                 ]
               };
             } 
             // SCENARIUSZ: KTOŚ WYGRAŁ - KONIEC MECZU
             else {
               return {
                 ...prev,
                 minute: endMinute,
                 isFinished: true,
                 isPaused: true,
                 logs: [
                   { id: `ft_end_${Date.now()}`, minute: endMinute, text: `KONIEC MECZU! Wynik ${prev.homeScore}:${prev.awayScore}`, type: MatchEventType.GENERIC },
                   ...prev.logs
                 ]
               };
             }
          }
        }

        // Przerwa w dogrywce – 105 minuta
        if (nextMinute === 105 && prev.isExtraTime) {
          return {
            ...prev,
            minute: 105,
            isHalfTime: true,
            isPaused: true,
            logs: [
              ...prev.logs,
              { id: `ht_et_${Date.now()}`, minute: 105, text: "Przerwa w dogrywce", type: MatchEventType.GENERIC }
            ]
          };
        }

if (prev.isExtraTime && nextMinute >= 121) {
        const isDraw = prev.homeScore === prev.awayScore;

        if (isDraw) {
          // REMIS W DOGRYWCE -> RZUTY KARNE
          return {
            ...prev,
            minute: 120, 
            isPenalties: true,
            isFinished: false,
            isPaused: false, 
            homePenaltyScore: 0,
            awayPenaltyScore: 0,
            penaltySequence: [],
            logs: [
              { id: `et_end_pens_${Date.now()}`, minute: 120, text: "Koniec dogrywki! Remis! Czas na rzuty karne!", type: MatchEventType.GENERIC },
              ...prev.logs
            ]
          };
        } else {
          // KTOŚ WYGRAŁ W DOGRYWCE -> DEFINITYWNY KONIEC
          return {
            ...prev,
            minute: 120,
            isFinished: true,
            isPaused: true,
            logs: [
              { id: `et_end_final_${Date.now()}`, minute: 120, text: `KONIEC DOGRYWKI! Wynik końcowy: ${prev.homeScore}:${prev.awayScore}`, type: MatchEventType.GENERIC },
              ...prev.logs
            ]
          };
        }
      }


        // --- CLASH CALCULATION ---
        const pStyle = getTacticStyle(playerTacticId);
        const aiStyle = getTacticStyle(aiSide === 'AWAY' ? nextAwayLineup.tacticId : nextHomeLineup.tacticId);
        // Logika Instrukcji Taktycznych Gracza (Modyfikatory Stateless)
        const instr = prev.userInstructions;
        let pActionMod = 1.0; 
        let pFatigueMod = 1.0;
        let pGoalMod = 1.0;
        let pRiskMod = 1.0; // Ryzyko utraty gola
        let pIncidentMod = 1.0; // Kartki/Kontuzje

        // 1. TEMPO
        if (instr.tempo === 'SLOW') { pActionMod -= 0.05; pFatigueMod -= 0.03; }
        if (instr.tempo === 'FAST') { pActionMod += 0.05; pFatigueMod += 0.03; }

        // 2. NASTAWIENIE
        if (instr.mindset === 'OFFENSIVE') { 
           pGoalMod += (0.005 + seededRng(currentSeed, nextMinute, 11) * 0.045); 
           // Ryzyko z tyłu tylko z silniejszym/równym rywalem
           if (ctx.awayClub.reputation >= ctx.homeClub.reputation) pRiskMod += 0.02 + seededRng(currentSeed, nextMinute, 22) * 0.03;
        }
        if (instr.mindset === 'DEFENSIVE') {
           pGoalMod -= (0.01 + seededRng(currentSeed, nextMinute, 33) * 0.04);
           pRiskMod -= (0.005 + seededRng(currentSeed, nextMinute, 44) * 0.045);
        }

        // 3. INTENSYWNOŚĆ
        if (instr.intensity === 'AGGRESSIVE') {
           pIncidentMod += 0.01 + seededRng(currentSeed, nextMinute, 55) * 0.04;
           pActionMod += 0.005 + seededRng(currentSeed, nextMinute, 66) * 0.01;
        }
        if (instr.intensity === 'CAUTIOUS') {
           pIncidentMod -= 0.01 + seededRng(currentSeed, nextMinute, 77) * 0.04;
           if (aiStyle === 'ALL-IN') pRiskMod += 0.005 + seededRng(currentSeed, nextMinute, 88) * 0.025;
        }
        let aiAdvantageFactor = 1.0;
        // POPRAWKA: pRiskMod zwiększa próg gola dla rywala (kara za ofensywę)
const aiGoalThresholdBoost = pRiskMod * (ctx.awayClub.reputation >= ctx.homeClub.reputation ? 1.2 : 0.8);
        let aiGoalMultiplier = 1.0;
        
        // Specjalny mnożnik: ALL-IN gracza vs TRAP AI = Śmiercionośna kontra AI
      // -> TUTAJ WSTAW TEN KOD (STAGE 1 PRO: Skalowany Bonus Taktyczny AI)
        if (pStyle === 'ALL-IN' && aiStyle === 'TRAP') {
           const getTier = (cid: string) => {
              const c = clubs.find(x => x.id === cid);
              if (c?.leagueId.includes('L_PL_1')) return 1;
              if (c?.leagueId.includes('L_PL_2')) return 2;
              if (c?.leagueId.includes('L_PL_3')) return 3;
              return 4;
           };

           const aiSideId = userSide === 'HOME' ? ctx.awayClub.id : ctx.homeClub.id;
           const aiTier = getTier(aiSideId);
           const myAttMid = userSide === 'HOME' ? pAttMid : aAttMid;
           const oppDefMid = userSide === 'HOME' ? aDefMid : pDefMid;

           // Warunek siły: Obrona+Pomoc AI vs Atak+Pomoc gracza
           if (oppDefMid > myAttMid) {
              if (aiTier === 1) aiGoalMultiplier = 1.07;
              else if (aiTier === 2) aiGoalMultiplier = 1.125;
              else if (aiTier === 3) aiGoalMultiplier = 1.075;
              else if (aiTier === 4) aiGoalMultiplier = 1.0375;
              else aiGoalMultiplier = 1.015;
           } else {
              aiGoalMultiplier = 1.015; // Minimalny bonus za samą kontrę taktyczną
           }
           
           // Synchronizacja Advantage Factor z mnożnikiem gola
           aiAdvantageFactor = aiGoalMultiplier;
        }

        let hScore = prev.homeScore;
        let aScore = prev.awayScore;
        let eventType: MatchEventType | undefined;
        let eventSide: 'HOME' | 'AWAY' = 'HOME';
        let currentScorerName = "";

        // --- GLOBAL PENALTY LOGIC (FIXED) ---
        // --- GLOBAL PENALTY LOGIC (Z MODYFIKATOREM INTENSYWNOŚCI) ---
        let penaltyThreshold = (1 / 321);
        if (prev.userInstructions.intensity === 'AGGRESSIVE') {
           const oppAttMid = userSide === 'HOME' ? aAttMid : pAttMid;
           const myDefMid = userSide === 'HOME' ? pDefMid : aDefMid;
           if (oppAttMid > myDefMid + 10) {
              // e) Większe prawdopodobieństwo karnego dla rywala (1% do 4%)
              penaltyThreshold += (0.01 + seededRng(currentSeed, nextMinute, 123) * 0.03);
           }
        }

        const globalPenaltyRoll = seededRng(currentSeed, nextMinute, 5555);
        if (globalPenaltyRoll < penaltyThreshold) {
           const side: 'HOME' | 'AWAY' = seededRng(currentSeed, nextMinute, 6666) < 0.5 ? 'HOME' : 'AWAY';
           const teamName = side === 'HOME' ? ctx.homeClub.name : ctx.awayClub.name;
           const kickerTeam = side === 'HOME' ? ctx.homePlayers : ctx.awayPlayers;
           const kickerXI = side === 'HOME' ? prev.homeLineup.startingXI : prev.awayLineup.startingXI;
           const scorer = GoalAttributionService.pickScorer(kickerTeam, kickerXI as string[], false, () => seededRng(currentSeed, nextMinute, 7777));
           
           setPenaltyNotice(teamName);
           
           const penLog: MatchLogEntry = {
             id: `PEN_AWARDED_${nextMinute}`,
             minute: nextMinute,
             text: `👉 RZUT KARNY dla ${side === 'HOME' ? ctx.homeClub.shortName : ctx.awayClub.shortName}!`,
             type: MatchEventType.PENALTY_AWARDED,
             teamSide: side,
             playerName: scorer.lastName
           };

         setTimeout(() => {
              setPenaltyNotice(null);
              const isScored = Math.random() < 0.80; 
              
              // STAGE 1 PRO: Reakcja na zmarnowany karny
              if (!isScored) {
                 setShowMissedPenalty(true);
                 setTimeout(() => setShowMissedPenalty(false), 2000);
              }

              setMatchState(latest => {
                 if (!latest) return latest;
                 const finalHScore = (side === 'HOME' && isScored) ? latest.homeScore + 1 : latest.homeScore;
               const finalAScore = (side === 'AWAY' && isScored) ? latest.awayScore + 1 : latest.awayScore;
                 const finalHGoals = [...latest.homeGoals];
                 const finalAGoals = [...latest.awayGoals];

                 // Logika PRO: Zapisujemy zdarzenie w tickerze (STAGE 1 PRO FIX: Unifikacja formatu nazwiska)
                 const eventInfo = { 
                    playerName: `${scorer.firstName.charAt(0)}. ${scorer.lastName}`, 
                    minute: latest.minute, 
                    isPenalty: true, 
                    isMiss: !isScored 
                 };
                 
                 if (side === 'HOME') finalHGoals.push(eventInfo); 
                 else finalAGoals.push(eventInfo);

                 return {
                    ...latest,
                    homeScore: finalHScore,
                    awayScore: finalAScore,
                    homeGoals: finalHGoals,
                    awayGoals: finalAGoals,
                    isPausedForEvent: false,
                    logs: [{
                       id: `PEN_RES_${latest.minute}`,
                       minute: latest.minute,
                       text: isScored ? `⚽ GOL! ${scorer.lastName} z karnego!` : `❌ Pudło! ${scorer.lastName} marnuje szansę!`,
                       type: isScored ? MatchEventType.GOAL : MatchEventType.PENALTY_MISSED,
                       teamSide: side
                    }, penLog, ...latest.logs]
                 };
              });
           }, 3000);

           // FIX: Inkrementujemy minutę od razu, aby wyjść z deterministycznej pętli rollowania tego samego karnego
           return { ...prev, minute: nextMinute, isPausedForEvent: true };
        }

// --- STAGE 1 PRO: UJEDNOLICONA LOGIKA AGRESJI (USER + AI) ---
        const incidentSide: 'HOME' | 'AWAY' = seededRng(currentSeed, nextMinute, 8888) < 0.5 ? 'HOME' : 'AWAY';
        const otherSide = incidentSide === 'HOME' ? 'AWAY' : 'HOME';

        let finalIncidentModifier = 0;

        // Funkcja pomocnicza do pobierania agresji danej strony (Gracz lub AI)
        const getIntensityAtSide = (side: 'HOME' | 'AWAY') => {
          if (side === userSide) return prev.userInstructions.intensity;
          return currentAiShout?.intensity || 'NORMAL';
        };

    const sideIntensity = getIntensityAtSide(incidentSide);
        const otherIntensity = getIntensityAtSide(otherSide);

        // TUTAJ WSTAW TEN KOD - Rozdzielenie modyfikatorów
        let cardModifier = 0;
        let injuryModifier = 0.009;

        // Kartki zależą tylko od agresji strony rozpatrywanej (side)
        if (sideIntensity === 'AGGRESSIVE') cardModifier = 0.009;
        else if (sideIntensity === 'CAUTIOUS') cardModifier = -0.0015;

        // Kontuzje zależą tylko od agresji PRZECIWNIKA (other)
        if (otherIntensity === 'AGGRESSIVE') injuryModifier = 0.030;

        const baseRoll = seededRng(currentSeed, nextMinute, 9999);
        
        // Finalna logika sprawdzania (używamy różnych modyfikatorów w zależności od testu)
        const rollForCards = baseRoll - cardModifier;
        const rollForInjuries = baseRoll - injuryModifier;


        const teamPool = incidentSide === 'HOME' ? ctx.homePlayers : ctx.awayPlayers;
        const teamXI = incidentSide === 'HOME' ? nextHomeLineup.startingXI : nextAwayLineup.startingXI;
        
        // Wybór aktywnego zawodnika do zdarzenia
        const activeIds = teamXI.filter(id => id !== null);
        const targetId = activeIds[Math.floor(seededRng(currentSeed, nextMinute, 777) * activeIds.length)];
        const targetPlayer = teamPool.find(p => p.id === targetId);

if (targetPlayer && !prev.isPausedForEvent) {

    // =====================================================================
    // Kolejność OD NAJPoważniejszego / najrzadszego do najczęstszego
    // Tylko jedno zdarzenie na minutę na gracza → zachowujemy spójność symulacji
    // Łączna szansa na zdarzenie ≈ 3.3% na minutę na gracza (realistycznie niska)
    // =====================================================================

    // 1. CZERWONA KARTKA (0.25% szansy/min)
    if (rollForCards < RED_CARD_CHANCE) {
        nextSentOffIds.push(targetPlayer.id);
        const dispName = `${targetPlayer.firstName.charAt(0)}. ${targetPlayer.lastName}`;

        if (incidentSide === 'HOME') {
            nextHomeLineup.startingXI = nextHomeLineup.startingXI.map(id => id === targetPlayer.id ? null : id);
        } else {
            nextAwayLineup.startingXI = nextAwayLineup.startingXI.map(id => id === targetPlayer.id ? null : id);
        }

        updatedLogs = [{
            id: `RED_${nextMinute}`,
            minute: nextMinute,
            text: `🟥 BRUTALNY FAUL! ${dispName} wylatuje z boiska!`,
            type: MatchEventType.RED_CARD,
            teamSide: incidentSide,
            playerName: dispName
        }, ...updatedLogs];

        if (incidentSide === userSide) nextIsPaused = true;
    }

    // 2. GROŹNA KONTUZJA (0.4% szansy/min)
    else if (rollForInjuries < RED_CARD_CHANCE + SEVERE_INJURY_CHANCE) {  // < 0.0065
        if (incidentSide === 'HOME') {
            nextHomeInjuries[targetPlayer.id] = InjurySeverity.SEVERE;
            nextHomeLineup.startingXI = nextHomeLineup.startingXI.map(id => id === targetPlayer.id ? null : id);
        } else {
            nextAwayInjuries[targetPlayer.id] = InjurySeverity.SEVERE;
            nextAwayLineup.startingXI = nextAwayLineup.startingXI.map(id => id === targetPlayer.id ? null : id);
        }

        updatedLogs = [{
            id: `INJ_S_${nextMinute}`,
            minute: nextMinute,
            text: `🚑 FATALNIE! ${targetPlayer.lastName} opuszcza boisko na noszach!`,
            type: MatchEventType.INJURY_SEVERE,
            teamSide: incidentSide,
            playerName: targetPlayer.lastName
        }, ...updatedLogs];

        nextIsPaused = true;  // zatrzymanie gry – najcięższe zdarzenie
    }

    // 3. LEKKI URAZ (1.4% szansy/min)
    else if (rollForInjuries < RED_CARD_CHANCE + SEVERE_INJURY_CHANCE + LIGHT_INJURY_CHANCE) {  // < 0.0205
        if (incidentSide === 'HOME') {
            nextHomeInjuries[targetPlayer.id] = InjurySeverity.LIGHT;
        } else {
            nextAwayInjuries[targetPlayer.id] = InjurySeverity.LIGHT;
        }

        // logika spadku kondycji – bez zmian
        const pStrength = targetPlayer.attributes.strength || 50;
        const conditionDrop = 45 - (pStrength / 100 * 20);

        if (incidentSide === 'HOME') {
            localHomeFatigue[targetPlayer.id] = Math.max(0, (localHomeFatigue[targetPlayer.id] ?? targetPlayer.condition) - conditionDrop);
        } else {
            localAwayFatigue[targetPlayer.id] = Math.max(0, (localAwayFatigue[targetPlayer.id] ?? targetPlayer.condition) - conditionDrop);
        }

        updatedLogs = [{
            id: `INJ_L_${nextMinute}_${targetPlayer.id}`,
            minute: nextMinute,
            text: `✚ ${targetPlayer.lastName} odniósł uraz, ale walczy dalej.`,
            type: MatchEventType.INJURY_LIGHT,
            teamSide: incidentSide,
            playerName: targetPlayer.lastName
        }, ...updatedLogs];
    }

    // 4. ŻÓŁTA KARTKA (1.25% szansy/min) – w tym druga żółta → czerwona
    else if (rollForCards < RED_CARD_CHANCE + SEVERE_INJURY_CHANCE + LIGHT_INJURY_CHANCE + YELLOW_CARD_CHANCE) {  // < 0.0330
        const yellows = (nextPlayerYellowCards[targetPlayer.id] || 0) + 1;
        nextPlayerYellowCards[targetPlayer.id] = yellows;

        if (yellows >= 2) {
            nextSentOffIds.push(targetPlayer.id);
            if (incidentSide === 'HOME') {
                nextHomeLineup.startingXI = nextHomeLineup.startingXI.map(id => id === targetPlayer.id ? null : id);
            } else {
                nextAwayLineup.startingXI = nextAwayLineup.startingXI.map(id => id === targetPlayer.id ? null : id);
            }

            updatedLogs = [{
                id: `RED2_${nextMinute}`,
                minute: nextMinute,
                text: `🟥 DRUGA ŻÓŁTA! ${targetPlayer.lastName} schodzi do szatni!`,
                type: MatchEventType.RED_CARD,
                teamSide: incidentSide,
                playerName: targetPlayer.lastName
            }, ...updatedLogs];

            if (incidentSide === userSide) nextIsPaused = true;
        } else {
            updatedLogs = [{
                id: `YEL_${nextMinute}`,
                minute: nextMinute,
                text: `🟨 Żółta kartka: ${targetPlayer.lastName}`,
                type: MatchEventType.YELLOW_CARD,
                teamSide: incidentSide,
                playerName: targetPlayer.lastName
            }, ...updatedLogs];
        }
    }

    // else → nic się nie dzieje w tej minucie dla tego gracza
}

    // --- FAZA 1: WALKA O INICJATYWĘ (6 MIKRO-BITEW) ---
        const weatherMod = env.weather.description.toLowerCase().includes('deszcz') ? 0.88 : 1.0;
        const humanFactor = () => 0.70 + (seededRng(currentSeed, nextMinute, Math.random()) * 0.60); 

        const battleCategories: (keyof PlayerAttributes)[][] = [
            ['stamina'], ['strength'], ['technique'], ['pace'], ['passing'], ['vision']
        ];

        let homeWins = 0;
        let awayWins = 0;

        battleCategories.forEach((attrs, i) => {
            const hPwr = getFormationPowerPro(nextHomeLineup.startingXI, ctx.homePlayers, localHomeFatigue, attrs, [PlayerPosition.MID, PlayerPosition.DEF], weatherMod) * humanFactor();
            const aPwr = getFormationPowerPro(nextAwayLineup.startingXI, ctx.awayPlayers, localAwayFatigue, attrs, [PlayerPosition.MID, PlayerPosition.DEF], weatherMod) * humanFactor();
            
           // ZMIANA PRO: Rachunek prawdopodobieństwa. Moc to nie gwarancja, to szansa.
            const totalPower = hPwr + aPwr;
            const homeWinProb = hPwr / totalPower;
            const matchChaos = 0.85 + (seededRng(currentSeed, nextMinute, i) * 0.30); // 15% chaosu meczowego

            if (seededRng(currentSeed, nextMinute, i + 100) * matchChaos < homeWinProb) { 
                homeWins++; 
                nextMomentum += (1.8 + Math.random() * 2.2); 
            } else { 
                awayWins++; 
                nextMomentum -= (1.8 + Math.random() * 2.2); 
            }
        });

 if (homeWins >= 5) {
            nextMomentum += 12; // Nagły skok - zamknięcie rywala w "zamku"
            if (Math.random() < 0.3) updatedLogs = [{ id: `burst_h_${nextMinute}`, minute: nextMinute, text: `AI: ${ctx.homeClub.shortName} całkowicie kontroluje środek pola!`, type: MatchEventType.PRESSURE }, ...updatedLogs];
        } else if (awayWins >= 5) {
            nextMomentum -= 12;
            if (Math.random() < 0.3) updatedLogs = [{ id: `burst_a_${nextMinute}`, minute: nextMinute, text: `AI: ${ctx.awayClub.shortName} narzuca mordercze tempo gry!`, type: MatchEventType.PRESSURE }, ...updatedLogs];
        }


        eventSide = homeWins >= awayWins ? 'HOME' : 'AWAY';
        // --- FAZA 2: PROGRESJA ATAKU (5-12 RZUTÓW) ---
        const diceRolls = 5 + Math.floor(seededRng(currentSeed, nextMinute, 444) * 8);
        let successfulPasses = 0;
        
        for (let i = 0; i < diceRolls; i++) {
            const attPwr = getFormationPowerPro(eventSide === 'HOME' ? nextHomeLineup.startingXI : nextAwayLineup.startingXI, eventSide === 'HOME' ? ctx.homePlayers : ctx.awayPlayers, eventSide === 'HOME' ? localHomeFatigue : localAwayFatigue, ['attacking', 'passing'], [PlayerPosition.MID, PlayerPosition.FWD], weatherMod);
            const defPwr = getFormationPowerPro(eventSide === 'HOME' ? nextAwayLineup.startingXI : nextHomeLineup.startingXI, eventSide === 'HOME' ? ctx.awayPlayers : ctx.homePlayers, eventSide === 'HOME' ? localAwayFatigue : localHomeFatigue, ['defending', 'positioning'], [PlayerPosition.DEF, PlayerPosition.MID, PlayerPosition.GK], weatherMod);
            
            if ((attPwr * humanFactor()) > (defPwr * humanFactor())) {
                successfulPasses++;
                // Szybsza ucieczka paska przy udanych podaniach
                nextMomentum += (eventSide === 'HOME' ? 1.8 : -1.8);
            }
        } 

        const interceptRoll = seededRng(currentSeed, nextMinute, 555);
        if (interceptRoll < 0.15 && successfulPasses < (diceRolls * 0.4)) {
            // Obrona przejęła piłkę - gwałtowny odwrót momentum (Kontra!)
            nextMomentum = (eventSide === 'HOME' ? -15 : 15);
            updatedLogs = [{ id: `intercept_${nextMinute}`, minute: nextMinute, text: `AI: Genialny przechwyt i błyskawiczna kontra ${eventSide === 'HOME' ? ctx.awayClub.shortName : ctx.homeClub.shortName}!`, type: MatchEventType.MIDFIELD_CONTROL }, ...updatedLogs];
            successfulPasses = 0; // Przerwij strzał w tej minucie

            nextIsPausedForEvent = true; 
            setTimeout(() => { setMatchState(s => s ? {...s, isPausedForEvent: false} : s) }, 400);
        }
        
        // Dynamiczny próg strzału: im większa przewaga na pasku, tym łatwiej o strzał (od 0.55 do 0.40)
 const momentumBonus = Math.abs(nextMomentum) / 250;


 // REKALIBRACJA PRO: Obniżamy bazowy próg z 0.55 na 0.42. 
        // Przy równych siłach szansa na wejście w pole karne rośnie z ~37% do ~65%.
        const activeBaseThreshold = 0.42; 
        let dynamicThreshold = Math.max(0.32, activeBaseThreshold - momentumBonus);

        if (eventSide === aiSide) {
           dynamicThreshold *= (1.5 - (coachEfficiency * 0.5)); 
        }

        const timeSinceGoal = nextMinute - prev.lastGoalBoostMinute;
        const goalDiff = Math.abs(hScore - aScore);
        const leads = (eventSide === 'HOME' && hScore > aScore) || (eventSide === 'AWAY' && aScore > hScore);

        // 1. Logika Nasycenia (PRO): Łagodniejszy mnożnik, by faworyt nie przestawał grać przy 2:0.
        if (leads && goalDiff >= 3) {
            const satietyFactor = 1 + (goalDiff - 1) * 0.54; 
            dynamicThreshold *= satietyFactor;
        }

        // 2. Underdog Desperation (PRO): Silne pchnięcie dla przegrywającego, by wymuszać bramki.
        if (!leads && goalDiff >= 2) {
         const desperationBoost = Math.max(0.65, 1 - (goalDiff * 0.18));
            dynamicThreshold *= desperationBoost;
        }

        // 3. Dodatkowy "Cool-off" po golu (przez 10 minut trudniej o kolejny "cios za ciosem")
        if (timeSinceGoal < 10) {
            dynamicThreshold *= 1.15;
        }

        // 3. Bazowy system Post-Goal Suppression (Fatigue/Celebration)
        const suppressionDuration = (prev as any).postGoalSuppressionDuration || 15;
        if (timeSinceGoal < suppressionDuration) {
           const penalty = (prev as any).postGoalPenaltyPct || 0.2;
           dynamicThreshold *= (1 + penalty); 
        }
       
       const currentThreshold = dynamicThreshold;
        if (successfulPasses / diceRolls > currentThreshold) {
            const attTeam = eventSide === 'HOME' ? ctx.homePlayers : ctx.awayPlayers;
            const defTeam = eventSide === 'HOME' ? ctx.awayPlayers : ctx.homePlayers;
            const attLineup = eventSide === 'HOME' ? nextHomeLineup.startingXI : nextAwayLineup.startingXI;
            const defLineup = eventSide === 'HOME' ? nextAwayLineup.startingXI : nextHomeLineup.startingXI;

            const scorer = GoalAttributionService.pickScorer(attTeam, attLineup as string[], false, () => seededRng(currentSeed, nextMinute, 777));
            const keeper = defTeam.find(p => p.id === defLineup[0]) || defTeam[0];

            const isRealKeeper = keeper.position === PlayerPosition.GK;
            const shotPower = (scorer.attributes.finishing * 0.8 + scorer.attributes.dribbling * 0.2) * humanFactor() * 1.1; 
            
            // Jeśli w bramce stoi gracz z pola, jego savePower jest dzielony przez 4
            let savePower = (keeper.attributes.goalkeeping * 0.8 + keeper.attributes.positioning * 0.2) * (0.85 + (seededRng(currentSeed, nextMinute, 999) * 0.25));
            if (!isRealKeeper) savePower *= 0.55;

 if (env.weather.description.toLowerCase().includes('deszcz') && scorer.attributes.technique < 50) {
                if (seededRng(currentSeed, nextMinute, 123) < 0.22) { // 22% szansy na kiks przy słabej technice
                    updatedLogs = [{ id: `rain_kiks_${nextMinute}`, minute: nextMinute, text: `AI: Piłka uciekła ${scorer.lastName} na mokrej trawie! Co za fatalny kiks!`, type: MatchEventType.BLUNDER, teamSide: eventSide }, ...updatedLogs];
                    nextMomentum += (eventSide === 'HOME' ? -10 : 10);
                    return { ...prev, minute: nextMinute, momentum: nextMomentum, logs: updatedLogs }; // Przerwij akcję strzału
                }
            }


         if (shotPower > savePower) {
                eventType = MatchEventType.GOAL;
                const formattedName = `${scorer.firstName.charAt(0)}. ${scorer.lastName}`;
                currentScorerName = formattedName;
                const goalData = { playerName: formattedName, minute: nextMinute, isPenalty: false };
                
                if (eventSide === 'HOME') { hScore++; updatedHomeGoals.push(goalData); } 
                else { aScore++; updatedAwayGoals.push(goalData); }

                // --- LOGIKA BRAMKI KONTAKTOWEJ (STAGE 1 PRO) ---
                const isComebackGoal = (eventSide === 'HOME' && prev.awayScore - prev.homeScore >= 2 && aScore - hScore === 1) ||
                                     (eventSide === 'AWAY' && prev.homeScore - prev.awayScore >= 2 && hScore - aScore === 1);

                if (isComebackGoal) {
                   (prev as any).comebackPower = 2 + (Math.random() * 8); // 2-10% boostu
                   (prev as any).comebackExpiry = nextMinute + 2 + Math.floor(Math.random() * 6); // czas trwania 2-7 min
                   (prev as any).comebackSide = eventSide;
                   updatedLogs = [{ id: `comeback_${nextMinute}`, minute: nextMinute, text: `AI: BRAMKA KONTAKTOWA! ${eventSide === 'HOME' ? ctx.homeClub.shortName : ctx.awayClub.shortName} łapie wiatr w żagle!`, type: MatchEventType.PRESSURE }, ...updatedLogs];
                }

                // TUTAJ ZASTĄP TEN KOD (UTRWALENIE BLOKADY + RESET MOMENTUM)
                nextMomentum = 0; 
                // Kluczowe: przypisujemy do zmiennej lokalnej widocznej w return
                (prev as any).lastGoalBoostMinute = nextMinute; 

                const isEquivalent = Math.abs(pPower - aPower) < 25;
                (prev as any).postGoalSuppressionDuration = 10 + Math.floor(Math.random() * 11);

              
                
                if (isEquivalent) {
                   (prev as any).postGoalPenaltyPct = 0.30 + (Math.random() * 0.20); // 30-50%
                } else {
                   (prev as any).postGoalPenaltyPct = 0.02 + (Math.random() * 0.18); // 2-20%
                }
            } else {
                eventType = MatchEventType.SHOT_ON_TARGET;
                nextMomentum += (eventSide === 'HOME' ? -8 : 8); // Nagroda dla bramkarza
            }

           const pool = MATCH_COMMENTARY_DB[eventType] || ["Akcja podbramkowa!"];
            const comment = pool[Math.floor(seededRng(currentSeed, nextMinute, 99) * pool.length)].replace("{Nazwisko}", scorer.lastName);
            updatedLogs = [{ id: `pro_${nextMinute}`, minute: nextMinute, text: `[${eventSide === 'HOME' ? ctx.homeClub.shortName : ctx.awayClub.shortName}] ${comment}`, type: eventType, teamSide: eventSide, playerName: scorer.lastName }, ...updatedLogs];
        }

        // TUTAJ WSTAW TEN KOD (POPRAWKA SPOJNOŚCI RESETU)
        // Jeśli właśnie padł gol, nie pozwalamy serwisowi Momentum obliczać impulsu - wymuszamy twarde 0.
        if (eventType === MatchEventType.GOAL) {
            nextMomentum = 0;
        } else {
            nextMomentum = MomentumServiceCup.computeMomentum(ctx, { ...prev, homeLineup: nextHomeLineup, awayLineup: nextAwayLineup }, eventType, eventSide);
        }
        // KONIEC POPRAWKI

        // === WYGŁADZANIE MOMENTUM – zapobiega szarpaniu wyniku ===


       const momentumChange = nextMomentum - prev.momentum;
// Zwiększamy inercję z 0.12 na 0.28, aby pasek reagował szybciej na rzuty koscią
const cupVolatility = 0.28; 
nextMomentum = prev.momentum + (momentumChange * cupVolatility);
        nextMomentum = Math.max(-95, Math.min(95, nextMomentum)); // nie pozwalamy na ekstremalne wartości

   if (currentAiShout) {
           let shoutImpact = 0;
          // Aplikujemy bonusy TYLKO jeśli instrukcja nie wygasła
           if (!(currentAiShout as any).isExpired) {
              if (currentAiShout.mindset === 'OFFENSIVE') shoutImpact = (aiSide === 'HOME' ? 1.5 : -1.5);
              if (currentAiShout.mindset === 'DEFENSIVE') shoutImpact = (aiSide === 'HOME' ? -1.2 : 1.2);
              if (currentAiShout.intensity === 'AGGRESSIVE') shoutImpact = (aiSide === 'HOME' ? 0.8 : -0.8);
              nextMomentum += shoutImpact;
           }
        }

     // --- STAGE 1 PRO: WPŁYW TECHNIKI PRZY WOLNYM TEMPIE ---
      const isPlayerEffectActive = nextMinute <= prev.userInstructions.expiryMinute;
              let tacticalBoostAmt = 0;
        let nextTacticalBoost = prev.activeTacticalBoost || 0;
        let nextTacticalExpiry = prev.tacticalBoostExpiry || 0;

        // 1. Sprawdzenie czy nastąpiła nowa decyzja (Gracz lub AI)
        const instructionChanged = prev.userInstructions.lastChangeMinute === nextMinute;
        
        if (instructionChanged) {
            // Obliczamy siłę impulsu (losowo 5-15 pkt)
            const impulsePower = 5 + (Math.random() * 10);
            const direction = prev.userInstructions.mindset === 'OFFENSIVE' ? 1 : (prev.userInstructions.mindset === 'DEFENSIVE' ? -1 : 0);
            
            if (direction !== 0) {
                tacticalBoostAmt = impulsePower * direction;
                nextTacticalBoost += tacticalBoostAmt;
                // Czas trwania efektu: 5-20 minut
                nextTacticalExpiry = nextMinute + 5 + Math.floor(Math.random() * 16);
                nextMomentum += tacticalBoostAmt; // Natychmiastowy skok
                updatedLogs = [{ id: `impulse_${nextMinute}`, minute: nextMinute, text: `AI: Drużyna gwałtownie zmienia rytm gry!`, type: MatchEventType.GENERIC }, ...updatedLogs];
            }
        }

        // 2. Mechanizm ZWROTU (Revert) - jeśli czas minął, zabieramy dodany bonus
        if (nextMinute === nextTacticalExpiry && nextTacticalBoost !== 0) {
            nextMomentum -= nextTacticalBoost; // Oddajemy dług do Momentum
            nextTacticalBoost = 0; 
            nextTacticalExpiry = 0;
            updatedLogs = [{ id: `revert_${nextMinute}`, minute: nextMinute, text: `AI: Intensywność zrywu opadła. Gra wraca do normy.`, type: MatchEventType.GENERIC }, ...updatedLogs];
        }

// Jeśli okno wygasło, instrukcje gracza wracają do 'NEUTRAL' / 'NORMAL' dla silnika
const activePlayerMindset = isPlayerEffectActive ? prev.userInstructions.mindset : 'NEUTRAL';
const activePlayerTempo = isPlayerEffectActive ? prev.userInstructions.tempo : 'NORMAL';

const effectiveHomeMindset = userSide === 'HOME' ? activePlayerMindset : currentAiShout?.mindset;
const effectiveAwayMindset = userSide === 'AWAY' ? activePlayerMindset : currentAiShout?.mindset;

if (activePlayerTempo === 'SLOW') {
   const techBonus = 0.4 + seededRng(currentSeed, nextMinute, 88) * 0.5;
   const playerHasAdvantage = pAvgTech >= aAvgTech;
   const finalEffect = playerHasAdvantage ? techBonus : -techBonus;
   nextMomentum += (userSide === 'HOME' ? finalEffect : -finalEffect);
}

      if (activePlayerTempo === 'FAST') {
           // Delikatny efekt: tylko mały bonus przy wyraźnej przewadze ataku
           const attDiff = pTotalAtt - aTotalDef;
           let fastEffect = 0;
           
           if (attDiff > 30)      fastEffect = 0.5;   // +0.9% gdy miażdżysz w ataku
           else if (attDiff > 15) fastEffect = 0.3;   // +0.4%
           else if (attDiff > 0)  fastEffect = 0.1;   // +0.1%
           else                   fastEffect = -0.3;  // -0.3% gdy nie masz przewagi

           nextMomentum += (userSide === 'HOME' ? fastEffect : -fastEffect);
        }

        

        if (effectiveHomeMindset === 'OFFENSIVE' || effectiveAwayMindset === 'OFFENSIVE') {
           const isHomeOff = effectiveHomeMindset === 'OFFENSIVE';
           const riskCost = -0.6;
           let powerBonus = 0;
           // Używamy powerDiff z perspektywy atakującego
           const currentPowerDiff = isHomeOff ? powerDiff : -powerDiff;

           if (currentPowerDiff >= 40) powerBonus = 4.0;
           else if (currentPowerDiff >= 25) powerBonus = 1.8;
           else if (currentPowerDiff >= 10) powerBonus = 0.9;
           else powerBonus = -0.4;

           const netEffect = powerBonus + riskCost;
           nextMomentum += (isHomeOff ? netEffect : -netEffect);
        }

        // -> TUTAJ WSTAW TEN KOD (STAGE 1 PRO: Logika Momentum dla NASTAWIENIE DEFENSYWNE)
             if (prev.userInstructions.mindset === 'DEFENSIVE') {
           const defDiff = pDefSum - aAttSum;
           let defEffect = 0;

           if (defDiff > 25) {
              defEffect = -0.7;    // duża przewaga w obronie → -1% momentum dla rywala (czyli +1% dla Ciebie)
           } else if (defDiff > 10) {
              defEffect = -0.3;    // lekka przewaga → -0.5%
           } else if (defDiff < -10) {
              defEffect = +0.6;    // słaba obrona → +0.6% dla rywala
           } else {
              defEffect = (seededRng(currentSeed, nextMinute, 777) * 0.9) - 0.6; // małe wahania ±0.6%
           }

           nextMomentum += (userSide === 'HOME' ? defEffect : -defEffect);
        }

        // -> TUTAJ WSTAW TEN KOD (STAGE 1 PRO: Logika Momentum dla INTENSYWNOŚĆ AGRESYWNIE)
        if (prev.userInstructions.intensity === 'AGGRESSIVE') {
           const myAttMid = userSide === 'HOME' ? pAttMid : aAttMid;
           const oppDefMid = userSide === 'HOME' ? aDefMid : pDefMid;
           
           if (myAttMid > oppDefMid + 20) {
              // c) Dominacja agresywna +1% do +5% momentum
              const intensityBoost = 0.1 + seededRng(currentSeed, nextMinute, 444) * 0.54;
              nextMomentum += (userSide === 'HOME' ? intensityBoost : -intensityBoost);
        } else {
              const intensityChaos = (seededRng(currentSeed, nextMinute, 555) * 1.4) - 0.7;
              nextMomentum += (userSide === 'HOME' ? intensityChaos : -intensityChaos);
           }
        } 
        // -> TUTAJ WSTAW TEN KOD (Logika Momentum dla INTENSYWNOŚĆ OSTROŻNIE)
        else if (prev.userInstructions.intensity === 'CAUTIOUS') {
           const myPower = userSide === 'HOME' ? pPower : aPower;
           const oppPower = userSide === 'HOME' ? aPower : pPower;
           const myTech = userSide === 'HOME' ? pTechSum : aTechSum;
           const oppTech = userSide === 'HOME' ? aTechSum : pTechSum;

           if (oppPower > myPower + 15) {
              // b) Przewaga siłowa rywala -> tracimy momentum (rywal zyskuje -1 do +5%)
              const oppShift = (seededRng(currentSeed, nextMinute, 111) * 1.3) - 0.8;
              nextMomentum += (userSide === 'HOME' ? -oppShift : oppShift);
           } 
           else if (myTech > oppTech + 15) {
              // c) Nasza dominacja techniczna -> zyskujemy momentum (+1% do +5%)
              const techBoost = 1 + seededRng(currentSeed, nextMinute, 222) * 1.3;
              nextMomentum += (userSide === 'HOME' ? techBoost : -techBoost);
           } 
           else {
              // d) Inny przypadek -> neutralne wahania (-1.5% do +1.5%)
              const subtleChaos = (seededRng(currentSeed, nextMinute, 333) * 0.7) - 0.6;
              nextMomentum += (userSide === 'HOME' ? subtleChaos : -subtleChaos);
           }
        }

       // --- STAGE 1 PRO: DRENAŻ KONDYCJI (FIXED) ---
              const updateFatigue = (lineup: (string | null)[], fatigueMap: Record<string, number>, teamPlayers: Player[], currentTempo: string, currentIntensity: string) => {

// --- APLIKACJA WIATRU W ŻAGLE (COMEBACK BOOST) ---
        if ((prev as any).comebackExpiry && nextMinute <= (prev as any).comebackExpiry) {
            const sideMult = (prev as any).comebackSide === 'HOME' ? 1 : -1;
            const boost = (prev as any).comebackPower || 0;
            nextMomentum += (boost * sideMult);
            
            // Wizualny efekt pulsowania paska przy boost'cie
            if (nextMinute % 2 === 0) nextMomentum += (2 * sideMult);
        }

            lineup.forEach(id => {
                if (!id) return;
                const p = teamPlayers.find(x => x.id === id);
                if (!p) return;
                const current = fatigueMap[id] !== undefined ? fatigueMap[id] : p.condition;
                const stamina = p.attributes.stamina || 50;
                const strength = p.attributes.strength || 50;
                
                let drain = 0.090 + ((100 - (stamina * 0.65 + strength * 0.35)) / 100) * 0.065;

                if (currentTempo === 'SLOW') drain *= 0.78;
                if (currentTempo === 'FAST') drain *= 1.25;
                if (currentIntensity === 'AGGRESSIVE') drain *= 1.35;
                
                const isAiTeam = teamPlayers === (userSide === 'HOME' ? ctx.awayPlayers : ctx.homePlayers);
                if (isAiTeam && currentAiShout) {
                   if (currentAiShout.intensity === 'AGGRESSIVE') drain *= 1.35;
                   if (currentAiShout.tempo === 'FAST') drain *= 1.25;
                }

                fatigueMap[id] = Math.max(0, current - drain);
            });
        };

        // -> tutaj wstaw kod (LOGIKA DOPASOWANA: Zmienne localHome/AwayFatigue są już zainicjowane na początku bloku)
        updateFatigue(nextHomeLineup.startingXI, localHomeFatigue, ctx.homePlayers, 
                      userSide === 'HOME' ? activePlayerTempo : (currentAiShout?.tempo || 'NORMAL'),
                      userSide === 'HOME' ? (isPlayerEffectActive ? prev.userInstructions.intensity : 'NORMAL') : (currentAiShout?.intensity || 'NORMAL'));
        updateFatigue(nextAwayLineup.startingXI, localAwayFatigue, ctx.awayPlayers,
                      userSide === 'AWAY' ? activePlayerTempo : (currentAiShout?.tempo || 'NORMAL'),
                      userSide === 'AWAY' ? (isPlayerEffectActive ? prev.userInstructions.intensity : 'NORMAL') : (currentAiShout?.intensity || 'NORMAL'));

       const hasEmptySlotsAi = aiSide === 'AWAY' ? nextAwayLineup.startingXI.some(id => id === null) : nextHomeLineup.startingXI.some(id => id === null);
        
        // --- TUTAJ WSTAW TEN KOD (Inteligentny Wyzwalacz Decyzji AI) ---
        // AI reaguje częściej (isPriority), jeśli:
        // 1. Ma pusty slot w składzie
        // 2. Jest końcówka meczu (80min+) i przegrywa jednym golem
        // 3. Jest w dogrywce i nastąpiła zmiana wyniku
        const diff = aiSide === 'HOME' ? (prev.homeScore - prev.awayScore) : (prev.awayScore - prev.homeScore);
        const isCrisis = hasEmptySlotsAi || (nextMinute > 80 && diff === -1) || (prev.isExtraTime && diff !== 0);


const diffAi = aiSide === 'HOME' ? (hScore - aScore) : (aScore - hScore);
        const playerSentOffCount = nextSentOffIds.filter(id => (userSide === 'HOME' ? ctx.homePlayers : ctx.awayPlayers).some(p => p.id === id)).length;

        const aiSensors = {
          losingByTwo: diffAi <= -2,
          opponentShortHanded: diffAi >= 0 && playerSentOffCount > 0,
          winningWeaker: diffAi >= 1 && pPower > aPower + 10,
          winningStronger: diffAi >= 1 && aPower > pPower + 10,
          lateLeadUnderPressure: diffAi === 1 && nextMinute >= 70 && pPower > aPower,
          lateChase: diffAi === -1 && nextMinute >= 70,
          lateDrawUnderPressure: diffAi === 0 && nextMinute >= 70 && pPower > aPower
        };

        const isPriority = aiSensors.losingByTwo || aiSensors.lateChase || hasEmptySlotsAi || (nextMinute > 80 && diffAi === -1);



       if (true) {
          // TUTAJ ZASTĄP KOD (DODANIE PRZEKAZYWANIA aiSensors)
    const decision = AiMatchDecisionCupService.makeDecisions(
             { ...prev, minute: nextMinute, homeLineup: nextHomeLineup, awayLineup: nextAwayLineup, homeInjuries: nextHomeInjuries, awayInjuries: nextAwayInjuries, homeFatigue: localHomeFatigue, awayFatigue: localAwayFatigue, sentOffIds: nextSentOffIds, lastAiActionMinute: prev.lastAiActionMinute }, 
             ctx, 
             aiSide, 
             isPriority, // ZMIANA: używamy isPriority zamiast isCrisis
             aiCoach,
             playerTacticId,
             aiSensors   // DODANO: przekazujemy sensory
           );
          // KONIEC POPRAWKI
           
           if (decision.subRecord) {
              if (aiSide === 'HOME') { 
                nextHomeLineup = decision.newLineup || nextHomeLineup; 
                nextSubsCountHome = decision.newSubsCount ?? nextSubsCountHome; 
                nextHomeSubsHistory = [...nextHomeSubsHistory, decision.subRecord]; 
              } else { 
                nextAwayLineup = decision.newLineup || nextAwayLineup; 
                nextSubsCountAway = decision.newSubsCount ?? nextSubsCountAway; 
                nextAwaySubsHistory = [...nextAwaySubsHistory, decision.subRecord]; 
              }
           }

           if (decision.newTacticId) {
              if (aiSide === 'HOME') nextHomeLineup.tacticId = decision.newTacticId;
              else nextAwayLineup.tacticId = decision.newTacticId;
           }

           if (decision.logs) {
              decision.logs.forEach(l => {
                 updatedLogs = [{ id: `AI_C_LOG_${Math.random()}`, minute: nextMinute, text: l, type: MatchEventType.GENERIC }, ...updatedLogs];
              });
           }

           if (decision.subRecord || decision.newTacticId) {
              nextLastAiActionMinute = nextMinute;
           }
        } // Zamyka blok if (true)

        return {
          ...prev, 
          homeFatigue: localHomeFatigue,
          awayFatigue: localAwayFatigue,
          minute: nextMinute, 
          homeScore: hScore, 
          awayScore: aScore, 
          logs: updatedLogs, 
          momentum: nextMomentum,
          homeGoals: updatedHomeGoals,
          awayGoals: updatedAwayGoals,
          homeLineup: nextHomeLineup,
          awayLineup: nextAwayLineup,
          playerYellowCards: nextPlayerYellowCards, 
          sentOffIds: nextSentOffIds,             
          homeInjuries: nextHomeInjuries,         
          awayInjuries: nextAwayInjuries,         
          homeSubsHistory: nextHomeSubsHistory,
          awaySubsHistory: nextAwaySubsHistory,
          subsCountHome: nextSubsCountHome,
          subsCountAway: nextSubsCountAway,
        lastGoalBoostMinute: (prev as any).lastGoalBoostMinute, 
          isPaused: nextIsPaused,
           isPausedForEvent: nextIsPausedForEvent,
          // -> tutaj wstaw kod
          // Używamy zaktualizowanej zmiennej lokalnej
          lastAiActionMinute: nextLastAiActionMinute,
           aiActiveShout: currentAiShout,
            activeTacticalBoost: nextTacticalBoost,
          tacticalBoostExpiry: nextTacticalExpiry                
        };
      });
    }, matchState.speed === 5 ? 80 : matchState.speed === 2.5 ? 240 : 600);

    return () => clearInterval(interval);
  }, [matchState?.isPaused, matchState?.isPausedForEvent, matchState?.isFinished, matchState?.isHalfTime, matchState?.isPenalties, matchState?.speed, ctx, setMatchState, isFinishing, isCelebratingGoal, isTacticsOpen, userSide]);

  const handleFinish = () => {
    if (!matchState || !ctx) return;
    setIsFinishing(true);

    const isHomeWinner = matchState.isPenalties
      ? (matchState.homePenaltyScore || 0) > (matchState.awayPenaltyScore || 0)
      : matchState.homeScore > matchState.awayScore;

    const updatedClubs = clubs.map(c => {
       if (c.id === ctx.homeClub.id) return { ...c, isInPolishCup: isHomeWinner };
       if (c.id === ctx.awayClub.id) return { ...c, isInPolishCup: !isHomeWinner };
       return c;
    });

    const generatePerformance = (playersList: Player[], scoreAgainst: number) => {
      return playersList.slice(0, 11).map(p => {
        const perf: PlayerPerformance = {
          playerId: p.id,
          name: p.lastName,
          position: p.position,
          goals: 0,
          assists: 0,
          yellowCards: 0,
          redCards: 0,
          missedPenalties: 0,
          savedPenalties: 0,
          healthStatus: HealthStatus.HEALTHY,
          fatigue: 90
        };
        perf.rating = PostMatchCommentSelector.calculateRating(perf, scoreAgainst);
        return perf;
      });
    };

    const summary: MatchSummary = {
      matchId: ctx.fixture.id,
      userTeamId: userTeamId!,
      homeClub: ctx.homeClub,
      awayClub: ctx.awayClub,
      homeScore: matchState.homeScore,
      awayScore: matchState.awayScore,
      homePenaltyScore: matchState.homePenaltyScore,
      awayPenaltyScore: matchState.awayPenaltyScore,
      homeGoals: matchState.homeGoals,
      awayGoals: matchState.awayGoals,
      homeStats: { shots: 12, shotsOnTarget: 6, corners: 4, fouls: 10, offsides: 1, yellowCards: 1, redCards: 0, possession: 50 },
      awayStats: { shots: 10, shotsOnTarget: 4, corners: 3, fouls: 12, offsides: 2, yellowCards: 2, redCards: 0, possession: 50 },
      homePlayers: generatePerformance(ctx.homePlayers, matchState.awayScore),
      awayPlayers: generatePerformance(ctx.awayPlayers, matchState.homeScore),
      timeline: []
    };

   if (ctx.fixture.id.includes('SUPER_CUP')) {
      const isUserWinner = (isHomeWinner && userSide === 'HOME') || (!isHomeWinner && userSide === 'AWAY');
      
      if (isUserWinner) {
         const winMail = MailService.generateSuperCupMail(ctx.homeClub.name, ctx.awayClub.name, `${matchState.homeScore}:${matchState.awayScore}`);
         setMessages(prev => [winMail, ...prev]);
      } else {
         const userClub = userSide === 'HOME' ? ctx.homeClub : ctx.awayClub;
         const opponentName = userSide === 'HOME' ? ctx.awayClub.name : ctx.homeClub.name;
         const userScore = userSide === 'HOME' ? matchState.homeScore : matchState.awayScore;
         const oppScore = userSide === 'HOME' ? matchState.awayScore : matchState.homeScore;

         const lossMails = MailService.generateSuperCupLossMails(userClub, opponentName, userScore, oppScore);
         setMessages(prev => [...lossMails, ...prev]);
      }
    }

    MatchHistoryService.logMatch({
      matchId: ctx.fixture.id,
      date: currentDate.toDateString(),
      season: seasonNumber,
      competition: ctx.fixture.leagueId,
      homeTeamId: ctx.homeClub.id,
      awayTeamId: ctx.awayClub.id,
      homeScore: matchState.homeScore,
      awayScore: matchState.awayScore,
      homePenaltyScore: matchState.homePenaltyScore,
      awayPenaltyScore: matchState.awayPenaltyScore,
      goals: matchState.homeGoals.map(g => ({ ...g, teamId: ctx.homeClub.id }))
        .concat(matchState.awayGoals.map(g => ({ ...g, teamId: ctx.awayClub.id }))),
      cards: (() => {
          const playerYellowCount: Record<string, number> = {};
          return [...matchState.logs]
            .filter(l => l.type === MatchEventType.YELLOW_CARD || l.type === MatchEventType.RED_CARD)
            .sort((a, b) => a.minute - b.minute)
            .map(l => {
               const pId = l.playerName || '?'; 
               let finalType: 'YELLOW' | 'RED' | 'SECOND_YELLOW' = l.type === MatchEventType.RED_CARD ? 'RED' : 'YELLOW';
               
               if (finalType === 'YELLOW') {
                  playerYellowCount[pId] = (playerYellowCount[pId] || 0) + 1;
                  if (playerYellowCount[pId] === 2) finalType = 'SECOND_YELLOW';
               }

               return {
                  playerName: l.playerName || '?',
                  minute: l.minute,
                  teamId: l.teamSide === 'HOME' ? ctx.homeClub.id : ctx.awayClub.id,
                  type: finalType as any
               };
            });
        })()
    });

    setLastMatchSummary(summary);
    setMatchState(null);

   const finalPlayers = { ...players };
    [ctx.homeClub.id, ctx.awayClub.id].forEach(clubId => {
       finalPlayers[clubId] = finalPlayers[clubId].map(p => {
          const sideFatigue = clubId === ctx.homeClub.id ? matchState.homeFatigue : matchState.awayFatigue;
          const endCondition = sideFatigue[p.id] !== undefined ? sideFatigue[p.id] : p.condition;

          let updatedPlayer = { ...p, condition: Math.min(100, endCondition + 5) };
          // Jeśli zawodnik grał, naliczamy dług
          const onPitchIds = clubId === ctx.homeClub.id ? matchState.homeLineup.startingXI : matchState.awayLineup.startingXI;
          if (onPitchIds.includes(p.id)) {
             const matchDebt = 10 + ((100 - (p.attributes.stamina || 50)) * 0.2);
             updatedPlayer.fatigueDebt = Math.min(100, (updatedPlayer.fatigueDebt || 0) + matchDebt);
          }

      
          return updatedPlayer;
          // KONIEC KODU (Zastąp pętlę mapującą tym blokiem)

       });
    });

   applySimulationResult({
      updatedFixtures: fixtures.map(f => f.id === ctx.fixture.id ? { 
        ...f, 
        status: MatchStatus.FINISHED, 
        homeScore: matchState.homeScore, 
        awayScore: matchState.awayScore, 
        homePenaltyScore: matchState.homePenaltyScore, 
        awayPenaltyScore: matchState.awayPenaltyScore 
      } : f),
      updatedClubs,
      updatedPlayers: finalPlayers,
      updatedLineups: {},
      newOffers: [], // TUTAJ DODAJEMY TEN KOD
      roundResults: null,
      seasonNumber: seasonNumber
    });

    navigateTo(ViewState.POST_MATCH_CUP_STUDIO);
  };

  const renderSquad = (side: 'HOME' | 'AWAY') => {
    const club = side === 'HOME' ? ctx?.homeClub : ctx?.awayClub;
    const lineup = side === 'HOME' ? matchState?.homeLineup : matchState?.awayLineup;
    const teamPlayers = side === 'HOME' ? ctx?.homePlayers : ctx?.awayPlayers;
    if (!lineup || !teamPlayers) return null;

    return (
      <div className={`w-64 rounded-[35px] border border-white/5 p-4 flex flex-col gap-2 overflow-hidden shadow-2xl backdrop-blur-xl`}>
         <div className="flex items-center gap-3 mb-2 px-2">
            <div className="w-8 h-8 rounded-lg flex flex-col overflow-hidden border border-white/10 shrink-0">
               <div className="flex-1" style={{ backgroundColor: club?.colorsHex[0] }} />
               <div className="flex-1" style={{ backgroundColor: club?.colorsHex[1] || club?.colorsHex[0] }} />
            </div>
            <span className="text-[10px] font-black text-white uppercase italic truncate">{club?.name}</span>
         </div>
         <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1">

{/* *** TUTAJ WSTAW TEN KOD (TACTICAL STATUS DISPLAY) *** */}
         {side !== userSide && matchState.aiActiveShout && (
           <div className="bg-black/40 p-3 rounded-2xl border border-white/5 mb-2 flex flex-col gap-2 shadow-inner">
              <div className="flex justify-between items-center">
                 <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">USTAWIENIE I TAKTYKA </span>
                 <span className="text-[8px] font-black text-white italic">{TacticRepository.getById(matchState[side === 'HOME' ? 'homeLineup' : 'awayLineup'].tacticId).name}</span>
              </div>
              <div className={`flex gap-1.5 transition-opacity duration-500 ${(matchState.aiActiveShout as any).isExpired ? 'opacity-40' : 'opacity-100'}`}>
                 <span className="text-[7px] font-black px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {matchState.aiActiveShout.tempo} {(matchState.aiActiveShout as any).isExpired && '...'}
                 </span>
                 <span className="text-[7px] font-black px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {matchState.aiActiveShout.mindset} {(matchState.aiActiveShout as any).isExpired && '...'}
                 </span>
                 <span className="text-[7px] font-black px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    {matchState.aiActiveShout.intensity} {(matchState.aiActiveShout as any).isExpired && '...'}
                 </span>
              </div>
              {(matchState.aiActiveShout as any).isExpired && (
                <span className="text-[6px] font-black text-slate-500 uppercase animate-pulse">Analiza taktyczna w toku...</span>
              )}
           </div>
         )}


            {lineup.startingXI.map(pid => {
               const p = teamPlayers.find(x => x.id === pid);
               if (!p) return null;

               // TUTAJ WSTAW TEN KOD (Obliczanie spadku kondycji)
               const currentFatigue = matchState[side === 'HOME' ? 'homeFatigue' : 'awayFatigue'][p.id] ?? p.condition;
               const fatigueDrop = Math.max(0, p.condition - currentFatigue).toFixed(1);

               return (
                 <div key={p.id} className="flex items-center gap-3 py-1.5 px-3 rounded-xl bg-white/[0.02] border border-white/[0.05] transition-all">
                    <span className={`font-mono font-black text-[9px] w-6 ${PlayerPresentationService.getPositionColorClass(p.position)}`}>{p.position}</span>
                    <div className="flex-1 flex flex-col min-w-0">
                       <span className="text-[10px] text-slate-200 font-bold uppercase italic truncate">{p.firstName.charAt(0)}. {p.lastName}</span>
                       <div className="w-full h-0.5 bg-black/40 rounded-full overflow-hidden mt-1">
                          <div 
                             className={`h-full transition-all duration-1000 ${
                                (matchState[side === 'HOME' ? 'homeFatigue' : 'awayFatigue'][p.id] ?? p.condition) >= 80 ? 'bg-emerald-500' : 
                                (matchState[side === 'HOME' ? 'homeFatigue' : 'awayFatigue'][p.id] ?? p.condition) >= 65 ? 'bg-orange-500' : 'bg-red-500'
                             }`}
                          style={{ width: `${currentFatigue}%` }}
                          />
                       </div>
                       {/* TUTAJ WSTAW TEN KOD (Wyświetlanie liczby spadku) */}
                       <div className="flex justify-end">
                          <span className="text-[7px] font-mono text-rose-500/80 mt-0.5">-{fatigueDrop}%</span>
                       </div>
                    </div>
                    
                    <div className="flex gap-1 ml-2">
                       {matchState.playerYellowCards[p.id] === 1 && <span>🟨</span>}
                       {matchState.sentOffIds.includes(p.id) && <span>🟥</span>}
                       {(side === 'HOME' ? matchState.homeInjuries[p.id] : matchState.awayInjuries[p.id]) === InjurySeverity.LIGHT && <span className="text-white font-bold">✚</span>}
                       {(side === 'HOME' ? matchState.homeInjuries[p.id] : matchState.awayInjuries[p.id]) === InjurySeverity.SEVERE && <span className="text-red-500 font-bold animate-pulse">✚</span>}
                    </div>
                 </div>
               );
            })}
         </div>
         <div className="mt-4 pt-3 border-t border-white/5 space-y-1">
            <h5 className="text-[7px] font-black text-slate-500 uppercase tracking-widest px-2">Zmiany</h5>
            {(side === 'HOME' ? matchState.homeSubsHistory : matchState.awaySubsHistory).map((sub, sIdx) => {
               const pIn = teamPlayers.find(p => p.id === sub.playerInId);
               const pOut = teamPlayers.find(p => p.id === sub.playerOutId);
               return (
                 <div key={sIdx} className="flex items-center gap-2 px-3 py-1 bg-white/[0.01] rounded border border-white/[0.03]">
                    <span className="text-[8px] text-emerald-400 font-bold">{sub.minute}'</span>
                    <span className="text-[9px] text-slate-300 font-bold truncate">↑ {pIn?.lastName}</span>
                    <span className={`text-[9px] ${pOut ? 'text-slate-600' : 'text-slate-700 italic'} truncate`}>↓ {pOut?.lastName || 'zniesiony'}</span>
                 </div>
               );
            })}
         </div>
      </div>
    );
  };

  if (!matchState || !ctx || !kitColors) return null;

  return (
    <div className="h-screen w-full text-slate-100 flex flex-col p-6 gap-6 animate-fade-in overflow-hidden relative selection:bg-rose-500">
    



        <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: "url('https://i.ibb.co/fdSSvHLz/stadion.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-950/40 to-slate-950/90" />
        <div className="absolute inset-0 backdrop-blur-[2px] bg-slate-950/20" />
      </div>

      <header className="flex items-center justify-between h-32 bg-slate-900/60 backdrop-blur-3xl rounded-[40px] border border-white/10 px-12 shadow-2xl shrink-0">
         <div className="flex-1 flex flex-col justify-center">
            <div className="flex items-center gap-6">
              <BigJerseyIcon primary={kitColors.home.primary} secondary={kitColors.home.secondary} size="w-16 h-16" />
              <h2 className="text-5xl font-black italic uppercase tracking-tighter drop-shadow-2xl">{ctx.homeClub.name}</h2>
            </div>
            <div className="flex flex-wrap gap-2 mt-1">
              {matchState.homeGoals.map((g, i) => (
                 <span key={i} className={`text-[9px] font-bold uppercase italic ${g.isMiss ? 'text-rose-500/80' : 'text-white/60'}`}>
                    {g.isMiss ? '❌' : '⚽'} {g.playerName} {g.minute}'{g.isPenalty ? ' k.' : ''}
                 </span>
              ))}
           {matchState.logs.filter(l => l.teamSide === 'HOME' && l.type === MatchEventType.RED_CARD).map((l, i) => (
                 <span key={`red-h-${i}`} className="text-[9px] font-black text-red-500 uppercase italic">🟥 {l.playerName} {l.minute}'</span>
              ))}
             
              {matchState.logs.filter(l => l.teamSide === 'HOME' && l.type === MatchEventType.INJURY_SEVERE).map((l, i) => (
                 <span key={`inj-h-${i}`} className="text-[9px] font-black text-white bg-red-600/40 px-1 rounded uppercase italic"><span className="text-red-500 font-bold animate-pulse">✚ {l.playerName} {l.minute}'</span></span>
              ))}
            </div>
         </div>

        <div className="flex flex-col items-center gap-3 w-64">
            {isCelebratingGoal ? (
               <div className="flex flex-col items-center justify-center animate-pulse-gold">
                  <span className="text-6xl font-black italic text-rose-500 tracking-tighter drop-shadow-[0_0_30px_rgba(225,29,72,1)]">GOL!</span>
               </div>
            ) : (
               <div className="text-7xl font-black font-mono tracking-tighter tabular-nums flex items-center gap-4 animate-fade-in">
                  {matchState.homeScore} <span className="text-slate-700 opacity-50">:</span> {matchState.awayScore}
               </div>
            )}
            {matchState.isPenalties && (
               <div className="text-2xl font-black text-rose-500 animate-pulse">
                  KARNE: {matchState.homePenaltyScore} : {matchState.awayPenaltyScore}
               </div>
            )}
            <div className="flex items-center gap-3">
               <div className="px-4 py-1 bg-rose-600/20 border border-rose-500/30 rounded-xl">
                  <span className="text-lg font-mono text-rose-500 font-bold tracking-widest">{matchState.minute}'</span>
               </div>
               {(matchState.isExtraTime && !matchState.isPenalties) && <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest animate-pulse">DOGRYWKA</span>}
            </div>
         </div>

         <div className="flex-1 flex flex-col justify-center items-end">
            <div className="flex items-center gap-6 text-right">
              <h2 className="text-5xl font-black italic uppercase tracking-tighter drop-shadow-2xl">{ctx.awayClub.name}</h2>
              <BigJerseyIcon primary={kitColors.away.primary} secondary={kitColors.away.secondary} size="w-16 h-16" />
            </div>
            <div className="flex flex-wrap gap-2 mt-1 justify-end">
              {matchState.awayGoals.map((g, i) => (
                 <span key={i} className={`text-[9px] font-bold uppercase italic ${g.isMiss ? 'text-rose-500/80' : 'text-white/60'}`}>
                    {g.playerName} {g.minute}'{g.isPenalty ? ' k.' : ''} {g.isMiss ? '❌' : '⚽'}
                 </span>
              ))}
            {matchState.logs.filter(l => l.teamSide === 'AWAY' && l.type === MatchEventType.RED_CARD).map((l, i) => (
                 <span key={`red-a-${i}`} className="text-[9px] font-black text-red-500 uppercase italic">{l.playerName} {l.minute}' 🟥</span>
              ))}
            
              {matchState.logs.filter(l => l.teamSide === 'AWAY' && l.type === MatchEventType.INJURY_SEVERE).map((l, i) => (
                 <span key={`inj-a-${i}`} className="text-[9px] font-black text-white bg-red-600/40 px-1 rounded uppercase italic">{l.playerName} {l.minute}' <span className="text-red-500 font-bold animate-pulse">✚ </span></span>
              ))}
            </div>
         </div>
      </header>

      <div className="flex-1 flex flex-col gap-6 min-w-0 relative">
         
         <div className="h-6 w-full max-w-5xl mx-auto bg-black/40 rounded-full overflow-hidden border border-white/10 flex shadow-2xl shrink-0 p-0.5 backdrop-blur-xl relative">
            <div 
              className="h-full transition-all duration-500 flex items-center justify-end pr-4 text-[9px] font-black rounded-l-full relative overflow-hidden" 
              style={{ backgroundColor: kitColors.home.primary, width: `${50 + matchState.momentum / 2}%`, color: kitColors.home.text }}
            >
               <div className="absolute inset-0 bg-white/10 opacity-20 animate-pulse" />
               {Math.round(50 + matchState.momentum / 2)}%
            </div>
            <div 
              className="h-full transition-all duration-500 flex items-center justify-start pl-4 text-[9px] font-black rounded-r-full relative overflow-hidden" 
              style={{ backgroundColor: kitColors.away.primary, flex: 1, color: kitColors.away.text }}
            >
               <div className="absolute inset-0 bg-white/10 opacity-20 animate-pulse" />
               {Math.round(50 - matchState.momentum / 2)}%
            </div>
         </div>

         <div className="flex-1 flex gap-8 min-h-0 relative">
            {renderSquad('HOME')}

            <div className="flex-1 relative overflow-hidden">
               {penaltyNotice && (
                  <div className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-none">
                     <div className="bg-white/50 backdrop-blur-sm px-10 py-6 rounded-2xl shadow-[0_0_50px_rgba(255,255,255,0.4)] border-4 border-red-600 animate-bounce">
                        <h2 className="text-red-600 text-4xl font-black italic uppercase tracking-tighter text-center">
                           📯 JEDENSTKA DLA ⚽ {penaltyNotice.toUpperCase()}!
                        </h2>
                     </div>
                  </div>
               )}
               {matchState.isPenalties && (
                  <div className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-12 text-center animate-fade-in">
                     <h3 className="text-5xl font-black italic text-rose-500 uppercase mb-12 tracking-tighter">RZUTY KARNE</h3>
                     <div className="flex items-center gap-20">
                        <div className="space-y-4">
                           <span className="text-xs font-black text-slate-500 uppercase tracking-widest">GOSPODARZE</span>
                           <div className="flex gap-2">
                              {matchState.penaltySequence?.filter(s => s.side === 'HOME').map((s, i) => (
                                 <div key={i} className={`w-6 h-6 rounded-full border-2 ${s.result === 'SCORED' ? 'bg-emerald-500 border-emerald-400' : 'bg-red-600 border-red-500'}`} />
                              ))}
                           </div>
                        </div>
                        <div className="text-8xl font-black font-mono text-white tracking-tighter">
                           {matchState.homePenaltyScore} : {matchState.awayPenaltyScore}
                        </div>
                        <div className="space-y-4">
                           <span className="text-xs font-black text-slate-500 uppercase tracking-widest">GOŚCIE</span>
                           <div className="flex gap-2">
                              {matchState.penaltySequence?.filter(s => s.side === 'AWAY').map((s, i) => (
                                 <div key={i} className={`w-6 h-6 rounded-full border-2 ${s.result === 'SCORED' ? 'bg-emerald-500 border-emerald-400' : 'bg-red-600 border-red-500'}`} />
                           ))}
                           </div>
                        </div>
                     </div>
                  </div>
               )}

<div className="w-full h-full rounded-[0px] border-1 border-emerald-900/1 relative overflow-hidden flex items-center justify-center">
  <div className="absolute inset-0 rounded-[1px] overflow-hidden"
    style={{
      background: '#064c2f',
      backgroundImage: 'repeating-linear-gradient(to bottom, transparent, transparent 5%, rgba(255,255,255,0.015) 12%, rgba(255,255,255,0.015) 24%)',
      transform: 'perspective(950px) rotateX(24deg)',
      transformOrigin: 'center center',
      transformStyle: 'preserve-3d',
      opacity: 0.5  
    }}
  ></div>
  
  <div className="absolute inset-0 pointer-events-none opacity-50 rounded-[36px] overflow-hidden" 
    style={{ 
      padding: '16px',
      transform: 'perspective(950px) rotateX(24deg)',
      transformOrigin: 'center center',
      transformStyle: 'preserve-3d'
    }}>
    <div className="absolute top-4 left-4 right-4 bottom-4 border-2 border-white/70" />
    <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-white/70 -translate-y-1/2" />
    <div className="absolute top-1/2 left-1/2 w-28 h-28 border-2 border-white/70 rounded-full -translate-x-1/2 -translate-y-1/2" />
    <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-white/70 rounded-full -translate-x-1/2 -translate-y-1/2" />
    <div className="absolute top-4 left-1/2 w-[50%] h-[20%] -translate-x-1/2">
      <div className="absolute top-0 left-0 w-0.5 h-full bg-white/70" />
      <div className="absolute top-0 right-0 w-0.5 h-full bg-white/70" />
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/70" />
    </div>
    <div className="absolute top-4 left-1/2 w-[24%] h-[9%] -translate-x-1/2">
      <div className="absolute top-0 left-0 w-0.5 h-full bg-white/70" />
      <div className="absolute top-0 right-0 w-0.5 h-full bg-white/70" />
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/70" />
    </div>
    <div 
      className="absolute left-1/2 w-[18%] h-[38px] -translate-x-1/2"
      style={{
        top: 'calc(4px + 20% - 3px)',
        border: '2px solid rgba(255,255,255,0.7)',
        borderTop: 'none',
        borderLeft: 'none',
        borderRight: 'none',
        borderRadius: '0 0 100% 100%'
      }}
    />
    <div className="absolute left-1/2 w-2 h-2 bg-white/70 rounded-full -translate-x-1/2" style={{ top: 'calc(16px + 11% + 15px)' }} />
    <div 
      className="absolute left-1/2 w-[40%] h-10 -translate-x-1/2"
      style={{
        top: 'calc(4px + 20% - 6px)',
        border: '2px solid rgba(255,255,255,0.7)',
        borderTop: 'none',
        borderLeft: 'none',
        borderRight: 'none',
        borderRadius: '0 0 100% 100%',
        clipPath: 'polygon(0 0, 100% 0, 100% 60%, 0 60%)'
      }}
    />
    <div className="absolute bottom-4 left-1/2 w-[50%] h-[20%] -translate-x-1/2">
      <div className="absolute bottom-0 left-0 w-0.5 h-full bg-white/70" />
      <div className="absolute bottom-0 right-0 w-0.5 h-full bg-white/70" />
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/70" />
    </div>
    <div className="absolute bottom-4 left-1/2 w-[24%] h-[9%] -translate-x-1/2">
      <div className="absolute bottom-0 left-0 w-0.5 h-full bg-white/70" />
      <div className="absolute bottom-0 right-0 w-0.5 h-full bg-white/70" />
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/70" />
    </div>
    <div 
      className="absolute left-1/2 w-[18%] h-[38px] -translate-x-1/2"
      style={{
        bottom: 'calc(4px + 20% - 3px)',
        border: '2px solid rgba(255,255,255,0.7)',
        borderBottom: 'none',
        borderLeft: 'none',
        borderRight: 'none',
        borderRadius: '100% 100% 0 0'
      }}
    />
    <div className="absolute left-1/2 w-2 h-2 bg-white/70 rounded-full -translate-x-1/2" style={{ bottom: 'calc(16px + 11% + 15px)' }} />
    <div 
      className="absolute left-1/2 w-[40%] h-10 -translate-x-1/2"
      style={{
        bottom: 'calc(4px + 20% - 6px)',
        border: '2px solid rgba(255,255,255,0.7)',
        borderBottom: 'none',
        borderLeft: 'none',
        borderRight: 'none',
        borderRadius: '100% 100% 0 0',
        clipPath: 'polygon(0 40%, 100% 40%, 100% 100%, 0 100%)'
      }}
    />
    <div className="absolute w-5 h-5" style={{ top: '14px', left: '14px', border: '2px solid rgba(255,255,255,0.7)', borderTop: 'none', borderLeft: 'none', borderRadius: '0 0 100% 0' }} />
    <div className="absolute w-5 h-5" style={{ top: '14px', right: '14px', border: '2px solid rgba(255,255,255,0.7)', borderTop: 'none', borderRight: 'none', borderRadius: '0 0 0 100%' }} />
    <div className="absolute w-5 h-5" style={{ bottom: '14px', left: '14px', border: '2px solid rgba(255,255,255,0.7)', borderBottom: 'none', borderLeft: 'none', borderRadius: '0 100% 0 0' }} />
    <div className="absolute w-5 h-5" style={{ bottom: '14px', right: '14px', border: '2px solid rgba(255,255,255,0.7)', borderBottom: 'none', borderRight: 'none', borderRadius: '100% 0 0 0' }} />
    <div className="absolute top-4 left-1/2 w-[10%] h-1 bg-white/70 -translate-x-1/2" />
    <div className="absolute bottom-4 left-1/2 w-[10%] h-1 bg-white/70 -translate-x-1/2" />
  </div>

{/* STAGE 1 PRO: Komunikat o niestrzelonym karnym */}
  {showMissedPenalty && (
    <div className="absolute inset-0 z-[80] flex items-center justify-center pointer-events-none" style={{ transform: 'rotateX(-24deg)' }}>
      <div className="bg-red-600/90 backdrop-blur-2xl border-y-4 border-white px-16 py-8 rounded-[40px] shadow-[0_0_100px_rgba(220,38,38,0.8)] animate-bounce">
        <span className="text-6xl font-black italic text-white uppercase tracking-tighter">NIE STRZELA!!!</span>
      </div>
    </div>
  )}


  {matchState.isHalfTime && (
    <div className="absolute inset-0 z-[60] flex items-center justify-center pointer-events-none" style={{ transform: 'rotateX(-24deg)' }}>
       <div className="bg-slate-950/90 backdrop-blur-2xl border-y-4 border-rose-600 px-16 py-8 rounded-[40px] shadow-[0_0_100px_rgba(225,29,72,0.4)] animate-pulse">
          <div className="flex flex-col items-center">
             <span className="text-[10px] font-black text-rose-500 tracking-[0.5em] mb-2">STATUS SPOTKANIA</span>
             <span className="text-6xl font-black italic text-white uppercase tracking-[0.2em] drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">PRZERWA</span>
          </div>
       </div>
    </div>
  )}

{isPausedForSevereInjury && (
  <div className="absolute inset-0 z-[70] flex items-center justify-center pointer-events-none" style={{ transform: 'rotateX(-24deg)' }}>
    <div className="bg-slate-950/90 backdrop-blur-2xl border-y-4 border-red-600 px-16 py-8 rounded-[40px] shadow-[0_0_100px_rgba(220,38,38,0.5)] animate-pulse">
      <div className="flex flex-col items-center gap-4">
        <div className="text-7xl filter drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]">➕</div>
       <div className="text-center">
      <span className="text-[10px] font-black text-red-500 tracking-[0.5em] mb-2 uppercase block">Dokonaj zmiany</span>
      <h2 className="text-4xl font-black italic text-white uppercase tracking-tight drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
        KONTUZJA W TWOJEJ DRUŻYNIE<br/>LEKARZE NA BOISKU.
      </h2>
      <span className="block text-xs font-black text-slate-400 uppercase tracking-widest mt-4 animate-pulse">DOKONAJ ZMIANY</span>
    </div>
      </div>
    </div>
  </div>
)}


{/* NOWY LABEL: KONIEC II POŁOWY / DOGRYWKA (PO KONSTRUKCJI REMISU) */}
 {matchState.isPaused && !matchState.isFinished && matchState.minute >= 90 && !matchState.isExtraTime && matchState.homeScore === matchState.awayScore && (
    <div 
      onClick={startExtraTimeMatch} 
      className="absolute inset-0 z-[60] flex items-center justify-center cursor-pointer" 
      style={{ transform: 'rotateX(-24deg)' }}
    >
      <div className="bg-slate-950/90 backdrop-blur-2xl border-y-4 border-amber-500 px-16 py-8 rounded-[40px] shadow-[0_0_100px_rgba(245,158,11,0.4)] animate-pulse">
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-black text-amber-500 tracking-[0.5em] mb-2 uppercase">KONIEC II POŁOWY</span>
          <span className="text-5xl font-black italic text-white uppercase tracking-[0.1em] drop-shadow-[0_0_20px_rgba(255,255,255,0.3)] text-center">
            KONIEC II POŁOWY<br/>
            <span className="text-2xl text-amber-400 font-bold not-italic tracking-normal">ROZPOCZNIJ DOGRYWKĘ</span>
          </span>
        </div>
      </div>
    </div>
  )}

{matchState.isFinished && matchState.homeScore !== matchState.awayScore && (
  <div className="absolute inset-0 z-[60] flex items-center justify-center pointer-events-none" style={{ transform: 'rotateX(-24deg)' }}>
    <div className="bg-slate-950/90 backdrop-blur-2xl border-y-4 border-emerald-500 px-20 py-12 rounded-[50px] shadow-[0_0_120px_rgba(34,197,94,0.6)] animate-pulse">
      <div className="flex flex-col items-center gap-4">
        <span className="text-sm font-black text-emerald-400 tracking-[0.6em] uppercase">OSTATNI GWIZDEK</span>
        <span className="text-7xl font-black italic text-white uppercase tracking-wider drop-shadow-[0_0_30px_rgba(255,255,255,0.5)]">
          KONIEC MECZU
        </span>
        <span className="text-4xl font-bold text-emerald-300 mt-2">
          {matchState.homeScore} – {matchState.awayScore}
        </span>
      </div>
    </div>
  </div>
)}



  {TacticRepository.getById(matchState.homeLineup.tacticId).slots.map((slot, i) => {
    const pId = matchState.homeLineup.startingXI[i];
    if (!pId) return null;
    const p = ctx.homePlayers.find(px => px.id === pId);
    if (!p) return null;
    
    return (
      <div
        key={`h-${p.id}`}
        className="absolute flex flex-col items-center z-20 transition-all duration-1000"
        style={{
          left: `${slot.x * 100}%`,
          top: `${(slot.y * 0.42 + 0.54) * 100}%`,
          transform: 'translate(-50%, -50%) scale(1.15)',
          willChange: 'transform'
        }}
      >
        <div className="relative">
          <div className="absolute -right-1 top-0 bottom-0 w-1 bg-black/40 rounded-full overflow-hidden border border-white/10 z-30">
             <div 
                className={`w-full absolute bottom-0 transition-all duration-500 ${
                   (matchState.homeFatigue[p.id] ?? p.condition) >= 80 ? 'bg-emerald-500' : 
                   (matchState.homeFatigue[p.id] ?? p.condition) >= 65 ? 'bg-orange-500' : 'bg-red-500'
                }`}
                style={{ height: `${matchState.homeFatigue[p.id] ?? p.condition}%` }}
             />
          </div>
          
          <div
            className="w-6 h-6 rounded-2xl border-2 border-white/50 shadow-2xl flex flex-col overflow-hidden transform -rotate-3"
            style={{ 
              backgroundColor: kitColors.home.primary,
              backfaceVisibility: 'hidden',
              WebkitFontSmoothing: 'antialiased'
            }}
          >
            <div className="flex-1 flex items-center justify-center text-[8px] font-black" style={{ color: kitColors.home.text }}>
              {p.overallRating}
            </div>
          </div>
     {/* Ikonka żółtej kartki przy zawodniku */}
         {matchState.playerYellowCards[p.id] > 0 && (
             <div className="absolute -top-1 -right-1 w-2.5 h-3.5 bg-yellow-400 rounded-sm border border-black shadow-lg z-40" />
          )}
          {/* -> tutaj wstaw kod (STAGE 1 PRO FIX: Poprawna lista bramek i format dla Gospodarzy) */}
          {matchState.homeGoals.some(g => g.playerName === `${p.firstName.charAt(0)}. ${p.lastName}` && !g.isMiss) && (
            <div className="absolute -top-2 -left-2 w-4 h-4 bg-white rounded-full flex items-center justify-center text-[8px] shadow-lg border border-black z-30">
              ⚽
            </div>
          )}
        </div>
        <div className="bg-slate-950/50 backdrop-blur-md px-1.5 py-0.5 rounded-full text-[7px] font-black mt-0 border border-white/10 whitespace-nowrap shadow-2xl italic tracking-tighter text-white"
          style={{ 
            transform: 'scale(1.15)',
            backfaceVisibility: 'hidden',
            WebkitFontSmoothing: 'antialiased'
          }}
        >
          {p.firstName.charAt(0)}. {p.lastName} {/* -> tutaj wstaw kod */}
        </div>
      </div>
    );
  })}

  {TacticRepository.getById(matchState.awayLineup.tacticId).slots.map((slot, i) => {
    const pId = matchState.awayLineup.startingXI[i];
    if (!pId) return null;
    const p = ctx.awayPlayers.find(px => px.id === pId);
    if (!p) return null;
    
    return (
      <div
        key={`a-${p.id}`}
        className="absolute flex flex-col items-center z-20 transition-all duration-1000"
        style={{
          left: `${slot.x * 100}%`,
          top: `${(0.48 - slot.y * 0.42) * 100}%`,
          transform: 'translate(-50%, -50%) scale(1.4)'
        }}
      >
        <div className="relative">
          <div className="absolute -right-1 top-0 bottom-0 w-1 bg-black/40 rounded-full overflow-hidden border border-white/10 z-30">
             <div 
                className={`w-full absolute bottom-0 transition-all duration-500 ${
                   (matchState.awayFatigue[p.id] ?? p.condition) >= 80 ? 'bg-emerald-500' : 
                   (matchState.awayFatigue[p.id] ?? p.condition) >= 65 ? 'bg-orange-500' : 'bg-red-500'
                }`}
                style={{ height: `${matchState.awayFatigue[p.id] ?? p.condition}%` }}
             />
          </div>
          <div
            className="w-6 h-6 rounded-2xl border-2 border-white/50 shadow-2xl flex flex-col overflow-hidden transform -rotate-3"
            style={{ backgroundColor: kitColors.away.primary }}
          >
            <div className="flex-1 flex items-center justify-center text-[7px] font-black" style={{ color: kitColors.away.text }}>
              {p.overallRating}
            </div>
          </div>
          {/* Ikonka żółtej kartki przy zawodniku */}
     {matchState.playerYellowCards[p.id] > 0 && (
             <div className="absolute -top-1 -left-1 w-2.5 h-3.5 bg-yellow-400 rounded-sm border border-black shadow-lg z-40" />
          )}
          {/* -> tutaj wstaw kod (STAGE 1 PRO FIX: Ujednolicony format nazwiska dla Gości) */}
          {matchState.awayGoals.some(g => g.playerName === `${p.firstName.charAt(0)}. ${p.lastName}` && !g.isMiss) && (
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-white rounded-full flex items-center justify-center text-[8px] shadow-lg border border-black z-30">
              ⚽
            </div>
          )}
        </div>
          <div className="bg-slate-950/50 backdrop-blur-md px-1.5 py-0.5 rounded-full text-[7px] font-black mt-0 border border-white/10 whitespace-nowrap shadow-2xl italic tracking-tighter text-white"
          style={{ 
            transform: 'scale(1.15)',
            backfaceVisibility: 'hidden',
            WebkitFontSmoothing: 'antialiased'
          }}
        >
          {p.lastName}
        </div>
      </div>
    );
  })}
</div>


            </div>

            {renderSquad('AWAY')}
         </div>
      </div>

<footer className="h-44 flex gap-4 shrink-0 px-4 pb-2">
        {/* LEWA SEKCJA: LIVE TACTICS UNIT */}
        <div className="w-72 bg-slate-900/60 rounded-[35px] border border-white/10 backdrop-blur-3xl p-4 flex flex-col justify-between shadow-2xl">
          <span className="text-[8px] font-black text-rose-500 uppercase tracking-[0.4em] mb-2 px-2">Live Tactical Console</span>
          <div className="space-y-2">
            {[
              { label: 'TEMPO', key: 'tempo', options: [{v:'SLOW', l:'Wolne'}, {v:'NORMAL', l:'Normalne'}, {v:'FAST', l:'Szybkie'}] },
              { label: 'MINDSET', key: 'mindset', options: [{v:'DEFENSIVE', l:'Defensywne'}, {v:'NEUTRAL', l:'Neutralne'}, {v:'OFFENSIVE', l:'Ofensywne'}] },
              { label: 'INTENSITY', key: 'intensity', options: [{v:'CAUTIOUS', l:'Ostrożnie'}, {v:'NORMAL', l:'Normalnie'}, {v:'AGGRESSIVE', l:'Agresywnie'}] }
            ].map(group => (
              <div key={group.key} className="flex items-center justify-between gap-3 bg-black/20 p-1.5 rounded-xl border border-white/5">
                <span className="text-[7px] font-black text-slate-500 uppercase w-14">{group.label}</span>
                <select 
                  disabled={matchState.minute - matchState.userInstructions.lastChangeMinute < 2}
                  value={matchState.userInstructions[group.key as keyof typeof matchState.userInstructions]}
                  onChange={(e) => {
                    const val = e.target.value as any;
                    const randomDuration = Math.floor(Math.random() * 11) + 5; 
                    setMatchState(s => s ? {
                      ...s, 
                      userInstructions: { 
                        ...s.userInstructions, 
                        [group.key]: val, 
                        lastChangeMinute: s.minute,
                        expiryMinute: s.minute + randomDuration
                      }
                    } : s);
                  }}
                  className="bg-transparent text-white text-[10px] font-black uppercase outline-none cursor-pointer flex-1 text-right"
                >
                  {group.options.map(opt => <option key={opt.v} value={opt.v} className="bg-slate-900">{opt.l}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>

        {/* ŚRODKOWA SEKCJA: MATCH NARRATIVE HUB */}
        <div className="flex-1 bg-slate-900/60 rounded-[35px] border border-white/10 overflow-hidden flex flex-col backdrop-blur-3xl shadow-2xl relative">
          <div className="px-6 py-2 border-b border-white/5 bg-black/20 flex justify-between items-center shrink-0">
            <span className="text-[8px] font-black uppercase tracking-[0.4em] text-white italic">Broadcast Commentary System</span>
            <div className="flex gap-1">
               <div className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
               <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
            {[...matchState.logs].reverse().map((l, i) => (
              <div
                key={i}
                className={`text-[13px] font-black italic uppercase tracking-tighter p-2.5 rounded-xl border-l-4 transition-all
                            ${i === 0 ? 'bg-rose-950/30 border-rose-500 text-white shadow-lg' : 'bg-white/5 border-white/10 text-slate-400 opacity-60 hover:opacity-100'}`}
              >
                <span className="text-rose-500 mr-3 font-mono">{l.minute}'</span>
                {l.text.toUpperCase()}
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        </div>

        {/* PRAWA SEKCJA: ACTION & SPEED CONTROL */}
        <div className="w-80 flex flex-col gap-3">
          {/* Speed Selector Row */}
          <div className="flex bg-black/40 p-1 rounded-2xl border border-white/5 shrink-0">
            {[1, 2.5, 5].map((s) => (
              <button
                key={s}
                onClick={() => setMatchState(prev => prev ? { ...prev, speed: s as any } : prev)}
                className={`flex-1 py-2 rounded-xl font-black text-[9px] transition-all uppercase tracking-widest
                  ${matchState.speed === s 
                    ? 'bg-white text-slate-900 shadow-xl' 
                    : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
              >
                x{s}
              </button>
            ))}
          </div>

          {matchState.isFinished ? (
            <button 
              onClick={handleFinish}
              className="flex-1 bg-emerald-600 border-b-4 border-emerald-800 text-white rounded-3xl font-black uppercase italic text-lg shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              ZAKOŃCZ MECZ <span className="text-2xl">🏁</span>
            </button>
          ) : (
         <div className="flex-1 flex flex-col gap-2">
              <button 
                onClick={() => setMatchState(s => {
                  if (!s) return s;
                  
                  // --- TUTAJ WSTAW TEN KOD (Poprawka skoku czasu i okresów) ---
                  // 1. Inicjacja Dogrywki (z 90 min na 91 min)
           // 1. Inicjacja Dogrywki (z 90 min na 91 min)
                  if (!s.isExtraTime && s.homeScore === s.awayScore && s.minute >= 90 + (s.addedTime ?? 0)) {
                    return { 
                      ...s, 
                      minute: 90, 
                      period: 3,
                      momentum: 0, // TUTAJ WSTAW TEN KOD: Reset na start dogrywki
                      isExtraTime: true, 
                      addedTime: 0, 
                      isPaused: false, 
                      isHalfTime: false, 
                      logs: [{ id: `et_${Date.now()}`, minute: 90, text: "ROZPOCZYNAMY DOGRYWKĘ!", type: MatchEventType.GENERIC }, ...s.logs] 
                    };
                  }
                  
                  // 2. Wznowienie po przerwie (Half-Time)
                  if (s.isHalfTime) {
                    const baseResumedState = { ...s, isHalfTime: false, isPaused: false, momentum: 0 }; // TUTAJ WSTAW TEN KOD: Reset na start połowy
                    
                    if (s.isExtraTime) {
                       return { ...baseResumedState, period: 4, minute: 105 };
                    }
                    return { ...baseResumedState, period: 2, minute: 45 };
                  }
                  // --- KONIEC KODU ---

                  return { ...s, isPaused: !s.isPaused };
                })} 
                className={`flex-1 rounded-3xl font-black uppercase italic text-xl shadow-2xl transition-all hover:scale-[1.02] active:scale-95 border-b-4
                  ${matchState.isHalfTime ? 'bg-blue-600 border-blue-800 text-white' : 
                    (matchState.isPaused ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-800 border-black text-slate-500')}`}
              >
               {/* STAGE 1 PRO: Dynamiczne napisy przycisku akcji */}
    {matchState.minute === 0 && matchState.isPaused ? 'ROZPOCZNIJ' : 
     (matchState.isHalfTime ? 'ROZPOCZNIJ II POŁOWĘ' : 
     (matchState.isPaused ? 'WZNÓW' : 'PAUZA'))}
              </button>

              <button 
                onClick={() => { setIsTacticsOpen(true); setMatchState(s => s ? {...s, isPaused: true} : s); }}
                className="h-12 bg-white/5 border border-white/10 text-slate-300 font-black italic uppercase tracking-widest text-[10px] rounded-2xl hover:bg-white/10 hover:text-white transition-all shadow-xl"
              >
                ⚙ TAKTYKA
              </button>
            </div>
          )}
        </div>
      </footer>

  {isTacticsOpen && (
        <MatchCupTacticsModal 
          isOpen={isTacticsOpen} 
          onClose={handleTacticsClose} 
          club={userSide === 'HOME' ? ctx.homeClub : ctx.awayClub} 
          lineup={userSide === 'HOME' ? matchState.homeLineup : matchState.awayLineup} 
          players={userSide === 'HOME' ? ctx.homePlayers : ctx.awayPlayers} 
          fatigue={userSide === 'HOME' ? matchState.homeFatigue : matchState.awayFatigue} 
          subsCount={userSide === 'HOME' ? matchState.subsCountHome : matchState.subsCountAway} 
          subsHistory={userSide === 'HOME' ? matchState.homeSubsHistory : matchState.awaySubsHistory} 
          minute={matchState.minute} 
          sentOffIds={matchState.sentOffIds} 
        />
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 1s ease-out forwards; }
        @keyframes slide-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-slide-up { animation: slide-up 0.4s ease-out forwards; }
        @keyframes pulse-gold { 0%, 100% { transform: scale(1); filter: brightness(1.2); } 50% { transform: scale(1.1); filter: brightness(1.8); } }
        .animate-pulse-gold { animation: pulse-gold 0.6s infinite ease-in-out; }
      `}</style>
    </div>
  );
};