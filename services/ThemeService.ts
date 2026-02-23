
import { Club } from '../types';

export const ThemeService = {
  /**
   * Calculates the relative luminance of a HEX color to determine contrast.
   * Returns 'white' for dark backgrounds and '#0f172a' (slate-900) for light backgrounds.
   */
  getContrastText: (hex: string): 'white' | '#0f172a' => {
    // Remove hash if present
    const color = hex.replace('#', '');
    
    const r = parseInt(color.substring(0, 2), 16);
    const g = parseInt(color.substring(2, 4), 16);
    const b = parseInt(color.substring(4, 6), 16);
    
    // Calculate luminance
    // Formula from WCAG 2.0
    const uicolors = [r / 255, g / 255, b / 255];
    const c = uicolors.map((col) => {
      if (col <= 0.03928) {
        return col / 12.92;
      }
      return Math.pow((col + 0.055) / 1.055, 2.4);
    });
    
    const L = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    
    // Threshold can be adjusted (standard is 0.5, but 0.4 often feels better for pure white text)
    return L > 0.4 ? '#0f172a' : 'white'; 
  },

  /**
   * Generates a style object for the Main Menu header based on club colors.
   */
  getClubThemeStyles: (club?: Club) => {
    if (!club) {
      return {
        background: 'linear-gradient(to right, #0f172a, #1e293b)',
        color: 'white',
        borderColor: '#334155'
      };
    }

    const primary = club.colorsHex[0] || '#0f172a';
    const secondary = club.colorsHex[1] || '#1e293b';
    const textColor = ThemeService.getContrastText(primary);

    return {
      background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`,
      color: textColor,
      borderColor: club.colorsHex[2] || secondary
    };
  }
};
