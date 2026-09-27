const PurchaseRequest = require('../models/PurchaseRequest');
const { getNextSequence } = require('../models/Counter');

// @desc    Get all purchase requests
// @route   GET /api/purchase-requests
// @access  Private
exports.getPurchaseRequests = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    let query = {};

    // Role filtering: Employee sees their own requests, Manager & Purchase Officer see all
    if (req.user && req.user.role === 'EMPLOYEE') {
      query.employee = req.user._id;
    }

    if (status) {
      const upperStatus = status.toUpperCase();
      if (upperStatus === 'PENDING_APPROVAL' || upperStatus === 'PENDING') {
        query.status = 'PENDING';
      } else {
        query.status = upperStatus;
      }
    }

    if (search) {
      query.$or = [
        { requestNumber: { $regex: search, $options: 'i' } },
        { itemName: { $regex: search, $options: 'i' } },
        { reason: { $regex: search, $options: 'i' } }
      ];
    }

    const requests = await PurchaseRequest.find(query)
      .populate('employee', 'name email role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single purchase request
// @route   GET /api/purchase-requests/:id
// @access  Private
exports.getPurchaseRequestById = async (req, res, next) => {
  try {
    const request = await PurchaseRequest.findById(req.params.id)
      .populate('employee', 'name email role');

    if (!request) {
      return res.status(404).json({ success: false, message: 'Purchase request not found' });
    }

    // Role check: Employee can only view own request
    if (req.user.role === 'EMPLOYEE' && request.employee._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this request' });
    }

    res.status(200).json({
      success: true,
      data: request
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new purchase request
// @route   POST /api/purchase-requests
// @access  Private (Employee)
exports.createPurchaseRequest = async (req, res, next) => {
  try {
    const { itemName, description, quantity, estimatedPrice, estimatedUnitPrice, reason, requiredDate } = req.body;

    const price = estimatedPrice !== undefined ? Number(estimatedPrice) : (Number(quantity || 1) * Number(estimatedUnitPrice || 0));

    if (!itemName || !quantity || price === undefined || !requiredDate || !reason) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    if (Number(quantity) <= 0 || price < 0) {
      return res.status(400).json({ success: false, message: 'Quantity must be greater than 0 and price cannot be negative' });
    }

    const requestNumber = await getNextSequence('PR', 'PR', 3);

    const purchaseRequest = await PurchaseRequest.create({
      requestNumber,
      employee: req.user._id,
      itemName,
      description: description || '',
      quantity: Number(quantity),
      estimatedPrice: price,
      reason,
      requiredDate: new Date(requiredDate),
      status: 'PENDING'
    });

    const populated = await PurchaseRequest.findById(purchaseRequest._id).populate('employee', 'name email role');

    res.status(201).json({
      success: true,
      data: populated,
      message: 'Request created successfully.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update PR status (Approve / Reject)
// @route   PUT /api/purchase-requests/:id/status
// @access  Private (Manager only)
exports.updatePurchaseRequestStatus = async (req, res, next) => {
  try {
    const { status, rejectionReason, approvalComment } = req.body;
    const request = await PurchaseRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Purchase request not found' });
    }

    const newStatus = (status || '').toUpperCase();
    if (!['APPROVED', 'REJECTED', 'PENDING'].includes(newStatus)) {
      return res.status(400).json({ success: false, message: 'Status must be APPROVED, REJECTED, or PENDING' });
    }

    request.status = newStatus;
    if (newStatus === 'REJECTED') {
      request.rejectionReason = rejectionReason || approvalComment || 'Request rejected by manager';
    } else {
      request.rejectionReason = '';
    }

    await request.save();

    const populated = await PurchaseRequest.findById(request._id).populate('employee', 'name email role');

    res.status(200).json({
      success: true,
      data: populated,
      message: newStatus === 'APPROVED' ? 'Request approved successfully.' : 'Request rejected successfully.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve PR
// @route   POST /api/purchase-requests/:id/approve
// @access  Private (Manager)
exports.approvePurchaseRequest = async (req, res, next) => {
  req.body.status = 'APPROVED';
  return exports.updatePurchaseRequestStatus(req, res, next);
};

// @desc    Reject PR
// @route   POST /api/purchase-requests/:id/reject
// @access  Private (Manager)
exports.rejectPurchaseRequest = async (req, res, next) => {
  req.body.status = 'REJECTED';
  return exports.updatePurchaseRequestStatus(req, res, next);
};

// @desc    Delete purchase request (if pending and created by owner)
// @route   DELETE /api/purchase-requests/:id
// @access  Private
exports.deletePurchaseRequest = async (req, res, next) => {
  try {
    const request = await PurchaseRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Purchase request not found' });
    }

    if (req.user.role === 'EMPLOYEE' && request.employee.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this request' });
    }

    if (request.status === 'APPROVED') {
      return res.status(400).json({ success: false, message: 'Approved requests cannot be deleted' });
    }

    await PurchaseRequest.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Purchase request removed successfully'
    });
  } catch (error) {
    next(error);
  }
};
