const PurchaseOrder = require('../models/PurchaseOrder');
const Quotation = require('../models/Quotation');
const GoodsReceipt = require('../models/GoodsReceipt');
const Payment = require('../models/Payment');
const { getNextSequence } = require('../models/Counter');

// @desc    Get all purchase orders
// @route   GET /api/purchase-orders
// @access  Private
exports.getPurchaseOrders = async (req, res, next) => {
  try {
    const { status, supplier, search } = req.query;
    let query = {};

    if (status) {
      query.status = status.toUpperCase();
    }

    if (supplier) {
      query.supplier = supplier;
    }

    if (search) {
      query.$or = [
        { poNumber: { $regex: search, $options: 'i' } },
        { itemName: { $regex: search, $options: 'i' } }
      ];
    }

    const orders = await PurchaseOrder.find(query)
      .populate('purchaseRequest', 'requestNumber itemName quantity estimatedPrice')
      .populate('quotation', 'quotationNumber quotedPrice deliveryDate')
      .populate('supplier', 'name contactPerson email phone address')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single purchase order
// @route   GET /api/purchase-orders/:id
// @access  Private
exports.getPurchaseOrderById = async (req, res, next) => {
  try {
    const po = await PurchaseOrder.findById(req.params.id)
      .populate('purchaseRequest')
      .populate('quotation')
      .populate('supplier');

    if (!po) {
      return res.status(404).json({ success: false, message: 'Purchase Order not found' });
    }

    const goodsReceipts = await GoodsReceipt.find({ purchaseOrder: po._id }).sort({ createdAt: -1 });
    const payments = await Payment.find({ purchaseOrder: po._id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        ...po.toObject(),
        goodsReceipts,
        payments
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new purchase order from selected quotation
// @route   POST /api/purchase-orders
// @access  Private (Purchase Officer)
exports.createPurchaseOrder = async (req, res, next) => {
  try {
    const { quotationId, expectedDeliveryDate, deliveryDate, unitPrice } = req.body;

    const qId = quotationId || req.body.quotation;
    const targetDeliveryDate = expectedDeliveryDate || deliveryDate;

    if (!qId || !targetDeliveryDate) {
      return res.status(400).json({ success: false, message: 'Please provide quotation and expected delivery date' });
    }

    const quotation = await Quotation.findById(qId).populate('purchaseRequest').populate('supplier');
    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }

    // Business Rule 5: PO can only be created from a SELECTED quotation
    if (quotation.status !== 'SELECTED') {
      return res.status(400).json({
        success: false,
        message: `PO can only be created from a SELECTED quotation. Current quotation status: ${quotation.status}`
      });
    }

    // Check if PO already created for this quotation
    const existingPO = await PurchaseOrder.findOne({ quotation: quotation._id });
    if (existingPO) {
      return res.status(400).json({
        success: false,
        message: `A Purchase Order (${existingPO.poNumber}) has already been generated for this quotation`
      });
    }

    const calculatedUnitPrice = unitPrice !== undefined ? Number(unitPrice) : Number((quotation.quotedPrice / quotation.quantity).toFixed(2));
    const totalAmount = Number((quotation.quantity * calculatedUnitPrice).toFixed(2));

    const poNumber = await getNextSequence('PO', 'PO', 3);

    const purchaseOrder = await PurchaseOrder.create({
      poNumber,
      purchaseRequest: quotation.purchaseRequest._id,
      quotation: quotation._id,
      supplier: quotation.supplier._id,
      itemName: quotation.itemName,
      quantity: quotation.quantity,
      unitPrice: calculatedUnitPrice,
      totalAmount,
      orderDate: new Date(),
      expectedDeliveryDate: new Date(targetDeliveryDate),
      status: 'CREATED'
    });

    const populated = await PurchaseOrder.findById(purchaseOrder._id)
      .populate('purchaseRequest')
      .populate('quotation')
      .populate('supplier');

    res.status(201).json({
      success: true,
      data: populated,
      message: 'Purchase Order created successfully.'
    });
  } catch (error) {
    next(error);
  }
};
