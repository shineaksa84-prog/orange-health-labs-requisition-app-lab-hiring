import React from 'react';
import { RoleHiringSummary } from '../../types';
import { ArrowUpRight, Users, ChevronRight, MapPin } from 'lucide-react';
import { clsx } from 'clsx';

interface RoleBreakdownProps {
  roles: RoleHiringSummary[];
  onRoleClick: (roleName: string) => void;
}

export const RoleBreakdown: React.FC<RoleBreakdownProps> = ({ roles, onRoleClick }) => {
  const totalOpenPositions = roles.reduce((sum, r) => sum + r.openPositions, 0);

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-card space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-orange-50 text-[#FF6B00] flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-neutral-900 leading-none">Roles Currently Hiring</h3>
            <p className="text-[11px] text-neutral-500 mt-0.5">Aggregated requirements across active requisitions</p>
          </div>
        </div>
        <span className="text-xs font-semibold text-neutral-600 bg-neutral-100 px-2.5 py-1 rounded-full">
          {totalOpenPositions} total open
        </span>
      </div>

      <div className="divide-y divide-neutral-100">
        {roles.map((role) => {
          const percentage = totalOpenPositions > 0 
            ? Math.round((role.openPositions / totalOpenPositions) * 100) 
            : 0;

          return (
            <div
              key={role.roleId}
              onClick={() => onRoleClick(role.roleName)}
              className="py-3 first:pt-1 last:pb-1 flex flex-col gap-2 cursor-pointer group hover:bg-orange-50/40 p-2.5 rounded-xl transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-neutral-900 group-hover:text-[#FF6B00] transition-colors">
                    {role.roleName}
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-neutral-400 opacity-0 group-hover:opacity-100 group-hover:text-[#FF6B00] transition-all" />
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-neutral-900 bg-neutral-50 px-2 py-0.5 rounded-md border border-neutral-200">
                    {role.openPositions} {role.openPositions === 1 ? 'pos' : 'positions'}
                  </span>
                  <span className="text-[11px] text-neutral-400 w-10 text-right">
                    {percentage}%
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#FF6B00] h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(percentage, 3)}%` }}
                />
              </div>

              {/* Locations with active requisitions for this role */}
              {role.locations.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <span className="text-[10px] text-neutral-400 font-medium">Hubs:</span>
                  {role.locations.map((loc) => (
                    <span
                      key={loc}
                      className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-neutral-100 text-neutral-700"
                    >
                      {loc}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
