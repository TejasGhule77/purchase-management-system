const express = require('express');
const router = express.Router();
const {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier
} = require('../controllers/supplierController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.route('/')
  .get(getSuppliers)
  .post(authorize('PURCHASE_OFFICER'), createSupplier);

router.route('/:id')
  .get(getSupplierById)
  .put(authorize('PURCHASE_OFFICER'), updateSupplier)
  .delete(authorize('PURCHASE_OFFICER'), deleteSupplier);

module.exports = router;
