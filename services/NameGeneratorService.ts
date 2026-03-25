import { Region } from '../types';
import { PL_MALE_FIRSTNAMES, PL_MALE_LASTNAMES } from '../resources/static_db/names/pl_data';
import { BALKAN_MALE_FIRSTNAMES, BALKAN_MALE_LASTNAMES } from '../resources/static_db/names/balkan_data';
import { CZSK_MALE_FIRSTNAMES, CZSK_MALE_LASTNAMES } from '../resources/static_db/names/czsk_data';
import { SSA_MALE_FIRSTNAMES, SSA_MALE_LASTNAMES } from '../resources/static_db/names/ssa_data';
import { IBERIA_MALE_FIRSTNAMES, IBERIA_MALE_LASTNAMES } from '../resources/static_db/names/iberia_data';
import { SCANDINAVIA_MALE_FIRSTNAMES, SCANDINAVIA_MALE_LASTNAMES } from '../resources/static_db/names/scandinavia_data';
import { EXUSSR_MALE_FIRSTNAMES, EXUSSR_MALE_LASTNAMES } from '../resources/static_db/names/exussr_data';
import { ES_MALE_FIRSTNAMES, ES_MALE_LASTNAMES } from '../resources/static_db/names/es_data';
import { EN_MALE_FIRSTNAMES, EN_MALE_LASTNAMES } from '../resources/static_db/names/en_data';
import { DE_MALE_FIRSTNAMES, DE_MALE_LASTNAMES } from '../resources/static_db/names/de_data';
import { IT_MALE_FIRSTNAMES, IT_MALE_LASTNAMES } from '../resources/static_db/names/it_data';
import { FR_MALE_FIRSTNAMES, FR_MALE_LASTNAMES } from '../resources/static_db/names/fr_data';
import { JAPANESE_MALE_FIRSTNAMES, JAPANESE_MALE_SURNAMES } from '../resources/static_db/names/Japanese_data';
import { KOREAN_MALE_FIRSTNAMES, KOREAN_MALE_SURNAMES } from '../resources/static_db/names/korean_data';
import { ARGENTINIAN_MALE_FIRSTNAMES, ARGENTINIAN_MALE_LASTNAMES } from '../resources/static_db/names/argentinian_data';
import { BRAZILIAN_MALE_FIRSTNAMES, BRAZILIAN_MALE_LASTNAMES } from '../resources/static_db/names/brazilian_data';
import { TURKISH_MALE_FIRSTNAMES, TURKISH_MALE_LASTNAMES } from '../resources/static_db/names/turkish_data';
import { ARABIC_MALE_FIRSTNAMES, ARABIC_MALE_LASTNAMES } from '../resources/static_db/names/arabic_data';
import { FINNISH_MALE_FIRSTNAMES, FINNISH_MALE_LASTNAMES } from '../resources/static_db/names/finnish_data';
import { GEORGIAN_MALE_FIRSTNAMES, GEORGIAN_MALE_LASTNAMES } from '../resources/static_db/names/georgian_data';
import { ARMENIAN_MALE_FIRSTNAMES, ARMENIAN_MALE_LASTNAMES } from '../resources/static_db/names/armenian_data';
import { ALBANIAN_MALE_FIRSTNAMES, ALBANIAN_MALE_LASTNAMES } from '../resources/static_db/names/albanian_data';
import { ROMANIAN_MALE_FIRSTNAMES, ROMANIAN_MALE_LASTNAMES } from '../resources/static_db/names/romanian_data';
import { BALTIC_MALE_FIRSTNAMES, BALTIC_MALE_LASTNAMES } from '../resources/static_db/names/baltic_data';
import { BENELUX_MALE_FIRSTNAMES, BENELUX_MALE_LASTNAMES } from '../resources/static_db/names/benelux_data';
import { HUNGARIAN_MALE_FIRSTNAMES, HUNGARIAN_MALE_LASTNAMES } from '../resources/static_db/names/hungarian_data';
import { MALTESE_MALE_FIRSTNAMES, MALTESE_MALE_LASTNAMES } from '../resources/static_db/names/maltese_data';
import { ISRAELI_MALE_FIRSTNAMES, ISRAELI_MALE_LASTNAMES } from '../resources/static_db/names/israeli_data';
import { GREEK_MALE_FIRSTNAMES, GREEK_MALE_LASTNAMES } from '../resources/static_db/names/greek_data';
import { AZERBAIJANI_MALE_FIRSTNAMES, AZERBAIJANI_MALE_LASTNAMES } from '../resources/static_db/names/azerbaijani_data';
import { KAZAKH_MALE_FIRSTNAMES, KAZAKH_MALE_LASTNAMES } from '../resources/static_db/names/kazakh_data';
import { SOUTH_AMERICAN_MALE_FIRSTNAMES, SOUTH_AMERICAN_MALE_LASTNAMES } from '../resources/static_db/names/southamerican_data';
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
              case Region.SPAIN:
        return { firstName: getRandomElement(ES_MALE_FIRSTNAMES), lastName: getRandomElement(ES_MALE_LASTNAMES) };
      case Region.ENGLAND:
        return { firstName: getRandomElement(EN_MALE_FIRSTNAMES), lastName: getRandomElement(EN_MALE_LASTNAMES) };
      case Region.GERMANY:
        return { firstName: getRandomElement(DE_MALE_FIRSTNAMES), lastName: getRandomElement(DE_MALE_LASTNAMES) };
      case Region.ITALY:
        return { firstName: getRandomElement(IT_MALE_FIRSTNAMES), lastName: getRandomElement(IT_MALE_LASTNAMES) };
      case Region.FRANCE:
        return { firstName: getRandomElement(FR_MALE_FIRSTNAMES), lastName: getRandomElement(FR_MALE_LASTNAMES) };
      case Region.JAPAN:
        return { firstName: getRandomElement(JAPANESE_MALE_FIRSTNAMES), lastName: getRandomElement(JAPANESE_MALE_SURNAMES) };
      case Region.KOREA:
        return { firstName: getRandomElement(KOREAN_MALE_FIRSTNAMES), lastName: getRandomElement(KOREAN_MALE_SURNAMES) };
      case Region.ARGENTINA:
        return { firstName: getRandomElement(ARGENTINIAN_MALE_FIRSTNAMES), lastName: getRandomElement(ARGENTINIAN_MALE_LASTNAMES) };
      case Region.BRAZIL:
        return { firstName: getRandomElement(BRAZILIAN_MALE_FIRSTNAMES), lastName: getRandomElement(BRAZILIAN_MALE_LASTNAMES) };
      case Region.TURKEY:
        return { firstName: getRandomElement(TURKISH_MALE_FIRSTNAMES), lastName: getRandomElement(TURKISH_MALE_LASTNAMES) };
      case Region.ARABIA:
        return { firstName: getRandomElement(ARABIC_MALE_FIRSTNAMES), lastName: getRandomElement(ARABIC_MALE_LASTNAMES) };
      case Region.FINLAND:
        return { firstName: getRandomElement(FINNISH_MALE_FIRSTNAMES), lastName: getRandomElement(FINNISH_MALE_LASTNAMES) };
      case Region.GEORGIA:
        return { firstName: getRandomElement(GEORGIAN_MALE_FIRSTNAMES), lastName: getRandomElement(GEORGIAN_MALE_LASTNAMES) };
      case Region.ARMENIA:
        return { firstName: getRandomElement(ARMENIAN_MALE_FIRSTNAMES), lastName: getRandomElement(ARMENIAN_MALE_LASTNAMES) };
      case Region.ALBANIA:
        return { firstName: getRandomElement(ALBANIAN_MALE_FIRSTNAMES), lastName: getRandomElement(ALBANIAN_MALE_LASTNAMES) };
      case Region.ROMANIA:
        return { firstName: getRandomElement(ROMANIAN_MALE_FIRSTNAMES), lastName: getRandomElement(ROMANIAN_MALE_LASTNAMES) };
      case Region.BALTIC:
        return { firstName: getRandomElement(BALTIC_MALE_FIRSTNAMES), lastName: getRandomElement(BALTIC_MALE_LASTNAMES) };
      case Region.BENELUX:
        return { firstName: getRandomElement(BENELUX_MALE_FIRSTNAMES), lastName: getRandomElement(BENELUX_MALE_LASTNAMES) };
      case Region.HUNGARIAN:
        return { firstName: getRandomElement(HUNGARIAN_MALE_FIRSTNAMES), lastName: getRandomElement(HUNGARIAN_MALE_LASTNAMES) };
      case Region.MALTESE:
        return { firstName: getRandomElement(MALTESE_MALE_FIRSTNAMES), lastName: getRandomElement(MALTESE_MALE_LASTNAMES) };
      case Region.ISRAELI:
        return { firstName: getRandomElement(ISRAELI_MALE_FIRSTNAMES), lastName: getRandomElement(ISRAELI_MALE_LASTNAMES) };
      case Region.GREEK:
        return { firstName: getRandomElement(GREEK_MALE_FIRSTNAMES), lastName: getRandomElement(GREEK_MALE_LASTNAMES) };
      case Region.AZERBAIJANI:
        return { firstName: getRandomElement(AZERBAIJANI_MALE_FIRSTNAMES), lastName: getRandomElement(AZERBAIJANI_MALE_LASTNAMES) };
      case Region.KAZAKH:
        return { firstName: getRandomElement(KAZAKH_MALE_FIRSTNAMES), lastName: getRandomElement(KAZAKH_MALE_LASTNAMES) };
      case Region.SOUTH_AMERICAN:
        return { firstName: getRandomElement(SOUTH_AMERICAN_MALE_FIRSTNAMES), lastName: getRandomElement(SOUTH_AMERICAN_MALE_LASTNAMES) };
      default:
      
      

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
      Region.EX_USSR,
      Region.SPAIN,
      Region.ENGLAND,
      Region.GERMANY,
      Region.ITALY,
      Region.FRANCE,
      Region.JAPAN,
      Region.KOREA,
      Region.ARGENTINA,
      Region.BRAZIL,
      Region.TURKEY,
      Region.ARABIA,
      Region.FINLAND,
      Region.GEORGIA,
      Region.ARMENIA,
      Region.ALBANIA,
      Region.ROMANIA,
      Region.BALTIC,
      Region.BENELUX,
      Region.HUNGARIAN,
      Region.MALTESE,
      Region.ISRAELI,
      Region.GREEK,
      Region.AZERBAIJANI,
      Region.KAZAKH,
    ];
    return foreignRegions[Math.floor(Math.random() * foreignRegions.length)];
  }
};