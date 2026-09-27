import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, User, LogOut, Calendar, ShieldCheck, ChevronDown } from 'lucide-react';

const Navbar = ({ onToggleSidebar }) => {
  const { user, role, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Map route paths to friendly titles
  const pageTitles = {
    '/dashboard': 'Dashboard Overview',
    '/purchase-requests': 'Purchase Requests',
    '/purchase-requests/create': 'Create Purchase Request',
    '/approvals': 'Manager Approvals Queue',
    '/suppliers': 'Suppliers Directory',
    '/quotations': 'Supplier Quotations & Bids',
    '/purchase-orders': 'Purchase Orders',
    '/goods-receipts': 'Goods Receipts (GRN)',
    '/payments': 'Vendor Payments'
  };

  const currentTitle = pageTitles[location.pathname] || 'Purchase System';

  const roleStyles = {
    EMPLOYEE: {
      badge: 'bg-blue-50 text-blue-700 border-blue-200',
      label: 'Employee'
    },
    MANAGER: {
      badge: 'bg-purple-50 text-purple-700 border-purple-200',
      label: 'Manager'
    },
    PURCHASE_OFFICER: {
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      label: 'Purchase Officer'
    }
  };

  const currentRoleConfig = roleStyles[role] || {
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    label: role || 'User'
  };

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Left: Hamburger Menu Button + Context Title */}
        <div className="flex items-center space-x-3.5">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            title="Toggle Sidebar Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                {currentTitle}
              </h1>
              <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-slate-50 text-slate-600 border-slate-200">
                Live
              </span>
            </div>
          </div>
        </div>

        {/* Right: Date, Role Badge, and User Profile Menu */}
        <div className="flex items-center space-x-3.5">
          {/* Today Date */}
          <div className="hidden lg:flex items-center space-x-1.5 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/60 font-medium">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{todayFormatted}</span>
          </div>

          {/* User Role Pill */}
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border shadow-2xs ${currentRoleConfig.badge}`}
          >
            <ShieldCheck className="w-3.5 h-3.5 mr-1 opacity-80" />
            {currentRoleConfig.label}
          </span>

          {/* User Profile Dropdown Button */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center space-x-2.5 p-1 sm:px-2 sm:py-1 rounded-xl hover:bg-slate-100/80 transition group"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs shadow-blue-500/20">
                {getInitials(user?.name)}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">
                  {user?.name || 'User'}
                </p>
                <p className="text-[10px] text-slate-400 truncate max-w-[120px]">
                  {user?.email}
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 hidden sm:block transition-transform duration-200" />
            </button>

            {/* Profile Dropdown Menu */}
            {isProfileOpen && (
              <>
                <div
                  onClick={() => setIsProfileOpen(false)}
                  className="fixed inset-0 z-30"
                />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-40 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900 truncate">{user?.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                    <div className="mt-1.5">
                      <span className="text-[10px] uppercase font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                        {currentRoleConfig.label}
                      </span>
                    </div>
                  </div>

                  <div className="pt-1">
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 transition"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
