import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { RequisitionFormModal } from '../requisitions/RequisitionFormModal';
import { useAuth } from '../../context/AuthContext';

export const AppLayout: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [isNewRequisitionModalOpen, setIsNewRequisitionModalOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  // Determine current page header title & subtitle
  const getHeaderInfo = () => {
    switch (location.pathname) {
      case '/':
        return {
          title: 'Lab Hiring Dashboard',
          subtitle: 'Live requisition pulse across diagnostic centers'
        };
      case '/requisitions':
        return {
          title: 'Lab Requisitions',
          subtitle: 'Track active and historical requirements'
        };
      case '/roles-tracker':
        return {
          title: 'Open Roles Tracker',
          subtitle: 'Workforce requirements mapped by designation and hub'
        };
      case '/reports':
        return {
          title: 'Reports & Analytics',
          subtitle: 'Operational insights and requisition metrics'
        };
      case '/settings':
        return {
          title: 'Settings & Masters',
          subtitle: 'Manage configurations and standard master data'
        };
      default:
        if (location.pathname.startsWith('/requisitions/')) {
          return {
            title: 'Requisition Detail',
            subtitle: 'Review requirement specs, roles, and status'
          };
        }
        return {
          title: 'Lab Hiring',
          subtitle: 'Orange Health Command Center'
        };
    }
  };

  const headerInfo = getHeaderInfo();

  const handleGlobalSearch = (val: string) => {
    setGlobalSearch(val);
    if (location.pathname !== '/requisitions') {
      navigate(`/requisitions?q=${encodeURIComponent(val)}`);
    }
  };

  const handleRequisitionCreated = () => {
    // If on requisitions or dashboard, the page listens or reloads
    window.dispatchEvent(new CustomEvent('requisition-created'));
  };

  return (
    <div className="min-h-screen flex bg-[#F7F7F5] text-[#171717]">
      {/* Desktop Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        <Header
          title={headerInfo.title}
          subtitle={headerInfo.subtitle}
          onOpenNewRequisition={() => setIsNewRequisitionModalOpen(true)}
          searchQuery={globalSearch}
          onSearchChange={handleGlobalSearch}
          showSearch={location.pathname === '/requisitions'}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav />

      {/* Global New Requisition Modal */}
      <RequisitionFormModal
        isOpen={isNewRequisitionModalOpen}
        onClose={() => setIsNewRequisitionModalOpen(false)}
        onSuccess={handleRequisitionCreated}
      />
    </div>
  );
};
