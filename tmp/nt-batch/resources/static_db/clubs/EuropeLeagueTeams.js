"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateELClubId = exports.RAW_EUROPA_LEAGUE_CLUBS = void 0;
exports.RAW_EUROPA_LEAGUE_CLUBS = [
    // Albania (ALB)
    { name: "Tirana", country: "ALB", tier: 4, colors: ['#0000FF', '#FFFFFF', '#FF0000'], stadium: "Air Albania Stadium", capacity: 22500, reputation: 6 },
    { name: "Egnatia", country: "ALB", tier: 4, colors: ['#FFFFFF', '#000000', '#FF0000'], stadium: "Arena Egnatia", capacity: 4000, reputation: 7 },
    { name: "Vllaznia Szkodra", country: "ALB", tier: 4, colors: ['#0000FF', '#FFFFFF', '#000000'], stadium: "Loro Boriçi Stadium", capacity: 16000, reputation: 7 },
    // Anglia (ENG) 
    { name: "Crystal Palace", country: "ENG", tier: 2, colors: ['#1E22AA', '#C41230', '#FFFFFF'], stadium: "Selhurst Park", capacity: 25486, reputation: 14 },
    { name: "Brighton & Hove Albion", country: "ENG", tier: 2, colors: ['#0057B8', '#FFFFFF', '#FFCD00'], stadium: "Falmer Stadium", capacity: 31876, reputation: 14 },
    { name: "Wolverhampton Wanderers", country: "ENG", tier: 2, colors: ['#FDB913', '#000000', '#FFFFFF'], stadium: "Molineux Stadium", capacity: 32050, reputation: 14 },
    { name: "Newcastle United", country: "ENG", tier: 2, colors: ['#000000', '#FFFFFF', '#41B6E6'], stadium: "St James' Park", capacity: 52305, reputation: 12 },
    { name: "Everton FC", country: "ENG", tier: 2, colors: ['#003399', '#FFFFFF', '#FF0000'], stadium: "Goodison Park", capacity: 39214, reputation: 12 },
    // Armenia (ARM)
    { name: "Ararat-Armenia", country: "ARM", tier: 4, colors: ['#FF0000', '#FFFFFF', '#000000'], stadium: "FFA Academy Stadium", capacity: 1400, reputation: 6 },
    { name: "Noah Erywań", country: "ARM", tier: 4, colors: ['#000000', '#FFD700', '#FFFFFF'], stadium: "Abovyan City Stadium", capacity: 5320, reputation: 6 },
    { name: "Pyunik Erywań", country: "ARM", tier: 4, colors: ['#FF0000', '#000000', '#FFFFFF'], stadium: "Republican Stadium after Vazgen Sargsyan", capacity: 14403, reputation: 6 },
    // Azerbejdżan (AZE)
    { name: "Neftçi Baku", country: "AZE", tier: 4, colors: ['#000000', '#FFFFFF', '#FF0000'], stadium: "Bakı Olimpiya Stadionu", capacity: 68700, reputation: 7 },
    { name: "Sabah FK", country: "AZE", tier: 4, colors: ['#0033A0', '#FFFFFF', '#FFD700'], stadium: "Bank Respublika Arena", capacity: 13000, reputation: 7 },
    { name: "Zira FK", country: "AZE", tier: 4, colors: ['#000000', '#FFFFFF', '#FF6600'], stadium: "Zirə Sport Kompleksi", capacity: 1500, reputation: 7 },
    // Austria (AUT)
    { name: "Rapid Wiedeń", country: "AUT", tier: 2, colors: ['#006600', '#FFFFFF', '#000000'], stadium: "Allianz Stadion", capacity: 28345, reputation: 13 },
    { name: "Austria Wiedeń", country: "AUT", tier: 2, colors: ['#FFFFFF', '#000000', '#990000'], stadium: "Generali Arena", capacity: 17800, reputation: 13 },
    { name: "LASK Linz", country: "AUT", tier: 2, colors: ['#000000', '#FFFFFF', '#FFCC00'], stadium: "Raiffeisen Arena", capacity: 19009, reputation: 13 },
    // Belgia (BEL) – 
    { name: "Royal Antwerp", country: "BEL", tier: 2, colors: ['#FFFFFF', '#C8102E', '#000000'], stadium: "Bosuilstadion", capacity: 23057, reputation: 12 },
    { name: "Gent", country: "BEL", tier: 2, colors: ['#006633', '#FFFFFF', '#FFCC00'], stadium: "Ghelamco Arena", capacity: 20000, reputation: 13 },
    { name: "Standard Liège", country: "BEL", tier: 2, colors: ['#FF0000', '#FFFFFF', '#000000'], stadium: "Stade Maurice Dufrasne", capacity: 30023, reputation: 13 },
    { name: "Anderlecht Bruksela", country: "BEL", tier: 2, colors: ['#FFFFFF', '#0033A0', '#FF0000'], stadium: "Lotto Park", capacity: 21000, reputation: 15 },
    { name: "KRC Genk", country: "BEL", tier: 2, colors: ['#0033A0', '#FFFFFF', '#FF0000'], stadium: "Luminus Arena", capacity: 24956, reputation: 12 },
    { name: "Club Brugge", country: "BEL", tier: 2, colors: ['#0000FF', '#FFFFFF', '#000000'], stadium: "Jan Breydel Stadium", capacity: 29000, reputation: 15 },
    // Białoruś (BLR)
    { name: "Dinamo Mińsk", country: "BLR", tier: 3, colors: ['#FFFFFF', '#0033A0', '#FF0000'], stadium: "Dinamo Stadium", capacity: 22346, reputation: 7 },
    { name: "Torpedo-BelAZ Żodzino", country: "BLR", tier: 3, colors: ['#000000', '#FFFFFF', '#FF0000'], stadium: "Torpedo Stadium", capacity: 6524, reputation: 7 },
    { name: "Neman Grodno", country: "BLR", tier: 3, colors: ['#006633', '#FFFFFF', '#000000'], stadium: "Neman Stadium", capacity: 8500, reputation: 7 },
    // Bośnia i Hercegowina (BIH) – 
    { name: "Borac Banja Luka", country: "BIH", tier: 3, colors: ['#C8102E', '#FFFFFF', '#000000'], stadium: "Gradski Stadion Banja Luka", capacity: 9730, reputation: 8 },
    { name: "FK Sarajevo", country: "BIH", tier: 3, colors: ['#0033A0', '#FFFFFF', '#FF0000'], stadium: "Asim Ferhatović Hase", capacity: 34500, reputation: 7 },
    { name: "Željezničar Sarajewo", country: "BIH", tier: 3, colors: ['#0033A0', '#FFFFFF', '#000000'], stadium: "Grbavica", capacity: 13349, reputation: 7 },
    // Bułgaria (BUL) – 
    { name: "Levski Sofia", country: "BUL", tier: 3, colors: ['#0000FF', '#FFFFFF', '#000000'], stadium: "Georgi Asparuhov Stadium", capacity: 18341, reputation: 9 },
    { name: "CSKA Sofia", country: "BUL", tier: 3, colors: ['#C8102E', '#FFFFFF', '#000000'], stadium: "Balgarska Armiya Stadium", capacity: 18191, reputation: 8 },
    { name: "Lokomotiv Płowdiw", country: "BUL", tier: 3, colors: ['#000000', '#FFFFFF', '#C8102E'], stadium: "Lokomotiv Stadium", capacity: 13000, reputation: 7 },
    // Chorwacja (CRO) – 
    { name: "Hajduk Split", country: "CRO", tier: 3, colors: ['#FFFFFF', '#0000FF', '#FF0000'], stadium: "Poljud", capacity: 34198, reputation: 10 },
    { name: "HNK Rijeka", country: "CRO", tier: 3, colors: ['#0000FF', '#FFFFFF', '#FF0000'], stadium: "Stadion Rujevica", capacity: 8279, reputation: 9 },
    { name: "NK Osijek", country: "CRO", tier: 3, colors: ['#FFFFFF', '#0033A0', '#FFCC00'], stadium: "Opus Arena", capacity: 13005, reputation: 9 },
    // Cypr (CYP) – 
    { name: "Omonia Nikozja", country: "CYP", tier: 3, colors: ['#00A651', '#FFFFFF', '#000000'], stadium: "GSP Stadium", capacity: 22859, reputation: 8 },
    { name: "AEK Larnaka", country: "CYP", tier: 3, colors: ['#0000FF', '#FFFFFF', '#FFFF00'], stadium: "AEK Arena", capacity: 7380, reputation: 9 },
    { name: "Aris Limassol", country: "CYP", tier: 3, colors: ['#00AEEF', '#FFFFFF', '#000000'], stadium: "Alphamega Stadium", capacity: 11000, reputation: 9 },
    // Czechy (CZE) – 
    { name: "Sparta Praga", country: "CZE", tier: 2, colors: ['#000000', '#FF0000', '#FFFFFF'], stadium: "Generali Česká pojišťovna Arena", capacity: 19316, reputation: 14 },
    { name: "Viktoria Pilzno", country: "CZE", tier: 2, colors: ['#FF6600', '#000000', '#FFFFFF'], stadium: "Doosan Arena", capacity: 11700, reputation: 10 },
    { name: "Baník Ostrawa", country: "CZE", tier: 2, colors: ['#000000', '#FFA500', '#FFFFFF'], stadium: "Městský stadion v Ostravě-Vítkovicích", capacity: 15275, reputation: 9 },
    // Czarnogóra (MNE) – typowe pucharowicze z 1. CFL (poziom EL/ECL qualifiers)
    { name: "Budućnost Podgorica", country: "MNE", tier: 3, colors: ['#0033A0', '#FFFFFF', '#FFCC00'], stadium: "Gradski stadion Podgorica", capacity: 15230, reputation: 7 },
    { name: "Sutjeska Nikšić", country: "MNE", tier: 3, colors: ['#FFFFFF', '#0000FF', '#FF0000'], stadium: "Gradski stadion Nikšić", capacity: 5184, reputation: 6 },
    { name: "Dečić Tuzi", country: "MNE", tier: 3, colors: ['#006633', '#FFFFFF', '#000000'], stadium: "Tuško Polje", capacity: 3000, reputation: 7 },
    // Dania (DEN) – po FC Kopenhaga
    { name: "FC Midtjylland", country: "DEN", tier: 3, colors: ['#000000', '#FF0000', '#FFFFFF'], stadium: "MCH Arena", capacity: 11432, reputation: 9 },
    { name: "Brøndby IF", country: "DEN", tier: 3, colors: ['#0000FF', '#FFFFFF', '#FFFF00'], stadium: "Brøndby Stadium", capacity: 28000, reputation: 12 },
    { name: "FC Nordsjælland", country: "DEN", tier: 3, colors: ['#FF0000', '#000000', '#FFFFFF'], stadium: "Right to Dream Park", capacity: 10300, reputation: 11 },
    //ESTONIA (EST) – więc solidni pucharowicze z Meistriliiga
    { name: "Levadia Tallinn", country: "EST", tier: 3, colors: ['#006633', '#FFFFFF', '#000000'], stadium: "Kadriorg Stadium", capacity: 5000, reputation: 5 },
    { name: "Nõmme Kalju", country: "EST", tier: 3, colors: ['#000000', '#FFFFFF', '#FF0000'], stadium: "Hiiu Stadium", capacity: 800, reputation: 5 },
    { name: "Paide Linnameeskond", country: "EST", tier: 3, colors: ['#0033A0', '#FFFFFF', '#FFD700'], stadium: "Paide linnastaadion", capacity: 268, reputation: 5 },
    // Finlandia (FIN) 
    { name: "KuPS Kuopio", country: "FIN", tier: 3, colors: ['#000000', '#FFFFFF', '#FF0000'], stadium: "Savon Sanomat Areena", capacity: 4700, reputation: 7 },
    { name: "SJK Seinäjoki", country: "FIN", tier: 3, colors: ['#FFFFFF', '#0000FF', '#FFCC00'], stadium: "OmaSP Stadion", capacity: 4300, reputation: 6 },
    { name: "Ilves Tampere", country: "FIN", tier: 3, colors: ['#006633', '#FFFFFF', '#000000'], stadium: "Tammela Stadion", capacity: 8012, reputation: 7 },
    // Francja (FRA) – 
    { name: "Lille OSC", country: "FRA", tier: 2, colors: ['#C8102E', '#FFFFFF', '#000000'], stadium: "Decathlon Arena - Stade Pierre-Mauroy", capacity: 50000, reputation: 13 },
    { name: "OGC Nice", country: "FRA", tier: 2, colors: ['#FF0000', '#000000', '#FFFFFF'], stadium: "Allianz Riviera", capacity: 35624, reputation: 13 },
    { name: "RC Lens", country: "FRA", tier: 2, colors: ['#FFD700', '#000000', '#FF0000'], stadium: "Stade Bollaert-Delelis", capacity: 38223, reputation: 13 },
    { name: "Olympique Lyon", country: "FRA", tier: 2, colors: ['#FFFFFF', '#C8102E', '#000000'], stadium: "Groupama Stadium", capacity: 59186, reputation: 14 },
    { name: "Olympique Marsylia", country: "FRA", tier: 2, colors: ['#00AEEF', '#FFFFFF', '#000000'], stadium: "Stade Vélodrome", capacity: 67394, reputation: 14 },
    // Gruzja (GEO) – 
    { name: "Dinamo Batumi", country: "GEO", tier: 4, colors: ['#000000', '#FFFFFF', '#FF0000'], stadium: "Batumi Stadium", capacity: 20000, reputation: 6 },
    { name: "Dila Gori", country: "GEO", tier: 4, colors: ['#006633', '#FFFFFF', '#FFD700'], stadium: "Tengiz Burjanadze Stadium", capacity: 5000, reputation: 6 },
    { name: "Torpedo Kutaisi", country: "GEO", tier: 4, colors: ['#0000FF', '#FFFFFF', '#000000'], stadium: "Ramaz Shengelia Stadium", capacity: 11978, reputation: 6 },
    // Grecja (GRE) – po Olympiakos (z CL)
    { name: "PAOK Saloniki", country: "GRE", tier: 2, colors: ['#000000', '#FFFFFF', '#000000'], stadium: "Toumba Stadium", capacity: 28803, reputation: 12 },
    { name: "AEK Ateny", country: "GRE", tier: 2, colors: ['#FFD700', '#000000', '#FFFFFF'], stadium: "OPAP Arena", capacity: 32500, reputation: 14 },
    { name: "Panathinaikos Ateny", country: "GRE", tier: 2, colors: ['#006633', '#FFFFFF', '#000000'], stadium: "Apostolos Nikolaidis Stadium", capacity: 68703, reputation: 14 },
    // Holandia (NED)  
    { name: "Feyenoord Rotterdam", country: "NED", tier: 2, colors: ['#FFFFFF', '#FF0000', '#000000'], stadium: "De Kuip", capacity: 51177, reputation: 14 },
    { name: "AZ Alkmaar", country: "NED", tier: 2, colors: ['#FF0000', '#FFFFFF', '#000000'], stadium: "AFAS Stadion", capacity: 19000, reputation: 11 },
    { name: "Twente Enschede", country: "NED", tier: 2, colors: ['#FF0000', '#FFFFFF', '#000000'], stadium: "De Grolsch Veste", capacity: 30000, reputation: 11 },
    // Węgry (HUN) – po Ferencváros (z CL)
    { name: "Mol Fehérvár FC", country: "HUN", tier: 3, colors: ['#0033A0', '#FFFFFF', '#FF0000'], stadium: "MOL Aréna Sóstó", capacity: 14300, reputation: 7 },
    { name: "Puskás Akadémia", country: "HUN", tier: 3, colors: ['#FFD700', '#000000', '#FFFFFF'], stadium: "Puskás Aréna", capacity: 67215, reputation: 8 }, // grają tam mecze, ale stadion akademii mniejszy
    { name: "Újpest FC", country: "HUN", tier: 3, colors: ['#9932CC', '#FFFFFF', '#000000'], stadium: "Szusza Ferenc Stadion", capacity: 13500, reputation: 9 },
    // Islandia (ISL)
    { name: "Víkingur Reykjavík", country: "ISL", tier: 4, colors: ['#D50032', '#000000', '#D50032'], stadium: "Víkingsvöllur", capacity: 1200, reputation: 7 },
    { name: "Breiðablik Kópavogur", country: "ISL", tier: 4, colors: ['#006633', '#FFFFFF', '#006633'], stadium: "Kópavogsvöllur", capacity: 5501, reputation: 6 },
    { name: "FH Hafnarfjörður", country: "ISL", tier: 4, colors: ['#0000FF', '#FFFFFF', '#000000'], stadium: "Kaplakrikavöllur", capacity: 6450, reputation: 5 },
    // Irlandia (IRL)
    { name: "Shamrock Rovers", country: "IRL", tier: 4, colors: ['#007A33', '#FFFFFF', '#007A33'], stadium: "Tallaght Stadium", capacity: 8000, reputation: 4 },
    { name: "St Patrick's Athletic", country: "IRL", tier: 4, colors: ['#FF0000', '#FFFFFF', '#000000'], stadium: "Richmond Park", capacity: 5347, reputation: 5 },
    { name: "Derry City", country: "IRL", tier: 4, colors: ['#FF0000', '#FFFFFF', '#000000'], stadium: "Brandywell Stadium", capacity: 7700, reputation: 5 },
    // Izrael (ISR)  top Ligat ha'Al
    { name: "Maccabi Tel Awiw", country: "ISR", tier: 3, colors: ['#FFD700', '#0000FF', '#FFFFFF'], stadium: "Bloomfield Stadium", capacity: 29300, reputation: 7 },
    { name: "Hapoel Beer Szewa", country: "ISR", tier: 3, colors: ['#E30613', '#FFFFFF', '#E30613'], stadium: "Turner Stadium", capacity: 16126, reputation: 8 }, // jeśli nie w CL w Twojej liście – solidny
    { name: "Maccabi Hajfa", country: "ISR", tier: 3, colors: ['#FFFFFF', '#006633', '#000000'], stadium: "Sammy Ofer Stadium", capacity: 30800, reputation: 10 },
    // Włochy (ITA) –  Serie A
    { name: "Bologna FC", country: "ITA", tier: 2, colors: ['#00529B', '#FFFFFF', '#FF0000'], stadium: "Stadio Renato Dall'Ara", capacity: 36462, reputation: 13 },
    { name: "Torino FC", country: "ITA", tier: 2, colors: ['#FF0000', '#000000', '#FFFFFF'], stadium: "Stadio Olimpico Grande Torino", capacity: 27994, reputation: 11 },
    { name: "Udinese Calcio", country: "ITA", tier: 2, colors: ['#000000', '#FFFFFF', '#FFCC00'], stadium: "Bluenergy Stadium", capacity: 25132, reputation: 12 },
    // Kazachstan (KAZ)  top Premier Liga
    { name: "Kairat Ałmaty", country: "KAZ", tier: 4, colors: ['#FFD700', '#000000', '#FFFFFF'], stadium: "Central Stadium Almaty", capacity: 23804, reputation: 4 },
    { name: "Ordabasy Szymkent", country: "KAZ", tier: 4, colors: ['#006633', '#FFFFFF', '#000000'], stadium: "Kazybek-Bi Stadium", capacity: 16400, reputation: 5 },
    { name: "Toboł Kostanaj", country: "KAZ", tier: 4, colors: ['#0000FF', '#FFFFFF', '#FF0000'], stadium: "Central Stadium Kostanay", capacity: 8320, reputation: 6 },
    // Kosowo (KOS) – top Superliga e Kosovës (najmocniejsze kluby w pucharach)
    { name: "FC Ballkani", country: "KOS", tier: 4, colors: ['#000000', '#FFFFFF', '#FF0000'], stadium: "Stadiumi Fadil Vokrri", capacity: 13500, reputation: 4 },
    { name: "FC Drita", country: "KOS", tier: 4, colors: ['#006633', '#FFFFFF', '#000000'], stadium: "Gjilan City Stadium", capacity: 10000, reputation: 4 },
    { name: "FC Prishtina", country: "KOS", tier: 4, colors: ['#0000FF', '#FFFFFF', '#FF0000'], stadium: "Stadiumi Fadil Vokrri", capacity: 13500, reputation: 4 },
    // Łotwa (LAT) – top Virslīga (po RFS Ryga z CL? – unikamy dubli, więc reszta top)
    { name: "FK Riga", country: "LAT", tier: 4, colors: ['#000000', '#FFFFFF', '#FF0000'], stadium: "Skonto Stadium", capacity: 8083, reputation: 5 },
    { name: "FK Auda", country: "LAT", tier: 4, colors: ['#006633', '#FFFFFF', '#000000'], stadium: "Skonto Stadium", capacity: 8083, reputation: 6 },
    { name: "FK Liepāja", country: "LAT", tier: 4, colors: ['#0000FF', '#FFFFFF', '#FFD700'], stadium: "Daugava Stadium Liepāja", capacity: 8000, reputation: 5 },
    // Litwa (LTU) – top A Lyga (po Žalgiris Wilno z CL – unikamy, reszta top)
    { name: "FK Kauno Žalgiris", country: "LTU", tier: 4, colors: ['#006633', '#FFFFFF', '#FFD700'], stadium: "Darius and Girėnas Stadium", capacity: 15315, reputation: 6 },
    { name: "FK Žalgiris Vilnius", country: "LTU", tier: 4, colors: ['#006633', '#FFFFFF', '#000000'], stadium: "LFF Stadium", capacity: 5400, reputation: 6 },
    { name: "FK Banga Gargždai", country: "LTU", tier: 4, colors: ['#000000', '#FFFFFF', '#FF0000'], stadium: "Gargždai Stadium", capacity: 2300, reputation: 6 },
    // Luksemburg (LUX) – top BGL Ligue (Differdange, Dudelange, UNA Strassen itp.)
    { name: "F91 Dudelange", country: "LUX", tier: 4, colors: ['#000000', '#FFFFFF', '#FF0000'], stadium: "Jos Nosbaum", capacity: 2550, reputation: 5 },
    { name: "FC Differdange 03", country: "LUX", tier: 4, colors: ['#0000FF', '#FFFFFF', '#FF0000'], stadium: "Stade Parc des Sports", capacity: 2400, reputation: 3 },
    { name: "UNA Strassen", country: "LUX", tier: 4, colors: ['#006633', '#FFFFFF', '#000000'], stadium: "Complexe Sportif Jean Wirtz", capacity: 2000, reputation: 4 },
    // Macedonia Północna (MKD) – top 1. MFL (Vardar, Shkendija, Struga dominują w 2025/26)
    { name: "FK Vardar Skopje", country: "MKD", tier: 4, colors: ['#FF0000', '#000000', '#FFFFFF'], stadium: "Toše Proeski Arena", capacity: 33000, reputation: 5 },
    { name: "KF Shkëndija Tetovo", country: "MKD", tier: 4, colors: ['#FF0000', '#000000', '#FFFFFF'], stadium: "Ecolog Arena", capacity: 15000, reputation: 5 },
    { name: "FC Struga Trim-Lum", country: "MKD", tier: 4, colors: ['#1E90FF', '#FFFFFF', '#1E90FF'], stadium: "Gradska Plaža", capacity: 8000, reputation: 5 },
    // Malta (MLT) – top Premier League (Hamrun, Floriana, Valletta, Marsaxlokk itp.)
    { name: "Hamrun Spartans", country: "MLT", tier: 4, colors: ['#FF0000', '#000000', '#FFFFFF'], stadium: "Victor Tedesco Stadium", capacity: 6000, reputation: 5 },
    { name: "Floriana FC", country: "MLT", tier: 4, colors: ['#006633', '#FFFFFF', '#000000'], stadium: "Independence Ground", capacity: 3000, reputation: 5 },
    { name: "Valletta FC", country: "MLT", tier: 4, colors: ['#FFFFFF', '#FF0000', '#000000'], stadium: "Centenary Stadium", capacity: 2000, reputation: 6 },
    // Mołdawia (MDA) – top Super Liga (Petrocub, Zimbru, Sheriff, Milsami w 2025/26)
    { name: "FC Petrocub Hîncești", country: "MDA", tier: 4, colors: ['#0000FF', '#FFFFFF', '#FF0000'], stadium: "Stadionul Municipal Hîncești", capacity: 1500, reputation: 5 },
    { name: "FC Zimbru Chișinău", country: "MDA", tier: 4, colors: ['#FFD700', '#000000', '#FFFFFF'], stadium: "Stadionul Zimbru", capacity: 10500, reputation: 5 },
    { name: "FC Milsami Orhei", country: "MDA", tier: 4, colors: ['#0033A0', '#FFFFFF', '#FFCC00'], stadium: "Complexul Sportiv Raional Orhei", capacity: 2500, reputation: 4 },
    // Norwegia (NOR) – top Eliteserien (Bodø/Glimt już w CL, więc reszta mocnych: Molde, Viking, Brann, Rosenborg, Lillestrøm itp.)
    { name: "Molde FK", country: "NOR", tier: 4, colors: ['#FFFFFF', '#0000FF', '#000000'], stadium: "Aker Stadion", capacity: 11249, reputation: 10 },
    { name: "SK Brann Bergen", country: "NOR", tier: 4, colors: ['#FF0000', '#FFFFFF', '#000000'], stadium: "Brann Stadion", capacity: 17767, reputation: 9 },
    { name: "Rosenborg BK", country: "NOR", tier: 4, colors: ['#000000', '#FFFFFF', '#000000'], stadium: "Lerkendal Stadion", capacity: 21421, reputation: 9 },
    // Rumunia (ROU) – top Liga I / SuperLiga (aktualnie liderzy: U Craiova, Rapid, U Cluj, Dinamo, CFR itd.)
    { name: "Universitatea Craiova", country: "ROU", tier: 3, colors: ['#0000FF', '#FFFFFF', '#FFD700'], stadium: "Ion Oblemenco Stadium", capacity: 30000, reputation: 9 },
    { name: "FC Rapid București", country: "ROU", tier: 3, colors: ['#000000', '#FFFFFF', '#C8102E'], stadium: "Rapid-Giulești Stadium", capacity: 14047, reputation: 9 },
    { name: "Universitatea Cluj", country: "ROU", tier: 3, colors: ['#FFFFFF', '#0000FF', '#FF0000'], stadium: "Cluj Arena", capacity: 30201, reputation: 8 },
    // Szkocja (SCO) – top Premiership (aktualnie Hearts lider, Celtic/Rangers blisko, Motherwell, Hibs itd.; Celtic w CL?)
    { name: "Heart of Midlothian", country: "SCO", tier: 3, colors: ['#8B0000', '#FFFFFF', '#FFD700'], stadium: "Tynecastle Park", capacity: 20099, reputation: 9 },
    { name: "Motherwell FC", country: "SCO", tier: 3, colors: ['#FF0000', '#FFFFFF', '#000000'], stadium: "Fir Park", capacity: 13677, reputation: 8 },
    { name: "Hibernian FC", country: "SCO", tier: 3, colors: ['#006633', '#FFFFFF', '#000000'], stadium: "Easter Road", capacity: 20421, reputation: 8 },
    { name: 'Glasgow Rangers', country: 'SCO', tier: 2, colors: ['#0000FF', '#FFFFFF', '#000000'], stadium: 'Ibrox Stadium', capacity: 50000, reputation: 13 },
    // Słowacja (SVK) – top Super Liga (Slovan w CL? – unikamy, reszta: DAC, Žilina, Spartak Trnava, Podbrezová)
    { name: "FC DAC 1904 Dunajská Streda", country: "SVK", tier: 3, colors: ['#FFD700', '#000000', '#FFFFFF'], stadium: "MOL Aréna", capacity: 12500, reputation: 8 },
    { name: "MŠK Žilina", country: "SVK", tier: 3, colors: ['#006633', '#FFFFFF', '#000000'], stadium: "Štadión pod Dubňom", capacity: 11258, reputation: 8 },
    { name: "Spartak Trnava", country: "SVK", tier: 3, colors: ['#FFFFFF', '#FF0000', '#000000'], stadium: "City Arena – Štadión Antona Malatinského", capacity: 19200, reputation: 8 },
    // Portugalia (POR) – top Primeira Liga (Porto/Benfica/Sporting w CL, więc mid-top: Braga, Gil Vicente, Famalicão, Moreirense, Estoril)
    { name: "SC Braga", country: "POR", tier: 3, colors: ['#FF0000', '#FFFFFF', '#000000'], stadium: "Estádio Municipal de Braga", capacity: 30186, reputation: 12 },
    { name: "FC Famalicão", country: "POR", tier: 3, colors: ['#FFFFFF', '#0000FF', '#FF0000'], stadium: "Estádio Municipal 22 de Junho", capacity: 5307, reputation: 13 },
    { name: "Moreirense FC", country: "POR", tier: 3, colors: ['#006633', '#FFFFFF', '#000000'], stadium: "Estádio Comendador Joaquim de Almeida Freitas", capacity: 6153, reputation: 12 },
    // Rosja (RUS) – mocne kluby z RPL poza Zenit/CSKA/Spartak
    { name: "FK Krasnodar", country: "RUS", tier: 2, colors: ['#000000', '#FFFFFF', '#006633'], stadium: "Krasnodar Stadium", capacity: 35574, reputation: 13 },
    { name: "Lokomotiw Moskwa", country: "RUS", tier: 2, colors: ['#FF0000', '#000000', '#FFFFFF'], stadium: "RZD Arena", capacity: 28800, reputation: 12 },
    { name: "Dynamo Moskwa", country: "RUS", tier: 2, colors: ['#0033A0', '#FFFFFF', '#000000'], stadium: "VTB Arena", capacity: 26047, reputation: 12 },
    // Szwecja (SWE) – po Malmö FF i Häcken (z CL), aktualnie mocne: Mjällby, Hammarby, GAIS, Elfsborg, Djurgården itd.
    { name: "Mjällby AIF", country: "SWE", tier: 4, colors: ['#000000', '#FFFFFF', '#FFD700'], stadium: "Strandvallen", capacity: 7500, reputation: 10 },
    { name: "Hammarby IF", country: "SWE", tier: 4, colors: ['#006633', '#FFFFFF', '#000000'], stadium: "3Arena", capacity: 33000, reputation: 10 },
    { name: "GAIS Göteborg", country: "SWE", tier: 4, colors: ['#000000', '#FFFFFF', '#FF0000'], stadium: "Gamla Ullevi", capacity: 18454, reputation: 9 },
    // Szwajcaria (SUI) – po Young Boys i Basel (z CL), aktualnie liderzy: Thun, St. Gallen, Lugano, Sion
    { name: "FC Thun", country: "SUI", tier: 4, colors: ['#006633', '#FFFFFF', '#FFD700'], stadium: "Arena Thun", capacity: 10300, reputation: 10 },
    { name: "FC St. Gallen", country: "SUI", tier: 4, colors: ['#006633', '#FFFFFF', '#000000'], stadium: "Kybunpark", capacity: 19456, reputation: 10 },
    { name: "FC Lugano", country: "SUI", tier: 4, colors: ['#000000', '#FFFFFF', '#0000FF'], stadium: "Cornaredo Stadium", capacity: 6310, reputation: 9 },
    // Turcja (TUR) – po Galatasaray, Fenerbahçe (z CL), aktualnie top: Trabzonspor, Beşiktaş, Başakşehir, Göztepe
    { name: "Trabzonspor", country: "TUR", tier: 4, colors: ['#C8102E', '#FFFFFF', '#000000'], stadium: "Şenol Güneş Spor Kompleksi", capacity: 40882, reputation: 11 },
    { name: "Beşiktaş JK", country: "TUR", tier: 4, colors: ['#000000', '#FFFFFF', '#FF0000'], stadium: "Vodafone Park", capacity: 41588, reputation: 11 },
    { name: "İstanbul Başakşehir", country: "TUR", tier: 4, colors: ['#FFD700', '#000000', '#FFFFFF'], stadium: "Başakşehir Fatih Terim Stadium", capacity: 17319, reputation: 10 },
    // Ukraina (UKR) – po Szachtar i Dynamo (z CL), aktualnie mocne: LNZ Cherkasy, Polissya Zhytomyr, Kryvbas, Metalist 1925
    { name: "LNZ Cherkasy", country: "UKR", tier: 4, colors: ['#0000FF', '#FFFFFF', '#000000'], stadium: "Cherkasy Arena", capacity: 10321, reputation: 8 },
    { name: "Polissya Zhytomyr", country: "UKR", tier: 4, colors: ['#006633', '#FFFFFF', '#FFD700'], stadium: "Stadion im. O. Oleksandriya", capacity: 5926, reputation: 8 },
    { name: "Kryvbas Kryvyj Rih", country: "UKR", tier: 4, colors: ['#FF0000', '#FFFFFF', '#000000'], stadium: "Hirnyk Stadium", capacity: 2500, reputation: 8 },
    // Walia (WAL) – top Cymru Premier (liderzy: The New Saints, Connah's Quay, Penybont, Colwyn Bay, Caernarfon)
    { name: "The New Saints", country: "WAL", tier: 4, colors: ['#00A650', '#FFFFFF', '#00A650'], stadium: "Park Hall", capacity: 2034, reputation: 5 },
    { name: "Connah's Quay Nomads", country: "WAL", tier: 4, colors: ['#FF0000', '#FFFFFF', '#000000'], stadium: "Deeside Stadium", capacity: 1500, reputation: 5 },
    { name: "Penybont FC", country: "WAL", tier: 4, colors: ['#006633', '#FFFFFF', '#000000'], stadium: "SDA Wales Stadium", capacity: 1000, reputation: 4 },
    // Andora (AND) – najsłabsza federacja, reputacja max 4–5
    { name: "FC Santa Coloma", country: "AND", tier: 4, colors: ['#0000FF', '#FFFFFF', '#FF0000'], stadium: "Camp Nou Municipal d'Andorra", capacity: 500, reputation: 2 },
    { name: "Inter Club d'Escaldes", country: "AND", tier: 4, colors: ['#006633', '#FFFFFF', '#000000'], stadium: "Camp de Futbol d'Aixovall", capacity: 1000, reputation: 2 },
    { name: "Atlètic Club d'Escaldes", country: "AND", tier: 4, colors: ['#FF0000', '#FFFFFF', '#000000'], stadium: "Camp de Futbol d'Aixovall", capacity: 1000, reputation: 2 },
    // Gibraltar (GIB) – po Lincoln Red Imps (z CL)
    { name: "Europa FC", country: "GIB", tier: 4, colors: ['#000000', '#FFFFFF', '#FFD700'], stadium: "Victoria Stadium", capacity: 5000, reputation: 1 },
    { name: "Bruno's Magpies", country: "GIB", tier: 4, colors: ['#0000FF', '#FFFFFF', '#FF0000'], stadium: "Victoria Stadium", capacity: 5000, reputation: 1 },
    { name: "Manchester 62", country: "GIB", tier: 4, colors: ['#FF0000', '#FFFFFF', '#000000'], stadium: "Victoria Stadium", capacity: 5000, reputation: 1 },
    // Liechtenstein (LIE) – tylko jedna liga (w Szwajcarii), ale pucharowicze
    { name: "FC Vaduz", country: "LIE", tier: 4, colors: ['#FF0000', '#000000', '#FFFFFF'], stadium: "Rheinpark Stadion", capacity: 7838, reputation: 2 },
    { name: "USV Eschen/Mauren", country: "LIE", tier: 4, colors: ['#006633', '#FFFFFF', '#000000'], stadium: "Sportpark Eschen-Mauren", capacity: 2000, reputation: 2 },
    { name: "FC Balzers", country: "LIE", tier: 4, colors: ['#0000FF', '#FFFFFF', '#FFD700'], stadium: "Sportanlage Rheinau", capacity: 2000, reputation: 2 },
    // San Marino (SMR) – najsłabsza federacja w Europie
    { name: "La Fiorita", country: "SMR", tier: 4, colors: ['#006633', '#FFFFFF', '#000000'], stadium: "Stadio Olimpico di Serravalle", capacity: 7000, reputation: 1 },
    { name: "Tre Penne", country: "SMR", tier: 4, colors: ['#0000FF', '#FFFFFF', '#FF0000'], stadium: "Stadio Olimpico di Serravalle", capacity: 7000, reputation: 1 },
    { name: "Virtus Acquaviva", country: "SMR", tier: 4, colors: ['#FF0000', '#FFFFFF', '#000000'], stadium: "Stadio Olimpico di Serravalle", capacity: 7000, reputation: 1 },
    // Wyspy Owcze (FRO) – po KÍ Klaksvík (z CL)
    { name: "HB Tórshavn", country: "FRO", tier: 4, colors: ['#000000', '#FFFFFF', '#FF0000'], stadium: "Tórsvøllur", capacity: 6000, reputation: 1 },
    { name: "Víkingur Gøta", country: "FRO", tier: 4, colors: ['#0000FF', '#FFFFFF', '#FFD700'], stadium: "Sarpugerði", capacity: 3000, reputation: 1 },
    { name: "B36 Tórshavn", country: "FRO", tier: 4, colors: ['#FFD700', '#000000', '#FFFFFF'], stadium: "Gundadalur", capacity: 5000, reputation: 1 },
    // Niemcy (GER) – mid-table Bundesliga (po Bayern, Dortmund, Leverkusen, RB Lipsk, Union Berlin, Gladbach z CL)
    { name: "VfB Stuttgart", country: "GER", tier: 2, colors: ['#FFFFFF', '#FF0000', '#000000'], stadium: "MHPArena", capacity: 60449, reputation: 13 },
    { name: "Eintracht Frankfurt", country: "GER", tier: 2, colors: ['#000000', '#FFFFFF', '#E1001A'], stadium: "Deutsche Bank Park", capacity: 51500, reputation: 13 }, // już był w CL, ale jeśli chcesz mid
    { name: "SC Freiburg", country: "GER", tier: 2, colors: ['#FF0000', '#FFFFFF', '#000000'], stadium: "Europa-Park Stadion", capacity: 34700, reputation: 12 },
    { name: "1. FC Köln", country: "GER", tier: 2, colors: ['#FF0000', '#FFFFFF', '#000000'], stadium: "RheinEnergieStadion", capacity: 50000, reputation: 12 },
    { name: "VfL Wolfsburg", country: "GER", tier: 2, colors: ['#00A650', '#FFFFFF', '#000000'], stadium: "Volkswagen Arena", capacity: 30000, reputation: 12 },
    // Hiszpania (ESP) – mid-table La Liga (po Real, Barca, Atletico, Athletic, Sevilla, Villarreal z CL)
    { name: "Real Sociedad", country: "ESP", tier: 2, colors: ['#0033A0', '#FFFFFF', '#FF0000'], stadium: "Reale Arena", capacity: 40000, reputation: 14 },
    { name: "Valencia CF", country: "ESP", tier: 2, colors: ['#FFFFFF', '#FF0000', '#000000'], stadium: "Mestalla", capacity: 49000, reputation: 13 },
    { name: "Real Betis", country: "ESP", tier: 2, colors: ['#006633', '#FFFFFF', '#FFD700'], stadium: "Benito Villamarín", capacity: 60720, reputation: 13 },
    // Słowenia (SVN) – mocne z PrvaLiga Telemach
    { name: "NK Koper", country: "SVN", tier: 3, colors: ['#0000FF', '#FFFFFF', '#FF0000'], stadium: "Štadion Bonifika", capacity: 4010, reputation: 8 },
    { name: "NK Aluminij", country: "SVN", tier: 3, colors: ['#FFFFFF', '#000000', '#FF0000'], stadium: "Aluminij Sports Park", capacity: 1200, reputation: 8 },
    { name: "NS Mura", country: "SVN", tier: 3, colors: ['#000000', '#FFFFFF', '#FFD700'], stadium: "Fazanerija City Stadium", capacity: 4120, reputation: 8 },
    // Serbia (SRB) – mocne z SuperLiga Srbije (po Crvena Zvezda, Partizan)
    { name: "FK Vojvodina Novi Sad", country: "SRB", tier: 3, colors: ['#FF0000', '#FFFFFF', '#000000'], stadium: "Karađorđe Stadium", capacity: 14458, reputation: 8 },
    { name: "FK Novi Pazar", country: "SRB", tier: 3, colors: ['#006633', '#FFFFFF', '#FFD700'], stadium: "Stadion Novi Pazar", capacity: 12000, reputation: 8 },
    { name: "FK TSC Bačka Topola", country: "SRB", tier: 3, colors: ['#006633', '#FFFFFF', '#000000'], stadium: "TSC Arena", capacity: 4500, reputation: 8 },
    { name: "Partizan Belgrad", country: "SRB", tier: 3, colors: ['#000000', '#FFFFFF', '#FF0000'], stadium: "Stadion Partizana", capacity: 32000, reputation: 10 },
];
const generateELClubId = (name) => {
    const slug = name
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
    return `EU_EL_${slug}`;
};
exports.generateELClubId = generateELClubId;
