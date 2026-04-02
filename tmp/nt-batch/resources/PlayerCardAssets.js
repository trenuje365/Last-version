// Import kart generycznych (fallback)
import genericWhite from '../Graphic/players/white_black_shirt.png';
import genericBlack from '../Graphic/players/black_shirt.png';
import genericRed from '../Graphic/players/red_shirt.png';
import genericBlue from '../Graphic/players/blue_shirt.png';
import genericYellow from '../Graphic/players/yellow_shirt.png';
import genericGreen from '../Graphic/players/green_shirt.png';
import genericOrange from '../Graphic/players/orange_shirt.png';
// Import kart brandowanych — Arka Gdynia
import arkaBlue from '../Graphic/players/Arka_Gdynia_blue_shirt.png';
import arkaYellow from '../Graphic/players/Arka_Gdynia_yellow_shirt.png';
// Import kart brandowanych — Cracovia
import cracoviaBlack from '../Graphic/players/Cracovia_black_shirt.png';
import cracoviaRedBlack from '../Graphic/players/Cracovia_red_black_shirt.png';
import cracoviaRedWhite from '../Graphic/players/Cracovia_red_white_shirt.png';
// Import kart brandowanych — Jagiellonia
import jagielloniaYellowRed from '../Graphic/players/Jagiellonia_yellow_red_shirt.png';
// Import kart brandowanych — Korona
import koronaYellowRed from '../Graphic/players/Korona_yellow_red_shirt.png';
// Import kart brandowanych — Lechia Gdańsk
import lechiaGreen from '../Graphic/players/lechia_gdansk_green_shirt.png';
import lechiaGreenWhite from '../Graphic/players/lechia_gdansk_green_white_shirt.png';
// Import kart brandowanych — Lech Poznań
import lechBlue from '../Graphic/players/lech_poznan_blue.png';
import lechWhite from '../Graphic/players/lech_poznan_white.png';
// Import kart brandowanych — Legia Warszawa
import legiaWhite from '../Graphic/players/legia_white.png';
import legiaGreen from '../Graphic/players/legia_green.png';
import legiaRed from '../Graphic/players/legia_red.png';
import legiaGrey from '../Graphic/players/legia_grey.png';
// Import kart brandowanych — Pogoń Szczecin
import pogonBlueRed from '../Graphic/players/pogon_szcz_bluered.png';
import pogonWhite from '../Graphic/players/pogon_szcz_white.png';
// Import kart brandowanych — Polonia Warszawa
import poloniaBlack from '../Graphic/players/polonia_wawa_black.png';
import poloniaRed from '../Graphic/players/polonia_wawa_red.png';
import poloniaYellow from '../Graphic/players/polonia_wawa_yellow.png';
// Import kart brandowanych — Termalica Nieciecza
import termalicaBlue from '../Graphic/players/termalica_blue_shirt.png';
import termalicaOrange from '../Graphic/players/termalica_orange_shirt.png';
// Import kart brandowanych — Widzew Łódź
import widzewRed from '../Graphic/players/widzew_red.png';
import widzewWhite from '../Graphic/players/Widzew_white.png';
import widzewYellow from '../Graphic/players/widzew_yellow.png';
// Import kart brandowanych — Zagłębie Lubin
import zaglebieBlack from '../Graphic/players/zaglebie_lubin_black.png';
import zaglebieOrange from '../Graphic/players/zaglebie_lubin_orange.png';
import zaglebieWhite from '../Graphic/players/zaglebie_lubin_white.png';
// ─────────────────────────────────────────────────
// Rejestr brandowanych kart per klub
// ─────────────────────────────────────────────────
const BRANDED_CLUB_CARDS = [
    {
        clubId: 'PL_ARKA_GDYNIA',
        kits: [
            { hex: '#FFFF00', image: arkaYellow },
            { hex: '#0000FF', image: arkaBlue },
        ]
    },
    {
        clubId: 'PL_CRACOVIA',
        kits: [
            { hex: '#FFFFFF', image: cracoviaRedWhite },
            { hex: '#FF0000', image: cracoviaRedBlack },
            { hex: '#000000', image: cracoviaBlack },
        ]
    },
    {
        clubId: 'PL_JAGIELLONIA_BIALYSTOK',
        kits: [
            { hex: '#FFFF00', image: jagielloniaYellowRed },
        ]
    },
    {
        clubId: 'PL_KORONA_KIELCE',
        kits: [
            { hex: '#FFFF00', image: koronaYellowRed },
        ]
    },
    {
        clubId: 'PL_LECHIA_GDANSK',
        kits: [
            { hex: '#008000', image: lechiaGreen },
            { hex: '#FFFFFF', image: lechiaGreenWhite },
        ]
    },
    {
        clubId: 'PL_LECH_POZNAN',
        kits: [
            { hex: '#0000FF', image: lechBlue },
            { hex: '#FFFFFF', image: lechWhite },
        ]
    },
    {
        clubId: 'PL_LEGIA_WARSZAWA',
        kits: [
            { hex: '#FFFFFF', image: legiaWhite },
            { hex: '#228B22', image: legiaGreen },
            { hex: '#8B0000', image: legiaRed },
            { hex: '#808080', image: legiaGrey },
        ]
    },
    {
        clubId: 'PL_POGON_SZCZECIN',
        kits: [
            { hex: '#000080', image: pogonBlueRed },
            { hex: '#FFFFFF', image: pogonWhite },
        ]
    },
    {
        clubId: 'PL_POLONIA_WARSZAWA',
        kits: [
            { hex: '#000000', image: poloniaBlack },
            { hex: '#FF0000', image: poloniaRed },
            { hex: '#FFFF00', image: poloniaYellow },
        ]
    },
    {
        clubId: 'PL_TERMALICA_NIECIECZA',
        kits: [
            { hex: '#FF5F1F', image: termalicaOrange },
            { hex: '#0000FF', image: termalicaBlue },
        ]
    },
    {
        clubId: 'PL_WIDZEW_LODZ',
        kits: [
            { hex: '#FF0000', image: widzewRed },
            { hex: '#FFFFFF', image: widzewWhite },
            { hex: '#FFFF00', image: widzewYellow },
        ]
    },
    {
        clubId: 'PL_ZAGLEBIE_LUBIN',
        kits: [
            { hex: '#FF5F1F', image: zaglebieOrange },
            { hex: '#FFFFFF', image: zaglebieWhite },
            { hex: '#000000', image: zaglebieBlack },
        ]
    },
];
// ─────────────────────────────────────────────────
// Generyczny fallback (dystans koloru)
// ─────────────────────────────────────────────────
const GENERIC_KITS = [
    { hex: '#FFFFFF', image: genericWhite },
    { hex: '#000000', image: genericBlack },
    { hex: '#FF0000', image: genericRed },
    { hex: '#0000FF', image: genericBlue },
    { hex: '#FFFF00', image: genericYellow },
    { hex: '#008000', image: genericGreen },
    { hex: '#FF5F1F', image: genericOrange },
];
// ─────────────────────────────────────────────────
// Helper — dystans koloru (skopiowany z KitSelectionService)
// ─────────────────────────────────────────────────
function colorDistance(hex1, hex2) {
    const r1 = parseInt(hex1.substring(1, 3), 16);
    const g1 = parseInt(hex1.substring(3, 5), 16);
    const b1 = parseInt(hex1.substring(5, 7), 16);
    const r2 = parseInt(hex2.substring(1, 3), 16);
    const g2 = parseInt(hex2.substring(3, 5), 16);
    const b2 = parseInt(hex2.substring(5, 7), 16);
    const rmean = (r1 + r2) / 2;
    const r = r1 - r2, g = g1 - g2, b = b1 - b2;
    return Math.sqrt((((512 + rmean) * r * r) >> 8) + 4 * g * g + (((767 - rmean) * b * b) >> 8));
}
function closestImage(kits, targetHex) {
    let best = kits[0];
    let minDist = Infinity;
    for (const kit of kits) {
        const dist = colorDistance(kit.hex, targetHex);
        if (dist < minDist) {
            minDist = dist;
            best = kit;
        }
    }
    return best.image;
}
// ─────────────────────────────────────────────────
// Główny eksport
// ─────────────────────────────────────────────────
/**
 * Zwraca URL obrazka karty zawodnika dla danego klubu i koloru koszulki.
 * Jeśli klub ma brandowane karty — wybiera najbliższy kolor spośród jego wariantów.
 * W przeciwnym razie używa generycznej koszulki.
 */
export function getPlayerCardImage(clubId, kitHex) {
    const clubAssets = BRANDED_CLUB_CARDS.find(c => c.clubId === clubId);
    const kits = clubAssets ? clubAssets.kits : GENERIC_KITS;
    return closestImage(kits, kitHex);
}
