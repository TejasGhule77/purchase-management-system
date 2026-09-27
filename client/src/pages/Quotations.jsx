import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import {
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  ArrowRight
} from 'lucide-react';

const Quotations = () => {
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState([]);
  const [approvedPRs, setApprovedPRs] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [selectedPRId, setSelectedPRId] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const initialForm = {
    purchaseRequestId: '',
    supplierId: '',
    quotedPrice: '',
    deliveryDate: '',
    remarks: ''
  };
  const [formData, setFormData] = useState(initialForm);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [quotesRes, prRes, supRes] = await Promise.all([
        API.get('/quotations', { params: { purchaseRequest: selectedPRId || undefined } }),
        API.get('/purchase-requests', { params: { status: 'APPROVED' } }),
        API.get('/suppliers')
      ]);

      if (quotesRes.data.success) setQuotations(quotesRes.data.data);
      if (prRes.data.success) {
        setApprovedPRs(prRes.data.data);
      }
      if (supRes.data.success) setSuppliers(supRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedPRId]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleOpenAdd = () => {
    setFormData({
      ...initialForm,
      purchaseRequestId: selectedPRId || (approvedPRs[0]?._id || '')
    });
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.purchaseRequestId || !formData.supplierId || !formData.quotedPrice || !formData.deliveryDate) {
      return setFormError('Please fill in all required fields.');
    }

    if (Number(formData.quotedPrice) <= 0) {
      return setFormError('Quoted price must be greater than 0.');
    }

    try {
      setSubmitting(true);
      const res = await API.post('/quotations', formData);
      if (res.data.success) {
        showToast('Quotation added successfully.');
        setIsAddModalOpen(false);
        fetchData();
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Unable to add quotation.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectQuotation = async (quoteId) => {
    try {
      const res = await API.put(`/quotations/${quoteId}/select`);
      if (res.data.success) {
        showToast('Quotation selected successfully.');
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Unable to select quotation.');
    }
  };

  const currentPR = approvedPRs.find((p) => p._id === selectedPRId);

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
          <h1 className="text-xl font-bold text-slate-900">Supplier Quotations</h1>
          <p className="text-xs text-slate-500">Record and compare supplier quotations for approved requests</p>
        </div>

        <button
          onClick={handleOpenAdd}
          disabled={approvedPRs.length === 0}
          className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 shadow-sm transition flex items-center space-x-1.5 disabled:opacity-50"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Quotation</span>
        </button>
      </div>

      {/* Filter by Approved PR */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <label className="text-xs font-semibold text-slate-700 whitespace-nowrap">
            Filter by Approved PR:
          </label>
          <select
            value={selectedPRId}
            onChange={(e) => setSelectedPRId(e.target.value)}
            className="w-full sm:w-80 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-medium"
          >
            <option value="">-- All Approved Requests --</option>
            {approvedPRs.map((pr) => (
              <option key={pr._id} value={pr._id}>
                {pr.requestNumber}: {pr.itemName} (Qty: {pr.quantity}, Est: ₹{Number(pr.estimatedPrice || 0).toLocaleString('en-IN')})
              </option>
            ))}
          </select>
        </div>

        {selectedPRId && currentPR && (
          <div className="text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 flex items-center gap-4">
            <span>Item: <strong className="text-slate-900">{currentPR.itemName}</strong></span>
            <span>Quantity: <strong className="text-slate-900">{currentPR.quantity}</strong></span>
            <span>Required Date: <strong className="text-slate-900">{new Date(currentPR.requiredDate).toLocaleDateString('en-GB')}</strong></span>
          </div>
        )}
      </div>

      {/* Quotations Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Quotations Comparison</h2>
            <p className="text-xs text-slate-500">Select one quotation to generate a Purchase Order</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                <th className="px-4 py-3">Quotation ID</th>
                <th className="px-4 py-3">Purchase Request</th>
                <th className="px-4 py-3">Supplier</th>
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3 text-right">Quantity</th>
                <th className="px-4 py-3 text-right">Quoted Price</th>
                <th className="px-4 py-3">Delivery Date</th>
                <th className="px-4 py-3">Remarks</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {quotations.length > 0 ? (
                quotations.map((q) => {
                  const isSelected = q.status === 'SELECTED';
                  return (
                    <tr
                      key={q._id}
                      className={`transition-colors ${isSelected ? 'bg-emerald-50/50 font-medium' : 'hover:bg-slate-50/80'}`}
                    >
                      <td className="px-4 py-3 font-mono font-bold text-slate-800">{q.quotationNumber}</td>
                      <td className="px-4 py-3 font-mono text-xs text-blue-600 font-semibold">
                        {q.purchaseRequest?.requestNumber || '—'}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{q.supplier?.name}</td>
                      <td className="px-4 py-3 text-slate-700">{q.itemName}</td>
                      <td className="px-4 py-3 text-right text-slate-700">{q.quantity}</td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900">
                        ₹{Number(q.quotedPrice || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {q.deliveryDate ? new Date(q.deliveryDate).toLocaleDateString('en-GB') : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 truncate max-w-xs">{q.remarks || '—'}</td>
                      <td className="px-4 py-3"><StatusBadge status={q.status} size="sm" /></td>
                      <td className="px-4 py-3 text-right">
                        {isSelected ? (
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                            Selected
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSelectQuotation(q._id)}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-blue-600 text-white rounded text-xs font-semibold shadow-sm transition"
                          >
                            Select
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="10" className="px-4 py-8 text-center text-xs text-slate-400">
                    No quotations found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Quotation Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Supplier Quotation"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Purchase Request *
            </label>
            <select
              required
              value={formData.purchaseRequestId}
              onChange={(e) => setFormData({ ...formData, purchaseRequestId: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
            >
              <option value="">-- Select Approved PR --</option>
              {approvedPRs.map((pr) => (
                <option key={pr._id} value={pr._id}>
                  {pr.requestNumber}: {pr.itemName} (Qty: {pr.quantity}, Est: ₹{Number(pr.estimatedPrice || 0).toLocaleString('en-IN')})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Supplier *
            </label>
            <select
              required
              value={formData.supplierId}
              onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
            >
              <option value="">-- Select Supplier --</option>
              {suppliers.map((sup) => (
                <option key={sup._id} value={sup._id}>
                  {sup.name} ({sup.contactPerson} - {sup.phone})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Quoted Price (₹) *
              </label>
              <input
                type="number"
                min="0.01"
                step="1"
                required
                value={formData.quotedPrice}
                onChange={(e) => setFormData({ ...formData, quotedPrice: e.target.value })}
                placeholder="46000"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Delivery Date *
              </label>
              <input
                type="date"
                required
                value={formData.deliveryDate}
                onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
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
              placeholder="e.g. Free shipping and standard warranty"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Add Quotation'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Quotations;
