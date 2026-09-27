import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import {
  PlusCircle,
  Eye,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const PurchaseOrders = () => {
  const { role } = useAuth();
  const [orders, setOrders] = useState([]);
  const [selectedQuotations, setSelectedQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPO, setSelectedPO] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Form State
  const initialForm = {
    quotationId: '',
    unitPrice: '',
    expectedDeliveryDate: ''
  };
  const [formData, setFormData] = useState(initialForm);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [poRes, quoteRes] = await Promise.all([
        API.get('/purchase-orders'),
        API.get('/quotations', { params: { status: 'SELECTED' } })
      ]);

      if (poRes.data.success) setOrders(poRes.data.data);
      if (quoteRes.data.success) setSelectedQuotations(quoteRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleOpenView = async (id) => {
    try {
      const res = await API.get(`/purchase-orders/${id}`);
      if (res.data.success) {
        setSelectedPO(res.data.data);
        setIsViewModalOpen(true);
      }
    } catch (err) {
      alert('Failed to load PO details');
    }
  };

  const handleOpenCreate = () => {
    const firstQ = selectedQuotations[0];
    const initialUnit = firstQ && firstQ.quantity ? (firstQ.quotedPrice / firstQ.quantity) : '';
    const initialDelivery = firstQ && firstQ.deliveryDate ? new Date(firstQ.deliveryDate).toISOString().split('T')[0] : '';
    setFormData({
      quotationId: firstQ?._id || '',
      unitPrice: initialUnit,
      expectedDeliveryDate: initialDelivery
    });
    setFormError('');
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.quotationId || !formData.unitPrice || !formData.expectedDeliveryDate) {
      return setFormError('Please select quotation, unit price, and expected delivery date.');
    }

    if (Number(formData.unitPrice) <= 0) {
      return setFormError('Unit price must be greater than 0.');
    }

    try {
      setSubmitting(true);
      const res = await API.post('/purchase-orders', formData);
      if (res.data.success) {
        showToast('Purchase Order created successfully.');
        setIsCreateModalOpen(false);
        fetchData();
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Unable to create purchase order.');
    } finally {
      setSubmitting(false);
    }
  };

  const activeQuote = selectedQuotations.find((q) => q._id === formData.quotationId);
  const calculatedTotal = activeQuote && formData.unitPrice
    ? Number((activeQuote.quantity * Number(formData.unitPrice)).toFixed(2))
    : 0;

  const columns = [
    {
      header: 'PO Number',
      accessor: 'poNumber',
      render: (row) => (
        <span
          onClick={() => handleOpenView(row._id)}
          className="font-mono font-bold text-blue-600 hover:underline cursor-pointer"
        >
          {row.poNumber}
        </span>
      )
    },
    {
      header: 'PR Ref',
      accessor: 'purchaseRequest',
      render: (row) => (
        <span className="font-mono text-xs text-slate-700 font-semibold">
          {row.purchaseRequest?.requestNumber || '—'}
        </span>
      )
    },
    {
      header: 'Supplier',
      accessor: 'supplier',
      render: (row) => <span className="font-semibold text-slate-800">{row.supplier?.name}</span>
    },
    {
      header: 'Item',
      accessor: 'itemName',
      render: (row) => <span className="text-slate-800 font-medium">{row.itemName}</span>
    },
    {
      header: 'Quantity',
      accessor: 'quantity',
      className: 'text-right',
      render: (row) => <span>{row.quantity}</span>
    },
    {
      header: 'Unit Price',
      accessor: 'unitPrice',
      className: 'text-right',
      render: (row) => <span>₹{Number(row.unitPrice || 0).toLocaleString('en-IN')}</span>
    },
    {
      header: 'Total Amount',
      accessor: 'totalAmount',
      className: 'text-right',
      render: (row) => (
        <span className="font-bold text-slate-900">
          ₹{Number(row.totalAmount || 0).toLocaleString('en-IN')}
        </span>
      )
    },
    {
      header: 'Order Date',
      accessor: 'orderDate',
      render: (row) => (
        <span className="text-xs text-slate-600">
          {row.orderDate ? new Date(row.orderDate).toLocaleDateString('en-GB') : '—'}
        </span>
      )
    },
    {
      header: 'Expected Delivery',
      accessor: 'expectedDeliveryDate',
      render: (row) => (
        <span className="text-xs text-slate-600">
          {row.expectedDeliveryDate ? new Date(row.expectedDeliveryDate).toLocaleDateString('en-GB') : '—'}
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
          onClick={() => handleOpenView(row._id)}
          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition"
          title="View PO Details"
        >
          <Eye className="w-4 h-4" />
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
          <h1 className="text-xl font-bold text-slate-900">Purchase Orders</h1>
          <p className="text-xs text-slate-500">Manage vendor purchase orders and delivery tracking</p>
        </div>

        {role === 'PURCHASE_OFFICER' && (
          <button
            onClick={handleOpenCreate}
            disabled={selectedQuotations.length === 0}
            className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 shadow-sm transition flex items-center space-x-1.5 disabled:opacity-50"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Purchase Order</span>
          </button>
        )}
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={orders}
        searchPlaceholder="Search POs by PO #, Item, Supplier..."
        searchKeys={['poNumber', 'itemName', 'supplier.name']}
        emptyMessage="No purchase orders created yet."
      />

      {/* View PO Details Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title={`Purchase Order Details - ${selectedPO?.poNumber}`}
      >
        {selectedPO && (
          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <span className="text-xs text-slate-500 block">PO Number</span>
                <span className="font-mono font-bold text-base text-slate-900">{selectedPO.poNumber}</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500 block">Status</span>
                <div className="mt-0.5">
                  <StatusBadge status={selectedPO.status} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 font-semibold uppercase">Supplier</label>
                <p className="font-bold text-slate-800">{selectedPO.supplier?.name}</p>
                <p className="text-xs text-slate-500">{selectedPO.supplier?.phone} • {selectedPO.supplier?.email}</p>
              </div>
              <div>
                <label className="text-xs text-slate-400 font-semibold uppercase">Purchase Request</label>
                <p className="font-mono font-bold text-blue-600">{selectedPO.purchaseRequest?.requestNumber || 'PR Ref'}</p>
              </div>
            </div>

            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-blue-800 font-semibold uppercase">Item Ordered:</span>
                <span className="font-bold text-slate-900">{selectedPO.itemName}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-blue-100 text-xs">
                <div>
                  <span className="text-slate-500 block">Quantity</span>
                  <span className="font-bold text-slate-900 text-sm">{selectedPO.quantity}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Unit Price</span>
                  <span className="font-bold text-slate-900 text-sm">₹{Number(selectedPO.unitPrice || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block">Total Amount</span>
                  <span className="font-bold text-blue-600 text-sm">₹{Number(selectedPO.totalAmount || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs text-slate-600">
              <div>
                <span className="font-semibold text-slate-700">Order Date:</span>{' '}
                {selectedPO.orderDate ? new Date(selectedPO.orderDate).toLocaleDateString('en-GB') : '—'}
              </div>
              <div>
                <span className="font-semibold text-slate-700">Expected Delivery Date:</span>{' '}
                {selectedPO.expectedDeliveryDate ? new Date(selectedPO.expectedDeliveryDate).toLocaleDateString('en-GB') : '—'}
              </div>
            </div>

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

      {/* Create Purchase Order Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Purchase Order"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Select Quotation (Status: SELECTED) *
            </label>
            <select
              required
              value={formData.quotationId}
              onChange={(e) => {
                const q = selectedQuotations.find((item) => item._id === e.target.value);
                setFormData({
                  ...formData,
                  quotationId: e.target.value,
                  unitPrice: q && q.quantity ? (q.quotedPrice / q.quantity) : formData.unitPrice,
                  expectedDeliveryDate: q && q.deliveryDate ? new Date(q.deliveryDate).toISOString().split('T')[0] : formData.expectedDeliveryDate
                });
              }}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
            >
              <option value="">-- Choose Selected Quotation --</option>
              {selectedQuotations.map((q) => (
                <option key={q._id} value={q._id}>
                  {q.quotationNumber}: {q.supplier?.name} — {q.itemName} (Qty: {q.quantity}, Quoted: ₹{Number(q.quotedPrice || 0).toLocaleString('en-IN')})
                </option>
              ))}
            </select>
          </div>

          {activeQuote && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1 text-slate-700">
              <p><strong>Item:</strong> {activeQuote.itemName} ({activeQuote.quantity} units)</p>
              <p><strong>Supplier:</strong> {activeQuote.supplier?.name}</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Unit Price (₹) *
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                required
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                placeholder="4600"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Total Amount (₹)
              </label>
              <div className="px-3 py-2 text-sm bg-blue-50 border border-blue-200 text-blue-700 font-bold rounded-lg flex items-center justify-between">
                <span>₹{calculatedTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Expected Delivery Date *
            </label>
            <input
              type="date"
              required
              value={formData.expectedDeliveryDate}
              onChange={(e) => setFormData({ ...formData, expectedDeliveryDate: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Purchase Order'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PurchaseOrders;
