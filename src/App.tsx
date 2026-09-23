import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { RequisitionsPage } from './pages/RequisitionsPage';
import { RequisitionDetailPage } from './pages/RequisitionDetailPage';
import { RolesTrackerPage } from './pages/RolesTrackerPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { HiringManagerRequestPage } from './pages/HiringManagerRequestPage';
import { MyRequestsPage } from './pages/MyRequestsPage';

const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F7F5]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#FF6B00] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-neutral-500">Loading Command Center...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// Role-aware home router: Hiring Managers land on Request Form; TA Specialists land on Dashboard
const HomeRoute: React.FC = () => {
  const { isHiringManager } = useAuth();
  if (isHiringManager) {
    return <HiringManagerRequestPage />;
  }
  return <DashboardPage />;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<HomeRoute />} />
              <Route path="request" element={<HiringManagerRequestPage />} />
              <Route path="new-requisition" element={<HiringManagerRequestPage />} />
              <Route path="hiring-manager-request" element={<HiringManagerRequestPage />} />
              <Route path="my-requests" element={<MyRequestsPage />} />
              <Route path="requisitions" element={<RequisitionsPage />} />
              <Route path="requisitions/:id" element={<RequisitionDetailPage />} />
              <Route path="roles-tracker" element={<RolesTrackerPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
};

export default App;
