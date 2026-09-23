import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { 
  LocationMaster, 
  RoleMaster, 
  Requisition, 
  RequisitionRole, 
  RequisitionStatus,
  RequisitionPriority,
  HiringReason 
} from '../../types';
import { RequisitionService } from '../../services/requisitionService';
import { STANDARD_LOCATIONS, STANDARD_ROLES } from '../../services/masterDataInit';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { 
  Calendar, 
  MapPin, 
  Briefcase, 
  Hash, 
  User, 
  AlertCircle, 
  Plus, 
  Minus,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface RequisitionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (requisition: Requisition) => void;
  editingRequisition?: Requisition | null;
}

interface RoleRowState {
  roleId: string;
  roleName: string;
  selected: boolean;
  numberOfPositions: number;
}

export const RequisitionFormModal: React.FC<RequisitionFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editingRequisition = null,
}) => {
  const { user } = useAuth();
  const toast = useToast();

  const [locations, setLocations] = useState<LocationMaster[]>(STANDARD_LOCATIONS);
  const [roleMasters, setRoleMasters] = useState<RoleMaster[]>(STANDARD_ROLES);
  
  const [requisitionCode, setRequisitionCode] = useState<string>('LAB-2026-001');
  const [locationId, setLocationId] = useState<string>(STANDARD_LOCATIONS[0]?.id || 'BLR1');
  const [roleOpenDate, setRoleOpenDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [targetJoiningDate, setTargetJoiningDate] = useState<string>('');
  const [status, setStatus] = useState<RequisitionStatus>('Open');
  const [priority, setPriority] = useState<RequisitionPriority>('Standard');
  const [hiringReason, setHiringReason] = useState<HiringReason>('Expansion');
  const [department, setDepartment] = useState<string>('Clinical Pathology & Hematology');
  const [taOwnerId, setTaOwnerId] = useState<string>(user?.id || '');
  const [taOwnerName, setTaOwnerName] = useState<string>(user?.name || '');
  const [taOwnerEmail, setTaOwnerEmail] = useState<string>(user?.email || '');
  const [hiringManager, setHiringManager] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  
  // Simultaneous multi-role table rows
  const [roleMatrix, setRoleMatrix] = useState<RoleRowState[]>(() =>
    STANDARD_ROLES.map((r, idx) => ({
      roleId: r.id,
      roleName: r.name,
      selected: idx === 0,
      numberOfPositions: 1
    }))
  );

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      try {
        const [locs, rls] = await Promise.all([
          RequisitionService.getLocations(),
          RequisitionService.getRoles()
        ]);
        if (locs && locs.length > 0) setLocations(locs);
        if (rls && rls.length > 0) setRoleMasters(rls);

        const activeRoles = (rls && rls.length > 0) ? rls : STANDARD_ROLES;

        if (editingRequisition) {
          setRequisitionCode(editingRequisition.requisitionCode);
          setLocationId(editingRequisition.locationId);
          setRoleOpenDate(editingRequisition.roleOpenDate);
          setTargetJoiningDate(editingRequisition.targetJoiningDate || '');
          setStatus(editingRequisition.status);
          setPriority(editingRequisition.priority || 'Standard');
          setHiringReason(editingRequisition.hiringReason || 'Expansion');
          setDepartment(editingRequisition.department || 'Clinical Pathology & Hematology');
          setTaOwnerId(editingRequisition.taOwnerId);
          setTaOwnerName(editingRequisition.taOwnerName);
          setTaOwnerEmail(editingRequisition.taOwnerEmail);
          setHiringManager(editingRequisition.hiringManager || '');
          setNotes(editingRequisition.notes || '');

          const matrix: RoleRowState[] = activeRoles.map((r) => {
            const existing = editingRequisition.roles.find(
              er => er.roleId === r.id || er.roleName.toLowerCase() === r.name.toLowerCase()
            );
            return {
              roleId: r.id,
              roleName: r.name,
              selected: Boolean(existing),
              numberOfPositions: existing ? existing.numberOfPositions : 1,
            };
          });
          setRoleMatrix(matrix);
        } else {
          const nextCode = await RequisitionService.generateNextRequisitionCode();
          setRequisitionCode(nextCode);
          setLocationId(locs[0]?.id || STANDARD_LOCATIONS[0].id);
          setRoleOpenDate(new Date().toISOString().slice(0, 10));
          setTargetJoiningDate('');
          setStatus('Open');
          setPriority('Standard');
          setHiringReason('Expansion');
          setDepartment('Clinical Pathology & Hematology');
          setTaOwnerId(user?.id || '');
          setTaOwnerName(user?.name || 'TA Specialist');
          setTaOwnerEmail(user?.email || '');
          setHiringManager('');
          setNotes('');

          const matrix: RoleRowState[] = activeRoles.map((r, idx) => ({
            roleId: r.id,
            roleName: r.name,
            selected: idx === 0,
            numberOfPositions: 1
          }));
          setRoleMatrix(matrix);
        }
      } catch (err) {
        console.warn('Modal data load fallback to standard masters:', err);
      }
    };

    loadData();
    setFormError(null);
  }, [isOpen, editingRequisition, user]);

  const selectedRoles = roleMatrix.filter(r => r.selected && r.numberOfPositions > 0);
  const totalPositions = selectedRoles.reduce((sum, r) => sum + r.numberOfPositions, 0);

  const handleToggleRole = (index: number) => {
    setRoleMatrix(prev => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        selected: !copy[index].selected,
        numberOfPositions: copy[index].selected ? copy[index].numberOfPositions : Math.max(1, copy[index].numberOfPositions)
      };
      return copy;
    });
  };

  const handleStepperChange = (index: number, delta: number) => {
    setRoleMatrix(prev => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        numberOfPositions: Math.max(1, copy[index].numberOfPositions + delta),
        selected: true
      };
      return copy;
    });
  };

  const handleCountChange = (index: number, val: number) => {
    const safe = Math.max(1, Math.floor(val) || 1);
    setRoleMatrix(prev => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        numberOfPositions: safe,
        selected: true
      };
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!locationId) {
      setFormError('Please select a valid laboratory location.');
      return;
    }

    const selectedLoc = locations.find(l => l.id === locationId) || STANDARD_LOCATIONS.find(l => l.id === locationId) || STANDARD_LOCATIONS[0];

    if (selectedRoles.length === 0) {
      setFormError('Please select at least one designation and assign headcount.');
      return;
    }

    if (totalPositions <= 0) {
      setFormError('Total positions must be greater than zero.');
      return;
    }

    setIsLoading(true);

    try {
      const formattedRoles: RequisitionRole[] = selectedRoles.map(r => ({
        roleId: r.roleId,
        roleName: r.roleName,
        numberOfPositions: r.numberOfPositions,
      }));

      if (editingRequisition) {
        const updated = await RequisitionService.updateRequisition(editingRequisition.id, {
          locationId: selectedLoc.id,
          locationName: selectedLoc.name,
          roleOpenDate,
          targetJoiningDate: targetJoiningDate || undefined,
          status,
          priority,
          hiringReason,
          department,
          taOwnerId,
          taOwnerName,
          taOwnerEmail,
          hiringManager: hiringManager.trim() || undefined,
          notes: notes.trim() || undefined,
          roles: formattedRoles,
          updatedBy: user?.id || 'anonymous',
          updatedByName: user?.name || 'Team Member'
        });

        toast.success('Requisition updated', `${updated.requisitionCode} has been updated successfully.`);
        onSuccess(updated);
        onClose();
      } else {
        const created = await RequisitionService.createRequisition({
          requisitionCode,
          locationId: selectedLoc.id,
          locationName: selectedLoc.name,
          roleOpenDate,
          targetJoiningDate: targetJoiningDate || undefined,
          status,
          priority,
          hiringReason,
          department,
          taOwnerId,
          taOwnerName,
          taOwnerEmail,
          hiringManager: hiringManager.trim() || undefined,
          notes: notes.trim() || undefined,
          roles: formattedRoles,
          createdBy: user?.id || 'anonymous',
          createdByName: user?.name || 'Team Member',
          updatedBy: user?.id || 'anonymous',
          updatedByName: user?.name || 'Team Member'
        });

        toast.success('Requisition created', `${created.requisitionCode} has been created successfully.`);
        onSuccess(created);
        onClose();
      }
    } catch (err: any) {
      console.error('Save requisition error:', err);
      setFormError(err.message || "Couldn't save requisition. Please try again.");
      toast.error("Couldn't save requisition", "Something went wrong. Please check fields and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingRequisition ? `Edit Requisition ${editingRequisition.requisitionCode}` : "Create Lab Requisition"}
      subtitle="Track laboratory hiring requirements with speed and precision"
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6 font-sans">
        {formError && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600" />
            <span>{formError}</span>
          </div>
        )}

        {/* Row 1: Requisition ID & Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
              Requisition ID
            </label>
            <div className="relative">
              <Hash className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={requisitionCode}
                readOnly
                disabled
                className="w-full bg-neutral-100 border border-neutral-200 rounded-xl pl-9 pr-3 py-2 text-xs font-mono font-bold text-neutral-700 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
              Lab Hub Location <span className="text-[#FF6B00]">*</span>
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                required
                className="w-full bg-white border border-neutral-300 rounded-xl pl-9 pr-8 py-2 text-xs font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.code})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* SIMULTANEOUS MULTI-JOB MATRIX TABLE */}
        <div className="bg-neutral-50/70 p-4 rounded-2xl border border-neutral-200/80 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-[#FF6B00]" />
              <label className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                Select Designations & Open Headcount <span className="text-[#FF6B00]">*</span>
              </label>
            </div>
            <div className="flex items-center gap-1.5 bg-orange-100/70 text-[#FF6B00] font-black text-xs px-3 py-1 rounded-xl">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Total: {totalPositions} {totalPositions === 1 ? 'Position' : 'Positions'}</span>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F7F5] font-bold text-neutral-600 border-b border-neutral-200">
                <tr>
                  <th className="py-2.5 px-3 w-10 text-center">Select</th>
                  <th className="py-2.5 px-3">Designation</th>
                  <th className="py-2.5 px-3 text-center">Open Positions</th>
                  <th className="py-2.5 px-3 text-right">Requirement Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {roleMatrix.map((row, idx) => (
                  <tr 
                    key={row.roleId} 
                    className={`transition-colors ${row.selected ? 'bg-orange-50/30' : 'hover:bg-neutral-50'}`}
                  >
                    <td className="py-2.5 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={row.selected}
                        onChange={() => handleToggleRole(idx)}
                        className="w-4 h-4 rounded text-[#FF6B00] focus:ring-[#FF6B00] cursor-pointer"
                      />
                    </td>
                    <td className="py-2.5 px-3 font-bold text-neutral-900">
                      {row.roleName}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="inline-flex items-center gap-1.5 bg-white border border-neutral-300 rounded-lg p-0.5">
                        <button
                          type="button"
                          onClick={() => handleStepperChange(idx, -1)}
                          disabled={!row.selected || row.numberOfPositions <= 1}
                          className="w-6 h-6 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-700 flex items-center justify-center font-bold disabled:opacity-30"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <input
                          type="number"
                          min="1"
                          max="50"
                          value={row.numberOfPositions}
                          onChange={(e) => handleCountChange(idx, parseInt(e.target.value, 10))}
                          disabled={!row.selected}
                          className="w-9 text-center font-black text-xs text-neutral-900 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleStepperChange(idx, 1)}
                          className="w-6 h-6 rounded bg-orange-100 hover:bg-orange-200 text-[#FF6B00] flex items-center justify-center font-bold"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {row.selected ? (
                        <span className="text-[11px] font-bold text-[#FF6B00] bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                          Active ({row.numberOfPositions})
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-neutral-400">
                          Not Included
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Row 3: Role Open Date & Requisition Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
              Role Open Date <span className="text-[#FF6B00]">*</span>
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="date"
                value={roleOpenDate}
                onChange={(e) => setRoleOpenDate(e.target.value)}
                required
                className="w-full bg-white border border-neutral-300 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
              Requisition Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as RequisitionStatus)}
              className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-2 text-xs font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
            >
              <option value="Open">Open (Active)</option>
              <option value="On Hold">On Hold</option>
              <option value="Closed">Closed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Row 4: TA Owner & Hiring Manager */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
              TA Owner
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={taOwnerName}
                onChange={(e) => setTaOwnerName(e.target.value)}
                className="w-full bg-white border border-neutral-300 rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
              Hiring Manager / Requester
            </label>
            <input
              type="text"
              placeholder="e.g. Dr. Suresh Varma"
              value={hiringManager}
              onChange={(e) => setHiringManager(e.target.value)}
              className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-2 text-xs font-medium text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
            />
          </div>
        </div>

        {/* Row 5: Notes */}
        <div>
          <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
            Operational Context & Notes (Optional)
          </label>
          <textarea
            rows={2}
            placeholder="Add any context about this hiring requirement (e.g. replacement, expansion, shift coverage)..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-white border border-neutral-300 rounded-xl p-3 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
          />
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-neutral-200">
          <Link
            to="/request"
            onClick={onClose}
            className="text-xs font-bold text-[#FF6B00] hover:underline inline-flex items-center gap-1"
          >
            <span>Open Full Hiring Manager Portal</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isLoading}
            >
              {editingRequisition ? "Save Changes" : `Create (${totalPositions} Positions)`}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
