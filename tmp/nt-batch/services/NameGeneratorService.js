"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NameGeneratorService = void 0;
const types_1 = require("../types");
const pl_data_1 = require("../resources/static_db/names/pl_data");
const balkan_data_1 = require("../resources/static_db/names/balkan_data");
const czsk_data_1 = require("../resources/static_db/names/czsk_data");
const ssa_data_1 = require("../resources/static_db/names/ssa_data");
const iberia_data_1 = require("../resources/static_db/names/iberia_data");
const scandinavia_data_1 = require("../resources/static_db/names/scandinavia_data");
const swedish_data_1 = require("../resources/static_db/names/swedish_data");
const exussr_data_1 = require("../resources/static_db/names/exussr_data");
const es_data_1 = require("../resources/static_db/names/es_data");
const en_data_1 = require("../resources/static_db/names/en_data");
const de_data_1 = require("../resources/static_db/names/de_data");
const it_data_1 = require("../resources/static_db/names/it_data");
const fr_data_1 = require("../resources/static_db/names/fr_data");
const Japanese_data_1 = require("../resources/static_db/names/Japanese_data");
const korean_data_1 = require("../resources/static_db/names/korean_data");
const argentinian_data_1 = require("../resources/static_db/names/argentinian_data");
const brazilian_data_1 = require("../resources/static_db/names/brazilian_data");
const turkish_data_1 = require("../resources/static_db/names/turkish_data");
const arabic_data_1 = require("../resources/static_db/names/arabic_data");
const finnish_data_1 = require("../resources/static_db/names/finnish_data");
const georgian_data_1 = require("../resources/static_db/names/georgian_data");
const armenian_data_1 = require("../resources/static_db/names/armenian_data");
const albanian_data_1 = require("../resources/static_db/names/albanian_data");
const romanian_data_1 = require("../resources/static_db/names/romanian_data");
const baltic_data_1 = require("../resources/static_db/names/baltic_data");
const benelux_data_1 = require("../resources/static_db/names/benelux_data");
const hungarian_data_1 = require("../resources/static_db/names/hungarian_data");
const maltese_data_1 = require("../resources/static_db/names/maltese_data");
const israeli_data_1 = require("../resources/static_db/names/israeli_data");
const greek_data_1 = require("../resources/static_db/names/greek_data");
const azerbaijani_data_1 = require("../resources/static_db/names/azerbaijani_data");
const kazakh_data_1 = require("../resources/static_db/names/kazakh_data");
const southamerican_data_1 = require("../resources/static_db/names/southamerican_data");
const mexican_data_1 = require("../resources/static_db/names/mexican_data");
const getRandomElement = (arr) => {
    return arr[Math.floor(Math.random() * arr.length)];
};
exports.NameGeneratorService = {
    getRandomName(region) {
        switch (region) {
            case types_1.Region.POLAND:
                return {
                    firstName: getRandomElement(pl_data_1.PL_MALE_FIRSTNAMES),
                    lastName: getRandomElement(pl_data_1.PL_MALE_LASTNAMES)
                };
            case types_1.Region.BALKANS:
                return {
                    firstName: getRandomElement(balkan_data_1.BALKAN_MALE_FIRSTNAMES),
                    lastName: getRandomElement(balkan_data_1.BALKAN_MALE_LASTNAMES)
                };
            case types_1.Region.CZ_SK:
                return {
                    firstName: getRandomElement(czsk_data_1.CZSK_MALE_FIRSTNAMES),
                    lastName: getRandomElement(czsk_data_1.CZSK_MALE_LASTNAMES)
                };
            case types_1.Region.SSA:
                return {
                    firstName: getRandomElement(ssa_data_1.SSA_MALE_FIRSTNAMES),
                    lastName: getRandomElement(ssa_data_1.SSA_MALE_LASTNAMES)
                };
            case types_1.Region.IBERIA:
                return {
                    firstName: getRandomElement(iberia_data_1.IBERIA_MALE_FIRSTNAMES),
                    lastName: getRandomElement(iberia_data_1.IBERIA_MALE_LASTNAMES)
                };
            case types_1.Region.MEXICO:
                return {
                    firstName: getRandomElement(mexican_data_1.MEXICAN_MALE_FIRSTNAMES),
                    lastName: getRandomElement(mexican_data_1.MEXICAN_MALE_LASTNAMES)
                };
            case types_1.Region.SWEDEN:
                return {
                    firstName: getRandomElement(swedish_data_1.SWEDISH_MALE_FIRSTNAMES),
                    lastName: getRandomElement(swedish_data_1.SWEDISH_MALE_LASTNAMES)
                };
            case types_1.Region.SCANDINAVIA:
                return {
                    firstName: getRandomElement(scandinavia_data_1.SCANDINAVIA_MALE_FIRSTNAMES),
                    lastName: getRandomElement(scandinavia_data_1.SCANDINAVIA_MALE_LASTNAMES)
                };
            case types_1.Region.EX_USSR:
                return {
                    firstName: getRandomElement(exussr_data_1.EXUSSR_MALE_FIRSTNAMES),
                    lastName: getRandomElement(exussr_data_1.EXUSSR_MALE_LASTNAMES)
                };
            case types_1.Region.SPAIN:
                return { firstName: getRandomElement(es_data_1.ES_MALE_FIRSTNAMES), lastName: getRandomElement(es_data_1.ES_MALE_LASTNAMES) };
            case types_1.Region.ENGLAND:
                return { firstName: getRandomElement(en_data_1.EN_MALE_FIRSTNAMES), lastName: getRandomElement(en_data_1.EN_MALE_LASTNAMES) };
            case types_1.Region.GERMANY:
                return { firstName: getRandomElement(de_data_1.DE_MALE_FIRSTNAMES), lastName: getRandomElement(de_data_1.DE_MALE_LASTNAMES) };
            case types_1.Region.ITALY:
                return { firstName: getRandomElement(it_data_1.IT_MALE_FIRSTNAMES), lastName: getRandomElement(it_data_1.IT_MALE_LASTNAMES) };
            case types_1.Region.FRANCE:
                return { firstName: getRandomElement(fr_data_1.FR_MALE_FIRSTNAMES), lastName: getRandomElement(fr_data_1.FR_MALE_LASTNAMES) };
            case types_1.Region.JAPAN:
                return { firstName: getRandomElement(Japanese_data_1.JAPANESE_MALE_FIRSTNAMES), lastName: getRandomElement(Japanese_data_1.JAPANESE_MALE_SURNAMES) };
            case types_1.Region.KOREA:
                return { firstName: getRandomElement(korean_data_1.KOREAN_MALE_FIRSTNAMES), lastName: getRandomElement(korean_data_1.KOREAN_MALE_SURNAMES) };
            case types_1.Region.ARGENTINA:
                return { firstName: getRandomElement(argentinian_data_1.ARGENTINIAN_MALE_FIRSTNAMES), lastName: getRandomElement(argentinian_data_1.ARGENTINIAN_MALE_LASTNAMES) };
            case types_1.Region.BRAZIL:
                return { firstName: getRandomElement(brazilian_data_1.BRAZILIAN_MALE_FIRSTNAMES), lastName: getRandomElement(brazilian_data_1.BRAZILIAN_MALE_LASTNAMES) };
            case types_1.Region.TURKEY:
                return { firstName: getRandomElement(turkish_data_1.TURKISH_MALE_FIRSTNAMES), lastName: getRandomElement(turkish_data_1.TURKISH_MALE_LASTNAMES) };
            case types_1.Region.ARABIA:
                return { firstName: getRandomElement(arabic_data_1.ARABIC_MALE_FIRSTNAMES), lastName: getRandomElement(arabic_data_1.ARABIC_MALE_LASTNAMES) };
            case types_1.Region.FINLAND:
                return { firstName: getRandomElement(finnish_data_1.FINNISH_MALE_FIRSTNAMES), lastName: getRandomElement(finnish_data_1.FINNISH_MALE_LASTNAMES) };
            case types_1.Region.GEORGIA:
                return { firstName: getRandomElement(georgian_data_1.GEORGIAN_MALE_FIRSTNAMES), lastName: getRandomElement(georgian_data_1.GEORGIAN_MALE_LASTNAMES) };
            case types_1.Region.ARMENIA:
                return { firstName: getRandomElement(armenian_data_1.ARMENIAN_MALE_FIRSTNAMES), lastName: getRandomElement(armenian_data_1.ARMENIAN_MALE_LASTNAMES) };
            case types_1.Region.ALBANIA:
                return { firstName: getRandomElement(albanian_data_1.ALBANIAN_MALE_FIRSTNAMES), lastName: getRandomElement(albanian_data_1.ALBANIAN_MALE_LASTNAMES) };
            case types_1.Region.ROMANIA:
                return { firstName: getRandomElement(romanian_data_1.ROMANIAN_MALE_FIRSTNAMES), lastName: getRandomElement(romanian_data_1.ROMANIAN_MALE_LASTNAMES) };
            case types_1.Region.BALTIC:
                return { firstName: getRandomElement(baltic_data_1.BALTIC_MALE_FIRSTNAMES), lastName: getRandomElement(baltic_data_1.BALTIC_MALE_LASTNAMES) };
            case types_1.Region.BENELUX:
                return { firstName: getRandomElement(benelux_data_1.BENELUX_MALE_FIRSTNAMES), lastName: getRandomElement(benelux_data_1.BENELUX_MALE_LASTNAMES) };
            case types_1.Region.HUNGARIAN:
                return { firstName: getRandomElement(hungarian_data_1.HUNGARIAN_MALE_FIRSTNAMES), lastName: getRandomElement(hungarian_data_1.HUNGARIAN_MALE_LASTNAMES) };
            case types_1.Region.MALTESE:
                return { firstName: getRandomElement(maltese_data_1.MALTESE_MALE_FIRSTNAMES), lastName: getRandomElement(maltese_data_1.MALTESE_MALE_LASTNAMES) };
            case types_1.Region.ISRAELI:
                return { firstName: getRandomElement(israeli_data_1.ISRAELI_MALE_FIRSTNAMES), lastName: getRandomElement(israeli_data_1.ISRAELI_MALE_LASTNAMES) };
            case types_1.Region.GREEK:
                return { firstName: getRandomElement(greek_data_1.GREEK_MALE_FIRSTNAMES), lastName: getRandomElement(greek_data_1.GREEK_MALE_LASTNAMES) };
            case types_1.Region.AZERBAIJANI:
                return { firstName: getRandomElement(azerbaijani_data_1.AZERBAIJANI_MALE_FIRSTNAMES), lastName: getRandomElement(azerbaijani_data_1.AZERBAIJANI_MALE_LASTNAMES) };
            case types_1.Region.KAZAKH:
                return { firstName: getRandomElement(kazakh_data_1.KAZAKH_MALE_FIRSTNAMES), lastName: getRandomElement(kazakh_data_1.KAZAKH_MALE_LASTNAMES) };
            case types_1.Region.SOUTH_AMERICAN:
                return { firstName: getRandomElement(southamerican_data_1.SOUTH_AMERICAN_MALE_FIRSTNAMES), lastName: getRandomElement(southamerican_data_1.SOUTH_AMERICAN_MALE_LASTNAMES) };
            default:
                return {
                    firstName: getRandomElement(pl_data_1.PL_MALE_FIRSTNAMES),
                    lastName: getRandomElement(pl_data_1.PL_MALE_LASTNAMES)
                };
        }
    },
    getRandomForeignRegion() {
        const foreignRegions = [
            types_1.Region.BALKANS,
            types_1.Region.CZ_SK,
            types_1.Region.SSA,
            types_1.Region.IBERIA,
            types_1.Region.SCANDINAVIA,
            types_1.Region.EX_USSR,
            types_1.Region.SPAIN,
            types_1.Region.ENGLAND,
            types_1.Region.GERMANY,
            types_1.Region.ITALY,
            types_1.Region.FRANCE,
            types_1.Region.JAPAN,
            types_1.Region.KOREA,
            types_1.Region.ARGENTINA,
            types_1.Region.BRAZIL,
            types_1.Region.TURKEY,
            types_1.Region.ARABIA,
            types_1.Region.FINLAND,
            types_1.Region.GEORGIA,
            types_1.Region.ARMENIA,
            types_1.Region.ALBANIA,
            types_1.Region.ROMANIA,
            types_1.Region.BALTIC,
            types_1.Region.BENELUX,
            types_1.Region.HUNGARIAN,
            types_1.Region.MALTESE,
            types_1.Region.ISRAELI,
            types_1.Region.GREEK,
            types_1.Region.AZERBAIJANI,
            types_1.Region.KAZAKH,
        ];
        return foreignRegions[Math.floor(Math.random() * foreignRegions.length)];
    }
};
