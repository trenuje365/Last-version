import React, { useState, useMemo } from 'react';
import { useGame } from '../../context/GameContext';
import { ViewState } from '../../types';
import { RAW_CHAMPIONS_LEAGUE_CLUBS, generateEuropeanClubId } from '../../resources/static_db/clubs/ChampionsLeagueTeams';
import { RAW_EUROPA_LEAGUE_CLUBS, generateELClubId } from '../../resources/static_db/clubs/EuropeLeagueTeams';
import { RAW_CONFERENCE_LEAGUE_CLUBS, generateCONFClubId } from '../../resources/static_db/clubs/ConferenceLeagueTeams';
import { RAW_PL_CLUBS, generateClubId } from '../../resources/static_db/clubs/pl_clubs';
import { getClubLogo } from '../../resources/ClubLogoAssets';

const FLAG_COLUMNS = 5;

const GLASS_CARD = "bg-slate-950/40 backdrop-blur-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-[40px] relative overflow-hidden";
const GLOSS_LAYER = "absolute inset-0 bg-gradient-to-br from-white/[0.05] via-transparent to-transparent pointer-events-none";

const FLAG_CODE: Record<string, string> = {
  ALB: 'al', AND: 'ad', ARM: 'am', AUT: 'at', AZE: 'az',
  BEL: 'be', BIA: 'by', BLR: 'by', BIH: 'ba', BUL: 'bg',
  CRO: 'hr', CYP: 'cy', CZE: 'cz', DEN: 'dk',
  ENG: 'gb-eng', ESP: 'es', EST: 'ee',
  FIN: 'fi', FRA: 'fr', FRO: 'fo',
  GEO: 'ge', GER: 'de', GIB: 'gi', GRE: 'gr',
  HUN: 'hu', IRL: 'ie', ISL: 'is', ISR: 'il', ITA: 'it',
  KAZ: 'kz', KOS: 'xk', LAT: 'lv', LIE: 'li', LTU: 'lt', LUX: 'lu',
  MDA: 'md', MKD: 'mk', MLT: 'mt', MNE: 'me',
  NED: 'nl', NIR: 'gb-nir', NOR: 'no',
  POL: 'pl', POR: 'pt', RUS: 'ru',
  SCO: 'gb-sct', SMR: 'sm', SRB: 'rs', SVK: 'sk', SVN: 'si',
  SWE: 'se', SUI: 'ch', TUR: 'tr', UKR: 'ua', WAL: 'gb-wls',
};

const COUNTRY_NAME: Record<string, string> = {
  ALB: 'Albania', AND: 'Andora', ARM: 'Armenia', AUT: 'Austria', AZE: 'Azerbejdżan',
  BEL: 'Belgia', BIA: 'Białoruś', BLR: 'Białoruś', BIH: 'Bośnia i Hercegowina', BUL: 'Bułgaria',
  CRO: 'Chorwacja', CYP: 'Cypr', CZE: 'Czechy', DEN: 'Dania',
  ENG: 'Anglia', ESP: 'Hiszpania', EST: 'Estonia',
  FIN: 'Finlandia', FRA: 'Francja', FRO: 'Wyspy Owcze',
  GEO: 'Gruzja', GER: 'Niemcy', GIB: 'Gibraltar', GRE: 'Grecja',
  HUN: 'Węgry', IRL: 'Irlandia', ISL: 'Islandia', ISR: 'Izrael', ITA: 'Włochy',
  KAZ: 'Kazachstan', KOS: 'Kosowo', LAT: 'Łotwa', LIE: 'Liechtenstein', LTU: 'Litwa', LUX: 'Luksemburg',
  MDA: 'Mołdawia', MKD: 'Macedonia Płn.', MLT: 'Malta', MNE: 'Czarnogóra',
  NED: 'Holandia', NIR: 'Irlandia Płn.', NOR: 'Norwegia',
  POL: 'Polska', POR: 'Portugalia', RUS: 'Rosja',
  SCO: 'Szkocja', SMR: 'San Marino', SRB: 'Serbia', SVK: 'Słowacja', SVN: 'Słowenia',
  SWE: 'Szwecja', SUI: 'Szwajcaria', TUR: 'Turcja', UKR: 'Ukraina', WAL: 'Walia',
};

const flagUrl = (code: string) =>
  `https://flagcdn.com/w40/${FLAG_CODE[code] ?? code.toLowerCase()}.png`;

interface ClubEntry {
  id: string;
  name: string;
  reputation: number;
  colors: string[];
  tier?: number;
}

function buildCountryClubMap(): Record<string, ClubEntry[]> {
  const map: Record<string, ClubEntry[]> = {};
  const seen = new Set<string>();

  const add = (country: string, entry: ClubEntry) => {
    const key = `${country}::${entry.name}`;
    if (seen.has(key)) return;
    seen.add(key);
    if (!map[country]) map[country] = [];
    map[country].push(entry);
  };

  RAW_CHAMPIONS_LEAGUE_CLUBS.forEach(c => {
    add(c.country, { id: generateEuropeanClubId(c.name), name: c.name, reputation: c.reputation, colors: c.colors });
  });
  RAW_EUROPA_LEAGUE_CLUBS.forEach(c => {
    add(c.country, { id: generateELClubId(c.name), name: c.name, reputation: c.reputation, colors: c.colors });
  });
  RAW_CONFERENCE_LEAGUE_CLUBS.forEach(c => {
    add(c.country, { id: generateCONFClubId(c.name), name: c.name, reputation: c.reputation, colors: c.colors });
  });
  RAW_PL_CLUBS.forEach(c => {
    add('POL', { id: generateClubId(c.name), name: c.name, reputation: c.reputation, colors: c.colors, tier: c.tier });
  });

  Object.values(map).forEach(arr => arr.sort((a, b) => b.reputation - a.reputation));
  return map;
}

const COUNTRY_CLUB_MAP = buildCountryClubMap();

const ClubColorBadge: React.FC<{ club: ClubEntry }> = ({ club }) => {
  const logo = getClubLogo(club.id);
  if (logo) {
    return (
      <img
        src={logo}
        alt={club.name}
        className="w-8 h-8 object-contain shrink-0"
      />
    );
  }
  return (
    <div className="flex shrink-0 rounded overflow-hidden w-8 h-8 border border-white/10">
      <div className="flex-1" style={{ backgroundColor: club.colors[0] }} />
      <div className="flex-1" style={{ backgroundColor: club.colors[1] || '#222' }} />
    </div>
  );
};

const ClubRow: React.FC<{ club: ClubEntry; onSelect: () => void }> = ({ club, onSelect }) => (
  <button
    onClick={onSelect}
    className="group relative w-full h-14 rounded-xl overflow-hidden transition-all duration-200 border border-white/[0.04] hover:border-white/[0.12] mb-0.5 text-left"
  >
    <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ backgroundColor: club.colors[0] }} />
    <div className="absolute right-2 top-[-4px] text-4xl font-black italic text-white/[0.035] select-none group-hover:text-white/[0.065] transition-colors leading-none tracking-tighter">
      {club.name.substring(0, 4).toUpperCase()}
    </div>
    <div
      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
      style={{ background: `linear-gradient(90deg, ${club.colors[0]}22, transparent)` }}
    />
    <div className="relative h-full flex items-center pl-5 pr-4 gap-4">
      <ClubColorBadge club={club} />
      <span className="flex-1 text-sm font-semibold text-slate-300 group-hover:text-white transition-colors truncate tracking-wide">
        {club.name}
      </span>
      <span className="text-[10px] text-slate-600 tabular-nums shrink-0 font-mono">rep. {club.reputation}</span>
      <span className="text-slate-700 group-hover:text-slate-400 transition-colors text-sm shrink-0">›</span>
    </div>
  </button>
);

export const EuropeanClubsView: React.FC = () => {
  const { navigateTo, viewClubDetails } = useGame();
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  const countries = useMemo(() => {
    return Object.keys(COUNTRY_CLUB_MAP)
      .filter(code => COUNTRY_NAME[code])
      .sort((a, b) => COUNTRY_NAME[a].localeCompare(COUNTRY_NAME[b], 'pl'));
  }, []);

  const handleBack = () => {
    if (selectedCountry) {
      setSelectedCountry(null);
    } else {
      navigateTo(ViewState.DASHBOARD);
    }
  };

  const clubs = selectedCountry ? (COUNTRY_CLUB_MAP[selectedCountry] || []) : [];

  return (
    <div className="min-h-screen bg-slate-950 p-6 flex flex-col items-center">
      {/* Background ambient glow */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[30%] w-[60%] h-[60%] rounded-full blur-[180px] opacity-10"
          style={{ background: selectedCountry ? '#3b82f6' : '#6366f1' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[150px] opacity-8"
          style={{ background: '#0ea5e9' }} />
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      <div className={`relative z-10 w-full transition-all duration-300 ${selectedCountry === 'POL' ? 'max-w-[1600px]' : selectedCountry ? 'max-w-2xl' : 'max-w-[1500px]'}`}>

        {/* Header */}
        <div className="flex items-center gap-4 mb-5">
          <button
            onClick={handleBack}
            className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-white/10 text-xs font-black uppercase tracking-wider text-slate-400 hover:text-white hover:bg-slate-700/80 transition-colors backdrop-blur-sm"
          >
            ← Wróć
          </button>
          <div>
            {!selectedCountry ? (
              <h1 className="text-base font-black uppercase tracking-widest text-white">Reprezentacje i Kluby Europejskie</h1>
            ) : (
              <div className="flex items-center gap-3">
                <img src={flagUrl(selectedCountry)} alt={COUNTRY_NAME[selectedCountry]} className="h-5 shadow-sm rounded-sm" />
                <h1 className="text-base font-black uppercase tracking-widest text-white">{COUNTRY_NAME[selectedCountry]}</h1>
                <span className="text-[10px] text-slate-500">{clubs.length} klubów</span>
              </div>
            )}
          </div>
        </div>

        {/* Glass card */}
        <div className={GLASS_CARD}>
          <div className={GLOSS_LAYER} />

          {/* decorative huge ghost label */}
          <div className="absolute right-[-10px] bottom-[-20px] text-[8rem] font-black italic text-white/[0.02] select-none pointer-events-none leading-none">
            {selectedCountry ? selectedCountry : 'EUR'}
          </div>

          <div className="relative z-10 p-2">


            {selectedCountry && selectedCountry !== 'POL' && (
              <div>
                {clubs.map(club => (
                  <ClubRow key={club.id} club={club} onSelect={() => viewClubDetails(club.id)} />
                ))}
              </div>
            )}

            {selectedCountry === 'POL' && (
              <div className="grid grid-cols-4 gap-3 p-2">
                {([1, 2, 3, 4] as const).map(tier => {
                  const tierClubs = clubs.filter(club => club.tier === tier);
                  if (tierClubs.length === 0) return null;

                  const tierName = tier === 1
                    ? 'Ekstraklasa'
                    : tier === 2
                      ? 'I Liga'
                      : tier === 3
                        ? 'II Liga'
                        : 'III Liga i niższe';

                  return (
                    <div key={tier} className="relative rounded-[28px] overflow-hidden bg-slate-900/40 backdrop-blur-2xl border border-white/[0.06] min-w-0">
                      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] via-transparent to-transparent pointer-events-none" />
                      <div className="absolute right-2 bottom-[-8px] text-[4rem] font-black italic text-white/[0.03] select-none pointer-events-none leading-none tracking-tighter">
                        {tier === 1 ? 'EKS' : tier === 2 ? 'I L' : tier === 3 ? 'II L' : 'III'}
                      </div>
                      <div className="relative z-10 px-4 pt-4 pb-2 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-white/[0.05] mb-1">
                        {tierName}
                        <span className="ml-2 text-slate-600 font-normal normal-case tracking-normal">
                          {tierClubs.length} klubów
                        </span>
                      </div>
                      <div className="relative z-10 px-1 pb-1">
                        {tierClubs.map(club => (
                          <ClubRow key={club.id} club={club} onSelect={() => viewClubDetails(club.id)} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!selectedCountry && (
              <div
                className="grid gap-2 p-4"
                style={{
                  gridAutoFlow: 'column',
                  gridTemplateRows: `repeat(${Math.ceil(countries.length / FLAG_COLUMNS)}, auto)`,
                  gridTemplateColumns: `repeat(${FLAG_COLUMNS}, minmax(0, 1fr))`
                }}
              >
                {countries.map(code => (
                  <button
                    key={code}
                    onClick={() => setSelectedCountry(code)}
                    className="group relative flex flex-col items-center gap-2.5 px-3 py-3 rounded-2xl overflow-hidden transition-all duration-200 text-center bg-slate-900/50 backdrop-blur-sm border border-white/[0.07] hover:border-white/[0.18] hover:bg-slate-800/60 min-h-[88px]"
                  >
                    {/* Gloss layer */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] via-transparent to-transparent pointer-events-none" />
                    {/* Ghost country name */}
                    <div className="absolute right-1 bottom-[-2px] text-[2.2rem] font-black italic text-white/[0.05] select-none group-hover:text-white/[0.09] transition-colors leading-none pointer-events-none tracking-tighter">
                      {code}
                    </div>
                    {/* Hover shimmer from top */}
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                      style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.04), transparent)' }}
                    />
                    <img
                      src={flagUrl(code)}
                      alt={COUNTRY_NAME[code]}
                      className="relative w-[72px] h-[46px] object-cover rounded-md shadow-lg"
                    />
                    <span className="relative text-[10px] text-slate-400 group-hover:text-white transition-colors leading-tight font-semibold w-full text-center truncate">
                      {COUNTRY_NAME[code]}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
