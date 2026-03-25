import { NationalTeam, Coach, Player, Region, PlayerPosition, HealthStatus } from '../types';
import { NATIONAL_TEAMS_EUROPE } from '../resources/static_db/NationalTeams/NationalTeamsEurope';
import { NATIONAL_TEAMS_AFRICA } from '../resources/static_db/NationalTeams/NationalTeamsAfrica';
import { NATIONAL_TEAMS_CONMEBOL } from '../resources/static_db/NationalTeams/NationalTeamsCONMEBOL';
import { NATIONAL_TEAMS_CONCACAF } from '../resources/static_db/NationalTeams/NationalTeamsCONCACAF';
import { NATIONAL_TEAMS_AFC } from '../resources/static_db/NationalTeams/NationalTeamsAFC';
import { NATIONAL_TEAMS_OFC } from '../resources/static_db/NationalTeams/NationalTeamsOFC';
import { TACTICS_DB } from '../resources/tactics_db';
import { NameGeneratorService } from './NameGeneratorService';
import { PlayerAttributesGenerator } from './PlayerAttributesGenerator';

// Skład kadry: 3 GK + 8 DEF + 8 MID + 6 FWD = 25 zawodników
const NT_GK = 3;
const NT_DEF = 8;
const NT_MID = 8;
const NT_FWD = 6;

export const NationalTeamService = {

  // ─── 1. INICJALIZACJA ────────────────────────────────────────────────────────

  initializeNationalTeams: (): NationalTeam[] => {
    const sources = [
      { prefix: 'NT_EUR', data: NATIONAL_TEAMS_EUROPE },
      { prefix: 'NT_AFR', data: NATIONAL_TEAMS_AFRICA },
      { prefix: 'NT_SAM', data: NATIONAL_TEAMS_CONMEBOL },
      { prefix: 'NT_NAM', data: NATIONAL_TEAMS_CONCACAF },
      { prefix: 'NT_ASI', data: NATIONAL_TEAMS_AFC },
      { prefix: 'NT_OFC', data: NATIONAL_TEAMS_OFC },
    ] as const;

    const result: NationalTeam[] = [];
    sources.forEach(({ prefix, data }) => {
      (data as any[]).forEach((entry, index) => {
        result.push({
          id: `${prefix}_${index}`,
          name: entry.name,
          continent: entry.continent,
          tier: entry.tier,
          colorsHex: entry.colors,
          stadiumName: entry.stadium,
          stadiumCapacity: entry.capacity,
          reputation: entry.reputation,
          region: entry.region as Region,
          coachId: null,
          squadPlayerIds: [],
          tacticId: null,
        });
      });
    });
    return result;
  },

  // ─── 2. WYBÓR TAKTYKI ────────────────────────────────────────────────────────

  selectTacticForCoach: (coach: Coach): string => {
    // Deterministyczny wybór na podstawie hash ID trenera
    // Trener z wysokim decisionMaking preferuje wyspecjalizowane taktyki
    const hash = coach.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const dm = coach.attributes.decisionMaking;

    let pool = TACTICS_DB;
    if (dm >= 70) {
      const specialized = TACTICS_DB.filter(t => t.attackBias > 60 || t.defenseBias > 60);
      if (specialized.length > 0) pool = specialized;
    } else {
      const neutral = TACTICS_DB.filter(t => t.attackBias >= 40 && t.attackBias <= 65);
      if (neutral.length > 0) pool = neutral;
    }
    return pool[hash % pool.length].id;
  },

  // ─── 3. PRZYPISANIE TRENERÓW ─────────────────────────────────────────────────

  assignCoachesToNationalTeams: (
    nationalTeams: NationalTeam[],
    ntCoachList: Coach[]
  ): { updatedTeams: NationalTeam[]; updatedCoaches: Record<string, Coach> } => {
    const coachesMap: Record<string, Coach> = {};
    ntCoachList.forEach(c => { coachesMap[c.id] = { ...c }; });

    const updatedTeams = nationalTeams.map(t => ({ ...t }));

    // Progi doświadczenia trenera w zależności od reputacji reprezentacji
    const getExpRange = (rep: number): [number, number] => {
      if (rep >= 18) return [85, 99];
      if (rep >= 14) return [65, 84];
      if (rep >= 10) return [40, 64];
      if (rep >= 6)  return [20, 39];
      return [5, 19];
    };

    // Sortuj malejąco po reputacji – najlepsze drużyny dostają trenerów jako pierwsze
    const sortedByRep = [...updatedTeams].sort((a, b) => b.reputation - a.reputation);

    for (const team of sortedByRep) {
      const [minExp, maxExp] = getExpRange(team.reputation);
      const available = Object.values(coachesMap).filter(c => !c.currentNationalTeamId);

      // Priorytet 1: ten sam region i właściwe doświadczenie
      let coach = available.find(c =>
        c.nationality === team.region &&
        c.attributes.experience >= minExp &&
        c.attributes.experience <= maxExp
      );

      // Priorytet 2: właściwe doświadczenie (dowolny region)
      if (!coach) {
        coach = available.find(c =>
          c.attributes.experience >= minExp &&
          c.attributes.experience <= maxExp
        );
      }

      // Priorytet 3: rozszerzone doświadczenie ±10
      if (!coach) {
        coach = available.find(c =>
          c.attributes.experience >= Math.max(0, minExp - 10) &&
          c.attributes.experience <= Math.min(99, maxExp + 10)
        );
      }

      // Priorytet 4: jakikolwiek wolny trener
      if (!coach) {
        coach = available[0];
      }

      if (coach) {
        coachesMap[coach.id].currentNationalTeamId = team.id;
        team.coachId = coach.id;
        team.tacticId = NationalTeamService.selectTacticForCoach(coach);
      }
    }

    return { updatedTeams, updatedCoaches: coachesMap };
  },

  // ─── 4. GENEROWANIE ZAWODNIKA NT ─────────────────────────────────────────────

  generatePlayerForNT: (
    teamId: string,
    region: Region,
    position: PlayerPosition,
    teamReputation: number,
    index: number,
    usedNames: Set<string>
  ): Player => {
    // Mapowanie reputacji NT (1-20) na tier dla generatora atrybutów (1-4)
    let tier: number;
    if (teamReputation >= 16) tier = 1;
    else if (teamReputation >= 12) tier = 2;
    else if (teamReputation >= 7)  tier = 3;
    else tier = 4;

    let namePair = NameGeneratorService.getRandomName(region);
    let fullName = `${namePair.firstName} ${namePair.lastName}`;
    let attempts = 0;
    while (usedNames.has(fullName) && attempts < 50) {
      namePair = NameGeneratorService.getRandomName(region);
      fullName = `${namePair.firstName} ${namePair.lastName}`;
      attempts++;
    }
    usedNames.add(fullName);

    const age = 18 + Math.floor(Math.random() * 16); // 18-33 lat
    const genData = PlayerAttributesGenerator.generateAttributes(position, tier, teamReputation, age, false);

    return {
      id: `NT_${teamId}_${String(index).padStart(3, '0')}`,
      firstName: namePair.firstName,
      lastName: namePair.lastName,
      clubId: 'FREE_AGENTS',
      position,
      nationality: region,
      age,
      fatigueDebt: 0,
      overallRating: genData.overall,
      attributes: genData.attributes,
      stats: {
        matchesPlayed: 0,
        minutesPlayed: 0,
        goals: 0,
        assists: 0,
        yellowCards: 0,
        redCards: 0,
        cleanSheets: 0,
        seasonalChanges: {},
        ratingHistory: []
      },
      health: { status: HealthStatus.HEALTHY },
      condition: 100,
      suspensionMatches: 0,
      contractEndDate: new Date(2028, 5, 30).toISOString(),
      annualSalary: 0,
      history: [],
      boardLockoutUntil: null,
      isUntouchable: false,
      negotiationStep: 0,
      negotiationLockoutUntil: null,
      contractLockoutUntil: null,
      freeAgentLockoutUntil: null,
      isNegotiationPermanentBlocked: false,
      transferLockoutUntil: null,
    } as Player;
  },

  // ─── 5. GENEROWANIE SKŁADU DLA JEDNEJ DRUŻYNY ───────────────────────────────

  generateSquadForTeam: (
    team: NationalTeam,
    coachExp: number,
    allPlayers: Record<string, Player[]>
  ): { squadPlayerIds: string[]; newPlayers: Player[] } => {
    // Wyklucz wolnych agentów — trener szuka tylko wśród zawodników z klubów
    const allPlayersList = Object.entries(allPlayers)
      .filter(([key]) => key !== 'FREE_AGENTS')
      .flatMap(([, arr]) => arr);

    const TIER_OVR_CAP: Record<number, number> = {
      1: 99, 2: 92, 3: 80, 4: 70, 5: 62,
    };
    const ovrCap = TIER_OVR_CAP[team.tier] ?? 62;

    const byPos = (pos: PlayerPosition): Player[] =>
      allPlayersList
        .filter(p => p.nationality === team.region && p.position === pos && p.overallRating <= ovrCap)
        .sort((a, b) => b.overallRating - a.overallRating);

    const poolGK  = byPos(PlayerPosition.GK);
    const poolDEF = byPos(PlayerPosition.DEF);
    const poolMID = byPos(PlayerPosition.MID);
    const poolFWD = byPos(PlayerPosition.FWD);

    // Współczynnik okna selekcji: trener z exp=99 widzi top 100%, exp=0 widzi top 40%
    const windowFactor = 0.4 + 0.6 * (coachExp / 99);

    const selectFromPool = (pool: Player[], needed: number): { selected: Player[]; missing: number } => {
      if (pool.length === 0) return { selected: [], missing: needed };
      const topWindow = Math.max(needed, Math.ceil(pool.length * windowFactor));
      const selected = pool.slice(0, Math.min(needed, topWindow));
      return { selected, missing: Math.max(0, needed - selected.length) };
    };

    const squadPlayerIds: string[] = [];
    const newPlayers: Player[] = [];
    const usedNames = new Set<string>();
    let genIndex = 0;

    const process = (pool: Player[], needed: number, pos: PlayerPosition) => {
      const { selected, missing } = selectFromPool(pool, needed);
      selected.forEach(p => squadPlayerIds.push(p.id));
      for (let i = 0; i < missing; i++) {
        const np = NationalTeamService.generatePlayerForNT(
          team.id, team.region, pos, team.reputation, genIndex++, usedNames
        );
        newPlayers.push(np);
        squadPlayerIds.push(np.id);
      }
    };

    process(poolGK,  NT_GK,  PlayerPosition.GK);
    process(poolDEF, NT_DEF, PlayerPosition.DEF);
    process(poolMID, NT_MID, PlayerPosition.MID);
    process(poolFWD, NT_FWD, PlayerPosition.FWD);

    return { squadPlayerIds, newPlayers };
  },

  // ─── 6. GENEROWANIE SKŁADÓW DLA WSZYSTKICH DRUŻYN ───────────────────────────

  generateAllSquads: (
    nationalTeams: NationalTeam[],
    ntCoaches: Record<string, Coach>,
    allPlayers: Record<string, Player[]>
  ): { updatedTeams: NationalTeam[]; newPlayers: Player[] } => {
    const updatedTeams: NationalTeam[] = [];
    const allNewPlayers: Player[] = [];

    for (const team of nationalTeams) {
      const coach = team.coachId ? ntCoaches[team.coachId] : null;
      const coachExp = coach ? coach.attributes.experience : 50;

      const { squadPlayerIds, newPlayers } = NationalTeamService.generateSquadForTeam(
        team, coachExp, allPlayers
      );

      updatedTeams.push({ ...team, squadPlayerIds });
      allNewPlayers.push(...newPlayers);
    }

    return { updatedTeams, newPlayers: allNewPlayers };
  },

  // ─── 7. DZIENNY PRZEGLĄD KONTUZJI ────────────────────────────────────────────

  reviewDailyInjuries: (
    nationalTeams: NationalTeam[],
    allPlayers: Record<string, Player[]>,
    _currentDate: Date
  ): { updatedTeams: NationalTeam[]; newPlayers: Player[] } => {
    // Wyklucz wolnych agentów — zastępca musi być zawodnikiem klubowym
    const allPlayersList = Object.entries(allPlayers)
      .filter(([key]) => key !== 'FREE_AGENTS')
      .flatMap(([, arr]) => arr);
    const playerMap: Record<string, Player> = {};
    allPlayersList.forEach(p => { playerMap[p.id] = p; });

    const updatedTeams: NationalTeam[] = [];
    const allNewPlayers: Player[] = [];

    for (const team of nationalTeams) {
      const squadIds = [...team.squadPlayerIds];
      let genIndex = team.squadPlayerIds.length;
      const usedNames = new Set<string>();
      let changed = false;

      for (let i = 0; i < squadIds.length; i++) {
        const player = playerMap[squadIds[i]];
        if (!player) continue;
        if (player.health.status !== HealthStatus.INJURED) continue;

        // Szukaj zdrowego zastępcy: ten sam region i pozycja, jeszcze nie w kadrze
        const replacement = allPlayersList.find(p =>
          p.nationality === team.region &&
          p.position === player.position &&
          p.health.status === HealthStatus.HEALTHY &&
          !squadIds.includes(p.id)
        );

        if (replacement) {
          squadIds[i] = replacement.id;
        } else {
          // Dogeneruj brakującego zawodnika
          const np = NationalTeamService.generatePlayerForNT(
            team.id, team.region, player.position, team.reputation, genIndex++, usedNames
          );
          allNewPlayers.push(np);
          squadIds[i] = np.id;
        }
        changed = true;
      }

      updatedTeams.push(changed ? { ...team, squadPlayerIds: squadIds } : team);
    }

    return { updatedTeams, newPlayers: allNewPlayers };
  },
};
