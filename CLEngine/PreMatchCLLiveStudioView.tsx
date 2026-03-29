import React, { useEffect, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { ViewState, CompetitionType, Player, PlayerPosition, HealthStatus, InjurySeverity } from '../types';
import { KitSelectionService } from '../services/KitSelectionService';
import { RAW_CHAMPIONS_LEAGUE_CLUBS, generateEuropeanClubId } from '../resources/static_db/clubs/ChampionsLeagueTeams';
import { PlayerPresentationService } from '../services/PlayerPresentationService';
import { TacticRepository } from '../resources/tactics_db';
import { getClubLogo } from '../resources/ClubLogoAssets';

import clThemeBg from '../Graphic/themes/cl_theme.png';

const GLASS_CARD = "bg-slate-950/40 backdrop-blur-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-[40px] relative overflow-hidden";
const GLOSS_LAYER = "absolute inset-0 bg-gradient-to-br from-white/[0.05] via-transparent to-transparent pointer-events-none";

export const PreMatchCLLiveStudioView: React.FC = () => {
  const {
    navigateTo,
    userTeamId,
    clubs,
    fixtures,
    players,
    lineups,
    currentDate,
  } = useGame();

  const fixture = useMemo(() => {
    return fixtures.find(f =>
      f.status === 'SCHEDULED' &&
      f.date.toDateString() === currentDate.toDateString() &&
      (f.homeTeamId === userTeamId || f.awayTeamId === userTeamId) &&
      (f.leagueId === CompetitionType.CL_R1Q || f.leagueId === CompetitionType.CL_R1Q_RETURN ||
       f.leagueId === CompetitionType.CL_R2Q || f.leagueId === CompetitionType.CL_R2Q_RETURN ||
       f.leagueId === CompetitionType.CL_GROUP_STAGE ||
       f.leagueId === CompetitionType.CL_R16 || f.leagueId === CompetitionType.CL_R16_RETURN ||
       f.leagueId === CompetitionType.CL_QF || f.leagueId === CompetitionType.CL_QF_RETURN ||
       f.leagueId === CompetitionType.CL_SF || f.leagueId === CompetitionType.CL_SF_RETURN ||
       f.leagueId === CompetitionType.CL_FINAL)
    );
  }, [fixtures, currentDate, userTeamId]);

  useEffect(() => {
    if (!fixture) {
      navigateTo(ViewState.PRE_MATCH_CL_STUDIO);
    }
  }, [fixture, navigateTo]);

  const homeClub = useMemo(() => fixture ? clubs.find(c => c.id === fixture.homeTeamId) : undefined, [fixture, clubs]);
  const awayClub = useMemo(() => fixture ? clubs.find(c => c.id === fixture.awayTeamId) : undefined, [fixture, clubs]);

  const weather = useMemo(() => {
    if (!homeClub || !fixture) return null;
    let country = 'POL';
    if (homeClub.leagueId === 'L_CL') {
      const raw = RAW_CHAMPIONS_LEAGUE_CLUBS.find(c => generateEuropeanClubId(c.name) === homeClub.id);
      country = raw?.country ?? 'POL';
    }
    let hash = 0;
    for (let i = 0; i < fixture.id.length; i++) {
      hash = ((hash << 5) - hash) + fixture.id.charCodeAt(i);
      hash |= 0;
    }
    const rng = (Math.abs(hash) % 100) / 100;
    const month = currentDate.getMonth();
    type MC = { minT: number; maxT: number; precip: number };
    const zones: Record<string, Record<number, MC>> = {
      NORDIC:        { 0:{minT:-8,maxT:-2,precip:0.45},1:{minT:-7,maxT:0,precip:0.40},2:{minT:-3,maxT:5,precip:0.35},3:{minT:3,maxT:11,precip:0.35},4:{minT:8,maxT:17,precip:0.30},5:{minT:12,maxT:21,precip:0.35},6:{minT:15,maxT:23,precip:0.40},7:{minT:14,maxT:22,precip:0.40},8:{minT:9,maxT:17,precip:0.40},9:{minT:4,maxT:11,precip:0.45},10:{minT:-1,maxT:5,precip:0.50},11:{minT:-5,maxT:0,precip:0.50} },
      ATLANTIC:      { 0:{minT:5,maxT:11,precip:0.55},1:{minT:5,maxT:12,precip:0.50},2:{minT:6,maxT:14,precip:0.45},3:{minT:8,maxT:16,precip:0.40},4:{minT:11,maxT:19,precip:0.40},5:{minT:14,maxT:22,precip:0.35},6:{minT:16,maxT:24,precip:0.30},7:{minT:16,maxT:24,precip:0.30},8:{minT:13,maxT:20,precip:0.40},9:{minT:10,maxT:16,precip:0.50},10:{minT:7,maxT:12,precip:0.55},11:{minT:5,maxT:10,precip:0.60} },
      CENTRAL:       { 0:{minT:-4,maxT:3,precip:0.38},1:{minT:-3,maxT:5,precip:0.33},2:{minT:2,maxT:10,precip:0.30},3:{minT:7,maxT:16,precip:0.35},4:{minT:12,maxT:21,precip:0.45},5:{minT:15,maxT:25,precip:0.50},6:{minT:17,maxT:27,precip:0.45},7:{minT:17,maxT:26,precip:0.40},8:{minT:12,maxT:21,precip:0.35},9:{minT:7,maxT:14,precip:0.30},10:{minT:2,maxT:8,precip:0.40},11:{minT:-2,maxT:4,precip:0.42} },
      EASTERN:       { 0:{minT:-12,maxT:-5,precip:0.40},1:{minT:-10,maxT:-3,precip:0.35},2:{minT:-4,maxT:5,precip:0.30},3:{minT:5,maxT:14,precip:0.35},4:{minT:12,maxT:21,precip:0.40},5:{minT:16,maxT:25,precip:0.45},6:{minT:18,maxT:28,precip:0.40},7:{minT:17,maxT:27,precip:0.38},8:{minT:12,maxT:21,precip:0.35},9:{minT:5,maxT:13,precip:0.30},10:{minT:-2,maxT:5,precip:0.38},11:{minT:-8,maxT:-2,precip:0.42} },
      BALKANS:       { 0:{minT:0,maxT:7,precip:0.40},1:{minT:1,maxT:9,precip:0.38},2:{minT:5,maxT:14,precip:0.35},3:{minT:10,maxT:19,precip:0.35},4:{minT:15,maxT:24,precip:0.35},5:{minT:19,maxT:28,precip:0.30},6:{minT:22,maxT:32,precip:0.15},7:{minT:22,maxT:31,precip:0.20},8:{minT:17,maxT:26,precip:0.30},9:{minT:12,maxT:20,precip:0.35},10:{minT:6,maxT:14,precip:0.40},11:{minT:2,maxT:8,precip:0.42} },
      MEDITERRANEAN: { 0:{minT:8,maxT:15,precip:0.32},1:{minT:8,maxT:16,precip:0.28},2:{minT:11,maxT:19,precip:0.22},3:{minT:14,maxT:22,precip:0.18},4:{minT:18,maxT:27,precip:0.12},5:{minT:22,maxT:31,precip:0.08},6:{minT:25,maxT:34,precip:0.04},7:{minT:25,maxT:34,precip:0.05},8:{minT:21,maxT:30,precip:0.15},9:{minT:17,maxT:24,precip:0.28},10:{minT:13,maxT:20,precip:0.32},11:{minT:9,maxT:15,precip:0.35} }
    };
    const countryToZone: Record<string, string> = {
      NOR:'NORDIC',SWE:'NORDIC',FIN:'NORDIC',ISL:'NORDIC',FRO:'NORDIC',DEN:'NORDIC',
      ENG:'ATLANTIC',SCO:'ATLANTIC',IRL:'ATLANTIC',WAL:'ATLANTIC',NIR:'ATLANTIC',POR:'ATLANTIC',
      GER:'CENTRAL',FRA:'CENTRAL',NED:'CENTRAL',BEL:'CENTRAL',AUT:'CENTRAL',SUI:'CENTRAL',
      CZE:'CENTRAL',SVK:'CENTRAL',HUN:'CENTRAL',POL:'CENTRAL',BIA:'CENTRAL',LUX:'CENTRAL',
      RUS:'EASTERN',UKR:'EASTERN',KAZ:'EASTERN',EST:'EASTERN',LAT:'EASTERN',LTU:'EASTERN',
      SRB:'BALKANS',CRO:'BALKANS',BIH:'BALKANS',MKD:'BALKANS',SVN:'BALKANS',BUL:'BALKANS',MDA:'BALKANS',AZE:'BALKANS',GEO:'BALKANS',
      ESP:'MEDITERRANEAN',ITA:'MEDITERRANEAN',GRE:'MEDITERRANEAN',CYP:'MEDITERRANEAN',ISR:'MEDITERRANEAN',TUR:'MEDITERRANEAN',GIB:'MEDITERRANEAN',ALB:'MEDITERRANEAN'
    };
    const zone = countryToZone[country] ?? 'CENTRAL';
    const cfg = zones[zone][month];
    const tempC = Math.floor(cfg.minT + rng * (cfg.maxT - cfg.minT));
    const isRaining = rng < cfg.precip;
    let description = 'Bezchmurnie';
    if (isRaining) {
      description = tempC < 1 ? 'Opady śniegu' : (rng > 0.8 ? 'Ulewny deszcz' : 'Lekki deszcz');
    } else if (rng > 0.6) {
      description = 'Zachmurzenie umiarkowane';
    }
    return { tempC, description };
  }, [homeClub, fixture, currentDate]);

  const homeLineup = useMemo(() => homeClub ? lineups[homeClub.id] : undefined, [homeClub, lineups]);
  const awayLineup = useMemo(() => awayClub ? lineups[awayClub.id] : undefined, [awayClub, lineups]);

  const matchKits = useMemo(() => {
    if (!homeClub || !awayClub) return null;
    return KitSelectionService.selectOptimalKits(homeClub, awayClub);
  }, [homeClub, awayClub]);

  const squadDetails = useMemo(() => {
    if (!fixture || !homeClub || !awayClub || !homeLineup || !awayLineup) return null;
    const hAllPlayers = players[homeClub.id] || [];
    const aAllPlayers = players[awayClub.id] || [];
    const hXI = homeLineup.startingXI.map(id => hAllPlayers.find(p => p.id === id)).filter(Boolean) as Player[];
    const aXI = awayLineup.startingXI.map(id => aAllPlayers.find(p => p.id === id)).filter(Boolean) as Player[];
    const hBench = homeLineup.bench.map(id => hAllPlayers.find(p => p.id === id)).filter(Boolean) as Player[];
    const aBench = awayLineup.bench.map(id => aAllPlayers.find(p => p.id === id)).filter(Boolean) as Player[];
    return { hXI, aXI, hBench, aBench };
  }, [fixture, homeClub, awayClub, homeLineup, awayLineup, players]);

  const homeTactic = useMemo(() => homeLineup ? TacticRepository.getById(homeLineup.tacticId) : null, [homeLineup]);
  const awayTactic = useMemo(() => awayLineup ? TacticRepository.getById(awayLineup.tacticId) : null, [awayLineup]);

  const userLineup = useMemo(() => (userTeamId ? lineups[userTeamId] : null) ?? null, [userTeamId, lineups]);

  const userXICount = useMemo(() => {
    if (!userLineup) return 0;
    return userLineup.startingXI.filter(id => id !== null).length;
  }, [userLineup]);

  const showLineupWarning = useMemo(() => {
    if (!userTeamId || !fixture || userXICount >= 11) return false;
    const userPlayers = players[userTeamId] || [];
    const availableCount = userPlayers.filter(p =>
      (p.suspensionMatches || 0) === 0 &&
      p.condition >= 60 &&
      (p.health.status !== HealthStatus.INJURED || (p.health.injury?.severity !== InjurySeverity.SEVERE && (p.health.injury?.daysRemaining ?? 0) <= 2))
    ).length;
    return availableCount >= 11;
  }, [userTeamId, fixture, userXICount, players]);

  const estimatedAttendance = useMemo(() => {
    if (!homeClub || !awayClub || !fixture || !weather) return 0;
    const homeRep = homeClub.reputation;
    const awayRep = awayClub.reputation;
    // Zasada b): jeśli którakolwiek drużyna ma reputację 18+ → komplet widzów
    if (homeRep >= 18 || awayRep >= 18) {
      return homeClub.stadiumCapacity;
    }
    // Deterministyczny pseudo-RNG oparty na fixture.id (stabilny między renderami)
    const seed = fixture.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const pseudoRng = ((seed * 9301 + 49297) % 233280) / 233280;
    // Progresywna formuła: combinedRep w zakresie 2–34 (max gdy żadna drużyna nie ma rep 18+)
    // rep 2+2=4  → fillRate ~0.45
    // rep 10+10=20 → fillRate ~0.68
    // rep 17+17=34 → fillRate ~0.92
    const combinedRep = homeRep + awayRep;
    const repNorm = Math.max(0, Math.min(1, (combinedRep - 2) / 32));
    // Zakres losowości maleje dla silniejszych drużyn (słabe: ±10%, mocne: ±0%)
    const scatter = 0.10 * (1 - repNorm);
    const randomOffset = (pseudoRng * 2 - 1) * scatter;
    // fillRate: 0.45 (najsłabsze) → 0.92 (tuż przed progiem rep 18+)
    const fillRate = 0.45 + 0.47 * repNorm + randomOffset;
    const weatherPenalty = weather.description.toLowerCase().includes('deszcz') ? 0.88 : 1.0;
    return Math.floor(homeClub.stadiumCapacity * Math.min(1, fillRate * weatherPenalty));
  }, [homeClub, awayClub, fixture, weather]);

  const firstLegResult = useMemo(() => {
    if (!fixture || !homeClub || !awayClub) return null;
    const returnToFirstLeg: Record<string, string> = {
      [CompetitionType.CL_R1Q_RETURN]: CompetitionType.CL_R1Q,
      [CompetitionType.CL_R2Q_RETURN]: CompetitionType.CL_R2Q,
      [CompetitionType.CL_R16_RETURN]: CompetitionType.CL_R16,
      [CompetitionType.CL_QF_RETURN]: CompetitionType.CL_QF,
      [CompetitionType.CL_SF_RETURN]: CompetitionType.CL_SF,
    };
    const firstLegId = returnToFirstLeg[fixture.leagueId as string];
    if (!firstLegId) return null;
    const firstLeg = fixtures.find(f =>
      f.leagueId === firstLegId &&
      f.homeTeamId === fixture.awayTeamId &&
      f.awayTeamId === fixture.homeTeamId &&
      f.status === 'FINISHED'
    );
    if (!firstLeg || firstLeg.homeScore === null || firstLeg.awayScore === null) return null;
    return { homeScore: firstLeg.homeScore, awayScore: firstLeg.awayScore };
  }, [fixture, fixtures, homeClub, awayClub]);

  const teamStats = useMemo(() => {
    if (!squadDetails) return null;
    const avg = (vals: number[]) => vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
    const hNonGK = squadDetails.hXI.filter(p => p.position !== PlayerPosition.GK);
    const aNonGK = squadDetails.aXI.filter(p => p.position !== PlayerPosition.GK);
    return {
      homeAttack:   avg(hNonGK.map(p => Math.round((p.attributes.attacking + p.attributes.finishing) / 2))),
      homeDefense:  avg(squadDetails.hXI.map(p => p.attributes.defending)),
      homePressing: avg(hNonGK.map(p => p.attributes.stamina)),
      awayAttack:   avg(aNonGK.map(p => Math.round((p.attributes.attacking + p.attributes.finishing) / 2))),
      awayDefense:  avg(squadDetails.aXI.map(p => p.attributes.defending)),
      awayPressing: avg(aNonGK.map(p => p.attributes.stamina)),
    };
  }, [squadDetails]);

  const bettingOdds = useMemo(() => {
    if (!homeClub || !awayClub || !fixture) return null;
    const seed = fixture.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const nudge = (((seed * 1234567) % 100) / 1000) - 0.05;
    const repDiff = (homeClub.reputation - awayClub.reputation) / 20;
    const pHome = Math.max(0.20, Math.min(0.75, 0.42 + repDiff * 0.28 + 0.06 + nudge));
    const pDraw = Math.max(0.15, Math.min(0.32, 0.28 - Math.abs(repDiff) * 0.08));
    const pAway = Math.max(0.10, 1 - pHome - pDraw);
    const total = pHome + pDraw + pAway;
    const margin = 1.05;
    const toOdds = (p: number) => Math.round((1 / ((p / total) * margin)) * 100) / 100;
    return { home: toOdds(pHome), draw: toOdds(pDraw), away: toOdds(pAway) };
  }, [homeClub, awayClub, fixture]);

  const roundLabel = useMemo(() => {
    if (!fixture) return 'LIGA MISTRZÓW';
    switch (fixture.leagueId) {
      case CompetitionType.CL_R1Q: return '1. RUNDA PREELIMINACYJNA';
      case CompetitionType.CL_R1Q_RETURN: return '1. RUNDA PREELIMINACYJNA — REWANŻ';
      case CompetitionType.CL_R2Q: return '2. RUNDA PREELIMINACYJNA';
      case CompetitionType.CL_R2Q_RETURN: return '2. RUNDA PREELIMINACYJNA — REWANŻ';
      case CompetitionType.CL_GROUP_STAGE: return 'FAZA GRUPOWA';
      case CompetitionType.CL_R16: return '1/8 FINAŁU';
      case CompetitionType.CL_R16_RETURN: return '1/8 FINAŁU — REWANŻ';
      case CompetitionType.CL_QF: return '1/4 FINAŁU';
      case CompetitionType.CL_QF_RETURN: return '1/4 FINAŁU — REWANŻ';
      case CompetitionType.CL_SF: return '1/2 FINAŁU';
      case CompetitionType.CL_SF_RETURN: return '1/2 FINAŁU — REWANŻ';
      default: return 'LIGA MISTRZÓW';
    }
  }, [fixture]);

  const weatherIcon = useMemo(() => {
    if (!weather) return '⛅';
    const desc = weather.description.toLowerCase();
    if (desc.includes('burza')) return '⛈️';
    if (desc.includes('deszcz')) return '🌧️';
    if (desc.includes('śnieg')) return '❄️';
    if (desc.includes('pochmur')) return '☁️';
    return '☀️';
  }, [weather]);

  if (!fixture || !homeClub || !awayClub || !matchKits || !squadDetails || !weather) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-950 text-white font-black uppercase italic tracking-tighter text-amber-400">
        Inicjalizacja Studia Champions League...
      </div>
    );
  }

  const formatPlayerName = (p: Player) => `${p.firstName.charAt(0)}. ${p.lastName}`;

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden relative text-slate-100">

      {/* TŁO */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img src={clThemeBg} alt="" className="w-full h-full object-cover opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-950/50 to-slate-950/95" />
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-amber-500/8 blur-[150px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-blue-900/10 blur-[150px]" />
      </div>

      <div className="relative z-10 flex flex-col h-full p-5 gap-4">

        {/* HEADER */}
        <div className={GLASS_CARD + " p-5 shrink-0"}>
          <div className={GLOSS_LAYER} />
          <div className="relative z-10 flex items-center justify-between">
            {/* Lewa — gospodarz */}
            <div className="flex items-center gap-4 flex-1">
              {getClubLogo(homeClub.id) && (
                <img src={getClubLogo(homeClub.id)} alt={homeClub.name} className="w-16 h-16 object-contain drop-shadow-2xl" />
              )}
              <div>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">Gospodarz</p>
                <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">{homeClub.name}</h2>
                <p className="text-amber-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">{homeTactic?.name || '—'}</p>
              </div>
            </div>

            {/* Środek — tytuł */}
            <div className="flex flex-col items-center px-8 text-center shrink-0">
              <p className="text-amber-400 text-[9px] font-black uppercase tracking-[0.5em]">UEFA Champions League</p>
              <h1 className="text-2xl font-black italic uppercase tracking-tighter text-white leading-tight mt-1">{roundLabel}</h1>
              {firstLegResult && (
                <p className="text-[10px] font-black text-amber-300 uppercase tracking-widest mt-1">
                  1. mecz: {awayClub.name} {firstLegResult.homeScore}:{firstLegResult.awayScore} {homeClub.name}
                </p>
              )}
              <p className="text-slate-400 text-[10px] mt-1">{currentDate.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · 22:00</p>
              <div className="flex items-center gap-2 mt-3">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-[0_0_10px_rgba(251,191,36,0.8)]" />
                <span className="text-[9px] font-black text-amber-400 uppercase tracking-[0.4em]">Studio Przedmeczowe</span>
              </div>
            </div>

            {/* Prawa — gość */}
            <div className="flex items-center gap-4 flex-1 justify-end text-right">
              <div>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">Gość</p>
                <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">{awayClub.name}</h2>
                <p className="text-amber-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">{awayTactic?.name || '—'}</p>
              </div>
              {getClubLogo(awayClub.id) && (
                <img src={getClubLogo(awayClub.id)} alt={awayClub.name} className="w-16 h-16 object-contain drop-shadow-2xl" />
              )}
            </div>
          </div>
        </div>

        {/* GŁÓWNA TREŚĆ */}
        <div className="flex-1 flex gap-4 min-h-0">

          {/* SKŁAD GOSPODARZY */}
          <div className={GLASS_CARD + " w-64 p-5 flex flex-col shrink-0"}>
            <div className={GLOSS_LAYER} />
            <div className="relative z-10 flex flex-col h-full">
              <p className="text-[9px] font-black text-amber-400 uppercase tracking-[0.4em] text-center mb-3">{homeClub.name} — Skład</p>
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1">
                {squadDetails.hXI.map(p => (
                  <div key={p.id} className="flex items-center gap-2 py-1 border-b border-white/[0.03]">
                    <span className={`font-mono font-black text-[9px] w-7 shrink-0 ${PlayerPresentationService.getPositionColorClass(p.position)}`}>{p.position}</span>
                    <span className="text-[11px] font-bold text-white uppercase italic truncate">{formatPlayerName(p)}</span>
                  </div>
                ))}
                {squadDetails.hBench.length > 0 && (
                  <>
                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest text-center pt-2 pb-1">Ławka</p>
                    {squadDetails.hBench.map(p => (
                      <div key={p.id} className="flex items-center gap-2 py-0.5 opacity-45">
                        <span className="font-mono text-[9px] w-7 shrink-0 text-slate-500">{p.position}</span>
                        <span className="text-[10px] text-slate-400 uppercase truncate">{formatPlayerName(p)}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* CENTRUM */}
          <div className="flex-1 flex flex-col gap-4 min-w-0">

            {/* INFO MECZU — pogoda, stadion, widzowie */}
            <div className="flex gap-4 shrink-0">
              <div className={GLASS_CARD + " flex-1 p-4"}>
                <div className={GLOSS_LAYER} />
                <div className="relative z-10 text-center">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] mb-1">Pogoda</p>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-3xl">{weatherIcon}</span>
                    <div className="text-left">
                      <p className="text-xl font-black text-white italic">{weather.tempC}°C</p>
                      <p className="text-[10px] text-slate-400 capitalize">{weather.description}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className={GLASS_CARD + " flex-[2] p-4"}>
                <div className={GLOSS_LAYER} />
                <div className="relative z-10 text-center">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] mb-1">Miejsce Rozegrania</p>
                  <p className="text-lg font-black text-white italic uppercase truncate">{homeClub.stadiumName}</p>
                  <p className="text-slate-400 text-[10px] capitalize">{homeClub.name}</p>
                </div>
              </div>

              <div className={GLASS_CARD + " flex-1 p-4"}>
                <div className={GLOSS_LAYER} />
                <div className="relative z-10 text-center">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] mb-1">Widzów</p>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-2xl">🏟️</span>
                    <p className="text-xl font-black text-white italic">{estimatedAttendance.toLocaleString('pl-PL')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* TAKTYKI + KURSY */}
            <div className="flex gap-4 shrink-0">
              <div className={GLASS_CARD + " flex-1 p-4"}>
                <div className={GLOSS_LAYER} />
                <div className="relative z-10 text-center">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] mb-1">Taktyka Gospodarzy</p>
                  <p className="text-xl font-black text-amber-400 italic uppercase">{homeTactic?.name || '—'}</p>
                  {teamStats && (
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Atak {teamStats.homeAttack} · Obrona {teamStats.homeDefense} · Pressing {teamStats.homePressing}
                    </p>
                  )}
                </div>
              </div>

              <div className={GLASS_CARD + " flex-1 p-4"}>
                <div className={GLOSS_LAYER} />
                <div className="relative z-10 text-center">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] mb-1">Kursy Bukmacherskie 1 · X · 2</p>
                  {bettingOdds ? (
                    <div className="flex items-center justify-center gap-4 mt-1">
                      <div className="text-center">
                        <p className="text-[8px] text-slate-500 uppercase">1</p>
                        <p className="text-xl font-black text-white italic">{bettingOdds.home.toFixed(2)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[8px] text-slate-500 uppercase">X</p>
                        <p className="text-xl font-black text-amber-400 italic">{bettingOdds.draw.toFixed(2)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[8px] text-slate-500 uppercase">2</p>
                        <p className="text-xl font-black text-white italic">{bettingOdds.away.toFixed(2)}</p>
                      </div>
                    </div>
                  ) : <p className="text-slate-500 text-sm">—</p>}
                </div>
              </div>

              <div className={GLASS_CARD + " flex-1 p-4"}>
                <div className={GLOSS_LAYER} />
                <div className="relative z-10 text-center">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] mb-1">Taktyka Gości</p>
                  <p className="text-xl font-black text-amber-400 italic uppercase">{awayTactic?.name || '—'}</p>
                  {teamStats && (
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Atak {teamStats.awayAttack} · Obrona {teamStats.awayDefense} · Pressing {teamStats.awayPressing}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* ETYKIETA MECZU */}
            <div className="flex-1 flex flex-col items-center justify-center gap-5">
              <div className="flex items-center gap-6">
                {getClubLogo(homeClub.id) && (
                  <img src={getClubLogo(homeClub.id)} alt={homeClub.name} className="w-20 h-20 object-contain drop-shadow-2xl opacity-90 transform -rotate-3" />
                )}
                <div className="text-center">
                  <p className="text-amber-400 text-[9px] font-black uppercase tracking-[0.6em]">UEFA Champions League</p>
                  <h2 className="text-5xl font-black italic uppercase tracking-tighter text-white leading-none my-1">
                    {homeClub.name} <span className="text-amber-400">vs</span> {awayClub.name}
                  </h2>
                  <p className="text-slate-400 text-sm uppercase tracking-widest">{roundLabel}</p>
                </div>
                {getClubLogo(awayClub.id) && (
                  <img src={getClubLogo(awayClub.id)} alt={awayClub.name} className="w-20 h-20 object-contain drop-shadow-2xl opacity-90 transform rotate-3" />
                )}
              </div>

              {showLineupWarning && (
                <div className="w-full max-w-lg bg-red-950/60 border border-red-500/40 rounded-[24px] px-6 py-4 flex items-center gap-4 shadow-[0_0_30px_rgba(239,68,68,0.15)]">
                  <span className="text-3xl shrink-0">⚠️</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-red-400 text-[10px] font-black uppercase tracking-[0.3em] leading-none mb-1">NIEKOMPLETNY SKŁAD</p>
                    <p className="text-slate-300 text-[11px] font-bold leading-snug">
                      W pierwszym składzie brakuje zawodników ({userXICount}/11). Uzupełnij skład przed meczem.
                    </p>
                  </div>
                  <button
                    onClick={() => navigateTo(ViewState.SQUAD_VIEW)}
                    className="shrink-0 px-4 py-2 bg-red-500/20 hover:bg-red-500/40 border border-red-500/40 text-red-300 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all"
                  >
                    EDYTUJ SKŁAD →
                  </button>
                </div>
              )}
              <button
                onClick={() => navigateTo(ViewState.MATCH_LIVE_CL)}
                className="px-20 py-5 rounded-[30px] bg-amber-400 hover:bg-amber-300 text-slate-900 font-black italic text-xl uppercase tracking-tighter transition-all hover:scale-105 active:scale-95 shadow-[0_20px_60px_rgba(251,191,36,0.35)] border-b-4 border-amber-600"
              >
                ZAGRAJ NA ŻYWO ⭐
              </button>
              <button
                onClick={() => navigateTo(ViewState.SQUAD_VIEW)}
                className="px-10 py-2.5 rounded-[20px] bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white font-black text-[11px] uppercase tracking-widest transition-all"
              >
                ZMIEŃ SKŁAD →
              </button>
            </div>
          </div>

          {/* SKŁAD GOŚCI */}
          <div className={GLASS_CARD + " w-64 p-5 flex flex-col shrink-0"}>
            <div className={GLOSS_LAYER} />
            <div className="relative z-10 flex flex-col h-full">
              <p className="text-[9px] font-black text-amber-400 uppercase tracking-[0.4em] text-center mb-3">{awayClub.name} — Skład</p>
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 text-right">
                {squadDetails.aXI.map(p => (
                  <div key={p.id} className="flex items-center gap-2 py-1 border-b border-white/[0.03] flex-row-reverse">
                    <span className={`font-mono font-black text-[9px] w-7 shrink-0 text-right ${PlayerPresentationService.getPositionColorClass(p.position)}`}>{p.position}</span>
                    <span className="text-[11px] font-bold text-white uppercase italic truncate">{formatPlayerName(p)}</span>
                  </div>
                ))}
                {squadDetails.aBench.length > 0 && (
                  <>
                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest text-center pt-2 pb-1">Ławka</p>
                    {squadDetails.aBench.map(p => (
                      <div key={p.id} className="flex items-center gap-2 py-0.5 opacity-45 flex-row-reverse">
                        <span className="font-mono text-[9px] w-7 shrink-0 text-slate-500">{p.position}</span>
                        <span className="text-[10px] text-slate-400 uppercase truncate">{formatPlayerName(p)}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(251,191,36,0.15); border-radius: 10px; }
      `}</style>
    </div>
  );
};
