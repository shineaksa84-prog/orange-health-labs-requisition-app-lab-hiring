import React from 'react';
import { Plus, Bell, Search } from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  onOpenNewRequisition: () => void;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  showSearch?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title = 'Dashboard',
  subtitle,
  onOpenNewRequisition,
  searchQuery = '',
  onSearchChange,
  showSearch = false,
}) => {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-neutral-200 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
      {/* Title / Context */}
      <div>
        <h1 className="text-xl font-bold text-neutral-900 tracking-tight leading-tight">{title}</h1>
        {subtitle && (
          <p className="text-xs text-neutral-500 hidden sm:block mt-0.5">{subtitle}</p>
        )}
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {showSearch && onSearchChange && (
          <div className="relative hidden md:block w-64">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search requisitions..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-[#F7F7F5] border border-neutral-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#FF6B00] focus:border-transparent transition-all"
            />
          </div>
        )}

        {/* Notifications */}
        <button 
          className="relative p-2 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl transition-colors"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#FF6B00]" />
        </button>

        {/* User avatar on small screens */}
        {user?.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user?.name || "User"}
            className="w-8 h-8 rounded-full object-cover border border-neutral-200 md:hidden"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-[#FF6B00] text-white font-bold text-xs flex items-center justify-center border border-neutral-200 md:hidden">
            {user?.name?.charAt(0) || 'U'}
          </div>
        )}

        {/* + New Requisition CTA */}
        <Button
          onClick={onOpenNewRequisition}
          variant="primary"
          size="md"
          leftIcon={<Plus className="w-4 h-4" />}
          className="whitespace-nowrap"
        >
          <span>New Requisition</span>
        </Button>
      </div>
    </header>
  );
};
