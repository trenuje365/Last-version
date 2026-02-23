import { Club } from '../types';

export interface KitSelection {
  home: {
    primary: string;
    secondary: string;
    text: string;
  };
  away: {
    primary: string;
    secondary: string;
    text: string;
  };
}

export const KitSelectionService = {
  /**
   * Calculates perceptual color distance between two hex colors.
   * Uses weighted Euclidean distance for better human perception approximation.
   */
  getColorDistance: (hex1: string, hex2: string): number => {
    const r1 = parseInt(hex1.substring(1, 3), 16);
    const g1 = parseInt(hex1.substring(3, 5), 16);
    const b1 = parseInt(hex1.substring(5, 7), 16);

    const r2 = parseInt(hex2.substring(1, 3), 16);
    const g2 = parseInt(hex2.substring(3, 5), 16);
    const b2 = parseInt(hex2.substring(5, 7), 16);

    const rmean = (r1 + r2) / 2;
    const r = r1 - r2;
    const g = g1 - g2;
    const b = b1 - b2;
    
    // Perceptual weighting formula
    return Math.sqrt((((512 + rmean) * r * r) >> 8) + 4 * g * g + (((767 - rmean) * b * b) >> 8));
  },

  /**
   * Determines if a color is light or dark for text contrast.
   */
  isColorLight: (hex: string): boolean => {
    const r = parseInt(hex.substring(1, 3), 16);
    const g = parseInt(hex.substring(3, 5), 16);
    const b = parseInt(hex.substring(5, 7), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 155;
  },

  /**
   * Selects the best possible combination of colors from 3-color palettes of both clubs.
   */
  selectOptimalKits: (home: Club, away: Club): KitSelection => {
    const homeColors = home.colorsHex;
    const awayColors = away.colorsHex;

    let bestHomeIdx = 0;
    let bestAwayIdx = 0;
    let maxDistance = -1;

    // We prioritize Home's primary kit (idx 0), but we check all combinations
    // to avoid extreme clashes (like white vs yellow)
    
    const CLASH_THRESHOLD = 280; // Distance below which colors are considered "similar" (e.g. white vs yellow)

    // Iteration strategy: Try to keep Home Primary as much as possible
    for (let h = 0; h < homeColors.length; h++) {
      for (let a = 0; a < awayColors.length; a++) {
        const dist = KitSelectionService.getColorDistance(homeColors[h], awayColors[a]);
        
        // Bonus for staying with primary kits
        const score = dist + (h === 0 ? 100 : 0) + (a === 0 ? 50 : 0);

        if (score > maxDistance) {
          maxDistance = score;
          bestHomeIdx = h;
          bestAwayIdx = a;
        }
      }
      
      // If we found a good enough combination with Home Primary, stop searching
      if (h === 0 && KitSelectionService.getColorDistance(homeColors[0], awayColors[bestAwayIdx]) > CLASH_THRESHOLD) {
        break;
      }
    }

    const hPrimary = homeColors[bestHomeIdx];
    const aPrimary = awayColors[bestAwayIdx];

    return {
      home: {
        primary: hPrimary,
        secondary: homeColors[(bestHomeIdx + 1) % homeColors.length] || hPrimary,
        text: KitSelectionService.isColorLight(hPrimary) ? '#000000' : '#ffffff'
      },
      away: {
        primary: aPrimary,
        secondary: awayColors[(bestAwayIdx + 1) % awayColors.length] || aPrimary,
        text: KitSelectionService.isColorLight(aPrimary) ? '#000000' : '#ffffff'
      }
    };
  }
};