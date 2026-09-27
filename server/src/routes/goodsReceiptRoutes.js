const express = require('express');
const router = express.Router();
const {
  getGoodsReceipts,
  getGoodsReceiptById,
  createGoodsReceipt
} = require('../controllers/goodsReceiptController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.route('/')
  .get(getGoodsReceipts)
  .post(authorize('PURCHASE_OFFICER'), createGoodsReceipt);

router.route('/:id')
  .get(getGoodsReceiptById);

module.exports = router;
