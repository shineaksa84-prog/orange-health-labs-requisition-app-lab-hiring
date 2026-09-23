import React from 'react';
import { LocationHiringSummary } from '../../types';
import { MapPin, ArrowRight } from 'lucide-react';
import { clsx } from 'clsx';

interface LocationCardProps {
  summary: LocationHiringSummary;
  onClick: () => void;
}

export const LocationCard: React.FC<LocationCardProps> = ({ summary, onClick }) => {
  const hasHiring = summary.openPositions > 0;

  return (
    <div
      onClick={onClick}
      className={clsx(
        "group p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between shadow-card",
        hasHiring 
          ? "bg-white hover:border-[#FF6B00] hover:shadow-card-hover" 
          : "bg-neutral-50/60 border-neutral-200/80 hover:bg-white"
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={clsx(
            "w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs",
            hasHiring ? "bg-orange-50 text-[#FF6B00] border border-orange-200/60" : "bg-neutral-200/60 text-neutral-600"
          )}>
            <MapPin className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-sm text-neutral-900 group-hover:text-[#FF6B00] transition-colors">
            {summary.name}
          </span>
        </div>
        <ArrowRight className="w-4 h-4 text-neutral-400 opacity-0 group-hover:opacity-100 group-hover:text-[#FF6B00] transition-all transform group-hover:translate-x-0.5" />
      </div>

      <div className="space-y-1">
        <div className="flex items-baseline gap-1.5">
          <span className={clsx(
            "text-xl font-extrabold tracking-tight",
            hasHiring ? "text-neutral-900" : "text-neutral-400"
          )}>
            {summary.openPositions}
          </span>
          <span className="text-xs text-neutral-500 font-medium">
            {summary.openPositions === 1 ? 'open position' : 'open positions'}
          </span>
        </div>

        <div className="text-xs text-neutral-500">
          <span className="font-semibold text-neutral-700">{summary.openRequisitions}</span> {summary.openRequisitions === 1 ? 'requisition' : 'requisitions'}
        </div>
      </div>
    </div>
  );
};
