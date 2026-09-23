import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { Requisition, RequisitionStatus } from '../../types';
import { RequisitionService } from '../../services/requisitionService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { StatusBadge } from '../ui/StatusBadge';
import { Check, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';

interface StatusChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  requisition: Requisition | null;
  onStatusUpdated: (updated: Requisition) => void;
}

const STATUS_OPTIONS: { status: RequisitionStatus; label: string; desc: string }[] = [
  { status: 'Open', label: 'Open', desc: 'Actively sourcing and processing laboratory candidates.' },
  { status: 'On Hold', label: 'On Hold', desc: 'Temporarily paused due to floor space or management review.' },
  { status: 'Closed', label: 'Closed', desc: 'All positions fulfilled. Requisition is completed.' },
  { status: 'Cancelled', label: 'Cancelled', desc: 'Requirement discarded or superseded.' },
];

export const StatusChangeModal: React.FC<StatusChangeModalProps> = ({
  isOpen,
  onClose,
  requisition,
  onStatusUpdated,
}) => {
  const { user } = useAuth();
  const toast = useToast();

  const [selectedStatus, setSelectedStatus] = useState<RequisitionStatus | null>(null);
  const [showConfirm, setShowConfirm] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  if (!requisition) return null;

  const handleSelectStatus = (status: RequisitionStatus) => {
    setSelectedStatus(status);
    if (status === 'Closed' || status === 'Cancelled') {
      setShowConfirm(true);
    } else {
      executeStatusChange(status);
    }
  };

  const executeStatusChange = async (statusToSet: RequisitionStatus) => {
    setIsLoading(true);
    try {
      const updated = await RequisitionService.updateRequisitionStatus(
        requisition.id,
        statusToSet,
        { id: user?.id || 'user-aksa', name: user?.name || 'Aksa Biju' }
      );

      const statusMsg = statusToSet === 'Closed' 
        ? 'Requisition closed' 
        : statusToSet === 'Cancelled' 
        ? 'Requisition cancelled'
        : 'Status updated';

      toast.success(statusMsg, `${updated.requisitionCode} is now marked as ${statusToSet}.`);
      onStatusUpdated(updated);
      setShowConfirm(false);
      onClose();
    } catch (err) {
      console.error('Failed to change status:', err);
      toast.error('Status update failed', 'Could not update requisition status.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen && !showConfirm}
        onClose={onClose}
        title={`Change Status — ${requisition.requisitionCode}`}
        subtitle="Update the operational lifecycle status of this lab requirement"
        maxWidth="md"
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 border border-neutral-200 mb-4">
            <span className="text-xs font-semibold text-neutral-600">Current Status:</span>
            <StatusBadge status={requisition.status} />
          </div>

          <div className="space-y-2">
            {STATUS_OPTIONS.map((opt) => {
              const isCurrent = requisition.status === opt.status;
              return (
                <button
                  key={opt.status}
                  type="button"
                  onClick={() => handleSelectStatus(opt.status)}
                  disabled={isCurrent || isLoading}
                  className={clsx(
                    "w-full flex items-start justify-between p-3.5 rounded-xl border text-left transition-all",
                    isCurrent
                      ? "bg-neutral-50 border-neutral-200 opacity-60 cursor-not-allowed"
                      : "bg-white hover:bg-neutral-50 border-neutral-200 hover:border-[#FF6B00] shadow-sm active:scale-[0.99]"
                  )}
                >
                  <div className="min-w-0 flex-1 pr-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-neutral-900">{opt.label}</span>
                      {isCurrent && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-200 text-neutral-700">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-500 leading-relaxed">{opt.desc}</p>
                  </div>
                  <StatusBadge status={opt.status} size="sm" />
                </button>
              );
            })}
          </div>

          <div className="flex justify-end pt-4 border-t border-neutral-100">
            <Button variant="secondary" size="md" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirmation Dialog for Closed / Cancelled */}
      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={() => selectedStatus && executeStatusChange(selectedStatus)}
        title={selectedStatus === 'Closed' ? 'Close this requisition?' : 'Cancel this requisition?'}
        message={
          selectedStatus === 'Closed'
            ? 'This will mark all positions as fulfilled and move the requisition out of active hiring.'
            : 'This will cancel the hiring requirement and move it to historical records.'
        }
        confirmText={selectedStatus === 'Closed' ? 'Close Requisition' : 'Cancel Requisition'}
        confirmVariant={selectedStatus === 'Closed' ? 'primary' : 'danger'}
        isLoading={isLoading}
      />
    </>
  );
};
