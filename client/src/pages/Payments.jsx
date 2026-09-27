import React, { useState, useEffect } from 'react';
import API from '../services/api';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import {
  PlusCircle,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [pendingPOs, setPendingPOs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const initialForm = {
    purchaseOrderId: '',
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'Bank Transfer',
    status: 'PAID',
    remarks: ''
  };
  const [formData, setFormData] = useState(initialForm);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [payRes, poRes] = await Promise.all([
        API.get('/payments'),
        API.get('/purchase-orders')
      ]);

      if (payRes.data.success) setPayments(payRes.data.data);
      if (poRes.data.success) {
        const payable = poRes.data.data.filter(
          (po) => (po.totalPaidAmount || 0) < po.totalAmount
        );
        setPendingPOs(payable);
      }
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

  const handleOpenRecord = () => {
    const firstPO = pendingPOs[0];
    const rem = firstPO ? Math.max(0, firstPO.totalAmount - (firstPO.totalPaidAmount || 0)) : '';
    setFormData({
      ...initialForm,
      purchaseOrderId: firstPO?._id || '',
      amount: rem
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const selectedPO = pendingPOs.find((p) => p._id === formData.purchaseOrderId);
  const poTotalAmount = selectedPO ? selectedPO.totalAmount : 0;
  const alreadyPaidAmount = selectedPO ? (selectedPO.totalPaidAmount || 0) : 0;
  const remainingPayable = Math.max(0, poTotalAmount - alreadyPaidAmount);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.purchaseOrderId || !formData.amount || !formData.paymentDate) {
      return setFormError('Please select Purchase Order, amount, and payment date.');
    }

    const payVal = Number(formData.amount);
    if (payVal <= 0) {
      return setFormError('Payment amount must be greater than 0.');
    }

    if (payVal > (remainingPayable + 0.01)) {
      return setFormError(`Payment amount cannot exceed PO remaining amount (₹${remainingPayable}).`);
    }

    try {
      setSubmitting(true);
      const res = await API.post('/payments', formData);
      if (res.data.success) {
        showToast('Payment recorded successfully.');
        setIsModalOpen(false);
        fetchData();
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Payment amount cannot exceed PO amount.');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Payment ID',
      accessor: 'paymentNumber',
      render: (row) => (
        <span className="font-mono font-bold text-emerald-600">
          {row.paymentNumber}
        </span>
      )
    },
    {
      header: 'PO Number',
      accessor: 'purchaseOrder',
      render: (row) => (
        <span className="font-mono font-bold text-slate-800">
          {row.purchaseOrder?.poNumber || '—'}
        </span>
      )
    },
    {
      header: 'Supplier',
      accessor: 'supplier',
      render: (row) => (
        <span className="font-semibold text-slate-800">
          {row.supplier?.name || '—'}
        </span>
      )
    },
    {
      header: 'Amount',
      accessor: 'amount',
      className: 'text-right',
      render: (row) => (
        <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-xs">
          ₹{Number(row.amount || 0).toLocaleString('en-IN')}
        </span>
      )
    },
    {
      header: 'Payment Date',
      accessor: 'paymentDate',
      render: (row) => (
        <span className="text-xs text-slate-600">
          {row.paymentDate ? new Date(row.paymentDate).toLocaleDateString('en-GB') : '—'}
        </span>
      )
    },
    {
      header: 'Payment Method',
      accessor: 'paymentMethod',
      render: (row) => (
        <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
          {row.paymentMethod}
        </span>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status} size="sm" />
    },
    {
      header: 'Remarks',
      accessor: 'remarks',
      render: (row) => (
        <span className="text-xs text-slate-600 truncate max-w-xs block">
          {row.remarks || '—'}
        </span>
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
          <h1 className="text-xl font-bold text-slate-900">Payments</h1>
          <p className="text-xs text-slate-500">Record supplier payment settlements for purchase orders</p>
        </div>

        <button
          onClick={handleOpenRecord}
          disabled={pendingPOs.length === 0}
          className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 shadow-sm transition flex items-center space-x-1.5 disabled:opacity-50"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Record Payment</span>
        </button>
      </div>

      {/* Payments Table */}
      <DataTable
        columns={columns}
        data={payments}
        searchPlaceholder="Search by Payment ID, PO #, Supplier, Method..."
        searchKeys={['paymentNumber', 'purchaseOrder.poNumber', 'supplier.name', 'paymentMethod', 'remarks']}
        emptyMessage="No payments recorded yet."
      />

      {/* Record Payment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Payment"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Select Purchase Order *
            </label>
            <select
              required
              value={formData.purchaseOrderId}
              onChange={(e) => {
                const po = pendingPOs.find((p) => p._id === e.target.value);
                const rem = po ? Math.max(0, po.totalAmount - (po.totalPaidAmount || 0)) : '';
                setFormData({
                  ...formData,
                  purchaseOrderId: e.target.value,
                  amount: rem
                });
              }}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
            >
              <option value="">-- Choose Purchase Order --</option>
              {pendingPOs.map((po) => {
                const rem = po.totalAmount - (po.totalPaidAmount || 0);
                return (
                  <option key={po._id} value={po._id}>
                    {po.poNumber}: {po.supplier?.name} — Total: ₹{Number(po.totalAmount || 0).toLocaleString('en-IN')} (Pending: ₹{Number(rem).toLocaleString('en-IN')})
                  </option>
                );
              })}
            </select>
          </div>

          {selectedPO && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1 text-slate-700">
              <div className="flex justify-between">
                <span><strong>PO Total:</strong> ₹{Number(poTotalAmount).toLocaleString('en-IN')}</span>
                <span><strong>Already Paid:</strong> ₹{Number(alreadyPaidAmount).toLocaleString('en-IN')}</span>
              </div>
              <div className="text-emerald-700 font-bold pt-1 flex justify-between border-t border-slate-200">
                <span>Remaining Balance:</span>
                <span>₹{Number(remainingPayable).toLocaleString('en-IN')}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Payment Amount (₹) *
              </label>
              <input
                type="number"
                min="0.01"
                max={remainingPayable || undefined}
                step="0.01"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="46000"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Payment Date *
              </label>
              <input
                type="date"
                required
                value={formData.paymentDate}
                onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Payment Method *
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
              >
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
                <option value="Cash">Cash</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Payment Status *
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
              >
                <option value="PAID">PAID</option>
                <option value="PENDING">PENDING</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Remarks
            </label>
            <textarea
              rows="2"
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              placeholder="e.g. Bank transfer transaction ref NEFT-994821"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
            >
              {submitting ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Payments;
