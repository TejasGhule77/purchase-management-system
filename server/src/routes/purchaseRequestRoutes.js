const express = require('express');
const router = express.Router();
const {
  getPurchaseRequests,
  getPurchaseRequestById,
  createPurchaseRequest,
  updatePurchaseRequestStatus,
  approvePurchaseRequest,
  rejectPurchaseRequest,
  deletePurchaseRequest
} = require('../controllers/purchaseRequestController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.route('/')
  .get(getPurchaseRequests)
  .post(authorize('EMPLOYEE'), createPurchaseRequest);

router.route('/:id')
  .get(getPurchaseRequestById)
  .delete(deletePurchaseRequest);

router.put('/:id/status', authorize('MANAGER'), updatePurchaseRequestStatus);
router.post('/:id/approve', authorize('MANAGER'), approvePurchaseRequest);
router.post('/:id/reject', authorize('MANAGER'), rejectPurchaseRequest);

module.exports = router;
