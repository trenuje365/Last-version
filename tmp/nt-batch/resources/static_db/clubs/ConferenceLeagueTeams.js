"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCONFClubId = exports.RAW_CONFERENCE_LEAGUE_CLUBS = void 0;
exports.RAW_CONFERENCE_LEAGUE_CLUBS = [
    // Andora (AND) – najsłabsza federacja
    { name: "FC Santa Coloma", country: "AND", tier: 4, colors: ['#0000FF', '#FFFFFF', '#FF0000'], stadium: "Camp Nou Municipal d'Andorra", capacity: 500, reputation: 1 },
    { name: "Inter Club d'Escaldes", country: "AND", tier: 4, colors: ['#006633', '#FFFFFF', '#000000'], stadium: "Camp de Futbol d'Aixovall", capacity: 1000, reputation: 1 },
    { name: "Atlètic Club d'Escaldes", country: "AND", tier: 4, colors: ['#FF0000', '#FFFFFF', '#000000'], stadium: "Camp de Futbol d'Aixovall", capacity: 1000, reputation: 1 },
    // Gibraltar (GIB)
    { name: "Europa FC", country: "GIB", tier: 4, colors: ['#000000', '#FFFFFF', '#FFD700'], stadium: "Victoria Stadium", capacity: 5000, reputation: 2 },
    { name: "Bruno's Magpies", country: "GIB", tier: 4, colors: ['#0000FF', '#FFFFFF', '#FF0000'], stadium: "Victoria Stadium", capacity: 5000, reputation: 2 },
    { name: "Manchester 62", country: "GIB", tier: 4, colors: ['#FF0000', '#FFFFFF', '#000000'], stadium: "Victoria Stadium", capacity: 5000, reputation: 2 },
    // Liechtenstein (LIE) – tylko puchar Liechtensteinu, kluby grają w szwajcarskiej lidze
    { name: "USV Eschen/Mauren", country: "LIE", tier: 4, colors: ['#006633', '#FFFFFF', '#000000'], stadium: "Sportpark Eschen-Mauren", capacity: 2000, reputation: 3 },
    { name: "FC Balzers", country: "LIE", tier: 4, colors: ['#0000FF', '#FFFFFF', '#FFD700'], stadium: "Sportanlage Rheinau", capacity: 2000, reputation: 2 },
    { name: "FC Ruggell", country: "LIE", tier: 4, colors: ['#FF0000', '#FFFFFF', '#000000'], stadium: "Rheinpark Stadion", capacity: 7838, reputation: 2 },
    // San Marino (SMR)
    { name: "Tre Penne", country: "SMR", tier: 4, colors: ['#0000FF', '#FFFFFF', '#FF0000'], stadium: "Stadio Olimpico di Serravalle", capacity: 7000, reputation: 1 },
    { name: "Virtus Acquaviva", country: "SMR", tier: 4, colors: ['#FF0000', '#FFFFFF', '#000000'], stadium: "Stadio Olimpico di Serravalle", capacity: 7000, reputation: 1 },
    { name: "Folgore/Falciano", country: "SMR", tier: 4, colors: ['#006633', '#FFFFFF', '#000000'], stadium: "Stadio Olimpico di Serravalle", capacity: 7000, reputation: 1 },
    // Wyspy Owcze (FRO) – bardzo nisko, nawet HB i Víkingur rzadko przechodzą rundy
    { name: "HB Tórshavn", country: "FRO", tier: 4, colors: ['#000000', '#FFFFFF', '#FF0000'], stadium: "Tórsvøllur", capacity: 6000, reputation: 1 },
    { name: "Víkingur Gøta", country: "FRO", tier: 4, colors: ['#0000FF', '#FFFFFF', '#FFD700'], stadium: "Sarpugerði", capacity: 3000, reputation: 1 },
    { name: "B36 Tórshavn", country: "FRO", tier: 4, colors: ['#FFD700', '#000000', '#FFFFFF'], stadium: "Gundadalur", capacity: 5000, reputation: 1 },
    // Malta (MLT)
    { name: "Floriana FC", country: "MLT", tier: 4, colors: ['#006633', '#FFFFFF', '#000000'], stadium: "Independence Ground", capacity: 3000, reputation: 3 },
    { name: "Valletta FC", country: "MLT", tier: 4, colors: ['#FFFFFF', '#FF0000', '#000000'], stadium: "Centenary Stadium", capacity: 2000, reputation: 2 },
    { name: "Gżira United", country: "MLT", tier: 4, colors: ['#0000FF', '#FFFFFF', '#FF0000'], stadium: "Centenary Stadium", capacity: 2000, reputation: 2 },
    // Luksemburg (LUX)
    { name: "UNA Strassen", country: "LUX", tier: 4, colors: ['#006633', '#FFFFFF', '#000000'], stadium: "Complexe Sportif Jean Wirtz", capacity: 2000, reputation: 3 },
    { name: "FC Progrès Niederkorn", country: "LUX", tier: 4, colors: ['#FF0000', '#FFFFFF', '#000000'], stadium: "Stade Jos Haupert", capacity: 1800, reputation: 2 },
    { name: "Fola Esch", country: "LUX", tier: 4, colors: ['#000000', '#FFFFFF', '#FFD700'], stadium: "Stade Émile Mayrisch", capacity: 3826, reputation: 2 },
    // Kosowo (KOS)
    { name: "KF Llapi", country: "KOS", tier: 4, colors: ['#0000FF', '#FFFFFF', '#FF0000'], stadium: "Fadil Vokrri Stadium", capacity: 13500, reputation: 5 },
    { name: "KF Malisheva", country: "KOS", tier: 4, colors: ['#006633', '#FFFFFF', '#000000'], stadium: "Malisheva Stadium", capacity: 2000, reputation: 5 },
    { name: "KF Dukagjini", country: "KOS", tier: 4, colors: ['#FF0000', '#FFFFFF', '#000000'], stadium: "Përparim Thaçi Stadium", capacity: 2000, reputation: 5 },
    // Łotwa (LAT)
    { name: "FK Auda", country: "LAT", tier: 4, colors: ['#006633', '#FFFFFF', '#000000'], stadium: "Skonto Stadium", capacity: 8083, reputation: 5 },
    { name: "FK Liepāja", country: "LAT", tier: 4, colors: ['#0000FF', '#FFFFFF', '#FFD700'], stadium: "Daugava Stadium Liepāja", capacity: 8000, reputation: 5 },
    { name: "FK Metta", country: "LAT", tier: 4, colors: ['#FF0000', '#FFFFFF', '#000000'], stadium: "Daugava Stadium", capacity: 10800, reputation: 5 },
    // Litwa (LTU)
    { name: "FC Banga Gargždai", country: "LTU", tier: 4, colors: ['#000000', '#FFFFFF', '#FF0000'], stadium: "Gargždai Stadium", capacity: 2300, reputation: 5 },
    { name: "FK Hegelmann", country: "LTU", tier: 4, colors: ['#FFD700', '#000000', '#FFFFFF'], stadium: "Hegelmann Arena", capacity: 3500, reputation: 5 },
    { name: "FK Džiugas Telšiai", country: "LTU", tier: 4, colors: ['#006633', '#FFFFFF', '#000000'], stadium: "Telšiai Central Stadium", capacity: 2400, reputation: 6 },
    // Albania (ALB) – po Tirana, Egnatia, Vllaznia (już w EL)
    { name: "KF Teuta Durrës", country: "ALB", tier: 4, colors: ['#0000FF', '#FFFFFF', '#FF0000'], stadium: "Stadiumi Niko Dovana", capacity: 12000, reputation: 4 },
    { name: "KF Bylis Ballsh", country: "ALB", tier: 4, colors: ['#FFD700', '#000000', '#FFFFFF'], stadium: "Adush Muça Stadium", capacity: 5000, reputation: 4 },
    { name: "KF Laçi", country: "ALB", tier: 4, colors: ['#006633', '#FFFFFF', '#000000'], stadium: "Stadiumi Laçi", capacity: 5000, reputation: 4 },
    // Armenia (ARM) – po Ararat-Armenia, Noah, Pyunik (już w EL)
    { name: "FC Urartu", country: "ARM", tier: 4, colors: ['#FF0000', '#FFFFFF', '#000000'], stadium: "Urartu Stadium", capacity: 7000, reputation: 4 },
    { name: "FC Alashkert", country: "ARM", tier: 4, colors: ['#0000FF', '#FFFFFF', '#FFD700'], stadium: "Alashkert Stadium", capacity: 6850, reputation: 4 },
    { name: "FC Van", country: "ARM", tier: 4, colors: ['#006633', '#FFFFFF', '#000000'], stadium: "Charentsavan City Stadium", capacity: 5000, reputation: 4 },
    // Austria (AUT) – po Rapid, Austria Wiedeń, LASK (już w EL)
    { name: "SCR Altach", country: "AUT", tier: 3, colors: ['#000000', '#FFFFFF', '#FF0000'], stadium: "Cashpoint Arena", capacity: 8500, reputation: 8 },
    { name: "TSV Hartberg", country: "AUT", tier: 3, colors: ['#FF0000', '#FFFFFF', '#000000'], stadium: "Profertil Arena Hartberg", capacity: 4635, reputation: 8 },
    { name: "Wolfsberger AC", country: "AUT", tier: 3, colors: ['#0000FF', '#FFFFFF', '#FFD700'], stadium: "Lavanttal-Arena", capacity: 8100, reputation: 8 },
    // Azerbejdżan (AZE) – po Neftçi, Sabah, Zira (już w EL)
    { name: "Sumgayit FK", country: "AZE", tier: 4, colors: ['#FF0000', '#FFFFFF', '#000000'], stadium: "Kapital Bank Arena", capacity: 1600, reputation: 4 },
    { name: "Kapaz PFK", country: "AZE", tier: 4, colors: ['#006633', '#FFFFFF', '#000000'], stadium: "Ganja City Stadium", capacity: 15000, reputation: 4 },
    { name: "Sabail FK", country: "AZE", tier: 4, colors: ['#0000FF', '#FFFFFF', '#FF0000'], stadium: "Bayil Arena", capacity: 3000, reputation: 4 },
    // Białoruś (BLR)
    { name: "FK Isloch Mińsk", country: "BLR", tier: 4, colors: ['#FFFFFF', '#0000FF', '#FF0000'], stadium: "Stadion FC Minsk", capacity: 3100, reputation: 6 },
    { name: "FK Slutsk", country: "BLR", tier: 4, colors: ['#006633', '#FFFFFF', '#000000'], stadium: "Stadion Haradski", capacity: 2150, reputation: 5 },
    { name: "FK Smolevichi", country: "BLR", tier: 4, colors: ['#FF0000', '#FFFFFF', '#000000'], stadium: "Ozyorny Stadium", capacity: 1500, reputation: 5 },
    // Bośnia i Hercegowina (BIH)
    { name: "FK Igman Konjic", country: "BIH", tier: 4, colors: ['#0000FF', '#FFFFFF', '#FF0000'], stadium: "Gradski stadion Igman", capacity: 5000, reputation: 6 },
    { name: "FK Posušje", country: "BIH", tier: 4, colors: ['#FFD700', '#000000', '#FFFFFF'], stadium: "Stadion Mokri Dolac", capacity: 8000, reputation: 5 },
    { name: "FK Sloga Meridian", country: "BIH", tier: 4, colors: ['#006633', '#FFFFFF', '#000000'], stadium: "Stadion Tušanj", capacity: 7000, reputation: 5 },
    // Bułgaria (BUL)
    { name: "FK Arda Kardzhali", country: "BUL", tier: 3, colors: ['#0000FF', '#FFFFFF', '#FF0000'], stadium: "Arena Arda", capacity: 12500, reputation: 6 },
    { name: "FK Beroe Stara Zagora", country: "BUL", tier: 4, colors: ['#006633', '#FFFFFF', '#000000'], stadium: "Beroe Stadium", capacity: 12128, reputation: 6 },
    { name: "FK Hebar Pazardzhik", country: "BUL", tier: 4, colors: ['#FF0000', '#FFFFFF', '#000000'], stadium: "Stadion Georgi Benkovski", capacity: 13128, reputation: 5 },
    { name: "PFC Slavia Sofia", country: "BUL", tier: 3, colors: ['#FFFFFF', '#000000', '#FF0000'], stadium: "Ovcha Kupel Stadium", capacity: 25000, reputation: 6 },
    { name: "PFC Lokomotiv Sofia 1929", country: "BUL", tier: 3, colors: ['#ca0707', '#000000', '#FF0000'], stadium: "Lokomotiv Stadium Sofia", capacity: 22000, reputation: 6 },
    { name: "PFC Septemvri Sofia", country: "BUL", tier: 3, colors: ['#FFFFFF', '#000000', '#FF0000'], stadium: "Stadion Dragalevtsi", capacity: 1000, reputation: 5 },
    // Chorwacja (CRO)
    { name: "NK Istra 1961", country: "CRO", tier: 3, colors: ['#FFD700', '#000000', '#FFFFFF'], stadium: "Stadion Aldo Drosina", capacity: 9921, reputation: 6 },
    { name: "NK Šibenik", country: "CRO", tier: 3, colors: ['#0000FF', '#FFFFFF', '#FF0000'], stadium: "Stadion Šubićevac", capacity: 3928, reputation: 5 },
    { name: "HNK Gorica", country: "CRO", tier: 3, colors: ['#006633', '#FFFFFF', '#000000'], stadium: "Stadion HNK Gorica", capacity: 4826, reputation: 5 },
    // Cypr (CYP) – 
    { name: "Anorthosis Famagusta", country: "CYP", tier: 4, colors: ['#0000FF', '#FFFFFF', '#FF0000'], stadium: "Antonis Papadopoulos Stadium", capacity: 10800, reputation: 6 },
    { name: "Apollon Limassol", country: "CYP", tier: 4, colors: ['#0000FF', '#FFFFFF', '#FFD700'], stadium: "Tsirio Stadium", capacity: 13261, reputation: 6 },
    { name: "Pafos FC", country: "CYP", tier: 4, colors: ['#006633', '#FFFFFF', '#000000'], stadium: "Stadio Stelios Kyriakides", capacity: 9394, reputation: 5 },
    // Czechy (CZE) 
    { name: "FK Jablonec", country: "CZE", tier: 3, colors: ['#006633', '#FFFFFF', '#FFD700'], stadium: "Stadion Střelnice", capacity: 6108, reputation: 6 },
    { name: "FK Teplice", country: "CZE", tier: 3, colors: ['#FFD700', '#000000', '#FFFFFF'], stadium: "Na Stínadlech", capacity: 18221, reputation: 5 },
    { name: "FK Mladá Boleslav", country: "CZE", tier: 3, colors: ['#FF0000', '#FFFFFF', '#000000'], stadium: "Lokotrans Aréna", capacity: 5000, reputation: 5 },
    // Dania (DEN) 
    { name: "Aarhus GF", country: "DEN", tier: 3, colors: ['#FFFFFF', '#000000', '#FF0000'], stadium: "Ceres Park & Arena", capacity: 19433, reputation: 6 },
    { name: "Randers FC", country: "DEN", tier: 3, colors: ['#0000FF', '#FFFFFF', '#FF0000'], stadium: "Cepheus Park Randers", capacity: 10300, reputation: 5 },
    { name: "Viborg FF", country: "DEN", tier: 3, colors: ['#006633', '#FFFFFF', '#000000'], stadium: "Viborg Stadion", capacity: 9600, reputation: 5 },
    // Estonia (EST) 
    { name: "JK Tammeka Tartu", country: "EST", tier: 4, colors: ['#000000', '#FFFFFF', '#FF0000'], stadium: "Tamme staadion", capacity: 1600, reputation: 5 },
    { name: "JK Narva Trans", country: "EST", tier: 4, colors: ['#0000FF', '#FFFFFF', '#FF0000'], stadium: "Kreenholmi staadion", capacity: 1800, reputation: 5 },
    { name: "FC Kuressaare", country: "EST", tier: 4, colors: ['#006633', '#FFFFFF', '#000000'], stadium: "Kuressaare linnastaadion", capacity: 2000, reputation: 4 },
    // Finlandia (FIN) 
    { name: "FC Honka Espoo", country: "FIN", tier: 3, colors: ['#0000FF', '#FFFFFF', '#FFD700'], stadium: "Tapiolan Urheilupuisto", capacity: 6000, reputation: 6 },
    { name: "FC Inter Turku", country: "FIN", tier: 3, colors: ['#000000', '#FFFFFF', '#FF0000'], stadium: "Veritas Stadion", capacity: 9300, reputation: 6 },
    { name: "AC Oulu", country: "FIN", tier: 3, colors: ['#006633', '#FFFFFF', '#000000'], stadium: "Raatin stadion", capacity: 4900, reputation: 5 },
    // Gruzja (GEO) 
    { name: "FC Telavi", country: "GEO", tier: 4, colors: ['#FF0000', '#FFFFFF', '#000000'], stadium: "Municipal Stadium Telavi", capacity: 12000, reputation: 6 },
    { name: "FC Samtredia", country: "GEO", tier: 4, colors: ['#0000FF', '#FFFFFF', '#FFD700'], stadium: "Erosi Manjgaladze Stadium", capacity: 15000, reputation: 5 },
    { name: "FC Gagra", country: "GEO", tier: 4, colors: ['#006633', '#FFFFFF', '#000000'], stadium: "Gagra Stadium", capacity: 2000, reputation: 5 },
    // Irlandia (IRL) 
    { name: "Dundalk FC", country: "IRL", tier: 4, colors: ['#FFFFFF', '#000000', '#FF0000'], stadium: "Oriel Park", capacity: 4500, reputation: 6 },
    { name: "Sligo Rovers", country: "IRL", tier: 4, colors: ['#006633', '#FFFFFF', '#000000'], stadium: "The Showgrounds", capacity: 5500, reputation: 5 },
    { name: "Waterford FC", country: "IRL", tier: 4, colors: ['#0000FF', '#FFFFFF', '#FF0000'], stadium: "RSC", capacity: 5500, reputation: 5 },
    // Irlandia Północna (NIR)
    { name: "Cliftonville FC", country: "NIR", tier: 4, colors: ['#FF0000', '#FFFFFF', '#000000'], stadium: "Solitude", capacity: 2462, reputation: 6 },
    { name: "Crusaders FC", country: "NIR", tier: 4, colors: ['#000000', '#FFFFFF', '#FF0000'], stadium: "Seaview", capacity: 3383, reputation: 5 },
    { name: "Glentoran FC", country: "NIR", tier: 4, colors: ['#006633', '#FFFFFF', '#000000'], stadium: "The Oval", capacity: 26556, reputation: 5 },
    // Islandia (ISL) – po Víkingur, Breiðablik, FH, Stjarnan (już w CL/EL)
    { name: "KR Reykjavík", country: "ISL", tier: 4, colors: ['#000000', '#FFFFFF', '#FF0000'], stadium: "KR-völlur", capacity: 6450, reputation: 6 },
    { name: "Valur Reykjavík", country: "ISL", tier: 4, colors: ['#0000FF', '#FFFFFF', '#FFD700'], stadium: "Hlíðarendi", capacity: 3000, reputation: 6 },
    { name: "Fram Reykjavík", country: "ISL", tier: 4, colors: ['#FFFFFF', '#000000', '#FF0000'], stadium: "Framvöllur Úlfarsárdal", capacity: 1500, reputation: 5 },
    // Izrael (ISR) – kluby z Ligat ha'Al (najwyższa liga)
    { name: "Hapoel Tel Aviv", country: "ISR", tier: 4, colors: ['#FF0000', '#FFFFFF', '#000000'], stadium: "Bloomfield Stadium", capacity: 29300, reputation: 6 },
    { name: "Ironi Tiberias", country: "ISR", tier: 4, colors: ['#FFD700', '#000000', '#FFFFFF'], stadium: "Tiberias Municipal Stadium", capacity: 8000, reputation: 5 },
    { name: "Maccabi Bnei Raina", country: "ISR", tier: 4, colors: ['#006633', '#FFFFFF', '#000000'], stadium: "Green Stadium", capacity: 3800, reputation: 5 },
    // Kazachstan (KAZ) – kluby z Premier League (najwyższa liga)
    { name: "FC Aktobe", country: "KAZ", tier: 3, colors: ['#FF0000', '#FFFFFF', '#000000'], stadium: "Central Stadium Aktobe", capacity: 13500, reputation: 7 },
    { name: "FC Kairat Almaty", country: "KAZ", tier: 4, colors: ['#FFD700', '#000000', '#FFFFFF'], stadium: "Central Stadium Almaty", capacity: 23804, reputation: 6 },
    { name: "FC Ordabasy Shymkent", country: "KAZ", tier: 4, colors: ['#006633', '#FFFFFF', '#000000'], stadium: "Kazybek-Bi Stadium", capacity: 16400, reputation: 6 },
    // Macedonia Północna (MKD)
    { name: "FK Tikvesh Kavadarci", country: "MKD", tier: 4, colors: ['#FF0000', '#FFFFFF', '#000000'], stadium: "Gradski Stadion Kavadarci", capacity: 7500, reputation: 6 },
    { name: "FK Shkupi", country: "MKD", tier: 4, colors: ['#0000FF', '#FFFFFF', '#FF0000'], stadium: "Čair Stadium", capacity: 6000, reputation: 6 },
    { name: "KF Gostivar", country: "MKD", tier: 4, colors: ['#006633', '#FFFFFF', '#000000'], stadium: "Gostivar Stadium", capacity: 1000, reputation: 5 },
    // Mołdawia (MDA) – po Sheriff, Petrocub, Zimbru (już w CL/EL)
    { name: "FC Milsami Orhei", country: "MDA", tier: 4, colors: ['#0033A0', '#FFFFFF', '#FFCC00'], stadium: "Complexul Sportiv Raional Orhei", capacity: 2500, reputation: 6 },
    { name: "FC Spartanii Selemet", country: "MDA", tier: 4, colors: ['#FF0000', '#FFFFFF', '#000000'], stadium: "Stadionul Orhei", capacity: 2500, reputation: 5 },
    { name: "FC Florești", country: "MDA", tier: 4, colors: ['#0000FF', '#FFFFFF', '#FFD700'], stadium: "Stadionul Florești", capacity: 1000, reputation: 5 },
    // Niemcy 
    { name: "1. FC Kaiserslautern", country: "GER", tier: 3, colors: ['#FF0000', '#FFFFFF', '#000000'], stadium: "Fritz-Walter-Stadion", capacity: 49780, reputation: 10 },
    { name: "Hannover 96", country: "GER", tier: 3, colors: ['#006633', '#FFFFFF', '#000000'], stadium: "HDI-Arena", capacity: 49200, reputation: 10 },
    { name: "Karlsruher SC", country: "GER", tier: 3, colors: ['#0000FF', '#FFFFFF', '#FFD700'], stadium: "BBBank Wildpark", capacity: 28762, reputation: 9 },
    { name: "St. Pauli", country: "GER", tier: 3, colors: ['#000000', '#FFFFFF', '#FF0000'], stadium: "Millerntor-Stadion", capacity: 29000, reputation: 9 },
    { name: "1. FC Nürnberg", country: "GER", tier: 3, colors: ['#FF0000', '#FFFFFF', '#000000'], stadium: "Max-Morlock-Stadion", capacity: 50000, reputation: 9 },
    { name: "Eintracht Braunschweig", country: "GER", tier: 3, colors: ['#FFD700', '#000000', '#FFFFFF'], stadium: "Eintracht-Stadion", capacity: 25000, reputation: 8 },
    // Norwegia (NOR) – tier 4
    { name: "Viking FK", country: "NOR", tier: 3, colors: ['#000000', '#FFFFFF', '#FF0000'], stadium: "SR-Bank Arena", capacity: 15600, reputation: 6 },
    { name: "Sarpsborg 08 FF", country: "NOR", tier: 3, colors: ['#0000FF', '#FFFFFF', '#FF0000'], stadium: "Sarpsborg Stadion", capacity: 8000, reputation: 5 },
    { name: "HamKam", country: "NOR", tier: 3, colors: ['#FFFFFF', '#000000', '#FF0000'], stadium: "Briskeby Arena", capacity: 7800, reputation: 5 },
    // Portugalia (POR) – tier 3, mid-table / niższe Primeira Liga
    { name: "Gil Vicente FC", country: "POR", tier: 3, colors: ['#FF0000', '#FFFFFF', '#000000'], stadium: "Estádio Cidade de Barcelos", capacity: 12046, reputation: 8 },
    { name: "Estoril Praia", country: "POR", tier: 3, colors: ['#FFD700', '#000000', '#FFFFFF'], stadium: "Estádio António Coimbra da Mota", capacity: 8000, reputation: 9 },
    { name: "Rio Ave FC", country: "POR", tier: 3, colors: ['#006633', '#FFFFFF', '#000000'], stadium: "Estádio dos Arcos", capacity: 9065, reputation: 9 },
    // Rumunia (ROU) – tier 4
    { name: "FC Hermannstadt", country: "ROU", tier: 3, colors: ['#0000FF', '#FFFFFF', '#FF0000'], stadium: "Municipal Stadium Sibiu", capacity: 14400, reputation: 6 },
    { name: "FC UTA Arad", country: "ROU", tier: 3, colors: ['#FFD700', '#000000', '#FFFFFF'], stadium: "Stadionul Francisc Neuman", capacity: 12800, reputation: 5 },
    { name: "FC Politehnica Iași", country: "ROU", tier: 3, colors: ['#000000', '#FFFFFF', '#FF0000'], stadium: "Stadionul Emil Alexandrescu", capacity: 12800, reputation: 5 },
    // Szkocja (SCO)
    { name: "Livingston FC", country: "SCO", tier: 3, colors: ['#FF0000', '#FFFFFF', '#000000'], stadium: "Tony Macaroni Arena", capacity: 9528, reputation: 6 },
    { name: "Raith Rovers", country: "SCO", tier: 3, colors: ['#0000FF', '#FFFFFF', '#FFD700'], stadium: "Stark's Park", capacity: 8798, reputation: 5 },
    { name: "Partick Thistle", country: "SCO", tier: 3, colors: ['#FFD700', '#000000', '#FFFFFF'], stadium: "Firhill Stadium", capacity: 10102, reputation: 5 },
    // Słowacja (SVK)
    { name: "FK Košice", country: "SVK", tier: 4, colors: ['#0000FF', '#FFFFFF', '#FF0000'], stadium: "Futbal Tatran Aréna", capacity: 12458, reputation: 6 },
    { name: "MFK Zemplín Michalovce", country: "SVK", tier: 4, colors: ['#006633', '#FFFFFF', '#000000'], stadium: "Štadión pod Zoborom", capacity: 7200, reputation: 5 },
    { name: "MFK Skalica", country: "SVK", tier: 4, colors: ['#FF0000', '#FFFFFF', '#000000'], stadium: "Futbalový štadión Skalica", capacity: 4000, reputation: 5 },
    // Szwecja (SWE)
    { name: "IK Sirius", country: "SWE", tier: 3, colors: ['#0000FF', '#FFFFFF', '#000000'], stadium: "Studenternas IP", capacity: 10522, reputation: 6 },
    { name: "IF Brommapojkarna", country: "SWE", tier: 3, colors: ['#006633', '#FFFFFF', '#000000'], stadium: "Grimsta IP", capacity: 5000, reputation: 5 },
    { name: "Degerfors IF", country: "SWE", tier: 3, colors: ['#FF0000', '#FFFFFF', '#000000'], stadium: "Stora Valla", capacity: 12500, reputation: 5 },
    // Szwajcaria (SUI)
    { name: "FC Winterthur", country: "SUI", tier: 3, colors: ['#0000FF', '#FFFFFF', '#FF0000'], stadium: "Schützenwiese", capacity: 8500, reputation: 6 },
    { name: "FC Sion", country: "SUI", tier: 3, colors: ['#FFFFFF', '#000000', '#FF0000'], stadium: "Stade de Tourbillon", capacity: 14283, reputation: 6 },
    { name: "FC Schaffhausen", country: "SUI", tier: 3, colors: ['#000000', '#FFFFFF', '#FFD700'], stadium: "Wefox Arena Schaffhausen", capacity: 8200, reputation: 5 },
    // Turcja (TUR)
    { name: "Konyaspor", country: "TUR", tier: 3, colors: ['#006633', '#FFFFFF', '#000000'], stadium: "Konya Büyükşehir Stadium", capacity: 42076, reputation: 6 },
    { name: "Adana Demirspor", country: "TUR", tier: 3, colors: ['#0000FF', '#FFFFFF', '#FFD700'], stadium: "Yeni Adana Stadium", capacity: 33500, reputation: 6 },
    { name: "Alanyaspor", country: "TUR", tier: 3, colors: ['#FF0000', '#FFFFFF', '#000000'], stadium: "Bahçeşehir Okulları Stadium", capacity: 10842, reputation: 5 },
    // Ukraina (UKR)
    { name: "FC Oleksandriya", country: "UKR", tier: 4, colors: ['#FF0000', '#FFFFFF', '#000000'], stadium: "CSC Nika Stadium", capacity: 5682, reputation: 6 },
    { name: "FC Veres Rivne", country: "UKR", tier: 4, colors: ['#006633', '#FFFFFF', '#000000'], stadium: "Avanhard Stadium", capacity: 7200, reputation: 5 },
    { name: "FC Inhulets Petrove", country: "UKR", tier: 4, colors: ['#0000FF', '#FFFFFF', '#FF0000'], stadium: "Inhulets Stadium", capacity: 1720, reputation: 5 },
    // Walia (WAL)
    { name: "Connah's Quay Nomads", country: "WAL", tier: 4, colors: ['#FF0000', '#FFFFFF', '#000000'], stadium: "Deeside Stadium", capacity: 1500, reputation: 5 },
    { name: "Bala Town FC", country: "WAL", tier: 4, colors: ['#006633', '#FFFFFF', '#000000'], stadium: "Maes Tegid", capacity: 3000, reputation: 4 },
    { name: "Caernarfon Town", country: "WAL", tier: 4, colors: ['#0000FF', '#FFFFFF', '#FF0000'], stadium: "The Oval", capacity: 3000, reputation: 4 },
    // Rosja (RUS)
    { name: "FK Ural Jekaterynburg", country: "RUS", tier: 3, colors: ['#FF0000', '#FFFFFF', '#000000'], stadium: "Central Stadium", capacity: 35061, reputation: 6 },
    { name: "FK Orenburg", country: "RUS", tier: 3, colors: ['#006633', '#FFFFFF', '#000000'], stadium: "Gazovik Stadium", capacity: 7500, reputation: 5 },
    { name: "FK Akhmat Grozny", country: "RUS", tier: 3, colors: ['#0000FF', '#FFFFFF', '#FFD700'], stadium: "Akhmat-Arena", capacity: 30597, reputation: 6 },
    // Włochy (ITA) – tier 3, reputacja 8–11 (mid/niższe Serie A lub spadkowicze / solidni z Serie B)
    { name: "Udinese Calcio", country: "ITA", tier: 3, colors: ['#000000', '#FFFFFF', '#FFCC00'], stadium: "Bluenergy Stadium", capacity: 25132, reputation: 10 },
    { name: "Torino FC", country: "ITA", tier: 3, colors: ['#FF0000', '#000000', '#FFFFFF'], stadium: "Stadio Olimpico Grande Torino", capacity: 27994, reputation: 10 },
    { name: "Genoa CFC", country: "ITA", tier: 3, colors: ['#FF0000', '#000000', '#FFFFFF'], stadium: "Stadio Luigi Ferraris", capacity: 36585, reputation: 9 },
    // Węgry (HUN) – tier 4
    { name: "MTK Budapest", country: "HUN", tier: 3, colors: ['#0000FF', '#FFFFFF', '#FF0000'], stadium: "Hidegkuti Nándor Stadion", capacity: 5322, reputation: 6 },
    { name: "Diósgyőri VTK", country: "HUN", tier: 3, colors: ['#FF0000', '#FFFFFF', '#000000'], stadium: "Diósgyőri Stadion", capacity: 9680, reputation: 5 },
    { name: "Kecskeméti TE", country: "HUN", tier: 3, colors: ['#006633', '#FFFFFF', '#FFD700'], stadium: "Széktói Stadion", capacity: 6300, reputation: 5 },
    // Anglia (ENG) – najniżej sklasyfikowane w Premier League w danym sezonie
    { name: "Ipswich Town", country: "ENG", tier: 3, colors: ['#0000FF', '#FFFFFF', '#000000'], stadium: "Portman Road", capacity: 30311, reputation: 10 },
    { name: "Southampton FC", country: "ENG", tier: 3, colors: ['#FF0000', '#FFFFFF', '#000000'], stadium: "St Mary's Stadium", capacity: 32384, reputation: 10 },
    { name: "Leicester City", country: "ENG", tier: 3, colors: ['#0033A0', '#FFFFFF', '#FFCC00'], stadium: "King Power Stadium", capacity: 32312, reputation: 11 },
    { name: "Leeds United", country: "ENG", tier: 3, colors: ['#FFFFFF', '#1E90FF', '#FFD700'], stadium: "Elland Road", capacity: 53000, reputation: 10 },
    // Belgia (BEL) – niższe miejsce w Jupiler Pro League
    { name: "KVC Westerlo", country: "BEL", tier: 3, colors: ['#FF0000', '#FFFFFF', '#000000'], stadium: "Het Kuipje", capacity: 8035, reputation: 6 },
    { name: "KV Mechelen", country: "BEL", tier: 3, colors: ['#FF0000', '#FFFFFF', '#000000'], stadium: "AFAS Stadion", capacity: 16700, reputation: 7 },
    { name: "Sint-Truidense VV", country: "BEL", tier: 3, colors: ['#FFD700', '#000000', '#FFFFFF'], stadium: "Stayen", capacity: 14500, reputation: 7 },
    // Czarnogóra (MNE) – najwyższa liga (1. CFL)
    { name: "FK Jezero Plav", country: "MNE", tier: 4, colors: ['#006633', '#FFFFFF', '#000000'], stadium: "Stadion pod Golubinjem", capacity: 5000, reputation: 5 },
    { name: "FK Arsenal Tivat", country: "MNE", tier: 4, colors: ['#FF0000', '#FFFFFF', '#000000'], stadium: "Stadion u Parku", capacity: 2000, reputation: 5 },
    { name: "OFK Petrovac", country: "MNE", tier: 4, colors: ['#0000FF', '#FFFFFF', '#FF0000'], stadium: "Stadion pod Malim brdom", capacity: 1630, reputation: 4 },
    // Francja (FRA) – niższe miejsce w Ligue 1 / Ligue 2 spadkowicze
    { name: "Le Havre AC", country: "FRA", tier: 3, colors: ['#0000FF', '#FFFFFF', '#FF0000'], stadium: "Stade Oceane", capacity: 25178, reputation: 7 },
    { name: "Stade de Reims", country: "FRA", tier: 3, colors: ['#FF0000', '#FFFFFF', '#000000'], stadium: "Stade Auguste-Delaune", capacity: 21684, reputation: 7 },
    { name: "FC Lorient", country: "FRA", tier: 3, colors: ['#FF6600', '#000000', '#FFFFFF'], stadium: "Stade du Moustoir", capacity: 18970, reputation: 7 },
    // Grecja (GRE) – niższe miejsce w Super League
    { name: "Panetolikos GFS", country: "GRE", tier: 3, colors: ['#006633', '#FFFFFF', '#000000'], stadium: "Panetolikos Stadium", capacity: 7321, reputation: 6 },
    { name: "Panserraikos FC", country: "GRE", tier: 3, colors: ['#FFFFFF', '#000000', '#FF0000'], stadium: "Serres Municipal Stadium", capacity: 9500, reputation: 7 },
    { name: "Kallithea FC", country: "GRE", tier: 3, colors: ['#0000FF', '#FFFFFF', '#FFD700'], stadium: "Grigorios Lambrakis Stadium", capacity: 4000, reputation: 7 },
    // Hiszpania (ESP) – niższe miejsce w La Liga
    { name: "CD Leganés", country: "ESP", tier: 3, colors: ['#0000FF', '#FFFFFF', '#FF0000'], stadium: "Estadio Municipal de Butarque", capacity: 12450, reputation: 7 },
    { name: "Real Valladolid", country: "ESP", tier: 3, colors: ['#FFFFFF', '#000000', '#FF6600'], stadium: "Estadio José Zorrilla", capacity: 26512, reputation: 8 },
    { name: "UD Las Palmas", country: "ESP", tier: 3, colors: ['#FFD700', '#000000', '#FFFFFF'], stadium: "Estadio Gran Canaria", capacity: 32200, reputation: 8 },
    // Holandia (NED) – niższe miejsce w Eredivisie
    { name: "FC Volendam", country: "NED", tier: 3, colors: ['#FF6600', '#FFFFFF', '#000000'], stadium: "Kras Stadion", capacity: 7384, reputation: 6 },
    { name: "Almere City FC", country: "NED", tier: 3, colors: ['#0000FF', '#FFFFFF', '#FF0000'], stadium: "Yanmar Stadion", capacity: 4501, reputation: 5 },
    { name: "RKC Waalwijk", country: "NED", tier: 3, colors: ['#FFD700', '#000000', '#FFFFFF'], stadium: "Mandemakers Stadion", capacity: 7500, reputation: 5 },
    // Słowenia (SVN)
    { name: "NK Bravo", country: "SVN", tier: 3, colors: ['#000000', '#FFFFFF', '#FF0000'], stadium: "Štadion Stožice", capacity: 16152, reputation: 6 },
    { name: "NK Celje", country: "SVN", tier: 3, colors: ['#0057B8', '#FFD200', '#0057B8'], stadium: "Stadion Z'dežele", capacity: 13059, reputation: 6 },
    { name: "NK Domžale", country: "SVN", tier: 3, colors: ['#FFD700', '#000000', '#FFFFFF'], stadium: "Športni park Domžale", capacity: 2341, reputation: 5 },
    // Serbia (SRB)
    { name: "FK Čukarički", country: "SRB", tier: 3, colors: ['#FFFFFF', '#000000', '#FF0000'], stadium: "Stadion na Banovom brdu", capacity: 4070, reputation: 6 },
    { name: "FK Radnički 1923", country: "SRB", tier: 3, colors: ['#FF0000', '#FFFFFF', '#000000'], stadium: "Čika Dača Stadium", capacity: 15100, reputation: 6 },
    { name: "FK TSC Bačka Topola", country: "SRB", tier: 3, colors: ['#006633', '#FFFFFF', '#000000'], stadium: "TSC Arena", capacity: 4500, reputation: 6 },
];
const generateCONFClubId = (name) => {
    const slug = name
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
    return `EU_CONF_${slug}`;
};
exports.generateCONFClubId = generateCONFClubId;
