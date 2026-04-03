import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { getClubLogo } from '../../resources/ClubLogoAssets';
import EkstraklasaBg from '../../Graphic/themes/ekstraklasa.png';

const withAlpha = (color: string | undefined, alpha: number): string => {
  if (!color) return `rgba(148,163,184,${alpha})`;
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const normalized = hex.length === 3 ? hex.split('').map(c => c + c).join('') : hex;
    const r = parseInt(normalized.slice(0, 2), 16);
    const g = parseInt(normalized.slice(2, 4), 16);
    const b = parseInt(normalized.slice(4, 6), 16);
    if ([r, g, b].some(v => Number.isNaN(v))) return `rgba(148,163,184,${alpha})`;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return `rgba(148,163,184,${alpha})`;
};

interface PairCardProps {
  homeId: string;
  awayId: string;
  homePos: number;
  awayPos: number;
  userTeamId: string | null;
  clubs: ReturnType<typeof useGame>['clubs'];
  index: number;
  accentColor: string;
}

const PairCard: React.FC<PairCardProps> = ({ homeId, awayId, homePos, awayPos, userTeamId, clubs, index, accentColor }) => {
  const home = clubs.find(c => c.id === homeId);
  const away = clubs.find(c => c.id === awayId);
  if (!home || !away) return null;

  const isUserPair = home.id === userTeamId || away.id === userTeamId;
  const homeLogo = getClubLogo(home.id);
  const awayLogo = getClubLogo(away.id);

  const bg = `linear-gradient(135deg,
    ${withAlpha(home.colorsHex?.[0], 0.2)} 0%,
    ${withAlpha(home.colorsHex?.[1] || home.colorsHex?.[0], 0.1)} 30%,
    ${isUserPair ? 'rgba(16,185,129,0.1)' : 'rgba(15,23,42,0.3)'} 50%,
    ${withAlpha(away.colorsHex?.[1] || away.colorsHex?.[0], 0.1)} 70%,
    ${withAlpha(away.colorsHex?.[0], 0.2)} 100%
  )`;

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

  const posLabel = (pos: number) => pos === 0 ? '3. Liga' : `${pos}. miejsce`;

  return (
    <div
      className={`group relative flex items-center justify-between p-4 rounded-[28px] border transition-all duration-300
        ${isUserPair
          ? 'bg-emerald-500/10 border-emerald-500/40 shadow-[0_0_40px_rgba(16,185,129,0.12)] scale-[1.03] z-20'
          : 'border-white/5 hover:border-white/10'}`}
      style={{ backgroundImage: bg }}
    >
      <div className={`absolute left-[-10px] top-[-10px] w-7 h-7 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center text-[11px] font-black text-slate-500 shadow-2xl`}
        style={{ color: isUserPair ? '#34d399' : undefined }}>
        {index + 1}
      </div>

      {/* HOME */}
      <div className="flex-1 flex items-center justify-end gap-3 pr-3 min-w-0">
        <div className="text-right min-w-0">
          <span className={`block text-[13px] font-black uppercase italic truncate tracking-tight ${isUserPair ? 'text-emerald-400' : 'text-white'}`}>
            {home.name}
          </span>
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 mt-0.5 block">
            {posLabel(homePos)} • GOSPODARZ
          </span>
        </div>
        {renderBadge(home.id, home.name, home.colorsHex || [])}
      </div>

      {/* VS */}
      <div className="w-12 h-12 rounded-full bg-black/60 border border-white/10 flex items-center justify-center backdrop-blur-xl shadow-2xl shrink-0 z-10 mx-2">
        <span className="text-[11px] font-black italic text-slate-600">VS</span>
      </div>

      {/* AWAY */}
      <div className="flex-1 flex items-center justify-start gap-3 pl-3 min-w-0">
        {renderBadge(away.id, away.name, away.colorsHex || [])}
        <div className="text-left min-w-0">
          <span className={`block text-[13px] font-black uppercase italic truncate tracking-tight ${isUserPair ? 'text-emerald-400' : 'text-white'}`}>
            {away.name}
          </span>
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 mt-0.5 block">
            {posLabel(awayPos)} • GOŚĆ
          </span>
        </div>
      </div>

      {isUserPair && (
        <div className="absolute left-[-2px] top-1/2 -translate-y-1/2 w-1 h-12 bg-emerald-500 rounded-full shadow-[0_0_20px_rgba(16,185,129,1)]" />
      )}
    </div>
  );
};

interface SectionProps {
  title: string;
  subtitle: string;
  accentClass: string;
  icon: string;
  matchDate: string;
  pairs: { homeId: string; awayId: string; homePos: number; awayPos: number }[];
  userTeamId: string | null;
  clubs: ReturnType<typeof useGame>['clubs'];
  accentColor: string;
}

const Section: React.FC<SectionProps> = ({ title, subtitle, accentClass, icon, matchDate, pairs, userTeamId, clubs, accentColor }) => (
  <div className="mb-8">
    <div className="flex items-center gap-4 mb-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${accentClass} border`}>
        {icon}
      </div>
      <div>
        <h2 className="text-lg font-black uppercase italic tracking-tight text-white leading-none">{title}</h2>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mt-0.5">{subtitle} • mecz: {matchDate}</p>
      </div>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      {pairs.map((pair, idx) => (
        <PairCard
          key={idx}
          homeId={pair.homeId}
          awayId={pair.awayId}
          homePos={pair.homePos}
          awayPos={pair.awayPos}
          userTeamId={userTeamId}
          clubs={clubs}
          index={idx}
          accentColor={accentColor}
        />
      ))}
    </div>
  </div>
);

export const PlayoffDrawView: React.FC = () => {
  const { activePlayoffDraw, confirmPlayoffDraw, clubs, userTeamId } = useGame();
  const [isFinishing, setIsFinishing] = useState(false);

  if (!activePlayoffDraw) return null;

  const handleFinish = () => {
    if (isFinishing) return;
    setIsFinishing(true);
    confirmPlayoffDraw();
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
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[200px] opacity-[0.08] bg-red-700" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[150px] opacity-[0.07] bg-white" />
      </div>

      {/* Header */}
      <div className="bg-slate-900/60 border-b border-white/10 p-8 backdrop-blur-3xl shrink-0 flex items-center justify-between shadow-2xl relative z-10">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-red-700/20 border border-red-600/30 flex items-center justify-center text-3xl shadow-inner">
            🏟️
          </div>
          <div>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white leading-none">
              Ogłoszenie Par Barażowych
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-red-400 text-[10px] font-black uppercase tracking-[0.5em]">Polska Liga Futbolu</span>
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <span className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">Siedziba PLF · Warszawa</span>
            </div>
          </div>
        </div>

        <button
          disabled={isFinishing}
          onClick={handleFinish}
          className={`group relative px-12 py-5 bg-white text-slate-900 font-black italic uppercase tracking-widest rounded-2xl shadow-[0_20px_50px_rgba(255,255,255,0.08)] transition-all hover:scale-105 active:scale-95 flex items-center gap-4 overflow-hidden ${isFinishing ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <span className="relative z-10 text-lg">{isFinishing ? 'ZAMYKANIE...' : 'ZAKOŃCZ CEREMONIĘ →'}</span>
          {!isFinishing && <div className="absolute inset-0 bg-gradient-to-tr from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-10 relative z-10">
        <div className="max-w-[1400px] mx-auto pb-20">

          <Section
            title="Baraże o Ekstraklasę"
            subtitle="1. Liga — awans do Ekstraklasy"
            accentClass="bg-amber-400/10 border-amber-400/30 text-amber-300"
            icon="⬆️"
            matchDate="31 maja"
            pairs={activePlayoffDraw.ekstraklasaPlayoffs}
            userTeamId={userTeamId}
            clubs={clubs}
            accentColor="#fbbf24"
          />

          <Section
            title="Baraże o 1. Ligę"
            subtitle="2. Liga — awans do 1. Ligi"
            accentClass="bg-sky-400/10 border-sky-400/30 text-sky-300"
            icon="⬆️"
            matchDate="31 maja"
            pairs={activePlayoffDraw.ligaOnePlayoffs}
            userTeamId={userTeamId}
            clubs={clubs}
            accentColor="#38bdf8"
          />

          <Section
            title="Baraże o Utrzymanie w 2. Lidze"
            subtitle="2. Liga vs 3. Liga — utrzymanie"
            accentClass="bg-rose-500/10 border-rose-500/30 text-rose-300"
            icon="⚠️"
            matchDate="29 maja (1. mecz) · 31 maja (rewanż)"
            pairs={activePlayoffDraw.relegationPlayoffs}
            userTeamId={userTeamId}
            clubs={clubs}
            accentColor="#f43f5e"
          />

        </div>
      </div>

      {/* Footer */}
      <div className="bg-black/40 border-t border-white/5 p-4 flex justify-center shrink-0 backdrop-blur-md relative z-10">
        <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em]">Wszystkie pary zostały zapisane w oficjalnym rejestrze PLF</p>
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
