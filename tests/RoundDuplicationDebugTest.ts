/**
 * RoundDuplicationDebugTest.ts
 * 
 * Odtwarza dokładny scenariusz który powoduje duplikację meczów w studiu pomeczowym.
 * 
 * Jak uruchomić: zaimportuj i wywołaj runRoundDuplicationTest() w App.tsx lub konsoli.
 */

import { BackgroundMatchProcessor } from '../services/BackgroundMatchProcessor';
import { STATIC_CLUBS } from '../constants';
import { Fixture, MatchStatus, CompetitionType, LeagueRoundResults } from '../types';

// ─────────────────────────────────────────────
// MOCK HELPERS
// ─────────────────────────────────────────────

const makeFixture = (id: string, homeId: string, awayId: string, date: Date): Fixture => ({
  id,
  leagueId: CompetitionType.EKSTRAKLASA,
  homeTeamId: homeId,
  awayTeamId: awayId,
  date: new Date(date),
  status: MatchStatus.SCHEDULED,
  homeScore: null,
  awayScore: null,
});

// ─────────────────────────────────────────────
// GŁÓWNY TEST
// ─────────────────────────────────────────────

export const runRoundDuplicationTest = () => {
  console.group('%c=== ROUND DUPLICATION DEBUG TEST ===', 'color: orange; font-weight: bold');

  // Weź 18 klubów z pierwszej ligi
  const l1Clubs = STATIC_CLUBS.filter(c => c.leagueId === 'L_PL_1').slice(0, 18);
  if (l1Clubs.length < 18) {
    console.error(`Za mało klubów L_PL_1: ${l1Clubs.length}`);
    console.groupEnd();
    return;
  }

  const USER_TEAM_ID = l1Clubs[0].id;
  const MATCH_DATE = new Date(2025, 6, 20); // 20 lipca 2025

  // 9 meczów (jedna kolejka): user gra mecz [0] vs [1], reszta tło
  const fixtures: Fixture[] = [];
  for (let i = 0; i < 9; i++) {
    const home = l1Clubs[i * 2];
    const away = l1Clubs[i * 2 + 1];
    fixtures.push(makeFixture(
      `TEST_MATCH_${i}_${home.id}_vs_${away.id}`,
      home.id,
      away.id,
      MATCH_DATE
    ));
  }

  console.log(`Liczba fixture'ów w kolejce: ${fixtures.length}`);
  console.log(`Mecz gracza: ${l1Clubs[0].name} vs ${l1Clubs[1].name}`);
  console.log(`Mecze tła: ${fixtures.length - 1}`);

  const clubs = l1Clubs;
  const players: Record<string, any[]> = {};
  const lineups: Record<string, any> = {};
  const coaches: Record<string, any> = {};

  // ─────────────────────────────────────────────
  // TEST 1: Jedno wywołanie processLeagueEvent
  // ─────────────────────────────────────────────
  console.group('TEST 1: Jedno wywołanie processLeagueEvent');
  const result1 = BackgroundMatchProcessor.processLeagueEvent(
    MATCH_DATE, USER_TEAM_ID, fixtures, clubs, players, lineups, 1, coaches
  );

  const rr1 = result1.roundResults;
  const total1 = (rr1?.league1Results?.length ?? 0);
  console.log(`roundResults.league1Results.length = ${total1}`);
  console.assert(total1 === 8, `❌ FAIL: Oczekiwano 8 (bez meczu gracza), dostano ${total1}`);
  if (total1 === 8) console.log(`✅ PASS: 8 meczów tła`);

  // Sprawdź duplikaty
  if (rr1) {
    const ids1 = rr1.league1Results.map((r: any) => `${r.homeTeamName}-${r.awayTeamName}`);
    const unique1 = new Set(ids1);
    if (unique1.size !== ids1.length) {
      console.error(`❌ DUPLIKATY po 1 wywołaniu! ${ids1.length} wyników, ${unique1.size} unikalnych`);
      ids1.forEach((id: string, i: number) => console.log(`  [${i}] ${id}`));
    } else {
      console.log(`✅ Brak duplikatów po 1 wywołaniu`);
    }
  }
  console.groupEnd();

  // ─────────────────────────────────────────────
  // TEST 2: Drugie wywołanie (stale closure - stare fixtures)
  // Symuluje co się dzieje gdy advanceDay odpala dwa razy
  // ─────────────────────────────────────────────
  console.group('TEST 2: Drugie wywołanie z TYMI SAMYMI (starymi) fixtures - stale closure');
  const result2 = BackgroundMatchProcessor.processLeagueEvent(
    MATCH_DATE, USER_TEAM_ID, fixtures /* ← STARE, żaden nie jest FINISHED */, clubs, players, lineups, 1, coaches
  );

  const rr2 = result2.roundResults;
  const total2 = (rr2?.league1Results?.length ?? 0);
  console.log(`roundResults.league1Results.length = ${total2}`);
  console.assert(total2 === 8, `❌ Drugie wywołanie ze starymi fixtures też daje 8 (nie sumuje się)`);
  if (total2 === 8) console.log(`✅ Drugie wywołanie poprawnie daje 8 (niezależne od pierwszego)`);
  console.groupEnd();

  // ─────────────────────────────────────────────
  // TEST 3: Drugie wywołanie z ZAKTUALIZOWANYMI fixtures (FINISHED)
  // Symuluje co powinno się dziać po poprawce
  // ─────────────────────────────────────────────
  console.group('TEST 3: Drugie wywołanie z zaktualizowanymi fixtures (status FINISHED)');
  const updatedFixtures = result1.updatedFixtures;
  const finishedCount = updatedFixtures.filter(f => f.status === MatchStatus.FINISHED).length;
  console.log(`Fixtures FINISHED po pierwszym wywołaniu: ${finishedCount}`);

  const result3 = BackgroundMatchProcessor.processLeagueEvent(
    MATCH_DATE, USER_TEAM_ID, updatedFixtures /* ← ZAKTUALIZOWANE */, clubs, players, lineups, 1, coaches
  );

  const rr3 = result3.roundResults;
  const total3 = (rr3?.league1Results?.length ?? 0);
  console.log(`roundResults.league1Results.length = ${total3}`);
  console.assert(total3 === 0, `✅ OCZEKIWANO 0 (wszystkie FINISHED) - dostano ${total3}`);
  if (total3 === 0) {
    console.log(`✅ PASS: Drugie wywołanie z FINISHED fixtures = 0 meczów (brak duplikacji)`);
  } else {
    console.error(`❌ FAIL: Drugie wywołanie przetworzyło ${total3} meczów mimo że były FINISHED`);
  }
  console.groupEnd();

  // ─────────────────────────────────────────────
  // TEST 4: Symulacja scenariusza handleFinishMatch
  // bg wyniki z advanceDay + mecz gracza = łącznie 9 unikalnych
  // ─────────────────────────────────────────────
  console.group('TEST 4: Merge bg + mecz gracza (handleFinishMatch scenario)');

  // bg wyniki już zapisane przez advanceDay:
  const bgFromAdvanceDay: LeagueRoundResults = rr1!;
  console.log(`bg z advanceDay: ${bgFromAdvanceDay.league1Results.length} meczów`);

  // Mecz gracza
  const userMatchResult = {
    homeTeamName: l1Clubs[0].name,
    awayTeamName: l1Clubs[1].name,
    homeScore: 2,
    awayScore: 1,
    homeColors: l1Clubs[0].colorsHex,
    awayColors: l1Clubs[1].colorsHex,
  };

  // Merge (jak w handleFinishMatch po poprawce)
  const finalRoundResults: LeagueRoundResults = {
    dateKey: MATCH_DATE.toDateString(),
    league1Results: [...bgFromAdvanceDay.league1Results],
    league2Results: [...bgFromAdvanceDay.league2Results],
    league3Results: [...bgFromAdvanceDay.league3Results],
  };
  finalRoundResults.league1Results.push(userMatchResult as any);

  const totalMerged = finalRoundResults.league1Results.length;
  console.log(`Po merge: ${totalMerged} meczów (oczekiwano 9)`);
  console.assert(totalMerged === 9, `❌ Oczekiwano 9, dostano ${totalMerged}`);

  // Sprawdź duplikaty
  const mergedIds = finalRoundResults.league1Results.map(r => `${r.homeTeamName}-${r.awayTeamName}`);
  const uniqueMerged = new Set(mergedIds);
  if (uniqueMerged.size !== mergedIds.length) {
    console.error(`❌ DUPLIKATY po merge!`);
    mergedIds.forEach((id, i) => console.log(`  [${i}] ${id}`));
  } else {
    console.log(`✅ PASS: Brak duplikatów, ${totalMerged} unikalnych meczów`);
    mergedIds.forEach((id, i) => console.log(`  [${i}] ${id}`));
  }
  console.groupEnd();

  // ─────────────────────────────────────────────
  // TEST 5: Symulacja STAREGO zachowania (bug)
  // handleFinishMatch brał simResult.roundResults (które miały już 8 meczów)
  // i addRoundResults w applySimulationResult dodawało JE DO STANU
  // gdzie już były 8 z advanceDay => 16 razem
  // ─────────────────────────────────────────────
  console.group('TEST 5: Stare zachowanie (bug) - symulacja podwójnego zapisu');

  // Stan roundResults po advanceDay:
  const stateAfterAdvanceDay: Record<string, LeagueRoundResults> = {
    [MATCH_DATE.toDateString()]: bgFromAdvanceDay,
  };

  // handleFinishMatch robi applySimulationResult z simResult (kolejne wywołanie processLeagueEvent)
  // simResult.roundResults ma 8 meczów tła (te same co advanceDay)
  // applySimulationResult wywołuje addRoundResults które robi:
  // setRoundResults(prev => ({ ...prev, [results.dateKey]: results }))
  // To NADPISUJE (replace), nie sumuje - więc to nie powinno być problemem...

  // ALE: jeśli dateKey się różni (np. advanceDay użył previousDate, handleFinishMatch użył currentDate)
  // to obydwa wpisy zostają w stanie:

  const previousDate = new Date(MATCH_DATE);
  previousDate.setDate(previousDate.getDate() - 1);

  const stateWithBothDates: Record<string, LeagueRoundResults> = {
    [previousDate.toDateString()]: bgFromAdvanceDay, // z advanceDay
    [MATCH_DATE.toDateString()]: { // z handleFinishMatch (tylko mecz gracza!)
      dateKey: MATCH_DATE.toDateString(),
      league1Results: [userMatchResult as any],
      league2Results: [],
      league3Results: [],
    }
  };

  console.log('Możliwy scenariusz z różnymi dateKey:');
  console.log(`  advanceDay zapisało pod: "${previousDate.toDateString()}" (${stateWithBothDates[previousDate.toDateString()].league1Results.length} meczów)`);
  console.log(`  handleFinishMatch zapisało pod: "${MATCH_DATE.toDateString()}" (${stateWithBothDates[MATCH_DATE.toDateString()].league1Results.length} meczów)`);

  // PostMatchStudioView czyta roundResults[currentDate.toDateString()]
  // Jeśli currentDate to MATCH_DATE, zobaczy tylko 1 mecz (gracza)
  // Jeśli currentDate to previousDate (advanceDay przesunął datę), zobaczy 8 meczów tła
  console.log('\nCo widzi PostMatchStudioView zależnie od currentDate:');
  const viewWithMatchDate = stateWithBothDates[MATCH_DATE.toDateString()];
  const viewWithPrevDate = stateWithBothDates[previousDate.toDateString()];
  console.log(`  currentDate = MATCH_DATE: ${viewWithMatchDate?.league1Results.length ?? 0} meczów`);
  console.log(`  currentDate = previousDate: ${viewWithPrevDate?.league1Results.length ?? 0} meczów`);

  console.groupEnd();

  // ─────────────────────────────────────────────
  // WNIOSKI
  // ─────────────────────────────────────────────
  console.group('%c=== WNIOSKI ===', 'color: cyan; font-weight: bold');
  console.log('Kluczowe pytanie: czy processLeagueEvent filtruje FINISHED fixtures?');
  const scheduledCount = fixtures.filter(f => f.status === MatchStatus.SCHEDULED).length;
  const finishedCount2 = fixtures.filter(f => f.status === MatchStatus.FINISHED).length;
  console.log(`Oryginalne fixtures: ${scheduledCount} SCHEDULED, ${finishedCount2} FINISHED`);
  console.log(`Po pierwszym wywołaniu: ${updatedFixtures.filter(f => f.status === MatchStatus.FINISHED).length} FINISHED`);
  console.log('\nWniosek: Duplikacja nie pochodzi z processLeagueEvent samego w sobie.');
  console.log('Problem leży w tym JAK roundResults są zbierane i pod JAKIM kluczem (dateKey) są zapisywane.');
  console.log('\nSzybki SPRAWDZIAN w grze:');
  console.log('1. Dodaj console.log w applySimulationResult przy addRoundResults:');
  console.log('   console.log("[ROUND SAVE]", results.dateKey, results.league1Results.length)');
  console.log('2. Sprawdź ile razy to się wywoła i z jakimi dateKey');
  console.groupEnd();

  console.groupEnd(); // main
};

// ─────────────────────────────────────────────
// AUTO-RUN (odkomentuj aby uruchomić)
// ─────────────────────────────────────────────
// runRoundDuplicationTest();
