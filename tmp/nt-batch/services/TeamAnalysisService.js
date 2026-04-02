import { PlayerPosition, HealthStatus } from '../types';
import { TacticRepository } from '../resources/tactics_db';
import { LineupService } from './LineupService';
import { FinanceService } from './FinanceService';
const RECENT_FORM_SAMPLE = 5;
const TACTIC_INJURY_LIMIT_DAYS = 10;
const MIN_TACTIC_CONDITION = 60;
const TALENT_CARE_MIN_AGE = 16;
const TALENT_CARE_MAX_AGE = 21;
const TALENT_CARE_MIN_TALENT = 70;
const EXIT_CANDIDATE_MIN_SQUAD_SIZE = 21;
const HIGH_REPUTATION_TACTIC_THRESHOLD = 75;
const POSITION_EXIT_MINIMUMS = {
    [PlayerPosition.GK]: 2,
    [PlayerPosition.DEF]: 5,
    [PlayerPosition.MID]: 5,
    [PlayerPosition.FWD]: 3,
};
const POSITION_LABELS = {
    [PlayerPosition.GK]: 'bramce',
    [PlayerPosition.DEF]: 'obronie',
    [PlayerPosition.MID]: 'pomocy',
    [PlayerPosition.FWD]: 'ataku',
};
const POSITION_SHORT_LABELS = {
    [PlayerPosition.GK]: 'GK',
    [PlayerPosition.DEF]: 'DEF',
    [PlayerPosition.MID]: 'MID',
    [PlayerPosition.FWD]: 'FWD',
};
const POSITION_NAME_LABELS = {
    [PlayerPosition.GK]: 'bramkarz',
    [PlayerPosition.DEF]: 'obrońca',
    [PlayerPosition.MID]: 'pomocnik',
    [PlayerPosition.FWD]: 'napastnik',
};
const POSITION_GROUP_LABELS = {
    [PlayerPosition.GK]: 'Bramkarze',
    [PlayerPosition.DEF]: 'Obroncy',
    [PlayerPosition.MID]: 'Pomocnicy',
    [PlayerPosition.FWD]: 'Napastnicy',
};
const ATTRIBUTE_LABELS = {
    strength: 'sila',
    stamina: 'wydolnosc',
    pace: 'szybkosc',
    defending: 'obrona',
    passing: 'podanie',
    attacking: 'gra w ataku',
    finishing: 'wykonczenie',
    technique: 'technika',
    vision: 'wizja gry',
    dribbling: 'drybling',
    heading: 'gra glowa',
    positioning: 'ustawianie sie',
    goalkeeping: 'gra na bramce',
    freeKicks: 'stale fragmenty',
    talent: 'talent',
    penalties: 'rzuty karne',
    corners: 'rzuty rozne',
    aggression: 'agresja',
    crossing: 'dosrodkowania',
    leadership: 'przywodztwo',
    mentality: 'mentalnosc',
    workRate: 'pracowitosc',
};
const TECHNICAL_ATTRIBUTE_KEYS = [
    'technique',
    'passing',
    'vision',
    'dribbling',
    'crossing',
    'finishing',
];
const POSITION_TRAINING_KEYS = {
    [PlayerPosition.GK]: ['goalkeeping', 'positioning', 'passing', 'mentality'],
    [PlayerPosition.DEF]: ['defending', 'positioning', 'heading', 'strength', 'passing'],
    [PlayerPosition.MID]: ['passing', 'vision', 'technique', 'dribbling', 'workRate'],
    [PlayerPosition.FWD]: ['finishing', 'attacking', 'technique', 'pace', 'heading'],
};
const COMMENTARY_STYLES = [
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
const hashString = (value) => {
    let hash = 0;
    for (let i = 0; i < value.length; i++)
        hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0;
    return Math.abs(hash);
};
const seededUnit = (seed) => {
    const x = Math.sin(hashString(seed) + 1) * 10000;
    return x - Math.floor(x);
};
const seededRange = (seed, min, max) => min + seededUnit(seed) * (max - min);
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const average = (values) => values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
const formatPlayerName = (player) => `${player.firstName} ${player.lastName}`;
const joinLabels = (labels) => {
    if (labels.length === 0)
        return '';
    if (labels.length === 1)
        return labels[0];
    if (labels.length === 2)
        return `${labels[0]} i ${labels[1]}`;
    return `${labels.slice(0, -1).join(', ')} i ${labels[labels.length - 1]}`;
};
const getTalentAttributeProfile = (player) => {
    const relevantKeys = POSITION_TRAINING_KEYS[player.position];
    const rankedAttributes = relevantKeys
        .map(attributeKey => ({
        key: attributeKey,
        label: ATTRIBUTE_LABELS[attributeKey],
        value: player.attributes[attributeKey] || 0,
    }))
        .sort((a, b) => b.value - a.value);
    const strongest = rankedAttributes.slice(0, 2).map(entry => entry.label);
    const improvementCandidates = [...rankedAttributes]
        .sort((a, b) => a.value - b.value)
        .slice(0, 2)
        .map(entry => entry.label);
    return {
        strongest,
        improvements: improvementCandidates,
    };
};
const getAttributeAverage = (players, attributeKey) => players.length === 0 ? 0 : average(players.map(player => player.attributes[attributeKey] || 0));
const getTrainingNote = (attributeKey) => {
    switch (attributeKey) {
        case 'passing':
            return 'Na treningach trzeba poprawic podanie i tempo gry pilka.';
        case 'technique':
            return 'Na treningach trzeba poprawic technike i jakosc gry pilka.';
        case 'vision':
            return 'Na treningach trzeba poprawic wybór podan i przeglad pola.';
        case 'dribbling':
            return 'Na treningach trzeba poprawic prowadzenie pilki i gre 1 na 1.';
        case 'crossing':
            return 'Na treningach trzeba poprawic dosrodkowania.';
        case 'finishing':
            return 'Na treningach trzeba poprawic wykonczenie akcji.';
        case 'defending':
            return 'Na treningach trzeba poprawic odbior i krycie.';
        case 'positioning':
            return 'Na treningach trzeba poprawic ustawianie sie.';
        case 'strength':
            return 'Na treningach trzeba poprawic sile i pojedynki.';
        case 'stamina':
            return 'Na treningach trzeba poprawic wydolnosc.';
        case 'pace':
            return 'Na treningach trzeba poprawic szybkosc i dynamike.';
        case 'goalkeeping':
            return 'Na treningach bramkarskich trzeba poprawic interwencje i pewnosc w bramce.';
        case 'heading':
            return 'Na treningach trzeba poprawic gre glowa.';
        case 'attacking':
            return 'Na treningach trzeba poprawic ruch bez pilki i zachowanie w polu karnym.';
        case 'workRate':
            return 'Na treningach trzeba poprawic prace bez pilki.';
        case 'mentality':
            return 'Na treningach trzeba zwrocic uwage na koncentracje i reakcje w trudnych momentach.';
        default:
            return 'Na treningach trzeba poprawic ten element.';
    }
};
const formatContractLabel = (daysLeft) => {
    if (daysLeft <= 30)
        return 'Temu zawodnikowi zaraz kończy się umowa.';
    if (daysLeft <= 120)
        return 'Temu zawodnikowi niedługo kończy się umowa.';
    if (daysLeft <= 365)
        return 'Temu zawodnikowi kończy się umowa w tym sezonie.';
    return 'Obecnie nie ma problemu z jego kontraktem.';
};
const getRecentAverageRating = (player) => {
    const recent = player.stats.ratingHistory?.slice(-RECENT_FORM_SAMPLE) ?? [];
    return recent.length > 0 ? average(recent) : null;
};
const getFormScore = (player) => {
    const avgRating = getRecentAverageRating(player);
    if (avgRating !== null)
        return (avgRating - 6.5) * 10;
    const gp = Math.max(1, player.stats.matchesPlayed);
    const rawContribution = player.position === PlayerPosition.FWD
        ? player.stats.goals / gp
        : player.position === PlayerPosition.MID
            ? (player.stats.goals + player.stats.assists) / gp
            : player.stats.cleanSheets / gp;
    return (player.overallRating - 68) * 0.7 + rawContribution * 10;
};
const getContributionScore = (player) => {
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
const getInjuryDays = (player) => player.health.status === HealthStatus.INJURED ? (player.health.injury?.daysRemaining ?? 0) : 0;
const canBeUsedForTactic = (player) => {
    if ((player.suspensionMatches || 0) > 0)
        return false;
    if (player.condition < MIN_TACTIC_CONDITION)
        return false;
    return getInjuryDays(player) <= TACTIC_INJURY_LIMIT_DAYS;
};
const getContractDaysLeft = (player, currentDate) => Math.floor((new Date(player.contractEndDate).getTime() - currentDate.getTime()) / 86_400_000);
const buildAvailabilityNote = (player) => {
    if ((player.suspensionMatches || 0) > 0)
        return `zawieszony na ${player.suspensionMatches} mecz(e)`;
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
const getSlotScore = (player, role) => {
    const fitScore = LineupService.calculateFitScore(player, role) / 4;
    const formScore = getFormScore(player);
    const contribution = getContributionScore(player);
    const conditionBonus = (player.condition - 70) * 0.28;
    const injuryPenalty = getInjuryDays(player) * 0.9;
    const sameRoleBonus = player.position === role ? 9 : -12;
    const talentBonus = Math.max(0, player.attributes.talent - 68) * 0.12;
    return player.overallRating * 0.82 + fitScore * 0.55 + formScore + contribution + conditionBonus + sameRoleBonus + talentBonus - injuryPenalty;
};
const getGoalkeeperCoreScore = (player) => player.attributes.goalkeeping * 0.52 +
    player.attributes.positioning * 0.18 +
    player.attributes.mentality * 0.14 +
    player.attributes.passing * 0.09 +
    player.attributes.leadership * 0.07;
const getExitEvaluationScore = (player) => {
    const formAverage = getRecentAverageRating(player);
    const gp = Math.max(1, player.stats.matchesPlayed);
    if (player.position === PlayerPosition.GK) {
        return (getGoalkeeperCoreScore(player) +
            (formAverage !== null ? (formAverage - 6.5) * 7 : 0) +
            (player.stats.cleanSheets / gp) * 10 +
            (player.condition - 70) * 0.12);
    }
    return (player.overallRating * 0.82 +
        getFormScore(player) * 0.35 +
        getContributionScore(player) * 0.25 +
        (player.condition - 70) * 0.12);
};
const getGoalkeeperWeaknessLabels = (player) => ['goalkeeping', 'positioning', 'mentality', 'passing']
    .map(attributeKey => ({
    attributeKey,
    label: ATTRIBUTE_LABELS[attributeKey],
    value: player.attributes[attributeKey] || 0,
}))
    .sort((a, b) => a.value - b.value)
    .slice(0, 2)
    .map(entry => entry.label);
const buildWeakPlayersSummary = (entries) => {
    const names = joinNames(entries.slice(0, 3).map(entry => entry.player));
    if (entries.length === 0) {
        return 'Na dziś nie widzę jednego wyraźnie słabego zawodnika, którego trzeba od razu odsunąć.';
    }
    if (entries.length === 1) {
        return `Uważam, że ${names} jest dziś słabszy od innych na swojej pozycji.`;
    }
    return `Uważam, że ${names} są dziś słabsi od innych na swoich pozycjach.`;
};
const pickProjectedLineup = (players, tactic) => {
    const eligiblePlayers = players.filter(canBeUsedForTactic);
    const usedIds = new Set();
    return tactic.slots.map(slot => {
        const candidate = [...eligiblePlayers]
            .filter(player => !usedIds.has(player.id))
            .sort((a, b) => getSlotScore(b, slot.role) - getSlotScore(a, slot.role))[0] ?? null;
        if (candidate)
            usedIds.add(candidate.id);
        return {
            slotIndex: slot.index,
            role: slot.role,
            player: candidate,
            score: candidate ? getSlotScore(candidate, slot.role) : -45,
        };
    });
};
const getLineStrengthFromPlacement = (placement) => {
    const result = {
        [PlayerPosition.GK]: 0,
        [PlayerPosition.DEF]: 0,
        [PlayerPosition.MID]: 0,
        [PlayerPosition.FWD]: 0,
    };
    Object.keys(result).forEach(position => {
        const lineScores = placement.filter(entry => entry.role === position && entry.player).map(entry => entry.score);
        result[position] = lineScores.length > 0 ? Math.round(average(lineScores)) : 0;
    });
    return result;
};
const buildTacticReasons = (tactic, placement, availableCounts) => {
    const tacticDemand = tactic.slots.reduce((acc, slot) => {
        acc[slot.role] += 1;
        return acc;
    }, {
        [PlayerPosition.GK]: 0,
        [PlayerPosition.DEF]: 0,
        [PlayerPosition.MID]: 0,
        [PlayerPosition.FWD]: 0,
    });
    const shortages = Object.keys(tacticDemand)
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
const getTacticProfileStrength = (players, position) => {
    const positionPlayers = players
        .filter(player => player.position === position)
        .sort((a, b) => getSlotScore(b, position) - getSlotScore(a, position))
        .slice(0, position === PlayerPosition.GK ? 1 : position === PlayerPosition.FWD ? 3 : 4);
    return positionPlayers.length > 0 ? average(positionPlayers.map(player => getSlotScore(player, position))) : 0;
};
const getTacticStyleAdjustment = (club, tactic, strengths) => {
    if (tactic.id === '4-2-4')
        return -1000;
    if (club.reputation >= HIGH_REPUTATION_TACTIC_THRESHOLD && tactic.id === '6-3-1')
        return -1000;
    if (club.reputation < HIGH_REPUTATION_TACTIC_THRESHOLD)
        return 0;
    const controlProfile = strengths[PlayerPosition.DEF] >= strengths[PlayerPosition.FWD] + 5
        && strengths[PlayerPosition.MID] >= strengths[PlayerPosition.FWD] + 3
        && strengths[PlayerPosition.DEF] >= 72
        && strengths[PlayerPosition.MID] >= 72;
    if (tactic.attackBias >= 85)
        return -180;
    if (tactic.category === 'Offensive' || tactic.attackBias >= 65)
        return 18;
    if (tactic.category === 'Neutral' || (tactic.attackBias >= 45 && tactic.attackBias < 65))
        return 10;
    if (tactic.category === 'Defensive' || tactic.attackBias < 45)
        return controlProfile ? -4 : -22;
    return 0;
};
const analyzeTactics = (club, players) => {
    const eligiblePlayers = players.filter(canBeUsedForTactic);
    const availableCounts = eligiblePlayers.reduce((acc, player) => {
        acc[player.position] += 1;
        return acc;
    }, {
        [PlayerPosition.GK]: 0,
        [PlayerPosition.DEF]: 0,
        [PlayerPosition.MID]: 0,
        [PlayerPosition.FWD]: 0,
    });
    const strengths = {
        [PlayerPosition.GK]: getTacticProfileStrength(eligiblePlayers, PlayerPosition.GK),
        [PlayerPosition.DEF]: getTacticProfileStrength(eligiblePlayers, PlayerPosition.DEF),
        [PlayerPosition.MID]: getTacticProfileStrength(eligiblePlayers, PlayerPosition.MID),
        [PlayerPosition.FWD]: getTacticProfileStrength(eligiblePlayers, PlayerPosition.FWD),
    };
    const scoredTactics = TacticRepository.getAll().filter(tactic => tactic.id !== '4-2-4').map(tactic => {
        const projectedXI = pickProjectedLineup(players, tactic);
        const missingSlots = projectedXI.filter(entry => !entry.player).length;
        const lineStrength = getLineStrengthFromPlacement(projectedXI);
        const healthyPoolUsed = projectedXI.filter(entry => !!entry.player).length;
        const rawScore = projectedXI.reduce((sum, entry) => sum + entry.score, 0);
        const styleAdjustment = getTacticStyleAdjustment(club, tactic, strengths);
        const score = Math.round(rawScore + healthyPoolUsed * 2.5 - missingSlots * 42 + styleAdjustment);
        return {
            tacticId: tactic.id,
            tacticName: tactic.name,
            score,
            healthyPoolUsed,
            missingSlots,
            lineStrength,
            reasons: buildTacticReasons(tactic, projectedXI, availableCounts),
            projectedXI,
        };
    }).sort((a, b) => b.score - a.score);
    return { best: scoredTactics[0], alternatives: scoredTactics.slice(1, 4), availableCounts };
};
const analyzeKeyPlayers = (players) => {
    const byPosition = players.reduce((acc, player) => {
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
const analyzeExitCandidates = (players, club, tacticalRecommendation, squadAverageOverall) => {
    if (players.length < EXIT_CANDIDATE_MIN_SQUAD_SIZE) {
        return {
            candidates: [],
            note: `Nasza kadra liczy tylko ${players.length} zawodnikow. Warto uzupelnic kilka pozycji, bo przy wiekszej liczbie kontuzji albo kartek mozemy miec powazne problemy kadrowe.`,
        };
    }
    const positionGroups = players.reduce((acc, player) => {
        acc[player.position].push(player);
        return acc;
    }, {
        [PlayerPosition.GK]: [],
        [PlayerPosition.DEF]: [],
        [PlayerPosition.MID]: [],
        [PlayerPosition.FWD]: [],
    });
    Object.keys(positionGroups).forEach(position => {
        positionGroups[position].sort((a, b) => {
            const scoreA = getExitEvaluationScore(a);
            const scoreB = getExitEvaluationScore(b);
            return scoreB - scoreA;
        });
    });
    const requiredByBestTactic = tacticalRecommendation.projectedXI.reduce((acc, slot) => {
        acc[slot.role] += 1;
        return acc;
    }, {
        [PlayerPosition.GK]: 0,
        [PlayerPosition.DEF]: 0,
        [PlayerPosition.MID]: 0,
        [PlayerPosition.FWD]: 0,
    });
    const currentPositionCounts = players.reduce((acc, player) => {
        acc[player.position] += 1;
        return acc;
    }, {
        [PlayerPosition.GK]: 0,
        [PlayerPosition.DEF]: 0,
        [PlayerPosition.MID]: 0,
        [PlayerPosition.FWD]: 0,
    });
    const maxCandidates = players.length <= 23 ? 1 : players.length <= 26 ? 2 : 3;
    const rankedCandidates = players
        .filter(player => !player.isUntouchable)
        .map(player => {
        const positionRank = positionGroups[player.position].findIndex(candidate => candidate.id === player.id) + 1;
        const formAverage = getRecentAverageRating(player);
        const gp = Math.max(1, player.stats.matchesPlayed);
        const playerPositionGroup = positionGroups[player.position];
        const positionAverageScore = average(playerPositionGroup.map(getExitEvaluationScore));
        const positionQualityGap = clamp((positionAverageScore - getExitEvaluationScore(player)) * 1.25, 0, 16);
        const fairSalary = FinanceService.getFairMarketSalary(player.overallRating);
        const salaryPressure = player.annualSalary > 0
            ? ((player.annualSalary - fairSalary) / Math.max(1, fairSalary)) * 25
            : 0;
        const isLikelySurplus = positionRank > Math.max(2, requiredByBestTactic[player.position] + 1);
        const weakFormPenalty = formAverage !== null ? clamp((6.25 - formAverage) * 18, 0, 20) : 4;
        const weakOutputPenalty = player.position === PlayerPosition.GK
            ? clamp((0.24 - (player.stats.cleanSheets / gp)) * 55, 0, 16)
            : player.position === PlayerPosition.FWD
                ? clamp((0.16 - (player.stats.goals / gp)) * 70, 0, 18)
                : player.position === PlayerPosition.MID
                    ? clamp((0.20 - ((player.stats.goals + player.stats.assists) / gp)) * 65, 0, 18)
                    : 0;
        const goalkeeperAttributePenalty = player.position === PlayerPosition.GK
            ? clamp((67 - getGoalkeeperCoreScore(player)) * 1.35, 0, 24)
            : 0;
        const hasDevelopmentUpside = player.age <= 23 && player.attributes.talent >= player.overallRating + 4;
        const weakLevelSignal = positionQualityGap >= 8 || player.overallRating < squadAverageOverall - 5 || goalkeeperAttributePenalty >= 8;
        const weakFormSignal = (formAverage !== null && formAverage < 6.2) || weakOutputPenalty >= 8;
        const noPlanSignal = isLikelySurplus || salaryPressure >= 8 || (player.age >= 29 && player.attributes.talent <= 62);
        const signalCount = [weakLevelSignal, weakFormSignal, noPlanSignal].filter(Boolean).length;
        const probability = Math.round(clamp(18 +
            positionQualityGap +
            weakFormPenalty +
            weakOutputPenalty +
            goalkeeperAttributePenalty +
            (isLikelySurplus ? 18 : 0) +
            (player.age >= 29 && player.attributes.talent <= 62 ? 10 : 0) +
            (getInjuryDays(player) > 20 ? 8 : 0) +
            (player.overallRating < squadAverageOverall - 5 ? 10 : 0) +
            salaryPressure +
            seededRange(`${club.id}_${player.id}_exit`, -7, 7), 8, 94));
        const reasons = [];
        if (isLikelySurplus)
            reasons.push(`Jest dopiero numerem ${positionRank} na swojej pozycji.`);
        if (formAverage !== null && formAverage < 6.2)
            reasons.push(`Forma z ostatnich meczów spadła do ${formAverage.toFixed(1)}.`);
        if (weakOutputPenalty >= 8) {
            reasons.push(player.position === PlayerPosition.GK
                ? 'Na bramce daje dziś za mało czystych kont i pewności.'
                : 'Liczby meczowe są poniżej oczekiwań dla tej roli.');
        }
        if (player.position === PlayerPosition.GK && goalkeeperAttributePenalty >= 8) {
            reasons.push(`U bramkarza najsłabiej wyglądają dziś ${joinLabels(getGoalkeeperWeaknessLabels(player))}.`);
        }
        if (positionQualityGap >= 8)
            reasons.push('Na swojej pozycji odstaje dziś od reszty drużyny.');
        if (salaryPressure >= 8)
            reasons.push('Pensja jest wysoka w porównaniu z obecnym wkładem w grę.');
        if (reasons.length === 0)
            reasons.push('To zawodnik na granicy składu i trzeba podjąć wobec niego decyzję.');
        let actionLabel = 'Zostaw jako rezerwowego';
        let squadNote = 'Na dziś wygląda na słabszego od podstawowych zawodników.';
        if (hasDevelopmentUpside && player.stats.minutesPlayed < 900) {
            actionLabel = 'Daj trening indywidualny';
            squadNote = 'Ma jeszcze potencjał, więc lepiej go rozwijać niż od razu skreślać.';
        }
        else if (hasDevelopmentUpside && player.age <= 21) {
            actionLabel = 'Wypożycz';
            squadNote = 'Potrzebuje regularnej gry poza pierwszym składem.';
        }
        else if (probability >= 76) {
            actionLabel = 'Wystawmy go na listę transferową';
            squadNote = 'Uważam, że jest słabszy od innych i nie daje dziś wystarczająco dużo zespołowi.';
        }
        else if (probability >= 62) {
            actionLabel = 'Spróbuj sprzedać';
            squadNote = 'Jeśli pojawi się oferta, można spokojnie rozważyć sprzedaż.';
        }
        return {
            player,
            probability,
            actionLabel,
            reasons,
            squadNote,
            signalCount,
        };
    })
        .sort((a, b) => b.probability - a.probability)
        .filter(entry => entry.probability >= 50 && entry.signalCount >= 2);
    const remainingCounts = { ...currentPositionCounts };
    const pickedCandidates = [];
    rankedCandidates.forEach(entry => {
        if (pickedCandidates.length >= maxCandidates)
            return;
        const minForPosition = Math.max(POSITION_EXIT_MINIMUMS[entry.player.position], requiredByBestTactic[entry.player.position] + 1);
        if (remainingCounts[entry.player.position] - 1 < minForPosition)
            return;
        if (players.length - pickedCandidates.length - 1 < EXIT_CANDIDATE_MIN_SQUAD_SIZE)
            return;
        remainingCounts[entry.player.position] -= 1;
        pickedCandidates.push({
            player: entry.player,
            probability: entry.probability,
            actionLabel: entry.actionLabel,
            reasons: entry.reasons,
            squadNote: entry.squadNote,
        });
    });
    return {
        candidates: pickedCandidates,
        note: pickedCandidates.length === 0
            ? 'Na teraz nie widze zawodnika, ktorego mozna bezpiecznie oddac bez oslabiania kadry.'
            : null,
    };
};
const analyzeContractCases = (players, currentDate, squadAverageOverall) => {
    return players
        .map(player => {
        const daysLeft = getContractDaysLeft(player, currentDate);
        const interestedCount = player.interestedClubs?.length || 0;
        const isImportantPlayer = player.overallRating >= squadAverageOverall + 3;
        const isTooGoodForClub = player.overallRating >= squadAverageOverall + 6;
        if (daysLeft > 540 && interestedCount === 0)
            return null;
        const urgency = Math.round(clamp((daysLeft <= 90 ? 48 : daysLeft <= 180 ? 34 : daysLeft <= 365 ? 22 : 10) +
            (isImportantPlayer ? 16 : 0) +
            (isTooGoodForClub ? 12 : 0) +
            interestedCount * 8, 10, 95));
        let actionLabel = 'Obecnie nie ma problemu z kontraktem';
        if (daysLeft <= 180 && isImportantPlayer) {
            actionLabel = 'Daj mu nowy kontrakt';
        }
        else if (daysLeft <= 365 && isTooGoodForClub) {
            actionLabel = 'Daj mu nowy kontrakt albo go sprzedaj';
        }
        else if (daysLeft <= 180) {
            actionLabel = 'Trzeba podjąć decyzję';
        }
        else if (interestedCount > 0) {
            actionLabel = 'Jeśli nie damy mu nowego kontraktu, może odejść';
        }
        const reasons = [];
        if (daysLeft <= 90)
            reasons.push('Temu zawodnikowi bardzo szybko kończy się umowa.');
        else if (daysLeft <= 180)
            reasons.push('Temu zawodnikowi niedługo kończy się umowa.');
        else if (daysLeft <= 365)
            reasons.push('Temu zawodnikowi kończy się umowa w tym sezonie.');
        if (isImportantPlayer)
            reasons.push('To ważny zawodnik dla obecnego składu.');
        if (isTooGoodForClub)
            reasons.push('To bardzo dobry zawodnik jak na obecny poziom drużyny.');
        if (interestedCount > 0)
            reasons.push(`Interesuje się nim już ${interestedCount} klub(y).`);
        return {
            player,
            urgency,
            actionLabel,
            reasons,
            contractNote: formatContractLabel(daysLeft),
        };
    })
        .filter(Boolean)
        .sort((a, b) => b.urgency - a.urgency)
        .slice(0, 5);
};
const analyzeTalents = (players, currentDate, squadAverageOverall) => {
    const youngPlayers = players.filter(player => player.age >= TALENT_CARE_MIN_AGE && player.age <= TALENT_CARE_MAX_AGE);
    const highTalentYoungPlayers = youngPlayers.filter(player => player.attributes.talent > TALENT_CARE_MIN_TALENT);
    const fallbackYoungPlayers = [...youngPlayers].sort((a, b) => {
        if (b.attributes.talent !== a.attributes.talent)
            return b.attributes.talent - a.attributes.talent;
        if (a.age !== b.age)
            return a.age - b.age;
        return b.overallRating - a.overallRating;
    });
    const emergencyFallbackPlayers = [...players].sort((a, b) => {
        if (a.age !== b.age)
            return a.age - b.age;
        if (b.attributes.talent !== a.attributes.talent)
            return b.attributes.talent - a.attributes.talent;
        return b.overallRating - a.overallRating;
    });
    const selectedPlayers = highTalentYoungPlayers.length > 0
        ? highTalentYoungPlayers
        : fallbackYoungPlayers.length > 0
            ? fallbackYoungPlayers
            : emergencyFallbackPlayers;
    return selectedPlayers
        .map(player => {
        const formAverage = getRecentAverageRating(player);
        const minutesFactor = clamp(player.stats.minutesPlayed / 900, 0, 1.4);
        const upside = Math.max(0, player.attributes.talent - player.overallRating);
        const contractDays = getContractDaysLeft(player, currentDate);
        const attributeProfile = getTalentAttributeProfile(player);
        const score = Math.round(player.attributes.talent * 0.95 +
            upside * 2.4 +
            (TALENT_CARE_MAX_AGE + 1 - Math.min(player.age, TALENT_CARE_MAX_AGE + 1)) * 4 +
            (formAverage ?? 6.4) * 3 +
            minutesFactor * 8);
        let developmentPath = 'Dawać regularne minuty z ławki i chronić obciążenia.';
        if (player.age <= 19 && player.stats.minutesPlayed < 500) {
            developmentPath = 'Wprowadzać etapami: końcówki, puchary i spokojny plan treningowy.';
        }
        else if (player.overallRating >= squadAverageOverall - 3) {
            developmentPath = 'Jest gotowy do regularnej rotacji z pierwszym składem.';
        }
        else if (player.age <= 21 && player.stats.minutesPlayed < 700) {
            developmentPath = 'Rozważyć wypożyczenie, jeśli w klubie nie dostanie regularnych minut.';
        }
        return {
            player,
            score,
            developmentPath,
            reasons: [
                player.attributes.talent > TALENT_CARE_MIN_TALENT
                    ? `To jeden z najbardziej utalentowanych młodych zawodników w obecnej kadrze.`
                    : `To jeden z młodszych zawodników, którym warto się przyjrzeć w obecnej kadrze.`,
                `Na swojej pozycji najmocniej wyglądają u niego ${joinLabels(attributeProfile.strongest)}.`,
                `Żeby wejść poziom wyżej, powinien poprawić ${joinLabels(attributeProfile.improvements)}.`,
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
        .slice(0, 3);
};
const analyzeTraining = (players) => {
    const outfieldPlayers = players.filter(player => player.position !== PlayerPosition.GK);
    const teamTechniqueAverage = Math.round(getAttributeAverage(outfieldPlayers, 'technique') * 10) / 10;
    const weakestTechnicalAreas = TECHNICAL_ATTRIBUTE_KEYS
        .map(attributeKey => ({
        attributeKey,
        label: ATTRIBUTE_LABELS[attributeKey],
        average: Math.round(getAttributeAverage(outfieldPlayers, attributeKey) * 10) / 10,
        note: getTrainingNote(attributeKey),
    }))
        .sort((a, b) => a.average - b.average)
        .slice(0, 3);
    const lineFocuses = Object.values(PlayerPosition).map(position => {
        const linePlayers = players.filter(player => player.position === position);
        const weaknesses = POSITION_TRAINING_KEYS[position]
            .map(attributeKey => ({
            attributeKey,
            label: ATTRIBUTE_LABELS[attributeKey],
            average: Math.round(getAttributeAverage(linePlayers, attributeKey) * 10) / 10,
            note: getTrainingNote(attributeKey),
        }))
            .sort((a, b) => a.average - b.average)
            .slice(0, 2);
        const coachNote = weaknesses.length > 0
            ? `${POSITION_GROUP_LABELS[position]} najslabiej wygladaja dzis w elemencie: ${weaknesses.map(entry => entry.label).join(' i ')}.`
            : `${POSITION_GROUP_LABELS[position]} nie wymagaja osobnej uwagi.`;
        return {
            position,
            positionLabel: POSITION_GROUP_LABELS[position],
            weaknesses,
            coachNote,
        };
    });
    const teamWeaknessText = weakestTechnicalAreas.length > 0
        ? `Patrząc na całą drużynę, najsłabiej wyglądają dziś ${joinLabels(weakestTechnicalAreas.slice(0, 2).map(area => area.label))}.`
        : 'Patrząc na całą drużynę, nie widać dziś jednego dużego problemu technicznego.';
    const mainTrainingText = weakestTechnicalAreas[0]
        ? `Na treningach w pierwszej kolejności poprawiłbym ${weakestTechnicalAreas[0].label}.`
        : 'Na treningach utrzymałbym obecny kierunek pracy.';
    const lineSummaryText = lineFocuses
        .map(line => {
        const weaknessLabels = joinLabels(line.weaknesses.slice(0, 2).map(weakness => weakness.label));
        if (!weaknessLabels) {
            return `${line.positionLabel} wyglądają dziś równo i nie mają jednego wyraźnego braku.`;
        }
        return `${line.positionLabel} najsłabiej wyglądają dziś w elemencie ${weaknessLabels}.`;
    })
        .join(' ');
    const summary = [
        `${teamWeaknessText} ${mainTrainingText} Osobno zwróciłbym uwagę na poszczególne formacje. ${lineSummaryText}`,
    ];
    return {
        teamTechniqueAverage,
        weakestTechnicalAreas,
        lineFocuses,
        summary,
    };
};
const getPenaltySpecialistScore = (player) => {
    const formAverage = getRecentAverageRating(player) ?? 6.4;
    const formBonus = (formAverage - 6.0) * 6;
    return (player.attributes.penalties * 0.42 +
        player.attributes.finishing * 0.2 +
        player.attributes.technique * 0.14 +
        player.attributes.mentality * 0.1 +
        player.attributes.attacking * 0.05 +
        player.attributes.leadership * 0.03 +
        player.overallRating * 0.05 +
        formBonus +
        player.condition * 0.03 -
        getInjuryDays(player) * 0.45);
};
const getFreeKickSpecialistScore = (player) => {
    const formAverage = getRecentAverageRating(player) ?? 6.4;
    const formBonus = (formAverage - 6.0) * 6;
    return (player.attributes.freeKicks * 0.42 +
        player.attributes.technique * 0.16 +
        player.attributes.passing * 0.13 +
        player.attributes.vision * 0.1 +
        player.attributes.crossing * 0.08 +
        player.attributes.attacking * 0.05 +
        player.overallRating * 0.05 +
        formBonus +
        player.condition * 0.03 -
        getInjuryDays(player) * 0.4);
};
const getCaptainCandidateScore = (player) => {
    const formAverage = getRecentAverageRating(player) ?? 6.4;
    const formBonus = (formAverage - 6.0) * 5;
    const matchReadiness = Math.min(player.stats.matchesPlayed, 34) / 34;
    return (player.attributes.leadership * 0.42 +
        player.attributes.mentality * 0.18 +
        player.attributes.workRate * 0.12 +
        player.overallRating * 0.12 +
        player.attributes.positioning * 0.04 +
        player.age * 0.16 +
        matchReadiness * 8 +
        formBonus +
        player.condition * 0.03 -
        getInjuryDays(player) * 0.45);
};
const getTopNamedAttributes = (entries, limit = 2) => [...entries].sort((a, b) => b.value - a.value).slice(0, limit).map(entry => entry.label);
const buildPenaltyReason = (player, rank) => {
    const strongest = getTopNamedAttributes([
        { label: 'rzuty karne', value: player.attributes.penalties },
        { label: 'wykonczenie', value: player.attributes.finishing },
        { label: 'technike', value: player.attributes.technique },
        { label: 'mentalnosc', value: player.attributes.mentality },
    ]);
    if (rank === 0) {
        return `Na dzisiaj to pierwszy wybor do karnych. Najlepiej laczy ${joinLabels(strongest)}.`;
    }
    if (rank === 1) {
        return `Jesli pierwszy wykonawca nie bedzie gral, to od razu patrzylbym na niego. Ma dobre ${joinLabels(strongest)}.`;
    }
    return `To sensowna trzecia opcja do karnych. Dalej ma atuty w takich elementach jak ${joinLabels(strongest)}.`;
};
const buildFreeKickReason = (player, rank) => {
    const strongest = getTopNamedAttributes([
        { label: 'stale fragmenty', value: player.attributes.freeKicks },
        { label: 'technike', value: player.attributes.technique },
        { label: 'podanie', value: player.attributes.passing },
        { label: 'wizje gry', value: player.attributes.vision },
        { label: 'dosrodkowania', value: player.attributes.crossing },
    ]);
    if (rank === 0) {
        return `To moim zdaniem najlepszy wykonawca wolnych w tej kadrze. Wyroznia sie przez ${joinLabels(strongest)}.`;
    }
    if (rank === 1) {
        return `To dobra druga opcja do wolnych. Dobrze laczy ${joinLabels(strongest)}.`;
    }
    return `Jako trzeci wybor tez sie broni. W jego przypadku widac ${joinLabels(strongest)}.`;
};
const buildCaptainReason = (player, rank) => {
    const strongest = getTopNamedAttributes([
        { label: 'przywodztwo', value: player.attributes.leadership },
        { label: 'mentalnosc', value: player.attributes.mentality },
        { label: 'pracowitosc', value: player.attributes.workRate },
        { label: 'ustawianie sie', value: player.attributes.positioning },
    ]);
    if (rank === 0) {
        return `Jesli szukamy kapitana, to od niego bym zaczal. Ma mocne ${joinLabels(strongest)} i wyglada na naturalnego lidera.`;
    }
    if (rank === 1) {
        return `To bardzo dobra druga opcja na opaske. Wyróznia go ${joinLabels(strongest)}.`;
    }
    return `To kandydat, ktorego tez warto miec pod uwaga przy wyborze kapitana. Pomagaja mu ${joinLabels(strongest)}.`;
};
const analyzeAssistantLeaders = (players) => {
    const availablePlayers = players.filter(player => (player.suspensionMatches || 0) === 0);
    const specialistPool = availablePlayers.length > 0 ? availablePlayers : players;
    const penalties = [...specialistPool]
        .sort((a, b) => getPenaltySpecialistScore(b) - getPenaltySpecialistScore(a))
        .slice(0, 3)
        .map((player, index) => ({
        player,
        score: Math.round(getPenaltySpecialistScore(player)),
        reason: buildPenaltyReason(player, index),
    }));
    const freeKicks = [...specialistPool]
        .sort((a, b) => getFreeKickSpecialistScore(b) - getFreeKickSpecialistScore(a))
        .slice(0, 3)
        .map((player, index) => ({
        player,
        score: Math.round(getFreeKickSpecialistScore(player)),
        reason: buildFreeKickReason(player, index),
    }));
    const captains = [...specialistPool]
        .sort((a, b) => getCaptainCandidateScore(b) - getCaptainCandidateScore(a))
        .slice(0, 3)
        .map((player, index) => ({
        player,
        score: Math.round(getCaptainCandidateScore(player)),
        reason: buildCaptainReason(player, index),
    }));
    return {
        penalties,
        freeKicks,
        captains,
    };
};
const joinNames = (players) => {
    const names = players.map(player => formatPlayerName(player));
    if (names.length === 0)
        return 'brakuje wyraźnych nazwisk';
    if (names.length === 1)
        return names[0];
    if (names.length === 2)
        return `${names[0]} i ${names[1]}`;
    return `${names[0]}, ${names[1]} i ${names[2]}`;
};
const buildKeyPlayersStatement = (players) => {
    const names = joinNames(players);
    if (players.length <= 1) {
        return `${names} jest teraz jednym z najważniejszych i najlepszych zawodników w drużynie.`;
    }
    return `${names} są teraz najważniejszymi zawodnikami w tej drużynie.`;
};
const strongestPosition = (counts) => Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
const weakestPosition = (counts) => Object.keys(counts).sort((a, b) => counts[a] - counts[b])[0];
const pickVariant = (seed, variants) => variants[hashString(seed) % variants.length];
const buildAnalystNotes = (report) => {
    const notes = [];
    const usedIds = new Set();
    const pushNote = (note) => {
        if (!note || usedIds.has(note.player.id))
            return;
        usedIds.add(note.player.id);
        notes.push(note);
    };
    const topContract = report.contractCases[0];
    if (topContract) {
        const playerName = formatPlayerName(topContract.player);
        let title = `${playerName} - kontrakt`;
        let explanation = `Obecnie nie ma problemu z kontraktem zawodnika ${playerName}.`;
        if (topContract.actionLabel === 'Daj mu nowy kontrakt') {
            title = `${playerName} - daj mu lepszy kontrakt`;
            explanation = `Z tym zawodnikiem trzeba szybko usiąść do rozmów. To ważny gracz dla składu i nie warto czekać do końca umowy.`;
        }
        else if (topContract.actionLabel === 'Daj mu nowy kontrakt albo go sprzedaj') {
            title = `${playerName} - podejmij decyzję teraz`;
            explanation = `Temu zawodnikowi kończy się umowa, więc trzeba podjąć decyzję. Jeśli nie damy mu nowego kontraktu, lepiej sprzedać go teraz.`;
        }
        else if (topContract.actionLabel === 'Trzeba podjąć decyzję') {
            title = `${playerName} - kontrakt się kończy`;
            explanation = `Temu zawodnikowi kończy się umowa, więc trzeba podjąć decyzję. Nie ma sensu zostawiać tego na później.`;
        }
        else if (topContract.actionLabel === 'Jeśli nie damy mu nowego kontraktu, może odejść') {
            title = `${playerName} - może odejść`;
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
    report.exitCandidates.slice(0, 3).forEach((topExit) => {
        const playerName = formatPlayerName(topExit.player);
        let title = `${playerName} - decyzja sportowa`;
        let explanation = `Uważam, że ${playerName} jest dziś słabszy od innych na swojej pozycji. Trzeba podjąć wobec niego prostą decyzję sportową.`;
        if (topExit.player.position === PlayerPosition.GK) {
            explanation = `Uważam, że ${playerName} broni dziś słabiej od innych bramkarzy w klubie. Trzeba ocenić, czy dalej na niego stawiamy, czy szykujemy zmianę.`;
        }
        if (topExit.actionLabel === 'Wystawmy go na listę transferową') {
            title = `${playerName} - wystaw na listę transferową`;
            explanation = topExit.player.position === PlayerPosition.GK
                ? `Uważam, że ${playerName} jest dziś za słaby na rolę numeru jeden w bramce. Jeśli mamy lepszą opcję, wystawiłbym go na listę transferową.`
                : `Uważam, że ${playerName} jest słabszy od innych na swojej pozycji i nie daje dziś tyle, ile potrzebujemy. Dlatego wystawiłbym go na listę transferową.`;
        }
        else if (topExit.actionLabel === 'Spróbuj sprzedać') {
            title = `${playerName} - można go sprzedać`;
            explanation = `Myślę, że ${playerName} nie daje dziś przewagi nad innymi i jeśli pojawi się dobra oferta, można go sprzedać bez dużej straty dla składu.`;
        }
        else if (topExit.actionLabel === 'Daj trening indywidualny') {
            title = `${playerName} - daj mu trening indywidualny`;
            explanation = `Uważam, że ${playerName} nie jest dziś gotowy na dużą rolę, ale ma jeszcze coś do poprawy. Dałbym mu trening indywidualny i sprawdził, czy zrobi postęp.`;
        }
        else if (topExit.actionLabel === 'Wypożycz') {
            title = `${playerName} - wypożycz go`;
            explanation = `Myślę, że ${playerName} potrzebuje regularnej gry. U nas może jej nie dostać, więc wypożyczenie byłoby teraz najlepszym ruchem.`;
        }
        else if (topExit.actionLabel === 'Zostaw jako rezerwowego') {
            title = `${playerName} - zostaw go jako rezerwowego`;
            explanation = `Na dziś nie widzę ${playerName} w pierwszym składzie, ale może jeszcze dać coś z ławki. Zostawiłbym go w kadrze, ale bez większej roli.`;
        }
        pushNote({
            id: `exit_${topExit.player.id}`,
            player: topExit.player,
            actionLabel: topExit.actionLabel,
            title,
            explanation,
        });
    });
    const topTalent = report.talents[0];
    if (topTalent) {
        const playerName = formatPlayerName(topTalent.player);
        let explanation = `Uważam, że ${playerName} warto prowadzić spokojnie i regularnie dawać mu minuty, bo może nam jeszcze mocno pójść do góry.`;
        if (topTalent.developmentPath.includes('wypożyczenie')) {
            explanation = `Myślę, że ${playerName} potrzebuje regularnych minut. Jeśli nie damy mu ich u nas, najlepiej będzie go wypożyczyć.`;
        }
        else if (topTalent.developmentPath.includes('rotacji')) {
            explanation = `Uważam, że ${playerName} jest już blisko pierwszego składu. Dawałbym mu regularne wejścia i część meczów od początku.`;
        }
        else if (topTalent.developmentPath.includes('Wprowadzać etapami')) {
            explanation = `Myślę, że ${playerName} trzeba wprowadzać spokojnie. Końcówki meczów i puchary będą dla niego teraz najlepsze.`;
        }
        pushNote({
            id: `talent_${topTalent.player.id}`,
            player: topTalent.player,
            actionLabel: topTalent.developmentPath,
            title: `${playerName} - plan rozwoju`,
            explanation,
        });
    }
    const topLeader = report.keyPlayers[0];
    if (topLeader) {
        const playerName = formatPlayerName(topLeader.player);
        pushNote({
            id: `leader_${topLeader.player.id}`,
            player: topLeader.player,
            actionLabel: topLeader.label,
            title: `${playerName} - oprzyj na nim zespół`,
            explanation: `Uważam, że ${playerName} powinien być jednym z głównych punktów tej drużyny. To zawodnik, na którym warto oprzeć skład i dać mu ważną rolę.`,
        });
    }
    return notes.slice(0, 6);
};
const buildCommentary = (club, report, currentDate) => {
    const style = COMMENTARY_STYLES[hashString(`${club.id}_${currentDate.toISOString().slice(0, 10)}`) % COMMENTARY_STYLES.length];
    const topKeyPlayers = report.keyPlayers.slice(0, 3).map(entry => entry.player);
    const keyPlayersStatement = buildKeyPlayersStatement(topKeyPlayers);
    const weakPlayersSummary = buildWeakPlayersSummary(report.exitCandidates);
    const talentName = report.talents[0] ? formatPlayerName(report.talents[0].player) : '';
    const contractName = report.contractCases[0] ? formatPlayerName(report.contractCases[0].player) : 'nikt';
    const bestTactic = report.tacticalRecommendation.tacticName;
    const altTactic = report.alternativeTactics[0]?.tacticName ?? report.tacticalRecommendation.tacticName;
    const bestPosition = strongestPosition(report.availableCounts);
    const weakestPos = weakestPosition(report.availableCounts);
    const averageOverall = report.squadAverageOverall.toFixed(1);
    const technicalAreaOne = report.trainingAnalysis.weakestTechnicalAreas[0]?.label ?? 'technika';
    const technicalAreaTwo = report.trainingAnalysis.weakestTechnicalAreas[1]?.label ?? 'podanie';
    const topExit = report.exitCandidates[0];
    const topTalent = report.talents[0];
    const opening = pickVariant(`${club.id}_${style.id}_opening`, [
        'Trenerze, skład nie jest zły, ale są 2-3 problemy, które trzeba ogarnąć teraz.',
        'Trenerze, ta kadra daje radę, ale nie na każdej pozycji wygląda dobrze.',
        'Ta drużyna jest wystarczająco silna, żeby wygrywać mecze, ale ma kilka słabych pozycji, które obniżają jej poziom.',
        'Widzę w tej drużynie kilka mocnych punktów, ale są też pozycje, które ciągną zespół w dół.',
    ]);
    const keyPlayersLine = pickVariant(`${club.id}_${style.id}_leaders`, [
        `Najlepiej wygląda dziś ${POSITION_LABELS[bestPosition]}, a najsłabiej ${POSITION_LABELS[weakestPos]}. ${keyPlayersStatement}`,
        `Patrząc na skład, najmocniejsi jesteśmy dziś w ${POSITION_LABELS[bestPosition]}, a najwięcej problemów mamy w ${POSITION_LABELS[weakestPos]}. ${keyPlayersStatement}`,
        `Największa siła jest dziś w ${POSITION_LABELS[bestPosition]}, a najsłabsze miejsce mamy w ${POSITION_LABELS[weakestPos]}. ${keyPlayersStatement}`,
    ]);
    const squadShapeLine = pickVariant(`${club.id}_${style.id}_shape`, [
        `Średni poziom kadry to ${averageOverall} OVR. To wystarczy do normalnej gry, ale różnice między pozycjami są duże.`,
        `Średni poziom zespołu wynosi ${averageOverall} OVR. Nie jest źle, ale nie wszędzie mamy dobrych zmienników.`,
        `Przy średniej ${averageOverall} OVR ta drużyna może być stabilna, ale nie każda formacja trzyma ten sam poziom.`,
    ]);
    const exitContextLine = topExit
        ? `${weakPlayersSummary} Moja rekomendacja: ${report.exitCandidates.slice(0, 3).map(entry => `${formatPlayerName(entry.player)} - ${entry.actionLabel.toLowerCase()}`).join('; ')}.`
        : 'Na dziś nie widzę jednego oczywistego zawodnika do odsunięcia, ale kilku graczy wymaga dalszej obserwacji.';
    const contractLine = report.contractCases[0]
        ? `Osobno zwracam uwagę na ${contractName}. W jego przypadku chodzi tylko o kontrakt, więc ten temat trzeba ocenić osobno.`
        : '';
    const talentLine = topTalent
        ? seededUnit(`${club.id}_${style.id}_talent`) > 0.5
            ? `${formatPlayerName(topTalent.player)} to dziś najciekawszy młody zawodnik w kadrze. Powinien grać regularnie, ale nie trzeba go od razu wystawiać do pierwszego składu w każdym meczu.`
            : `Najciekawszym zawodnikiem do rozwoju jest ${talentName}. Warto dawać mu minuty i sprawdzać, jak szybko idzie do przodu.`
        : '';
    const trainingLine = `Patrzac na treningi, druzyna najslabiej wyglada dzis w takich elementach jak ${technicalAreaOne} i ${technicalAreaTwo}. W najblizszych tygodniach trzeba na to zwrocic najwieksza uwage.`;
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
        [exitContextLine, contractLine, talentLine].filter(Boolean).join(' '),
        trainingLine,
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
    analyzeSquad: (club, players, currentDate) => {
        const squadAverageOverall = average(players.map(player => player.overallRating));
        const { best, alternatives, availableCounts } = analyzeTactics(club, players);
        const { candidates: exitCandidates, note: exitCandidatesNote } = analyzeExitCandidates(players, club, best, squadAverageOverall);
        const baseReport = {
            generatedAt: currentDate.toISOString(),
            injuryRule: `Analiza jest tworzona na danych zawodników zdrowych lub z urazem do ${TACTIC_INJURY_LIMIT_DAYS} dni oraz z kondycją co najmniej ${MIN_TACTIC_CONDITION}%.`,
            squadSize: players.length,
            squadAverageOverall: Math.round(squadAverageOverall * 10) / 10,
            availableCounts,
            trainingAnalysis: analyzeTraining(players),
            assistantLeaders: analyzeAssistantLeaders(players),
            keyPlayers: analyzeKeyPlayers(players),
            exitCandidates,
            exitCandidatesNote,
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
