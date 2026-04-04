import React, { useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { ViewState, Player, PlayerPosition } from '../types';
import { TacticRepository } from '../resources/tactics_db';
import { KitSelectionService } from '../services/KitSelectionService';
import { PolandWeatherService } from '../services/PolandWeatherService';
import { getPlayerCardImage } from '../resources/PlayerCardAssets';
import { getClubLogo } from '../resources/ClubLogoAssets';
import EkstraklasaBg from '../Graphic/themes/ekstraklasa.png';

// ── PRE-MATCH STUDIO — BARAŻOWY MECZ GRACZA ─────────────────────────────────
// Wyświetla informacje przed interaktywnym meczem barażowym gracza.
// Dla RELEGATION_LEG2 pokazuje wynik pierwszego meczu + agregat.

const withAlpha = (color: string | undefined, alpha: number): string => {
  if (!color) return `rgba(148,163,184,${alpha})`;
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const n = hex.length === 3 ? hex.split('').map(c => c + c).join('') : hex;
    const r = parseInt(n.slice(0, 2), 16);
    const g = parseInt(n.slice(2, 4), 16);
    const b = parseInt(n.slice(4, 6), 16);
    if ([r, g, b].some(v => Number.isNaN(v))) return `rgba(148,163,184,${alpha})`;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return `rgba(148,163,184,${alpha})`;
};

export const PreMatchPlayoffStudioView: React.FC = () => {
  const {
    navigateTo,
    userTeamId,
    players,
    lineups,
    currentDate,
    activePlayoffMatch,
  } = useGame();

  if (!activePlayoffMatch) {
    navigateTo(ViewState.DASHBOARD);
    return null;
  }

  const { homeClub, awayClub, matchType, firstLegResult } = activePlayoffMatch;

  const homePlayers = players[homeClub.id] || [];
  const awayPlayers = players[awayClub.id] || [];
  const homeLineup = lineups[homeClub.id];
  const awayLineup = lineups[awayClub.id];

  const isLeg2 = matchType === 'RELEGATION_LEG2';
  const isPromotion = matchType === 'PROMOTION_SEMI' || matchType === 'PROMOTION_FINAL';

  const matchKits = useMemo(
    () => KitSelectionService.selectOptimalKits(homeClub, awayClub),
    [homeClub, awayClub]
  );

  const weather = useMemo(
    () => PolandWeatherService.getWeather(currentDate, `PLAYOFF_${homeClub.id}_${awayClub.id}`),
    [currentDate, homeClub.id, awayClub.id]
  );

  const squadDetails = useMemo(() => {
    if (!homeLineup || !awayLineup) return null;
    const hXI = homeLineup.startingXI
      .map(id => homePlayers.find(p => p.id === id))
      .filter(Boolean) as Player[];
    const aXI = awayLineup.startingXI
      .map(id => awayPlayers.find(p => p.id === id))
      .filter(Boolean) as Player[];
    const getAvg = (squad: Player[]) =>
      squad.length === 0 ? 50 : Math.round(squad.reduce((s, p) => s + p.overallRating, 0) / squad.length);
    const getLine = (squad: Player[], pos: string) => {
      const f = squad.filter(p => p.position === pos);
      return f.length === 0 ? 50 : Math.round(f.reduce((s, p) => s + p.overallRating, 0) / f.length);
    };
    return {
      hXI, aXI,
      hAvg: getAvg(hXI), aAvg: getAvg(aXI),
      hDef: getLine(hXI, PlayerPosition.DEF), hMid: getLine(hXI, PlayerPosition.MID), hAtt: getLine(hXI, PlayerPosition.FWD),
      aDef: getLine(aXI, PlayerPosition.DEF), aMid: getLine(aXI, PlayerPosition.MID), aAtt: getLine(aXI, PlayerPosition.FWD),
    };
  }, [homeLineup, awayLineup, homePlayers, awayPlayers]);

  const homeTactic = homeLineup ? TacticRepository.getById(homeLineup.tacticId) : null;
  const awayTactic = awayLineup ? TacticRepository.getById(awayLineup.tacticId) : null;

  // Tytuł meczu
  const matchTitle = useMemo(() => {
    if (matchType === 'RELEGATION_LEG1') return 'BARAŻ O UTRZYMANIE — 1. MECZ';
    if (matchType === 'RELEGATION_LEG2') return 'BARAŻ O UTRZYMANIE — REWANŻ';
    if (matchType === 'PROMOTION_SEMI') return 'BARAŻ O AWANS — PÓŁFINAŁ';
    return 'BARAŻ O AWANS — FINAŁ';
  }, [matchType]);

  // Agregat (tylko dla LEG2)
  const leg2AggregateInfo = useMemo(() => {
    if (!isLeg2 || !firstLegResult) return null;
    // homeId w firstLegResult to L3 (grał u siebie w leg1)
    const clubL3Id = firstLegResult.homeId;
    const clubL4Id = firstLegResult.awayId;
    const l3Goals = firstLegResult.homeGoals; // gole L3 w leg1
    const l4Goals = firstLegResult.awayGoals; // gole L4 w leg1
    return { clubL3Id, clubL4Id, l3Goals, l4Goals };
  }, [isLeg2, firstLegResult]);

  const bg = `linear-gradient(135deg,
    ${withAlpha(homeClub.colorsHex?.[0], 0.3)} 0%,
    rgba(2,6,23,0.6) 50%,
    ${withAlpha(awayClub.colorsHex?.[0], 0.3)} 100%)`;

  const renderPlayerRow = (p: Player, side: 'home' | 'away') => {
    const img = getPlayerCardImage(p.id, side === 'home' ? matchKits.home.primary : matchKits.away.primary);
    return (
      <div key={p.id} className="flex items-center gap-2 py-0.5">
        {img && <img src={img} alt="" className="w-5 h-5 object-contain rounded" />}
        <span className="text-xs text-slate-300 truncate flex-1">{p.firstName.charAt(0)}. {p.lastName}</span>
        <span className="text-xs font-black text-white">{p.overallRating}</span>
      </div>
    );
  };

  return (
    <div className="h-screen w-full text-slate-100 flex flex-col overflow-hidden relative" style={{ background: 'rgb(2,6,23)' }}>

      {/* Tło */}
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-cover bg-center scale-110 opacity-40" style={{ backgroundImage: `url(${EkstraklasaBg})` }} />
        <div className="absolute inset-0" style={{ backgroundImage: bg }} />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/50 via-slate-950/70 to-slate-950" />
        {isPromotion && (
          <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[80%] h-[50%] rounded-full bg-emerald-600/10 blur-[150px]" />
        )}
        {!isPromotion && (
          <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[80%] h-[50%] rounded-full bg-amber-600/10 blur-[150px]" />
        )}
      </div>

      {/* Nagłówek */}
      <header className="relative shrink-0 w-full max-w-[1400px] mx-auto px-6 pt-6">
        <div className="bg-slate-900/70 border border-white/10 rounded-[32px] overflow-hidden shadow-2xl">
          <div className="flex items-stretch justify-between h-18">

            {/* Lewa — gospodarz */}
            <div className="flex-1 flex items-center gap-6 px-8 py-3">
              {getClubLogo(homeClub.id) ? (
                <img src={getClubLogo(homeClub.id)} alt={homeClub.name} className="w-10 h-10 object-contain" />
              ) : (
                <div className="w-10 h-10 rounded-xl border border-white/15 flex flex-col overflow-hidden" style={{ backgroundColor: matchKits.home.primary }}>
                  <div className="flex-1" style={{ backgroundColor: matchKits.home.secondary }} />
                </div>
              )}
              <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white drop-shadow">{homeClub.name}</h2>
            </div>

            {/* Środek — tytuł */}
            <div className="px-10 flex flex-col justify-center items-center border-x border-white/8 bg-white/[0.03]">
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-2 h-2 rounded-full animate-pulse shadow-md ${isPromotion ? 'bg-emerald-500 shadow-emerald-500/60' : 'bg-amber-500 shadow-amber-500/60'}`} />
                <span className={`text-[10px] font-black tracking-[0.3em] uppercase ${isPromotion ? 'text-emerald-300' : 'text-amber-300'}`}>
                  {matchTitle}
                </span>
              </div>
              <div className={`h-0.5 w-20 rounded-full ${isPromotion ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            </div>

            {/* Prawa — gość */}
            <div className="flex-1 flex items-center justify-end gap-6 px-8 py-3">
              <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white text-right drop-shadow">{awayClub.name}</h2>
              {getClubLogo(awayClub.id) ? (
                <img src={getClubLogo(awayClub.id)} alt={awayClub.name} className="w-10 h-10 object-contain" />
              ) : (
                <div className="w-10 h-10 rounded-xl border border-white/15 flex flex-col overflow-hidden" style={{ backgroundColor: matchKits.away.primary }}>
                  <div className="flex-1" style={{ backgroundColor: matchKits.away.secondary }} />
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Baner agregatu (tylko rewanż) */}
      {isLeg2 && leg2AggregateInfo && (
        <div className="shrink-0 w-full max-w-[1400px] mx-auto px-6 mt-3">
          <div className="bg-amber-950/40 border border-amber-500/30 rounded-[20px] px-8 py-3 flex items-center justify-center gap-8 shadow-lg">
            <span className="text-amber-300 font-black uppercase tracking-widest text-xs">Wynik 1. meczu</span>
            <div className="flex items-center gap-4">
              {/* L3 (grał u siebie w leg1) */}
              <div className="flex items-center gap-2">
                {getClubLogo(leg2AggregateInfo.clubL3Id) && (
                  <img src={getClubLogo(leg2AggregateInfo.clubL3Id)} alt="" className="w-6 h-6 object-contain" />
                )}
                <span className="text-white font-black text-xl">{leg2AggregateInfo.l3Goals}</span>
              </div>
              <span className="text-slate-400 font-black">:</span>
              <div className="flex items-center gap-2">
                <span className="text-white font-black text-xl">{leg2AggregateInfo.l4Goals}</span>
                {getClubLogo(leg2AggregateInfo.clubL4Id) && (
                  <img src={getClubLogo(leg2AggregateInfo.clubL4Id)} alt="" className="w-6 h-6 object-contain" />
                )}
              </div>
            </div>
            <span className="text-amber-400/60 text-xs font-black uppercase tracking-widest">Agregat po rewanżu decyduje</span>
          </div>
        </div>
      )}

      {/* Główna sekcja */}
      <div className="flex-1 overflow-hidden w-full max-w-[1400px] mx-auto px-6 mt-4 flex gap-4">

        {/* Skład domu */}
        <div className="w-56 shrink-0 bg-slate-900/50 border border-white/8 rounded-[24px] p-4 flex flex-col gap-2 overflow-hidden">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Jedenastka</div>
          {squadDetails?.hXI.map(p => renderPlayerRow(p, 'home'))}
          {squadDetails && (
            <div className="mt-2 pt-2 border-t border-white/8">
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-500 uppercase">OVR</span>
                <span className="text-white font-black">{squadDetails.hAvg}</span>
              </div>
              <div className="flex justify-between text-[10px] mt-0.5">
                <span className="text-slate-500">Obrona</span><span className="text-slate-300">{squadDetails.hDef}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-500">Pomoc</span><span className="text-slate-300">{squadDetails.hMid}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-500">Atak</span><span className="text-slate-300">{squadDetails.hAtt}</span>
              </div>
            </div>
          )}
        </div>

        {/* Centrum */}
        <div className="flex-1 flex flex-col gap-4">

          {/* Taktyki */}
          <div className="bg-slate-900/50 border border-white/8 rounded-[24px] p-5 flex items-center justify-around">
            <div className="text-center">
              <div className="text-xs text-slate-400 uppercase mb-1">Formacja</div>
              <div className="text-2xl font-black text-white">{homeTactic?.name ?? '—'}</div>
              {homeTactic && (
                <div className="text-[10px] text-slate-500 mt-1">Pressing: {homeTactic.pressingIntensity}%</div>
              )}
            </div>
            <div className={`text-xs font-black tracking-widest uppercase px-4 py-2 rounded-xl border ${isPromotion ? 'border-emerald-500/40 text-emerald-300 bg-emerald-950/30' : 'border-amber-500/40 text-amber-300 bg-amber-950/30'}`}>
              vs
            </div>
            <div className="text-center">
              <div className="text-xs text-slate-400 uppercase mb-1">Formacja</div>
              <div className="text-2xl font-black text-white">{awayTactic?.name ?? '—'}</div>
              {awayTactic && (
                <div className="text-[10px] text-slate-500 mt-1">Pressing: {awayTactic.pressingIntensity}%</div>
              )}
            </div>
          </div>

          {/* Warunki meczu */}
          <div className="bg-slate-900/50 border border-white/8 rounded-[24px] p-5 flex items-center gap-8 justify-center">
            <div className="text-center">
              <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Pogoda</div>
              <div className="text-sm font-black text-slate-200">{weather.description}</div>
              <div className="text-xs text-slate-400">{weather.tempC}°C</div>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="text-center">
              <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Format</div>
              <div className="text-sm font-black text-slate-200">
                {isLeg2 ? 'Rewanż + Agregat' : 'Jeden mecz'}
              </div>
              <div className="text-xs text-slate-400">
                {isPromotion ? 'Dogrywka + Karne' : (isLeg2 ? 'Karne przy remisie w agregacie' : 'Rewanż 29 maja')}
              </div>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="text-center">
              <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Stadion</div>
              <div className="text-sm font-black text-slate-200">{homeClub.name}</div>
              <div className="text-xs text-slate-400">{homeClub.stadiumCapacity?.toLocaleString('pl') ?? '—'} miejsc</div>
            </div>
          </div>

          {/* Przycisk START */}
          <div className="mt-auto flex justify-center">
            <button
              onClick={() => navigateTo(ViewState.MATCH_LIVE_PLAYOFF)}
              className={`px-16 py-4 rounded-[20px] font-black italic uppercase tracking-widest text-lg shadow-2xl transition-all hover:scale-[1.02] active:scale-95 border-b-4 ${
                isPromotion
                  ? 'bg-emerald-600 border-emerald-800 text-white hover:bg-emerald-500'
                  : 'bg-amber-600 border-amber-800 text-white hover:bg-amber-500'
              }`}
            >
              ▶ ZACZNIJ MECZ
            </button>
          </div>
        </div>

        {/* Skład gości */}
        <div className="w-56 shrink-0 bg-slate-900/50 border border-white/8 rounded-[24px] p-4 flex flex-col gap-2 overflow-hidden">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 text-right">Jedenastka</div>
          {squadDetails?.aXI.map(p => renderPlayerRow(p, 'away'))}
          {squadDetails && (
            <div className="mt-2 pt-2 border-t border-white/8">
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-500 uppercase">OVR</span>
                <span className="text-white font-black">{squadDetails.aAvg}</span>
              </div>
              <div className="flex justify-between text-[10px] mt-0.5">
                <span className="text-slate-500">Obrona</span><span className="text-slate-300">{squadDetails.aDef}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-500">Pomoc</span><span className="text-slate-300">{squadDetails.aMid}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-500">Atak</span><span className="text-slate-300">{squadDetails.aAtt}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stopka — info o drużynie gracza */}
      <footer className="shrink-0 w-full max-w-[1400px] mx-auto px-6 py-4">
        <div className="text-center text-xs text-slate-600 font-black uppercase tracking-widest">
          Grasz jako {userTeamId === homeClub.id ? homeClub.name : awayClub.name}
          {' '}· {isLeg2 ? 'Pamiętaj o agregacie!' : isPromotion ? 'Jeden mecz — dogrywka i karne możliwe' : 'Rewanż odbędzie się 29 maja'}
        </div>
      </footer>
    </div>
  );
};
