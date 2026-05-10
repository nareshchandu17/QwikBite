
import React from 'react';

interface KpiCardProps {
  title: string;
  value: string;
  change: string;
  isCurrency?: boolean;
  icon?: React.ReactNode;
  onClick?: () => void;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, change, isCurrency, icon, onClick }) => {
  const isPositive = change.startsWith('+') || change === 'Now' || change === 'Popular';
  const isNeutral = !isPositive && !change.startsWith('-');

  return (
    <div 
      className="group relative rounded-2xl p-5 overflow-hidden cursor-pointer
      bg-[rgba(20,20,20,0.6)]
      backdrop-blur-[24px] [-webkit-backdrop-filter:blur(24px)]
      border border-[rgba(255,255,255,0.08)]
      shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]
      transition-all duration-300
      ease-[cubic-bezier(0.16,1,0.3,1)]
      hover:-translate-y-2 hover:shadow-lg hover:shadow-[#FF512F]/20 "
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
    >
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#FF512F]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="relative z-10">
          <p className="text-sm font-medium text-[#9ca3af] mb-2">{title}</p>
          <h3 className="text-2xl lg:text-3xl font-bold text-white">{value}</h3>
      
        
      
         <div className={`text-xs font-semibold px-2 py-1 rounded-full inline-block${
          isPositive 
            ? 'bg-[#4CAF50]/20 text-[#4CAF50]' 
            : isNeutral 
              ? 'bg-[#9ca3af]/20 text-[#9ca3af]' 
              : 'bg-[#FF3D00]/20 text-[#FF3D00]'
        }`}>
          {change}
        </div>
      </div>
    </div>
  );
};

export default KpiCard;
