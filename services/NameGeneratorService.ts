import { Region } from '../types';
import { PL_MALE_FIRSTNAMES, PL_MALE_LASTNAMES } from '../resources/static_db/names/pl_data';
import { BALKAN_MALE_FIRSTNAMES, BALKAN_MALE_LASTNAMES } from '../resources/static_db/names/balkan_data';
import { CZSK_MALE_FIRSTNAMES, CZSK_MALE_LASTNAMES } from '../resources/static_db/names/czsk_data';
import { SSA_MALE_FIRSTNAMES, SSA_MALE_LASTNAMES } from '../resources/static_db/names/ssa_data';
import { IBERIA_MALE_FIRSTNAMES, IBERIA_MALE_LASTNAMES } from '../resources/static_db/names/iberia_data';
import { SCANDINAVIA_MALE_FIRSTNAMES, SCANDINAVIA_MALE_LASTNAMES } from '../resources/static_db/names/scandinavia_data';
import { EXUSSR_MALE_FIRSTNAMES, EXUSSR_MALE_LASTNAMES } from '../resources/static_db/names/exussr_data';

interface NamePair {
  firstName: string;
  lastName: string;
}

const getRandomElement = (arr: string[]): string => {
  return arr[Math.floor(Math.random() * arr.length)];
};

export const NameGeneratorService = {
  getRandomName(region: Region): NamePair {
    switch (region) {
      case Region.POLAND:
        return {
          firstName: getRandomElement(PL_MALE_FIRSTNAMES),
          lastName: getRandomElement(PL_MALE_LASTNAMES)
        };
      case Region.BALKANS:
        return {
          firstName: getRandomElement(BALKAN_MALE_FIRSTNAMES),
          lastName: getRandomElement(BALKAN_MALE_LASTNAMES)
        };
      case Region.CZ_SK:
        return {
          firstName: getRandomElement(CZSK_MALE_FIRSTNAMES),
          lastName: getRandomElement(CZSK_MALE_LASTNAMES)
        };
      case Region.SSA:
        return {
          firstName: getRandomElement(SSA_MALE_FIRSTNAMES),
          lastName: getRandomElement(SSA_MALE_LASTNAMES)
        };
      case Region.IBERIA:
        return {
          firstName: getRandomElement(IBERIA_MALE_FIRSTNAMES),
          lastName: getRandomElement(IBERIA_MALE_LASTNAMES)
        };
      case Region.SCANDINAVIA:
        return {
          firstName: getRandomElement(SCANDINAVIA_MALE_FIRSTNAMES),
          lastName: getRandomElement(SCANDINAVIA_MALE_LASTNAMES)
        };
      case Region.EX_USSR:
        return {
          firstName: getRandomElement(EXUSSR_MALE_FIRSTNAMES),
          lastName: getRandomElement(EXUSSR_MALE_LASTNAMES)
        };
      default:
        // Fallback to Polish
        return {
          firstName: getRandomElement(PL_MALE_FIRSTNAMES),
          lastName: getRandomElement(PL_MALE_LASTNAMES)
        };
    }
  },

  getRandomForeignRegion(): Region {
    const foreignRegions = [
      Region.BALKANS,
      Region.CZ_SK,
      Region.SSA,
      Region.IBERIA,
      Region.SCANDINAVIA,
      Region.EX_USSR
    ];
    return foreignRegions[Math.floor(Math.random() * foreignRegions.length)];
  }
};