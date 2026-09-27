const mongoose = require('mongoose');

const purchaseRequestSchema = new mongoose.Schema(
  {
    requestNumber: {
      type: String,
      unique: true,
      required: true
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    itemName: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1']
    },
    estimatedPrice: {
      type: Number,
      required: [true, 'Estimated price is required'],
      min: [0, 'Estimated price cannot be negative']
    },
    reason: {
      type: String,
      required: [true, 'Reason for purchase is required'],
      trim: true
    },
    requiredDate: {
      type: Date,
      required: [true, 'Required date is required']
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
      set: (v) => (v ? v.toUpperCase() : 'PENDING')
    },
    rejectionReason: {
      type: String,
      default: '',
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// Virtual alias for employee/requestedBy for frontend compatibility
purchaseRequestSchema.virtual('requestedBy').get(function () {
  return this.employee;
});

// Set virtuals to be included in toJSON and toObject
purchaseRequestSchema.set('toJSON', { virtuals: true });
purchaseRequestSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('PurchaseRequest', purchaseRequestSchema);
