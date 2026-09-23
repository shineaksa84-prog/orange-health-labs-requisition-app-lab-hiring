import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { RequisitionService } from '../services/requisitionService';
import { LocationMaster, RoleMaster } from '../types';
import { isFirebaseConfigured } from '../firebase/config';
import { initializeFirestoreMasters } from '../services/masterDataInit';
import { FirebaseConfigModal } from '../components/ui/FirebaseConfigModal';
import { Button } from '../components/ui/Button';
import { 
  User, 
  MapPin, 
  Briefcase, 
  Database, 
  ShieldCheck, 
  Sparkles,
  RefreshCw
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [locations, setLocations] = useState<LocationMaster[]>([]);
  const [roles, setRoles] = useState<RoleMaster[]>([]);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  const loadMasters = async () => {
    const [locs, rls] = await Promise.all([
      RequisitionService.getLocations(),
      RequisitionService.getRoles(),
    ]);
    setLocations(locs);
    setRoles(rls);
  };

  useEffect(() => {
    loadMasters();
  }, []);

  const handleInitializeMasters = async () => {
    setIsInitializing(true);
    try {
      await initializeFirestoreMasters();
      await loadMasters();
      toast.success('Masters Synced', 'Synchronized 8 standard lab locations and 5 role masters to Firestore.');
    } catch (err: any) {
      toast.error('Sync Error', err.message || 'Failed to sync masters.');
    } finally {
      setIsInitializing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-neutral-200 shadow-card">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-[#FF6B00]">System & Profile</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B00]" />
          <span className="text-xs font-semibold text-neutral-400">Settings</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
          Settings & Master Configurations
        </h1>
        <p className="text-sm text-neutral-500 mt-1 font-medium">
          Manage your TA profile, review standardized lab masters, and verify cloud database configurations.
        </p>
      </div>

      {/* Grid: Profile + Database Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Card */}
        <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-card space-y-4">
          <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
            <User className="w-5 h-5 text-[#FF6B00]" />
            <h2 className="text-base font-bold text-neutral-900 tracking-tight">Current Authenticated Profile</h2>
          </div>

          <div className="flex items-center gap-4 bg-neutral-50 p-4 rounded-2xl border border-neutral-100">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user?.name || "User"}
                className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-[#FF6B00] text-white flex items-center justify-center font-bold text-xl shadow-sm">
                {user?.name?.charAt(0) || 'U'}
              </div>
            )}
            <div>
              <h3 className="font-bold text-neutral-900 text-base">{user?.name || "Team Member"}</h3>
              <p className="text-xs text-neutral-500">{user?.email || "user@orangehealth.in"}</p>
              <span className="inline-flex items-center mt-1 text-[11px] font-bold px-2 py-0.5 rounded bg-orange-100 text-[#FF6B00]">
                {user?.role || "TA Specialist"}
              </span>
            </div>
          </div>
        </div>

        {/* Database & Cloud State */}
        <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-card space-y-4">
          <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
            <Database className="w-5 h-5 text-[#FF6B00]" />
            <h2 className="text-base font-bold text-neutral-900 tracking-tight">Cloud Database Connection</h2>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 border border-neutral-200">
              <span className="font-semibold text-neutral-700">Database Engine</span>
              <span className="px-2.5 py-1 rounded-full font-bold text-[11px] bg-emerald-100 text-emerald-800">
                Google Cloud Firestore
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 border border-neutral-200">
              <span className="font-semibold text-neutral-700">Authentication</span>
              <span className="px-2.5 py-1 rounded-full font-bold text-[11px] bg-orange-100 text-[#FF6B00]">
                Firebase Google OAuth 2.0
              </span>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => setIsConfigModalOpen(true)}
                variant="primary"
                size="sm"
                className="flex-1"
              >
                Configure Firebase Keys
              </Button>
              <Button
                onClick={handleInitializeMasters}
                variant="secondary"
                size="sm"
                isLoading={isInitializing}
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                className="flex-1"
              >
                Sync Masters
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Master Data Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Fixed Locations Master */}
        <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#FF6B00]" />
              <h2 className="text-base font-bold text-neutral-900 tracking-tight">Standard Lab Locations</h2>
            </div>
            <span className="text-xs font-bold text-neutral-400">8 Fixed Hubs</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {locations.map((loc) => (
              <div key={loc.id} className="bg-neutral-50 p-3 rounded-xl border border-neutral-200 text-center">
                <span className="text-xs font-mono font-bold text-neutral-500 block mb-0.5">{loc.code}</span>
                <span className="text-sm font-extrabold text-neutral-900">{loc.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Fixed Roles Master */}
        <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-[#FF6B00]" />
              <h2 className="text-base font-bold text-neutral-900 tracking-tight">Standard Lab Roles</h2>
            </div>
            <span className="text-xs font-bold text-neutral-400">6 Designations</span>
          </div>

          <div className="space-y-2">
            {roles.map((r) => (
              <div key={r.id} className="flex items-center justify-between bg-neutral-50 p-2.5 px-3.5 rounded-xl border border-neutral-200 text-xs">
                <span className="font-bold text-neutral-900">{r.name}</span>
                <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Active Master
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Firebase Config Modal */}
      <FirebaseConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
      />
    </div>
  );
};
