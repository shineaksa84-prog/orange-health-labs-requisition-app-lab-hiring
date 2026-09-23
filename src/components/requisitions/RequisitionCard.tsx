import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Requisition } from '../../types';
import { StatusBadge } from '../ui/StatusBadge';
import { formatRolesDisplay } from '../../utils/formatters';
import { calculateRequisitionAge, formatShortDate } from '../../utils/dateUtils';
import { ArrowRight, Clock, Users, MapPin } from 'lucide-react';

interface RequisitionCardProps {
  requisition: Requisition;
}

export const RequisitionCard: React.FC<RequisitionCardProps> = ({ requisition }) => {
  const navigate = useNavigate();
  const roleDisplay = formatRolesDisplay(requisition.roles);
  const age = calculateRequisitionAge(requisition.roleOpenDate, requisition.status, requisition.closedAt);

  return (
    <div
      onClick={() => navigate(`/requisitions/${requisition.id}`)}
      className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-card hover:border-[#FF6B00]/60 transition-all cursor-pointer space-y-3"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-neutral-900 text-sm">
            {requisition.requisitionCode}
          </span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-800 border border-neutral-200">
            {requisition.locationName}
          </span>
        </div>
        <StatusBadge status={requisition.status} size="sm" />
      </div>

      {/* Role and Positions */}
      <div className="flex items-center justify-between bg-neutral-50/75 p-2.5 rounded-xl border border-neutral-100">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-neutral-900 truncate">
            {roleDisplay.primary}
          </p>
          {roleDisplay.countBadge && (
            <p className="text-[10px] font-semibold text-[#FF6B00]">
              {roleDisplay.countBadge}
            </p>
          )}
        </div>
        <div className="text-right pl-3">
          <span className="text-sm font-bold text-neutral-900">
            {requisition.totalPositions}
          </span>
          <span className="text-[10px] text-neutral-500 block">Positions</span>
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between text-xs text-neutral-500 pt-1">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-neutral-400" />
          <span>{age}</span>
        </div>
        <div className="flex items-center gap-1 text-[#FF6B00] font-semibold">
          <span>View Requisition</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
};
