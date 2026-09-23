import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { RequisitionService } from '../services/requisitionService';
import { 
  Requisition, 
  LocationMaster, 
  RoleMaster, 
  UserProfile, 
  RequisitionFilterParams 
} from '../types';
import { RequisitionTable } from '../components/requisitions/RequisitionTable';
import { RequisitionCard } from '../components/requisitions/RequisitionCard';
import { RequisitionFilters } from '../components/requisitions/RequisitionFilters';
import { RequisitionFormModal } from '../components/requisitions/RequisitionFormModal';
import { StatusChangeModal } from '../components/requisitions/StatusChangeModal';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { TableSkeleton } from '../components/ui/Skeleton';
import { exportRequisitionsToCSV } from '../utils/exportCsv';
import { useToast } from '../context/ToastContext';
import { Plus, Download, Filter, LayoutGrid, List } from 'lucide-react';

export const RequisitionsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [locations, setLocations] = useState<LocationMaster[]>([]);
  const [roles, setRoles] = useState<RoleMaster[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [editingRequisition, setEditingRequisition] = useState<Requisition | null>(null);
  const [statusModalRequisition, setStatusModalRequisition] = useState<Requisition | null>(null);

  // Filters state from URL or defaults
  const [filters, setFilters] = useState<RequisitionFilterParams>({
    location: searchParams.get('location') || 'all',
    role: searchParams.get('role') || 'all',
    status: searchParams.get('status') || 'all',
    taOwner: searchParams.get('taOwner') || 'all',
    dateRangePreset: (searchParams.get('dateRange') as any) || 'all',
    searchQuery: searchParams.get('q') || '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [locs, rls, usrs, filteredData] = await Promise.all([
        RequisitionService.getLocations(),
        RequisitionService.getRoles(),
        RequisitionService.getUsers(),
        RequisitionService.getFilteredRequisitions(filters),
      ]);
      setLocations(locs);
      setRoles(rls);
      setUsers(usrs);
      setRequisitions(filteredData);
    } catch (err) {
      console.error('Failed to load requisitions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filters]);

  const handleFilterChange = (newFilters: RequisitionFilterParams) => {
    setFilters(newFilters);
    // Sync URL search params
    const params: Record<string, string> = {};
    if (newFilters.location && newFilters.location !== 'all') params.location = newFilters.location;
    if (newFilters.role && newFilters.role !== 'all') params.role = newFilters.role;
    if (newFilters.status && newFilters.status !== 'all') params.status = newFilters.status;
    if (newFilters.taOwner && newFilters.taOwner !== 'all') params.taOwner = newFilters.taOwner;
    if (newFilters.dateRangePreset && newFilters.dateRangePreset !== 'all') params.dateRange = newFilters.dateRangePreset;
    if (newFilters.searchQuery) params.q = newFilters.searchQuery;
    setSearchParams(params);
  };

  const handleResetFilters = () => {
    const emptyFilters: RequisitionFilterParams = {
      location: 'all',
      role: 'all',
      status: 'all',
      taOwner: 'all',
      dateRangePreset: 'all',
      searchQuery: '',
    };
    setFilters(emptyFilters);
    setSearchParams({});
  };

  const handleExportCSV = () => {
    if (requisitions.length === 0) {
      toast.info('No requisitions to export', 'Try resetting filters to export all records.');
      return;
    }
    exportRequisitionsToCSV(requisitions);
    toast.success('Export downloaded', `Exported ${requisitions.length} requisitions as analytics CSV.`);
  };

  const handleEdit = (req: Requisition) => {
    setEditingRequisition(req);
    setIsFormModalOpen(true);
  };

  const handleChangeStatus = (req: Requisition) => {
    setStatusModalRequisition(req);
  };

  const handleModalSuccess = () => {
    loadData();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 sm:p-7 rounded-3xl border border-neutral-200 shadow-card">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FF6B00]">Requisitions Directory</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B00]" />
            <span className="text-xs font-semibold text-neutral-400">{requisitions.length} Requisitions</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
            Lab Requisitions
          </h1>
          <p className="text-sm text-neutral-500 mt-1 font-medium">
            Track open and historical lab hiring requirements across Orange Health locations.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Button
            onClick={handleExportCSV}
            variant="secondary"
            size="md"
            leftIcon={<Download className="w-4 h-4" />}
          >
            Export CSV
          </Button>
          <Button
            onClick={() => {
              setEditingRequisition(null);
              setIsFormModalOpen(true);
            }}
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
          >
            New Requisition
          </Button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <RequisitionFilters
        filters={filters}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
        locations={locations}
        roles={roles}
        users={users}
      />

      {/* Main Content: Table or Cards */}
      <div className="space-y-4">
        {/* Results summary bar & view toggle */}
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
            Showing {requisitions.length} {requisitions.length === 1 ? 'Requisition' : 'Requisitions'}
          </span>

          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-neutral-200">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewMode === 'table' ? 'bg-neutral-100 text-neutral-900 font-bold' : 'text-neutral-400 hover:text-neutral-700'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewMode === 'cards' ? 'bg-neutral-100 text-neutral-900 font-bold' : 'text-neutral-400 hover:text-neutral-700'
              }`}
              title="Card View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <TableSkeleton rows={6} columns={8} />
        ) : requisitions.length === 0 ? (
          <EmptyState
            title="No lab requisitions found"
            description="Try clearing your filters or search keywords, or create a new lab requisition."
            actionText="+ New Requisition"
            onAction={() => {
              setEditingRequisition(null);
              setIsFormModalOpen(true);
            }}
          />
        ) : viewMode === 'table' ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden sm:block">
              <RequisitionTable
                requisitions={requisitions}
                onEdit={handleEdit}
                onChangeStatus={handleChangeStatus}
              />
            </div>
            {/* Mobile fallback in table mode */}
            <div className="sm:hidden grid grid-cols-1 gap-3">
              {requisitions.map((req) => (
                <RequisitionCard key={req.id} requisition={req} />
              ))}
            </div>
          </>
        ) : (
          /* Cards Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {requisitions.map((req) => (
              <RequisitionCard key={req.id} requisition={req} />
            ))}
          </div>
        )}
      </div>

      {/* Form Modal */}
      <RequisitionFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingRequisition(null);
        }}
        onSuccess={handleModalSuccess}
        editingRequisition={editingRequisition}
      />

      {/* Status Change Modal */}
      <StatusChangeModal
        isOpen={Boolean(statusModalRequisition)}
        onClose={() => setStatusModalRequisition(null)}
        requisition={statusModalRequisition}
        onStatusUpdated={handleModalSuccess}
      />
    </div>
  );
};
