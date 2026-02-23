import React from 'react';
import { useGame } from '../../context/GameContext';
import { ViewState } from '../../types';

export const CoachCard: React.FC = () => {
  const { viewedCoachId, coaches, clubs, navigateTo, previousViewState } = useGame();
  const coach = viewedCoachId ? coaches[viewedCoachId] : null;

  if (!coach) return null;

  const currentClub = clubs.find(c => c.id === coach.currentClubId);

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
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/95 backdrop-blur-xl p-6 animate-fade-in">
      <div className="max-w-4xl w-full bg-slate-900 rounded-[45px] border border-white/10 shadow-2xl flex overflow-hidden h-[700px]">
        
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
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.4em] mb-8">Atrybuty Trenerskie</h3>
          <div className="grid grid-cols-2 gap-x-10">
            <StatBar label="Doświadczenie" value={coach.attributes.experience} />
            <StatBar label="Motywacja" value={coach.attributes.motivation} />
            <StatBar label="Decyzyjność" value={coach.attributes.decisionMaking} />
            <StatBar label="Trening" value={coach.attributes.training} />
          </div>

          <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.4em] mt-12 mb-6">Historia Kariery</h3>
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