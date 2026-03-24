
type ClimateZone = 'NORTH' | 'ATLANTIC' | 'CONTINENTAL' | 'MEDITERRANEAN' | 'EAST';

const COUNTRY_TO_ZONE: Record<string, ClimateZone> = {
  // Północ
  'NOR': 'NORTH', 'SWE': 'NORTH', 'DEN': 'NORTH', 'FIN': 'NORTH',
  'ISL': 'NORTH', 'FRO': 'NORTH', 'SCO': 'NORTH',
  // Atlantycki
  'ENG': 'ATLANTIC', 'IRL': 'ATLANTIC', 'WAL': 'ATLANTIC', 'NIR': 'ATLANTIC',
  'POR': 'ATLANTIC', 'BEL': 'ATLANTIC', 'NED': 'ATLANTIC', 'FRA': 'ATLANTIC',
  // Kontynentalny
  'GER': 'CONTINENTAL', 'POL': 'CONTINENTAL', 'CZE': 'CONTINENTAL', 'SVK': 'CONTINENTAL',
  'AUT': 'CONTINENTAL', 'SUI': 'CONTINENTAL', 'HUN': 'CONTINENTAL',
  'SRB': 'CONTINENTAL', 'CRO': 'CONTINENTAL', 'BIH': 'CONTINENTAL',
  'MKD': 'CONTINENTAL', 'MNE': 'CONTINENTAL', 'BUL': 'CONTINENTAL', 'SVN': 'CONTINENTAL',
  'UKR': 'CONTINENTAL', 'ROU': 'CONTINENTAL', 'MDA': 'CONTINENTAL',
  'LTU': 'CONTINENTAL', 'LAT': 'CONTINENTAL', 'EST': 'CONTINENTAL',
  'BLR': 'CONTINENTAL',
  // Śródziemnomorski
  'ITA': 'MEDITERRANEAN', 'ESP': 'MEDITERRANEAN', 'GRE': 'MEDITERRANEAN',
  'TUR': 'MEDITERRANEAN', 'CYP': 'MEDITERRANEAN', 'MLT': 'MEDITERRANEAN',
  'AND': 'MEDITERRANEAN', 'GIB': 'MEDITERRANEAN', 'SMR': 'MEDITERRANEAN',
  'ISR': 'MEDITERRANEAN', 'LIB': 'MEDITERRANEAN',
  // Wschód
  'RUS': 'EAST', 'KAZ': 'EAST', 'AZE': 'EAST', 'GEO': 'EAST', 'ARM': 'EAST',
};

// Miesięczny modyfikator goli (0=Styczeń … 11=Grudzień)
// 1.0 = normalnie | < 1.0 = mniej goli (zła pogoda) | > 1.0 = więcej goli (dobre warunki)
const BASE_MODIFIER: Record<ClimateZone, number[]> = {
  NORTH:         [0.82, 0.83, 0.88, 0.95, 1.02, 1.05, 1.05, 1.03, 0.98, 0.92, 0.87, 0.83],
  ATLANTIC:      [0.90, 0.90, 0.93, 0.97, 1.00, 1.02, 1.03, 1.02, 1.00, 0.96, 0.92, 0.90],
  CONTINENTAL:   [0.84, 0.85, 0.90, 0.97, 1.02, 1.04, 1.04, 1.03, 1.00, 0.95, 0.89, 0.85],
  MEDITERRANEAN: [0.96, 0.97, 0.99, 1.02, 1.04, 1.05, 1.05, 1.05, 1.03, 1.01, 0.98, 0.97],
  EAST:          [0.80, 0.81, 0.87, 0.95, 1.01, 1.04, 1.04, 1.02, 0.98, 0.91, 0.85, 0.81],
};

export const EuropeanWeatherService = {
  // Zwraca modyfikator liczby goli (0.75 – 1.10) dla kraju gospodarza i daty meczu.
  // randVariation: wartość 0–1 z seededRng — dodaje małą losową wariację ±0.05
  getGoalModifier: (countryCode: string, date: Date, randVariation: number): number => {
    const zone: ClimateZone = COUNTRY_TO_ZONE[countryCode] ?? 'CONTINENTAL';
    const month = date.getMonth(); // 0-11
    const base = BASE_MODIFIER[zone][month];
    return Math.max(0.75, Math.min(1.10, base + (randVariation - 0.5) * 0.10));
  }
};
