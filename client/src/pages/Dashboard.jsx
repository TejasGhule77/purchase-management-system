import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import WorkflowSteps from '../components/WorkflowSteps';
import Modal from '../components/Modal';
import {
  FileText,
  Clock,
  Package,
  Truck,
  CreditCard,
  PlusCircle,
  CheckCircle2,
  Users,
  DollarSign,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Eye
} from 'lucide-react';

const Dashboard = () => {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPR, setSelectedPR] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await API.get('/dashboard/stats');
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [role]);

  if (loading) {
    return (
      <div className="p-12 flex items-center justify-center min-h-[350px]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-500 tracking-wide uppercase">
            Loading Dashboard Overview...
          </p>
        </div>
      </div>
    );
  }

  const summary = data?.summaryCards || {};
  const recentRequests = data?.recentRequests || [];

  const cards = [
    {
      title: 'Purchase Requests',
      value: summary.purchaseRequests || 0,
      icon: FileText,
      link: '/purchase-requests',
      color: 'bg-blue-50 text-blue-600 border-blue-100 group-hover:bg-blue-600 group-hover:text-white',
      accent: 'text-blue-600',
      description: 'Requisitions logged'
    },
    {
      title: 'Pending Approvals',
      value: summary.pendingApprovals || 0,
      icon: Clock,
      link: role === 'MANAGER' ? '/approvals' : '/purchase-requests?status=PENDING',
      color: 'bg-amber-50 text-amber-600 border-amber-100 group-hover:bg-amber-500 group-hover:text-white',
      accent: 'text-amber-600',
      description: 'Awaiting manager review'
    },
    {
      title: 'Purchase Orders',
      value: summary.purchaseOrders || 0,
      icon: Package,
      link: '/purchase-orders',
      color: 'bg-indigo-50 text-indigo-600 border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white',
      accent: 'text-indigo-600',
      description: 'Active POs issued'
    },
    {
      title: 'Goods Receipts',
      value: summary.goodsReceipts || 0,
      icon: Truck,
      link: '/goods-receipts',
      color: 'bg-emerald-50 text-emerald-600 border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white',
      accent: 'text-emerald-600',
      description: 'Shipments verified'
    },
    {
      title: 'Pending Payments',
      value: summary.pendingPayments || 0,
      icon: CreditCard,
      link: '/payments',
      color: 'bg-rose-50 text-rose-600 border-rose-100 group-hover:bg-rose-600 group-hover:text-white',
      accent: 'text-rose-600',
      description: 'Orders pending settlement'
    }
  ];

  const currentWorkflowStep =
    role === 'EMPLOYEE' ? 1 : role === 'MANAGER' ? 2 : 3;

  return (
    <div className="p-5 sm:p-7 space-y-6 max-w-7xl mx-auto">
      {/* Modern Gradient Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 p-6 sm:p-8 text-white shadow-md shadow-blue-700/15">
        <div className="absolute right-0 top-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-blue-100">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Purchase Management System Overview</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Hello, {user?.name || 'User'}!
            </h1>
            <p className="text-xs sm:text-sm text-blue-100 font-normal leading-relaxed">
              {role === 'EMPLOYEE' && 'Create item purchase requests, monitor manager approvals, and track order fulfillment.'}
              {role === 'MANAGER' && 'Review incoming employee purchase requisitions, approve budgets, or reject with feedback.'}
              {role === 'PURCHASE_OFFICER' && 'Collect vendor quotations, issue official purchase orders, record goods receipts, and settle payments.'}
            </p>
          </div>

          {/* Quick Action Button */}
          <div className="flex-shrink-0">
            {role === 'EMPLOYEE' && (
              <button
                onClick={() => navigate('/purchase-requests/create')}
                className="px-4 py-2.5 bg-white text-blue-700 hover:bg-blue-50 text-xs font-bold rounded-xl shadow-md transition-all transform hover:-translate-y-0.5 flex items-center space-x-2"
              >
                <PlusCircle className="w-4 h-4 text-blue-600" />
                <span>Create Purchase Request</span>
              </button>
            )}

            {role === 'MANAGER' && (
              <button
                onClick={() => navigate('/approvals')}
                className="px-4 py-2.5 bg-white text-purple-700 hover:bg-purple-50 text-xs font-bold rounded-xl shadow-md transition-all transform hover:-translate-y-0.5 flex items-center space-x-2"
              >
                <CheckCircle2 className="w-4 h-4 text-purple-600" />
                <span>Review Pending ({summary.pendingApprovals || 0})</span>
              </button>
            )}

            {role === 'PURCHASE_OFFICER' && (
              <div className="flex items-center space-x-2.5">
                <button
                  onClick={() => navigate('/quotations')}
                  className="px-4 py-2.5 bg-white text-blue-700 hover:bg-blue-50 text-xs font-bold rounded-xl shadow-md transition-all transform hover:-translate-y-0.5 flex items-center space-x-2"
                >
                  <DollarSign className="w-4 h-4 text-blue-600" />
                  <span>Quotations</span>
                </button>
                <button
                  onClick={() => navigate('/purchase-orders')}
                  className="px-4 py-2.5 bg-blue-900/60 hover:bg-blue-900 text-white border border-white/20 text-xs font-bold rounded-xl backdrop-blur-md transition flex items-center space-x-2"
                >
                  <Package className="w-4 h-4" />
                  <span>Purchase Orders</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Visual Purchase Lifecycle Workflow Map */}
      <WorkflowSteps currentStep={currentWorkflowStep} />

      {/* 5 KPI Metric Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            System Key Performance Metrics
          </h2>
          <span className="text-xs text-slate-400 font-medium">Real-time database sync</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {cards.map((c, i) => {
            const Icon = c.icon;
            return (
              <div
                key={i}
                onClick={() => c.link && navigate(c.link)}
                className="group relative bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-blue-300 transition-all duration-200 cursor-pointer overflow-hidden"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider line-clamp-1">
                    {c.title}
                  </span>
                  <div
                    className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-colors ${c.color}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                </div>

                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                    {c.value}
                  </span>
                  <span className="text-xs font-semibold text-blue-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    View <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">{c.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Purchase Requests Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Recent Purchase Requests</h2>
            <p className="text-xs text-slate-400">
              Showing latest requisitions submitted across the organization
            </p>
          </div>
          <button
            onClick={() => navigate('/purchase-requests')}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
          >
            <span>View All Requests</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-3.5">Request ID</th>
                <th className="px-6 py-3.5">Item Name</th>
                <th className="px-6 py-3.5 text-right">Quantity</th>
                <th className="px-6 py-3.5 text-right">Estimated Price</th>
                <th className="px-6 py-3.5">Required Date</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentRequests.length > 0 ? (
                recentRequests.map((pr) => (
                  <tr
                    key={pr._id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    <td className="px-6 py-3.5 font-mono font-bold text-blue-600">
                      {pr.requestNumber}
                    </td>
                    <td className="px-6 py-3.5">
                      <p className="font-semibold text-slate-800">{pr.itemName}</p>
                      {pr.reason && (
                        <p className="text-xs text-slate-400 truncate max-w-xs">{pr.reason}</p>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-right font-medium text-slate-700">
                      {pr.quantity}
                    </td>
                    <td className="px-6 py-3.5 text-right font-bold text-slate-900">
                      ₹{Number(pr.estimatedPrice || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-3.5 text-xs text-slate-600">
                      {pr.requiredDate ? new Date(pr.requiredDate).toLocaleDateString('en-GB') : '—'}
                    </td>
                    <td className="px-6 py-3.5">
                      <StatusBadge status={pr.status} size="sm" />
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        onClick={() => {
                          setSelectedPR(pr);
                          setIsViewModalOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center text-xs text-slate-400">
                    No purchase requests found in the system.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View PR Details Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title={`Purchase Request Details - ${selectedPR?.requestNumber}`}
      >
        {selectedPR && (
          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-xs text-slate-400 block font-medium">Status</span>
                <div className="mt-1">
                  <StatusBadge status={selectedPR.status} />
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block font-medium">Created Date</span>
                <span className="text-xs font-semibold text-slate-700">
                  {new Date(selectedPR.createdAt).toLocaleDateString('en-GB')}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 font-semibold uppercase">Item Name</label>
                <p className="font-bold text-slate-900 mt-0.5">{selectedPR.itemName}</p>
              </div>
              <div>
                <label className="text-xs text-slate-400 font-semibold uppercase">Requested By</label>
                <p className="font-bold text-slate-900 mt-0.5">{selectedPR.employee?.name || user?.name}</p>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-semibold uppercase">Description</label>
              <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 mt-1">
                {selectedPR.description || 'No description provided.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 p-3.5 bg-blue-50/70 rounded-xl border border-blue-100">
              <div>
                <span className="text-xs text-blue-700 font-semibold">Quantity</span>
                <p className="text-base font-bold text-slate-900 mt-0.5">{selectedPR.quantity}</p>
              </div>
              <div>
                <span className="text-xs text-blue-700 font-semibold">Estimated Price</span>
                <p className="text-base font-bold text-blue-600 mt-0.5">
                  ₹{Number(selectedPR.estimatedPrice || 0).toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs text-slate-600">
              <div>
                <span className="font-semibold text-slate-700">Required Date:</span>{' '}
                {selectedPR.requiredDate ? new Date(selectedPR.requiredDate).toLocaleDateString('en-GB') : '—'}
              </div>
              <div>
                <span className="font-semibold text-slate-700">Reason:</span>{' '}
                {selectedPR.reason}
              </div>
            </div>

            {selectedPR.status === 'REJECTED' && selectedPR.rejectionReason && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                <span className="font-bold block">Rejection Reason:</span>
                <p className="mt-0.5">{selectedPR.rejectionReason}</p>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Dashboard;
