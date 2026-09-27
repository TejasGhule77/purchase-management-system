import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  CheckSquare,
  Users,
  DollarSign,
  Package,
  Truck,
  CreditCard,
  LogOut,
  ShoppingBag,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, role, logout } = useAuth();

  // Navigation defined strictly by Section 13 of Requirements
  const getNavItems = () => {
    switch (role) {
      case 'EMPLOYEE':
        return [
          { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/purchase-requests', label: 'Purchase Requests', icon: FileText }
        ];

      case 'MANAGER':
        return [
          { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/approvals', label: 'Approvals', icon: CheckSquare },
          { to: '/purchase-requests', label: 'Purchase Requests', icon: FileText }
        ];

      case 'PURCHASE_OFFICER':
        return [
          { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/purchase-requests', label: 'Purchase Requests', icon: FileText },
          { to: '/suppliers', label: 'Suppliers', icon: Users },
          { to: '/quotations', label: 'Quotations', icon: DollarSign },
          { to: '/purchase-orders', label: 'Purchase Orders', icon: Package },
          { to: '/goods-receipts', label: 'Goods Receipts', icon: Truck },
          { to: '/payments', label: 'Payments', icon: CreditCard }
        ];

      default:
        return [
          { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/purchase-requests', label: 'Purchase Requests', icon: FileText }
        ];
    }
  };

  const navItems = getNavItems();

  const roleBadgeStyles = {
    EMPLOYEE: 'bg-blue-100 text-blue-800 border-blue-200',
    MANAGER: 'bg-purple-100 text-purple-800 border-purple-200',
    PURCHASE_OFFICER: 'bg-emerald-100 text-emerald-800 border-emerald-200'
  };

  const roleDisplayNames = {
    EMPLOYEE: 'Employee',
    MANAGER: 'Manager',
    PURCHASE_OFFICER: 'Purchase Officer'
  };

  return (
    <>
      {/* Mobile Backdrop overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-sm transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-0 left-0 bottom-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 border-r border-slate-800 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/30">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight">Purchase System</h1>
              <p className="text-[11px] text-slate-400 font-medium">Mini Project</p>
            </div>
          </div>

          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current User Role Card */}
        <div className="px-5 py-3 border-b border-slate-800/50 bg-slate-950/40">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Active Role</span>
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${roleBadgeStyles[role] || 'bg-slate-800 text-slate-300'}`}>
              {roleDisplayNames[role] || role}
            </span>
          </div>
          <p className="text-xs text-white font-medium mt-1 truncate">{user?.name}</p>
          <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => {
                  if (window.innerWidth < 1024) onClose();
                }}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm font-semibold'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm font-medium text-rose-400 hover:text-white hover:bg-rose-600/20 rounded-lg border border-rose-500/20 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
