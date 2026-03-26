import React, { useMemo, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { ViewState, CompetitionType, MatchStatus } from '../types';
import ligaKonferencjiBg from '../Graphic/themes/Liga_konferencji.png';

const GLASS_CARD = "bg-slate-950/40 backdrop-blur-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-[40px] relative overflow-hidden";
const GLOSS_LAYER = "absolute inset-0 bg-gradient-to-br from-white/[0.05] via-transparent to-transparent pointer-events-none";

const CONF_MATCH_LEAGUE_IDS = [
  CompetitionType.CONF_R1Q, CompetitionType.CONF_R1Q_RETURN,
  CompetitionType.CONF_R2Q, CompetitionType.CONF_R2Q_RETURN,
  CompetitionType.CONF_GROUP_STAGE,
  CompetitionType.CONF_R16, CompetitionType.CONF_R16_RETURN,
  CompetitionType.CONF_QF, CompetitionType.CONF_QF_RETURN,
  CompetitionType.CONF_SF, CompetitionType.CONF_SF_RETURN,
  CompetitionType.CONF_FINAL,
];

export const PreMatchCONFStudioView: React.FC = () => {
  const { fixtures, clubs, currentDate, navigateTo, processCLMatchDay, userTeamId } = useGame();

  const todayPairs = useMemo(() => {
    const dateStr = currentDate.toDateString();
    return fixtures.filter(f =>
      f.date.toDateString() === dateStr &&
      f.status === MatchStatus.SCHEDULED &&
      CONF_MATCH_LEAGUE_IDS.includes(f.leagueId as CompetitionType)
    );
  }, [fixtures, currentDate]);

  const getClub = (id: string) => clubs.find(c => c.id === id);

  const firstFixture = todayPairs[0];

  const isReturn = !!firstFixture && (
    firstFixture.leagueId === CompetitionType.CONF_R1Q_RETURN ||
    firstFixture.leagueId === CompetitionType.CONF_R2Q_RETURN ||
    firstFixture.leagueId === CompetitionType.CONF_R16_RETURN ||
    firstFixture.leagueId === CompetitionType.CONF_QF_RETURN ||
    firstFixture.leagueId === CompetitionType.CONF_SF_RETURN
  );

  const getRoundLabel = (): string => {
    if (!firstFixture) return 'Liga Konferencji';
    switch (firstFixture.leagueId) {
      case CompetitionType.CONF_R1Q:         return `1. Mecz — 1. Runda Kwalifikacyjna · ${todayPairs.length} par`;
      case CompetitionType.CONF_R1Q_RETURN:  return 'Rewanż — 1. Runda Kwalifikacyjna';
      case CompetitionType.CONF_R2Q:         return `1. Mecz — 2. Runda Kwalifikacyjna · ${todayPairs.length} par`;
      case CompetitionType.CONF_R2Q_RETURN:  return 'Rewanż — 2. Runda Kwalifikacyjna';
      case CompetitionType.CONF_GROUP_STAGE: return `Faza Grupowa · ${todayPairs.length} Meczów`;
      case CompetitionType.CONF_R16:         return `1/8 Finału — 1. Mecz · ${todayPairs.length} par`;
      case CompetitionType.CONF_R16_RETURN:  return '1/8 Finału — Rewanż';
      case CompetitionType.CONF_QF:          return `1/4 Finału — 1. Mecz · ${todayPairs.length} par`;
      case CompetitionType.CONF_QF_RETURN:   return '1/4 Finału — Rewanż';
      case CompetitionType.CONF_SF:          return `1/2 Finału — 1. Mecz · ${todayPairs.length} par`;
      case CompetitionType.CONF_SF_RETURN:   return '1/2 Finału — Rewanż';
      case CompetitionType.CONF_FINAL:       return 'Finał Ligi Konferencji · 1 Mecz';
      default:                               return 'Liga Konferencji';
    }
  };

  const handleSimulate = () => {
    processCLMatchDay();
    navigateTo(ViewState.POST_MATCH_CONF_STUDIO);
  };

  const userHasMatch = todayPairs.some(f => f.homeTeamId === userTeamId || f.awayTeamId === userTeamId);

  useEffect(() => {
    if (userHasMatch) {
      navigateTo(ViewState.PRE_MATCH_CONF_LIVE_STUDIO);
    }
  }, [userHasMatch]);

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden relative">

      {/* TŁO */}
      <div className="fixed inset-0 z-0">
        <img src={ligaKonferencjiBg} alt="" className="w-full h-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-slate-950/40 to-slate-950/90" />
      </div>

      <div className="relative z-10 flex flex-col h-full p-6 gap-4">

        {/* HEADER */}
        <div className={GLASS_CARD + " p-6 flex items-center justify-between shrink-0"}>
          <div className={GLOSS_LAYER} />
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl bg-emerald-500/10 border border-emerald-500/20">
              🟢
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.5em] text-emerald-400">UEFA Conference League</p>
              <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white leading-none">
                {getRoundLabel()}
              </h1>
              <p className="text-slate-400 text-xs mt-1">{currentDate.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
          </div>
          {userHasMatch && (
            <button
              onClick={() => navigateTo(ViewState.PRE_MATCH_CONF_LIVE_STUDIO)}
              className="px-10 py-4 bg-emerald-500 hover:bg-emerald-400 text-white font-black italic uppercase tracking-widest rounded-2xl shadow-2xl transition-all hover:scale-105 active:scale-95 text-sm"
            >
              ZAGRAJ NA ŻYWO →
            </button>
          )}
          <button
            onClick={handleSimulate}
            className="px-10 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black italic uppercase tracking-widest rounded-2xl shadow-2xl transition-all hover:scale-105 active:scale-95 text-sm"
          >
            SYMULUJ MECZE →
          </button>
        </div>

        {/* LISTA PAR */}
        <div className={GLASS_CARD + " flex-1 overflow-y-auto p-6"}>
          <div className={GLOSS_LAYER} />
          <div className="relative z-10">
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-500 mb-5 text-center">
              {todayPairs.length} meczów · Wszystkie mecze dzisiaj
            </p>
            <div className="flex flex-col gap-2 max-w-3xl mx-auto">
              {todayPairs.map((fixture) => {
                const home = getClub(fixture.homeTeamId);
                const away = getClub(fixture.awayTeamId);
                if (!home || !away) return null;
                const isUserMatch = fixture.homeTeamId === userTeamId || fixture.awayTeamId === userTeamId;
                return (
                  <div key={fixture.id} className={`flex items-center justify-between px-6 py-4 border rounded-3xl transition-colors group ${isUserMatch ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/[0.05]'}`}>
                    {/* Home */}
                    <div className="flex items-center gap-4 flex-1 justify-end">
                      <span className="text-sm font-black uppercase italic tracking-tight text-white group-hover:text-emerald-200 transition-colors text-right truncate max-w-[180px]">
                        {home.name}
                      </span>
                      <div className="w-3 h-8 rounded-full border border-white/10 shrink-0" style={{ backgroundColor: home.colorsHex[0] }} />
                    </div>
                    {/* VS */}
                    <div className="w-24 flex flex-col items-center shrink-0">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">vs</span>
                      {isUserMatch && <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest mt-1">TWÓJ MECZ</span>}
                    </div>
                    {/* Away */}
                    <div className="flex items-center gap-4 flex-1 justify-start">
                      <div className="w-3 h-8 rounded-full border border-white/10 shrink-0" style={{ backgroundColor: away.colorsHex[0] }} />
                      <span className="text-sm font-black uppercase italic tracking-tight text-white group-hover:text-emerald-200 transition-colors truncate max-w-[180px]">
                        {away.name}
                      </span>
                    </div>
                  </div>
                );
              })}
              {todayPairs.length === 0 && (
                <div className="h-40 flex items-center justify-center text-slate-600 text-sm italic">Brak zaplanowanych meczów na ten dzień</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
