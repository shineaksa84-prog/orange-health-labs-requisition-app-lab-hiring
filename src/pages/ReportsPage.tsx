import React, { useState, useEffect, useMemo } from 'react';
import { RequisitionService } from '../services/requisitionService';
import { Requisition, LocationHiringSummary, RoleHiringSummary } from '../types';
import { STANDARD_LOCATIONS, STANDARD_ROLES } from '../services/masterDataInit';
import { Button } from '../components/ui/Button';
import { exportRequisitionsToCSV } from '../utils/exportCsv';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell, 
  PieChart, 
  Pie, 
  AreaChart, 
  Area,
  CartesianGrid
} from 'recharts';
import { 
  Download, 
  Printer, 
  MapPin, 
  Briefcase, 
  PieChart as PieIcon, 
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  Building2,
  Users,
  Search,
  Filter,
  RefreshCw,
  FileText
} from 'lucide-react';
import { CardSkeleton } from '../components/ui/Skeleton';

export const ReportsPage: React.FC = () => {
  const toast = useToast();
  const { user } = useAuth();

  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [locations, setLocations] = useState<LocationHiringSummary[]>([]);
  const [roles, setRoles] = useState<RoleHiringSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filter state for on-screen exploration
  const [selectedLocation, setSelectedLocation] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [allReqs, locData, roleData] = await Promise.all([
        RequisitionService.getAllRequisitions(),
        RequisitionService.getLocationSummaries(),
        RequisitionService.getRoleSummaries(),
      ]);
      setRequisitions(allReqs);
      setLocations(locData);
      setRoles(roleData);
    } catch (err) {
      console.error('Failed to load reports data:', err);
      toast.error('Data Load Error', 'Could not fetch the latest requisitions report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePrintPDF = () => {
    // Trigger the print dialog formatted via CSS @media print
    window.print();
  };

  const handleExportCSV = () => {
    if (requisitions.length === 0) {
      toast.warning('No Data', 'There are no requisitions to export.');
      return;
    }
    exportRequisitionsToCSV(requisitions);
    toast.success('CSV Exported', 'Full requisitions database downloaded.');
  };

  // KPI Calculations across all requisitions
  const totalRequisitions = requisitions.length;
  const openRequisitions = requisitions.filter(r => r.status === 'Open');
  const onHoldRequisitions = requisitions.filter(r => r.status === 'On Hold');
  const closedRequisitions = requisitions.filter(r => r.status === 'Closed');

  const totalHeadcountRequired = requisitions.reduce((sum, r) => sum + (r.numberOfPositions || 1), 0);
  const openHeadcount = openRequisitions.reduce((sum, r) => sum + (r.numberOfPositions || 1), 0);
  const closedHeadcount = closedRequisitions.reduce((sum, r) => sum + (r.numberOfPositions || 1), 0);
  const onHoldHeadcount = onHoldRequisitions.reduce((sum, r) => sum + (r.numberOfPositions || 1), 0);

  const fulfillmentRate = totalHeadcountRequired > 0 
    ? Math.round((closedHeadcount / totalHeadcountRequired) * 100) 
    : 0;

  // Aging Analysis
  const now = new Date().getTime();
  const activeAgingDays = openRequisitions.map(r => {
    const created = new Date(r.roleOpenDate || r.createdAt).getTime();
    return Math.max(0, Math.floor((now - created) / (1000 * 60 * 60 * 24)));
  });

  const avgAgingDays = activeAgingDays.length > 0 
    ? Math.round(activeAgingDays.reduce((a, b) => a + b, 0) / activeAgingDays.length) 
    : 0;

  // Aging buckets
  const agingBuckets = {
    fresh: 0,       // 0-7 days
    inProgress: 0,  // 8-14 days
    warning: 0,     // 15-30 days
    critical: 0     // > 30 days
  };

  openRequisitions.forEach(r => {
    const created = new Date(r.roleOpenDate || r.createdAt).getTime();
    const days = Math.max(0, Math.floor((now - created) / (1000 * 60 * 60 * 24)));
    if (days <= 7) agingBuckets.fresh++;
    else if (days <= 14) agingBuckets.inProgress++;
    else if (days <= 30) agingBuckets.warning++;
    else agingBuckets.critical++;
  });

  // Location x Designation Staffing Matrix
  const matrixData = useMemo(() => {
    // Rows: STANDARD_ROLES, Columns: STANDARD_LOCATIONS
    const matrix: Record<string, Record<string, { open: number; total: number }>> = {};
    
    STANDARD_ROLES.forEach(role => {
      matrix[role] = {};
      STANDARD_LOCATIONS.forEach(loc => {
        matrix[role][loc] = { open: 0, total: 0 };
      });
    });

    requisitions.forEach(r => {
      const role = r.roleName;
      const loc = r.labLocation;
      const count = r.numberOfPositions || 1;
      
      if (matrix[role] && matrix[role][loc]) {
        matrix[role][loc].total += count;
        if (r.status === 'Open') {
          matrix[role][loc].open += count;
        }
      }
    });

    return matrix;
  }, [requisitions]);

  // Totals per column (Location)
  const locationTotals = useMemo(() => {
    const totals: Record<string, { open: number; total: number }> = {};
    STANDARD_LOCATIONS.forEach(loc => {
      let open = 0;
      let total = 0;
      STANDARD_ROLES.forEach(role => {
        if (matrixData[role] && matrixData[role][loc]) {
          open += matrixData[role][loc].open;
          total += matrixData[role][loc].total;
        }
      });
      totals[loc] = { open, total };
    });
    return totals;
  }, [matrixData]);

  // Top demand location & role
  const topDemandLocation = useMemo(() => {
    let max = 0;
    let name = 'None';
    Object.entries(locationTotals).forEach(([loc, data]) => {
      if (data.open > max) {
        max = data.open;
        name = loc;
      }
    });
    return { name, count: max };
  }, [locationTotals]);

  const topDemandRole = useMemo(() => {
    let max = 0;
    let name = 'None';
    STANDARD_ROLES.forEach(role => {
      let open = 0;
      STANDARD_LOCATIONS.forEach(loc => {
        if (matrixData[role] && matrixData[role][loc]) {
          open += matrixData[role][loc].open;
        }
      });
      if (open > max) {
        max = open;
        name = role;
      }
    });
    return { name, count: max };
  }, [matrixData]);

  // Filtered requisitions for roster table
  const filteredRequisitions = useMemo(() => {
    return requisitions.filter(r => {
      const matchLoc = selectedLocation === 'All' || r.labLocation === selectedLocation;
      const matchStatus = selectedStatus === 'All' || r.status === selectedStatus;
      const matchSearch = searchTerm === '' || 
        r.requisitionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.roleName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.hiringManager?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchLoc && matchStatus && matchSearch;
    });
  }, [requisitions, selectedLocation, selectedStatus, searchTerm]);

  // Chart Data: Requisitions by Status
  const statusChartData = [
    { name: 'Open', count: openRequisitions.length, headcount: openHeadcount, color: '#FF6B00' },
    { name: 'On Hold', count: onHoldRequisitions.length, headcount: onHoldHeadcount, color: '#F59E0B' },
    { name: 'Closed', count: closedRequisitions.length, headcount: closedHeadcount, color: '#10B981' },
    { name: 'Cancelled', count: requisitions.filter(r => r.status === 'Cancelled').length, headcount: 0, color: '#EF4444' },
  ].filter(d => d.count > 0);

  // Chart Data: Open Headcount by Location
  const locationBarData = STANDARD_LOCATIONS.map(loc => ({
    name: loc,
    openHeadcount: locationTotals[loc]?.open || 0,
    totalHeadcount: locationTotals[loc]?.total || 0,
  }));

  // Chart Data: Open Headcount by Role
  const roleBarData = STANDARD_ROLES.map(role => {
    let open = 0;
    let total = 0;
    STANDARD_LOCATIONS.forEach(loc => {
      if (matrixData[role] && matrixData[role][loc]) {
        open += matrixData[role][loc].open;
        total += matrixData[role][loc].total;
      }
    });
    return {
      roleName: role,
      openHeadcount: open,
      totalHeadcount: total,
    };
  });

  // Aging Chart Data
  const agingChartData = [
    { range: '0-7 Days', count: agingBuckets.fresh, color: '#10B981', label: 'Fresh' },
    { range: '8-14 Days', count: agingBuckets.inProgress, color: '#3B82F6', label: 'In Progress' },
    { range: '15-30 Days', count: agingBuckets.warning, color: '#F59E0B', label: 'Aging Warning' },
    { range: '30+ Days', count: agingBuckets.critical, color: '#EF4444', label: 'Critical SLA' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Printable Executive PDF Header (Only visible on print / exported PDF) */}
      <div className="print-only border-b-2 border-[#FF6B00] pb-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FF6B00] flex items-center justify-center text-white font-black text-lg">
              OH
            </div>
            <div>
              <h1 className="text-xl font-black text-neutral-900 tracking-tight">ORANGE HEALTH LABS</h1>
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                Laboratory Talent Acquisition & Headcount Intelligence Report
              </p>
            </div>
          </div>
          <div className="text-right text-xs text-neutral-500">
            <p className="font-bold text-neutral-900">Generated: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            <p>Generated by: {user?.displayName || user?.email || 'TA Command Center'}</p>
            <p className="text-[#FF6B00] font-semibold">CONFIDENTIAL - INTERNAL ONLY</p>
          </div>
        </div>
      </div>

      {/* Screen Header Banner (Hidden during PDF print) */}
      <div className="no-print bg-white p-6 sm:p-7 rounded-3xl border border-neutral-200 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-50 text-[#FF6B00] border border-orange-200">
              Talent Intelligence
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
            <span className="text-xs font-semibold text-neutral-500">Live Lab Headcount Matrix</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
            Lab Hiring Analytics & Executive Report
          </h1>
          <p className="text-sm text-neutral-500 mt-1 font-medium">
            Understand demand across 8 lab locations and 6 designations at a single glance with one-click PDF export.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          <Button
            onClick={loadData}
            variant="outline"
            size="md"
            leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
            className="text-neutral-600 border-neutral-200 hover:bg-neutral-50"
          >
            Refresh
          </Button>

          <Button
            onClick={handleExportCSV}
            variant="outline"
            size="md"
            leftIcon={<Download className="w-4 h-4 text-neutral-600" />}
            className="text-neutral-700 border-neutral-200 hover:bg-neutral-50 font-semibold"
          >
            Export CSV
          </Button>

          <Button
            onClick={handlePrintPDF}
            variant="primary"
            size="md"
            leftIcon={<Printer className="w-4 h-4" />}
            className="bg-[#FF6B00] hover:bg-[#E65A00] text-white font-bold shadow-md hover:shadow-lg transition-all"
          >
            Download PDF Report
          </Button>
        </div>
      </div>

      {loading ? (
        <CardSkeleton count={4} />
      ) : (
        <>
          {/* Executive KPI Deck */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {/* KPI 1: Total Open Positions */}
            <div className="bg-white p-5 rounded-2xl border border-orange-100 shadow-card relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-full -mr-8 -mt-8 opacity-60 pointer-events-none" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Active Open Demand</span>
                <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#FF6B00] flex items-center justify-center font-bold">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-[#FF6B00] tracking-tight">{openHeadcount}</span>
                <span className="text-xs font-semibold text-neutral-500">Positions</span>
              </div>
              <p className="text-xs font-medium text-neutral-500 mt-2">
                Across <strong className="text-neutral-800">{openRequisitions.length}</strong> active requisitions
              </p>
            </div>

            {/* KPI 2: Total Requisitions & Volume */}
            <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Total Requirement</span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-neutral-900 tracking-tight">{totalHeadcountRequired}</span>
                <span className="text-xs font-semibold text-neutral-500">Total Headcount</span>
              </div>
              <p className="text-xs font-medium text-neutral-500 mt-2">
                In <strong className="text-neutral-800">{totalRequisitions}</strong> total requisitions logged
              </p>
            </div>

            {/* KPI 3: Filled & Fulfillment Rate */}
            <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Fulfillment Rate</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-emerald-600 tracking-tight">{fulfillmentRate}%</span>
                <span className="text-xs font-semibold text-neutral-500">Filled</span>
              </div>
              <p className="text-xs font-medium text-neutral-500 mt-2">
                <strong className="text-neutral-800">{closedHeadcount}</strong> positions closed successfully
              </p>
            </div>

            {/* KPI 4: Average Aging */}
            <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Avg Time Open (TAT)</span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-neutral-900 tracking-tight">{avgAgingDays}</span>
                <span className="text-xs font-semibold text-neutral-500">Days</span>
              </div>
              <p className="text-xs font-medium text-neutral-500 mt-2">
                {agingBuckets.critical > 0 ? (
                  <span className="text-red-600 font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 inline" /> {agingBuckets.critical} critical SLA breach (&gt;30d)
                  </span>
                ) : (
                  <span className="text-emerald-600 font-semibold">All requisitions within SLA target</span>
                )}
              </p>
            </div>
          </div>

          {/* Key Insights & Bottleneck Highlights */}
          <div className="bg-gradient-to-r from-orange-50 via-white to-orange-50/40 p-5 rounded-2xl border border-orange-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FF6B00] text-white flex items-center justify-center shrink-0 shadow-sm">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-neutral-900">Talent Acquisition Operational Highlights</h2>
                <div className="flex items-center gap-4 text-xs text-neutral-600 mt-0.5 flex-wrap">
                  <span>📍 Highest Demand Hub: <strong className="text-neutral-900">{topDemandLocation.name} ({topDemandLocation.count} open)</strong></span>
                  <span>•</span>
                  <span>🔬 Highest Demand Role: <strong className="text-neutral-900">{topDemandRole.name} ({topDemandRole.count} open)</strong></span>
                  <span>•</span>
                  <span>⏸️ On-Hold: <strong className="text-neutral-900">{onHoldHeadcount} positions</strong></span>
                </div>
              </div>
            </div>
            <div className="text-xs font-bold text-[#FF6B00] bg-white px-3 py-1.5 rounded-xl border border-orange-200 self-start md:self-auto shrink-0 shadow-xs">
              Active Focus: {topDemandLocation.name} & {topDemandRole.name}
            </div>
          </div>

          {/* Section 1: Location × Designation Staffing Demand Matrix (HEATMAP TABLE) */}
          <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-card space-y-4 print-avoid-break">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 pb-3.5">
              <div>
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#FF6B00]" />
                  <h2 className="text-lg font-black text-neutral-900 tracking-tight">
                    Location × Designation Staffing Matrix
                  </h2>
                </div>
                <p className="text-xs text-neutral-500 mt-0.5 font-medium">
                  Live open headcount breakdown across all 8 laboratory hubs and 6 standard roles.
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-[#FF6B00] inline-block" /> Open Demand
                </span>
                <span className="flex items-center gap-1.5 text-neutral-400">
                  <span className="w-3 h-3 rounded bg-neutral-100 inline-block" /> 0 Open
                </span>
              </div>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-neutral-50 text-neutral-600 font-bold border-b border-neutral-200">
                    <th className="py-3 px-3.5 rounded-l-xl">Role / Designation</th>
                    {STANDARD_LOCATIONS.map(loc => (
                      <th key={loc} className="py-3 px-2.5 text-center font-bold text-neutral-800">
                        {loc}
                      </th>
                    ))}
                    <th className="py-3 px-3.5 text-right font-black text-[#FF6B00] rounded-r-xl">Total Open</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {STANDARD_ROLES.map(role => {
                    let roleOpenTotal = 0;
                    STANDARD_LOCATIONS.forEach(loc => {
                      roleOpenTotal += matrixData[role]?.[loc]?.open || 0;
                    });

                    return (
                      <tr key={role} className="hover:bg-orange-50/30 transition-colors">
                        <td className="py-3 px-3.5 font-bold text-neutral-900 flex items-center gap-2">
                          <Briefcase className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                          {role}
                        </td>
                        {STANDARD_LOCATIONS.map(loc => {
                          const openCount = matrixData[role]?.[loc]?.open || 0;
                          return (
                            <td key={loc} className="py-2.5 px-2.5 text-center">
                              {openCount > 0 ? (
                                <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-lg bg-orange-100 text-[#FF6B00] font-black text-xs border border-orange-200">
                                  {openCount}
                                </span>
                              ) : (
                                <span className="text-neutral-300 font-medium">-</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="py-2.5 px-3.5 text-right font-black text-sm text-[#FF6B00]">
                          {roleOpenTotal}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-neutral-900 text-white font-bold rounded-xl">
                    <td className="py-3 px-3.5 rounded-l-xl font-black uppercase tracking-wider text-xs">
                      Hub Open Totals
                    </td>
                    {STANDARD_LOCATIONS.map(loc => (
                      <td key={loc} className="py-3 px-2.5 text-center font-black text-amber-400">
                        {locationTotals[loc]?.open || 0}
                      </td>
                    ))}
                    <td className="py-3 px-3.5 text-right font-black text-base text-amber-400 rounded-r-xl">
                      {openHeadcount}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Section 2: Visual Charts Deck */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Open Headcount by Lab Location */}
            <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-card space-y-4 print-avoid-break">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#FF6B00]" />
                  <h2 className="text-base font-bold text-neutral-900 tracking-tight">
                    Open Positions by Lab Location
                  </h2>
                </div>
                <span className="text-xs font-semibold text-neutral-500">8 Hubs</span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={locationBarData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B7280', fontWeight: 600 }} />
                    <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                      cursor={{ fill: '#FFF4EC' }}
                    />
                    <Bar dataKey="openHeadcount" name="Open Positions" fill="#FF6B00" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Open Headcount by Designation */}
            <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-card space-y-4 print-avoid-break">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-[#FF6B00]" />
                  <h2 className="text-base font-bold text-neutral-900 tracking-tight">
                    Open Positions by Designation
                  </h2>
                </div>
                <span className="text-xs font-semibold text-neutral-500">6 Roles</span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={roleBarData}
                    layout="vertical"
                    margin={{ top: 10, right: 20, left: 35, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F3F4F6" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#6B7280' }} allowDecimals={false} />
                    <YAxis dataKey="roleName" type="category" tick={{ fontSize: 10, fill: '#374151', fontWeight: 600 }} width={120} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                      cursor={{ fill: '#FFF4EC' }}
                    />
                    <Bar dataKey="openHeadcount" name="Open Positions" fill="#E65A00" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 3: Requisition Status Pipeline */}
            <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-card space-y-4 print-avoid-break">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <div className="flex items-center gap-2">
                  <PieIcon className="w-4 h-4 text-[#FF6B00]" />
                  <h2 className="text-base font-bold text-neutral-900 tracking-tight">
                    Requisition Status Pipeline
                  </h2>
                </div>
                <span className="text-xs font-semibold text-neutral-500">Lifecycle</span>
              </div>

              <div className="h-56 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                    >
                      {statusChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center justify-center gap-4 flex-wrap text-xs pt-1">
                {statusChartData.map(item => (
                  <div key={item.name} className="flex items-center gap-1.5 bg-neutral-50 px-2.5 py-1 rounded-lg border border-neutral-200">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="font-semibold text-neutral-700">{item.name}:</span>
                    <span className="font-black text-neutral-900">{item.count} reqs ({item.headcount} pos)</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart 4: SLA Aging Distribution */}
            <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-card space-y-4 print-avoid-break">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#FF6B00]" />
                  <h2 className="text-base font-bold text-neutral-900 tracking-tight">
                    Aging & SLA Distribution (Active Reqs)
                  </h2>
                </div>
                <span className="text-xs font-semibold text-neutral-500">{openRequisitions.length} Active</span>
              </div>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={agingChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#6B7280', fontWeight: 600 }} />
                    <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} allowDecimals={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: '12px' }} />
                    <Bar dataKey="count" name="Requisitions" radius={[6, 6, 0, 0]}>
                      {agingChartData.map((entry, index) => (
                        <Cell key={`aging-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center text-xs pt-1">
                <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                  <p className="font-bold text-emerald-800">{agingBuckets.fresh}</p>
                  <p className="text-[10px] text-emerald-600 font-medium">0-7 Days</p>
                </div>
                <div className="bg-blue-50 p-2 rounded-xl border border-blue-200">
                  <p className="font-bold text-blue-800">{agingBuckets.inProgress}</p>
                  <p className="text-[10px] text-blue-600 font-medium">8-14 Days</p>
                </div>
                <div className="bg-amber-50 p-2 rounded-xl border border-amber-200">
                  <p className="font-bold text-amber-800">{agingBuckets.warning}</p>
                  <p className="text-[10px] text-amber-600 font-medium">15-30 Days</p>
                </div>
                <div className="bg-red-50 p-2 rounded-xl border border-red-200">
                  <p className="font-bold text-red-800">{agingBuckets.critical}</p>
                  <p className="text-[10px] text-red-600 font-medium">&gt;30 Days</p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Master Requisition Roster Table (Searchable & Filterable) */}
          <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-card space-y-4 print-avoid-break">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-4">
              <div>
                <h2 className="text-lg font-black text-neutral-900 tracking-tight flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#FF6B00]" />
                  Requisitions Roster
                </h2>
                <p className="text-xs text-neutral-500 font-medium mt-0.5">
                  Showing {filteredRequisitions.length} of {requisitions.length} total requisition records.
                </p>
              </div>

              {/* Filter controls (Hidden in PDF print) */}
              <div className="no-print flex items-center gap-2.5 flex-wrap">
                <div className="relative">
                  <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by ID, role, HM..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-3 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B00] w-48 sm:w-56"
                  />
                </div>

                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="text-xs bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-1.5 font-semibold text-neutral-700 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
                >
                  <option value="All">All Locations</option>
                  {STANDARD_LOCATIONS.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>

                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="text-xs bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-1.5 font-semibold text-neutral-700 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
                >
                  <option value="All">All Statuses</option>
                  <option value="Open">Open</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Closed">Closed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-neutral-50 text-neutral-600 font-bold border-b border-neutral-200">
                    <th className="py-2.5 px-3">Req ID</th>
                    <th className="py-2.5 px-3">Location</th>
                    <th className="py-2.5 px-3">Designation</th>
                    <th className="py-2.5 px-3">Hiring Manager</th>
                    <th className="py-2.5 px-3 text-center">Positions</th>
                    <th className="py-2.5 px-3">Date Opened</th>
                    <th className="py-2.5 px-3 text-center">Aging</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredRequisitions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-neutral-400 font-medium">
                        No requisitions matching your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredRequisitions.map(r => {
                      const created = new Date(r.roleOpenDate || r.createdAt).getTime();
                      const ageDays = Math.max(0, Math.floor((now - created) / (1000 * 60 * 60 * 24)));

                      let ageBadge = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                      if (ageDays > 30) ageBadge = 'bg-red-50 text-red-700 border-red-200 font-bold';
                      else if (ageDays > 14) ageBadge = 'bg-amber-50 text-amber-700 border-amber-200';
                      else if (ageDays > 7) ageBadge = 'bg-blue-50 text-blue-700 border-blue-200';

                      let statusBadge = 'bg-orange-50 text-[#FF6B00] border-orange-200';
                      if (r.status === 'Closed') statusBadge = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                      if (r.status === 'On Hold') statusBadge = 'bg-amber-50 text-amber-700 border-amber-200';
                      if (r.status === 'Cancelled') statusBadge = 'bg-red-50 text-red-700 border-red-200';

                      return (
                        <tr key={r.id} className="hover:bg-neutral-50/80 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-bold text-[#FF6B00]">
                            {r.requisitionId || r.id.substring(0, 8)}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-neutral-800">
                            {r.labLocation}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-neutral-900">
                            {r.roleName}
                          </td>
                          <td className="py-2.5 px-3 text-neutral-600">
                            {r.hiringManager}
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold text-neutral-900">
                            {r.numberOfPositions || 1}
                          </td>
                          <td className="py-2.5 px-3 text-neutral-500">
                            {r.roleOpenDate || new Date(r.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] border ${ageBadge}`}>
                              {ageDays}d
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusBadge}`}>
                              {r.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Printable PDF Footer */}
          <div className="print-only text-center text-xs text-neutral-400 border-t border-neutral-200 pt-4 mt-8">
            <p>Orange Health Labs Diagnostic Requisition System • End of Executive Report</p>
          </div>
        </>
      )}
    </div>
  );
};

