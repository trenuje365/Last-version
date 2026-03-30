import { Club, Player, PlayerPosition, Tactic, HealthStatus } from '../types';
import { TacticRepository } from '../resources/tactics_db';
import { LineupService } from './LineupService';
import { FinanceService } from './FinanceService';

const RECENT_FORM_SAMPLE = 5;
const TACTIC_INJURY_LIMIT_DAYS = 10;
const MIN_TACTIC_CONDITION = 60;

const POSITION_LABELS: Record<PlayerPosition, string> = {
  [PlayerPosition.GK]: 'bramce',
  [PlayerPosition.DEF]: 'obronie',
  [PlayerPosition.MID]: 'pomocy',
  [PlayerPosition.FWD]: 'ataku',
};

const POSITION_SHORT_LABELS: Record<PlayerPosition, string> = {
  [PlayerPosition.GK]: 'GK',
  [PlayerPosition.DEF]: 'DEF',
  [PlayerPosition.MID]: 'MID',
  [PlayerPosition.FWD]: 'FWD',
};

const POSITION_NAME_LABELS: Record<PlayerPosition, string> = {
  [PlayerPosition.GK]: 'bramkarz',
  [PlayerPosition.DEF]: 'obrońca',
  [PlayerPosition.MID]: 'pomocnik',
  [PlayerPosition.FWD]: 'napastnik',
};

type SquadSentenceStyle = {
  id: string;
  name: string;
  role: string;
};

const COMMENTARY_STYLES: SquadSentenceStyle[] = [
  ['style_01', 'Analityk', 'ocena ogólna'],
  ['style_02', 'Stary Trener', 'hierarchia i dyscyplina'],
  ['style_03', 'Skaut Boiskowy', 'potencjał zawodników'],
  ['style_04', 'Ekspert TV', 'obraz zespołu'],
  ['style_05', 'Dyrektor Sportowy', 'decyzje kadrowe'],
  ['style_06', 'Taktyk', 'ustawienie zespołu'],
  ['style_07', 'Asystent Trenera', 'bieżąca forma'],
  ['style_08', 'Komentator', 'mocne i słabe strony'],
  ['style_09', 'Analityk Danych', 'liczby meczowe'],
  ['style_10', 'Pragmatyk', 'użyteczność składu'],
  ['style_11', 'Obserwator Klubu', 'stan kadry'],
  ['style_12', 'Psycholog', 'pewność i rola'],
  ['style_13', 'Łowca Talentów', 'rozwój młodych'],
  ['style_14', 'Trener Defensywy', 'gra w tyłach'],
  ['style_15', 'Trener Pressingu', 'intensywność gry'],
  ['style_16', 'Trener Ofensywy', 'atak i szerokość'],
  ['style_17', 'Trener Kontrataku', 'szybkie przejścia'],
  ['style_18', 'Minimalista', 'proste wnioski'],
  ['style_19', 'Doradca Zarządu', 'sport i kontrakty'],
  ['style_20', 'Oldschoolowiec', 'solidność zespołu'],
  ['style_21', 'Nowoczesny Taktyk', 'elastyczność'],
  ['style_22', 'Głos Trybun', 'czytelność kadry'],
  ['style_23', 'Analityk Video', 'powtarzalne schematy'],
  ['style_24', 'Menedżer Kryzysowy', 'główne ryzyka'],
  ['style_25', 'Ligowy Rzemieślnik', 'regularność'],
  ['style_26', 'Mentor', 'prowadzenie zawodników'],
  ['style_27', 'Inspektor Kontraktów', 'timing decyzji'],
  ['style_28', 'Strateg Pucharowy', 'mecze pod presją'],
  ['style_29', 'Architekt Środka', 'środek pola'],
  ['style_30', 'Łowca Przewag', 'maksymalizacja atutów'],
].map(([id, name, role]) => ({
  id, name, role,
}));

export interface TeamAnalysisInsightPlayer {
  player: Player;
  score: number;
  label: string;
  reasons: string[];
  availabilityNote: string;
}

export interface TeamAnalysisExitCandidate {
  player: Player;
  probability: number;
  actionLabel: string;
  reasons: string[];
  squadNote: string;
}

export interface TeamAnalysisContractCase {
  player: Player;
  urgency: number;
  actionLabel: string;
  reasons: string[];
  contractNote: string;
}

export interface TeamAnalysisAnalystNote {
  id: string;
  player: Player;
  actionLabel: string;
  title: string;
  explanation: string;
}

export interface TeamAnalysisTalent {
  player: Player;
  score: number;
  developmentPath: string;
  reasons: string[];
  warning: string;
}

export interface TeamAnalysisTacticOption {
  tacticId: string;
  tacticName: string;
  score: number;
  healthyPoolUsed: number;
  missingSlots: number;
  lineStrength: Record<PlayerPosition, number>;
  reasons: string[];
  projectedXI: Array<{
    slotIndex: number;
    role: PlayerPosition;
    player: Player | null;
    score: number;
  }>;
}

export interface TeamAnalysisCommentary {
  styleId: string;
  styleName: string;
  styleRole: string;
  paragraphs: string[];
}

export interface TeamAnalysisReport {
  generatedAt: string;
  injuryRule: string;
  squadAverageOverall: number;
  availableCounts: Record<PlayerPosition, number>;
  keyPlayers: TeamAnalysisInsightPlayer[];
  exitCandidates: TeamAnalysisExitCandidate[];
  contractCases: TeamAnalysisContractCase[];
  analystNotes: TeamAnalysisAnalystNote[];
  talents: TeamAnalysisTalent[];
  tacticalRecommendation: TeamAnalysisTacticOption;
  alternativeTactics: TeamAnalysisTacticOption[];
  commentary: TeamAnalysisCommentary;
}

type Placement = TeamAnalysisTacticOption['projectedXI'][number];

const hashString = (value: string): number => {
  let hash = 0;
  for (let i = 0; i < value.length; i++) hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0;
  return Math.abs(hash);
};

const seededUnit = (seed: string): number => {
  const x = Math.sin(hashString(seed) + 1) * 10000;
  return x - Math.floor(x);
};

const seededRange = (seed: string, min: number, max: number): number => min + seededUnit(seed) * (max - min);
const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));
const average = (values: number[]): number => values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
const formatPlayerName = (player: Player): string => `${player.firstName} ${player.lastName}`;

const formatContractLabel = (daysLeft: number): string => {
  if (daysLeft <= 30) return 'Temu zawodnikowi zaraz kończy się umowa.';
  if (daysLeft <= 120) return 'Temu zawodnikowi niedługo kończy się umowa.';
  if (daysLeft <= 365) return 'Temu zawodnikowi kończy się umowa w tym sezonie.';
  return 'Obecnie nie ma problemu z jego kontraktem.';
};

const getRecentAverageRating = (player: Player): number | null => {
  const recent = player.stats.ratingHistory?.slice(-RECENT_FORM_SAMPLE) ?? [];
  return recent.length > 0 ? average(recent) : null;
};

const getFormScore = (player: Player): number => {
  const avgRating = getRecentAverageRating(player);
  if (avgRating !== null) return (avgRating - 6.5) * 10;

  const gp = Math.max(1, player.stats.matchesPlayed);
  const rawContribution = player.position === PlayerPosition.FWD
    ? player.stats.goals / gp
    : player.position === PlayerPosition.MID
      ? (player.stats.goals + player.stats.assists) / gp
      : player.stats.cleanSheets / gp;

  return (player.overallRating - 68) * 0.7 + rawContribution * 10;
};

const getContributionScore = (player: Player): number => {
  const gp = Math.max(1, player.stats.matchesPlayed);
  switch (player.position) {
    case PlayerPosition.GK:
      return (player.stats.cleanSheets / gp) * 16;
    case PlayerPosition.DEF:
      return (player.stats.cleanSheets / gp) * 12 + (player.stats.assists / gp) * 6;
    case PlayerPosition.MID:
      return ((player.stats.goals + player.stats.assists) / gp) * 16;
    case PlayerPosition.FWD:
      return (player.stats.goals / gp) * 20 + (player.stats.assists / gp) * 7;
    default:
      return 0;
  }
};

const getInjuryDays = (player: Player): number =>
  player.health.status === HealthStatus.INJURED ? (player.health.injury?.daysRemaining ?? 0) : 0;

const canBeUsedForTactic = (player: Player): boolean => {
  if ((player.suspensionMatches || 0) > 0) return false;
  if (player.condition < MIN_TACTIC_CONDITION) return false;
  return getInjuryDays(player) <= TACTIC_INJURY_LIMIT_DAYS;
};

const getContractDaysLeft = (player: Player, currentDate: Date): number =>
  Math.floor((new Date(player.contractEndDate).getTime() - currentDate.getTime()) / 86_400_000);

const buildAvailabilityNote = (player: Player): string => {
  if ((player.suspensionMatches || 0) > 0) return `zawieszony na ${player.suspensionMatches} mecz(e)`;

  const injuryDays = getInjuryDays(player);
  if (injuryDays > 0) {
    return injuryDays > TACTIC_INJURY_LIMIT_DAYS
      ? `długo niedostępny (${injuryDays} dni)`
      : `uraz do opanowania (${injuryDays} dni)`;
  }

  if (player.condition < MIN_TACTIC_CONDITION) {
    return `przemęczony (${Math.round(player.condition)}% kondycji)`;
  }

  return 'gotowy do regularnej gry';
};

const getSlotScore = (player: Player, role: PlayerPosition): number => {
  const fitScore = LineupService.calculateFitScore(player, role) / 4;
  const formScore = getFormScore(player);
  const contribution = getContributionScore(player);
  const conditionBonus = (player.condition - 70) * 0.28;
  const injuryPenalty = getInjuryDays(player) * 0.9;
  const sameRoleBonus = player.position === role ? 9 : -12;
  const talentBonus = Math.max(0, player.attributes.talent - 68) * 0.12;

  return player.overallRating * 0.82 + fitScore * 0.55 + formScore + contribution + conditionBonus + sameRoleBonus + talentBonus - injuryPenalty;
};

const pickProjectedLineup = (players: Player[], tactic: Tactic): Placement[] => {
  const eligiblePlayers = players.filter(canBeUsedForTactic);
  const usedIds = new Set<string>();

  return tactic.slots.map(slot => {
    const candidate = [...eligiblePlayers]
      .filter(player => !usedIds.has(player.id))
      .sort((a, b) => getSlotScore(b, slot.role) - getSlotScore(a, slot.role))[0] ?? null;

    if (candidate) usedIds.add(candidate.id);

    return {
      slotIndex: slot.index,
      role: slot.role,
      player: candidate,
      score: candidate ? getSlotScore(candidate, slot.role) : -45,
    };
  });
};

const getLineStrengthFromPlacement = (placement: Placement[]): Record<PlayerPosition, number> => {
  const result: Record<PlayerPosition, number> = {
    [PlayerPosition.GK]: 0,
    [PlayerPosition.DEF]: 0,
    [PlayerPosition.MID]: 0,
    [PlayerPosition.FWD]: 0,
  };

  (Object.keys(result) as PlayerPosition[]).forEach(position => {
    const lineScores = placement.filter(entry => entry.role === position && entry.player).map(entry => entry.score);
    result[position] = lineScores.length > 0 ? Math.round(average(lineScores)) : 0;
  });

  return result;
};

const buildTacticReasons = (
  tactic: Tactic,
  placement: Placement[],
  availableCounts: Record<PlayerPosition, number>
): string[] => {
  const tacticDemand = tactic.slots.reduce<Record<PlayerPosition, number>>((acc, slot) => {
    acc[slot.role] += 1;
    return acc;
  }, {
    [PlayerPosition.GK]: 0,
    [PlayerPosition.DEF]: 0,
    [PlayerPosition.MID]: 0,
    [PlayerPosition.FWD]: 0,
  });

  const shortages = (Object.keys(tacticDemand) as PlayerPosition[])
    .map(position => ({ position, diff: availableCounts[position] - tacticDemand[position] }))
    .sort((a, b) => b.diff - a.diff);

  const strongestFit = shortages[0];
  const secondFit = shortages[1];
  const missingSlots = placement.filter(entry => !entry.player).length;

  return [
    `Układ ${tactic.name} najlepiej pasuje do liczby dostępnych graczy w ${POSITION_LABELS[strongestFit.position]}.`,
    `W tym ustawieniu łatwiej wykorzystać zawodników z ${POSITION_LABELS[secondFit.position]}.`,
    missingSlots === 0
      ? 'Da się wystawić pełną jedenastkę bez przesuwania zawodników na siłę.'
      : `W tym ustawieniu nadal brakuje obsady na ${missingSlots} pozycji.`,
  ];
};

const analyzeTactics = (players: Player[]): {
  best: TeamAnalysisTacticOption;
  alternatives: TeamAnalysisTacticOption[];
  availableCounts: Record<PlayerPosition, number>;
} => {
  const eligiblePlayers = players.filter(canBeUsedForTactic);
  const availableCounts = eligiblePlayers.reduce<Record<PlayerPosition, number>>((acc, player) => {
    acc[player.position] += 1;
    return acc;
  }, {
    [PlayerPosition.GK]: 0,
    [PlayerPosition.DEF]: 0,
    [PlayerPosition.MID]: 0,
    [PlayerPosition.FWD]: 0,
  });

  const scoredTactics = TacticRepository.getAll().map(tactic => {
    const projectedXI = pickProjectedLineup(players, tactic);
    const missingSlots = projectedXI.filter(entry => !entry.player).length;
    const lineStrength = getLineStrengthFromPlacement(projectedXI);
    const healthyPoolUsed = projectedXI.filter(entry => !!entry.player).length;
    const rawScore = projectedXI.reduce((sum, entry) => sum + entry.score, 0);
    const score = Math.round(rawScore + healthyPoolUsed * 2.5 - missingSlots * 42);

    return {
      tacticId: tactic.id,
      tacticName: tactic.name,
      score,
      healthyPoolUsed,
      missingSlots,
      lineStrength,
      reasons: buildTacticReasons(tactic, projectedXI, availableCounts),
      projectedXI,
    } satisfies TeamAnalysisTacticOption;
  }).sort((a, b) => b.score - a.score);

  return { best: scoredTactics[0], alternatives: scoredTactics.slice(1, 4), availableCounts };
};

const analyzeKeyPlayers = (players: Player[]): TeamAnalysisInsightPlayer[] => {
  const byPosition = players.reduce<Record<PlayerPosition, Player[]>>((acc, player) => {
    acc[player.position].push(player);
    return acc;
  }, {
    [PlayerPosition.GK]: [],
    [PlayerPosition.DEF]: [],
    [PlayerPosition.MID]: [],
    [PlayerPosition.FWD]: [],
  });

  return [...players]
    .sort((a, b) => {
      const scoreA = a.overallRating * 0.74 + getFormScore(a) + getContributionScore(a) + a.attributes.leadership * 0.14 - getInjuryDays(a) * 0.35;
      const scoreB = b.overallRating * 0.74 + getFormScore(b) + getContributionScore(b) + b.attributes.leadership * 0.14 - getInjuryDays(b) * 0.35;
      return scoreB - scoreA;
    })
    .slice(0, 5)
    .map(player => {
      const peers = [...byPosition[player.position]].sort((a, b) => b.overallRating - a.overallRating);
      const rankInPosition = peers.findIndex(candidate => candidate.id === player.id) + 1;
      const formAverage = getRecentAverageRating(player);

      return {
        player,
        score: Math.round(player.overallRating * 0.74 + getFormScore(player) + getContributionScore(player)),
        label: rankInPosition === 1 ? 'Filar drużyny' : rankInPosition === 2 ? 'Mocne ogniwo' : 'Ważny element',
        reasons: [
          rankInPosition === 1
            ? `To obecnie najlepszy ${POSITION_NAME_LABELS[player.position]} w klubie.`
            : `Jest w ścisłej czołówce klubowej na pozycji ${POSITION_SHORT_LABELS[player.position]}.`,
          formAverage !== null && formAverage >= 7
            ? `Trzyma wysoką formę meczową na poziomie ${formAverage.toFixed(1)}.`
            : 'Daje stabilny wkład nawet bez idealnej serii ocen.',
          getContributionScore(player) >= 8
            ? 'Statystyki meczowe realnie podnoszą jego wpływ na wynik zespołu.'
            : 'Jest ważny głównie przez jakość gry i swoją rolę w zespole.',
        ],
        availabilityNote: buildAvailabilityNote(player),
      };
    });
};

const analyzeExitCandidates = (
  players: Player[],
  club: Club,
  tacticalRecommendation: TeamAnalysisTacticOption,
  squadAverageOverall: number
): TeamAnalysisExitCandidate[] => {
  const positionGroups = players.reduce<Record<PlayerPosition, Player[]>>((acc, player) => {
    acc[player.position].push(player);
    return acc;
  }, {
    [PlayerPosition.GK]: [],
    [PlayerPosition.DEF]: [],
    [PlayerPosition.MID]: [],
    [PlayerPosition.FWD]: [],
  });

  (Object.keys(positionGroups) as PlayerPosition[]).forEach(position => {
    positionGroups[position].sort((a, b) => {
      const scoreA = a.overallRating + getFormScore(a) * 0.15;
      const scoreB = b.overallRating + getFormScore(b) * 0.15;
      return scoreB - scoreA;
    });
  });

  const requiredByBestTactic = tacticalRecommendation.projectedXI.reduce<Record<PlayerPosition, number>>((acc, slot) => {
    acc[slot.role] += 1;
    return acc;
  }, {
    [PlayerPosition.GK]: 0,
    [PlayerPosition.DEF]: 0,
    [PlayerPosition.MID]: 0,
    [PlayerPosition.FWD]: 0,
  });

  return players
    .filter(player => !player.isUntouchable)
    .map(player => {
      const positionRank = positionGroups[player.position].findIndex(candidate => candidate.id === player.id) + 1;
      const formAverage = getRecentAverageRating(player);
      const gp = Math.max(1, player.stats.matchesPlayed);
      const fairSalary = FinanceService.getFairMarketSalary(player.overallRating);
      const salaryPressure = player.annualSalary > 0
        ? ((player.annualSalary - fairSalary) / Math.max(1, fairSalary)) * 25
        : 0;

      const isLikelySurplus = positionRank > Math.max(2, requiredByBestTactic[player.position] + 1);
      const weakFormPenalty = formAverage !== null ? clamp((6.25 - formAverage) * 18, 0, 20) : 4;
      const weakOutputPenalty = player.position === PlayerPosition.FWD
        ? clamp((0.16 - (player.stats.goals / gp)) * 70, 0, 18)
        : player.position === PlayerPosition.MID
          ? clamp((0.20 - ((player.stats.goals + player.stats.assists) / gp)) * 65, 0, 18)
          : 0;
      const hasDevelopmentUpside = player.age <= 23 && player.attributes.talent >= player.overallRating + 4;
      const probability = Math.round(clamp(
        18 +
        weakFormPenalty +
        weakOutputPenalty +
        (isLikelySurplus ? 18 : 0) +
        (player.age >= 29 && player.attributes.talent <= 62 ? 10 : 0) +
        (getInjuryDays(player) > 20 ? 8 : 0) +
        (player.overallRating < squadAverageOverall - 5 ? 10 : 0) +
        salaryPressure +
        seededRange(`${club.id}_${player.id}_exit`, -7, 7),
        8,
        94
      ));

      const reasons: string[] = [];
      if (isLikelySurplus) reasons.push(`Jest dopiero numerem ${positionRank} na swojej pozycji.`);
      if (formAverage !== null && formAverage < 6.2) reasons.push(`Forma z ostatnich meczów spadła do ${formAverage.toFixed(1)}.`);
      if (weakOutputPenalty >= 8) reasons.push('Liczby meczowe są poniżej oczekiwań dla tej roli.');
      if (salaryPressure >= 8) reasons.push('Pensja jest wysoka w porównaniu z obecnym wkładem w grę.');
      if (reasons.length === 0) reasons.push('To zawodnik na granicy składu i trzeba podjąć wobec niego decyzję.');

      let actionLabel = 'Zostaw jako rezerwowego';
      let squadNote = 'Na dziś wygląda na słabszego od podstawowych zawodników.';

      if (hasDevelopmentUpside && player.stats.minutesPlayed < 900) {
        actionLabel = 'Daj trening indywidualny';
        squadNote = 'Ma jeszcze potencjał, więc lepiej go rozwijać niż od razu skreślać.';
      } else if (hasDevelopmentUpside && player.age <= 21) {
        actionLabel = 'Wypożycz';
        squadNote = 'Potrzebuje regularnej gry poza pierwszym składem.';
      } else if (probability >= 76) {
        actionLabel = 'Wystawmy go na listę transferową';
        squadNote = 'Uważam, że jest słabszy od innych i nie daje dziś wystarczająco dużo zespołowi.';
      } else if (probability >= 62) {
        actionLabel = 'Spróbuj sprzedać';
        squadNote = 'Jeśli pojawi się oferta, można spokojnie rozważyć sprzedaż.';
      }

      return {
        player,
        probability,
        actionLabel,
        reasons,
        squadNote,
      };
    })
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 5);
};

const analyzeContractCases = (
  players: Player[],
  currentDate: Date,
  squadAverageOverall: number
): TeamAnalysisContractCase[] => {
  return players
    .map(player => {
      const daysLeft = getContractDaysLeft(player, currentDate);
      const interestedCount = player.interestedClubs?.length || 0;
      const isImportantPlayer = player.overallRating >= squadAverageOverall + 3;
      const isTooGoodForClub = player.overallRating >= squadAverageOverall + 6;

      if (daysLeft > 540 && interestedCount === 0) return null;

      const urgency = Math.round(clamp(
        (daysLeft <= 90 ? 48 : daysLeft <= 180 ? 34 : daysLeft <= 365 ? 22 : 10) +
        (isImportantPlayer ? 16 : 0) +
        (isTooGoodForClub ? 12 : 0) +
        interestedCount * 8,
        10,
        95
      ));

      let actionLabel = 'Obecnie nie ma problemu z kontraktem';
      if (daysLeft <= 180 && isImportantPlayer) {
        actionLabel = 'Daj mu nowy kontrakt';
      } else if (daysLeft <= 365 && isTooGoodForClub) {
        actionLabel = 'Daj mu nowy kontrakt albo go sprzedaj';
      } else if (daysLeft <= 180) {
        actionLabel = 'Trzeba podjąć decyzję';
      } else if (interestedCount > 0) {
        actionLabel = 'Jeśli nie damy mu nowego kontraktu, może odejść';
      }

      const reasons: string[] = [];
      if (daysLeft <= 90) reasons.push('Temu zawodnikowi bardzo szybko kończy się umowa.');
      else if (daysLeft <= 180) reasons.push('Temu zawodnikowi niedługo kończy się umowa.');
      else if (daysLeft <= 365) reasons.push('Temu zawodnikowi kończy się umowa w tym sezonie.');

      if (isImportantPlayer) reasons.push('To ważny zawodnik dla obecnego składu.');
      if (isTooGoodForClub) reasons.push('To bardzo dobry zawodnik jak na obecny poziom drużyny.');
      if (interestedCount > 0) reasons.push(`Interesuje się nim już ${interestedCount} klub(y).`);

      return {
        player,
        urgency,
        actionLabel,
        reasons,
        contractNote: formatContractLabel(daysLeft),
      } satisfies TeamAnalysisContractCase;
    })
    .filter(Boolean)
    .sort((a, b) => (b as TeamAnalysisContractCase).urgency - (a as TeamAnalysisContractCase).urgency)
    .slice(0, 5) as TeamAnalysisContractCase[];
};

const analyzeTalents = (players: Player[], currentDate: Date, squadAverageOverall: number): TeamAnalysisTalent[] => {
  return players
    .filter(player => player.age <= 23 && (player.attributes.talent >= 68 || player.attributes.talent - player.overallRating >= 5))
    .map(player => {
      const formAverage = getRecentAverageRating(player);
      const minutesFactor = clamp(player.stats.minutesPlayed / 900, 0, 1.4);
      const upside = Math.max(0, player.attributes.talent - player.overallRating);
      const contractDays = getContractDaysLeft(player, currentDate);
      const score = Math.round(
        player.attributes.talent * 0.7 +
        upside * 2.2 +
        (23 - player.age) * 4 +
        (formAverage ?? 6.4) * 3 +
        minutesFactor * 8
      );

      let developmentPath = 'Dawać regularne minuty z ławki i chronić obciążenia.';
      if (player.age <= 19 && player.stats.minutesPlayed < 500) {
        developmentPath = 'Wprowadzać etapami: końcówki, puchary i spokojny plan treningowy.';
      } else if (player.overallRating >= squadAverageOverall - 3) {
        developmentPath = 'Jest gotowy do regularnej rotacji z pierwszym składem.';
      } else if (player.age <= 21 && player.stats.minutesPlayed < 700) {
        developmentPath = 'Rozważyć wypożyczenie, jeśli w klubie nie dostanie regularnych minut.';
      }

      return {
        player,
        score,
        developmentPath,
        reasons: [
          `Talent ${player.attributes.talent} jest wyraźnie wyższy niż obecny poziom ${player.overallRating} OVR.`,
          formAverage !== null
            ? `Ostatnie oceny (${formAverage.toFixed(1)}) są dobrym sygnałem na dziś.`
            : 'Ma jeszcze mało ocen meczowych, więc trzeba go dalej obserwować.',
          player.stats.minutesPlayed >= 900
            ? 'Już gra regularnie, więc można dalej spokojnie dawać mu minuty.'
            : 'Potrzebuje planu minut, żeby nie stać w miejscu.',
        ],
        warning: contractDays <= 540
          ? 'Jeśli nie damy mu nowego kontraktu, może odejść.'
          : player.condition < 65
            ? 'Nie warto go teraz przeciążać, bo kondycja może zahamować rozwój.'
            : 'Największy problem to zbyt mała liczba minut.',
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
};

const joinNames = (players: Player[]): string => {
  const names = players.map(player => player.lastName);
  if (names.length === 0) return 'brakuje wyraźnych nazwisk';
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} i ${names[1]}`;
  return `${names[0]}, ${names[1]} i ${names[2]}`;
};

const strongestPosition = (counts: Record<PlayerPosition, number>): PlayerPosition =>
  (Object.keys(counts) as PlayerPosition[]).sort((a, b) => counts[b] - counts[a])[0];

const weakestPosition = (counts: Record<PlayerPosition, number>): PlayerPosition =>
  (Object.keys(counts) as PlayerPosition[]).sort((a, b) => counts[a] - counts[b])[0];

const pickVariant = (seed: string, variants: string[]): string =>
  variants[hashString(seed) % variants.length];

const buildAnalystNotes = (
  report: Omit<TeamAnalysisReport, 'commentary' | 'analystNotes'>
): TeamAnalysisAnalystNote[] => {
  const notes: TeamAnalysisAnalystNote[] = [];
  const usedIds = new Set<string>();

  const pushNote = (note: TeamAnalysisAnalystNote | null) => {
    if (!note || usedIds.has(note.player.id)) return;
    usedIds.add(note.player.id);
    notes.push(note);
  };

  const topContract = report.contractCases[0];
  if (topContract) {
    let title = `${topContract.player.lastName} - kontrakt`;
    let explanation = `Obecnie nie ma problemu z kontraktem ${topContract.player.lastName}.`;

    if (topContract.actionLabel === 'Daj mu nowy kontrakt') {
      title = `${topContract.player.lastName} - daj mu lepszy kontrakt`;
      explanation = `Z tym zawodnikiem trzeba szybko usiąść do rozmów. To ważny gracz dla składu i nie warto czekać do końca umowy.`;
    } else if (topContract.actionLabel === 'Daj mu nowy kontrakt albo go sprzedaj') {
      title = `${topContract.player.lastName} - podejmij decyzję teraz`;
      explanation = `Temu zawodnikowi kończy się umowa, więc trzeba podjąć decyzję. Jeśli nie damy mu nowego kontraktu, lepiej sprzedać go teraz.`;
    } else if (topContract.actionLabel === 'Trzeba podjąć decyzję') {
      title = `${topContract.player.lastName} - kontrakt się kończy`;
      explanation = `Temu zawodnikowi kończy się umowa, więc trzeba podjąć decyzję. Nie ma sensu zostawiać tego na później.`;
    } else if (topContract.actionLabel === 'Jeśli nie damy mu nowego kontraktu, może odejść') {
      title = `${topContract.player.lastName} - może odejść`;
      explanation = `Jeśli nie damy temu zawodnikowi nowego kontraktu, może odejść. Trzeba mieć to z tyłu głowy.`;
    }

    pushNote({
      id: `contract_${topContract.player.id}`,
      player: topContract.player,
      actionLabel: topContract.actionLabel,
      title,
      explanation,
    });
  }

  const topExit = report.exitCandidates[0];
  if (topExit) {
    let title = `${topExit.player.lastName} - decyzja sportowa`;
    let explanation = `Uważam, że ${topExit.player.lastName} jest dziś słabszy od innych na swojej pozycji. Trzeba podjąć wobec niego prostą decyzję sportową.`;

    if (topExit.actionLabel === 'Wystaw na listę transferową') {
      title = `${topExit.player.lastName} - wystaw na listę transferową`;
      explanation = `Uważam, że ${topExit.player.lastName} jest słabszy od innych na swojej pozycji i nie daje dziś tyle, ile potrzebujemy. Dlatego wystawiłbym go na listę transferową.`;
    } else if (topExit.actionLabel === 'Spróbuj sprzedać') {
      title = `${topExit.player.lastName} - można go sprzedać`;
      explanation = `Myślę, że ${topExit.player.lastName} nie daje dziś przewagi nad innymi i jeśli pojawi się dobra oferta, można go sprzedać bez dużej straty dla składu.`;
    } else if (topExit.actionLabel === 'Daj trening indywidualny') {
      title = `${topExit.player.lastName} - daj mu trening indywidualny`;
      explanation = `Uważam, że ${topExit.player.lastName} nie jest dziś gotowy na dużą rolę, ale ma jeszcze coś do wyciągnięcia. Dałbym mu trening indywidualny i obserwował, czy pójdzie do góry.`;
    } else if (topExit.actionLabel === 'Wypożycz') {
      title = `${topExit.player.lastName} - wypożycz go`;
      explanation = `Myślę, że ${topExit.player.lastName} potrzebuje regularnej gry. U nas może jej nie dostać, więc wypożyczenie byłoby teraz najlepszym ruchem.`;
    } else if (topExit.actionLabel === 'Zostaw jako rezerwowego') {
      title = `${topExit.player.lastName} - zostaw go jako rezerwowego`;
      explanation = `Na dziś nie widzę ${topExit.player.lastName} w pierwszym składzie, ale może jeszcze dać coś z ławki. Zostawiłbym go w kadrze, ale bez większej roli.`;
    }

    pushNote({
      id: `exit_${topExit.player.id}`,
      player: topExit.player,
      actionLabel: topExit.actionLabel,
      title,
      explanation,
    });
  }

  const topTalent = report.talents[0];
  if (topTalent) {
    let explanation = `Uważam, że ${topTalent.player.lastName} warto prowadzić spokojnie i regularnie dawać mu minuty, bo może nam jeszcze mocno pójść do góry.`;

    if (topTalent.developmentPath.includes('wypożyczenie')) {
      explanation = `Myślę, że ${topTalent.player.lastName} potrzebuje regularnych minut. Jeśli nie damy mu ich u nas, najlepiej będzie go wypożyczyć.`;
    } else if (topTalent.developmentPath.includes('rotacji')) {
      explanation = `Uważam, że ${topTalent.player.lastName} jest już blisko pierwszego składu. Dawałbym mu regularne wejścia i część meczów od początku.`;
    } else if (topTalent.developmentPath.includes('Wprowadzać etapami')) {
      explanation = `Myślę, że ${topTalent.player.lastName} trzeba wprowadzać spokojnie. Końcówki meczów i puchary będą dla niego teraz najlepsze.`;
    }

    pushNote({
      id: `talent_${topTalent.player.id}`,
      player: topTalent.player,
      actionLabel: topTalent.developmentPath,
      title: `${topTalent.player.lastName} - plan rozwoju`,
      explanation,
    });
  }

  const topLeader = report.keyPlayers[0];
  if (topLeader) {
    pushNote({
      id: `leader_${topLeader.player.id}`,
      player: topLeader.player,
      actionLabel: topLeader.label,
      title: `${topLeader.player.lastName} - oprzyj na nim zespół`,
      explanation: `Uważam, że ${topLeader.player.lastName} powinien być jednym z głównych punktów tej drużyny. To zawodnik, na którym warto oprzeć skład i dać mu ważną rolę.`,
    });
  }

  return notes.slice(0, 4);
};

const buildCommentary = (
  club: Club,
  report: Omit<TeamAnalysisReport, 'commentary' | 'analystNotes'>,
  currentDate: Date
): TeamAnalysisCommentary => {
  const style = COMMENTARY_STYLES[hashString(`${club.id}_${currentDate.toISOString().slice(0, 10)}`) % COMMENTARY_STYLES.length];
  const keyNames = joinNames(report.keyPlayers.slice(0, 3).map(entry => entry.player));
  const exitName = report.exitCandidates[0]?.player.lastName ?? 'nikt';
  const talentName = report.talents[0]?.player.lastName ?? 'brak wybijającego się talentu';
  const contractName = report.contractCases[0]?.player.lastName ?? 'nikt';
  const bestTactic = report.tacticalRecommendation.tacticName;
  const altTactic = report.alternativeTactics[0]?.tacticName ?? report.tacticalRecommendation.tacticName;
  const bestPosition = strongestPosition(report.availableCounts);
  const weakestPos = weakestPosition(report.availableCounts);
  const averageOverall = report.squadAverageOverall.toFixed(1);
  const topExit = report.exitCandidates[0];
  const topTalent = report.talents[0];
  const opening = pickVariant(`${club.id}_${style.id}_opening`, [
    'Trenerze, skład nie jest zły, ale są 2-3 problemy, które trzeba ogarnąć teraz.',
    'Trenerze, ta kadra daje radę, ale nie na każdej pozycji wygląda dobrze.',
    'Ta drużyna jest wystarczająco silna, żeby wygrywać mecze, ale ma kilka słabych pozycji, które obniżają jej poziom.',
    'Widzę w tej drużynie kilka mocnych punktów, ale są też pozycje, które ciągną zespół w dół.',
  ]);

  const keyPlayersLine = pickVariant(`${club.id}_${style.id}_leaders`, [
    `Najlepiej wygląda dziś ${POSITION_LABELS[bestPosition]}, a najsłabiej ${POSITION_LABELS[weakestPos]}. Najważniejsi zawodnicy w tej kadrze to ${keyNames}.`,
    `Patrząc na skład, najmocniejsi jesteśmy dziś w ${POSITION_LABELS[bestPosition]}, a najwięcej problemów mamy w ${POSITION_LABELS[weakestPos]}. Najwięcej dają teraz ${keyNames}.`,
    `Największa siła jest dziś w ${POSITION_LABELS[bestPosition]}, a najsłabsze miejsce mamy w ${POSITION_LABELS[weakestPos]}. Ten zespół w dużej mierze opiera się na zawodnikach takich jak ${keyNames}.`,
  ]);

  const squadShapeLine = pickVariant(`${club.id}_${style.id}_shape`, [
    `Średni poziom kadry to ${averageOverall} OVR. To wystarczy do normalnej gry, ale różnice między pozycjami są duże.`,
    `Średni poziom zespołu wynosi ${averageOverall} OVR. Nie jest źle, ale nie wszędzie mamy dobrych zmienników.`,
    `Przy średniej ${averageOverall} OVR ta drużyna może być stabilna, ale nie każda formacja trzyma ten sam poziom.`,
  ]);

  const exitContextLine = topExit
    ? `Uważam, że ${exitName} jest dziś słabszy od innych na swojej pozycji. Moja rekomendacja: ${topExit.actionLabel.toLowerCase()}.`
    : 'Na dziś nie widzę jednego oczywistego zawodnika do odsunięcia, ale kilku graczy wymaga dalszej obserwacji.';

  const contractLine = report.contractCases[0]
    ? `Osobno zwracam uwagę na ${contractName}. W jego przypadku chodzi tylko o kontrakt, więc ten temat trzeba ocenić osobno.`
    : 'Obecnie nie ma problemu z kontraktami.';

  const talentLine = topTalent && seededUnit(`${club.id}_${style.id}_talent`) > 0.5
    ? `${topTalent.player.lastName} to dziś najciekawszy młody zawodnik w kadrze. Powinien grać regularnie, ale nie trzeba go od razu wystawiać do pierwszego składu w każdym meczu.`
    : `Najciekawszym zawodnikiem do rozwoju jest ${talentName}. Warto dawać mu minuty i sprawdzać, jak szybko idzie do przodu.`;

  const tacticLine = pickVariant(`${club.id}_${style.id}_tactic`, [
    `Jeśli chodzi o ustawienie, najlepiej wygląda dziś ${bestTactic}. W tym systemie najłatwiej zmieścić najlepszych zdrowych zawodników. Drugą opcją jest ${altTactic}.`,
    `Na teraz postawiłbym na ${bestTactic}, bo w tym ustawieniu najlepiej wykorzystamy najmocniejszych i najbardziej gotowych do gry zawodników. Drugi wybór to ${altTactic}.`,
    `Moim zdaniem najlepszym wyborem na dziś jest ${bestTactic}. Ten system po prostu najlepiej pasuje do obecnej kadry. Jako druga opcja zostaje ${altTactic}.`,
  ]);

  const closeLine = pickVariant(`${club.id}_${style.id}_close`, [
    'Podsumowując, oparłbym zespół na najlepszych zawodnikach, uporządkował skład i podjął potrzebne decyzje kontraktowe.',
    'Na dziś najważniejsze jest wybrać jedno główne ustawienie i jasno ustalić, kto ma w nim grać.',
    'Mówiąc prosto: ten zespół może dawać wyniki, jeśli będziemy grać najmocniejszym składem i nie przegapimy ważnych decyzji.',
  ]);

  const paragraphs = [
    `${opening} ${keyPlayersLine} ${squadShapeLine}`,
    `${exitContextLine} ${contractLine} ${talentLine}`,
    `${tacticLine} ${closeLine}`,
  ];

  return {
    styleId: style.id,
    styleName: style.name,
    styleRole: style.role,
    paragraphs,
  };
};

export const TeamAnalysisService = {
  analyzeSquad: (club: Club, players: Player[], currentDate: Date): TeamAnalysisReport => {
    const squadAverageOverall = average(players.map(player => player.overallRating));
    const { best, alternatives, availableCounts } = analyzeTactics(players);
    const baseReport = {
      generatedAt: currentDate.toISOString(),
      injuryRule: `Taktyka liczona tylko na zawodnikach zdrowych lub z urazem do ${TACTIC_INJURY_LIMIT_DAYS} dni oraz z kondycją co najmniej ${MIN_TACTIC_CONDITION}%.`,
      squadAverageOverall: Math.round(squadAverageOverall * 10) / 10,
      availableCounts,
      keyPlayers: analyzeKeyPlayers(players),
      exitCandidates: analyzeExitCandidates(players, club, best, squadAverageOverall),
      contractCases: analyzeContractCases(players, currentDate, squadAverageOverall),
      talents: analyzeTalents(players, currentDate, squadAverageOverall),
      tacticalRecommendation: best,
      alternativeTactics: alternatives,
    };

    return {
      ...baseReport,
      analystNotes: buildAnalystNotes(baseReport),
      commentary: buildCommentary(club, baseReport, currentDate),
    };
  },
};
