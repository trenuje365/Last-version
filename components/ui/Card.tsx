import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
  action?: React.ReactNode;
  style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({ children, title, className = '', action, style }) => {
  return (
    <div 
      className={`border border-slate-700 rounded-lg overflow-hidden shadow-lg ${className.includes('bg-') ? '' : 'bg-slate-800'} ${className}`}
      style={style}
    >
      {title && (
        <div className="px-4 py-3 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
          <h3 className="text-slate-100 font-semibold text-lg">{title}</h3>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-4">
        {children}
      </div>
    </div>
  );
};