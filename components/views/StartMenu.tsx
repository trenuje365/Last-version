
import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { ViewState } from '../../types';
import bgImg from '../../Graphic/themes/main_theme.png';
export const StartMenu: React.FC = () => {
  const { startNewGame, navigateTo } = useGame();
  const [showDisclaimer, setShowDisclaimer] = useState(true);

  return (
    <div className="h-screen w-full flex flex-col items-center justify-end bg-slate-950 overflow-hidden relative">
      
      {/* DISCLAIMER POPUP */}
      {showDisclaimer && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative max-w-3xl w-full mx-6 max-h-[80vh] overflow-y-auto bg-slate-900/40 border border-white/10 rounded-[24px] p-8">
            <button
              onClick={() => setShowDisclaimer(false)}
              className="absolute top-4 right-4 text-4xl text-white/40 hover:text-white transition-colors leading-none"
            >
              ✕
            </button>
            <p className="text-[13px] font-black text-emerald-500 uppercase tracking-widest mb-4">NOTA PRAWNA (DISCLAIMER)</p>
            <div className="flex flex-col gap-3 text-[15px] font-black italic text-slate-300 tracking-wide leading-relaxed">
              <p>Niniejsza gra <span className="text-white">„Futbol Manager"</span> jest w całości niekomercyjnym, fanowskim projektem stworzonym dobrowolnie.</p>
              <p>Gra nie służy generowaniu żadnych korzyści finansowych. Twórca nie czerpie i nie zamierza czerpać jakichkolwiek dochodów z jej udostępniania lub użytkowania.</p>
              <p>Znaki towarowe, loga klubów, nazwy drużyn, barwy oraz wszelkie inne oznaczenia należące do rzeczywistych klubów piłkarskich, federacji, lig lub innych podmiotów trzecich zostały użyte wyłącznie w celach niekomercyjnych i <span className="text-yellow-500">bez uzyskania zgody ich prawowitych właścicieli</span>. Użycie to nie oznacza żadnej afiliacji ani powiązania z tymi podmiotami.</p>
              <p>Zbieżność imion i nazwisk rzeczywistych osób, jeśli wystąpi, jest całkowicie przypadkowa, ponieważ gra generuje fikcyjne postaci.</p>
              <p>Kod źródłowy gry jest <span className="text-yellow-500">open-source</span> i może być dowolnie modyfikowany oraz rozbudowywany według potrzeb użytkowników.</p>
              <p>Gra powstała jako dobrowolna, hobbystyczna inicjatywa i jest w całości bezpłatna.</p>
              <p className="text-white">Autor: JayJayBi &nbsp;|&nbsp; Data: marzec 2026</p>
              <p>Twórca nie ponosi odpowiedzialności za jakiekolwiek szkody wynikające z użytkowania gry.</p>
              <p>Wszelkie prawa do oryginalnych znaków towarowych, logo, nazw i wizerunków należą do ich prawowitych właścicieli.</p>
            </div>
          </div>
        </div>
      )}

      {/* 1. CINEMATIC BACKGROUND LAYER */}
      <div className="absolute inset-0 z-0">
        {/* Real Football Background - High Contrast Stadium */}
        <div
          className="absolute inset-0 scale-110 opacity-70 mix-blend-luminosity animate-pulse-slow"
          style={{ backgroundImage: `url(${bgImg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        />
        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/20 via-slate-950/60 to-slate-950" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-transparent to-slate-950 opacity-70" />
        
        {/* Dynamic Glows */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 blur-[150px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[150px] animate-pulse" style={{ animationDelay: '2s' }} />

        {/* Cyber Grid */}
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>
      
      {/* 2. CENTRAL CONTENT */}
      <div className="relative z-10 flex flex-col items-center max-w-4xl w-full px-6 text-center animate-fade-in pb-8">
        
        

      

        {/* Action Menu */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-5xl mx-auto">
                                                                      
          
          <button 
            onClick={startNewGame}
            className="group relative h-48 bg-emerald-600/10 border border-emerald-500/20 rounded-[32px] p-6 transition-all duration-500 hover:bg-emerald-600 hover:border-emerald-400 hover:-translate-y-2 hover:shadow-[0_30px_60px_-15px_rgba(16,185,129,0.5)] overflow-hidden"
          >
             <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
             <div className="relative z-10 flex flex-col h-full items-center justify-between">
                <span className="text-4xl group-hover:scale-125 transition-transform duration-500">🏆</span>
                <div className="text-center">
                  <span className="block text-[10px] font-black text-emerald-500 group-hover:text-emerald-100 uppercase tracking-widest mb-1">ROZPOCZNIJ</span>
                  <span className="text-2xl font-black text-white italic uppercase tracking-tighter">NOWA GRA</span>
                </div>
             </div>
          </button>

          <button 
            onClick={() => navigateTo(ViewState.GAME_MANUAL)}
            className="group relative h-48 bg-blue-600/10 border border-blue-500/20 rounded-[32px] p-6 transition-all duration-500 hover:bg-blue-600 hover:border-blue-400 hover:-translate-y-2 hover:shadow-[0_30px_60px_-15px_rgba(59,130,246,0.5)] overflow-hidden"
          >
             <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
             <div className="relative z-10 flex flex-col h-full items-center justify-between">
                <span className="text-4xl group-hover:scale-125 transition-transform duration-500">📚</span>
                <div className="text-center">
                  <span className="block text-[10px] font-black text-blue-500 group-hover:text-blue-100 uppercase tracking-widest mb-1">GUIDE</span>
                  <span className="text-2xl font-black text-white italic uppercase tracking-tighter">INSTRUKCJA</span>
                </div>
             </div>
          </button>

          <button 
            disabled
            className="group relative h-48 bg-slate-900/60 border border-white/5 rounded-[32px] p-6 transition-all duration-500 hover:border-white/20 opacity-50 cursor-not-allowed overflow-hidden"
          >
             <div className="relative z-10 flex flex-col h-full items-center justify-between">
                <span className="text-4xl grayscale opacity-50">💾</span>
                <div className="text-center">
                  <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">KONTYNUUJ</span>
                  <span className="text-2xl font-black text-slate-400 italic uppercase tracking-tighter">WCZYTAJ</span>
                </div>
             </div>
          </button>

          <button 
            onClick={() => alert("Ustawienia będą dostępne wkrótce.")}
            className="group relative h-48 bg-slate-900/60 border border-white/5 rounded-[32px] p-6 transition-all duration-500 hover:bg-white/5 hover:border-white/20 hover:-translate-y-2 overflow-hidden shadow-xl"
          >
             <div className="relative z-10 flex flex-col h-full items-center justify-between">
                <span className="text-4xl group-hover:rotate-90 transition-transform duration-700">⚙️</span>
                <div className="text-center">
                  <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">KONFIGURUJ</span>
                  <span className="text-2xl font-black text-white italic uppercase tracking-tighter">OPCJE</span>
                </div>
             </div>
          </button>

        </div>

        {/* Footer info */}
        <div className="mt-20 flex flex-col items-center gap-2">
           <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em]">VERSION 1.5</p>
           <p className="text-[9px] font-bold text-slate-700">BY JAY BI &copy; 2025</p>
        </div>
      </div>

      <style>{`
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1.1); }
          50% { transform: scale(1.15); }
        }
        .animate-pulse-slow { animation: pulse-slow 20s infinite ease-in-out; }
        
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
};
