
import React from 'react';
import { Club } from '../../types';

interface ClubCardProps {
  club: Club;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
}

export const ClubCard: React.FC<ClubCardProps> = ({ club, isSelected, onClick, className = '' }) => {
  return (
    <div 
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-xl border-2 cursor-pointer transition-all duration-200 group
        ${isSelected 
          ? 'border-emerald-400 bg-slate-800 shadow-[0_0_20px_rgba(52,211,153,0.3)] scale-[1.02]' 
          : 'border-slate-700 bg-slate-800 hover:border-slate-500 hover:bg-slate-750'
        }
        ${className}
      `}
    >
      <div className="p-4 flex flex-col h-full justify-between relative z-10">
        <h3 className={`font-bold text-lg text-center leading-tight mb-3 ${isSelected ? 'text-white' : 'text-slate-200'}`}>
          {club.name}
        </h3>
        
        {/* Color Stripes */}
        <div className="flex h-4 w-full rounded overflow-hidden border border-slate-600/50 shadow-sm">
          <div style={{ backgroundColor: club.colorsHex[0] }} className="flex-1" />
          <div style={{ backgroundColor: club.colorsHex[1] }} className="flex-1" />
          <div style={{ backgroundColor: club.colorsHex[2] }} className="flex-1" />
        </div>
      </div>
      
      {/* Selection Glow */}
      {isSelected && (
        <div className="absolute inset-0 bg-emerald-500/10 z-0 pointer-events-none" />
      )}
    </div>
  );
};
