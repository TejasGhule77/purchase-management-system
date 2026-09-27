const express = require('express');
const router = express.Router();
const {
  getPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder
} = require('../controllers/purchaseOrderController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.route('/')
  .get(getPurchaseOrders)
  .post(authorize('PURCHASE_OFFICER'), createPurchaseOrder);

router.route('/:id')
  .get(getPurchaseOrderById);

module.exports = router;
