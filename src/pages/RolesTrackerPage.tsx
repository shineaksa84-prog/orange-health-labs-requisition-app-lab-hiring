import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RequisitionService } from '../services/requisitionService';
import { RoleMaster, LocationMaster, Requisition, RoleHiringSummary } from '../types';
import { 
  Layers, 
  Users, 
  MapPin, 
  ArrowRight, 
  Briefcase, 
  Filter, 
  Building2, 
  CheckCircle2, 
  Clock,
  Plus
} from 'lucide-react';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Button } from '../components/ui/Button';
import { RequisitionFormModal } from '../components/requisitions/RequisitionFormModal';
import { formatShortDate, calculateRequisitionAge } from '../utils/dateUtils';
import { CardSkeleton } from '../components/ui/Skeleton';

export const RolesTrackerPage: React.FC = () => {
  const navigate = useNavigate();
  const [roles, setRoles] = useState<RoleMaster[]>([]);
  const [locations, setLocations] = useState<LocationMaster[]>([]);
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [roleSummaries, setRoleSummaries] = useState<RoleHiringSummary[]>([]);
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rMaster, lMaster, reqs, summaries] = await Promise.all([
        RequisitionService.getRoles(),
        RequisitionService.getLocations(),
        RequisitionService.getAllRequisitions(),
        RequisitionService.getRoleSummaries(),
      ]);

      setRoles(rMaster);
      setLocations(lMaster);
      setRequisitions(reqs);
      setRoleSummaries(summaries);
    } catch (err) {
      console.error('Failed to load roles tracker data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openReqs = requisitions.filter(r => r.status === 'Open');
  const totalOpenPositions = roleSummaries.reduce((sum, r) => sum + r.openPositions, 0);

  // Filtered requisitions based on role selection
  const displayedReqs = openReqs.filter(req => {
    if (selectedRoleFilter === 'all') return true;
    return req.roles.some(r => r.roleName.toLowerCase() === selectedRoleFilter.toLowerCase());
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-neutral-200 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FF6B00]">Diagnostics Workforce Tracker</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B00]" />
            <span className="text-xs font-semibold text-neutral-400">Open Roles</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
            Lab Roles & Designations Tracker
          </h1>
          <p className="text-sm text-neutral-500 mt-1 font-medium">
            Real-time breakdown of open vacancies, designations, and laboratory requirements across all hubs.
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          variant="primary"
          size="lg"
          leftIcon={<Plus className="w-5 h-5" />}
          className="self-start sm:self-auto shadow-md"
        >
          New Requisition
        </Button>
      </div>

      {/* Role Cards Matrix */}
      {loading ? (
        <CardSkeleton count={5} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {roleSummaries.map((summary) => {
            const isSelected = selectedRoleFilter.toLowerCase() === summary.roleName.toLowerCase();
            return (
              <div
                key={summary.roleId}
                onClick={() => setSelectedRoleFilter(isSelected ? 'all' : summary.roleName)}
                className={`bg-white p-5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between shadow-card hover:shadow-card-hover ${
                  isSelected ? 'border-[#FF6B00] ring-2 ring-[#FF6B00]/20 bg-orange-50/20' : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                      Role Designation
                    </span>
                    <span className="w-2 h-2 rounded-full bg-[#FF6B00]" />
                  </div>
                  <h3 className="text-base font-bold text-neutral-900 leading-snug">
                    {summary.roleName}
                  </h3>
                </div>

                <div className="mt-4 pt-3 border-t border-neutral-100 space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-black text-neutral-900">
                      {summary.openPositions}
                    </span>
                    <span className="text-xs font-semibold text-neutral-500">
                      {summary.openRequisitions} {summary.openRequisitions === 1 ? 'req' : 'reqs'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 flex-wrap">
                    {summary.locations.length > 0 ? (
                      summary.locations.map(loc => (
                        <span key={loc} className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-700">
                          {loc}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-neutral-400">No active hub</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Role vs Location Distribution Matrix */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-neutral-900 tracking-tight">Role × Location Hiring Matrix</h2>
            <p className="text-xs text-neutral-500">Cross-tabular view of open vacancy counts by lab facility</p>
          </div>
          <span className="text-xs font-bold text-[#FF6B00] bg-orange-50 px-3 py-1.5 rounded-xl border border-orange-200/60 self-start sm:self-auto">
            {totalOpenPositions} Total Active Vacancies
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50/75 text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                <th className="py-3 px-4">Role Designation</th>
                {locations.map(loc => (
                  <th key={loc.id} className="py-3 px-3 text-center">{loc.name}</th>
                ))}
                <th className="py-3 px-4 text-right pr-6">Total Positions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-sm">
              {roles.map(role => {
                let roleTotal = 0;
                return (
                  <tr
                    key={role.id}
                    onClick={() => setSelectedRoleFilter(role.name)}
                    className="hover:bg-orange-50/40 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-bold text-neutral-900">
                      {role.name}
                    </td>

                    {locations.map(loc => {
                      // Calculate open positions for this role in this location
                      let posCount = 0;
                      openReqs.forEach(req => {
                        if (req.locationId === loc.id || req.locationName === loc.name || req.locationName === loc.code) {
                          const matched = req.roles?.find(
                            r => r.roleId === role.id || r.roleName.toLowerCase() === role.name.toLowerCase()
                          );
                          if (matched) posCount += Number(matched.numberOfPositions) || 0;
                        }
                      });
                      roleTotal += posCount;

                      return (
                        <td key={loc.id} className="py-3 px-3 text-center">
                          {posCount > 0 ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-orange-100 text-[#FF6B00] font-bold text-xs">
                              {posCount}
                            </span>
                          ) : (
                            <span className="text-neutral-300 font-mono text-xs">—</span>
                          )}
                        </td>
                      );
                    })}

                    <td className="py-3 px-4 text-right pr-6 font-extrabold text-neutral-900">
                      <span className="bg-neutral-100 px-2.5 py-1 rounded-lg text-sm text-neutral-900">
                        {roleTotal}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Active Requisitions Matching Role */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-[#FF6B00]" />
            <h2 className="text-lg font-bold text-neutral-900 tracking-tight">
              {selectedRoleFilter === 'all' 
                ? 'Active Requisitions Across All Roles' 
                : `Active Requisitions for ${selectedRoleFilter}`}
            </h2>
          </div>
          {selectedRoleFilter !== 'all' && (
            <button
              onClick={() => setSelectedRoleFilter('all')}
              className="text-xs font-semibold text-[#FF6B00] hover:underline"
            >
              Show all roles
            </button>
          )}
        </div>

        {displayedReqs.length === 0 ? (
          <p className="text-sm text-neutral-500 py-6 text-center">
            No active requisitions found for this selection.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedReqs.map(req => {
              const age = calculateRequisitionAge(req.roleOpenDate, req.status, req.closedAt);
              return (
                <div
                  key={req.id}
                  onClick={() => navigate(`/requisitions/${req.id}`)}
                  className="p-4 rounded-xl border border-neutral-200 hover:border-[#FF6B00] transition-all cursor-pointer bg-neutral-50/50 hover:bg-white shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-sm text-neutral-900">
                      {req.requisitionCode}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-white border border-neutral-200 text-neutral-800">
                      {req.locationName}
                    </span>
                  </div>

                  <div className="space-y-1">
                    {req.roles.map(r => (
                      <div key={r.roleId} className="flex items-center justify-between text-xs">
                        <span className="text-neutral-700 font-medium">{r.roleName}</span>
                        <span className="font-bold text-neutral-900 bg-white px-2 py-0.5 rounded border border-neutral-200">
                          {r.numberOfPositions} pos
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-2 border-t border-neutral-200/60">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{age}</span>
                    </div>
                    <span className="font-medium text-neutral-700">TA: {req.taOwnerName.split(' ')[0]}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <RequisitionFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => loadData()}
      />
    </div>
  );
};
