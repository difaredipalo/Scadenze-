
import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon: React.ReactNode;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, subValue, icon, color }) => {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className="p-3 rounded-xl text-white flex-shrink-0" style={{ backgroundColor: color }}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">{label}</p>
        <h3 className="text-xl font-black text-slate-900 leading-none mt-1">{value}</h3>
        {subValue && <p className="text-[9px] text-slate-400 mt-1 truncate font-bold">{subValue}</p>}
      </div>
    </div>
  );
};

export default StatCard;
