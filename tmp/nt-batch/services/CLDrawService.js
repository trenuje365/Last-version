import { MatchStatus, CompetitionType } from '../types';
import { generateEuropeanClubId } from '../resources/static_db/clubs/ChampionsLeagueTeams';
export const CLDrawService = {
    getEligibleTeams: (rawClubs) => {
        const tier4 = rawClubs.filter(c => c.tier === 4);
        const tier3 = rawClubs.filter(c => c.tier === 3);
        let pool = [...tier4, ...tier3];
        if (pool.length < 36) {
            const tier2 = rawClubs.filter(c => c.tier === 2);
            const shuffled = [...tier2].sort(() => Math.random() - 0.5);
            pool = [...pool, ...shuffled.slice(0, 36 - pool.length)];
        }
        return pool.slice(0, 36).map(c => generateEuropeanClubId(c.name));
    },
    drawPairs: (teamIds, clubs, date, seed) => {
        const shuffled = [...teamIds];
        let s = seed;
        for (let i = shuffled.length - 1; i > 0; i--) {
            s = (s * 1664525 + 1013904223) & 0xffffffff;
            const j = Math.abs(s) % (i + 1);
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        const pairs = [];
        for (let i = 0; i < shuffled.length - 1; i += 2) {
            const homeId = shuffled[i];
            const awayId = shuffled[i + 1];
            if (!homeId || !awayId)
                continue;
            pairs.push({
                id: `CL_R1Q_PAIR_${i / 2 + 1}_${date.getFullYear()}`,
                leagueId: CompetitionType.CHAMPIONS_LEAGUE_DRAW,
                homeTeamId: homeId,
                awayTeamId: awayId,
                date: date,
                status: MatchStatus.SCHEDULED,
                homeScore: null,
                awayScore: null,
            });
        }
        return pairs;
    },
    // ── R2Q: Zwycięzcy R1Q + drużyny które nie grały R1Q + Mistrz Polski ────
    getR2QPool: (rawClubs, allFixtures, polishChampionId, userTeamId) => {
        // 1. Wszystkie ID, które wystąpiły w R1Q (home lub away)
        const r1qParticipantIds = new Set();
        allFixtures.forEach(f => {
            if (f.leagueId === CompetitionType.CL_R1Q) {
                r1qParticipantIds.add(f.homeTeamId);
                r1qParticipantIds.add(f.awayTeamId);
            }
        });
        // 2. Zwycięzcy R1Q — wyznaczani z zakończonych rewanży
        const r1qWinners = [];
        allFixtures.forEach(f => {
            if (f.leagueId !== CompetitionType.CL_R1Q_RETURN || f.status !== MatchStatus.FINISHED)
                return;
            const firstLegId = f.id.replace('_RETURN', '');
            const leg1 = allFixtures.find(x => x.id === firstLegId);
            if (!leg1 || leg1.homeScore === null || leg1.awayScore === null)
                return;
            // TeamA = leg1.home, TeamB = leg1.away (rewanż: home=B, away=A)
            const teamATotal = leg1.homeScore + (f.awayScore ?? 0);
            const teamBTotal = leg1.awayScore + (f.homeScore ?? 0);
            let winnerId;
            if (teamATotal > teamBTotal) {
                winnerId = leg1.homeTeamId;
            }
            else if (teamBTotal > teamATotal) {
                winnerId = leg1.awayTeamId;
            }
            else if (f.homePenaltyScore != null && f.awayPenaltyScore != null) {
                winnerId = f.homePenaltyScore > f.awayPenaltyScore ? leg1.awayTeamId : leg1.homeTeamId;
            }
            else {
                // Fallback: karne nie zostały zapisane mimo remisu — awansuje drużyna A (gospodarz 1. meczu)
                winnerId = leg1.homeTeamId;
            }
            r1qWinners.push(winnerId);
        });
        // 3. Europejskie drużyny które NIE grały R1Q (Tier2/3/4, uzupełnienie Tier1)
        const euroIds = rawClubs
            .filter(c => !r1qParticipantIds.has(generateEuropeanClubId(c.name)))
            .sort((a, b) => a.tier - b.tier || b.reputation - a.reputation)
            .map(c => generateEuropeanClubId(c.name));
        // 4. Budowa puli: Mistrz Polski ZAWSZE pierwszy, potem reszta do 64
        // WAŻNE: gracz wchodzi do LM TYLKO jeśli jest mistrzem Polski
        const pool = [];
        // Najpierw dodaj mistrza Polski (gwarantujemy jego miejsce w puli)
        if (polishChampionId)
            pool.push(polishChampionId);
        // Dodaj zwycięzców R1Q
        for (const id of r1qWinners) {
            if (!pool.includes(id))
                pool.push(id);
        }
        // Dodaj europejskie drużyny bez R1Q (Tier1/2) do zapełnienia do 64
        for (const id of euroIds) {
            if (pool.length >= 64)
                break;
            if (!pool.includes(id))
                pool.push(id);
        }
        // Jeśli pula nadal < 64 — uzupełnij przegranymi z R1Q (18 dostępnych)
        if (pool.length < 64) {
            const r1qLoserIds = [...r1qParticipantIds]
                .filter(id => !r1qWinners.includes(id) && !pool.includes(id));
            pool.push(...r1qLoserIds.slice(0, 64 - pool.length));
        }
        // Awaryjne uzupełnienie Tier2 jeśli wciąż < 64
        if (pool.length < 64) {
            const tier2Ids = rawClubs
                .filter(c => c.tier === 2 && !pool.includes(generateEuropeanClubId(c.name)))
                .sort((a, b) => b.reputation - a.reputation)
                .map(c => generateEuropeanClubId(c.name));
            pool.push(...tier2Ids.slice(0, 64 - pool.length));
        }
        return pool.slice(0, 64);
    },
    drawR2QPairs: (teamIds, polishChampionId, rawClubs, clubs, date, seed) => {
        // Rozstawienie: sortuj po reputacji — top 32 = "koszyk mocnych", bottom 32 = "koszyk słabych"
        // Mistrz Polski zawsze do koszyka słabych
        const getReputation = (id) => {
            const raw = rawClubs.find(c => generateEuropeanClubId(c.name) === id);
            if (raw)
                return raw.reputation;
            const club = clubs.find(c => c.id === id);
            return club?.reputation ?? 5;
        };
        const sorted = [...teamIds].sort((a, b) => getReputation(b) - getReputation(a));
        // Koszyk mocnych = top 32, koszyk słabych = reszta
        let strong = sorted.slice(0, 32);
        let weak = sorted.slice(32);
        // Mistrz Polski musi być w koszyku słabych
        if (strong.includes(polishChampionId)) {
            const idx = strong.indexOf(polishChampionId);
            const lastWeak = weak[weak.length - 1];
            // zamień Mistrza z ostatnim w koszyku słabych
            strong[idx] = lastWeak;
            weak[weak.length - 1] = polishChampionId;
        }
        // Deterministyczny shuffle obu koszyków
        const seededShuffle = (arr, s) => {
            const a = [...arr];
            for (let i = a.length - 1; i > 0; i--) {
                s = (s * 1664525 + 1013904223) & 0xffffffff;
                const j = Math.abs(s) % (i + 1);
                [a[i], a[j]] = [a[j], a[i]];
            }
            return a;
        };
        strong = seededShuffle(strong, seed);
        weak = seededShuffle(weak, seed ^ 0xdeadbeef);
        const pairCount = Math.min(strong.length, weak.length);
        const pairs = [];
        for (let i = 0; i < pairCount; i++) {
            const homeId = strong[i];
            const awayId = weak[i];
            if (!homeId || !awayId)
                continue;
            pairs.push({
                id: `CL_R2Q_PAIR_${i + 1}_${date.getFullYear()}`,
                leagueId: CompetitionType.CL_R2Q_DRAW,
                homeTeamId: homeId,
                awayTeamId: awayId,
                date: date,
                status: MatchStatus.SCHEDULED,
                homeScore: null,
                awayScore: null,
            });
        }
        return pairs;
    },
    // ── FAZA GRUPOWA: wyznacz 32 awansujących z R2Q ─────────────────────────
    getGroupStagePool: (allFixtures, rawClubs) => {
        const r2qWinners = [];
        allFixtures.forEach(f => {
            if (f.leagueId !== CompetitionType.CL_R2Q_RETURN || f.status !== MatchStatus.FINISHED)
                return;
            const firstLegId = f.id.replace('_RETURN', '');
            const leg1 = allFixtures.find(x => x.id === firstLegId);
            if (!leg1 || leg1.homeScore === null || leg1.awayScore === null)
                return;
            // TeamA = leg1.home (gra rewanż jako gość), TeamB = leg1.away (gra rewanż jako gospodarz)
            const teamATotal = leg1.homeScore + (f.awayScore ?? 0);
            const teamBTotal = leg1.awayScore + (f.homeScore ?? 0);
            let winnerId;
            if (teamATotal > teamBTotal) {
                winnerId = leg1.homeTeamId;
            }
            else if (teamBTotal > teamATotal) {
                winnerId = leg1.awayTeamId;
            }
            else if (f.homePenaltyScore != null && f.awayPenaltyScore != null) {
                winnerId = f.homePenaltyScore > f.awayPenaltyScore ? leg1.awayTeamId : leg1.homeTeamId;
            }
            else {
                // Fallback: karne nie zostały zapisane mimo remisu — awansuje drużyna A (gospodarz 1. meczu)
                winnerId = leg1.homeTeamId;
            }
            r2qWinners.push(winnerId);
        });
        return r2qWinners;
    },
    // ── FAZA GRUPOWA: losowanie 8 grup po 4 drużyny (4 koszyki po 8) ─────────
    drawGroupStage: (teamIds, rawClubs, clubs, seed) => {
        // Pomocnicza reputacja
        const getReputation = (id) => {
            const raw = rawClubs.find(c => generateEuropeanClubId(c.name) === id);
            if (raw)
                return raw.reputation;
            const club = clubs.find(c => c.id === id);
            return club?.reputation ?? 5;
        };
        // Deterministyczny shuffle
        const seededShuffle = (arr, s) => {
            const a = [...arr];
            for (let i = a.length - 1; i > 0; i--) {
                s = (s * 1664525 + 1013904223) & 0xffffffff;
                const j = Math.abs(s) % (i + 1);
                [a[i], a[j]] = [a[j], a[i]];
            }
            return a;
        };
        // Kraj drużyny: z rawClubs lub PL_ prefix → Poland
        const getCountry = (id) => {
            const raw = rawClubs.find(c => generateEuropeanClubId(c.name) === id);
            if (raw)
                return raw.country;
            if (id.startsWith('PL_'))
                return 'Poland';
            return '';
        };
        // Przypisz koszyk do grup z ograniczeniem: brak dwóch drużyn z tego samego kraju w grupie.
        // Używa backtrackingu. Jeśli perfekcyjne przypisanie jest niemożliwe, minimalizuje konflikty.
        const assignPotToGroups = (pot, currentGroups, s) => {
            const shuffled = seededShuffle([...pot], s);
            const n = shuffled.length;
            const result = new Array(n).fill('');
            const used = new Array(n).fill(false);
            const canPlace = (teamIdx, groupIdx) => {
                const teamCountry = getCountry(shuffled[teamIdx]);
                if (!teamCountry)
                    return true;
                return !currentGroups[groupIdx].some(id => {
                    const c = getCountry(id);
                    return c && c === teamCountry;
                });
            };
            // Backtracking – szuka przypisania bez konfliktów krajowych
            const backtrack = (groupIdx) => {
                if (groupIdx === n)
                    return true;
                for (let i = 0; i < n; i++) {
                    if (used[i] || !canPlace(i, groupIdx))
                        continue;
                    used[i] = true;
                    result[groupIdx] = shuffled[i];
                    if (backtrack(groupIdx + 1))
                        return true;
                    used[i] = false;
                }
                return false;
            };
            if (backtrack(0))
                return result;
            // Fallback: minimalizuj liczbę konfliktów (gdy idealne przypisanie jest niemożliwe)
            const fbResult = new Array(n).fill('');
            const fbUsed = new Array(n).fill(false);
            let bestResult = [...shuffled];
            let minConflicts = n + 1;
            const btMinConflict = (groupIdx, conflicts) => {
                if (conflicts >= minConflicts)
                    return; // przycinanie gałęzi
                if (groupIdx === n) {
                    if (conflicts < minConflicts) {
                        minConflicts = conflicts;
                        bestResult = [...fbResult];
                    }
                    return;
                }
                for (let i = 0; i < n; i++) {
                    if (fbUsed[i])
                        continue;
                    fbUsed[i] = true;
                    fbResult[groupIdx] = shuffled[i];
                    btMinConflict(groupIdx + 1, conflicts + (canPlace(i, groupIdx) ? 0 : 1));
                    fbUsed[i] = false;
                }
            };
            btMinConflict(0, 0);
            return bestResult;
        };
        // Upewnij się że mamy 32 drużyny (uzupełnij lub przytnij)
        let pool = [...teamIds];
        if (pool.length < 32) {
            // fallback: uzupełnij najlepszymi z rawClubs których jeszcze nie ma
            const missing = rawClubs
                .filter(c => !pool.includes(generateEuropeanClubId(c.name)))
                .sort((a, b) => b.reputation - a.reputation)
                .map(c => generateEuropeanClubId(c.name));
            pool = [...pool, ...missing].slice(0, 32);
        }
        pool = pool.slice(0, 32);
        // Sortuj po reputacji (malejąco) → 4 koszyki po 8
        const sorted = [...pool].sort((a, b) => getReputation(b) - getReputation(a));
        const pot1 = seededShuffle(sorted.slice(0, 8), seed);
        const pot2 = sorted.slice(8, 16);
        const pot3 = sorted.slice(16, 24);
        const pot4 = sorted.slice(24, 32);
        // Koszyk 1: przypisz bezpośrednio (grupy są puste – brak możliwych konfliktów)
        const assignedPot1 = pot1;
        const groupsAfterPot1 = Array.from({ length: 8 }, (_, i) => [assignedPot1[i]]);
        // Koszyki 2-4: przypisz z ograniczeniem krajowym
        const assignedPot2 = assignPotToGroups(pot2, groupsAfterPot1, seed ^ 0x11111111);
        const groupsAfterPot2 = groupsAfterPot1.map((g, i) => [...g, assignedPot2[i]]);
        const assignedPot3 = assignPotToGroups(pot3, groupsAfterPot2, seed ^ 0x22222222);
        const groupsAfterPot3 = groupsAfterPot2.map((g, i) => [...g, assignedPot3[i]]);
        const assignedPot4 = assignPotToGroups(pot4, groupsAfterPot3, seed ^ 0x33333333);
        // Złóż finalne grupy
        const groups = Array.from({ length: 8 }, (_, i) => [
            assignedPot1[i],
            assignedPot2[i],
            assignedPot3[i],
            assignedPot4[i],
        ]);
        return groups;
    },
    // ── FAZA GRUPOWA: generuj fixtury dla 6 kolejek ───────────────────────────
    // Każda grupa (4 drużyny) rozgrywa 6 meczów: schemat round-robin 2 rundy
    // Daty: tablica 6 dat kolejek podawana z kalendarza
    generateGroupStageFixtures: (groups, matchdayDates, year) => {
        const fixtures = [];
        // Plan round-robin dla 4 drużyn (indeksy 0-3):
        // MD1: 0vs1, 2vs3 | MD2: 0vs2, 1vs3 | MD3: 0vs3, 1vs2
        // MD4: 1vs0, 3vs2 | MD5: 2vs0, 3vs1 | MD6: 3vs0, 2vs1
        const schedule = [
            [[0, 1], [2, 3]], // MD1
            [[0, 2], [1, 3]], // MD2
            [[0, 3], [1, 2]], // MD3
            [[1, 0], [3, 2]], // MD4 (rewers)
            [[2, 0], [3, 1]], // MD5 (rewers)
            [[3, 0], [2, 1]], // MD6 (rewers)
        ];
        groups.forEach((group, gi) => {
            const groupLetter = 'ABCDEFGH'[gi];
            schedule.forEach((pairs, mdi) => {
                const matchDate = matchdayDates[mdi] ?? new Date(year, 8, 18);
                pairs.forEach(([hIdx, aIdx]) => {
                    const homeId = group[hIdx];
                    const awayId = group[aIdx];
                    fixtures.push({
                        id: `CL_GS_G${groupLetter}_MD${mdi + 1}_${hIdx}v${aIdx}_${year}`,
                        leagueId: CompetitionType.CL_GROUP_STAGE,
                        homeTeamId: homeId,
                        awayTeamId: awayId,
                        date: new Date(matchDate),
                        status: MatchStatus.SCHEDULED,
                        homeScore: null,
                        awayScore: null,
                    });
                });
            });
        });
        return fixtures;
    },
    // ── 1/8 FINAŁU: Oblicz pary wg stałych reguł LM ────────────────────────
    computeR16Pairs: (clGroups, allFixtures) => {
        // Pomocnicza: oblicz kolejność w grupie (sorted[0]=winner, sorted[1]=runner-up)
        const getGroupRanking = (groupTeams) => {
            const stats = {};
            groupTeams.forEach(id => { stats[id] = { pts: 0, gf: 0, ga: 0 }; });
            allFixtures.forEach(f => {
                if (f.leagueId !== CompetitionType.CL_GROUP_STAGE)
                    return;
                if (f.homeScore === null || f.awayScore === null)
                    return;
                if (!groupTeams.includes(f.homeTeamId) || !groupTeams.includes(f.awayTeamId))
                    return;
                const hs = f.homeScore;
                const as_ = f.awayScore;
                stats[f.homeTeamId].gf += hs;
                stats[f.homeTeamId].ga += as_;
                stats[f.awayTeamId].gf += as_;
                stats[f.awayTeamId].ga += hs;
                if (hs > as_)
                    stats[f.homeTeamId].pts += 3;
                else if (hs < as_)
                    stats[f.awayTeamId].pts += 3;
                else {
                    stats[f.homeTeamId].pts++;
                    stats[f.awayTeamId].pts++;
                }
            });
            return [...groupTeams].sort((a, b) => {
                const sa = stats[a];
                const sb = stats[b];
                return sb.pts - sa.pts ||
                    (sb.gf - sb.ga) - (sa.gf - sa.ga) ||
                    sb.gf - sa.gf;
            });
        };
        // clGroups: indeks 0=A, 1=B, 2=C, 3=D, 4=E, 5=F, 6=G, 7=H
        const ranked = clGroups.map(g => getGroupRanking(g));
        const winner = (g) => ranked[g]?.[0] ?? clGroups[g]?.[0];
        const runner = (g) => ranked[g]?.[1] ?? clGroups[g]?.[1];
        // Stara formuła LM: winner gra rewanż u siebie
        return [
            { winnerId: winner(0), runnerId: runner(2) }, // A winner vs C runner-up
            { winnerId: winner(1), runnerId: runner(3) }, // B winner vs D runner-up
            { winnerId: winner(2), runnerId: runner(0) }, // C winner vs A runner-up
            { winnerId: winner(3), runnerId: runner(1) }, // D winner vs B runner-up
            { winnerId: winner(4), runnerId: runner(6) }, // E winner vs G runner-up
            { winnerId: winner(5), runnerId: runner(7) }, // F winner vs H runner-up
            { winnerId: winner(6), runnerId: runner(4) }, // G winner vs E runner-up
            { winnerId: winner(7), runnerId: runner(5) }, // H winner vs F runner-up
        ];
    },
    // ── 1/8 FINAŁU: Generuj fixtury obu meczów ──────────────────────────────
    generateR16Fixtures: (clGroups, allFixtures, leg1Date, leg2Date, year) => {
        const pairs = CLDrawService.computeR16Pairs(clGroups, allFixtures);
        const fixtures = [];
        pairs.forEach((pair, i) => {
            const pairId = `CL_R16_PAIR_${i + 1}_${year}`;
            // 1. mecz: runner-up gra GOSPODARZEM (stara reguła LM)
            fixtures.push({
                id: pairId,
                leagueId: CompetitionType.CL_R16,
                homeTeamId: pair.runnerId,
                awayTeamId: pair.winnerId,
                date: new Date(leg1Date),
                status: MatchStatus.SCHEDULED,
                homeScore: null,
                awayScore: null,
            });
            // Rewanż: winner gra GOSPODARZEM
            fixtures.push({
                id: `${pairId}_RETURN`,
                leagueId: CompetitionType.CL_R16_RETURN,
                homeTeamId: pair.winnerId,
                awayTeamId: pair.runnerId,
                date: new Date(leg2Date),
                status: MatchStatus.SCHEDULED,
                homeScore: null,
                awayScore: null,
            });
        });
        return fixtures;
    }, // ← istniejący koniec generateR16Fixtures
    // ── 1/4 FINAŁU: Wyznacz 8 zwycięzców z 1/8 ─────────────────────────────
    getR16Winners: (allFixtures) => {
        const winners = [];
        allFixtures.forEach(f => {
            if (f.leagueId !== CompetitionType.CL_R16_RETURN || f.status !== MatchStatus.FINISHED)
                return;
            const firstLegId = f.id.replace('_RETURN', '');
            const leg1 = allFixtures.find(x => x.id === firstLegId);
            if (!leg1 || leg1.homeScore === null || leg1.awayScore === null)
                return;
            // TeamA = leg1.home, TeamB = leg1.away (rewanż: home=B, away=A)
            const teamATotal = leg1.homeScore + (f.awayScore ?? 0);
            const teamBTotal = leg1.awayScore + (f.homeScore ?? 0);
            let winnerId;
            if (teamATotal > teamBTotal) {
                winnerId = leg1.homeTeamId;
            }
            else if (teamBTotal > teamATotal) {
                winnerId = leg1.awayTeamId;
            }
            else if (f.homePenaltyScore != null && f.awayPenaltyScore != null) {
                winnerId = f.homePenaltyScore > f.awayPenaltyScore ? leg1.awayTeamId : leg1.homeTeamId;
            }
            else {
                // Fallback: karne nie zostały zapisane mimo remisu — awansuje drużyna A (gospodarz 1. meczu)
                winnerId = leg1.homeTeamId;
            }
            winners.push(winnerId);
        });
        return winners;
    },
    // ── 1/4 FINAŁU: Generuj fixtury (pełne losowanie bez koszyczków) ─────────
    generateQFFixtures: (r16WinnerIds, leg1Date, leg2Date, year, seed) => {
        // Deterministyczny shuffle — pełne losowanie, brak koszyczków
        const shuffled = [...r16WinnerIds];
        let s = seed;
        for (let i = shuffled.length - 1; i > 0; i--) {
            s = (s * 1664525 + 1013904223) & 0xffffffff;
            const j = Math.abs(s) % (i + 1);
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        const fixtures = [];
        for (let i = 0; i < shuffled.length - 1; i += 2) {
            const teamA = shuffled[i]; // 1. mecz: teamA gra GOSPODARZEM
            const teamB = shuffled[i + 1]; // rewanż:  teamB gra GOSPODARZEM
            if (!teamA || !teamB)
                continue;
            const pairId = `CL_QF_PAIR_${i / 2 + 1}_${year}`;
            // 1. mecz
            fixtures.push({
                id: pairId,
                leagueId: CompetitionType.CL_QF,
                homeTeamId: teamA,
                awayTeamId: teamB,
                date: new Date(leg1Date),
                status: MatchStatus.SCHEDULED,
                homeScore: null,
                awayScore: null,
            });
            // Rewanż
            fixtures.push({
                id: `${pairId}_RETURN`,
                leagueId: CompetitionType.CL_QF_RETURN,
                homeTeamId: teamB,
                awayTeamId: teamA,
                date: new Date(leg2Date),
                status: MatchStatus.SCHEDULED,
                homeScore: null,
                awayScore: null,
            });
        }
        return fixtures;
    }, // ← istniejący koniec generateQFFixtures
    // ── 1/2 FINAŁU: Wyznacz 4 zwycięzców z 1/4 ──────────────────────────────
    getQFWinners: (allFixtures) => {
        const winners = [];
        allFixtures.forEach(f => {
            if (f.leagueId !== CompetitionType.CL_QF_RETURN || f.status !== MatchStatus.FINISHED)
                return;
            const firstLegId = f.id.replace('_RETURN', '');
            const leg1 = allFixtures.find(x => x.id === firstLegId);
            if (!leg1 || leg1.homeScore === null || leg1.awayScore === null)
                return;
            const teamATotal = leg1.homeScore + (f.awayScore ?? 0);
            const teamBTotal = leg1.awayScore + (f.homeScore ?? 0);
            let winnerId;
            if (teamATotal > teamBTotal) {
                winnerId = leg1.homeTeamId;
            }
            else if (teamBTotal > teamATotal) {
                winnerId = leg1.awayTeamId;
            }
            else if (f.homePenaltyScore != null && f.awayPenaltyScore != null) {
                winnerId = f.homePenaltyScore > f.awayPenaltyScore ? leg1.awayTeamId : leg1.homeTeamId;
            }
            else {
                // Fallback: karne nie zostały zapisane mimo remisu — awansuje drużyna A (gospodarz 1. meczu)
                winnerId = leg1.homeTeamId;
            }
            winners.push(winnerId);
        });
        return winners;
    },
    // ── 1/2 FINAŁU: Generuj fixtury (pełne losowanie bez koszyczków) ─────────
    generateSFFixtures: (qfWinnerIds, leg1Date, leg2Date, year, seed) => {
        const shuffled = [...qfWinnerIds];
        let s = seed ^ 0xabcdef12; // inny seed niż QF
        for (let i = shuffled.length - 1; i > 0; i--) {
            s = (s * 1664525 + 1013904223) & 0xffffffff;
            const j = Math.abs(s) % (i + 1);
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        const fixtures = [];
        for (let i = 0; i < shuffled.length - 1; i += 2) {
            const teamA = shuffled[i];
            const teamB = shuffled[i + 1];
            if (!teamA || !teamB)
                continue;
            const pairId = `CL_SF_PAIR_${i / 2 + 1}_${year}`;
            fixtures.push({
                id: pairId,
                leagueId: CompetitionType.CL_SF,
                homeTeamId: teamA,
                awayTeamId: teamB,
                date: new Date(leg1Date),
                status: MatchStatus.SCHEDULED,
                homeScore: null,
                awayScore: null,
            });
            fixtures.push({
                id: `${pairId}_RETURN`,
                leagueId: CompetitionType.CL_SF_RETURN,
                homeTeamId: teamB,
                awayTeamId: teamA,
                date: new Date(leg2Date),
                status: MatchStatus.SCHEDULED,
                homeScore: null,
                awayScore: null,
            });
        }
        return fixtures;
    },
    // ── FINAŁ: Wyznacz 2 zwycięzców 1/2 Finału ───────────────────────────────
    getSFWinners: (allFixtures) => {
        const winners = [];
        allFixtures.forEach(f => {
            if (f.leagueId !== CompetitionType.CL_SF_RETURN || f.status !== MatchStatus.FINISHED)
                return;
            const firstLegId = f.id.replace('_RETURN', '');
            const leg1 = allFixtures.find(x => x.id === firstLegId);
            if (!leg1 || leg1.homeScore === null || leg1.awayScore === null)
                return;
            const teamATotal = leg1.homeScore + (f.awayScore ?? 0);
            const teamBTotal = leg1.awayScore + (f.homeScore ?? 0);
            let winnerId;
            if (teamATotal > teamBTotal) {
                winnerId = leg1.homeTeamId;
            }
            else if (teamBTotal > teamATotal) {
                winnerId = leg1.awayTeamId;
            }
            else if (f.homePenaltyScore != null && f.awayPenaltyScore != null) {
                winnerId = f.homePenaltyScore > f.awayPenaltyScore ? leg1.awayTeamId : leg1.homeTeamId;
            }
            else {
                // Fallback: karne nie zostały zapisane mimo remisu — awansuje drużyna A (gospodarz 1. meczu)
                winnerId = leg1.homeTeamId;
            }
            winners.push(winnerId);
        });
        return winners;
    },
    // ── FINAŁ: Generuj jeden mecz finałowy ───────────────────────────────────
    generateFinalFixture: (teamAId, teamBId, date, year) => {
        return {
            id: `CL_FINAL_${year}`,
            leagueId: CompetitionType.CL_FINAL,
            homeTeamId: teamAId,
            awayTeamId: teamBId,
            date: new Date(date),
            status: MatchStatus.SCHEDULED,
            homeScore: null,
            awayScore: null,
        };
    },
    // ── ZABEZPIECZENIE SLOTÓW ────────────────────────────────────────────────
    // Pomocnicze: pobierz wszystkich uczestników danej rundy (1. mecz)
    getR16Participants: (allFixtures) => {
        const ids = new Set();
        allFixtures.forEach(f => {
            if (f.leagueId === CompetitionType.CL_R16) {
                ids.add(f.homeTeamId);
                ids.add(f.awayTeamId);
            }
        });
        return [...ids];
    },
    getQFParticipants: (allFixtures) => {
        const ids = new Set();
        allFixtures.forEach(f => {
            if (f.leagueId === CompetitionType.CL_QF) {
                ids.add(f.homeTeamId);
                ids.add(f.awayTeamId);
            }
        });
        return [...ids];
    },
    getSFParticipants: (allFixtures) => {
        const ids = new Set();
        allFixtures.forEach(f => {
            if (f.leagueId === CompetitionType.CL_SF) {
                ids.add(f.homeTeamId);
                ids.add(f.awayTeamId);
            }
        });
        return [...ids];
    },
    // Jeśli lista zwycięzców jest niepełna, uzupełnij z puli uczestników poprzedniej rundy
    guaranteeWinners: (winners, fallbackPool, expectedCount) => {
        if (winners.length >= expectedCount)
            return winners.slice(0, expectedCount);
        const result = [...winners];
        for (const id of fallbackPool) {
            if (result.length >= expectedCount)
                break;
            if (!result.includes(id))
                result.push(id);
        }
        return result;
    },
}; // ← koniec obiektu CLDrawService
