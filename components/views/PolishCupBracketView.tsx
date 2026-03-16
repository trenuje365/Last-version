import React, { useMemo, useState } from 'react';
import { useGame } from '../../context/GameContext';
import { CompetitionType, MatchStatus, ViewState } from '../../types';
import PucharPolskiBg from '../../Graphic/themes/PucharPolski.png';

const ROUNDS = [
  { key: 'Puchar_Polski:_1/64_', label: '1/64', sublabel: 'Runda 1', accent: '#475569' },
  { key: 'Puchar_Polski:_1/32_', label: '1/32', sublabel: 'Runda 2', accent: '#64748b' },
  { key: 'Puchar_Polski:_1/16_', label: '1/16', sublabel: 'Runda 3', accent: '#6366f1' },
  { key: 'Puchar_Polski:_1/8_',  label: '1/8',  sublabel: 'Runda 4', accent: '#8b5cf6' },
  { key: 'Puchar_Polski:_1/4_',  label: '1/4',  sublabel: 'Ćwierćfinał', accent: '#ec4899' },
  { key: 'Puchar_Polski:_1/2_',  label: '1/2',  sublabel: 'Półfinał', accent: '#f59e0b' },
  { key: 'Puchar_Polski:_FINAŁ_', label: 'FINAŁ', sublabel: 'Wielki Finał', accent: '#dc2626' },
];

export const PolishCupBracketView: React.FC = () => {
  const { fixtures, clubs, userTeamId, navigateTo } = useGame();
  const [selectedRoundKey, setSelectedRoundKey] = useState<string | null>(null);

  const cupFixtures = useMemo(
    () => fixtures.filter(f => f.leagueId === CompetitionType.POLISH_CUP),
    [fixtures]
  );

  const roundsWithData = useMemo(
    () =>
      ROUNDS.map(r => ({
        ...r,
        fixtures: cupFixtures.filter(f => f.id.includes(r.key)),
      })).filter(r => r.fixtures.length > 0),
    [cupFixtures]
  );

  const activeRound = useMemo(() => {
    if (selectedRoundKey) return roundsWithData.find(r => r.key === selectedRoundKey) || null;
    const lastPlayed = [...roundsWithData].reverse().find(r =>
      r.fixtures.some(f => f.status === MatchStatus.FINISHED)
    );
    return lastPlayed || roundsWithData[0] || null;
  }, [selectedRoundKey, roundsWithData]);

  const getClub = (id: string) => clubs.find(c => c.id === id);

  const getResult = (f: typeof cupFixtures[0]) => {
    if (f.status !== MatchStatus.FINISHED) return null;
    const hg = f.homeScore ?? 0;
    const ag = f.awayScore ?? 0;
    const hp = f.homePenaltyScore;
    const ap = f.awayPenaltyScore;
    const homeWon = hg > ag || (hg === ag && hp !== undefined && hp !== null && ap !== undefined && ap !== null && hp > ap);
    return { hg, ag, hp, ap, homeWon };
  };

  const userInFixture = (f: typeof cupFixtures[0]) =>
    f.homeTeamId === userTeamId || f.awayTeamId === userTeamId;

  const completedCount = (r: typeof roundsWithData[0]) =>
    r.fixtures.filter(f => f.status === MatchStatus.FINISHED).length;

  if (roundsWithData.length === 0) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-950 text-white animate-fade-in">
        <div className="text-7xl mb-6 opacity-30">🏆</div>
        <h2 className="text-xl font-black uppercase tracking-[0.3em] text-slate-500 mb-3">Puchar Polski</h2>
        <p className="text-slate-700 text-[11px] font-black uppercase tracking-widest">Losowanie jeszcze nie zostało przeprowadzone</p>
        <button
          onClick={() => navigateTo(ViewState.LEAGUE_TABLES)}
          className="mt-12 px-8 py-3 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all active:scale-95"
        >
          &larr; Powrót
        </button>
      </div>
    );
  }

  return (
    <div className="h-[1080px] max-w-[1920px] mx-auto flex flex-col gap-0 animate-fade-in overflow-hidden relative">

      {/* BACKGROUND */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Photo background */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${PucharPolskiBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center top',
            opacity: 100,
          }}
        />
        {/* Dark overlay to keep readability */}
        <div className="absolute inset-0 bg-slate-950/80" />
        {/* Colored glows */}
        <div className="absolute top-[-15%] left-[-10%] w-[55%] h-[55%] rounded-full blur-[220px] opacity-[0.22] bg-red-800" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full blur-[160px] opacity-[0.12] bg-rose-600" />
        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      {/* HEADER */}
      <div className="relative z-10 flex items-center justify-between px-8 py-5 bg-slate-900/60 border-b border-white/[0.07] backdrop-blur-3xl shrink-0 shadow-2xl">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-2xl shadow-inner shrink-0">
            🏆
          </div>
          <div>
            <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white leading-none">
              Puchar Polski
            </h1>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-[9px] font-black uppercase tracking-[0.5em] text-red-500">
                Drabinka rozgrywek
              </span>
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-600">
                {cupFixtures.length} mecze
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => navigateTo(ViewState.LEAGUE_TABLES)}
          className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all active:scale-95"
        >
          &larr; Powrót
        </button>
      </div>

      {/* MAIN LAYOUT */}
      <div className="relative z-10 flex flex-1 overflow-hidden">

        {/* LEFT SIDEBAR — ROUNDS */}
        <div className="w-56 shrink-0 flex flex-col bg-black/20 border-r border-white/[0.05] overflow-y-auto">
          <div className="px-4 pt-5 pb-3">
            <p className="text-[8px] font-black uppercase tracking-[0.4em] text-slate-600">Rundy</p>
          </div>
          <div className="flex flex-col gap-0.5 px-2 pb-4">
            {roundsWithData.map((r, idx) => {
              const isActive = activeRound?.key === r.key;
              const done = completedCount(r);
              const total = r.fixtures.length;
              const allDone = done === total;
              const hasUser = r.fixtures.some(userInFixture);
              const progress = total > 0 ? (done / total) * 100 : 0;

              return (
                <button
                  key={r.key}
                  onClick={() => setSelectedRoundKey(r.key)}
                  className={`relative w-full text-left px-3 py-3 rounded-xl transition-all group overflow-hidden
                    ${isActive
                      ? 'bg-white/10 border border-white/15 shadow-lg'
                      : 'border border-transparent hover:bg-white/[0.04]'
                    }`}
                >
                  {/* accent bar */}
                  {isActive && (
                    <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full" style={{ backgroundColor: r.accent }} />
                  )}

                  <div className="flex items-center justify-between">
                    <div>
                      <div className={`text-[13px] font-black italic tracking-tight leading-none ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                        {r.label}
                      </div>
                      <div className={`text-[8px] font-black uppercase tracking-widest mt-0.5 ${isActive ? 'text-slate-400' : 'text-slate-600'}`}>
                        {r.sublabel}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {hasUser && !allDone && (
                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                      )}
                      {allDone && (
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      )}
                      <span className="text-[8px] font-black text-slate-600 tabular-nums">{done}/{total}</span>
                    </div>
                  </div>

                  {/* progress bar */}
                  <div className="mt-2 h-[2px] bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${progress}%`, backgroundColor: r.accent }}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {/* LEGEND */}
          <div className="mt-auto px-4 py-4 border-t border-white/[0.05]">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-600">Zakończona</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0" />
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-600">Twój mecz</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT — FIXTURES */}
        {activeRound && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Round header */}
            <div className="px-8 py-4 border-b border-white/[0.05] flex items-center gap-4 shrink-0">
              <div className="w-2 h-8 rounded-full" style={{ backgroundColor: activeRound.accent }} />
              <div>
                <h2 className="text-xl font-black italic uppercase tracking-tighter text-white leading-none">
                  {activeRound.sublabel === 'Wielki Finał' ? 'Wielki Finał Pucharu Polski' : `${activeRound.sublabel} — ${activeRound.label}`}
                </h2>
                <span className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-600">
                  {completedCount(activeRound)}/{activeRound.fixtures.length} meczów rozegranych
                </span>
              </div>
            </div>

            {/* Fixtures list */}
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-3xl mx-auto py-4 px-6 flex flex-col gap-1.5">
                {activeRound.fixtures.map((f, idx) => {
                  const home = getClub(f.homeTeamId);
                  const away = getClub(f.awayTeamId);
                  const result = getResult(f);
                  const isUser = userInFixture(f);
                  const finished = f.status === MatchStatus.FINISHED;
                  const hasPens = result && result.hp !== undefined && result.hp !== null;

                  const dateStr = (f.date instanceof Date ? f.date : new Date(f.date))
                    .toLocaleDateString('pl-PL', { day: '2-digit', month: 'short' });

                  const homeColor = home?.colorsHex?.[0] ?? '#334155';
                  const awayColor = away?.colorsHex?.[0] ?? '#334155';

                  return (
                    <div
                      key={f.id}
                      className={`group relative flex items-center px-5 py-3 rounded-2xl border transition-all overflow-hidden backdrop-blur-sm
                        ${isUser
                          ? 'border-amber-400/60 shadow-[0_0_40px_-4px_rgba(245,158,11,0.5)]'
                          : finished
                            ? 'border-white/[0.06] hover:border-white/[0.10]'
                            : 'border-white/[0.04] hover:border-white/[0.07]'
                        }`}
                    >
                      {/* === GLASS BACKGROUND LAYER === */}
                      <div className="absolute inset-0 z-0 pointer-events-none">
                        {/* Team color split: home left → center */}
                        {!isUser && (
                          <div
                            className="absolute inset-y-0 left-0 w-1/2"
                            style={{ background: `linear-gradient(to right, ${homeColor}22, ${homeColor}06, transparent)` }}
                          />
                        )}
                        {/* Team color split: away right → center */}
                        {!isUser && (
                          <div
                            className="absolute inset-y-0 right-0 w-1/2"
                            style={{ background: `linear-gradient(to left, ${awayColor}22, ${awayColor}06, transparent)` }}
                          />
                        )}
                        {/* User amber full background */}
                        {isUser && (
                          <div className="absolute inset-0 bg-gradient-to-r from-amber-600/40 via-amber-500/35 to-amber-600/40" />
                        )}
                        {/* Glass gloss sheen */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] via-white/[0.01] to-transparent" />
                        {/* Top highlight edge */}
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                        {/* Bottom shadow edge */}
                        <div className="absolute inset-x-0 bottom-0 h-px bg-black/30" />
                      </div>
                      {/* ========================== */}

                      {/* User indicator stripe */}
                      {isUser && (
                        <div className="absolute left-0 top-3 bottom-3 w-[3px] z-20 rounded-full bg-amber-400 ml-1" />
                      )}

                      {/* Home team */}
                      <div className="relative z-10 flex-1 flex items-center gap-3 min-w-0 justify-end">
                        <span className={`text-[11px] font-black uppercase italic tracking-tight truncate transition-colors
                          ${result
                            ? result.homeWon ? 'text-white' : 'text-slate-500'
                            : 'text-slate-300 group-hover:text-white'
                          }`}>
                          {home?.name ?? f.homeTeamId}
                        </span>
                        {/* Club color bar */}
                        <div
                          className="w-1 h-7 rounded-full shrink-0 opacity-70"
                          style={{ backgroundColor: home?.colorsHex?.[0] ?? '#475569' }}
                        />
                      </div>

                      {/* SCORE / DATE */}
                      <div className="relative z-10 w-28 flex flex-col items-center shrink-0 mx-3">
                        {finished && result ? (
                          <>
                            <div className="flex items-center gap-2">
                              <span className={`text-base font-black tabular-nums ${result.homeWon ? 'text-white' : 'text-slate-500'}`}>
                                {result.hg}
                              </span>
                              <span className="text-slate-600 font-black text-xs">:</span>
                              <span className={`text-base font-black tabular-nums ${!result.homeWon ? 'text-white' : 'text-slate-500'}`}>
                                {result.ag}
                              </span>
                            </div>
                            {hasPens && (
                              <span className="text-[7px] font-black uppercase tracking-widest text-rose-500 mt-0.5">
                                k. {result.hp}:{result.ap}
                              </span>
                            )}
                          </>
                        ) : (
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{dateStr}</span>
                            <span className="text-[7px] font-black uppercase tracking-widest text-slate-700">Planowany</span>
                          </div>
                        )}
                      </div>

                      {/* Away team */}
                      <div className="relative z-10 flex-1 flex items-center gap-3 min-w-0">
                        <div
                          className="w-1 h-7 rounded-full shrink-0 opacity-70"
                          style={{ backgroundColor: away?.colorsHex?.[0] ?? '#475569' }}
                        />
                        <span className={`text-[11px] font-black uppercase italic tracking-tight truncate transition-colors
                          ${result
                            ? !result.homeWon ? 'text-white' : 'text-slate-500'
                            : 'text-slate-300 group-hover:text-white'
                          }`}>
                          {away?.name ?? f.awayTeamId}
                        </span>
                      </div>

                      {/* USER badge - removed */}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};