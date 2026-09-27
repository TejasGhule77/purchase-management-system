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

const GoodsReceipts = () => {
  const [receipts, setReceipts] = useState([]);
  const [activePOs, setActivePOs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const initialForm = {
    purchaseOrderId: '',
    receivedQuantity: '',
    receiptDate: new Date().toISOString().split('T')[0],
    remarks: ''
  };
  const [formData, setFormData] = useState(initialForm);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [grnRes, poRes] = await Promise.all([
        API.get('/goods-receipts'),
        API.get('/purchase-orders')
      ]);

      if (grnRes.data.success) setReceipts(grnRes.data.data);
      if (poRes.data.success) {
        const eligible = poRes.data.data.filter(
          (po) => (po.totalReceivedQuantity || 0) < po.quantity
        );
        setActivePOs(eligible);
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
    setFormData({
      ...initialForm,
      purchaseOrderId: activePOs[0]?._id || ''
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const selectedPO = activePOs.find((p) => p._id === formData.purchaseOrderId);
  const orderedQty = selectedPO ? selectedPO.quantity : 0;
  const alreadyReceivedQty = selectedPO ? (selectedPO.totalReceivedQuantity || 0) : 0;
  const maxCanReceive = Math.max(0, orderedQty - alreadyReceivedQty);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.purchaseOrderId || !formData.receivedQuantity || !formData.receiptDate) {
      return setFormError('Please select a Purchase Order, received quantity, and receipt date.');
    }

    const recQty = Number(formData.receivedQuantity);
    if (recQty <= 0) {
      return setFormError('Received quantity must be greater than 0.');
    }

    if (recQty > maxCanReceive) {
      return setFormError(`Received quantity cannot exceed remaining ordered quantity (${maxCanReceive} units).`);
    }

    try {
      setSubmitting(true);
      const res = await API.post('/goods-receipts', formData);
      if (res.data.success) {
        showToast('Goods receipt recorded successfully.');
        setIsModalOpen(false);
        fetchData();
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Unable to record goods receipt.');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Receipt ID',
      accessor: 'receiptNumber',
      render: (row) => (
        <span className="font-mono font-bold text-blue-600">
          {row.receiptNumber}
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
          {row.purchaseOrder?.supplier?.name || '—'}
        </span>
      )
    },
    {
      header: 'Received Quantity',
      accessor: 'receivedQuantity',
      className: 'text-right',
      render: (row) => (
        <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-xs">
          +{row.receivedQuantity}
        </span>
      )
    },
    {
      header: 'Receipt Date',
      accessor: 'receiptDate',
      render: (row) => (
        <span className="text-xs text-slate-600">
          {row.receiptDate ? new Date(row.receiptDate).toLocaleDateString('en-GB') : '—'}
        </span>
      )
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
          <h1 className="text-xl font-bold text-slate-900">Goods Receipt</h1>
          <p className="text-xs text-slate-500">Record item receipts against issued purchase orders</p>
        </div>

        <button
          onClick={handleOpenRecord}
          disabled={activePOs.length === 0}
          className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 shadow-sm transition flex items-center space-x-1.5 disabled:opacity-50"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Record Goods Receipt</span>
        </button>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={receipts}
        searchPlaceholder="Search by Receipt ID, PO Number, Supplier, Remarks..."
        searchKeys={['receiptNumber', 'purchaseOrder.poNumber', 'purchaseOrder.supplier.name', 'remarks']}
        emptyMessage="No goods receipts recorded yet."
      />

      {/* Record Goods Receipt Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Goods Receipt"
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
              onChange={(e) => setFormData({ ...formData, purchaseOrderId: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
            >
              <option value="">-- Choose Purchase Order --</option>
              {activePOs.map((po) => {
                const rem = po.quantity - (po.totalReceivedQuantity || 0);
                return (
                  <option key={po._id} value={po._id}>
                    {po.poNumber}: {po.itemName} ({po.supplier?.name}) — Remaining: {rem} of {po.quantity}
                  </option>
                );
              })}
            </select>
          </div>

          {selectedPO && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1 text-slate-700">
              <p><strong>Supplier:</strong> {selectedPO.supplier?.name}</p>
              <p><strong>Ordered Quantity:</strong> {orderedQty}</p>
              <p><strong>Already Received:</strong> {alreadyReceivedQty}</p>
              <p className="text-blue-700 font-bold"><strong>Remaining to Receive:</strong> {maxCanReceive}</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Received Quantity *
              </label>
              <input
                type="number"
                min="1"
                max={maxCanReceive || 1}
                required
                value={formData.receivedQuantity}
                onChange={(e) => setFormData({ ...formData, receivedQuantity: e.target.value })}
                placeholder="10"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Receipt Date *
              </label>
              <input
                type="date"
                required
                value={formData.receiptDate}
                onChange={(e) => setFormData({ ...formData, receiptDate: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
              />
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
              placeholder="e.g. All chairs received in good condition."
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
              {submitting ? 'Recording...' : 'Record Goods Receipt'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default GoodsReceipts;
