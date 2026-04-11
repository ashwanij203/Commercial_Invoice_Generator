const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  productName: { type: String, required: true },
  productCategory: { type: String, default: '' },
  quantity: { type: Number, required: true, min: 1 },
  unit: { type: String, default: 'pcs' },
  price: { type: Number, required: true }, // price per unit (excl. GST)
  gstPercent: { type: Number, default: 0 },
  gstAmount: { type: Number, default: 0 },  // GST for this line
  discount: { type: Number, default: 0 },   // discount amount for line
  subtotal: { type: Number, required: true } // final line total incl. GST - discount
}, { _id: false });

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    unique: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  },
  customerName: { type: String, required: true },
  customerPhone: { type: String, default: '' },
  customerEmail: { type: String, default: '' },
  customerAddress: { type: String, default: '' },
  customerGSTIN: { type: String, default: '' },

  items: [invoiceItemSchema],

  subtotalBeforeGST: { type: Number, default: 0 }, // sum of (price * qty)
  totalDiscount: { type: Number, default: 0 },
  totalGST: { type: Number, default: 0 },
  grandTotal: { type: Number, required: true },

  paymentMode: {
    type: String,
    enum: ['Cash', 'UPI', 'Card', 'Net Banking', 'Credit'],
    default: 'Cash'
  },
  paymentStatus: {
    type: String,
    enum: ['Paid', 'Pending', 'Partial'],
    default: 'Paid'
  },
  amountPaid: { type: Number, default: 0 },

  notes: { type: String, default: '' },
  date: { type: Date, default: Date.now },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

// Auto-generate invoice number before saving
invoiceSchema.pre('save', async function(next) {
  if (this.invoiceNumber) return next();
  const count = await mongoose.model('Invoice').countDocuments();
  const year = new Date().getFullYear();
  this.invoiceNumber = `JFE-${year}-${String(count + 1).padStart(4, '0')}`;
  next();
});

module.exports = mongoose.model('Invoice', invoiceSchema);
