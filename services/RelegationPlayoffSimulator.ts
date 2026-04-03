import { Club, RelegationPlayoffLegResult, RelegationPlayoffPenalties, RelegationPlayoffPairOutcome } from '../types';

// ── SYMULATOR BARAŻÓW O UTRZYMANIE (2.Liga vs 3.Liga) ──────────────────────────
// Prosta symulacja oparta na reputacji klubu + losowość (seed dla powtarzalności).
// Nie wymaga fixture ani lineup — działa na danych ze stanu gry.

// Generator liczb pseudolosowych (LCG) — deterministyczny dla tego samego seeda
function createRng(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

// Siła drużyny na podstawie reputacji (reputacja 1-10 → zakres 0.3–1.0)
function calcStrength(club: Club): number {
  return 0.3 + (club.reputation / 10) * 0.7;
}

export const RelegationPlayoffSimulator = {

  // Symuluje pojedynczy mecz barażowy (bez dogrywki — to tylko jeden mecz z dwumeczu)
  simulateMatch(homeClub: Club, awayClub: Club, seed: number): RelegationPlayoffLegResult {
    const rng = createRng(seed);

    const homeStr = calcStrength(homeClub) + 0.1; // premia za grę u siebie
    const awayStr = calcStrength(awayClub);
    const totalStr = homeStr + awayStr;

    // Losowa liczba goli w meczu (zakres 1–5, średnio ~2.5)
    const totalGoals = Math.round(1 + rng() * 4);
    const homeChance = homeStr / totalStr;

    let homeGoals = 0;
    let awayGoals = 0;
    for (let i = 0; i < totalGoals; i++) {
      if (rng() < homeChance) homeGoals++;
      else awayGoals++;
    }

    return { homeId: homeClub.id, awayId: awayClub.id, homeGoals, awayGoals };
  },

  // Symuluje serię rzutów karnych po dogrywce (remis w agregacie)
  simulatePenalties(homeClub: Club, awayClub: Club, seed: number): RelegationPlayoffPenalties {
    const rng = createRng(seed + 77777);

    const homeStr = calcStrength(homeClub);
    const awayStr = calcStrength(awayClub);
    const homeChance = homeStr / (homeStr + awayStr);

    let homeShots = 0;
    let awayShots = 0;

    // 5 serii — skuteczność ~75%
    for (let round = 0; round < 5; round++) {
      if (rng() < 0.75) homeShots++;
      if (rng() < 0.75) awayShots++;
    }

    // Remis po 5 seriach — rozstrzygnięcie "sudden death" oparte na sile
    if (homeShots === awayShots) {
      if (rng() < homeChance) homeShots++;
      else awayShots++;
    }

    const winnerId = homeShots > awayShots ? homeClub.id : awayClub.id;
    return { winnerId, homeShots, awayShots };
  },

  // Oblicza wynik całego dwumeczu po obu meczach
  // leg1: homeClubL3 gra u siebie (26 maja)
  // leg2: clubL4 gra u siebie (29 maja) — strony zamienione względem leg1
  resolveAggregate(
    leg1: RelegationPlayoffLegResult,
    leg2: RelegationPlayoffLegResult,
    clubL3: Club,  // klub z 2.Ligi (homeClub w leg1)
    clubL4: Club,  // klub z 3.Ligi (awayClub w leg1)
    seed: number
  ): RelegationPlayoffPairOutcome {
    // Agregat: gole clubL3 = gole jako gospodarz w leg1 + gole jako gość w leg2
    const l3Agg = leg1.homeGoals + leg2.awayGoals;
    const l4Agg = leg1.awayGoals + leg2.homeGoals;

    if (l3Agg > l4Agg) {
      // 2.Liga wygrywa — utrzymanie
      return { leg1, leg2, winnerId: clubL3.id, loserId: clubL4.id, decidedBy: 'AGGREGATE' };
    }
    if (l4Agg > l3Agg) {
      // 3.Liga wygrywa — awans
      return { leg1, leg2, winnerId: clubL4.id, loserId: clubL3.id, decidedBy: 'AGGREGATE' };
    }

    // Remis w agregacie → rzuty karne (seed unikalny per para)
    const penalties = this.simulatePenalties(clubL3, clubL4, seed);
    const winnerId = penalties.winnerId;
    const loserId = winnerId === clubL3.id ? clubL4.id : clubL3.id;

    return { leg1, leg2, winnerId, loserId, decidedBy: 'PENALTIES', penalties };
  },
};
