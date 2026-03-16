
import { useState, useEffect, useMemo, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { 
  ViewState, MatchLiveState, MatchContext, PlayerPosition, CompetitionType, 
  MatchEventType, SubstitutionRecord, MatchLogEntry, InjurySeverity, 
  Player, HealthStatus, MatchSummary, MatchSummaryEvent, MatchResult,
  Lineup,
  PlayerPerformance,
  MatchEvent,
  InstructionTempo, InstructionMindset, InstructionIntensity
} from '../types';

const calculateLiveRating = (player: Player, side: 'HOME' | 'AWAY', state: any) => {
  let r = 6.0;
  const goals = (side === 'HOME' ? state.homeGoals : state.awayGoals).filter((g: any) => g.playerName === player.lastName).length;
  const assists = (side === 'HOME' ? state.homeGoals : state.awayGoals).filter((g: any) => g.assistantId === player.id).length;
  const cards = state.playerYellowCards[player.id] || 0;
  const isRed = state.sentOffIds.includes(player.id);
  
  r += goals * 1.5;
  r += assists * 0.8;
  r -= cards * 0.5;
  if (isRed) r -= 3.0;

  // Kara za gole stracone (tylko GK i DEF)
  if (player.position === 'GK' || player.position === 'DEF') {
    const conceded = side === 'HOME' ? state.awayScore : state.homeScore;
    r -= conceded * 0.2;
  }

  // Bonus za kondycję (świeżość podnosi ocenę)
  const fatigue = (side === 'HOME' ? state.homeFatigue[player.id] : state.awayFatigue[player.id]) || 100;
  if (fatigue > 90) r += 0.2;
  
  return Math.min(10, Math.max(1, r)).toFixed(1);
};

import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { MatchEngineService } from '../services/MatchEngineService';
import { MomentumService } from '../services/MomentumService';
import { TacticRepository } from '../resources/tactics_db';
import { PlayerPresentationService } from '../services/PlayerPresentationService';
import { MatchTacticsModal } from '../components/modals/MatchTacticsModal';
import { GoalAttributionService } from '../services/GoalAttributionService';
import { BackgroundMatchProcessor } from '../services/BackgroundMatchProcessor';
import { BackgroundMatchProcessorCL } from '../services/BackgroundMatchProcessorCL';
import { RefereeService } from '../services/RefereeService';
import { PolandWeatherService } from '../services/PolandWeatherService';
import { DisciplineService } from '../services/DisciplineService';
import { AiMatchDecisionService } from '../services/AiMatchDecisionService';
import { PostMatchCommentSelector } from '../PolishCupEngine/PostMatchCommentSelector';
import { PlayerStatsService } from '../services/PlayerStatsService';
import { MATCH_COMMENTARY_DB } from '../data/match_commentary_pl';
import { KitSelectionService } from '../services/KitSelectionService';
import { InjuryEventGenerator } from '../services/InjuryEventGenerator';
import { MatchHistoryService } from '../services/MatchHistoryService';
import { DebugLoggerService } from '../services/DebugLoggerService';
import { InjuryUpgradeService } from '../services/InjuryUpgradeService';
import { AttendanceService } from '../services/AttendanceService';
import { LineupService } from '../services/LineupService';
import { FinanceService } from '@/services/FinanceService';

const CL_LEAGUE_IDS: CompetitionType[] = [
  CompetitionType.CL_R1Q, CompetitionType.CL_R1Q_RETURN,
  CompetitionType.CL_R2Q, CompetitionType.CL_R2Q_RETURN,
  CompetitionType.CL_GROUP_STAGE,
  CompetitionType.CL_R16, CompetitionType.CL_R16_RETURN,
  CompetitionType.CL_QF, CompetitionType.CL_QF_RETURN,
  CompetitionType.CL_SF, CompetitionType.CL_SF_RETURN,
];

const BigJerseyIcon = ({ primary, secondary, size = "w-16 h-16" }: { primary: string, secondary: string, size?: string }) => (
  <div className="relative group">
    <div className="absolute inset-[-10px] rounded-full blur-2xl opacity-40 transition-opacity group-hover:opacity-60" style={{ backgroundColor: primary }} />
    <div className={`relative ${size} flex items-center justify-center p-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-2xl overflow-hidden`}>
      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/10 to-transparent z-20 pointer-events-none" />
      <svg viewBox="0 0 24 24" className="w-full h-full drop-shadow-[0_0_8px_rgba(0,0,0,0.5)]" fill={primary} style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }}>
        <path d="M7 2L2 5v4l3 1v10h14V10l3-1V5l-5-3-2 2-2-2-2 2-2-2z" />
        <path d="M12 4L10 6L12 8L14 6L12 4Z" fill={secondary} fillOpacity="0.6" />
      </svg>
      <div className="absolute -inset-full bg-gradient-to-tr from-transparent via-white/5 to-transparent rotate-45 animate-shine pointer-events-none" />
    </div>
  </div>
);

export const CLMatchLiveView = () => {
  const { 
    navigateTo, userTeamId, clubs, fixtures, players, 
    lineups, currentDate, setLastMatchSummary, applySimulationResult, viewPlayerDetails,seasonNumber, coaches,
    roundResults, sessionSeed,
    activeMatchState: matchState, setActiveMatchState: setMatchState
  } = useGame();
  
  const [isTacticsOpen, setIsTacticsOpen] = useState(false);
  const [isCelebratingGoal, setIsCelebratingGoal] = useState(false);
    const [showCommentHistory, setShowCommentHistory] = useState(false);
  const [activePenalty, setActivePenalty] = useState<{
    side: 'HOME' | 'AWAY',
    kicker: Player,
    keeper: Player,
    phase: 'AWARDED' | 'EXECUTING' | 'RESULT',
    result?: MatchEventType
  } | null>(null);

  const [activeVAR, setActiveVAR] = useState<{
    side: 'HOME' | 'AWAY',
    scorerName: string,
    minute: number,
    phase: 'CHECKING' | 'VERDICT',
    verdict?: 'GOAL' | 'NO_GOAL'
  } | null>(null);
  const varDataRef = useRef<{ side: 'HOME' | 'AWAY', scorerName: string, minute: number } | null>(null);

  const logsEndRef = useRef<HTMLDivElement>(null);

  const getContrastColor = (hexColor: string): string => {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
  };

  const hexToRgba = (hex: string, alpha: number) => {
    try {
      const h = (hex || '#000000').replace('#', '');
      const r = parseInt(h.substring(0, 2), 16);
      const g = parseInt(h.substring(2, 4), 16);
      const b = parseInt(h.substring(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    } catch (e) {
      return `rgba(15, 23, 42, ${alpha})`;
    }
  };


  const ctx = useMemo(() => {
    const fixture = fixtures.find(f => 
        (f.homeTeamId === userTeamId || f.awayTeamId === userTeamId) &&
        f.date.toDateString() === currentDate.toDateString() &&
        CL_LEAGUE_IDS.includes(f.leagueId as CompetitionType)
    );
    if (!fixture) return null;
    const home = clubs.find(c => c.id === fixture.homeTeamId)!;
    const away = clubs.find(c => c.id === fixture.awayTeamId)!;
    const hPlayers = players[home.id] || [];
    const aPlayers = players[away.id] || [];
    return {
      fixture, homeClub: home, awayClub: away, homePlayers: hPlayers, awayPlayers: aPlayers, homeAdvantage: true, competition: fixture.leagueId as CompetitionType
    } as MatchContext;
  }, [userTeamId, clubs, fixtures, players, currentDate]);

  const kitColors = useMemo(() => {
    if (!ctx) return null;
    return KitSelectionService.selectOptimalKits(ctx.homeClub, ctx.awayClub);
  }, [ctx]);

  const userSide = useMemo(() => {
    if (!ctx || !userTeamId) return 'HOME';
    return ctx.homeClub.id === userTeamId ? 'HOME' : 'AWAY';
  }, [ctx, userTeamId]);

const isPausedForSevereInjury = useMemo(() => {
    if (!matchState || !matchState.isPaused) return false;
    const allInjuries = { ...matchState.homeInjuries, ...matchState.awayInjuries };
    const onPitchIds = [...matchState.homeLineup.startingXI, ...matchState.awayLineup.startingXI];
    return onPitchIds.some(id => id && allInjuries[id] === 'SEVERE');
  }, [matchState]);


  const env = useMemo(() => {
    if (!ctx) return null;
    const seedStr = `${ctx.fixture.id}_ENV`;
    const ref = RefereeService.assignReferee(seedStr, 3);
    const weather = PolandWeatherService.getWeather(ctx.fixture.date, seedStr);
    return { ref, weather };
  }, [ctx]);

  const seededRng = (seed: number, minute: number, offset: number = 0) => {
    let s = seed + minute + offset;
    const x = Math.sin(s) * 10000;
    return x - Math.floor(x);
  };

  const hasMandatorySub = useMemo(() => {
    if (!matchState) return false;
    const userLineup = userSide === 'HOME' ? matchState.homeLineup : matchState.awayLineup;
    const userInjuries = userSide === 'HOME' ? matchState.homeInjuries : matchState.awayInjuries;
    return userLineup.startingXI.some(id => id && userInjuries[id] === InjurySeverity.SEVERE);
  }, [matchState, userSide]);

  useEffect(() => {
   if (ctx && (!matchState || matchState.fixtureId !== ctx.fixture.id)) {
      const sessionSeed = Math.abs(Math.floor(Date.now() * Math.random()));
      
      const homeLineupData = lineups[ctx.homeClub.id] || LineupService.autoPickLineup(ctx.homeClub.id, ctx.homePlayers);
      const awayLineupData = lineups[ctx.awayClub.id] || LineupService.autoPickLineup(ctx.awayClub.id, ctx.awayPlayers);

      setMatchState({
        fixtureId: ctx.fixture.id, minute: 0, period: 1, addedTime: 0, isPaused: true,
        isPausedForEvent: false, isHalfTime: false, isFinished: false, speed: 1, momentum: 0, momentumPulse: 0,
        homeScore: 0, awayScore: 0, homeLineup: homeLineupData, awayLineup: awayLineupData,
        // TUTAJ WSTAW TEN KOD
        homeFatigue: ctx.homePlayers.reduce((acc, p) => ({ ...acc, [p.id]: p.condition }), {}),
        awayFatigue: ctx.awayPlayers.reduce((acc, p) => ({ ...acc, [p.id]: p.condition }), {}),
        // KONIEC
        homeInjuries: {}, awayInjuries: {}, playerYellowCards: {},
        sentOffIds: [], homeRiskMode: {}, awayRiskMode: {}, homeUpgradeProb: {}, awayUpgradeProb: {},
        homeInjuryMin: {}, awayInjuryMin: {}, subsCountHome: 0, subsCountAway: 0,
        homeSubsHistory: [], awaySubsHistory: [], lastAiActionMinute: 0, aiTacticLocked: false,
        logs: [{ id: 'init', minute: 0, text: "Oczekiwanie na pierwszy gwizdek...", type: MatchEventType.GENERIC }],
        liveStats: {
    home: { shots: 0, shotsOnTarget: 0, corners: 0, fouls: 0, offsides: 0 },
    away: { shots: 0, shotsOnTarget: 0, corners: 0, fouls: 0, offsides: 0 }
  },
  momentumSum: 0,
  momentumTicks: 0,
events: [], homeGoals: [], awayGoals: [], flashMessage: null,
        sessionSeed,
      ////// DO ZAIMPLEMENTOWANIA PRZYCISKI TEMPO NASTAWIENIE I INTESNYWNOSC ...
        tacticalImpact: 1.0,
       userInstructions: {
          tempo: 'NORMAL',
          mindset: 'NEUTRAL',
          intensity: 'NORMAL',
          expiryMinute: -1,
          tempoExpiry: -1,
          mindsetExpiry: -1,
          intensityExpiry: -1,
          tempoCooldown: -1,
          mindsetCooldown: -1,
          intensityCooldown: -1,
         lastChangeMinute: -5,},
          playedPlayerIds: [],
        aiActiveShout: null,
        lastGoalBoostMinute: -1,
        activeTacticalBoost: null,
        tacticalBoostExpiry: -1
        
        
     });
    }
  }, [ctx, lineups, matchState, setMatchState]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [matchState?.logs]);

  const handleOpenPlayerCard = (pId: string) => {
    setMatchState(prev => prev ? { ...prev, isPaused: true } : prev);
    viewPlayerDetails(pId);
  };

  const getActionLabel = () => {
    if (!matchState) return "";
    if (hasMandatorySub) return "WYMAGANA ZMIANA";
    if (matchState.isHalfTime) return "II POŁOWA";
    return matchState.isPaused ? "START" : "PAUZA";
  };

  useEffect(() => {
    if (!activePenalty || !matchState || !ctx) return;

    if (activePenalty.phase === 'AWARDED') {
      const t = setTimeout(() => {
        setActivePenalty(prev => prev ? { ...prev, phase: 'EXECUTING' } : null);
      }, 2000);
      return () => clearTimeout(t);
    } 
    else if (activePenalty.phase === 'EXECUTING') {
      const t = setTimeout(() => {
        const isGoal = GoalAttributionService.checkShotSuccess(activePenalty.kicker, activePenalty.keeper, [], false, () => Math.random(), true);
        const finalResult = isGoal ? MatchEventType.PENALTY_SCORED : MatchEventType.PENALTY_MISSED;
        
        setActivePenalty(prev => prev ? { ...prev, phase: 'RESULT', result: finalResult } : null);

        setMatchState(prev => {
          if (!prev) return prev;
          let nextHomeScore = prev.homeScore;
          let nextAwayScore = prev.awayScore;
          const newHomeGoals = [...prev.homeGoals];
          const newAwayGoals = [...prev.awayGoals];
          
          if (isGoal) {
            if (activePenalty.side === 'HOME') {
              nextHomeScore++;
              newHomeGoals.push({ playerName: activePenalty.kicker.lastName, minute: prev.minute, isPenalty: true });
            } else {
              nextAwayScore++;
              newAwayGoals.push({ playerName: activePenalty.kicker.lastName, minute: prev.minute, isPenalty: true });
            }
          } else {
            if (activePenalty.side === 'HOME') {
              newHomeGoals.push({ playerName: activePenalty.kicker.lastName, minute: prev.minute, isPenalty: true, isMiss: true });
            } else {
              newAwayGoals.push({ playerName: activePenalty.kicker.lastName, minute: prev.minute, isPenalty: true, isMiss: true });
            }
          }

          const pool = MATCH_COMMENTARY_DB[finalResult] || ["Karny..."];
          const comment = pool[Math.floor(Math.random() * pool.length)].replace("{Nazwisko}", activePenalty.kicker.lastName);

          const newLog: MatchLogEntry = {
            id: `PEN_RES_${prev.minute}_${Math.random()}`,
            minute: prev.minute,
            text: isGoal ? `⚽ ${comment}` : `❌ ${comment}`,
            type: finalResult,
            teamSide: activePenalty.side,
            playerName: activePenalty.kicker.lastName
          };

          return {
            ...prev,
            homeScore: nextHomeScore,
            awayScore: nextAwayScore,
            homeGoals: newHomeGoals,
            awayGoals: newAwayGoals,
            logs: [newLog, ...prev.logs],
            momentum: MomentumService.computeMomentum(ctx, prev, finalResult, activePenalty.side, prev.homeFatigue, prev.awayFatigue)
          };
        });

        if (isGoal) {
          setIsCelebratingGoal(true);
          setTimeout(() => setIsCelebratingGoal(false), 3000);
        }
      }, 2500);
      return () => clearTimeout(t);
    }
    else if (activePenalty.phase === 'RESULT') {
      const t = setTimeout(() => {
        setActivePenalty(null);
        setMatchState(prev => prev ? { ...prev, isPausedForEvent: false } : null);
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [activePenalty?.phase, matchState, ctx, setMatchState]);

  useEffect(() => {
    if (!activeVAR) return;
    if (activeVAR.phase === 'CHECKING') {
      const timer = setTimeout(() => {
        const verdict: 'GOAL' | 'NO_GOAL' = Math.floor(Math.random() * 2) === 0 ? 'NO_GOAL' : 'GOAL';
        setActiveVAR(prev => prev ? { ...prev, phase: 'VERDICT', verdict } : null);
      }, 5000);
      return () => clearTimeout(timer);
    }
    if (activeVAR.phase === 'VERDICT' && activeVAR.verdict) {
      const isVarHome = activeVAR.side === 'HOME';
      setMatchState(prev => {
        if (!prev) return prev;
        const varLog: MatchLogEntry = activeVAR.verdict === 'NO_GOAL'
          ? { id: `VAR_DISALLOWED_${activeVAR.minute}`, minute: activeVAR.minute, text: `🚫 VAR: Bramka ${activeVAR.scorerName} NIEUZNANA! SPALONY!`, type: MatchEventType.GENERIC, teamSide: activeVAR.side }
          : { id: `VAR_CONFIRMED_${activeVAR.minute}`, minute: activeVAR.minute, text: `✅ VAR: Bramka ${activeVAR.scorerName} ZATWIERDZONA! Gol uznany.`, type: MatchEventType.GENERIC, teamSide: activeVAR.side };
        if (activeVAR.verdict === 'NO_GOAL') {
          const newHomeGoals = isVarHome
            ? prev.homeGoals.map(g => g.playerName === activeVAR.scorerName && g.minute === activeVAR.minute && !g.varDisallowed ? { ...g, varDisallowed: true } : g)
            : prev.homeGoals;
          const newAwayGoals = !isVarHome
            ? prev.awayGoals.map(g => g.playerName === activeVAR.scorerName && g.minute === activeVAR.minute && !g.varDisallowed ? { ...g, varDisallowed: true } : g)
            : prev.awayGoals;
          return {
            ...prev,
            homeScore: isVarHome ? prev.homeScore - 1 : prev.homeScore,
            awayScore: !isVarHome ? prev.awayScore - 1 : prev.awayScore,
            homeGoals: newHomeGoals,
            awayGoals: newAwayGoals,
            logs: [varLog, ...prev.logs]
          };
        }
        return { ...prev, logs: [varLog, ...prev.logs] };
      });
      const closeTimer = setTimeout(() => setActiveVAR(null), 3000);
      return () => clearTimeout(closeTimer);
    }
  }, [activeVAR?.phase, activeVAR?.verdict, setMatchState]);

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

  useEffect(() => {
    if (!matchState || matchState.isPaused || matchState.isPausedForEvent || 
        matchState.isFinished || matchState.isHalfTime || isTacticsOpen || isCelebratingGoal || !env || activePenalty || activeVAR) return;

    const tickInterval = matchState.speed === 5 ? 120 
  : matchState.speed === 3.5 ? 200 
  : matchState.speed === 2.5 ? 400 
  : 1000;
    
    const interval = setInterval(() => {
      setMatchState(prev => {
        if (!prev || !ctx) return prev;
        const nextMinute = prev.minute + 1;
        let currentAddedTime = prev.addedTime;
        const currentSeed = prev.sessionSeed;

const nextMomentumSum = prev.momentumSum + prev.momentum;
  const nextMomentumTicks = prev.momentumTicks + 1;
  const nextLiveStats = { ...prev.liveStats };

        if (prev.period === 1 && prev.minute === 45 && currentAddedTime === 0) 
            currentAddedTime = Math.floor(seededRng(currentSeed, 45, 1) * 4) + 1;
        else if (prev.period === 2 && prev.minute === 90 && currentAddedTime === 0) 
            currentAddedTime = Math.floor(seededRng(currentSeed, 90, 2) * 5) + 2;

        const limit = prev.period === 1 ? (45 + currentAddedTime) : (90 + currentAddedTime);
        
        if (nextMinute > limit) {
           const isFT = prev.period === 2;
           const logText = isFT ? "Sędzia kończy mecz!" : "Przerwa w grze.";
           const newLog: MatchLogEntry = { id: `PERIOD_END_${prev.period}`, minute: prev.minute, text: logText, type: MatchEventType.GENERIC };
           

const applyHalftimeRegen = (fatigueMap: Record<string, number>, playersList: Player[]) => {
             const nextFatigue = { ...fatigueMap };
             Object.keys(nextFatigue).forEach(pId => {
               const p = playersList.find(px => px.id === pId);
               if (p) {
                 const stamina = p.attributes.stamina || 50;
                 const strength = p.attributes.strength || 50;
                 // ────────────────────────────────────────────────
      //           Nowa, bardziej sprawiedliwa formuła
      // ────────────────────────────────────────────────
      const sum = stamina + strength;
      const effectiveSum = Math.max(80, sum);           // najsłabsi traktowani jakby mieli min. 80
      const regenAmount = 4.5 + (effectiveSum / 198) * 5.5;
      // Wyniki przykładowe:
      //   80   → ~6.7%
      //  100   → ~7.3%
      //  130   → ~8.1%
      //  160   → ~8.9%
      //  180   → ~9.5%
      //  198   → 10.0%

      const cap = 100 - (p.fatigueDebt || 0);
      nextFatigue[pId] = Math.min(cap, (nextFatigue[pId] || 100) + regenAmount);
               }
             });
             return nextFatigue;
           };

           let nextHomeLineup = { ...prev.homeLineup };
           let nextAwayLineup = { ...prev.awayLineup };
           let nextSubsCountHome = prev.subsCountHome;
           let nextSubsCountAway = prev.subsCountAway;
           let nextHomeSubsHistory = [...prev.homeSubsHistory];
           let nextAwaySubsHistory = [...prev.awaySubsHistory];
           let nextLastAiActionMinute = prev.lastAiActionMinute;
           let updatedLogs = [newLog, ...prev.logs];

           // --- HALFTIME AI DECISIONS ---
           if (!isFT) {
              const aiSide: 'HOME' | 'AWAY' = userSide === 'HOME' ? 'AWAY' : 'HOME';
              const decision = AiMatchDecisionService.makeDecisions(
                { ...prev, minute: 45 }, 
                ctx, aiSide, false, true
              );
              
              if (decision.subRecord) {
                 if (aiSide === 'HOME') { 
                   nextHomeLineup = decision.newLineup || nextHomeLineup; 
                   nextSubsCountHome = decision.newSubsCount ?? nextSubsCountHome; 
                   nextHomeSubsHistory.push(decision.subRecord); 
                 }
                 else { 
                   nextAwayLineup = decision.newLineup || nextAwayLineup; 
                   nextSubsCountAway = decision.newSubsCount ?? nextSubsCountAway; 
                   nextAwaySubsHistory.push(decision.subRecord); 
                 }
              }
              if (decision.newTacticId) {
                if (aiSide === 'HOME') nextHomeLineup.tacticId = decision.newTacticId;
                else nextAwayLineup.tacticId = decision.newTacticId;
              }
              if (decision.lastAiActionMinute !== undefined) nextLastAiActionMinute = decision.lastAiActionMinute;
              if (decision.logs) {
                 decision.logs.forEach(l => {
                    updatedLogs = [{ id: `AI_HT_${Math.random()}`, minute: 45, text: l, type: MatchEventType.GENERIC }, ...updatedLogs];


                          
                 });
              }
             }
 const recoveredHomeFatigue = !isFT ? applyHalftimeRegen(prev.homeFatigue, ctx.homePlayers) : prev.homeFatigue;
           const recoveredAwayFatigue = !isFT ? applyHalftimeRegen(prev.awayFatigue, ctx.awayPlayers) : prev.awayFatigue;
           return { 
              ...prev, 
              homeLineup: nextHomeLineup, awayLineup: nextAwayLineup,
              homeFatigue: recoveredHomeFatigue, awayFatigue: recoveredAwayFatigue, // Aktualizacja kondycji
              subsCountHome: nextSubsCountHome, subsCountAway: nextSubsCountAway,
              homeSubsHistory: nextHomeSubsHistory, awaySubsHistory: nextAwaySubsHistory,
              lastAiActionMinute: nextLastAiActionMinute,
              isHalfTime: !isFT, isFinished: isFT, isPaused: true, addedTime: currentAddedTime, logs: updatedLogs
           };
        }
              
           

        let updatedLogs = [...prev.logs];
        let nextIsPaused = prev.isPaused;
        let nextHomeLineup = { ...prev.homeLineup };
        let nextAwayLineup = { ...prev.awayLineup };
        let nextPlayerYellowCards = { ...prev.playerYellowCards };
        let nextSentOffIds = [...prev.sentOffIds];
        let nextHomeScore = prev.homeScore;
        let nextAwayScore = prev.awayScore;
        const newHomeGoals = [...prev.homeGoals];
        const newAwayGoals = [...prev.awayGoals];
        let nextSubsCountHome = prev.subsCountHome;
        let nextSubsCountAway = prev.subsCountAway;
        let nextHomeSubsHistory = [...prev.homeSubsHistory];
        let nextAwaySubsHistory = [...prev.awaySubsHistory];
        let nextLastAiActionMinute = prev.lastAiActionMinute;
        let nextAiTacticLocked = prev.aiTacticLocked ?? false;
        let nextHomeInjuries = { ...prev.homeInjuries };
        let nextAwayInjuries = { ...prev.awayInjuries };
        let nextHomeRiskMode = { ...prev.homeRiskMode };
        let nextAwayRiskMode = { ...prev.awayRiskMode };
        let nextHomeUpgradeProb = { ...prev.homeUpgradeProb };
        let nextAwayUpgradeProb = { ...prev.awayUpgradeProb };
        let nextHomeInjuryMin = { ...prev.homeInjuryMin };
        let nextAwayInjuryMin = { ...prev.awayInjuryMin };
        let nextIsPausedForEvent = prev.isPausedForEvent;
        let localHomeFatigue = { ...prev.homeFatigue };
        let localAwayFatigue = { ...prev.awayFatigue };

        
       const engineComment = MatchEngineService.generateCommentary(nextMinute, currentSeed, ctx.homeClub.name, ctx.awayClub.name);
        
        if (engineComment) updatedLogs = [engineComment, ...updatedLogs];

        const aiSide: 'HOME' | 'AWAY' = userSide === 'HOME' ? 'AWAY' : 'HOME';
        const hasSevereHome = nextHomeLineup.startingXI.some(id => id && nextHomeInjuries[id] === InjurySeverity.SEVERE);
        const hasSevereAway = nextAwayLineup.startingXI.some(id => id && nextAwayInjuries[id] === InjurySeverity.SEVERE);
        const hasEmptySlotsAi = aiSide === 'AWAY' ? nextAwayLineup.startingXI.some(id => id === null) : nextHomeLineup.startingXI.some(id => id === null);

        let immediateAiTrigger = hasSevereHome || hasSevereAway || hasEmptySlotsAi;

        if (nextMinute % 5 === 0 || immediateAiTrigger) {
           const decision = AiMatchDecisionService.makeDecisions(
             { ...prev, minute: nextMinute, homeLineup: nextHomeLineup, awayLineup: nextAwayLineup, homeInjuries: nextHomeInjuries, awayInjuries: nextAwayInjuries, homeFatigue: localHomeFatigue, awayFatigue: localAwayFatigue, sentOffIds: nextSentOffIds, lastAiActionMinute: nextLastAiActionMinute }, 
             ctx, 
             aiSide, 
             immediateAiTrigger
           );
           
           if (decision.subRecord) {
              if (aiSide === 'HOME') { 
                nextHomeLineup = decision.newLineup || nextHomeLineup; 
                nextSubsCountHome = decision.newSubsCount ?? nextSubsCountHome; 
                nextHomeSubsHistory = [...nextHomeSubsHistory, decision.subRecord]; 
              }
              else { 
                nextAwayLineup = decision.newLineup || nextAwayLineup; 
                nextSubsCountAway = decision.newSubsCount ?? nextSubsCountAway; 
                nextAwaySubsHistory = [...nextAwaySubsHistory, decision.subRecord]; 
              }
           }
           if (decision.newTacticId) {
              if (aiSide === 'HOME') nextHomeLineup.tacticId = decision.newTacticId;
              else nextAwayLineup.tacticId = decision.newTacticId;
           }
           if (decision.lastAiActionMinute !== undefined) nextLastAiActionMinute = decision.lastAiActionMinute;
           if (decision.aiTacticLocked) nextAiTacticLocked = true;
           if (decision.logs) {
              decision.logs.forEach(l => {
                 updatedLogs = [{ id: `AI_LOG_${nextMinute}_${Math.random()}`, minute: nextMinute, text: l, type: MatchEventType.GENERIC, teamSide: aiSide }, ...updatedLogs];
              });
           }
        }

        const rngEvent = seededRng(currentSeed, nextMinute, 500);

        // ─── KARA ZA ZMĘCZENIE DRUŻYNY (wpływ na inicjatywę i liczbę strzałów) ───
        // Liczymy średnią kondycję aktywnych zawodników każdej drużyny
        const _getAvgFatigue = (lineup: (string | null)[], fatigueMap: Record<string, number>): number => {
          const ids = lineup.filter((id): id is string => id !== null);
          if (ids.length === 0) return 100;
          return ids.reduce((acc, id) => acc + (fatigueMap[id] ?? 100), 0) / ids.length;
        };
        const avgFatigueHome = _getAvgFatigue(nextHomeLineup.startingXI, localHomeFatigue);
        const avgFatigueAway = _getAvgFatigue(nextAwayLineup.startingXI, localAwayFatigue);

        // Krzywa kary: kondycja 100→0 | pow 75→0 | pow 60→-0.03 | pow 40→-0.07 | pow 20→-0.11
        // Efekt jest widoczny dopiero poniżej 75 — im niżej tym boleśniej
        const _fatiguePenalty = (avgFat: number): number => {
          if (avgFat >= 75) return 0;
          const depth = (75 - avgFat) / 75; // 0..1
          return -(Math.pow(depth, 1.4) * 0.14);
        };
        const homeFatPenalty = _fatiguePenalty(avgFatigueHome);
        const awayFatPenalty = _fatiguePenalty(avgFatigueAway);

        // Wpływ na przewagę inicjatywy (homeAttackChance)
        // Bardziej zmęczona drużyna rzadziej przejmuje inicjatywę
        const fatInitiativeMod = (homeFatPenalty - awayFatPenalty) * 0.6; // max ±0.08
        const homeAttackChance = Math.min(0.92, Math.max(0.08, 0.5 + prev.momentum / 160 + fatInitiativeMod));
        const activeSide: 'HOME' | 'AWAY' = seededRng(currentSeed, nextMinute, 600) < homeAttackChance ? 'HOME' : 'AWAY';

   // TUTAJ WSTAW TEN KOD - Logika Nasycenia (Satiety Logic)
        let shotThreshold = 0.125; // Bazowa szansa
        const goalDiff = Math.abs(prev.homeScore - prev.awayScore);
        const leads = (activeSide === 'HOME' && prev.homeScore > prev.awayScore) || (activeSide === 'AWAY' && prev.awayScore > prev.homeScore);

        if (leads && goalDiff >= 3) {
           // Losowanie współczynnika 0.3 - 0.6 na podstawie ziarna meczu
           const satietyWeight = 0.3 + (seededRng(currentSeed, 0, 999) * 0.3); 
           const satietyFactor = 1 + (goalDiff - 1) * satietyWeight;
           shotThreshold /= satietyFactor; // Im wyższy factor, tym niższy próg (trudniej o strzał)
        }

        // Krok 2: defenseBias rywala utrudnia dojście do strzału
        // max kara: 6-3-1 (defenseBias=95) → -0.076 | min: 4-2-4 (defenseBias=10) → -0.008
        const defendingLineup2 = activeSide === 'HOME' ? nextAwayLineup : nextHomeLineup;
        const defendingTactic2 = TacticRepository.getById(defendingLineup2.tacticId);
        const defBiasPenalty = (defendingTactic2.defenseBias / 100) * 0.08;

        // Bonus gdy broniący nie ma bramkarza na bramce (slot 0 = null lub nie-GK)
        const defendingXI2 = activeSide === 'HOME' ? nextAwayLineup.startingXI : nextHomeLineup.startingXI;
        const defendingTeamPlayers2 = activeSide === 'HOME' ? ctx.awayPlayers : ctx.homePlayers;
        const slotZeroPlayer = defendingXI2[0] !== null ? defendingTeamPlayers2.find(p => p.id === defendingXI2[0]) : null;
        const noGkBonus = defendingXI2[0] === null
          ? 0.055  // pusty slot = otwarta bramka
          : (slotZeroPlayer?.position !== PlayerPosition.GK ? 0.028 : 0); // nie-GK w bramce

        // Bonus za jakość napastnika (znormalizowany do polskiej ligi: zakres finishing 55-77)
        const attackingTeamPlayers2 = activeSide === 'HOME' ? ctx.homePlayers : ctx.awayPlayers;
        const attackingXI2 = (activeSide === 'HOME' ? nextHomeLineup.startingXI : nextAwayLineup.startingXI).filter(id => id !== null) as string[];
        const topStriker = attackingTeamPlayers2
          .filter(p => attackingXI2.includes(p.id) && p.position === PlayerPosition.FWD)
          .sort((a, b) => b.attributes.finishing - a.attributes.finishing)[0];
        const strikerBonus = topStriker
          ? Math.max(0, (topStriker.attributes.finishing - 55) / (77 - 55)) * 0.012
          : 0;

        // Kara zmęczenia atakującej drużyny na shotThreshold
        const activeFatPenalty = activeSide === 'HOME' ? homeFatPenalty : awayFatPenalty;

        // ─── KARA: OSŁABIONY SKŁAD + OFENSYWNA TAKTYKA ────────────────────────
        // Liczba "dziur" w XI (null = brak zawodnika po czerwonej lub kontuzji bez zmiany)
        const homeMissing = nextHomeLineup.startingXI.filter(id => id === null).length;
        const awayMissing = nextAwayLineup.startingXI.filter(id => id === null).length;
        const defendingMissing = activeSide === 'HOME' ? awayMissing : homeMissing;
        const attackingMissing = activeSide === 'HOME' ? homeMissing : awayMissing;
        const defendingTacticObj = TacticRepository.getById(
          activeSide === 'HOME' ? nextAwayLineup.tacticId : nextHomeLineup.tacticId
        );
        const attackingTacticObj = TacticRepository.getById(
          activeSide === 'HOME' ? nextHomeLineup.tacticId : nextAwayLineup.tacticId
        );

        // Bonus dla atakującego jeśli broniący ma dziury defensywne (brakujący gracz + ofensywna taktyka)
        // Broniący grał ofensywnie i stracił zawodnika → otwarte plecy
        // 1 brak + attackBias>60 → +0.018 | 1 brak + attackBias>75 → +0.028 | 2+ braki → skaluje x1.6
        let openBacksBonus = 0;
        if (defendingMissing > 0 && defendingTacticObj.attackBias > 60) {
          const offensiveness = (defendingTacticObj.attackBias - 60) / 40; // 0..1
          openBacksBonus = 0.018 + offensiveness * 0.020;
          if (defendingMissing >= 2) openBacksBonus *= 1.6;
        }

        // Kara dla atakującego jeśli SAM ma dziury i gra ofensywnie (ryzyko kontry zostało już wyżej,
        // ale tu karzymy też jego własne możliwości — mniej nóg na boisku = mniej akcji)
        let ownShortHandedPenalty = 0;
        if (attackingMissing > 0) {
          // Każdy brakujący zawodnik to kara bazowa; większa jeśli taktyka ofensywna (mniej obrońców)
          const offensiveRisk = attackingTacticObj.attackBias > 65 ? 1.4 : 1.0;
          ownShortHandedPenalty = attackingMissing * 0.016 * offensiveRisk;
        }

        shotThreshold = Math.max(0.04, shotThreshold - defBiasPenalty + strikerBonus + activeFatPenalty + openBacksBonus - ownShortHandedPenalty + noGkBonus);

        // Momentum bonus do shotThreshold - tylko gdy aktywna drużyna ma impet po swojej stronie
        // max +0.015 przy momentum 100, przy momentum 50 → +0.0075
        const hasMomentumAdvantage = (activeSide === 'HOME' && prev.momentum > 0) || (activeSide === 'AWAY' && prev.momentum < 0);
        if (hasMomentumAdvantage) {
          shotThreshold += (Math.abs(prev.momentum) / 100) * 0.015;
        }

        // Krok 3: pressingIntensity atakującej drużyny - wysoki pressing = więcej okazji
        // pressing 20 (min) → +0.0016 | pressing 50 → +0.004 | pressing 90 (max) → +0.0072
        const attackingTacticForPressing = TacticRepository.getById(
          activeSide === 'HOME' ? nextHomeLineup.tacticId : nextAwayLineup.tacticId
        );
        shotThreshold += (attackingTacticForPressing.pressingIntensity / 100) * 0.008;

        // POGODA: Deszcz karze technicznie słabszą drużynę (śliska piłka, niedokładne podania)
        // Efekt jest WZGLĘDNY — liczy się różnica techniki między atakującymi a broniącymi
        // precipitationChance > 40% = realny deszcz; efekt progresywny od różnicy techniki
        if (env && env.weather.precipitationChance > 40) {
          const getAvgTech = (players: Player[], xi: (string | null)[]): number => {
            const ids = xi.filter((id): id is string => id !== null);
            const active = players.filter(p => ids.includes(p.id));
            if (active.length === 0) return 60;
            return active.reduce((acc, p) => acc + p.attributes.technique, 0) / active.length;
          };
          const attackingPlayers = activeSide === 'HOME' ? ctx.homePlayers : ctx.awayPlayers;
          const attackingXIW = activeSide === 'HOME' ? nextHomeLineup.startingXI : nextAwayLineup.startingXI;
          const defendingPlayers = activeSide === 'HOME' ? ctx.awayPlayers : ctx.homePlayers;
          const defendingXIW = activeSide === 'HOME' ? nextAwayLineup.startingXI : nextHomeLineup.startingXI;
          const attTech = getAvgTech(attackingPlayers, attackingXIW);
          const defTech = getAvgTech(defendingPlayers, defendingXIW);
          const techGapW = defTech - attTech; // > 0 = atakujący słabsi technicznie
          if (techGapW > 3) {
            // Progresywna kara: mała różnica → mała kara, duża → większa
            // gap 3-6 → -0.004 | gap 6-10 → -0.007 | gap 10+ → -0.010
            const rainPenalty = techGapW > 10 ? 0.010 : techGapW > 6 ? 0.007 : 0.004;
            // Skalowanie intensywności deszczu (40% = minimalna kara, 100% = pełna)
            const rainIntensity = Math.min(1.0, (env.weather.precipitationChance - 40) / 60);
            shotThreshold = Math.max(0.04, shotThreshold - rainPenalty * rainIntensity);
          }
        }

        // ─── INSTRUKCJE TAKTYCZNE GRACZA → MODYFIKATORY SILNIKA ────────────────
        let nextUserInstructions = { ...prev.userInstructions };
        if (nextUserInstructions.tempoExpiry > 0 && nextMinute >= nextUserInstructions.tempoExpiry) {
          nextUserInstructions = { ...nextUserInstructions, tempo: 'NORMAL', tempoExpiry: -1 };
        }
        if (nextUserInstructions.mindsetExpiry > 0 && nextMinute >= nextUserInstructions.mindsetExpiry) {
          nextUserInstructions = { ...nextUserInstructions, mindset: 'NEUTRAL', mindsetExpiry: -1 };
        }
        if (nextUserInstructions.intensityExpiry > 0 && nextMinute >= nextUserInstructions.intensityExpiry) {
          nextUserInstructions = { ...nextUserInstructions, intensity: 'NORMAL', intensityExpiry: -1 };
        }
        const uInstr = nextUserInstructions;
        const isUserAttacking = activeSide === userSide;
        const _getXIAvgAttr = (playersList: Player[], xi: (string | null)[], attr: keyof Player['attributes']): number => {
          const ids = xi.filter((id): id is string => id !== null);
          const active = playersList.filter(p => ids.includes(p.id));
          if (active.length === 0) return 60;
          return active.reduce((acc, p) => acc + (p.attributes[attr] as number), 0) / active.length;
        };
        const uPlayersList = userSide === 'HOME' ? ctx.homePlayers : ctx.awayPlayers;
        const uXIList      = userSide === 'HOME' ? nextHomeLineup.startingXI : nextAwayLineup.startingXI;
        const oPlayersList = userSide === 'HOME' ? ctx.awayPlayers : ctx.homePlayers;
        const oXIList      = userSide === 'HOME' ? nextAwayLineup.startingXI : nextHomeLineup.startingXI;
        const uAvgTech = _getXIAvgAttr(uPlayersList, uXIList, 'technique');
        const oAvgTech = _getXIAvgAttr(oPlayersList, oXIList, 'technique');
        const uAvgPass = _getXIAvgAttr(uPlayersList, uXIList, 'passing');
        const uAvgMidDef = (() => {
          const ids = uXIList.filter((id): id is string => id !== null);
          const md = uPlayersList.filter(p => ids.includes(p.id) && (p.position === 'MID' || p.position === 'DEF'));
          if (md.length === 0) return 55;
          return md.reduce((acc, p) => acc + (p.attributes.defending + p.attributes.technique) / 2, 0) / md.length;
        })();
        const oppTacticDefBias = TacticRepository.getById(
          userSide === 'HOME' ? nextAwayLineup.tacticId : nextHomeLineup.tacticId
        ).defenseBias;
        // TEMPO
        if (uInstr.tempo === 'FAST') {
          if (isUserAttacking) {
            shotThreshold += 0.012;
          } else {
            const counterBonus = oppTacticDefBias > 60 ? 0.010 : 0.004;
            const techSafetyMod = uAvgTech > 62 ? 0.5 : 1.0;
            shotThreshold += counterBonus * techSafetyMod;
          }
        } else if (uInstr.tempo === 'SLOW') {
          if (isUserAttacking) {
            const techGap = uAvgTech - oAvgTech;
            if (techGap > 3) {
              shotThreshold += Math.min(0.012, techGap * 0.0015);
              if (uAvgPass > 62) shotThreshold += 0.005;
            } else {
              shotThreshold -= 0.005;
            }
          }
        }
        // NASTAWIENIE
        if (uInstr.mindset === 'OFFENSIVE') {
          if (isUserAttacking) shotThreshold += 0.015;
          else if (oppTacticDefBias > 65) shotThreshold += 0.012;
        } else if (uInstr.mindset === 'DEFENSIVE') {
          if (!isUserAttacking) {
            const midDefBonus = Math.max(0, (uAvgMidDef - 55) / 40);
            shotThreshold -= Math.min(0.014, 0.004 + midDefBonus * 0.010);
          } else {
            shotThreshold -= 0.005;
          }
        }
        // Modyfikatory intensywności — używane poniżej przy foulu/karnym/kontuzji
        const uFoulMod    = uInstr.intensity === 'AGGRESSIVE' ? 1.30 : uInstr.intensity === 'CAUTIOUS' ? 0.72 : 1.0;
        const uInjuryMod  = uInstr.intensity === 'AGGRESSIVE' ? 1.28 : uInstr.intensity === 'CAUTIOUS' ? 0.70 : 1.0;
        const uPenaltyMod = uInstr.intensity === 'AGGRESSIVE' ? 1.25 : uInstr.intensity === 'CAUTIOUS' ? 0.70 : 1.0;
        // ───────────────────────────────────────────────────────────────────────

        let pauseForEvent = false;
        let newLog: MatchLogEntry | null = null;
        let goalTriggered = false;
        let priorityAiTrigger = false;
        let immediateEventType: MatchEventType | undefined;

        const getCommentary = (type: MatchEventType, playerName?: string) => {
          const pool = MATCH_COMMENTARY_DB[type] || ["Zdarzenie meczowe..."];
          const idx = Math.floor(seededRng(currentSeed, nextMinute, 888) * pool.length);
          let text = pool[idx];
          if (playerName) text = text.replace("{Nazwisko}", playerName);
          return text;
        };

        const processInjury = (injury: MatchEvent) => {
          const isHomeInj = injury.teamSide === 'HOME';
          const pId = injury.primaryPlayerId!;
          const severity = injury.type === MatchEventType.INJURY_SEVERE ? InjurySeverity.SEVERE : InjurySeverity.LIGHT;
          
         if (isHomeInj) {
            nextHomeInjuries[pId] = severity;
            nextHomeInjuryMin[pId] = injury.minute;
            if (severity === InjurySeverity.LIGHT) {
              nextHomeRiskMode[pId] = true;
              localHomeFatigue[pId] = Math.max(0, (localHomeFatigue[pId] || 100) - 25);
            }
            if (severity === InjurySeverity.SEVERE) localHomeFatigue[pId] = 0;
          } else {
            nextAwayInjuries[pId] = severity;
            nextAwayInjuryMin[pId] = injury.minute;
            if (severity === InjurySeverity.LIGHT) {
              nextAwayRiskMode[pId] = true;
              localAwayFatigue[pId] = Math.max(0, (localAwayFatigue[pId] || 100) - 25);
            }
            if (severity === InjurySeverity.SEVERE) localAwayFatigue[pId] = 0;
          }

          const injText = getCommentary(injury.type, injury.text);
          updatedLogs = [{ id: `INJ_${nextMinute}_${pId}`, minute: nextMinute, text: injText, type: injury.type, teamSide: injury.teamSide, playerName: injury.text }, ...updatedLogs];
          
          if (severity === InjurySeverity.SEVERE) {
            priorityAiTrigger = true;
            nextIsPaused = true;
          }
        };

        const uFoulThreshold = 0.043 * (isUserAttacking ? uFoulMod : 1.0);
        if (rngEvent < uFoulThreshold) { 
           const xi = activeSide === 'HOME' ? nextHomeLineup.startingXI : nextAwayLineup.startingXI;
           const validXi = xi.filter(id => id !== null) as string[];
           const pId = validXi[Math.floor(seededRng(currentSeed, nextMinute, 1500) * validXi.length)];
           const player = (activeSide === 'HOME' ? ctx.homePlayers : ctx.awayPlayers).find(p => p.id === pId)!;
           if (!player) return prev; // Jeśli zawodnik zniknął (np. czerwona kartka), przerwij akcję
           const isPenalty = seededRng(currentSeed, nextMinute, 1700) < (0.0956 * (isUserAttacking ? uPenaltyMod : 1.0));

           if (isPenalty) {
              const attackingSide = activeSide === 'HOME' ? 'AWAY' : 'HOME';
              const defendingSide = activeSide;
              const kickerTeam = attackingSide === 'HOME' ? ctx.homePlayers : ctx.awayPlayers;

            const kickerXI = (attackingSide === 'HOME' ? nextHomeLineup.startingXI : nextAwayLineup.startingXI).filter(id => id !== null) as string[];
              const keeperTeam = defendingSide === 'HOME' ? ctx.homePlayers : ctx.awayPlayers;
              const keeperXI = (defendingSide === 'HOME' ? nextHomeLineup.startingXI : nextAwayLineup.startingXI).filter(id => id !== null) as string[];

              const kicker = GoalAttributionService.pickScorer(kickerTeam, kickerXI, false, () => seededRng(currentSeed, nextMinute, 1800));
              const keeper = keeperTeam.find(p => p.id === keeperXI[0]) || keeperTeam[0];

              if (!kicker || !keeper || !kicker.attributes || !keeper.attributes) return prev;

              setActivePenalty({ side: attackingSide, kicker, keeper, phase: 'AWARDED' });
              nextIsPausedForEvent = true;
              immediateEventType = MatchEventType.PENALTY_AWARDED;
              
              const penPool = MATCH_COMMENTARY_DB[MatchEventType.PENALTY_AWARDED] || ["Rzut karny!"];
              const penText = penPool[Math.floor(seededRng(currentSeed, nextMinute, 1900) * penPool.length)].replace("{Nazwisko}", kicker.lastName);
              newLog = { id: `PEN_AWARD_${nextMinute}`, minute: nextMinute, text: `👉 ${penText}`, type: MatchEventType.PENALTY_AWARDED, teamSide: attackingSide, playerName: kicker.lastName };

              const injury = InjuryEventGenerator.maybeGenerateInjury(ctx, prev, { minute: nextMinute, teamSide: attackingSide, type: MatchEventType.PENALTY_AWARDED, text: '' } as MatchEvent, () => seededRng(currentSeed, nextMinute, 2000));
              if (injury) processInjury(injury);
           } else {
              const card = DisciplineService.evaluateFoul(env.ref, player, nextPlayerYellowCards[pId] || 0, () => seededRng(currentSeed, nextMinute, 1600));

              if (card === MatchEventType.YELLOW_CARD) {
                 nextPlayerYellowCards[pId] = (nextPlayerYellowCards[pId] || 0) + 1;
                 immediateEventType = MatchEventType.YELLOW_CARD;
                 if (nextPlayerYellowCards[pId] === 2) {
                    nextSentOffIds.push(pId);
                    if (activeSide === 'HOME') nextHomeLineup.startingXI = nextHomeLineup.startingXI.map(id => id === pId ? null : id);
                    else nextAwayLineup.startingXI = nextAwayLineup.startingXI.map(id => id === pId ? null : id);
                    newLog = { id: `RED_${nextMinute}`, minute: nextMinute, text: `🟥 DRUGA ŻÓŁTA! ${player.lastName} wylatuje z boiska!`, type: MatchEventType.RED_CARD, teamSide: activeSide, playerName: player.lastName };
                    priorityAiTrigger = true;
                    immediateEventType = MatchEventType.RED_CARD;
                    if (activeSide === userSide) nextIsPaused = true;
                 } else {
                    newLog = { id: `YEL_${nextMinute}`, minute: nextMinute, text: `🟨 Żółta kartka: ${player.lastName}`, type: MatchEventType.YELLOW_CARD, teamSide: activeSide, playerName: player.lastName };
                 }
              } else if (card === MatchEventType.RED_CARD) {
                 nextSentOffIds.push(pId);
                 immediateEventType = MatchEventType.RED_CARD;
                 if (activeSide === 'HOME') nextHomeLineup.startingXI = nextHomeLineup.startingXI.map(id => id === pId ? null : id);
                 else nextAwayLineup.startingXI = nextAwayLineup.startingXI.map(id => id === pId ? null : id);
                 newLog = { id: `RED_DIR_${nextMinute}`, minute: nextMinute, text: `🟥 CZERWONA KARTKA! ${player.lastName}!`, type: MatchEventType.RED_CARD, teamSide: activeSide, playerName: player.lastName };
                 priorityAiTrigger = true;
                 if (activeSide === userSide) nextIsPaused = true;
             } else {
                 // Inkrementacja fauli
                 if (activeSide === 'HOME') nextLiveStats.home.fouls++;
                 else nextLiveStats.away.fouls++;
                 
                 immediateEventType = MatchEventType.FOUL;
                 newLog = { id: `FOUL_${nextMinute}`, minute: nextMinute, text: `${getCommentary(MatchEventType.FOUL, player.lastName)}`, type: MatchEventType.FOUL, teamSide: activeSide };
              }

              if (newLog) {
                const injury = InjuryEventGenerator.maybeGenerateInjury(ctx, prev, { minute: nextMinute, teamSide: activeSide, type: MatchEventType.FOUL, text: '' } as MatchEvent, () => seededRng(currentSeed, nextMinute, 2000));
                if (injury) processInjury(injury);
              }
           }
        } 
       else if (rngEvent < shotThreshold) { 
           const team = activeSide === 'HOME' ? ctx.homePlayers : ctx.awayPlayers;
           const xi = activeSide === 'HOME' ? nextHomeLineup.startingXI : nextAwayLineup.startingXI;
           const oppTeam = activeSide === 'HOME' ? ctx.awayPlayers : ctx.homePlayers;
           const oppXi = activeSide === 'HOME' ? nextAwayLineup.startingXI : nextHomeLineup.startingXI;
      const scorer = GoalAttributionService.pickScorer(team, xi as string[], false, () => seededRng(currentSeed, nextMinute, 700));
           if (!scorer) return prev;
           const assistant = GoalAttributionService.pickAssistant(team, xi as string[], scorer.id, false, () => seededRng(currentSeed, nextMinute, 720));
           
           // Bezpieczne pobieranie bramkarza
           const gk = oppTeam.find(p => p.id === oppXi[0]);
           const defs = oppTeam.filter(p => oppXi.slice(1, 6).includes(p.id));

           // Live fatigue strzelca i bramkarza
           const oppFatigueMap = activeSide === 'HOME' ? localAwayFatigue : localHomeFatigue;
           const myFatigueMap  = activeSide === 'HOME' ? localHomeFatigue : localAwayFatigue;
           const scorerLiveFatigue = myFatigueMap[scorer.id]  ?? 100;
           const gkLiveFatigue     = gk ? (oppFatigueMap[gk.id] ?? 100) : 100;

           // Position Fit Modifier - kara za grę poza naturalną pozycją
           const computePosFitMod = (naturalPos: PlayerPosition, slotRole: PlayerPosition): number => {
             if (naturalPos === slotRole) return 1.0;
             const gkMismatch = naturalPos === PlayerPosition.GK || slotRole === PlayerPosition.GK;
             if (gkMismatch) return 0.45;
             if ((naturalPos === PlayerPosition.DEF && slotRole === PlayerPosition.FWD) ||
                 (naturalPos === PlayerPosition.FWD && slotRole === PlayerPosition.DEF)) return 0.75;
             return 0.88;
           };
           const attackingLineup = activeSide === 'HOME' ? nextHomeLineup : nextAwayLineup;
           const attackingTactic = TacticRepository.getById(attackingLineup.tacticId);
           const scorerSlotIdx   = attackingLineup.startingXI.indexOf(scorer.id);
           const scorerSlotRole  = scorerSlotIdx !== -1 ? attackingTactic.slots[scorerSlotIdx].role : scorer.position;
           const scorerFitMod    = computePosFitMod(scorer.position, scorerSlotRole);
           // Brak bramkarza (pusty slot 0): gkFitMod 0.01 = niemal pewny gol
           const gkFitMod        = gk ? (gk.position === PlayerPosition.GK ? 1.0 : 0.45) : 0.01;

           // Jeśli bramkarza nie ma w slocie (chwila po czerwonej kartce), strzał ma ogromną szansę na gola
           const isGoal = GoalAttributionService.checkShotSuccess(scorer, gk as Player, defs, false, () => seededRng(currentSeed, nextMinute, 750), false, scorerLiveFatigue, gkLiveFatigue, scorerFitMod, gkFitMod, oppFatigueMap);
          

           if (isGoal) {
              const goalInfo = { 
                playerName: scorer.lastName, 
                minute: nextMinute, 
                isPenalty: false,
                assistantName: assistant?.lastName,
                assistantId: assistant?.id
              };
   if (activeSide === 'HOME') { 
                nextHomeScore++; 
                newHomeGoals.push(goalInfo);
                // Zliczanie gola jako strzału celnego
                nextLiveStats.home.shots++;
                nextLiveStats.home.shotsOnTarget++;
              }
              else { 
                nextAwayScore++; 
                newAwayGoals.push(goalInfo);
                nextLiveStats.away.shots++;
                nextLiveStats.away.shotsOnTarget++;
              }
              newLog = { id: `GOAL_${nextMinute}`, minute: nextMinute, text: `⚽ ${getCommentary(MatchEventType.GOAL, scorer.lastName)}${assistant ? ` (Asystował: ${assistant.lastName})` : ''}`, type: MatchEventType.GOAL, teamSide: activeSide, playerName: scorer.lastName };
              goalTriggered = true; priorityAiTrigger = true; immediateEventType = MatchEventType.GOAL;
          } else {
              const failRng = seededRng(currentSeed, nextMinute, 780);
              let failType = MatchEventType.SHOT_ON_TARGET;
              if (failRng < 0.08) failType = MatchEventType.SHOT_POST;
              else if (failRng < 0.16) failType = MatchEventType.SHOT_BAR;
              else if (failRng < 0.26) failType = MatchEventType.ONE_ON_ONE_SAVE;
              else if (failRng < 0.36) failType = MatchEventType.ONE_ON_ONE_MISS;
              else if (failRng < 0.44) failType = MatchEventType.SAVE;
              else if (failRng < 0.54) failType = MatchEventType.WINGER_STOPPED;
              else if (failRng > 0.85) failType = MatchEventType.SHOT;

              // Inkrementacja strzałów niecelnych i celnych (bez gola)
              if (activeSide === 'HOME') {
                nextLiveStats.home.shots++;
                if (failType !== MatchEventType.SHOT) nextLiveStats.home.shotsOnTarget++;
              } else {
                nextLiveStats.away.shots++;
                if (failType !== MatchEventType.SHOT) nextLiveStats.away.shotsOnTarget++;
              }

              immediateEventType = failType;
              newLog = { id: `MISS_${nextMinute}`, minute: nextMinute, text: getCommentary(failType, scorer.lastName), type: failType, teamSide: activeSide };
           }
           pauseForEvent = isGoal;

           if (newLog) {
             const injury = InjuryEventGenerator.maybeGenerateInjury(ctx, prev, { minute: nextMinute, teamSide: activeSide, type: immediateEventType, primaryPlayerId: scorer.id, text: '' } as MatchEvent, () => seededRng(currentSeed, nextMinute, 2500));
             if (injury) processInjury(injury);
           }
        }
        else if (rngEvent < 0.25) {
          const flavorRng = seededRng(currentSeed, nextMinute, 900);
         let type = MatchEventType.MIDFIELD_CONTROL;
          if (flavorRng < 0.06) type = MatchEventType.CORNER;
          else if (flavorRng < 0.12) type = MatchEventType.THROW_IN;
          else if (flavorRng < 0.19) type = MatchEventType.DRIBBLING;
          else if (flavorRng < 0.26) type = MatchEventType.MISPLACED_PASS;
          else if (flavorRng < 0.32) type = MatchEventType.BLUNDER;
          else if (flavorRng < 0.40) type = MatchEventType.PLAY_LEFT;
          else if (flavorRng < 0.48) type = MatchEventType.PLAY_RIGHT;
          else if (flavorRng < 0.54) type = MatchEventType.PLAY_BACK;
          else if (flavorRng < 0.60) type = MatchEventType.PLAY_SIDE;
          else if (flavorRng < 0.66) type = MatchEventType.STUMBLE;
          else if (flavorRng < 0.72) type = MatchEventType.OFFSIDE;
          else if (flavorRng < 0.78) type = MatchEventType.PRESSURE;
          else if (flavorRng < 0.84) type = MatchEventType.FREE_KICK;
          else if (flavorRng < 0.90) type = MatchEventType.FOUL_PUSH;
          else if (flavorRng < 0.95) type = MatchEventType.FOUL_JERSEY;
          else type = MatchEventType.GK_LONG_THROW;

       if (type === MatchEventType.CORNER) {
            if (activeSide === 'HOME') nextLiveStats.home.corners++;
            else nextLiveStats.away.corners++;

            // Krok 5: Rzut rożny → szansa 25% na strzał głową (heading ma teraz znaczenie)
            if (seededRng(currentSeed, nextMinute, 3300) < 0.25) {
              const cornerTeam   = activeSide === 'HOME' ? ctx.homePlayers : ctx.awayPlayers;
              const cornerXI     = (activeSide === 'HOME' ? nextHomeLineup.startingXI : nextAwayLineup.startingXI).filter(id => id !== null) as string[];
              const cornerOppTeam = activeSide === 'HOME' ? ctx.awayPlayers : ctx.homePlayers;
              const cornerOppXI   = (activeSide === 'HOME' ? nextAwayLineup.startingXI : nextHomeLineup.startingXI).filter(id => id !== null) as string[];
              const headerScorer = GoalAttributionService.pickScorer(cornerTeam, cornerXI, true, () => seededRng(currentSeed, nextMinute, 3400));
              if (headerScorer) {
                const cornerGk   = cornerOppTeam.find(p => p.id === cornerOppXI[0]);
                const cornerDefs = cornerOppTeam.filter(p => cornerOppXI.slice(1, 6).includes(p.id));
                const hScorerFat = (activeSide === 'HOME' ? localHomeFatigue : localAwayFatigue)[headerScorer.id] ?? 100;
                const hGkFat     = cornerGk ? ((activeSide === 'HOME' ? localAwayFatigue : localHomeFatigue)[cornerGk.id] ?? 100) : 100;
                // Brak bramkarza przy rożnym — tak samo niemal pewny gol
                const hGkFitMod  = cornerGk ? (cornerGk.position === PlayerPosition.GK ? 1.0 : 0.45) : 0.01;
                const cornerOppFatigue = activeSide === 'HOME' ? localAwayFatigue : localHomeFatigue;
                const isHeaderGoal = GoalAttributionService.checkShotSuccess(
                  headerScorer, cornerGk as Player, cornerDefs, true,
                  () => seededRng(currentSeed, nextMinute, 3500),
                  false, hScorerFat, hGkFat, 1.0, hGkFitMod, cornerOppFatigue
                );
                if (isHeaderGoal) {
                  if (activeSide === 'HOME') {
                    nextHomeScore++;
                    newHomeGoals.push({ playerName: headerScorer.lastName, minute: nextMinute, isPenalty: false });
                    nextLiveStats.home.shots++;
                    nextLiveStats.home.shotsOnTarget++;
                  } else {
                    nextAwayScore++;
                    newAwayGoals.push({ playerName: headerScorer.lastName, minute: nextMinute, isPenalty: false });
                    nextLiveStats.away.shots++;
                    nextLiveStats.away.shotsOnTarget++;
                  }
                  newLog = { id: `CORNER_GOAL_${nextMinute}`, minute: nextMinute, text: `⚽ Gol po rzucie rożnym! ${headerScorer.lastName} wbija głową!`, type: MatchEventType.GOAL, teamSide: activeSide, playerName: headerScorer.lastName };
                  goalTriggered = true;
                  priorityAiTrigger = true;
                  immediateEventType = MatchEventType.GOAL;
                } else {
                  if (activeSide === 'HOME') nextLiveStats.home.shots++;
                  else nextLiveStats.away.shots++;
                }
              }
            }
          }
          if (type === MatchEventType.OFFSIDE) {
            if (activeSide === 'HOME') nextLiveStats.home.offsides++;
            else nextLiveStats.away.offsides++;
          }
          immediateEventType = type;
          const flavorTeam = activeSide === 'HOME' ? ctx.homePlayers : ctx.awayPlayers;
          const flavorLineup = activeSide === 'HOME' ? nextHomeLineup.startingXI : nextAwayLineup.startingXI;
          const flavorActiveIds = flavorLineup.filter(id => id !== null);
          const flavorPlayerId = flavorActiveIds[Math.floor(seededRng(currentSeed, nextMinute, 777) * flavorActiveIds.length)];
          const flavorPlayer = flavorTeam.find(p => p.id === flavorPlayerId);
          newLog = { id: `FLAVOR_${nextMinute}`, minute: nextMinute, text: getCommentary(type, flavorPlayer?.lastName || ''), type: type, teamSide: activeSide };
        }

        const accidentalInjuryRoll = seededRng(currentSeed, nextMinute, 4500);
        const uInjuryThreshold = 0.0064 * ((uInjuryMod + 1.0) / 2);
        if (accidentalInjuryRoll < uInjuryThreshold) {
           const side: 'HOME' | 'AWAY' = seededRng(currentSeed, nextMinute, 4600) < 0.5 ? 'HOME' : 'AWAY';
           const pool = side === 'HOME' ? ctx.homePlayers : ctx.awayPlayers;
           const lineup = side === 'HOME' ? nextHomeLineup.startingXI : nextAwayLineup.startingXI;
           const activeInjMap = side === 'HOME' ? nextHomeInjuries : nextAwayInjuries;
           const healthyOnPitch = pool.filter(p => lineup.includes(p.id) && !activeInjMap[p.id]);

           if (healthyOnPitch.length > 0) {
              const victim = healthyOnPitch[Math.floor(seededRng(currentSeed, nextMinute, 4700) * healthyOnPitch.length)];
              const isSevere = seededRng(currentSeed, nextMinute, 4800) < 0.15;
              processInjury({
                 minute: nextMinute,
                 teamSide: side,
                 type: isSevere ? MatchEventType.INJURY_SEVERE : MatchEventType.INJURY_LIGHT,
                 primaryPlayerId: victim.id,
                 text: victim.lastName
              } as MatchEvent);
           }
        }

        const upgrades = InjuryUpgradeService.checkUpgrades(ctx, prev, () => seededRng(currentSeed, nextMinute, 3000));
        upgrades.forEach(upg => processInjury(upg));

        const carriedOffLogs: MatchLogEntry[] = [];
        const autoRemoveInjured = (lineup: (string | null)[], injuries: Record<string, InjurySeverity>, side: 'HOME' | 'AWAY') => {
               const isUserWithoutSubs = side === userSide && (side === 'HOME' ? nextSubsCountHome : nextSubsCountAway) >= 5;
          
          if (side === userSide && !isUserWithoutSubs) return lineup;

          return lineup.map(id => {
            if (id && injuries[id] === InjurySeverity.SEVERE) {
               const p = (side === 'HOME' ? ctx.homePlayers : ctx.awayPlayers).find(px => px.id === id);
               carriedOffLogs.push({
                 id: `CARRIED_${nextMinute}_${id}`,
                 minute: nextMinute,
                 text: side === userSide 
                    ? `🚑 ${p?.lastName} zniesiony na noszach! Brak zmian - gramy w osłabieniu!` 
                    : `🚨 ${p?.lastName} zostaje zniesiony na noszach! Drużyna gra w dziesiątkę!`,
                 type: MatchEventType.GENERIC,
                 teamSide: side
               });
               return null;
            }
            return id;
          });
        };
        nextHomeLineup.startingXI = autoRemoveInjured(nextHomeLineup.startingXI, nextHomeInjuries, 'HOME');
        nextAwayLineup.startingXI = autoRemoveInjured(nextAwayLineup.startingXI, nextAwayInjuries, 'AWAY');
        updatedLogs = [...carriedOffLogs, ...updatedLogs];

        if (goalTriggered) {
          const lastGoal = activeSide === 'HOME' ? newHomeGoals[newHomeGoals.length - 1] : newAwayGoals[newAwayGoals.length - 1];
          const canTriggerVAR = !lastGoal?.isPenalty;
          if (canTriggerVAR) {
            varDataRef.current = { side: activeSide, scorerName: lastGoal?.playerName || '', minute: nextMinute };
          }
          setIsCelebratingGoal(true);
          setTimeout(() => {
            setIsCelebratingGoal(false);
            const vd = varDataRef.current;
            if (vd && Math.random() < 0.2) {
              setActiveVAR({ ...vd, phase: 'CHECKING' });
            }
            varDataRef.current = null;
          }, 3500);
        }

        const momentumUpdate = MomentumService.computeMomentum(ctx, { ...prev, minute: nextMinute, momentum: prev.momentum, homeLineup: nextHomeLineup, awayLineup: nextAwayLineup }, immediateEventType, activeSide, localHomeFatigue, localAwayFatigue);

     if (priorityAiTrigger) {
           const decision = AiMatchDecisionService.makeDecisions({ ...prev, minute: nextMinute, homeScore: nextHomeScore, awayScore: nextAwayScore, sentOffIds: nextSentOffIds, homeLineup: nextHomeLineup, awayLineup: nextAwayLineup, homeInjuries: nextHomeInjuries, awayInjuries: nextAwayInjuries, homeFatigue: localHomeFatigue, awayFatigue: localAwayFatigue, lastAiActionMinute: nextLastAiActionMinute, homeSubsHistory: nextHomeSubsHistory, awaySubsHistory: nextAwaySubsHistory }, ctx, aiSide, true);
           
           // TUTAJ WSTAW TEN KOD - Obsługa wewnętrznych przesunięć (np. gracz z pola na bramkę)
           if (decision.newLineup) {
              if (aiSide === 'HOME') nextHomeLineup = decision.newLineup;
              else nextAwayLineup = decision.newLineup;
           }

           let aiFixedSevere = false;
           if (decision.subRecord) {
              const subbedId = decision.subRecord.playerOutId;
              const severityWas = (aiSide === 'HOME' ? nextHomeInjuries : nextAwayInjuries)[subbedId];
              
              if (aiSide === 'HOME') { 
                nextHomeLineup = decision.newLineup || nextHomeLineup; 
                nextSubsCountHome = decision.newSubsCount ?? nextSubsCountHome; 
                nextHomeSubsHistory = [...nextHomeSubsHistory, decision.subRecord];
                delete nextHomeRiskMode[decision.subRecord.playerOutId];
              }
              else { 
                nextAwayLineup = decision.newLineup || nextAwayLineup; 
                nextSubsCountAway = decision.newSubsCount ?? nextSubsCountAway; 
                nextAwaySubsHistory = [...nextAwaySubsHistory, decision.subRecord]; 
                delete nextAwayRiskMode[decision.subRecord.playerOutId];
              }

              if (severityWas === InjurySeverity.SEVERE || subbedId === 'NONE') aiFixedSevere = true;
           }
           if (decision.newTacticId) {
              if (aiSide === 'HOME') nextHomeLineup.tacticId = decision.newTacticId;
              else nextAwayLineup.tacticId = decision.newTacticId;
           }
           if (decision.lastAiActionMinute !== undefined) nextLastAiActionMinute = decision.lastAiActionMinute;
           if (decision.aiTacticLocked) nextAiTacticLocked = true;
           if (decision.logs) {
              decision.logs.forEach(l => {
                 updatedLogs = [{ id: `AI_LOG_${nextMinute}_${Math.random()}`, minute: nextMinute, text: l, type: MatchEventType.GENERIC, teamSide: aiSide }, ...updatedLogs];
              });
           }

           if (aiFixedSevere) {
              const injuredUserOnPitch = (userSide === 'HOME' ? nextHomeLineup : nextAwayLineup).startingXI.some(id => id && (userSide === 'HOME' ? nextHomeInjuries : nextAwayInjuries)[id] === InjurySeverity.SEVERE);
              if (!injuredUserOnPitch) {
                 nextIsPaused = false;
              }
           }
        }

        const fatigue = MatchEngineService.calculateFatigueStep({ ...prev, momentum: momentumUpdate, homeFatigue: localHomeFatigue, awayFatigue: localAwayFatigue }, ctx, env.weather);
        
        const uFatExtra = (uInstr.tempo === 'FAST' ? 0.025 : 0) + (uInstr.intensity === 'AGGRESSIVE' ? 0.018 : uInstr.intensity === 'CAUTIOUS' ? 0.012 : 0);
        if (uFatExtra > 0) {
          const uXIForFat = userSide === 'HOME' ? nextHomeLineup.startingXI : nextAwayLineup.startingXI;
          const uFatTarget = userSide === 'HOME' ? fatigue.home : fatigue.away;
          uXIForFat.filter((id): id is string => id !== null).forEach(id => {
            uFatTarget[id] = Math.max(0, (uFatTarget[id] ?? 100) - uFatExtra);
          });
        }
        Object.keys(nextHomeInjuries).forEach(id => { if (nextHomeInjuries[id] === InjurySeverity.SEVERE) fatigue.home[id] = 0; });
        Object.keys(nextAwayInjuries).forEach(id => { if (nextAwayInjuries[id] === InjurySeverity.SEVERE) fatigue.away[id] = 0; });

        if (newLog) updatedLogs = [newLog, ...updatedLogs];

        
return {
           ...prev, 
           minute: nextMinute, 
           addedTime: currentAddedTime, 
           homeScore: nextHomeScore, 
           awayScore: nextAwayScore,
           homeGoals: newHomeGoals, 
           awayGoals: newAwayGoals, 
           momentum: momentumUpdate,
           momentumSum: nextMomentumSum, 
           momentumTicks: nextMomentumTicks, 
           liveStats: nextLiveStats,
           homeFatigue: fatigue.home, 
           awayFatigue: fatigue.away, 
           homeLineup: nextHomeLineup, 
           awayLineup: nextAwayLineup,
           playerYellowCards: nextPlayerYellowCards, 
           sentOffIds: nextSentOffIds, 
           logs: updatedLogs,
           isPaused: nextIsPaused, 
           isPausedForEvent: (pauseForEvent && !goalTriggered) || nextIsPausedForEvent, 
           subsCountHome: nextSubsCountHome, 
           subsCountAway: nextSubsCountAway,
           homeSubsHistory: nextHomeSubsHistory, 
           awaySubsHistory: nextAwaySubsHistory,
           lastAiActionMinute: nextLastAiActionMinute,
           aiTacticLocked: nextAiTacticLocked,
           homeInjuries: nextHomeInjuries, 
           awayInjuries: nextAwayInjuries,
           homeRiskMode: nextHomeRiskMode, 
           awayRiskMode: nextAwayRiskMode,
           homeInjuryMin: nextHomeInjuryMin, 
           awayInjuryMin: nextAwayInjuryMin,
           homeUpgradeProb: nextHomeUpgradeProb, 
           awayUpgradeProb: nextAwayUpgradeProb,
           userInstructions: nextUserInstructions
        };


      });
    }, tickInterval);
    return () => clearInterval(interval);
  }, [matchState?.isPaused, matchState?.isPausedForEvent, matchState?.isFinished, matchState?.isHalfTime, matchState?.speed, isCelebratingGoal, ctx, env, userSide, isTacticsOpen, activePenalty, activeVAR, hasMandatorySub, setMatchState]);

 const handleFinishMatch = () => {
    if (!matchState || !ctx) return;

    const simResult = BackgroundMatchProcessor.processLeagueEvent(currentDate, userTeamId, fixtures, clubs, players, lineups, seasonNumber, coaches);
    // TUTAJ WSTAW TEN KOD
    // Obliczamy ranking ligowy gracza dla potrzeb frekwencji
    const leagueClubs = clubs.filter(c => c.leagueId === ctx.homeClub.leagueId);
    const sortedStandings = [...leagueClubs].sort((a, b) => b.stats.points - a.stats.points || b.stats.goalDifference - a.stats.goalDifference);
    const homeRank = sortedStandings.findIndex(c => c.id === ctx.homeClub.id) + 1;
    
    // Obliczamy frekwencję (korzystając z pogody zdefiniowanej w env.weather)
    const attendance = AttendanceService.calculate(ctx.homeClub, homeRank, env!.weather);

    // NAPRAWKA DUPLIKACJI WYNIKÓW:
    // Priorytet: wyniki z advanceDay (jeśli już uruchomił się dla daty meczu)
    // Fallback: wyniki z processLeagueEvent powyżej (jeśli advanceDay jeszcze nie uruchomił się)
    const fixtureDateKey = ctx.fixture.date.toDateString();
    const bgFromAdvanceDay = roundResults[fixtureDateKey];
    const bgFromProcessor = simResult.roundResults;
    const bgSource = bgFromAdvanceDay || bgFromProcessor || { dateKey: currentDate.toDateString(), league1Results: [], league2Results: [], league3Results: [] };

    DebugLoggerService.separator('handleFinishMatch');
    DebugLoggerService.log('FINISH', `fixtureDateKey=${fixtureDateKey} | currentDate=${currentDate.toDateString()}`);
    DebugLoggerService.log('FINISH', `bgFromAdvanceDay=${bgFromAdvanceDay?.league1Results?.length ?? 'null'} | bgFromProcessor=${bgFromProcessor?.league1Results?.length ?? 'null'} | bgSource=${bgSource.league1Results.length}`);
    DebugLoggerService.log('FINISH', `roundResults keys in state: ${Object.keys(roundResults).join(', ')}`);
    Object.entries(roundResults).forEach(([k, v]) => {
      DebugLoggerService.log('FINISH', `  key=${k} L1=${v.league1Results.length} L2=${v.league2Results.length} L3=${v.league3Results.length}`);
      v.league1Results.forEach((r, i) => DebugLoggerService.log('FINISH', `    L1[${i}]: ${r.homeTeamName} vs ${r.awayTeamName} ${r.homeScore}:${r.awayScore}`));
    });

    // Wyniki przechowywane pod currentDate.toDateString() - to samo co czyta PostMatchStudioView
    const finalRoundResults = {
      dateKey: currentDate.toDateString(),
      league1Results: [...bgSource.league1Results],
      league2Results: [...bgSource.league2Results],
      league3Results: [...bgSource.league3Results],
    };
    const userMatchResult: MatchResult = { homeTeamName: ctx.homeClub.name, awayTeamName: ctx.awayClub.name, homeScore: matchState.homeScore, awayScore: matchState.awayScore, homeColors: ctx.homeClub.colorsHex, awayColors: ctx.awayClub.colorsHex };
    const lid = ctx.fixture.leagueId;
    if (lid === 'L_PL_1') finalRoundResults.league1Results.push(userMatchResult);
    else if (lid === 'L_PL_2') finalRoundResults.league2Results.push(userMatchResult);
    else if (lid === 'L_PL_3') finalRoundResults.league3Results.push(userMatchResult);

   let updatedPlayers = { ...simResult.updatedPlayers };

    // TUTAJ WSTAW TEN KOD - Poprawna identyfikacja wszystkich zawodników (Starterzy + Zmiennicy)
    const getPlayedIds = (lineup: any, history: SubstitutionRecord[]) => {
      const currentOnPitch = lineup.startingXI.filter((id: any) => id !== null) as string[];
      const subbedOut = history.map(s => s.playerOutId).filter(id => id !== 'NONE' && id !== '??');
      return new Set([...currentOnPitch, ...subbedOut]);
    };

    const playedIdsHome = getPlayedIds(matchState.homeLineup, matchState.homeSubsHistory);
    const playedIdsAway = getPlayedIds(matchState.awayLineup, matchState.awaySubsHistory);
    updatedPlayers = PlayerStatsService.processMatchDayEndForClub(updatedPlayers, ctx.homeClub.id, Array.from(playedIdsHome) as string[]);
    updatedPlayers = PlayerStatsService.processMatchDayEndForClub(updatedPlayers, ctx.awayClub.id, Array.from(playedIdsAway) as string[]);

  const applyFatigueDebtToSquad = (squad: Player[], playedIds: Set<string>) => {
      return squad.map(p => {
        if (playedIds.has(p.id)) {
          const matchDebt = 5 + ((100 - (p.attributes.stamina || 50)) * 0.15);
          return { ...p, fatigueDebt: Math.min(100, (p.fatigueDebt || 0) + matchDebt) };
        }
        return p;
      });
    };
    updatedPlayers[ctx.homeClub.id] = applyFatigueDebtToSquad(updatedPlayers[ctx.homeClub.id], playedIdsHome);
    updatedPlayers[ctx.awayClub.id] = applyFatigueDebtToSquad(updatedPlayers[ctx.awayClub.id], playedIdsAway);

    matchState.homeGoals.filter(g => !g.varDisallowed).forEach(g => {
       const pFound = ctx.homePlayers.find(px => px.lastName === g.playerName);
       if (pFound) updatedPlayers = PlayerStatsService.applyGoal(updatedPlayers, pFound.id, g.assistantId);
    });
    matchState.awayGoals.filter(g => !g.varDisallowed).forEach(g => {
       const pFound = ctx.awayPlayers.find(px => px.lastName === g.playerName);
       if (pFound) updatedPlayers = PlayerStatsService.applyGoal(updatedPlayers, pFound.id, g.assistantId);
    });

    Object.entries(matchState.playerYellowCards).forEach(([pId, count]) => {
       for (let i = 0; i < (count as number); i++) updatedPlayers = PlayerStatsService.applyCard(updatedPlayers, pId, MatchEventType.YELLOW_CARD);
    });
    matchState.sentOffIds.forEach(pId => updatedPlayers = PlayerStatsService.applyCard(updatedPlayers, pId, MatchEventType.RED_CARD));

    const applyInjuriesToSquad = (squad: Player[], sideInjuries: Record<string, InjurySeverity>, sideInMins: Record<string, number>) => {
      return squad.map(p => {
        if (sideInjuries[p.id]) {
          const sev = sideInjuries[p.id];
          const isSev = sev === InjurySeverity.SEVERE;
          const days = isSev ? (14 + Math.floor(Math.random() * 30)) : (2 + Math.floor(Math.random() * 6));
          const type = isSev ? "Poważny uraz więzadeł" : "Stłuczenie mięśnia";
          
       const penalty = isSev ? (Math.floor(Math.random() * 31) + 60) : (Math.floor(Math.random() * 26) + 10);
          const condAfterPenalty = Math.max(0, p.condition - penalty);
          return {
            ...p,
            health: {
              status: HealthStatus.INJURED,
              injury: { 
                type, 
                daysRemaining: days, 
                severity: sev,
                injuryDate: currentDate.toISOString(), // -> tutaj wstaw kod
                totalDays: days,
                conditionAtInjury: condAfterPenalty
              }
            },
            condition: condAfterPenalty
          };
        }
        return p;
      });
    };

    updatedPlayers[ctx.homeClub.id] = applyInjuriesToSquad(updatedPlayers[ctx.homeClub.id], matchState.homeInjuries, matchState.homeInjuryMin);
    updatedPlayers[ctx.awayClub.id] = applyInjuriesToSquad(updatedPlayers[ctx.awayClub.id], matchState.awayInjuries, matchState.awayInjuryMin);

  const updatedClubs = simResult.updatedClubs.map(c => {
       if (c.id === ctx.homeClub.id || c.id === ctx.awayClub.id) {
          const isHome = c.id === ctx.homeClub.id;
          const matchCost = FinanceService.calculateMatchdayExpenses(c, isHome);
          const s = isHome ? matchState.homeScore : matchState.awayScore;
          const o = isHome ? matchState.awayScore : matchState.homeScore;

          const resultChar: "W" | "R" | "P" = s > o ? 'W' : (s === o ? 'R' : 'P');
          const newForm = [...(c.stats.form || []), resultChar].slice(-5) as ("W" | "R" | "P")[];

          return {
            ...c, 
            budget: c.budget - matchCost,
            stats: {
              ...c.stats,
              form: newForm
            } 
          };

       }
       return c;
    });

    const updatedFixtures = simResult.updatedFixtures.map(f => f.id === ctx.fixture.id ? { ...f, status: 'FINISHED' as any, homeScore: matchState.homeScore, awayScore: matchState.awayScore } : f);

    const clBgResult = BackgroundMatchProcessorCL.processChampionsLeagueEvent(currentDate, userTeamId, updatedFixtures, clubs, sessionSeed);

    const timeline: MatchSummaryEvent[] = [];
    let hCounter = 0, aCounter = 0;
    [...matchState.logs].filter(l => [MatchEventType.GOAL, MatchEventType.YELLOW_CARD, MatchEventType.RED_CARD, MatchEventType.PENALTY_SCORED, MatchEventType.INJURY_LIGHT, MatchEventType.INJURY_SEVERE].includes(l.type)).sort((a, b) => a.minute - b.minute).forEach(l => {
      const goalEntry = (l.type === MatchEventType.GOAL)
        ? matchState[l.teamSide === 'HOME' ? 'homeGoals' : 'awayGoals'].find(g => g.playerName === l.playerName && g.minute === l.minute)
        : undefined;
      const isVarDisallowed = goalEntry?.varDisallowed === true;
      if ((l.type === MatchEventType.GOAL || l.type === MatchEventType.PENALTY_SCORED) && !isVarDisallowed) { if (l.teamSide === 'HOME') hCounter++; else aCounter++; }
      timeline.push({ minute: l.minute, type: l.type, playerName: l.playerName || '?', assistantName: l.type === MatchEventType.GOAL ? goalEntry?.assistantName : undefined, teamSide: l.teamSide!, varDisallowed: isVarDisallowed, scoreAtMoment: (l.type === MatchEventType.GOAL || l.type === MatchEventType.PENALTY_SCORED) && !isVarDisallowed ? `${hCounter}-${aCounter}` : undefined });
    });

   // --- WARSTWA KALIBRACJI STATYSTYK (STAGE 1 PRO) ---
    const homeCardsCount = Object.keys(matchState.playerYellowCards).filter(id => ctx.homePlayers.some(p => p.id === id)).length + matchState.sentOffIds.filter(id => ctx.homePlayers.some(p => p.id === id)).length;
    const awayCardsCount = Object.keys(matchState.playerYellowCards).filter(id => ctx.awayPlayers.some(p => p.id === id)).length + matchState.sentOffIds.filter(id => ctx.awayPlayers.some(p => p.id === id)).length;

    // a) Przewinienia (Faule) + Kartki
   let calibHomeFouls = matchState.liveStats.home.fouls;
    for(let i=0; i<homeCardsCount; i++) calibHomeFouls += Math.floor(Math.random() * 4) + 2;
    // Failsafe dla fauli: jeśli suma mniejsza niż 8, dodaj losowo 2-14
    if (calibHomeFouls < 8) calibHomeFouls += Math.floor(Math.random() * 13) + 2;

    let calibAwayFouls = matchState.liveStats.away.fouls;
    for(let i=0; i<awayCardsCount; i++) calibAwayFouls += Math.floor(Math.random() * 4) + 2;
    if (calibAwayFouls < 8) calibAwayFouls += Math.floor(Math.random() * 13) + 2;

    // b) Strzały ogólne (Gole jako katalizator)
    const calibHomeShots = matchState.liveStats.home.shots + (matchState.homeScore * (Math.floor(Math.random() * 3) + 2));
    const calibAwayShots = matchState.liveStats.away.shots + (matchState.awayScore * (Math.floor(Math.random() * 3) + 2));

    // c) Rzuty rożne (Safe-min 3)
    let calibHomeCorners = matchState.liveStats.home.corners;
    if (calibHomeCorners < 6) calibHomeCorners += Math.floor(Math.random() * 7) + 2;
    let calibAwayCorners = matchState.liveStats.away.corners;
    if (calibAwayCorners < 6) calibAwayCorners += Math.floor(Math.random() * 7) + 2;

const calculateUnitRatings = (teamPlayers: Player[], playedIds: Set<string>, side: 'HOME' | 'AWAY', conceded: number, shotsAgainst: number) => {
      // 1. Inicjalizacja bazowa
      const perfs = teamPlayers.filter(p => playedIds.has(p.id)).map(p => {
        const perf: PlayerPerformance = {
          playerId: p.id, name: p.lastName, position: p.position,
          goals: matchState[side === 'HOME' ? 'homeGoals' : 'awayGoals'].filter(g => g.playerName === p.lastName).length,
          assists: matchState[side === 'HOME' ? 'homeGoals' : 'awayGoals'].filter(g => g.assistantId === p.id).length,
          yellowCards: matchState.playerYellowCards[p.id] || 0,
          redCards: matchState.sentOffIds.includes(p.id) ? 1 : 0,
          missedPenalties: 0, savedPenalties: 0,
          healthStatus: (side === 'HOME' ? matchState.homeInjuries[p.id] : matchState.awayInjuries[p.id]) ? HealthStatus.INJURED : HealthStatus.HEALTHY,
          fatigue: Math.floor((side === 'HOME' ? matchState.homeFatigue[p.id] : matchState.awayFatigue[p.id]) || 90)
        };
        perf.rating = PostMatchCommentSelector.calculateRating(perf, conceded);
        return perf;
      });

// --- ROZSZERZONY SILNIK OCEN (STAGE 1 PRO) ---
      const teamGoalsCount = matchState[side === 'HOME' ? 'homeGoals' : 'awayGoals'].length;
      const opponentGoalsCount = side === 'HOME' ? matchState.awayScore : matchState.homeScore;
      const scoreDifference = teamGoalsCount - opponentGoalsCount;

      perfs.forEach(p => {
        // 1. Bonus dla pomocników za bramki drużyny
        if (p.position === PlayerPosition.MID) {
          p.rating! += teamGoalsCount * (0.5 + Math.random() * 0.3);
        }

        // 2. Bonus za asysty
        if (p.assists > 0) {
          p.rating! += p.assists * (0.5 + Math.random() * 0.5);
        }

        // 3. Bonus za gole (Pozycyjny)
        if (p.goals > 0) {
          if (p.position === PlayerPosition.FWD) p.rating! += p.goals * 1.0;
          else if (p.position === PlayerPosition.MID) p.rating! += p.goals * 1.2;
          else if (p.position === PlayerPosition.DEF) p.rating! += p.goals * 1.3;

          // Premia za więcej niż 2 bramki
          if (p.goals > 2) p.rating! += 1.4;
        }

        // 4. Bonusy/Kary drużynowe za wynik
        if (scoreDifference > 0) {
          if (scoreDifference === 1) p.rating! += 0.5;
          else if (scoreDifference === 2) p.rating! += 0.9;
          else if (scoreDifference >= 3) p.rating! += 1.2;
        } else if (scoreDifference < 0) {
          const absoluteLoss = Math.abs(scoreDifference);
          if (absoluteLoss === 1) p.rating! -= 0.5;
          else if (absoluteLoss === 2) p.rating! -= 1.0;
          else if (absoluteLoss === 3) p.rating! -= 1.3;
          else if (absoluteLoss >= 4) p.rating! -= (1.3 + Math.random() * 0.5);
        }
      });

      // 5. Logika Bramkarza (Czyste konto + strzały - zachowana)
      const gk = perfs.find(p => p.position === PlayerPosition.GK);
      if (gk && conceded === 0 && shotsAgainst >= 5) {
        gk.rating! += Math.min(2.5, (shotsAgainst - 4) * 0.4);
      }

      // 6. Logika Obrońców (Zachowana)
      const defenders = perfs.filter(p => p.position === PlayerPosition.DEF);
      if (defenders.length > 0) {
        if (conceded === 0) {
          defenders.forEach(d => d.rating! += (Math.random() * 1.1 + 0.5));
        } else if (conceded === 1) {
          const sorted = [...defenders].sort((a,b) => {
             const pa = teamPlayers.find(x => x.id === a.playerId)!;
             const pb = teamPlayers.find(x => x.id === b.playerId)!;
             return pa.overallRating - pb.overallRating;
          });
          const scapegoat = Math.random() < 0.7 ? sorted[0] : sorted[Math.floor(Math.random() * sorted.length)];
          if (scapegoat) scapegoat.rating! -= (Math.random() * 0.5 + 0.5);
        } else if (conceded >= 2 && conceded <= 3) {
          const shuffled = [...defenders].sort(() => Math.random() - 0.5);
          shuffled.slice(0, 2).forEach(d => d.rating! -= (Math.random() * 0.5 + 0.5));
        } else if (conceded >= 4) {
          defenders.forEach(d => d.rating! -= (Math.random() * 1.1 + 0.5));
        }
      }

      // Finalny Clamp i Zaokrąglenie
      perfs.forEach(p => p.rating = Math.min(10, Math.max(1, parseFloat(p.rating!.toFixed(1)))));
      return perfs;
    };

const summary: MatchSummary = {
      matchId: ctx.fixture.id, userTeamId: userTeamId!, homeClub: ctx.homeClub, awayClub: ctx.awayClub, 
      homeScore: matchState.homeScore, awayScore: matchState.awayScore, homeGoals: matchState.homeGoals.filter(g => !g.varDisallowed), awayGoals: matchState.awayGoals.filter(g => !g.varDisallowed),
      attendance: attendance,
      homeStats: { ...matchState.liveStats.home, fouls: calibHomeFouls, shots: calibHomeShots, corners: calibHomeCorners, yellowCards: Object.keys(matchState.playerYellowCards).filter(id => ctx.homePlayers.some(p => p.id === id)).length, redCards: matchState.sentOffIds.filter(id => ctx.homePlayers.some(p => p.id === id)).length, possession: Math.round(50 + ((matchState.momentumSum / (matchState.momentumTicks || 1)) * 0.4)) },
      awayStats: { ...matchState.liveStats.away, fouls: calibAwayFouls, shots: calibAwayShots, corners: calibAwayCorners, yellowCards: Object.keys(matchState.playerYellowCards).filter(id => ctx.awayPlayers.some(p => p.id === id)).length, redCards: matchState.sentOffIds.filter(id => ctx.awayPlayers.some(p => p.id === id)).length, possession: 100 - Math.round(50 + ((matchState.momentumSum / (matchState.momentumTicks || 1)) * 0.4)) },
      homePlayers: calculateUnitRatings(ctx.homePlayers, playedIdsHome, 'HOME', matchState.awayScore, matchState.liveStats.away.shotsOnTarget),
      awayPlayers: calculateUnitRatings(ctx.awayPlayers, playedIdsAway, 'AWAY', matchState.homeScore, matchState.liveStats.home.shotsOnTarget),
      timeline
    };

    // TUTAJ WSTAW TEN KOD - Mapowanie ocen zawodników
    const finalRatingsMap: Record<string, number> = {};
    [...summary.homePlayers, ...summary.awayPlayers].forEach(perf => {
      if (perf.rating) finalRatingsMap[perf.playerId] = perf.rating;
    });
    // KONIEC WSTAWKI

    applySimulationResult({ 
      ...simResult, 
      updatedClubs, 
      updatedFixtures: clBgResult.updatedFixtures, 
      updatedPlayers, 
      roundResults: finalRoundResults, 
      seasonNumber, 
      ratings: finalRatingsMap 
    });



    MatchHistoryService.logMatch({
      matchId: ctx.fixture.id,
      date: currentDate.toDateString(),
      season: seasonNumber,
      competition: ctx.fixture.leagueId,
      homeTeamId: ctx.homeClub.id,
      awayTeamId: ctx.awayClub.id,
      homeScore: matchState.homeScore,
      awayScore: matchState.awayScore,
      attendance: attendance,


      goals: summary.homeGoals.map(g => ({ playerName: g.playerName, minute: g.minute, teamId: ctx.homeClub.id, isPenalty: g.isPenalty }))
        .concat(summary.awayGoals.map(g => ({ playerName: g.playerName, minute: g.minute, teamId: ctx.awayClub.id, isPenalty: g.isPenalty }))),
     cards: (() => {
          const playerYellowCount: Record<string, number> = {};
          // Sortujemy logi chronologicznie, aby poprawnie wykryć, która żółta jest drugą
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
    navigateTo(ViewState.POST_MATCH_CL_STUDIO);
  };

  if (!matchState || !ctx || !env || !kitColors) return null;

  const renderTicker = (side: 'HOME' | 'AWAY') => {
    const goals = side === 'HOME' ? matchState.homeGoals : matchState.awayGoals;
    const cards = matchState.logs.filter(l => l.teamSide === side && (l.type === MatchEventType.YELLOW_CARD || l.type === MatchEventType.RED_CARD));
    const injs = matchState.logs.filter(l => l.teamSide === side && (l.type === MatchEventType.INJURY_LIGHT || l.type === MatchEventType.INJURY_SEVERE));
    
    return (
      <div className={`flex flex-wrap gap-2 mt-1 ${side === 'AWAY' ? 'justify-end' : 'justify-start'}`}>
        
      {goals.map((g, i) => {
          // TUTAJ WSTAW TEN KOD - Inteligentne formatowanie nazwiska strzelca
          const nameToDisplay = g.playerName.includes('.') ? g.playerName : g.playerName; 
          // KONIEC WSTAWKI
          return (
            <span key={`g-${i}`} className={`text-[9px] font-bold flex items-center gap-1 ${g.isMiss ? 'text-rose-500' : g.varDisallowed ? 'text-slate-500' : 'text-white'}`}>
              {g.isMiss ? '❌' : '⚽'}{' '}
              {g.varDisallowed
                ? <><s>{nameToDisplay} ({g.minute}'{g.isPenalty ? ' k.' : ''})</s> (VAR)</>
                : `${nameToDisplay} (${g.minute}'${g.isPenalty ? ' k.' : ''}${g.isMiss ? '' : ''})`}
            </span>
          );
        })}

        {cards.map((c, i) => <span key={`c-${i}`} className="text-[9px] font-bold text-white flex items-center gap-1">{c.type === MatchEventType.RED_CARD ? '🟥' : '🟨'} {c.playerName}</span>)}
        {injs.map((j, i) => <span key={`j-${i}`} className="text-[9px] font-bold text-white flex items-center gap-1"><span className={j.type === MatchEventType.INJURY_SEVERE ? 'text-red-500' : 'text-white'}>✚</span> {j.playerName}</span>)}
      </div>
    );
  };

const SquadList = ({ side, lineup, players, fatigue, injs, subsHistory }: { side: 'HOME' | 'AWAY', lineup: (string | null)[], players: Player[], fatigue: Record<string, number>, injs: Record<string, InjurySeverity>, subsHistory: SubstitutionRecord[] }) => (
    <div
      className="w-96 shrink-0  p-4 rounded-[40px] border border-white/10 flex flex-col gap-2 overflow-hidden h-full shadow-2xl relative"
      style={{ backgroundColor: kitColors ? (side === 'HOME' ? hexToRgba(kitColors.home.primary, 0.12) : hexToRgba(kitColors.away.primary, 0.12)) : 'rgba(15,23,42,0.20)'}}
    >
      <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: side === 'HOME' ? kitColors!.home.primary : kitColors!.away.primary }} />
       <h4 className="text-[10px] font-black text-slate-100 uppercase tracking-[0.3em] mb-4 text-center">
        {TacticRepository.getById(side === 'HOME' ? matchState!.homeLineup.tacticId : matchState!.awayLineup.tacticId).name}
      </h4>
      
      <div className={`grid ${side === 'HOME' ? 'grid-cols-[1fr_45px_35px_35px]' : 'grid-cols-[35px_35px_45px_1fr]'} gap-2 px-4 mb-2 text-[8px] font-black text-slate-600 uppercase tracking-widest`}>
        {side === 'HOME' ? (
          <><span>Zawodnik</span><span className="text-center">Rtg</span><span className="text-center">Gol</span><span className="text-center">Asist</span></>
        ) : (
          <><span className="text-center">Asist</span><span className="text-center">Gol</span><span className="text-center">Rtg</span><span className="text-right">Zawodnik</span></>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1">
        {lineup.map((pid, idx) => {
          if (!pid) return <div key={`empty-${idx}`} className="h-10 bg-red-950/10 rounded-xl border border-dashed border-red-500/20 flex items-center justify-center text-[7px] text-red-500/40 font-black uppercase">Luka</div>;
          const p = players.find(px => px.id === pid);
          if (!p) return null;
          
          const liveRating = calculateLiveRating(p, side, matchState);
          const nameWithInitial = `${p.firstName.charAt(0)}. ${p.lastName}`;
          // Poprawiona detekcja goli: sprawdzamy zarówno nazwisko jak i format z inicjałem
          const goalsCount = (side === 'HOME' ? matchState!.homeGoals : matchState!.awayGoals).filter(g => g.playerName === p.lastName || g.playerName === nameWithInitial).length;
          const assistsCount = (side === 'HOME' ? matchState!.homeGoals : matchState!.awayGoals).filter(g => g.assistantId === p.id).length;
          const f = fatigue[pid] || 100;
          const isSentOff = matchState!.sentOffIds.includes(pid);

  const injuryStatus = injs[pid];
  const isSevereInjured = injuryStatus === 'SEVERE';
          const conditionColor = injuryStatus === 'LIGHT' ? 'bg-orange-500' : PlayerPresentationService.getConditionColorClass(f);


          return (
            <div key={pid} onClick={() => handleOpenPlayerCard(p.id)} className={`grid ${side === 'HOME' ? 'grid-cols-[1fr_45px_35px_35px]' : 'grid-cols-[35px_35px_45px_1fr]'} gap-2 items-center py-2 px-3 rounded-2xl border transition-all cursor-pointer ${isSentOff ? 'opacity-20 grayscale' : isSevereInjured ? 'bg-red-600/20 border-red-500/40 hover:bg-red-600/30' : 'bg-white/[0.05] border-white/[0.01] hover:border-white/20 hover:bg-white/[0.01]'}`}>
              {side === 'HOME' ? (
                <>
                  <div className="min-w-0 flex items-center gap-3">
                    <span className={`w-8 font-mono font-black text-[9px] ${PlayerPresentationService.getPositionColorClass(p.position)}`}>{p.position}</span>
                    <div className="flex-1 min-w-0 flex flex-col">
                      <span className="text-white font-black uppercase italic text-[10px] truncate">{nameWithInitial}</span>
                      <div className="w-full h-0.5 bg-black/40 rounded-full overflow-hidden mt-1 relative">
                          <div className="absolute inset-0 bg-red-900/30" style={{ left: `${100 - (p.fatigueDebt || 0)}%` }} />
                          <div className={`h-full ${conditionColor} transition-all duration-1000 relative z-10`} style={{ width: `${f}%` }} />
                      </div>
                    </div>
                  </div>
                  <div className="text-center font-black text-blue-400 text-xs">{liveRating}</div>
                  <div className="text-center text-xs">{goalsCount > 0 ? (goalsCount === 1 ? '⚽' : `⚽${goalsCount}`) : ''}</div>
                  <div className="text-center text-xs">{assistsCount > 0 ? (assistsCount === 1 ? '👟' : `👟${assistsCount}`) : ''}</div>
                </>
              ) : (
                <>
                  <div className="text-center text-xs">{assistsCount > 0 ? (assistsCount === 1 ? '👟' : `👟${assistsCount}`) : ''}</div>
                  <div className="text-center text-xs">{goalsCount > 0 ? (goalsCount === 1 ? '⚽' : `⚽${goalsCount}`) : ''}</div>
                  <div className="text-center font-black text-blue-400 text-xs">{liveRating}</div>
                  <div className="min-w-0 flex items-center gap-3 flex-row-reverse">
                    <span className={`w-8 font-mono font-black text-[9px] text-right ${PlayerPresentationService.getPositionColorClass(p.position)}`}>{p.position}</span>
                    <div className="flex-1 min-w-0 flex flex-col text-right">
                      <span className="text-white font-black uppercase italic text-[10px] truncate">{nameWithInitial}</span>
                      <div className="w-full h-0.5 bg-black/40 rounded-full overflow-hidden mt-1 relative">
                          <div className="absolute inset-0 bg-red-900/30" style={{ left: `${100 - (p.fatigueDebt || 0)}%` }} />
                          <div className={`h-full ${conditionColor} transition-all duration-1000 relative z-10`} style={{ width: `${f}%` }} />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
        {subsHistory.length > 0 && (
          <div className="mt-4 border-t border-white/5 pt-3 space-y-1.5">
            <h5 className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-2 px-2">ZMIANY</h5>
            {subsHistory.map((sub, sIdx) => {
              const p = players.find(px => px.id === sub.playerOutId);
              if (!p) return null;
              return (
                <div key={`sub-off-${p.id}-${sIdx}`} className={`flex items-center gap-3 py-1.5 px-3 rounded-xl bg-black/50 opacity-80 transition-all ${side === 'AWAY' ? 'flex-row-reverse text-right' : ''}`}>
                  <span className={`w-8 font-mono font-black text-[8px] text-slate-200 ${side === 'AWAY' ? 'text-right' : ''}`}>{p.position}</span>
                  <div className="flex-1 flex flex-col min-w-0">
                     <span className="text-red-100 grayscale-0 truncate font-bold uppercase italic tracking-tight text-[10px]">{p.firstName.charAt(0)}. ${p.lastName}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] font-black text-slate-600 italic">{sub.minute} min 🔄</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col p-6 gap-6 animate-fade-in overflow-hidden relative">
     {/* BACKGROUND (STADION) */}
<div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
  {/* obraz stadionu */}
  <div
    className="absolute inset-0 bg-cover bg-center"
    style={{ backgroundImage: "url('https://i.ibb.co/fdSSvHLz/stadion.jpg')" }}
  />

  {/* przyciemnienie żeby UI było czytelne */}
  <div className="absolute inset-0 bg-slate-950/85" />

  {/* opcjonalnie delikatny grid */}
  <div
    className="absolute inset-0 opacity-[0.04]"
    style={{
      backgroundImage:
        "linear-gradient(rgba(255,255,255,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.10) 1px, transparent 1px)",
      backgroundSize: "60px 60px",
    }}
  />
</div>
   {/* CONTENT (WSZYSTKO NAD TŁEM) */}
    <div className="relative z-10 flex flex-col gap-6">

      {activePenalty && (
        <div className="fixed inset-0 z-[500] bg-black/80 backdrop-blur-xl flex items-center justify-center p-10 animate-fade-in">
           <div className="max-w-4xl w-full bg-slate-900/60 border border-white/10 rounded-[50px] shadow-[0_50px_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col relative">
              
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-blue-500 to-transparent" />

              <div className="p-12 flex items-center justify-between gap-10">
                 <div className={`flex-1 flex flex-col items-center gap-6 transition-all duration-1000 ${activePenalty.phase === 'EXECUTING' ? 'scale-110' : ''}`}>
                    <BigJerseyIcon 
                      primary={activePenalty.side === 'HOME' ? kitColors.home.primary : kitColors.away.primary} 
                      secondary={activePenalty.side === 'HOME' ? kitColors.home.secondary : kitColors.away.secondary} 
                      size="w-32 h-32"
                    />
                    <div className="text-center">
                       <span className="block text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] mb-2">STRZELEC</span>
                       <h3 className="text-4xl font-black italic text-white uppercase tracking-tighter">{activePenalty.kicker.lastName}</h3>
                       <div className="mt-4 flex items-center justify-center gap-3">
                          <span className="text-slate-500 text-[9px] font-black uppercase">SKUTECZNOŚĆ:</span>
                          <span className="text-2xl font-black italic text-emerald-400 font-mono">{activePenalty.kicker.attributes.finishing}</span>
                       </div>
                    </div>
                 </div>

                 <div className="flex flex-col items-center gap-6">
                    {activePenalty.phase === 'AWARDED' && (
                      <div className="flex flex-col items-center animate-bounce">
                         <span className="text-7xl">👉</span>
                         <h2 className="text-5xl font-black italic text-white uppercase tracking-tighter mt-4 drop-shadow-[0_0_20px_rgba(255,255,255,0.3)] text-center">RZUT<br/>KARNY</h2>
                      </div>
                    )}
                    {activePenalty.phase === 'EXECUTING' && (
                      <div className="flex flex-col items-center">
                         <div className="w-20 h-20 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
                         <span className="text-xl font-black italic text-emerald-400 uppercase tracking-widest animate-pulse">STRZELA!</span>
                      </div>
                    )}
                    {activePenalty.phase === 'RESULT' && (
                      <div className="flex flex-col items-center animate-scale-up">
                         {activePenalty.result === MatchEventType.PENALTY_SCORED ? (
                            <><span className="text-9xl mb-4">⚽</span><h2 className="text-8xl font-black italic text-emerald-400 uppercase tracking-tighter drop-shadow-[0_0_50px_rgba(52,211,153,0.5)]">GOL!</h2></>
                         ) : (
                            <><span className="text-9xl mb-4">🧤</span><h2 className="text-7xl font-black italic text-red-500 uppercase tracking-tighter drop-shadow-[0_0_50px_rgba(239,68,68,0.5)]">NIE MA!</h2></>
                         )}
                      </div>
                    )}
                    <div className="text-8xl font-black italic text-white/5 select-none font-serif">czy</div>
                 </div>

                 <div className={`flex-1 flex flex-col items-center gap-6 transition-all duration-1000 ${activePenalty.phase === 'EXECUTING' ? 'scale-110' : ''}`}>
                    <BigJerseyIcon 
                      primary={activePenalty.side === 'HOME' ? kitColors.away.primary : kitColors.home.primary} 
                      secondary={activePenalty.side === 'HOME' ? kitColors.away.secondary : kitColors.home.secondary} 
                      size="w-32 h-32"
                    />
                    <div className="text-center">
                       <span className="block text-[10px] font-black text-red-500 uppercase tracking-[0.4em] mb-2">BRAMKARZ</span>
                       <h3 className="text-4xl font-black italic text-white uppercase tracking-tighter">{activePenalty.keeper.lastName}</h3>
                       <div className="mt-4 flex items-center justify-center gap-3">
                          <span className="text-slate-500 text-[9px] font-black uppercase">REFLEKS:</span>
                          <span className="text-2xl font-black italic text-blue-400 font-mono">{activePenalty.keeper.attributes.goalkeeping}</span>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {activeVAR && (
        <div className="fixed inset-0 z-[600] bg-black/80 backdrop-blur-xl flex items-center justify-center animate-fade-in">
          <div className="bg-slate-900/80 border border-white/10 rounded-[40px] p-12 flex flex-col items-center gap-6 shadow-[0_50px_100px_rgba(0,0,0,0.8)]">
            {activeVAR.phase === 'CHECKING' && (
              <>
                <div className="text-7xl animate-bounce">📺</div>
                <h2 className="text-5xl font-black italic text-white uppercase tracking-tighter">VAR</h2>
                <p className="text-xl font-bold text-slate-300 uppercase tracking-widest text-center">Sędzia biegnie do monitora</p>
                <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mt-2" />
              </>
            )}
            {activeVAR.phase === 'VERDICT' && activeVAR.verdict === 'GOAL' && (
              <>
                <div className="text-8xl">✅</div>
                <h2 className="text-6xl font-black italic text-emerald-400 uppercase tracking-tighter drop-shadow-[0_0_40px_rgba(52,211,153,0.6)]">BRAMKA!</h2>
                <p className="text-lg font-bold text-slate-300 uppercase tracking-widest">VAR: Gol uznany</p>
              </>
            )}
            {activeVAR.phase === 'VERDICT' && activeVAR.verdict === 'NO_GOAL' && (
              <>
                <div className="text-8xl animate-bounce">🚫</div>
                <h2 className="text-6xl font-black italic text-red-500 uppercase tracking-tighter drop-shadow-[0_0_40px_rgba(239,68,68,0.6)]">SPALONY!</h2>
                <p className="text-lg font-bold text-slate-300 uppercase tracking-widest">VAR: Bramka nieuznana</p>
              </>
            )}
          </div>
        </div>
      )}


      <header className="flex items-stretch justify-between h-36 bg-slate-900/60 rounded-[45px] overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.5)] border border-white/10 shrink-0">
         <div className="flex-1 flex flex-col justify-center px-12 relative overflow-hidden group">
            <div className="absolute inset-0 opacity-10" style={{ backgroundColor: kitColors.home.primary }} />

         
             <div className="absolute left-6 top-1/2 -translate-y-1/2 text-[10rem] font-black italic text-white/[0.04] select-none pointer-events-none uppercase tracking-tighter">
      {ctx.homeClub.shortName}
   </div>
            <div className="relative z-10 flex items-center gap-10">
               <BigJerseyIcon primary={kitColors.home.primary} secondary={kitColors.home.secondary} />
               <h1 className="text-6xl font-black italic uppercase tracking-tighter truncate leading-tight drop-shadow-2xl">{ctx.homeClub.name}</h1>
            </div>
            <div className="relative z-10 pl-24">{renderTicker('HOME')}</div>
         </div>
        <div className="w-72 flex flex-col items-center justify-center border-x border-white/5 relative overflow-hidden"
              style={{ background: `linear-gradient(180deg, ${kitColors.home.primary}33 0%, #0a0a0f 35%, #0a0a0f 65%, ${kitColors.away.primary}33 100%)` }}>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
            {isCelebratingGoal ? (
               <div className="absolute inset-0 flex flex-col items-center justify-center bg-yellow-500/20 animate-pulse-gold">
                  <span className="text-8xl font-black italic text-yellow-400 tracking-tighter drop-shadow-[0_0_30px_rgba(250,204,21,1)]">GOL!</span>
               </div>
            ) : (
               <><div className="text-8xl font-black text-white tracking-tighter leading-none mb-1">{matchState.homeScore} <span className="text-slate-700 mx-1">&nbsp;&nbsp;&nbsp;</span> {matchState.awayScore}</div>
                  <div className="flex items-center gap-3"><div className="text-xl font-mono font-bold text-emerald-400 animate-pulse bg-emerald-500/10 px-3 py-0.5 rounded-lg border border-emerald-500/20">{matchState.isFinished ? 'WYNIK KOŃCOWY' : `${matchState.minute}'`}</div>
                  {matchState.addedTime > 0 && !matchState.isFinished && <div className="text-[11px] font-black text-red-500 font-mono">+{matchState.addedTime}</div>}</div></>
            )}
         </div>
         <div className="flex-1 flex flex-col justify-center px-12 text-right relative overflow-hidden group">
            <div className="absolute inset-0 opacity-10" style={{ backgroundColor: kitColors.away.primary }} />
<div className="absolute right-6 top-1/2 -translate-y-1/2 text-[10rem] font-black italic text-white/[0.04] select-none pointer-events-none uppercase tracking-tighter">
      {ctx.awayClub.shortName}
   </div>

            <div className="relative z-10 flex items-center gap-10 justify-end">
               <h1 className="text-6xl font-black italic uppercase tracking-tighter truncate leading-tight drop-shadow-2xl">{ctx.awayClub.name}</h1>
               <BigJerseyIcon primary={kitColors.away.primary} secondary={kitColors.away.secondary} />

            </div>
            <div className="relative z-10 pr-24">{renderTicker('AWAY')}</div>
         </div>
      </header>

      <div className="flex-1 flex gap-8 min-h-0">
      <SquadList side="HOME" lineup={matchState.homeLineup.startingXI} players={ctx.homePlayers} fatigue={matchState.homeFatigue} injs={matchState.homeInjuries} subsHistory={matchState.homeSubsHistory} />
        <div className="flex-1 flex flex-col gap-6 min-w-0 max-w-5xl mx-auto">
           
           <div className={`h-6 w-full bg-black/40 rounded-full overflow-hidden border border-white/10 flex shadow-2xl shrink-0 p-0.5 backdrop-blur-xl relative transition-all duration-200
              ${Math.abs(matchState.momentum) > 85 ? 'animate-shake' : ''}
           `}>
              <div 
                className="h-full transition-all duration-300 flex items-center justify-end pr-4 text-[9px] font-black rounded-l-full shadow-[inset_-10px_0_20px_rgba(0,0,0,0.3)] relative" 
                style={{ 
                  backgroundColor: kitColors.home.primary, width: `${50 + matchState.momentum / 2}%`, color: kitColors.home.text,
                  boxShadow: matchState.momentum > 75 ? `0 0 25px ${kitColors.home.primary}CC` : 'none'
                }}
              >
                 <div className={`absolute inset-0 bg-white/20 opacity-0 ${Math.abs(matchState.momentum - (matchState.logs[0]?.type === MatchEventType.GOAL ? 40 : 0)) > 10 ? 'animate-ping' : ''}`} />
                 {Math.round(50 + matchState.momentum / 2)}%
              </div>
              <div className="h-full transition-all duration-300 flex items-center justify-start pl-4 text-[9px] font-black rounded-r-full shadow-[inset_10px_0_20px_rgba(0,0,0,0.3)]" 
                style={{ backgroundColor: kitColors.away.primary, flex: 1, color: kitColors.away.text,
                  boxShadow: matchState.momentum < -75 ? `0 0 25px ${kitColors.away.primary}CC` : 'none'
                }}
              >
                 {Math.round(50 - matchState.momentum / 2)}%
              </div>
           </div>




<div className="flex-1 relative p-2 overflow-visible">
  <div 
    className="w-full max-w-[475px] h-[420px] mx-auto bg-emerald-950/20 border-4 border-emerald-900/30 relative overflow-hidden"
    style={{
      aspectRatio: '105 / 68',
      transform: 'perspective(950px) rotateX(24deg) scale(1.19)',
      transformOrigin: 'top center',
      transformStyle: 'preserve-3d'
    }}
  >
    {/* Tło trawy */}
    <div 
      className="absolute inset-0 bg-[#064c2f] opacity-55"
      style={{ 
        backgroundImage: 'repeating-linear-gradient(to bottom, transparent, transparent 12%, rgba(255,255,255,0.015) 12%, rgba(255,255,255,0.015) 24%)' 
      }}
    />

    {/* Linie boiska */}
    <div className="absolute inset-0 pointer-events-none opacity-70">
      {/* Obwód boiska */}
      <div className="absolute top-4 left-4 right-4 bottom-4 border-2 border-white/70" />

      {/* Linia środkowa */}
      <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-white/70 -translate-y-1/2" />

      {/* Koło środkowe */}
      <div className="absolute top-1/2 left-1/2 w-28 h-28 border-2 border-white/70 rounded-full -translate-x-1/2 -translate-y-1/2" />

      {/* Punkt środkowy */}
      <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-white/70 rounded-full -translate-x-1/2 -translate-y-1/2" />

      {/* === GÓRNA CZĘŚĆ === */}
      
      {/* Górne pole karne (16.5m) */}
      <div className="absolute top-4 left-1/2 w-[50%] h-[20%] -translate-x-1/2">
        <div className="absolute top-0 left-0 w-0.5 h-full bg-white/70" />
        <div className="absolute top-0 right-0 w-0.5 h-full bg-white/70" />
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/70" />
      </div>

      {/* Górne pole bramkowe (5.5m) */}
      <div className="absolute top-4 left-1/2 w-[24%] h-[9%] -translate-x-1/2">
        <div className="absolute top-0 left-0 w-0.5 h-full bg-white/70" />
        <div className="absolute top-0 right-0 w-0.5 h-full bg-white/70" />
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/70" />
      </div>

      {/* Górne półkolo - poniżej pola bramkowego, na linii pola karnego */}
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

      {/* Górny punkt karny */}
      <div className="absolute left-1/2 w-2 h-2 bg-white/70 rounded-full -translate-x-1/2" style={{ top: 'calc(16px + 11% + 15px)' }} />

      {/* Górny łuk przy punkcie karnym */}
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

      {/* === DOLNA CZĘŚĆ === */}
      
      {/* Dolne pole karne (16.5m) */}
      <div className="absolute bottom-4 left-1/2 w-[50%] h-[20%] -translate-x-1/2">
        <div className="absolute bottom-0 left-0 w-0.5 h-full bg-white/70" />
        <div className="absolute bottom-0 right-0 w-0.5 h-full bg-white/70" />
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/70" />
      </div>

      {/* Dolne pole bramkowe (5.5m) */}
      <div className="absolute bottom-4 left-1/2 w-[24%] h-[9%] -translate-x-1/2">
        <div className="absolute bottom-0 left-0 w-0.5 h-full bg-white/70" />
        <div className="absolute bottom-0 right-0 w-0.5 h-full bg-white/70" />
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/70" />
      </div>

      {/* Dolne półkolo - powyżej pola bramkowego, na linii pola karnego */}
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

      {/* Dolny punkt karny */}
      <div className="absolute left-1/2 w-2 h-2 bg-white/70 rounded-full -translate-x-1/2" style={{ bottom: 'calc(16px + 11% + 15px)' }} />

      {/* Dolny łuk przy punkcie karnym */}
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

    {/* === NAROŻNIKI - ćwierćokrąg od punktu narożnego === */}
      {/* Lewy górny - łuk od rogu do środka */}
      <div 
        className="absolute w-5 h-5"
        style={{
          top: '14px',
          left: '14px',
          border: '2px solid rgba(255,255,255,0.7)',
          borderTop: 'none',
          borderLeft: 'none',
          borderRadius: '0 0 100% 0'
        }}
      />
      
      {/* Prawy górny - łuk od rogu do środka */}
      <div 
        className="absolute w-5 h-5"
        style={{
          top: '14px',
          right: '14px',
          border: '2px solid rgba(255,255,255,0.7)',
          borderTop: 'none',
          borderRight: 'none',
          borderRadius: '0 0 0 100%'
        }}
      />
      
      {/* Lewy dolny - łuk od rogu do środka */}
      <div 
        className="absolute w-5 h-5"
        style={{
          bottom: '14px',
          left: '14px',
          border: '2px solid rgba(255,255,255,0.7)',
          borderBottom: 'none',
          borderLeft: 'none',
          borderRadius: '0 100% 0 0'
        }}
      />
      
      {/* Prawy dolny - łuk od rogu do środka */}
      <div 
        className="absolute w-5 h-5"
        style={{
          bottom: '14px',
          right: '14px',
          border: '2px solid rgba(255,255,255,0.7)',
          borderBottom: 'none',
          borderRight: 'none',
          borderRadius: '100% 0 0 0'
        }}
      />

      {/* === BRAMKI (wizualizacja linii bramkowych) === */}
      {/* Górna bramka */}
      <div className="absolute top-4 left-1/2 w-[10%] h-1 bg-white/70 -translate-x-1/2" />
      
      {/* Dolna bramka */}
      <div className="absolute bottom-4 left-1/2 w-[10%] h-1 bg-white/70 -translate-x-1/2" />



   
    </div>


    {/* Ikony DOMOWI – mniejsze, lepiej rozłożone */}
    {TacticRepository.getById(matchState.homeLineup.tacticId).slots.map((slot, i) => {
      const pId = matchState.homeLineup.startingXI[i];
      if (!pId) return null;
      const p = ctx.homePlayers.find(px => px.id === pId);
      if (!p || matchState.sentOffIds.includes(p.id)) return null;
      const injury = matchState.homeInjuries[pId];
const hasScored = matchState.homeGoals.some(g => g.playerName === p.lastName && !g.isMiss);
      return (
        <div
  key={`h-${p.id}`}
  onClick={() => handleOpenPlayerCard(p.id)}
  className="absolute flex flex-col items-center z-20 transition-all duration-1000 cursor-pointer"
  style={{
    left: `${slot.x * 100}%`,
    top: `${(slot.y * 0.42 + 0.54) * 100}%`,

    transform: 'translate(-50%, -50%) rotateX(-24deg) scale(1.15)'
  }}
        >
          <div className="relative group/player">
            <div
              className={`w-5 h-5 rounded-2xl border-2 border-white/50 shadow-2xl flex flex-col overflow-hidden transform -rotate-3 transition-transform group-hover/player:rotate-0 group-hover/player:scale-110 ${injury === InjurySeverity.SEVERE ? 'grayscale opacity-50' : ''}`}
              style={{ backgroundColor: kitColors.home.primary }}
            >
              <div className="flex-1 flex items-center justify-center text-[8px] font-black" style={{ color: kitColors.home.text }}>
                {p.overallRating}
              </div>
            </div>
            {matchState.playerYellowCards[p.id] > 0 && <div className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-yellow-400 border-2 border-slate-900 rounded-md shadow-lg" />}

 {hasScored && (
              <div className="absolute -top-2 -left-2 w-4 h-4 bg-white rounded-full flex items-center justify-center text-[8px] shadow-lg border border-black z-30">
                ⚽
              </div>
            )}

            {injury && <div className={`absolute -bottom-1.5 -right-1.5 w-4 h-4 rounded-full border-2 border-slate-900 flex items-center justify-center text-[8px] shadow-lg ${injury === InjurySeverity.SEVERE ? 'bg-red-600 animate-bounce' : 'bg-slate-600 animate-pulse'}`}>✚</div>}
          </div>
         <div 
  className={`bg-slate-950/50 backdrop-blur-md px-1.5 py-0.5 rounded-full text-[7px] font-black mt-0 border border-white/10 whitespace-nowrap shadow-2xl italic tracking-tighter ${injury ? 'text-red-400' : 'text-white'}`}
  style={{ transform: 'rotateX(-24deg) scale(1.15)' }}
>
  {p.lastName}
          </div>
        </div>
      );
    })}

{/* Ikony GOŚCIE – symetrycznie */}
{TacticRepository.getById(matchState.awayLineup.tacticId).slots.map((slot, i) => {
  const pId = matchState.awayLineup.startingXI[i];
  if (!pId) return null;
  const p = ctx.awayPlayers.find(px => px.id === pId);
  if (!p || matchState.sentOffIds.includes(p.id)) return null;
  const injury = matchState.awayInjuries[pId];
 const hasScored = matchState.awayGoals.some(g => g.playerName === p.lastName && !g.isMiss);
  return (
    <div
      key={`a-${p.id}`}
      onClick={() => handleOpenPlayerCard(p.id)}
      className="absolute flex flex-col items-center z-20 transition-all duration-1000 cursor-pointer"
      style={{
        left: `${slot.x * 100}%`,
        top: `${(0.48 - slot.y * 0.42) * 100}%`,
        transform: 'translate(-50%, -50%) rotateX(-24deg) scale(1.4)'
      }}
    >
      <div className="relative group/player">
        <div
          className={`w-5 h-5 rounded-2xl border-2 border-white/50 shadow-2xl flex flex-col overflow-hidden transform rotate-3 transition-transform group-hover/player:rotate-0 group-hover/player:scale-110 ${injury === InjurySeverity.SEVERE ? 'grayscale opacity-50' : ''}`}
          style={{ backgroundColor: kitColors.away.primary }}
        >
          <div className="flex-1 flex items-center justify-center text-[7px] font-black" style={{ color: kitColors.away.text }}>
            {p.overallRating}
          </div>
        </div>
        {matchState.playerYellowCards[p.id] > 0 && <div className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-yellow-400 border-2 border-slate-900 rounded-md shadow-lg" />}

 {hasScored && (
          <div className="absolute -top-2 -right-2 w-4 h-4 bg-white rounded-full flex items-center justify-center text-[8px] shadow-lg border border-black z-30">
            ⚽
          </div>
        )}

        {injury && <div className={`absolute -bottom-1.5 -left-1.5 w-4 h-4 rounded-full border-2 border-slate-900 flex items-center justify-center text-[8px] shadow-lg ${injury === InjurySeverity.SEVERE ? 'bg-red-600 animate-bounce' : 'bg-slate-600 animate-pulse'}`}>✚</div>}
      </div>
      <div className={`bg-slate-950/50 backdrop-blur-md px-1.5 py-0.5 rounded-full text-[8px] font-black mt-1 border border-white/10 whitespace-nowrap shadow-2xl italic tracking-tighter ${injury ? 'text-red-400' : 'text-white'}`}>
        {p.lastName}
      </div>
    </div>
  );
})}
  </div>
</div>
              
                              <div className={`fixed bottom-[29px] left-1/2 -translate-x-1/2 z-[1100] flex flex-col items-center gap-2 max-w-5xl transition-opacity duration-200 ${isTacticsOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
  {matchState.isFinished ? (
    <div className="flex gap-3 justify-center py-3 px-8 bg-white/5 border border-white/10 rounded-[28px] shadow-2xl">
      <button
        onClick={() => setShowCommentHistory(!showCommentHistory)}
        className="min-w-[60px] py-3 px-6 rounded-xl bg-white/5 border border-white/10 text-slate-300 font-black italic uppercase tracking-widest text-xs hover:bg-white/10 hover:text-white transition-all hover:scale-105 active:scale-95 shadow-xl flex items-center justify-center gap-2"
      >
        PRZEBIEG MECZU
      </button>
      <button
        onClick={handleFinishMatch}
        className="min-w-[160px] py-3 px-10 rounded-2xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 font-black italic uppercase tracking-tighter text-base transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(16,185,129,0.2)] hover:bg-emerald-600/30 flex items-center justify-center gap-3 group"
      >
        <span>STUDIO POMECZOWE</span>
        <span className="text-xl group-hover:translate-x-2 transition-transform">→</span>
      </button>
    </div>
  ) : (
    <>
      {/* ── GÓRNY BOX: Tempo / Postawa / Styl gry ── */}
      <div className="flex gap-5 justify-center py-2.5 px-8 bg-white/5 border border-white/10 rounded-[22px] shadow-xl">
      {/* ── TEMPO ── */}
      {(() => {
        const cd = matchState.userInstructions.tempoCooldown;
        const locked = cd > 0 && matchState.minute < cd;
        const remaining = locked ? cd - matchState.minute : 0;
        const cur = matchState.userInstructions.tempo;
        const pick = (val: InstructionTempo) => setMatchState(s => {
          if (!s) return s;
          const c = s.userInstructions.tempoCooldown;
          if (c > 0 && s.minute < c) return s;
          if (s.userInstructions.tempo === val) return s;
          const expiry = val === 'NORMAL' ? -1 : s.minute + 7 + Math.floor(Math.random() * 6);
          return { ...s, userInstructions: { ...s.userInstructions, tempo: val, tempoExpiry: expiry, tempoCooldown: s.minute + 5 } };
        });
        return (
          <div className={`flex flex-col items-center gap-1 ${locked ? 'opacity-40 pointer-events-none' : ''}`}>
            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold">
              {locked ? `Tempo – blokada ${remaining}'` : 'Tempo'}
            </span>
            <div className="flex rounded-lg overflow-hidden border border-white/15 shadow-lg">
              {([
                { val: 'SLOW' as InstructionTempo,   label: 'Wolno',     activeClass: 'bg-blue-600/50 text-blue-200 border-blue-500/50' },
                { val: 'NORMAL' as InstructionTempo, label: 'Normalnie', activeClass: 'bg-white/20 text-white border-white/20' },
                { val: 'FAST' as InstructionTempo,   label: 'Szybko',    activeClass: 'bg-orange-600/50 text-orange-200 border-orange-500/50' },
              ] as { val: InstructionTempo; label: string; activeClass: string }[]).map(({ val, label, activeClass }) => (
                <button
                  key={val}
                  onClick={() => pick(val)}
                  disabled={locked}
                  className={`px-3 py-2 text-[10px] font-bold uppercase tracking-wide transition-colors border-r last:border-r-0 border-white/10 ${
                    cur === val ? activeClass : 'bg-white/5 text-slate-500 hover:text-slate-200 hover:bg-white/10'
                  }`}
                >{label}</button>
              ))}
            </div>
          </div>
        );
      })()}

      {/* ── POSTAWA ── */}
      {(() => {
        const cd = matchState.userInstructions.mindsetCooldown;
        const locked = cd > 0 && matchState.minute < cd;
        const remaining = locked ? cd - matchState.minute : 0;
        const cur = matchState.userInstructions.mindset;
        const pick = (val: InstructionMindset) => setMatchState(s => {
          if (!s) return s;
          const c = s.userInstructions.mindsetCooldown;
          if (c > 0 && s.minute < c) return s;
          if (s.userInstructions.mindset === val) return s;
          const expiry = val === 'NEUTRAL' ? -1 : s.minute + 7 + Math.floor(Math.random() * 6);
          return { ...s, userInstructions: { ...s.userInstructions, mindset: val, mindsetExpiry: expiry, mindsetCooldown: s.minute + 5 } };
        });
        return (
          <div className={`flex flex-col items-center gap-1 ${locked ? 'opacity-40 pointer-events-none' : ''}`}>
            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold">
              {locked ? `Postawa – blokada ${remaining}'` : 'Postawa'}
            </span>
            <div className="flex rounded-lg overflow-hidden border border-white/15 shadow-lg">
              {([
                { val: 'DEFENSIVE' as InstructionMindset, label: 'Defensywna', activeClass: 'bg-emerald-600/50 text-emerald-200 border-emerald-500/50' },
                { val: 'NEUTRAL' as InstructionMindset,   label: 'Neutralna',  activeClass: 'bg-white/20 text-white border-white/20' },
                { val: 'OFFENSIVE' as InstructionMindset, label: 'Ofensywna',  activeClass: 'bg-red-600/50 text-red-200 border-red-500/50' },
              ] as { val: InstructionMindset; label: string; activeClass: string }[]).map(({ val, label, activeClass }) => (
                <button
                  key={val}
                  onClick={() => pick(val)}
                  disabled={locked}
                  className={`px-3 py-2 text-[10px] font-bold uppercase tracking-wide transition-colors border-r last:border-r-0 border-white/10 ${
                    cur === val ? activeClass : 'bg-white/5 text-slate-500 hover:text-slate-200 hover:bg-white/10'
                  }`}
                >{label}</button>
              ))}
            </div>
          </div>
        );
      })()}

      {/* ── STYL GRY ── */}
      {(() => {
        const cd = matchState.userInstructions.intensityCooldown;
        const locked = cd > 0 && matchState.minute < cd;
        const remaining = locked ? cd - matchState.minute : 0;
        const cur = matchState.userInstructions.intensity;
        const pick = (val: InstructionIntensity) => setMatchState(s => {
          if (!s) return s;
          const c = s.userInstructions.intensityCooldown;
          if (c > 0 && s.minute < c) return s;
          if (s.userInstructions.intensity === val) return s;
          const expiry = val === 'NORMAL' ? -1 : s.minute + 7 + Math.floor(Math.random() * 6);
          return { ...s, userInstructions: { ...s.userInstructions, intensity: val, intensityExpiry: expiry, intensityCooldown: s.minute + 5 } };
        });
        return (
          <div className={`flex flex-col items-center gap-1 ${locked ? 'opacity-40 pointer-events-none' : ''}`}>
            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold">
              {locked ? `Styl gry – blokada ${remaining}'` : 'Styl gry'}
            </span>
            <div className="flex rounded-lg overflow-hidden border border-white/15 shadow-lg">
              {([
                { val: 'CAUTIOUS' as InstructionIntensity,   label: 'Ostrożnie',  activeClass: 'bg-teal-600/50 text-teal-200 border-teal-500/50' },
                { val: 'NORMAL' as InstructionIntensity,     label: 'Normalnie',  activeClass: 'bg-white/20 text-white border-white/20' },
                { val: 'AGGRESSIVE' as InstructionIntensity, label: 'Agresywnie', activeClass: 'bg-red-600/50 text-red-200 border-red-500/50' },
              ] as { val: InstructionIntensity; label: string; activeClass: string }[]).map(({ val, label, activeClass }) => (
                <button
                  key={val}
                  onClick={() => pick(val)}
                  disabled={locked}
                  className={`px-3 py-2 text-[10px] font-bold uppercase tracking-wide transition-colors border-r last:border-r-0 border-white/10 ${
                    cur === val ? activeClass : 'bg-white/5 text-slate-500 hover:text-slate-200 hover:bg-white/10'
                  }`}
                >{label}</button>
              ))}
            </div>
          </div>
        );
      })()}
      </div>

      {/* ── DOLNY BOX: Start / Taktyka / Prędkość / Przebieg ── */}
      <div className="flex gap-3 justify-center py-3 px-8 bg-white/5 border border-white/10 rounded-[28px] shadow-2xl">
        <button
          disabled={hasMandatorySub}
          onClick={() => matchState.isHalfTime ? setMatchState(s => s ? {...s, isHalfTime: false, isPaused: false, period: 2, minute: 45, addedTime: 0} : s) : setMatchState(s => s ? {...s, isPaused: !s.isPaused, isPausedForEvent: false, flashMessage: null} : s)}
          className={`min-w-[170px] py-3 px-7 rounded-xl font-black italic uppercase tracking-widest text-sm transition-all hover:scale-105 active:scale-95 shadow-2xl border
            ${hasMandatorySub
              ? 'bg-red-600/20 border-red-500/40 text-red-500 hover:bg-red-600/30 shadow-red-500/10'
              : matchState.isPaused || matchState.isHalfTime
                ? 'bg-blue-600/20 border-blue-500/40 text-blue-400 hover:bg-blue-600/30 shadow-blue-500/10'
                : 'bg-white/5 border-white/20 text-white hover:bg-white/10 shadow-white/5'
            }
          `}
        >
          {getActionLabel()}
        </button>

        <button
          onClick={() => { setIsTacticsOpen(true); setMatchState(s => s ? {...s, isPaused: true} : s); }}
          className="min-w-[110px] py-3 px-6 rounded-xl bg-white/5 border border-white/10 text-slate-300 font-black italic uppercase tracking-widest text-xs hover:bg-white/10 hover:text-white transition-all hover:scale-105 active:scale-95 shadow-xl flex items-center justify-center gap-2"
        >
          ⚙ TAKTYKA
        </button>

        <button
          onClick={() => setMatchState(s => {
            if (!s) return s;
            const next = s.speed === 1 ? 2.5 : s.speed === 2.5 ? 3.5 : s.speed === 3.5 ? 5 : 1;
            return { ...s, speed: next };
          })}
          className="min-w-[90px] py-3 px-5 rounded-xl bg-white/5 border border-white/10 text-slate-400 font-black italic uppercase tracking-widest text-xs hover:bg-white/10 hover:text-white transition-all hover:scale-105 active:scale-95 shadow-xl flex items-center justify-center gap-2"
        >
          {matchState.speed === 5 ? '⏩ x5' : matchState.speed === 3.5 ? '⏩ x3.5' : matchState.speed === 2.5 ? '⏩ x2.5' : '⏪ x1'}
        </button>

        <button
          onClick={() => setShowCommentHistory(!showCommentHistory)}
          className="min-w-[60px] py-3 px-6 rounded-xl bg-white/5 border border-white/10 text-slate-300 font-black italic uppercase tracking-widest text-xs hover:bg-white/10 hover:text-white transition-all hover:scale-105 active:scale-95 shadow-xl flex items-center justify-center gap-2"
        >
          PRZEBIEG MECZU
        </button>
      </div>
    </>
  )}


</div>


        </div>

       <SquadList side="AWAY" lineup={matchState.awayLineup.startingXI} players={ctx.awayPlayers} fatigue={matchState.awayFatigue} injs={matchState.awayInjuries} subsHistory={matchState.awaySubsHistory} />
      </div>

    {matchState.logs.length > 0 && (
          
      <div className="fixed left-1/2 -translate-x-1/2 z-30 flex justify-center" style={{ bottom: 'calc(15rem - 55px)' }}>
        {(() => {
          const latestLog = matchState.logs[0];
          const isHome = latestLog.teamSide === 'HOME';
          const bgColor = isHome ? kitColors!.home.primary : kitColors!.away.primary;
          const textColor = getContrastColor(bgColor);
          
          return (
            <div 
              className="px-8 py-5 rounded-[11px] shadow-2xl border border-white/20 backdrop-blur-md max-w-7xl"
              style={{ backgroundColor: bgColor }}
            >
              <span 
                className="text-lg font-black italic uppercase tracking-tight"
                style={{ color: textColor }}
              >
                {latestLog.text}
              </span>
            </div>
          );
        })()}
      </div>
    )}


      {isTacticsOpen && (
        <div className="fixed inset-0 z-[990] backdrop-blur-md bg-black/40 pointer-events-none" />
      )}

      <MatchTacticsModal isOpen={isTacticsOpen} onClose={handleTacticsClose} club={userSide === 'HOME' ? ctx.homeClub : ctx.awayClub} lineup={userSide === 'HOME' ? matchState.homeLineup : matchState.awayLineup} players={userSide === 'HOME' ? ctx.homePlayers : ctx.awayPlayers} fatigue={userSide === 'HOME' ? matchState.homeFatigue : matchState.awayFatigue} subsCount={userSide === 'HOME' ? matchState.subsCountHome : matchState.subsCountAway} subsHistory={userSide === 'HOME' ? matchState.homeSubsHistory : matchState.awaySubsHistory} minute={matchState.minute} sentOffIds={matchState.sentOffIds} injs={userSide === 'HOME' ? matchState.homeInjuries : matchState.awayInjuries} />
      <style>{`
        @keyframes shine { from { left: -150%; } to { left: 150%; } }
        .animate-shine { animation: shine 3s infinite linear; }
        @keyframes pulse-gold { 0%, 100% { transform: scale(1); filter: brightness(1.2); } 50% { transform: scale(1.1); filter: brightness(1.8); } }
        .animate-pulse-gold { animation: pulse-gold 0.6s infinite ease-in-out; }
        @keyframes shake { 0%, 100% { transform: translate(0, 0); } 25% { transform: translate(2px, 2px); } 50% { transform: translate(-2px, -2px); } 75% { transform: translate(2px, -2px); } }
        .animate-shake { animation: shake 0.15s infinite linear; }
        @keyframes scale-up { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-scale-up { animation: scale-up 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        @keyframes slide-up { from { transform: translateY(15px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-slide-up { animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>

      {showCommentHistory && (
      <div className="fixed right-0 top-0 bottom-0 w-96 bg-slate-900/95 border-l border-white/10  z-[400] overflow-y-auto p-4 space-y-2">
        <div className="sticky top-0 bg-slate-900/95 p-2 mb-4 flex justify-between items-center">
          <h3 className="text-white font-black uppercase tracking-widest text-sm">HISTORIA</h3>
          <button 
            onClick={() => setShowCommentHistory(false)} 
            className="text-white text-2xl hover:text-slate-300 transition-colors"
          >
            ×
          </button>
        </div>
        
        {matchState.logs.map((log) => (
          <div key={log.id} className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-200 hover:bg-white/10 transition-colors">
            <span className="font-black text-blue-400">{log.minute}'</span> - {log.text}
          </div>
        ))}
      </div>
    )}

///Etykieta przerwa w meczu ///
     {matchState.isHalfTime && !isTacticsOpen && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none" style={{ transform: 'rotateX(-24deg)' }}>
        <div className="bg-slate-950/90 backdrop-blur-2xl border-y-4 border-rose-500 px-16 py-8 rounded-[40px] shadow-[0_0_100px_rgba(225,29,72,0.4)] animate-pulse">
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-black text-rose-500 tracking-[0.5em] mb-2">PIŁKARZE SCHODZĄ DO SZATNI</span>
            <span className="text-6xl font-black italic text-white uppercase tracking-[0.2em] drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">PRZERWA</span>
          </div>
        </div>
      </div>
    )}

 {/* Etykieta Kontuzji */}
    {isPausedForSevereInjury && !isTacticsOpen &&(
      <div className="absolute inset-0 z-[999] flex items-center justify-center pointer-events-none" style={{ transform: 'rotateX(-24deg)' }}>
        <div className="bg-slate-950/90 backdrop-blur-2xl border-y-4 border-red-600 px-16 py-8 rounded-[40px] shadow-[0_0_100px_rgba(220,38,38,0.5)] animate-pulse">
          <div className="flex flex-col items-center gap-4">
            <div className="text-7xl filter drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]">➕</div>
            <div className="text-center">
              <span className="text-[10px] font-black text-red-500 tracking-[0.5em] mb-2 uppercase block">Zawodnik leży na murawie</span>
              <h2 className="text-4xl font-black italic text-white uppercase tracking-tight drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                PRZERWA MEDYCZNA<br/>
                <span className="text-2xl text-red-500 font-bold not-italic">KONTUZJA</span>
              </h2>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Etykieta Końca Meczu */}
    {matchState.isFinished && (
      <div className="absolute inset-0 z-[999] flex items-center justify-center pointer-events-none" style={{ transform: 'rotateX(-24deg)' }}>
        <div className="bg-slate-950/90 backdrop-blur-2xl border-y-4 border-emerald-500 px-20 py-12 rounded-[50px] shadow-[0_0_120px_rgba(34,197,94,0.6)] animate-pulse">
          <div className="flex flex-col items-center gap-4">
            <span className="text-sm font-black text-emerald-400 tracking-[0.6em] uppercase"> KONIEC SPOTKANIA</span>
            <span className="text-7xl font-black italic text-white uppercase tracking-wider drop-shadow-[0_0_30px_rgba(255,255,255,0.5)]">
              
            </span>
            <span className="text-4xl font-bold text-emerald-300 mt-2">
              TRANSMISJA ZAKOŃCZONA
            </span>
          </div>
        </div>
      </div>
    )}




  </div>
  );
};
   