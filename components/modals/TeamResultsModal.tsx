import React, { useMemo } from 'react';
import { useGame } from '../../context/GameContext';
import { MatchHistoryService } from '../../services/MatchHistoryService';
import { Club } from '../../types';

interface TeamResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  club: Club;
}

export const TeamResultsModal: React.FC<TeamResultsModalProps> = ({ isOpen, onClose, club }) => {
  if (!isOpen) return null;

  const { clubs } = useGame();
  const results = useMemo(() => MatchHistoryService.getTeamHistory(club.id).reverse(), [club.id]);

  const getCompetitionName = (comp: string) => {
    if (comp.includes('L_PL_1')) return 'Ekstraklasa';
    if (comp.includes('L_PL_2')) return '1. Liga';
    if (comp.includes('L_PL_3')) return '2. Liga';
    if (comp.includes('CUP')) return 'Puchar Polski';
    if (comp.includes('SUPER')) return 'Superpuchar';
    return comp;
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90 backdrop-blur-md p-6 animate-fade-in">
      <div className="max-w-3xl w-full bg-slate-900 border border-white/10 rounded-[40px] shadow-2xl overflow-hidden flex flex-col relative">
        <div className="bg-white/5 border-b border-white/5 p-6 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black italic text-white uppercase tracking-tighter">Wyniki</h2>
            <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{club.name}</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-all text-2xl">&times;</button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 max-h-[60vh]">
          {results.length > 0 ? (
            <div className="space-y-2">
              {results.map((m, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-white/[0.02] rounded-2xl border border-white/5 hover:bg-white/[0.05] transition-all group">
                  <div className="w-20 shrink-0">
                    <span className="text-[9px] font-mono text-slate-500">{m.date}</span>
                  </div>
                  <div className="flex-1 px-4 text-center flex items-center justify-center gap-3">
                    <span className={`text-[10px] font-black uppercase italic truncate max-w-[140px] ${m.homeTeamId === club.id ? 'text-white' : 'text-slate-500'}`}>
                      {clubs.find(c => c.id === m.homeTeamId)?.name || 'Nieznany'}
                    </span>
                    <span className="text-[9px] font-bold text-slate-700">-</span>
                    <span className={`text-[10px] font-black uppercase italic truncate max-w-[140px] ${m.awayTeamId === club.id ? 'text-white' : 'text-slate-500'}`}>
                      {clubs.find(c => c.id === m.awayTeamId)?.name || 'Nieznany'}
                    </span>
                  </div>
                  <div className="w-24 text-center">
                    <div className="flex flex-col items-center">
                      <span className={`text-sm font-black font-mono ${m.homeScore > m.awayScore ? (m.homeTeamId === club.id ? 'text-emerald-400' : 'text-red-500') : (m.homeScore < m.awayScore ? (m.awayTeamId === club.id ? 'text-emerald-400' : 'text-red-500') : 'text-slate-400')}`}>
                        {m.homeScore}:{m.awayScore}
                      </span>
                      {m.homePenaltyScore !== undefined && (
                        <span className="text-[7px] font-black text-rose-500 uppercase tracking-tighter mt-[-2px]">
                          k. {m.homePenaltyScore}:{m.awayPenaltyScore}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="w-32 text-right">
                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{getCompetitionName(m.competition)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center opacity-20">
              <span className="text-4xl block mb-4">🏜️</span>
              <p className="text-sm font-black uppercase tracking-widest italic">Brak rozegranych meczów w tym sezonie</p>
            </div>
          )}
        </div>

        <div className="p-6 bg-black/20 text-center border-t border-white/5">
          <button onClick={onClose} className="px-10 py-3 bg-white text-slate-900 font-black italic uppercase tracking-widest text-xs rounded-xl hover:scale-105 transition-all shadow-xl">Zamknij</button>
        </div>
      </div>
    </div>
  );
};