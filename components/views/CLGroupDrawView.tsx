import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { RAW_CHAMPIONS_LEAGUE_CLUBS, generateEuropeanClubId } from '../../resources/static_db/clubs/ChampionsLeagueTeams';
import CLThemeBg from '../../Graphic/themes/cl_theme.png';

const GROUP_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

export const CLGroupDrawView: React.FC = () => {
  const { activeGroupDraw, confirmCLGroupDraw, clubs } = useGame();
  const [isFinishing, setIsFinishing] = useState(false);

  if (!activeGroupDraw) return null;

  const getClub = (id: string) => clubs.find(c => c.id === id);
  const getCountry = (clubId: string): string => {
    const raw = RAW_CHAMPIONS_LEAGUE_CLUBS.find(c => generateEuropeanClubId(c.name) === clubId);
    return raw?.country ?? '';
  };
  const getRawTier = (clubId: string): number => {
    const raw = RAW_CHAMPIONS_LEAGUE_CLUBS.find(c => generateEuropeanClubId(c.name) === clubId);
    return raw?.tier ?? 4;
  };

  const handleFinish = () => {
    if (isFinishing) return;
    setIsFinishing(true);
    confirmCLGroupDraw();
  };

  return (
    <div className="h-screen w-full bg-transparent flex flex-col animate-fade-in overflow-hidden relative">

      {/* Tło CL */}
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
        <img
          src={CLThemeBg}
          alt=""
          className="w-full h-full object-cover"
          style={{ filter: 'brightness(0.5)' }}
        />
      </div>

      {/* Header */}
      <div className="bg-black/30 border-b border-white/10 p-8 backdrop-blur-md shrink-0 flex items-center justify-between shadow-2xl relative z-10">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-blue-800/30 border border-blue-500/30 flex items-center justify-center text-3xl shadow-inner">
            ⭐
          </div>
          <div>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white leading-none">
              Liga Mistrzów UEFA
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-yellow-400 text-[10px] font-black uppercase tracking-[0.5em]">
                {activeGroupDraw.label}
              </span>
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <span className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">
                8 grup • 32 drużyny
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

      {/* Siatka grup */}
      <div className="flex-1 overflow-y-auto p-10">
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-6 max-w-[1600px] mx-auto pb-20">
          {activeGroupDraw.groups.map((group, gi) => (
            <div
              key={gi}
              className="rounded-[24px] border border-white/20 bg-black/40 backdrop-blur-md p-5 flex flex-col gap-3"
            >
              {/* Nagłówek grupy */}
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-xl bg-blue-800/40 border border-blue-500/30 flex items-center justify-center text-lg font-black text-yellow-400">
                  {GROUP_LABELS[gi]}
                </div>
                <span className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400">
                  Grupa {GROUP_LABELS[gi]}
                </span>
              </div>

              {/* Drużyny */}
              {group.map((teamId, ti) => {
                const club = getClub(teamId);
                const tier = getRawTier(teamId);
                return (
                  <div
                    key={teamId}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.08] border border-white/10 hover:border-yellow-500/20 hover:bg-white/[0.15] transition-all"
                  >
                    {/* Koszyk (1-4) */}
                    <div className="w-5 h-5 rounded-md bg-slate-800 border border-white/10 flex items-center justify-center text-[9px] font-black text-slate-500 shrink-0">
                      {ti + 1}
                    </div>

                    {/* Kolory klubu */}
                    <div className="w-8 h-8 rounded-lg border border-white/10 flex flex-col overflow-hidden shrink-0 shadow-lg">
                      <div className="flex-1" style={{ backgroundColor: club?.colorsHex[0] ?? '#333' }} />
                      <div className="flex-1" style={{ backgroundColor: club?.colorsHex[1] ?? club?.colorsHex[0] ?? '#555' }} />
                    </div>

                    {/* Nazwa + kraj */}
                    <div className="min-w-0 flex-1">
                      <div className="text-[12px] font-black uppercase italic truncate text-white leading-tight">
                        {club?.name ?? teamId}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                          {getCountry(teamId)}
                        </span>
                        {tier === 1 && (
                          <span className="text-[7px] px-1 rounded bg-yellow-500/20 text-yellow-400 font-black uppercase">TOP</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};