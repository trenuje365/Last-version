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
import { AiScoutingService } from '../services/AiScoutingService';
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
  injuriesMap: Record<string, InjurySeverity> = {},
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
        // defensywa / GK → strata ~60% (napastnik w bramce = panika)
        integrityMult = 0.35 + Math.random() * 0.10;
    } else {
        // pomoc / atak → strata ~24% (dezorganizacja taktyczna)
        integrityMult = 0.72 + Math.random() * 0.10;
    }
}


const startersCount = lineup.filter(id => id !== null).length;
  
  // TUTAJ ZASTĄP TEN KOD (ASYMETRYCZNA KARA ZA CZERWONĄ KARTKĘ)
  // Atak cierpi mocno (0.15 na gracza), ale obrona mniej (0.05 na gracza) - symulacja "parkowania autobusu"
  const isAttack = positions.includes(PlayerPosition.FWD);
  const penaltyPerPlayer = isAttack ? 0.10 : 0.04;
  const numericalPenalty = Math.max(0.78, 1 - (11 - startersCount) * penaltyPerPlayer);
  // KONIEC POPRAWKI

  // Ogólne zaburzenie składu: GK na polu + brak obrońców redukują moc drużyny
  const gksOnFieldCount = teamPlayers.filter(p =>
    lineup.slice(1).filter(id => id !== null).includes(p.id) && p.position === PlayerPosition.GK
  ).length;
  const defLineupCount = teamPlayers.filter(p =>
    lineup.filter(id => id !== null).includes(p.id) && p.position === PlayerPosition.DEF
  ).length;
  const generalDisorderMult = Math.max(0.55, 1
    - gksOnFieldCount * 0.09
    - Math.max(0, 2 - defLineupCount) * 0.08);

  return activePlayers.reduce((sum, p) => {
    const pFatigue = fatigueMap[p.id] ?? p.condition;
    // Kondycja wpływa na statystyki: 100% kondycji = 100% mocy, 50% = 61% mocy, 0% = 22% mocy
    // Szerszy zakres 0.12–0.55 sprawia, że kontuzje i zmęczenie mają realne znaczenie
const fatigueMult = 0.12 + (pFatigue / 100) * 0.43; // Zakres: 0.12 (cond=0) → 0.55 (cond=100)
    const avgAttr = attrKeys.reduce((s, attr) => s + (p.attributes[attr] || 50), 0) / attrKeys.length;
    
    // ZMIANA PRO: Potencjał nieliniowy. Każdy punkt atrybutu powyżej 50 ma coraz większą wagę.
    // 1.15 zamiast 1.35 — łagodniejsza krzywa, niższe Tiery mają realne szanse na akcje
    const powerBase = Math.pow(avgAttr, 1.07); 
    // Lekka kontuzja: gracz gra przez ból — bezpośrednia kara -6% wkładu w moc drużyny
    const lightInjMult = injuriesMap[p.id] === InjurySeverity.LIGHT ? 0.94 : 1.0;
    
    return sum + (powerBase * fatigueMult * weatherMod * integrityMult * numericalPenalty * generalDisorderMult * lightInjMult);
  }, 0);
};

// Macierz kar za granie poza pozycją: [rzeczywista pozycja][oczekiwana rola slotu]
// Wartość = disorder dodany za każdy taki mismatch
const POSITION_MISMATCH_PENALTY: Record<PlayerPosition, Record<PlayerPosition, number>> = {
  [PlayerPosition.GK]:  { [PlayerPosition.GK]: 0.00, [PlayerPosition.DEF]: 0.10, [PlayerPosition.MID]: 0.12, [PlayerPosition.FWD]: 0.12 },
  [PlayerPosition.DEF]: { [PlayerPosition.GK]: 0.22, [PlayerPosition.DEF]: 0.00, [PlayerPosition.MID]: 0.05, [PlayerPosition.FWD]: 0.08 },
  [PlayerPosition.MID]: { [PlayerPosition.GK]: 0.22, [PlayerPosition.DEF]: 0.05, [PlayerPosition.MID]: 0.00, [PlayerPosition.FWD]: 0.04 },
  [PlayerPosition.FWD]: { [PlayerPosition.GK]: 0.25, [PlayerPosition.DEF]: 0.08, [PlayerPosition.MID]: 0.05, [PlayerPosition.FWD]: 0.00 },
};

const getPositionalDisorder = (
  lineup: (string | null)[],
  players: Player[],
  tacticId: string
): number => {
  const tactic = TacticRepository.getById(tacticId);
  if (!tactic || tactic.slots.length === 0) return 0;

  let disorder = 0;

  lineup.forEach((playerId, slotIndex) => {
    if (!playerId) return; // pusty slot (czerwona kartka) — brak kary, zawodnika nie ma
    const player = players.find(p => p.id === playerId);
    if (!player) return;
    const slot = tactic.slots[slotIndex];
    if (!slot) return; // slot poza definicją taktyki

    const expectedRole = slot.role;
    const actualPos = player.position;
    disorder += POSITION_MISMATCH_PENALTY[actualPos][expectedRole];
  });

  // Normalizacja: max disorder = 11 zawodników × maks kara 0.25 = 2.75 → cappujemy do 0.70
  // Dzielnik 4 zamiast 5: ten sam skład daje 25% silniejszy sygnał zaburzeń
  return Math.min(0.70, disorder / 4);
};



export const MatchLiveViewPolishCupSimulation: React.FC = () => {
  const { 
    navigateTo, userTeamId, clubs, fixtures, players, 
    lineups, currentDate, setLastMatchSummary, applySimulationResult, viewPlayerDetails, setMessages,
    activeMatchState: matchState, setActiveMatchState: setMatchState,coaches, seasonNumber 
  } = useGame();
  
  const [isFinishing, setIsFinishing] = useState(false);
  const [isCelebratingGoal, setIsCelebratingGoal] = useState(false);
  const [isUserPaused, setIsUserPaused] = useState(false);
  const [isTacticsOpen, setIsTacticsOpen] = useState(false);
  const [penaltyNotice, setPenaltyNotice] = useState<string | null>(null);
  const [redCardNotice, setRedCardNotice] = useState<string | null>(null);
  const [isCommentaryOpen, setIsCommentaryOpen] = useState(false);
  const [instructionCooldowns, setInstructionCooldowns] = useState<Record<string, number>>({});
   const [showMissedPenalty, setShowMissedPenalty] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const debugLogRef = useRef<string[]>([]);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [debugDisplayData, setDebugDisplayData] = useState<{
    minute: number; side: 'HOME' | 'AWAY'; shotPower: number; savePower: number;
    goalProbability: number; goalRoll: number; isGoal: boolean; luckyBonus: number;
    homeThreshold: number; awayThreshold: number; dynamicThreshold: number;
    successPasses: number; diceRolls: number; pPower: number; aPower: number;
  }[]>([]);
  const liveDebugStatsRef = useRef<{
    minute: number; side: 'HOME' | 'AWAY'; shotPower: number; savePower: number;
    goalProbability: number; goalRoll: number; isGoal: boolean; luckyBonus: number;
    homeThreshold: number; awayThreshold: number; dynamicThreshold: number;
    successPasses: number; diceRolls: number; pPower: number; aPower: number;
  }[]>([]);

  const downloadDebugLog = () => {
    const content = debugLogRef.current.join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug_cup_match_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (!showDebugPanel) return;
    const interval = setInterval(() => {
      setDebugDisplayData([...liveDebugStatsRef.current]);
    }, 600);
    return () => clearInterval(interval);
  }, [showDebugPanel]);
 

// NOWY SYSTEM KOMENTARZY
  const [pitchCommentary, setPitchCommentary] = useState<{
    text: string;
    side: 'HOME' | 'AWAY' | null;
  } | null>(null);

const penaltyPendingRef = useRef<null | { side: 'HOME' | 'AWAY', scorer: any, minute: number }>(null);

  const ctx = useMemo(() => {
    const fixture = fixtures.find(f => 
        (f.homeTeamId === userTeamId || f.awayTeamId === userTeamId) &&
        f.date.toDateString() === currentDate.toDateString()
    );
    if (!fixture) return null;
    const home = clubs.find(c => c.id === fixture.homeTeamId)!;
    const away = clubs.find(c => c.id === fixture.awayTeamId)!;
    return {
      fixture, homeClub: home, awayClub: away, homePlayers: players[home.id] || [], awayPlayers: players[away.id] || [], homeAdvantage: 0.0015, competition: 'CUP'
    } as any;
  }, [userTeamId, clubs, fixtures, players, currentDate]);

  const userSide = useMemo(() => {
    if (!ctx || !userTeamId) return 'HOME';
    return ctx.homeClub.id === userTeamId ? 'HOME' : 'AWAY';
  }, [ctx, userTeamId]);

  const kitColors = useMemo(() => ctx ? KitSelectionService.selectOptimalKits(ctx.homeClub, ctx.awayClub) : null, [ctx]);

  // Raport zwiadowczy AI — generowany raz przed meczem na podstawie atrybutu experience trenera AI.
  // Wpływa na decyzje taktyczne AI w pierwszych ~25 minutach meczu.
  const aiScoutReport = useMemo(() => {
    if (!ctx || !userTeamId) return undefined;
    const aiClub = ctx.homeClub.id === userTeamId ? ctx.awayClub : ctx.homeClub;
    const playerClub = ctx.homeClub.id === userTeamId ? ctx.homeClub : ctx.awayClub;
    const playerPlayersArr = ctx.homeClub.id === userTeamId ? ctx.homePlayers : ctx.awayPlayers;
    const playerLineupForScout = lineups[playerClub.id];
    if (!playerLineupForScout) return undefined;
    const aiCoachObj = coaches[aiClub.coachId || ''];
    const coachExp = aiCoachObj?.attributes.experience ?? 50;
    return AiScoutingService.generateReport(playerClub, playerPlayersArr, playerLineupForScout, coachExp);
  }, [ctx, coaches, lineups, userTeamId]);
  


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
        homeFatigue: {}, awayFatigue: {}, homeInjuries: {}, awayInjuries: {}, playerYellowCards: {}, sentOffIds: [], homeRiskMode: {}, awayRiskMode: {},
        homeUpgradeProb: {}, awayUpgradeProb: {}, homeInjuryMin: {}, awayInjuryMin: {}, subsCountHome: 0, subsCountAway: 0, homeSubsHistory: [], awaySubsHistory: [],
        lastAiActionMinute: 0, logs: [{ id: 'cup_init', minute: 0, text: "Gwizdek sędziego! Zaczynamy bój o awans!", type: MatchEventType.GENERIC }],
homeGoals: [], awayGoals: [], sessionSeed: Date.now(),
        isExtraTime: false, isPenalties: false, homePenaltyScore: undefined, awayPenaltyScore: undefined, penaltySequence: [],
        liveStats: {
          home: { shots: 0, shotsOnTarget: 0, corners: 0, fouls: 0, offsides: 0 },
          away: { shots: 0, shotsOnTarget: 0, corners: 0, fouls: 0, offsides: 0 }
        },
        momentumSum: 0,
        momentumTicks: 0,
        playedPlayerIds: [],
        events: [],
        flashMessage: null,
        tacticalImpact: 0,
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
        activeTacticalBoost: 0,
        tacticalBoostExpiry: 0,
        // Post-goal suppression state — inicjalizacja
        postGoalSuppressionDuration: 4,
        postGoalPenaltyPct: 0.10,
        comebackPower: 0,
        comebackExpiry: 0,
        comebackSide: null,
        userInstructions: {
tempo: 'NORMAL',
mindset: 'NEUTRAL',
intensity: 'NORMAL',
lastChangeMinute: -5,
expiryMinute: 0,
tempoExpiry: -1,
mindsetExpiry: -1,
intensityExpiry: -1,
tempoCooldown: -1,
mindsetCooldown: -1,
intensityCooldown: -1,
tempoResponseFactor: 1.0,
mindsetResponseFactor: 1.0,
intensityResponseFactor: 1.0,
}
      });
    }
  }, [ctx, lineups, matchState, setMatchState]);

  useEffect(() => { logsEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [matchState?.logs]);

// NOWY useEffect: aktualizuje komentarz na boisku przy każdej zmianie logów
  useEffect(() => {
    if (!matchState || !matchState.logs.length) return;

    if (matchState.isHalfTime || matchState.isFinished || matchState.isPenalties) {
      setPitchCommentary(null);
      return;
    }

    // Szukamy pierwszego logu który ma jakąś treść meczową (nie pusty init)
    const latest = matchState.logs[0];
    if (!latest) return;

    const side = latest.teamSide ?? null;
    setPitchCommentary({ text: latest.text, side });

  }, [matchState?.logs[0]?.id]);


  useEffect(() => {
    if (matchState && (matchState.homeScore > 0 || matchState.awayScore > 0) && !matchState.isPenalties) {
      setIsCelebratingGoal(true);
      const celebTimer = setTimeout(() => setIsCelebratingGoal(false), 3000);
      return () => { clearTimeout(celebTimer); };
    }
  }, [matchState?.homeScore, matchState?.awayScore]);

  // Wznowienie gry gdy animacja GOL kończy migać — tylko jeśli user nie pauzował ręcznie
  useEffect(() => {
    if (isCelebratingGoal) return;
    if (isUserPaused) return;
    setMatchState(prev => {
      if (!prev || prev.isFinished || prev.isHalfTime || prev.isPenalties || prev.isPausedForEvent || prev.minute === 0) return prev;
      return { ...prev, isPaused: false };
    });
  }, [isCelebratingGoal]);

  useEffect(() => {
    if (!redCardNotice) return;
    const timer = setTimeout(() => {
      setRedCardNotice(null);
      // Gra pozostaje wstrzymana — gracz musi sam wznowić po obejrzeniu czerwonej
    }, 3000);
    return () => clearTimeout(timer);
  }, [redCardNotice]);

useEffect(() => {
    if (!matchState?.isPausedForEvent || !penaltyPendingRef.current) return;
    const { side, scorer, minute } = penaltyPendingRef.current;
    const timer = setTimeout(() => {
      penaltyPendingRef.current = null;
      const isScored = Math.random() < 0.80;
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
        const eventInfo = {
          playerName: `${scorer.firstName.charAt(0)}. ${scorer.lastName}`,
          minute: latest.minute,
          isPenalty: true,
          isMiss: !isScored
        };
        if (side === 'HOME') finalHGoals.push(eventInfo);
        else finalAGoals.push(eventInfo);
        const penLog = {
          id: `PEN_AWARDED_${minute}`,
          minute: minute,
          text: `👉 RZUT KARNY!`,
          type: MatchEventType.PENALTY_AWARDED,
          teamSide: side,
          playerName: scorer.lastName
        };
        return {
          ...latest,
          homeScore: finalHScore,
          awayScore: finalAScore,
          homeGoals: finalHGoals,
          awayGoals: finalAGoals,
          isPaused: isScored ? true : false,  // po golu — pauza 2 sek; po pudле — wznów
          isPausedForEvent: false,
          logs: [{
            id: `PEN_RES_${minute}`,
            minute: minute,
            text: isScored ? `⚽ GOL! ${scorer.lastName} z karnego!` : `❌ Pudło! ${scorer.lastName} marnuje szansę!`,
            type: isScored ? MatchEventType.GOAL : MatchEventType.PENALTY_MISSED,
            teamSide: side
          }, penLog, ...latest.logs]
        };
      });
      // Po trafieniu z karnego — auto-wznowienie po 5 sekundach
      if (isScored) {
        setTimeout(() => {
          setMatchState(s => {
            if (!s || s.isFinished || s.isPenalties) return s;
            return { ...s, isPaused: false };
          });
        }, 5000);
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [matchState?.isPausedForEvent]);



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

  // Wybiera najlepszą defensywną taktykę dla AI grającego w 10 i reorganizuje XI.
  // Priorytet:  6-3-1 (5+ def) → 5-4-1 / 4-5-1 (4 def) → 4-5-1 (3 def) → 4-4-2-DEF (fallback)
  const pickDefensiveTacticForRedCard = (
    lineup: Lineup,
    teamPlayers: Player[],
    sentOffIds: string[]
  ): { tacticId: string; startingXI: (string | null)[] } => {
    const activeIds = lineup.startingXI.filter(
      (id): id is string => id !== null && !sentOffIds.includes(id)
    );
    const active = activeIds
      .map(id => teamPlayers.find(p => p.id === id))
      .filter((p): p is Player => p !== undefined);

    const defCount = active.filter(p => p.position === PlayerPosition.DEF).length;

    let tacticId = '4-4-2-DEF';
    if (defCount >= 5)      tacticId = '6-3-1';
    else if (defCount >= 4) tacticId = Math.random() < 0.5 ? '5-4-1' : '4-5-1';
    else if (defCount >= 3) tacticId = '4-5-1';

    const chosenTactic = TacticRepository.getById(tacticId);

    const gk   = active.find(p => p.position === PlayerPosition.GK);
    let defQ   = active.filter(p => p.position === PlayerPosition.DEF);
    let midQ   = active.filter(p => p.position === PlayerPosition.MID);
    let fwdQ   = active.filter(p => p.position === PlayerPosition.FWD);
    let anyQ   = active.filter(p => p.position !== PlayerPosition.GK);

    // Jeśli bramkarz NIE jest dostępny (czerwona kartka / kontuzja wylotem),
    // wyznaczamy awaryjnego bramkarza — obrońca z najwyższym goalkeeping, a w br. braku inny zawodnik.
    let emergencyGk: Player | undefined;
    if (!gk && anyQ.length > 0) {
      const sorted = [...anyQ].sort((a, b) => (b.attributes.goalkeeping ?? 0) - (a.attributes.goalkeeping ?? 0));
      emergencyGk = sorted[0];
      defQ = defQ.filter(p => p.id !== emergencyGk!.id);
      midQ = midQ.filter(p => p.id !== emergencyGk!.id);
      fwdQ = fwdQ.filter(p => p.id !== emergencyGk!.id);
      anyQ = anyQ.filter(p => p.id !== emergencyGk!.id);
    }
    const gkForSlot = gk ?? emergencyGk;

    const consume = (primary: Player[], fallbackPool: Player[]): string | null => {
      const p = primary.shift();
      if (p) { anyQ = anyQ.filter(x => x.id !== p.id); return p.id; }
      const fb = fallbackPool.find(x => anyQ.some(a => a.id === x.id));
      if (fb) { anyQ = anyQ.filter(x => x.id !== fb.id); defQ = defQ.filter(x => x.id !== fb.id); midQ = midQ.filter(x => x.id !== fb.id); fwdQ = fwdQ.filter(x => x.id !== fb.id); return fb.id; }
      return null;
    };

    const newXI: (string | null)[] = chosenTactic.slots.map((_s, idx) => {
      if (idx === 0) return gkForSlot?.id ?? null;
      const role = chosenTactic.slots[idx].role;
      if (role === PlayerPosition.DEF) return consume(defQ, anyQ);
      if (role === PlayerPosition.MID) return consume(midQ, anyQ);
      if (role === PlayerPosition.FWD) return consume(fwdQ, [...midQ, ...anyQ]);
      return anyQ.shift()?.id ?? null;
    });

    // Uzupełnij puste sloty pozostałymi graczami
    for (let i = 1; i < newXI.length; i++) {
      if (newXI[i] === null && anyQ.length > 0) newXI[i] = anyQ.shift()!.id;
    }

    return { tacticId, startingXI: newXI };
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
    if (!matchState || matchState.isPaused || matchState.isPausedForEvent || matchState.isFinished || matchState.isHalfTime || matchState.isPenalties || isFinishing || isTacticsOpen) return;

    const interval = setInterval(() => {
      setMatchState(prev => {
        if (!prev || !ctx) return prev;
        
        // Blokada: Jeśli mecz jest skończony lub czekamy na rzuty karne, nie inkrementuj minut
        if (prev.isFinished || prev.isPenalties) return prev;

   const nextMinute = prev.minute + 1;
        const currentSeed = prev.sessionSeed;

        // POST-GOAL COOL-OFF: przez 2 minuty po golu pasek momentum lekko zwalnia w kierunku centrum.
        // Symulacja (kartki, kontuzje, AI) działa normalnie — blokujemy tylko rozgrywkę pola karnego.
        const isCoolingDown = nextMinute - prev.lastGoalBoostMinute < 2;
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
        const RED_CARD_CHANCE        = 0.00001;  // ~0.065 czerwonych/mecz
        const SEVERE_INJURY_CHANCE   = 0.00004;   // (-20%)
        const LIGHT_INJURY_CHANCE    = 0.0020;
        const YELLOW_CARD_CHANCE     = 0.022;    // ~3.15 żółtych/mecz (normal)
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

        // Helper: średnia kondycja zawodników danej pozycji na boisku
        const getAvgPosFatigue = (
          lineup: (string | null)[],
          pool: Player[],
          fatigue: Record<string, number>,
          pos: PlayerPosition
        ): number => {
          const posPlayers = pool.filter(p => lineup.includes(p.id) && p.position === pos);
          if (posPlayers.length === 0) return 80; // brak zawodników na pozycji → neutralna wartość
          return posPlayers.reduce((s, p) => s + (fatigue[p.id] ?? p.condition), 0) / posPlayers.length;
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
           updatedLogs = [{ id: `shout_trace_${nextMinute}`, minute: nextMinute, text: `Trener analizuje sytuację...`, type: MatchEventType.GENERIC, teamSide: aiSide }, ...updatedLogs];
        }

        // 2. Kalkulacja nowej decyzji (Reaction Time)
        // STAGE 1 PRO: Tactical Analysis Speed (Best: 18min, Worst: 40min)
        const reactionDelay = 40 - ((aiCoach?.attributes.decisionMaking || 50) * 0.22);
        
        // Blokada: Shout może wystąpić tylko jeśli minęło min. 10-20 minut od ostatniej dowolnej akcji AI
         const randomShoutCD = 10 + Math.floor(Math.abs(Math.sin(prev.sessionSeed + prev.lastAiActionMinute)) * 10);
        const canShoutNow = nextMinute >= prev.lastAiActionMinute + randomShoutCD;

        // -> tutaj wstaw kod (STAGE 1 PRO: Suma Mocy Jedenastki dla logiki Nastawienia)
        const getTeamTotalPower = (ids: (string | null)[], pool: Player[]) => {
           const act = pool.filter(p => ids.includes(p.id));
           return act.reduce((s, p) => s + (p.attributes.attacking + p.attributes.passing + p.attributes.defending), 0);
        };
        const pPower = getTeamTotalPower(userSide === 'HOME' ? nextHomeLineup.startingXI : nextAwayLineup.startingXI, userSide === 'HOME' ? ctx.homePlayers : ctx.awayPlayers);
        const aPower = getTeamTotalPower(userSide === 'HOME' ? nextAwayLineup.startingXI : nextHomeLineup.startingXI, userSide === 'HOME' ? ctx.awayPlayers : ctx.homePlayers);

        // KOORDYNACJA BRAIN↔SERVICE: obliczamy sensory tutaj, przed Brain, by wykryć konflikty.
        // Sensory z AiMatchDecisionCupService mają pierwszeństwo nad generycznymi regułami Brain.
        const brainSyncDiffAi = aiSide === 'HOME' ? (prev.homeScore - prev.awayScore) : (prev.awayScore - prev.homeScore);
        const isDefensiveSensorActive = (brainSyncDiffAi >= 1 && pPower > aPower + 10)            // winningWeaker
                                     || (brainSyncDiffAi === 1 && nextMinute >= 70 && pPower > aPower)  // lateLeadUnderPressure
                                     || (brainSyncDiffAi === 0 && nextMinute >= 70 && pPower > aPower);  // lateDrawUnderPressure
        const isAttackSensorActive = brainSyncDiffAi <= -2                                         // losingByTwo
                                  || (brainSyncDiffAi === -1 && nextMinute >= 70);                  // lateChase
        // [SLOT BR1] - miejsce na dodatkowe sensory wpływające na filtrację Brain (np. opponentShortHanded)

        // TUTAJ WSTAW TEN KOD - Zmiana !currentAiShout na sprawdzenie wygaśnięcia
        const isSlotAvailable = !currentAiShout || currentAiShout.isExpired;

        if (isSlotAvailable && canShoutNow && nextMinute % Math.floor(reactionDelay) === 0) {
           // Jeśli krzyk nastąpi, aktualizujemy czas ostatniej akcji w locie
           nextLastAiActionMinute = nextMinute; 
           const brainDecision = TacticalBrainService.calculate(prev, userSide === 'HOME') as any; // Rzutowanie na any naprawia błąd intensity
           const isBrainConflicting = (isDefensiveSensorActive && brainDecision.mindset === 'OFFENSIVE')
                                   || (isAttackSensorActive && brainDecision.mindset === 'DEFENSIVE');
           // [SLOT BR2] - miejsce na dodatkowe warunki konfliktu Brain (np. blokowanie CAUTIOUS gdy isDesperate)
           if (brainDecision.id !== 'N1' && !isBrainConflicting) { 
              const disciplineDuration = 10 + Math.floor((aiCoach?.attributes.experience || 50) / 10);
              currentAiShout = {
                 id: brainDecision.id,
                 expiryMinute: nextMinute + disciplineDuration,
                 mindset: (brainDecision.mindset || 'NEUTRAL') as any,
                 tempo: (brainDecision.tempo || 'NORMAL') as any,
                 intensity: (brainDecision.intensity || 'NORMAL') as any
              };
              if (brainDecision.log) {
              updatedLogs = [{ id: `ai_shout_${nextMinute}`, minute: nextMinute, text: brainDecision.log, type: MatchEventType.GENERIC, teamSide: aiSide }, ...updatedLogs];
              }
           }
        }
        // KONIEC WSTAWKI

        const powerDiff = pPower - aPower;
       





        const pDefSum = getSumAttr(userSide === 'HOME' ? nextHomeLineup.startingXI : nextAwayLineup.startingXI, userSide === 'HOME' ? ctx.homePlayers : ctx.awayPlayers, 'defending');
        const aAttSum = getSumAttr(userSide === 'HOME' ? nextAwayLineup.startingXI : nextHomeLineup.startingXI, userSide === 'HOME' ? ctx.awayPlayers : ctx.homePlayers, 'attacking');

        // -> TUTAJ WSTAW TEN KOD (STAGE 1 PRO: Sumy Mieszane dla Intensywności Agresywnej)
        const pPassSum = getSumAttr(userSide === 'HOME' ? nextHomeLineup.startingXI : nextAwayLineup.startingXI, userSide === 'HOME' ? ctx.homePlayers : ctx.awayPlayers, 'passing');
        const aPassSum = getSumAttr(userSide === 'HOME' ? nextAwayLineup.startingXI : nextHomeLineup.startingXI, userSide === 'HOME' ? ctx.awayPlayers : ctx.homePlayers, 'passing');
        
        const pAttMid = pTotalAtt + pPassSum;
        const pDefMid = pDefSum   + pPassSum;
        const aAttMid = aAttSum   + aPassSum;
        const aDefMid = aTotalDef + aPassSum;

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

        // === NADPROGRAMOWY DRENAŻ ZMĘCZENIA ZA NIEDOBÓR GRACZY ===
        // Gracze w niepełnym składzie muszą biec za 2 — każda minuta kosztuje więcej
        // 10 graczy: +0.25 pkt/min | 9 graczy: +0.70 pkt/min | 8 graczy: +1.40 pkt/min
        const applyNumericalFatigueDrain = (
            fatigue: Record<string, number>,
            lineup: (string | null)[],
            pool: Player[]
        ) => {
            const onPitch = lineup.filter(id => id !== null) as string[];
            const missing = Math.max(0, 11 - onPitch.length);
            if (missing === 0) return;
            const extraDrain = Math.pow(missing, 1.6) * 0.25; // 1 brak=0.25, 2=0.70, 3=1.40
            onPitch.forEach(id => {
                const p = pool.find(x => x.id === id);
                if (!p) return;
                const current = fatigue[id] ?? p.condition;
                fatigue[id] = Math.max(0, current - extraDrain);
            });
        };
        applyNumericalFatigueDrain(localHomeFatigue, nextHomeLineup.startingXI, ctx.homePlayers);
        applyNumericalFatigueDrain(localAwayFatigue, nextAwayLineup.startingXI, ctx.awayPlayers);

/// SYSTEM KAR TAKTYCZNYCH (STAGE 1 PRO) ---
        const homeHasGK = ctx.homePlayers.find(p => p.id === nextHomeLineup.startingXI[0])?.position === PlayerPosition.GK;
        const awayHasGK = ctx.awayPlayers.find(p => p.id === nextAwayLineup.startingXI[0])?.position === PlayerPosition.GK;

        // Bazowe progi progresji (Faza 2)
       let homeProgressionThreshold = 0.70;
        let awayProgressionThreshold = 0.70;

        // === ZABURZENIA POZYCJI — dynamiczne progi progresji ===
        const homeDisorder = getPositionalDisorder(nextHomeLineup.startingXI, ctx.homePlayers, nextHomeLineup.tacticId);
        const awayDisorder = getPositionalDisorder(nextAwayLineup.startingXI, ctx.awayPlayers, nextAwayLineup.tacticId);
        // Zaburzony skład: rywalowi łatwiej atakować (−próg), własny atak trudniejszy (+próg)
        homeProgressionThreshold = Math.max(0.25, 0.55 + homeDisorder * 0.30 - awayDisorder * 0.55);
        awayProgressionThreshold = Math.max(0.25, 0.55 + awayDisorder * 0.30 - homeDisorder * 0.55);

        // === ŚREDNIA KONDYCJA DRUŻYNY → BEZPOŚREDNI WPŁYW NA PRÓG ===
        // 4 kontuzjowanych graczy (cond ~45) ciągnie średnią z ~80 do ~65
        // Poniżej 72 każdy punkt kondycji to +0.004 progu → trudniej atakować, łatwiej tracić
        const getTeamAvgCond = (lineup: (string | null)[], pool: Player[], fatigueMap: Record<string, number>) => {
            const ids = lineup.filter((id): id is string => id !== null);
            if (!ids.length) return 80;
            return ids.reduce((s, id) => {
                const p = pool.find(x => x.id === id);
                return s + (fatigueMap[id] ?? p?.condition ?? 80);
            }, 0) / ids.length;
        };
        const homeAvgCond = getTeamAvgCond(nextHomeLineup.startingXI, ctx.homePlayers, localHomeFatigue);
        const awayAvgCond  = getTeamAvgCond(nextAwayLineup.startingXI,  ctx.awayPlayers, localAwayFatigue);
        // Próg rośnie (trudniej atakować) gdy własna średnia kondycja spada poniżej 72
        if (homeAvgCond < 72) homeProgressionThreshold = Math.min(0.92, homeProgressionThreshold + (72 - homeAvgCond) * 0.004);
        if (awayAvgCond  < 72) awayProgressionThreshold  = Math.min(0.92, awayProgressionThreshold  + (72 - awayAvgCond)  * 0.004);

        // === KARA ZA NIEDOBÓR GRACZY (czerwone kartki) ===
        // 10 graczy: mała kara | 9 graczy: duża kara | 8-: katastrofa
        // Brakujący gracze = MUSZĄ biec za 2, więc próg ataku rośnie eksponencjalnie
        const homeOnPitch = nextHomeLineup.startingXI.filter(id => id !== null).length;
        const awayOnPitch = nextAwayLineup.startingXI.filter(id => id !== null).length;
        const homeMissing = Math.max(0, 11 - homeOnPitch);
        const awayMissing = Math.max(0, 11 - awayOnPitch);

        // Eksponencjalna kara: 1 brak=+0.20 (gra w 10), 2 braki → próg 0.95 (gra w 9 = cud)
        const numericalPenaltyThreshold = (missing: number) => missing === 0 ? 0 : Math.pow(missing, 1.8) * 0.20;
        homeProgressionThreshold = Math.min(0.85, homeProgressionThreshold + numericalPenaltyThreshold(homeMissing));
        awayProgressionThreshold = Math.min(0.85, awayProgressionThreshold + numericalPenaltyThreshold(awayMissing));

        // === PREMIA DLA RYWALA GRAJĄCEGO PRZECIW OSŁABIONEMU SKŁADOWI ===
        // Im silniejszy atakujący vs osłabiony rywal, tym łatwiej mu atakować (progresywnie)
        // Tier1 (rep=10) vs Tier4 (rep=2) w 9 → strengthMult=1.5 → próg 0.29 (strzela często)
        // Równi (rep=6 vs 6) w 9          → strengthMult=1.0 → próg 0.38 (strzela regularnie)
        // Słabszy (rep=4) vs silniejszy w 9 → strengthMult=0.6 → próg 0.43 (coś tam uzyska)
        const repRatioBonus = (attackerRep: number, defenderRep: number) =>
            Math.min(1.5, Math.max(0.6, attackerRep / Math.max(1, defenderRep)));
        if (awayMissing > 0) {
            const baseBonus = numericalPenaltyThreshold(awayMissing) * 0.21;
            const strengthMult = repRatioBonus(ctx.homeClub.reputation, ctx.awayClub.reputation);
            homeProgressionThreshold = Math.max(0.25, homeProgressionThreshold - baseBonus * strengthMult);
        }
        if (homeMissing > 0) {
            const baseBonus = numericalPenaltyThreshold(homeMissing) * 0.21;
            const strengthMult = repRatioBonus(ctx.awayClub.reputation, ctx.homeClub.reputation);
            awayProgressionThreshold = Math.max(0.25, awayProgressionThreshold - baseBonus * strengthMult);
        }

        // === KARA ZA ZŁĄ TAKTYKĘ PRZY NIEDOBORZE ===
        // Drużyna w 9 grająca ofensywnie = odkryta obrona = premia dla rywala
        const homeTacticObj = TacticRepository.getById(nextHomeLineup.tacticId);
        const awayTacticObj = TacticRepository.getById(nextAwayLineup.tacticId);
        if (homeMissing >= 2 && homeTacticObj.attackBias > 55) {
            // Im bardziej ofensywna taktyka przy niedoborze, tym większa premia dla rywala
            const recklessFactor = ((homeTacticObj.attackBias - 55) / 45) * homeMissing * 0.06;
            awayProgressionThreshold = Math.max(0.25, awayProgressionThreshold - recklessFactor);
            nextMomentum -= recklessFactor * 20;
        }
        if (awayMissing >= 2 && awayTacticObj.attackBias > 55) {
            const recklessFactor = ((awayTacticObj.attackBias - 55) / 45) * awayMissing * 0.06;
            homeProgressionThreshold = Math.max(0.25, homeProgressionThreshold - recklessFactor);
            nextMomentum += recklessFactor * 20;
        }

        // === KOREKTA TAKTYCZNA PRZY ZABURZENIACH POZYCJI ===
        // Filozofia: chaos w składzie + taktyka defensywna = trener ratuje sytuację
        //            chaos w składzie + brawurowy atak = blamaż, rywal karze
        // Próg disorder 0.10 = minimum które warto uwzględniać (~1-2 gracze poza pozycją)
        if (homeDisorder >= 0.10) {
            if (homeTacticObj.defenseBias > 60) {
                // Mądry wybór: obrona kompensuje brak specjalistów — rywal traci część premii z chaosu
                awayProgressionThreshold = Math.min(0.95, awayProgressionThreshold + homeDisorder * 0.22);
            } else if (homeTacticObj.attackBias > 60) {
                // Blamaż: otwarty atak ze zdezorganizowanym składem — rywal dostaje dodatkową premię
                awayProgressionThreshold = Math.max(0.25, awayProgressionThreshold - homeDisorder * 0.18);
                nextMomentum -= homeDisorder * 6;
            }
        }
        if (awayDisorder >= 0.10) {
            if (awayTacticObj.defenseBias > 60) {
                // Mądry wybór AI/rywala: defensywa chroni przed skutkami chaosu
                homeProgressionThreshold = Math.min(0.95, homeProgressionThreshold + awayDisorder * 0.22);
            } else if (awayTacticObj.attackBias > 60) {
                // Blamaż rywala: lekkomyślny atak z bezładnym składem — gracz korzysta
                homeProgressionThreshold = Math.max(0.25, homeProgressionThreshold - awayDisorder * 0.18);
                nextMomentum += awayDisorder * 6;
            }
        }


        const playerTacticId = userSide === 'HOME' ? prev.homeLineup.tacticId : prev.awayLineup.tacticId;

        // === BONUS WALECZNOŚCI TIER3/TIER4 ("Chłopaki walczą") ===
        // Słabszy klub grający defensywnie dostaje losowy bonus utrudniający faworytowi atak.
        // Warunek: AI jest Tier3/4 (rep <= 5) vs gracz Tier1 (rep >= 8) + gra defensywnie.
        const aiRepNow = aiSide === 'HOME' ? ctx.homeClub.reputation : ctx.awayClub.reputation;
        const playerRepNow = userSide === 'HOME' ? ctx.homeClub.reputation : ctx.awayClub.reputation;
        const aiTacticNow = TacticRepository.getById(aiSide === 'HOME' ? nextHomeLineup.tacticId : nextAwayLineup.tacticId);
        const aiIsUltraDefensive = (currentAiShout?.mindset === 'DEFENSIVE' || aiTacticNow.defenseBias > 65);

        if (aiRepNow <= 5 && playerRepNow >= 8 && aiIsUltraDefensive) {
            // Losowy bonus 5–15% (różny każdą minutę — nieprzewidywalny)
            const fightBonus = 0.05 + seededRng(currentSeed, nextMinute, 3131) * 0.10;
            // Podnosimy próg dla atakującego gracza (trudniej wejść w pole karne)
            if (userSide === 'HOME') {
                homeProgressionThreshold = Math.min(0.95, homeProgressionThreshold + fightBonus);
            } else {
                awayProgressionThreshold = Math.min(0.95, awayProgressionThreshold + fightBonus);
            }
        }

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
        if (instr.mindset === 'OFFENSIVE' && nextMinute <= instr.expiryMinute) { 
           pGoalMod += (0.005 + seededRng(currentSeed, nextMinute, 11) * 0.045); 
           // Ryzyko z tyłu tylko z silniejszym/równym rywalem
           if (ctx.awayClub.reputation >= ctx.homeClub.reputation) pRiskMod += 0.02 + seededRng(currentSeed, nextMinute, 22) * 0.03;
        }
        if (instr.mindset === 'DEFENSIVE' && nextMinute <= instr.expiryMinute) {
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
const aiClubRep = aiSide === 'HOME' ? ctx.homeClub.reputation : ctx.awayClub.reputation;
const playerClubRep = userSide === 'HOME' ? ctx.homeClub.reputation : ctx.awayClub.reputation;
const aiGoalThresholdBoost = pRiskMod * (aiClubRep >= playerClubRep ? 0.06 : 0.04);
        let aiGoalMultiplier = 1.0;
        
        // Specjalny mnożnik: ALL-IN gracza vs TRAP AI = Śmiercionośna kontra AI
        // Progresywny: im bliższe siły, tym groźniejsza kontra. Im większa przepaść, tym mniejsza.
        // relDiff=0.00 (T1 vs T1, Legia/Górnik)  → +17% boost (max zagrożenie kontry)
        // relDiff=0.08 (T1 vs T2)                → +13% boost
        // relDiff=0.20 (T1 vs T3)                → +7%  boost
        // relDiff=0.35 (T1 vs T4)                → +3%  boost (min — słabi gracze nie dowiozą)
        if (pStyle === 'ALL-IN' && aiStyle === 'TRAP') {
           const myPow = userSide === 'HOME' ? pPower : aPower;
           const oppPow = userSide === 'HOME' ? aPower : pPower;
           const relDiff = Math.max(0, (myPow - oppPow) / Math.max(1, myPow));
           const counterBonus = Math.max(0.03, 0.17 - relDiff * 0.50);
           aiGoalMultiplier = 1.0 + counterBonus;
           aiAdvantageFactor = aiGoalMultiplier;
        }

        let hScore = prev.homeScore;
                let aScore = prev.awayScore;
                let eventType: MatchEventType | undefined;
                let eventSide: 'HOME' | 'AWAY' = 'HOME';
                let currentScorerName = "";
                // Lokalne zmienne dla post-goal state (bezpieczny odczyt z typowanego stanu)
                let nextLastGoalBoostMinute = prev.lastGoalBoostMinute;
                let nextPostGoalSuppressionDuration = (prev as any).postGoalSuppressionDuration ?? 4;
                let nextPostGoalPenaltyPct = (prev as any).postGoalPenaltyPct ?? 0.10;
                let nextComebackPower = (prev as any).comebackPower ?? 0;
                let nextComebackExpiry = (prev as any).comebackExpiry ?? 0;
                let nextComebackSide: 'HOME' | 'AWAY' | null = (prev as any).comebackSide ?? null;
     
        // --- GLOBAL PENALTY LOGIC (Z MODYFIKATOREM INTENSYWNOŚCI) ---
        let penaltyThreshold = (1 / 327);
       
               
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
  if (!scorer) return { ...prev, minute: nextMinute + 1 };

  setPenaltyNotice(teamName);
  setTimeout(() => setPenaltyNotice(null), 3000);

  penaltyPendingRef.current = { side, scorer, minute: nextMinute };

  return { ...prev, minute: nextMinute + 1, isPaused: true, isPausedForEvent: true };
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
        // Funkcja pomocnicza do pobierania tempa danej strony
        const getTempoAtSide = (side: 'HOME' | 'AWAY') => {
          if (side === userSide) return prev.userInstructions.tempo;
          return currentAiShout?.tempo || 'NORMAL';
        };

    const sideIntensity = getIntensityAtSide(incidentSide);
        const otherIntensity = getIntensityAtSide(otherSide);
        const sideTempo = getTempoAtSide(incidentSide);
        const otherTempo = getTempoAtSide(otherSide);

        // Osobne, niezależne losowania dla kartek i kontuzji
        const cardRoll   = seededRng(currentSeed, nextMinute, 9991);
        const injuryRoll = seededRng(currentSeed, nextMinute, 9993);

        // ===== DEBUG HEADER – minuta =====
        debugLogRef.current.push(`\n=== MIN ${nextMinute} | seed=${currentSeed} | incidentSide=${incidentSide} ===`);
        debugLogRef.current.push(`  cardRoll=${cardRoll.toFixed(8)}   injuryRoll=${injuryRoll.toFixed(8)}`);

        // Efektywne szanse na kartki – skalowane agresją strony która popełnia faul
        let effectiveRedChance    = RED_CARD_CHANCE;    // ~0.065 czerwonych/mecz (normalnie)
        let effectiveYellowChance = YELLOW_CARD_CHANCE; // ~3.15 żółtych/mecz (normalnie)

        if (sideIntensity === 'AGGRESSIVE') {
            effectiveRedChance    *= 1.50;  // +50% czerwone przy agresji
            effectiveYellowChance *= 2.5;  // +100% żółte przy agresji (główna kara)
        } else if (sideIntensity === 'CAUTIOUS') {
            effectiveRedChance    *= 0.5;
            effectiveYellowChance *= 0.5;
        }
        // Modyfikator kontuzji zależny od intensywności gry
        // BUGFIX: mnożnik aktywuje się TYLKO gdy strona popełniająca faul (incidentSide) jest agresywna.
        // Poprzedni warunek || otherIntensity powodował że mnożnik 1.2-1.7 był aktywny niemal zawsze.
        let injuryIntensityMult = 1.0;
        if (sideIntensity === 'AGGRESSIVE' && otherIntensity === 'AGGRESSIVE')
            injuryIntensityMult = 1.05 + seededRng(currentSeed, nextMinute, 7777) * 0.25; // obie agresywne: ×1.05–1.30
        else if (sideIntensity === 'AGGRESSIVE')
            injuryIntensityMult = 1.0 + seededRng(currentSeed, nextMinute, 7777) * 0.1; // tylko incidentSide agresywna: ×1.0–1.10
        else if (sideIntensity === 'CAUTIOUS' && otherIntensity === 'CAUTIOUS')
            injuryIntensityMult = 0.4; // obie ostrożne → −60% kontuzji
        else if (sideIntensity === 'CAUTIOUS' || otherIntensity === 'CAUTIOUS')
            injuryIntensityMult = 0.7; // jedna ostrożna → −30% kontuzji
        // effectiveSevereBonus dodawany do progu kontuzji (por. formuła poniżej)
        const effectiveSevereBonus = SEVERE_INJURY_CHANCE * Math.max(0, injuryIntensityMult - 1.0);

        // ===== DEBUG =====
        debugLogRef.current.push(`  sideIntensity=${sideIntensity} | effectiveRedChance=${effectiveRedChance.toFixed(8)} | effectiveYellowChance=${effectiveYellowChance.toFixed(8)}`);
        debugLogRef.current.push(`  injuryIntensityMult=${injuryIntensityMult.toFixed(4)} | effectiveSevereBonus=${effectiveSevereBonus.toFixed(8)}`);


        // === COLLAPSE CHECK: skanuje WSZYSTKICH graczy obu drużyn każdą minutę ===
        // Niezależny od losowego incidentSide — gracz przy cond=14% MUSI odczuć konsekwencje.
        // cond < 10%: 15%/min | cond 10-20%: 8%/min | cond 20-30%: 3%/min
        if (!prev.isPausedForEvent) {
            const collapseCheck = (
                lineup: (string | null)[],
                pool: Player[],
                fatigueMap: Record<string, number>,
                side: 'HOME' | 'AWAY'
            ) => {
                lineup.forEach((id, slotIdx) => {
                    if (!id) return;
                    const p = pool.find(x => x.id === id);
                    if (!p) return;
                    const cond = fatigueMap[id] ?? p.condition;
                    let collapseProb = 0;
                    if (cond < 10)       collapseProb = 0.15;
                    else if (cond < 20)  collapseProb = 0.08;
                    else if (cond < 30)  collapseProb = 0.03;
                    if (collapseProb === 0) return;

                    const roll = seededRng(currentSeed, nextMinute, slotIdx + 1234 + (side === 'HOME' ? 0 : 500));
                    if (roll < collapseProb) {
                        debugLogRef.current.push(`  >>>>>> !!! COLLAPSE FIRED !!! player=${p.lastName} cond=${cond.toFixed(2)} collapseProb=${collapseProb} roll=${roll.toFixed(8)} min=${nextMinute}`);
                        // Gracz pada z wyczerpania — groźna kontuzja, schodzi z boiska
                        if (side === 'HOME') {
                            nextHomeInjuries[id] = InjurySeverity.SEVERE;
                            nextHomeLineup.startingXI = nextHomeLineup.startingXI.map(s => s === id ? null : s);
                        } else {
                            nextAwayInjuries[id] = InjurySeverity.SEVERE;
                            nextAwayLineup.startingXI = nextAwayLineup.startingXI.map(s => s === id ? null : s);
                        }
                        updatedLogs = [{
                            id: `COLLAPSE_${side}_${nextMinute}_${id}`,
                            minute: nextMinute,
                            text: `🚑 ${p.lastName} pada z wyczerpania! Kondycja krytyczna — schodzi z boiska!`,
                            type: MatchEventType.INJURY_SEVERE,
                            teamSide: side,
                            playerName: p.lastName
                        }, ...updatedLogs];
                        if (side === userSide) nextIsPaused = true;
                    }
                });
            };
            collapseCheck(nextHomeLineup.startingXI, ctx.homePlayers, localHomeFatigue, 'HOME');
            collapseCheck(nextAwayLineup.startingXI, ctx.awayPlayers, localAwayFatigue, 'AWAY');
        }
        // === KONIEC COLLAPSE CHECK ===

        const teamPool = incidentSide === 'HOME' ? ctx.homePlayers : ctx.awayPlayers;
        const teamXI = incidentSide === 'HOME' ? nextHomeLineup.startingXI : nextAwayLineup.startingXI;
        
        // Wybór aktywnego zawodnika do zdarzenia – zmęczeni gracze mają wyższe ryzyko
        const activeIds = teamXI.filter(id => id !== null);
        const fatigueMapForSide = incidentSide === 'HOME' ? localHomeFatigue : localAwayFatigue;
        const injuryWeights = activeIds.map(id => {
            const p = teamPool.find(x => x.id === id);
            const cond = fatigueMapForSide[id] ?? p?.condition ?? 80;
            return Math.max(0.5, (100 - cond) / 10 + 1); // cond=100→1.0, cond=80→3.0, cond=50→6.0
        });
        const totalWeight = injuryWeights.reduce((s, w) => s + w, 0);
        let rngVal = seededRng(currentSeed, nextMinute, 777) * totalWeight;
        let targetId = activeIds[activeIds.length - 1];
        for (let i = 0; i < activeIds.length; i++) {
            rngVal -= injuryWeights[i];
            if (rngVal <= 0) { targetId = activeIds[i]; break; }
        }
        const targetPlayer = teamPool.find(p => p.id === targetId);

if (targetPlayer && !prev.isPausedForEvent) {

    // ===== DEBUG – gracz wylosowany =====
    debugLogRef.current.push(`  targetPlayer=${targetPlayer.lastName} | storedCondition=${targetPlayer.condition} | fatigueMapVal=${fatigueMapForSide[targetPlayer.id] ?? 'undefined'}`);

    // Progresywna kara za zmęczenie — łączne ryzyko kontuzji (severe+light) na minutę:
    //   cond >= 75%: baseline (~0.84%/min)
    //   cond   74%: +3%  → ~3.84%/min
    //   cond   50%: 60%/min (zakres 50-70%)
    //   cond   35%: 92%/min (zakres 85-99%)
    //   cond < 35%: ~98%/min (praktyczna gwarancja kontuzji w tej minucie)
    const targetCondition = fatigueMapForSide[targetPlayer.id] ?? targetPlayer.condition;
    const BASE_INJURY_TOTAL = SEVERE_INJURY_CHANCE + LIGHT_INJURY_CHANCE; // ~0.0084
    let totalInjuryChance: number;
    if (targetCondition >= 75) {
        totalInjuryChance = BASE_INJURY_TOTAL;
    } else if (targetCondition >= 50) {
        const t = (75 - targetCondition) / 25;
        totalInjuryChance = 0.03 + t * (0.60 - 0.03);
    } else if (targetCondition >= 35) {
        const t = (50 - targetCondition) / 15;
        totalInjuryChance = 0.60 + t * (0.92 - 0.60);
    } else {
        totalInjuryChance = 0.98;
    }
    // Skalowanie przez intensywność gry (CAUTIOUS redukuje, AGGRESSIVE zwiększa)
    totalInjuryChance = Math.min(0.98, totalInjuryChance * injuryIntensityMult);
    // Proporcjonalny podział na groźną i lekką (zachowuje stosunek 1:20)
    const sevRatio = SEVERE_INJURY_CHANCE / BASE_INJURY_TOTAL;
    const effectiveSevereChance = totalInjuryChance * sevRatio;
    // Przy szybkim tempie po stronie incydentu: +0.04 do lekkiej kontuzji (ogólny bonus, niezależny od minuty)
    const tempoLightBonus = (sideTempo === 'FAST' || otherTempo === 'FAST') ? 0.04 : 0;
    const effectiveLightChance  = Math.min(0.98, totalInjuryChance * (1 - sevRatio) + tempoLightBonus);

    // =====================================================================
    // Kolejność OD NAJPoważniejszego / najrzadszego do najczęstszego
    // Tylko jedno zdarzenie na minutę na gracza → zachowujemy spójność symulacji
    // Łączna szansa na zdarzenie ≈ 3.3% na minutę na gracza (realistycznie niska)
    // =====================================================================

    // ===== DEBUG – progi dla tego gracza =====
    debugLogRef.current.push(`  targetCondition=${targetCondition.toFixed(2)} | totalInjuryChance=${totalInjuryChance.toFixed(8)} | sevRatio=${sevRatio.toFixed(6)}`);
    debugLogRef.current.push(`  effectiveSevereChance=${effectiveSevereChance.toFixed(8)} | effectiveLightChance=${effectiveLightChance.toFixed(8)}`);
    debugLogRef.current.push(`  CHECK: cardRoll(${cardRoll.toFixed(8)}) < RED(${effectiveRedChance.toFixed(8)})? ${cardRoll < effectiveRedChance}`);
    debugLogRef.current.push(`  CHECK: injuryRoll(${injuryRoll.toFixed(8)}) < SEVERE+BONUS(${(effectiveSevereChance + effectiveSevereBonus).toFixed(8)})? ${injuryRoll < effectiveSevereChance + effectiveSevereBonus}`);

    // 1. CZERWONA KARTKA – niezależny roll
    if (cardRoll < effectiveRedChance) {
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

        debugLogRef.current.push(`  >>>>>> !!! RED CARD FIRED !!! player=${dispName} min=${nextMinute} cardRoll=${cardRoll.toFixed(8)} RED_CHANCE=${effectiveRedChance.toFixed(8)}`);

        if (incidentSide === userSide) {
          nextIsPaused = true;
          setTimeout(() => setRedCardNotice(dispName), 0);
        }

        if (incidentSide === aiSide) {
          // AI automatycznie przestawia się na defensywę po czerwonej kartce
          currentAiShout = {
            id: `RED_CARD_DEFENSIVE_${nextMinute}`,
            expiryMinute: 999,
            mindset: 'DEFENSIVE' as any,
            tempo: 'SLOW' as any,
            intensity: 'CAUTIOUS' as any
          };
          const aiLineupNow = aiSide === 'HOME' ? nextHomeLineup : nextAwayLineup;
          const aiPlayersNow = aiSide === 'HOME' ? ctx.homePlayers : ctx.awayPlayers;
          const defChoice = pickDefensiveTacticForRedCard(aiLineupNow, aiPlayersNow, nextSentOffIds);
          if (aiSide === 'HOME') nextHomeLineup = { ...nextHomeLineup, tacticId: defChoice.tacticId, startingXI: defChoice.startingXI as any };
          else nextAwayLineup = { ...nextAwayLineup, tacticId: defChoice.tacticId, startingXI: defChoice.startingXI as any };
          const wasGkSentOff = targetPlayer.position === PlayerPosition.GK;
          const emergencyGkPlayer = wasGkSentOff
            ? (aiSide === 'HOME' ? ctx.homePlayers : ctx.awayPlayers).find(p => p.id === defChoice.startingXI[0])
            : null;
          const redLogText = wasGkSentOff && emergencyGkPlayer
            ? `Trener ${aiClub.shortName} wyznacza awaryjnego bramkarza: ${emergencyGkPlayer.lastName} (${defChoice.tacticId}) — desperacja!`
            : `Trener ${aiClub.shortName} ustawia drużynę defensywnie (${defChoice.tacticId}) — gra w 10!`;
          updatedLogs = [{ id: `ai_red_def_${nextMinute}`, minute: nextMinute, text: redLogText, type: MatchEventType.GENERIC, teamSide: aiSide }, ...updatedLogs];
        }
    }

    // 2. GROŹNA KONTUZJA (niezależny roll, skalowane zmęczeniem + agresją)
    else if (injuryRoll < effectiveSevereChance + effectiveSevereBonus) {
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

        debugLogRef.current.push(`  >>>>>> !!! SEVERE INJURY FIRED !!! player=${targetPlayer.lastName} min=${nextMinute} cond=${targetCondition.toFixed(2)} injuryRoll=${injuryRoll.toFixed(8)} sevChance=${(effectiveSevereChance+effectiveSevereBonus).toFixed(8)}`);

        nextIsPaused = true;  // zatrzymanie gry – najcięższe zdarzenie
    }

    // 3. LEKKI URAZ (niezależny roll, skalowane zmęczeniem)
    else if (injuryRoll < effectiveSevereChance + effectiveSevereBonus + effectiveLightChance) {
        if (incidentSide === 'HOME') {
            nextHomeInjuries[targetPlayer.id] = InjurySeverity.LIGHT;
        } else {
            nextAwayInjuries[targetPlayer.id] = InjurySeverity.LIGHT;
        }

        // BUGFIX: conditionDrop zmniejszone z 25-45 do 5-10 pkt.
        // Poprzednia wartość (45 - strength/100*20 = ~25-45) powodowała kaskadę:
        // po 2-3 lekkich kontuzjach kondycja spadała < 30, wyzwalając Collapse Check (SEVERE).
        const pStrength = targetPlayer.attributes.strength || 50;
        const conditionDrop = 5 + ((100 - pStrength) / 100) * 5; // zakres: 5.0 (str=100) → 10.0 (str=0)

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

    // 4. ŻÓŁTA KARTKA – niezależny roll (cardRoll >= effectiveRedChance dzięki else if)
    else if (cardRoll < effectiveRedChance + effectiveYellowChance) {
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

            if (incidentSide === userSide) {
              nextIsPaused = true;
              setTimeout(() => setRedCardNotice(targetPlayer.lastName), 0);
            }

            if (incidentSide === aiSide) {
              // AI automatycznie przestawia się na defensywę po drugiej żółtej
              currentAiShout = {
                id: `RED2_CARD_DEFENSIVE_${nextMinute}`,
                expiryMinute: 999,
                mindset: 'DEFENSIVE' as any,
                tempo: 'SLOW' as any,
                intensity: 'CAUTIOUS' as any
              };
              const aiLineupNow = aiSide === 'HOME' ? nextHomeLineup : nextAwayLineup;
              const aiPlayersNow = aiSide === 'HOME' ? ctx.homePlayers : ctx.awayPlayers;
              const defChoice = pickDefensiveTacticForRedCard(aiLineupNow, aiPlayersNow, nextSentOffIds);
              if (aiSide === 'HOME') nextHomeLineup = { ...nextHomeLineup, tacticId: defChoice.tacticId, startingXI: defChoice.startingXI as any };
              else nextAwayLineup = { ...nextAwayLineup, tacticId: defChoice.tacticId, startingXI: defChoice.startingXI as any };
              const wasGkSentOff2 = targetPlayer.position === PlayerPosition.GK;
              const emergencyGkPlayer2 = wasGkSentOff2
                ? (aiSide === 'HOME' ? ctx.homePlayers : ctx.awayPlayers).find(p => p.id === defChoice.startingXI[0])
                : null;
              const red2LogText = wasGkSentOff2 && emergencyGkPlayer2
                ? `Trener ${aiClub.shortName} wyznacza awaryjnego bramkarza: ${emergencyGkPlayer2.lastName} (${defChoice.tacticId}) — desperacja!`
                : `Trener ${aiClub.shortName} ustawia drużynę defensywnie (${defChoice.tacticId}) — gra w 10!`;
              updatedLogs = [{ id: `ai_red2_def_${nextMinute}`, minute: nextMinute, text: red2LogText, type: MatchEventType.GENERIC, teamSide: aiSide }, ...updatedLogs];
            }
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
        // Asymetryczny modifier pogodowy: techniczna drużyna traci więcej na złej pogodzie niż fizyczna
        const calcTeamWeatherMod = (players: Player[], lineupIds: (string | null)[]): number => {
            const xi = players.filter(p => lineupIds.includes(p.id));
            if (xi.length === 0) return 1.0;
            const avgTech = xi.reduce((s, p) => s + p.attributes.technique, 0) / xi.length;
            const intensity = env.weather.weatherIntensity ?? 0;
            if (intensity < 0.1) return 1.0;
            const desc = env.weather.description.toLowerCase();
            const isPrecip = desc.includes('deszcz') || desc.includes('śnieg') || desc.includes('burza') || desc.includes('zamieć') || desc.includes('ulewa');
            if (isPrecip) {
                // Techniczna drużyna (tech>68): duża kara | fizyczna (tech<50): mała kara
                const techFactor = avgTech > 68 ? 0.76 : avgTech > 55 ? 0.84 : 0.91;
                return 1.0 - (1.0 - techFactor) * (0.5 + intensity * 0.5);
            }
            if (desc.includes('wiatr') || env.weather.windKmh > 32) {
                return avgTech > 68 ? 0.91 : 0.96;
            }
            if (desc.includes('upał')) return 0.95;
            if (desc.includes('mróz') || desc.includes('przymrozek')) {
                return avgTech > 68 ? 0.90 : 0.96;
            }
            return 1.0;
        };
        const homeWeatherMod = calcTeamWeatherMod(ctx.homePlayers, nextHomeLineup.startingXI);
        const awayWeatherMod = calcTeamWeatherMod(ctx.awayPlayers, nextAwayLineup.startingXI);
        // humanFactor: deterministyczny chaos — offset rośnie per-wywołanie, więc każda "bitwa" jest inna,
        // ale wyniki są powtarzalne dla tego samego seeda + minuty.
        let _humanFactorCallCount = 0;
        const humanFactor = () => {
            _humanFactorCallCount++;
            return 0.70 + (seededRng(currentSeed, nextMinute, _humanFactorCallCount * 137) * 0.60);
        };

        const battleCategories: { attrs: (keyof PlayerAttributes)[]; positions: PlayerPosition[] }[] = [
            { attrs: ['stamina'],   positions: [PlayerPosition.MID, PlayerPosition.DEF, PlayerPosition.FWD] },
            { attrs: ['strength'],  positions: [PlayerPosition.DEF, PlayerPosition.MID] },
            { attrs: ['technique'], positions: [PlayerPosition.MID, PlayerPosition.FWD] },
            { attrs: ['pace'],      positions: [PlayerPosition.FWD, PlayerPosition.MID] },
            { attrs: ['passing'],   positions: [PlayerPosition.MID, PlayerPosition.DEF] },
            { attrs: ['vision'],    positions: [PlayerPosition.MID, PlayerPosition.FWD] }
        ];

        let homeWins = 0;
        let awayWins = 0;

        battleCategories.forEach(({ attrs, positions }, i) => {
            const hPwr = getFormationPowerPro(nextHomeLineup.startingXI, ctx.homePlayers, localHomeFatigue, attrs, positions, homeWeatherMod, nextHomeInjuries) * humanFactor();
            const aPwr = getFormationPowerPro(nextAwayLineup.startingXI, ctx.awayPlayers, localAwayFatigue, attrs, positions, awayWeatherMod, nextAwayInjuries) * humanFactor();
            
           // ZMIANA PRO: Rachunek prawdopodobieństwa. Moc to nie gwarancja, to szansa.
            const totalPower = hPwr + aPwr;
            const homeWinProb = hPwr / totalPower;
            const matchChaos = 0.80 + (seededRng(currentSeed, nextMinute, i) * 0.40); // chaos: 0.80–1.20 (mniejsza deklasacja silniejszego)

            if (seededRng(currentSeed, nextMinute, i + 100) * matchChaos < homeWinProb) {
                homeWins++;
                nextMomentum += (1.8 + seededRng(currentSeed, nextMinute, i + 200) * 2.2);
            } else {
                awayWins++;
                nextMomentum -= (1.8 + seededRng(currentSeed, nextMinute, i + 300) * 2.2);
            }
        });

 if (homeWins >= 5) {
            nextMomentum += 12; // Nagły skok - zamknięcie rywala w "zamku"
            if (Math.random() < 0.3) updatedLogs = [{ id: `burst_h_${nextMinute}`, minute: nextMinute, text: ` ${ctx.homeClub.shortName} całkowicie kontroluje środek pola!`, type: MatchEventType.PRESSURE, teamSide: 'HOME' }, ...updatedLogs];
        } else if (awayWins >= 5) {
            nextMomentum -= 12;
            if (Math.random() < 0.3) updatedLogs = [{ id: `burst_a_${nextMinute}`, minute: nextMinute, text: ` ${ctx.awayClub.shortName} narzuca mordercze tempo gry!`, type: MatchEventType.PRESSURE, teamSide: 'AWAY' }, ...updatedLogs];
        }

        // === ZMĘCZENIE DEF → momentum dla rywala ===
        // Zmęczony obrońca nie nadaza za napastnikiem — każdy punkt poniżej 80 = 0.15 momentum dla rywala
        // (było 0.08 — za małe przy lekkich kontuzjach, teraz wyraźnie odczuwalne)
        const homeDefFatigue = getAvgPosFatigue(nextHomeLineup.startingXI, ctx.homePlayers, localHomeFatigue, PlayerPosition.DEF);
        const awayDefFatigue = getAvgPosFatigue(nextAwayLineup.startingXI, ctx.awayPlayers, localAwayFatigue, PlayerPosition.DEF);
        if (homeDefFatigue < 80) nextMomentum -= (80 - homeDefFatigue) * 0.15; // AWAY dostaje momentum
        if (awayDefFatigue < 80) nextMomentum += (80 - awayDefFatigue) * 0.15; // HOME dostaje momentum

        // MIEJSCE A: wyrównana walka - nikt nie dominuje
        if (homeWins < 5 && awayWins < 5 && Math.random() < 0.30) {
            const midRoll = seededRng(currentSeed, nextMinute, 1111);
            const midEventType = midRoll < 0.4
                ? MatchEventType.MISPLACED_PASS
                : midRoll < 0.7
                ? MatchEventType.PLAY_BACK
                : MatchEventType.PLAY_LEFT;
            const midPool = MATCH_COMMENTARY_DB[midEventType] || [];
            if (midPool.length > 0) {
                const midComment = midPool[Math.floor(seededRng(currentSeed, nextMinute, 2222) * midPool.length)];
                updatedLogs = [{ 
                    id: `mid_${nextMinute}`, 
                    minute: nextMinute, 
                    text: midComment, 
                    type: midEventType, 
                    teamSide: eventSide 
                }, ...updatedLogs];
            }
        }

        if (homeWins === awayWins) {
            // Remis w bitwach — losujemy stronę aby zachować symetrię (50/50)
            eventSide = seededRng(currentSeed, nextMinute, 201) < 0.5 ? 'HOME' : 'AWAY';
        } else {
            eventSide = homeWins > awayWins ? 'HOME' : 'AWAY';
        }
        // --- FAZA 2: PROGRESJA ATAKU (5-12 RZUTÓW) ---
        ///const diceRolls = 5 + Math.floor(seededRng(currentSeed, nextMinute, 444) * 1.2);

        // LOSOWY MULTIPLIKATOR: od 0.5 do 1.2
const diceMultiplier = 0.5 + seededRng(currentSeed, nextMinute, 444) * 0.7;

// DiceRolls nadal bazuje na „5 + [losowe]”, ale teraz skaluje się w zakresie 0.5–1.2
const diceRolls = 5 + Math.floor(seededRng(currentSeed, nextMinute, 445) * 2.0 * diceMultiplier);



        let successfulPasses = 0;
        
        for (let i = 0; i < diceRolls; i++) {
            const attPwr = getFormationPowerPro(eventSide === 'HOME' ? nextHomeLineup.startingXI : nextAwayLineup.startingXI, eventSide === 'HOME' ? ctx.homePlayers : ctx.awayPlayers, eventSide === 'HOME' ? localHomeFatigue : localAwayFatigue, ['attacking', 'passing'], [PlayerPosition.MID, PlayerPosition.FWD], eventSide === 'HOME' ? homeWeatherMod : awayWeatherMod, eventSide === 'HOME' ? nextHomeInjuries : nextAwayInjuries);
            const defPwr = getFormationPowerPro(eventSide === 'HOME' ? nextAwayLineup.startingXI : nextHomeLineup.startingXI, eventSide === 'HOME' ? ctx.awayPlayers : ctx.homePlayers, eventSide === 'HOME' ? localAwayFatigue : localHomeFatigue, ['defending', 'positioning'], [PlayerPosition.DEF, PlayerPosition.MID, PlayerPosition.GK], eventSide === 'HOME' ? awayWeatherMod : homeWeatherMod, eventSide === 'HOME' ? nextAwayInjuries : nextHomeInjuries);
            
            if ((attPwr * humanFactor()) > (defPwr * humanFactor())) {
                successfulPasses++;
                // Szybsza ucieczka paska przy udanych podaniach
                nextMomentum += (eventSide === 'HOME' ? 1.8 : -1.8);
            }
        } 

        // === ZMĘCZENIE MID → mniej udanych podań ===
        // Zmęczony pomocnik gubi podania — każde 10 pkt poniżej 80 kradnie ~7% udanych podań
        const attMidFatigue = getAvgPosFatigue(
            eventSide === 'HOME' ? nextHomeLineup.startingXI : nextAwayLineup.startingXI,
            eventSide === 'HOME' ? ctx.homePlayers : ctx.awayPlayers,
            eventSide === 'HOME' ? localHomeFatigue : localAwayFatigue,
            PlayerPosition.MID
        );
        if (attMidFatigue < 80 && successfulPasses > 0) {
            // spillRatio: było 0.70 — za łagodne przy kontuzjach pomocników
            const spillRatio = Math.max(0, (80 - attMidFatigue) / 100) * 0.85;
            successfulPasses = Math.max(0, successfulPasses - Math.floor(successfulPasses * spillRatio));
        }

        const interceptRoll = seededRng(currentSeed, nextMinute, 555);
        if (interceptRoll < 0.15 && successfulPasses < (diceRolls * 0.4)) {
            // Obrona przejęła piłkę - gwałtowny odwrót momentum (Kontra!)
            nextMomentum = (eventSide === 'HOME' ? -15 : 15);
            updatedLogs = [{ id: `intercept_${nextMinute}`, minute: nextMinute, text: `Genialny przechwyt i błyskawiczna kontra ${eventSide === 'HOME' ? ctx.awayClub.shortName : ctx.homeClub.shortName}!`, type: MatchEventType.MIDFIELD_CONTROL, teamSide: eventSide === 'HOME' ? 'AWAY' : 'HOME' }, ...updatedLogs];
            successfulPasses = 0; // Przerwij strzał w tej minucie

            // Dodatkowy komentarz przy przechwycie (MIEJSCE B — połączone z MIEJSCEM A, bez duplikatu)
            const interceptEventRoll = seededRng(currentSeed, nextMinute, 3333);
            const interceptEventType = interceptEventRoll < 0.4
                ? MatchEventType.FOUL
                : interceptEventRoll < 0.7
                ? MatchEventType.FREE_KICK
                : MatchEventType.THROW_IN;
            const interceptPool = MATCH_COMMENTARY_DB[interceptEventType] || [];
            if (interceptPool.length > 0) {
                const interceptComment = interceptPool[Math.floor(seededRng(currentSeed, nextMinute, 4444) * interceptPool.length)];
                updatedLogs = [{ 
                    id: `intercept_ev_${nextMinute}`, 
                    minute: nextMinute, 
                    text: interceptComment, 
                    type: interceptEventType, 
                    teamSide: eventSide === 'HOME' ? 'AWAY' : 'HOME' 
                }, ...updatedLogs];
            }
        }


        // Dynamiczny próg strzału: im większa przewaga na pasku, tym łatwiej o strzał (od 0.55 do 0.40)
 // Kierunkowy momentum: bonus obniża próg tylko dla strony dominującej
        // HOME dominuje (dodatni) → obniża próg HOME | AWAY dominuje (ujemny) → obniża próg AWAY
        const directionalMomentum = eventSide === 'HOME' ? Math.max(0, nextMomentum) : Math.max(0, -nextMomentum);
        const momentumBonus = directionalMomentum / 250;


 // REKALIBRACJA PRO: Obniżamy bazowy próg z 0.55 na 0.42. 
        // Przy równych siłach szansa na wejście w pole karne rośnie z ~37% do ~65%.
        const activeBaseThreshold = eventSide === 'HOME' ? homeProgressionThreshold : awayProgressionThreshold;
       let dynamicThreshold = Math.max(0.25, (activeBaseThreshold - momentumBonus) * 1.05);
// Podnosimy szanse słabszej drużyny (underdog) o ~15% poprzez obniżenie progu
const isUnderdog = eventSide === 'HOME' ? powerDiff < 0 : powerDiff > 0;
const undedogThresholdMultiplier = isUnderdog ? 0.85 : 1.0;
dynamicThreshold *= undedogThresholdMultiplier;

        // Kontra słabszej drużyny vs ofensywna taktyka rywala:
        // Jeśli atakuje underdog, a broniący rywal gra OFFENSIVE / FAST → otwarte przestrzenie → bonus kontry
        if (isUnderdog) {
            const defenderSide = eventSide === 'HOME' ? 'AWAY' : 'HOME';
            const defMindset = defenderSide === userSide ? prev.userInstructions.mindset : (currentAiShout?.mindset || 'NEUTRAL');
            const defTempo = defenderSide === userSide ? prev.userInstructions.tempo : (currentAiShout?.tempo || 'NORMAL');
            let counterBonus = 0;
            if (defMindset === 'OFFENSIVE') counterBonus += 0.04;
            if (defTempo === 'FAST') counterBonus += 0.03;
            if (counterBonus > 0) dynamicThreshold = Math.max(0.20, dynamicThreshold - counterBonus);
            // Ekstra bonus kontry dla Tier3/4 atakującego Tier1 — walka o każdy centymetr boiska
            const attackingClubRep = eventSide === 'HOME' ? ctx.homeClub.reputation : ctx.awayClub.reputation;
            const defendingClubRep = eventSide === 'HOME' ? ctx.awayClub.reputation : ctx.homeClub.reputation;
            if (attackingClubRep <= 5 && defendingClubRep >= 8) {
                const extraCounterBonus = 0.05 + seededRng(currentSeed, nextMinute, 4242) * 0.05; // 5–10%
                dynamicThreshold = Math.max(0.20, dynamicThreshold - extraCounterBonus);
            }
        }

        // Podłączenie pActionMod gracza: FAST obniża próg ~4.7%, SLOW podnosi ~5.3%, AGGRESSIVE daje mały bonus
        // Działa tylko gdy atakuje strona gracza (eventSide === userSide)
        if (eventSide === userSide && pActionMod !== 1.0) {
           dynamicThreshold = Math.max(0.25, dynamicThreshold * (1.0 / pActionMod));
        }

        if (eventSide === aiSide) {
           // aiAdvantageFactor: bonus kontry taktycznej (ALL-IN vs TRAP)
           // aiGoalThresholdBoost: kara za ofensywę gracza (pRiskMod) — obniża próg AI
           dynamicThreshold *= (1.5 - (coachEfficiency * 0.5)) / aiAdvantageFactor;
           dynamicThreshold = Math.max(0.25, dynamicThreshold - aiGoalThresholdBoost);
        }

        const timeSinceGoal = nextMinute - nextLastGoalBoostMinute;
        const goalDiff = Math.abs(hScore - aScore);
        const leads = (eventSide === 'HOME' && hScore > aScore) || (eventSide === 'AWAY' && aScore > hScore);

           // 1. Logika Nasycenia (PRO): zaczyna od 2:0, łagodna krzywa bez twardego blokowania.
        // goalDiff=2 → ×1.17 | diff=3 → ×1.34 | diff=4 → ×1.51 | diff=5+ → cap 0.95
        if (leads && goalDiff >= 2) {
            const satietyFactor = 1 + (goalDiff - 1) * 0.17;
            dynamicThreshold = Math.min(0.95, dynamicThreshold * satietyFactor);
            // --- BOOST: bezpośredni losowy wzrost momentum rywala po 5. bramce ---
            if (goalDiff >= 5) {
                const momentumBoost = 18 + Math.random() * 12; // 18–30
                if (eventSide === 'HOME') {
                    nextMomentum = Math.max(nextMomentum - momentumBoost, -100);
                } else {
                    nextMomentum = Math.min(nextMomentum + momentumBoost, 100);
                }
            }
        }

        // 2. Underdog Desperation (PRO): Silne pchnięcie dla przegrywającego, by wymuszać bramki.
        if (!leads && goalDiff >= 2) {
         const desperationBoost = Math.max(0.65, 1 - (goalDiff * 0.18));
            dynamicThreshold *= desperationBoost;
        }

        // Post-Goal Suppression: jeden spójny system (4-8 minut, 2-20%), zamiast dwóch nakładających się
        if (timeSinceGoal < nextPostGoalSuppressionDuration) {
           dynamicThreshold *= (1 + nextPostGoalPenaltyPct);
        }
       
       const currentThreshold = dynamicThreshold;
        if (!isCoolingDown && successfulPasses / diceRolls > currentThreshold) {
            const attTeam = eventSide === 'HOME' ? ctx.homePlayers : ctx.awayPlayers;
            const defTeam = eventSide === 'HOME' ? ctx.awayPlayers : ctx.homePlayers;
            const attLineup = eventSide === 'HOME' ? nextHomeLineup.startingXI : nextAwayLineup.startingXI;
            const defLineup = eventSide === 'HOME' ? nextAwayLineup.startingXI : nextHomeLineup.startingXI;

            const scorer = GoalAttributionService.pickScorer(attTeam, attLineup as string[], false, () => seededRng(currentSeed, nextMinute, 777));
            if (!scorer) return { ...prev, minute: nextMinute };
            const keeper = defTeam.find(p => p.id === defLineup[0]) || defTeam[0];

            const isRealKeeper = keeper.position === PlayerPosition.GK;

            const randomShot = 0.85 + seededRng(currentSeed, nextMinute, 8801) * 0.3; // zakres 0.85–1.15
            // Zmęczenie napastnika obniża celność strzału: cond=100→1.0, cond=80→0.87, cond=50→0.65
            const scorerFatigue = (eventSide === 'HOME' ? localHomeFatigue : localAwayFatigue)[scorer.id] ?? scorer.condition;
            // Floor 0.38 zamiast 0.50: kontuzjowany strzelec nie strzela pełną siłą
            const scorerFatigueMod = Math.max(0.38, scorerFatigue / 100);
            const shotPower = (scorer.attributes.finishing * 0.8 + scorer.attributes.dribbling * 0.2) * humanFactor() * 0.88 * randomShot * scorerFatigueMod;
            
            // Zmęczenie bramkarza obniża reflexy i decyzyjność przy wyjściu:
            // cond=100→1.00, cond=80→0.88, cond=60→0.76, cond=40→0.64 (nie spada poniżej 0.55)
            const defFatigueMap = eventSide === 'HOME' ? localAwayFatigue : localHomeFatigue;
            const keeperFatigue = defFatigueMap[keeper.id] ?? keeper.condition;
            const keeperFatigueMod = isRealKeeper ? Math.max(0.55, 0.40 + (keeperFatigue / 100) * 0.60) : 1.0;
            // Jeśli w bramce stoi gracz z pola, jego savePower jest niemal zerowy
            let savePower = (keeper.attributes.goalkeeping * 0.8 + keeper.attributes.positioning * 0.2) * (0.85 + (seededRng(currentSeed, nextMinute, 999) * 0.25)) * keeperFatigueMod;
            if (!isRealKeeper) savePower *= 0.18;

 if (env.weather.description.toLowerCase().includes('deszcz') && scorer.attributes.technique < 50) {
                if (seededRng(currentSeed, nextMinute, 123) < 0.22) { // 22% szansy na kiks przy słabej technice
                    updatedLogs = [{ id: `rain_kiks_${nextMinute}`, minute: nextMinute, text: `Piłka uciekła ${scorer.lastName} na mokrej trawie! Co za fatalny kiks!`, type: MatchEventType.BLUNDER, teamSide: eventSide }, ...updatedLogs];
                    nextMomentum += (eventSide === 'HOME' ? -10 : 10);
                    return { ...prev, minute: nextMinute, momentum: nextMomentum, logs: updatedLogs }; // Przerwij akcję strzału
        
            }
        }

        const wasPenaltyThisMinute = updatedLogs.some(log => log.minute === nextMinute && (
  log.type === MatchEventType.PENALTY_AWARDED ||
  log.type === MatchEventType.GOAL ||
  log.type === MatchEventType.PENALTY_MISSED
));
        // Współczynnik konwersji probabilistyczny: nawet dominujący napastnik nie strzela za każdym razem.
        // Tier 1 (fin~75) vs Tier 4 GK (gk~45) → ~42% | Tier 1 vs Tier 1 GK → ~35% | Tier 4 vs Tier 1 GK → ~27%
        const shootingClubRep = eventSide === 'HOME' ? ctx.homeClub.reputation : ctx.awayClub.reputation;
        let luckyBonus = 0;
        if (shootingClubRep <= 7) {
            // "Strzał życia" — rzadki losowy bonus dla drużyn Tier 2/3/4
            // Tier 4 (rep≤3): 18% szans | Tier 3 (rep 4-5): 13% | Tier 2 (rep 6-7): 8%
            const luckActivationRoll = seededRng(currentSeed, nextMinute, 7171);
            const luckChance = shootingClubRep <= 3 ? 0.18 : shootingClubRep <= 5 ? 0.13 : 0.08;
            if (luckActivationRoll < luckChance) {
                // Bonus 1%–50%: rozkład z przewagą małych wartości (pow 0.6), rzadko duże
                const bonusMagnitude = seededRng(currentSeed, nextMinute, 7172);
                luckyBonus = 0.01 + Math.pow(bonusMagnitude, 0.6) * 0.49;
            }
        }
        // Dynamiczny mnożnik konwersji zależny od stosunku sił atakującego vs broniącego.
        // Równe drużyny (ratio≈1.0) → mult=0.62 → ~31% konwersji przy shot≈save
        // Duża dysproporcja (ratio≥1.4, Tier1 vs Tier4) → cap mult=0.44 → ~28% konwersji
        // BUGFIX: pPower=GRACZ, aPower=AI — przeliczamy na rzeczywiste HOME/AWAY
        const homePwr = userSide === 'HOME' ? pPower : aPower;
        const awayPwr = userSide === 'AWAY' ? pPower : aPower;
        const attackingPwr = eventSide === 'HOME' ? homePwr : awayPwr;
        const defendingPwr = eventSide === 'HOME' ? awayPwr : homePwr;
        const powerRatio = Math.min(1.5, attackingPwr / Math.max(1, defendingPwr));
        const baseConversionMult = Math.max(0.44, 0.62 - (powerRatio - 1.0) * 0.45);
        // Współczynnik nasycenia bramkowego — progresywny spadek skuteczności atakującego lidera.
        // Działa tylko dla strony która prowadzi o > 1 bramkę.
        // diff=2 → ×0.82 | diff=3 → ×0.65 | diff=4 → ×0.50 | diff=5 → ×0.37 | diff=6 → ×0.25 | diff=7+ → prob cap 0.01
        const attackingScore = eventSide === 'HOME' ? hScore : aScore;
        const defendingScore = eventSide === 'HOME' ? aScore : hScore;
        const leadDiff = attackingScore - defendingScore;
        let satietyMult = 1.0;
        if (leadDiff >= 7) {
            satietyMult = 0.0; // prob zostanie ucięte do 0.01 przez cap poniżej
        } else if (leadDiff >= 2) {
            satietyMult = Math.pow(0.815, leadDiff - 1); // diff=2→0.81, 3→0.67, 4→0.54, 5→0.44, 6→0.36
        }
        const rawGoalProbability = (shotPower / (shotPower + savePower)) * baseConversionMult * satietyMult + luckyBonus;
        const goalProbability = leadDiff >= 7
            ? Math.min(0.01, rawGoalProbability)
            : Math.min(0.90, rawGoalProbability);
        const goalRoll = seededRng(currentSeed, nextMinute, 8831);
        // --- DEBUG SNAPSHOT: zapis kalkulacji strzału dla panelu live ---
        liveDebugStatsRef.current = [...liveDebugStatsRef.current.slice(-79), {
          minute: nextMinute, side: eventSide,
          shotPower: parseFloat(shotPower.toFixed(2)),
          savePower: parseFloat(savePower.toFixed(2)),
          goalProbability: parseFloat(goalProbability.toFixed(4)),
          goalRoll: parseFloat(goalRoll.toFixed(4)),
          isGoal: goalRoll < goalProbability && !wasPenaltyThisMinute,
          luckyBonus: parseFloat(luckyBonus.toFixed(4)),
          homeThreshold: parseFloat(homeProgressionThreshold.toFixed(4)),
          awayThreshold: parseFloat(awayProgressionThreshold.toFixed(4)),
          dynamicThreshold: parseFloat(currentThreshold.toFixed(4)),
          successPasses: successfulPasses,
          diceRolls,
          pPower: Math.round(pPower),
          aPower: Math.round(aPower),
        }];
         if (goalRoll < goalProbability && !wasPenaltyThisMinute) {
         
         
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
                   nextComebackPower = 2 + (seededRng(currentSeed, nextMinute, 8803) * 8);
                   nextComebackExpiry = nextMinute + 2 + Math.floor(seededRng(currentSeed, nextMinute, 8804) * 6);
                   nextComebackSide = eventSide;
                   updatedLogs = [{ id: `comeback_${nextMinute}`, minute: nextMinute, text: `BRAMKA KONTAKTOWA! ${eventSide === 'HOME' ? ctx.homeClub.shortName : ctx.awayClub.shortName} łapie wiatr w żagle!`, type: MatchEventType.PRESSURE, teamSide: eventSide }, ...updatedLogs];
                }

                nextMomentum = 0;
                nextLastGoalBoostMinute = nextMinute;
                nextIsPaused = true; // Pauza 3 sekundy — wznowienie przez useEffect

                const isEquivalent = Math.abs(pPower - aPower) < 25;
                nextPostGoalSuppressionDuration = isEquivalent
                    ? 4 + Math.floor(Math.random() * 5)   // 4–8 min — mecze równe
                    : 7 + Math.floor(Math.random() * 6);  // 7–12 min — duża dysproporcja: faworyt trzyma piłkę

                if (isEquivalent) {
                   nextPostGoalPenaltyPct = 0.10 + (Math.random() * 0.10); // 10–20%
                } else {
                   nextPostGoalPenaltyPct = 0.13 + (Math.random() * 0.10); // 13–23% — silniejszy nie naciska od razu
                }
           } else {

// HEROIC SAVE TIER 4
if (keeper.tier === 4 && seededRng(currentSeed, nextMinute, 8802) < 0.13) { // 13% szansy na super interwencję
    eventType = MatchEventType.ONE_ON_ONE_SAVE;
    nextMomentum += (eventSide === 'HOME' ? -15 : 15);
}

                const saveRoll = seededRng(currentSeed, nextMinute, 7777);
                if (saveRoll < 0.12) {
                    eventType = MatchEventType.SHOT_POST;
                } else if (saveRoll < 0.22) {
                    eventType = MatchEventType.SHOT_BAR;
                } else if (saveRoll < 0.45) {
                    eventType = MatchEventType.ONE_ON_ONE_SAVE;
                } else {
                    eventType = MatchEventType.SHOT_ON_TARGET;
                }
                nextMomentum += (eventSide === 'HOME' ? -8 : 8);
            }

           const pool = MATCH_COMMENTARY_DB[eventType] || ["Akcja podbramkowa!"];
            const comment = pool[Math.floor(seededRng(currentSeed, nextMinute, 99) * pool.length)].replace("{Nazwisko}", scorer.lastName);
            updatedLogs = [{ id: `pro_${nextMinute}`, minute: nextMinute, text: `[${eventSide === 'HOME' ? ctx.homeClub.shortName : ctx.awayClub.shortName}] ${comment}`, type: eventType, teamSide: eventSide, playerName: scorer.lastName }, ...updatedLogs];
        
        } else {
            // MIEJSCE C: atak zatrzymany przed polem karnym
            const noShotRoll = seededRng(currentSeed, nextMinute, 5555);
            const noShotEventType = noShotRoll < 0.25
                ? MatchEventType.OFFSIDE
                : noShotRoll < 0.45
                ? MatchEventType.CORNER
                : noShotRoll < 0.65
                ? MatchEventType.WINGER_STOPPED
                : noShotRoll < 0.80
                ? MatchEventType.DRIBBLING
                : MatchEventType.PLAY_SIDE;
            const noShotPool = MATCH_COMMENTARY_DB[noShotEventType] || [];
            if (noShotPool.length > 0) {
                const noShotComment = noShotPool[Math.floor(seededRng(currentSeed, nextMinute, 6666) * noShotPool.length)]
                    .replace("{Nazwisko}", "");
                updatedLogs = [{ 
                    id: `noshot_${nextMinute}`, 
                    minute: nextMinute, 
                    text: noShotComment, 
                    type: noShotEventType, 
                    teamSide: eventSide 
                }, ...updatedLogs];

        }

        // === CUP UPSET: Słabsza drużyna zawsze ma minimalną szansę na akcję bramkową ===
        // Działa dla OBIE stron (gracz i AI) — słabsza drużyna niezależnie od strony
        //   gap=1.4 (T2-weak vs T1) → 5.7%/min akcji, 14% gola z akcji → ~16% gol/mecz
        //   gap=1.8 (T3 vs T1)      → 4.4%/min akcji, 11% gola z akcji → ~16% gol/mecz
        //   gap=2.7 (T4 vs T1)      → 3.0%/min akcji,  7% gola z akcji → ~7% gol/mecz
        {
            const upsetAttPwr = getFormationPowerPro(
                eventSide === 'HOME' ? nextHomeLineup.startingXI : nextAwayLineup.startingXI,
                eventSide === 'HOME' ? ctx.homePlayers : ctx.awayPlayers,
                eventSide === 'HOME' ? localHomeFatigue : localAwayFatigue,
                ['attacking', 'finishing'],
                [PlayerPosition.FWD, PlayerPosition.MID],
                eventSide === 'HOME' ? homeWeatherMod : awayWeatherMod,
                eventSide === 'HOME' ? nextHomeInjuries : nextAwayInjuries
            );
            const upsetDefPwr = getFormationPowerPro(
                eventSide === 'HOME' ? nextAwayLineup.startingXI : nextHomeLineup.startingXI,
                eventSide === 'HOME' ? ctx.awayPlayers : ctx.homePlayers,
                eventSide === 'HOME' ? localAwayFatigue : localHomeFatigue,
                ['defending', 'positioning'],
                [PlayerPosition.DEF, PlayerPosition.MID, PlayerPosition.GK],
                eventSide === 'HOME' ? awayWeatherMod : homeWeatherMod,
                eventSide === 'HOME' ? nextAwayInjuries : nextHomeInjuries
            );
            const upsetPowerGap = upsetDefPwr / Math.max(1, upsetAttPwr);

            if (upsetPowerGap > 1.4) {
                const upsetActionChance = Math.min(0.08, 0.011 / upsetPowerGap);
                if (seededRng(currentSeed, nextMinute, 9991) < upsetActionChance) {
                    const upsetAttTeam = eventSide === 'HOME' ? ctx.homePlayers : ctx.awayPlayers;
                    const upsetAttLineup = (eventSide === 'HOME' ? nextHomeLineup : nextAwayLineup).startingXI;
                    const upsetScorer = GoalAttributionService.pickScorer(upsetAttTeam, upsetAttLineup as string[], false, () => seededRng(currentSeed, nextMinute, 9992));
                    if (upsetScorer) {
                        // Konwersja na gola spada wraz z rosnącą przewagą obrony
                        const goalConvRate = Math.max(0.08, 0.23 / upsetPowerGap);
                        if (seededRng(currentSeed, nextMinute, 9993) < goalConvRate) {
                            eventType = MatchEventType.GOAL;
                            const formattedName = `${upsetScorer.firstName.charAt(0)}. ${upsetScorer.lastName}`;
                            currentScorerName = formattedName;
                            const goalData = { playerName: formattedName, minute: nextMinute, isPenalty: false };
                            if (eventSide === 'HOME') { hScore++; updatedHomeGoals.push(goalData); }
                            else { aScore++; updatedAwayGoals.push(goalData); }
                            nextLastGoalBoostMinute = nextMinute;
                            nextPostGoalSuppressionDuration = 4 + Math.floor(Math.random() * 5);
                            nextPostGoalPenaltyPct = 0.10 + (Math.random() * 0.10);
                            const upsetGoalTexts = [
                                `SENSACJA! ${upsetScorer.lastName} wykorzystuje błąd obrony i strzela!`,
                                `Niespodziewane! ${upsetScorer.lastName} przebija się i pokonuje bramkarza!`,
                                `Co za gol! ${upsetScorer.lastName} strzela nie do obronienia!`,
                            ];
                            updatedLogs = [{ id: `upset_${nextMinute}`, minute: nextMinute, text: `⚡ [${eventSide === 'HOME' ? ctx.homeClub.shortName : ctx.awayClub.shortName}] ${upsetGoalTexts[Math.floor(seededRng(currentSeed, nextMinute, 9994) * upsetGoalTexts.length)]}`, type: MatchEventType.GOAL, teamSide: eventSide, playerName: upsetScorer.lastName }, ...updatedLogs];
                        } else {
                            const upsetShotTexts = [
                                `Niespodziewana akcja! ${upsetScorer.lastName} wychodzi sam na sam — bramkarz interweniuje!`,
                                `Kontra! ${upsetScorer.lastName} strzela z ostrego kąta — bramkarz blokuje!`,
                                `${upsetScorer.lastName} dośrodkowuje, strzał — udana obrona!`,
                            ];
                            updatedLogs = [{ id: `upset_shot_${nextMinute}`, minute: nextMinute, text: `⚡ [${eventSide === 'HOME' ? ctx.homeClub.shortName : ctx.awayClub.shortName}] ${upsetShotTexts[Math.floor(seededRng(currentSeed, nextMinute, 9995) * upsetShotTexts.length)]}`, type: MatchEventType.SHOT_ON_TARGET, teamSide: eventSide, playerName: upsetScorer.lastName }, ...updatedLogs];
                        }
                    }
                }
            }
        }
          }

        // POPRAWKA SPÓJNOŚCI: po golu momentum zeruje się natychmiast, bez wygładzania
        if (eventType === MatchEventType.GOAL) {
            nextMomentum = 0;
        } else {
            nextMomentum = MomentumServiceCup.computeMomentum(ctx, { ...prev, homeLineup: nextHomeLineup, awayLineup: nextAwayLineup }, eventType ?? MatchEventType.GENERIC, eventSide);
            // Wygładzanie momentum — zapobiega szarpaniu wyniku (tylko dla nie-goli)
            const momentumChange = nextMomentum - prev.momentum;
            const cupVolatility = 0.28;
            nextMomentum = prev.momentum + (momentumChange * cupVolatility);
        }
        nextMomentum = Math.max(-95, Math.min(95, nextMomentum));

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
            const impulsePower = 5 + (seededRng(currentSeed, nextMinute, 8805) * 10);
            const direction = prev.userInstructions.mindset === 'OFFENSIVE' ? 1 : (prev.userInstructions.mindset === 'DEFENSIVE' ? -1 : 0);

            if (direction !== 0) {
                tacticalBoostAmt = impulsePower * direction;
                nextTacticalBoost += tacticalBoostAmt;
                // Czas trwania efektu: 5-20 minut
                nextTacticalExpiry = nextMinute + 5 + Math.floor(seededRng(currentSeed, nextMinute, 8806) * 16);
                nextMomentum += tacticalBoostAmt; // Natychmiastowy skok
               updatedLogs = [{ id: `impulse_${nextMinute}`, minute: nextMinute, text: `Przeciwnik gwałtownie zmienia rytm gry!`, type: MatchEventType.GENERIC, teamSide: userSide }, ...updatedLogs];
            }
        }

        // 2. Mechanizm ZWROTU (Revert) - jeśli czas minął, zabieramy dodany bonus
        if (nextMinute === nextTacticalExpiry && nextTacticalBoost !== 0) {
            nextMomentum -= nextTacticalBoost; // Oddajemy dług do Momentum
            nextTacticalBoost = 0; 
            nextTacticalExpiry = 0;
            updatedLogs = [{ id: `revert_${nextMinute}`, minute: nextMinute, text: `Intensywność przeciwnika opadła. Gra wraca do normy.`, type: MatchEventType.GENERIC, teamSide: userSide }, ...updatedLogs];
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
                if (currentIntensity === 'CAUTIOUS') drain *= 0.75; // ostrożna gra → mniej biegu → wolniejsze zmęczenie

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

        // --- APLIKACJA WIATRU W ŻAGLE (COMEBACK BOOST) ---
        // Blok jest poza updateFatigue, by aplikował się RAZ na minutę (nie dwa razy)
        if (nextComebackExpiry > 0 && nextMinute <= nextComebackExpiry) {
            const sideMult = nextComebackSide === 'HOME' ? 1 : -1;
            nextMomentum += (nextComebackPower * sideMult);
            if (nextMinute % 2 === 0) nextMomentum += (2 * sideMult); // wizualny puls
        }

       const aiTeamForCheck = aiSide === 'AWAY' ? nextAwayLineup : nextHomeLineup;
       const aiTeamPlayersForCheck = aiSide === 'AWAY' ? ctx.awayPlayers : ctx.homePlayers;
       const aiSentOffCount = nextSentOffIds.filter(id => aiTeamPlayersForCheck.some(p => p.id === id)).length;
       const aiOnPitchCount = aiTeamForCheck.startingXI.filter(id => id !== null).length;
       const hasEmptySlotsAi = aiOnPitchCount < (11 - aiSentOffCount);
        
        // --- TUTAJ WSTAW TEN KOD (Inteligentny Wyzwalacz Decyzji AI) ---
        // AI reaguje częściej (isPriority), jeśli:
        // 1. Ma pusty slot w składzie
        // 2. Jest końcówka meczu (80min+) i przegrywa jednym golem
        // 3. Jest w dogrywce i nastąpiła zmiana wyniku
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



        const decision = AiMatchDecisionCupService.makeDecisions(
             { ...prev, minute: nextMinute, homeLineup: nextHomeLineup, awayLineup: nextAwayLineup, homeInjuries: nextHomeInjuries, awayInjuries: nextAwayInjuries, homeFatigue: localHomeFatigue, awayFatigue: localAwayFatigue, sentOffIds: nextSentOffIds, lastAiActionMinute: prev.lastAiActionMinute }, 
             ctx, 
             aiSide, 
             isPriority, // ZMIANA: używamy isPriority zamiast isCrisis
             aiCoach,
             playerTacticId,
             aiSensors,  // DODANO: przekazujemy sensory
             aiScoutReport // DODANO: raport zwiadowczy
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

           // Przerwa — podwójna zmiana: lineup i count już zaktualizowane przez subRecord, dodajemy tylko do historii
           if (decision.secondSubRecord) {
              if (aiSide === 'HOME') {
                nextHomeSubsHistory = [...nextHomeSubsHistory, decision.secondSubRecord];
              } else {
                nextAwaySubsHistory = [...nextAwaySubsHistory, decision.secondSubRecord];
              }
           }

           if (decision.newTacticId) {
              if (aiSide === 'HOME') nextHomeLineup.tacticId = decision.newTacticId;
              else nextAwayLineup.tacticId = decision.newTacticId;
           }

           // --- KROK 1: Podpięcie instrukcji operacyjnych serwisu decyzyjnego ---
           // AiMatchDecisionCupService może zwrócić tempo/mindset/intensity (kontra-tempo, red card itp.).
           // Aplikujemy je jako krótki shout nadpisując aktualny stan — serwis jest bardziej reaktywny niż Brain.
           if (decision.newIntensity || decision.newTempo || decision.newMindset) {
              const svcShoutDuration = 8 + Math.floor((aiCoach?.attributes.experience || 50) / 15);
              currentAiShout = {
                 id: `SVC_${nextMinute}`,
                 expiryMinute: nextMinute + svcShoutDuration,
                 mindset: (decision.newMindset || 'NEUTRAL') as any,
                 tempo: (decision.newTempo || 'NORMAL') as any,
                 intensity: (decision.newIntensity || 'NORMAL') as any
              };
              // [SLOT SVC1] - miejsce na przyszłe instrukcje operacyjne serwisu (np. pressing, marking)
           }

           if (decision.logs) {
              decision.logs.forEach(l => {
                 updatedLogs = [{ id: `AI_C_LOG_${Math.random()}`, minute: nextMinute, text: l, type: MatchEventType.GENERIC, teamSide: aiSide }, ...updatedLogs];
              });
           }

           if (decision.subRecord || decision.newTacticId || decision.newTempo || decision.newMindset || decision.newIntensity) {
              nextLastAiActionMinute = nextMinute;
           }
        // --- AKTUALIZACJA LIVESTATYSTYK ---
        const nextLiveStats = {
          home: { ...prev.liveStats.home },
          away: { ...prev.liveStats.away }
        };
        if (eventType === MatchEventType.GOAL || eventType === MatchEventType.SHOT_ON_TARGET || eventType === MatchEventType.ONE_ON_ONE_SAVE) {
          nextLiveStats[eventSide.toLowerCase() as 'home' | 'away'].shots += 1;
          nextLiveStats[eventSide.toLowerCase() as 'home' | 'away'].shotsOnTarget += 1;
        } else if (eventType === MatchEventType.SHOT_POST || eventType === MatchEventType.SHOT_BAR) {
          nextLiveStats[eventSide.toLowerCase() as 'home' | 'away'].shots += 1;
        }
        updatedLogs.forEach(l => {
          if (l.minute === nextMinute && l.teamSide) {
            const side = l.teamSide.toLowerCase() as 'home' | 'away';
            if (l.type === MatchEventType.CORNER)      nextLiveStats[side].corners  += 1;
            if (l.type === MatchEventType.FOUL)        nextLiveStats[side].fouls    += 1;
            if (l.type === MatchEventType.OFFSIDE)     nextLiveStats[side].offsides += 1;
            if (l.type === MatchEventType.YELLOW_CARD) nextLiveStats[side].fouls    += 1;
          }
        });

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
          lastGoalBoostMinute: nextLastGoalBoostMinute,
          isPaused: nextIsPaused,
          isPausedForEvent: nextIsPausedForEvent,
          lastAiActionMinute: nextLastAiActionMinute,
          aiActiveShout: currentAiShout,
          activeTacticalBoost: nextTacticalBoost,
          tacticalBoostExpiry: nextTacticalExpiry,
          // Post-goal state — zapisane poprawnie przez return, bez mutacji prev
          postGoalSuppressionDuration: nextPostGoalSuppressionDuration,
          postGoalPenaltyPct: nextPostGoalPenaltyPct,
          comebackPower: nextComebackPower,
          comebackExpiry: nextComebackExpiry,
          comebackSide: nextComebackSide,
          // Aktualizacja długoterminowego momentum — potrzebne przez AiMatchDecisionCupService
          momentumSum: (prev.momentumSum || 0) + nextMomentum,
          momentumTicks: (prev.momentumTicks || 0) + 1,
          liveStats: nextLiveStats
        };
      });
    }, matchState.speed === 5 ? 80 : matchState.speed === 2.5 ? 240 : 600);

    return () => clearInterval(interval);
  }, [matchState?.isPaused, matchState?.isPausedForEvent, matchState?.isFinished, matchState?.isHalfTime, matchState?.isPenalties, matchState?.speed, ctx, setMatchState, isFinishing, isTacticsOpen, userSide]);

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
      <div className={`w-60 rounded-[35px] border border-white/5 p-2 flex flex-col gap-1 overflow-hidden shadow-2xl backdrop-blur-xl relative z-0`}>
         <div className="flex items-center gap-2 mb-1 px-1">
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
                 <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">USTAWIENIE I TAKTYKA </span>
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
               if (!pid) return null;
               if (matchState.sentOffIds.includes(pid)) return null;
               const p = teamPlayers.find(x => x.id === pid);
               if (!p) return null;

               // TUTAJ WSTAW TEN KOD (Obliczanie spadku kondycji)
               const currentFatigue = matchState[side === 'HOME' ? 'homeFatigue' : 'awayFatigue'][p.id] ?? p.condition;
               const fatigueDrop = Math.max(0, p.condition - currentFatigue).toFixed(1);

               const isLightInj = (side === 'HOME' ? matchState.homeInjuries[p.id] : matchState.awayInjuries[p.id]) === InjurySeverity.LIGHT;

               return (
                 <div key={p.id} className={`flex items-center gap-3 py-0.7 px-0.2 rounded-xs border transition-all ${isLightInj ? 'bg-orange-500/20 border-orange-400/50' : 'bg-white/[0.02] border-white/[0.05]'}`}>
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
            <h5 className="text-[14px] font-black italic text-slate-500 uppercase tracking-widest px-2">ZMIANY</h5>
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
    <div className="h-screen w-full text-slate-100 flex flex-col p-2 gap-2 animate-fade-in overflow-hidden relative selection:bg-rose-500">
    



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
            <div className="flex items-center gap-3">
              <BigJerseyIcon primary={kitColors.home.primary} secondary={kitColors.home.secondary} size="w-20 h-20" />
              <h2 className="text-6xl font-black italic uppercase tracking-tighter drop-shadow-2xl">{ctx.homeClub.name}</h2>
            </div>
            <div className="flex flex-wrap gap-2 mt-1">
              {matchState.homeGoals.map((g, i) => {
                 const fp = ctx.homePlayers.find(px => px.lastName === g.playerName);
                 const gName = fp ? `${fp.firstName.charAt(0)}. ${fp.lastName}` : g.playerName;
                 return (
                   <span key={i} className={`text-[9px] font-bold uppercase italic ${g.isMiss ? 'text-rose-500/80' : 'text-white/60'}`}>
                      {g.isMiss ? '❌' : '⚽'} {gName} {g.minute}'{g.isPenalty ? ' k.' : ''}
                   </span>
                 );
              })}
           {matchState.logs.filter(l => l.teamSide === 'HOME' && l.type === MatchEventType.RED_CARD).map((l, i) => {
                 const fp = ctx.homePlayers.find(px => px.lastName === l.playerName);
                 const lName = fp ? `${fp.firstName.charAt(0)}. ${fp.lastName}` : l.playerName;
                 return <span key={`red-h-${i}`} className="text-[9px] font-black text-red-500 uppercase italic">🟥 {lName} {l.minute}'</span>;
              })}
             
              {matchState.logs.filter(l => l.teamSide === 'HOME' && l.type === MatchEventType.INJURY_SEVERE).map((l, i) => {
                 const fp = ctx.homePlayers.find(px => px.lastName === l.playerName);
                 const lName = fp ? `${fp.firstName.charAt(0)}. ${fp.lastName}` : l.playerName;
                 return <span key={`inj-h-${i}`} className="text-[9px] font-black text-white bg-red-600/40 px-1 rounded uppercase italic"><span className="text-red-500 font-bold animate-pulse">✚ {lName} {l.minute}'</span></span>;
              })}
            </div>
         </div>

        <div className="flex flex-col items-center gap-3 w-80 relative">
            {isCelebratingGoal ? (
               <div className="flex flex-col items-center justify-center animate-pulse-gold">
                  <span className="text-7xl font-black italic text-yellow-500 tracking-tighter drop-shadow-[0_0_30px_rgba(225,29,72,1)]">GOL!</span>
               </div>
            ) : (
               <div className="text-9xl font-black uppercase tracking-tighter tabular-nums flex items-center gap-4 animate-fade-in">
                  {matchState.homeScore} <span className="text-slate-700 opacity-50">&nbsp;&nbsp;&nbsp;&nbsp; </span> {matchState.awayScore}
               </div>
            )}
            {matchState.isPenalties && (
               <div className="text-2xl font-black text-rose-500 animate-pulse">
                  KARNE: {matchState.homePenaltyScore} - {matchState.awayPenaltyScore}
               </div>
            )}
           <div className="absolute flex flex-col items-center gap-1" style={{ bottom: 'calc(100% - 120px)' }}>
               <div className="px-3 py-0.5 bg-black-600/20 border border-yellow-500/30 rounded-xs">
                  <span className="text-3xl font-black text-yellow-500 font-bold tracking-widest">{matchState.minute}</span>
               </div>
               {(matchState.isExtraTime && !matchState.isPenalties) && <span className="text-[8px] font-black text-yellow-400 uppercase tracking-widest animate-pulse">DOGRYWKA</span>}
            </div>
         </div>

         <div className="flex-1 flex flex-col justify-center items-end">
            <div className="flex items-center gap-3 text-right">
              <h2 className="text-6xl font-black italic uppercase tracking-tighter drop-shadow-2xl">{ctx.awayClub.name}</h2>
              <BigJerseyIcon primary={kitColors.away.primary} secondary={kitColors.away.secondary} size="w-20 h-20" />
            </div>
            <div className="flex flex-wrap gap-2 mt-1 justify-end">
              {matchState.awayGoals.map((g, i) => {
                 const fp = ctx.awayPlayers.find(px => px.lastName === g.playerName);
                 const gName = fp ? `${fp.firstName.charAt(0)}. ${fp.lastName}` : g.playerName;
                 return (
                   <span key={i} className={`text-[9px] font-bold uppercase italic ${g.isMiss ? 'text-rose-500/80' : 'text-white/60'}`}>
                      {gName} {g.minute}'{g.isPenalty ? ' k.' : ''} {g.isMiss ? '❌' : '⚽'}
                   </span>
                 );
              })}
            {matchState.logs.filter(l => l.teamSide === 'AWAY' && l.type === MatchEventType.RED_CARD).map((l, i) => {
                 const fp = ctx.awayPlayers.find(px => px.lastName === l.playerName);
                 const lName = fp ? `${fp.firstName.charAt(0)}. ${fp.lastName}` : l.playerName;
                 return <span key={`red-a-${i}`} className="text-[9px] font-black text-red-500 uppercase italic">{lName} {l.minute}' 🟥</span>;
              })}
            
              {matchState.logs.filter(l => l.teamSide === 'AWAY' && l.type === MatchEventType.INJURY_SEVERE).map((l, i) => {
                 const fp = ctx.awayPlayers.find(px => px.lastName === l.playerName);
                 const lName = fp ? `${fp.firstName.charAt(0)}. ${fp.lastName}` : l.playerName;
                 return <span key={`inj-a-${i}`} className="text-[9px] font-black text-white bg-red-600/40 px-1 rounded uppercase italic">{lName} {l.minute}' <span className="text-red-500 font-bold animate-pulse">✚ </span></span>;
              })}
            </div>
         </div>
      </header>

      <div className="flex-1 flex flex-col gap-2 min-w-0 relative">
         
         <div className="h-7 w-full max-w-4xl mx-auto bg-black/40 rounded-full overflow-hidden border border-white/10 flex shadow-2xl shrink-0 p-0.5 backdrop-blur-xl relative">
            <div 
              className="h-full transition-all duration-500 flex items-center justify-end pr-2 text-[11px] font-black rounded-l-full relative overflow-hidden" 
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

         <div className="flex-1 flex gap-3 min-h-0 relative z-10">
            {renderSquad('HOME')}

            <div className="flex-none shrink-0 relative z-20 w-[1150px] h-[800px] mx-auto">
               {penaltyNotice && (
                  <div className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-none" style={{ transform: 'rotateX(-24deg)' }}>
                     <div className="relative flex flex-col items-center gap-3 bg-slate-950/95 backdrop-blur-2xl border-y-4 border-red-500 px-16 py-8 rounded-[40px] shadow-[0_0_120px_rgba(239,68,68,0.7)] animate-pulse">
                        <div className="absolute inset-0 rounded-[40px] pointer-events-none" style={{ boxShadow: 'inset 0 0 60px rgba(239,68,68,0.15)' }} />
                        <span className="text-[10px] font-black text-red-500 tracking-[0.5em] uppercase">Sędzia dyktuje</span>
                        <div className="flex items-center gap-4">
                           <span className="text-5xl filter drop-shadow-[0_0_20px_rgba(239,68,68,0.9)]">🟥</span>
                           <span className="text-6xl font-black italic text-white uppercase tracking-tighter drop-shadow-[0_0_30px_rgba(255,255,255,0.4)]">JEDENASTKA!</span>
                           <span className="text-5xl filter drop-shadow-[0_0_20px_rgba(239,68,68,0.9)]">🟥</span>
                        </div>
                        <span className="text-lg font-black text-red-400 uppercase tracking-[0.3em]">{penaltyNotice.toUpperCase()}</span>
                     </div>
                  </div>
               )}
               {redCardNotice && (
                  <div className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-none" style={{ transform: 'rotateX(-24deg)' }}>
                     <div className="relative flex flex-col items-center gap-3 bg-slate-950/95 backdrop-blur-2xl border-y-4 border-red-600 px-16 py-8 rounded-[40px] shadow-[0_0_120px_rgba(220,38,38,0.8)]">
                        <div className="absolute inset-0 rounded-[40px] pointer-events-none" style={{ boxShadow: 'inset 0 0 60px rgba(220,38,38,0.2)' }} />
                        <span className="text-[10px] font-black text-red-500 tracking-[0.5em] uppercase">Czerwona kartka!</span>
                        <div className="flex items-center gap-4">
                           <span className="text-5xl">🟥</span>
                           <span className="text-5xl font-black italic text-white uppercase tracking-tighter drop-shadow-[0_0_30px_rgba(255,255,255,0.4)]">{redCardNotice}</span>
                           <span className="text-5xl">🟥</span>
                        </div>
                        <span className="text-base font-bold text-red-400 uppercase tracking-widest">OPUSZCZA BOISKO!</span>
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

<div className="w-full h-full rounded-[0px] border-1 border-emerald-900/1 relative flex items-center justify-center" style={{ transform: 'scale(0.7) translateY(-200px)' }}>
  <div className="absolute inset-0 rounded-[0.7px]"
    style={{
      background: '#064c2f',
      backgroundImage: 'repeating-linear-gradient(to bottom, transparent, transparent 5%, rgba(255,255,255,0.015) 12%, rgba(255,255,255,0.015) 24%)',
      transform: 'perspective(950px) rotateX(24deg)',
      transformOrigin: 'center center',
      transformStyle: 'preserve-3d',
      opacity: 0.5  
    }}
  ></div>
  
  <div className="absolute inset-0 pointer-events-none opacity-50 rounded-[36px]" 
    style={{ 
      padding: '16px',
      transform: 'perspective(950px) rotateX(24deg)',
      transformOrigin: 'center center',
      transformStyle: 'preserve-3d',
      pointerEvents: 'none'
    }}>
    <div className="absolute top-4 left-4 right-4 bottom-4 border-2 border-white/70" />
    <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-white/70 -translate-y-1/2" />
    
        <div className="absolute top-1/2 left-1/2 w-52 h-52 border-2 border-white/70 rounded-full -translate-x-1/2 -translate-y-1/2" />
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
      <span className="text-[10px] font-black text-red-500 tracking-[0.5em] mb-2 uppercase block">KONIECZNA ZMIANA</span>
      <h2 className="text-4xl font-black italic text-white uppercase tracking-tight drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
        KONTUZJA W DRUŻYNIE<br/>LEKARZE NA BOISKU.
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

{/* ================================================ */}
{/* KOMENTARZ NA ŚRODKU BOISKA                        */}
{/* Kolory kitu drużyny, znika podczas przerw/końca   */}
{/* ================================================ */}
{/* KOMENTARZ NA ŚRODKU BOISKA */}
{pitchCommentary && !matchState.isHalfTime && !matchState.isFinished && !matchState.isPenalties && !matchState.isPaused && kitColors && (
  <div
    className="absolute inset-0 z-[35] flex items-center justify-center pointer-events-none"
    style={{ transform: 'rotateX(-24deg)' }}
  >
    <div
      key={pitchCommentary.text}
      className="w-[100%] px-10 py-5 rounded-[18px] backdrop-blur-xl animate-slide-up"
      style={{
        backgroundColor: pitchCommentary.side === 'HOME'
          ? `${kitColors.home.primary}cc`
          : pitchCommentary.side === 'AWAY'
          ? `${kitColors.away.primary}cc`
          : 'rgba(15,23,42,0.85)',
        border: `2px solid ${pitchCommentary.side === 'HOME'
          ? kitColors.home.secondary
          : pitchCommentary.side === 'AWAY'
          ? kitColors.away.secondary
          : 'rgba(255,255,255,0.15)'}99`,
        boxShadow: `0 0 60px ${pitchCommentary.side === 'HOME'
          ? kitColors.home.primary
          : pitchCommentary.side === 'AWAY'
          ? kitColors.away.primary
          : '#000'}44`,
      }}
    >
      
      <p
        className="text-center text-4xl font-black italic uppercase tracking-tight leading-snug"
        style={{
          color: pitchCommentary.side === 'HOME'
            ? kitColors.home.text
            : pitchCommentary.side === 'AWAY'
            ? kitColors.away.text
            : 'white'
        }}
      >
        {pitchCommentary.text}
      </p>
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
          transform: 'translate(-50%, calc(-50% + 30px)) scale(1.15)',
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
          transform: 'translate(-50%, calc(-50% + 20px)) scale(1.4)'
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
<footer className="h-36 flex justify-center items-center gap-4 px-2 pb-1 relative -top-6">

      </footer>



        {/* PANEL HISTORII KOMENTARZA */}
{isCommentaryOpen && (
  <div className="fixed right-4 top-4 bottom-4 z-50 w-[380px] pointer-events-auto flex flex-col">
    <div className="flex-1 bg-slate-950/97 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 shrink-0">
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">Historia komentarza</span>
        <button onClick={() => setIsCommentaryOpen(false)} className="text-slate-500 hover:text-white text-xs font-black transition-colors">✕</button>
      </div>
      <div className="overflow-y-auto custom-scrollbar flex-1 px-3 py-3 space-y-1">
        {matchState.logs.map((log, i) => {
          const isHome = log.teamSide === 'HOME';
          const isAway = log.teamSide === 'AWAY';
          const isGoal = log.type === MatchEventType.GOAL;
          const isRed = log.type === MatchEventType.RED_CARD;
          const isYellow = log.type === MatchEventType.YELLOW_CARD;
          const isSevere = log.type === MatchEventType.INJURY_SEVERE;

          const rowBg = isHome
            ? 'bg-blue-900/30 border-l-2 border-blue-500/60'
            : isAway
            ? 'bg-rose-900/30 border-l-2 border-rose-500/60'
            : 'bg-slate-800/20 border-l-2 border-slate-600/20';

          const textColor = isGoal ? 'text-yellow-300 font-black' :
            isRed ? 'text-red-400 font-bold' :
            isYellow ? 'text-yellow-400' :
            isSevere ? 'text-orange-400' :
            isHome ? 'text-blue-100' :
            isAway ? 'text-rose-100' :
            'text-slate-400';

          return (
            <div key={log.id ?? i} className={`flex items-start gap-2 text-[11px] px-2 py-1 rounded-lg ${rowBg}`}>
              <span className="shrink-0 font-black text-slate-500 w-7 text-right pt-0.5">{log.minute}'</span>
              <span className={`leading-snug ${textColor}`}>{log.text}</span>
            </div>
          );
        })}
        <div ref={logsEndRef} />
      </div>
    </div>
  </div>
)}

        {/* FIXED: oba panele – wycentrowane, niezależne od layoutu; regulacja od dołu ekranu */}
<div className="fixed inset-x-0 bottom-[100px] z-50 flex items-stretch justify-center gap-4 pointer-events-none">
  {/* LEWY PANEL: Live Tactical Console */}
  <div className="w-72 bg-slate-900/60 rounded-[35px] border border-white/10 backdrop-blur-3xl p-3 flex flex-col justify-between shadow-2xl pointer-events-auto">
    <span className="text-[8px] font-black text-yellow-500 uppercase tracking-[0.4em] mb-2 px-1">USTAWIENIA DRUŻYNY</span>
    <div className="space-y-2">
      {[
        { label: 'TEMPO',      key: 'tempo',     options: [{v:'SLOW', l:'Wolne'}, {v:'NORMAL', l:'Normalne'}, {v:'FAST', l:'Szybkie'}] },
        { label: 'NASTAWIENIE', key: 'mindset',  options: [{v:'DEFENSIVE', l:'Def.'}, {v:'NEUTRAL', l:'Neutral'}, {v:'OFFENSIVE', l:'Ofens.'}] },
        { label: 'STYL GRY',   key: 'intensity', options: [{v:'CAUTIOUS', l:'Ostrożnie'}, {v:'NORMAL', l:'Normalnie'}, {v:'AGGRESSIVE', l:'Agresywnie'}] }
      ].map(group => {
        const isCoolingDown = (instructionCooldowns[group.key] ?? -99) + 10 > matchState.minute;
        const currentVal = matchState.userInstructions[group.key as keyof typeof matchState.userInstructions];
        return (
          <div key={group.key} className="flex flex-col gap-1">
            <span className="text-[7px] font-black text-slate-500 uppercase px-1">{group.label}</span>
            <div className="flex gap-1">
              {group.options.map(opt => {
                const isActive = currentVal === opt.v;
                return (
                  <button
                    key={opt.v}
                    disabled={isCoolingDown}
                    onClick={() => {
                      const randomDuration = Math.floor(Math.random() * 11) + 5;
                      setInstructionCooldowns(cd => ({ ...cd, [group.key]: matchState.minute }));
                      setMatchState(s => s ? {
                        ...s,
                        userInstructions: {
                          ...s.userInstructions,
                          [group.key]: opt.v,
                          lastChangeMinute: s.minute,
                          expiryMinute: s.minute + randomDuration
                        }
                      } : s);
                    }}
                    className={`flex-1 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-tight transition-all border
                      ${
                        isActive
                          ? 'bg-yellow-500 border-yellow-400 text-slate-900 shadow-lg'
                          : isCoolingDown
                          ? 'bg-white/3 border-white/5 text-slate-600 cursor-not-allowed'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white cursor-pointer'
                      }`}
                  >
                    {opt.l}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  </div>

  {/* PRAWY PANEL: Action & Speed Control */}
  <div className="w-56 flex flex-col gap-1 pointer-events-auto">
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
      <div className="flex-1 flex flex-col gap-2">
        <button 
          onClick={handleFinish}
          className="flex-1 bg-emerald-600 border-b-4 border-emerald-800 text-white rounded-3xl font-black uppercase italic text-lg shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
        >
          ZAKOŃCZ MECZ <span className="text-2xl"></span>
        </button>
        <button
          onClick={() => setIsCommentaryOpen(v => !v)}
          className="h-10 bg-blue-500/10 border border-blue-500/30 text-blue-300 font-black italic uppercase tracking-widest text-[9px] rounded-2xl hover:bg-blue-500/20 hover:text-blue-200 transition-all shadow-xl"
        >
          📋 KOMENTARZ
        </button>
      </div>
    ) : (
      <div className="flex-1 flex flex-col gap-2">
        <button 
          onClick={() => setMatchState(s => {
            if (!s) return s;

            if (!s.isExtraTime && s.homeScore === s.awayScore && s.minute >= 90 + (s.addedTime ?? 0)) {
              return { 
                ...s, 
                minute: 90, 
                period: 3,
                momentum: 0,
                isExtraTime: true, 
                addedTime: 0, 
                isPaused: false, 
                isHalfTime: false, 
                logs: [{ id: `et_${Date.now()}`, minute: 90, text: "ROZPOCZYNAMY DOGRYWKĘ!", type: MatchEventType.GENERIC }, ...s.logs] 
              };
            }
            if (s.isHalfTime) {
              const baseResumedState = { ...s, isHalfTime: false, isPaused: false, momentum: 0 };
              // Gwarantowany przegląd taktyczny trenera na początku drugiej połowy
              const htAiSide = userSide === 'HOME' ? 'AWAY' : 'HOME';
              const htAiClub = htAiSide === 'AWAY' ? ctx.awayClub : ctx.homeClub;
              const htAiCoach = coaches[htAiClub?.coachId || ''];
              const htBrainDecision = TacticalBrainService.calculate(s, userSide === 'HOME') as any;
              const htShoutDuration = 20 + Math.floor((htAiCoach?.attributes.experience || 50) / 8);
              const htStartMinute = s.isExtraTime ? 105 : 45;
              // Trener zawsze wydaje instrukcje na drugą połowę — nawet przy N1 (normalizacja)
              const htActiveShout = {
                 id: `HT_${htStartMinute}`,
                 expiryMinute: htStartMinute + htShoutDuration,
                 mindset: (htBrainDecision.mindset || 'NEUTRAL') as any,
                 tempo: (htBrainDecision.tempo || 'NORMAL') as any,
                 intensity: (htBrainDecision.intensity || 'NORMAL') as any
              };
              // [SLOT HT1] - miejsce na dedykowaną logikę instrukcji przerwy (np. inna długość przy dogrywce)

              // AI Zmiany w przerwie — serwis jest wywoływany synchronicznie z przyciskiem "Wznów",
              // ponieważ interwał nie działa gdy isHalfTime=true, więc isHalftime w serwisie
              // musi być wyzwolone tutaj. Przekazujemy isPriority=true aby ominąć bramkę cooldownu.
              const htPlayerTacticId = userSide === 'HOME' ? s.homeLineup.tacticId : s.awayLineup.tacticId;
              let htHomeLineup = s.homeLineup;
              let htAwayLineup = s.awayLineup;
              let htSubsCountHome = s.subsCountHome;
              let htSubsCountAway = s.subsCountAway;
              let htHomeSubsHistory = [...s.homeSubsHistory];
              let htAwaySubsHistory = [...s.awaySubsHistory];

              if (ctx) {
                const htDecision = AiMatchDecisionCupService.makeDecisions(
                  s, ctx, htAiSide as 'HOME' | 'AWAY', true, htAiCoach, htPlayerTacticId, undefined, aiScoutReport
                );
                if (htDecision.subRecord) {
                  if (htAiSide === 'HOME') {
                    htHomeLineup = htDecision.newLineup || htHomeLineup;
                    htSubsCountHome = htDecision.newSubsCount ?? htSubsCountHome;
                    htHomeSubsHistory = [...htHomeSubsHistory, htDecision.subRecord];
                  } else {
                    htAwayLineup = htDecision.newLineup || htAwayLineup;
                    htSubsCountAway = htDecision.newSubsCount ?? htSubsCountAway;
                    htAwaySubsHistory = [...htAwaySubsHistory, htDecision.subRecord];
                  }
                }
                if (htDecision.secondSubRecord) {
                  if (htAiSide === 'HOME') {
                    htHomeSubsHistory = [...htHomeSubsHistory, htDecision.secondSubRecord];
                  } else {
                    htAwaySubsHistory = [...htAwaySubsHistory, htDecision.secondSubRecord];
                  }
                }
              }

              const htResumedState = {
                ...baseResumedState,
                homeLineup: htHomeLineup,
                awayLineup: htAwayLineup,
                subsCountHome: htSubsCountHome,
                subsCountAway: htSubsCountAway,
                homeSubsHistory: htHomeSubsHistory,
                awaySubsHistory: htAwaySubsHistory,
                aiActiveShout: htActiveShout
              };

              if (s.isExtraTime) {
                 return { ...htResumedState, period: 4, minute: 105, aiActiveShout: htActiveShout };
              }
              setIsUserPaused(false);
              return { ...htResumedState, period: 2, minute: 45, aiActiveShout: htActiveShout };
            }
            const nextPaused = !s.isPaused;
            setIsUserPaused(nextPaused);
            return { ...s, isPaused: nextPaused };
          })} 
          className={`flex-1 rounded-3xl font-black uppercase italic text-xl shadow-2xl transition-all hover:scale-[1.02] active:scale-95 border-b-4
            ${matchState.isHalfTime ? 'bg-blue-600 border-blue-800 text-white' : 
              (matchState.isPaused ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-800 border-black text-slate-500')}`}
        >
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

        <button
          onClick={downloadDebugLog}
          className="hidden h-10 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 font-black italic uppercase tracking-widest text-[9px] rounded-2xl hover:bg-yellow-500/20 hover:text-yellow-300 transition-all shadow-xl"
          title="Pobierz log debugowania jako .txt"
        >
          🐛 DEBUG LOG
        </button>

        <button
          onClick={() => setShowDebugPanel(v => !v)}
          className={`hidden h-10 border font-black italic uppercase tracking-widest text-[9px] rounded-2xl transition-all shadow-xl ${showDebugPanel ? 'bg-green-500/30 border-green-400/60 text-green-300' : 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20 hover:text-green-300'}`}
          title="Panel matematyczny na żywo"
        >
          📊 LIVE STATS
        </button>

        <button
          onClick={() => setIsCommentaryOpen(v => !v)}
          className="h-10 bg-blue-500/10 border border-blue-500/30 text-blue-300 font-black italic uppercase tracking-widest text-[9px] rounded-2xl hover:bg-blue-500/20 hover:text-blue-200 transition-all shadow-xl"
        >
          📋 KOMENTARZ
        </button>
      </div>
    )}
  </div>
</div>

  {showDebugPanel && (() => {
        const homeShotEvents = debugDisplayData.filter(s => s.side === 'HOME');
        const awayShotEvents = debugDisplayData.filter(s => s.side === 'AWAY');
        const homeGoals = homeShotEvents.filter(s => s.isGoal).length;
        const awayGoals = awayShotEvents.filter(s => s.isGoal).length;
        const homeConv = homeShotEvents.length > 0 ? ((homeGoals / homeShotEvents.length) * 100).toFixed(1) : '—';
        const awayConv = awayShotEvents.length > 0 ? ((awayGoals / awayShotEvents.length) * 100).toFixed(1) : '—';
        const last8 = [...debugDisplayData].reverse().slice(0, 8);
        const latest = debugDisplayData.length > 0 ? debugDisplayData[debugDisplayData.length - 1] : null;
        return (
          <div className="fixed top-4 right-4 z-50 w-80 bg-black/92 border border-yellow-500/40 rounded-2xl p-3 text-[10px] font-mono shadow-2xl">
            <div className="flex justify-between items-center mb-2">
              <span className="text-yellow-400 font-black uppercase tracking-widest text-[9px]">📊 LIVE MATH DEBUG</span>
              <button onClick={() => setShowDebugPanel(false)} className="text-slate-400 hover:text-white text-xs">✕</button>
            </div>
            {latest && (
              <div className="bg-white/5 rounded-xl p-2 mb-2">
                <div className="text-slate-400 text-[9px] uppercase mb-1">Siła drużyn (ostatni tick)</div>
                <div className="flex justify-between">
                  <span className="text-green-300">TWOJA: <span className="text-white font-bold">{latest.pPower}</span></span>
                  <span className="text-red-300">RYWAL: <span className="text-white font-bold">{latest.aPower}</span></span>
                </div>
                <div className="flex justify-between mt-1 text-[9px]">
                  <span className="text-blue-300">progH: <span className="text-yellow-300">{(latest.homeThreshold * 100).toFixed(1)}%</span></span>
                  <span className="text-cyan-300">dynThresh: <span className="text-yellow-300">{(latest.dynamicThreshold * 100).toFixed(1)}%</span></span>
                  <span className="text-orange-300">progA: <span className="text-yellow-300">{(latest.awayThreshold * 100).toFixed(1)}%</span></span>
                </div>
              </div>
            )}
            <div className="bg-white/5 rounded-xl p-2 mb-2">
              <div className="text-slate-400 text-[9px] uppercase mb-1">Strzały → Gole (konwersja)</div>
              <div className="text-blue-300">HOME <span className="text-white">{homeShotEvents.length} strz → {homeGoals} goli</span> <span className="text-yellow-300">({homeConv}%)</span></div>
              <div className="text-orange-300 mt-0.5">AWAY <span className="text-white">{awayShotEvents.length} strz → {awayGoals} goli</span> <span className="text-yellow-300">({awayConv}%)</span></div>
            </div>
            <div className="text-slate-400 text-[9px] uppercase mb-1">Ostatnie strzały</div>
            <div className="space-y-1 max-h-52 overflow-y-auto custom-scrollbar">
              {last8.map((s, i) => (
                <div key={i} className={`rounded-lg p-1.5 ${s.isGoal ? 'bg-green-500/15 border border-green-500/30' : 'bg-white/5'}`}>
                  <div className="flex justify-between">
                    <span className={s.side === 'HOME' ? 'text-blue-300' : 'text-orange-300'}>{s.side} {s.minute}&apos;</span>
                    <span className={s.isGoal ? 'text-green-400 font-bold' : 'text-slate-400'}>{s.isGoal ? '⚽ GOL' : '🧤 BLOK'}</span>
                  </div>
                  <div className="text-slate-300 mt-0.5">shot=<span className="text-white">{s.shotPower}</span> save=<span className="text-white">{s.savePower}</span>{s.luckyBonus > 0 && <span className="text-yellow-300 ml-1">+luck={((s.luckyBonus) * 100).toFixed(1)}%</span>}</div>
                  <div className="text-slate-400">prob=<span className="text-yellow-300">{(s.goalProbability * 100).toFixed(1)}%</span> roll=<span className={s.isGoal ? 'text-green-400' : 'text-red-400'}>{(s.goalRoll * 100).toFixed(1)}%</span></div>
                  <div className="text-slate-500">passes={s.successPasses}/{s.diceRolls} ({s.diceRolls > 0 ? ((s.successPasses / s.diceRolls) * 100).toFixed(0) : 0}%) dynT={( s.dynamicThreshold * 100).toFixed(1)}%</div>
                </div>
              ))}
              {debugDisplayData.length === 0 && <div className="text-slate-500 text-center py-2">Brak danych — czekam na strzały...</div>}
            </div>
          </div>
        );
      })()}

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
          injuries={userSide === 'HOME' ? matchState.homeInjuries : matchState.awayInjuries}
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