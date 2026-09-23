import React from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ClipboardList, 
  BarChart3, 
  Settings, 
  LogOut,
  Sparkles,
  Layers,
  FilePlus2,
  Share2,
  Inbox,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { OrangeHealthLogo } from '../ui/OrangeHealthLogo';
import { clsx } from 'clsx';

export const Sidebar: React.FC = () => {
  const { user, logout, isHiringManager, switchRole } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // TA Specialist navigation items
  const taNavItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/requisitions', label: 'Requisitions', icon: ClipboardList },
    { to: '/request', label: 'New Requisition', icon: FilePlus2, highlight: true },
    { to: '/roles-tracker', label: 'Roles Tracker', icon: Layers, badge: 'Live' },
    { to: '/reports', label: 'Reports', icon: BarChart3 },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  // Hiring Manager restricted navigation items (Can ONLY submit & track requests)
  const managerNavItems = [
    { to: '/request', label: 'Raise Requisition', icon: FilePlus2, highlight: true },
    { to: '/my-requests', label: 'My Submissions', icon: Inbox },
  ];

  const activeNavItems = isHiringManager ? managerNavItems : taNavItems;

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-neutral-200 min-h-screen select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
        <OrangeHealthLogo variant="full" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        <div className="px-3 py-2 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
          {isHiringManager ? 'Hiring Manager Portal' : 'TA Command Center'}
        </div>
        {activeNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              clsx(
                "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors",
                item.highlight && !isActive && "text-[#FF6B00] bg-orange-50/50 hover:bg-orange-50 font-bold",
                isActive
                  ? "bg-orange-50 text-[#FF6B00] font-bold shadow-xs"
                  : !item.highlight && "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className="flex items-center gap-3">
                  <item.icon className={clsx("w-4 h-4", isActive || item.highlight ? "text-[#FF6B00]" : "text-neutral-500")} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-orange-100 text-[#FF6B00]">
                    {item.badge}
                  </span>
                )}
                {item.highlight && !isActive && (
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-[#FF6B00] text-white">
                    Form
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Share / Role Switcher Box */}
      <div className="p-3 mx-3 mb-3 bg-neutral-50 rounded-2xl border border-neutral-200/80 text-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Portal Role</span>
          <button
            type="button"
            onClick={() => switchRole(isHiringManager ? 'TA Specialist' : 'Hiring Manager')}
            className="text-[10px] font-bold text-[#FF6B00] hover:underline"
            title="Toggle between Hiring Manager and TA Recruiter view"
          >
            Switch View
          </button>
        </div>
        <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-neutral-200">
          <UserCheck className="w-3.5 h-3.5 text-[#FF6B00]" />
          <span className="font-bold text-neutral-800 text-[11px]">
            {user?.role || 'Hiring Manager'}
          </span>
        </div>
      </div>

      {/* User Profile Footer */}
      <div className="p-4 border-t border-neutral-100 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user?.name || "User avatar"}
              className="w-9 h-9 rounded-full object-cover border border-neutral-200 flex-shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-[#FF6B00] text-white font-bold text-xs flex items-center justify-center border border-neutral-200 flex-shrink-0">
              {user?.name?.charAt(0) || 'U'}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-neutral-900 truncate">{user?.name || "Team Member"}</p>
            <p className="text-[11px] text-neutral-500 truncate">{user?.email || ""}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          title="Sign out"
          className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
