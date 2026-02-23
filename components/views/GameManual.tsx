
import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { ViewState } from '../../types';

type ManualCategory = 'INTRO' | 'ENGINE' | 'CUP_LOGIC' | 'TACTICS' | 'PLAYERS' | 'REFEREE' | 'LEAGUE' | 'MATCHDAY' | 'TIPS';

export const GameManual: React.FC = () => {
  const { navigateTo } = useGame();
  const [activeTab, setActiveTab] = useState<ManualCategory>('INTRO');

  const categories: { id: ManualCategory; label: string; icon: string }[] = [
    { id: 'INTRO', label: 'Wstęp i Świat', icon: '🌍' },
    { id: 'ENGINE', label: 'Silnik Momentum', icon: '⚙️' },
    { id: 'CUP_LOGIC', label: 'Puchary & Bitwa Taktyczna', icon: '🏆' },
    { id: 'TACTICS', label: 'Encyklopedia Taktyki', icon: '📋' },
    { id: 'PLAYERS', label: 'Atrybuty i Rozwój', icon: '👕' },
    { id: 'REFEREE', label: 'Kolegium Sędziów', icon: '⚖️' },
    { id: 'LEAGUE', label: 'Zasady i Kariera', icon: '📊' },
    { id: 'MATCHDAY', label: 'Dzień Meczowy', icon: '⚽' },
    { id: 'TIPS', label: 'Sekrety Pro', icon: '💡' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'INTRO':
        return (
          <div className="space-y-12 animate-fade-in pb-20">
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-10 rounded-[45px] shadow-2xl relative overflow-hidden">
               <div className="absolute right-[-40px] top-[-40px] text-[12rem] opacity-[0.03] rotate-12 select-none">PL</div>
               <h3 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-6">Witaj w Managerze Futbolu PL</h3>
               <p className="text-slate-300 leading-relaxed text-xl font-medium">
                 To najbardziej kompleksowy symulator polskiej piłki nożnej, jaki kiedykolwiek powstał. Twoim zadaniem nie jest tylko wygrywanie meczów – to budowanie dziedzictwa klubu w brutalnej, ale fascynującej rzeczywistości ligowej. 
               </p>
               <div className="mt-8 flex gap-4">
                  <div className="px-6 py-2 bg-emerald-500 text-black font-black uppercase text-xs rounded-full">Sezon 2025/26</div>
                  <div className="px-6 py-2 bg-white/10 text-white font-black uppercase text-xs rounded-full border border-white/10">3 Poziomy Rozgrywkowe</div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <section className="space-y-4">
                  <h4 className="text-emerald-400 font-black uppercase tracking-[0.3em] text-sm">Piramida Ligowa</h4>
                  <div className="space-y-3">
                     <div className="bg-slate-900/60 p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                        <span className="text-white font-bold italic">Ekstraklasa</span>
                        <span className="text-[10px] bg-amber-500/20 text-amber-500 px-3 py-1 rounded-full font-black border border-amber-500/30">ELITA</span>
                     </div>
                     <div className="bg-slate-900/60 p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                        <span className="text-slate-300 font-bold italic">1. Liga</span>
                        <span className="text-[10px] bg-blue-500/20 text-blue-500 px-3 py-1 rounded-full font-black border border-blue-500/30">ZAPLECZE</span>
                     </div>
                     <div className="bg-slate-900/60 p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                        <span className="text-slate-400 font-bold italic">2. Liga</span>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-500 px-3 py-1 rounded-full font-black border border-emerald-500/30">POZIOM PRO</span>
                     </div>
                  </div>
               </section>
               <section className="space-y-4">
                  <h4 className="text-blue-400 font-black uppercase tracking-[0.3em] text-sm">Twoja Rola</h4>
                  <p className="text-sm text-slate-400 leading-relaxed italic bg-black/20 p-5 rounded-3xl border border-white/5">
                    "Jako Manager, decydujesz o wszystkim. Od tego, kto usiądzie na trybunach, po agresywność pressingu w 89. minucie meczu. Twoja reputacja rośnie z każdym zwycięstwem, ale pamiętaj – zarząd nie wybacza seryjnych porażek."
                  </p>
               </section>
            </div>
          </div>
        );

      case 'ENGINE':
        return (
          <div className="space-y-10 animate-fade-in pb-20">
             <div className="bg-blue-600/10 border border-blue-500/20 p-10 rounded-[45px] shadow-2xl relative">
                <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-4">Momentum Engine v2.5</h3>
                <p className="text-slate-400 leading-relaxed">
                  Zrozumienie silnika to klucz do wygrywania meczów, w których teoretycznie jesteś skazany na porażkę. Gra symuluje stan psychiczny i fizyczny obu jedenastek w czasie rzeczywistym.
                </p>
             </div>

             <div className="grid grid-cols-1 gap-6">
                <div className="bg-slate-900/50 p-8 rounded-[35px] border border-white/5 group hover:border-blue-500/30 transition-all">
                   <div className="flex items-center gap-6 mb-4">
                      <div className="w-14 h-14 rounded-2xl bg-blue-600 text-3xl flex items-center justify-center shadow-lg transform group-hover:rotate-6 transition-transform">📉</div>
                      <h4 className="text-xl font-black text-white uppercase italic">Kinetic Noise (Szum Kinetyczny)</h4>
                   </div>
                   <p className="text-slate-400 text-sm leading-relaxed mb-4">
                     Pasek Momentum na górze ekranu meczowego nigdy nie stoi w miejscu. Silnik generuje mikro-drgania symulujące walkę o piłkę w środku pola. Każde udane podanie, drybling czy interwencja bramkarza przesuwa ten balans na Twoją korzyść.
                   </p>
                </div>

                <div className="bg-slate-900/50 p-8 rounded-[35px] border border-white/5 group hover:border-red-500/30 transition-all">
                   <div className="flex items-center gap-6 mb-4">
                      <div className="w-14 h-14 rounded-2xl bg-red-600 text-3xl flex items-center justify-center shadow-lg transform group-hover:rotate-6 transition-transform">🔋</div>
                      <h4 className="text-xl font-black text-white uppercase italic">Anatomia Zmęczenia (Fatigue)</h4>
                   </div>
                   <p className="text-slate-400 text-sm leading-relaxed">
                     Zmęczenie zależy od pozycji: Pomocnicy (MID) tracą energię najszybciej przez konieczność krycia całego placu, podczas gdy Bramkarze (GK) niemal w ogóle nie tracą kondycji w trakcie gry.
                   </p>
                   <p className="mt-6 text-xs text-red-400 italic font-bold">UWAGA: Deszcz i upał ({'>'}27°C) zwiększają drenaż energii o dodatkowe 12% na minutę!</p>
                </div>
             </div>
          </div>
        );

      case 'CUP_LOGIC':
        return (
          <div className="space-y-12 animate-fade-in pb-20">
            <div className="bg-rose-600/10 border border-rose-500/20 p-10 rounded-[45px] shadow-2xl relative">
                <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-4">Magia Pucharów & Tactic Battle</h3>
                <p className="text-slate-300">W meczach pucharowych (Puchar Polski, Superpuchar) margines błędu wynosi zero. Silnik aktywuje tryb **HIGH-STAKES**, w którym psychologia i starcie stylów taktycznych biorą górę nad czystym ratingiem.</p>
            </div>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="bg-slate-900/50 p-8 rounded-[35px] border border-white/5 space-y-4">
                  <h4 className="text-rose-400 font-black uppercase tracking-widest text-sm flex items-center gap-3">
                     <span className="w-6 h-px bg-rose-500/30" /> Tactic Battle (Clash Logic)
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Każda formacja ma swój styl (ALL-IN, BUS, TRAP, SOLID). Jeśli grasz **ALL-IN** (np. 3-4-3), a AI zastawi **TRAP** (Pułapkę, np. 5-4-1), rywal otrzyma mnożnik Momentum x1.25. Twoja ofensywa rozbije się o ich kontry.
                  </p>
                  <div className="p-4 bg-black/40 rounded-2xl border border-rose-500/20">
                    <span className="block text-[10px] text-rose-500 font-black mb-2 uppercase">Zasada kontrowania:</span>
                    <ul className="text-[10px] text-slate-500 space-y-1">
                      <li>• ALL-IN &rarr; Kontrowane przez TRAP</li>
                      <li>• BUS (Autobus) &rarr; Rozbijane przez ALL-IN</li>
                      <li>• TRAP &rarr; Neutralizowane przez SOLID</li>
                    </ul>
                  </div>
               </div>

               <div className="bg-slate-900/50 p-8 rounded-[35px] border border-white/5 space-y-4">
                  <h4 className="text-blue-400 font-black uppercase tracking-widest text-sm flex items-center gap-3">
                     <span className="w-6 h-px bg-blue-500/30" /> Instrukcje "Stateless"
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Twoje polecenia w trakcie meczu działają jak stałe wektory siły. 
                  </p>
                  <div className="space-y-3">
                    <div className="flex flex-col gap-1">
                       <span className="text-[10px] font-bold text-white uppercase tracking-tighter">Tempo: SLOW vs FAST</span>
                       <span className="text-[9px] text-slate-500 italic">SLOW premiuje technikę (TECH), FAST premiuje czystą siłę ognia (ATT). Jeśli Twoja drużyna jest słabsza technicznie od rywala, granie SLOW odda im Momentum!</span>
                    </div>
                    <div className="flex flex-col gap-1">
                       <span className="text-[10px] font-bold text-white uppercase tracking-tighter">Nastawienie: OFFENSIVE vs DEFENSIVE</span>
                       <span className="text-[9px] text-slate-500 italic">OFFENSIVE wymaga 15+ pkt przewagi "Mocy Jedenastki". Bez tego ryzykujesz tragiczne błędy w obronie. DEFENSIVE pozwala "ukraść" momentum rywalowi, jeśli Twoja suma obrony jest wysoka.</span>
                    </div>
                  </div>
               </div>
            </section>

            <div className="bg-slate-950 p-10 rounded-[50px] border border-white/10 shadow-2xl">
               <h4 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-8">Analiza Przedmeczowa - KROK PO KROKU</h4>
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                  <div className="space-y-4">
                     <div className="text-3xl">🕵️‍♂️</div>
                     <h5 className="text-white font-black uppercase text-xs">1. Poznaj Rywala</h5>
                     <p className="text-[10px] text-slate-500 leading-relaxed">W Studiu sprawdź atrybuty gwiazd rywala. Jeśli ich napastnik ma Pace 90, nie graj wysoką linią obrony (unikaj 3-4-3). Jeśli mają słabego bramkarza, wybierz Nastawienie Ofensywne.</p>
                  </div>
                  <div className="space-y-4">
                     <div className="text-3xl">🌡️</div>
                     <h5 className="text-white font-black uppercase text-xs">2. Sprawdź Warunki</h5>
                     <p className="text-[10px] text-slate-500 leading-relaxed">Deszcz to wróg Twoich techników. Jeśli pada, graj prościej (Tempo FAST, Nastawienie Neutralne). W upale oszczędzaj siły (Intensywność Ostrożnie), by nie zostać z 0% kondycji w dogrywce.</p>
                  </div>
                  <div className="space-y-4">
                     <div className="text-3xl">⚖️</div>
                     <h5 className="text-white font-black uppercase text-xs">3. Oceń Arbitra</h5>
                     <p className="text-[10px] text-slate-500 leading-relaxed">Surowy sędzia (High Strictness) wlepi Ci czerwoną kartkę przy pierwszym mocniejszym wślizgu. Przy takim sędzi i niskim atrybucie Defending Twoich graczy, unikaj Intensywności Agresywnej.</p>
                  </div>
               </div>
            </div>
          </div>
        );

      case 'TACTICS':
        return (
          <div className="space-y-10 animate-fade-in pb-20">
             <div className="bg-slate-800/50 p-10 rounded-[45px] border border-white/10 relative overflow-hidden">
                <h3 className="text-3xl font-black text-white uppercase italic mb-4">Wszystkie Formacje</h3>
                <p className="text-slate-400 text-lg">Prawdziwy manager dopasowuje taktykę do zawodników, a nie zawodników do taktyki.</p>
             </div>

             <div className="space-y-4">
                {[
                  { id: '4-4-2', desc: 'Klasyka polskiej myśli szkoleniowej. Zrównoważona, bezpieczna, oparta na bocznych sektorach.', type: 'Neutral' },
                  { id: '4-3-3', desc: 'Agresywna, ofensywna. Skrzydła dominują, ale stoperzy zostają bez asekuracji. Wymaga szybkich obrońców.', type: 'Offensive' },
                  { id: '4-2-3-1', desc: 'Nowoczesny standard. Dwa "bezpieczniki" (CDM) pozwalają ofensywnemu pomocnikowi na pełną swobodę.', type: 'Neutral' },
                  { id: '3-5-2', desc: 'Dominacja w środku pola. Wymaga wydolnych wahadłowych i technicznych pomocników.', type: 'Possession' },
                  { id: '5-3-2', desc: 'Forteca. Bardzo trudna do przebicia, nastawiona na kontry i stałe fragmenty gry.', type: 'Defensive' },
                  { id: '4-5-1', desc: 'Klasyczne "murowanie". Zagęszczony środek uniemożliwia rywalowi wejście w pole karne.', type: 'Defensive' },
                  { id: '4-1-4-1', desc: 'Kontrola i cierpliwość. Szukanie luk w obronie rywala poprzez powolny atak pozycyjny.', type: 'Control' },
                  { id: '3-4-3', desc: 'Totalny futbol. Bardzo ryzykowne, ale przy dobrych zawodnikach miażdży rywala Momentum.', type: 'Ultra-Offensive' },
                  { id: '5-4-1', desc: 'Diamentowa obrona. Najlepsza do dowożenia prowadzenia 1:0 w doliczonym czasie gry.', type: 'Park Bus' },
                  { id: '4-3-2-1', desc: 'Choinka. Skupienie sił w centrum boiska, wymuszanie błędów rywala w środkowej strefie.', type: 'Technical' },
                ].map(t => (
                  <div key={t.id} className="bg-slate-900/40 p-6 rounded-3xl border border-white/5 hover:bg-white/5 transition-all">
                     <div className="flex justify-between items-center mb-3">
                        <span className="text-2xl font-black italic text-white">{t.id}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-blue-600/20 text-blue-400 rounded-full border border-blue-500/20">{t.type}</span>
                     </div>
                     <p className="text-sm text-slate-400 leading-relaxed">{t.desc}</p>
                  </div>
                ))}
             </div>
          </div>
        );

      case 'PLAYERS':
        return (
          <div className="space-y-12 animate-fade-in pb-20">
             <div className="bg-emerald-950/20 p-10 rounded-[45px] border border-emerald-500/20">
                <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-4">Zrozumienie Atrybutów</h3>
                <p className="text-slate-300">Statystyki to nie tylko liczby – to zachowanie zawodnika na murawie.</p>
             </div>

             <section className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-6">
                   <h4 className="text-emerald-400 font-black uppercase tracking-widest text-sm flex items-center gap-3">
                      <span className="w-8 h-px bg-emerald-500/30" /> Atrybuty Fizyczne
                   </h4>
                   <div className="space-y-4">
                      <div className="group">
                         <span className="block text-white font-bold text-xs uppercase mb-1 group-hover:text-emerald-400 transition-colors">Szybkość (Pace)</span>
                         <p className="text-[10px] text-slate-500">Kluczowa dla FWD i Skrzydłowych. Decyduje o dystansie dzielącym zawodnika od obrońcy w rajdzie 1v1.</p>
                      </div>
                      <div className="group">
                         <span className="block text-white font-bold text-xs uppercase mb-1 group-hover:text-emerald-400 transition-colors">Siła (Strength)</span>
                         <p className="text-[10px] text-slate-500">Wpływa na wygrywanie pojedynków w tłoku i walkę o górne piłki przy rzutach rożnych.</p>
                      </div>
                      <div className="group">
                         <span className="block text-white font-bold text-xs uppercase mb-1 group-hover:text-emerald-400 transition-colors">Kondycja (Stamina)</span>
                         <p className="text-[10px] text-slate-500">Bazowa wytrzymałość. Im wyższa, tym wolniej zawodnik traci energię (Fatigue) co minutę.</p>
                      </div>
                   </div>
                </div>

                <div className="space-y-6">
                   <h4 className="text-blue-400 font-black uppercase tracking-widest text-sm flex items-center gap-3">
                      <span className="w-8 h-px bg-blue-500/30" /> Atrybuty Techniczne
                   </h4>
                   <div className="space-y-4">
                      <div className="group">
                         <span className="block text-white font-bold text-xs uppercase mb-1 group-hover:text-blue-400 transition-colors">Technika (Technique)</span>
                         <p className="text-[10px] text-slate-500">Zmniejsza szansę na błąd techniczny (Blunder) i potknięcie (Stumble). Zwiększa kontrolę przy Momentum.</p>
                      </div>
                      <div className="group">
                         <span className="block text-white font-bold text-xs uppercase mb-1 group-hover:text-blue-400 transition-colors">Wizja (Vision)</span>
                         <p className="text-[10px] text-slate-500">Zwiększa szansę na prostopadłe podanie, które kompletnie mija linię obrony rywala.</p>
                      </div>
                      <div className="group">
                         <span className="block text-white font-bold text-xs uppercase mb-1 group-hover:text-blue-400 transition-colors">Ustawianie się (Positioning)</span>
                         <p className="text-[10px] text-slate-500">Defensor: Przecinanie podań. Atakujący: Znajdowanie wolnych stref. Bramkarz: Skracanie kąta.</p>
                      </div>
                   </div>
                </div>
             </section>
          </div>
        );

      case 'REFEREE':
        return (
          <div className="space-y-10 animate-fade-in pb-20">
             <div className="bg-slate-900/80 p-10 rounded-[45px] border border-white/10 relative overflow-hidden">
                <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-4">Kolegium Sędziów</h3>
                <p className="text-slate-400">W grze występuje pool 150 unikalnych polskich sędziów o różnych charakterach.</p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5 text-center">
                   <span className="text-3xl block mb-4">📏</span>
                   <h5 className="text-white font-black uppercase text-xs mb-2">Surowość (Strictness)</h5>
                   <p className="text-[10px] text-slate-500 leading-relaxed">Wysoka surowość sędziego oznacza, że każda żółta kartka to ryzyko drugiej i wylotu z boiska. Surowy sędzia chętniej gwiżdże też rzuty karne.</p>
                </div>
                <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5 text-center">
                   <span className="text-3xl block mb-4">📈</span>
                   <h5 className="text-white font-black uppercase text-xs mb-2">Konsekwencja (Consistency)</h5>
                   <p className="text-[10px] text-slate-500 leading-relaxed">Wysoki parametr oznacza, że sędzia sędziuje tak samo od 1. do 90. minuty. Sędzia z niską konsekwencją może "pogubić się" pod koniec meczu.</p>
                </div>
                <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5 text-center">
                   <span className="text-3xl block mb-4">⚖️</span>
                   <h5 className="text-white font-black uppercase text-xs mb-2">Przywilej Korzyści</h5>
                   <p className="text-[10px] text-slate-500 leading-relaxed">Określa, jak często sędzia puszcza grę po faulu. Kluczowe dla drużyn grających szybki, fizyczny futbol.</p>
                </div>
             </div>
          </div>
        );

      case 'LEAGUE':
        return (
          <div className="space-y-10 animate-fade-in pb-20">
             <div className="bg-slate-900/40 p-10 rounded-[45px] border border-white/5 space-y-8">
                <section>
                   <h4 className="text-white font-black uppercase tracking-widest text-lg mb-4">Zawieszenia i Kary</h4>
                   <div className="space-y-3">
                      <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl">
                         <span className="text-xs font-bold text-slate-300 uppercase">Co 4 żółte kartki</span>
                         <span className="text-xs font-black text-amber-500">1 MECZ KARY</span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl">
                         <span className="text-xs font-bold text-slate-300 uppercase">Czerwona kartka (bezpośrednia)</span>
                         <span className="text-xs font-black text-red-500">2 MECZE KARY</span>
                      </div>
                   </div>
                </section>
                <section>
                   <h4 className="text-white font-black uppercase tracking-widest text-lg mb-4">Zasady Awansów</h4>
                   <p className="text-sm text-slate-400 leading-relaxed">
                     W każdej lidze z 18 zespołów (Tiers 1-3), pierwsze 3 miejsca premiowane są awansem, a ostatnie 3 spadają poziom niżej.
                   </p>
                </section>
             </div>
          </div>
        );

      case 'MATCHDAY':
        return (
          <div className="space-y-10 animate-fade-in pb-20">
             <div className="relative h-64 bg-slate-900 rounded-[50px] border border-white/10 overflow-hidden shadow-2xl flex items-center justify-center">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=1500')] bg-cover bg-center opacity-20" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950" />
                <h3 className="text-5xl font-black italic text-white uppercase tracking-tighter relative z-10 text-center">90 Minut Prawdy</h3>
             </div>

             <div className="space-y-8">
                <div className="flex gap-8 items-start">
                   <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-3xl shrink-0 shadow-lg">📺</div>
                   <div>
                      <h4 className="text-white font-black uppercase text-lg mb-2 italic">Studio Przedmeczowe</h4>
                      <p className="text-slate-400 text-sm leading-relaxed">To tutaj dowiesz się wszystkiego o rywalu. Sprawdź atrybuty przeciwnika, sędziego oraz pogodę. Każdy z tych elementów powinien wpłynąć na Twoją taktykę.</p>
                   </div>
                </div>
                <div className="flex gap-8 items-start">
                   <div className="w-16 h-16 rounded-2xl bg-emerald-600 flex items-center justify-center text-3xl shrink-0 shadow-lg">⚡</div>
                   <div>
                      <h4 className="text-white font-black uppercase text-lg mb-2 italic">Interakcja Live</h4>
                      <p className="text-slate-400 text-sm leading-relaxed">Mecz można pauzować, aby dokonać zmian taktycznych. Pasek Momentum reaguje na każde Twoje polecenie. Przycisk SPEED (x5) pozwala przeskoczyć fragmenty gry.</p>
                   </div>
                </div>
             </div>
          </div>
        );

      case 'TIPS':
        return (
          <div className="space-y-8 animate-fade-in pb-20">
             <div className="bg-amber-500/10 border border-amber-500/20 p-10 rounded-[45px] shadow-2xl">
                <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-4">Sekrety Profesjonalistów</h3>
                <p className="text-slate-300 text-lg">Triki, które pozwolą Ci wygrać ligę już w pierwszym sezonie.</p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900/60 p-8 rounded-[35px] border border-white/5 space-y-4">
                   <div className="text-2xl">🔁</div>
                   <h5 className="text-white font-black uppercase text-sm italic">Rotacja to podstawa</h5>
                   <p className="text-[11px] text-slate-500 leading-relaxed italic">Nigdy nie graj tym samym składem przez 3 mecze z rzędu. Zawodnik z kondycją 70% gra znacznie gorzej niż jego słabszy zmiennik ze 100% energii.</p>
                </div>
                <div className="bg-slate-900/60 p-8 rounded-[35px] border border-white/5 space-y-4">
                   <div className="text-2xl">🧠</div>
                   <h5 className="text-white font-black uppercase text-sm italic">Czekaj na błąd AI</h5>
                   <p className="text-[11px] text-slate-500 leading-relaxed italic">Jeśli AI prowadzi i jest 80. minuta, przejdzie na defensywne 5-4-1. Zmień wtedy taktykę na 3-4-3 i rzuć wszystkie siły do ataku - momentum eksploduje.</p>
                </div>
             </div>
          </div>
        );
    }
  };

  return (
    <div className="h-screen w-full bg-slate-950 flex flex-col animate-fade-in overflow-hidden relative">
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[200px] opacity-20 bg-blue-600" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[180px] opacity-20 bg-emerald-600" />
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '80px 80px' }} />
      </div>

      <div className="flex items-center justify-between px-12 py-10 bg-slate-900/60 border-b border-white/10 backdrop-blur-3xl shrink-0 z-20 shadow-2xl">
         <div className="flex items-center gap-10">
            <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-4xl shadow-inner transform -rotate-6">📖</div>
            <div>
               <h1 className="text-5xl font-black italic uppercase tracking-tighter text-white leading-none">BIBLIA MANAGERA</h1>
               <p className="text-blue-400 text-xs font-black uppercase tracking-[0.5em] mt-4 opacity-80">Wszystkie sekrety symulacji w jednym miejscu</p>
            </div>
         </div>
         <button 
           onClick={() => navigateTo(ViewState.START_MENU)}
           className="group px-12 py-5 rounded-2xl bg-white text-slate-900 font-black italic uppercase tracking-widest text-xs hover:scale-105 transition-all active:scale-95 shadow-[0_20px_50px_rgba(255,255,255,0.2)] flex items-center gap-4"
         >
           POWRÓT DO MENU <span className="text-xl">↩</span>
         </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-96 bg-black/40 border-r border-white/10 flex flex-col p-6 z-10 backdrop-blur-3xl">
           <div className="space-y-3">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveTab(cat.id)}
                  className={`w-full flex items-center justify-between p-6 rounded-3xl transition-all border group
                    ${activeTab === cat.id 
                      ? 'bg-white/10 border-white/20 shadow-2xl scale-[1.03] translate-x-2' 
                      : 'bg-transparent border-transparent hover:bg-white/5 text-slate-500'}
                  `}
                >
                  <div className="flex items-center gap-6">
                    <span className={`text-3xl transform transition-transform group-hover:scale-125 ${activeTab === cat.id ? 'opacity-100' : 'opacity-30'}`}>{cat.icon}</span>
                    <span className={`text-[11px] font-black uppercase tracking-[0.2em] transition-colors ${activeTab === cat.id ? 'text-white' : 'group-hover:text-slate-300'}`}>{cat.label}</span>
                  </div>
                </button>
              ))}
           </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-16 bg-slate-950/40 backdrop-blur-md">
           <div className="max-w-5xl mx-auto">
              {renderContent()}
           </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
        @keyframes fade-in { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
};
