import { RequisitionRole, RequisitionStatus } from '../types';

/**
 * Formats roles array for compact table display: e.g. "Junior Lab Technician +2 more" or "Lab Technician"
 */
export function formatRolesDisplay(roles: RequisitionRole[]): { primary: string; countBadge?: string } {
  if (!roles || roles.length === 0) {
    return { primary: 'No roles assigned' };
  }

  const primary = roles[0].roleName;
  if (roles.length === 1) {
    return { primary };
  }

  const remaining = roles.length - 1;
  return {
    primary,
    countBadge: `+${remaining} more`
  };
}

/**
 * Returns color classes for requisition status badge according to Orange Health design system
 */
export function getStatusBadgeConfig(status: RequisitionStatus): {
  bg: string;
  text: string;
  dot: string;
  border: string;
  label: string;
} {
  switch (status) {
    case 'Open':
      return {
        bg: 'bg-orange-50',
        text: 'text-orange-700',
        dot: 'bg-orange-500',
        border: 'border-orange-200',
        label: 'OPEN'
      };
    case 'On Hold':
      return {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        dot: 'bg-amber-500',
        border: 'border-amber-200',
        label: 'ON HOLD'
      };
    case 'Closed':
      return {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        dot: 'bg-emerald-600',
        border: 'border-emerald-200',
        label: 'CLOSED'
      };
    case 'Cancelled':
      return {
        bg: 'bg-red-50',
        text: 'text-red-700',
        dot: 'bg-red-500',
        border: 'border-red-200',
        label: 'CANCELLED'
      };
    default:
      return {
        bg: 'bg-gray-50',
        text: 'text-gray-700',
        dot: 'bg-gray-400',
        border: 'border-gray-200',
        label: status
      };
  }
}
