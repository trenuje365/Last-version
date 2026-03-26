import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { RAW_CONFERENCE_LEAGUE_CLUBS, generateCONFClubId } from '../resources/static_db/clubs/ConferenceLeagueTeams';
import LigaKonferencjiBg from '../Graphic/themes/Liga_konferencji.png';

const GROUP_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

export const CONFGroupDrawView: React.FC = () => {
  const { activeConfGroupDraw, confirmCONFGroupDraw, clubs } = useGame();
  const [isFinishing, setIsFinishing] = useState(false);

  if (!activeConfGroupDraw) return null;

  const getClub = (id: string) => clubs.find(c => c.id === id);
  const getCountry = (clubId: string): string => {
    const raw = RAW_CONFERENCE_LEAGUE_CLUBS.find(c => generateCONFClubId(c.name) === clubId);
    return raw?.country ?? '';
  };

  const handleFinish = () => {
    if (isFinishing) return;
    setIsFinishing(true);
    confirmCONFGroupDraw();
  };

  return (
    <div className="h-screen w-full bg-transparent flex flex-col animate-fade-in overflow-hidden relative">

      {/* Tło LK */}
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
        <img
          src={LigaKonferencjiBg}
          alt=""
          className="w-full h-full object-cover"
          style={{ filter: 'brightness(0.5)' }}
        />
      </div>

      {/* Header */}
      <div className="bg-black/30 border-b border-emerald-500/20 p-8 backdrop-blur-md shrink-0 flex items-center justify-between shadow-2xl relative z-10">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-3xl shadow-inner">
            🟢
          </div>
          <div>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white leading-none">
              Liga Konferencji UEFA
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.5em]">
                {activeConfGroupDraw.label}
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
          className={`group relative px-12 py-5 bg-emerald-500 text-white font-black italic uppercase tracking-widest rounded-2xl shadow-[0_20px_50px_rgba(16,185,129,0.2)] transition-all hover:scale-105 active:scale-95 flex items-center gap-4 overflow-hidden ${isFinishing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-emerald-400'}`}
        >
          <span className="relative z-10 text-lg">{isFinishing ? 'PRZETWARZANIE...' : 'ZAKOŃCZ LOSOWANIE →'}</span>
        </button>
      </div>

      {/* Siatka grup */}
      <div className="flex-1 overflow-y-auto p-10">
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-6 max-w-[1600px] mx-auto pb-20">
          {activeConfGroupDraw.groups.map((group, gi) => (
            <div
              key={gi}
              className="rounded-[24px] border border-white/20 bg-black/40 backdrop-blur-md p-5 flex flex-col gap-3"
            >
              {/* Nagłówek grupy */}
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-lg font-black text-emerald-400">
                  {GROUP_LABELS[gi]}
                </div>
                <span className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400">
                  Grupa {GROUP_LABELS[gi]}
                </span>
              </div>

              {/* Drużyny */}
              {group.map((teamId, ti) => {
                const club = getClub(teamId);
                return (
                  <div
                    key={teamId}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.08] border border-white/10 hover:border-emerald-500/20 hover:bg-white/[0.15] transition-all"
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
