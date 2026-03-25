import React, { useState, useMemo } from 'react';
import ntBgImg from '../../Graphic/themes/national_teams_view.png';
import { useGame } from '../../context/GameContext';
import { ViewState, NationalTeam, Player, PlayerPosition, PlayerAttributes } from '../../types';
import { RAW_CHAMPIONS_LEAGUE_CLUBS, generateEuropeanClubId } from '../../resources/static_db/clubs/ChampionsLeagueTeams';
import { RAW_EUROPA_LEAGUE_CLUBS, generateELClubId } from '../../resources/static_db/clubs/EuropeLeagueTeams';
import { RAW_CONFERENCE_LEAGUE_CLUBS, generateCONFClubId } from '../../resources/static_db/clubs/ConferenceLeagueTeams';
import { RAW_PL_CLUBS, generateClubId } from '../../resources/static_db/clubs/pl_clubs';
import { getClubLogo } from '../../resources/ClubLogoAssets';

const FLAG_COLUMNS = 5;

const GLASS_CARD = "bg-slate-950/20 border border-white/[0.07] shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-[40px] relative overflow-hidden";
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
    <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ backgroundColor: team.colorsHex[0] }} />
    <div className="absolute right-2 top-[-4px] text-4xl font-black italic text-white/[0.03] select-none group-hover:text-white/[0.06] transition-colors leading-none tracking-tighter">
      {team.name.substring(0, 4).toUpperCase()}
    </div>
    <div className="relative h-11 flex items-center pl-5 pr-4 gap-3">
      {rank !== undefined && (
        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/10 border border-white/20 text-[10px] font-black tabular-nums text-white shrink-0">
          {rank}
        </span>
      )}
      <div className="flex shrink-0 rounded-md overflow-hidden w-5 h-5 border border-white/10">
        <div className="flex-1" style={{ backgroundColor: team.colorsHex[0] }} />
        <div className="flex-1" style={{ backgroundColor: team.colorsHex[1] || '#222' }} />
      </div>
      <span className="flex-1 text-sm font-black italic uppercase tracking-wide text-white truncate">
        {team.name}
      </span>
      {showTier && (
        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded shrink-0 ${TIER_BADGE[team.tier] ?? TIER_BADGE[5]}`}>
          Tier {team.tier}
        </span>
      )}
      <span className="text-white/30 group-hover:text-white/70 transition-colors text-sm shrink-0">›</span>
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
          selectedNTId, setSelectedNTId } = useGame();
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [activeContinent, setActiveContinent] = useState<string>('Europe');
  const selectedNT = nationalTeams.find(t => t.id === selectedNTId) ?? null;
  const setSelectedNT = (t: NationalTeam | null) => setSelectedNTId(t?.id ?? null);

  const countries = useMemo(() => {
    return Object.keys(COUNTRY_CLUB_MAP)
      .filter(code => COUNTRY_NAME[code])
      .sort((a, b) => COUNTRY_NAME[a].localeCompare(COUNTRY_NAME[b], 'pl'));
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
      return [...nationalTeams].sort((a, b) =>
        a.tier !== b.tier ? a.tier - b.tier : b.reputation - a.reputation
      );
    }
    return nationalTeams
      .filter(t => t.continent === activeContinent)
      .sort((a, b) => a.name.localeCompare(b.name, 'pl'));
  }, [nationalTeams, activeContinent]);

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
      {/* Background ambient glow */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[30%] w-[60%] h-[60%] rounded-full blur-[180px] opacity-10"
          style={{ background: ambientColor }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[150px] opacity-8"
          style={{ background: '#0ea5e9' }} />
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      <div className={`relative z-10 w-full transition-all duration-300 ${activeTab === 'clubs' && selectedCountry === 'POL' ? 'max-w-[1600px]' : activeTab === 'clubs' && selectedCountry ? 'max-w-2xl' : activeTab === 'clubs' ? 'max-w-[1500px]' : selectedNT ? 'max-w-[80vw]' : 'max-w-3xl'}`}>

        {/* Header */}
        <div className="flex items-center gap-4 mb-5">
          <button
            onClick={handleBack}
            className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-white/10 text-xs font-black uppercase tracking-wider text-slate-400 hover:text-white hover:bg-slate-700/80 transition-colors backdrop-blur-sm"
          >
            ← Wróć
          </button>
          <div>
            {activeTab === 'clubs' && !selectedCountry && (
              <h1 className="text-base font-black uppercase tracking-widest text-white">Reprezentacje i Kluby Europejskie</h1>
            )}
            {activeTab === 'clubs' && selectedCountry && (
              <div className="flex items-center gap-3">
                <img src={flagUrl(selectedCountry)} alt={COUNTRY_NAME[selectedCountry]} className="h-5 shadow-sm rounded-sm" />
                <h1 className="text-base font-black uppercase tracking-widest text-white">{COUNTRY_NAME[selectedCountry]}</h1>
                <span className="text-[10px] text-slate-500">{clubsForCountry.length} klubów</span>
              </div>
            )}
            {activeTab === 'nt' && !selectedNT && (
              <h1 className="text-base font-black uppercase tracking-widest text-white">Reprezentacje Narodowe</h1>
            )}
            {activeTab === 'nt' && selectedNT && (
              <h1 className="text-base font-black uppercase tracking-widest text-white">{selectedNT.name} — Skład</h1>
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
                className={`px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${
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

            {activeTab === 'clubs' && selectedCountry && selectedCountry !== 'POL' && (
              <div>
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

            {activeTab === 'clubs' && !selectedCountry && (
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

            {/* ── ZAKŁADKA REPREZENTACJE ─────────────────────────────────────── */}

            {activeTab === 'nt' && !selectedNT && (
              <div className="p-2">
                {/* Sub-zakładki kontynentów */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {CONTINENTS.map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setActiveContinent(key)}
                      className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
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
                <div className="text-[9px] text-slate-600 font-semibold uppercase tracking-widest mb-2 px-1">
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
