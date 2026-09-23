import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { RequisitionService } from '../services/requisitionService';
import { 
  Requisition, 
  DashboardKPIs, 
  LocationHiringSummary, 
  RoleHiringSummary 
} from '../types';
import { KpiCard } from '../components/dashboard/KpiCard';
import { LocationCard } from '../components/dashboard/LocationCard';
import { RoleBreakdown } from '../components/dashboard/RoleBreakdown';
import { RequisitionTable } from '../components/requisitions/RequisitionTable';
import { RequisitionCard } from '../components/requisitions/RequisitionCard';
import { CardSkeleton, TableSkeleton } from '../components/ui/Skeleton';
import { StatusChangeModal } from '../components/requisitions/StatusChangeModal';
import { RequisitionFormModal } from '../components/requisitions/RequisitionFormModal';
import { 
  ClipboardCheck, 
  Users, 
  MapPin, 
  Briefcase, 
  Calendar, 
  ArrowRight,
  TrendingUp,
  Plus
} from 'lucide-react';
import { Button } from '../components/ui/Button';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [locationSummaries, setLocationSummaries] = useState<LocationHiringSummary[]>([]);
  const [roleSummaries, setRoleSummaries] = useState<RoleHiringSummary[]>([]);
  const [activeRequisitions, setActiveRequisitions] = useState<Requisition[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals
  const [editingRequisition, setEditingRequisition] = useState<Requisition | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [statusModalRequisition, setStatusModalRequisition] = useState<Requisition | null>(null);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [kpiData, locs, roles, allReqs] = await Promise.all([
        RequisitionService.getDashboardKPIs(),
        RequisitionService.getLocationSummaries(),
        RequisitionService.getRoleSummaries(),
        RequisitionService.getAllRequisitions(),
      ]);

      setKpis(kpiData);
      setLocationSummaries(locs);
      setRoleSummaries(roles);
      // Filter open requisitions for Active Hiring section (limit to top 6)
      setActiveRequisitions(allReqs.filter(r => r.status === 'Open').slice(0, 6));
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const firstName = user?.name?.split(' ')[0] || 'Team';

  const handleLocationClick = (locName: string) => {
    navigate(`/requisitions?location=${encodeURIComponent(locName)}`);
  };

  const handleRoleClick = (roleName: string) => {
    navigate(`/requisitions?role=${encodeURIComponent(roleName)}`);
  };

  const handleEditRequisition = (req: Requisition) => {
    setEditingRequisition(req);
    setIsFormModalOpen(true);
  };

  const handleChangeStatus = (req: Requisition) => {
    setStatusModalRequisition(req);
  };

  const handleFormSuccess = () => {
    loadDashboardData();
  };

  const handleStatusUpdated = () => {
    loadDashboardData();
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-7 rounded-3xl border border-neutral-200 shadow-card">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FF6B00]">Lab Hiring Overview</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B00]" />
            <span className="text-xs font-semibold text-neutral-400">Live Pulse</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
            Good morning, {firstName}
          </h1>
          <p className="text-sm text-neutral-500 mt-1 font-medium">
            Here's the current view of lab hiring requirements across locations.
          </p>
        </div>

        <Button
          onClick={() => {
            setEditingRequisition(null);
            setIsFormModalOpen(true);
          }}
          variant="primary"
          size="lg"
          leftIcon={<Plus className="w-5 h-5" />}
          className="self-start sm:self-auto shadow-md"
        >
          New Requisition
        </Button>
      </div>

      {/* 5 KPI Cards */}
      {loading || !kpis ? (
        <CardSkeleton count={5} />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
          <KpiCard
            label="Open Requisitions"
            value={kpis.openRequisitions}
            icon={<ClipboardCheck className="w-4 h-4" />}
            description="Active hiring mandates"
            highlight={true}
            onClick={() => navigate('/requisitions?status=Open')}
          />
          <KpiCard
            label="Open Positions"
            value={kpis.openPositions}
            icon={<Users className="w-4 h-4" />}
            description="Total vacancies across labs"
            highlight={true}
            onClick={() => navigate('/roles-tracker')}
          />
          <KpiCard
            label="Locations Hiring"
            value={kpis.locationsHiring}
            icon={<MapPin className="w-4 h-4" />}
            description="Diagnostic lab hubs active"
            onClick={() => navigate('/requisitions')}
          />
          <KpiCard
            label="Roles Hiring"
            value={kpis.rolesHiring}
            icon={<Briefcase className="w-4 h-4" />}
            description="Unique designations open"
            onClick={() => navigate('/roles-tracker')}
          />
          <KpiCard
            label="New This Month"
            value={kpis.newThisMonth}
            icon={<Calendar className="w-4 h-4" />}
            description="Opened in current month"
            onClick={() => navigate('/requisitions?dateRange=this_month')}
          />
        </div>
      )}

      {/* Location Overview: 8 Compact Cards */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-neutral-900 tracking-tight">Hiring by Location</h2>
            <p className="text-xs text-neutral-500">Click any diagnostic hub to inspect its active requirements</p>
          </div>
          <button
            onClick={() => navigate('/requisitions')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#FF6B00] hover:text-[#E65A00]"
          >
            <span>View All Requisitions</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {locationSummaries.map((summary) => (
            <LocationCard
              key={summary.code}
              summary={summary}
              onClick={() => handleLocationClick(summary.name)}
            />
          ))}
        </div>
      </div>

      {/* Grid: Active Hiring Table + Roles Currently Hiring */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Active Hiring Table (2 Columns) */}
        <div className="lg:col-span-2 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#FF6B00]" />
              <h2 className="text-lg font-bold text-neutral-900 tracking-tight">Active Hiring</h2>
            </div>
            <button
              onClick={() => navigate('/requisitions?status=Open')}
              className="text-xs font-semibold text-[#FF6B00] hover:underline"
            >
              See all ({kpis?.openRequisitions || activeRequisitions.length})
            </button>
          </div>

          {loading ? (
            <TableSkeleton rows={5} columns={6} />
          ) : activeRequisitions.length === 0 ? (
            <div className="bg-white p-8 text-center rounded-2xl border border-neutral-200 text-sm text-neutral-500">
              No active open requisitions found.
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden sm:block">
                <RequisitionTable
                  requisitions={activeRequisitions}
                  onEdit={handleEditRequisition}
                  onChangeStatus={handleChangeStatus}
                />
              </div>
              {/* Mobile Cards */}
              <div className="sm:hidden space-y-3">
                {activeRequisitions.map((req) => (
                  <RequisitionCard key={req.id} requisition={req} />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Roles Currently Hiring (1 Column) */}
        <div className="space-y-3.5">
          <RoleBreakdown
            roles={roleSummaries}
            onRoleClick={handleRoleClick}
          />
        </div>
      </div>

      {/* Location Hiring Snapshot Table */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-card space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-neutral-900 tracking-tight">Location Hiring Snapshot</h2>
            <p className="text-xs text-neutral-500">Real-time operational distribution across hubs</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50/75 text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                <th className="py-2.5 px-4">Location</th>
                <th className="py-2.5 px-4 text-right">Open Requisitions</th>
                <th className="py-2.5 px-4 text-right pr-6">Open Positions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-sm">
              {locationSummaries.map((loc) => (
                <tr
                  key={loc.code}
                  onClick={() => handleLocationClick(loc.name)}
                  className="hover:bg-orange-50/40 cursor-pointer transition-colors"
                >
                  <td className="py-2.5 px-4 font-bold text-neutral-900">
                    <span className="inline-flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-orange-400" />
                      {loc.name}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right font-semibold text-neutral-700">
                    {loc.openRequisitions}
                  </td>
                  <td className="py-2.5 px-4 text-right pr-6 font-extrabold text-[#FF6B00]">
                    {loc.openPositions}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Form Modal */}
      <RequisitionFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingRequisition(null);
        }}
        onSuccess={handleFormSuccess}
        editingRequisition={editingRequisition}
      />

      {/* Status Change Modal */}
      <StatusChangeModal
        isOpen={Boolean(statusModalRequisition)}
        onClose={() => setStatusModalRequisition(null)}
        requisition={statusModalRequisition}
        onStatusUpdated={handleStatusUpdated}
      />
    </div>
  );
};
