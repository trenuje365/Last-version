import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { ViewState, EventKind, CompetitionType, Club, MailMessage, MailType, IncomingOfferStatus } from '../../types';
import { CalendarEngine } from '../../services/CalendarEngine';
import stadionBg from '../../Graphic/themes/stadion.png';
import { Card } from '../ui/Card';
import { LineupService } from '../../services/LineupService';
import { MailDetailsModal } from '../modals/MailDetailsModal';
import { FinanceHistoryModal } from '../modals/FinanceHistoryModal';
import { FinanceService } from '../../services/FinanceService';
import { getClubLogo } from '../../resources/ClubLogoAssets';

export const Dashboard: React.FC = () => {
  const { 
    currentDate, 
    advanceDay, 
    jumpToDate, 
    jumpToNextEvent,
    navigateTo, 
    userTeamId, 
    clubs, 
    nextEvent,
    viewClubDetails,
    lineups,
    players,
    isJumping,
    managerProfile,
    seasonNumber,
    seasonTemplate,
    messages,
    markMessageRead,
    lastMatchSummary,
   processBackgroundCupMatches,
   processCLMatchDay,
   coaches,
   viewCoachDetails,
    fixtures,
    confirmSeasonEnd,
    setElHistoryInitialRound,
    incomingOffers,
    isResigned,
    resignFromClub,
  } = useGame();

  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedMail, setSelectedMail] = useState<MailMessage | null>(null);
  const [isFinanceModalOpen, setIsFinanceModalOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showResignConfirm, setShowResignConfirm] = useState(false);

  useEffect(() => {
    setIsProcessing(false);
  }, [currentDate]);

  const myClub = clubs.find(c => c.id === userTeamId);

  const seasonYearLabel = useMemo(() => {
    if (!seasonTemplate) return "2025/26";
    const startYear = seasonTemplate.seasonStartYear;
    return `${startYear}/${String(startYear + 1).slice(2)}`;
  }, [seasonTemplate]);

  const userRank = useMemo(() => {
    if (!userTeamId || !myClub) return 1;
    const leagueClubs = clubs.filter(c => c.leagueId === myClub.leagueId);
    const sorted = [...leagueClubs].sort((a, b) => {
      if (b.stats.points !== a.stats.points) return b.stats.points - a.stats.points;
      if (b.stats.goalDifference !== a.stats.goalDifference) return b.stats.goalDifference - a.stats.goalDifference;
      return b.stats.goalsFor - a.stats.goalsFor;
    });
    return sorted.findIndex(c => c.id === userTeamId) + 1;
  }, [clubs, userTeamId, myClub]);

const boardConfidence = useMemo(() => {
    if (!myClub) return 50;
    const resultScore = (myClub.stats.wins * 4) - (myClub.stats.losses * 6);
    const rankImpact = (18 - userRank) * 2;
    const total = 75 + resultScore + rankImpact - (myClub.reputation * 2) + (myClub.europeanBonusPoints ?? 0);
    return Math.min(100, Math.max(5, total));
  }, [myClub, userRank]);

  // TUTAJ WSTAW TEN KOD (Pobieranie realnego budżetu z obiektu klubu)
 const currentBudget = useMemo(() => {
     if (!myClub || !userTeamId) return "0";
     const squad = players[userTeamId] || [];
     const netFunds = FinanceService.calculateAvailableFunds(myClub.budget, squad);
     return netFunds.toLocaleString('pl-PL');
  }, [myClub, players, userTeamId]);

  const pendingIncomingOffersCount = useMemo(() =>
    incomingOffers.filter(o =>
      o.status === IncomingOfferStatus.EMAIL_SENT ||
      o.status === IncomingOfferStatus.REMINDER_SENT ||
      o.status === IncomingOfferStatus.AI_COUNTERED ||
      o.status === IncomingOfferStatus.AWAITING_CONFIRMATION
    ).length
  , [incomingOffers]);

  const isTransferWindowOpen = useMemo(() => {
    if (!myClub) return false;
    const month = currentDate.getMonth();
    const day = currentDate.getDate();

    // Letnie: 1 lipca (m6, d1) — 8 września (m8, d8) włącznie
    const isSummer =
      (month === 6 && day >= 1) ||
      month === 7 ||
      (month === 8 && day <= 8);

    // Zimowe: 12 stycznia (m0, d12) — 13 lutego (m1, d13) włącznie
    const isWinter =
      (month === 0 && day >= 12) ||
      (month === 1 && day <= 13);

    return isSummer || isWinter;
  }, [myClub, currentDate]);

  useEffect(() => {


    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  const lineupValidation = useMemo(() => {
    if (!userTeamId || !lineups[userTeamId]) return { valid: false, error: "Brak zdefiniowanego składu" };
    const squad = players[userTeamId] || [];
    return LineupService.validateLineup(lineups[userTeamId], squad);
  }, [lineups, userTeamId, players]);

  const actionConfig = useMemo(() => {
    const todayEvent = (seasonTemplate && userTeamId)
      ? CalendarEngine.getPrimaryEventForDate(currentDate, seasonTemplate, fixtures, userTeamId, clubs)
      : null;

    // ── Zakończenie sezonu ─────────────────────────────────────────────────
    if (todayEvent?.slot.competition === CompetitionType.OFF_SEASON) {
      return {
        text: 'NOWY SEZON 🏆',
        action: confirmSeasonEnd,
        isMatch: false,
        disabled: isJumping,
        info: 'Zakończenie sezonu — przejdź do kolejnego!',
      };
    }

    // ── Rezygnacja — gracz tylko obserwuje ───────────────────────────────
    if (isResigned) {
      return { text: isJumping ? 'PRZETWARZANIE...' : 'NASTĘPNY DZIEŃ', action: advanceDay, isMatch: false, disabled: isJumping };
    }

    // ── Zdarzenia gracza (participation === 'player') ─────────────────────
    if (todayEvent?.participation === 'player') {
      switch (todayEvent.kind) {

        // ── Liga ────────────────────────────────────────────────────────────
        case EventKind.MATCH_LEAGUE:
        case EventKind.MATCH_FRIENDLY:
          return {
            text: lineupValidation.valid ? 'DZIEŃ MECZOWY ⚽' : 'BŁĄD SKŁADU ⚠️',
            action: () => lineupValidation.valid
              ? navigateTo(ViewState.PRE_MATCH_STUDIO)
              : navigateTo(ViewState.SQUAD_VIEW),
            isMatch: true,
            disabled: isJumping,
            error: lineupValidation.valid ? null : lineupValidation.error,
          };

        // ── Superpuchar Polski ───────────────────────────────────────────────
        case EventKind.MATCH_SUPER_CUP:
          return {
            text: 'SUPERPUCHAR POLSKI ✨',
            action: () => navigateTo(ViewState.PRE_MATCH_CUP_STUDIO),
            isMatch: true,
            disabled: isJumping,
          };

        // ── Puchar Polski — mecz ─────────────────────────────────────────────
        case EventKind.MATCH_POLISH_CUP:
          return {
            text: lineupValidation.valid ? 'PUCHAR POLSKI 🏆' : 'BŁĄD SKŁADU ⚠️',
            action: () => lineupValidation.valid
              ? navigateTo(ViewState.PRE_MATCH_CUP_STUDIO)
              : navigateTo(ViewState.SQUAD_VIEW),
            isMatch: true,
            disabled: isJumping,
            error: lineupValidation.valid ? null : lineupValidation.error,
          };

        // ── Liga Mistrzów / Liga Europy / Liga Konferencji — mecz ───────
        case EventKind.MATCH_EURO: {
          const isCLFinal = todayEvent.slot.competition === CompetitionType.CL_FINAL;
          const isELComp = todayEvent.slot.competition === CompetitionType.EL_R1Q ||
                           todayEvent.slot.competition === CompetitionType.EL_R1Q_RETURN ||
                           todayEvent.slot.competition === CompetitionType.EL_R2Q ||
                           todayEvent.slot.competition === CompetitionType.EL_R2Q_RETURN ||
                           todayEvent.slot.competition === CompetitionType.EL_GROUP_STAGE ||
                           todayEvent.slot.competition === CompetitionType.EL_R16 ||
                           todayEvent.slot.competition === CompetitionType.EL_R16_RETURN ||
                           todayEvent.slot.competition === CompetitionType.EL_QF ||
                           todayEvent.slot.competition === CompetitionType.EL_QF_RETURN ||
                           todayEvent.slot.competition === CompetitionType.EL_SF ||
                           todayEvent.slot.competition === CompetitionType.EL_SF_RETURN ||
                           todayEvent.slot.competition === CompetitionType.EL_FINAL;
          const isCONFComp = todayEvent.slot.competition === CompetitionType.CONF_R1Q ||
                             todayEvent.slot.competition === CompetitionType.CONF_R1Q_RETURN ||
                             todayEvent.slot.competition === CompetitionType.CONF_R2Q ||
                             todayEvent.slot.competition === CompetitionType.CONF_R2Q_RETURN ||
                             todayEvent.slot.competition === CompetitionType.CONF_GROUP_STAGE ||
                             todayEvent.slot.competition === CompetitionType.CONF_R16 ||
                             todayEvent.slot.competition === CompetitionType.CONF_R16_RETURN ||
                             todayEvent.slot.competition === CompetitionType.CONF_QF ||
                             todayEvent.slot.competition === CompetitionType.CONF_QF_RETURN ||
                             todayEvent.slot.competition === CompetitionType.CONF_SF ||
                             todayEvent.slot.competition === CompetitionType.CONF_SF_RETURN ||
                             todayEvent.slot.competition === CompetitionType.CONF_FINAL;
          return {
            text: isCLFinal ? 'FINAŁ LIGI MISTRZÓW ⭐' : isCONFComp ? '🟢 LIGA KONFERENCJI' : isELComp ? '🟠 LIGA EUROPY' : 'LIGA MISTRZÓW ⭐',
            action: () => {
              navigateTo(isCLFinal ? ViewState.PRE_MATCH_CL_STUDIO : isCONFComp ? ViewState.PRE_MATCH_CONF_STUDIO : isELComp ? ViewState.PRE_MATCH_EL_STUDIO : ViewState.PRE_MATCH_CL_STUDIO);
            },
            isMatch: true,
            disabled: isJumping,
          };
        }

        // ── Puchar Polski — losowanie ────────────────────────────────────────
        case EventKind.CUP_DRAW:
          return {
            text: '🏆 LOSOWANIE PUCHARU POLSKI',
            action: advanceDay,
            isMatch: false,
            disabled: isJumping,
          };

        // ── Liga Mistrzów / Ligi Europy — losowanie ──────────────────────────
        case EventKind.CL_DRAW:
          return {
            text: todayEvent.slot.competition === CompetitionType.EL_R1Q_DRAW
              ? '🟠 LOSOWANIE LIGI EUROPY'
              : todayEvent.slot.competition === CompetitionType.EL_R2Q_DRAW
                ? '🟠 LOSOWANIE LE: RUNDA 2 PREELIMINACYJNA'
                : todayEvent.slot.competition === CompetitionType.EL_GROUP_DRAW
                  ? '🟠 LOSOWANIE LE: FAZA GRUPOWA'
                  : todayEvent.slot.competition === CompetitionType.EL_R16_DRAW
                  ? '🟠 LOSOWANIE LE: 1/8 FINAŁU'
                  : todayEvent.slot.competition === CompetitionType.EL_QF_DRAW
                    ? '🟠 LOSOWANIE LE: 1/4 FINAŁU'
                    : todayEvent.slot.competition === CompetitionType.EL_SF_DRAW
                      ? '🟠 LOSOWANIE LE: 1/2 FINAŁU'
                      : todayEvent.slot.competition === CompetitionType.EL_FINAL_DRAW
                        ? '🟠 OGŁOSZENIE FINALISTÓW LE'
                        : todayEvent.slot.competition === CompetitionType.CONF_R1Q_DRAW
                          ? '🟢 LOSOWANIE LIGI KONFERENCJI'                          : todayEvent.slot.competition === CompetitionType.CONF_R2Q_DRAW
                            ? '🟢 LOSOWANIE LK: RUNDA 2 PREELIMINACYJNA'                          : todayEvent.slot.competition === CompetitionType.CONF_GROUP_DRAW
                              ? '🟢 LOSOWANIE LK: FAZA GRUPOWA'                              : todayEvent.slot.competition === CompetitionType.CONF_R16_DRAW
                                ? '🟢 LOSOWANIE LK: 1/8 FINAŁU'                                : todayEvent.slot.competition === CompetitionType.CONF_QF_DRAW
                                  ? '🟢 LOSOWANIE LK: 1/4 FINAŁU'
                                  : todayEvent.slot.competition === CompetitionType.CONF_SF_DRAW
                                    ? '🟢 LOSOWANIE LK: 1/2 FINAŁU'
                                    : todayEvent.slot.competition === CompetitionType.CONF_FINAL_DRAW
                                      ? '🟢 OGŁOSZENIE FINALISTÓW LK'
                                      : '⭐ LOSOWANIE LIGI MISTRZÓW',
            action: advanceDay,
            isMatch: false,
            disabled: isJumping,
          };

        default:
          break;
      }
    }

    // ── Zdarzenia tła (participation === 'background') ────────────────────
    if (todayEvent?.participation === 'background') {
      if (todayEvent.slot.competition === CompetitionType.SUPER_CUP) {
        return {
          text: 'SUPERPUCHAR POLSKI ✨ (wyniki)',
          action: () => { processBackgroundCupMatches(); navigateTo(ViewState.SCORE_RESULTS_POLISH_CUP); },
          isMatch: false,
          disabled: isJumping,
          info: 'Symulacja wyników',
        };
      }
      if (todayEvent.slot.competition === CompetitionType.POLISH_CUP) {
        return {
          text: 'PUCHAR POLSKI 🏆 (wyniki)',
          action: () => { processBackgroundCupMatches(); navigateTo(ViewState.SCORE_RESULTS_POLISH_CUP); },
          isMatch: false,
          disabled: isJumping,
          info: 'Symulacja wyników',
        };
      }
      // ── Liga Mistrzów — mecze (gracz nie uczestniczy) ────────────────────
      const CL_MATCH_COMPS = [
        CompetitionType.CL_R1Q, CompetitionType.CL_R1Q_RETURN,
        CompetitionType.CL_R2Q, CompetitionType.CL_R2Q_RETURN,
        CompetitionType.CL_GROUP_STAGE,
        CompetitionType.CL_R16, CompetitionType.CL_R16_RETURN,
        CompetitionType.CL_QF, CompetitionType.CL_QF_RETURN,
        CompetitionType.CL_SF, CompetitionType.CL_SF_RETURN,
      ];
      if ((CL_MATCH_COMPS as string[]).includes(todayEvent.slot.competition as string)) {
        return {
          text: '⭐ LIGA MISTRZÓW – WYNIKI',
          action: () => { processCLMatchDay(); navigateTo(ViewState.POST_MATCH_CL_STUDIO); },
          isMatch: false,
          disabled: isJumping,
          info: 'Wyniki meczów Ligi Mistrzów',
        };
      }
      // ── Liga Europy — mecze (gracz nie uczestniczy) ──────────────────────
      if (todayEvent.slot.competition === CompetitionType.EL_R1Q ||
          todayEvent.slot.competition === CompetitionType.EL_R1Q_RETURN ||
          todayEvent.slot.competition === CompetitionType.EL_R2Q ||
          todayEvent.slot.competition === CompetitionType.EL_R2Q_RETURN ||
          todayEvent.slot.competition === CompetitionType.EL_GROUP_STAGE ||
          todayEvent.slot.competition === CompetitionType.EL_R16 ||
          todayEvent.slot.competition === CompetitionType.EL_R16_RETURN ||
          todayEvent.slot.competition === CompetitionType.EL_QF ||
          todayEvent.slot.competition === CompetitionType.EL_QF_RETURN ||
          todayEvent.slot.competition === CompetitionType.EL_SF ||
          todayEvent.slot.competition === CompetitionType.EL_SF_RETURN ||
          todayEvent.slot.competition === CompetitionType.EL_FINAL) {
        const elRoundKey =
          todayEvent.slot.competition === CompetitionType.EL_R1Q || todayEvent.slot.competition === CompetitionType.EL_R1Q_RETURN ? 'R1Q' :
          todayEvent.slot.competition === CompetitionType.EL_R2Q || todayEvent.slot.competition === CompetitionType.EL_R2Q_RETURN ? 'R2Q' :
          todayEvent.slot.competition === CompetitionType.EL_GROUP_STAGE ? 'GS' :
          todayEvent.slot.competition === CompetitionType.EL_R16 || todayEvent.slot.competition === CompetitionType.EL_R16_RETURN ? 'R16' :
          todayEvent.slot.competition === CompetitionType.EL_QF || todayEvent.slot.competition === CompetitionType.EL_QF_RETURN ? 'QF' :
          todayEvent.slot.competition === CompetitionType.EL_SF || todayEvent.slot.competition === CompetitionType.EL_SF_RETURN ? 'SF' :
          todayEvent.slot.competition === CompetitionType.EL_FINAL ? 'FINAL' : 'R1Q';
        return {
          text: '🟠 LIGA EUROPY – WYNIKI',
          action: elRoundKey === 'FINAL'
            ? () => { processCLMatchDay(); navigateTo(ViewState.POST_MATCH_CL_STUDIO); }
            : () => { processCLMatchDay(); setElHistoryInitialRound(elRoundKey); navigateTo(ViewState.EL_HISTORY); },
          isMatch: false,
          disabled: isJumping,
          info: 'Wyniki meczów Ligi Europy',
        };
      }
      // ── Liga Konferencji — mecze (gracz nie uczestniczy) ─────────────────
      if (todayEvent.slot.competition === CompetitionType.CONF_R1Q ||
          todayEvent.slot.competition === CompetitionType.CONF_R1Q_RETURN ||
          todayEvent.slot.competition === CompetitionType.CONF_R2Q ||
          todayEvent.slot.competition === CompetitionType.CONF_R2Q_RETURN ||
          todayEvent.slot.competition === CompetitionType.CONF_GROUP_STAGE ||
          todayEvent.slot.competition === CompetitionType.CONF_R16 ||
          todayEvent.slot.competition === CompetitionType.CONF_R16_RETURN ||
          todayEvent.slot.competition === CompetitionType.CONF_QF ||
          todayEvent.slot.competition === CompetitionType.CONF_QF_RETURN ||
          todayEvent.slot.competition === CompetitionType.CONF_SF ||
          todayEvent.slot.competition === CompetitionType.CONF_SF_RETURN ||
          todayEvent.slot.competition === CompetitionType.CONF_FINAL) {
        const confRoundLabel =
          todayEvent.slot.competition === CompetitionType.CONF_R16 || todayEvent.slot.competition === CompetitionType.CONF_R16_RETURN ? '1/8 FINAŁU' :
          todayEvent.slot.competition === CompetitionType.CONF_QF || todayEvent.slot.competition === CompetitionType.CONF_QF_RETURN ? '1/4 FINAŁU' :
          todayEvent.slot.competition === CompetitionType.CONF_SF || todayEvent.slot.competition === CompetitionType.CONF_SF_RETURN ? '1/2 FINAŁU' :
          todayEvent.slot.competition === CompetitionType.CONF_FINAL ? 'FINAŁ' : '';
        return {
          text: confRoundLabel ? `🟢 LK ${confRoundLabel} – WYNIKI` : '🟢 LIGA KONFERENCJI – WYNIKI',
          action: () => { processCLMatchDay(); navigateTo(ViewState.CONF_HISTORY); },
          isMatch: false,
          disabled: isJumping,
          info: 'Wyniki meczów Ligi Konferencji',
        };
      }
    }

    // ── Domyślnie: przesuń dzień ───────────────────────────────────────────
    return { text: isJumping ? 'PRZETWARZANIE...' : 'NASTĘPNY DZIEŃ', action: advanceDay, isMatch: false, disabled: isJumping };
  }, [currentDate, advanceDay, navigateTo, lineupValidation, isJumping,
      processBackgroundCupMatches, processCLMatchDay, fixtures, userTeamId, confirmSeasonEnd, seasonTemplate, clubs]);

  const searchResults = useMemo(() => {
    if (!searchTerm || searchTerm.length < 2) return [];
    
    // Filtrowanie klubów
    const filteredClubs = clubs
      .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .map(c => ({ ...c, searchType: 'CLUB' }));

    // -> tutaj wstaw kod
    // Filtrowanie trenerów
    const filteredCoaches = Object.values(coaches)
      .filter(c => 
        c.firstName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.lastName.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .map(c => ({ ...c, searchType: 'COACH' }));

    return [...filteredClubs, ...filteredCoaches].slice(0, 10);
  }, [searchTerm, clubs, coaches]);

  const getMailIcon = (type: MailType) => {
    switch (type) {
      case MailType.BOARD: return '🏛️';
      case MailType.FANS: return '📣';
      case MailType.STAFF: return '🩺';
      case MailType.MEDIA: return '📰';
      default: return '📧';
    }
  };

  const getMailColor = (type: MailType) => {
    switch (type) {
      case MailType.BOARD: return 'bg-amber-600/20 text-amber-400 border-amber-500/20';
      case MailType.FANS: return 'bg-rose-600/20 text-rose-400 border-rose-500/20';
      case MailType.STAFF: return 'bg-blue-600/20 text-blue-400 border-blue-500/20';
      case MailType.MEDIA: return 'bg-emerald-600/20 text-emerald-400 border-emerald-500/20';
      default: return 'bg-slate-600/20 text-slate-400 border-slate-500/20';
    }
  };

  const TileButton = ({ label, icon, onClick, primary = false, disabled = false, badge = null }: any) => (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`
        relative group flex flex-col items-center justify-center p-1.5 rounded-2xl border transition-all duration-300 overflow-hidden
        ${primary 
          ? 'bg-white/5 border-white/10 hover:border-white/20' 
          : 'bg-black/20 border-white/5 hover:border-white/10'}
        hover:-translate-y-1 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed
      `}
    >
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity"
        style={{ background: `radial-gradient(circle at center, ${myClub?.colorsHex[0]}, transparent 70%)` }}
      />
      <span className="text-[26px] mb-1.5 transform group-hover:scale-110 group-hover:rotate-3 transition-transform">{icon}</span>
      <span className="font-black text-[9px] uppercase tracking-[0.2em] text-slate-400 group-hover:text-white transition-colors text-center">{label}</span>
      {badge && <div className="absolute top-2 right-2">{badge}</div>}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 rounded-t-full opacity-0 group-hover:opacity-100 transition-all" style={{ backgroundColor: myClub?.colorsHex[0] }} />
    </button>
  );

  return (
    <>
    {/* ── GLOBAL BACKGROUND — outside animated container so fixed works correctly ── */}
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Stadium image — full visibility */}
        <img
          src={stadionBg}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: 0.4 }}
        />
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-slate-950/70" />
        {/* Club color glows */}
        <div 
          className="absolute top-[-10%] right-[-10%] w-[80%] h-[80%] rounded-full blur-[180px] opacity-[0.25] animate-pulse-slow transition-all duration-1000"
          style={{ background: myClub?.colorsHex[0] || '#1e293b' }}
        />
        <div 
          className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[150px] opacity-[0.15] animate-pulse-slow transition-all duration-1000"
          style={{ background: myClub?.colorsHex[1] || '#0f172a' }}
        />
    </div>

    <div className="h-[1080px] max-w-[1920px] mx-auto flex flex-col gap-4 animate-fade-in overflow-hidden relative pr-2 z-10">

      {(isJumping || isProcessing) && (
        <div className="fixed inset-0 z-[1000] bg-black/40 backdrop-blur-[2px] flex items-center justify-center pointer-events-none">
           <div className="bg-slate-900 border border-white/10 px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-pulse">
              <div className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
              <span className="text-xs font-black text-white uppercase tracking-widest">PRZETWARZANIE DANYCH...</span>
           </div>
        </div>
      )}

      {selectedMail && (
        <MailDetailsModal 
          mail={selectedMail} 
          onClose={() => {
            markMessageRead(selectedMail.id);
            setSelectedMail(null);
          }} 
        />
      )}

      {myClub && (
        <FinanceHistoryModal
          isOpen={isFinanceModalOpen}
          onClose={() => setIsFinanceModalOpen(false)}
          club={myClub}
        />
      )}

      <div className="flex items-center justify-between px-6 py-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-2xl shrink-0 z-[100] shadow-2xl">
         <div className="flex items-center gap-5">
            <div className="w-10 h-10 rounded-xl flex flex-col overflow-hidden border border-white/20 shadow-lg group cursor-pointer" onClick={() => viewClubDetails(myClub?.id || '')}>
               <div className="flex-1" style={{ backgroundColor: myClub?.colorsHex[0] }} />
               <div className="flex-1" style={{ backgroundColor: myClub?.colorsHex[1] }} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white italic leading-none">
                 {managerProfile ? `${managerProfile.firstName} ${managerProfile.lastName}` : 'NOWY MANAGER'} {managerProfile?.nationalityFlag}
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{myClub?.name} • Ekstraklasa</span>
                <span className="w-1 h-1 rounded-full bg-blue-500/40" />
                <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest">SEZON {seasonNumber} ({seasonYearLabel})</span>
              </div>
            </div>
         </div>

         <div ref={searchRef} className="relative flex-1 max-w-xl mx-12">
            <div className={`
              flex items-center gap-4 px-6 py-2.5 rounded-2xl border transition-all duration-500
              ${isSearchFocused 
                ? 'bg-slate-900 border-white/20 shadow-[0_0_40px_rgba(0,0,0,0.5)] w-full scale-[1.01]' 
                : 'bg-black/40 border-white/5 w-full'}
            `}>
              <span className="text-sm opacity-40">🔍</span>
              <input 
                type="text"
                placeholder="Wyszukaj dowolny klub, piłkarza lub ligę..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                className="bg-transparent border-none outline-none text-xs font-bold text-white placeholder-slate-600 w-full"
              />
            </div>

            {isSearchFocused && searchResults.length > 0 && (
              <div className="absolute top-[calc(100%+12px)] left-0 right-0 bg-slate-950/95 border border-white/10 rounded-[32px] shadow-[0_30px_90px_rgba(0,0,0,0.8)] backdrop-blur-3xl z-[200] overflow-hidden animate-slide-down">
                 <div className="p-4 border-b border-white/5 bg-white/5">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] px-2">Baza danych PZPN</span>
                 </div>
                 <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                  {searchResults.map((item: any) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (item.searchType === 'CLUB') viewClubDetails(item.id);
                        else viewCoachDetails(item.id); // -> tutaj wstaw kod
                        setIsSearchFocused(false);
                        setSearchTerm('');
                      }}
                      className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-all border-b border-white/5 last:border-0 group"
                    >
                      <div className="flex items-center gap-5">
                          {item.searchType === 'CLUB' ? (
                            <div className="flex flex-col w-2 h-8 rounded-full overflow-hidden shrink-0 border border-white/10 shadow-lg">
                              <div style={{ backgroundColor: item.colorsHex[0] }} className="flex-1" />
                              <div style={{ backgroundColor: item.colorsHex[1] }} className="flex-1" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center text-lg border border-blue-500/20 shadow-lg shrink-0">
                               👨‍💼
                            </div>
                          )}
                          <div className="text-left">
                            <span className="block text-sm font-black text-white group-hover:text-blue-400 transition-colors uppercase italic">
                              {item.searchType === 'CLUB' ? item.name : `${item.firstName} ${item.lastName}`}
                            </span>
                            <span className="block text-[9px] font-black text-slate-500 uppercase tracking-tighter">
                                {item.searchType === 'CLUB' ? `Stadion: ${item.stadiumName}` : `${item.nationalityFlag} ${item.nationality} • Doświadczenie: ${item.attributes.experience}`}
                            </span>
                          </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-[7px] font-black px-2 py-0.5 rounded border ${item.searchType === 'CLUB' ? 'text-amber-500 border-amber-500/20 bg-amber-500/5' : 'text-blue-500 border-blue-500/20 bg-blue-500/5'}`}>
                           {item.searchType}
                        </span>
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-[-10px]">
                          <span className="text-xs">→</span>
                        </div>
                      </div>
                    </button>
                  ))}
                 </div>
              </div>
            )}
         </div>
      </div>
      
      <div className="relative h-44 rounded-[40px] overflow-hidden shadow-2xl border border-white/10 shrink-0 z-10 group">
        <div className="absolute inset-0 z-0">
           <div 
             className="absolute inset-0 opacity-40 transition-transform duration-[3000ms] group-hover:scale-110" 
             style={{ background: `linear-gradient(135deg, ${myClub?.colorsHex[0]} 0%, ${myClub?.colorsHex[1] || '#000'} 100%)` }} 
           />
           <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-3xl" />
           <div className="absolute right-10 bottom-[-20%] text-[14rem] font-black italic text-white/[0.03] select-none pointer-events-none">
              {myClub?.shortName}
           </div>
        </div>

        <div className="relative z-10 px-12 h-full flex items-center justify-between gap-10">
           <div className="flex-1">
              <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-4 backdrop-blur-md">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,1)]" />
                 <span className="text-[9px] font-black uppercase tracking-[0.3em] text-emerald-400">Centrum Klubowe</span>
              </div>
              <h2 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter text-white leading-none drop-shadow-2xl">
                 {formatDate(currentDate)}
              </h2>
              <div className="flex items-center gap-5 mt-2">
                <p className="text-slate-400 font-bold uppercase tracking-[0.4em] text-[11px] opacity-60">
                   {myClub?.name} <span className="mx-2 text-white">/</span> GŁÓWNY MANAGER
                </p>
              </div>
           </div>

           {nextEvent && nextEvent.opponentClubId && (() => {
             const opponent = clubs.find(c => c.id === nextEvent.opponentClubId);
             const isHome = nextEvent.isHome;
             const roundLabel = nextEvent.kind === EventKind.MATCH_LEAGUE
               ? `Kolejka ${(myClub?.stats.played ?? 0) + 1}`
               : nextEvent.label;
             const dateLabel = nextEvent.startDate.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' });
             return (
               <div className="hidden lg:flex flex-col relative overflow-hidden rounded-[28px] border border-white/[0.08] backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.1)] min-w-[300px] transition-all duration-300 hover:shadow-[0_12px_48px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.15)] hover:scale-[1.02] cursor-default"
                 style={{ background: `linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(15,23,42,0.80) 100%)` }}
               >
                 {/* top accent bar with club color */}
                 <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-[28px]"
                   style={{ background: `linear-gradient(90deg, transparent, ${myClub?.colorsHex[0] ?? '#3b82f6'}, transparent)` }} />
                 {/* inner glow */}
                 <div className="absolute inset-0 rounded-[28px] pointer-events-none"
                   style={{ boxShadow: `inset 0 0 60px ${myClub?.colorsHex[0] ?? '#3b82f6'}15` }} />

                 <div className="px-6 pt-5 pb-4 flex flex-col gap-4 relative z-10">
                   {/* header */}
                   <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: myClub?.colorsHex[0] ?? '#3b82f6' }} />
                       <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">Następny Mecz</span>
                     </div>
                     <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border"
                       style={{ color: myClub?.colorsHex[0] ?? '#3b82f6', borderColor: `${myClub?.colorsHex[0] ?? '#3b82f6'}40`, background: `${myClub?.colorsHex[0] ?? '#3b82f6'}12` }}>
                       {roundLabel}
                     </span>
                   </div>

                   {/* teams row */}
                   <div className="flex items-center gap-3">
                     {/* home team */}
                     <div className="flex flex-col items-center gap-1.5 flex-1">
                       <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 shadow-inner flex flex-col shrink-0">
                         <div className="flex-1" style={{ backgroundColor: myClub?.colorsHex[0] ?? '#334155' }} />
                         <div className="flex-1" style={{ backgroundColor: myClub?.colorsHex[1] ?? '#1e293b' }} />
                       </div>
                       <span className="text-[10px] font-black italic uppercase text-white text-center leading-tight line-clamp-2">{myClub?.name}</span>
                       {isHome !== undefined && (
                         <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500/70">{isHome ? 'DOM' : 'WYJAZD'}</span>
                       )}
                     </div>

                     {/* VS */}
                     <div className="flex flex-col items-center gap-0.5 shrink-0 px-1">
                       <div className="w-px h-4 bg-white/10" />
                       <span className="text-xs font-black italic text-white/20">VS</span>
                       <div className="w-px h-4 bg-white/10" />
                     </div>

                     {/* away team */}
                     <div className="flex flex-col items-center gap-1.5 flex-1">
                       <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 shadow-inner flex flex-col shrink-0">
                         <div className="flex-1" style={{ backgroundColor: opponent?.colorsHex[0] ?? '#334155' }} />
                         <div className="flex-1" style={{ backgroundColor: opponent?.colorsHex[1] ?? '#1e293b' }} />
                       </div>
                       <span className="text-[10px] font-black italic uppercase text-white text-center leading-tight line-clamp-2">{opponent?.name}</span>
                       {isHome !== undefined && (
                         <span className="text-[8px] font-black uppercase tracking-widest text-slate-600">{isHome ? 'WYJAZD' : 'DOM'}</span>
                       )}
                     </div>
                   </div>

                   {/* date footer */}
                   <div className="border-t border-white/[0.06] pt-3 flex items-center justify-center gap-2">
                     <svg className="w-3 h-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                       <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                     </svg>
                     <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">{dateLabel}</span>
                   </div>
                 </div>
               </div>
             );
           })()}

           <div className="shrink-0 flex flex-col items-center gap-2">
              <button 
                onClick={() => { setIsProcessing(true); setTimeout(actionConfig.action, 0); }}
                disabled={actionConfig.disabled}
                className={`
                  relative group px-14 py-6 rounded-[32px] transition-all duration-500 transform hover:scale-105 active:scale-95
                  flex flex-col items-center justify-center shadow-[0_20px_60px_rgba(0,0,0,0.5)] border-2
                  ${actionConfig.isMatch 
                    ? (actionConfig.error ? 'bg-red-600 border-red-400 text-white' : 'bg-emerald-600 border-emerald-400 text-white') 
                    : 'bg-white border-white text-slate-900'}
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
                style={actionConfig.isMatch && !actionConfig.error ? { boxShadow: `0 0 40px ${myClub?.colorsHex[0]}66` } : {}}
              >
                <span className="text-2xl font-black italic uppercase tracking-tighter relative z-10 text-center leading-tight">
                   {actionConfig.text}
                </span>
                <span className={`text-[10px] font-black uppercase tracking-[0.3em] mt-1.5 opacity-60 relative z-10`}>
                   {actionConfig.error ? 'NAPRAW SKŁAD' : (actionConfig.info || 'DALEJ')}
                </span>
                {actionConfig.isMatch && !actionConfig.error && (
                  <div className="absolute inset-0 rounded-[30px] animate-ping opacity-20 bg-emerald-400 pointer-events-none" />
                )}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-tr from-transparent via-white/20 to-transparent" />
              </button>
              {actionConfig.error && (
                 <span className="text-[9px] font-black text-red-500 uppercase animate-pulse">{actionConfig.error}</span>
              )}
           </div>
        </div>
      </div>

      <div className="flex-1 flex gap-6 min-h-0 z-0">
        <div className="w-80 flex flex-col gap-5 shrink-0">
           <Card className="rounded-[35px] border-none bg-slate-900/40 backdrop-blur-2xl relative group shrink-0 overflow-hidden shadow-2xl">
              <div className="absolute top-0 left-0 w-full h-2" style={{ backgroundColor: myClub?.colorsHex[0] }} />
              <div className="absolute left-[-10px] top-10 text-9xl font-black italic text-white/[0.02] select-none pointer-events-none">
                 {myClub?.shortName}
              </div>
              <div className="py-[20.5px] px-7 relative z-10">
                 <div className="flex items-center gap-5 mb-8">
                    {isResigned ? (
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-slate-800 border border-white/10 shadow-2xl text-3xl shrink-0">👨‍💼</div>
                    ) : getClubLogo(myClub?.id || '') ? (
                      <div className="relative z-50 w-[74px] h-[74px] shrink-0 transform -rotate-3 group-hover:rotate-0 transition-transform">
                        <img
                          src={getClubLogo(myClub?.id || '')}
                          alt={myClub?.name}
                          className="w-full h-full object-contain drop-shadow-2xl"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-2xl flex flex-col overflow-hidden border border-white/20 shadow-2xl transform -rotate-3 group-hover:rotate-0 transition-transform">
                        <div className="flex-1" style={{ backgroundColor: myClub?.colorsHex[0] }} />
                        <div className="flex-1" style={{ backgroundColor: myClub?.colorsHex[1] }} />
                      </div>
                    )}
                    <div>
                       <h3 className="text-xl font-black italic uppercase tracking-tighter text-white leading-tight">{isResigned ? 'BEZ KLUBU' : myClub?.name}</h3>
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1">{isResigned ? 'Obserwator' : 'Status: Aktywny'}</p>
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5 text-center hover:bg-white/10 transition-colors">
                       <span className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Punkty</span>
                       <span className="text-2xl font-black font-mono text-emerald-400 tabular-nums">{myClub?.stats.points}</span>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5 text-center hover:bg-white/10 transition-colors">
                       <span className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Miejsce</span>
                       <span className="text-2xl font-black font-mono text-white tabular-nums">{userRank}</span>
                    </div>
                 </div>
              </div>
           </Card>

           {!isResigned && (
           <div className="space-y-4 shrink-0">
              {[
                { label: 'Budżet Transferowy', value: `${currentBudget} PLN`, color: 'text-blue-400', icon: '💰', p: 80, onClick: () => setIsFinanceModalOpen(true) },
                { label: 'Zaufanie Zarządu', value: `${boardConfidence}%`, color: boardConfidence > 70 ? 'text-emerald-400' : (boardConfidence > 40 ? 'text-amber-400' : 'text-red-500'), icon: '📈', p: boardConfidence },
              ].map((stat, i) => (
                <div
                  key={i}
                  onClick={stat.onClick}
                  className={`bg-slate-900/40 p-5 rounded-[28px] border border-white/5 flex flex-col gap-3 backdrop-blur-md hover:border-white/10 transition-all group shadow-xl ${stat.onClick ? 'cursor-pointer hover:bg-white/5' : ''}`}
                >
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xl group-hover:scale-110 transition-transform">{stat.icon}</span>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.1em]">{stat.label}</span>
                      </div>
                      <span className={`text-sm font-black italic ${stat.color}`}>{stat.value}</span>
                   </div>
                   <div className="h-1 w-full bg-black/40 rounded-full overflow-hidden">
                      <div className="h-full transition-all duration-1000" style={{ width: `${stat.p}%`, backgroundColor: i === 0 ? '#60a5fa' : (boardConfidence > 70 ? '#34d399' : (boardConfidence > 40 ? '#fbbf24' : '#ef4444')) }} />
                   </div>
                </div>
              ))}
           </div>
           )}

       <div className="flex-1 grid grid-cols-2 gap-0.5">
              <TileButton label="TRENING" icon="🏋️‍♂️" onClick={() => navigateTo(ViewState.TRAINING_VIEW)} primary disabled={isJumping || isResigned} />
              <TileButton label="PLANER" icon="📅" onClick={() => navigateTo(ViewState.CALENDAR_DEBUG)} disabled={isJumping || isResigned} />
              <TileButton label="KADRA" icon="👕" onClick={() => navigateTo(ViewState.SQUAD_VIEW)} disabled={isJumping || isResigned} />
              <TileButton 
                 label="EUROPA I ŚWIAT" 
                 icon="🌍" 
                 onClick={() => navigateTo(ViewState.EUROPEAN_CLUBS)} 
                 disabled={isJumping}
              />
              <TileButton label="ROZGRYWKI" icon="⚽" onClick={() => navigateTo(ViewState.LEAGUE_TABLES)} disabled={isJumping} />
              <TileButton label="STATYSTYKI" icon="🏆" onClick={() => navigateTo(ViewState.LEAGUE_STATS)} disabled={isJumping} />
              <TileButton label="HISTORIA" icon="📜" onClick={() => navigateTo(ViewState.MATCH_HISTORY_BROWSER)} disabled={isJumping} />             
              <TileButton label="RYNEK PRACY" icon="💼" onClick={() => navigateTo(ViewState.JOB_MARKET)} disabled={isJumping} />
              <TileButton
                label="AKTYWNOŚĆ RYNKOWA"
                icon="🔄"
                onClick={() => navigateTo(ViewState.TRANSFER_NEWS)}
                disabled={isJumping}
                badge={pendingIncomingOffersCount > 0
                  ? <span className="w-2.5 h-2.5 rounded-full bg-red-500 block" />
                  : null}
              />
           </div>
        </div>

<div className="flex-1 flex flex-col min-w-0 min-h-0 h-[800px]">

           <Card className="flex-1 rounded-[40px] border-white/10 bg-white/[0.01] flex flex-col overflow-hidden backdrop-blur-md shadow-2xl relative h-full">
            {/* Internal Glass Gloss Background for Mailbox */}
              <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                 <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1551290464-67296061329c?auto=format&fit=crop&q=80&w=1000')] bg-cover bg-center opacity-[0.02] mix-blend-overlay grayscale" />
                 <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] via-transparent to-transparent z-10" />
                 <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,transparent_60%,rgba(2,6,23,0.1)_100%)]" />
              </div>

              
              <div className="relative z-10 flex flex-col h-full min-h-0">
                 <div className="px-8 py-5 border-b border-white/5 bg-white/5 flex justify-between items-center shrink-0">
                


                <h3 className="text-xs font-black uppercase tracking-[0.4em] text-white">Skrzynka pocztowa</h3>
                {messages.filter(m => !m.isRead).length > 0 && (
                   <span className="text-[9px] font-black text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 shadow-inner">
                     {messages.filter(m => !m.isRead).length} NOWE
                   </span>
                )}
              </div>
              
               <div className="h-[700px] overflow-y-auto custom-scrollbar p-6 space-y-4">
                 {messages.length > 0 ? (
                   messages.map(mail => (
                    <div 
                      key={mail.id}
                      onClick={() => setSelectedMail(mail)}
                      className={`group relative p-6 rounded-[32px] border transition-all cursor-pointer overflow-hidden shadow-lg
                        ${mail.isRead ? 'bg-white/[0.02] border-white/5 opacity-60' : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10'}
                      `}
                    >
                       <div className="absolute right-[-20px] bottom-[-20px] text-7xl opacity-[0.03] rotate-12 group-hover:rotate-0 transition-transform">
                         {getMailIcon(mail.type)}
                       </div>
                       <div className="flex items-start gap-6 relative z-10">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl border shrink-0 shadow-inner group-hover:scale-110 transition-transform ${getMailColor(mail.type)}`}>
                             {getMailIcon(mail.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                             <div className="flex justify-between items-center mb-1">
                                <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${mail.isRead ? 'text-slate-500' : 'text-blue-400'}`}>
                                   {mail.sender.toUpperCase()}
                                </span>
                                <span className="text-[9px] font-black text-slate-600 uppercase">
                                   {mail.date.toLocaleDateString()}
                                </span>
                             </div>
                             <h4 className={`text-sm font-black text-white mb-2 uppercase italic tracking-tight truncate ${mail.isRead ? 'font-bold' : 'font-black'}`}>
                                {mail.subject}
                             </h4>
                             <p className="text-[11px] text-slate-400 leading-relaxed font-medium line-clamp-1 italic">
                                {mail.body}
                             </p>
                          </div>
                          {!mail.isRead && (
                             <div className="w-2 h-2 rounded-full bg-blue-500 mt-6 shadow-[0_0_10px_rgba(59,130,246,1)]" />
                          )}
                       </div>
                    </div>
                   ))
                 ) : (
                   <div className="h-full flex flex-col items-center justify-center opacity-10 py-20">
                      <span className="text-6xl mb-4">📭</span>
                      <p className="text-sm font-black uppercase tracking-[0.3em] italic text-center">Twoja skrzynka pocztowa jest obecnie pusta</p>
                   </div>
                 )}
         </div>
           </div> {/* Zamknięcie dla <div className="relative z-10 flex flex-col h-full"> */}
           </Card>
        </div>

        <div className="w-44 flex flex-col gap-3 shrink-0">
          <button onClick={() => navigateTo(ViewState.EDITOR)}
            className="flex flex-col items-center justify-center gap-2 p-4 rounded-[24px] bg-slate-900/40 border border-white/5 hover:border-white/15 hover:bg-white/5 transition-all group">
            <span className="text-2xl group-hover:scale-110 transition-transform">✍️</span>
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-white transition-colors">EDYTOR</span>
          </button>
          <button disabled
            className="flex flex-col items-center justify-center gap-2 p-4 rounded-[24px] bg-slate-900/40 border border-white/5 opacity-30 cursor-not-allowed">
            <span className="text-2xl">💾</span>
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">ZAPIS GRY</span>
          </button>
          <button onClick={() => navigateTo(ViewState.GAME_MANUAL)}
            className="flex flex-col items-center justify-center gap-2 p-4 rounded-[24px] bg-slate-900/40 border border-white/5 hover:border-white/15 hover:bg-white/5 transition-all group">
            <span className="text-2xl group-hover:scale-110 transition-transform">📖</span>
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-white transition-colors">INSTRUKCJA</span>
          </button>
          <button
            onClick={() => !isResigned && setShowResignConfirm(true)}
            disabled={isResigned}
            className={`flex flex-col items-center justify-center gap-2 p-4 rounded-[24px] border transition-all group
              ${isResigned
                ? 'bg-slate-900/20 border-white/5 opacity-30 cursor-not-allowed'
                : 'bg-amber-950/30 border-amber-900/20 hover:border-amber-500/30 hover:bg-amber-900/20'}`}>
            <span className="text-2xl group-hover:scale-110 transition-transform">🏳️</span>
            <span className={`text-[9px] font-black uppercase tracking-[0.2em] transition-colors ${isResigned ? 'text-slate-600' : 'text-amber-500/70 group-hover:text-amber-400'}`}>
              {isResigned ? 'ZREZYGNOWANO' : 'REZYGNACJA'}
            </span>
          </button>
          <div className="flex-1" />
          <button onClick={() => setShowExitConfirm(true)}
            className="w-full py-4 rounded-[24px] bg-red-600 border border-red-500 hover:bg-red-500 transition-all">
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white">ZAKOŃCZ GRĘ</span>
          </button>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }
        @keyframes fade-in { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes slide-down { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-slide-up { animation: slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes pulse-slow { 0%, 100% { opacity: 0.1; transform: scale(1); } 50% { opacity: 0.2; transform: scale(1.1); } }
        .animate-pulse-slow { animation: pulse-slow 8s infinite ease-in-out; }
      `}</style>

      {showResignConfirm && (
        <div className="fixed inset-0 z-[2000] bg-black/70 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-slate-900 border border-white/10 rounded-[32px] p-8 flex flex-col items-center gap-6 shadow-2xl w-80">
            <span className="text-4xl">🏳️</span>
            <div className="text-center">
              <p className="text-sm font-black uppercase tracking-widest text-white mb-2">REZYGNACJA Z KLUBU</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Ta decyzja jest nieodwracalna</p>
            </div>
            <div className="flex gap-3 w-full">
              <button onClick={() => setShowResignConfirm(false)}
                className="flex-1 py-3 rounded-[20px] bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:border-white/20 transition-all">
                ANULUJ
              </button>
              <button onClick={() => { resignFromClub(); setShowResignConfirm(false); }}
                className="flex-1 py-3 rounded-[20px] bg-amber-600 border border-amber-400 text-[10px] font-black uppercase tracking-widest text-white hover:bg-amber-500 transition-all">
                REZYGNUJĘ
              </button>
            </div>
          </div>
        </div>
      )}

      {showExitConfirm && (
        <div className="fixed inset-0 z-[2000] bg-black/70 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-slate-900 border border-white/10 rounded-[32px] p-8 flex flex-col items-center gap-6 shadow-2xl w-80">
            <span className="text-4xl">🚪</span>
            <div className="text-center">
              <p className="text-sm font-black uppercase tracking-widest text-white mb-2">WYJŚCIE Z GRY</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Niezapisany postęp zostanie utracony</p>
            </div>
            <div className="flex gap-3 w-full">
              <button onClick={() => setShowExitConfirm(false)}
                className="flex-1 py-3 rounded-[20px] bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:border-white/20 transition-all">
                ANULUJ
              </button>
              <button onClick={() => window.location.reload()}
                className="flex-1 py-3 rounded-[20px] bg-red-600 border border-red-400 text-[10px] font-black uppercase tracking-widest text-white hover:bg-red-500 transition-all">
                WYJDŹ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
};