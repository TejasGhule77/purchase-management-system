const mongoose = require('mongoose');

const goodsReceiptSchema = new mongoose.Schema(
  {
    receiptNumber: {
      type: String,
      unique: true,
      required: true
    },
    purchaseOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PurchaseOrder',
      required: true
    },
    receivedQuantity: {
      type: Number,
      required: [true, 'Received quantity is required'],
      min: [1, 'Received quantity must be at least 1']
    },
    receiptDate: {
      type: Date,
      default: Date.now,
      required: true
    },
    remarks: {
      type: String,
      default: '',
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// Virtual for grnNumber alias
goodsReceiptSchema.virtual('grnNumber').get(function () {
  return this.receiptNumber;
});

goodsReceiptSchema.set('toJSON', { virtuals: true });
goodsReceiptSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('GoodsReceipt', goodsReceiptSchema);
