import React, { useMemo } from 'react';
import { useGame } from '../../context/GameContext';
import { Club } from '../../types';

interface FinanceHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  club: Club;
}

export const FinanceHistoryModal: React.FC<FinanceHistoryModalProps> = ({ isOpen, onClose, club }) => {
  if (!isOpen) return null;

  // Korzystamy z prawdziwej historii finansowej klubu
  const history = useMemo(() => {
    return club.financeHistory || [];
  }, [club.id, club.financeHistory]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90 backdrop-blur-md p-6 animate-fade-in">
      <div className="max-w-3xl w-full bg-slate-900 border border-white/10 rounded-[40px] shadow-2xl overflow-hidden flex flex-col relative">
        <div className="bg-white/5 border-b border-white/5 p-6 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black italic text-white uppercase tracking-tighter">Historia Finansowa</h2>
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{club.name}</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-all text-2xl">&times;</button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 max-h-[60vh]">
          {history.length > 0 ? (
            <div className="space-y-2">
              {history.map((item, idx) => (
                <div key={idx} className="flex items-start justify-between p-4 bg-white/[0.02] rounded-2xl border border-white/5 hover:bg-white/[0.05] transition-all group">
                  <div className="w-24 shrink-0">
                    <span className="text-[9px] font-mono text-slate-500">{item.date}</span>
                  </div>
                  <div className="flex-1 px-4">
                    <span className="text-[10px] font-black uppercase italic text-white">
                      {item.description}
                    </span>
                    {item.previousBalance !== undefined && (
                      <div className="text-[7px] text-slate-400 italic mt-2 font-mono">
                        <span className="text-slate-500">poprzednie saldo:</span> {formatCurrency(item.previousBalance)} <span className="text-slate-600">→</span> <span className="text-slate-500">obecne saldo:</span> {formatCurrency(item.previousBalance + item.amount)}
                      </div>
                    )}
                  </div>
                  <div className="w-40 text-right shrink-0">
                    <span className={`text-sm font-black font-mono block ${item.amount > 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                      {item.amount > 0 ? '+' : ''}{formatCurrency(item.amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center opacity-20">
              <span className="text-4xl block mb-4">💰</span>
              <p className="text-sm font-black uppercase tracking-widest italic">Brak operacji finansowych w historii</p>
            </div>
          )}
        </div>

        <div className="p-6 bg-black/20 flex flex-col gap-4 border-t border-white/5">
           <div className="flex justify-between items-center px-4">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Aktualny Bilans</span>
              <span className="text-lg font-black font-mono text-white">{formatCurrency(club.budget)}</span>
           </div>
          <button onClick={onClose} className="px-10 py-3 bg-white text-slate-900 font-black italic uppercase tracking-widest text-xs rounded-xl hover:scale-105 transition-all shadow-xl">Zamknij</button>
        </div>
      </div>
    </div>
  );
};