import { Club, Fixture, MatchStatus, CompetitionType } from '../types';
import { generateELClubId } from '../resources/static_db/clubs/EuropeLeagueTeams';

type RawELClub = {
  name: string;
  country: string;
  tier: number;
  colors: string[];
  stadium: string;
  capacity: number;
  reputation: number;
};

// ── Seeded LCG random generator ───────────────────────────────────────────────
function makeLcg(seed: number) {
  let s = seed ^ 0xAB12CD34;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

// ── Europa League Draw Service ────────────────────────────────────────────────
export const ELDrawService = {

  /**
   * Wybiera `count` (domyślnie 64) drużyn do losowania Rundy 1 LE.
   * Algorytm round-robin po krajach zapewnia maksymalną różnorodność.
   * Wyklucza polskie kluby (country === 'POL').
   * Priorytety: Tier 4 → Tier 3 → Tier 2 (wybiera najlepszych z każdego kraju w danym polu).
   */
  getEligibleTeams(rawClubs: RawELClub[], seed: number, count = 64): string[] {
    const rng = makeLcg(seed);

    // Wyklucz polskie drużyny
    const eligible = rawClubs.filter(c => c.country !== 'POL');

    // Grupuj po krajach, sortuj reputacją malejąco wewnątrz krajów
    const byCountry = new Map<string, RawELClub[]>();
    for (const club of eligible) {
      const bucket = byCountry.get(club.country) ?? [];
      bucket.push(club);
      byCountry.set(club.country, bucket);
    }
    byCountry.forEach((bucket, country) => {
      // Tier 4 najpierw, potem tier 3, potem tier 2; w ramach tieru malejąca reputacja
      byCountry.set(
        country,
        bucket.sort((a, b) => b.tier - a.tier || b.reputation - a.reputation),
      );
    });

    // Losowo przetasuj kolejność krajów (seeded)
    const countries = Array.from(byCountry.keys());
    for (let i = countries.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [countries[i], countries[j]] = [countries[j], countries[i]];
    }

    // Round-robin: iteruj po krajach, za każdym razem wybierz następny klub z danego kraju
    const pointers = new Map<string, number>(countries.map(c => [c, 0]));
    const selected: RawELClub[] = [];

    let pass = 0;
    while (selected.length < count && pass < 10) {
      let addedInPass = 0;
      for (const country of countries) {
        if (selected.length >= count) break;
        const bucket = byCountry.get(country)!;
        const ptr = pointers.get(country)!;
        if (ptr < bucket.length) {
          selected.push(bucket[ptr]);
          pointers.set(country, ptr + 1);
          addedInPass++;
        }
      }
      pass++;
      if (addedInPass === 0) break;
    }

    return selected.slice(0, count).map(c => generateELClubId(c.name));
  },

  /**
   * Losuje 32 pary z 64 ID drużyn.
   * Używa seeded shuffle'u różniącego się od losowania LM (XOR seed).
   */
  drawPairs(teamIds: string[], clubs: Club[], date: Date, seed: number): Fixture[] {
    const shuffled = [...teamIds];
    // XOR seed z inną stałą niż CL draw, żeby wyniki się różniły
    let s = (seed ^ 0xE11EEE00) >>> 0;
    for (let i = shuffled.length - 1; i > 0; i--) {
      s = (s * 1664525 + 1013904223) & 0xffffffff;
      const j = Math.abs(s) % (i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const pairs: Fixture[] = [];
    for (let i = 0; i < shuffled.length - 1; i += 2) {
      const homeId = shuffled[i];
      const awayId = shuffled[i + 1];
      if (!homeId || !awayId) continue;
      pairs.push({
        id: `EL_R1Q_PAIR_${i / 2 + 1}_${date.getFullYear()}`,
        leagueId: CompetitionType.EL_R1Q_DRAW,
        homeTeamId: homeId,
        awayTeamId: awayId,
        date,
        status: MatchStatus.SCHEDULED,
        homeScore: null,
        awayScore: null,
      });
    }
    return pairs;
  },

  // ── R2Q: Zwycięzcy R1Q + drużyny które nie grały R1Q + Zwycięzca PP ─────
  getR2QPool(
    rawClubs: RawELClub[],
    allFixtures: Fixture[],
    polishCupWinnerId: string,
  ): string[] {
    // 1. Wszystkie ID, które wystąpiły w R1Q (home lub away)
    const r1qParticipantIds = new Set<string>();
    allFixtures.forEach(f => {
      if (f.leagueId === CompetitionType.EL_R1Q) {
        r1qParticipantIds.add(f.homeTeamId);
        r1qParticipantIds.add(f.awayTeamId);
      }
    });

    // 2. Zwycięzcy R1Q — wyznaczani z zakończonych rewanży
    const r1qWinners: string[] = [];
    allFixtures.forEach(f => {
      if (f.leagueId !== CompetitionType.EL_R1Q_RETURN || f.status !== MatchStatus.FINISHED) return;
      const firstLegId = f.id.replace('_RETURN', '');
      const leg1 = allFixtures.find(x => x.id === firstLegId);
      if (!leg1 || leg1.homeScore === null || leg1.awayScore === null) return;

      const teamATotal = (leg1.homeScore as number) + (f.awayScore ?? 0);
      const teamBTotal = (leg1.awayScore as number) + (f.homeScore ?? 0);

      let winnerId: string;
      if (teamATotal > teamBTotal) {
        winnerId = leg1.homeTeamId;
      } else if (teamBTotal > teamATotal) {
        winnerId = leg1.awayTeamId;
      } else if (f.homePenaltyScore != null && f.awayPenaltyScore != null) {
        winnerId = f.homePenaltyScore > f.awayPenaltyScore ? leg1.awayTeamId : leg1.homeTeamId;
      } else {
        winnerId = leg1.homeTeamId;
      }
      r1qWinners.push(winnerId);
    });

    // 3. Europejskie drużyny LE, które NIE grały R1Q (bez polskich)
    const nonR1qEligible = rawClubs
      .filter(c => c.country !== 'POL' && !r1qParticipantIds.has(generateELClubId(c.name)))
      .sort((a, b) => a.tier - b.tier || b.reputation - a.reputation)
      .map(c => generateELClubId(c.name));

    // 4. Budowa puli: Zwycięzca PP ZAWSZE pierwszy, potem zwycięzcy R1Q, potem uzupełnienie
    const pool: string[] = [];

    if (polishCupWinnerId) pool.push(polishCupWinnerId);

    for (const id of r1qWinners) {
      if (!pool.includes(id)) pool.push(id);
    }

    for (const id of nonR1qEligible) {
      if (pool.length >= 64) break;
      if (!pool.includes(id)) pool.push(id);
    }

    // Awaryjne uzupełnienie przegranymi z R1Q jeśli < 64
    if (pool.length < 64) {
      const r1qLoserIds = [...r1qParticipantIds]
        .filter(id => !r1qWinners.includes(id) && !pool.includes(id));
      pool.push(...r1qLoserIds.slice(0, 64 - pool.length));
    }

    return pool.slice(0, 64);
  },

  drawR2QPairs(teamIds: string[], clubs: Club[], date: Date, seed: number): Fixture[] {
    const shuffled = [...teamIds];
    let s = (seed ^ 0xF22EEE11) >>> 0;
    for (let i = shuffled.length - 1; i > 0; i--) {
      s = (s * 1664525 + 1013904223) & 0xffffffff;
      const j = Math.abs(s) % (i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const pairs: Fixture[] = [];
    for (let i = 0; i < shuffled.length - 1; i += 2) {
      const homeId = shuffled[i];
      const awayId = shuffled[i + 1];
      if (!homeId || !awayId) continue;
      pairs.push({
        id: `EL_R2Q_PAIR_${i / 2 + 1}_${date.getFullYear()}`,
        leagueId: CompetitionType.EL_R2Q_DRAW,
        homeTeamId: homeId,
        awayTeamId: awayId,
        date,
        status: MatchStatus.SCHEDULED,
        homeScore: null,
        awayScore: null,
      });
    }
    return pairs;
  },

  // ── FAZA GRUPOWA: wyznacz 32 awansujących z R2Q ─────────────────────────
  getGroupStagePool(allFixtures: Fixture[]): string[] {
    const r2qWinners: string[] = [];

    allFixtures.forEach(f => {
      if (f.leagueId !== CompetitionType.EL_R2Q_RETURN || f.status !== MatchStatus.FINISHED) return;
      const firstLegId = f.id.replace('_RETURN', '');
      const leg1 = allFixtures.find(x => x.id === firstLegId);
      if (!leg1 || leg1.homeScore === null || leg1.awayScore === null) return;

      const teamATotal = (leg1.homeScore as number) + (f.awayScore ?? 0);
      const teamBTotal = (leg1.awayScore as number) + (f.homeScore ?? 0);

      let winnerId: string;
      if (teamATotal > teamBTotal) {
        winnerId = leg1.homeTeamId;
      } else if (teamBTotal > teamATotal) {
        winnerId = leg1.awayTeamId;
      } else if (f.homePenaltyScore != null && f.awayPenaltyScore != null) {
        winnerId = f.homePenaltyScore > f.awayPenaltyScore ? leg1.awayTeamId : leg1.homeTeamId;
      } else {
        winnerId = leg1.homeTeamId;
      }
      r2qWinners.push(winnerId);
    });

    return r2qWinners;
  },

  // ── FAZA GRUPOWA: losowanie 8 grup po 4 drużyny (4 koszyki po 8) ─────────
  drawGroupStage(
    teamIds: string[],
    rawClubs: { name: string; country: string; reputation: number }[],
    clubs: Club[],
    seed: number,
  ): string[][] {
    const getReputation = (id: string): number => {
      const raw = rawClubs.find(c => generateELClubId(c.name) === id);
      if (raw) return raw.reputation;
      const club = clubs.find(c => c.id === id);
      return club?.reputation ?? 5;
    };

    const seededShuffle = (arr: string[], s: number): string[] => {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        s = (s * 1664525 + 1013904223) & 0xffffffff;
        const j = Math.abs(s) % (i + 1);
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    };

    const getCountry = (id: string): string => {
      const raw = rawClubs.find(c => generateELClubId(c.name) === id);
      if (raw) return raw.country;
      if (id.startsWith('PL_')) return 'POL';
      return '';
    };

    const assignPotToGroups = (
      pot: string[],
      currentGroups: string[][],
      s: number,
    ): string[] => {
      const shuffled = seededShuffle([...pot], s);
      const n = shuffled.length;
      const result: string[] = new Array(n).fill('');
      const used: boolean[] = new Array(n).fill(false);

      const canPlace = (teamIdx: number, groupIdx: number): boolean => {
        const teamCountry = getCountry(shuffled[teamIdx]);
        if (!teamCountry) return true;
        return !currentGroups[groupIdx].some(id => {
          const c = getCountry(id);
          return c && c === teamCountry;
        });
      };

      const backtrack = (groupIdx: number): boolean => {
        if (groupIdx === n) return true;
        for (let i = 0; i < n; i++) {
          if (used[i] || !canPlace(i, groupIdx)) continue;
          used[i] = true;
          result[groupIdx] = shuffled[i];
          if (backtrack(groupIdx + 1)) return true;
          used[i] = false;
        }
        return false;
      };

      if (backtrack(0)) return result;

      const fbResult: string[] = new Array(n).fill('');
      const fbUsed: boolean[] = new Array(n).fill(false);
      let bestResult: string[] = [...shuffled];
      let minConflicts = n + 1;

      const btMinConflict = (groupIdx: number, conflicts: number): void => {
        if (conflicts >= minConflicts) return;
        if (groupIdx === n) {
          if (conflicts < minConflicts) {
            minConflicts = conflicts;
            bestResult = [...fbResult];
          }
          return;
        }
        for (let i = 0; i < n; i++) {
          if (fbUsed[i]) continue;
          fbUsed[i] = true;
          fbResult[groupIdx] = shuffled[i];
          btMinConflict(groupIdx + 1, conflicts + (canPlace(i, groupIdx) ? 0 : 1));
          fbUsed[i] = false;
        }
      };

      btMinConflict(0, 0);
      return bestResult;
    };

    let pool = [...teamIds];
    if (pool.length < 32) {
      const missing = rawClubs
        .filter(c => !pool.includes(generateELClubId(c.name)))
        .sort((a, b) => b.reputation - a.reputation)
        .map(c => generateELClubId(c.name));
      pool = [...pool, ...missing].slice(0, 32);
    }
    pool = pool.slice(0, 32);

    const sorted = [...pool].sort((a, b) => getReputation(b) - getReputation(a));
    const pot1 = seededShuffle(sorted.slice(0, 8), seed);
    const pot2 = sorted.slice(8, 16);
    const pot3 = sorted.slice(16, 24);
    const pot4 = sorted.slice(24, 32);

    const assignedPot1 = pot1;
    const groupsAfterPot1: string[][] = Array.from({ length: 8 }, (_, i) => [assignedPot1[i]]);

    const assignedPot2 = assignPotToGroups(pot2, groupsAfterPot1, seed ^ 0x11111111);
    const groupsAfterPot2: string[][] = groupsAfterPot1.map((g, i) => [...g, assignedPot2[i]]);

    const assignedPot3 = assignPotToGroups(pot3, groupsAfterPot2, seed ^ 0x22222222);
    const groupsAfterPot3: string[][] = groupsAfterPot2.map((g, i) => [...g, assignedPot3[i]]);

    const assignedPot4 = assignPotToGroups(pot4, groupsAfterPot3, seed ^ 0x33333333);

    const groups: string[][] = Array.from({ length: 8 }, (_, i) => [
      assignedPot1[i],
      assignedPot2[i],
      assignedPot3[i],
      assignedPot4[i],
    ]);

    return groups;
  },

  // ── FAZA GRUPOWA: generuj fixtury dla 6 kolejek ───────────────────────────
  generateGroupStageFixtures(
    groups: string[][],
    matchdayDates: Date[],
    year: number,
  ): Fixture[] {
    const fixtures: Fixture[] = [];

    // Plan round-robin dla 4 drużyn (indeksy 0-3):
    // MD1: 0vs1, 2vs3 | MD2: 0vs2, 1vs3 | MD3: 0vs3, 1vs2
    // MD4: 1vs0, 3vs2 | MD5: 2vs0, 3vs1 | MD6: 3vs0, 2vs1
    const schedule = [
      [[0,1],[2,3]],
      [[0,2],[1,3]],
      [[0,3],[1,2]],
      [[1,0],[3,2]],
      [[2,0],[3,1]],
      [[3,0],[2,1]],
    ];

    groups.forEach((group, gi) => {
      const groupLetter = 'ABCDEFGH'[gi];

      schedule.forEach((pairs, mdi) => {
        const matchDate = matchdayDates[mdi] ?? new Date(year, 8, 19);

        pairs.forEach(([hIdx, aIdx]) => {
          const homeId = group[hIdx];
          const awayId = group[aIdx];
          fixtures.push({
            id: `EL_GS_G${groupLetter}_MD${mdi + 1}_${hIdx}v${aIdx}_${year}`,
            leagueId: CompetitionType.EL_GROUP_STAGE,
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

  // ── 1/8 FINAŁU: Oblicz pary wg stałego matriksa LE ────────────────────────
  // Grupy: 0=A, 1=B, 2=C, 3=D, 4=E, 5=F, 6=G, 7=H
  // Matrix: 1A-2C, 1B-2D, 1C-2A, 1D-2B, 1E-2G, 1F-2H, 1G-2E, 1H-2F
  computeELR16Pairs(
    elGroups: string[][],
    allFixtures: Fixture[],
  ): { winnerId: string; runnerId: string }[] {
    const getGroupRanking = (groupTeams: string[]): string[] => {
      const stats: Record<string, { pts: number; gf: number; ga: number }> = {};
      groupTeams.forEach(id => { stats[id] = { pts: 0, gf: 0, ga: 0 }; });

      allFixtures.forEach(f => {
        if (f.leagueId !== CompetitionType.EL_GROUP_STAGE) return;
        if (f.homeScore === null || f.awayScore === null) return;
        if (!groupTeams.includes(f.homeTeamId) || !groupTeams.includes(f.awayTeamId)) return;
        const hs = f.homeScore as number;
        const as_ = f.awayScore as number;
        stats[f.homeTeamId].gf += hs; stats[f.homeTeamId].ga += as_;
        stats[f.awayTeamId].gf += as_; stats[f.awayTeamId].ga += hs;
        if (hs > as_) stats[f.homeTeamId].pts += 3;
        else if (hs < as_) stats[f.awayTeamId].pts += 3;
        else { stats[f.homeTeamId].pts++; stats[f.awayTeamId].pts++; }
      });

      return [...groupTeams].sort((a, b) => {
        const sa = stats[a]; const sb = stats[b];
        return sb.pts - sa.pts ||
               (sb.gf - sb.ga) - (sa.gf - sa.ga) ||
               sb.gf - sa.gf;
      });
    };

    const ranked = elGroups.map(g => getGroupRanking(g));
    const winner = (g: number) => ranked[g]?.[0] ?? elGroups[g]?.[0];
    const runner = (g: number) => ranked[g]?.[1] ?? elGroups[g]?.[1];

    return [
      { winnerId: winner(0), runnerId: runner(2) }, // 1A vs 2C
      { winnerId: winner(1), runnerId: runner(3) }, // 1B vs 2D
      { winnerId: winner(2), runnerId: runner(0) }, // 1C vs 2A
      { winnerId: winner(3), runnerId: runner(1) }, // 1D vs 2B
      { winnerId: winner(4), runnerId: runner(6) }, // 1E vs 2G
      { winnerId: winner(5), runnerId: runner(7) }, // 1F vs 2H
      { winnerId: winner(6), runnerId: runner(4) }, // 1G vs 2E
      { winnerId: winner(7), runnerId: runner(5) }, // 1H vs 2F
    ];
  },

  // ── 1/8 FINAŁU: Generuj fixtury obu meczów ──────────────────────────────
  generateELR16Fixtures(
    elGroups: string[][],
    allFixtures: Fixture[],
    leg1Date: Date,
    leg2Date: Date,
    year: number,
  ): Fixture[] {
    const pairs = ELDrawService.computeELR16Pairs(elGroups, allFixtures);
    const fixtures: Fixture[] = [];

    pairs.forEach((pair, i) => {
      const pairId = `EL_R16_PAIR_${i + 1}_${year}`;
      // 1. mecz: runner-up gra GOSPODARZEM
      fixtures.push({
        id: pairId,
        leagueId: CompetitionType.EL_R16,
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
        leagueId: CompetitionType.EL_R16_RETURN,
        homeTeamId: pair.winnerId,
        awayTeamId: pair.runnerId,
        date: new Date(leg2Date),
        status: MatchStatus.SCHEDULED,
        homeScore: null,
        awayScore: null,
      });
    });

    return fixtures;
  },

  // ── 1/4 FINAŁU: Wyznacz 8 zwycięzców z 1/8 ─────────────────────────────
  getR16Winners(allFixtures: Fixture[]): string[] {
    const winners: string[] = [];
    allFixtures.forEach(f => {
      if (f.leagueId !== CompetitionType.EL_R16_RETURN || f.status !== MatchStatus.FINISHED) return;
      const firstLegId = f.id.replace('_RETURN', '');
      const leg1 = allFixtures.find(x => x.id === firstLegId);
      if (!leg1 || leg1.homeScore === null || leg1.awayScore === null) return;
      const teamATotal = (leg1.homeScore as number) + (f.awayScore ?? 0);
      const teamBTotal = (leg1.awayScore as number) + (f.homeScore ?? 0);
      let winnerId: string;
      if (teamATotal > teamBTotal) winnerId = leg1.homeTeamId;
      else if (teamBTotal > teamATotal) winnerId = leg1.awayTeamId;
      else if (f.homePenaltyScore != null && f.awayPenaltyScore != null)
        winnerId = f.homePenaltyScore > f.awayPenaltyScore ? leg1.awayTeamId : leg1.homeTeamId;
      else winnerId = leg1.homeTeamId;
      winners.push(winnerId);
    });
    return winners;
  },

  // ── 1/4 FINAŁU: Generuj fixtury ─────────────────────────────────────────
  generateQFFixtures(
    r16WinnerIds: string[],
    leg1Date: Date,
    leg2Date: Date,
    year: number,
    seed: number,
  ): Fixture[] {
    const shuffled = [...r16WinnerIds];
    let s = seed;
    for (let i = shuffled.length - 1; i > 0; i--) {
      s = (s * 1664525 + 1013904223) & 0xffffffff;
      const j = Math.abs(s) % (i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const fixtures: Fixture[] = [];
    for (let i = 0; i < shuffled.length - 1; i += 2) {
      const teamA = shuffled[i];
      const teamB = shuffled[i + 1];
      if (!teamA || !teamB) continue;
      const pairId = `EL_QF_PAIR_${i / 2 + 1}_${year}`;
      fixtures.push({
        id: pairId,
        leagueId: CompetitionType.EL_QF,
        homeTeamId: teamA,
        awayTeamId: teamB,
        date: new Date(leg1Date),
        status: MatchStatus.SCHEDULED,
        homeScore: null,
        awayScore: null,
      });
      fixtures.push({
        id: `${pairId}_RETURN`,
        leagueId: CompetitionType.EL_QF_RETURN,
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

  // ── 1/2 FINAŁU: Wyznacz 4 zwycięzców z 1/4 ──────────────────────────────
  getQFWinners(allFixtures: Fixture[]): string[] {
    const winners: string[] = [];
    allFixtures.forEach(f => {
      if (f.leagueId !== CompetitionType.EL_QF_RETURN || f.status !== MatchStatus.FINISHED) return;
      const firstLegId = f.id.replace('_RETURN', '');
      const leg1 = allFixtures.find(x => x.id === firstLegId);
      if (!leg1 || leg1.homeScore === null || leg1.awayScore === null) return;
      const teamATotal = (leg1.homeScore as number) + (f.awayScore ?? 0);
      const teamBTotal = (leg1.awayScore as number) + (f.homeScore ?? 0);
      let winnerId: string;
      if (teamATotal > teamBTotal) winnerId = leg1.homeTeamId;
      else if (teamBTotal > teamATotal) winnerId = leg1.awayTeamId;
      else if (f.homePenaltyScore != null && f.awayPenaltyScore != null)
        winnerId = f.homePenaltyScore > f.awayPenaltyScore ? leg1.awayTeamId : leg1.homeTeamId;
      else winnerId = leg1.homeTeamId;
      winners.push(winnerId);
    });
    return winners;
  },

  // ── 1/2 FINAŁU: Generuj fixtury ─────────────────────────────────────────
  generateSFFixtures(
    qfWinnerIds: string[],
    leg1Date: Date,
    leg2Date: Date,
    year: number,
    seed: number,
  ): Fixture[] {
    const shuffled = [...qfWinnerIds];
    let s = seed ^ 0xabcdef12;
    for (let i = shuffled.length - 1; i > 0; i--) {
      s = (s * 1664525 + 1013904223) & 0xffffffff;
      const j = Math.abs(s) % (i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const fixtures: Fixture[] = [];
    for (let i = 0; i < shuffled.length - 1; i += 2) {
      const teamA = shuffled[i];
      const teamB = shuffled[i + 1];
      if (!teamA || !teamB) continue;
      const pairId = `EL_SF_PAIR_${i / 2 + 1}_${year}`;
      fixtures.push({
        id: pairId,
        leagueId: CompetitionType.EL_SF,
        homeTeamId: teamA,
        awayTeamId: teamB,
        date: new Date(leg1Date),
        status: MatchStatus.SCHEDULED,
        homeScore: null,
        awayScore: null,
      });
      fixtures.push({
        id: `${pairId}_RETURN`,
        leagueId: CompetitionType.EL_SF_RETURN,
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

  // ── FINAŁ: Wyznacz 2 zwycięzców z 1/2 ───────────────────────────────────
  getSFWinners(allFixtures: Fixture[]): string[] {
    const winners: string[] = [];
    allFixtures.forEach(f => {
      if (f.leagueId !== CompetitionType.EL_SF_RETURN || f.status !== MatchStatus.FINISHED) return;
      const firstLegId = f.id.replace('_RETURN', '');
      const leg1 = allFixtures.find(x => x.id === firstLegId);
      if (!leg1 || leg1.homeScore === null || leg1.awayScore === null) return;
      const teamATotal = (leg1.homeScore as number) + (f.awayScore ?? 0);
      const teamBTotal = (leg1.awayScore as number) + (f.homeScore ?? 0);
      let winnerId: string;
      if (teamATotal > teamBTotal) winnerId = leg1.homeTeamId;
      else if (teamBTotal > teamATotal) winnerId = leg1.awayTeamId;
      else if (f.homePenaltyScore != null && f.awayPenaltyScore != null)
        winnerId = f.homePenaltyScore > f.awayPenaltyScore ? leg1.awayTeamId : leg1.homeTeamId;
      else winnerId = leg1.homeTeamId;
      winners.push(winnerId);
    });
    return winners;
  },

  // ── FINAŁ: Generuj jeden mecz finałowy ──────────────────────────────────
  generateFinalFixture(teamAId: string, teamBId: string, date: Date, year: number): Fixture {
    return {
      id: `EL_FINAL_${year}`,
      leagueId: CompetitionType.EL_FINAL,
      homeTeamId: teamAId,
      awayTeamId: teamBId,
      date: new Date(date),
      status: MatchStatus.SCHEDULED,
      homeScore: null,
      awayScore: null,
    };
  },

  // ── ZABEZPIECZENIE SLOTÓW ────────────────────────────────────────────────
  getR16Participants(allFixtures: Fixture[]): string[] {
    const ids = new Set<string>();
    allFixtures.forEach(f => {
      if (f.leagueId === CompetitionType.EL_R16) { ids.add(f.homeTeamId); ids.add(f.awayTeamId); }
    });
    return [...ids];
  },

  getQFParticipants(allFixtures: Fixture[]): string[] {
    const ids = new Set<string>();
    allFixtures.forEach(f => {
      if (f.leagueId === CompetitionType.EL_QF) { ids.add(f.homeTeamId); ids.add(f.awayTeamId); }
    });
    return [...ids];
  },

  getSFParticipants(allFixtures: Fixture[]): string[] {
    const ids = new Set<string>();
    allFixtures.forEach(f => {
      if (f.leagueId === CompetitionType.EL_SF) { ids.add(f.homeTeamId); ids.add(f.awayTeamId); }
    });
    return [...ids];
  },

  guaranteeWinners(winners: string[], fallbackPool: string[], expectedCount: number): string[] {
    if (winners.length >= expectedCount) return winners.slice(0, expectedCount);
    const result = [...winners];
    for (const id of fallbackPool) {
      if (result.length >= expectedCount) break;
      if (!result.includes(id)) result.push(id);
    }
    return result;
  },
};
