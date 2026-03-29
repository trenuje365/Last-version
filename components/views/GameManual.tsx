
import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { ViewState } from '../../types';

type ManualCategory = 'INTRO' | 'ENGINE' | 'CUP_LOGIC' | 'TACTICS' | 'PLAYERS' | 'REFEREE' | 'LEAGUE' | 'MATCHDAY' | 'FINANCE' | 'CONTRACTS' | 'INJURIES' | 'TRAINING' | 'CALENDAR' | 'TIPS';

export const GameManual: React.FC = () => {
  const { navigateTo } = useGame();
  const [activeTab, setActiveTab] = useState<ManualCategory>('INTRO');

  const categories: { id: ManualCategory; label: string; icon: string }[] = [
    { id: 'INTRO', label: 'Wstęp i Świat', icon: '🌍' },
    { id: 'ENGINE', label: 'Silnik Momentum', icon: '⚙️' },
    { id: 'CUP_LOGIC', label: 'Puchary & Bitwa Taktyczna', icon: '🏆' },
    { id: 'TACTICS', label: 'Encyklopedia Taktyki', icon: '📋' },
    { id: 'PLAYERS', label: 'Atrybuty i Rozwój', icon: '👕' },
    { id: 'INJURIES', label: 'Kontuzje i Regeneracja', icon: '🏥' },
    { id: 'TRAINING', label: 'Trening i Rozwój', icon: '🎯' },
    { id: 'FINANCE', label: 'Finanse Klubu', icon: '💰' },
    { id: 'CONTRACTS', label: 'Kontrakty i Transfery', icon: '📝' },
    { id: 'REFEREE', label: 'Kolegium Sędziów', icon: '⚖️' },
    { id: 'LEAGUE', label: 'Zasady i Kariera', icon: '📊' },
    { id: 'CALENDAR', label: 'Kalendarz Sezonu', icon: '📅' },
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
                      <p className="text-xs text-slate-400 mt-4 italic">
                        Zawieszenia automatycznie zmniejszają się o 1 po każdym rozegranym meczu. Po zakończeniu sezonu wszystkie zawieszenia są resetowane.
                      </p>
                   </div>
                </section>
                <section>
                   <h4 className="text-white font-black uppercase tracking-widest text-lg mb-4">Zasada Awansów i Spadków</h4>
                   <div className="space-y-4">
                     <div className="bg-slate-800/50 p-6 rounded-3xl border border-white/10">
                       <h5 className="text-emerald-400 font-black uppercase text-sm mb-3">Ekstraklasa, 1. Liga, 2. Liga (po 18 drużyn)</h5>
                       <ul className="text-xs text-slate-400 space-y-2">
                         <li>• <span className="text-white font-bold">Miejsca 1-3:</span> Awans wyżej (lub mistrzostwo)</li>
                         <li>• <span className="text-white font-bold">Miejsca 16-18:</span> Spadek niżej</li>
                       </ul>
                     </div>
                     <div className="bg-slate-800/50 p-6 rounded-3xl border border-white/10">
                       <h5 className="text-blue-400 font-black uppercase text-sm mb-3">Regionalna Liga (100 drużyn)</h5>
                       <ul className="text-xs text-slate-400 space-y-2">
                         <li>• <span className="text-white font-bold">Miejsca 1-4:</span> Awans do 2. Ligi</li>
                         <li>• <span className="text-white font-bold">Miejsca 97-100:</span> Spadek z 2. Ligi</li>
                       </ul>
                     </div>
                   </div>
                </section>
             </div>
          </div>
        );

      case 'INJURIES':
        return (
          <div className="space-y-10 animate-fade-in pb-20">
             <div className="bg-red-900/20 p-10 rounded-[45px] border border-red-500/20">
                <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-4">Kontuzje i Regeneracja</h3>
                <p className="text-slate-300">Zarządzanie zdrowiem zawodników to klucz do sukcesu w długim sezonie.</p>
             </div>

             <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-slate-900/50 p-8 rounded-[35px] border border-white/5 space-y-4">
                   <h4 className="text-red-400 font-black uppercase tracking-widest text-sm flex items-center gap-3">
                      <span className="w-6 h-px bg-red-500/30" /> Rodzaje Urazów
                   </h4>
                   <div className="space-y-3">
                      <div className="bg-slate-800/50 p-4 rounded-2xl border border-amber-500/20">
                         <span className="text-amber-400 font-black uppercase text-xs">Lekki Uraz (LIGHT)</span>
                         <p className="text-[10px] text-slate-400 mt-2">
                           Kontuzja wymagająca 3-10 dni przerwy. Zawodnik traci kondycję w momencie urazu i wraca do niej stopniowo w trakcie leczenia.
                         </p>
                      </div>
                      <div className="bg-slate-800/50 p-4 rounded-2xl border border-red-500/20">
                         <span className="text-red-400 font-black uppercase text-xs">Poważny Uraz (SEVERE)</span>
                         <p className="text-[10px] text-slate-400 mt-2">
                           Kontuzja wymagająca 14-45 dni przerwy. Zawodnik jest całkowicie niedostępny do czasu pełnego wyzdrowienia.
                         </p>
                      </div>
                   </div>
                </div>

                <div className="bg-slate-900/50 p-8 rounded-[35px] border border-white/5 space-y-4">
                   <h4 className="text-emerald-400 font-black uppercase tracking-widest text-sm flex items-center gap-3">
                      <span className="w-6 h-px bg-emerald-500/30" /> Regeneracja
                   </h4>
                   <p className="text-xs text-slate-400 leading-relaxed">
                     Kondycja zawodnika regeneruje się codziennie. Tempo zależy od:
                   </p>
                   <ul className="text-xs text-slate-400 space-y-2 mt-3">
                      <li>• <span className="text-white font-bold">Wiek:</span> Młodsi (≤24) regenerują się najszybciej</li>
                      <li>• <span className="text-white font-bold">Siła:</span> 99 STR = ~1.1 pkt długu zmęczeniowego/doba</li>
                      <li>• <span className="text-white font-bold">Kontuzja:</span> Uraz zmniejsza regenerację o 50%</li>
                      <li>• <span className="text-white font-bold">Trening:</span> Lekki trening (+0.5), Ciężki (-2.0)</li>
                   </ul>
                </div>
             </section>

             <div className="bg-slate-950 p-10 rounded-[50px] border border-white/10">
                <h4 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-6">Fatigue Debt (Dług Zmęczeniowy)</h4>
                <p className="text-sm text-slate-400 leading-relaxed mb-6">
                  Każdy mecz i trening generuje "dług zmęczeniowy". Zawodnik z wysokim fatigue debt ma obniżony sufit kondycji (max condition = 100 - debt).
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5">
                      <div className="text-2xl mb-3">🔋</div>
                      <h5 className="text-white font-black uppercase text-xs mb-2">Kondycja 100%</h5>
                      <p className="text-[10px] text-slate-500">Pełna wydajność, zawodnik gotowy do gry</p>
                   </div>
                   <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5">
                      <div className="text-2xl mb-3">⚠️</div>
                      <h5 className="text-white font-black uppercase text-xs mb-2">Kondycja 60-70%</h5>
                      <p className="text-[10px] text-slate-500">Znacznie gorsza wydajność, ryzyko błędów</p>
                   </div>
                   <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5">
                      <div className="text-2xl mb-3">🚨</div>
                      <h5 className="text-white font-black uppercase text-xs mb-2">Kondycja &lt;40%</h5>
                      <p className="text-[10px] text-slate-500">Ekstremalne ryzyko kontuzji, zawodnik do odpoczynku</p>
                   </div>
                </div>
             </div>
          </div>
        );

      case 'TRAINING':
        return (
          <div className="space-y-10 animate-fade-in pb-20">
             <div className="bg-emerald-900/20 p-10 rounded-[45px] border border-emerald-500/20">
                <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-4">Trening i Rozwój Zawodników</h3>
                <p className="text-slate-300">Mądrze zaplanowany trening to podstawa rozwoju młodych zawodników i utrzymania formy weteranów.</p>
             </div>

             <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-slate-900/50 p-8 rounded-[35px] border border-white/5 space-y-4">
                   <h4 className="text-emerald-400 font-black uppercase tracking-widest text-sm flex items-center gap-3">
                      <span className="w-6 h-px bg-emerald-500/30" /> Intensywność Treningu
                   </h4>
                   <div className="space-y-3">
                      <div className="bg-slate-800/50 p-4 rounded-2xl border border-emerald-500/20">
                         <span className="text-emerald-400 font-black uppercase text-xs">LIGHT (Lekki)</span>
                         <p className="text-[10px] text-slate-400 mt-2">
                           +0.5 do tempa regeneracji kondycji. Idealny po ciężkim meczu lub w okresie świątecznym.
                         </p>
                      </div>
                      <div className="bg-slate-800/50 p-4 rounded-2xl border border-blue-500/20">
                         <span className="text-blue-400 font-black uppercase text-xs">NORMAL (Standardowy)</span>
                         <p className="text-[10px] text-slate-400 mt-2">
                           Bazowe tempo rozwoju i regeneracji. Zalecany przez większość sezonu.
                         </p>
                      </div>
                      <div className="bg-slate-800/50 p-4 rounded-2xl border border-red-500/20">
                         <span className="text-red-400 font-black uppercase text-xs">HEAVY (Ciężki)</span>
                         <p className="text-[10px] text-slate-400 mt-2">
                           ×1.8 wzrost atrybutów, ale -2.0 do regeneracji kondycji. Ryzykowny, ale skuteczny.
                         </p>
                      </div>
                   </div>
                </div>

                <div className="bg-slate-900/50 p-8 rounded-[35px] border border-white/5 space-y-4">
                   <h4 className="text-blue-400 font-black uppercase tracking-widest text-sm flex items-center gap-3">
                      <span className="w-6 h-px bg-blue-500/30" /> Wzrost i Regres Atrybutów
                   </h4>
                   <p className="text-xs text-slate-400 leading-relaxed">
                     Każdy cykl treningowy daje szansę na wzrost atrybutów:
                   </p>
                   <ul className="text-xs text-slate-400 space-y-2 mt-3">
                      <li>• <span className="text-white font-bold">Baza:</span> 2% szansy/tydzień</li>
                      <li>• <span className="text-white font-bold">Primary Attributes:</span> +8% szansy</li>
                      <li>• <span className="text-white font-bold">Secondary Attributes:</span> +4% szansy</li>
                      <li>• <span className="text-white font-bold">Wiek &lt;21:</span> ×1.5 wzrostu</li>
                      <li>• <span className="text-white font-bold">Wiek &gt;32:</span> ×0.3 wzrostu</li>
                      <li>• <span className="text-white font-bold">Gra w meczu:</span> +2%, rating 7.5+: +5%, 9.0+: +10%</li>
                   </ul>
                   <p className="text-[10px] text-amber-400 mt-4 italic">
                     Uwaga: Istnieje też szansa na regres (0.5% bazowo, +4% dla wieku 33+, +2% przy braku gry).
                   </p>
                </div>
             </section>

             <div className="bg-slate-950 p-10 rounded-[50px] border border-white/10">
                <h4 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-6">Cykle Treningowe</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                   {[
                     { id: '🧠', name: 'Periodyzacja Taktyczna', attrs: 'Wizja, Ustawianie się' },
                     { id: '⚡', name: 'Gegenpressing', attrs: 'Kondycja, Szybkość' },
                     { id: '👟', name: 'Tiki-Taka', attrs: 'Podania, Technika' },
                     { id: '🛡️', name: 'Catenaccio', attrs: 'Obrona, Siła' },
                     { id: '🎯', name: 'Instynkt Snajperski', attrs: 'Wykończenie, Atakowanie' },
                     { id: '🚀', name: 'Szybkość i Zwinność', attrs: 'Szybkość, Drybling' },
                     { id: '🪂', name: 'Dominacja w Powietrzu', attrs: 'Gra głową, Siła' },
                     { id: '🧤', name: 'Nowoczesny Bramkarz', attrs: 'Bramkarstwo, Ustawianie się' },
                     { id: '🚩', name: 'Stałe Fragmenty Gry', attrs: 'Podania, Gra głową' },
                     { id: '🧘', name: 'Odnowa i Joga', attrs: 'Kondycja, +50% regeneracji' },
                   ].map(c => (
                     <div key={c.name} className="bg-slate-900/40 p-5 rounded-2xl border border-white/5">
                        <span className="text-2xl block mb-2">{c.id}</span>
                        <h5 className="text-white font-black uppercase text-xs mb-1">{c.name}</h5>
                        <p className="text-[9px] text-slate-500">{c.attrs}</p>
                     </div>
                   ))}
                </div>
                <p className="text-xs text-slate-400 mt-6 italic">
                  Limit zmian: ±3 punkty na atrybut w jednym sezonie.
                </p>
             </div>
          </div>
        );

      case 'FINANCE':
        return (
          <div className="space-y-10 animate-fade-in pb-20">
             <div className="bg-amber-900/20 p-10 rounded-[45px] border border-amber-500/20">
                <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-4">Finanse Klubu</h3>
                <p className="text-slate-300">Zarządzanie budżetem to sztuka balansowania między ambicjami sportowymi a realiami ekonomicznymi.</p>
             </div>

             <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                   <h4 className="text-amber-400 font-black uppercase tracking-widest text-sm flex items-center gap-3">
                      <span className="w-6 h-px bg-amber-500/30" /> Budżety Startowe
                   </h4>
                   <div className="space-y-3">
                      <div className="bg-slate-900/60 p-5 rounded-2xl border border-white/5 flex justify-between items-center">
                         <span className="text-white font-bold text-xs uppercase">Ekstraklasa</span>
                         <span className="text-emerald-400 font-black text-xs">24 - 217 mln PLN</span>
                      </div>
                      <div className="bg-slate-900/60 p-5 rounded-2xl border border-white/5 flex justify-between items-center">
                         <span className="text-white font-bold text-xs uppercase">1. Liga</span>
                         <span className="text-blue-400 font-black text-xs">9 - 18 mln PLN</span>
                      </div>
                      <div className="bg-slate-900/60 p-5 rounded-2xl border border-white/5 flex justify-between items-center">
                         <span className="text-white font-bold text-xs uppercase">2. Liga</span>
                         <span className="text-slate-400 font-black text-xs">1 - 3 mln PLN</span>
                      </div>
                      <div className="bg-slate-900/60 p-5 rounded-2xl border border-white/5 flex justify-between items-center">
                         <span className="text-white font-bold text-xs uppercase">Regionalna</span>
                         <span className="text-slate-500 font-black text-xs">80 - 500 tys. PLN</span>
                      </div>
                   </div>
                </div>

                <div className="space-y-6">
                   <h4 className="text-emerald-400 font-black uppercase tracking-widest text-sm flex items-center gap-3">
                      <span className="w-6 h-px bg-emerald-500/30" /> Źródła Przychodów
                   </h4>
                   <div className="space-y-3">
                      <div className="bg-slate-900/60 p-5 rounded-2xl border border-white/5">
                         <h5 className="text-white font-black uppercase text-xs mb-2">📺 Prawa TV</h5>
                         <p className="text-[10px] text-slate-400">Ekstraklasa: 35 mln PLN | 1. Liga: 15 mln | 2. Liga: 6 mln</p>
                      </div>
                      <div className="bg-slate-900/60 p-5 rounded-2xl border border-white/5">
                         <h5 className="text-white font-black uppercase text-xs mb-2">🎫 Bilety i Karnety</h5>
                         <p className="text-[10px] text-slate-400">20-180 PLN/bilet (Ekstraklasa). Karnety: 10-30% pojemności stadionu.</p>
                      </div>
                      <div className="bg-slate-900/60 p-5 rounded-2xl border border-white/5">
                         <h5 className="text-white font-black uppercase text-xs mb-2">🍿 Catering i Merchandising</h5>
                         <p className="text-[10px] text-slate-400">Dodatkowe przychody w dni meczowe (4-6 zł/fan na catering).</p>
                      </div>
                      <div className="bg-slate-900/60 p-5 rounded-2xl border border-white/5">
                         <h5 className="text-white font-black uppercase text-xs mb-2">🏢 VIP Boxes</h5>
                         <p className="text-[10px] text-slate-400">240-500 tys. PLN/rok (tylko Ekstraklasa, stadiony 15k+ miejsc).</p>
                      </div>
                   </div>
                </div>
             </section>

             <div className="bg-slate-950 p-10 rounded-[50px] border border-white/10">
                <h4 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-6">Koszty Klubu</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="bg-slate-900/50 p-8 rounded-3xl border border-white/5">
                      <h5 className="text-red-400 font-black uppercase text-sm mb-4">💸 Koszty Meczu (Gospodarz)</h5>
                      <ul className="text-xs text-slate-400 space-y-2">
                         <li>• <span className="text-white font-bold">Legia/Lech:</span> 350-700 tys. PLN</li>
                         <li>• <span className="text-white font-bold">Średniak Ekstraklasy:</span> 200-250 tys. PLN</li>
                         <li>• <span className="text-white font-bold">1. Liga:</span> 55-80 tys. PLN</li>
                         <li>• <span className="text-white font-bold">2. Liga:</span> 14-20 tys. PLN</li>
                      </ul>
                   </div>
                   <div className="bg-slate-900/50 p-8 rounded-3xl border border-white/5">
                      <h5 className="text-blue-400 font-black uppercase text-sm mb-4">✈️ Koszty Wyjazdu</h5>
                      <ul className="text-xs text-slate-400 space-y-2">
                         <li>• <span className="text-white font-bold">Ekstraklasa:</span> do 140 tys. PLN</li>
                         <li>• <span className="text-white font-bold">1. Liga:</span> do 55 tys. PLN</li>
                         <li>• <span className="text-white font-bold">2. Liga:</span> do 20 tys. PLN</li>
                      </ul>
                   </div>
                </div>
             </div>

             <div className="bg-red-900/20 p-10 rounded-[50px] border border-red-500/20">
                <h4 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-6">⚠️ Wskaźnik Oporu Zarządu (WOZ)</h4>
                <p className="text-sm text-slate-400 leading-relaxed mb-6">
                  Przy próbie zwolnienia zawodnika zarząd oblicza WOZ (0-100). Im wyższy, tym większy opór.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                   <div className="bg-slate-900/50 p-6 rounded-3xl border border-emerald-500/20">
                      <div className="text-emerald-400 font-black text-2xl mb-2">0-29</div>
                      <h5 className="text-white font-black uppercase text-xs">ZATWIERDZONO</h5>
                      <p className="text-[9px] text-slate-500 mt-2">Zarząd akceptuje decyzję</p>
                   </div>
                   <div className="bg-slate-900/50 p-6 rounded-3xl border border-amber-500/20">
                      <div className="text-amber-400 font-black text-2xl mb-2">30-59</div>
                      <h5 className="text-white font-black uppercase text-xs">OSTRZEŻENIE</h5>
                      <p className="text-[9px] text-slate-500 mt-2">Wątpliwości, ale zgoda</p>
                   </div>
                   <div className="bg-slate-900/50 p-6 rounded-3xl border border-orange-500/20">
                      <div className="text-orange-400 font-black text-2xl mb-2">60-84</div>
                      <h5 className="text-white font-black uppercase text-xs">ODRZUCONO</h5>
                      <p className="text-[9px] text-slate-500 mt-2">Odrzucone, spróbuj za 3 miesiące</p>
                   </div>
                   <div className="bg-slate-900/50 p-6 rounded-3xl border border-red-500/20">
                      <div className="text-red-400 font-black text-2xl mb-2">85-100</div>
                      <h5 className="text-white font-black uppercase text-xs">VETO</h5>
                      <p className="text-[9px] text-slate-500 mt-2">Absolutne veto zarządu!</p>
                   </div>
                </div>
                <p className="text-xs text-slate-400 mt-6 italic">
                  ⚠️ <span className="text-white font-bold">Top 11 Elite Lock:</span> 95% szansy na blokadę sprzedaży filaru drużyny (Top 11 OVR).
                </p>
                <p className="text-xs text-slate-400 mt-2 italic">
                  💰 <span className="text-white font-bold">Limit płac:</span> Łączne wynagrodzenia nie mogą przekroczyć 65% budżetu.
                </p>
             </div>
          </div>
        );

      case 'CONTRACTS':
        return (
          <div className="space-y-10 animate-fade-in pb-20">
             <div className="bg-blue-900/20 p-10 rounded-[45px] border border-blue-500/20">
                <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-4">Kontrakty i Negocjacje</h3>
                <p className="text-slate-300">Sztuka negocjacji to balans między oczekiwaniami zawodnika a możliwościami klubu.</p>
             </div>

             <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-slate-900/50 p-8 rounded-[35px] border border-white/5 space-y-4">
                   <h4 className="text-blue-400 font-black uppercase tracking-widest text-sm flex items-center gap-3">
                      <span className="w-6 h-px bg-blue-500/30" /> Struktura Oferty
                   </h4>
                   <p className="text-xs text-slate-400 leading-relaxed">
                     Każda oferta składa się z dwóch kluczowych elementów:
                   </p>
                   <div className="space-y-3 mt-4">
                      <div className="bg-slate-800/50 p-4 rounded-2xl border border-blue-500/20">
                         <span className="text-blue-400 font-black uppercase text-xs">📋 Roczna Pensja</span>
                         <p className="text-[10px] text-slate-400 mt-2">
                           Podstawa negocjacji. Zawodnicy porównują ofertę do obecnej pensji i wartości rynkowej.
                         </p>
                      </div>
                      <div className="bg-slate-800/50 p-4 rounded-2xl border border-amber-500/20">
                         <span className="text-amber-400 font-black uppercase text-xs">💰 Bonus za Podpis</span>
                         <p className="text-[10px] text-slate-400 mt-2">
                           Jednorazowa płatność (25-100% rocznej pensji). Weterani (32+) cenią bonusy bardziej niż młodzi.
                         </p>
                      </div>
                   </div>
                </div>

                <div className="bg-slate-900/50 p-8 rounded-[35px] border border-white/5 space-y-4">
                   <h4 className="text-emerald-400 font-black uppercase tracking-widest text-sm flex items-center gap-3">
                      <span className="w-6 h-px bg-emerald-500/30" /> Etapy Negocjacji
                   </h4>
                   <div className="space-y-3">
                      <div className="flex items-center gap-4">
                         <span className="w-8 h-8 rounded-full bg-emerald-500 text-white font-black flex items-center justify-center text-xs">0</span>
                         <p className="text-xs text-slate-400">Pierwsza oferta - największe szanse na sukces</p>
                      </div>
                      <div className="flex items-center gap-4">
                         <span className="w-8 h-8 rounded-full bg-blue-500 text-white font-black flex items-center justify-center text-xs">1</span>
                         <p className="text-xs text-slate-400">Druga oferta - zawodnik oczekuje ustępstw</p>
                      </div>
                      <div className="flex items-center gap-4">
                         <span className="w-8 h-8 rounded-full bg-amber-500 text-white font-black flex items-center justify-center text-xs">2</span>
                         <p className="text-xs text-slate-400">Trzecia oferta - ostatnia szansa przed zerwaniem</p>
                      </div>
                      <div className="flex items-center gap-4">
                         <span className="w-8 h-8 rounded-full bg-red-500 text-white font-black flex items-center justify-center text-xs">3</span>
                         <p className="text-xs text-slate-400">Czwarta oferta - prawie pewne zerwanie negocjacji</p>
                      </div>
                   </div>
                   <p className="text-[10px] text-red-400 italic mt-4">
                     Po 3 nieudanych próbach zawodnik może zostać trwale zablokowany (`isNegotiationPermanentBlocked`).
                   </p>
                </div>
             </section>

             <div className="bg-slate-950 p-10 rounded-[50px] border border-white/10">
                <h4 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-6">Mechanika Akceptacji</h4>
                <p className="text-sm text-slate-400 leading-relaxed mb-6">
                  System ocenia ofertę na podstawie kilku czynników:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-4">
                      <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5">
                         <h5 className="text-white font-black uppercase text-xs mb-3">📊 Progi Akceptacji</h5>
                         <ul className="text-xs text-slate-400 space-y-2">
                            <li>• <span className="text-emerald-400 font-bold">Final Score ≥ 0.98:</span> Natychmiastowa zgoda</li>
                            <li>• <span className="text-blue-400 font-bold">0.70 - 0.97:</span> Kontroferta (żądanie 5-25% więcej)</li>
                            <li>• <span className="text-red-400 font-bold">&lt; 0.65:</span> "Progu Godności" - automatyczna odmowa</li>
                         </ul>
                      </div>
                   </div>
                   <div className="space-y-4">
                      <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5">
                         <h5 className="text-white font-black uppercase text-xs mb-3">⚖️ Wpływ Wiek</h5>
                         <ul className="text-xs text-slate-400 space-y-2">
                            <li>• <span className="text-white font-bold">Weterani (32+):</span> Cenią bonusy (waga 50%)</li>
                            <li>• <span className="text-white font-bold">Dorośli (24-31):</span> Standardowe wagi</li>
                            <li>• <span className="text-white font-bold">Młodzi (≤23):</span> Cenią pensję (waga 70%)</li>
                         </ul>
                      </div>
                   </div>
                </div>
                <div className="mt-6 bg-amber-900/20 p-6 rounded-3xl border border-amber-500/20">
                   <h5 className="text-amber-400 font-black uppercase text-xs mb-3">💡 Wskazówki Negocjacyjne</h5>
                   <ul className="text-xs text-slate-400 space-y-2">
                      <li>• <span className="text-white font-bold">Wymienialność:</span> Nadwyżka w pensji rekompensuje bonus w skali 1:2.5</li>
                      <li>• <span className="text-white font-bold">10% zasada:</span> Oferta w 15% poniżej oczekiwań ma 10% szans na akceptację</li>
                      <li>• <span className="text-white font-bold">9/10 przypadków:</span> Zawodnik żąda 5-25% więcej niż obecna pensja</li>
                   </ul>
                </div>
             </div>
          </div>
        );

      case 'CALENDAR':
        return (
          <div className="space-y-10 animate-fade-in pb-20">
             <div className="bg-purple-900/20 p-10 rounded-[45px] border border-purple-500/20">
                <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-4">Kalendarz Sezonu</h3>
                <p className="text-slate-300">Sezon piłkarski to maraton, nie sprint. Zaplanuj swoją strategię z wyprzedzeniem.</p>
             </div>

             <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-slate-900/50 p-8 rounded-[35px] border border-white/5 space-y-4">
                   <h4 className="text-purple-400 font-black uppercase tracking-widest text-sm flex items-center gap-3">
                      <span className="w-6 h-px bg-purple-500/30" /> Struktura Sezonu
                   </h4>
                   <p className="text-xs text-slate-400 leading-relaxed">
                     Sezon trwa od **1 Lipca** do **30 Czerwca**. Miesiące w grze używają indeksowania JavaScript (Lipiec = 6, Styczeń = 0).
                   </p>
                   <div className="space-y-2 mt-4">
                      <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-xl">
                         <span className="text-xs text-white font-bold">Start sezonu</span>
                         <span className="text-xs text-purple-400 font-black">1 Lipca</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-xl">
                         <span className="text-xs text-white font-bold">Przerwa zimowa</span>
                         <span className="text-xs text-blue-400 font-black">18 Gru - 7 Sty</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-xl">
                         <span className="text-xs text-white font-bold">Koniec ligi</span>
                         <span className="text-xs text-emerald-400 font-black">23 Maja</span>
                      </div>
                   </div>
                </div>

                <div className="bg-slate-900/50 p-8 rounded-[35px] border border-white/5 space-y-4">
                   <h4 className="text-amber-400 font-black uppercase tracking-widest text-sm flex items-center gap-3">
                      <span className="w-6 h-px bg-amber-500/30" /> Okna Transferowe
                   </h4>
                   <div className="space-y-3">
                      <div className="bg-slate-800/50 p-4 rounded-2xl border border-emerald-500/20">
                         <span className="text-emerald-400 font-black uppercase text-xs">☀️ Letnie Okno</span>
                         <p className="text-[10px] text-slate-400 mt-2">
                           <span className="text-white font-bold">9 Lipca - 1 Października</span>
                         </p>
                         <p className="text-[9px] text-slate-500 mt-1">Główne okno, najwięcej transferów</p>
                      </div>
                      <div className="bg-slate-800/50 p-4 rounded-2xl border border-blue-500/20">
                         <span className="text-blue-400 font-black uppercase text-xs">❄️ Zimowe Okno</span>
                         <p className="text-[10px] text-slate-400 mt-2">
                           <span className="text-white font-bold">24 Stycznia - 24 Lutego</span>
                         </p>
                         <p className="text-[9px] text-slate-500 mt-1">Mniejsze okno, korekty składu</p>
                      </div>
                   </div>
                </div>
             </section>

             <div className="bg-slate-950 p-10 rounded-[50px] border border-white/10">
                <h4 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-6">📅 Oś Czasu Sezonu</h4>
                <div className="space-y-4">
                   <div className="flex gap-4 items-start">
                      <div className="w-24 shrink-0 text-xs font-black text-purple-400 uppercase">Lipiec</div>
                      <div className="flex-1 bg-slate-900/50 p-4 rounded-2xl border border-white/5">
                         <p className="text-xs text-slate-300">Start sezonu, Superpuchar, 1/64 Pucharu Polski, kwalifikacje europejskie</p>
                      </div>
                   </div>
                   <div className="flex gap-4 items-start">
                      <div className="w-24 shrink-0 text-xs font-black text-purple-400 uppercase">Sierpień</div>
                      <div className="flex-1 bg-slate-900/50 p-4 rounded-2xl border border-white/5">
                         <p className="text-xs text-slate-300">Start ligi, 1/32 Pucharu Polski, faza grupowa LM/LE/LK</p>
                      </div>
                   </div>
                   <div className="flex gap-4 items-start">
                      <div className="w-24 shrink-0 text-xs font-black text-purple-400 uppercase">Wrz-Paź</div>
                      <div className="flex-1 bg-slate-900/50 p-4 rounded-2xl border border-white/5">
                         <p className="text-xs text-slate-300">Kontynuacja ligi, 1/16 Pucharu Polski, zamknięcie okna transferowego</p>
                      </div>
                   </div>
                   <div className="flex gap-4 items-start">
                      <div className="w-24 shrink-0 text-xs font-black text-purple-400 uppercase">Lis-Gru</div>
                      <div className="flex-1 bg-slate-900/50 p-4 rounded-2xl border border-white/5">
                         <p className="text-xs text-slate-300">1/8 Pucharu Polski, ostatnie kolejki przed przerwą, losowania 1/8 LM/LE/LK</p>
                      </div>
                   </div>
                   <div className="flex gap-4 items-start">
                      <div className="w-24 shrink-0 text-xs font-black text-purple-400 uppercase">Sty-Lut</div>
                      <div className="flex-1 bg-slate-900/50 p-4 rounded-2xl border border-white/5">
                         <p className="text-xs text-slate-300">Wznowienie ligi, 1/8 LM/LE/LK, zimowe okno transferowe, 1/4 finałów</p>
                      </div>
                   </div>
                   <div className="flex gap-4 items-start">
                      <div className="w-24 shrink-0 text-xs font-black text-purple-400 uppercase">Mar-Kwi</div>
                      <div className="flex-1 bg-slate-900/50 p-4 rounded-2xl border border-white/5">
                         <p className="text-xs text-slate-300">1/4 i 1/2 Pucharu Polski, ćwierćfinały i półfinały LM/LE/LK</p>
                      </div>
                   </div>
                   <div className="flex gap-4 items-start">
                      <div className="w-24 shrink-0 text-xs font-black text-purple-400 uppercase">Maj</div>
                      <div className="flex-1 bg-slate-900/50 p-4 rounded-2xl border border-white/5">
                         <p className="text-xs text-slate-300">Finał Pucharu Polski (2 Maja), koniec ligi (23 Maja), finały europejskie (20-30 Maja)</p>
                      </div>
                   </div>
                   <div className="flex gap-4 items-start">
                      <div className="w-24 shrink-0 text-xs font-black text-purple-400 uppercase">Czerwiec</div>
                      <div className="flex-1 bg-slate-900/50 p-4 rounded-2xl border border-white/5">
                         <p className="text-xs text-slate-300">Zarząd/urlopy, reprezentacja, koniec sezonu (29 Czerwca)</p>
                      </div>
                   </div>
                </div>
             </div>

             <div className="bg-blue-900/20 p-10 rounded-[50px] border border-blue-500/20">
                <h4 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-6">🌡️ Pogoda w Polsce</h4>
                <p className="text-sm text-slate-400 leading-relaxed mb-6">
                  Warunki pogodowe wpływają na styl gry i kondycję zawodników.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                   <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5">
                      <div className="text-2xl mb-3">❄️</div>
                      <h5 className="text-white font-black uppercase text-xs mb-2">Zima</h5>
                      <p className="text-[9px] text-slate-500">-8°C do 5°C, zamiecie, mróz</p>
                   </div>
                   <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5">
                      <div className="text-2xl mb-3">🌧️</div>
                      <h5 className="text-white font-black uppercase text-xs mb-2">Wiosna</h5>
                      <p className="text-[9px] text-slate-500">-1°C do 16°C, deszcz, wiatr</p>
                   </div>
                   <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5">
                      <div className="text-2xl mb-3">☀️</div>
                      <h5 className="text-white font-black uppercase text-xs mb-2">Lato</h5>
                      <p className="text-[9px] text-slate-500">13°C do 27°C, burze, upał</p>
                   </div>
                   <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5">
                      <div className="text-2xl mb-3">🍂</div>
                      <h5 className="text-white font-black uppercase text-xs mb-2">Jesień</h5>
                      <p className="text-[9px] text-slate-500">0°C do 20°C, mgła, deszcz</p>
                   </div>
                </div>
                <p className="text-xs text-slate-400 mt-6 italic">
                  Wiatr: 0-55 km/h | Burze z piorunami (12% latem) | Zamiecie śnieżne (7% zimą)
                </p>
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

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                <div className="bg-slate-900/60 p-8 rounded-[35px] border border-white/5 space-y-4">
                   <div className="text-2xl">🌧️</div>
                   <h5 className="text-white font-black uppercase text-sm italic">Dostosuj się do pogody</h5>
                   <p className="text-[11px] text-slate-500 leading-relaxed italic">W deszczu graj prostszą piłkę (Tempo FAST, Technika mniej ważna). W upale (&gt;25°C) zmień intensywność na Ostrożnie, by uniknąć kontuzji.</p>
                </div>
                <div className="bg-slate-900/60 p-8 rounded-[35px] border border-white/5 space-y-4">
                   <div className="text-2xl">💰</div>
                   <h5 className="text-white font-black uppercase text-sm italic">Poluj na wolne agenty</h5>
                   <p className="text-[11px] text-slate-500 leading-relaxed italic">Zawodnicy z wygasającym kontraktem (6 miesięcy) są tańsi. Młodzi (&lt;23 lata) z OVR 65-70 to ukryte perełki.</p>
                </div>
                <div className="bg-slate-900/60 p-8 rounded-[35px] border border-white/5 space-y-4">
                   <div className="text-2xl">📊</div>
                   <h5 className="text-white font-black uppercase text-sm italic">Forma &gt; OVR</h5>
                   <p className="text-[11px] text-slate-500 leading-relaxed italic">Zawodnik z formą (seria 3+ wygranych) gra o 10-15% lepiej niż jego OVR. Sprawdzaj ratingHistory przed meczem!</p>
                </div>
                <div className="bg-slate-900/60 p-8 rounded-[35px] border border-white/5 space-y-4">
                   <div className="text-2xl">🎯</div>
                   <h5 className="text-white font-black uppercase text-sm italic">Taktuj puchary</h5>
                   <p className="text-[11px] text-slate-500 leading-relaxed italic">W pucharach (KO) jedna bramka decyduje. Graj bezpieczniej u siebie na wyjazd, ryzykuj u siebie w rewanżu.</p>
                </div>
                <div className="bg-slate-900/60 p-8 rounded-[35px] border border-white/5 space-y-4">
                   <div className="text-2xl">🏥</div>
                   <h5 className="text-white font-black uppercase text-sm italic">Zarządzaj kontuzjami</h5>
                   <p className="text-[11px] text-slate-500 leading-relaxed italic">Lekki uraz (3-10 dni) = rotacja. Poważny (14-45 dni) = szukaj zastępstwa. Nie ryzykuj gry kontuzjowanych w ważnych meczach.</p>
                </div>
                <div className="bg-slate-900/60 p-8 rounded-[35px] border border-white/5 space-y-4">
                   <div className="text-2xl">📈</div>
                   <h5 className="text-white font-black uppercase text-sm italic">Trenuj mądrze</h5>
                   <p className="text-[11px] text-slate-500 leading-relaxed italic">Młodzi (&lt;21) rosną najszybciej. Daj im Heavy trening w okresie bez meczów. Weteranom (32+) daj Light dla regeneracji.</p>
                </div>
                <div className="bg-slate-900/60 p-8 rounded-[35px] border border-white/5 space-y-4">
                   <div className="text-2xl">⚖️</div>
                   <h5 className="text-white font-black uppercase text-sm italic">Czytaj sędziów</h5>
                   <p className="text-[11px] text-slate-500 leading-relaxed italic">Surowy sędzia (Strictness &gt;70) = unikaj agresywnego pressingu. Niska Konsekwencja (&lt;50) = sędzia "gubi się" pod koniec meczu.</p>
                </div>
             </div>

             <div className="bg-emerald-900/20 p-10 rounded-[50px] border border-emerald-500/20 mt-8">
                <h4 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-6">🏆 Droga do Mistrzostwa</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div className="space-y-3">
                      <div className="text-3xl">📅</div>
                      <h5 className="text-white font-black uppercase text-sm">Sezon 1: Stabilizacja</h5>
                      <p className="text-[10px] text-slate-400">Utrzymaj się w lidze, zbuduj zrąb drużyny, poznaj mechanikę. Cel: środek tabeli.</p>
                   </div>
                   <div className="space-y-3">
                      <div className="text-3xl">📈</div>
                      <h5 className="text-white font-black uppercase text-sm">Sezon 2-3: Rozwój</h5>
                      <p className="text-[10px] text-slate-400">Inwestuj w młodzież, walcz o puchary europejskie. Cel: TOP 6.</p>
                   </div>
                   <div className="space-y-3">
                      <div className="text-3xl">👑</div>
                      <h5 className="text-white font-black uppercase text-sm">Sezon 4+: Dominacja</h5>
                      <p className="text-[10px] text-slate-400">Buduj drużynę Ligi Mistrzów, przyciągaj gwiazdy. Cel: Mistrzostwo i LM.</p>
                   </div>
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
