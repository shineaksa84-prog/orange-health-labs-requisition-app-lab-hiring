import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Requisition } from '../../types';
import { StatusBadge } from '../ui/StatusBadge';
import { formatRolesDisplay } from '../../utils/formatters';
import { calculateRequisitionAge, formatShortDate } from '../../utils/dateUtils';
import { ArrowUpRight, MoreVertical, Edit3, CheckCircle, Clock } from 'lucide-react';

interface RequisitionTableProps {
  requisitions: Requisition[];
  onEdit: (req: Requisition) => void;
  onChangeStatus: (req: Requisition) => void;
}

export const RequisitionTable: React.FC<RequisitionTableProps> = ({
  requisitions,
  onEdit,
  onChangeStatus,
}) => {
  const navigate = useNavigate();

  return (
    <div className="w-full bg-white rounded-2xl border border-neutral-200 shadow-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50/75 text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
              <th className="py-3.5 px-4 sm:px-6">Requisition ID</th>
              <th className="py-3.5 px-4">Location</th>
              <th className="py-3.5 px-4">Roles & Designations</th>
              <th className="py-3.5 px-4 text-center">Positions</th>
              <th className="py-3.5 px-4">Open Date</th>
              <th className="py-3.5 px-4">Age</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4">TA Owner</th>
              <th className="py-3.5 px-4 text-right pr-6">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 text-sm">
            {requisitions.map((req) => {
              const roleDisplay = formatRolesDisplay(req.roles);
              const age = calculateRequisitionAge(req.roleOpenDate, req.status, req.closedAt);

              return (
                <tr
                  key={req.id}
                  onClick={() => navigate(`/requisitions/${req.id}`)}
                  className="hover:bg-orange-50/40 cursor-pointer transition-colors group"
                >
                  {/* Requisition ID */}
                  <td className="py-3.5 px-4 sm:px-6">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-neutral-900 group-hover:text-[#FF6B00] transition-colors">
                        {req.requisitionCode}
                      </span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-neutral-400 opacity-0 group-hover:opacity-100 group-hover:text-[#FF6B00] transition-all" />
                    </div>
                  </td>

                  {/* Location */}
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md font-semibold text-xs bg-neutral-100 text-neutral-800 border border-neutral-200">
                      {req.locationName}
                    </span>
                  </td>

                  {/* Roles */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-medium text-neutral-800 text-xs sm:text-sm">
                        {roleDisplay.primary}
                      </span>
                      {roleDisplay.countBadge && (
                        <span className="text-[11px] font-semibold text-[#FF6B00] bg-orange-50 px-1.5 py-0.5 rounded-full border border-orange-200/60">
                          {roleDisplay.countBadge}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Positions */}
                  <td className="py-3.5 px-4 text-center">
                    <span className="font-bold text-neutral-900 text-sm bg-neutral-50 px-2 py-1 rounded-lg border border-neutral-200/60">
                      {req.totalPositions}
                    </span>
                  </td>

                  {/* Open Date */}
                  <td className="py-3.5 px-4 text-xs text-neutral-600 font-medium">
                    {formatShortDate(req.roleOpenDate)}
                  </td>

                  {/* Age */}
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-neutral-600">
                      <Clock className="w-3 h-3 text-neutral-400" />
                      {age}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4">
                    <StatusBadge status={req.status} size="sm" />
                  </td>

                  {/* TA Owner */}
                  <td className="py-3.5 px-4 text-xs font-medium text-neutral-700">
                    {req.taOwnerName?.split(' ')[0] || req.taOwnerName}
                  </td>

                  {/* Actions */}
                  <td 
                    className="py-3.5 px-4 text-right pr-6"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onEdit(req)}
                        className="p-1.5 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
                        title="Edit Requisition"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onChangeStatus(req)}
                        className="p-1.5 text-neutral-400 hover:text-[#FF6B00] hover:bg-orange-50 rounded-lg transition-colors"
                        title="Change Status"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
