import { PlayerPosition, MatchStatus, CompetitionType, InjurySeverity, MatchEventType } from '../types';
import { TacticRepository } from '../resources/tactics_db';
import { GoalAttributionService } from './GoalAttributionService';
import { LineupService } from './LineupService';
import { EuropeanWeatherService } from './EuropeanWeatherService';
import { PlayerStatsService } from './PlayerStatsService';
// ============================================================
//  RNG — deterministyczny hash (sin-based jak LeagueBackgroundMatchEngine)
// ============================================================
const makeSeededRng = (seed) => (offset) => {
    const x = Math.sin(seed + offset) * 10000;
    return x - Math.floor(x);
};
// ============================================================
//  SIŁA LINII ZAWODNIKÓW
// ============================================================
const getLineStrength = (players, lineupIds) => {
    const ids = lineupIds.filter((id) => id !== null);
    const active = players.filter(p => ids.includes(p.id));
    if (active.length === 0)
        return { att: 40, def: 40, gk: 40 };
    const att = active.reduce((acc, p) => acc + (p.attributes.attacking + p.attributes.finishing + p.attributes.passing) / 3, 0) / active.length;
    const def = active.reduce((acc, p) => acc + (p.attributes.defending + p.attributes.stamina) / 2, 0) / active.length;
    const gk = players.find(p => p.id === lineupIds[0])?.attributes.goalkeeping ?? 40;
    return { att, def, gk };
};
// ============================================================
//  POISSON-LIKE GENERATOR GOLI
// ============================================================
const getGoalsPoissonLike = (xg, rng, baseOffset, isChaos) => {
    let g = 0;
    let cur = Math.max(0.05, Math.min(isChaos ? 5.5 : 3.8, xg + (rng(baseOffset) - 0.5) * 0.35));
    for (let i = 0; i < 8; i++) {
        if (rng(baseOffset + 10 + i) < cur / (i + 1.15)) {
            g++;
            cur *= (isChaos ? 0.85 : 0.68);
        }
    }
    return g;
};
// ============================================================
//  SYMULACJA ZMIAN (3-5 na drużynę)
// ============================================================
const simulateSubs = (lineup, teamPlayers, sideOffset, rng) => {
    const subCount = Math.floor(3 + rng(sideOffset) * 3); // 3-5 zmian
    const matchSubs = [];
    const currentXI = [...lineup.startingXI];
    const currentBench = [...lineup.bench];
    const participants = new Set(currentXI.filter((id) => id !== null));
    for (let i = 0; i < subCount; i++) {
        const subMin = Math.floor(46 + rng(sideOffset + i + 100) * 42); // 46-88 min
        const outIdx = Math.floor(1 + rng(sideOffset + i + 200) * 10); // Unikamy GK (index 0)
        const playerOutId = currentXI[outIdx];
        if (!playerOutId)
            continue;
        const tacticSlots = TacticRepository.getById(lineup.tacticId).slots;
        const roleNeeded = outIdx < tacticSlots.length ? tacticSlots[outIdx].role : PlayerPosition.MID;
        const subInId = currentBench.find(id => teamPlayers.find(p => p.id === id)?.position === roleNeeded) ||
            currentBench.find(id => teamPlayers.find(p => p.id === id)?.position !== PlayerPosition.GK);
        if (subInId) {
            matchSubs.push({ min: subMin, outId: playerOutId, inId: subInId });
            currentXI[outIdx] = subInId;
            currentBench.splice(currentBench.indexOf(subInId), 1);
            participants.add(subInId);
        }
    }
    return { matchSubs, allPlayedIds: Array.from(participants) };
};
// ============================================================
//  AKTYWNY SKŁAD W DANEJ MINUCIE
// ============================================================
const getActiveLineupAt = (min, originalXI, subs) => {
    const current = [...originalXI];
    subs.filter(s => s.min <= min).forEach(s => {
        const idx = current.indexOf(s.outId);
        if (idx !== -1)
            current[idx] = s.inId;
    });
    return current.filter((id) => id !== null);
};
// ============================================================
//  ATRYBUOWANIE GOLI DO ZAWODNIKÓW
// ============================================================
const attributeGoalsToPlayers = (count, teamId, teamPlayers, lineup, subs, rng, baseOffset) => {
    const goals = [];
    const usedMinutes = new Set();
    for (let i = 0; i < count; i++) {
        let minute = Math.floor(1 + rng(baseOffset + i) * 94);
        while (usedMinutes.has(minute)) {
            minute = minute >= 96 ? 1 : minute + 1;
        }
        usedMinutes.add(minute);
        const activeXI = getActiveLineupAt(minute, lineup.startingXI, subs);
        const scorer = GoalAttributionService.pickScorer(teamPlayers, activeXI, false, () => rng(baseOffset + i + 500));
        const isPenalty = rng(baseOffset + i + 700) < 0.02;
        goals.push({
            playerName: scorer ? `${scorer.firstName} ${scorer.lastName}` : '?',
            minute,
            teamId,
            isPenalty,
        });
    }
    return goals;
};
// ============================================================
//  SYMULACJA KARTEK I KONTUZJI
// ============================================================
const simulateCardsAndInjuries = (lineup, players, teamId, offset, rng) => {
    const cards = [];
    let redCount = 0;
    let updatedPlayers = [...players];
    const fatigueMap = {};
    const fatigueDebtMap = {};
    const injuryPenaltyMap = {};
    lineup.startingXI.forEach((pId, idx) => {
        if (!pId)
            return;
        const p = players.find(x => x.id === pId);
        if (!p)
            return;
        const playerName = `${p.firstName} ${p.lastName}`;
        const isDirectRed = rng(offset + idx + 1500) < 0.0033;
        const yellowRoll = rng(offset + idx + 1000);
        const isSecondYellow = yellowRoll < 0.087 && rng(offset + idx + 1200) < 0.05;
        const isNormalYellow = yellowRoll < 0.087 && !isSecondYellow;
        if (isDirectRed) {
            const m = Math.max(1, Math.floor(10 + rng(offset + idx + 550) * 85));
            cards.push({ playerId: pId, playerName, minute: m, teamId, type: 'RED' });
            redCount++;
        }
        else if (isSecondYellow) {
            const m1 = Math.max(1, Math.floor(5 + rng(offset + idx + 660) * 40));
            const m2 = Math.max(m1 + 1, Math.floor(m1 + 10 + rng(offset + idx + 770) * 40));
            cards.push({ playerId: pId, playerName, minute: m1, teamId, type: 'YELLOW' });
            cards.push({ playerId: pId, playerName, minute: m2, teamId, type: 'SECOND_YELLOW' });
            redCount++;
        }
        else if (isNormalYellow) {
            const m = Math.max(1, Math.floor(5 + rng(offset + idx + 880) * 90));
            cards.push({ playerId: pId, playerName, minute: m, teamId, type: 'YELLOW' });
        }
        const isInjured = rng(offset + idx + 2000) < 0.0064;
        if (isInjured) {
            const isSev = rng(idx + 3000) < 0.15;
            const days = isSev
                ? (14 + Math.floor(rng(idx + 3100) * 30))
                : (2 + Math.floor(rng(idx + 3200) * 6));
            updatedPlayers = updatedPlayers.map(pl => pl.id === pId ? {
                ...pl,
                health: {
                    status: 'INJURED',
                    injury: {
                        type: isSev ? 'Poważny uraz więzadeł' : 'Stłuczenie mięśnia',
                        daysRemaining: days,
                        severity: isSev ? InjurySeverity.SEVERE : InjurySeverity.LIGHT,
                        injuryDate: new Date().toISOString(),
                        totalDays: days,
                    }
                }
            } : pl);
            injuryPenaltyMap[pId] = (isSev ? 55 : 20) + rng(offset + idx + 5000) * 15;
        }
        const stamina = p.attributes.stamina || 50;
        const stamEff = Math.pow((100 - stamina) / 100, 1.2) * 10;
        let drain = 2.5 + rng(offset + idx + 4000) * 1.5 + (stamEff * 0.5) + 1.5;
        if (p.position === PlayerPosition.GK)
            drain *= 0.15;
        fatigueMap[pId] = drain;
        fatigueDebtMap[pId] = 5 + ((100 - stamina) * 0.15);
    });
    return { cards, redCount, updatedPlayers, fatigueMap, fatigueDebtMap, injuryPenaltyMap };
};
// ============================================================
//  DOGRYWKA + KARNE — poprawiona wersja
// ============================================================
const simulateExtraTimeAndPenalties = (homeScore, awayScore, homeWinProb, rng, baseOffset, leg1Diff) => {
    let h = homeScore;
    let a = awayScore;
    const homeAdvantage = 0.05;
    // Dogrywka: P(0)=0.55, P(1)=0.35, P(2)=0.10
    const etRoll = rng(baseOffset);
    const etGoals = etRoll < 0.10 ? 2 : etRoll < 0.45 ? 1 : 0;
    for (let i = 0; i < etGoals; i++) {
        if (rng(baseOffset + 10 + i) < homeWinProb + homeAdvantage)
            h++;
        else
            a++;
    }
    let penaltyHome;
    let penaltyAway;
    // Sprawdzenie remisu: dla rewanżu — agregat, dla finału — wynik meczu
    const aggregateTied = leg1Diff !== undefined ? (h - a === leg1Diff) : (h === a);
    if (aggregateTied) {
        const simSeries = (favProb, seriesOffset) => {
            let scored = 0;
            for (let i = 0; i < 5; i++) {
                if (rng(seriesOffset + i) < 0.72 + (favProb - 0.5) * 0.1)
                    scored++;
            }
            return scored;
        };
        penaltyHome = simSeries(homeWinProb, baseOffset + 100);
        penaltyAway = simSeries(1 - homeWinProb, baseOffset + 200);
        // Sudden death — aż do rozstrzygnięcia
        let sd = 0;
        while (penaltyHome === penaltyAway && sd < 20) {
            sd++;
            const hScored = rng(baseOffset + 300 + sd * 2) < 0.72;
            const aScored = rng(baseOffset + 301 + sd * 2) < 0.72;
            if (hScored && !aScored)
                penaltyHome++;
            else if (!hScored && aScored)
                penaltyAway++;
        }
    }
    return { homeScore: h, awayScore: a, penaltyHome, penaltyAway };
};
// ============================================================
//  GŁÓWNA FUNKCJA SYMULACJI MECZU Z ZAWODNIKAMI
// ============================================================
const simulateCLMatchFull = (homeClub, awayClub, homePlayersAll, awayPlayersAll, homeLineup, awayLineup, date, seed, leg1Diff, isFinalMatch) => {
    const rng = makeSeededRng(seed);
    // ── Taktyka ─────────────────────────────────────────────────────────
    const hTactic = TacticRepository.getById(homeLineup.tacticId);
    const aTactic = TacticRepository.getById(awayLineup.tacticId);
    // ── Siła zawodników ─────────────────────────────────────────────────
    const hStr = getLineStrength(homePlayersAll, homeLineup.startingXI);
    const aStr = getLineStrength(awayPlayersAll, awayLineup.startingXI);
    // ── Forma dzienna ────────────────────────────────────────────────────
    const homeDailyForm = (rng(11) - 0.5) * 0.3;
    const awayDailyForm = (rng(12) - 0.5) * 0.3;
    // ── Chaos / Stale factor ─────────────────────────────────────────────
    const chaosRoll = rng(7);
    const isChaosMatch = chaosRoll < 0.035;
    const isStaleMatch = chaosRoll > 0.94;
    const volatilityMult = isChaosMatch ? 1.65 : (isStaleMatch ? 0.50 : 1.0);
    // ── Pogoda (klimat kraju gospodarza) ────────────────────────────────
    const homeCountry = homeClub.country ?? 'POL';
    const weatherMod = EuropeanWeatherService.getGoalModifier(homeCountry, date, rng(13));
    // ── Pre-roll czerwonych kartek → korekta XG ─────────────────────────
    let homeRedPre = 0;
    let awayRedPre = 0;
    homeLineup.startingXI.forEach((_, idx) => {
        if (rng(10000 + idx + 1500) < 0.0033)
            homeRedPre++;
        else if (rng(10000 + idx + 1000) < 0.087 && rng(10000 + idx + 1200) < 0.05)
            homeRedPre++;
    });
    awayLineup.startingXI.forEach((_, idx) => {
        if (rng(20000 + idx + 1500) < 0.0033)
            awayRedPre++;
        else if (rng(20000 + idx + 1000) < 0.087 && rng(20000 + idx + 1200) < 0.05)
            awayRedPre++;
    });
    // ── XG ──────────────────────────────────────────────────────────────
    const repDiff = homeClub.reputation - awayClub.reputation;
    let xgHome = 1.25
        + (repDiff * 0.015)
        + (hTactic.attackBias - 50) / 180
        + ((hStr.att - aStr.def) * 0.04)
        + homeDailyForm
        + 0.08; // przewaga domowa
    let xgAway = 1.05
        - (repDiff * 0.015)
        + (aTactic.attackBias - 50) / 180
        + ((aStr.att - hStr.def) * 0.04)
        + awayDailyForm;
    // Bonus XG dla dominującej drużyny (jak LeagueBackgroundMatchEngine linia 80-81)
    if (xgHome > xgAway + 1.2)
        xgHome += 0.5;
    if (xgAway > xgHome + 1.2)
        xgAway += 0.5;
    // Korekta za czerwone kartki
    xgHome = Math.max(0.05, xgHome * volatilityMult * (1 - homeRedPre * 0.25) * (1 + awayRedPre * 0.20) * weatherMod);
    xgAway = Math.max(0.05, xgAway * volatilityMult * (1 - awayRedPre * 0.25) * (1 + homeRedPre * 0.20) * weatherMod);
    // ── Generowanie goli 90 min ──────────────────────────────────────────
    const homeScore90 = getGoalsPoissonLike(xgHome, rng, 200, isChaosMatch);
    const awayScore90 = getGoalsPoissonLike(xgAway, rng, 300, isChaosMatch);
    // ── Zmiany ──────────────────────────────────────────────────────────
    const homeSubData = simulateSubs(homeLineup, homePlayersAll, 5000, rng);
    const awaySubData = simulateSubs(awayLineup, awayPlayersAll, 6000, rng);
    // ── Kartki i kontuzje (te same offsety co pre-roll — spójne wyniki) ─
    const homeCardData = simulateCardsAndInjuries(homeLineup, homePlayersAll, homeClub.id, 10000, rng);
    const awayCardData = simulateCardsAndInjuries(awayLineup, awayPlayersAll, awayClub.id, 20000, rng);
    // ── Zmęczenie: agregacja startowej XI + zmienniki (40% drenu) ────────
    const fatigueMap = { ...homeCardData.fatigueMap, ...awayCardData.fatigueMap };
    const fatigueDebtMap = { ...homeCardData.fatigueDebtMap, ...awayCardData.fatigueDebtMap };
    const injuryPenaltyMap = { ...homeCardData.injuryPenaltyMap, ...awayCardData.injuryPenaltyMap };
    const homeSubIns = homeSubData.allPlayedIds.filter(id => !homeLineup.startingXI.includes(id));
    homeSubIns.forEach((id, idx) => {
        const p = homePlayersAll.find(x => x.id === id);
        if (!p)
            return;
        const stamina = p.attributes.stamina || 50;
        const stamEff = Math.pow((100 - stamina) / 100, 1.2) * 10;
        let drain = (2.5 + rng(7000 + idx) * 1.5 + (stamEff * 0.5) + 1.5) * 0.40;
        if (p.position === PlayerPosition.GK)
            drain *= 0.15;
        fatigueMap[id] = drain;
        fatigueDebtMap[id] = (5 + ((100 - stamina) * 0.15)) * 0.40;
    });
    const awaySubIns = awaySubData.allPlayedIds.filter(id => !awayLineup.startingXI.includes(id));
    awaySubIns.forEach((id, idx) => {
        const p = awayPlayersAll.find(x => x.id === id);
        if (!p)
            return;
        const stamina = p.attributes.stamina || 50;
        const stamEff = Math.pow((100 - stamina) / 100, 1.2) * 10;
        let drain = (2.5 + rng(8000 + idx) * 1.5 + (stamEff * 0.5) + 1.5) * 0.40;
        if (p.position === PlayerPosition.GK)
            drain *= 0.15;
        fatigueMap[id] = drain;
        fatigueDebtMap[id] = (5 + ((100 - stamina) * 0.15)) * 0.40;
    });
    // ── Atrybuowanie goli ────────────────────────────────────────────────
    const homeGoalEntries = attributeGoalsToPlayers(homeScore90, homeClub.id, homePlayersAll, homeLineup, homeSubData.matchSubs, rng, 400);
    const awayGoalEntries = attributeGoalsToPlayers(awayScore90, awayClub.id, awayPlayersAll, awayLineup, awaySubData.matchSubs, rng, 450);
    // ── Zmiany → format historii ─────────────────────────────────────────
    const homeSubs = homeSubData.matchSubs.map(s => {
        const out = homePlayersAll.find(p => p.id === s.outId);
        const inP = homePlayersAll.find(p => p.id === s.inId);
        return { playerOutName: out ? `${out.firstName} ${out.lastName}` : '?', playerInName: inP ? `${inP.firstName} ${inP.lastName}` : '?', minute: s.min, teamId: homeClub.id };
    });
    const awaySubs = awaySubData.matchSubs.map(s => {
        const out = awayPlayersAll.find(p => p.id === s.outId);
        const inP = awayPlayersAll.find(p => p.id === s.inId);
        return { playerOutName: out ? `${out.firstName} ${out.lastName}` : '?', playerInName: inP ? `${inP.firstName} ${inP.lastName}` : '?', minute: s.min, teamId: awayClub.id };
    });
    // ── Dogrywka / karne ─────────────────────────────────────────────────
    let finalHomeScore = homeScore90;
    let finalAwayScore = awayScore90;
    let penaltyHome;
    let penaltyAway;
    let wentToExtraTime = false;
    const homeWinProb = homeClub.reputation / (homeClub.reputation + awayClub.reputation);
    if (leg1Diff !== undefined && homeScore90 - awayScore90 === leg1Diff) {
        // Rewanż: agregat równy → dogrywka
        const etResult = simulateExtraTimeAndPenalties(homeScore90, awayScore90, homeWinProb, rng, 1000, leg1Diff);
        finalHomeScore = etResult.homeScore;
        finalAwayScore = etResult.awayScore;
        penaltyHome = etResult.penaltyHome;
        penaltyAway = etResult.penaltyAway;
        wentToExtraTime = true;
    }
    else if (isFinalMatch && homeScore90 === awayScore90) {
        // Finał: remis po 90 min → dogrywka
        const etResult = simulateExtraTimeAndPenalties(homeScore90, awayScore90, homeWinProb, rng, 1000, undefined);
        finalHomeScore = etResult.homeScore;
        finalAwayScore = etResult.awayScore;
        penaltyHome = etResult.penaltyHome;
        penaltyAway = etResult.penaltyAway;
        wentToExtraTime = true;
    }
    return {
        homeScore: finalHomeScore,
        awayScore: finalAwayScore,
        penaltyHome,
        penaltyAway,
        wentToExtraTime,
        goals: [...homeGoalEntries, ...awayGoalEntries],
        cards: [...homeCardData.cards, ...awayCardData.cards],
        substitutions: [...homeSubs, ...awaySubs],
        updatedHomePlayers: homeCardData.updatedPlayers,
        updatedAwayPlayers: awayCardData.updatedPlayers,
        fatigueMap,
        fatigueDebtMap,
        injuryPenaltyMap,
    };
};
// ============================================================
//  GŁÓWNY PROCESOR CL / EL / CONF
// ============================================================
export const BackgroundMatchProcessorCL = {
    processChampionsLeagueEvent: (currentDate, userTeamId, fixtures, clubs, players, lineups, seasonNumber, sessionSeed) => {
        const dateStr = currentDate.toDateString();
        const todayMatches = fixtures.filter(f => f.date.toDateString() === dateStr &&
            f.status === MatchStatus.SCHEDULED &&
            (f.leagueId === CompetitionType.CL_R1Q || f.leagueId === CompetitionType.CL_R1Q_RETURN ||
                f.leagueId === CompetitionType.CL_R2Q || f.leagueId === CompetitionType.CL_R2Q_RETURN ||
                f.leagueId === CompetitionType.CL_GROUP_STAGE ||
                f.leagueId === CompetitionType.CL_R16 || f.leagueId === CompetitionType.CL_R16_RETURN ||
                f.leagueId === CompetitionType.CL_QF || f.leagueId === CompetitionType.CL_QF_RETURN ||
                f.leagueId === CompetitionType.CL_SF || f.leagueId === CompetitionType.CL_SF_RETURN ||
                f.leagueId === CompetitionType.CL_FINAL ||
                // ── Liga Europy ────────────────────────────────────────────────────────
                f.leagueId === CompetitionType.EL_R1Q || f.leagueId === CompetitionType.EL_R1Q_RETURN ||
                f.leagueId === CompetitionType.EL_R2Q || f.leagueId === CompetitionType.EL_R2Q_RETURN ||
                f.leagueId === CompetitionType.EL_GROUP_STAGE ||
                f.leagueId === CompetitionType.EL_R16 || f.leagueId === CompetitionType.EL_R16_RETURN ||
                f.leagueId === CompetitionType.EL_QF || f.leagueId === CompetitionType.EL_QF_RETURN ||
                f.leagueId === CompetitionType.EL_SF || f.leagueId === CompetitionType.EL_SF_RETURN ||
                f.leagueId === CompetitionType.EL_FINAL ||
                // ── Liga Konferencji ───────────────────────────────────────────────────
                f.leagueId === CompetitionType.CONF_R1Q || f.leagueId === CompetitionType.CONF_R1Q_RETURN ||
                f.leagueId === CompetitionType.CONF_R2Q || f.leagueId === CompetitionType.CONF_R2Q_RETURN ||
                f.leagueId === CompetitionType.CONF_GROUP_STAGE ||
                f.leagueId === CompetitionType.CONF_R16 || f.leagueId === CompetitionType.CONF_R16_RETURN ||
                f.leagueId === CompetitionType.CONF_QF || f.leagueId === CompetitionType.CONF_QF_RETURN ||
                f.leagueId === CompetitionType.CONF_SF || f.leagueId === CompetitionType.CONF_SF_RETURN ||
                f.leagueId === CompetitionType.CONF_FINAL) &&
            (
            // CONF: ZAWSZE symulowane w tle (nawet jeśli gra drużyna gracza)
            f.leagueId === CompetitionType.CONF_R1Q || f.leagueId === CompetitionType.CONF_R1Q_RETURN ||
                f.leagueId === CompetitionType.CONF_R2Q || f.leagueId === CompetitionType.CONF_R2Q_RETURN ||
                f.leagueId === CompetitionType.CONF_GROUP_STAGE ||
                f.leagueId === CompetitionType.CONF_R16 || f.leagueId === CompetitionType.CONF_R16_RETURN ||
                f.leagueId === CompetitionType.CONF_QF || f.leagueId === CompetitionType.CONF_QF_RETURN ||
                f.leagueId === CompetitionType.CONF_SF || f.leagueId === CompetitionType.CONF_SF_RETURN ||
                f.leagueId === CompetitionType.CONF_FINAL ||
                // CL i EL FINAŁ: zawsze symulowany (mecz 1-mecz finałowy, brak live)
                f.leagueId === CompetitionType.CL_FINAL ||
                f.leagueId === CompetitionType.EL_FINAL ||
                // CL i EL pozostałe rundy: pomijamy mecze drużyny gracza (on gra live)
                (f.homeTeamId !== userTeamId && f.awayTeamId !== userTeamId)));
        if (todayMatches.length === 0)
            return { updatedFixtures: fixtures, updatedPlayers: players, matchHistoryEntries: [] };
        let updatedFixtures = [...fixtures];
        let updatedPlayersMap = { ...players };
        const matchHistoryEntries = [];
        todayMatches.forEach(fixture => {
            const home = clubs.find(c => c.id === fixture.homeTeamId);
            const away = clubs.find(c => c.id === fixture.awayTeamId);
            if (!home || !away)
                return;
            // Deterministyczny seed dla tej pary
            const matchHash = fixture.id.split('').reduce((a, b) => (a << 5) - a + b.charCodeAt(0), 0);
            const seed = (matchHash ^ sessionSeed) ^ (currentDate.getTime() / 1000 | 0);
            // Pobierz lub wygeneruj składy
            const homePlayers = updatedPlayersMap[fixture.homeTeamId] ?? [];
            const awayPlayers = updatedPlayersMap[fixture.awayTeamId] ?? [];
            const homeLineup = lineups[fixture.homeTeamId] ?? LineupService.autoPickLineup(fixture.homeTeamId, homePlayers);
            const awayLineup = lineups[fixture.awayTeamId] ?? LineupService.autoPickLineup(fixture.awayTeamId, awayPlayers);
            const isReturnLeg = fixture.leagueId === CompetitionType.CL_R1Q_RETURN
                || fixture.leagueId === CompetitionType.CL_R2Q_RETURN
                || fixture.leagueId === CompetitionType.CL_R16_RETURN
                || fixture.leagueId === CompetitionType.CL_QF_RETURN
                || fixture.leagueId === CompetitionType.CL_SF_RETURN
                || fixture.leagueId === CompetitionType.EL_R1Q_RETURN
                || fixture.leagueId === CompetitionType.EL_R2Q_RETURN
                || fixture.leagueId === CompetitionType.EL_R16_RETURN
                || fixture.leagueId === CompetitionType.EL_QF_RETURN
                || fixture.leagueId === CompetitionType.EL_SF_RETURN
                || fixture.leagueId === CompetitionType.CONF_R1Q_RETURN
                || fixture.leagueId === CompetitionType.CONF_R2Q_RETURN
                || fixture.leagueId === CompetitionType.CONF_R16_RETURN
                || fixture.leagueId === CompetitionType.CONF_QF_RETURN
                || fixture.leagueId === CompetitionType.CONF_SF_RETURN;
            const isFinal = fixture.leagueId === CompetitionType.CL_FINAL
                || fixture.leagueId === CompetitionType.EL_FINAL
                || fixture.leagueId === CompetitionType.CONF_FINAL;
            // Oblicz leg1Diff dla rewanżu
            let leg1Diff = undefined;
            if (isReturnLeg) {
                const firstLegId = fixture.id.replace('_RETURN', '');
                const firstLeg = updatedFixtures.find(f => f.id === firstLegId);
                if (firstLeg && firstLeg.homeScore !== null && firstLeg.awayScore !== null) {
                    leg1Diff = firstLeg.homeScore - firstLeg.awayScore;
                }
            }
            // ── Symulacja meczu ─────────────────────────────────────────────
            const result = simulateCLMatchFull(home, away, homePlayers, awayPlayers, homeLineup, awayLineup, currentDate, seed, leg1Diff, isFinal);
            // ── Aktualizacja fixtures ────────────────────────────────────────
            updatedFixtures = updatedFixtures.map(f => f.id === fixture.id
                ? {
                    ...f,
                    homeScore: result.homeScore,
                    awayScore: result.awayScore,
                    homePenaltyScore: result.penaltyHome,
                    awayPenaltyScore: result.penaltyAway,
                    status: MatchStatus.FINISHED,
                }
                : f);
            // ── Aktualizacja zawodników (kontuzje + zmęczenie + dług zmęczenia) ─
            const applyFatigueToTeam = (teamPlayers) => teamPlayers.map(p => {
                let updatedP = { ...p };
                const drain = result.fatigueMap[p.id];
                const debt = result.fatigueDebtMap[p.id];
                if (drain !== undefined) {
                    updatedP.condition = Math.max(0, (updatedP.condition ?? 100) - drain);
                }
                if (debt !== undefined) {
                    updatedP.fatigueDebt = Math.min(100, (updatedP.fatigueDebt ?? 0) + debt);
                }
                const penalty = result.injuryPenaltyMap[p.id];
                if (penalty !== undefined && updatedP.health?.injury) {
                    const condAfterPenalty = Math.max(0, (updatedP.condition ?? 100) - penalty);
                    updatedP.health = { ...updatedP.health, injury: { ...updatedP.health.injury, conditionAtInjury: condAfterPenalty } };
                    updatedP.condition = condAfterPenalty;
                }
                return updatedP;
            });
            updatedPlayersMap = {
                ...updatedPlayersMap,
                [fixture.homeTeamId]: applyFatigueToTeam(result.updatedHomePlayers),
                [fixture.awayTeamId]: applyFatigueToTeam(result.updatedAwayPlayers),
            };
            // ── Kartki → statystyki i zawieszenia (jak w BackgroundMatchProcessor) ─
            result.cards.forEach(card => {
                const eventType = card.type === 'RED' || card.type === 'SECOND_YELLOW'
                    ? MatchEventType.RED_CARD
                    : MatchEventType.YELLOW_CARD;
                updatedPlayersMap = PlayerStatsService.applyCard(updatedPlayersMap, card.playerId, eventType);
            });
            // ── Historia meczu ───────────────────────────────────────────────
            matchHistoryEntries.push({
                matchId: fixture.id,
                date: currentDate.toISOString(),
                season: seasonNumber,
                competition: fixture.leagueId,
                homeTeamId: fixture.homeTeamId,
                awayTeamId: fixture.awayTeamId,
                homeScore: result.homeScore,
                awayScore: result.awayScore,
                homePenaltyScore: result.penaltyHome,
                awayPenaltyScore: result.penaltyAway,
                goals: result.goals,
                cards: result.cards,
                substitutions: result.substitutions,
            });
        });
        return { updatedFixtures, updatedPlayers: updatedPlayersMap, matchHistoryEntries };
    }
};
