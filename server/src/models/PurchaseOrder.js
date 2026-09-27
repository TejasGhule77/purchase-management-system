const mongoose = require('mongoose');

const purchaseOrderSchema = new mongoose.Schema(
  {
    poNumber: {
      type: String,
      unique: true,
      required: true
    },
    purchaseRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PurchaseRequest',
      required: true
    },
    quotation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quotation',
      required: true
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true
    },
    itemName: {
      type: String,
      required: true,
      trim: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0.01
    },
    totalAmount: {
      type: Number,
      required: true
    },
    orderDate: {
      type: Date,
      default: Date.now
    },
    expectedDeliveryDate: {
      type: Date,
      required: [true, 'Expected delivery date is required']
    },
    status: {
      type: String,
      enum: ['CREATED', 'RECEIVED', 'COMPLETED'],
      default: 'CREATED',
      set: (v) => (v ? v.toUpperCase() : 'CREATED')
    },
    totalReceivedQuantity: {
      type: Number,
      default: 0
    },
    totalPaidAmount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Virtual for deliveryDate compatibility
purchaseOrderSchema.virtual('deliveryDate').get(function () {
  return this.expectedDeliveryDate;
});

// Pre-validate to ensure totalAmount = quantity * unitPrice
purchaseOrderSchema.pre('validate', function (next) {
  if (this.quantity && this.unitPrice) {
    this.totalAmount = Number((this.quantity * this.unitPrice).toFixed(2));
  }
  next();
});

purchaseOrderSchema.set('toJSON', { virtuals: true });
purchaseOrderSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);
