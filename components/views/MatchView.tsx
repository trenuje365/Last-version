import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { ViewState } from '../../types';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { LiveCommentaryEngine } from '../../services/simulationService';

export const MatchView: React.FC = () => {
  const { navigateTo } = useGame();
  const [matchState, setMatchState] = useState<'PRE' | 'LIVE' | 'POST'>('PRE');
  const [minute, setMinute] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);

  // Simulation Loop Effect
  useEffect(() => {
    let interval: any;

    if (matchState === 'LIVE') {
      interval = setInterval(() => {
        setMinute(prev => {
          if (prev >= 90) {
            setMatchState('POST');
            return 90;
          }
          return prev + 1;
        });
      }, 100); // Fast simulation: 100ms = 1 game minute
    }

    return () => clearInterval(interval);
  }, [matchState]);

  // Generate Commentary Effect
  useEffect(() => {
    if (matchState === 'LIVE' && minute > 0 && minute % 5 === 0) {
      const comment = LiveCommentaryEngine.generateComment(minute, "Akcja w środku pola...");
      setLogs(prev => [comment, ...prev]);
    }
  }, [minute, matchState]);

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold tracking-wider text-slate-200">
          STUDIO MECZOWE
        </h2>
        <Button variant="secondary" size="sm" onClick={() => navigateTo(ViewState.DASHBOARD)}>
          Wyjdź
        </Button>
      </div>

      {/* Scoreboard */}
      <Card className="mb-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-emerald-500/30 border">
        <div className="flex justify-around items-center py-6">
          <div className="text-center w-1/3">
            <h3 className="text-2xl font-bold text-white">Twój Klub</h3>
            <p className="text-slate-400">Gospodarz</p>
          </div>
          <div className="text-center w-1/3 flex flex-col items-center">
             <div className="text-4xl font-mono font-black text-emerald-400">
               {matchState === 'PRE' ? 'VS' : '0 - 0'}
             </div>
             <div className="text-red-500 font-bold mt-2 animate-pulse">
               {matchState === 'LIVE' ? `${minute}'` : matchState === 'POST' ? 'FT' : ''}
             </div>
          </div>
          <div className="text-center w-1/3">
            <h3 className="text-2xl font-bold text-white">Rywal_001</h3>
            <p className="text-slate-400">Gość</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 overflow-hidden">
        {/* Left: Lineups */}
        <Card title="Składy (Placeholder)" className="hidden lg:block">
          <div className="text-slate-400 text-sm p-2 text-center italic">
            TODO: Lista zawodników (Stage 2)
          </div>
          <div className="mt-4 space-y-2">
             {Array.from({length: 11}).map((_, i) => (
               <div key={i} className="flex justify-between text-xs text-slate-300 border-b border-slate-700 pb-1">
                 <span>Player_{i+1}</span>
                 <span className="text-slate-500">POS</span>
               </div>
             ))}
          </div>
        </Card>

        {/* Center: Action / Commentary */}
        <Card title="Komentarz Live" className="lg:col-span-2 flex flex-col h-full relative">
          
          {/* Controls */}
          <div className="absolute top-3 right-4 z-10">
            {matchState === 'PRE' && (
              <Button onClick={() => setMatchState('LIVE')}>Rozpocznij Mecz</Button>
            )}
             {matchState === 'POST' && (
              <Button onClick={() => navigateTo(ViewState.DASHBOARD)} variant="primary">Zakończ</Button>
            )}
          </div>

          {/* Commentary Feed */}
          <div className="flex-1 overflow-y-auto space-y-2 p-2 bg-slate-900/50 rounded mt-2 border border-slate-700/50">
            {logs.length === 0 && matchState === 'PRE' && (
              <div className="text-center text-slate-500 mt-10">
                Oczekiwanie na pierwszy gwizdek...<br/>
                <span className="text-xs">Eksperci: "To będzie zacięty mecz."</span>
              </div>
            )}
            {logs.map((log, idx) => (
              <div key={idx} className="text-sm font-mono text-emerald-100 border-l-2 border-emerald-500 pl-2 py-1 bg-emerald-900/10">
                {log}
              </div>
            ))}
            {matchState === 'POST' && (
              <div className="text-center text-yellow-400 font-bold py-4">
                KONIEC MECZU
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};