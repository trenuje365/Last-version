export const PolandWeatherService = {
    getWeather: (date, seedStr) => {
        const month = date.getMonth(); // 0-11
        // Multi-seed hash: trzy niezależne wartości losowe z jednego seeda
        let hash = 0;
        for (let i = 0; i < seedStr.length; i++) {
            hash = ((hash << 5) - hash) + seedStr.charCodeAt(i);
            hash |= 0;
        }
        const r1 = (Math.abs(hash) % 10000) / 10000; // typ pogody
        const r2 = (Math.abs(hash * 1664525 + 1013904223) % 10000) / 10000; // temperatura
        const r3 = (Math.abs(hash * 22695477 + 1) % 10000) / 10000; // wiatr
        // Zakresy temperatur miesięczne (Warszawa)
        const tempConfigs = {
            0: { minT: -8, maxT: 3 }, // Sty
            1: { minT: -6, maxT: 5 }, // Lut
            2: { minT: -1, maxT: 10 }, // Mar
            3: { minT: 4, maxT: 16 }, // Kwi
            4: { minT: 9, maxT: 21 }, // Maj
            5: { minT: 13, maxT: 25 }, // Cze
            6: { minT: 15, maxT: 27 }, // Lip
            7: { minT: 14, maxT: 26 }, // Sie
            8: { minT: 9, maxT: 20 }, // Wrz
            9: { minT: 4, maxT: 14 }, // Paź
            10: { minT: 0, maxT: 8 }, // Lis
            11: { minT: -4, maxT: 4 }, // Gru
        };
        const tc = tempConfigs[month];
        const tempC = Math.floor(tc.minT + r2 * (tc.maxT - tc.minT));
        const windKmh = Math.floor(r3 * 55); // 0–55 km/h
        let description;
        let precipitationChance;
        let weatherIntensity;
        // === ZIMA: Grudzień, Styczeń, Luty ===
        if (month === 0 || month === 1 || month === 11) {
            if (r1 < 0.07) {
                description = "Zamieć śnieżna";
                precipitationChance = 100;
                weatherIntensity = 1.0;
            }
            else if (r1 < 0.20) {
                description = "Intensywne opady śniegu";
                precipitationChance = 100;
                weatherIntensity = 0.85;
            }
            else if (r1 < 0.37) {
                description = "Opady śniegu";
                precipitationChance = 100;
                weatherIntensity = 0.60;
            }
            else if (r1 < 0.50) {
                description = tempC <= -4 ? "Silny mróz" : "Mróz";
                precipitationChance = 0;
                weatherIntensity = tempC <= -5 ? 0.55 : 0.35;
            }
            else if (r1 < 0.60) {
                description = "Gęsta mgła";
                precipitationChance = 20;
                weatherIntensity = 0.40;
            }
            else if (r1 < 0.72) {
                description = windKmh > 30 ? "Silny wiatr, pochmurno" : "Pochmurno, zimno";
                precipitationChance = 0;
                weatherIntensity = windKmh > 35 ? 0.45 : 0.10;
            }
            else if (r1 < 0.88) {
                description = "Zachmurzenie umiarkowane";
                precipitationChance = 0;
                weatherIntensity = 0.05;
            }
            else {
                description = "Słonecznie, mroźno";
                precipitationChance = 0;
                weatherIntensity = 0.10;
            }
            // === WIOSNA: Marzec, Kwiecień ===
        }
        else if (month === 2 || month === 3) {
            if (r1 < 0.05 && month === 2) {
                description = "Ostatnie opady śniegu";
                precipitationChance = 100;
                weatherIntensity = 0.50;
            }
            else if (r1 < 0.22) {
                description = windKmh > 30 ? "Deszcz ze silnym wiatrem" : "Deszcz";
                precipitationChance = 100;
                weatherIntensity = windKmh > 30 ? 0.55 : 0.38;
            }
            else if (r1 < 0.35) {
                description = "Lekki deszcz";
                precipitationChance = 100;
                weatherIntensity = 0.22;
            }
            else if (r1 < 0.47) {
                description = "Silny wiatr";
                precipitationChance = 0;
                weatherIntensity = 0.38;
            }
            else if (r1 < 0.62) {
                description = "Zachmurzenie umiarkowane";
                precipitationChance = 0;
                weatherIntensity = 0.05;
            }
            else if (r1 < 0.78) {
                description = "Pochmurno";
                precipitationChance = 0;
                weatherIntensity = 0.0;
            }
            else {
                description = "Bezchmurnie";
                precipitationChance = 0;
                weatherIntensity = 0.0;
            }
            // === LATO: Maj–Sierpień ===
        }
        else if (month >= 4 && month <= 7) {
            const thunderChance = (month === 5 || month === 6) ? 0.12 : 0.07;
            const heatChance = (month === 6 || month === 7) ? 0.09 : 0.03;
            if (r1 < thunderChance) {
                description = "Burza z piorunami";
                precipitationChance = 100;
                weatherIntensity = 1.0;
            }
            else if (r1 < thunderChance + heatChance) {
                description = "Upał";
                precipitationChance = 0;
                weatherIntensity = 0.65;
            }
            else if (r1 < 0.32) {
                description = "Ulewny deszcz";
                precipitationChance = 100;
                weatherIntensity = 0.80;
            }
            else if (r1 < 0.50) {
                description = "Deszcz";
                precipitationChance = 100;
                weatherIntensity = 0.38;
            }
            else if (r1 < 0.62) {
                description = "Lekki deszcz";
                precipitationChance = 100;
                weatherIntensity = 0.20;
            }
            else if (r1 < 0.74) {
                description = "Zachmurzenie umiarkowane";
                precipitationChance = 0;
                weatherIntensity = 0.0;
            }
            else {
                description = "Bezchmurnie";
                precipitationChance = 0;
                weatherIntensity = 0.0;
            }
            // === JESIEŃ: Wrzesień, Październik, Listopad ===
        }
        else {
            const fogChance = month === 10 ? 0.18 : month === 9 ? 0.12 : 0.06;
            const frostChance = month === 10 ? 0.10 : 0;
            if (r1 < frostChance) {
                description = "Pierwszy przymrozek";
                precipitationChance = 0;
                weatherIntensity = 0.30;
            }
            else if (r1 < frostChance + fogChance) {
                description = "Gęsta mgła";
                precipitationChance = 20;
                weatherIntensity = 0.40;
            }
            else if (r1 < 0.40) {
                description = windKmh > 30 ? "Deszcz ze silnym wiatrem" : "Deszcz";
                precipitationChance = 100;
                weatherIntensity = windKmh > 30 ? 0.62 : 0.40;
            }
            else if (r1 < 0.54) {
                description = "Lekki deszcz";
                precipitationChance = 100;
                weatherIntensity = 0.22;
            }
            else if (r1 < 0.65) {
                description = "Silny wiatr";
                precipitationChance = 0;
                weatherIntensity = windKmh > 35 ? 0.45 : 0.25;
            }
            else if (r1 < 0.78) {
                description = "Zachmurzenie umiarkowane";
                precipitationChance = 0;
                weatherIntensity = 0.05;
            }
            else {
                description = "Pochmurno";
                precipitationChance = 0;
                weatherIntensity = 0.0;
            }
        }
        return {
            tempC,
            precipitationChance,
            windKmh,
            description,
            weatherIntensity,
        };
    }
};
