import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import {
  PlusCircle,
  Eye,
  Trash2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const PurchaseRequests = ({ createMode = false }) => {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedPR, setSelectedPR] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(createMode);
  const [toastMessage, setToastMessage] = useState('');

  // Form State matching Section 4
  const initialForm = {
    itemName: '',
    description: '',
    quantity: '',
    estimatedPrice: '',
    reason: '',
    requiredDate: ''
  };
  const [formData, setFormData] = useState(initialForm);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await API.get('/purchase-requests', {
        params: { status: statusFilter || undefined }
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
    fetchRequests();
  }, [statusFilter]);

  useEffect(() => {
    if (createMode) {
      setIsFormModalOpen(true);
    }
  }, [createMode]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleOpenCreate = () => {
    setFormData(initialForm);
    setFormError('');
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.itemName || !formData.quantity || !formData.estimatedPrice || !formData.reason || !formData.requiredDate) {
      return setFormError('Please fill in all required fields.');
    }

    if (Number(formData.quantity) <= 0) {
      return setFormError('Quantity must be greater than 0.');
    }

    if (Number(formData.estimatedPrice) < 0) {
      return setFormError('Estimated price cannot be negative.');
    }

    try {
      setSubmitting(true);
      const res = await API.post('/purchase-requests', formData);
      if (res.data.success) {
        showToast('Request created successfully.');
        setIsFormModalOpen(false);
        setFormData(initialForm);
        fetchRequests();
        if (createMode) {
          navigate('/purchase-requests');
        }
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Unable to create request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this request?')) return;
    try {
      const res = await API.delete(`/purchase-requests/${id}`);
      if (res.data.success) {
        showToast('Purchase request removed successfully.');
        fetchRequests();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Unable to remove request.');
    }
  };

  const columns = [
    {
      header: 'Request ID',
      accessor: 'requestNumber',
      render: (row) => (
        <span
          className="font-mono font-bold text-blue-600 hover:underline cursor-pointer"
          onClick={() => {
            setSelectedPR(row);
            setIsViewModalOpen(true);
          }}
        >
          {row.requestNumber}
        </span>
      )
    },
    {
      header: 'Item',
      accessor: 'itemName',
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-800">{row.itemName}</p>
          {row.description && <p className="text-xs text-slate-400 truncate max-w-xs">{row.description}</p>}
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
      render: (row) => {
        return (
          <div className="flex items-center justify-end space-x-1.5">
            <button
              onClick={() => {
                setSelectedPR(row);
                setIsViewModalOpen(true);
              }}
              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition"
              title="View Details"
            >
              <Eye className="w-4 h-4" />
            </button>
            {role === 'EMPLOYEE' && row.status === 'PENDING' && (
              <button
                onClick={() => handleDelete(row._id)}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
                title="Delete Request"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        );
      }
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

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Purchase Requests</h1>
          <p className="text-xs text-slate-500">
            {role === 'EMPLOYEE' ? 'Create and track your own purchase requests' : 'View all purchase requests in the system'}
          </p>
        </div>

        {role === 'EMPLOYEE' && (
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 shadow-sm transition flex items-center space-x-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Purchase Request</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1">
        {[
          { id: '', label: 'All' },
          { id: 'PENDING', label: 'Pending' },
          { id: 'APPROVED', label: 'Approved' },
          { id: 'REJECTED', label: 'Rejected' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              statusFilter === tab.id
                ? 'bg-blue-600 text-white font-semibold shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={requests}
        searchPlaceholder="Search by Request ID, Item Name, Reason..."
        searchKeys={['requestNumber', 'itemName', 'reason']}
        emptyMessage="No purchase requests found."
      />

      {/* View Details Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title={`Purchase Request Details - ${selectedPR?.requestNumber}`}
      >
        {selectedPR && (
          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <span className="text-xs text-slate-500 block">Status</span>
                <div className="mt-1">
                  <StatusBadge status={selectedPR.status} />
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500 block">Created Date</span>
                <span className="text-xs font-semibold text-slate-700">
                  {new Date(selectedPR.createdAt).toLocaleDateString('en-GB')}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 font-semibold uppercase">Item Name</label>
                <p className="font-bold text-slate-800">{selectedPR.itemName}</p>
              </div>
              <div>
                <label className="text-xs text-slate-400 font-semibold uppercase">Requested By</label>
                <p className="font-bold text-slate-800">{selectedPR.employee?.name || user?.name}</p>
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

            {selectedPR.status === 'REJECTED' && selectedPR.rejectionReason && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
                <span className="font-bold block">Rejection Reason:</span>
                <p className="mt-0.5">{selectedPR.rejectionReason}</p>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Purchase Request Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          if (createMode) navigate('/purchase-requests');
        }}
        title="Create Purchase Request"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Item Name *
            </label>
            <input
              type="text"
              required
              value={formData.itemName}
              onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
              placeholder="e.g. Office Chairs"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Description
            </label>
            <textarea
              rows="2"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g. Chairs for computer lab"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Quantity *
              </label>
              <input
                type="number"
                min="1"
                required
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="10"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Estimated Price (₹) *
              </label>
              <input
                type="number"
                min="0"
                step="1"
                required
                value={formData.estimatedPrice}
                onChange={(e) => setFormData({ ...formData, estimatedPrice: e.target.value })}
                placeholder="50000"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Required Date *
              </label>
              <input
                type="date"
                required
                value={formData.requiredDate}
                onChange={(e) => setFormData({ ...formData, requiredDate: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Reason *
              </label>
              <input
                type="text"
                required
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="e.g. New lab setup"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={() => {
                setIsFormModalOpen(false);
                if (createMode) navigate('/purchase-requests');
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PurchaseRequests;
