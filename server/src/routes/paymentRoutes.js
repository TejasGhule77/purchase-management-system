const express = require('express');
const router = express.Router();
const {
  getPayments,
  getPaymentById,
  createPayment
} = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.route('/')
  .get(getPayments)
  .post(authorize('PURCHASE_OFFICER'), createPayment);

router.route('/:id')
  .get(getPaymentById);

module.exports = router;
