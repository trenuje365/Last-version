import { Club, WeatherSnapshot } from "@/types";

export const AttendanceService = {
  calculate: (club: Club, rank: number, weather: WeatherSnapshot): number => {
    // 1. Reputacja (45%)
    const repScore = club.reputation / 10; // Zakładamy skalę 1-10

    // 2. Miejsce w tabeli (45%) - Skala progresywna
    let rankScore = 0;
    if (rank <= 4) rankScore = 1.0 - (rank - 1) * 0.05; // 1: 1.0, 4: 0.85
    else if (rank <= 10) rankScore = 0.8 - (rank - 5) * 0.05; // 5: 0.8, 10: 0.55
    else rankScore = 0.4 - (rank - 11) * 0.04; // 11: 0.4, 18: 0.12

    // 3. Pogoda (10%)
    let weatherScore = 1.0;
    if (weather.description.includes("Ulewny") || weather.description.includes("śniegu")) weatherScore = 0.5;
    else if (weather.description.includes("Lekki")) weatherScore = 0.8;

    // Sumowanie
    let totalPercent = (repScore * 0.45) + (rankScore * 0.45) + (weatherScore * 0.10);
    
    // Jitter (mała losowość +/- 3%)
    const jitter = (Math.random() * 0.06) - 0.03;
    totalPercent = Math.max(0.05, Math.min(1.0, totalPercent + jitter));

    return Math.floor(club.stadiumCapacity * totalPercent);
  }
};