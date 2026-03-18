import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { RAW_EUROPA_LEAGUE_CLUBS, generateELClubId } from '../resources/static_db/clubs/EuropeLeagueTeams';
import { ViewState } from '../types';

const COUNTRY_NAMES: Record<string, string> = {
  ALB: 'Albania', ARM: 'Armenia', AUT: 'Austria', AZE: 'Azerbejdżan',
  BEL: 'Belgia', BIH: 'Bośnia i Herz.', BLR: 'Białoruś', BUL: 'Bułgaria',
  CRO: 'Chorwacja', CYP: 'Cypr', CZE: 'Czechy', DEN: 'Dania',
  ENG: 'Anglia', ESP: 'Hiszpania', EST: 'Estonia', FIN: 'Finlandia',
  FRA: 'Francja', FRO: 'Wyspy Owcze', GEO: 'Gruzja', GER: 'Niemcy',
  GIB: 'Gibraltar', GRE: 'Grecja', HUN: 'Węgry', IRL: 'Irlandia',
  ISL: 'Islandia', ISR: 'Izrael', ITA: 'Włochy', KAZ: 'Kazachstan',
  KOS: 'Kosowo', LAT: 'Łotwa', LIE: 'Liechtenstein', LTU: 'Litwa',
  LUX: 'Luksemburg', MDA: 'Mołdawia', MKD: 'Macedonia Płn.', MLT: 'Malta',
  MNE: 'Czarnogóra', NED: 'Holandia', NOR: 'Norwegia', POR: 'Portugalia',
  ROU: 'Rumunia', RUS: 'Rosja', SCO: 'Szkocja', SMR: 'San Marino',
  SRB: 'Serbia', SUI: 'Szwajcaria', SVK: 'Słowacja', SVN: 'Słowenia',
  SWE: 'Szwecja', TUR: 'Turcja', UKR: 'Ukraina', WAL: 'Walia',
  AND: 'Andora',
};

export const ELDrawView: React.FC = () => {
  const { activeCupDraw, confirmELDraw, clubs, navigateTo } = useGame();
  const [isFinishing, setIsFinishing] = useState(false);

  if (!activeCupDraw) return null;

  const pairs = activeCupDraw.pairs;

  const getClub = (id: string) => clubs.find(c => c.id === id);

  const getCountry = (clubId: string): string => {
    const raw = RAW_EUROPA_LEAGUE_CLUBS.find(c => generateELClubId(c.name) === clubId);
    const code = raw?.country ?? '';
    return COUNTRY_NAMES[code] ?? code;
  };

  const handleFinish = () => {
    if (isFinishing) return;
    setIsFinishing(true);
    confirmELDraw(pairs);
  };

  return (
    <div className="h-screen w-full bg-slate-950 flex flex-col animate-fade-in overflow-hidden relative">

      {/* Tło – kolory LE (pomarańcz + granat) */}
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full blur-[200px] opacity-10 bg-orange-600" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[150px] opacity-8 bg-orange-500" />
        <div className="absolute top-[40%] left-[40%] w-[40%] h-[40%] rounded-full blur-[180px] opacity-5 bg-amber-400" />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(249,115,22,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(249,115,22,0.15) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <div className="bg-slate-900/60 border-b border-orange-500/20 p-8 backdrop-blur-3xl shrink-0 flex items-center justify-between shadow-2xl relative z-10">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-3xl shadow-inner">
            🍊
          </div>
          <div>
            <p className="text-orange-400 text-[9px] font-black uppercase tracking-[0.5em] mb-1">
              UEFA Europa League
            </p>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white leading-none">
              Runda 1 Kwalifikacyjna
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-orange-400/70 text-[10px] font-black uppercase tracking-[0.4em]">
                {activeCupDraw.label}
              </span>
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <span className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">
                {pairs.length} par · {pairs.length * 2} drużyn
              </span>
            </div>
          </div>
        </div>

        <button
          disabled={isFinishing}
          onClick={handleFinish}
          className={`group relative px-12 py-5 font-black italic uppercase tracking-widest rounded-2xl shadow-2xl transition-all hover:scale-105 active:scale-95 flex items-center gap-4 overflow-hidden
            ${isFinishing
              ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
              : 'bg-orange-500 hover:bg-orange-400 text-white shadow-[0_20px_50px_rgba(249,115,22,0.25)]'
            }`}
        >
          <span className="relative z-10 text-lg">
            {isFinishing ? 'PRZETWARZANIE...' : 'ZAKOŃCZ LOSOWANIE →'}
          </span>
        </button>
      </div>

      {/* ── PARY ────────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-10">

        {/* Nagłówek sekcji */}
        <div className="flex items-center gap-4 mb-8 max-w-[1600px] mx-auto">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-orange-500/30 to-transparent" />
          <span className="text-orange-400/60 text-[9px] font-black uppercase tracking-[0.6em]">
            Wylosowane pary · 2 Lipca
          </span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent via-orange-500/30 to-transparent" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 max-w-[1600px] mx-auto pb-20">
          {pairs.map((pair, idx) => {
            const home = getClub(pair.homeTeamId);
            const away = getClub(pair.awayTeamId);
            if (!home || !away) return null;

            const homeCountry = getCountry(pair.homeTeamId);
            const awayCountry = getCountry(pair.awayTeamId);

            return (
              <div
                key={pair.id}
                className="group relative flex items-center justify-between p-4 rounded-[28px] border bg-white/[0.02] border-white/5 hover:border-orange-500/25 hover:bg-orange-500/[0.03] transition-all duration-300"
              >
                {/* Numer pary */}
                <div className="absolute left-[-10px] top-[-10px] w-7 h-7 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center text-[11px] font-black text-slate-500 group-hover:text-orange-400 transition-colors shadow-2xl">
                  {idx + 1}
                </div>

                {/* Gospodarz */}
                <div className="flex-1 flex items-center justify-end gap-3 pr-3 min-w-0">
                  <div className="text-right min-w-0">
                    <span className="block text-[13px] font-black uppercase italic truncate tracking-tight text-white group-hover:text-orange-300 transition-colors">
                      {home.name}
                    </span>
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                      {homeCountry}
                    </span>
                  </div>
                  <div
                    className="w-10 h-10 rounded-xl border border-white/10 flex flex-col overflow-hidden shadow-2xl shrink-0"
                  >
                    <div className="flex-1" style={{ backgroundColor: home.colorsHex[0] }} />
                    <div className="flex-1" style={{ backgroundColor: home.colorsHex[1] || home.colorsHex[0] }} />
                  </div>
                </div>

                {/* VS */}
                <div className="w-10 h-10 rounded-full bg-black/60 border border-white/10 flex items-center justify-center shrink-0 mx-1">
                  <span className="text-[10px] font-black italic text-slate-600 group-hover:text-orange-500 transition-colors">
                    VS
                  </span>
                </div>

                {/* Gość */}
                <div className="flex-1 flex items-center justify-start gap-3 pl-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-xl border border-white/10 flex flex-col overflow-hidden shadow-2xl shrink-0"
                  >
                    <div className="flex-1" style={{ backgroundColor: away.colorsHex[0] }} />
                    <div className="flex-1" style={{ backgroundColor: away.colorsHex[1] || away.colorsHex[0] }} />
                  </div>
                  <div className="text-left min-w-0">
                    <span className="block text-[13px] font-black uppercase italic truncate tracking-tight text-white group-hover:text-orange-300 transition-colors">
                      {away.name}
                    </span>
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                      {awayCountry}
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
