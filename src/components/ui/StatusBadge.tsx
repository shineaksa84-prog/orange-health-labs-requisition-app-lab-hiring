import React from 'react';
import { RequisitionStatus } from '../../types';
import { getStatusBadgeConfig } from '../../utils/formatters';
import { clsx } from 'clsx';

interface StatusBadgeProps {
  status: RequisitionStatus;
  size?: 'sm' | 'md';
  showDot?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showDot = true,
  className
}) => {
  const config = getStatusBadgeConfig(status);

  return (
    <span
      className={clsx(
        "inline-flex items-center font-semibold rounded-md border tracking-wider uppercase",
        config.bg,
        config.text,
        config.border,
        size === 'sm' ? 'text-[10px] px-2 py-0.5 gap-1' : 'text-xs px-2.5 py-1 gap-1.5',
        className
      )}
    >
      {showDot && (
        <span className={clsx("w-1.5 h-1.5 rounded-full", config.dot)} />
      )}
      {config.label}
    </span>
  );
};
