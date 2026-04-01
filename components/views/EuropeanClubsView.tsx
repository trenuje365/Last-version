import React, { useState, useMemo } from 'react';
import ntBgImg from '../../Graphic/themes/national_teams_view.png';
import saWorldBgImg from '../../Graphic/themes/innekluby.png';
import allTeamsBgImg from '../../Graphic/themes/allteams.png';
import allCupsBgImg from '../../Graphic/themes/allcups.png';
import { useGame } from '../../context/GameContext';
import { ViewState, NationalTeam, Player, PlayerPosition, PlayerAttributes } from '../../types';
import { RAW_CHAMPIONS_LEAGUE_CLUBS, generateEuropeanClubId } from '../../resources/static_db/clubs/ChampionsLeagueTeams';
import { RAW_EUROPA_LEAGUE_CLUBS, generateELClubId } from '../../resources/static_db/clubs/EuropeLeagueTeams';
import { RAW_CONFERENCE_LEAGUE_CLUBS, generateCONFClubId } from '../../resources/static_db/clubs/ConferenceLeagueTeams';
import { RAW_PL_CLUBS, generateClubId } from '../../resources/static_db/clubs/pl_clubs';
import { getClubLogo } from '../../resources/ClubLogoAssets';
import { CLUBS_SOUTH_AMERICA } from '../../resources/static_db/clubs/SouthamericanTeams';
import { generateSAClubId } from '../../resources/static_db/clubs/SouthamericanTeams';
import { CLUBS_AFRICAN, generateAfricanClubId } from '../../resources/static_db/clubs/african_teams';
import { CLUBS_ASIAN, generateAsianClubId } from '../../resources/static_db/clubs/asian_teams';
import { CLUBS_NORTH_AMERICA, generateNorthAmericaClubId } from '../../resources/static_db/clubs/northAME_teams';

const FLAG_COLUMNS = 5;

const GLASS_CARD = "bg-slate-950/20 border border-white/[0.07] shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-[40px] relative overflow-hidden";
const GLOSS_LAYER = "absolute inset-0 bg-gradient-to-br from-white/[0.05] via-transparent to-transparent pointer-events-none";
const MANAGER_HEADING_FONT = "font-black italic uppercase tracking-tighter";
const MANAGER_BUTTON_FONT = "font-black italic uppercase tracking-widest";

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
  ARG: 'ar', BRA: 'br', URU: 'uy', COL: 'co', ECU: 'ec',
  CHI: 'cl', PAR: 'py', PER: 'pe', BOL: 'bo', VEN: 've',
  KSA: 'sa', UAE: 'ae', JPN: 'jp',
  EGY: 'eg', RSA: 'za', TUN: 'tn', MAR: 'ma',
  USA: 'us', MEX: 'mx',
  AUS: 'au', CHN: 'cn', IRN: 'ir', KOR: 'kr',
  MAS: 'my', QAT: 'qa', ROU: 'ro', THA: 'th',
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
  ARG: 'Argentyna', BRA: 'Brazylia', URU: 'Urugwaj', COL: 'Kolumbia', ECU: 'Ekwador',
  CHI: 'Chile', PAR: 'Paragwaj', PER: 'Peru', BOL: 'Boliwia', VEN: 'Wenezuela',
  KSA: 'Arabia Saudyjska', UAE: 'ZEA', JPN: 'Japonia',
  EGY: 'Egipt', RSA: 'RPA', TUN: 'Tunezja', MAR: 'Maroko',
  USA: 'USA', MEX: 'Meksyk',
  AUS: 'Australia', CHN: 'Chiny', IRN: 'Iran', KOR: 'Korea Płd.',
  MAS: 'Malezja', QAT: 'Katar', ROU: 'Rumunia', THA: 'Tajlandia',
};

const flagUrl = (code: string) =>
  `https://flagcdn.com/w40/${FLAG_CODE[code] ?? code.toLowerCase()}.png`;

const getCountryLabel = (code: string): string => COUNTRY_NAME[code] ?? code;

const hasCountryFlag = (code: string): boolean =>
  Boolean(FLAG_CODE[code] || code.length === 2);

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

const buildWorldClubMap = (
  clubs: Array<{ name: string; country: string; reputation: number; colors: string[] }>,
  idGenerator: (name: string) => string
): Record<string, ClubEntry[]> => {
  const map: Record<string, ClubEntry[]> = {};

  clubs.forEach(club => {
    const id = idGenerator(club.name);
    if (!map[club.country]) map[club.country] = [];
    map[club.country].push({
      id,
      name: club.name,
      reputation: club.reputation,
      colors: club.colors
    });
  });

  Object.values(map).forEach(arr => arr.sort((a, b) => b.reputation - a.reputation));
  return map;
};

const getSortedCountryCodes = (clubMap: Record<string, ClubEntry[]>): string[] =>
  Object.keys(clubMap).sort((a, b) => getCountryLabel(a).localeCompare(getCountryLabel(b), 'pl'));

const SA_CLUB_MAP = buildWorldClubMap(CLUBS_SOUTH_AMERICA, generateSAClubId);
const AFRICA_CLUB_MAP = buildWorldClubMap(CLUBS_AFRICAN, generateAfricanClubId);
const ASIA_CLUB_MAP = buildWorldClubMap(CLUBS_ASIAN, generateAsianClubId);
const NORTH_AMERICA_CLUB_MAP = buildWorldClubMap(CLUBS_NORTH_AMERICA, generateNorthAmericaClubId);

const SA_COUNTRY_ORDER = getSortedCountryCodes(SA_CLUB_MAP);
const AFRICA_COUNTRY_ORDER = getSortedCountryCodes(AFRICA_CLUB_MAP);
const ASIA_COUNTRY_ORDER = getSortedCountryCodes(ASIA_CLUB_MAP);
const NORTH_AMERICA_COUNTRY_ORDER = getSortedCountryCodes(NORTH_AMERICA_CLUB_MAP);

const WORLD_REGIONS = [
  { key: 'SA', label: 'Ameryka Poludniowa' },
  { key: 'AFR', label: 'Afryka' },
  { key: 'ASIA', label: 'Azja' },
  { key: 'NA', label: 'Ameryka Polnocna' },
] as const;

type WorldRegionKey = typeof WORLD_REGIONS[number]['key'];

const ClubColorBadge: React.FC<{ club: ClubEntry }> = ({ club }) => {
  const logo = getClubLogo(club.id);
  if (logo) {
    return (
      <img
        src={logo}
        alt={club.name}
        className="w-10 h-10 object-contain shrink-0"
      />
    );
  }
  return (
    <div className="flex shrink-0 rounded overflow-hidden w-10 h-10 border border-white/10">
      <div className="flex-1" style={{ backgroundColor: club.colors[0] }} />
      <div className="flex-1" style={{ backgroundColor: club.colors[1] || '#222' }} />
    </div>
  );
};

const ClubRow: React.FC<{ club: ClubEntry; onSelect: () => void }> = ({ club, onSelect }) => (
  <button
    onClick={onSelect}
    className="group relative w-full h-[70px] rounded-xl overflow-hidden transition-all duration-200 border border-white/[0.04] hover:border-white/[0.12] mb-0.5 text-left"
  >
    <div className="absolute left-0 top-0 bottom-0 w-[4px]" style={{ backgroundColor: club.colors[0] }} />
    <div className="absolute right-2 top-[-4px] text-5xl font-black italic text-white/[0.035] select-none group-hover:text-white/[0.065] transition-colors leading-none tracking-tighter">
      {club.name.substring(0, 4).toUpperCase()}
    </div>
    <div
      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
      style={{ background: `linear-gradient(90deg, ${club.colors[0]}22, transparent)` }}
    />
    <div className="relative h-full flex items-center pl-5 pr-4 gap-4">
      <ClubColorBadge club={club} />
      <span className={`flex-1 text-base text-slate-300 group-hover:text-white transition-colors truncate ${MANAGER_HEADING_FONT}`}>
        {club.name}
      </span>
      <span className="text-[11px] text-slate-600 tabular-nums shrink-0 font-mono">rep. {club.reputation}</span>
      <span className="text-slate-700 group-hover:text-slate-400 transition-colors text-base shrink-0">›</span>
    </div>
  </button>
);

const WorldClubGrid: React.FC<{
  countryOrder: string[];
  clubMap: Record<string, ClubEntry[]>;
  onSelectClub: (clubId: string) => void;
}> = ({ countryOrder, clubMap, onSelectClub }) => (
  <div className="grid grid-cols-3 gap-6">
    {countryOrder.filter(code => clubMap[code]?.length > 0).map(code => (
      <div key={code}>
        <div className="flex items-center gap-3 mb-3">
          {hasCountryFlag(code) ? (
            <img src={flagUrl(code)} alt={getCountryLabel(code)} className="h-6 w-9 object-cover rounded shadow-lg" />
          ) : (
            <div className="h-6 min-w-9 px-2 rounded bg-white/10 border border-white/10 text-[9px] font-black flex items-center justify-center text-slate-300">
              {code}
            </div>
          )}
          <span className={`text-sm text-white ${MANAGER_HEADING_FONT}`}>{getCountryLabel(code)}</span>
          <div className="flex-1 h-px bg-white/[0.06]" />
          <span className="text-[10px] text-slate-600 font-medium">{clubMap[code].length} klubów</span>
        </div>
        <div className="space-y-1">
          {clubMap[code].map((club, idx) => {
            const c0 = club.colors?.[0] ?? '#6366f1';
            const c1 = club.colors?.[1] ?? c0;
            const c2 = club.colors?.[2] ?? c1;
            return (
              <button
                key={club.id}
                onClick={() => onSelectClub(club.id)}
                className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-white/[0.05] hover:border-white/[0.14] bg-white/[0.02] hover:bg-white/[0.05] transition-all duration-150"
              >
                <span className="w-4 text-[10px] font-black text-slate-700 group-hover:text-slate-500 transition-colors text-right shrink-0">{idx + 1}</span>
                <div
                  className="w-9 h-7 rounded-md shrink-0 overflow-hidden"
                  style={{ background: `linear-gradient(135deg, ${c0} 0%, ${c0} 50%, ${c1} 50%, ${c1} 100%)`, border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <div className="w-full h-full" style={{ background: `linear-gradient(to bottom, ${c2}22, transparent)` }} />
                </div>
                <span className={`flex-1 text-[11px] text-slate-200 group-hover:text-white transition-colors text-left truncate ${MANAGER_HEADING_FONT}`}>{club.name}</span>
                <span className="text-slate-700 group-hover:text-slate-400 transition-colors text-xs shrink-0">›</span>
              </button>
            );
          })}
        </div>
      </div>
    ))}
  </div>
);

// ─── REPREZENTACJE ───────────────────────────────────────────────────────────

const CONTINENTS = [
  { key: 'RANKING',       label: 'Ranking' },
  { key: 'Europe',        label: 'Europa' },
  { key: 'Africa',        label: 'Afryka' },
  { key: 'South America', label: 'Ameryka Pd.' },
  { key: 'North America', label: 'Ameryka Śr.' },
  { key: 'Asia',          label: 'Azja' },
  { key: 'Oceania',       label: 'Oceania' },
];

const TIER_BADGE: Record<number, string> = {
  1: 'text-amber-400 bg-amber-400/10 border border-amber-400/30',
  2: 'text-emerald-400 bg-emerald-400/10 border border-emerald-400/30',
  3: 'text-sky-400 bg-sky-400/10 border border-sky-400/30',
  4: 'text-slate-300 bg-white/[0.06] border border-white/[0.12]',
  5: 'text-slate-500 bg-white/[0.03] border border-white/[0.07]',
};

const POS_LABEL: Record<PlayerPosition, string> = {
  [PlayerPosition.GK]:  'BR',
  [PlayerPosition.DEF]: 'OBR',
  [PlayerPosition.MID]: 'POL',
  [PlayerPosition.FWD]: 'NAP',
};

const POS_COLOR: Record<PlayerPosition, string> = {
  [PlayerPosition.GK]:  'text-yellow-400 bg-yellow-400/10',
  [PlayerPosition.DEF]: 'text-blue-400 bg-blue-400/10',
  [PlayerPosition.MID]: 'text-green-400 bg-green-400/10',
  [PlayerPosition.FWD]: 'text-red-400 bg-red-400/10',
};

const repColor = (rep: number): string => {
  if (rep >= 16) return 'text-yellow-400';
  if (rep >= 11) return 'text-green-400';
  if (rep >= 6)  return 'text-blue-400';
  return 'text-slate-500';
};

const tierStars = (tier: number): string => '★'.repeat(Math.max(0, 6 - tier)) + '☆'.repeat(Math.min(5, tier - 1));

const NTCard: React.FC<{ team: NationalTeam; coachName: string; onSelect: () => void; showTier?: boolean; rank?: number }> = ({ team, onSelect, showTier, rank }) => (
  <button
    onClick={onSelect}
    className="group relative w-full rounded-xl overflow-hidden transition-all duration-200 border border-white/[0.05] hover:border-white/[0.15] mb-1 text-left"
    style={{ background: `linear-gradient(90deg, ${team.colorsHex[0]}18, transparent 60%)` }}
  >
    <div className="absolute left-0 top-0 bottom-0 w-[4px]" style={{ backgroundColor: team.colorsHex[0] }} />
    <div className="absolute right-2 top-[-4px] text-6xl font-black italic text-white/[0.03] select-none group-hover:text-white/[0.06] transition-colors leading-none tracking-tighter">
      {team.name.substring(0, 4).toUpperCase()}
    </div>
    <div className="relative h-[62px] flex items-center pl-6 pr-5 gap-4">
      {rank !== undefined && (
        <span className="flex items-center justify-center w-9 h-9 rounded-full bg-white/10 border border-white/20 text-sm font-black tabular-nums text-white shrink-0">
          {rank}
        </span>
      )}
      <div className="flex shrink-0 rounded-md overflow-hidden w-7 h-7 border border-white/10">
        <div className="flex-1" style={{ backgroundColor: team.colorsHex[0] }} />
        <div className="flex-1" style={{ backgroundColor: team.colorsHex[1] || '#222' }} />
      </div>
      <span className="flex-1 text-lg font-black italic uppercase tracking-wide text-white truncate">
        {team.name}
      </span>
      {showTier && (
        <span className={`text-xs font-black uppercase px-3 py-1 rounded shrink-0 ${TIER_BADGE[team.tier] ?? TIER_BADGE[5]}`}>
          Tier {team.tier}
        </span>
      )}
      <span className="text-white/30 group-hover:text-white/70 transition-colors text-lg shrink-0">›</span>
    </div>
  </button>
);

const ratingColor = (r: number): string => {
  if (r >= 80) return 'text-amber-400';
  if (r >= 65) return 'text-emerald-400';
  if (r >= 50) return 'text-sky-400';
  return 'text-white';
};

const ratingBg = (r: number): string => {
  if (r >= 80) return 'bg-amber-400/10 border-amber-400/20';
  if (r >= 65) return 'bg-emerald-400/10 border-emerald-400/20';
  if (r >= 50) return 'bg-sky-400/10 border-sky-400/20';
  return 'bg-slate-700/20 border-white/[0.05]';
};

const avgRating = (players: Player[]): number =>
  players.length === 0 ? 0 : Math.round(players.reduce((s, p) => s + p.overallRating, 0) / players.length);

const NTSquadView: React.FC<{ team: NationalTeam; coachName: string; playerById: Record<string, Player>; clubById: Record<string, string>; onPlayerClick: (id: string) => void }> = ({ team, coachName, playerById, clubById, onPlayerClick }) => {
  const squad = team.squadPlayerIds.map(id => playerById[id]).filter(Boolean) as Player[];

  const POS_ORDER: Record<PlayerPosition, number> = {
    [PlayerPosition.GK]: 0, [PlayerPosition.DEF]: 1, [PlayerPosition.MID]: 2, [PlayerPosition.FWD]: 3,
  };
  const sorted = [...squad].sort((a, b) => {
    const d = POS_ORDER[a.position] - POS_ORDER[b.position];
    return d !== 0 ? d : b.overallRating - a.overallRating;
  });

  const avg = avgRating(squad);
  const accent = team.colorsHex[0] || '#6366f1';

  const POS_ROW_BG: Record<PlayerPosition, string> = {
    [PlayerPosition.GK]:  'bg-yellow-500/[0.08]',
    [PlayerPosition.DEF]: 'bg-blue-500/[0.07]',
    [PlayerPosition.MID]: 'bg-emerald-500/[0.07]',
    [PlayerPosition.FWD]: 'bg-red-500/[0.08]',
  };

  const POS_BADGE: Record<PlayerPosition, string> = {
    [PlayerPosition.GK]:  'text-yellow-400 bg-yellow-400/15 border border-yellow-400/30',
    [PlayerPosition.DEF]: 'text-blue-400 bg-blue-400/15 border border-blue-400/30',
    [PlayerPosition.MID]: 'text-emerald-400 bg-emerald-400/15 border border-emerald-400/30',
    [PlayerPosition.FWD]: 'text-red-400 bg-red-400/15 border border-red-400/30',
  };

  const POS_SHORT: Record<PlayerPosition, string> = {
    [PlayerPosition.GK]: 'BR', [PlayerPosition.DEF]: 'OBR', [PlayerPosition.MID]: 'POL', [PlayerPosition.FWD]: 'NAP',
  };

  const attrColor = (v: number): string => {
    if (v >= 80) return 'text-amber-400 font-black italic';
    if (v >= 65) return 'text-emerald-400 font-black italic';
    if (v >= 50) return 'text-sky-400 font-black italic';
    return 'text-white font-black italic';
  };

  const GRID = '52px 1fr minmax(0,200px) 38px 38px 38px 38px 38px 52px';

  const T = 'font-black italic uppercase tracking-wide text-white';

  return (
    <div>
      {/* ── Nagłówek drużyny ── */}
      <div
        className="rounded-2xl overflow-hidden mb-5 border border-white/[0.07] relative"
        style={{ background: `linear-gradient(135deg, ${accent}22 0%, transparent 60%)` }}
      >
        <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: `linear-gradient(90deg, ${accent}, ${team.colorsHex[1] || accent}88, transparent)` }} />
        <div className="flex gap-4 px-5 py-4 items-center">
          <div className="flex rounded-xl overflow-hidden shrink-0 border border-white/10" style={{ width: 52, height: 52 }}>
            <div className="flex-1" style={{ backgroundColor: team.colorsHex[0] }} />
            <div className="flex-1" style={{ backgroundColor: team.colorsHex[1] || '#222' }} />
            <div className="flex-1" style={{ backgroundColor: team.colorsHex[2] || team.colorsHex[0] }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className={`text-xl leading-tight truncate ${T}`}>{team.name}</div>
            <div className={`text-[10px] mt-0.5 ${T}`}>
              {team.continent} · Tier {team.tier} · <span className={repColor(team.reputation)}>Rep. {team.reputation}/20</span>
            </div>
          </div>
          <div className="flex gap-6 shrink-0">
            <div className="text-center">
              <div className={`text-2xl tabular-nums ${T} ${ratingColor(avg)}`}>{avg}</div>
              <div className={`text-[8px] tracking-widest ${T}`}>śr. rating</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl tabular-nums ${T}`}>{squad.length}</div>
              <div className={`text-[8px] tracking-widest ${T}`}>zawodników</div>
            </div>
          </div>
        </div>
        <div className="flex border-t border-white/[0.06]">
          <div className="flex-1 px-5 py-2.5 border-r border-white/[0.06]">
            <div className={`text-[8px] tracking-widest mb-0.5 ${T}`}>Trener</div>
            <div className={`text-xs truncate ${T}`}>{coachName || '—'}</div>
          </div>
          <div className="flex-1 px-5 py-2.5">
            <div className={`text-[8px] tracking-widest mb-0.5 ${T}`}>Taktyka</div>
            <div className={`text-xs truncate ${T}`}>{team.tacticId || '—'}</div>
          </div>
        </div>
      </div>

      {/* ── Tabela składu ── */}
      <div className="rounded-xl overflow-hidden border border-white/[0.08]">
        {/* Nagłówek kolumn */}
        <div
          className={`grid px-4 py-2.5 bg-slate-800/80 border-b border-white/[0.10] text-[9px] ${T}`}
          style={{ gridTemplateColumns: GRID }}
        >
          <span>Poz</span>
          <span>Zawodnik</span>
          <span>Klub</span>
          <span className="text-center">PAC</span>
          <span className="text-center">ATT</span>
          <span className="text-center">DEF</span>
          <span className="text-center">PAS</span>
          <span className="text-center">TEC</span>
          <span className="text-right">OVR</span>
        </div>
        {/* Wiersze zawodników */}
        {sorted.map(p => {
          const injured = p.health.status === 'INJURED';
          const clubName = p.clubId === 'FREE_AGENTS' ? 'Wolny agent' : (clubById[p.clubId] || '—');
          return (
            <button
              key={p.id}
              onClick={() => onPlayerClick(p.id)}
              className={`group w-full grid text-left px-4 py-2.5 transition-all duration-100 border-b border-white/[0.04] hover:bg-white/[0.07] ${POS_ROW_BG[p.position]} ${injured ? 'opacity-50' : ''} relative`}
              style={{ gridTemplateColumns: GRID }}
            >
              {injured && <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-red-500" />}
              {/* POZ */}
              <span className="flex items-center">
                <span className={`text-[8px] font-black italic uppercase px-1.5 py-0.5 rounded ${POS_BADGE[p.position]}`}>
                  {POS_SHORT[p.position]}
                </span>
              </span>
              {/* Zawodnik */}
              <span className="flex items-center gap-1.5 min-w-0">
                <span className={`text-xs truncate ${T}`}>
                  {p.firstName} {p.lastName}
                </span>
                {injured && <span className={`text-[8px] text-red-400 shrink-0 ${T}`}>⛌</span>}
              </span>
              {/* Klub */}
              <span className={`text-[10px] truncate self-center ${T}`}>{clubName}</span>
              {/* Atrybuty */}
              <span className={`text-[11px] tabular-nums text-center self-center ${attrColor(p.attributes.pace)}`}>{p.attributes.pace}</span>
              <span className={`text-[11px] tabular-nums text-center self-center ${attrColor(p.attributes.attacking)}`}>{p.attributes.attacking}</span>
              <span className={`text-[11px] tabular-nums text-center self-center ${attrColor(p.attributes.defending)}`}>{p.attributes.defending}</span>
              <span className={`text-[11px] tabular-nums text-center self-center ${attrColor(p.attributes.passing)}`}>{p.attributes.passing}</span>
              <span className={`text-[11px] tabular-nums text-center self-center ${attrColor(p.attributes.technique)}`}>{p.attributes.technique}</span>
              {/* OVR */}
              <span className={`text-sm tabular-nums text-right self-center ${T} ${ratingColor(p.overallRating)}`}>{p.overallRating}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ─── GŁÓWNY KOMPONENT ─────────────────────────────────────────────────────────

export const EuropeanClubsView: React.FC = () => {
  const { navigateTo, viewClubDetails, viewPlayerDetails, nationalTeams, coaches, players, clubs,
          europeanViewTab: activeTab, setEuropeanViewTab: setActiveTab,
          selectedNTId, setSelectedNTId, previousViewState } = useGame();
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [activeContinent, setActiveContinent] = useState<string>('Europe');
  const [activeWorldRegion, setActiveWorldRegion] = useState<WorldRegionKey>('SA');
  const selectedNT = nationalTeams.find(t => t.id === selectedNTId) ?? null;
  const setSelectedNT = (t: NationalTeam | null) => setSelectedNTId(t?.id ?? null);

  const countries = useMemo(() => {
    return Object.keys(COUNTRY_CLUB_MAP)
      .sort((a, b) => getCountryLabel(a).localeCompare(getCountryLabel(b), 'pl'));
  }, []);

  const handleBack = () => {
    if (selectedNT) { setSelectedNT(null); return; }
    if (selectedCountry) { setSelectedCountry(null); return; }
    navigateTo(ViewState.DASHBOARD);
  };

  const clubsForCountry = selectedCountry ? (COUNTRY_CLUB_MAP[selectedCountry] || []) : [];

  // Mapy pomocnicze dla reprezentacji
  const playerById = useMemo<Record<string, Player>>(() => {
    const map: Record<string, Player> = {};
    Object.values(players).flat().forEach(p => { map[p.id] = p; });
    return map;
  }, [players]);

  const clubById = useMemo<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    clubs.forEach(c => { map[c.id] = c.name; });
    return map;
  }, [clubs]);

  const continentTeams = useMemo(() => {
    if (activeContinent === 'RANKING') {
      const avgOverall = (team: NationalTeam): number => {
        const ratings = team.squadPlayerIds.map(id => playerById[id]?.overallRating ?? 0).filter(r => r > 0);
        return ratings.length ? ratings.reduce((s, r) => s + r, 0) / ratings.length : 0;
      };
      return [...nationalTeams].sort((a, b) => {
        const diff = avgOverall(b) - avgOverall(a);
        if (diff !== 0) return diff;
        if (b.reputation !== a.reputation) return b.reputation - a.reputation;
        return a.tier - b.tier;
      });
    }
    return nationalTeams
      .filter(t => t.continent === activeContinent)
      .sort((a, b) => a.name.localeCompare(b.name, 'pl'));
  }, [nationalTeams, activeContinent, playerById]);

  const getCoachName = (team: NationalTeam): string => {
    if (!team.coachId) return '';
    const coach = coaches[team.coachId];
    if (!coach) return '';
    return `${coach.firstName} ${coach.lastName}`;
  };

  const ambientColor = activeTab === 'nt' ? '#10b981' : (selectedCountry ? '#3b82f6' : '#6366f1');

  return (
    <div className="min-h-screen bg-slate-950 p-6 flex flex-col items-center relative">
      {activeTab === 'nt' && (
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div
            className="absolute inset-0 scale-110 opacity-40 mix-blend-luminosity"
            style={{ backgroundImage: `url(${ntBgImg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/30 via-slate-950/60 to-slate-950" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-transparent to-slate-950 opacity-60" />
        </div>
      )}
      {activeTab === 'clubs' && selectedCountry === 'WORLD' && (
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div
            className="absolute inset-0 opacity-30"
            style={{ backgroundImage: `url(${saWorldBgImg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/20 via-slate-950/50 to-slate-950" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/60 via-transparent to-slate-950/60" />
        </div>
      )}
      {activeTab === 'clubs' && !selectedCountry && (
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div
            className="absolute inset-0 opacity-25"
            style={{ backgroundImage: `url(${allTeamsBgImg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/20 via-slate-950/50 to-slate-950" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/60 via-transparent to-slate-950/60" />
        </div>
      )}
      {activeTab === 'clubs' && selectedCountry && selectedCountry !== 'WORLD' && (
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div
            className="absolute inset-0 opacity-25"
            style={{ backgroundImage: `url(${allCupsBgImg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/20 via-slate-950/50 to-slate-950" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/60 via-transparent to-slate-950/60" />
        </div>
      )}
      {/* Background ambient glow */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[30%] w-[60%] h-[60%] rounded-full blur-[180px] opacity-10"
          style={{ background: ambientColor }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[150px] opacity-8"
          style={{ background: '#0ea5e9' }} />
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      <div className={`relative z-10 w-full transition-all duration-300 ${activeTab === 'clubs' && selectedCountry === 'POL' ? 'max-w-[1600px]' : activeTab === 'clubs' && selectedCountry === 'WORLD' ? 'max-w-5xl' : activeTab === 'clubs' && selectedCountry && selectedCountry !== 'POL' ? 'max-w-4xl' : activeTab === 'clubs' ? 'max-w-[1500px]' : selectedNT ? 'max-w-[80vw]' : 'max-w-[1280px]'}`}>

        {/* Header */}
        <div className="flex items-center gap-4 mb-5">
          <button
            onClick={handleBack}
            className={`px-3 py-1.5 rounded-lg bg-slate-800/80 border border-white/10 text-xs text-slate-400 hover:text-white hover:bg-slate-700/80 transition-colors ${MANAGER_BUTTON_FONT}`}
          >
            ← Wróć
          </button>
          <div>
            {activeTab === 'clubs' && !selectedCountry && (
              <h1 className={`text-base text-white ${MANAGER_HEADING_FONT}`}>Reprezentacje i Kluby Europejskie</h1>
            )}
            {activeTab === 'clubs' && selectedCountry && selectedCountry !== 'WORLD' && (
              <div className="flex items-center gap-3">
                {hasCountryFlag(selectedCountry) ? (
                  <img src={flagUrl(selectedCountry)} alt={getCountryLabel(selectedCountry)} className="h-5 shadow-sm rounded-sm" />
                ) : (
                  <div className="h-5 min-w-8 px-2 rounded bg-white/10 border border-white/10 text-[8px] font-black flex items-center justify-center text-slate-300">
                    {selectedCountry}
                  </div>
                )}
                <h1 className={`text-base text-white ${MANAGER_HEADING_FONT}`}>{getCountryLabel(selectedCountry)}</h1>
                <span className="text-[10px] text-slate-500">{clubsForCountry.length} klubów</span>
              </div>
            )}
            {activeTab === 'clubs' && selectedCountry === 'WORLD' && (
              <div className="flex items-center gap-3">
                <span className="text-xl">🌍</span>
                <h1 className={`text-base text-white ${MANAGER_HEADING_FONT}`}>Inne drużyny</h1>
              </div>
            )}
            {activeTab === 'nt' && !selectedNT && (
              <h1 className={`text-base text-white ${MANAGER_HEADING_FONT}`}>Reprezentacje Narodowe</h1>
            )}
            {activeTab === 'nt' && selectedNT && (
              <h1 className={`text-base text-white ${MANAGER_HEADING_FONT}`}>{selectedNT.name} — Skład</h1>
            )}
          </div>
        </div>

        {/* Główne zakładki: Kluby | Reprezentacje */}
        {!selectedCountry && !selectedNT && (
          <div className="flex gap-2 mb-4">
            {(['clubs', 'nt'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 rounded-2xl text-[11px] transition-all ${MANAGER_BUTTON_FONT} ${
                  activeTab === tab
                    ? 'bg-indigo-500 text-white shadow-[0_0_24px_rgba(99,102,241,0.35)]'
                    : 'bg-white/[0.04] text-slate-400 hover:bg-white/[0.07] border border-white/[0.08]'
                }`}
              >
                {tab === 'clubs' ? '🏟 Kluby' : '🌍 Reprezentacje'}
              </button>
            ))}
          </div>
        )}

        {/* Glass card */}
        <div className={GLASS_CARD}>
          <div className={GLOSS_LAYER} />

          {/* Ghost label */}
          <div className="absolute right-[-10px] bottom-[-20px] text-[8rem] font-black italic text-white/[0.02] select-none pointer-events-none leading-none">
            {activeTab === 'clubs' ? (selectedCountry ? selectedCountry : 'EUR') : 'NT'}
          </div>

          <div className="relative z-10 p-2">

            {/* ── ZAKŁADKA KLUBY ─────────────────────────────────────────────── */}

            {activeTab === 'clubs' && selectedCountry && selectedCountry !== 'POL' && selectedCountry !== 'WORLD' && (
              <div className="grid grid-cols-2 gap-x-3 p-2">
                {clubsForCountry.map(club => (
                  <ClubRow key={club.id} club={club} onSelect={() => viewClubDetails(club.id)} />
                ))}
              </div>
            )}

            {activeTab === 'clubs' && selectedCountry === 'POL' && (
              <div className="grid grid-cols-4 gap-3 p-2">
                {([1, 2, 3, 4] as const).map(tier => {
                  const tierClubs = clubsForCountry.filter(club => club.tier === tier);
                  if (tierClubs.length === 0) return null;

                  const tierName = tier === 1
                    ? 'Ekstraklasa'
                    : tier === 2
                      ? 'I Liga'
                      : tier === 3
                        ? 'II Liga'
                        : 'III Liga i niższe';

                  return (
                    <div key={tier} className="relative rounded-[28px] overflow-hidden bg-slate-900/40 border border-white/[0.06] min-w-0">
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

            {activeTab === 'clubs' && selectedCountry === 'WORLD' && (
              <div className="p-6">
                <div className="flex flex-wrap gap-2 justify-center mb-6">
                  {WORLD_REGIONS.map(region => (
                    <button
                      key={region.key}
                      onClick={() => setActiveWorldRegion(region.key)}
                      className={`px-5 py-2 rounded-xl text-[10px] transition-all ${MANAGER_BUTTON_FONT} ${
                        activeWorldRegion === region.key
                          ? 'bg-sky-500 text-white shadow-[0_0_16px_rgba(14,165,233,0.28)]'
                          : 'bg-white/[0.04] text-slate-400 hover:bg-white/[0.07] border border-white/[0.08]'
                      }`}
                    >
                      {region.label}
                    </button>
                  ))}
                </div>
                {activeWorldRegion === 'SA' && (
                <div className="grid grid-cols-3 gap-6">
                  {SA_COUNTRY_ORDER.filter(code => SA_CLUB_MAP[code]?.length > 0).map(code => (
                    <div key={code}>
                      {/* Country header */}
                      <div className="flex items-center gap-3 mb-3">
                        <img src={flagUrl(code)} alt={COUNTRY_NAME[code]} className="h-6 w-9 object-cover rounded shadow-lg" />
                        <span className={`text-sm text-white ${MANAGER_HEADING_FONT}`}>{COUNTRY_NAME[code]}</span>
                        <div className="flex-1 h-px bg-white/[0.06]" />
                        <span className="text-[10px] text-slate-600 font-medium">{SA_CLUB_MAP[code].length} klubów</span>
                      </div>
                      {/* Club rows */}
                      <div className="space-y-1">
                        {SA_CLUB_MAP[code].map((club, idx) => {
                          const c0 = club.colors?.[0] ?? '#6366f1';
                          const c1 = club.colors?.[1] ?? c0;
                          const c2 = club.colors?.[2] ?? c1;
                          return (
                            <button
                              key={club.id}
                              onClick={() => viewClubDetails(club.id)}
                              className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-white/[0.05] hover:border-white/[0.14] bg-white/[0.02] hover:bg-white/[0.05] transition-all duration-150"
                            >
                              {/* Rank */}
                              <span className="w-4 text-[10px] font-black text-slate-700 group-hover:text-slate-500 transition-colors text-right shrink-0">{idx + 1}</span>
                              {/* Club color badge */}
                              <div
                                className="w-9 h-7 rounded-md shrink-0 overflow-hidden"
                                style={{ background: `linear-gradient(135deg, ${c0} 0%, ${c0} 50%, ${c1} 50%, ${c1} 100%)`, border: '1px solid rgba(255,255,255,0.1)' }}
                              >
                                <div className="w-full h-full" style={{ background: `linear-gradient(to bottom, ${c2}22, transparent)` }} />
                              </div>
                              {/* Club name */}
                              <span className={`flex-1 text-[11px] text-slate-200 group-hover:text-white transition-colors text-left truncate ${MANAGER_HEADING_FONT}`}>{club.name}</span>
                              <span className="text-slate-700 group-hover:text-slate-400 transition-colors text-xs shrink-0">›</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                )}
                {activeWorldRegion === 'AFR' && (
                  <WorldClubGrid countryOrder={AFRICA_COUNTRY_ORDER} clubMap={AFRICA_CLUB_MAP} onSelectClub={viewClubDetails} />
                )}
                {activeWorldRegion === 'ASIA' && (
                  <WorldClubGrid countryOrder={ASIA_COUNTRY_ORDER} clubMap={ASIA_CLUB_MAP} onSelectClub={viewClubDetails} />
                )}
                {activeWorldRegion === 'NA' && (
                  <WorldClubGrid countryOrder={NORTH_AMERICA_COUNTRY_ORDER} clubMap={NORTH_AMERICA_CLUB_MAP} onSelectClub={viewClubDetails} />
                )}
              </div>
            )}

            {activeTab === 'clubs' && !selectedCountry && (
              <div
                className="grid gap-2 p-4"
                style={{
                  gridAutoFlow: 'column',
                  gridTemplateRows: `repeat(${Math.ceil((countries.length + 1) / FLAG_COLUMNS)}, auto)`,
                  gridTemplateColumns: `repeat(${FLAG_COLUMNS}, minmax(0, 1fr))`
                }}
              >
                {[...countries, 'WORLD'].map(code => (
                  <button
                    key={code}
                    onClick={() => setSelectedCountry(code)}
                    className="group relative flex flex-col items-center gap-2.5 px-3 py-3 rounded-2xl overflow-hidden transition-all duration-200 text-center bg-slate-900/40 border border-white/[0.07] hover:border-white/[0.18] hover:bg-slate-800/50 min-h-[88px]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] via-transparent to-transparent pointer-events-none" />
                    {code === 'WORLD' ? (
                      <>
                        <span className="relative text-[2.8rem] leading-none mt-1">🌍</span>
                        <span className={`relative text-[10px] text-slate-400 group-hover:text-white transition-colors leading-tight w-full text-center truncate ${MANAGER_HEADING_FONT}`}>
                          Inne drużyny
                        </span>
                      </>
                    ) : (
                      <>
                        <div className="absolute right-1 bottom-[-2px] text-[2.2rem] font-black italic text-white/[0.05] select-none group-hover:text-white/[0.09] transition-colors leading-none pointer-events-none tracking-tighter">
                          {code}
                        </div>
                        <div
                          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                          style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.04), transparent)' }}
                        />
                        {hasCountryFlag(code) ? (
                          <img
                            src={flagUrl(code)}
                            alt={getCountryLabel(code)}
                            className="relative w-[72px] h-[46px] object-cover rounded-md shadow-lg"
                          />
                        ) : (
                          <div className="relative w-[72px] h-[46px] rounded-md shadow-lg bg-white/10 border border-white/10 flex items-center justify-center text-sm font-black text-slate-200">
                            {code}
                          </div>
                        )}
                        <span className={`relative text-[10px] text-slate-400 group-hover:text-white transition-colors leading-tight w-full text-center truncate ${MANAGER_HEADING_FONT}`}>
                          {getCountryLabel(code)}
                        </span>
                      </>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* ── ZAKŁADKA REPREZENTACJE ─────────────────────────────────────── */}

            {activeTab === 'nt' && !selectedNT && (
              <div className="p-2">
                {/* Sub-zakładki kontynentów */}
                <div className="flex flex-wrap gap-2 mb-5 justify-center">
                  {CONTINENTS.map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setActiveContinent(key)}
                      className={`px-5 py-2 rounded-xl text-xs transition-all ${MANAGER_BUTTON_FONT} ${
                        activeContinent === key
                          ? 'bg-emerald-500 text-white shadow-[0_0_16px_rgba(16,185,129,0.3)]'
                          : 'bg-white/[0.04] text-slate-400 hover:bg-white/[0.07] border border-white/[0.08]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* Licznik */}
                <div className="text-[11px] text-slate-600 font-semibold uppercase tracking-widest mb-3 px-1">
                  {continentTeams.length} reprezentacji
                </div>

                {/* Lista drużyn */}
                {nationalTeams.length === 0 ? (
                  <div className="text-center py-12 text-slate-600 text-sm">
                    Brak danych — uruchom nową grę
                  </div>
                ) : (
                  continentTeams.map((team, i) => (
                    <NTCard
                      key={team.id}
                      team={team}
                      coachName={getCoachName(team)}
                      onSelect={() => setSelectedNT(team)}
                      showTier={activeContinent === 'RANKING'}
                      rank={activeContinent === 'RANKING' ? i + 1 : undefined}
                    />
                  ))
                )}
              </div>
            )}

            {activeTab === 'nt' && selectedNT && (
              <div className="p-2">
                <NTSquadView
                  team={selectedNT}
                  coachName={getCoachName(selectedNT)}
                  playerById={playerById}
                  clubById={clubById}
                  onPlayerClick={viewPlayerDetails}
                />
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};
