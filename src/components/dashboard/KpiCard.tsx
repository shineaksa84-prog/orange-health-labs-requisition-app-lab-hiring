import React from 'react';
import { clsx } from 'clsx';

interface KpiCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  description?: string;
  highlight?: boolean;
  onClick?: () => void;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  icon,
  description,
  highlight = false,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={clsx(
        "bg-white p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between shadow-card",
        onClick ? "cursor-pointer hover:border-[#FF6B00] hover:shadow-card-hover" : "cursor-default",
        highlight ? "border-orange-200 bg-gradient-to-br from-white to-orange-50/30" : "border-neutral-200"
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
          {label}
        </span>
        <div className={clsx(
          "w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0",
          highlight ? "bg-orange-100 text-[#FF6B00]" : "bg-neutral-100 text-neutral-600"
        )}>
          {icon}
        </div>
      </div>

      <div>
        <div className="text-3xl font-extrabold text-neutral-900 tracking-tight leading-tight">
          {value}
        </div>
        {description && (
          <p className="text-[11px] text-neutral-500 mt-1 font-medium">
            {description}
          </p>
        )}
      </div>
    </div>
  );
};
