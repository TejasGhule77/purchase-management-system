const express = require('express');
const router = express.Router();
const {
  getQuotations,
  getQuotationById,
  createQuotation,
  selectQuotation
} = require('../controllers/quotationController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.route('/')
  .get(getQuotations)
  .post(authorize('PURCHASE_OFFICER'), createQuotation);

router.route('/:id')
  .get(getQuotationById);

router.put('/:id/select', authorize('PURCHASE_OFFICER'), selectQuotation);
router.post('/:id/select', authorize('PURCHASE_OFFICER'), selectQuotation);

module.exports = router;
