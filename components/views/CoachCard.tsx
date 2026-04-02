import React from 'react';
import { useGame } from '../../context/GameContext';
import { ViewState } from '../../types';

export const CoachCard: React.FC = () => {
  const { viewedCoachId, coaches, clubs, navigateTo, previousViewState } = useGame();
  const coach = viewedCoachId ? coaches[viewedCoachId] : null;

  if (!coach) return null;

  const currentClub = clubs.find(c => c.id === coach.currentClubId);

  const FORMATION_MAP: Record<string, number[]> = {
    '4-3-3 Atak':          [4, 3, 3],
    '3-4-3':               [3, 4, 3],
    'Wysoki Pressing':     [4, 3, 3],
    'Total Football':      [4, 3, 3],
    '4-1-2-1-2':           [4, 1, 2, 1, 2],
    '4-4-2':               [4, 4, 2],
    '4-3-3 Zrównoważona':  [4, 3, 3],
    '3-5-2':               [3, 5, 2],
    '4-5-1':               [4, 5, 1],
    '4-2-3-1':             [4, 2, 3, 1],
    '5-3-2':               [5, 3, 2],
    '5-4-1':               [5, 4, 1],
    '5-3-2 Blok':          [5, 3, 2],
    '4-4-2 Kontratak':     [4, 4, 2],
    'Niski Blok':          [5, 4, 1],
    '4-5-1 Defensywna':    [4, 5, 1],
    '3-6-1':               [3, 6, 1],
  };

  const TacticDiagram = ({ tactic, accent }: { tactic: string; accent: string }) => {
    const rows = FORMATION_MAP[tactic] || [4, 4, 2];
    const W = 80, H = 100;
    const gkY = 88;
    const topY = 10;
    const rowCount = rows.length;
    const rowStep = rowCount > 1 ? (gkY - 20 - topY) / (rowCount - 1) : 0;
    return (
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <rect width={W} height={H} fill="#0f2d1a" rx="6" />
        <line x1="5" y1={H / 2} x2={W - 5} y2={H / 2} stroke="white" strokeOpacity="0.08" strokeWidth="0.5" />
        <circle cx={W / 2} cy={gkY} r="4" fill="#facc15" />
        {rows.flatMap((count, rowIndex) => {
          const y = gkY - 20 - rowIndex * rowStep;
          const r = count >= 6 ? 2.5 : 3.5;
          return Array.from({ length: count }, (_, i) => (
            <circle key={`${rowIndex}-${i}`} cx={(W / (count + 1)) * (i + 1)} cy={y} r={r} fill={accent} fillOpacity="0.9" />
          ));
        })}
      </svg>
    );
  };

  const StatBar = ({ label, value }: { label: string, value: number }) => (
    <div className="mb-4">
      <div className="flex justify-between mb-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
        <span>{label}</span>
        <span className="text-white">{value}</span>
      </div>
      <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
        <div className="h-full bg-blue-500" style={{ width: `${value}%` }} />
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-fade-in" style={{ backgroundImage: "url('/Graphic/themes/trener.png')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="absolute inset-0 bg-black/80" />
      <div className="max-w-4xl w-full bg-slate-900/20 backdrop-blur-sm rounded-[45px] border border-white/10 shadow-2xl flex overflow-hidden h-[700px] relative z-10">
        
        {/* Left Profile */}
        <div className="w-1/3 bg-black/20 p-10 flex flex-col items-center border-r border-white/5">
          <div className="w-32 h-32 rounded-full bg-slate-800 border-4 border-white/5 flex items-center justify-center text-5xl mb-6">👨‍💼</div>
          <h2 className="text-2xl font-black text-white text-center uppercase italic">{coach.firstName} {coach.lastName}</h2>
          <span className="text-blue-500 font-bold mt-2">{coach.nationalityFlag} {coach.nationality} • {coach.age} lat</span>
          
          <div className="mt-10 w-full p-6 bg-white/5 rounded-3xl border border-white/5">
            <span className="block text-[8px] font-black text-slate-500 uppercase mb-2">Obecny Klub</span>
            <span className="text-sm font-bold text-white uppercase italic">{currentClub?.name || 'Bezrobotny'}</span>
          </div>

          <button 
            onClick={() => navigateTo(previousViewState || ViewState.DASHBOARD)}
            className="mt-auto w-full py-4 bg-white text-black font-black uppercase tracking-widest rounded-2xl text-xs hover:scale-105 transition-all"
          >
            Zamknij
          </button>
        </div>

        {/* Right Stats & History */}
        <div className="flex-1 p-10 overflow-y-auto custom-scrollbar">
          <h3 className="text-xs font-black text-yellow-500 uppercase tracking-[0.4em] mb-8">Atrybuty Trenerskie</h3>
          <div className="grid grid-cols-2 gap-x-10">
            <StatBar label="Doświadczenie" value={coach.attributes.experience} />
            <StatBar label="Motywacja" value={coach.attributes.motivation} />
            <StatBar label="Decyzyjność" value={coach.attributes.decisionMaking} />
            <StatBar label="Trening" value={coach.attributes.training} />
          </div>

          <h3 className="text-xs font-black text-yellow-500 uppercase tracking-[0.4em] mt-12 mb-6">Ulubione Taktyki</h3>
          <div className="grid grid-cols-3 gap-4 mb-12">
            {[
              { label: 'Ofensywna',  tactic: coach.favoriteTactics.offensive,  color: 'text-orange-400', accent: '#f97316' },
              { label: 'Neutralna',  tactic: coach.favoriteTactics.neutral,    color: 'text-blue-400',   accent: '#60a5fa' },
              { label: 'Defensywna', tactic: coach.favoriteTactics.defensive,  color: 'text-teal-400',   accent: '#2dd4bf' },
            ].map(({ label, tactic, color, accent }) => (
              <div key={label} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex flex-col items-center gap-3">
                <span className={`text-[9px] font-black uppercase tracking-widest ${color}`}>{label}</span>
                <TacticDiagram tactic={tactic} accent={accent} />
                <span className="text-[10px] font-bold text-white text-center">{tactic}</span>
              </div>
            ))}
          </div>

          <h3 className="text-xs font-black text-yellow-500 uppercase tracking-[0.4em] mt-12 mb-6">Historia Kariery</h3>
          <div className="space-y-3">
            {coach.history.map((h, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                <div>
                  <span className="block text-sm font-bold text-white uppercase italic">{h.clubName}</span>
                  <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{h.fromMonth}/{h.fromYear} — {h.toYear ? `${h.toMonth}/${h.toYear}` : 'obecnie'}</span>
                </div>
                <div className="w-10 h-10 bg-black/40 rounded-xl flex items-center justify-center">🏟️</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};