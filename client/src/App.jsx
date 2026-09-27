import React, { useState } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import PurchaseRequests from './pages/PurchaseRequests';
import Approvals from './pages/Approvals';
import Suppliers from './pages/Suppliers';
import Quotations from './pages/Quotations';
import PurchaseOrders from './pages/PurchaseOrders';
import GoodsReceipts from './pages/GoodsReceipts';
import Payments from './pages/Payments';

// Protected App Layout
const AppLayout = () => {
  const { isAuthenticated, loading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-600">Loading Purchase Management System...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans antialiased text-slate-800">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

// Role Guard for Restricted Pages
const RoleGuard = ({ allowedRoles = [], children }) => {
  const { role, loading } = useAuth();

  if (loading) return null;

  const currentRole = (role || '').toUpperCase();
  const normalizedAllowed = allowedRoles.map((r) => r.toUpperCase());

  if (normalizedAllowed.length > 0 && !normalizedAllowed.includes(currentRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const App = () => {
  return (
    <Routes>
      {/* Public Authentication Pages */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected App Pages (Strictly Section 12 routes) */}
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* Purchase Requests */}
        <Route path="/purchase-requests" element={<PurchaseRequests />} />
        <Route path="/purchase-requests/create" element={<PurchaseRequests createMode={true} />} />
        <Route path="/purchase-requests/:id" element={<PurchaseRequests />} />
        
        {/* Manager Only: Approvals */}
        <Route
          path="/approvals"
          element={
            <RoleGuard allowedRoles={['MANAGER']}>
              <Approvals />
            </RoleGuard>
          }
        />

        {/* Purchase Officer Only: Suppliers */}
        <Route
          path="/suppliers"
          element={
            <RoleGuard allowedRoles={['PURCHASE_OFFICER']}>
              <Suppliers />
            </RoleGuard>
          }
        />

        {/* Purchase Officer Only: Quotations */}
        <Route
          path="/quotations"
          element={
            <RoleGuard allowedRoles={['PURCHASE_OFFICER']}>
              <Quotations />
            </RoleGuard>
          }
        />

        {/* Purchase Orders */}
        <Route
          path="/purchase-orders"
          element={
            <RoleGuard allowedRoles={['PURCHASE_OFFICER', 'MANAGER', 'EMPLOYEE']}>
              <PurchaseOrders />
            </RoleGuard>
          }
        />

        {/* Purchase Officer Only: Goods Receipts */}
        <Route
          path="/goods-receipts"
          element={
            <RoleGuard allowedRoles={['PURCHASE_OFFICER']}>
              <GoodsReceipts />
            </RoleGuard>
          }
        />

        {/* Purchase Officer Only: Payments */}
        <Route
          path="/payments"
          element={
            <RoleGuard allowedRoles={['PURCHASE_OFFICER']}>
              <Payments />
            </RoleGuard>
          }
        />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default App;
