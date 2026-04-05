import React, { useMemo, useState } from 'react';
import { useGame } from '../../context/GameContext';
import { Club } from '../../types';

interface FinanceHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  club: Club;
}

const MONTH_LABELS: Record<string, string> = {
  '01': 'Sty', '02': 'Lut', '03': 'Mar', '04': 'Kwi',
  '05': 'Maj', '06': 'Cze', '07': 'Lip', '08': 'Sie',
  '09': 'Wrz', '10': 'Paź', '11': 'Lis', '12': 'Gru',
};

const BAR_HALF = 96; // px — połowa wykresu (góra/dół od linii 0)

export const FinanceHistoryModal: React.FC<FinanceHistoryModalProps> = ({ isOpen, onClose, club }) => {
  if (!isOpen) return null;

  const [hoveredMonth, setHoveredMonth] = useState<string | null>(null);

  // Korzystamy z prawdziwej historii finansowej klubu
  const history = useMemo(() => {
    return club.financeHistory || [];
  }, [club.id, club.financeHistory]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', maximumFractionDigits: 0 }).format(amount);
  };

  const incomes = history.filter(item => item.type === 'INCOME');
  const expenses = history.filter(item => item.type === 'EXPENSE');
  const totalIncome = incomes.reduce((sum, item) => sum + item.amount, 0);
  const totalExpense = expenses.reduce((sum, item) => sum + Math.abs(item.amount), 0);

  // Grupowanie po miesiącach (klucz: "YYYY-MM")
  const monthlyData = useMemo(() => {
    const map: Record<string, number> = {};
    history.forEach(item => {
      let key = '';
      if (item.date.includes('.')) {
        const parts = item.date.split('.');
        if (parts.length === 3) key = `${parts[2]}-${parts[1]}`;
      } else if (item.date.includes('-')) {
        const parts = item.date.split('-');
        if (parts.length === 3) key = `${parts[0]}-${parts[1]}`;
      }
      if (!key) return;
      const val = item.type === 'INCOME' ? item.amount : -Math.abs(item.amount);
      map[key] = (map[key] || 0) + val;
    });
    const sorted = Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
    return sorted.map(([key, net]) => {
      const [year, month] = key.split('-');
      return { key, label: `${MONTH_LABELS[month] || month} ${year.slice(2)}`, net };
    });
  }, [history]);

  const maxAbsNet = useMemo(() => {
    return Math.max(...monthlyData.map(d => Math.abs(d.net)), 1);
  }, [monthlyData]);

  const TableSection = ({ title, rows, isIncome }: { title: string; rows: typeof history; isIncome: boolean }) => (
    <div className="mb-6">
      <div className={`px-3 py-1.5 mb-1 inline-block rounded-md text-[10px] font-black uppercase tracking-widest ${isIncome ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
        {title}
      </div>
      <table className="w-full border-collapse text-[11px]">
        <thead>
          <tr className="bg-white/[0.04] border-b border-white/10">
            <th className="py-2 px-3 text-left font-black text-slate-400 uppercase tracking-widest w-8">#</th>
            <th className="py-2 px-3 text-left font-black text-slate-400 uppercase tracking-widest w-24">Data</th>
            <th className="py-2 px-3 text-left font-black text-slate-400 uppercase tracking-widest">Opis</th>
            <th className="py-2 px-3 text-right font-black text-slate-400 uppercase tracking-widest w-36">Kwota</th>
            <th className="py-2 px-3 text-right font-black text-slate-400 uppercase tracking-widest w-36">Saldo przed</th>
            <th className="py-2 px-3 text-right font-black text-slate-400 uppercase tracking-widest w-36">Saldo po</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={5} className="py-4 px-3 text-center text-slate-600 italic">Brak rekordów</td>
            </tr>
          ) : (
            rows.map((item, idx) => (
              <tr key={item.id} className={`border-b border-white/[0.04] hover:bg-white/[0.04] transition-colors ${idx % 2 === 0 ? 'bg-white/[0.01]' : 'bg-transparent'}`}>
                <td className="py-2 px-3 font-mono text-slate-600">{idx + 1}</td>
                <td className="py-2 px-3 font-mono text-slate-500">{item.date}</td>
                <td className="py-2 px-3 font-black italic text-white uppercase">{item.description}</td>
                <td className={`py-2 px-3 text-right font-black font-mono ${isIncome ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isIncome ? '+' : '-'}{formatCurrency(Math.abs(item.amount))}
                </td>
                <td className="py-2 px-3 text-right font-mono text-slate-400">
                  {item.previousBalance !== undefined ? formatCurrency(item.previousBalance) : '—'}
                </td>
                <td className="py-2 px-3 text-right font-mono text-slate-400">
                  {item.previousBalance !== undefined ? formatCurrency(item.previousBalance + item.amount) : '—'}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-[92vw] max-w-[1400px] h-[90vh] bg-slate-900/80 border border-white/10 rounded-[40px] shadow-2xl overflow-hidden flex flex-col relative">
        <div className="bg-white/5 border-b border-white/5 p-6 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black italic text-white uppercase tracking-tighter">Historia Finansowa</h2>
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{club.name}</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-all text-2xl">&times;</button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          {history.length > 0 ? (
            <>
              {/* ── SEKCJA WYKRESÓW SŁUPKOWYCH ── */}
              {monthlyData.length > 0 && (
                <div className="mb-8 bg-white/[0.03] border border-white/8 rounded-2xl overflow-hidden">
                  {/* nagłówek sekcji */}
                  <div className="flex items-center justify-between px-6 py-3 border-b border-white/5 bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Wynik miesięczny</span>
                      <span className="flex items-center gap-1.5 text-[9px] font-black text-slate-600 uppercase tracking-widest">
                        <span className="inline-block w-2 h-2 rounded-sm bg-emerald-500" />zysk
                        <span className="inline-block w-2 h-2 rounded-sm bg-rose-500 ml-2" />strata
                      </span>
                    </div>
                    <span className="text-[9px] font-mono text-slate-600">max: {formatCurrency(maxAbsNet)}</span>
                  </div>

                  {/* obszar wykresu */}
                  <div className="flex gap-0 px-4 py-4">
                    {/* oś Y */}
                    <div className="flex flex-col justify-between items-end pr-2 shrink-0" style={{ height: `${BAR_HALF * 2 + 20}px` }}>
                      <span className="text-[8px] font-mono text-emerald-600">{formatCurrency(maxAbsNet)}</span>
                      <span className="text-[8px] font-mono text-slate-600">0</span>
                      <span className="text-[8px] font-mono text-rose-600">-{formatCurrency(maxAbsNet)}</span>
                    </div>

                    {/* słupki */}
                    <div className="flex-1 flex items-start gap-1 relative" style={{ height: `${BAR_HALF * 2 + 20}px` }}>
                      {/* linia bazowa 0 */}
                      <div
                        className="absolute left-0 right-0 border-t border-white/15 z-0"
                        style={{ top: `${BAR_HALF}px` }}
                      />
                      {monthlyData.map(({ key, label, net }) => {
                        const pct = Math.abs(net) / maxAbsNet;
                        const barH = Math.max(Math.round(pct * BAR_HALF), 3);
                        const isPositive = net >= 0;
                        const isHovered = hoveredMonth === key;
                        return (
                          <div
                            key={key}
                            className="flex-1 flex flex-col items-center relative cursor-default z-10"
                            style={{ height: `${BAR_HALF * 2 + 20}px` }}
                            onMouseEnter={() => setHoveredMonth(key)}
                            onMouseLeave={() => setHoveredMonth(null)}
                          >
                            {/* Tooltip */}
                            {isHovered && (
                              <div className="absolute z-20 bg-slate-800 border border-white/10 rounded-lg px-2 py-1.5 whitespace-nowrap pointer-events-none shadow-xl"
                                style={{ top: isPositive ? `${BAR_HALF - barH - 48}px` : `${BAR_HALF + barH + 4}px` }}>
                                <span className="text-[9px] font-black text-slate-400 block">{label}</span>
                                <span className={`text-[11px] font-black font-mono ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                                  {isPositive ? '+' : ''}{formatCurrency(net)}
                                </span>
                              </div>
                            )}
                            {/* Górna połowa — zyski rosną od środka w górę */}
                            <div className="flex flex-col justify-end" style={{ height: `${BAR_HALF}px` }}>
                              {isPositive && (
                                <div
                                  className="w-full rounded-t-sm transition-all"
                                  style={{
                                    height: `${barH}px`,
                                    background: isHovered ? '#34d399' : '#10b981',
                                    minWidth: '6px',
                                    boxShadow: isHovered ? '0 0 8px #10b98166' : 'none',
                                  }}
                                />
                              )}
                            </div>
                            {/* Dolna połowa — straty opadają od środka w dół */}
                            <div className="flex flex-col justify-start" style={{ height: `${BAR_HALF}px` }}>
                              {!isPositive && (
                                <div
                                  className="w-full rounded-b-sm transition-all"
                                  style={{
                                    height: `${barH}px`,
                                    background: isHovered ? '#fb7185' : '#f43f5e',
                                    minWidth: '6px',
                                    boxShadow: isHovered ? '0 0 8px #f43f5e66' : 'none',
                                  }}
                                />
                              )}
                            </div>
                            {/* etykieta miesiąca */}
                            <span className="text-[8px] font-mono text-slate-600 mt-1 truncate w-full text-center" style={{ height: '20px' }}>{label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ── TABELE ── */}
              <TableSection title="Przychody" rows={incomes} isIncome={true} />
              <TableSection title="Wydatki" rows={expenses} isIncome={false} />
            </>
          ) : (
            <div className="py-20 text-center opacity-20">
              <span className="text-4xl block mb-4">💰</span>
              <p className="text-sm font-black uppercase tracking-widest italic">Brak operacji finansowych w historii</p>
            </div>
          )}
        </div>

        <div className="p-6 bg-black/20 border-t border-white/5">
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
              <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest block mb-1">Suma przychodów</span>
              <span className="text-sm font-black font-mono text-emerald-400">+{formatCurrency(totalIncome)}</span>
            </div>
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3">
              <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest block mb-1">Suma wydatków</span>
              <span className="text-sm font-black font-mono text-rose-400">-{formatCurrency(totalExpense)}</span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Saldo</span>
              <span className="text-sm font-black font-mono text-white">{formatCurrency(club.budget)}</span>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
              <span className="text-[9px] font-black text-yellow-500 uppercase tracking-widest block mb-1">Budżet transferowy</span>
              <span className="text-sm font-black font-mono text-yellow-400">{formatCurrency(club.transferBudget)}</span>
            </div>
          </div>
          <button onClick={onClose} className="w-full px-10 py-3 bg-white text-slate-900 font-black italic uppercase tracking-widest text-xs rounded-xl hover:scale-105 transition-all shadow-xl">Zamknij</button>
        </div>
      </div>
    </div>
  );
};
