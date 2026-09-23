import React from 'react';
import { ClipboardList } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No lab requisitions yet',
  description = 'Create your first hiring requirement to start tracking lab hiring.',
  actionText = '+ New Requisition',
  onAction,
  icon
}) => {
  return (
    <div className="w-full flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-dashed border-neutral-300">
      <div className="w-14 h-14 rounded-2xl bg-orange-50 text-[#FF6B00] flex items-center justify-center mb-4">
        {icon || <ClipboardList className="w-7 h-7" />}
      </div>
      <h3 className="text-base font-semibold text-neutral-900">{title}</h3>
      <p className="text-sm text-neutral-500 max-w-sm mt-1 mb-6">
        {description}
      </p>
      {onAction && actionText && (
        <Button onClick={onAction} variant="primary" size="md">
          {actionText}
        </Button>
      )}
    </div>
  );
};
