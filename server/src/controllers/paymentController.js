const Payment = require('../models/Payment');
const PurchaseOrder = require('../models/PurchaseOrder');
const { getNextSequence } = require('../models/Counter');

// @desc    Get all payments
// @route   GET /api/payments
// @access  Private
exports.getPayments = async (req, res, next) => {
  try {
    const { purchaseOrderId, supplierId, status } = req.query;
    let query = {};

    if (purchaseOrderId) query.purchaseOrder = purchaseOrderId;
    if (supplierId) query.supplier = supplierId;
    if (status) query.status = status.toUpperCase();

    const payments = await Payment.find(query)
      .populate('purchaseOrder', 'poNumber itemName totalAmount quantity status totalReceivedQuantity totalPaidAmount')
      .populate('supplier', 'name email phone contactPerson')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single payment
// @route   GET /api/payments/:id
// @access  Private
exports.getPaymentById = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('purchaseOrder')
      .populate('supplier');

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    res.status(200).json({
      success: true,
      data: payment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Record Payment
// @route   POST /api/payments
// @access  Private (Purchase Officer)
exports.createPayment = async (req, res, next) => {
  try {
    const { purchaseOrderId, amount, paymentDate, paymentMethod, status, remarks } = req.body;
    const poId = purchaseOrderId || req.body.purchaseOrder;

    // Business Rule 8: Payment must reference an existing PO
    if (!poId || amount === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide Purchase Order and payment amount'
      });
    }

    const po = await PurchaseOrder.findById(poId).populate('supplier');
    if (!po) {
      return res.status(404).json({ success: false, message: 'Purchase Order not found' });
    }

    const payAmount = Number(amount);
    if (payAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Payment amount must be greater than 0' });
    }

    const alreadyPaid = po.totalPaidAmount || 0;
    const remainingToPay = Number((po.totalAmount - alreadyPaid).toFixed(2));

    // Business Rule 9: Payment amount cannot exceed PO amount
    if (payAmount > (remainingToPay + 0.01)) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount cannot exceed PO amount.'
      });
    }

    const paymentNumber = await getNextSequence('PAY', 'PAY', 3);
    const paymentStatus = (status || 'PAID').toUpperCase();

    const payment = await Payment.create({
      paymentNumber,
      purchaseOrder: po._id,
      supplier: po.supplier._id,
      amount: payAmount,
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      paymentMethod: paymentMethod || 'Bank Transfer',
      status: paymentStatus,
      remarks: remarks || ''
    });

    // Update PO totalPaidAmount and status
    const newTotalPaid = Number((alreadyPaid + payAmount).toFixed(2));
    po.totalPaidAmount = newTotalPaid;

    // Business Rule 10: Once payment is marked PAID: PO -> COMPLETED
    if (paymentStatus === 'PAID') {
      po.status = 'COMPLETED';
    }

    await po.save();

    const populated = await Payment.findById(payment._id)
      .populate('purchaseOrder')
      .populate('supplier');

    res.status(201).json({
      success: true,
      data: populated,
      message: 'Payment recorded successfully.'
    });
  } catch (error) {
    next(error);
  }
};
