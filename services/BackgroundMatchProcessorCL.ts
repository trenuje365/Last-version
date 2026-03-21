import { Fixture, Club, MatchStatus, CompetitionType } from '../types';

// ============================================================
//  WYNIK MECZU CL
// ============================================================
interface CLMatchResult {
  homeScore: number;
  awayScore: number;
  penaltyHome?: number;
  penaltyAway?: number;
  wentToExtraTime: boolean;
}

// ============================================================
//  PROSTY SILNIK MECZOWY CL
//  Zostawione miejsce na łatwą rozbudowę — wystarczy podmienić
//  logikę wewnątrz simulateCLMatch()
// ============================================================

// Symuluje 90 minut meczu — bez dogrywki/karnych
const simulate90min = (
  homeReputation: number,
  awayReputation: number,
  seed: number
): { homeScore: number; awayScore: number; next: () => number } => {
  let rng = seed;
  const next = () => {
    rng = (rng * 1664525 + 1013904223) & 0xffffffff;
    return (rng >>> 0) / 0xffffffff;
  };

  const totalStrength = homeReputation + awayReputation;
  const homeWinProb = homeReputation / totalStrength;
  const homeAdvantage = 0.05;

  const r = next();
  const totalGoals = r < 0.15 ? 0
    : r < 0.35 ? 1
    : r < 0.60 ? 2
    : r < 0.78 ? 3
    : r < 0.90 ? 4
    : r < 0.96 ? 5
    : 6;

  let homeScore = 0;
  let awayScore = 0;
  for (let i = 0; i < totalGoals; i++) {
    if (next() < homeWinProb + homeAdvantage) homeScore++;
    else awayScore++;
  }

  return { homeScore, awayScore, next };
};

// Symuluje dogrywkę (30 min) i opcjonalnie rzuty karne
// homeWinProb — raw probability based na reputation
// leg1Diff — gdy podany (rewanż), karne triggerują gdy agregat jest równy, a nie wynik meczu
const simulateExtraTimeAndPenalties = (
  homeScore: number,
  awayScore: number,
  homeWinProb: number,
  next: () => number,
  leg1Diff?: number // = firstLeg.homeScore - firstLeg.awayScore
): { homeScore: number; awayScore: number; penaltyHome?: number; penaltyAway?: number; wentToExtraTime: boolean } => {
  let h = homeScore;
  let a = awayScore;
  const homeAdvantage = 0.05;

  // Dogrywka: mniejsza liczba goli (~45% szansy na 1 gola)
  const etGoals = next() < 0.40 ? 1 : next() < 0.15 ? 2 : 0;
  for (let i = 0; i < etGoals; i++) {
    if (next() < homeWinProb + homeAdvantage) h++;
    else a++;
  }

  let penaltyHome: number | undefined;
  let penaltyAway: number | undefined;

  // Dla rewanżu: karne gdy agregat po ET wciąż równy (h - a === leg1Diff)
  // Dla meczów jednorazowych: karne gdy wynik po ET równy (h === a)
  const aggregateTied = leg1Diff !== undefined ? (h - a === leg1Diff) : (h === a);

  if (aggregateTied) {
    // Rzuty karne — seria 5
    const simSeries = (favProb: number): number => {
      let scored = 0;
      for (let i = 0; i < 5; i++) {
        if (next() < 0.72 + (favProb - 0.5) * 0.1) scored++;
      }
      return scored;
    };

    penaltyHome = simSeries(homeWinProb);
    penaltyAway = simSeries(1 - homeWinProb);

    // Sudden death — aż do rozstrzygnięcia
    let sd = 0;
    while (penaltyHome === penaltyAway && sd < 20) {
      sd++;
      const hScored = next() < 0.72;
      const aScored = next() < 0.72;
      if (hScored && !aScored) penaltyHome++;
      else if (!hScored && aScored) penaltyAway++;
    }
  }

  return { homeScore: h, awayScore: a, penaltyHome, penaltyAway, wentToExtraTime: true };
};

// ============================================================
//  GŁÓWNY PROCESOR CL
// ============================================================
export const BackgroundMatchProcessorCL = {

  processChampionsLeagueEvent: (
    currentDate: Date,
    userTeamId: string | null,
    fixtures: Fixture[],
    clubs: Club[],
    sessionSeed: number
  ): { updatedFixtures: Fixture[] } => {

    const dateStr = currentDate.toDateString();

    // Filtruj mecze CL na dzisiaj (pomijamy mecze gracza — jego mecz obsługuje MatchLiveView)
    // Wyjątek: CL_FINAL zawsze symulujemy, niezależnie od uczestnictwa gracza
    const todayMatches = fixtures.filter(f =>
      f.date.toDateString() === dateStr &&
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
       f.leagueId === CompetitionType.EL_FINAL) &&
      (f.leagueId === CompetitionType.CL_FINAL || (f.homeTeamId !== userTeamId && f.awayTeamId !== userTeamId))
    );





    if (todayMatches.length === 0) return { updatedFixtures: fixtures };

    let updatedFixtures = [...fixtures];

    todayMatches.forEach(fixture => {
      const home = clubs.find(c => c.id === fixture.homeTeamId);
      const away = clubs.find(c => c.id === fixture.awayTeamId);

      const homeRep = home?.reputation ?? 50;
      const awayRep = away?.reputation ?? 50;

      // Deterministyczny seed dla tej pary
      const matchHash = fixture.id.split('').reduce((a, b) => (a << 5) - a + b.charCodeAt(0), 0);
      const seed = (matchHash ^ sessionSeed) ^ (currentDate.getTime() / 1000 | 0);

                           const isReturnLeg = fixture.leagueId === CompetitionType.CL_R1Q_RETURN
                       || fixture.leagueId === CompetitionType.CL_R2Q_RETURN
                       || fixture.leagueId === CompetitionType.CL_R16_RETURN
                       || fixture.leagueId === CompetitionType.CL_QF_RETURN
                       || fixture.leagueId === CompetitionType.CL_SF_RETURN
                       || fixture.leagueId === CompetitionType.EL_R1Q_RETURN
                       || fixture.leagueId === CompetitionType.EL_R2Q_RETURN
                       || fixture.leagueId === CompetitionType.EL_R16_RETURN
                       || fixture.leagueId === CompetitionType.EL_QF_RETURN
                       || fixture.leagueId === CompetitionType.EL_SF_RETURN;

      // ── KROK 1: Symulacja 90 minut (zawsze bez dogrywki) ──────────────────
      const { homeScore, awayScore, next } = simulate90min(homeRep, awayRep, seed);

      let finalHomeScore = homeScore;
      let finalAwayScore = awayScore;
      let penaltyHome: number | undefined;
      let penaltyAway: number | undefined;
      let wentToExtraTime = false;

      // ── KROK 2: Rewanż — sprawdź agregat po 90 min ───────────────────────
      if (isReturnLeg) {
        const firstLegId = fixture.id.replace('_RETURN', '');
        const firstLeg = updatedFixtures.find(f => f.id === firstLegId);

        if (firstLeg && firstLeg.homeScore !== null && firstLeg.awayScore !== null) {
          // Konwencja par:
          //   1. mecz: homeTeam = TeamA,  awayTeam = TeamB
          //   Rewanż:  homeTeam = TeamB,  awayTeam = TeamA   (role zamienione)
          //
          // Agregat TeamA = firstLeg.homeScore + awayScore (rewanż)
          // Agregat TeamB = firstLeg.awayScore + homeScore (rewanż)
          const teamATotal = (firstLeg.homeScore as number) + awayScore;
          const teamBTotal = (firstLeg.awayScore as number) + homeScore;

          if (teamATotal === teamBTotal) {
            // ── KROK 3: Agregat wyrównany → dogrywka + ewentualnie karne ──
            const homeWinProb = homeRep / (homeRep + awayRep);
            // Przekazujemy leg1Diff żeby ET sprawdzał równość agregatu, nie samego meczu
            const leg1Diff = (firstLeg.homeScore as number) - (firstLeg.awayScore as number);
            const etResult = simulateExtraTimeAndPenalties(
              homeScore, awayScore, homeWinProb, next, leg1Diff
            );

            finalHomeScore = etResult.homeScore;
            finalAwayScore = etResult.awayScore;
            penaltyHome    = etResult.penaltyHome;
            penaltyAway    = etResult.penaltyAway;
            wentToExtraTime = true;
          }
          // Jeśli nie remis na agregacie — wynik 90 min zostaje bez zmian
        }
      }

      // ── KROK 2b: FINAŁ (jeden mecz) — remis po 90 min → dogrywka + karne ─
      const isFinal = fixture.leagueId === CompetitionType.CL_FINAL;
      if (isFinal && homeScore === awayScore) {
        const homeWinProb = homeRep / (homeRep + awayRep);
        // leg1Diff = undefined → ET sprawdza remis w tym meczu (nie agregat)
        const etResult = simulateExtraTimeAndPenalties(
          homeScore, awayScore, homeWinProb, next, undefined
        );
        finalHomeScore  = etResult.homeScore;
        finalAwayScore  = etResult.awayScore;
        penaltyHome     = etResult.penaltyHome;
        penaltyAway     = etResult.penaltyAway;
        wentToExtraTime = true;
      }
      // Dla 1. meczu dwumeczu nigdy nie ma ET — wynik 90 min jest ostateczny

      updatedFixtures = updatedFixtures.map(f =>
        f.id === fixture.id
          ? {
              ...f,
              homeScore: finalHomeScore,
              awayScore: finalAwayScore,
              homePenaltyScore: penaltyHome,
              awayPenaltyScore: penaltyAway,
              status: MatchStatus.FINISHED,
            }
          : f
      );
    });

    return { updatedFixtures };
  }
};