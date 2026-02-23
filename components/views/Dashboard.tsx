import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { ViewState, EventKind, Club, MailMessage, MailType } from '../../types';
import { Card } from '../ui/Card';
import { LineupService } from '../../services/LineupService';
import { MailDetailsModal } from '../modals/MailDetailsModal';
import { FinanceService } from '../../services/FinanceService';

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
   coaches,
   viewCoachDetails,
    fixtures
  } = useGame();

  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedMail, setSelectedMail] = useState<MailMessage | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

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
    const total = 75 + resultScore + rankImpact - (myClub.reputation * 2);
    return Math.min(100, Math.max(5, total));
  }, [myClub, userRank]);

  // TUTAJ WSTAW TEN KOD (Pobieranie realnego budżetu z obiektu klubu)
 const currentBudget = useMemo(() => {
     if (!myClub || !userTeamId) return "0";
     const squad = players[userTeamId] || [];
     const netFunds = FinanceService.calculateAvailableFunds(myClub.budget, squad);
     return netFunds.toLocaleString('pl-PL');
  }, [myClub, players, userTeamId]);

  const isTransferWindowOpen = useMemo(() => {
    if (!myClub) return false;
    const round = myClub.stats.played + 1;
    const month = currentDate.getMonth();
    const day = currentDate.getDate();

    // 1. Okno Letnie: do 9 kolejki włącznie (played < 9)
    if (round <= 9) return true;

    // 2. Okno Zimowe: od przerwy (grudzień 8+) do 24 kolejki włącznie
    const isWinterPeriod = (month === 11 && day >= 8) || (month === 0);
    if (isWinterPeriod && round <= 24) return true;

    return false;
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
const month = currentDate.getMonth();
    const day = currentDate.getDate();

    // TUTAJ WSTAW TEN KOD
    // Obsługa przycisku Superpucharu (12 Lipca)
  if (month === 6 && day === 12) {
      const currentYear = currentDate.getFullYear();
      const scFix = fixtures.find(f => f.id === `SUPER_CUP_${currentYear}`);
      
      if (scFix) {
        if (scFix.status !== 'FINISHED') {
          const isUserPlaying = scFix.homeTeamId === userTeamId || scFix.awayTeamId === userTeamId;
          
          // Logika: Jeśli to Sezon 1 LUB gracz bierze udział -> Studio
          // Jeśli Sezon 2+ i gracz NIE bierze udziału -> Rozegraj w tle
          const shouldPlayBackground = seasonNumber > 1 && !isUserPlaying;

          return {
            text: "SUPERPUCHAR POLSKI ✨",
            action: () => {
              if (isUserPlaying) {
                navigateTo(ViewState.PRE_MATCH_CUP_STUDIO);
              } else if (shouldPlayBackground) {
                processBackgroundCupMatches();
                navigateTo(ViewState.SCORE_RESULTS_POLISH_CUP);
              } else {
                // Failsafe dla 1. sezonu AI vs AI
                processBackgroundCupMatches();
                navigateTo(ViewState.SCORE_RESULTS_POLISH_CUP);
              }
            },
            isMatch: isUserPlaying,
            disabled: isJumping,
            info: shouldPlayBackground ? "Symulacja wyników" : undefined
          };
        } else {
          return { text: "KONTYNUUJ DO LIGI", action: advanceDay, isMatch: false, disabled: isJumping };
        }
      }
    }
// KONIEC
     if (month === 6 && day === 9) {
      return {
        text: "ROZPOCZNIJ PRZYGOTOWANIA 📋",
        action: advanceDay,
        isMatch: false,
        disabled: isJumping,
        info: "Analiza kadry i planowanie"
      };
    }
    const isCupDay = month === 7 && day === 16; 
    if (isCupDay) {
      return {
        text: "1/64 PP 🏆",
        action: () => navigateTo(ViewState.PRE_MATCH_CUP_STUDIO),
        isMatch: true,
        disabled: isJumping
      };
    }
    const isCupDaySept = month === 8 && day === 20; 
    if (isCupDaySept) {
      return {
        text: "1/32 PP 🏆",
        action: () => {
          if (myClub?.isInPolishCup) {
            navigateTo(ViewState.PRE_MATCH_CUP_STUDIO);
          } else {
            processBackgroundCupMatches();
            navigateTo(ViewState.SCORE_RESULTS_POLISH_CUP);
          }
        },
        isMatch: true,
        disabled: isJumping
      };
    }
    const isCupDayOct = month === 9 && day === 18; 
    if (isCupDayOct) {
      return {
        text: "1/16 PP 🏆",
        action: () => {
          if (myClub?.isInPolishCup) {
            navigateTo(ViewState.PRE_MATCH_CUP_STUDIO);
          } else {
            processBackgroundCupMatches();
            navigateTo(ViewState.SCORE_RESULTS_POLISH_CUP);
          }
        },
        isMatch: true,
        disabled: isJumping
      };
    }
    const isCupDayNov = month === 10 && day === 15; 
    if (isCupDayNov) {
      return {
        text: "1/8 PP 🏆",
        action: () => {
          if (myClub?.isInPolishCup) {
            navigateTo(ViewState.PRE_MATCH_CUP_STUDIO);
          } else {
            processBackgroundCupMatches();
            navigateTo(ViewState.SCORE_RESULTS_POLISH_CUP);
          }
        },
        isMatch: true,
        disabled: isJumping
      };
    }
    const isCupDayMar = month === 2 && day === 14; 
    if (isCupDayMar) {
      return {
        text: "1/4 PP 🏆",
        action: () => {
          if (myClub?.isInPolishCup) {
            navigateTo(ViewState.PRE_MATCH_CUP_STUDIO);
          } else {
            processBackgroundCupMatches();
            navigateTo(ViewState.SCORE_RESULTS_POLISH_CUP);
          }
        },
        isMatch: true,
        disabled: isJumping
      };
    }
    const isCupDayApr = month === 3 && day === 18; 
    if (isCupDayApr) {
      return {
        text: "1/2 PP 🏆",
        action: () => {
          if (myClub?.isInPolishCup) {
            navigateTo(ViewState.PRE_MATCH_CUP_STUDIO);
          } else {
            processBackgroundCupMatches();
            navigateTo(ViewState.SCORE_RESULTS_POLISH_CUP);
          }
        },
        isMatch: true,
        disabled: isJumping
      };
    }
    const isCupDayMay = month === 4 && day === 30; 
    if (isCupDayMay) {
      return {
        text: "FINAŁ PP 🏆",
        action: () => {
          if (myClub?.isInPolishCup) {
            navigateTo(ViewState.PRE_MATCH_CUP_STUDIO);
          } else {
            processBackgroundCupMatches();
            navigateTo(ViewState.SCORE_RESULTS_POLISH_CUP);
          }
        },
        isMatch: true,
        disabled: isJumping
      };
    }

    const isSeasonBreak = month === 5; 
    if (isSeasonBreak) {
      return {
        text: "URLOP 🌴",
        action: () => jumpToDate(new Date(currentDate.getFullYear(), 6, 9)),
        isMatch: false,
        disabled: isJumping,
        info: "Skok do 9 lipca"
      };
    }
    const isWinterDeadZone = (month === 11 && day >= 8) || (month === 0 && day <= 30);

    if (isWinterDeadZone) {
      const targetYear = month === 11 ? currentDate.getFullYear() + 1 : currentDate.getFullYear();
      return {
        text: "PRZESKOCZ PRZERWĘ ZIMOWĄ ❄️",
        action: () => jumpToDate(new Date(targetYear, 0, 31)),
        isMatch: false,
        disabled: isJumping,
        info: "Skok do 31 stycznia"
      };
    }

    if (!nextEvent) return { text: "NASTĘPNY DZIEŃ", action: advanceDay, isMatch: false, disabled: false };
    const isToday = nextEvent.startDate.toDateString() === currentDate.toDateString();
    
    if (!isToday) {
       return { 
         text: isJumping ? "PRZETWARZANIE..." : `⚽ ${nextEvent.label.toUpperCase()}`, 
         action: () => jumpToDate(nextEvent.startDate), 
         isMatch: false, 
         disabled: isJumping 
       };
    }

    switch (nextEvent.kind) {
      case EventKind.MATCH_LEAGUE:
      case EventKind.MATCH_SUPER_CUP:
      case EventKind.MATCH_FRIENDLY:
        return { 
          text: lineupValidation.valid ? "DZIEŃ MECZOWY ⚽" : "BŁĄD SKŁADU ⚠️", 
          action: () => lineupValidation.valid ? navigateTo(ViewState.PRE_MATCH_STUDIO) : navigateTo(ViewState.SQUAD_VIEW), 
          isMatch: true, 
          disabled: isJumping, 
          error: lineupValidation.valid ? null : lineupValidation.error
        };
      case EventKind.MATCH_POLISH_CUP:
        return { 
          text: lineupValidation.valid ? "PUCHAR POLSKI 🏆" : "BŁĄD SKŁADU ⚠️", 
          action: () => lineupValidation.valid ? navigateTo(ViewState.PRE_MATCH_CUP_STUDIO) : navigateTo(ViewState.SQUAD_VIEW), 
          isMatch: true, 
          disabled: isJumping, 
          error: lineupValidation.valid ? null : lineupValidation.error
        };
      case EventKind.MATCH_EURO:
        return { 
          text: lineupValidation.valid ? "EURO 🌍" : "BŁĄD SKŁADU ⚠️", 
          action: () => lineupValidation.valid ? navigateTo(ViewState.PRE_MATCH_STUDIO) : navigateTo(ViewState.SQUAD_VIEW), 
          isMatch: true, 
          disabled: isJumping, 
          error: lineupValidation.valid ? null : lineupValidation.error
        };
      case EventKind.TRANSFER_WINDOW:
        return { 
          text: "OKNO TRANSFEROWE 📝", 
          action: advanceDay, 
          isMatch: false, 
          disabled: isJumping,
          info: "Dzień informacyjny"
        };
      default:
        return { text: "KONTYNUUJ", action: advanceDay, isMatch: false, disabled: isJumping };
    }
  }, [nextEvent, currentDate, advanceDay, jumpToDate, navigateTo, lineupValidation, isJumping, myClub, processBackgroundCupMatches]);

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
        relative group flex flex-col items-center justify-center p-2 rounded-3xl border transition-all duration-300 overflow-hidden
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
      <span className="text-3xl mb-2 transform group-hover:scale-110 group-hover:rotate-3 transition-transform">{icon}</span>
      <span className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 group-hover:text-white transition-colors text-center">{label}</span>
      {badge && <div className="absolute top-2 right-2">{badge}</div>}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 rounded-t-full opacity-0 group-hover:opacity-100 transition-all" style={{ backgroundColor: myClub?.colorsHex[0] }} />
    </button>
  );

  return (
    <div className="h-[1080px] max-w-[1920px] mx-auto flex flex-col gap-4 animate-fade-in overflow-hidden relative pr-2">
      
      {isJumping && (
        <div className="fixed inset-0 z-[1000] bg-black/40 backdrop-blur-[2px] flex items-center justify-center pointer-events-none">
           <div className="bg-slate-900 border border-white/10 px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-pulse">
              <div className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
              <span className="text-xs font-black text-white uppercase tracking-widest">PRZESUWANIE CZASU...</span>
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

  <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none bg-[#020617]">
        {/* 1. Cinematic Stadium Texture - High Contrast for visibility */}
       {/* 1. Cinematic Stadium Texture - High Contrast for visibility */}

        <div 
          className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&q=80&w=2000')] bg-cover bg-center opacity-[0.45] mix-blend-lighten scale-105"
        />
        
        {/* 2. Pro Glass Gloss - Diagonal light reflection */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-transparent z-10" />
        <div className="absolute inset-0 backdrop-blur-[3px]" />
        
        {/* 3. Deep Focus Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,#020617_100%)]" />
        
        {/* 4. Enhanced Dynamic Club Identity Glows */}
        <div 
          className="absolute top-[-10%] right-[-10%] w-[80%] h-[80%] rounded-full blur-[180px] opacity-[0.35] animate-pulse-slow transition-all duration-1000"
          style={{ background: myClub?.colorsHex[0] || '#1e293b' }}
        />
        <div 
          className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[150px] opacity-[0.2] animate-pulse-slow transition-all duration-1000"
          style={{ background: myClub?.colorsHex[1] || '#0f172a' }}
        />

        {/* 5. Precision Tactical Grid Overlay */}
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '45px 45px' }} />
      </div>

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

         <div className="flex items-center gap-8">
            <div className="text-right">
               <span className="block text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Budżet</span>
               <span className="text-xs font-black text-emerald-400 italic tabular-nums">{currentBudget} <span className="text-[8px] opacity-60">PLN</span></span>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-right">
               <span className="block text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Pozycja</span>
               <span className="text-xs font-black text-white italic">{userRank}. MIEJSCE</span>
            </div>
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

           {nextEvent && nextEvent.opponentClubId && (
             <div className="hidden lg:flex flex-col items-center bg-black/60 p-5 rounded-[32px] border border-white/10 backdrop-blur-xl shadow-2xl transform hover:scale-105 transition-transform cursor-help">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Następny Przeciwnik</span>
                <div className="flex items-center gap-6">
                   <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/5 border border-white/10 text-lg font-black italic text-white shadow-inner">{myClub?.shortName}</div>
                   <div className="text-sm font-black italic text-slate-700 animate-pulse">VS</div>
                   <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/5 border border-white/10 text-lg font-black italic text-white shadow-inner">
                      {clubs.find(c => c.id === nextEvent.opponentClubId)?.shortName}
                   </div>
                </div>
                <div className="mt-3 text-center">
                   <span className="block text-[10px] font-black text-blue-400 uppercase tracking-widest truncate max-w-[150px]">{nextEvent.label}</span>
                </div>
             </div>
           )}

           <div className="shrink-0 flex flex-col items-center gap-2">
              <button 
                onClick={actionConfig.action}
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
              <div className="p-7 relative z-10">
                 <div className="flex items-center gap-5 mb-8">
                    <div className="w-16 h-16 rounded-2xl flex flex-col overflow-hidden border border-white/20 shadow-2xl transform -rotate-3 group-hover:rotate-0 transition-transform">
                       <div className="flex-1" style={{ backgroundColor: myClub?.colorsHex[0] }} />
                       <div className="flex-1" style={{ backgroundColor: myClub?.colorsHex[1] }} />
                    </div>
                    <div>
                       <h3 className="text-xl font-black italic uppercase tracking-tighter text-white leading-tight">{myClub?.name}</h3>
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1">Status: Aktywny</p>
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

           <div className="space-y-4 shrink-0">
              {[
                { label: 'Budżet Transferowy', value: `${currentBudget} PLN`, color: 'text-blue-400', icon: '💰', p: 80 },
                { label: 'Zaufanie Zarządu', value: `${boardConfidence}%`, color: boardConfidence > 70 ? 'text-emerald-400' : (boardConfidence > 40 ? 'text-amber-400' : 'text-red-500'), icon: '📈', p: boardConfidence },
              ].map((stat, i) => (
                <div key={i} className="bg-slate-900/40 p-5 rounded-[28px] border border-white/5 flex flex-col gap-3 backdrop-blur-md hover:border-white/10 transition-all group shadow-xl">
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

       <div className="flex-1 grid grid-cols-2 gap-0.5">
              <TileButton label="TRENING" icon="🏋️‍♂️" onClick={() => navigateTo(ViewState.TRAINING_VIEW)} primary disabled={isJumping} />
              <TileButton label="PLANER" icon="📅" onClick={() => navigateTo(ViewState.CALENDAR_DEBUG)} disabled={isJumping} />
              <TileButton label="KADRA" icon="👕" onClick={() => navigateTo(ViewState.SQUAD_VIEW)} disabled={isJumping} />
              <TileButton 
                 label="TRANSFERY" 
                 icon="📝" 
                 onClick={() => navigateTo(ViewState.TRANSFER_WINDOW)} 
                 disabled={isJumping || !isTransferWindowOpen}
                 badge={!isTransferWindowOpen ? <span className="text-[7px] font-black text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">CLOSED</span> : null}
              />
              <TileButton label="LIGA" icon="📊" onClick={() => navigateTo(ViewState.LEAGUE_TABLES)} disabled={isJumping} />
              <TileButton label="STATYSTYKI" icon="🏆" onClick={() => navigateTo(ViewState.LEAGUE_STATS)} disabled={isJumping} />
              <TileButton label="HISTORIA" icon="📜" onClick={() => navigateTo(ViewState.MATCH_HISTORY_BROWSER)} disabled={isJumping} />             
              <TileButton label="RYNEK PRACY" icon="💼" onClick={() => navigateTo(ViewState.JOB_MARKET)} disabled={isJumping} />
              <TileButton label="EDYTOR" icon="✍️" onClick={() => navigateTo(ViewState.EDITOR)} disabled={isJumping} />
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
    </div>
  );
};