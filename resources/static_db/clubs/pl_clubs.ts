
export interface RawClubData {
  name: string;
  tier: number;
  colors: string[];
  stadium: string;
  capacity: number;
  reputation: number;
  logoFile?: string;
}

// Helper for ID generation (simple slug)
export const generateClubId = (name: string): string => {
  const slug = name
    .replace(/ł/g, 'l').replace(/Ł/g, 'L') // Ł/ł nie dekomponuje się w NFD — musi być zastąpione jawnie
    .normalize('NFD').replace(/[\u0300-\u036f]/g, "") // Remove accents
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '_') // Replace non-alphanum with _
    .replace(/_+/g, '_') // Remove duplicate _
    .replace(/^_|_$/g, ''); // Trim _
  return `PL_${slug}`;
};

export const RAW_PL_CLUBS: RawClubData[] = [
  // --- TIER 1 (Ekstraklasa) - 18 Teams ---004d00
  { name: "Legia Warszawa", tier: 1, colors: ['#007a25', '#ffffff', '#a80e0e'], stadium: "Stadion Wojska Polskiego", capacity: 31103, reputation: 10, logoFile: 'legia-warsaw-2019-logo.png' },
  { name: "Lech Poznań", tier: 1, colors: ['#0000FF', '#FFFFFF', '#FFFF00'], stadium: "Enea Stadion", capacity: 41609, reputation: 10, logoFile: 'lech-poznan-2022-logo.png' },
  { name: "Jagiellonia Białystok", tier: 1, colors: ['#FFFF00', '#FF0000', '#FFFFFF'], stadium: "Stadion Miejski w Białymstoku", capacity: 22372, reputation: 8, logoFile: 'jagiellonia-bialystok-2024-logo.png' },
  { name: "Raków Częstochowa", tier: 1, colors: ['#0000FF', '#FF0000', '#FFFFFF'], stadium: "Stadion Miejski w Częstochowie", capacity: 5500, reputation: 8, logoFile: 'rakow-czestochowa-2014-logo.png' },
  { name: "Pogoń Szczecin", tier: 1, colors: ['#000080', '#800000', '#FFFFFF'], stadium: "Stadion Miejski im. Floriana Krygiera", capacity: 21163, reputation: 7, logoFile: 'pogon_szczecin.png' },
  { name: "Górnik Zabrze", tier: 1, colors: ['#0519ca', '#ffffff', '#FF0000'], stadium: "Stadion im. Ernesta Pohla", capacity: 24563, reputation: 8, logoFile: 'Gornik_zabrze.png' },
  { name: "Cracovia", tier: 1, colors: ['#ff0000', '#ffffff', '#000000'], stadium: "Stadion im. Józefa Piłsudskiego", capacity: 15016, reputation: 8, logoFile: 'cracovia-2024-logo.png' },
  { name: "Zagłębie Lubin", tier: 1, colors: ['#FF5F1F', '#FFFFFF', '#008000'], stadium: "Dialog Arena", capacity: 16068, reputation: 7, logoFile: 'zaglebie-lubin-2022-logo.png' },
  { name: "Widzew Łódź", tier: 1, colors: ['#FF0000', '#FFFFFF', '#FF0000'], stadium: "Stadion Widzewa", capacity: 18018, reputation: 10, logoFile: 'widzew-lodz.png' },
  { name: "Lechia Gdańsk", tier: 1, colors: ['#008000', '#FFFFFF', '#008000'], stadium: "Polsat Plus Arena Gdańsk", capacity: 41620, reputation: 7, logoFile: 'lechia_gdansk.png' },
  { name: "Piast Gliwice", tier: 1, colors: ['#0000FF', '#FF0000', '#FFFFFF'], stadium: "Stadion Miejski w Gliwicach", capacity: 9913, reputation: 6, logoFile: 'piast-gliwice-1997-logo.png' },
  { name: "Arka Gdynia", tier: 1, colors: ['#FFFF00', '#0000FF', '#FFFFFF'], stadium: "Stadion Miejski w Gdyni", capacity: 15139, reputation: 6, logoFile: 'arka-gdynia-2009-logo.png' },
  { name: "Korona Kielce", tier: 1, colors: ['#FFFF00', '#FF0000', '#FFFFFF'], stadium: "Suzuki Arena", capacity: 15500, reputation: 7, logoFile: 'korona-kielce-2024-logo.png' },
  { name: "Radomiak Radom", tier: 1, colors: ['#008000', '#FFFFFF', '#FF0000'], stadium: "Stadion Miejski w Radomiu", capacity: 15000, reputation: 6, logoFile: 'RKS_Radomiak_Radom.png' },
  { name: "Motor Lublin", tier: 1, colors: ['#FFFF00', '#FFFFFF', '#0000FF'], stadium: "Arena Lublin", capacity: 15500, reputation: 6, logoFile: 'motor-lublin-2023-logo.png' },
  { name: "GKS Katowice", tier: 1, colors: ['#FFFF00', '#0a6102', '#000000'], stadium: "Stadion GKS Katowice", capacity: 6710, reputation: 6, logoFile: 'gks-katowice-logo.png' },
  { name: "Termalica Nieciecza", tier: 1, colors: ['#FF5F1F', '#FFFF00', '#0000FF'], stadium: "Stadion Bruk-Bet", capacity: 4595, reputation: 5, logoFile: 'bruk-bet-termalica-nieciecza-2021-logo.png' },
  { name: "Wisła Płock", tier: 1, colors: ['#0000FF', '#FFFFFF', '#FF0000'], stadium: "Stadion im. Kazimierza Górskiego", capacity: 12800, reputation: 6, logoFile: 'wisla-plock-2006-logo.png' },

  // --- TIER 2 (1. Liga) - 18 Teams ---
  { name: "Wisła Kraków", tier: 2, colors: ['#fa0101', '#0026ff', '#ffffff'], stadium: "Stadion im. Henryka Reymana", capacity: 33326, reputation: 10, logoFile: 'wisla-krakow-logo.png' },
  { name: "Pogoń Grodzisk Mazowiecki", tier: 2, colors: ['#FF0000', '#FFFFFF', '#0000FF'], stadium: "Stadion Miejski w Grodzisku Mazowieckim", capacity: 1500, reputation: 4, logoFile: 'pogon-grodzisk-mazowiecki.png' },
  { name: "Polonia Bytom", tier: 2, colors: ['#0000FF', '#FF0000', '#FFFFFF'], stadium: "Stadion im. Edwardw Szymkowiaka", capacity: 5500, reputation: 7, logoFile: 'Polonia_Bytom.png' },
  { name: "Chrobry Głogów", tier: 2, colors: ['#FF5F1F', '#000000', '#FFFFFF'], stadium: "Stadion Miejski w Głogowie", capacity: 3000, reputation: 5, logoFile: 'chrobry_glogow.png' },
  { name: "Stal Rzeszów", tier: 2, colors: ['#FFFFFF', '#0000FF', '#FF0000'], stadium: "Stadion Miejski w Rzeszowie", capacity: 11500, reputation: 6, logoFile: 'stal-rzeszow-2025-logo.png' },
  { name: "Śląsk Wrocław", tier: 2, colors: ['#008000', '#FFFFFF', '#FF0000'], stadium: "Tarczyński Arena", capacity: 42771, reputation: 10, logoFile: 'Slask_Wroclaw.png' },
  { name: "Polonia Warszawa", tier: 2, colors: ['#000000', '#FFFFFF', '#dac511d0'], stadium: "Stadion Im. Gen. Kazimierza Sosnowskiego", capacity: 7150, reputation: 8, logoFile: 'Polonia_warszawa.png' },
  { name: "Wieczysta Kraków", tier: 2, colors: ['#FFFF00', '#FF0000', '#000000'], stadium: "Stadion Prądniczanki", capacity: 2000, reputation: 5, logoFile: 'wieczysta-krakow-logo.png' },
  { name: "Ruch Chorzów", tier: 2, colors: ['#0000FF', '#FFFFFF', '#FF0000'], stadium: "Stadion Miejski w Chorzowie", capacity: 9300, reputation: 9, logoFile: 'ruch-chorzow-2021-logo.png' },
  { name: "Miedź Legnica", tier: 2, colors: ['#008000', '#FF0000', '#0000FF'], stadium: "Stadion Orła Białego", capacity: 6194, reputation: 8, logoFile: 'miedz-legnica-2022-logo.png' },
  { name: "ŁKS Łódź", tier: 2, colors: ['#FFFFFF', '#FF0000', '#FFFFFF'], stadium: "Stadion Króla", capacity: 18029, reputation: 9, logoFile: 'lks_lodz.png' },
  { name: "Pogoń Siedlce", tier: 2, colors: ['#0000FF', '#FFFFFF', '#FF0000'], stadium: "Stadion ROSRRiT", capacity: 2900, reputation: 4, logoFile: 'pogon_siedlce.png' },
  { name: "Odra Opole", tier: 2, colors: ['#0000FF', '#FF0000', '#FFFFFF'], stadium: "Stadion Odry", capacity: 4800, reputation: 6, logoFile: 'odra-opole.png' },
  { name: "Puszcza Niepołomice", tier: 2, colors: ['#FFFFFF', '#0000FF', '#008000'], stadium: "Stadion w Niepołomicach", capacity: 2118, reputation: 6, logoFile: 'puszcza-niepolomice-2013-logo.png' },
  { name: "Znicz Pruszków", tier: 2, colors: ['#FFFF00', '#FF0000', '#FFFFFF'], stadium: "Stadion MZOS", capacity: 2100, reputation: 4, logoFile: 'znicz-pruszkow.png' },
  { name: "Stal Mielec", tier: 2, colors: ['#0817ee', '#e2e611', '#ffffff'], stadium: "Stadion MOSiR w Mielcu", capacity: 6864, reputation: 7, logoFile: 'stal-mielec.png' },
  { name: "GKS Tychy", tier: 2, colors: ['#008000', '#000000', '#FF0000'], stadium: "Stadion Miejski w Tychach", capacity: 15300, reputation: 6, logoFile: 'gks_tychy.png' },
  { name: "Górnik Łęczna", tier: 2, colors: ['#008000', '#000000', '#FFFFFF'], stadium: "Stadion Górnika", capacity: 7200, reputation: 6, logoFile: 'gornik_leczna.png' },

  // --- TIER 3 (2. Liga) - 18 Teams ---
  { name: "Zagłębie Sosnowiec", tier: 3, colors: ['#008000', '#FFFFFF', '#FF0000'], stadium: "ArcelorMittal Park", capacity: 11600, reputation: 6, logoFile: 'Zaglebie_Sosnowiec.png' },
  { name: "Podbeskidzie Bielsko-Biała", tier: 3, colors: ['#FF0000', '#FFFFFF', '#0000FF'], stadium: "Stadion Miejski w Bielsku-Białej", capacity: 15100, reputation: 4, logoFile: 'Podbeskidzie_bielsko_biala.png' },
  { name: "Warta Poznań", tier: 3, colors: ['#008000', '#FFFFFF', '#000000'], stadium: "Stadion Miejski w Pozaniu", capacity: 4600, reputation: 4, logoFile: 'warta-poznan.png' },
  { name: "Zawisza Bydgoszcz", tier: 3, colors: ['#0000FF', '#000000', '#FFFFFF'], stadium: "Stadion im. Zdzisława Krzyszkowiaka", capacity: 20247, reputation: 7, logoFile: 'zawisza-bydgoszcz.png' },
  { name: "Stal Stalowa Wola", tier: 3, colors: ['#008000', '#000000', '#FFFFFF'], stadium: "Podkarpackie Centrum Piłki Nożnej", capacity: 3800, reputation: 3, logoFile: 'stal-stalowa-wola-2024-logo.png' },
  { name: "Resovia", tier: 3, colors: ['#FFFFFF', '#FF0000', '#0000FF'], stadium: "Stadion Miejski w Rzeszowie", capacity: 3500, reputation: 3, logoFile: 'Resovia.png' },
  { name: "Hutnik Kraków", tier: 3, colors: ['#5EB6E4', '#FFFFFF', '#FF0000'], stadium: "Stadion Suche Stawy", capacity: 6500, reputation: 3, logoFile: 'Hutnik_krakow.png' },
  { name: "Olimpia Grudziądz", tier: 3, colors: ['#FFFFFF', '#FF0000', '#008000'], stadium: "Stadion Miejski w Grudziądzu", capacity: 5000, reputation: 3, logoFile: 'olimpia_grudziadz.png' },
  { name: "Sandecja Nowy Sącz", tier: 3, colors: ['#FFFFFF', '#000000', '#0000FF'], stadium: "Stadion Miejski w Nowym Sączu", capacity: 4500, reputation: 3, logoFile: 'Sandecja_Nowy_sacz.png' },
  { name: "Chojniczanka Chojnice", tier: 3, colors: ['#FFFF00', '#FFFFFF', '#FF0000'], stadium: "Stadion Miejski w Chojnicach", capacity: 3500, reputation: 3, logoFile: 'Chojniczanka_chojnice.png' },
  { name: "Elana Toruń", tier: 3, colors: ['#FFFF00', '#0000FF', '#FFFFFF'], stadium: "Stadion Miejski w Toruniu", capacity: 4200, reputation: 3, logoFile: 'Elana_Torun.png' },
  { name: "KKS 1925 Kalisz", tier: 3, colors: ['#FFFFFF', '#008000', '#0000FF'], stadium: "Stadion Miejski w Kaliszu", capacity: 8000, reputation: 3, logoFile: 'kks-1925-kalisz.png' },
  { name: "GKS Jastrzębie", tier: 3, colors: ['#008000', '#000000', '#FFFF00'], stadium: "Stadion Miejski w Jastrzębiu-Zdroju", capacity: 5600, reputation: 3, logoFile: 'GKS_Jastrzębie.png' },
  { name: "Unia Skierniewice", tier: 3, colors: ['#FFFFFF', '#0000FF', '#FFFF00'], stadium: "Stadion Miejski w Skierniewicach", capacity: 2500, reputation: 2, logoFile: 'Unia_Skierniewice.png' },
  { name: "Podhale Nowy Targ", tier: 3, colors: ['#FF0000', '#0000FF', '#FFFF00'], stadium: "Stadion Miejski w Nowym Targu", capacity: 3000, reputation: 2, logoFile: 'Podhale_Nowy_Targ.png' },
  { name: "Świt Szczecin", tier: 3, colors: ['#0000FF', '#FFFFFF', '#FF0000'], stadium: "Stadion Miejski w Szczecinie", capacity: 2000, reputation: 2, logoFile: 'swit_szczecin.png' },
  { name: "Sokół Kleczew", tier: 3, colors: ['#FFFFFF', '#0000FF', '#FF0000'], stadium: "Stadion Miejski w Kleczewie", capacity: 1000, reputation: 2, logoFile: 'sokol-kleczew-logo.png' },
  { name: "Rekord Bielsko-Biała", tier: 3, colors: ['#FFFFFF', '#008000', '#FFFF00'], stadium: "Stadion Miejski", capacity: 800, reputation: 2, logoFile: 'Rekord_Bielsko-Biała.png' },

  // --- TIER 4 (3. Liga i niższe) ---
  { name: "GKS Bełchatów", tier: 4, colors: ['#06830c', '#ffffff', '#000000'], stadium: "GIEKSA Arena", capacity: 5264, reputation: 5, logoFile: 'gksbelchatow.png' },
  { name: "Wigry Suwałki", tier: 4, colors: ['#FFFFFF', '#0000FF', '#FF0000'], stadium: "Stadion Miejski w Suwałkach", capacity: 3060, reputation: 3 },
  { name: "Olimpia Elbląg", tier: 4, colors: ['#FFFF00', '#FFFFFF', '#0000FF'], stadium: "Stadion Miejski w Elblągu", capacity: 3000, reputation: 3 },
  { name: "Avia Świdnik", tier: 4, colors: ['#FFFF00', '#0000FF', '#FFFFFF'], stadium: "Stadion Miejski w Świdniku", capacity: 2800, reputation: 2 },
  { name: "KSZO Ostrowiec", tier: 4, colors: ['#FF5F1F', '#000000', '#FFFFFF'], stadium: "Stadion KSZO", capacity: 7430, reputation: 5, logoFile: 'kszo-ostrowiec-swietokrzyski.png' },
  { name: "Siarka Tarnobrzeg", tier: 4, colors: ['#008000', '#000000', '#FFFF00'], stadium: "Stadion Miejski w Tarnobrzegu", capacity: 3770, reputation: 2, logoFile: 'siarka-tarnobrzeg-logo.png' },
  { name: "Wisłoka Dębica", tier: 4, colors: ['#FFFFFF', '#008000', '#FF0000'], stadium: "Stadion Wisłoki w Dębicy", capacity: 2840, reputation: 2 },
  { name: "Lechia Zielona Góra", tier: 4, colors: ['#FFFFFF', '#008000', '#FFFF00'], stadium: "Stadion MOSiR w Zielonej Górze", capacity: 5000, reputation: 2 },
  { name: "MKS Flota Świnoujście", tier: 4, colors: ['#FFFFFF', '#0000FF', '#FF0000'], stadium: "Stadion Miejski w Świnoujściu", capacity: 3070, reputation: 2 },
  { name: "Świt Nowy Dwór Mazowiecki", tier: 4, colors: ['#FFFFFF', '#008000', '#000000'], stadium: "Stadion Miejski w Nowym Dworze Mazowieckim", capacity: 3000, reputation: 2 },
  { name: "Lechia Tomaszów Mazowiecki", tier: 4, colors: ['#008000', '#FF0000', '#FFFFFF'], stadium: "Stadion Miejski w Tomaszowie Mazowieckim", capacity: 2500, reputation: 2 },
  { name: "Górnik Polkowice", tier: 4, colors: ['#008000', '#000000', '#FFFFFF'], stadium: "Stadion Miejski w Polkowicach", capacity: 2500, reputation: 2 },
  { name: "MKS Kluczbork", tier: 4, colors: ['#FFFFFF', '#0000FF', '#FF0000'], stadium: "Stadion Miejski w Kluczborku", capacity: 2500, reputation: 2 },
  { name: "Chełmianka Chełm", tier: 4, colors: ['#FFFFFF', '#008000', '#FF0000'], stadium: "Stadion Miejski w Chełmie", capacity: 3000, reputation: 2 },
  { name: "Star Starachowice", tier: 4, colors: ['#008000', '#000000', '#FFFFFF'], stadium: "Stadion Miejski w Starachowicach", capacity: 5000, reputation: 2 },
  { name: "Błękitni Stargard", tier: 4, colors: ['#87CEEB', '#FFFFFF', '#000000'], stadium: "Stadion Miejski w Stargardzie", capacity: 2850, reputation: 2 },
  { name: "Warta Gorzów Wielkopolski", tier: 4, colors: ['#000080', '#800000', '#FFFFFF'], stadium: "Stadion OSiR w Gorzowie Wielkopolskim", capacity: 4000, reputation: 2 },
  { name: "Broń Radom", tier: 4, colors: ['#FFFFFF', '#FF0000', '#0000FF'], stadium: "Stadion Miejski w Radomiu", capacity: 4000, reputation: 2, logoFile: 'bron-radom-2020-logo.png' },
  { name: "Mławianka Mława", tier: 4, colors: ['#008000', '#FFFFFF', '#FF0000'], stadium: "Stadion Miejski w Mławie", capacity: 4000, reputation: 2 },
  { name: "Warta Sieradz", tier: 4, colors: ['#FFFFFF', '#008000', '#FF0000'], stadium: "Stadion Miejski w Sieradzu", capacity: 2000, reputation: 2 },
  { name: "Polonia Nysa", tier: 4, colors: ['#000000', '#FFFFFF', '#FF0000'], stadium: "Stadion Miejski w Nysie", capacity: 2000, reputation: 2 },
  { name: "FKS Stal Kraśnik", tier: 4, colors: ['#0000FF', '#FFFF00', '#FFFFFF'], stadium: "Stadion Miejski w Kraśniku", capacity: 2000, reputation: 2 },
  { name: "Ślęza Wrocław", tier: 4, colors: ['#FFFF00', '#FF0000', '#FFFFFF'], stadium: "Stadion Miejski", capacity: 2000, reputation: 2 },
  { name: "Ząbkovia Ząbki", tier: 4, colors: ['#FFFFFF', '#FF0000', '#000080'], stadium: "Stadion Miejski w Ząbkach", capacity: 2000, reputation: 2, logoFile: 'zabkovia-zabki-2018-logo.png' },
  { name: "Pogoń-Sokół Lubaczów", tier: 4, colors: ['#FF0000', '#FFFFFF', '#0000FF'], stadium: "Stadion Miejski w Lubaczowie", capacity: 2500, reputation: 1 },
  { name: "LKS Goczałkowice-Zdrój", tier: 4, colors: ['#FFFFFF', '#0000FF', '#FF0000'], stadium: "Stadion Miejski", capacity: 1000, reputation: 1, logoFile: 'lks-goczalkowice-zdroj-2025-logo.png' },
  { name: "MKP Carina Gubin", tier: 4, colors: ['#008000', '#000000', '#FFFFFF'], stadium: "Stadion Miejski w Gubinie", capacity: 1500, reputation: 1 },
  { name: "SKRA Częstochowa", tier: 4, colors: ['#FFFFFF', '#0000FF', '#FF0000'], stadium: "Stadion Miejski", capacity: 1000, reputation: 1, logoFile: 'skra-czestochowa-2023-logo.png' },
  { name: "Karkonosze Jelenia Góra", tier: 4, colors: ['#0000FF', '#FFFFFF', '#FF0000'], stadium: "Stadion Miejski w Jeleniej Górze", capacity: 3000, reputation: 1 },
  { name: "Słowianin Wolibórz", tier: 4, colors: ['#008000', '#FF0000', '#000000'], stadium: "Stadion Miejski", capacity: 500, reputation: 1 },
  { name: "Pniówek Pawłowice Śląskie", tier: 4, colors: ['#008000', '#000000', '#FFFF00'], stadium: "Stadion Miejski", capacity: 1200, reputation: 1 },
  { name: "LZS Starowice", tier: 4, colors: ['#0000FF', '#FF0000', '#FFFFFF'], stadium: "Stadion Miejski", capacity: 800, reputation: 1 },
  { name: "MKS Stal Jasień", tier: 4, colors: ['#FFFF00', '#0000FF', '#FFFFFF'], stadium: "Stadion Miejski", capacity: 500, reputation: 1 },
  { name: "ŁKS Łomża", tier: 4, colors: ['#FFFFFF', '#FF0000', '#0000FF'], stadium: "Stadion Miejski w Łomży", capacity: 3000, reputation: 1 },
  { name: "KS CK Troszyn", tier: 4, colors: ['#008000', '#FFFFFF', '#000000'], stadium: "Stadion Miejski", capacity: 500, reputation: 1 },
  { name: "KS Wasilków", tier: 4, colors: ['#0000FF', '#FF0000', '#008000'], stadium: "Stadion Miejski w Wasilkowie", capacity: 1000, reputation: 1 },
  { name: "MLKS Znicz Biała Piska", tier: 4, colors: ['#FF0000', '#008000', '#FFFFFF'], stadium: "Stadion Miejski w Białej Piskiej", capacity: 800, reputation: 1 },
  { name: "Polonia Środa Wielkopolska", tier: 4, colors: ['#800000', '#FFFFFF', '#0000FF'], stadium: "Stadion Miejski w Środzie Wielkopolskiej", capacity: 1500, reputation: 1 },
  { name: "KTS-K Luzino", tier: 4, colors: ['#FFFFFF', '#FF0000', '#0000FF'], stadium: "Stadion Miejski", capacity: 800, reputation: 1 },
  { name: "Cartusia Kartuzy", tier: 4, colors: ['#0000FF', '#FFFFFF', '#000000'], stadium: "Stadion Miejski w Kartuzach", capacity: 1200, reputation: 1 },
  { name: "KS Lipno Stęszew", tier: 4, colors: ['#0000FF', '#FFFFFF', '#FF0000'], stadium: "Stadion Miejski", capacity: 1000, reputation: 1 },
  { name: "WDA Świecie", tier: 4, colors: ['#0000FF', '#FFFFFF', '#FF0000'], stadium: "Stadion Miejski w Świeciu", capacity: 3000, reputation: 1 },
  { name: "Noteć Czarnków", tier: 4, colors: ['#FFFFFF', '#0000FF', '#FF0000'], stadium: "Stadion Miejski w Czarnkowie", capacity: 1500, reputation: 2 },
  { name: "ZKS Kluczevia Stargard", tier: 4, colors: ['#0000FF', '#FFFFFF', '#FFFF00'], stadium: "Stadion Miejski", capacity: 1000, reputation: 1 },
  { name: "Pogoń Nowe Skalmierzyce", tier: 4, colors: ['#FFFFFF', '#0000FF', '#FF0000'], stadium: "Stadion Miejski", capacity: 1500, reputation: 1 },
  { name: "SKS Unia Swarzędz", tier: 4, colors: ['#FFFFFF', '#0000FF', '#FF0000'], stadium: "Stadion Miejski w Swarzędzu", capacity: 1500, reputation: 1 },
  { name: "MKS Viktoria Września", tier: 4, colors: ['#FFFFFF', '#008000', '#FF0000'], stadium: "Stadion Miejski we Wrześni", capacity: 1000, reputation: 1 },
  { name: "GZS Tluchovia Tłuchowo", tier: 4, colors: ['#0000FF', '#FFFF00', '#FF0000'], stadium: "Stadion Miejski", capacity: 500, reputation: 1 },
  { name: "LKS Wybrzeże Rewalskie Rewal", tier: 4, colors: ['#0000FF', '#FFFFFF', '#FF0000'], stadium: "Stadion Miejski", capacity: 1000, reputation: 1 },
  { name: "Wiślanie Jaśkowice", tier: 4, colors: ['#FF0000', '#FFFFFF', '#000080'], stadium: "Stadion Miejski", capacity: 800, reputation: 1 },
  { name: "MKS Podlasie Biała Podlaska", tier: 4, colors: ['#FFFFFF', '#008000', '#FFFF00'], stadium: "Stadion Miejski w Białej Piskiej", capacity: 1500, reputation: 1 },
  { name: "MKS Czarni Połaniec", tier: 4, colors: ['#FFFF00', '#000000', '#FFFFFF'], stadium: "Stadion Miejski w Połańcu", capacity: 900, reputation: 1 },
  { name: "KS Naprzód Jędrzejów", tier: 4, colors: ['#FFFF00', '#000000', '#FFFFFF'], stadium: "Stadion Miejski w Jędrzejowie", capacity: 1200, reputation: 1 },
  { name: "Świdniczanka Świdnik", tier: 4, colors: ['#008000', '#FFFFFF', '#FF0000'], stadium: "Stadion Miejski", capacity: 1000, reputation: 1 },
  { name: "Sokół Kolbuszowa Dolna", tier: 4, colors: ['#FF0000', '#FFFF00', '#008000'], stadium: "Stadion Miejski", capacity: 800, reputation: 1 },
  { name: "Sparta Kazimierza Wielka", tier: 4, colors: ['#FF0000', '#FFFFFF', '#0000FF'], stadium: "Stadion Miejski", capacity: 800, reputation: 1 },
  { name: "BKS Sparta Katowice", tier: 4, colors: ['#0000FF', '#FFFFFF', '#FF0000'], stadium: "Stadion Miejski", capacity: 1000, reputation: 1 },
  { name: "Wikielec", tier: 4, colors: ['#FFFFFF', '#0000FF', '#FF0000'], stadium: "Stadion Miejski", capacity: 600, reputation: 1 },
  { name: "Kotwica Kołobrzeg", tier: 4, colors: ['#0000FF', '#FFFFFF', '#FF0000'], stadium: "Stadion Miejski w Kołobrzegu", capacity: 3000, reputation: 3 },
  { name: "Olimpia Zambrów", tier: 4, colors: ['#FFFFFF', '#0000FF', '#FF0000'], stadium: "Stadion Miejski w Zambrowie", capacity: 2000, reputation: 2 },
  { name: "Świt Skolwin", tier: 4, colors: ['#008000', '#FFFFFF', '#000000'], stadium: "Stadion Miejski Skolwin", capacity: 1500, reputation: 2 },
  { name: "Gwardia Koszalin", tier: 4, colors: ['#FF0000', '#FFFFFF', '#0000FF'], stadium: "Stadion Miejski w Koszalinie", capacity: 2500, reputation: 2 },
  { name: "Bałtyk Gdynia", tier: 4, colors: ['#0000FF', '#FFFFFF', '#FF0000'], stadium: "Stadion Miejski w Gdyni (Bałtyk)", capacity: 2000, reputation: 3 },
  { name: "Vineta Wolin", tier: 4, colors: ['#0000FF', '#FFFFFF', '#FFFF00'], stadium: "Stadion Miejski w Wolinie", capacity: 1500, reputation: 2 },
  { name: "Chemik Police", tier: 4, colors: ['#008000', '#FFFFFF', '#000000'], stadium: "Stadion Miejski w Policach", capacity: 2000, reputation: 2 },
  { name: "Lechia Dzierżoniów", tier: 4, colors: ['#008000', '#FFFFFF', '#FF0000'], stadium: "Stadion Miejski w Dzierżoniowie", capacity: 2500, reputation: 2 },
  { name: "Foto-Higiena Gać", tier: 4, colors: ['#FF0000', '#FFFFFF', '#0000FF'], stadium: "Stadion Miejski w Gaci", capacity: 800, reputation: 1 },
  { name: "Unia Janikowo", tier: 4, colors: ['#0000FF', '#FFFFFF', '#FF0000'], stadium: "Stadion Miejski w Janikowie", capacity: 2000, reputation: 2 },
  { name: "Włókniarz Częstochowa", tier: 4, colors: ['#FFFFFF', '#0000FF', '#FF0000'], stadium: "Stadion Miejski w Częstochowie", capacity: 1500, reputation: 2 },
  { name: "Victoria Częstochowa", tier: 4, colors: ['#008000', '#FFFFFF', '#FF0000'], stadium: "Stadion Miejski", capacity: 1000, reputation: 1 },
  { name: "Orzeł Łódź", tier: 4, colors: ['#FF0000', '#FFFFFF', '#0000FF'], stadium: "Stadion Miejski w Łodzi", capacity: 1200, reputation: 1 },
  { name: "Sokół Ostróda", tier: 4, colors: ['#0000FF', '#FFFFFF', '#FF0000'], stadium: "Stadion Miejski w Ostródzie", capacity: 3000, reputation: 2 },
  { name: "Mazovia Mińsk Mazowiecki", tier: 4, colors: ['#FF0000', '#FFFFFF', '#0000FF'], stadium: "Stadion Miejski w Mińsku Mazowieckim", capacity: 1500, reputation: 1 },
  { name: "Polonia Bydgoszcz", tier: 4, colors: ['#000000', '#FFFFFF', '#FF0000'], stadium: "Stadion im. Bronisława Malinowskiego", capacity: 2500, reputation: 2 },
];
