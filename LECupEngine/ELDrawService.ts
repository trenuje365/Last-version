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

  // ── Miejsce na przyszłe rundy ─────────────────────────────────────────────
  // getR2QPool(...) { ... }
  // drawR2QPairs(...) { ... }
};
