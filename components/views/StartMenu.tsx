
import React from 'react';
import { useGame } from '../../context/GameContext';
import { ViewState } from '../../types';

export const StartMenu: React.FC = () => {
  const { startNewGame, navigateTo } = useGame();

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-950 overflow-hidden relative">
      
      {/* 1. CINEMATIC BACKGROUND LAYER */}
      <div className="absolute inset-0 z-0">
        {/* Real Football Background - High Contrast Stadium */}
        <div 
          className="absolute inset-0 bg-[url('https://i.ibb.co/Fqs6zXg4/theme-no-tittle.jpg')] bg-cover bg-center scale-110 opacity-70 mix-blend-luminosity animate-pulse-slow"
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
      <div className="relative z-10 flex flex-col items-center max-w-4xl w-full px-6 text-center animate-fade-in">
        
        {/* Badge */}
        <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-xl shadow-2xl">
           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,1)]" />
           <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">Oficjalny Symulator Polskiej Ligi</span>
        </div>

        {/* Main Title */}
        <div className="mb-16 relative">
          <h1 className="text-7xl md:text-9xl font-black italic text-white uppercase tracking-tighter leading-none drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            MANAGER<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-400 to-slate-600">FUTBOLU 2025</span>
          </h1>
          {/* Subtle reflection below */}
          <div className="absolute -bottom-12 left-0 right-0 h-12 bg-gradient-to-b from-white/10 to-transparent blur-xl opacity-20 scale-y-[-1] pointer-events-none" />
        </div>

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
