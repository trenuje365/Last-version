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
};
