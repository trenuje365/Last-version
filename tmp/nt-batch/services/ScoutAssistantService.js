import { MailType, HealthStatus } from '../types';
import { MatchHistoryService } from './MatchHistoryService';
import { TacticRepository } from '../resources/tactics_db';
const ERROR_RATE_LOW = 0.10;
const ERROR_RATE_MID = 0.15;
const ERROR_RATE_HIGH = 0.20;
function maybeDistort(errorRate) {
    return Math.random() < errorRate;
}
// --- MODUŁ 1: Forma przeciwnika ---
function analyzeOpponentForm(opponentId, clubs) {
    const allHistory = MatchHistoryService.getTeamHistory(opponentId);
    const history = allHistory.slice(-5);
    const hasEnoughData = history.length >= 4;
    let wins = 0;
    let draws = 0;
    let losses = 0;
    let totalYellow = 0;
    let totalRed = 0;
    const last5 = history.map(m => {
        const isHome = m.homeTeamId === opponentId;
        const scored = isHome ? m.homeScore : m.awayScore;
        const conceded = isHome ? m.awayScore : m.homeScore;
        const oppId = isHome ? m.awayTeamId : m.homeTeamId;
        const opponentName = clubs?.find(c => c.id === oppId)?.name ?? oppId;
        const result = scored > conceded ? 'W' : scored === conceded ? 'D' : 'L';
        if (result === 'W')
            wins++;
        else if (result === 'D')
            draws++;
        else
            losses++;
        return { date: m.date, opponentName, scored, conceded, result, competition: m.competition };
    });
    allHistory.forEach(m => {
        const teamCards = m.cards.filter(c => c.teamId === opponentId);
        totalYellow += teamCards.filter(c => c.type === 'YELLOW' || c.type === 'SECOND_YELLOW').length;
        totalRed += teamCards.filter(c => c.type === 'RED' || c.type === 'SECOND_YELLOW').length;
    });
    const avgCards = allHistory.length > 0 ? (totalYellow + totalRed * 2) / allHistory.length : 0;
    const brutalityLabel = avgCards >= 4 ? 'Brutalna' : avgCards >= 2.5 ? 'Agresywna' : avgCards >= 1.5 ? 'Umiarkowana' : 'Czysta gra';
    const brutalityColor = avgCards >= 4 ? '#ef4444' : avgCards >= 2.5 ? '#f97316' : avgCards >= 1.5 ? '#fbbf24' : '#34d399';
    const labels = ['Fatalna', 'Słaba', 'Przeciętna', 'Dobra', 'Znakomita'];
    let index = Math.round((wins * 2 + draws) / Math.max(history.length, 1) * 2);
    index = Math.min(4, Math.max(0, index));
    if (maybeDistort(ERROR_RATE_MID)) {
        index = Math.min(4, Math.max(0, index + (Math.random() > 0.5 ? 1 : -1)));
    }
    return { label: labels[index], wins, draws, losses, hasEnoughData, last5, yellowCards: totalYellow, redCards: totalRed, brutalityLabel, brutalityColor };
}
// --- MODUŁ 2: Kluczowi zawodnicy przeciwnika ---
function analyzeKeyPlayers(opponentId, opponentPlayers, opponentLineup) {
    const xi = opponentLineup.startingXI
        .map(id => opponentPlayers.find(p => p.id === id))
        .filter(Boolean);
    const sorted = [...xi].sort((a, b) => b.overallRating - a.overallRating);
    let strongest = sorted[0] ?? null;
    let weakest = sorted[sorted.length - 1] ?? null;
    if (maybeDistort(ERROR_RATE_MID) && sorted.length >= 2)
        strongest = sorted[1];
    if (maybeDistort(ERROR_RATE_MID) && sorted.length >= 2)
        weakest = sorted[sorted.length - 2];
    // Top strzelec — na podstawie statystyk sezonowych zawodnika
    const allOpponentPlayers = opponentPlayers.filter(p => p.stats.goals > 0);
    const topScorerPlayer = [...allOpponentPlayers].sort((a, b) => b.stats.goals - a.stats.goals)[0] ?? null;
    let topScorer = null;
    if (topScorerPlayer) {
        if (maybeDistort(ERROR_RATE_MID)) {
            const secondBest = allOpponentPlayers.sort((a, b) => b.stats.goals - a.stats.goals)[1] ?? topScorerPlayer;
            topScorer = `${secondBest.firstName} ${secondBest.lastName} (${secondBest.stats.goals} gole)`;
        }
        else {
            topScorer = `${topScorerPlayer.firstName} ${topScorerPlayer.lastName} (${topScorerPlayer.stats.goals} gole)`;
        }
    }
    const hasMatchData = opponentPlayers.some(p => p.stats.matchesPlayed > 0);
    return { strongest, weakest, topScorer, hasMatchData };
}
// --- MODUŁ 3: Taktyka przeciwnika ---
function analyzeOpponentTactic(opponentClub, opponentPlayers, opponentLineup) {
    const currentTacticObj = TacticRepository.getById(opponentLineup.tacticId);
    const currentTactic = currentTacticObj?.id ?? opponentLineup.tacticId;
    const unavailable = opponentPlayers.filter(p => p.health.status !== HealthStatus.HEALTHY || p.suspensionMatches > 0);
    const hasCadreProblems = unavailable.length >= 3;
    let predictedTactic = currentTactic;
    if (hasCadreProblems) {
        const tactics = TacticRepository.getAll();
        const alternatives = tactics.filter(t => t.id !== currentTactic);
        const pick = alternatives[Math.floor(Math.random() * alternatives.length)];
        predictedTactic = pick?.id ?? currentTactic;
        if (maybeDistort(ERROR_RATE_MID)) {
            const wrong = alternatives.filter(t => t.id !== predictedTactic);
            predictedTactic = wrong[Math.floor(Math.random() * wrong.length)]?.id ?? predictedTactic;
        }
    }
    return { currentTactic, predictedTactic, hasCadreProblems };
}
// --- MODUŁ 4: Rekomendacja taktyczna ---
const TACTIC_MAP = {
    'ofensywnie': ['4-3-3 Offensive', '4-2-4 Brazilian', '3-4-3 Total'],
    'neutralnie': ['4-4-2 Classic', '4-2-3-1 Wide', '3-5-2 Possession', '4-1-4-1 Control'],
    'defensywnie': ['5-3-2 Fortress', '4-5-1 Park Bus', '6-3-1 Ultra Defensive', '5-4-1 Diamond'],
};
function recommendTacticStyle(userXiRating, opponentXiRating) {
    const diff = userXiRating - opponentXiRating;
    let style;
    if (diff >= 5)
        style = 'ofensywnie';
    else if (diff <= -5)
        style = 'defensywnie';
    else
        style = 'neutralnie';
    if (maybeDistort(ERROR_RATE_LOW)) {
        const options = ['ofensywnie', 'neutralnie', 'defensywnie'];
        const others = options.filter(o => o !== style);
        style = others[Math.floor(Math.random() * others.length)];
    }
    return { style, suggestedTactics: TACTIC_MAP[style] };
}
function suggestRotation(userPlayers, userLineup) {
    const xi = userLineup.startingXI
        .map(id => userPlayers.find(p => p.id === id))
        .filter(Boolean);
    const bench = userLineup.bench
        .map(id => userPlayers.find(p => p.id === id))
        .filter(Boolean);
    // Kto powinien odpocząć: niska kondycja lub wysoki fatigueDebt
    const rest = xi.filter(p => {
        const effectiveCondition = maybeDistort(ERROR_RATE_HIGH) ? p.condition + 15 : p.condition;
        return effectiveCondition < 70 || p.fatigueDebt > 20;
    });
    // Kto powinien grać z ławki: najwyższy OVR wśród zdrowych rezerwowych
    const availableBench = bench.filter(p => p.health.status === HealthStatus.HEALTHY && p.suspensionMatches === 0);
    const play = availableBench
        .sort((a, b) => b.overallRating - a.overallRating)
        .slice(0, rest.length || 1);
    // Budowanie uzasadnienia swapu
    const swaps = rest.map((dropPlayer, i) => {
        const bringPlayer = play[i] ?? null;
        let reason = '';
        if (dropPlayer.condition < 70) {
            reason = ` ${dropPlayer.lastName} ma poważne braki kondycyjne.`;
        }
        else if (dropPlayer.fatigueDebt > 20) {
            reason = `${dropPlayer.lastName} wykazuje wysokie zmęczenie długoterminowe i może się nabawić kontuzji.`;
        }
        else {
            reason = `${dropPlayer.lastName} nie prezentuje optymalnej dyspozycji.`;
        }
        return { drop: dropPlayer, bring: bringPlayer, reason };
    });
    return { rest, play, swaps, isOptimal: rest.length === 0 };
}
// --- MODUŁ 6: Pisemny raport analityczny ---
function generateWrittenReport(params) {
    const { opponentName, form, keyPlayers, tactic, approach, opponentPlayers, opponentLineup, userPlayers, userLineup, userAvgRating, opponentAvgRating } = params;
    const err = () => Math.random() < 0.20;
    const sections = [];
    // === A: FORMA ===
    const totalMatches = form.wins + form.draws + form.losses;
    if (totalMatches === 0) {
        sections.push({ icon: '📊', title: 'Analiza Formy', text: `Brak danych dotyczących formy ${opponentName}. Drużyna nie rozegrała jeszcze żadnego meczu w tej kampanii lub dane nie są dostępne.`, color: '#475569' });
    }
    else if (!form.hasEnoughData) {
        sections.push({ icon: '📊', title: 'Analiza Formy', text: `Zbyt mała liczba rozegranych spotkań (${totalMatches}), by wyciągać definitywne wnioski. Na podstawie dostępnych danych: ${form.wins}W/${form.draws}R/${form.losses}P.`, color: '#f59e0b' });
    }
    else {
        const formLabel = err() ? (['Fatalna', 'Słaba', 'Przeciętna', 'Dobra', 'Znakomita'].filter(l => l !== form.label)[Math.floor(Math.random() * 4)]) : form.label;
        const wPct = Math.round(form.wins / totalMatches * 100);
        const pools = {
            'Znakomita': [
                `${opponentName} prezentuje znakomitą formę. ${wPct}% wygranych mówi samo za siebie. Rywale grają z przekonaniem i determinacją.`,
                `Imponująca skuteczność. ${opponentName} wygrywa systematycznie, a ich pewność siebie jest widoczna w każdym elemencie gry.`,
                `Doskonały bilans — maszyna dobrze naoliwiona. Musimy być gotowi na najwyższy poziom rywalizacji od pierwszej minuty.`,
                `Forma znakomita. ${form.wins} wygrane w ostatnich meczach. Drużyna gra lekko i z dużą pewnością siebie.`,
            ],
            'Dobra': [
                `Solida forma, ${form.wins} wygrane. ${opponentName} gra regularnie i bez wyraźnych kryzysów.`,
                `Dobry dobieg formy, nieregularności minimalne. Liczymy jednak na luki w ich koncentracji w kluczowych momentach.`,
                `Bilans ${form.wins}W/${form.draws}R/${form.losses}P. Drużyna stabilna, choć nie bezbłędna. Szukamy słabych ogniw.`,
                `${opponentName} gra dobrze, choć nie znakomicie. Kilka potknięć w defensywie możemy wykorzystać.`,
            ],
            'Przeciętna': [
                `Forma ${opponentName} nie zachwyca. Wyraźne wahania między spotkaniami. Jeden dzień są groźni, inny słabi.`,
                `Przeciętny bilans. ${form.losses} porażek zdradza strukturalne problemy, które możemy bezwzględnie wykorzystać.`,
                `Niestabilność to ich zmora. Trudno przewidzieć, w jakim stylu wyjdą do meczu. To zarówno ryzyko, jak i szansa.`,
                `${form.wins} wygrane i ${form.losses} porażki w ostatnich meczach. Wyraźny brak regularności. Presja od początku może ich złamać.`,
            ],
            'Słaba': [
                `${opponentName} borykają się z wyraźnym kryzysem. Zaledwie ${form.wins} wygrane. Morale w szatni może być niskie.`,
                `Słaba forma to sygnał problemów systemowych lub kadrowych. Warto to wykorzystać od pierwszej minuty, atakując agresywnie.`,
                `Bilans ${form.wins}W/${form.losses}P przemawia na naszą korzyść. Jeśli od początku wywrzemy presję, efekty powinny przyjść szybko.`,
                `Kryzys w obozie rywala. Tylko ${form.wins} wygrana przy ${form.losses} porażkach więć ta drużyna jest podatna na błędy.`,
            ],
            'Fatalna': [
                `Fatalny dobieg formy — niemal całkowity brak wygranych. ${opponentName} jest w bardzo złym miejscu mentalnie.`,
                `To jest moment gdy kryzys jest widoczny gołym okiem. Nie powinniśmy jednak bagatelizować rywala — zdesperowani potrafią zaskoczyć.`,
                `Tylko ${form.wins} punkt(y) z ostatnich meczów. Drużyna traci pewność siebie i musimy to bezwzględnie wykorzystać.`,
                `Katastrofalny bilans. ${opponentName} jest w spirali porażek ale ich mentalność defensywna może jednak utrudnić nam otwarcie wyniku.`,
            ],
        };
        const pool = pools[formLabel] ?? pools['Przeciętna'];
        const formSwings = (form.wins > 0 && form.losses > 0 && !err()) ? ' Wyraźne wahania formy wskazują na brak powtarzalności.' : '';
        const formColor = formLabel === 'Znakomita' || formLabel === 'Dobra' ? '#10b981' : formLabel === 'Przeciętna' ? '#f59e0b' : '#ef4444';
        sections.push({ icon: '📊', title: 'Analiza Formy', text: pool[Math.floor(Math.random() * pool.length)] + formSwings, color: formColor });
    }
    // === B: ANALIZA KLUCZOWYCH ZAWODNIKÓW ===
    const xi = opponentLineup.startingXI.map(id => opponentPlayers.find(p => p.id === id)).filter(Boolean);
    const attrNames = {
        strength: 'Siła', stamina: 'Wytrzymałość', pace: 'Szybkość', defending: 'Obrona',
        passing: 'Podanie', attacking: 'Atak', finishing: 'Wykończenie', technique: 'Technika',
        vision: 'Wizja gry', dribbling: 'Drybling', heading: 'Górne piłki', positioning: 'Ustawienie',
    };
    const avgRating = (p) => {
        const h = p.stats.ratingHistory;
        return h && h.length >= 5 ? Math.round((h.reduce((s, r) => s + r, 0) / h.length) * 10) / 10 : null;
    };
    const top3Attrs = (p) => Object.entries(p.attributes)
        .filter(([k]) => k !== 'goalkeeping')
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([k, v]) => `${attrNames[k] ?? k} (${v})`).join(', ');
    // --- RYWAL: top 3 z XI — najpierw wg średniej oceny meczowej (≥5 meczów), dopełnienie wg OVR ---
    const xiWithAvg = xi.map(p => ({ p, avg: err() ? null : avgRating(p) })); // 20% szansa że analityk nie ma danych o ocenie
    const xiByAvg = [...xiWithAvg].filter(x => x.avg !== null).sort((a, b) => b.avg - a.avg);
    const xiByOvr = [...xiWithAvg].filter(x => x.avg === null).sort((a, b) => b.p.overallRating - a.p.overallRating);
    const oppTop3Src = [...xiByAvg, ...xiByOvr].slice(0, 3).map(x => x.p);
    // --- NASZ SKŁAD: top 3 z XI wg średniej oceny (≥5 meczów), dopełnienie wg OVR ---
    const userXiLocal = userLineup.startingXI.map(id => userPlayers.find(p => p.id === id)).filter(Boolean);
    const userWithAvg = userXiLocal.map(p => ({ p, avg: avgRating(p) }));
    const userByAvg = [...userWithAvg].filter(x => x.avg !== null).sort((a, b) => b.avg - a.avg);
    const userByOvr = [...userWithAvg].filter(x => x.avg === null).sort((a, b) => b.p.overallRating - a.p.overallRating);
    const userTop3Src = [...userByAvg, ...userByOvr].slice(0, 3).map(x => x.p);
    if (xi.length === 0) {
        sections.push({ icon: '⭐', title: 'Analiza Zawodników', text: 'Brak danych o składzie rywala — nie można przeprowadzić analizy kluczowych zawodników.', color: '#475569' });
    }
    else {
        const fmtOpp = (p) => {
            const avg = avgRating(p);
            const ratingStr = avg !== null ? `, śr. ocena ${avg}` : '';
            return `${p.firstName} ${p.lastName} (OVR ${p.overallRating}${ratingStr}) — atuty: ${top3Attrs(p)}`;
        };
        const fmtUser = (p) => {
            const avg = avgRating(p);
            const ratingStr = avg !== null ? `, śr. ocena ${avg}` : '';
            return `${p.firstName} ${p.lastName} (OVR ${p.overallRating}${ratingStr})`;
        };
        const oppLines = oppTop3Src.map((p, i) => `${i + 1}. ${fmtOpp(p)}`).join('<br>');
        const userLines = userTop3Src.map((p, i) => `${i + 1}. ${fmtUser(p)}`).join('<br>');
        const hasOppRatings = xiByAvg.length > 0;
        const hasUserRatings = userByAvg.length > 0;
        const oppHeader = hasOppRatings
            ? `<b style="color:#f59e0b;">Kluczowi zawodnicy ${opponentName}</b> <span style="opacity:0.6;font-size:11px;">(wg śr. oceny meczowej, min. 5 spotkań)</span>`
            : `<b style="color:#f59e0b;">Kluczowi zawodnicy ${opponentName}</b> <span style="opacity:0.6;font-size:11px;">(wg OVR)</span>`;
        const userHeader = hasUserRatings
            ? `<b style="color:#38bdf8;">Nasi najlepiej dysponowani zawodnicy</b> <span style="opacity:0.6;font-size:11px;">(wg śr. oceny meczowej)</span>`
            : `<b style="color:#38bdf8;">Nasi najsilniejsi zawodnicy</b> <span style="opacity:0.6;font-size:11px;">(wg OVR)</span>`;
        const intros = [
            'Analiza kluczowych zawodników obu drużyn:',
            'Zestawiam indywidualności obu jedenastek:',
            'Mój profil najważniejszych zawodników po obu stronach:',
            'Konfrontuję najlepszych zawodników obu składów:',
            'Poniżej raport zawodników, kluczowych dla tego meczu:',
        ];
        const outro = [
            'Konfrontacja tych graczy wyznaczy indywidualne pojedynki decydujące o losach meczu.',
            'To właśnie te nazwiska będą pod największą lupą przez 90 minut.',
            'Jakość tych zawodników w dużej mierze zdecyduje o przebiegu spotkania.',
            'Ich forma i dyspozycja dnia definiuje nasze priorytety taktyczne.',
        ];
        const text = `${intros[Math.floor(Math.random() * intros.length)]}<br><br>${oppHeader}<br>${oppLines}<br><br>${userHeader}<br>${userLines}<br><br><span style="opacity:0.75;font-style:italic;">${outro[Math.floor(Math.random() * outro.length)]}</span>`;
        sections.push({ icon: '⭐', title: 'Analiza Zawodników', text, color: '#f59e0b' });
    }
    // === C: ANALIZA TAKTYCZNA ===
    const tacticPools = [
        `Najprawdopodobniej wyjdą w ustawieniu ${tactic.currentTactic}.${tactic.hasCadreProblems ? ` Ze względu na braki kadrowe możliwa zmiana na ${tactic.predictedTactic}.` : ' Formacja stabilna i dobrze przez nich opanowana.'}`,
        `Ich bazowa taktyka to ${err() ? tactic.predictedTactic : tactic.currentTactic}. ${tactic.hasCadreProblems ? `Braki kadrowe mogą wymusić przestawienie na ${tactic.predictedTactic}.` : 'Na zmiany nie ma podstaw — skład pełen.'}`,
        `Analiza wskazuje na ${tactic.currentTactic} jako preferowane ustawienie. ${tactic.hasCadreProblems ? 'Jednak problemy kadrowe mogą wywrócić plany taktyczne.' : 'Nie spodziewamy się niespodzianek w formacji.'}`,
        `Rywal gra systemem ${tactic.currentTactic} — formacja wymagająca, ale przewidywalna. ${tactic.hasCadreProblems ? `Z powodu kontuzji i zawieszeń możliwe przestawienie na ${tactic.predictedTactic}.` : 'Kadra pełna, więc nie oczekujemy improwiazji.'}`,
    ];
    sections.push({ icon: '🗂️', title: 'Analiza Taktyczna', text: tacticPools[Math.floor(Math.random() * tacticPools.length)], color: '#a78bfa' });
    // === D: PORÓWNANIE SIŁ — SYSTEM PUNKTOWY ATRYBUT PO ATRYBUCIE ===
    const userXi = userLineup.startingXI.map(id => userPlayers.find(p => p.id === id)).filter(Boolean);
    // 12 atrybutów (bez bramkarstwa)
    const ATTRS = ['strength', 'stamina', 'pace', 'defending', 'passing', 'attacking', 'finishing', 'technique', 'vision', 'dribbling', 'heading', 'positioning'];
    const ATTR_PL = {
        strength: 'Siła', stamina: 'Wytrzymałość', pace: 'Szybkość', defending: 'Obrona',
        passing: 'Podanie', attacking: 'Atak', finishing: 'Wykończenie', technique: 'Technika',
        vision: 'Wizja', dribbling: 'Drybling', heading: 'Górna piłka', positioning: 'Ustawienie',
    };
    // Podział na sektory na bazie atrybutów
    const isGK = (p) => p.attributes.goalkeeping >= 60;
    const isDef = (p) => !isGK(p) && p.attributes.defending >= p.attributes.finishing && p.attributes.defending >= p.attributes.attacking;
    const isMid = (p) => !isGK(p) && !isDef(p) && (p.attributes.vision + p.attributes.passing) >= (p.attributes.finishing + p.attributes.attacking);
    const isAtt = (p) => !isGK(p) && !isDef(p) && !isMid(p);
    // Fallback: thirds wg OVR gdy sektor pusty
    const splitThirds = (players) => {
        const nk = [...players].filter(p => !isGK(p)).sort((a, b) => a.overallRating - b.overallRating);
        const n = nk.length;
        const t1 = Math.floor(n / 3);
        const t2 = Math.floor(2 * n / 3);
        return [nk.slice(0, t1), nk.slice(t1, t2), nk.slice(t2)];
    };
    let oppDef = xi.filter(isDef);
    let oppMid = xi.filter(isMid);
    let oppAtt = xi.filter(isAtt);
    let userDef = userXi.filter(isDef);
    let userMid = userXi.filter(isMid);
    let userAtt = userXi.filter(isAtt);
    if (oppDef.length === 0 || oppMid.length === 0 || oppAtt.length === 0)
        [oppDef, oppMid, oppAtt] = splitThirds(xi);
    if (userDef.length === 0 || userMid.length === 0 || userAtt.length === 0)
        [userDef, userMid, userAtt] = splitThirds(userXi);
    // Funkcja: dla danej grupy zawodników sumuje każdy atrybut, zwraca Record<attr, suma>
    const sumAttrs = (players) => {
        const out = {};
        for (const attr of ATTRS)
            out[attr] = players.reduce((s, p) => s + (p.attributes[attr] ?? 0), 0);
        return out;
    };
    // Funkcja: porównuje dwa RecordAttr, zwraca { usrPts, oppPts, details }
    const compareAttrs = (usr, opp, applyFuzz = false) => {
        let usrPts = 0;
        let oppPts = 0;
        const wins = [];
        const losses = [];
        for (const attr of ATTRS) {
            const u = usr[attr];
            const o = applyFuzz && err() ? opp[attr] + Math.floor(Math.random() * 4 - 2) : opp[attr];
            if (u > o) {
                usrPts++;
                wins.push(ATTR_PL[attr]);
            }
            else if (o > u) {
                oppPts++;
                losses.push(ATTR_PL[attr]);
            }
        }
        return { usrPts, oppPts, wins, losses };
    };
    const sectorWins = []; // 1 = my wygrali, 0 = oni
    let strengthText;
    if (xi.length < 5 || userXi.length < 5) {
        strengthText = 'Brak wystarczających danych o składach do przeprowadzenia rzetelnej analizy porównawczej.';
    }
    else {
        // --- SEKTOR: OBRONA (nasi obrońcy vs ich obrońcy) ---
        const defCmp = compareAttrs(sumAttrs(userDef), sumAttrs(oppDef), true);
        const defOurWin = defCmp.usrPts > defCmp.oppPts;
        const defTie = defCmp.usrPts === defCmp.oppPts;
        sectorWins.push(defOurWin ? 1 : 0);
        const defMargin = Math.abs(defCmp.usrPts - defCmp.oppPts);
        const defNote = defTie
            ? `Linie obrony obu drużyn prezentują niemal identyczny poziom. Bilans atrybutów jest wyrównany, a wynik rozstrzygnie się dyscypliną taktyczną, nie talentem indywidualnym.`
            : defOurWin
                ? defMargin >= 5
                    ? `Nasza obrona wyraźnie dominuje nad ich defensywą. Zdecydowanie wygrywamy ten sektor, przede wszystkim dzięki: ${defCmp.wins.slice(0, 4).join(', ')}. To najsilniejsza linia naszego składu.`
                    : `Nasza defensywa jest lepsza od ich linii obronnej. Nieduża, lecz wymierna przewaga widoczna głównie w: ${defCmp.wins.slice(0, 3).join(', ')}.`
                : defMargin >= 5
                    ? `Ich obrona zdecydowanie góruje nad naszą defensywą. Rywal bije nas w tym sektorze atrybutowo. Newralgiczne braki: ${defCmp.losses.slice(0, 3).join(', ')}.`
                    : `Ich linia obrony jest lepiej zbudowana od naszej. Tracimy przede wszystkim w: ${defCmp.losses.slice(0, 3).join(', ')}.`;
        // --- SEKTOR: POMOC (nasza pomoc vs ich pomoc) ---
        const midCmp = compareAttrs(sumAttrs(userMid), sumAttrs(oppMid), true);
        const midOurWin = midCmp.usrPts > midCmp.oppPts;
        const midTie = midCmp.usrPts === midCmp.oppPts;
        sectorWins.push(midOurWin ? 1 : 0);
        const midMargin = Math.abs(midCmp.usrPts - midCmp.oppPts);
        const midNote = midTie
            ? `Linie pomocy obu drużyn są zbliżone jakościowo. W środku pola rozstrzygnie intensywność i organizacja taktyczna.`
            : midOurWin
                ? midMargin >= 5
                    ? `Nasza pomoc wyraźnie góruje w środku pola. Kontrola gry powinna należeć do nas, szczególnie w aspekcie: ${midCmp.wins.slice(0, 4).join(', ')}.`
                    : `Nasza linia środkowa jest nieco lepsza od ich pomocy. Środek pola leży po naszej stronie dzięki: ${midCmp.wins.slice(0, 3).join(', ')}.`
                : midMargin >= 5
                    ? `Ich pomoc wyraźnie dominuje w środku boiska. Rywal kontroluje tę strefę atrybutowo. Kluczowe obszary przewagi rywala: ${midCmp.losses.slice(0, 3).join(', ')}.`
                    : `Ich linia środkowa jest nieco silniejsza od naszej. Tracimy przede wszystkim w: ${midCmp.losses.slice(0, 3).join(', ')}.`;
        // --- SEKTOR: ATAK (nasz atak vs ich atak) ---
        const attCmp = compareAttrs(sumAttrs(userAtt), sumAttrs(oppAtt), true);
        const attOurWin = attCmp.usrPts > attCmp.oppPts;
        const attTie = attCmp.usrPts === attCmp.oppPts;
        sectorWins.push(attOurWin ? 1 : 0);
        const attMargin = Math.abs(attCmp.usrPts - attCmp.oppPts);
        const attNote = attTie
            ? `Linie ataku obu drużyn prezentują zbliżony poziom. W ofensywie decydować będzie skuteczność indywidualnych akcji i dyspozycja dnia.`
            : attOurWin
                ? attMargin >= 5
                    ? `Nasz atak zdecydowanie przewyższa ich ofensywę. Wygrywamy ten sektor wyraźnie, przede wszystkim w zakresie: ${attCmp.wins.slice(0, 4).join(', ')}. To nasza najostrzejsza broń.`
                    : `Nasz atak jest lepszy od ich formacji ofensywnej. Dominujemy w: ${attCmp.wins.slice(0, 3).join(', ')}.`
                : attMargin >= 5
                    ? `Ich atak wyraźnie przewyższa naszą ofensywę. Musimy zamknąć strefy, szczególnie w aspektach: ${attCmp.losses.slice(0, 3).join(', ')}.`
                    : `Ich atak jest nieco lepszy od naszej linii ofensywnej. Brakuje nam przede wszystkim w: ${attCmp.losses.slice(0, 3).join(', ')}.`;
        // Globalny wniosek z sumy wygranych sektorów
        const totalWins = sectorWins.filter(v => v === 1).length;
        const overall = totalWins === 3
            ? 'Wygrywamy we wszystkich trzech sektorach. Jesteśmy wyraźnym faworytem tego spotkania i musimy to bezdyskusyjnie pokazać na boisku.'
            : totalWins === 2
                ? 'Wygrywamy w dwóch z trzech sektorów. Posiadamy realną i udowodnioną przewagę atrybutową. Egzekwujmy ją przez całe 90 minut.'
                : totalWins === 1
                    ? 'Rywal wygrywa dwa z trzech sektorów. Jesteśmy stroną statystycznie słabszą. Każdy błąd będzie kosztowny.'
                    : 'Rywal wygrywa we wszystkich trzech sektorach. Dane mówią jednoznacznie. Maksymalna dyscyplina to nasz jedyny klucz do pozytywnego wyniku.';
        const intro = [
            'Wg. mojej analizy atrybutowej',
            'Analiza sektorów boiska',
            'Z mojej perspektywy sytuacja wygląda następująco',
            'Na podstawie zebranych danych o drużynie przeciwnej.',
        ][Math.floor(Math.random() * 4)];
        strengthText = `${intro}<br><br><b></b> ${defNote}<br><br><b></b> ${midNote}<br><br><b></b> ${attNote}<br><br><i>${overall}</i>`;
    }
    sections.push({ icon: '', title: 'Analiza Sektorów', text: strengthText, color: sectorWins.filter(v => v === 1).length >= 2 ? '#10b981' : '#ef4444' });
    // === E: SKUTECZNOŚĆ STRZELECKA ===
    if (totalMatches === 0) {
        sections.push({ icon: '⚽', title: 'Skuteczność Strzelecka', text: 'Brak danych, gdyż drużyna nie rozegrała jeszcze żadnego spotkania w tych rozgrywkach.', color: '#475569' });
    }
    else {
        const totalGoals = form.last5.reduce((s, m) => s + m.scored, 0);
        const avgGoals = (totalGoals / Math.max(form.last5.length, 1));
        const avgGoalsDisplay = err() ? (avgGoals + (Math.random() * 0.4 - 0.2)) : avgGoals;
        const goalPools = [
            `Średnia bramek zdobytych: ${avgGoalsDisplay.toFixed(1)} na mecz.`,
            `W ostatnich spotkaniach strzelali średnio ${avgGoalsDisplay.toFixed(1)} gola na mecz.`,
            `Skuteczność ofensywna: ${avgGoalsDisplay.toFixed(1)} bramki na spotkanie to wartość warta uwagi.`,
        ];
        let scorerInfo = '';
        if (keyPlayers.topScorer) {
            const scorerPools = [
                ` Szczególną uwagę należy zwrócić na ${keyPlayers.topScorer} to ich najgroźniejsza broń ofensywna.`,
                ` Największe zagrożenie stwarza ${keyPlayers.topScorer}. Krycie tego gracza będzie priorytetem defensywnym.`,
                ` ${keyPlayers.topScorer} prowadzi klasyfikację strzelców i tylko jego neutralizacja to klucz do czystego konta.`,
                ` Na czele strzelców stoi ${keyPlayers.topScorer}. Nasza obrona musi go obserwować przez całe 90 minut.`,
            ];
            scorerInfo = scorerPools[Math.floor(Math.random() * scorerPools.length)];
        }
        else {
            scorerInfo = ' Brak dominującego snajpera — zagrożenie rozłożone jest między kilku zawodników.';
        }
        sections.push({ icon: '⚽', title: 'Skuteczność Strzelecka', text: goalPools[Math.floor(Math.random() * goalPools.length)] + scorerInfo, color: '#fb923c' });
    }
    // === F: REKOMENDACJA TAKTYCZNA OPARTA NA ANALIZIE SEKTOROWEJ ===
    const userUnavail = userPlayers.filter(p => p.health.status !== HealthStatus.HEALTHY || p.suspensionMatches > 0);
    const userLowCond = userXi.filter(p => p.condition < 70 || p.fatigueDebt > 20);
    const allTactics = TacticRepository.getAll();
    const defW = sectorWins[0] === 1;
    const midW = sectorWins[1] === 1;
    const attW = sectorWins[2] === 1;
    const totalW = sectorWins.filter(v => v === 1).length;
    let tacRec;
    if (totalW === 3) {
        const choices = [
            { id: '4-3-3', rationale: 'Wygrywamy wszystkie trzy sektory atrybutowo. Wysokie pressowanie z trójką napastników pozwala natychmiast zamieniać odbiory piłki w groźne akcje ofensywne. Rywal nie ma zasobów, by nam w żadnej linii dorównać.', style: 'atak' },
            { id: '3-4-3', rationale: 'Dominujemy atrybutowo we wszystkich liniach jednocześnie. Trójka napastników i szeroka pomoc to formacja, która zmaksymalizuje nasz potencjał i zasypie rywala atakami ze wszystkich stron.', style: 'atak' },
            { id: '4-2-4', rationale: 'Pełna dominacja atrybutowa uzasadnia totalne przejście do ataku. Czterech napastników to ekstremalne ryzyko, ale rywal nie ma siły, by nam dorównać w żadnym z trzech sektorów.', style: 'atak' },
        ];
        tacRec = choices[Math.floor(Math.random() * choices.length)];
    }
    else if (totalW === 2) {
        if (defW && midW) {
            tacRec = { id: '4-2-3-1', rationale: 'Silna obrona i kontrola środka pola to nasz fundament. Podwójna szóstka i CAM za napastnikiem dają bezpieczną strukturę oraz skuteczne wyjście do ataku przez skrzydła. Gramy z inicjatywą, ale nie ryzykujemy defensywy.', style: 'balans' };
        }
        else if (defW && attW) {
            tacRec = { id: '4-4-2-OFF', rationale: 'Wygrywamy z tyłu i z przodu. Ofensywne 4-4-2 z wysuniętymi skrzydłowymi zmaksymalizuje nasz potencjał ofensywny. Defensywa jest solidna, więc możemy grać odważnie i bez asekuracji.', style: 'atak' };
        }
        else {
            // midW && attW
            tacRec = { id: '3-4-2-1', rationale: 'Dominujemy w pomocy i ataku. Trzej obrońcy z wahadłowymi dają szerokie korytarze, a dwaj wpinający się CAM-owie z jednym napastnikiem tworzą gęsty, kombinacyjny atak trudny do zablokowania.', style: 'atak' };
        }
    }
    else if (totalW === 1) {
        if (defW) {
            tacRec = { id: '5-2-1-2', rationale: 'Nasza defensywa to jedyna wyraźna atrybutowa przewaga. Pionowy kontratak z pięcioma obrońcami i CAM-em łączącym linie to optymalne podejście. Bronimy się głęboko, zamykamy przestrzenie i szukamy okazji do precyzyjnych kontrataków pionową piłką na dwóch napastników.', style: 'kontra' };
        }
        else if (midW) {
            tacRec = { id: '4-1-4-1', rationale: 'Środek pola jest naszą atrybutową przewagą. Anchor i czterech pomocników z szerokim ustawieniem pozwala kontrolować tempo meczu. Cierpliwie budujemy akcje i szukamy okazji, minimalizując ryzyko straty w defensywie.', style: 'balans' };
        }
        else {
            // attW only
            tacRec = { id: '4-4-2-DIAMOND', rationale: 'Nasz atak ma atrybutową przewagę nad rywalem. Diament w środku pola przyspiesza dynamiczne przejścia do ofensywy. Element zaskoczenia jest po naszej stronie — rywal może nie być gotowy na tempo naszego uderzenia.', style: 'balans' };
        }
    }
    else {
        // totalW === 0
        const choices = [
            { id: '6-3-1', rationale: 'Rywal bije nas atrybutowo w każdym z trzech sektorów. Sześciu obrońców i samotny napastnik to nasza jedyna szansa na zdobycie punktów. Parkujemy autobus, eliminujemy ryzyko i szukamy jednej kontry, która może zmienić los meczu.', style: 'obrona' },
            { id: '5-3-2', rationale: 'Dane są jednoznaczne: rywal góruje wszędzie. Forteca z pięcioma obrońcami tworzy zwarty blok uniemożliwiający swobodną grę rywala. Dwaj szybcy napastnicy mogą zaskoczyć jedną precyzyjną kontrą.', style: 'obrona' },
            { id: '5-2-1-2', rationale: 'Atrybutowa przewaga rywala we wszystkich liniach wymaga maksymalnego skupienia defensywnego. Kontratakujące 5-2-1-2 minimalizuje ryzyko, dając jednocześnie realną szansę na niespodziewany cios pionową piłką przez CAM-a.', style: 'kontra' },
        ];
        tacRec = choices[Math.floor(Math.random() * choices.length)];
    }
    const recTactic = TacticRepository.getById(tacRec.id);
    const categoryMap = {
        'Neutral': 'Zrównoważona', 'Offensive': 'Ofensywna', 'Defensive': 'Defensywna',
        'Ultra-Offensive': 'Ultra-ofensywna', 'Park Bus': 'Parking autobusu', 'Technical': 'Techniczna',
        'Possession': 'Posiadanie piłki', 'Counter': 'Kontratak',
    };
    const styName = { atak: '⚔️ Ofensywna', kontra: '🔄 Kontratak', balans: '⚖️ Zrównoważona', obrona: '🛡️ Defensywna' };
    const altTactics = allTactics
        .filter(t => t.id !== tacRec.id)
        .filter(t => {
        if (tacRec.style === 'atak')
            return t.attackBias >= 70;
        if (tacRec.style === 'obrona')
            return t.defenseBias >= 80;
        if (tacRec.style === 'kontra')
            return t.defenseBias >= 70 && t.attackBias <= 55;
        return t.attackBias >= 50 && t.attackBias <= 70 && t.defenseBias >= 50;
    })
        .slice(0, 2)
        .map(t => `<b>${t.name}</b> (Atak ${t.attackBias}, Obrona ${t.defenseBias})`).join(', ');
    const condNote = userUnavail.length > 0
        ? `<br><span style="color:#f59e0b;font-size:12px;">⚠️ ${userUnavail.length} zawodnik(ów) niedostępnych. Przed meczem wymagana korekta składu.</span>`
        : '';
    const condLowNote = userLowCond.length > 0
        ? `<br><span style="color:#94a3b8;font-size:12px;">📉 ${userLowCond.length} zawodnik(ów) z obniżoną kondycją i musimy rozważyć rotację w wyjściowym składzie.</span>`
        : '';
    const recText = `<b style="color:#a78bfa;">${styName[tacRec.style]}: ${recTactic.name}</b><br><span style="opacity:0.65;font-size:11px;">Kategoria: ${categoryMap[recTactic.category] ?? recTactic.category} &nbsp;|&nbsp; Pressing: ${recTactic.pressingIntensity}/100 &nbsp;|&nbsp; Atak: ${recTactic.attackBias}/100 &nbsp;|&nbsp; Obrona: ${recTactic.defenseBias}/100</span><br><br>${tacRec.rationale}<br><br><span style="opacity:0.7;font-size:12px;">Alternatywne formacje w tej kategorii: ${altTactics || 'brak w tej kategorii'}</span>${condNote}${condLowNote}`;
    sections.push({ icon: '💡', title: 'Rekomendacja Taktyczna', text: recText, color: tacRec.style === 'atak' ? '#ef4444' : tacRec.style === 'obrona' ? '#60a5fa' : tacRec.style === 'kontra' ? '#a78bfa' : '#10b981' });
    // === G: KADRA RYWALA ===
    const oppUnavail = opponentPlayers.filter(p => p.health.status !== HealthStatus.HEALTHY || p.suspensionMatches > 0);
    const oppInjured = opponentPlayers.filter(p => p.health.status !== HealthStatus.HEALTHY);
    const oppSuspended = opponentPlayers.filter(p => p.suspensionMatches > 0);
    if (oppUnavail.length === 0) {
        const fullSquadPools = [
            `${opponentName} wyjdzie na to spotkanie w pełnym składzie. W ich drużynie nie ma żadnych kontuzji oraz zawieszeń. Przed nami rywal dysponujący maksymalnym potencjałem kadrowym.`,
            `Analiza medyczna potwierdza: kadra ${opponentName} jest kompletna. Trener ma wolną rękę przy wyborze jedenastki i to będzie istotna przewaga po ich stronie.`,
            `Pełna dyspozycyjność całego składu rywala. Bez zawieszonych i bez kontuzjowanych ${opponentName} zagra najmocniejszym możliwym zestawieniem. Nie spodziewajmy się niespodzianek w ich wyjściowej jedenastce.`,
            `Kadrowo ${opponentName} nie ma żadnych problemów. Kompletna jednostka w pełni gotowa do rywalizacji, to mocna drużyna bez żadnych wymuszonych improwiazji.`,
            `Raport medyczno-dyscyplinarny: zero niedostępnych zawodników po stronie rywala. ${opponentName} wystawia pełen skład z maksymalną siłą ognia więc musimy być na to przygotowani.`,
            `Pełnia kadrowa po stronie ${opponentName}. Żaden kluczowy zawodnik nie pauzuje ani nie jest kontuzjowany także na pewno wystąpią w najsilniejszym składzie.`,
        ];
        sections.push({ icon: '🩹', title: 'Kadra Rywala', text: fullSquadPools[Math.floor(Math.random() * fullSquadPools.length)], color: '#ef4444' });
    }
    else if (oppUnavail.length === 1) {
        const p = oppUnavail[0];
        const reason = p.health.status !== HealthStatus.HEALTHY ? 'kontuzjowany' : `zawieszony (${p.suspensionMatches} mecz)`;
        const oneOutPools = [
            `${opponentName} traci jednego zawodnika ${p.firstName} ${p.lastName} jest ${reason}. To ograniczone osłabienie, ale przy odpowiednim ustawieniu możemy to rozegrać na naszą korzyść.`,
            `Jedyna nieobecność w szeregach rywala to ${p.lastName} (${reason}). Jego brak może być odczuwalny, choć ${opponentName} ma możliwości, by to zaadresować rotacją.`,
            `${p.firstName} ${p.lastName} (${reason}) nie wystąpi. To jedyne zmartwienie kadrowe ${opponentName}. Drużyna jest bliska pełnej gotowości.`,
        ];
        sections.push({ icon: '🩹', title: 'Kadra Rywala', text: oneOutPools[Math.floor(Math.random() * oneOutPools.length)], color: '#f59e0b' });
    }
    else {
        const injNames = oppInjured.slice(0, 3).map(p => `${p.firstName} ${p.lastName}`).join(', ');
        const susNames = oppSuspended.slice(0, 2).map(p => `${p.firstName} ${p.lastName}`).join(', ');
        const weakPools = [
            `${opponentName} boryka się z poważnymi problemami kdrowym — ${oppUnavail.length} zawodników niedostępnych.${oppInjured.length > 0 ? ` Kontuzjowani: ${injNames}.` : ''}${oppSuspended.length > 0 ? ` Zawieszeni: ${susNames}.` : ''} Te braki mogą wymusić zmiany w formacji i sposób gry.`,
            `Kadrowo rywal jest wyraźnie osłabiony — ${oppUnavail.length} niedostępnych.${oppInjured.length > 0 ? ` Urazów nabrali m.in.: ${injNames}.` : ''}${oppSuspended.length > 0 ? ` Kartki wyeliminowały: ${susNames}.` : ''} Powinniśmy bezwzględnie to wykorzystać, atakując ich słabsze ogniwa.`,
            `Problemy zdrowotno-dyscyplinarne w obozie ${opponentName}: łącznie ${oppUnavail.length} zawodników poza grą.${oppInjured.length > 0 ? ` Na liście kontuzjowanych figuruje m.in. ${injNames}.` : ''}${oppSuspended.length > 0 ? ` Zawieszenie odbywa ${susNames}.` : ''} Trener rywala będzie zmuszony do improwizacji.`,
            `${opponentName} wchodzi w mecz mocno zdziesiątkowany: ${oppUnavail.length} absencji.${oppInjured.length > 0 ? ` Nieobecni z powodu kontuzji: ${injNames}.` : ''}${oppSuspended.length > 0 ? ` Zawodnicy odbywający zawieszenie: ${susNames}.` : ''} To dla nas realna szansa na dyktowanie warunków gry.`,
            `Analiza dostępności: rywal traci ${oppUnavail.length} zawodników.${oppInjured.length > 0 ? ` Urazy wykluczyły m.in. ${injNames}.` : ''}${oppSuspended.length > 0 ? ` Kartki zatrzymały ${susNames}.` : ''} Przy takiej liczbie absencji ich mapa przygotowań taktycznych jest mocno ograniczona.`,
        ];
        sections.push({ icon: '🩹', title: 'Kadra Rywala', text: weakPools[Math.floor(Math.random() * weakPools.length)], color: '#10b981' });
    }
    return sections;
}
// --- BUDOWA TREŚCI MAILA (HTML) ---
function buildMailBody(params) {
    const { opponentName, managerName, form, keyPlayers, tactic, approach, rotation, opponentLeaguePosition, opponentLeaguePoints, opponentLeagueGoalDiff, leagueName, opponentPrimaryColor, opponentSecondaryColor, opponentPlayers, opponentLineup, userPlayers, userLineup, userAvgRating, opponentAvgRating } = params;
    // ── STYLE TOKENS (matching game's design language) ─────────────────────
    const FONT = `'Inter', system-ui, sans-serif`;
    const cardBg = `background:rgba(15,23,42,0.45);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.10);box-shadow:0 20px 40px rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,255,255,0.08)`;
    const label = (color = '#3b82f6') => `font-family:${FONT};font-size:12px;font-weight:900;font-style:italic;letter-spacing:0.3em;text-transform:uppercase;color:${color};margin-bottom:12px;display:block;`;
    const bigTitle = `font-family:${FONT};font-weight:900;font-style:italic;text-transform:uppercase;letter-spacing:-0.04em;color:#f8fafc;`;
    const mono = `font-family:${FONT};font-weight:900;font-style:italic;text-transform:uppercase;letter-spacing:0.02em;`;
    // ── GLASS CARD ────────────────────────────────────────────────────────────
    const card = (accent, labelText, content, extra = '') => `<div style="${cardBg};border-radius:24px;padding:30px 34px;flex:1;min-width:0;position:relative;overflow:hidden;${extra}">
      <div style="position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,${accent},transparent);border-radius:24px 24px 0 0;"></div>
      <div style="position:absolute;top:-40px;right:-40px;width:140px;height:140px;border-radius:50%;background:${accent};filter:blur(70px);opacity:0.12;pointer-events:none;"></div>
      <span style="${label(accent)}">${labelText}</span>
      ${content}
    </div>`;
    // ── STAT ROW ──────────────────────────────────────────────────────────────
    const statRow = (lbl, val, vc = '#f8fafc') => `<div style="display:flex;justify-content:space-between;align-items:center;padding:14px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
      <span style="font-family:${FONT};color:#64748b;font-size:14px;font-weight:700;font-style:italic;text-transform:uppercase;letter-spacing:0.12em;">${lbl}</span>
      <span style="font-family:${FONT};color:${vc};font-size:19px;font-weight:900;font-style:italic;letter-spacing:0.02em;">${val}</span>
    </div>`;
    // ── MINI CHIP ─────────────────────────────────────────────────────────────
    const chip = (t, bg, c) => `<span style="font-family:${FONT};background:${bg};color:${c};font-size:15px;font-weight:900;font-style:italic;text-transform:uppercase;letter-spacing:0.06em;padding:6px 16px;border-radius:20px;display:inline-block;margin:3px 4px 3px 0;border:1px solid ${c}22;">${t}</span>`;
    // ── SVG DONUT PIE ─────────────────────────────────────────────────────────
    const pieSvg = (w, d, l) => {
        const total = w + d + l;
        if (total === 0)
            return `<svg width="120" height="120" viewBox="0 0 120 120"><circle cx="60" cy="60" r="38" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="22"/><text x="60" y="65" text-anchor="middle" fill="#334155" font-family="Inter,sans-serif" font-size="10" font-weight="700" font-style="italic">—</text></svg>`;
        const R = 38;
        const cx = 60;
        const cy = 60;
        const arc = (sa, ea, color) => {
            const gap = 0.06;
            const s = sa + gap;
            const e = ea - gap;
            if (e <= s)
                return '';
            const x1 = cx + R * Math.cos(s - Math.PI / 2);
            const y1 = cy + R * Math.sin(s - Math.PI / 2);
            const x2 = cx + R * Math.cos(e - Math.PI / 2);
            const y2 = cy + R * Math.sin(e - Math.PI / 2);
            return `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)} A${R} ${R} 0 ${(e - s) > Math.PI ? 1 : 0} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}" stroke="${color}" stroke-width="22" fill="none" stroke-linecap="round"/>`;
        };
        const wA = (w / total) * 2 * Math.PI, dA = (d / total) * 2 * Math.PI, lA = (l / total) * 2 * Math.PI;
        const pct = Math.round(w / total * 100);
        return `<svg width="120" height="120" viewBox="0 0 120 120" style="flex-shrink:0;display:block;">
      <circle cx="60" cy="60" r="38" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="22"/>
      ${arc(0, wA, '#10b981')}${arc(wA, wA + dA, '#f59e0b')}${arc(wA + dA, wA + dA + lA, '#ef4444')}
      <text x="60" y="60" text-anchor="middle" fill="#f8fafc" font-family="Inter,sans-serif" font-size="11" font-weight="900" font-style="italic">${pct}%</text>
    </svg>`;
    };
    // ── FORMA ─────────────────────────────────────────────────────────────────
    const formColor = !form.hasEnoughData ? '#475569'
        : form.label === 'Znakomita' || form.label === 'Dobra' ? '#10b981'
            : form.label === 'Przeciętna' ? '#f59e0b' : '#ef4444';
    const _formTotal = (form.wins + form.draws + form.losses) || 1;
    const _wPct = Math.round(form.wins / _formTotal * 100);
    const _dPct = Math.round(form.draws / _formTotal * 100);
    const _lPct = Math.round(form.losses / _formTotal * 100);
    const formaCard = card('#f59e0b', 'FORMA - OSTATNIE 5 MECZÓW', `<div style="display:flex;flex-direction:column;align-items:center;gap:16px;margin-bottom:16px;">
       ${pieSvg(form.wins, form.draws, form.losses)}
       <div style="width:100%;">
         <div style="${bigTitle}font-size:30px;color:${formColor};line-height:1;margin-bottom:16px;text-align:center;">${form.hasEnoughData ? form.label : '—'}</div>
         <div style="display:flex;flex-direction:column;gap:10px;">
           <div style="display:flex;align-items:center;gap:10px;">
             <div style="${label('#10b981')}margin:0;min-width:14px;text-align:right;font-size:11px;">W</div>
             <div style="flex:1;background:rgba(255,255,255,0.06);border-radius:5px;height:18px;overflow:hidden;">
               <div style="height:100%;width:${_wPct}%;background:linear-gradient(90deg,#10b981,#34d399);border-radius:5px;transition:width 0.3s;"></div>
             </div>
             <div style="${mono}color:#10b981;font-size:18px;min-width:22px;text-align:right;">${form.wins}</div>
           </div>
           <div style="display:flex;align-items:center;gap:10px;">
             <div style="${label('#f59e0b')}margin:0;min-width:14px;text-align:right;font-size:11px;">R</div>
             <div style="flex:1;background:rgba(255,255,255,0.06);border-radius:5px;height:18px;overflow:hidden;">
               <div style="height:100%;width:${_dPct}%;background:linear-gradient(90deg,#f59e0b,#fbbf24);border-radius:5px;transition:width 0.3s;"></div>
             </div>
             <div style="${mono}color:#f59e0b;font-size:18px;min-width:22px;text-align:right;">${form.draws}</div>
           </div>
           <div style="display:flex;align-items:center;gap:10px;">
             <div style="${label('#ef4444')}margin:0;min-width:14px;text-align:right;font-size:11px;">P</div>
             <div style="flex:1;background:rgba(255,255,255,0.06);border-radius:5px;height:18px;overflow:hidden;">
               <div style="height:100%;width:${_lPct}%;background:linear-gradient(90deg,#ef4444,#f87171);border-radius:5px;transition:width 0.3s;"></div>
             </div>
             <div style="${mono}color:#ef4444;font-size:18px;min-width:22px;text-align:right;">${form.losses}</div>
           </div>
         </div>
       </div>
     </div>`, 'align-self:start;flex:none;width:320px;height:370px;padding:16px 20px;overflow:hidden;box-sizing:border-box;');
    // ── TAKTYKA WIZUALNA — replika MatchLiveViewPolishCupSimulation.tsx ─────
    const renderFormation = (tacticId, kitPrimary, kitSecondary) => {
        const matchF = tacticId.match(/(\d[\d-]+\d)/);
        const formationStr = matchF ? matchF[1] : '4-4-2';
        const lines = formationStr.split('-').map(Number);
        // ── Exact jersey SVG from MatchLiveViewPolishCupSimulation.tsx (BigJerseyIcon) ──
        const jersey = (primary, secondary, size = 20) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="${primary}" style="display:block;filter:drop-shadow(0 1px 3px rgba(0,0,0,0.7));">
        <path d="M7 2L2 5v4l3 1v10h14V10l3-1V5l-5-3-2 2-2-2-2 2-2-2z"/>
        <path d="M12 4L10 6L12 8L14 6L12 4Z" fill="${secondary}" fill-opacity="0.6"/>
      </svg>`;
        // ── Player percentage positions (bottom = GK, top = forwards) ──
        const gkYPct = 88;
        const topYPct = 11;
        const fieldH = gkYPct - 14 - topYPct;
        const lineSp = fieldH / Math.max(lines.length, 1);
        let playerHtml = `<div style="position:absolute;left:50%;top:${gkYPct}%;transform:translate(-50%,-50%);z-index:20;">${jersey('#f59e0b', '#78350f', 28)}</div>`;
        lines.forEach((count, idx) => {
            const y = gkYPct - 14 - idx * lineSp;
            for (let p = 0; p < count; p++) {
                const x = (100 / (count + 1)) * (p + 1);
                playerHtml += `<div style="position:absolute;left:${x.toFixed(1)}%;top:${y.toFixed(1)}%;transform:translate(-50%,-50%);z-index:20;">${jersey(kitPrimary, kitSecondary, 26)}</div>`;
            }
        });
        // ── Line helper ──
        const LC = 'rgba(255,255,255,0.7)'; // matches border-white/70 in game
        const LW = '2px';
        const ld = (s) => `<div style="position:absolute;${s}"></div>`;
        const linesHtml = [
            // Outer boundary — matches 'absolute inset-4 border-2 border-white/70' (inset via top/left/right/bottom:5%)
            ld(`top:5%;left:5%;right:5%;bottom:5%;border:${LW} solid ${LC};`),
            // Centre line
            ld(`top:50%;left:5%;right:5%;height:2px;background:${LC};margin-top:-1px;`),
            // Centre circle — FIX: 28% not 50% (game uses w-52 h-52 on a large canvas; scaled down for email)
            ld(`top:50%;left:50%;width:28%;padding-bottom:28%;border-radius:50%;border:${LW} solid ${LC};transform:translate(-50%,-50%);`),
            // Centre spot — FIX: fixed 7px (game: w-2 h-2 = 8px)
            ld(`top:50%;left:50%;width:7px;height:7px;border-radius:50%;background:${LC};transform:translate(-50%,-50%);`),
            // TOP — penalty area (w-[50%] h-[20%])
            ld(`top:5%;left:25%;right:25%;height:20%;border-left:${LW} solid ${LC};border-right:${LW} solid ${LC};border-bottom:${LW} solid ${LC};`),
            // TOP — goal area (w-[24%] h-[9%])
            ld(`top:5%;left:38%;right:38%;height:9%;border-left:${LW} solid ${LC};border-right:${LW} solid ${LC};border-bottom:${LW} solid ${LC};`),
            // TOP — penalty spot — FIX: fixed 7px (game: w-2 h-2 = 8px, at calc(16px + 11% + 15px))
            ld(`top:14.5%;left:50%;width:7px;height:7px;border-radius:50%;background:${LC};transform:translateX(-50%);`),
            // TOP — D-arc (game: w-[40%] h-10 with clipPath polygon to show only outward half)
            ld(`top:calc(5% + 20% - 4px);left:50%;width:40%;height:36px;border:${LW} solid ${LC};border-top:none;border-left:none;border-right:none;border-radius:0 0 100% 100%;clip-path:polygon(0 0, 100% 0, 100% 58%, 0 58%);transform:translateX(-50%);`),
            // TOP — goal mouth bar (game: w-[10%] h-1)
            ld(`top:5%;left:45%;right:45%;height:3px;background:${LC};opacity:0.6;`),
            // BOTTOM — penalty area
            ld(`bottom:5%;left:25%;right:25%;height:20%;border-left:${LW} solid ${LC};border-right:${LW} solid ${LC};border-top:${LW} solid ${LC};`),
            // BOTTOM — goal area
            ld(`bottom:5%;left:38%;right:38%;height:9%;border-left:${LW} solid ${LC};border-right:${LW} solid ${LC};border-top:${LW} solid ${LC};`),
            // BOTTOM — penalty spot — FIX: fixed 7px
            ld(`bottom:14.5%;left:50%;width:7px;height:7px;border-radius:50%;background:${LC};transform:translateX(-50%);`),
            // BOTTOM — D-arc (mirror of top, clipPath shows inward half)
            ld(`bottom:calc(5% + 20% - 4px);left:50%;width:40%;height:36px;border:${LW} solid ${LC};border-bottom:none;border-left:none;border-right:none;border-radius:100% 100% 0 0;clip-path:polygon(0 42%, 100% 42%, 100% 100%, 0 100%);transform:translateX(-50%);`),
            // BOTTOM — goal mouth bar
            ld(`bottom:5%;left:45%;right:45%;height:3px;background:${LC};opacity:0.6;`),
            // Corner arcs — fixed 20px×20px (game: w-5 h-5 = 20px, positioned at 14px from edge)
            ld(`top:5%;left:5%;width:20px;height:20px;border-bottom:${LW} solid ${LC};border-right:${LW} solid ${LC};border-radius:0 0 100% 0;`),
            ld(`top:5%;right:5%;width:20px;height:20px;border-bottom:${LW} solid ${LC};border-left:${LW} solid ${LC};border-radius:0 0 0 100%;`),
            ld(`bottom:5%;left:5%;width:20px;height:20px;border-top:${LW} solid ${LC};border-right:${LW} solid ${LC};border-radius:0 100% 0 0;`),
            ld(`bottom:5%;right:5%;width:20px;height:20px;border-top:${LW} solid ${LC};border-left:${LW} solid ${LC};border-radius:100% 0 0 0;`),
        ].join('');
        // ── 3D perspective — same as MatchLiveViewPolishCupSimulation.tsx ──
        //   background: perspective(950px) rotateX(24deg), transformOrigin: center center
        //   lines: same transform + opacity 0.5
        const TF = 'perspective(950px) rotateX(24deg)';
        const TO = 'center center';
        return `<div style="width:100%;"><div style="position:relative;width:100%;padding-bottom:150%;border-radius:8px;overflow:visible;">
      <!-- Turf — #064c2f + repeating stripes (MatchLiveViewPolishCupSimulation.tsx exact) -->
      <div style="position:absolute;inset:0;background:#064c2f;background-image:repeating-linear-gradient(to bottom,transparent,transparent 5%,rgba(255,255,255,0.015) 12%,rgba(255,255,255,0.015) 24%);transform:${TF};transform-origin:${TO};opacity:0.9;border-radius:8px;"></div>
      <!-- Pitch lines — opacity:0.5 (matching game's opacity-50 wrapper) -->
      <div style="position:absolute;inset:0;opacity:0.5;transform:${TF};transform-origin:${TO};">
        ${linesHtml}
      </div>
      <!-- Players -->
      <div style="position:absolute;inset:0;transform:${TF};transform-origin:${TO};">
        ${playerHtml}
      </div>
    </div></div>`;
    };
    const tacticVisualCard = card('#a78bfa', 'TAKTYKA PRZECIWNIKA', `<div style="text-align:center;margin-bottom:16px;">
       <div style="${bigTitle}font-size:26px;color:#a78bfa;letter-spacing:0.04em;">${tactic.currentTactic}</div>
       ${tactic.hasCadreProblems
        ? `<div style="font-family:${FONT};color:#f59e0b;font-size:12px;font-weight:700;font-style:italic;text-transform:uppercase;letter-spacing:0.1em;margin-top:6px;">⚠️ Możliwa zmiana: ${tactic.predictedTactic}</div>`
        : `<div style="font-family:${FONT};color:#10b981;font-size:12px;font-weight:700;font-style:italic;text-transform:uppercase;letter-spacing:0.1em;margin-top:6px;">✅ Formacja stabilna</div>`}
     </div>
     ${renderFormation(tactic.currentTactic, opponentPrimaryColor, opponentSecondaryColor)}
  `, 'flex:none;width:320px;height:560px;overflow:hidden;box-sizing:border-box;');
    // ── RAPORT PISEMNY ─────────────────────────────────────────────────────────
    const reportSections = generateWrittenReport({
        opponentName, form, keyPlayers, tactic, approach,
        opponentPlayers, opponentLineup, userPlayers, userLineup, userAvgRating, opponentAvgRating,
    });
    const reportCard = card('#38bdf8', 'Raport szczegółowy', reportSections.map(s => `<div style="margin-bottom:18px;padding-bottom:16px;border-bottom:1px solid rgba(255,255,255,0.05);">
         <div style="display:flex;align-items:center;gap:8px;margin-bottom:7px;">
           <span style="font-size:16px;line-height:1;">${s.icon}</span>
           <span style="font-family:${FONT};font-size:11px;font-weight:900;font-style:italic;letter-spacing:0.25em;text-transform:uppercase;color:${s.color};">${s.title}</span>
         </div>
         <p style="font-family:${FONT};color:#94a3b8;font-size:13px;font-weight:600;line-height:1.7;margin:0;text-transform:none;letter-spacing:0.01em;font-style:normal;">${s.text}</p>
       </div>`).join(''), 'flex:none;width:480px;height:560px;overflow-y:auto;overflow-x:hidden;box-sizing:border-box;padding:24px 26px;scrollbar-width:thin;scrollbar-color:rgba(56,189,248,0.35) transparent;');
    // ── DYSCYPLINA ────────────────────────────────────────────────────────────
    const avg = form.last5.length > 0 ? ((form.yellowCards + form.redCards * 2) / form.last5.length).toFixed(1) : '0.0';
    const disciplineCard = card('#f97316', '🃏 Fairplay', `<div style="display:flex;gap:8px;margin-bottom:8px;">
       <div style="flex:1;background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.18);border-radius:7px;padding:9px;text-align:center;">
         <div style="display:flex;align-items:center;justify-content:center;gap:6px;font-size:19px;line-height:1;margin-bottom:3px;"><span>🟨</span><span style="${mono}color:#f59e0b;">${form.yellowCards}</span></div>
         <div style="${label('#475569')}margin-bottom:0;margin-top:3px;">ŻÓŁTE</div>
       </div>
       <div style="flex:1;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.18);border-radius:7px;padding:9px;text-align:center;">
         <div style="display:flex;align-items:center;justify-content:center;gap:6px;font-size:19px;line-height:1;margin-bottom:3px;"><span>🟥</span><span style="${mono}color:#ef4444;">${form.redCards}</span></div>
         <div style="${label('#475569')}margin-bottom:0;margin-top:3px;">CZERWONE</div>
       </div>
     </div>
     <div style="font-family:${FONT};font-style:italic;text-transform:uppercase;color:#475569;font-size:12px;font-weight:700;letter-spacing:0.08em;text-align:center;margin-bottom:12px;">Średnia kartki na mecz: ${avg}</div>
     ${form.brutalityLabel !== 'Czysta gra' ? `<div style="background:${form.brutalityColor}15;border:1px solid ${form.brutalityColor}33;border-radius:14px;padding:16px 20px;text-align:center;margin-bottom:14px;"><div style="${bigTitle}font-size:26px;color:${form.brutalityColor};">${form.brutalityLabel}</div></div>` : ''}
     <div style="height:1px;background:rgba(255,255,255,0.06);margin-bottom:16px;"></div>
     <span style="${label('#3b82f6')}"> Ostatnie Mecze</span>
     ${form.last5.length === 0
        ? `<p style="font-family:${FONT};color:#334155;font-size:8px;font-style:italic;margin:0;">Brak dostępnych danych.</p>`
        : form.last5.map(m => {
            const rc = m.result === 'W' ? '#10b981' : m.result === 'D' ? '#f59e0b' : '#ef4444';
            const rb = m.result === 'W' ? 'rgba(16,185,129,0.1)' : m.result === 'D' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)';
            const rl = m.result === 'W' ? 'W' : m.result === 'D' ? 'R' : 'P';
            const parsedDate = new Date(m.date);
            const dt = !isNaN(parsedDate.getTime())
                ? `${String(parsedDate.getDate()).padStart(2, '0')}.${String(parsedDate.getMonth() + 1).padStart(2, '0')}`
                : m.date.slice(5, 10).replace('-', '.');
            return `<div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid rgba(255,255,255,0.04);">
               <div style="font-family:${FONT};background:${rb};border:1px solid ${rc}33;color:${rc};font-size:13px;font-weight:900;width:30px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-style:italic;">${rl}</div>
               <span style="font-family:${FONT};color:#334155;font-size:10px;font-weight:800;min-width:44px;">${dt}</span>
               <span style="font-family:${FONT};color:#64748b;font-size:10px;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${m.opponentName}</span>
               <span style="${mono}color:#f8fafc;font-size:10px;">${m.scored}:${m.conceded}</span>
             </div>`;
        }).join('')}`, 'flex:none;width:420px;height:560px;overflow:hidden;box-sizing:border-box;');
    // ── KLUCZOWI ZAWODNICY ────────────────────────────────────────────────────
    const strong = keyPlayers.strongest;
    const weak = keyPlayers.weakest;
    const playersCard = card('#ef4444', '🎯 Kluczowi Zawodnicy', (strong ? `<div style="background:rgba(239,68,68,0.07);border:1px solid rgba(239,68,68,0.15);border-radius:16px;padding:16px 20px;margin-bottom:12px;">
      <span style="${label('#ef4444')}margin-bottom:8px;">💪 NAJSILNIEJSZE OGNIWO</span>
      <div style="${bigTitle}font-size:22px;letter-spacing:-0.02em;">${strong.firstName} ${strong.lastName}</div>
      <div style="font-family:${FONT};color:#475569;font-style:italic;text-transform:uppercase;font-size:14px;font-weight:700;letter-spacing:0.06em;margin-top:6px;">${strong.position} · OVR <span style="color:#ef4444;font-weight:900;">${strong.overallRating}</span></div>
    </div>` : '') +
        (weak ? `<div style="background:rgba(96,165,250,0.07);border:1px solid rgba(96,165,250,0.15);border-radius:16px;padding:16px 20px;margin-bottom:12px;">
      <span style="${label('#60a5fa')}margin-bottom:8px;">🔓 NAJSŁABSZE OGNIWO</span>
      <div style="${bigTitle}font-size:22px;letter-spacing:-0.02em;">${weak.firstName} ${weak.lastName}</div>
      <div style="font-family:${FONT};color:#475569;font-style:italic;text-transform:uppercase;font-size:14px;font-weight:700;letter-spacing:0.06em;margin-top:6px;">${weak.position} · OVR <span style="color:#60a5fa;font-weight:900;">${weak.overallRating}</span></div>
    </div>` : '') +
        (keyPlayers.topScorer ? `<div style="background:rgba(251,146,60,0.07);border:1px solid rgba(251,146,60,0.15);border-radius:16px;padding:16px 20px;">
      <span style="${label('#fb923c')}margin-bottom:8px;">⚽ STRZELEC SEZONU</span>
      <div style="font-family:${FONT};color:#fb923c;font-size:18px;font-weight:900;font-style:italic;text-transform:uppercase;letter-spacing:0.04em;">${keyPlayers.topScorer}</div>
    </div>` : `<div style="font-family:${FONT};color:#334155;font-size:15px;font-style:italic;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;">Brak aktywnego strzelca.</div>`));
    // ── REKOMENDACJA ──────────────────────────────────────────────────────────
    const sc = approach.style === 'ofensywnie' ? '#ef4444' : approach.style === 'defensywnie' ? '#60a5fa' : '#10b981';
    const rekoCard = card(sc, '💡 Rekomendacja', `<div style="background:${sc}12;border:1px solid ${sc}30;border-radius:16px;padding:22px;text-align:center;margin-bottom:20px;">
       <div style="${bigTitle}font-size:42px;color:${sc};line-height:1;">${approach.style.toUpperCase()}</div>
     </div>
     <span style="${label('#475569')}">SUGEROWANE FORMACJE</span>
     <div style="display:flex;flex-wrap:wrap;gap:6px;">${approach.suggestedTactics.map(t => chip(t, 'rgba(255,255,255,0.05)', '#94a3b8')).join('')}</div>`);
    // ── ROTACJA ───────────────────────────────────────────────────────────────
    const rotSection = rotation.isOptimal
        ? `<div style="background:rgba(16,185,129,0.07);border:1px solid rgba(16,185,129,0.2);border-radius:12px;padding:14px 20px;text-align:center;">
         <span style="${bigTitle}font-size:14px;color:#10b981;">✅ Skład optymalny — brak rekomendowanych zmian.</span>
       </div>`
        : `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(360px,1fr));gap:14px;">` +
            rotation.swaps.map(swap => `<div style="background:rgba(239,68,68,0.05);border:1px solid rgba(239,68,68,0.15);border-radius:16px;padding:20px 24px;">
           <div style="font-family:${FONT};color:#fca5a5;font-size:16px;font-weight:900;font-style:italic;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:14px;">⚠️ ${swap.reason}</div>
           ${swap.bring
                ? `<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
                  <span style="font-family:${FONT};color:#64748b;font-size:14px;font-weight:700;font-style:italic;text-transform:uppercase;letter-spacing:0.08em;">Wstaw:</span>
                  <span style="font-family:${FONT};color:#10b981;font-size:18px;font-weight:900;font-style:italic;text-transform:uppercase;">${swap.bring.firstName} ${swap.bring.lastName}</span>
                  <span style="font-family:${FONT};color:#475569;font-size:14px;font-style:italic;text-transform:uppercase;font-weight:700;">zamiast <strong style="color:#f8fafc;">${swap.drop.lastName}</strong></span>
                </div>
                <div style="font-family:${FONT};color:#475569;font-size:14px;font-style:italic;text-transform:uppercase;letter-spacing:0.06em;font-weight:700;margin-top:8px;">OVR ${swap.bring.overallRating} · ${swap.bring.position} · Formacja: <span style="color:#64748b;font-weight:800;">${approach.suggestedTactics[0]}</span></div>`
                : `<span style="font-family:${FONT};color:#334155;font-size:14px;font-style:italic;text-transform:uppercase;font-weight:700;">Brak dostępnego rezerwowego.</span>`}
         </div>`).join('') + `</div>`;
    // ── OUTER WRAPPER ─────────────────────────────────────────────────────────
    return `<div style="font-family:${FONT};font-style:italic;text-transform:uppercase;letter-spacing:0.02em;color:#cbd5e1;line-height:1.5;position:relative;">

    <!-- ambient glows -->
    <div style="position:absolute;top:-80px;right:-80px;width:400px;height:400px;border-radius:50%;background:radial-gradient(circle,rgba(59,130,246,0.15),transparent 70%);pointer-events:none;"></div>
    <div style="position:absolute;bottom:-60px;left:-60px;width:350px;height:350px;border-radius:50%;background:radial-gradient(circle,rgba(16,185,129,0.12),transparent 70%);pointer-events:none;"></div>

    <!-- cyber grid -->
    <div style="position:absolute;inset:0;opacity:0.025;background-image:linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px);background-size:60px 60px;pointer-events:none;border-radius:24px;"></div>

    <!-- HEADER -->
    <div style="${cardBg};border-radius:24px;padding:30px 40px;margin-bottom:20px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:18px;border-top:1px solid rgba(255,255,255,0.12);">
      <div>
        <span style="${label('#3b82f6')}">RAPORT PRZEDMECZOWY · JUTRO</span>
        <div style="${bigTitle}font-size:28px;line-height:1.1;margin-bottom:10px;color:#3b82f6;">${opponentName}</div>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <div style="background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.2);border-radius:13px;padding:13px 20px;text-align:center;">
          <div style="${mono}color:#3b82f6;font-size:29px;font-style:italic;line-height:1;">${opponentLeaguePosition > 0 ? opponentLeaguePosition + '' : '—'}</div>
          <span style="${label('#334155')}margin-bottom:0;">MIEJSCE</span>
        </div>
        <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:13px;padding:13px 20px;text-align:center;">
          <div style="${mono}color:#f8fafc;font-size:29px;font-style:italic;line-height:1;">${opponentLeaguePoints}</div>
          <span style="${label('#334155')}margin-bottom:0;">PKT</span>
        </div>
        <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:13px;padding:13px 20px;text-align:center;">
          <div style="${mono}font-size:29px;font-style:italic;line-height:1;color:${opponentLeagueGoalDiff >= 0 ? '#10b981' : '#ef4444'};">${opponentLeagueGoalDiff}</div>
          <span style="${label('#334155')}margin-bottom:0;">BRAMKI</span>
        </div>
        <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:13px;padding:13px 20px;text-align:center;display:flex;flex-direction:column;justify-content:center;">
          <div style="${bigTitle}font-size:13px;color:#94a3b8;letter-spacing:0.02em;">${leagueName}</div>
          <span style="${label('#334155')}margin-bottom:0;margin-top:4px;">ROZGRYWKI</span>
        </div>
      </div>
    </div>

    <!-- ROW 1: Forma (320x320) | Taktyka + Fairplay side by side (320x450 each) -->
    <div style="display:flex;flex-direction:row;gap:20px;margin-bottom:20px;align-items:start;">
      ${formaCard}
      <div style="display:flex;flex-direction:row;gap:14px;">
        ${tacticVisualCard}
        ${disciplineCard}
        ${reportCard}
      </div>
    </div>

    <!-- FOOTER -->
    <div style="font-family:${FONT};color:#1e293b;font-size:15px;font-style:italic;text-align:right;padding-top:8px;letter-spacing:0.05em;">ANALITYK KLUBOWY</div>

  </div>`;
}
// --- GŁÓWNA FUNKCJA EKSPORTOWANA ---
export const ScoutAssistantService = {
    generatePreMatchReport: (params) => {
        const { opponentClub, opponentPlayers, opponentLineup, userPlayers, userLineup, matchDate, managerName, clubs, opponentLeaguePosition, opponentLeaguePoints, opponentLeagueGoalDiff, leagueName } = params;
        const userXi = userLineup.startingXI
            .map(id => userPlayers.find(p => p.id === id))
            .filter(Boolean);
        const opponentXi = opponentLineup.startingXI
            .map(id => opponentPlayers.find(p => p.id === id))
            .filter(Boolean);
        const userAvgRating = userXi.length > 0
            ? userXi.reduce((s, p) => s + p.overallRating, 0) / userXi.length
            : 70;
        const opponentAvgRating = opponentXi.length > 0
            ? opponentXi.reduce((s, p) => s + p.overallRating, 0) / opponentXi.length
            : 70;
        const form = analyzeOpponentForm(opponentClub.id, clubs);
        const keyPlayers = analyzeKeyPlayers(opponentClub.id, opponentPlayers, opponentLineup);
        const tactic = analyzeOpponentTactic(opponentClub, opponentPlayers, opponentLineup);
        const approach = recommendTacticStyle(userAvgRating, opponentAvgRating);
        const rotation = suggestRotation(userPlayers, userLineup);
        const body = buildMailBody({
            opponentName: opponentClub.name,
            managerName,
            form,
            keyPlayers,
            tactic,
            approach,
            rotation,
            opponentLeaguePosition,
            opponentLeaguePoints,
            opponentLeagueGoalDiff,
            leagueName,
            opponentPrimaryColor: opponentClub.colorPrimary ?? (opponentClub.colorsHex?.[0] ?? '#3b82f6'),
            opponentSecondaryColor: opponentClub.colorSecondary ?? (opponentClub.colorsHex?.[1] ?? '#ffffff'),
            opponentPlayers,
            opponentLineup,
            userPlayers,
            userLineup,
            userAvgRating,
            opponentAvgRating,
        });
        const mailId = `SCOUT_REPORT_${opponentClub.id}_${matchDate.toISOString().slice(0, 10)}`;
        return {
            id: mailId,
            sender: 'Dział Skautingu',
            role: 'Główny Analityk',
            subject: `Raport przedmeczowy: ${opponentClub.name}`,
            body,
            date: matchDate,
            isRead: false,
            type: MailType.SCOUT,
            priority: 80
        };
    }
};
