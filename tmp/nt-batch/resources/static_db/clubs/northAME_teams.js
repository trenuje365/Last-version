"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateNorthAmericaClubId = exports.CLUBS_NORTH_AMERICA = void 0;
exports.CLUBS_NORTH_AMERICA = [
    // === Meksyk - Liga MX (najsilniejsza liga w CONCACAF) ===
    {
        name: "Club América",
        country: "MEX",
        tier: 2,
        colors: ["#FFCC00", "#000000"],
        stadium: "Estadio Azteca",
        capacity: 87428,
        reputation: 10
    },
    {
        name: "Cruz Azul",
        country: "MEX",
        tier: 2,
        colors: ["#004B9F", "#FFFFFF"],
        stadium: "Estadio Azteca",
        capacity: 87428,
        reputation: 10
    },
    {
        name: "Tigres UANL",
        country: "MEX",
        tier: 2,
        colors: ["#E30613", "#FFD700"],
        stadium: "Estadio Universitario",
        capacity: 41890,
        reputation: 10
    },
    {
        name: "CF Monterrey",
        country: "MEX",
        tier: 2,
        colors: ["#003087", "#FFFFFF"],
        stadium: "Estadio BBVA",
        capacity: 53500,
        reputation: 9
    },
    {
        name: "Deportivo Toluca",
        country: "MEX",
        tier: 2,
        colors: ["#E30613", "#FFFFFF"],
        stadium: "Estadio Nemesio Díez",
        capacity: 30000,
        reputation: 9
    },
    {
        name: "Chivas Guadalajara",
        country: "MEX",
        tier: 2,
        colors: ["#E30613", "#FFFFFF"],
        stadium: "Estadio Akron",
        capacity: 49850,
        reputation: 9
    },
    {
        name: "Pumas UNAM",
        country: "MEX",
        tier: 2,
        colors: ["#003087", "#FFD700"],
        stadium: "Estadio Olímpico Universitario",
        capacity: 72000,
        reputation: 9
    },
    {
        name: "Pachuca",
        country: "MEX",
        tier: 2,
        colors: ["#003087", "#FFFFFF"],
        stadium: "Estadio Hidalgo",
        capacity: 30000,
        reputation: 8
    },
    // === USA - MLS (główna siła) ===
    {
        name: "Inter Miami CF",
        country: "USA",
        tier: 2,
        colors: ["#FF6F00", "#000000"],
        stadium: "Chase Stadium",
        capacity: 21550,
        reputation: 11
    },
    {
        name: "LAFC",
        country: "USA",
        tier: 2,
        colors: ["#000000", "#E30613"],
        stadium: "BMO Stadium",
        capacity: 22000,
        reputation: 9
    },
    {
        name: "LA Galaxy",
        country: "USA",
        tier: 2,
        colors: ["#003087", "#FFD700"],
        stadium: "Dignity Health Sports Park",
        capacity: 27000,
        reputation: 11
    },
    {
        name: "Seattle Sounders FC",
        country: "USA",
        tier: 2,
        colors: ["#00AEEF", "#003087"],
        stadium: "Lumen Field",
        capacity: 68740,
        reputation: 8
    },
    {
        name: "FC Cincinnati",
        country: "USA",
        tier: 2,
        colors: ["#E30613", "#003087"],
        stadium: "TQL Stadium",
        capacity: 26000,
        reputation: 8
    },
    {
        name: "Columbus Crew",
        country: "USA",
        tier: 2,
        colors: ["#FFD700", "#000000"],
        stadium: "Lower.com Field",
        capacity: 20500,
        reputation: 8
    },
    {
        name: "Nashville SC",
        country: "USA",
        tier: 2,
        colors: ["#E30613", "#FFFFFF"],
        stadium: "GEODIS Park",
        capacity: 30000,
        reputation: 8
    },
    {
        name: "New York City FC",
        country: "USA",
        tier: 2,
        colors: ["#00AEEF", "#FFFFFF"],
        stadium: "Yankee Stadium",
        capacity: 47300,
        reputation: 7
    },
    {
        name: "Philadelphia Union",
        country: "USA",
        tier: 3,
        colors: ["#003087", "#E30613"],
        stadium: "Subaru Park",
        capacity: 18500,
        reputation: 7
    },
    {
        name: "Orlando City SC",
        country: "USA",
        tier: 3,
        colors: ["#003087", "#E30613"],
        stadium: "Inter&Co Stadium",
        capacity: 25500,
        reputation: 7
    },
    // === Kanada - MLS + CPL (tak, Kanada ma dobre drużyny!) ===
    {
        name: "Vancouver Whitecaps FC",
        country: "CAN",
        tier: 2,
        colors: ["#003087", "#FFFFFF"],
        stadium: "BC Place",
        capacity: 22120,
        reputation: 8
    },
    {
        name: "Toronto FC",
        country: "CAN",
        tier: 2,
        colors: ["#E30613", "#FFFFFF"],
        stadium: "BMO Field",
        capacity: 28500,
        reputation: 8
    },
    {
        name: "CF Montréal",
        country: "CAN",
        tier: 3,
        colors: ["#003087", "#E30613"],
        stadium: "Stade Saputo",
        capacity: 19619,
        reputation: 7
    },
    // Canadian Premier League (CPL) - popularne i utytułowane drużyny
    {
        name: "Forge FC",
        country: "CAN",
        tier: 3,
        colors: ["#E30613", "#000000"],
        stadium: "Tim Hortons Field",
        capacity: 23000,
        reputation: 7
    },
    {
        name: "Cavalry FC",
        country: "CAN",
        tier: 3,
        colors: ["#003087", "#FFD700"],
        stadium: "ATCO Field",
        capacity: 6000,
        reputation: 7
    },
    {
        name: "Chicago Fire FC",
        country: "USA",
        tier: 3,
        colors: ["#E30613", "#003087"],
        stadium: "Soldier Field",
        capacity: 61500,
        reputation: 7
    },
    {
        name: "Atlético Ottawa",
        country: "CAN",
        tier: 3,
        colors: ["#E30613", "#FFFFFF"],
        stadium: "TD Place Stadium",
        capacity: 24000,
        reputation: 6
    }
];
const generateNorthAmericaClubId = (name) => 'NA_' + name.toUpperCase().replace(/[^A-Z0-9]/g, '_');
exports.generateNorthAmericaClubId = generateNorthAmericaClubId;
