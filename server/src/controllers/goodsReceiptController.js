const GoodsReceipt = require('../models/GoodsReceipt');
const PurchaseOrder = require('../models/PurchaseOrder');
const { getNextSequence } = require('../models/Counter');

// @desc    Get all goods receipts
// @route   GET /api/goods-receipts
// @access  Private
exports.getGoodsReceipts = async (req, res, next) => {
  try {
    const { purchaseOrderId } = req.query;
    let query = {};

    if (purchaseOrderId) {
      query.purchaseOrder = purchaseOrderId;
    }

    const receipts = await GoodsReceipt.find(query)
      .populate({
        path: 'purchaseOrder',
        populate: [
          { path: 'supplier', select: 'name contactPerson phone email' },
          { path: 'purchaseRequest', select: 'requestNumber itemName' }
        ]
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: receipts.length,
      data: receipts
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single goods receipt
// @route   GET /api/goods-receipts/:id
// @access  Private
exports.getGoodsReceiptById = async (req, res, next) => {
  try {
    const grn = await GoodsReceipt.findById(req.params.id)
      .populate({
        path: 'purchaseOrder',
        populate: [
          { path: 'supplier' },
          { path: 'purchaseRequest' }
        ]
      });

    if (!grn) {
      return res.status(404).json({ success: false, message: 'Goods Receipt not found' });
    }

    res.status(200).json({
      success: true,
      data: grn
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Record Goods Receipt
// @route   POST /api/goods-receipts
// @access  Private (Purchase Officer)
exports.createGoodsReceipt = async (req, res, next) => {
  try {
    const { purchaseOrderId, receivedQuantity, receiptDate, remarks } = req.body;
    const poId = purchaseOrderId || req.body.purchaseOrder;

    // Business Rule 6: Goods receipt must reference an existing PO
    if (!poId || receivedQuantity === undefined) {
      return res.status(400).json({ success: false, message: 'Please provide Purchase Order and received quantity' });
    }

    const po = await PurchaseOrder.findById(poId).populate('supplier');
    if (!po) {
      return res.status(404).json({ success: false, message: 'Purchase Order not found' });
    }

    const recQty = Number(receivedQuantity);

    if (recQty <= 0) {
      return res.status(400).json({ success: false, message: 'Received quantity must be greater than 0' });
    }

    const currentTotalReceived = po.totalReceivedQuantity || 0;
    const remainingToReceive = po.quantity - currentTotalReceived;

    // Business Rule 7: Received quantity cannot exceed ordered quantity
    if (recQty > remainingToReceive) {
      return res.status(400).json({
        success: false,
        message: `Received quantity (${recQty}) cannot exceed ordered remaining quantity (${remainingToReceive} of ${po.quantity} units).`
      });
    }

    const receiptNumber = await getNextSequence('GR', 'GR', 3);
    const newTotalReceived = currentTotalReceived + recQty;

    const goodsReceipt = await GoodsReceipt.create({
      receiptNumber,
      purchaseOrder: po._id,
      receivedQuantity: recQty,
      receiptDate: receiptDate ? new Date(receiptDate) : new Date(),
      remarks: remarks || ''
    });

    // Update PO status
    po.totalReceivedQuantity = newTotalReceived;
    if (newTotalReceived >= po.quantity) {
      // Full quantity received
      po.status = 'RECEIVED';
    } else {
      // Partial receipt
      po.status = 'RECEIVED';
    }

    await po.save();

    const populated = await GoodsReceipt.findById(goodsReceipt._id)
      .populate({
        path: 'purchaseOrder',
        populate: [{ path: 'supplier' }]
      });

    res.status(201).json({
      success: true,
      data: populated,
      message: 'Goods receipt recorded successfully.'
    });
  } catch (error) {
    next(error);
  }
};
