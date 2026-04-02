import React from 'react';
import ntBgImg from '../../Graphic/themes/national_teams_view.png';
import { useGame } from '../../context/GameContext';
import { MatchCardEntry, MatchGoalEntry, NTMatchResult, ViewState } from '../../types';

const GLASS_CARD = 'bg-slate-950/20 border border-white/[0.07] shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-[40px] relative overflow-hidden';
const GLOSS_LAYER = 'absolute inset-0 bg-gradient-to-br from-white/[0.05] via-transparent to-transparent pointer-events-none';
const HEADING_FONT = 'font-black italic uppercase tracking-tighter';
const BTN_FONT = 'font-black italic uppercase tracking-widest';
const PLAYER_NATIONAL_TEAM = 'Polska';

const NT_FLAG_CODE_MAP: Record<string, string> = {
  Albania: 'AL', Andora: 'AD', Armenia: 'AM', Austria: 'AT', Azerbejdżan: 'AZ',
  Belgia: 'BE', Białoruś: 'BY', 'Bośnia i Hercegowina': 'BA', Bułgaria: 'BG', Chorwacja: 'HR',
  Cypr: 'CY', Czarnogóra: 'ME', Czechy: 'CZ', Dania: 'DK', Estonia: 'EE',
  Finlandia: 'FI', Francja: 'FR', Gibraltar: 'GI', Grecja: 'GR', Gruzja: 'GE',
  Hiszpania: 'ES', Holandia: 'NL', Irlandia: 'IE', Islandia: 'IS', Izrael: 'IL',
  Kazachstan: 'KZ', Kosovo: 'XK', Liechtenstein: 'LI', Litwa: 'LT', Luksemburg: 'LU',
  Łotwa: 'LV', 'Macedonia Północna': 'MK', Malta: 'MT', Mołdawia: 'MD', Niemcy: 'DE',
  Norwegia: 'NO', Polska: 'PL', Portugalia: 'PT', Rosja: 'RU', Rumunia: 'RO',
  'San Marino': 'SM', Serbia: 'RS', Słowacja: 'SK', Słowenia: 'SI', Szwajcaria: 'CH',
  Szwecja: 'SE', Turcja: 'TR', Ukraina: 'UA', Węgry: 'HU', Włochy: 'IT', 'Wyspy Owcze': 'FO',
  Algieria: 'DZ', Angola: 'AO', Argentyna: 'AR', Brazylia: 'BR', Chile: 'CL',
  Kolumbia: 'CO', Peru: 'PE', Paragwaj: 'PY', Urugwaj: 'UY', Wenezuela: 'VE',
  Meksyk: 'MX', Kanada: 'CA', 'Stany Zjednoczone': 'US', Japonia: 'JP', Korea: 'KR',
  Australia: 'AU', Maroko: 'MA', Nigeria: 'NG', Senegal: 'SN', Egipt: 'EG',
};

function isPlayerTeam(name: string): boolean {
  return name === PLAYER_NATIONAL_TEAM;
}

function getNTFlagImageCode(teamName: string): string | null {
  if (teamName === 'Anglia') return 'gb-eng';
  if (teamName === 'Szkocja') return 'gb-sct';
  if (teamName === 'Walia') return 'gb-wls';
  return NT_FLAG_CODE_MAP[teamName]?.toLowerCase() ?? null;
}

function formatAttendance(attendance?: number): string | null {
  if (!attendance) return null;
  return `${attendance.toLocaleString('pl-PL')} widzow`;
}

function translateWeatherDescription(description: string): string {
  const map: Record<string, string> = {
    'Clear sky': 'Bezchmurnie',
    'Snow storm': 'Burza sniezna',
    Thunderstorm: 'Burza',
    Snowfall: 'Opady sniegu',
    'Heavy rain': 'Ulewa',
    Sleet: 'Deszcz ze sniegiem',
    'Light rain': 'Lekki deszcz',
    'Strong wind': 'Silny wiatr',
    Heat: 'Upal',
    Frost: 'Mroz',
    Cloudy: 'Pochmurno',
  };
  return map[description] ?? description;
}

function formatWeather(result: NTMatchResult): string | null {
  if (!result.weather) return null;
  return `${translateWeatherDescription(result.weather.description)} ${result.weather.tempC}C`;
}

function formatMeta(result: NTMatchResult): string {
  return ['20:45', result.venue, formatAttendance(result.attendance), formatWeather(result)].filter(Boolean).join(' • ');
}

function teamGoals(result: NTMatchResult, side: 'home' | 'away'): MatchGoalEntry[] {
  const teamId = side === 'home' ? result.homeTeamId : result.awayTeamId;
  if (!teamId || !result.goals) return [];
  return result.goals.filter(goal => goal.teamId === teamId);
}

function teamCards(result: NTMatchResult, side: 'home' | 'away'): MatchCardEntry[] {
  const teamId = side === 'home' ? result.homeTeamId : result.awayTeamId;
  if (!teamId || !result.cards) return [];
  return result.cards.filter(card => card.teamId === teamId);
}

function formatGoal(goal: MatchGoalEntry): string {
  return `${goal.minute}' ${goal.playerName}${goal.isPenalty ? ' (k.)' : ''}`;
}

function cardIcon(card: MatchCardEntry): string {
  return card.type === 'YELLOW' ? '🟨' : '🟥';
}

function formatCard(card: MatchCardEntry): string {
  if (card.type === 'SECOND_YELLOW') {
    return `${card.minute}' ${card.playerName} (2. zolta)`;
  }
  return `${card.minute}' ${card.playerName}`;
}

const NTFlagBadge: React.FC<{ teamName: string; className?: string }> = ({ teamName, className = '' }) => {
  const code = getNTFlagImageCode(teamName);

  if (!code) {
    return (
      <div className={`flex items-center justify-center rounded-md border border-white/10 bg-white/5 text-[10px] font-black text-slate-200 ${className}`}>
        {teamName.slice(0, 2).toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={`https://flagcdn.com/w40/${code}.png`}
      alt={teamName}
      className={`object-cover rounded-md border border-white/10 bg-white/5 ${className}`}
    />
  );
};

interface EventListProps<T> {
  items: T[];
  align: 'left' | 'right';
  renderItem: (item: T) => React.ReactNode;
  getKey: (item: T) => string;
  className?: string;
}

function EventList<T>({ items, align, renderItem, getKey, className = '' }: EventListProps<T>) {
  if (items.length === 0) return <div className="min-h-[20px]" />;

  return (
    <div className={`flex flex-wrap gap-x-3 gap-y-1 ${align === 'right' ? 'justify-end text-right' : 'justify-start text-left'} ${className}`}>
      {items.map(item => (
        <span key={getKey(item)} className="inline-flex items-center gap-1.5">
          {renderItem(item)}
        </span>
      ))}
    </div>
  );
}

interface MatchRowProps {
  result: NTMatchResult;
}

const MatchRow: React.FC<MatchRowProps> = ({ result }) => {
  const isHighlighted = isPlayerTeam(result.home) || isPlayerTeam(result.away);
  const homeGoalsList = teamGoals(result, 'home');
  const awayGoalsList = teamGoals(result, 'away');
  const homeCardsList = teamCards(result, 'home');
  const awayCardsList = teamCards(result, 'away');
  const metaLabel = formatMeta(result);

  const isDraw = result.homeGoals === result.awayGoals;

  const scoreColor = isDraw ? 'text-slate-200' : 'text-white';
  const homeNameColor = isPlayerTeam(result.home) ? 'text-white' : 'text-slate-200';
  const awayNameColor = isPlayerTeam(result.away) ? 'text-white' : 'text-slate-200';

  return (
    <div
      className={`
        px-8 py-4 rounded-2xl mb-3 transition-all
        ${isHighlighted
          ? 'bg-white/[0.08] border border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.05)]'
          : 'bg-white/[0.03] border border-white/[0.05]'
        }
      `}
    >
      <div className="mb-4 flex justify-center">
        <div className="max-w-full rounded-xl border border-white/10 bg-slate-950/85 px-4 py-2 text-center text-[11px] font-bold uppercase tracking-[0.16em] text-white shadow-[0_10px_25px_rgba(0,0,0,0.35)]">
          {metaLabel}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex-1 text-right">
          <span className={`inline-flex items-center justify-end gap-2 ${HEADING_FONT} text-2xl ${homeNameColor}`}>
            <NTFlagBadge teamName={result.home} className="h-6 w-8 shrink-0" />
            <span>{result.home}</span>
          </span>
        </div>

        <div className="flex items-center gap-2 mx-8 min-w-[120px] justify-center">
          <span className={`text-2xl font-black tabular-nums ${scoreColor}`}>{result.homeGoals}</span>
          <span className="text-slate-500 text-xl font-black">:</span>
          <span className={`text-2xl font-black tabular-nums ${scoreColor}`}>{result.awayGoals}</span>
        </div>

        <div className="flex-1 text-left">
          <span className={`inline-flex items-center justify-start gap-2 ${HEADING_FONT} text-2xl ${awayNameColor}`}>
            <span>{result.away}</span>
            <NTFlagBadge teamName={result.away} className="h-6 w-8 shrink-0" />
          </span>
        </div>
      </div>

      {(homeGoalsList.length > 0 || awayGoalsList.length > 0 || homeCardsList.length > 0 || awayCardsList.length > 0) && (
        <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-3">
          {(homeGoalsList.length > 0 || awayGoalsList.length > 0) && (
            <div className="grid grid-cols-2 gap-6">
              <EventList
                items={homeGoalsList}
                align="right"
                className="text-sm text-slate-200"
                getKey={goal => `${goal.playerId}-${goal.minute}-${goal.teamId}`}
                renderItem={goal => (
                  <>
                    <span className="text-[13px] text-emerald-300">⚽</span>
                    <span>{formatGoal(goal)}</span>
                  </>
                )}
              />
              <EventList
                items={awayGoalsList}
                align="left"
                className="text-sm text-slate-200"
                getKey={goal => `${goal.playerId}-${goal.minute}-${goal.teamId}`}
                renderItem={goal => (
                  <>
                    <span className="text-[13px] text-emerald-300">⚽</span>
                    <span>{formatGoal(goal)}</span>
                  </>
                )}
              />
            </div>
          )}

          {(homeCardsList.length > 0 || awayCardsList.length > 0) && (
            <div className="grid grid-cols-2 gap-6">
              <EventList
                items={homeCardsList}
                align="right"
                className="text-xs text-slate-300"
                getKey={card => `${card.playerId}-${card.minute}-${card.type}`}
                renderItem={card => (
                  <>
                    <span>{cardIcon(card)}</span>
                    <span>{formatCard(card)}</span>
                  </>
                )}
              />
              <EventList
                items={awayCardsList}
                align="left"
                className="text-xs text-slate-300"
                getKey={card => `${card.playerId}-${card.minute}-${card.type}`}
                renderItem={card => (
                  <>
                    <span>{cardIcon(card)}</span>
                    <span>{formatCard(card)}</span>
                  </>
                )}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const NationalTeamResultsView: React.FC = () => {
  const { lastNTMatchResults, setLastNTMatchResults, advanceDay, currentDate, navigateTo } = useGame();

  const competitionLabel = lastNTMatchResults?.[0]?.competitionLabel ?? 'Mecze Reprezentacji';
  const dateLabel = currentDate.toLocaleDateString('pl-PL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const handleContinue = () => {
    setLastNTMatchResults(null);
    advanceDay();
    navigateTo(ViewState.DASHBOARD);
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center relative"
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url(${ntBgImg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          filter: 'brightness(0.38)',
        }}
      />
      <div className="absolute inset-0 bg-black/82 pointer-events-none" />
      <div className="absolute inset-0 bg-slate-950/65 pointer-events-none" />

      <div className={`${GLASS_CARD} relative z-10 w-full max-w-[1100px] mx-4 p-8`}>
        <div className={GLOSS_LAYER} />

        <div className="text-center mb-2">
          <p className="text-xs text-slate-400 tracking-[0.2em] uppercase mb-1">{dateLabel}</p>
          <h1 className={`${HEADING_FONT} text-white text-2xl mb-1`}>Wyniki Reprezentacji</h1>
          <p className="text-sm text-slate-300 tracking-widest uppercase font-semibold">{competitionLabel}</p>
        </div>

        <div className="h-px bg-white/10 my-6" />

        <div className="mb-6">
          {lastNTMatchResults && lastNTMatchResults.length > 0 ? (
            lastNTMatchResults.map((result, index) => <MatchRow key={index} result={result} />)
          ) : (
            <p className="text-slate-500 text-center text-sm py-4">Brak meczow w tym dniu</p>
          )}
        </div>

        <button
          onClick={handleContinue}
          className={`
            ${BTN_FONT}
            w-full py-4 rounded-2xl text-sm tracking-widest
            bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700
            text-white shadow-[0_4px_20px_rgba(16,185,129,0.3)]
            transition-all duration-200
          `}
        >
          Kontynuuj
        </button>
      </div>
    </div>
  );
};

export default NationalTeamResultsView;
