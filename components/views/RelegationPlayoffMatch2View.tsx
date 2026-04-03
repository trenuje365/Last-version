import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { getClubLogo } from '../../resources/ClubLogoAssets';
import EkstraklasaBg from '../../Graphic/themes/ekstraklasa.png';
import { RelegationPlayoffPairOutcome } from '../../types';

// ── WIDOK WYNIKÓW REWANŻY BARAŻOWYCH (29 MAJA) ─────────────────────────────────
// Pokazuje wyniki rewanży + agregat + kto wygrał dwumecz (utrzymanie / awans).
// Jeśli remis → info o rzutach karnych.
// Przycisk "Dalej" → advanceDay → następny dzień.

// ── HELPER — tło gradientowe z kolorów dwóch klubów ──────────────────────────
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

// ── KARTA PEŁNEGO DWUMECZU (oba mecze + wynik końcowy) ────────────────────────
interface OutcomeCardProps {
  outcome: RelegationPlayoffPairOutcome;
  pairIndex: number;
  userTeamId: string | null;
  clubs: ReturnType<typeof useGame>['clubs'];
}

const OutcomeCard: React.FC<OutcomeCardProps> = ({ outcome, pairIndex, userTeamId, clubs }) => {
  // leg1: gosp = L_PL_3 (2.Liga), gość = L_PL_4 (3.Liga)
  // leg2: strony zamienione — gosp = L_PL_4, gość = L_PL_3
  const leg1HomeClub = clubs.find(c => c.id === outcome.leg1.homeId);
  const leg1AwayClub = clubs.find(c => c.id === outcome.leg1.awayId);
  if (!leg1HomeClub || !leg1AwayClub) return null;

  const winnerClub = clubs.find(c => c.id === outcome.winnerId);
  const loserClub  = clubs.find(c => c.id === outcome.loserId);

  const isUserMatch = outcome.leg1.homeId === userTeamId || outcome.leg1.awayId === userTeamId;

  // Agregat: 2.Liga = gole gosp w leg1 + gole gościa w leg2
  const l3Agg = outcome.leg1.homeGoals + outcome.leg2.awayGoals;
  const l4Agg = outcome.leg1.awayGoals + outcome.leg2.homeGoals;

  // Wygrała 2.Liga czy 3.Liga?
  const l3Won = outcome.winnerId === leg1HomeClub.id;

  const bg = `linear-gradient(135deg,
    ${withAlpha(leg1HomeClub.colorsHex?.[0], 0.2)} 0%,
    rgba(2,6,23,0.5) 50%,
    ${withAlpha(leg1AwayClub.colorsHex?.[0], 0.2)} 100%)`;

  const renderBadge = (clubId: string, name: string, colors: string[]) => {
    const logo = getClubLogo(clubId);
    if (logo) return (
      <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden shadow-2xl shrink-0">
        <img src={logo} alt={name} className="w-8 h-8 object-contain" />
      </div>
    );
    return (
      <div className="w-10 h-10 rounded-xl border border-white/10 flex flex-col overflow-hidden shadow-2xl shrink-0">
        <div className="flex-1" style={{ backgroundColor: colors[0] }} />
        <div className="flex-1" style={{ backgroundColor: colors[1] || colors[0] }} />
      </div>
    );
  };

  return (
    <div
      className={`relative flex flex-col p-5 rounded-[28px] border transition-all duration-300 ${
        isUserMatch
          ? 'border-emerald-500/40 shadow-[0_0_40px_rgba(16,185,129,0.12)]'
          : 'border-white/8'
      }`}
      style={{ backgroundImage: bg }}
    >
      {/* Numer pary */}
      <div className="absolute left-[-10px] top-[-10px] w-7 h-7 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center text-[11px] font-black text-slate-500 shadow-2xl">
        {pairIndex + 1}
      </div>

      {/* Nagłówek — kluby i agregat */}
      <div className="flex items-center justify-between mb-4">

        {/* 2.Liga (gospodarz leg1) */}
        <div className="flex-1 flex items-center justify-end gap-3 pr-3 min-w-0">
          <div className="text-right min-w-0">
            <span className={`block text-[13px] font-black uppercase italic truncate tracking-tight ${l3Won ? 'text-white' : 'text-slate-400'}`}>
              {leg1HomeClub.name}
            </span>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mt-0.5">
              {pairIndex === 0 ? '13. msc' : '14. msc'} • 2. LIGA
            </span>
          </div>
          {renderBadge(leg1HomeClub.id, leg1HomeClub.name, leg1HomeClub.colorsHex || [])}
        </div>

        {/* Agregat */}
        <div className="flex flex-col items-center px-4 shrink-0">
          <div className="flex items-center gap-2">
            <span className={`text-3xl font-black tabular-nums ${l3Won ? 'text-white' : 'text-slate-500'}`}>{l3Agg}</span>
            <span className="text-[11px] font-black text-slate-600 italic">:</span>
            <span className={`text-3xl font-black tabular-nums ${!l3Won ? 'text-white' : 'text-slate-500'}`}>{l4Agg}</span>
          </div>
          <span className="text-[8px] font-black uppercase tracking-[0.4em] text-slate-600 mt-0.5">agregat</span>
        </div>

        {/* 3.Liga (gość leg1) */}
        <div className="flex-1 flex items-center justify-start gap-3 pl-3 min-w-0">
          {renderBadge(leg1AwayClub.id, leg1AwayClub.name, leg1AwayClub.colorsHex || [])}
          <div className="text-left min-w-0">
            <span className={`block text-[13px] font-black uppercase italic truncate tracking-tight ${!l3Won ? 'text-white' : 'text-slate-400'}`}>
              {leg1AwayClub.name}
            </span>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mt-0.5">
              3. LIGA
            </span>
          </div>
        </div>
      </div>

      {/* Wyniki obu meczów */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {/* Leg 1 — 26 maja */}
        <div className="bg-black/30 rounded-xl p-3 border border-white/5">
          <div className="flex items-center justify-between">
            <span className="text-[8px] font-black uppercase tracking-widest text-slate-600">26 MAJA · 1. MECZ</span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[11px] font-black text-slate-300 truncate flex-1">{leg1HomeClub.shortName}</span>
            <span className="text-[14px] font-black text-white mx-2 tabular-nums">
              {outcome.leg1.homeGoals}:{outcome.leg1.awayGoals}
            </span>
            <span className="text-[11px] font-black text-slate-300 truncate flex-1 text-right">{leg1AwayClub.shortName}</span>
          </div>
        </div>

        {/* Leg 2 — 29 maja (strony zamienione) */}
        <div className="bg-black/30 rounded-xl p-3 border border-white/5">
          <div className="flex items-center justify-between">
            <span className="text-[8px] font-black uppercase tracking-widest text-slate-600">29 MAJA · REWANŻ</span>
          </div>
          <div className="flex items-center justify-between mt-2">
            {/* W rewanżu gospodarz = L_PL_4, gość = L_PL_3 */}
            <span className="text-[11px] font-black text-slate-300 truncate flex-1">{leg1AwayClub.shortName}</span>
            <span className="text-[14px] font-black text-white mx-2 tabular-nums">
              {outcome.leg2.homeGoals}:{outcome.leg2.awayGoals}
            </span>
            <span className="text-[11px] font-black text-slate-300 truncate flex-1 text-right">{leg1HomeClub.shortName}</span>
          </div>
        </div>
      </div>

      {/* Informacja o rzutach karnych (jeśli remis w agregacie) */}
      {outcome.decidedBy === 'PENALTIES' && outcome.penalties && (
        <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-amber-400">
            Remis w agregacie · Rzuty karne: {
              outcome.penalties.winnerId === leg1HomeClub.id
                ? `${leg1HomeClub.shortName} ${outcome.penalties.homeShots}:${outcome.penalties.awayShots} ${leg1AwayClub.shortName}`
                : `${leg1AwayClub.shortName} ${outcome.penalties.homeShots}:${outcome.penalties.awayShots} ${leg1HomeClub.shortName}`
            }
          </span>
        </div>
      )}

      {/* Wynik końcowy — kto gdzie gra */}
      <div className={`flex items-center justify-center gap-3 p-3 rounded-xl border ${
        l3Won
          ? 'bg-emerald-500/10 border-emerald-500/30'
          : 'bg-rose-500/10 border-rose-500/30'
      }`}>
        <span className="text-xl">{l3Won ? '✅' : '⬆️'}</span>
        <div className="text-center">
          <span className={`block text-[12px] font-black uppercase italic tracking-tight ${l3Won ? 'text-emerald-400' : 'text-rose-400'}`}>
            {winnerClub?.name} — 2. Liga
          </span>
          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 mt-0.5 block">
            {l3Won ? 'Utrzymanie' : 'Awans z 3. Ligi'}
            {' · '}
            {loserClub?.name}{' '}
            {l3Won ? '→ 3. Liga (Spadek)' : '→ 3. Liga (Utrzymanie)'}
          </span>
        </div>
      </div>

      {/* Zielona kreska po lewej jeśli mecz gracza */}
      {isUserMatch && (
        <div className="absolute left-[-2px] top-1/2 -translate-y-1/2 w-1 h-12 bg-emerald-500 rounded-full shadow-[0_0_20px_rgba(16,185,129,1)]" />
      )}
    </div>
  );
};

// ── GŁÓWNY WIDOK ─────────────────────────────────────────────────────────────
export const RelegationPlayoffMatch2View: React.FC = () => {
  const { relegationPlayoffFinalResult, confirmRelegationPlayoffMatch2, clubs, userTeamId } = useGame();
  const [isFinishing, setIsFinishing] = useState(false);

  if (!relegationPlayoffFinalResult) return null;

  const handleFinish = () => {
    if (isFinishing) return;
    setIsFinishing(true);
    confirmRelegationPlayoffMatch2();
  };

  return (
    <div className="h-screen w-full bg-slate-950 flex flex-col animate-fade-in overflow-hidden relative">

      {/* Tło */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${EkstraklasaBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center top',
            filter: 'brightness(0.3)',
          }}
        />
        <div className="absolute inset-0 bg-slate-950/65" />
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[200px] opacity-[0.08] bg-rose-700" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[150px] opacity-[0.07] bg-white" />
      </div>

      {/* Header */}
      <div className="bg-slate-900/60 border-b border-white/10 p-8 backdrop-blur-3xl shrink-0 flex items-center justify-between shadow-2xl relative z-10">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-rose-700/20 border border-rose-600/30 flex items-center justify-center text-3xl shadow-inner">
            🏟️
          </div>
          <div>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white leading-none">
              Baraże o Utrzymanie — Wyniki
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-rose-400 text-[10px] font-black uppercase tracking-[0.5em]">Rewanże · 29 maja</span>
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <span className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">Rozstrzygnięcie dwumeczu</span>
            </div>
          </div>
        </div>

        <button
          disabled={isFinishing}
          onClick={handleFinish}
          className="px-8 py-3 rounded-2xl bg-white/5 border border-white/10 text-[11px] font-black uppercase tracking-[0.3em] text-slate-300 hover:bg-white/10 hover:text-white transition-all disabled:opacity-50"
        >
          Dalej →
        </button>
      </div>

      {/* Treść */}
      <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10 p-8">
        <div className="grid grid-cols-1 gap-6 max-w-3xl mx-auto">
          <OutcomeCard
            outcome={relegationPlayoffFinalResult.pair0}
            pairIndex={0}
            userTeamId={userTeamId}
            clubs={clubs}
          />
          <OutcomeCard
            outcome={relegationPlayoffFinalResult.pair1}
            pairIndex={1}
            userTeamId={userTeamId}
            clubs={clubs}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="bg-black/40 border-t border-white/5 p-4 flex justify-center shrink-0 backdrop-blur-md relative z-10">
        <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em]">Zmiany ligowe obowiązują od kolejnego sezonu · PLF</p>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.8s ease-out forwards; }
      `}</style>
    </div>
  );
};
