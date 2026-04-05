import { Club, Player } from '../types';

export interface BoardRequestResult {
  result: 'FULL' | 'PARTIAL' | 'REJECTED';
  grantedAmount: number;
  message: string;
}

export const BoardBudgetRequestService = {
  evaluateBoardRequest: (
    player: Player,
    myClub: Club,
    mySquad: Player[],
    shortfall: number
  ): BoardRequestResult => {
    const requestsUsed = myClub.boardBudgetRequestsThisSeason ?? 0;
    if (requestsUsed >= 2) {
      return {
        result: 'REJECTED',
        grantedAmount: 0,
        message: 'Zarząd wyczerpał limit specjalnych dofinansowań w tym sezonie.',
      };
    }

    const bestOVR = mySquad.length > 0
      ? Math.max(...mySquad.map(p => p.overallRating))
      : 0;

    if (player.overallRating < bestOVR + 2) {
      return {
        result: 'REJECTED',
        grantedAmount: 0,
        message: `Zarząd nie widzi uzasadnienia dla tej inwestycji. Zawodnik (${player.overallRating} OVR) nie wyróżnia się na tle obecnej kadry (najlepszy: ${bestOVR} OVR).`,
      };
    }

    const ovrDiff = player.overallRating - (bestOVR + 2);
    const fullChance = Math.min(0.30 + ovrDiff * 0.04, 0.60);
    const partialChance = 0.25;
    const roll = Math.random();

    if (roll < fullChance) {
      return {
        result: 'FULL',
        grantedAmount: shortfall,
        message: `Zarząd zatwierdził pełne dofinansowanie w wysokości ${shortfall.toLocaleString('pl-PL')} PLN. To wyjątkowa inwestycja — nie zawieźcie nas.`,
      };
    }

    if (roll < fullChance + partialChance) {
      const ratio = 0.60 + Math.random() * 0.20;
      const granted = Math.floor(shortfall * ratio);
      const remaining = shortfall - granted;
      return {
        result: 'PARTIAL',
        grantedAmount: granted,
        message: `Zarząd przyznał częściowe dofinansowanie: ${granted.toLocaleString('pl-PL')} PLN. Brakujące ${remaining.toLocaleString('pl-PL')} PLN musisz pokryć przez obniżenie oferty.`,
      };
    }

    return {
      result: 'REJECTED',
      grantedAmount: 0,
      message: 'Zarząd odmawia dodatkowego finansowania. Warunki oferty muszą mieścić się w przydzielonym budżecie.',
    };
  },
};
