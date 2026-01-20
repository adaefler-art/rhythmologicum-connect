import React from 'react';
import { Home, ClipboardList, TrendingUp, Calendar, FileText, Activity, Settings, HelpCircle, X } from 'lucide-react';
import { User } from '../../lib/types';

interface SidebarProps {
  user?: User;
  activeItem?: string;
  onNavigate?: (item: string) => void;
  onClose?: () => void;
  isOpen?: boolean;
}

const menuItems = [
  { id: 'dashboard', icon: Home, label: 'Dashboard' },
  { id: 'assessments', icon: ClipboardList, label: 'Assessments' },
  { id: 'insights', icon: TrendingUp, label: 'Insights' },
  { id: 'appointments', icon: Calendar, label: 'Appointments' },
  { id: 'records', icon: FileText, label: 'Medical Records' },
  { id: 'activity', icon: Activity, label: 'Daily Activity' },
  { id: 'settings', icon: Settings, label: 'Settings' },
  { id: 'help', icon: HelpCircle, label: 'Help & Support' },
];

export function Sidebar({ user, activeItem = 'dashboard', onNavigate, onClose, isOpen = true }: SidebarProps) {
  if (!isOpen) return null;
  
  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white shadow-lg z-50 flex flex-col">
        {/* Header with close button */}
        <div className="flex items-center justify-between p-4 border-b border-[#e5e7eb]">
          <span className="text-lg font-semibold text-[#1f2937]">Menu</span>
          <button
            onClick={onClose}
            className="lg:hidden p-2 hover:bg-[#f3f4f6] rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-[#374151]" />
          </button>
        </div>
        
        {/* User Profile */}
        {user && (
          <div className="p-4 border-b border-[#e5e7eb]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#4a90e2] to-[#6c63ff] flex items-center justify-center text-white font-semibold">
                {user.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#1f2937] truncate">{user.name}</p>
                <p className="text-xs text-[#6b7280] truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto p-3">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeItem === item.id;
              
              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      onNavigate?.(item.id);
                      onClose?.();
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-[#eff6ff] text-[#4a90e2]'
                        : 'text-[#6b7280] hover:bg-[#f3f4f6]'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
}
