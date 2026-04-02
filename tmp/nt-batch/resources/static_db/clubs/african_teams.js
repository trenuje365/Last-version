"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAfricanClubId = exports.CLUBS_AFRICAN = void 0;
exports.CLUBS_AFRICAN = [
    // === Egipt – najsilniejsza reprezentacja ===
    {
        name: "Al Ahly",
        country: "EGY",
        tier: 2,
        colors: ["#E30613", "#FFFFFF"],
        stadium: "Cairo International Stadium",
        capacity: 75000,
        reputation: 10
    },
    {
        name: "Pyramids FC",
        country: "EGY",
        tier: 2,
        colors: ["#E30613", "#000000"],
        stadium: "30 June Stadium",
        capacity: 75000,
        reputation: 10
    },
    {
        name: "Zamalek",
        country: "EGY",
        tier: 1,
        colors: ["#FFFFFF", "#E30613"],
        stadium: "Cairo International Stadium",
        capacity: 75000,
        reputation: 9
    },
    // === Południowa Afryka ===
    {
        name: "Mamelodi Sundowns",
        country: "RSA",
        tier: 2,
        colors: ["#003087", "#FFD700"],
        stadium: "Loftus Versfeld Stadium",
        capacity: 51900,
        reputation: 10
    },
    {
        name: "Orlando Pirates",
        country: "RSA",
        tier: 2,
        colors: ["#000000", "#E30613"],
        stadium: "Orlando Stadium",
        capacity: 40000,
        reputation: 9
    },
    {
        name: "Kaizer Chiefs",
        country: "RSA",
        tier: 2,
        colors: ["#000000", "#FFD700"],
        stadium: "FNB Stadium (Soccer City)",
        capacity: 94736,
        reputation: 9
    },
    // === Maroko ===
    {
        name: "Wydad AC",
        country: "MAR",
        tier: 2,
        colors: ["#E30613", "#FFFFFF"],
        stadium: "Stade Mohammed V",
        capacity: 68000,
        reputation: 9
    },
    {
        name: "Raja Club Athletic",
        country: "MAR",
        tier: 2,
        colors: ["#009900", "#FFFFFF"],
        stadium: "Stade Mohammed V",
        capacity: 68000,
        reputation: 9
    },
    {
        name: "RS Berkane",
        country: "MAR",
        tier: 2,
        colors: ["#E30613", "#FFD700"],
        stadium: "Stade Municipal de Berkane",
        capacity: 15000,
        reputation: 8
    },
    {
        name: "AS FAR Rabat",
        country: "MAR",
        tier: 2,
        colors: ["#003087", "#E30613"],
        stadium: "Prince Moulay Abdellah Stadium",
        capacity: 52000,
        reputation: 8
    },
    // === Tunezja ===
    {
        name: "Espérance de Tunis",
        country: "TUN",
        tier: 2,
        colors: ["#E30613", "#FFD700"],
        stadium: "Stade Olympique de Radès",
        capacity: 65000,
        reputation: 9
    },
    {
        name: "Club Africain",
        country: "TUN",
        tier: 2,
        colors: ["#E30613", "#FFFFFF"],
        stadium: "Stade Olympique de Radès",
        capacity: 65000,
        reputation: 8
    },
    // === Algieria ===
    {
        name: "USM Alger",
        country: "ALG",
        tier: 2,
        colors: ["#E30613", "#FFFFFF"],
        stadium: "Stade du 5 Juillet 1962",
        capacity: 64000,
        reputation: 8
    },
    {
        name: "CR Belouizdad",
        country: "ALG",
        tier: 2,
        colors: ["#E30613", "#000000"],
        stadium: "Stade du 20 Août 1955",
        capacity: 20000,
        reputation: 8
    },
    {
        name: "MC Alger",
        country: "ALG",
        tier: 2,
        colors: ["#008000", "#FFFFFF"],
        stadium: "Stade du 5 Juillet 1962",
        capacity: 64000,
        reputation: 8
    },
    // === Inne mocne kluby z Afryki (regularnie w CAF) ===
    {
        name: "Simba SC",
        country: "TZA",
        tier: 2,
        colors: ["#E30613", "#FFFFFF"],
        stadium: "Benjamin Mkapa Stadium",
        capacity: 60000,
        reputation: 8
    },
    {
        name: "Young Africans (Yanga)",
        country: "TZA",
        tier: 2,
        colors: ["#00AEEF", "#FFD700"],
        stadium: "Benjamin Mkapa Stadium",
        capacity: 60000,
        reputation: 8
    },
    {
        name: "TP Mazembe",
        country: "COD",
        tier: 2,
        colors: ["#000000", "#FFFFFF"],
        stadium: "Stade TP Mazembe",
        capacity: 18000,
        reputation: 8
    }
];
const generateAfricanClubId = (name) => 'AFR_' + name.toUpperCase().replace(/[^A-Z0-9]/g, '_');
exports.generateAfricanClubId = generateAfricanClubId;
