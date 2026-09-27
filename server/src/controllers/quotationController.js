const Quotation = require('../models/Quotation');
const PurchaseRequest = require('../models/PurchaseRequest');
const Supplier = require('../models/Supplier');
const { getNextSequence } = require('../models/Counter');

// @desc    Get all quotations (optionally filtered by purchaseRequest)
// @route   GET /api/quotations
// @access  Private
exports.getQuotations = async (req, res, next) => {
  try {
    const { purchaseRequest, supplier, status } = req.query;
    let query = {};

    if (purchaseRequest) {
      query.purchaseRequest = purchaseRequest;
    }

    if (supplier) {
      query.supplier = supplier;
    }

    if (status) {
      query.status = status.toUpperCase();
    }

    const quotations = await Quotation.find(query)
      .populate('purchaseRequest', 'requestNumber itemName quantity estimatedPrice status requiredDate employee')
      .populate('supplier', 'name contactPerson email phone address')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: quotations.length,
      data: quotations
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single quotation
// @route   GET /api/quotations/:id
// @access  Private
exports.getQuotationById = async (req, res, next) => {
  try {
    const quotation = await Quotation.findById(req.params.id)
      .populate('purchaseRequest')
      .populate('supplier');

    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }

    res.status(200).json({
      success: true,
      data: quotation
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new quotation
// @route   POST /api/quotations
// @access  Private (Purchase Officer)
exports.createQuotation = async (req, res, next) => {
  try {
    const { purchaseRequestId, supplierId, quotedPrice, unitPrice, deliveryDate, remarks } = req.body;

    const prId = purchaseRequestId || req.body.purchaseRequest;
    const supId = supplierId || req.body.supplier;

    if (!prId || !supId || (quotedPrice === undefined && unitPrice === undefined) || !deliveryDate) {
      return res.status(400).json({ success: false, message: 'Please provide PR, supplier, quoted price, and delivery date' });
    }

    const pr = await PurchaseRequest.findById(prId);
    if (!pr) {
      return res.status(404).json({ success: false, message: 'Purchase request not found' });
    }

    // Business Rule 3: Quotation can only be added for an APPROVED purchase request
    if (pr.status !== 'APPROVED') {
      return res.status(400).json({
        success: false,
        message: `Quotations can only be added to APPROVED purchase requests. Current PR status is ${pr.status}`
      });
    }

    const supplier = await Supplier.findById(supId);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    const finalPrice = quotedPrice !== undefined ? Number(quotedPrice) : (Number(unitPrice) * pr.quantity);

    if (finalPrice <= 0) {
      return res.status(400).json({ success: false, message: 'Quoted price must be greater than zero' });
    }

    const quotationNumber = await getNextSequence('QT', 'QT', 3);

    const quotation = await Quotation.create({
      quotationNumber,
      purchaseRequest: pr._id,
      supplier: supplier._id,
      itemName: pr.itemName,
      quantity: pr.quantity,
      quotedPrice: finalPrice,
      deliveryDate: new Date(deliveryDate),
      remarks: remarks || '',
      status: 'PENDING'
    });

    const populated = await Quotation.findById(quotation._id)
      .populate('purchaseRequest', 'requestNumber itemName quantity status')
      .populate('supplier', 'name contactPerson email phone');

    res.status(201).json({
      success: true,
      data: populated,
      message: 'Quotation added successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Select a quotation
// @route   PUT /api/quotations/:id/select or POST /api/quotations/:id/select
// @access  Private (Purchase Officer)
exports.selectQuotation = async (req, res, next) => {
  try {
    const selectedQuotation = await Quotation.findById(req.params.id);

    if (!selectedQuotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }

    // Business Rule 4: Only one quotation can be selected for a purchase request
    // Set this quotation to SELECTED
    selectedQuotation.status = 'SELECTED';
    await selectedQuotation.save();

    // Mark other quotations for this same PR as NOT SELECTED
    await Quotation.updateMany(
      {
        purchaseRequest: selectedQuotation.purchaseRequest,
        _id: { $ne: selectedQuotation._id }
      },
      {
        $set: { status: 'NOT SELECTED' }
      }
    );

    const populated = await Quotation.findById(selectedQuotation._id)
      .populate('purchaseRequest')
      .populate('supplier');

    res.status(200).json({
      success: true,
      data: populated,
      message: 'Quotation selected successfully.'
    });
  } catch (error) {
    next(error);
  }
};
