import { Club, Fixture, MatchStatus, CompetitionType } from '../types';
import { generateCONFClubId } from '../resources/static_db/clubs/ConferenceLeagueTeams';

type RawCONFClub = {
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
  let s = seed ^ 0xC0FFEE42;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

// ── Conference League Draw Service ────────────────────────────────────────────
export const CONFDrawService = {

  /**
   * Wybiera 128 drużyn do losowania Rundy 1 LK.
   * Priorytet: Tier 4, uzupełnienie Tier 3 jeśli za mało.
   * Wyklucza polskie kluby (country === 'POL').
   * Round-robin po krajach zapewnia maksymalną różnorodność.
   */
  getEligibleTeams(rawClubs: RawCONFClub[], seed: number, count = 64): string[] {
    const rng = makeLcg(seed);

    const eligible = rawClubs.filter(c => c.country !== 'POL');

    // Grupuj po krajach, sortuj: Tier 4 najpierw, potem Tier 3; w ramach tieru malejąca reputacja
    const byCountry = new Map<string, RawCONFClub[]>();
    for (const club of eligible) {
      const bucket = byCountry.get(club.country) ?? [];
      bucket.push(club);
      byCountry.set(club.country, bucket);
    }
    byCountry.forEach((bucket, country) => {
      byCountry.set(
        country,
        bucket.sort((a, b) => b.tier - a.tier || b.reputation - a.reputation),
      );
    });

    // Seeded shuffle kolejności krajów
    const countries = Array.from(byCountry.keys());
    for (let i = countries.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [countries[i], countries[j]] = [countries[j], countries[i]];
    }

    // Round-robin: iteruj po krajach, za każdym razem wybierz kolejny klub z danego kraju
    const pointers = new Map<string, number>(countries.map(c => [c, 0]));
    const selected: RawCONFClub[] = [];

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

    return selected.slice(0, count).map(c => generateCONFClubId(c.name));
  },

  /**
   * Losuje 64 pary z 128 ID drużyn.
   * Ograniczenie: dwie drużyny z tego samego kraju nie mogą grać ze sobą.
   * Używa backtrackingu — tak jak CLDrawService.
   */
  drawPairs(teamIds: string[], rawClubs: RawCONFClub[], clubs: Club[], date: Date, seed: number): Fixture[] {
    const getCountry = (id: string): string => {
      const raw = rawClubs.find(c => generateCONFClubId(c.name) === id);
      return raw?.country ?? '';
    };

    // Seeded shuffle
    const shuffled = [...teamIds];
    let s = (seed ^ 0xDA1EDA00) >>> 0;
    for (let i = shuffled.length - 1; i > 0; i--) {
      s = (s * 1664525 + 1013904223) & 0xffffffff;
      const j = Math.abs(s) % (i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Upewnij się że mamy parzystą liczbę drużyn
    const pool = shuffled.slice(0, shuffled.length % 2 === 0 ? shuffled.length : shuffled.length - 1);

    // Próbuj parować bez konfliktu krajowego
    // Prosta procedura: iteruj liniowo, dla każdej drużyny szukaj pierwszego dostępnego partnera z innego kraju
    const paired: boolean[] = new Array(pool.length).fill(false);
    const pairs: Array<[string, string]> = [];

    for (let i = 0; i < pool.length; i++) {
      if (paired[i]) continue;
      const countryA = getCountry(pool[i]);
      let found = false;
      for (let j = i + 1; j < pool.length; j++) {
        if (paired[j]) continue;
        const countryB = getCountry(pool[j]);
        if (countryA && countryB && countryA === countryB) continue;
        pairs.push([pool[i], pool[j]]);
        paired[i] = true;
        paired[j] = true;
        found = true;
        break;
      }
      // Fallback: jeśli nie znaleziono innego kraju, sparuj z pierwszym wolnym
      if (!found) {
        for (let j = i + 1; j < pool.length; j++) {
          if (paired[j]) continue;
          pairs.push([pool[i], pool[j]]);
          paired[i] = true;
          paired[j] = true;
          break;
        }
      }
    }

    return pairs.map(([homeId, awayId], idx) => ({
      id: `CONF_R1Q_PAIR_${idx + 1}_${date.getFullYear()}`,
      leagueId: CompetitionType.CONF_R1Q_DRAW,
      homeTeamId: homeId,
      awayTeamId: awayId,
      date,
      status: MatchStatus.SCHEDULED,
      homeScore: null,
      awayScore: null,
    }));
  },

  // ── R2Q: Zwycięzcy R1Q + 30 drużyn Tier3 z CONFTeams + 2 polskie drużyny ─
  getR2QPool(
    rawClubs: RawCONFClub[],
    allFixtures: Fixture[],
    polishTeamIds: string[],
    seed: number,
  ): string[] {
    const rng = makeLcg(seed ^ 0xC0FF2222);

    // 1. Zwycięzcy R1Q — wyznaczani z zakończonych rewanży
    const r1qWinners: string[] = [];
    allFixtures.forEach(f => {
      if (f.leagueId !== CompetitionType.CONF_R1Q_RETURN || f.status !== MatchStatus.FINISHED) return;
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

    // 2. Europejskie drużyny Tier3 (preferencyjnie), bez POL, które nie grały R1Q
    const r1qParticipantIds = new Set<string>();
    allFixtures.forEach(f => {
      if (f.leagueId === CompetitionType.CONF_R1Q) {
        r1qParticipantIds.add(f.homeTeamId);
        r1qParticipantIds.add(f.awayTeamId);
      }
    });

    const tier3Eligible = rawClubs
      .filter(c => c.country !== 'POL' && c.tier === 3 && !r1qParticipantIds.has(generateCONFClubId(c.name)))
      .sort((a, b) => b.reputation - a.reputation);

    const tier4Eligible = rawClubs
      .filter(c => c.country !== 'POL' && c.tier === 4 && !r1qParticipantIds.has(generateCONFClubId(c.name)))
      .sort((a, b) => b.reputation - a.reputation);

    const fillPool = [...tier3Eligible, ...tier4Eligible].map(c => generateCONFClubId(c.name));

    // Seeded shuffle puli uzupełniającej
    const shuffledFill = [...fillPool];
    for (let i = shuffledFill.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [shuffledFill[i], shuffledFill[j]] = [shuffledFill[j], shuffledFill[i]];
    }

    // 3. Buduj pulę: zwycięzcy R1Q + 30 europejskich + 2 polskie
    const pool: string[] = [];

    for (const id of r1qWinners) {
      if (!pool.includes(id)) pool.push(id);
    }

    for (const id of shuffledFill) {
      if (pool.length >= r1qWinners.length + 30) break;
      if (!pool.includes(id)) pool.push(id);
    }

    for (const id of polishTeamIds) {
      if (id && !pool.includes(id)) pool.push(id);
    }

    // Wyrównaj do parzystej liczby
    if (pool.length % 2 !== 0) pool.pop();

    return pool;
  },

  drawR2QPairs(teamIds: string[], rawClubs: RawCONFClub[], clubs: Club[], date: Date, seed: number): Fixture[] {
    const getCountry = (id: string): string => {
      // Polskie kluby
      if (id.startsWith('PL_')) return 'POL';
      const raw = rawClubs.find(c => generateCONFClubId(c.name) === id);
      return raw?.country ?? '';
    };

    const shuffled = [...teamIds];
    let s = (seed ^ 0xC0FFAA22) >>> 0;
    for (let i = shuffled.length - 1; i > 0; i--) {
      s = (s * 1664525 + 1013904223) & 0xffffffff;
      const j = Math.abs(s) % (i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const pool = shuffled.slice(0, shuffled.length % 2 === 0 ? shuffled.length : shuffled.length - 1);
    const paired: boolean[] = new Array(pool.length).fill(false);
    const pairs: Array<[string, string]> = [];

    for (let i = 0; i < pool.length; i++) {
      if (paired[i]) continue;
      const countryA = getCountry(pool[i]);
      let found = false;
      for (let j = i + 1; j < pool.length; j++) {
        if (paired[j]) continue;
        const countryB = getCountry(pool[j]);
        if (countryA && countryB && countryA === countryB) continue;
        pairs.push([pool[i], pool[j]]);
        paired[i] = true;
        paired[j] = true;
        found = true;
        break;
      }
      if (!found) {
        for (let j = i + 1; j < pool.length; j++) {
          if (paired[j]) continue;
          pairs.push([pool[i], pool[j]]);
          paired[i] = true;
          paired[j] = true;
          break;
        }
      }
    }

    return pairs.map(([homeId, awayId], idx) => ({
      id: `CONF_R2Q_PAIR_${idx + 1}_${date.getFullYear()}`,
      leagueId: CompetitionType.CONF_R2Q_DRAW,
      homeTeamId: homeId,
      awayTeamId: awayId,
      date,
      status: MatchStatus.SCHEDULED,
      homeScore: null,
      awayScore: null,
    }));
  },

  // ── wyznacza zwycięzców R2Q (do logiki następnej rundy) ─────────────────
  getR2QWinners(allFixtures: Fixture[]): string[] {
    const winners: string[] = [];
    allFixtures.forEach(f => {
      if (f.leagueId !== CompetitionType.CONF_R2Q_RETURN || f.status !== MatchStatus.FINISHED) return;
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
      winners.push(winnerId);
    });
    return winners;
  },

  // ── FAZA GRUPOWA: wyznacz 32 awansujących z R2Q ─────────────────────────
  getGroupStagePool(allFixtures: Fixture[]): string[] {
    const r2qWinners: string[] = [];

    allFixtures.forEach(f => {
      if (f.leagueId !== CompetitionType.CONF_R2Q_RETURN || f.status !== MatchStatus.FINISHED) return;
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
      const raw = rawClubs.find(c => generateCONFClubId(c.name) === id);
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
      if (id.startsWith('PL_')) return 'POL';
      const raw = rawClubs.find(c => generateCONFClubId(c.name) === id);
      return raw?.country ?? '';
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
        .filter(c => !pool.includes(generateCONFClubId(c.name)))
        .sort((a, b) => b.reputation - a.reputation)
        .map(c => generateCONFClubId(c.name));
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

    const assignedPot2 = assignPotToGroups(pot2, groupsAfterPot1, seed ^ 0x44444444);
    const groupsAfterPot2: string[][] = groupsAfterPot1.map((g, i) => [...g, assignedPot2[i]]);

    const assignedPot3 = assignPotToGroups(pot3, groupsAfterPot2, seed ^ 0x55555555);
    const groupsAfterPot3: string[][] = groupsAfterPot2.map((g, i) => [...g, assignedPot3[i]]);

    const assignedPot4 = assignPotToGroups(pot4, groupsAfterPot3, seed ^ 0x66666666);

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
        const matchDate = matchdayDates[mdi] ?? new Date(year, 8, 20);

        pairs.forEach(([hIdx, aIdx]) => {
          const homeId = group[hIdx];
          const awayId = group[aIdx];
          fixtures.push({
            id: `CONF_GS_G${groupLetter}_MD${mdi + 1}_${hIdx}v${aIdx}_${year}`,
            leagueId: CompetitionType.CONF_GROUP_STAGE,
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
};
