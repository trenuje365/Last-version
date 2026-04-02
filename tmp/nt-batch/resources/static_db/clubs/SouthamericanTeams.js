"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSAClubId = exports.CLUBS_SOUTH_AMERICA = void 0;
exports.CLUBS_SOUTH_AMERICA = [
    // Argentyna
    {
        name: "River Plate",
        country: "ARG",
        tier: 1,
        colors: ["#FFFFFF", "#E30613", "#000000"],
        stadium: "Estadio Más Monumental",
        capacity: 85018,
        reputation: 19
    },
    {
        name: "Boca Juniors",
        country: "ARG",
        tier: 1,
        colors: ["#003087", "#F5C518", "#FFFFFF"],
        stadium: "La Bombonera",
        capacity: 57200,
        reputation: 19
    },
    {
        name: "Racing Club",
        country: "ARG",
        tier: 2,
        colors: ["#003087", "#FFFFFF", "#E30613"],
        stadium: "Estadio Presidente Perón",
        capacity: 55000,
        reputation: 16
    },
    {
        name: "Independiente",
        country: "ARG",
        tier: 2,
        colors: ["#E30613", "#FFFFFF"],
        stadium: "Estadio Libertadores de América",
        capacity: 42000,
        reputation: 15
    },
    {
        name: "San Lorenzo",
        country: "ARG",
        tier: 2,
        colors: ["#E30613", "#000000", "#FFFFFF"],
        stadium: "Estadio Pedro Bidegain",
        capacity: 47000,
        reputation: 14
    },
    // Brazylia
    {
        name: "Flamengo",
        country: "BRA",
        tier: 1,
        colors: ["#E30613", "#000000", "#F5C518"],
        stadium: "Maracanã",
        capacity: 78838,
        reputation: 20
    },
    {
        name: "Palmeiras",
        country: "BRA",
        tier: 1,
        colors: ["#006633", "#FFFFFF"],
        stadium: "Allianz Parque",
        capacity: 43713,
        reputation: 19
    },
    {
        name: "São Paulo",
        country: "BRA",
        tier: 2,
        colors: ["#E30613", "#FFFFFF", "#000000"],
        stadium: "Morumbi",
        capacity: 66795,
        reputation: 17
    },
    {
        name: "Fluminense",
        country: "BRA",
        tier: 2,
        colors: ["#E30613", "#008000", "#FFFFFF"],
        stadium: "Maracanã",
        capacity: 78838,
        reputation: 16
    },
    {
        name: "Botafogo",
        country: "BRA",
        tier: 2,
        colors: ["#000000", "#FFFFFF"],
        stadium: "Nilton Santos",
        capacity: 46000,
        reputation: 15
    },
    {
        name: "Atlético Mineiro",
        country: "BRA",
        tier: 2,
        colors: ["#000000", "#FFFFFF", "#E30613"],
        stadium: "Arena MRV",
        capacity: 47000,
        reputation: 15
    },
    // Urugwaj
    {
        name: "Peñarol",
        country: "URU",
        tier: 2,
        colors: ["#000000", "#F5C518"],
        stadium: "Estadio Campeón del Siglo",
        capacity: 42000,
        reputation: 15
    },
    {
        name: "Nacional",
        country: "URU",
        tier: 2,
        colors: ["#E30613", "#FFFFFF"],
        stadium: "Estadio Gran Parque Central",
        capacity: 34000,
        reputation: 14
    },
    // Kolumbia
    {
        name: "Atlético Nacional",
        country: "COL",
        tier: 2,
        colors: ["#008000", "#FFFFFF"],
        stadium: "Atanasio Girardot",
        capacity: 40500,
        reputation: 13
    },
    {
        name: "Millonarios",
        country: "COL",
        tier: 2,
        colors: ["#003087", "#FFFFFF"],
        stadium: "El Campín",
        capacity: 36000,
        reputation: 13
    },
    // Ekwador
    {
        name: "LDU Quito",
        country: "ECU",
        tier: 2,
        colors: ["#003087", "#FFFFFF", "#E30613"],
        stadium: "Rodrigo Paz Delgado",
        capacity: 41083,
        reputation: 13
    },
    {
        name: "Barcelona SC",
        country: "ECU",
        tier: 2,
        colors: ["#F5C518", "#003087"],
        stadium: "Monumental Banco Pichincha",
        capacity: 57000,
        reputation: 12
    },
    {
        name: "Independiente del Valle",
        country: "ECU",
        tier: 2,
        colors: ["#E30613", "#FFFFFF"],
        stadium: "Banco Guayaquil",
        capacity: 12000,
        reputation: 13
    },
    // Pozostałe kraje
    {
        name: "Olimpia",
        country: "PAR",
        tier: 2,
        colors: ["#000000", "#FFFFFF"],
        stadium: "Defensores del Chaco",
        capacity: 42000,
        reputation: 11
    },
    {
        name: "Colo-Colo",
        country: "CHI",
        tier: 2,
        colors: ["#000000", "#FFFFFF"],
        stadium: "Monumental David Arellano",
        capacity: 47347,
        reputation: 12
    },
    {
        name: "Universitario",
        country: "PER",
        tier: 4,
        colors: ["#E30613", "#FFFFFF"],
        stadium: "Estadio Monumental",
        capacity: 80093,
        reputation: 10
    },
    {
        name: "Bolívar",
        country: "BOL",
        tier: 2,
        colors: ["#003087", "#FFFFFF"],
        stadium: "Hernando Siles",
        capacity: 41000,
        reputation: 8
    },
];
const generateSAClubId = (name) => 'SA_' + name.toUpperCase().replace(/[^A-Z0-9]/g, '_');
exports.generateSAClubId = generateSAClubId;
