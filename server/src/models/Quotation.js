const mongoose = require('mongoose');

const quotationSchema = new mongoose.Schema(
  {
    quotationNumber: {
      type: String,
      unique: true,
      required: true
    },
    purchaseRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PurchaseRequest',
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
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1']
    },
    quotedPrice: {
      type: Number,
      required: [true, 'Quoted price is required'],
      min: [0.01, 'Quoted price must be greater than 0']
    },
    deliveryDate: {
      type: Date,
      required: [true, 'Delivery date is required']
    },
    remarks: {
      type: String,
      default: '',
      trim: true
    },
    status: {
      type: String,
      enum: ['PENDING', 'SELECTED', 'NOT SELECTED'],
      default: 'PENDING',
      set: (v) => {
        if (!v) return 'PENDING';
        const upper = v.toUpperCase();
        if (upper === 'REJECTED') return 'NOT SELECTED';
        return upper;
      }
    }
  },
  {
    timestamps: true
  }
);

// Virtual for unitPrice/totalAmount compatibility if needed
quotationSchema.virtual('unitPrice').get(function () {
  return this.quantity ? Number((this.quotedPrice / this.quantity).toFixed(2)) : this.quotedPrice;
});

quotationSchema.virtual('totalAmount').get(function () {
  return this.quotedPrice;
});

quotationSchema.set('toJSON', { virtuals: true });
quotationSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Quotation', quotationSchema);
