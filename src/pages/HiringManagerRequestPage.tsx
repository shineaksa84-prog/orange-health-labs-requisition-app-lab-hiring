import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { RequisitionService } from '../services/requisitionService';
import { STANDARD_LOCATIONS, STANDARD_ROLES } from '../services/masterDataInit';
import { 
  LocationMaster, 
  RoleMaster, 
  RequisitionRole, 
  Requisition 
} from '../types';
import { 
  Building2, 
  MapPin, 
  Briefcase, 
  Users, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Minus, 
  Share2, 
  Copy, 
  Check, 
  Sparkles, 
  ArrowRight, 
  Send, 
  ShieldCheck
} from 'lucide-react';
import { Button } from '../components/ui/Button';

interface SimpleRoleRow {
  roleId: string;
  roleName: string;
  selected: boolean;
  numberOfPositions: number;
}

export const HiringManagerRequestPage: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  // Initialize with standard fixed masters so they NEVER disappear
  const [locations, setLocations] = useState<LocationMaster[]>(STANDARD_LOCATIONS);
  const [roleMasters, setRoleMasters] = useState<RoleMaster[]>(STANDARD_ROLES);

  // Core Form fields
  const [locationId, setLocationId] = useState<string>(STANDARD_LOCATIONS[0]?.id || 'BLR1');
  const [roleOpenDate, setRoleOpenDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [hiringManagerName, setHiringManagerName] = useState<string>(user?.name || '');
  const [hiringManagerEmail, setHiringManagerEmail] = useState<string>(user?.email || '');
  const [notes, setNotes] = useState<string>('');

  // Simultaneous simple role matrix for all 5 designations
  const [roleRows, setRoleRows] = useState<SimpleRoleRow[]>(() => 
    STANDARD_ROLES.map((r, index) => ({
      roleId: r.id,
      roleName: r.name,
      selected: index === 0, // Default select the first designation
      numberOfPositions: 1,
    }))
  );

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRequisition, setSubmittedRequisition] = useState<Requisition | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Load masters from Firestore in background while keeping standards active
  useEffect(() => {
    const loadMasters = async () => {
      try {
        const [locs, rls] = await Promise.all([
          RequisitionService.getLocations(),
          RequisitionService.getRoles()
        ]);
        if (locs && locs.length > 0) {
          setLocations(locs);
        }
        if (rls && rls.length > 0) {
          setRoleMasters(rls);
          setRoleRows(prev => {
            // Keep existing selections if user already toggled them
            return rls.map((r, index) => {
              const existing = prev.find(p => p.roleId === r.id || p.roleName === r.name);
              return {
                roleId: r.id,
                roleName: r.name,
                selected: existing ? existing.selected : index === 0,
                numberOfPositions: existing ? existing.numberOfPositions : 1,
              };
            });
          });
        }
      } catch (err) {
        console.warn('Using standard fallback masters:', err);
      }
    };

    loadMasters();
  }, []);

  // Sync logged in user name
  useEffect(() => {
    if (user && !hiringManagerName) {
      setHiringManagerName(user.name);
      setHiringManagerEmail(user.email);
    }
  }, [user]);

  // Aggregate calculations
  const selectedRoles = roleRows.filter(r => r.selected && r.numberOfPositions > 0);
  const totalPositions = selectedRoles.reduce((sum, r) => sum + r.numberOfPositions, 0);

  // Toggle role checkbox
  const handleToggleRole = (index: number) => {
    setRoleRows(prev => {
      const copy = [...prev];
      const newSelected = !copy[index].selected;
      copy[index] = {
        ...copy[index],
        selected: newSelected,
        numberOfPositions: newSelected ? Math.max(1, copy[index].numberOfPositions) : copy[index].numberOfPositions
      };
      return copy;
    });
  };

  // Adjust count with stepper
  const handleStepperChange = (index: number, delta: number) => {
    setRoleRows(prev => {
      const copy = [...prev];
      const current = copy[index].numberOfPositions;
      const nextCount = Math.max(1, current + delta);
      copy[index] = {
        ...copy[index],
        numberOfPositions: nextCount,
        selected: true // Auto check if incremented
      };
      return copy;
    });
  };

  // Direct count input
  const handleCountInputChange = (index: number, val: number) => {
    const safeCount = Math.max(1, Math.floor(val) || 1);
    setRoleRows(prev => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        numberOfPositions: safeCount,
        selected: true
      };
      return copy;
    });
  };

  const handleCopyShareLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    toast.success('Link Copied', 'Hiring Manager request portal URL copied to clipboard.');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyRequisitionCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    toast.success('Tracking Code Copied', `${code} copied to clipboard.`);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!locationId) {
      setFormError('Please select the target laboratory location.');
      return;
    }

    const selectedLoc = locations.find(l => l.id === locationId) || STANDARD_LOCATIONS.find(l => l.id === locationId) || STANDARD_LOCATIONS[0];

    if (selectedRoles.length === 0) {
      setFormError('Please select at least one designation and specify open positions.');
      return;
    }

    if (totalPositions <= 0) {
      setFormError('Total requested positions must be at least 1.');
      return;
    }

    if (!hiringManagerName.trim()) {
      setFormError('Please provide the Hiring Manager / Requester name.');
      return;
    }

    setIsSubmitting(true);

    try {
      const formattedRoles: RequisitionRole[] = selectedRoles.map(r => ({
        roleId: r.roleId,
        roleName: r.roleName,
        numberOfPositions: r.numberOfPositions,
      }));

      const created = await RequisitionService.createRequisition({
        locationId: selectedLoc.id,
        locationName: selectedLoc.name,
        roleOpenDate,
        status: 'Open',
        priority: 'Standard',
        hiringReason: 'Expansion',
        taOwnerId: user?.id || 'unassigned',
        taOwnerName: user?.name || 'Talent Acquisition Team',
        taOwnerEmail: user?.email || 'ta@orangehealth.in',
        hiringManager: hiringManagerName.trim(),
        hiringManagerEmail: hiringManagerEmail.trim() || null,
        notes: notes.trim() || null,
        roles: formattedRoles,
        createdBy: user?.id || 'hiring-manager',
        createdByName: hiringManagerName.trim(),
        updatedBy: user?.id || 'hiring-manager',
        updatedByName: hiringManagerName.trim()
      } as any);


      setSubmittedRequisition(created);
      toast.success(
        'Requisition Submitted Successfully', 
        `Requisition ${created.requisitionCode} for ${created.totalPositions} positions in ${created.locationName} has been routed to Talent Acquisition.`
      );
    } catch (err: any) {
      console.error('Failed to submit requisition:', err);
      setFormError(err.message || 'Failed to submit requisition. Please check connection and try again.');
      toast.error('Submission Failed', err.message || 'Could not submit requisition.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setSubmittedRequisition(null);
    setFormError(null);
    setNotes('');
    setRoleRows(STANDARD_ROLES.map((r, idx) => ({
      roleId: r.id,
      roleName: r.name,
      selected: idx === 0,
      numberOfPositions: 1
    })));
  };

  // SUCCESS RECEIPT VIEW
  if (submittedRequisition) {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-neutral-200 shadow-xl space-y-7">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-neutral-100">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold uppercase tracking-wider">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Requisition Dispatched to TA</span>
              </div>
              <h1 className="text-2xl font-black text-neutral-900 tracking-tight">
                Hiring Requisition Registered
              </h1>
              <p className="text-sm text-neutral-500 font-medium">
                Your lab hiring requirement has been logged in the Talent Acquisition Command Center.
              </p>
            </div>

            <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-4 flex-shrink-0 text-center sm:text-right">
              <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block">Tracking Code</span>
              <div className="flex items-center justify-center sm:justify-end gap-2 mt-0.5">
                <span className="text-2xl font-black font-mono text-[#FF6B00]">
                  {submittedRequisition.requisitionCode}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyRequisitionCode(submittedRequisition.requisitionCode)}
                  className="p-1.5 rounded-lg bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-600 transition-colors"
                  title="Copy Code"
                >
                  {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#F7F7F5] p-4 rounded-2xl border border-neutral-200/80">
              <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">Lab Location</span>
              <span className="text-sm font-extrabold text-neutral-900 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#FF6B00]" />
                {submittedRequisition.locationName}
              </span>
            </div>

            <div className="bg-[#F7F7F5] p-4 rounded-2xl border border-neutral-200/80">
              <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">Total Positions</span>
              <span className="text-sm font-extrabold text-neutral-900 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#17A578]" />
                {submittedRequisition.totalPositions} Positions
              </span>
            </div>
          </div>

          {/* Requested Roles Breakdown */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-[#FF6B00]" />
              <span>Requested Designations Breakdown</span>
            </h3>

            <div className="overflow-x-auto rounded-2xl border border-neutral-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F7F7F5] text-neutral-600 font-bold border-b border-neutral-200">
                  <tr>
                    <th className="py-3 px-4">Designation</th>
                    <th className="py-3 px-4 text-right">Open Positions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {submittedRequisition.roles.map((r, idx) => (
                    <tr key={idx} className="hover:bg-neutral-50/50">
                      <td className="py-3.5 px-4 font-extrabold text-neutral-900 text-sm">
                        {r.roleName}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="inline-flex items-center justify-center px-3 py-1 rounded-full font-black text-sm bg-orange-100 text-[#FF6B00]">
                          {r.numberOfPositions} {r.numberOfPositions === 1 ? 'position' : 'positions'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-neutral-100">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={handleResetForm}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Submit Another Requisition
            </Button>

            <Link to={`/requisitions/${submittedRequisition.id}`}>
              <Button
                type="button"
                variant="primary"
                size="md"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                View Requisition Details
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // MAIN SIMPLIFIED HIRING MANAGER REQUEST FORM
  return (
    <div className="max-w-4xl mx-auto space-y-7 pb-20 font-sans">
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#FF6B00]">Hiring Manager Form</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B00]" />
            <span className="text-xs font-bold text-neutral-400">Orange Health Labs</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
            Open New Requisition
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 font-medium">
            Select your lab location and choose the designations and open position counts needed.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCopyShareLink}
          className="flex items-center gap-2 bg-[#F7F7F5] hover:bg-neutral-100 text-neutral-800 border border-neutral-300 font-bold px-4 py-2.5 rounded-2xl text-xs shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
          title="Copy link to send to hiring managers"
        >
          {copiedLink ? (
            <>
              <Check className="w-4 h-4 text-emerald-600" />
              <span className="text-emerald-700">Link Copied!</span>
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4 text-[#FF6B00]" />
              <span>Share Form Link</span>
            </>
          )}
        </button>
      </div>

      {formError && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" />
          <div>
            <strong className="block font-bold text-red-900 mb-0.5">Please check the required fields:</strong>
            <span>{formError}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: Location & Hiring Manager */}
        <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-card space-y-5">
          <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
            <Building2 className="w-4 h-4 text-[#FF6B00]" />
            <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
              1. Location & Requester Information
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Location (8 fixed hubs) */}
            <div>
              <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider mb-1.5">
                Lab Location <span className="text-[#FF6B00]">*</span>
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  required
                  className="w-full bg-[#F7F7F5] border border-neutral-300 rounded-2xl pl-9 pr-8 py-2.5 text-xs font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#FF6B00] cursor-pointer"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} ({loc.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Hiring Manager Name */}
            <div>
              <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider mb-1.5">
                Hiring Manager Name <span className="text-[#FF6B00]">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Dr. Suresh Varma"
                value={hiringManagerName}
                onChange={(e) => setHiringManagerName(e.target.value)}
                className="w-full bg-[#F7F7F5] border border-neutral-300 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
              />
            </div>

            {/* Requisition Date */}
            <div>
              <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider mb-1.5">
                Requisition Date <span className="text-[#FF6B00]">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  value={roleOpenDate}
                  onChange={(e) => setRoleOpenDate(e.target.value)}
                  required
                  className="w-full bg-[#F7F7F5] border border-neutral-300 rounded-2xl pl-9 pr-3 py-2.5 text-xs font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: 5 STANDARD DESIGNATIONS & OPEN HEADCOUNT TABLE */}
        <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-card space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-3">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-[#FF6B00]" />
              <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
                2. Designations & Open Positions
              </h2>
            </div>

            {/* Total Positions Live Counter */}
            <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 px-3.5 py-1.5 rounded-2xl self-start sm:self-auto">
              <Sparkles className="w-3.5 h-3.5 text-[#FF6B00]" />
              <span className="text-xs font-bold text-neutral-700">Total Positions:</span>
              <span className="text-sm font-black text-[#FF6B00]">
                {totalPositions} {totalPositions === 1 ? 'Position' : 'Positions'}
              </span>
            </div>
          </div>

          {/* Clean 4-column Table */}
          <div className="overflow-x-auto rounded-2xl border border-neutral-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-[#F7F7F5] text-neutral-700 font-bold border-b border-neutral-200">
                <tr>
                  <th className="py-3.5 px-4 w-12 text-center">Select</th>
                  <th className="py-3.5 px-4">Designation</th>
                  <th className="py-3.5 px-4 text-center w-52">Open Positions Needed</th>
                  <th className="py-3.5 px-4 text-right">Requirement Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {roleRows.map((row, idx) => {
                  const isSelected = row.selected;
                  return (
                    <tr 
                      key={row.roleId} 
                      className={`transition-colors ${
                        isSelected ? 'bg-orange-50/40' : 'bg-white hover:bg-neutral-50/60 opacity-65 hover:opacity-100'
                      }`}
                    >
                      {/* Checkbox toggle */}
                      <td className="py-4 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleRole(idx)}
                          className="w-5 h-5 rounded text-[#FF6B00] focus:ring-[#FF6B00] cursor-pointer"
                        />
                      </td>

                      {/* Designation Name */}
                      <td className="py-4 px-4">
                        <div className="font-black text-sm text-neutral-900">
                          {row.roleName}
                        </div>
                        <span className="text-[11px] font-semibold text-neutral-400">
                          Standard Lab Designation
                        </span>
                      </td>

                      {/* Open Headcount Stepper & Numeric Input */}
                      <td className="py-4 px-4 text-center">
                        <div className="inline-flex items-center gap-2 bg-white border border-neutral-300 rounded-2xl p-1 shadow-xs">
                          <button
                            type="button"
                            onClick={() => handleStepperChange(idx, -1)}
                            disabled={!isSelected || row.numberOfPositions <= 1}
                            className="w-8 h-8 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 flex items-center justify-center font-bold transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Minus className="w-4 h-4" />
                          </button>

                          <input
                            type="number"
                            min="1"
                            max="99"
                            value={row.numberOfPositions}
                            onChange={(e) => handleCountInputChange(idx, parseInt(e.target.value, 10))}
                            disabled={!isSelected}
                            className="w-12 text-center font-black text-base text-neutral-900 focus:outline-none disabled:text-neutral-400"
                          />

                          <button
                            type="button"
                            onClick={() => handleStepperChange(idx, 1)}
                            className="w-8 h-8 rounded-xl bg-orange-100 hover:bg-orange-200 text-[#FF6B00] flex items-center justify-center font-bold transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </td>

                      {/* Status badge */}
                      <td className="py-4 px-4 text-right">
                        {isSelected ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-orange-100 text-[#FF6B00] border border-orange-200">
                            <span>{row.numberOfPositions} {row.numberOfPositions === 1 ? 'Open Position' : 'Open Positions'}</span>
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-neutral-400">
                            Not Selected
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Selected Roles Summary Pills */}
          {selectedRoles.length > 0 && (
            <div className="bg-[#F7F7F5] p-3.5 rounded-2xl border border-neutral-200 flex flex-wrap items-center gap-2 text-xs">
              <span className="font-bold text-neutral-700">Selected Breakdown:</span>
              {selectedRoles.map((r, i) => (
                <span 
                  key={i} 
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-neutral-300 text-neutral-900 font-bold shadow-2xs"
                >
                  <span className="w-2 h-2 rounded-full bg-[#FF6B00]" />
                  <span>{r.roleName}:</span>
                  <span className="text-[#FF6B00]">{r.numberOfPositions}</span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 3: Notes / Remarks (Optional) */}
        <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-card space-y-3">
          <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider">
            Operational Remarks / Notes (Optional)
          </label>
          <textarea
            rows={2}
            placeholder="Add any specific context about this requirement (e.g. expansion, replacement, volume surge)..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-[#F7F7F5] border border-neutral-300 rounded-2xl p-3 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
          />
        </div>

        {/* SUBMISSION ACTION */}
        <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-card flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <ShieldCheck className="w-4 h-4 text-[#17A578]" />
            <span>Direct Talent Acquisition Dispatch with atomic `LAB-2026-XXX` tracking sequence</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={() => navigate('/requisitions')}
              disabled={isSubmitting}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSubmitting}
              leftIcon={<Send className="w-4 h-4" />}
              className="w-full sm:w-auto shadow-md"
            >
              Submit Requisition ({totalPositions} {totalPositions === 1 ? 'Position' : 'Positions'})
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
