const PurchaseRequest = require('../models/PurchaseRequest');
const Supplier = require('../models/Supplier');
const Quotation = require('../models/Quotation');
const PurchaseOrder = require('../models/PurchaseOrder');
const GoodsReceipt = require('../models/GoodsReceipt');
const Payment = require('../models/Payment');

// @desc    Get Simple Dashboard Statistics
// @route   GET /api/dashboard/stats
// @access  Private
exports.getDashboardStats = async (req, res, next) => {
  try {
    const role = (req.user.role || '').toUpperCase();
    const userId = req.user._id;

    // 5 Simple Summary Metrics as requested in Section 11
    const totalPRs = await PurchaseRequest.countDocuments();
    const pendingApprovals = await PurchaseRequest.countDocuments({ status: 'PENDING' });
    const totalPOs = await PurchaseOrder.countDocuments();
    const totalGoodsReceipts = await GoodsReceipt.countDocuments();
    
    // Payments: pending payment orders or total recorded payments
    const pendingPaymentPOs = await PurchaseOrder.countDocuments({ status: { $ne: 'COMPLETED' } });
    const totalPayments = await Payment.countDocuments();
    const totalSuppliers = await Supplier.countDocuments();
    const totalQuotations = await Quotation.countDocuments();

    // Recent Purchase Requests (Section 11: Recent PR list)
    const recentPRQuery = role === 'EMPLOYEE' ? { employee: userId } : {};
    const recentRequests = await PurchaseRequest.find(recentPRQuery)
      .populate('employee', 'name email')
      .sort({ createdAt: -1 })
      .limit(6);

    res.status(200).json({
      success: true,
      data: {
        summaryCards: {
          purchaseRequests: totalPRs,
          pendingApprovals: pendingApprovals,
          purchaseOrders: totalPOs,
          goodsReceipts: totalGoodsReceipts,
          pendingPayments: pendingPaymentPOs,
          completedPayments: totalPayments,
          totalSuppliers: totalSuppliers,
          totalQuotations: totalQuotations
        },
        recentRequests
      }
    });
  } catch (error) {
    next(error);
  }
};
