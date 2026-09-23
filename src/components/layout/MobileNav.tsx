import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, Layers, BarChart3, Settings, FilePlus2, Inbox } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { clsx } from 'clsx';

export const MobileNav: React.FC = () => {
  const { isHiringManager } = useAuth();

  const taNavItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/requisitions', label: 'Requisitions', icon: ClipboardList },
    { to: '/request', label: 'New Req', icon: FilePlus2 },
    { to: '/roles-tracker', label: 'Roles', icon: Layers },
    { to: '/reports', label: 'Reports', icon: BarChart3 },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  const managerNavItems = [
    { to: '/request', label: 'Raise Req', icon: FilePlus2 },
    { to: '/my-requests', label: 'My Requests', icon: Inbox },
  ];

  const navItems = isHiringManager ? managerNavItems : taNavItems;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-neutral-200 px-2 py-1.5 flex items-center justify-around shadow-lg">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            clsx(
              "flex flex-col items-center justify-center p-1.5 rounded-lg text-[10px] font-medium transition-colors min-w-[50px]",
              isActive
                ? "text-[#FF6B00] font-bold"
                : "text-neutral-500 hover:text-neutral-900"
            )
          }
        >
          <item.icon className="w-5 h-5 mb-0.5" />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};
