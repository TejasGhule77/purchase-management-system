import React, { useState, useEffect } from 'react';
import API from '../services/api';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import {
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';

const Approvals = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPR, setSelectedPR] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      const res = await API.get('/purchase-requests', {
        params: { status: 'PENDING' }
      });
      if (res.data.success) {
        setRequests(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleOpenReview = (pr) => {
    setSelectedPR(pr);
    setRejectionReason('');
    setIsModalOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedPR) return;
    try {
      setSubmitting(true);
      const res = await API.put(`/purchase-requests/${selectedPR._id}/status`, {
        status: 'APPROVED'
      });
      if (res.data.success) {
        showToast('Request approved successfully.');
        setIsModalOpen(false);
        fetchPendingRequests();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Unable to approve request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedPR) return;
    try {
      setSubmitting(true);
      const res = await API.put(`/purchase-requests/${selectedPR._id}/status`, {
        status: 'REJECTED',
        rejectionReason: rejectionReason || 'Rejected by Manager'
      });
      if (res.data.success) {
        showToast('Request rejected successfully.');
        setIsModalOpen(false);
        fetchPendingRequests();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Unable to reject request.');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Request ID',
      accessor: 'requestNumber',
      render: (row) => (
        <span className="font-mono font-bold text-blue-600">
          {row.requestNumber}
        </span>
      )
    },
    {
      header: 'Employee',
      accessor: 'employee',
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-800">{row.employee?.name || 'Employee'}</p>
          <p className="text-xs text-slate-400">{row.employee?.email}</p>
        </div>
      )
    },
    {
      header: 'Item',
      accessor: 'itemName',
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-800">{row.itemName}</p>
          <p className="text-xs text-slate-400 truncate max-w-xs">{row.description}</p>
        </div>
      )
    },
    {
      header: 'Quantity',
      accessor: 'quantity',
      className: 'text-right',
      render: (row) => <span>{row.quantity}</span>
    },
    {
      header: 'Estimated Price',
      accessor: 'estimatedPrice',
      className: 'text-right',
      render: (row) => (
        <span className="font-bold text-slate-900">
          ₹{Number(row.estimatedPrice || 0).toLocaleString('en-IN')}
        </span>
      )
    },
    {
      header: 'Required Date',
      accessor: 'requiredDate',
      render: (row) => (
        <span className="text-xs text-slate-600">
          {row.requiredDate ? new Date(row.requiredDate).toLocaleDateString('en-GB') : '—'}
        </span>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (row) => (
        <button
          onClick={() => handleOpenReview(row)}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition ml-auto"
        >
          Review
        </button>
      )
    }
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg border border-slate-700 flex items-center space-x-3 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900">Pending Approvals</h1>
            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-bold text-xs rounded-full">
              {requests.length} Pending
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Manager authorization portal for pending purchase requests</p>
        </div>
      </div>

      {/* Pending Table */}
      <DataTable
        columns={columns}
        data={requests}
        searchPlaceholder="Search pending requests by ID, Item, Employee..."
        searchKeys={['requestNumber', 'itemName', 'reason', 'employee.name']}
        emptyMessage="No pending purchase requests for approval."
      />

      {/* Review Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Review Request - ${selectedPR?.requestNumber}`}
      >
        {selectedPR && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 font-semibold uppercase">Employee</label>
                <p className="font-bold text-slate-800">{selectedPR.employee?.name} ({selectedPR.employee?.email})</p>
              </div>
              <div>
                <label className="text-xs text-slate-400 font-semibold uppercase">Item</label>
                <p className="font-bold text-slate-800">{selectedPR.itemName}</p>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-semibold uppercase">Description</label>
              <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 mt-1">
                {selectedPR.description || 'No description provided.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <div>
                <span className="text-xs text-blue-700 font-medium">Quantity</span>
                <p className="text-base font-bold text-slate-900">{selectedPR.quantity}</p>
              </div>
              <div>
                <span className="text-xs text-blue-700 font-medium">Estimated Price</span>
                <p className="text-base font-bold text-blue-600">
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

            {/* Rejection Reason (Optional) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Rejection Reason (Optional)
              </label>
              <textarea
                rows="2"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter rejection reason if rejecting this request..."
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
              />
            </div>

            {/* Actions: Approve & Reject */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
              >
                Cancel
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleReject}
                  className="px-4 py-2 bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white border border-rose-200 text-xs font-semibold rounded-lg transition disabled:opacity-50 flex items-center space-x-1"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject</span>
                </button>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleApprove}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition disabled:opacity-50 flex items-center space-x-1"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Approvals;
