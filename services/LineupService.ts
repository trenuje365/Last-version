import { Lineup, Player, PlayerPosition, Tactic, InjurySeverity, HealthStatus } from '../types';
import { TacticRepository } from '../resources/tactics_db';

export const LineupService = {
  /**
   * Deterministyczny wybór składu.
   */
  autoPickLineup: (clubId: string, players: Player[], tacticId: string = '4-4-2'): Lineup => {
    const tactic = TacticRepository.getById(tacticId);
    
    // Na start wybieramy tylko tych, którzy są w stanie grać (nie SEVERE i nie zawieszeni)
    const availablePlayers = players.filter(p => 
      (p.suspensionMatches || 0) === 0 && 
      (p.health.status === HealthStatus.HEALTHY || p.health.injury?.severity !== InjurySeverity.SEVERE)
    );
    const sortedPlayers = [...availablePlayers].sort((a, b) => b.overallRating - a.overallRating);
    
    const startingXI: (string | null)[] = new Array(11).fill(null);
    const bench: string[] = [];
    const reserves: string[] = [];
    
    const usedPlayerIds = new Set<string>();

    const goalkeepers = sortedPlayers.filter(p => p.position === PlayerPosition.GK);
    if (goalkeepers.length > 0) {
      startingXI[0] = goalkeepers[0].id; 
      usedPlayerIds.add(goalkeepers[0].id);
    }

    for (let i = 1; i < 11; i++) {
      const requiredRole = tactic.slots[i].role;
      const candidate = sortedPlayers.find(p => 
        !usedPlayerIds.has(p.id) && p.position === requiredRole
      );

      if (candidate) {
        startingXI[i] = candidate.id;
        usedPlayerIds.add(candidate.id);
      } else {
        const fallback = sortedPlayers.find(p => !usedPlayerIds.has(p.id));
        if (fallback) {
           startingXI[i] = fallback.id;
           usedPlayerIds.add(fallback.id);
        }
      }
    }

    const benchGK = sortedPlayers.find(p => 
      p.position === PlayerPosition.GK && !usedPlayerIds.has(p.id)
    );
    if (benchGK) {
      bench.push(benchGK.id);
      usedPlayerIds.add(benchGK.id);
    }

    for (const p of sortedPlayers) {
      if (!usedPlayerIds.has(p.id) && bench.length < 9) {
        bench.push(p.id);
        usedPlayerIds.add(p.id);
      }
    }

    const allIds = players.map(p => p.id);
    allIds.forEach(id => {
      if (!usedPlayerIds.has(id)) {
        reserves.push(id);
      }
    });

    return { clubId, tacticId: tactic.id, startingXI, bench, reserves };
  },

  calculateFitScore: (player: Player, role: PlayerPosition): number => {
    const attr = player.attributes;
    const isGkPlayer = player.position === PlayerPosition.GK;
    const isGkRole = role === PlayerPosition.GK;

    if ((isGkPlayer && !isGkRole) || (!isGkPlayer && isGkRole)) {
      return -2000 + player.overallRating;
    }

    switch (role) {
      case PlayerPosition.GK:
        return attr.goalkeeping * 2 + attr.positioning;
      case PlayerPosition.DEF:
        return attr.defending * 1.5 + attr.strength + attr.positioning;
      case PlayerPosition.MID:
        return attr.passing * 1.2 + attr.vision + attr.technique;
      case PlayerPosition.FWD:
        return attr.finishing * 1.5 + attr.attacking + attr.pace * 0.5;
      default:
        return player.overallRating;
    }
  },

/**
   * Naprawia skład używając Systemu Kaskadowego (Stage 1 PRO).
   * Priorytet: Świeżość > Pozycja > Rating.
   */
repairLineup: (lineup: Lineup, players: Player[]): Lineup => {
    const AI_FRESH_THRESHOLD = 87;
    const tactic = TacticRepository.getById(lineup.tacticId);
    const canPlay = (p: Player) => (p.suspensionMatches || 0) === 0 && (p.health.status !== HealthStatus.INJURED || p.health.injury?.severity !== InjurySeverity.SEVERE);
    
    const allAvailable = players.filter(canPlay);
    const freshPool = allAvailable.filter(p => p.condition >= AI_FRESH_THRESHOLD).sort((a,b) => b.overallRating - a.overallRating);
    const tiredPool = allAvailable.filter(p => p.condition < AI_FRESH_THRESHOLD).sort((a,b) => b.overallRating - a.overallRating);
    
    let usedIds = new Set<string>();
    const newXI: (string | null)[] = new Array(11).fill(null);

    // Faza 0: Bramkarz (Bezwzględny priorytet pozycji)
 // Faza 0: Bramkarz (Kaskada: Świeżość > Pozycja > Rating)
    const freshGk = freshPool.find(p => p.position === PlayerPosition.GK);
    const bestGk = freshGk || tiredPool.find(p => p.position === PlayerPosition.GK);

    if (bestGk) { 
      newXI[0] = bestGk.id; 
      usedIds.add(bestGk.id); 
    }

    // Faza 1: Pole - Świeży na swojej pozycji
    for (let i = 1; i < 11; i++) {
      const role = tactic.slots[i].role;
      const match = freshPool.find(p => p.position === role && !usedIds.has(p.id));
      if (match) { newXI[i] = match.id; usedIds.add(match.id); }
    }

    // Faza 2: Pole - Świeży z innej pozycji (Fallback)
    for (let i = 1; i < 11; i++) {
      if (!newXI[i]) {
        const match = freshPool.find(p => p.position !== PlayerPosition.GK && !usedIds.has(p.id));
        if (match) { newXI[i] = match.id; usedIds.add(match.id); }
      }
    }

    // Faza 3: Pole - Zmęczony na swojej pozycji (Emergency)
    for (let i = 1; i < 11; i++) {
      if (!newXI[i]) {
        const role = tactic.slots[i].role;
        const match = tiredPool.find(p => p.position === role && !usedIds.has(p.id));
        if (match) { newXI[i] = match.id; usedIds.add(match.id); }
      }
    }

    // Faza 4: Pole - Ostateczność (Ktokolwiek został)
    for (let i = 1; i < 11; i++) {
      if (!newXI[i]) {
        const match = allAvailable.find(p => !usedIds.has(p.id));
        if (match) { newXI[i] = match.id; usedIds.add(match.id); }
      }
    }

    // Faza 5: Ławka (Dynamiczne proporcje)
    const newBench: string[] = [];
    const benchTarget = [PlayerPosition.GK, PlayerPosition.DEF, PlayerPosition.DEF, PlayerPosition.MID, PlayerPosition.MID, PlayerPosition.MID, PlayerPosition.FWD, PlayerPosition.FWD, PlayerPosition.MID];
    
    benchTarget.forEach(pos => {
      if (newBench.length >= 9) return;
      // Najpierw szukaj świeżego na pozycję, potem jakiegokolwiek świeżego, potem zmęczonego
      const sub = freshPool.find(p => p.position === pos && !usedIds.has(p.id)) ||
                  freshPool.find(p => !usedIds.has(p.id)) ||
                  tiredPool.find(p => p.position === pos && !usedIds.has(p.id)) ||
                  tiredPool.find(p => !usedIds.has(p.id));
      
      if (sub) { newBench.push(sub.id); usedIds.add(sub.id); }
    });

    const newReserves = players.map(p => p.id).filter(id => !usedIds.has(id));
    return { ...lineup, startingXI: newXI, bench: newBench, reserves: newReserves };
  },

  evictSuspendedPlayers: (lineup: Lineup, players: Player[]): Lineup => {
    const newLineup = { ...lineup, startingXI: [...lineup.startingXI], bench: [...lineup.bench], reserves: [...lineup.reserves] };
    const isRestricted = (id: string) => {
      const p = players.find(x => x.id === id);
      if (!p) return false;
      const isSuspended = (p.suspensionMatches || 0) > 0;
      const isSevereInjured = p.health.status === HealthStatus.INJURED && p.health.injury?.severity === InjurySeverity.SEVERE;
      return isSuspended || isSevereInjured;
    };
    newLineup.startingXI = newLineup.startingXI.map(id => {
      if (id && isRestricted(id)) {
        if (!newLineup.reserves.includes(id)) newLineup.reserves.push(id);
        return null; 
      }
      return id;
    });
    newLineup.bench = newLineup.bench.filter(id => {
      if (isRestricted(id)) {
        if (!newLineup.reserves.includes(id)) newLineup.reserves.push(id);
        return false;
      }
      return true;
    });
    return newLineup;
  },

  validateLineup: (lineup: Lineup, allClubPlayers: Player[]): { valid: boolean; error?: string } => {
    const missingCount = lineup.startingXI.filter(id => id === null).length;
    if (missingCount > 0) return { valid: false, error: `Skład niekompletny! Brakuje ${missingCount} zawodników.` };
    if (lineup.bench.length > 9) return { valid: false, error: "Zbyt wielu zawodników na ławce" };
    const startPlayers = allClubPlayers.filter(p => lineup.startingXI.includes(p.id));
    const hasGK = startPlayers.some(p => p.position === PlayerPosition.GK);
    if (!hasGK) return { valid: false, error: "Brak bramkarza w podstawowej jedenastce!" };
    if (startPlayers.some(p => (p.suspensionMatches || 0) > 0)) return { valid: false, error: "W wyjściowym składzie znajduje się zawieszony zawodnik!" };
    if (startPlayers.some(p => p.health.status === HealthStatus.INJURED && p.health.injury?.severity === InjurySeverity.SEVERE)) return { valid: false, error: "W wyjściowym składzie znajduje się poważnie kontuzjowany zawodnik!" };
    return { valid: true };
  },

  assignToSlot: (lineup: Lineup, playerId: string, slotIdx: number): Lineup => {
    const newLineup = { ...lineup, startingXI: [...lineup.startingXI], bench: [...lineup.bench], reserves: [...lineup.reserves] };
    newLineup.startingXI = newLineup.startingXI.map(id => id === playerId ? null : id);
    newLineup.bench = newLineup.bench.filter(id => id !== playerId);
    newLineup.reserves = newLineup.reserves.filter(id => id !== playerId);
    const oldOccupant = newLineup.startingXI[slotIdx];
    if (oldOccupant) newLineup.reserves.push(oldOccupant);
    newLineup.startingXI[slotIdx] = playerId;
    return newLineup;
  },

  swapPlayers: (lineup: Lineup, sourceId: string | null, targetId: string | null, sourceIdx?: number, targetIdx?: number): Lineup => {
    const nextLineup = { 
      ...lineup, 
      startingXI: [...lineup.startingXI], 
      bench: [...lineup.bench], 
      reserves: [...lineup.reserves] 
    };

    for (let i = 0; i < 11; i++) {
       if (sourceIdx === i || (sourceId !== null && nextLineup.startingXI[i] === sourceId)) nextLineup.startingXI[i] = null;
       else if (targetIdx === i || (targetId !== null && nextLineup.startingXI[i] === targetId)) nextLineup.startingXI[i] = null;
    }
    if (sourceId) {
      nextLineup.bench = nextLineup.bench.filter(id => id !== sourceId);
      nextLineup.reserves = nextLineup.reserves.filter(id => id !== sourceId);
    }
    if (targetId) {
      nextLineup.bench = nextLineup.bench.filter(id => id !== targetId);
      nextLineup.reserves = nextLineup.reserves.filter(id => id !== targetId);
    }

    if (targetIdx !== undefined && targetIdx < 11) {
       nextLineup.startingXI[targetIdx] = sourceId;
    } else if (targetId && lineup.bench.includes(targetId)) {
       if (sourceId) nextLineup.bench.push(sourceId);
    } else {
       if (sourceId) nextLineup.reserves.push(sourceId);
    }

    if (sourceIdx !== undefined && sourceIdx < 11) {
       nextLineup.startingXI[sourceIdx] = targetId;
    } else if (sourceId && lineup.bench.includes(sourceId)) {
       if (targetId) nextLineup.bench.push(targetId);
    } else {
       if (targetId) nextLineup.reserves.push(targetId);
    }

    nextLineup.bench = Array.from(new Set(nextLineup.bench));
    nextLineup.reserves = Array.from(new Set(nextLineup.reserves));

    while (nextLineup.bench.length > 9) {
       const extra = nextLineup.bench.pop();
       if (extra) nextLineup.reserves.push(extra);
    }

    return nextLineup;
  }
};