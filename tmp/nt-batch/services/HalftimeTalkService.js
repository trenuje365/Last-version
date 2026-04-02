import { HALFTIME_TALKS } from '../data/halftime_talks_pl';
// ─── TEKSTY REAKCJI (ukryte przed graczem jaki jest efekt) ───────────────────
const REACTION_TEXTS = {
    CALM: [
        'Zawodnicy spokojnie kiwają głowami.',
        'W szatni zapada cisza. Każdy skupia się na taktyce.',
        'Drużyna wygląda na skupioną.',
        'Kilku zawodników wymienia spojrzenia. Zrozumieli.',
    ],
    AGGRESSIVE: [
        'Szatnia wydaje się mocno zmotywowana.',
        'Słychać okrzyki. Kilku graczy wstaje z ławki.',
        'Napięcie w szatni sięga zenitu.',
        'Zawodnicy wychodzą z szatni w bojowym nastroju.',
    ],
    PRAISE: [
        'Widać zadowolenie na twarzach zawodników.',
        'Kilku graczy uśmiecha się. Atmosfera jest dobra.',
        'Zawodnicy wygladają na pewnych siebie. ',
        'W szatni daje się wyczuć pozytywną atmosferę.',
    ],
    CRITICIZE: [
        'Szatnia milczy. Niektórzy wbijają wzrok w podłogę.',
        'Kilku zawodników wymienia spojrzenia. Widać napięcie.',
        'Atmosfera jest gęsta. Każdy wie, że musi dać więcej.',
        'Jeden z liderów wstaje i zaczyna mówić do reszty.',
    ],
    SILENCE: [
        'Cisza w szatni. Każdy z własną myślą.',
        'Nikt nic nie mówi. Minuty przerwy mijają w skupieniu.',
        'Zawodnicy patrzą po sobie. Brak słów mówi wszystko.',
        'Szatnia odpoczynek w milczeniu. Nikt nie odzywa.',
    ],
};
// ─── WYZNACZENIE KONTEKSTU WYNIKU ─────────────────────────────────────────────
export const getScoreContext = (userScore, oppScore) => {
    const diff = userScore - oppScore;
    const total = userScore + oppScore;
    if (diff === 0)
        return total <= 1 ? 'DRAW_LOW' : 'DRAW_HIGH';
    if (diff === 1)
        return 'WINNING_ONE';
    if (diff >= 2)
        return 'WINNING_HIGH';
    if (diff === -1)
        return 'LOSING_ONE';
    return 'LOSING_HIGH';
};
// ─── POBRANIE OPCJI DLA KONTEKSTU ────────────────────────────────────────────
export const getTalksForContext = (context) => {
    return HALFTIME_TALKS[context];
};
// ─── SEEDED RNG ──────────────────────────────────────────────────────────────
const seededRng = (seed, offset) => {
    const s = seed + offset;
    const x = Math.sin(s) * 10000;
    return x - Math.floor(x);
};
// ─── GŁÓWNA KALKULACJA — 7 WĄTKÓW PSYCHOLOGII ────────────────────────────────
export const calculateTalkEffect = (talkType, context, momentumEndOf1st, avgFatigue, userShots, seed, optionIndex) => {
    const rng1 = seededRng(seed, optionIndex + 1);
    const rng2 = seededRng(seed, optionIndex + 2);
    const rng3 = seededRng(seed, optionIndex + 3);
    const rng4 = seededRng(seed, optionIndex + 4);
    // ── Wątek 1: Trafność kontekstowa ─────────────────────────────────────────
    // Czy typ rozmowy pasuje do sytuacji? (+1.0 = idealne, -1.0 = błąd)
    const getContextFit = () => {
        if (talkType === 'CALM') {
            if (context === 'WINNING_HIGH')
                return 1.0;
            if (context === 'WINNING_ONE')
                return 0.7;
            if (context === 'DRAW_LOW')
                return 0.6;
            if (context === 'DRAW_HIGH')
                return 0.3;
            if (context === 'LOSING_ONE')
                return 0.1;
            if (context === 'LOSING_HIGH')
                return -0.7;
        }
        if (talkType === 'AGGRESSIVE') {
            if (context === 'LOSING_HIGH')
                return 1.0;
            if (context === 'LOSING_ONE')
                return 0.8;
            if (context === 'DRAW_LOW')
                return 0.5;
            if (context === 'DRAW_HIGH')
                return 0.4;
            if (context === 'WINNING_ONE')
                return -0.2;
            if (context === 'WINNING_HIGH')
                return -0.5;
        }
        if (talkType === 'PRAISE') {
            if (context === 'WINNING_HIGH')
                return 0.9;
            if (context === 'WINNING_ONE')
                return 0.8;
            if (context === 'DRAW_HIGH')
                return 0.5;
            if (context === 'DRAW_LOW')
                return 0.3;
            if (context === 'LOSING_ONE')
                return 0.1;
            if (context === 'LOSING_HIGH')
                return -0.4;
        }
        if (talkType === 'CRITICIZE') {
            if (context === 'LOSING_HIGH')
                return 0.6;
            if (context === 'LOSING_ONE')
                return 0.4;
            if (context === 'DRAW_LOW')
                return 0.2;
            if (context === 'DRAW_HIGH')
                return 0.1;
            if (context === 'WINNING_ONE')
                return -0.3;
            if (context === 'WINNING_HIGH')
                return -0.6;
        }
        return 0; // SILENCE
    };
    const contextFit = getContextFit();
    // ── Wątek 2: Stan momentum na koniec 1. połowy ────────────────────────────
    // Drużyna w dołku (< -30) potrzebuje agresji bardziej niż spokoju
    const getMomentumMod = () => {
        if (talkType === 'AGGRESSIVE' && momentumEndOf1st < -30)
            return 0.15;
        if (talkType === 'CALM' && momentumEndOf1st > 30)
            return 0.10;
        if (talkType === 'AGGRESSIVE' && momentumEndOf1st > 50)
            return -0.10;
        if (talkType === 'CALM' && momentumEndOf1st < -50)
            return -0.12;
        return 0;
    };
    const momentumMod = getMomentumMod();
    // ── Wątek 3: Zmęczenie drużyny ────────────────────────────────────────────
    // Zmęczona drużyna (> 50% avg fatigue zużyte = avgFatigue < 50) słabiej reaguje na agresję
    const fatigueTired = avgFatigue < 50;
    const getFatigueMod = () => {
        if (talkType === 'AGGRESSIVE' && fatigueTired)
            return -0.08;
        if (talkType === 'CALM' && !fatigueTired)
            return 0.05;
        return 0;
    };
    const fatigueMod = getFatigueMod();
    // ── Wątek 4: Strzały (jakość gry) ────────────────────────────────────────
    // Dużo strzałów mimo przegranej → PRAISE ma sens nawet przy złym wyniku
    const goodPerformanceDespiteScore = (context === 'LOSING_ONE' || context === 'LOSING_HIGH') && userShots >= 4;
    const getPerfMod = () => {
        if (talkType === 'PRAISE' && goodPerformanceDespiteScore)
            return 0.12;
        if (talkType === 'CRITICIZE' && userShots === 0)
            return 0.10;
        return 0;
    };
    const perfMod = getPerfMod();
    // ── Wątek 5: Wariancja per typ ────────────────────────────────────────────
    // CRITICIZE = bardzo wysoka; SILENCE = bardzo niska
    const getVarianceRange = () => {
        if (talkType === 'CALM')
            return { min: -8, max: 12 };
        if (talkType === 'AGGRESSIVE')
            return { min: -10, max: 25 };
        if (talkType === 'PRAISE')
            return { min: -8, max: 18 };
        if (talkType === 'CRITICIZE')
            return { min: -20, max: 20 };
        return { min: -8, max: -2 }; // SILENCE
    };
    const { min, max } = getVarianceRange();
    // Wylosowana bazowa wartość momentum delta (w zakresie min..max)
    const rawBase = min + rng1 * (max - min);
    // ── Wątek 6: Modyfikatory response factors ────────────────────────────────
    // Określone przed losowaniem — zależą od typu
    const getBaseResponseFactors = () => {
        if (talkType === 'CALM')
            return {
                tempoRF: 0.90,
                mindsetRF: 1.00,
                intensityRF: 0.95,
                regenBonus: 1.5,
            };
        if (talkType === 'AGGRESSIVE')
            return {
                tempoRF: 1.05,
                mindsetRF: 0.95,
                intensityRF: 1.15,
                regenBonus: -1.0,
            };
        if (talkType === 'PRAISE')
            return {
                tempoRF: 1.00,
                mindsetRF: 1.10,
                intensityRF: 1.00,
                regenBonus: 0.5,
            };
        if (talkType === 'CRITICIZE')
            return {
                tempoRF: 1.00,
                mindsetRF: 1.00,
                intensityRF: 1.00,
                regenBonus: 0.0,
            };
        return {
            tempoRF: 1.00,
            mindsetRF: 1.00,
            intensityRF: 1.00,
            regenBonus: 0.0,
        };
    };
    const baseRF = getBaseResponseFactors();
    // ── Wątek 7: Finalny wynik + korekta CRITICIZE ────────────────────────────
    // Dla CRITICIZE: losujemy czy efekt idzie pozytywnie czy negatywnie
    // Szansa na pozytywny efekt rośnie przy słabym wyniku, maleje przy dobrym
    let isCriticizePositive = false;
    if (talkType === 'CRITICIZE') {
        const posChance = context === 'LOSING_HIGH' ? 0.55
            : context === 'LOSING_ONE' ? 0.48
                : context === 'DRAW_LOW' ? 0.40
                    : context === 'DRAW_HIGH' ? 0.35
                        : context === 'WINNING_ONE' ? 0.25
                            : 0.18; // WINNING_HIGH
        isCriticizePositive = rng2 < posChance;
    }
    // Finalne przeliczenie momentum delta
    const totalModifier = 1.0 + contextFit + momentumMod + fatigueMod + perfMod;
    let finalMomentumDelta = rawBase * Math.max(0.1, totalModifier);
    // CRITICIZE: jeśli negatywny → odwracamy kierunek i zmniejszamy RF
    let finalTempoRF = baseRF.tempoRF;
    let finalMindsetRF = baseRF.mindsetRF;
    let finalIntensityRF = baseRF.intensityRF;
    let finalRegenBonus = baseRF.regenBonus;
    if (talkType === 'CRITICIZE') {
        if (isCriticizePositive) {
            finalMomentumDelta = Math.abs(finalMomentumDelta);
            finalTempoRF = 1.10;
            finalMindsetRF = 1.10;
            finalIntensityRF = 1.10;
        }
        else {
            finalMomentumDelta = -Math.abs(finalMomentumDelta);
            finalTempoRF = 0.85;
            finalMindsetRF = 0.85;
            finalIntensityRF = 0.85;
        }
    }
    // Clamp końcowy momentum delta
    finalMomentumDelta = Math.max(-20, Math.min(25, finalMomentumDelta));
    finalMomentumDelta = Math.round(finalMomentumDelta * 10) / 10;
    // Losowy tekst reakcji
    const reactions = REACTION_TEXTS[talkType];
    const reactionText = reactions[Math.floor(rng3 * reactions.length)];
    // Drobna losowa fluktuacja response factors (±0.05)
    const rfNoise = (rng4 - 0.5) * 0.10;
    finalTempoRF = Math.max(0.75, Math.min(1.25, finalTempoRF + rfNoise));
    finalMindsetRF = Math.max(0.75, Math.min(1.25, finalMindsetRF + rfNoise * 0.7));
    finalIntensityRF = Math.max(0.75, Math.min(1.25, finalIntensityRF + rfNoise * 0.8));
    return {
        momentumDelta: finalMomentumDelta,
        tempoResponseFactor: parseFloat(finalTempoRF.toFixed(2)),
        mindsetResponseFactor: parseFloat(finalMindsetRF.toFixed(2)),
        intensityResponseFactor: parseFloat(finalIntensityRF.toFixed(2)),
        fatigueRegenBonus: finalRegenBonus,
        reactionText,
    };
};
// ─── ROZMOWA MOTYWACYJNA TRENERA PRZECIWNIKA ──────────────────────────────────
export const calculateOpponentCoachTalkEffect = (decisionMaking, experience, oppScoreContext, seed) => {
    const rng1 = seededRng(seed, 97);
    const rng2 = seededRng(seed, 98);
    const baseChance = 0.30 + (decisionMaking / 100) * 0.35 + (experience / 100) * 0.20;
    const contextBonus = oppScoreContext === 'LOSING_HIGH' ? 0.10
        : oppScoreContext === 'LOSING_ONE' ? 0.07
            : oppScoreContext === 'DRAW_LOW' || oppScoreContext === 'DRAW_HIGH' ? 0.03
                : 0;
    const finalChance = Math.min(0.90, baseChance + contextBonus);
    const isPositive = rng1 < finalChance;
    const strength = 5 + (decisionMaking / 100) * 10 + (experience / 100) * 8;
    const delta = strength * (rng2 * 0.6 + 0.4);
    return Math.round((isPositive ? delta : -delta * 0.7) * 10) / 10;
};
