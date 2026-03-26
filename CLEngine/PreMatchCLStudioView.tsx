import React, { useMemo, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { ViewState, CompetitionType, MatchStatus } from '../types';
import ligaMistrzowBg from '../Graphic/themes/liga_mistrzow.png';
import ligaEuropaBg from '../Graphic/themes/LigaEuropa.png';

const GLASS_CARD = "bg-slate-950/40 backdrop-blur-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-[40px] relative overflow-hidden";
const GLOSS_LAYER = "absolute inset-0 bg-gradient-to-br from-white/[0.05] via-transparent to-transparent pointer-events-none";

export const PreMatchCLStudioView: React.FC = () => {
  const { fixtures, clubs, currentDate, navigateTo, processCLMatchDay, userTeamId } = useGame();

  const todayPairs = useMemo(() => {
    const dateStr = currentDate.toDateString();
    return fixtures.filter(f =>
      f.date.toDateString() === dateStr &&
      f.status === MatchStatus.SCHEDULED &&
         (f.leagueId === CompetitionType.CL_R1Q || f.leagueId === CompetitionType.CL_R1Q_RETURN ||
       f.leagueId === CompetitionType.CL_R2Q || f.leagueId === CompetitionType.CL_R2Q_RETURN ||
       f.leagueId === CompetitionType.CL_GROUP_STAGE ||
       f.leagueId === CompetitionType.CL_R16 || f.leagueId === CompetitionType.CL_R16_RETURN ||
       f.leagueId === CompetitionType.CL_QF  || f.leagueId === CompetitionType.CL_QF_RETURN  ||
       f.leagueId === CompetitionType.CL_SF  || f.leagueId === CompetitionType.CL_SF_RETURN  ||
       f.leagueId === CompetitionType.CL_FINAL ||
       f.leagueId === CompetitionType.EL_QF  || f.leagueId === CompetitionType.EL_QF_RETURN  ||
       f.leagueId === CompetitionType.EL_SF  || f.leagueId === CompetitionType.EL_SF_RETURN  ||
       f.leagueId === CompetitionType.EL_FINAL)
    );
  }, [fixtures, currentDate]);

  const getClub = (id: string) => clubs.find(c => c.id === id);

 const isReturn = todayPairs.length > 0 &&
    (todayPairs[0].leagueId === CompetitionType.CL_R1Q_RETURN ||
     todayPairs[0].leagueId === CompetitionType.CL_R2Q_RETURN ||
     todayPairs[0].leagueId === CompetitionType.CL_R16_RETURN ||
     todayPairs[0].leagueId === CompetitionType.CL_QF_RETURN  ||
     todayPairs[0].leagueId === CompetitionType.CL_SF_RETURN  ||
     todayPairs[0].leagueId === CompetitionType.EL_QF_RETURN  ||
     todayPairs[0].leagueId === CompetitionType.EL_SF_RETURN);

  const isR2Q = todayPairs.length > 0 &&
    (todayPairs[0].leagueId === CompetitionType.CL_R2Q ||
     todayPairs[0].leagueId === CompetitionType.CL_R2Q_RETURN);

  const isGroupStage = todayPairs.length > 0 &&
    todayPairs[0].leagueId === CompetitionType.CL_GROUP_STAGE;

const isR16 = todayPairs.length > 0 &&
    (todayPairs[0].leagueId === CompetitionType.CL_R16 ||
     todayPairs[0].leagueId === CompetitionType.CL_R16_RETURN);

  const isQF = todayPairs.length > 0 &&
    (todayPairs[0].leagueId === CompetitionType.CL_QF ||
     todayPairs[0].leagueId === CompetitionType.CL_QF_RETURN);

  const isSF = todayPairs.length > 0 &&
    (todayPairs[0].leagueId === CompetitionType.CL_SF ||
     todayPairs[0].leagueId === CompetitionType.CL_SF_RETURN);

  const isELDay = todayPairs.length > 0 &&
    (todayPairs[0].leagueId === CompetitionType.EL_QF ||
     todayPairs[0].leagueId === CompetitionType.EL_QF_RETURN ||
     todayPairs[0].leagueId === CompetitionType.EL_SF ||
     todayPairs[0].leagueId === CompetitionType.EL_SF_RETURN ||
     todayPairs[0].leagueId === CompetitionType.EL_FINAL);

  const isELQF = isELDay &&
    (todayPairs[0].leagueId === CompetitionType.EL_QF ||
     todayPairs[0].leagueId === CompetitionType.EL_QF_RETURN);

  const isELSF = isELDay &&
    (todayPairs[0].leagueId === CompetitionType.EL_SF ||
     todayPairs[0].leagueId === CompetitionType.EL_SF_RETURN);

  const isELFinal = isELDay &&
    todayPairs[0].leagueId === CompetitionType.EL_FINAL;

  const handleSimulate = () => {
    processCLMatchDay();
    if (isELFinal) {
      navigateTo(ViewState.POST_MATCH_CL_STUDIO);
    } else if (isELDay) {
      navigateTo(ViewState.EL_HISTORY);
    } else {
      navigateTo(ViewState.POST_MATCH_CL_STUDIO);
    }
  };

  const userHasMatch = todayPairs.some(f => f.homeTeamId === userTeamId || f.awayTeamId === userTeamId);

  useEffect(() => {
    if (userHasMatch) {
      navigateTo(ViewState.PRE_MATCH_CL_LIVE_STUDIO);
    }
  }, [userHasMatch]);

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden relative">

      {/* TŁO */}
      <div className="fixed inset-0 z-0">
        <img src={isELDay ? ligaEuropaBg : ligaMistrzowBg} alt="" className="w-full h-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-slate-950/40 to-slate-950/90" />
      </div>

      <div className="relative z-10 flex flex-col h-full p-6 gap-4">

        {/* HEADER */}
        <div className={GLASS_CARD + " p-6 flex items-center justify-between shrink-0"}>
          <div className={GLOSS_LAYER} />
          <div className="flex items-center gap-5">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl ${isELDay ? 'bg-orange-500/10 border border-orange-500/20' : 'bg-amber-400/10 border border-amber-400/20'}`}>
              {isELDay ? '🟠' : '⭐'}
            </div>
            <div>
              <p className={`text-[9px] font-black uppercase tracking-[0.5em] ${isELDay ? 'text-orange-400' : 'text-amber-400'}`}>{isELDay ? 'UEFA Europa League' : 'UEFA Champions League'}</p>
                <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white leading-none">
                {isELFinal
                  ? `Finał Ligi Europy · 1 Mecz`
                  : isELSF
                    ? (isReturn ? 'LE: 1/2 Finału — Rewanż' : `LE: 1/2 Finału — 1. Mecz · ${todayPairs.length} par`)
                    : isELQF
                      ? (isReturn ? 'LE: 1/4 Finału — Rewanż' : `LE: 1/4 Finału — 1. Mecz · ${todayPairs.length} par`)
                      : isGroupStage
                        ? `Faza Grupowa LM · ${todayPairs.length} Meczów`
                        : isSF
                          ? (isReturn ? '1/2 Finału — Rewanż' : `1/2 Finału — 1. Mecz · ${todayPairs.length} par`)
                          : isQF
                            ? (isReturn ? '1/4 Finału — Rewanż' : `1/4 Finału — 1. Mecz · ${todayPairs.length} par`)
                            : isR16
                              ? (isReturn ? '1/8 Finału — Rewanż' : `1/8 Finału — 1. Mecz · ${todayPairs.length} par`)
                              : isReturn
                                ? `Rewanż — ${isR2Q ? '2.' : '1.'} Runda Preeliminacyjna`
                                : `1. Mecz — ${isR2Q ? '2.' : '1.'} Runda Preeliminacyjna`}
              </h1>
              <p className="text-slate-400 text-xs mt-1">{currentDate.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
          </div>
          {userHasMatch && (
            <button
              onClick={() => navigateTo(ViewState.PRE_MATCH_CL_LIVE_STUDIO)}
              className="px-10 py-4 bg-emerald-500 hover:bg-emerald-400 text-white font-black italic uppercase tracking-widest rounded-2xl shadow-2xl transition-all hover:scale-105 active:scale-95 text-sm"
            >
              ZAGRAJ NA ŻYWO →
            </button>
          )}
          <button
            onClick={handleSimulate}
            className={`px-10 py-4 font-black italic uppercase tracking-widest rounded-2xl shadow-2xl transition-all hover:scale-105 active:scale-95 text-sm ${isELDay ? 'bg-orange-500 hover:bg-orange-400 text-white' : 'bg-amber-400 hover:bg-amber-300 text-slate-900'}`}
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
              {todayPairs.map((fixture, i) => {
                const home = getClub(fixture.homeTeamId);
                const away = getClub(fixture.awayTeamId);
                if (!home || !away) return null;
                return (
                  <div key={fixture.id} className="flex items-center justify-between px-6 py-4 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] rounded-3xl transition-colors group">
                    {/* Home */}
                    <div className="flex items-center gap-4 flex-1 justify-end">
                      <span className="text-sm font-black uppercase italic tracking-tight text-white group-hover:text-amber-200 transition-colors text-right truncate max-w-[180px]">
                        {home.name}
                      </span>
                      <div className="w-3 h-8 rounded-full border border-white/10 shrink-0" style={{ backgroundColor: home.colorsHex[0] }} />
                    </div>
                    {/* VS */}
                    <div className="w-24 flex flex-col items-center shrink-0">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">vs</span>
                    </div>
                    {/* Away */}
                    <div className="flex items-center gap-4 flex-1 justify-start">
                      <div className="w-3 h-8 rounded-full border border-white/10 shrink-0" style={{ backgroundColor: away.colorsHex[0] }} />
                      <span className="text-sm font-black uppercase italic tracking-tight text-white group-hover:text-amber-200 transition-colors truncate max-w-[180px]">
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