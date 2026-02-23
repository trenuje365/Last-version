
import React from 'react';
import { MailMessage, MailType } from '../../types';
import { useGame } from '../../context/GameContext';

interface MailDetailsModalProps {
  mail: MailMessage;
  onClose: () => void;
}

export const MailDetailsModal: React.FC<MailDetailsModalProps> = ({ mail, onClose }) => {
const { finalizeFreeAgentContract } = useGame();

  const getTypeColor = (type: MailType) => {
    switch (type) {
      case MailType.BOARD: return 'text-amber-500';
      case MailType.FANS: return 'text-rose-500';
      case MailType.STAFF: return 'text-blue-500';
      case MailType.MEDIA: return 'text-emerald-500';
      default: return 'text-slate-400';
    }
  };

  const getAvatarIcon = (type: MailType) => {
    switch (type) {
      case MailType.BOARD: return '🏛️';
      case MailType.FANS: return '📣';
      case MailType.STAFF: return '🩺';
      case MailType.MEDIA: return '📰';
      default: return '📧';
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in">
      <div className="max-w-2xl w-full bg-slate-900 border border-white/10 rounded-[40px] shadow-[0_50px_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col relative">
        
        {/* Top Header Identity */}
        <div className="bg-white/5 border-b border-white/5 p-8 flex items-center justify-between shrink-0">
           <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-3xl bg-black/40 flex items-center justify-center text-3xl shadow-inner border border-white/5">
                {getAvatarIcon(mail.type)}
              </div>
              <div>
                <span className={`text-[10px] font-black uppercase tracking-[0.4em] ${getTypeColor(mail.type)}`}>WIADOMOŚĆ PRZYCHODZĄCA</span>
                <h2 className="text-2xl font-black italic text-white uppercase tracking-tighter mt-1">{mail.sender}</h2>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{mail.role}</p>
              </div>
           </div>
           <button 
             onClick={onClose}
             className="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-all"
           >
             &times;
           </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-10 overflow-y-auto custom-scrollbar">
           <div className="mb-10">
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest block mb-2">Temat:</span>
              <h3 className="text-xl font-black text-white italic uppercase tracking-tight leading-relaxed">{mail.subject}</h3>
              <div className="w-12 h-1 bg-blue-500 rounded-full mt-4" />
           </div>

           <div className="prose prose-invert max-w-none">
              <p className="text-slate-300 leading-relaxed font-medium text-lg italic opacity-90">
                "{mail.body}"
              </p>
           </div>
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-white/5 bg-black/20 flex justify-between items-center shrink-0">
           <div className="flex flex-col">
              <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Wysłano:</span>
              <span className="text-[10px] font-black text-slate-400 uppercase">{mail.date.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
           </div>

 {mail.metadata?.type === 'CONTRACT_OFFER' && mail.metadata.accepted && (
                <button 
                onClick={() => {
                   finalizeFreeAgentContract(mail.id);
                   onClose();
                }}
                className="px-10 py-4 bg-emerald-600 text-white font-black italic uppercase tracking-widest text-xs rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl mr-4"
              >
                PODPISZ KONTRAKT ✍️
              </button>
           )}


           <button 
             onClick={onClose}
             className="px-10 py-4 bg-white text-slate-900 font-black italic uppercase tracking-widest text-xs rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl"
           >
             Zamknij Wiadomość
           </button>
        </div>

      </div>
    </div>
  );
};
