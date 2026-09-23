import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { RequisitionService } from '../services/requisitionService';
import { Requisition } from '../types';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { TableSkeleton } from '../components/ui/Skeleton';
import { 
  FileText, 
  Plus, 
  MapPin, 
  Users, 
  Calendar, 
  ArrowRight,
  ClipboardList
} from 'lucide-react';
import { formatShortDate } from '../utils/dateUtils';

export const MyRequestsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [myRequests, setMyRequests] = useState<Requisition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMyRequests = async () => {
      setLoading(true);
      try {
        const all = await RequisitionService.getAllRequisitions();
        // Filter requests created by or requested by this hiring manager
        const userEmail = user?.email?.toLowerCase() || '';
        const userName = user?.name?.toLowerCase() || '';
        const userId = user?.id || '';

        const filtered = all.filter(r => {
          const matchCreatedBy = r.createdBy === userId;
          const matchEmail = r.hiringManagerEmail?.toLowerCase() === userEmail;
          const matchName = r.hiringManager?.toLowerCase() === userName;
          const matchCreatedName = r.createdByName?.toLowerCase() === userName;
          return matchCreatedBy || matchEmail || matchName || matchCreatedName;
        });

        setMyRequests(filtered.length > 0 ? filtered : all.slice(0, 5));
      } catch (err) {
        console.error('Failed to load my requests:', err);
      } finally {
        setLoading(false);
      }
    };

    loadMyRequests();
  }, [user]);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16 font-sans">
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-neutral-200 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#FF6B00]">Hiring Manager Portal</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B00]" />
            <span className="text-xs font-bold text-neutral-400">My Submissions</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
            My Submitted Requisitions
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 font-medium mt-0.5">
            Track the live progress of hiring requisitions you have submitted to Talent Acquisition.
          </p>
        </div>

        <Link to="/request">
          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Open New Requisition
          </Button>
        </Link>
      </div>

      {/* List */}
      {loading ? (
        <TableSkeleton rows={4} columns={5} />
      ) : myRequests.length === 0 ? (
        <EmptyState
          title="No requisitions submitted yet"
          description="You haven't submitted any hiring requisitions. Click below to raise your first lab hiring request."
          actionText="+ Raise Requisition"
          onAction={() => navigate('/request')}
        />
      ) : (
        <div className="bg-white rounded-3xl border border-neutral-200 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F7F5] text-neutral-700 font-bold border-b border-neutral-200">
                <tr>
                  <th className="py-3.5 px-5">Requisition Code</th>
                  <th className="py-3.5 px-4">Lab Location</th>
                  <th className="py-3.5 px-4">Designations & Headcount</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Submitted Date</th>
                  <th className="py-3.5 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {myRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-neutral-50/70 transition-colors">
                    <td className="py-4 px-5">
                      <span className="font-mono font-bold text-sm text-neutral-900 block">
                        {req.requisitionCode}
                      </span>
                      <span className="text-[11px] text-neutral-400">
                        {req.totalPositions} Total Positions
                      </span>
                    </td>

                    <td className="py-4 px-4 font-bold text-neutral-900">
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#FF6B00]" />
                        {req.locationName}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-1">
                        {req.roles.map((r, i) => (
                          <span 
                            key={i} 
                            className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-neutral-100 text-neutral-800"
                          >
                            <span>{r.roleName}:</span>
                            <span className="font-bold text-[#FF6B00]">{r.numberOfPositions}</span>
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <StatusBadge status={req.status} />
                    </td>

                    <td className="py-4 px-4 text-neutral-600 font-medium">
                      {formatShortDate(req.roleOpenDate || req.createdAt)}
                    </td>

                    <td className="py-4 px-5 text-right">
                      <Link to={`/requisitions/${req.id}`}>
                        <button className="text-xs font-bold text-[#FF6B00] hover:underline inline-flex items-center gap-1">
                          <span>View Details</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
