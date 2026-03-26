import { useState } from 'react';
import { TalkOption } from '../../data/halftime_talks_pl';
import {
  TalkEffect,
  getScoreContext,
  getTalksForContext,
  calculateTalkEffect,
} from '../../services/HalftimeTalkService';

interface HalftimeTalkModalProps {
  isOpen: boolean;
  onClose: (effect: TalkEffect) => void;
  userScore: number;
  oppScore: number;
  userSide: 'HOME' | 'AWAY';
  homeClubName: string;
  awayClubName: string;
  userShots: number;
  userShotsOnTarget: number;
  userCorners: number;
  userFouls: number;
  userYellowCards: number;
  oppShots: number;
  oppShotsOnTarget: number;
  oppCorners: number;
  oppFouls: number;
  oppYellowCards: number;
  userPossession: number;
  momentumEndOf1st: number;
  avgFatigue: number;
  sessionSeed: number;
}

type Phase = 'SELECTING' | 'REACTING';

export const HalftimeTalkModal = ({
  isOpen,
  onClose,
  userScore,
  oppScore,
  userSide,
  homeClubName,
  awayClubName,
  userShots,
  userShotsOnTarget,
  userCorners,
  userFouls,
  userYellowCards,
  oppShots,
  oppShotsOnTarget,
  oppCorners,
  oppFouls,
  oppYellowCards,
  userPossession,
  momentumEndOf1st,
  avgFatigue,
  sessionSeed,
}: HalftimeTalkModalProps) => {
  const [phase, setPhase] = useState<Phase>('SELECTING');
  const [reactionText, setReactionText] = useState('');
  const [pendingEffect, setPendingEffect] = useState<TalkEffect | null>(null);

  if (!isOpen) return null;

  const context = getScoreContext(userScore, oppScore);
  const talks: TalkOption[] = getTalksForContext(context);

  const handleSelect = (option: TalkOption, index: number) => {
    const effect = calculateTalkEffect(
      option.hiddenType,
      context,
      momentumEndOf1st,
      avgFatigue,
      userShots,
      sessionSeed,
      index
    );
    setReactionText(effect.reactionText);
    setPendingEffect(effect);
    setPhase('REACTING');
  };

  const handleContinue = () => {
    if (pendingEffect) onClose(pendingEffect);
  };

  const userClubName = userSide === 'HOME' ? homeClubName : awayClubName;
  const oppClubName  = userSide === 'HOME' ? awayClubName : homeClubName;

  const getContextLabel = (): string => {
    if (context === 'DRAW_LOW')     return 'Remis bez bramek';
    if (context === 'DRAW_HIGH')    return 'Remis';
    if (context === 'LOSING_ONE')   return 'Przegrywamy o bramkę';
    if (context === 'LOSING_HIGH')  return 'Wyraźnie przegrywamy';
    if (context === 'WINNING_ONE')  return 'Prowadzimy jedną bramką';
    return 'Mecz mamy pod kontrolą';
  };

  const getContextAccent = (): string => {
    if (context === 'LOSING_HIGH')  return 'via-red-500';
    if (context === 'LOSING_ONE')   return 'via-orange-500';
    if (context === 'DRAW_LOW')     return 'via-slate-400';
    if (context === 'DRAW_HIGH')    return 'via-yellow-500';
    if (context === 'WINNING_ONE')  return 'via-emerald-500';
    return 'via-emerald-400';
  };

  const getContextColor = (): string => {
    if (context === 'LOSING_HIGH')  return 'text-red-400 border-red-500/40 bg-red-500/10';
    if (context === 'LOSING_ONE')   return 'text-orange-400 border-orange-500/40 bg-orange-500/10';
    if (context === 'DRAW_LOW')     return 'text-slate-300 border-slate-500/40 bg-slate-500/10';
    if (context === 'DRAW_HIGH')    return 'text-yellow-400 border-yellow-500/40 bg-yellow-500/10';
    if (context === 'WINNING_ONE')  return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
    return 'text-emerald-300 border-emerald-400/40 bg-emerald-400/10';
  };

  const getContextGlow = (): string => {
    if (context === 'LOSING_HIGH')  return 'rgba(239,68,68,0.08)';
    if (context === 'LOSING_ONE')   return 'rgba(249,115,22,0.08)';
    if (context === 'DRAW_LOW')     return 'rgba(148,163,184,0.05)';
    if (context === 'DRAW_HIGH')    return 'rgba(234,179,8,0.08)';
    if (context === 'WINNING_ONE')  return 'rgba(52,211,153,0.08)';
    return 'rgba(52,211,153,0.10)';
  };

  const getMoodLabel = (): string => {
    if (context === 'LOSING_HIGH') {
      if (momentumEndOf1st > 15)  return 'Jesteśmy pod presją wyniku';
      if (momentumEndOf1st < -15) return 'Przeciwnik wyraźnie dominuje nad nami';
      return 'Tracimy kontrolę';
    }
    if (context === 'LOSING_ONE') {
      if (momentumEndOf1st > 15)  return 'Walczymy o wyrównanie';
      if (momentumEndOf1st < -15) return 'Jesteśmy pod ciągłą presją';
      return 'Przegrywamy o bramkę';
    }
    if (context === 'WINNING_HIGH') {
      if (momentumEndOf1st < -15) return 'Utrzymujemy wynik';
      return 'Dominujemy';
    }
    if (context === 'WINNING_ONE') {
      if (momentumEndOf1st > 15)  return 'Posiadamy lekką przewagę';
      if (momentumEndOf1st < -15) return 'Bronimy prowadzenia';
      return 'Prowadzimy';
    }
    if (momentumEndOf1st > 40)  return 'Dominujemy';
    if (momentumEndOf1st > 15)  return 'Posiadamy lekką przewagę';
    if (momentumEndOf1st < -40) return 'Jesteśmy pod ciągłą presją';
    if (momentumEndOf1st < -15) return 'Przeciwnik lekko przeważa';
    return 'Wyrównany mecz';
  };

  const getMoodColor = (): string => {
    if (context === 'LOSING_HIGH') return 'text-red-400';
    if (context === 'LOSING_ONE')  return 'text-orange-400';
    if (context === 'WINNING_HIGH' || context === 'WINNING_ONE') return 'text-emerald-400';
    if (momentumEndOf1st > 15)  return 'text-emerald-400';
    if (momentumEndOf1st < -15) return 'text-red-400';
    return 'text-slate-300';
  };

  const statPct = (uNum: number, oNum: number): { u: number; o: number } => {
    const total = uNum + oNum;
    if (total === 0) return { u: 50, o: 50 };
    return { u: Math.round((uNum / total) * 100), o: Math.round((oNum / total) * 100) };
  };

  const oppPossession = 100 - userPossession;
  const userShotsOff = userShots - userShotsOnTarget;
  const oppShotsOff  = oppShots  - oppShotsOnTarget;

  const statsRows = [
    { label: 'POSIADANIE',  uVal: `${userPossession}%`,  oVal: `${oppPossession}%`,   uNum: userPossession,    oNum: oppPossession,    ...statPct(userPossession, oppPossession) },
    { label: 'STRZAŁY',     uVal: `${userShots}`,         oVal: `${oppShots}`,          uNum: userShots,          oNum: oppShots,          ...statPct(userShots, oppShots) },
    { label: 'CELNE',       uVal: `${userShotsOnTarget}`, oVal: `${oppShotsOnTarget}`,  uNum: userShotsOnTarget,  oNum: oppShotsOnTarget,  ...statPct(userShotsOnTarget, oppShotsOnTarget) },
    { label: 'NIECELNE',    uVal: `${userShotsOff}`,      oVal: `${oppShotsOff}`,       uNum: userShotsOff,       oNum: oppShotsOff,       ...statPct(userShotsOff, oppShotsOff) },
    { label: 'ROŻNE',       uVal: `${userCorners}`,       oVal: `${oppCorners}`,        uNum: userCorners,        oNum: oppCorners,        ...statPct(userCorners, oppCorners) },
    { label: 'FAULE',       uVal: `${userFouls}`,         oVal: `${oppFouls}`,          uNum: userFouls,          oNum: oppFouls,          ...statPct(userFouls, oppFouls) },
    { label: 'KARTKI',      uVal: `${userYellowCards}`,   oVal: `${oppYellowCards}`,    uNum: userYellowCards,    oNum: oppYellowCards,    ...statPct(userYellowCards, oppYellowCards) },
  ];

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 animate-fade-in">
      <div className="w-full max-w-4xl mx-4 bg-slate-900/60 border border-white/10 rounded-[50px] shadow-[0_50px_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col relative">

        {/* ── GRADIENT BAR GÓRNY ── */}
        <div className={`absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent ${getContextAccent()} to-transparent`} />

        {/* ── TŁO GLOW ── */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at 50% 0%, ${getContextGlow()} 0%, transparent 60%)` }} />

        {/* ── SCOREBOARD ── */}
        <div className="relative flex items-center justify-between px-10 pt-8 pb-6 border-b border-white/5">

          <div className="flex-1 flex flex-col gap-1">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]"></span>
            <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white leading-none">{userClubName}</h2>
          </div>

          <div className="flex flex-col items-center gap-2 px-10">
            <span className={`text-[9px] font-black uppercase tracking-widest border px-3 py-1 rounded-full ${getContextColor()}`}>
              {getContextLabel()}
            </span>
            <div className="text-7xl font-black italic text-white tracking-tighter leading-none drop-shadow-[0_0_20px_rgba(255,255,255,0.15)]">
              {userScore}<span className="text-white/20 mx-2">:</span>{oppScore}
            </div>
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">PRZERWA</span>
          </div>

          <div className="flex-1 flex flex-col items-end gap-1">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]"></span>
            <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white leading-none text-right">{oppClubName}</h2>
          </div>

        </div>

        {/* ── STATYSTYKI I POŁOWY ── */}
        <div className="relative px-10 py-5 border-b border-white/5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-black italic uppercase tracking-tighter text-white/30">{userClubName}</span>
            <span className="text-[8px] font-black text-slate-600 uppercase tracking-[0.35em]">STATYSTYKI I POŁOWY</span>
            <span className="text-xs font-black italic uppercase tracking-tighter text-white/30 text-right">{oppClubName}</span>
          </div>

          <div className="flex flex-col gap-2.5">
            {statsRows.map(row => {
              const uWins = row.uNum > row.oNum;
              const oWins = row.oNum > row.uNum;
              return (
                <div key={row.label} className="flex items-center gap-3">
                  <span className={`w-12 text-right text-xl font-black italic leading-none ${uWins ? 'text-white' : 'text-slate-500'}`}>
                    {row.uVal}
                  </span>
                  <div className="flex-1 flex items-center h-0.5 overflow-hidden rounded-l-full bg-white/[0.04]" style={{ direction: 'rtl' }}>
                    <div className={`h-full rounded-l-full transition-all ${uWins ? 'bg-blue-500/70' : 'bg-white/15'}`} style={{ width: `${row.u}%` }} />
                  </div>
                  <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest shrink-0 w-24 text-center">
                    {row.label}
                  </span>
                  <div className="flex-1 h-0.5 overflow-hidden rounded-r-full bg-white/[0.04]">
                    <div className={`h-full rounded-r-full transition-all ${oWins ? 'bg-slate-400/50' : 'bg-white/15'}`} style={{ width: `${row.o}%` }} />
                  </div>
                  <span className={`w-12 text-left text-xl font-black italic leading-none ${oWins ? 'text-white' : 'text-slate-500'}`}>
                    {row.oVal}
                  </span>
                </div>
              );
            })}

            {/* ── NASTRÓJ ── */}
            <div className="flex items-center justify-center gap-3 mt-1 pt-3 border-t border-white/5">
              <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">OCENA</span>
              <span className={`text-sm font-black italic ${getMoodColor()}`}>{getMoodLabel()}</span>
            </div>
          </div>
        </div>

        {/* ── FAZA WYBORU ── */}
        {phase === 'SELECTING' && (
          <div className="relative flex flex-col">
            <div className="px-10 pt-5 pb-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                ROZMOWA MOTYWACYJNA
              </span>
            </div>
            <div className="px-6 pb-6 grid grid-cols-2 gap-2 max-h-[260px] overflow-y-auto custom-scrollbar">
              {talks.map((opt, idx) => (
                <button
                  key={opt.id}
                  onClick={() => handleSelect(opt, idx)}
                  className="w-full text-left px-5 py-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-slate-300 text-sm font-medium leading-snug hover:bg-white/[0.08] hover:border-white/20 hover:text-white transition-all active:scale-[0.99]"
                >
                  {opt.text}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── FAZA REAKCJI ── */}
        {phase === 'REACTING' && (
          <div className="relative flex flex-col items-center gap-8 px-10 py-12">
            <div className="text-5xl drop-shadow-[0_0_30px_rgba(255,255,255,0.3)] animate-bounce">💬</div>
            <p className="text-center text-lg font-bold text-white italic leading-relaxed drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">
              {reactionText}
            </p>
            <button
              onClick={handleContinue}
              className="mt-2 min-w-[220px] py-3.5 px-10 rounded-2xl bg-blue-600/20 border border-blue-500/40 text-blue-400 font-black italic uppercase tracking-tighter text-base transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(59,130,246,0.15)] hover:bg-blue-600/30 hover:shadow-[0_0_50px_rgba(59,130,246,0.25)] flex items-center justify-center gap-3 group"
            >
              <span>II POŁOWA</span>
              <span className="text-xl group-hover:translate-x-2 transition-transform">→</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
