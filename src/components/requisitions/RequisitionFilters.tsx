import React from 'react';
import { LocationMaster, RoleMaster, UserProfile, RequisitionFilterParams } from '../../types';
import { Search, RotateCcw, Calendar, MapPin, Briefcase, Filter } from 'lucide-react';
import { Button } from '../ui/Button';

interface RequisitionFiltersProps {
  filters: RequisitionFilterParams;
  onChange: (filters: RequisitionFilterParams) => void;
  onReset: () => void;
  locations: LocationMaster[];
  roles: RoleMaster[];
  users: UserProfile[];
}

export const RequisitionFilters: React.FC<RequisitionFiltersProps> = ({
  filters,
  onChange,
  onReset,
  locations,
  roles,
  users,
}) => {
  const hasActiveFilters = Boolean(
    (filters.location && filters.location !== 'all') ||
    (filters.role && filters.role !== 'all') ||
    (filters.status && filters.status !== 'all') ||
    (filters.taOwner && filters.taOwner !== 'all') ||
    (filters.dateRangePreset && filters.dateRangePreset !== 'all') ||
    filters.searchQuery
  );

  return (
    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-neutral-200 shadow-card space-y-4">
      {/* Top Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by ID, location, role, owner, hiring manager..."
            value={filters.searchQuery || ''}
            onChange={(e) => onChange({ ...filters, searchQuery: e.target.value })}
            className="w-full bg-[#F7F7F5] border border-neutral-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#FF6B00] focus:border-transparent transition-all"
          />
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="md"
            onClick={onReset}
            leftIcon={<RotateCcw className="w-4 h-4" />}
            className="text-neutral-500 hover:text-neutral-800 self-end sm:self-auto"
          >
            Reset Filters
          </Button>
        )}
      </div>

      {/* Filter Dropdowns Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2 border-t border-neutral-100">
        {/* Location */}
        <div>
          <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
            Location
          </label>
          <select
            value={filters.location || 'all'}
            onChange={(e) => onChange({ ...filters, location: e.target.value })}
            className="w-full bg-[#F7F7F5] border border-neutral-200 rounded-xl px-3 py-2 text-xs font-medium text-neutral-800 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
          >
            <option value="all">All Locations</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.name}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>

        {/* Role */}
        <div>
          <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
            Role
          </label>
          <select
            value={filters.role || 'all'}
            onChange={(e) => onChange({ ...filters, role: e.target.value })}
            className="w-full bg-[#F7F7F5] border border-neutral-200 rounded-xl px-3 py-2 text-xs font-medium text-neutral-800 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
          >
            <option value="all">All Roles</option>
            {roles.map((r) => (
              <option key={r.id} value={r.name}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
            Status
          </label>
          <select
            value={filters.status || 'all'}
            onChange={(e) => onChange({ ...filters, status: e.target.value })}
            className="w-full bg-[#F7F7F5] border border-neutral-200 rounded-xl px-3 py-2 text-xs font-medium text-neutral-800 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
          >
            <option value="all">All Statuses</option>
            <option value="Open">Open</option>
            <option value="On Hold">On Hold</option>
            <option value="Closed">Closed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        {/* TA Owner */}
        <div>
          <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
            TA Owner
          </label>
          <select
            value={filters.taOwner || 'all'}
            onChange={(e) => onChange({ ...filters, taOwner: e.target.value })}
            className="w-full bg-[#F7F7F5] border border-neutral-200 rounded-xl px-3 py-2 text-xs font-medium text-neutral-800 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
          >
            <option value="all">All TA Owners</option>
            {users.map((u) => (
              <option key={u.id} value={u.name}>
                {u.name}
              </option>
            ))}
          </select>
        </div>

        {/* Date Preset */}
        <div>
          <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
            Open Date
          </label>
          <select
            value={filters.dateRangePreset || 'all'}
            onChange={(e) => onChange({ ...filters, dateRangePreset: e.target.value as any })}
            className="w-full bg-[#F7F7F5] border border-neutral-200 rounded-xl px-3 py-2 text-xs font-medium text-neutral-800 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="this_week">This Week</option>
            <option value="this_month">This Month</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>
      </div>

      {/* Custom Date Range pickers if selected */}
      {filters.dateRangePreset === 'custom' && (
        <div className="flex items-center gap-3 pt-2 bg-neutral-50 p-3 rounded-xl border border-neutral-200">
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-600 font-medium">From:</span>
            <input
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => onChange({ ...filters, startDate: e.target.value })}
              className="bg-white border border-neutral-300 rounded-lg px-2.5 py-1 text-xs text-neutral-900"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-600 font-medium">To:</span>
            <input
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => onChange({ ...filters, endDate: e.target.value })}
              className="bg-white border border-neutral-300 rounded-lg px-2.5 py-1 text-xs text-neutral-900"
            />
          </div>
        </div>
      )}
    </div>
  );
};
