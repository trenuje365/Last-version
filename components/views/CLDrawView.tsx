import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { RAW_CHAMPIONS_LEAGUE_CLUBS, generateEuropeanClubId } from '../../resources/static_db/clubs/ChampionsLeagueTeams';

export const CLDrawView: React.FC = () => {
  const { activeCupDraw, confirmCLDraw, clubs } = useGame();
  const [isFinishing, setIsFinishing] = useState(false);

  if (!activeCupDraw) return null;

  const pairs = activeCupDraw.pairs;
  const getClub = (id: string) => clubs.find(c => c.id === id);
  const getCountry = (clubId: string): string => {
    const raw = RAW_CHAMPIONS_LEAGUE_CLUBS.find(c => generateEuropeanClubId(c.name) === clubId);
    return raw?.country ?? '';
  };

  const handleFinish = () => {
    if (isFinishing) return;
    setIsFinishing(true);
    confirmCLDraw(pairs);
  };

  return (
    <div className="h-screen w-full bg-slate-950 flex flex-col animate-fade-in overflow-hidden relative">

      {/* Tło - kolory CL (granat + złoty) */}
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full blur-[200px] opacity-10 bg-blue-800" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[150px] opacity-10 bg-yellow-500" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      {/* Header */}
      <div className="bg-slate-900/60 border-b border-white/10 p-8 backdrop-blur-3xl shrink-0 flex items-center justify-between shadow-2xl relative z-10">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-blue-800/30 border border-blue-500/30 flex items-center justify-center text-3xl shadow-inner">
            ⭐
          </div>
          <div>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white leading-none">
              Liga Mistrzów UEFA
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-yellow-400 text-[10px] font-black uppercase tracking-[0.5em]">{activeCupDraw.label}</span>
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <span className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">
                {pairs.length} par • Runda 1 Eliminacji
              </span>
            </div>
          </div>
        </div>

        <button
          disabled={isFinishing}
          onClick={handleFinish}
          className={`group relative px-12 py-5 bg-yellow-400 text-slate-900 font-black italic uppercase tracking-widest rounded-2xl shadow-[0_20px_50px_rgba(250,204,21,0.2)] transition-all hover:scale-105 active:scale-95 flex items-center gap-4 overflow-hidden ${isFinishing ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <span className="relative z-10 text-lg">{isFinishing ? 'PRZETWARZANIE...' : 'ZAKOŃCZ LOSOWANIE →'}</span>
        </button>
      </div>

      {/* Lista par */}
      <div className="flex-1 overflow-y-auto p-10">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 max-w-[1600px] mx-auto pb-20">
          {pairs.map((pair, idx) => {
            const home = getClub(pair.homeTeamId);
            const away = getClub(pair.awayTeamId);
            if (!home || !away) return null;

            return (
              <div
                key={pair.id}
                className="group relative flex items-center justify-between p-4 rounded-[28px] border bg-white/[0.02] border-white/5 hover:border-yellow-500/20 hover:bg-white/[0.05] transition-all duration-300"
              >
                {/* Numer pary */}
                <div className="absolute left-[-10px] top-[-10px] w-7 h-7 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center text-[11px] font-black text-slate-500 group-hover:text-yellow-400 transition-colors shadow-2xl">
                  {idx + 1}
                </div>

                {/* Gospodarz */}
                <div className="flex-1 flex items-center justify-end gap-3 pr-3 min-w-0">
                  <div className="text-right min-w-0">
                    <span className="block text-[13px] font-black uppercase italic truncate tracking-tight text-white group-hover:text-yellow-300 transition-colors">
                      {home.name}
                    </span>
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                      {getCountry(pair.homeTeamId)}
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-xl border border-white/10 flex flex-col overflow-hidden shadow-2xl shrink-0">
                    <div className="flex-1" style={{ backgroundColor: home.colorsHex[0] }} />
                    <div className="flex-1" style={{ backgroundColor: home.colorsHex[1] || home.colorsHex[0] }} />
                  </div>
                </div>

                {/* VS */}
                <div className="w-10 h-10 rounded-full bg-black/60 border border-white/10 flex items-center justify-center shrink-0 mx-1">
                  <span className="text-[10px] font-black italic text-slate-600 group-hover:text-yellow-500 transition-colors">VS</span>
                </div>

                {/* Gość */}
                <div className="flex-1 flex items-center justify-start gap-3 pl-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl border border-white/10 flex flex-col overflow-hidden shadow-2xl shrink-0">
                    <div className="flex-1" style={{ backgroundColor: away.colorsHex[0] }} />
                    <div className="flex-1" style={{ backgroundColor: away.colorsHex[1] || away.colorsHex[0] }} />
                  </div>
                  <div className="text-left min-w-0">
                    <span className="block text-[13px] font-black uppercase italic truncate tracking-tight text-white group-hover:text-yellow-300 transition-colors">
                      {away.name}
                    </span>
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                      {getCountry(pair.awayTeamId)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};