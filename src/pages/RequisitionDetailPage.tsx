import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { RequisitionService } from '../services/requisitionService';
import { Requisition } from '../types';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Button } from '../components/ui/Button';
import { StatusChangeModal } from '../components/requisitions/StatusChangeModal';
import { RequisitionFormModal } from '../components/requisitions/RequisitionFormModal';
import { 
  calculateRequisitionAge, 
  formatLongDate, 
  formatDateTime 
} from '../utils/dateUtils';
import { 
  ArrowLeft, 
  Edit3, 
  CheckCircle, 
  MapPin, 
  Calendar, 
  User, 
  Briefcase, 
  Clock, 
  FileText, 
  History,
  Building2,
  Users
} from 'lucide-react';
import { Skeleton } from '../components/ui/Skeleton';

export const RequisitionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [requisition, setRequisition] = useState<Requisition | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState<boolean>(false);

  const loadRequisition = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await RequisitionService.getRequisitionById(id);
      setRequisition(data);
    } catch (err) {
      console.error('Failed to load requisition detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequisition();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 pb-12">
        <Skeleton className="h-8 w-40" />
        <div className="bg-white p-6 rounded-3xl border border-neutral-200 space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!requisition) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-4">
        <h2 className="text-xl font-bold text-neutral-900">Requisition Not Found</h2>
        <p className="text-sm text-neutral-500">The requisition you requested does not exist or has been removed.</p>
        <Button onClick={() => navigate('/requisitions')} variant="primary" size="md">
          Back to Requisitions
        </Button>
      </div>
    );
  }

  const age = calculateRequisitionAge(requisition.roleOpenDate, requisition.status, requisition.closedAt);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate('/requisitions')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Requisitions</span>
        </button>
      </div>

      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-black font-mono text-neutral-900 tracking-tight">
              {requisition.requisitionCode}
            </h1>
            <StatusBadge status={requisition.status} size="md" />
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-md font-bold text-xs bg-neutral-100 text-neutral-800 border border-neutral-200">
              <MapPin className="w-3.5 h-3.5 text-[#FF6B00]" />
              {requisition.locationName}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs text-neutral-500 font-medium pt-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-neutral-400" />
              {age}
            </span>
            <span>•</span>
            <span>Opened on {formatLongDate(requisition.roleOpenDate)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            onClick={() => setIsEditModalOpen(true)}
            variant="secondary"
            size="md"
            leftIcon={<Edit3 className="w-4 h-4" />}
          >
            Edit
          </Button>
          <Button
            onClick={() => setIsStatusModalOpen(true)}
            variant="primary"
            size="md"
            leftIcon={<CheckCircle className="w-4 h-4" />}
          >
            Change Status
          </Button>
        </div>
      </div>

      {/* Grid: Requirement Summary + Roles Required */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Requirement Summary Card (1 Col) */}
        <div className="md:col-span-1 bg-white p-6 rounded-3xl border border-neutral-200 shadow-card space-y-5">
          <div className="border-b border-neutral-100 pb-3">
            <h2 className="text-base font-bold text-neutral-900 tracking-tight">Requirement Summary</h2>
            <p className="text-xs text-neutral-400">Core mandate specifications</p>
          </div>

          <div className="space-y-4 text-sm">
            <div>
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider block mb-0.5">Location</span>
              <p className="font-semibold text-neutral-900">{requisition.locationName}</p>
            </div>

            <div>
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider block mb-0.5">Role Open Date</span>
              <p className="font-semibold text-neutral-900">{formatLongDate(requisition.roleOpenDate)}</p>
            </div>

            <div>
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider block mb-0.5">TA Owner</span>
              <p className="font-semibold text-neutral-900">{requisition.taOwnerName}</p>
              <p className="text-xs text-neutral-500">{requisition.taOwnerEmail}</p>
            </div>

            <div>
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider block mb-0.5">Hiring Manager</span>
              <p className="font-semibold text-neutral-900">
                {requisition.hiringManager || <span className="text-neutral-400 font-normal">Not assigned</span>}
              </p>
            </div>

            <div className="pt-3 border-t border-neutral-100">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider block mb-0.5">Total Positions</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-[#FF6B00]">{requisition.totalPositions}</span>
                <span className="text-xs font-semibold text-neutral-500">Designations required</span>
              </div>
            </div>
          </div>
        </div>

        {/* Roles Required Cards (2 Cols) */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-card space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#FF6B00]" />
                <h2 className="text-base font-bold text-neutral-900 tracking-tight">Roles Required</h2>
              </div>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-orange-50 text-[#FF6B00] border border-orange-200/60">
                {requisition.roles.length} {requisition.roles.length === 1 ? 'Designation' : 'Designations'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {requisition.roles.map((r, idx) => (
                <div
                  key={idx}
                  className="bg-neutral-50/70 p-4 rounded-2xl border border-neutral-200 flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider block mb-0.5">Designation</span>
                    <h3 className="text-sm font-bold text-neutral-900">{r.roleName}</h3>
                  </div>
                  <div className="text-right pl-4">
                    <span className="text-xl font-black text-neutral-900 block">{r.numberOfPositions}</span>
                    <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                      {r.numberOfPositions === 1 ? 'Position' : 'Positions'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes Card */}
          <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-card space-y-3">
            <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
              <FileText className="w-4 h-4 text-neutral-500" />
              <h2 className="text-base font-bold text-neutral-900 tracking-tight">Notes & Context</h2>
            </div>
            {requisition.notes ? (
              <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap bg-neutral-50 p-4 rounded-xl border border-neutral-100">
                {requisition.notes}
              </p>
            ) : (
              <p className="text-xs text-neutral-400 italic py-2">
                No specific notes attached to this requisition.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Activity / Audit Trail */}
      <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-card space-y-4">
        <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
          <History className="w-4 h-4 text-[#FF6B00]" />
          <h2 className="text-base font-bold text-neutral-900 tracking-tight">Activity & Audit Log</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-200/80">
            <span className="text-neutral-400 font-semibold block mb-1">Created By</span>
            <p className="font-bold text-neutral-900">{requisition.createdByName}</p>
            <p className="text-neutral-500 mt-0.5">{formatDateTime(requisition.createdAt)}</p>
          </div>

          <div className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-200/80">
            <span className="text-neutral-400 font-semibold block mb-1">Last Updated</span>
            <p className="font-bold text-neutral-900">{requisition.updatedByName}</p>
            <p className="text-neutral-500 mt-0.5">{formatDateTime(requisition.updatedAt)}</p>
          </div>

          <div className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-200/80">
            <span className="text-neutral-400 font-semibold block mb-1">Lifecycle Status</span>
            <p className="font-bold text-neutral-900">{requisition.status}</p>
            <p className="text-neutral-500 mt-0.5">
              {requisition.closedAt ? `Closed on ${formatDateTime(requisition.closedAt)}` : 'Active hiring in progress'}
            </p>
          </div>
        </div>
      </div>

      {/* Edit Form Modal */}
      <RequisitionFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={() => loadRequisition()}
        editingRequisition={requisition}
      />

      {/* Status Change Modal */}
      <StatusChangeModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        requisition={requisition}
        onStatusUpdated={() => loadRequisition()}
      />
    </div>
  );
};
