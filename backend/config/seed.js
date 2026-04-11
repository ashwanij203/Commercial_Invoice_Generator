const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

const User = require('../models/User');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const Invoice = require('../models/Invoice');

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // Clear existing data
  await User.deleteMany({});
  await Customer.deleteMany({});
  await Product.deleteMany({});
  await Invoice.deleteMany({});

  // Create admin user
  const user = await User.create({
    name: 'Jaiswal Admin',
    email: 'admin@jaiswal.com',
    password: 'admin123',
    shopName: 'Jaiswal Furniture & Electronics',
    shopAddress: 'Main Market, Abu, Rajasthan - 307026',
    shopPhone: '+91 98765 43210',
    shopGSTIN: '08AABCJ1234A1Z5'
  });

  // Create sample customers
  const customers = await Customer.insertMany([
    { name: 'Ramesh Sharma', phone: '9876543210', email: 'ramesh@gmail.com', address: 'Gandhi Nagar, Abu', city: 'Abu', createdBy: user._id },
    { name: 'Sunil Patel', phone: '9812345678', email: 'sunil@gmail.com', address: 'Shiv Colony, Sirohi', city: 'Sirohi', createdBy: user._id },
    { name: 'Priya Mehta', phone: '9988776655', email: 'priya@gmail.com', address: 'Station Road, Abu Road', city: 'Abu Road', createdBy: user._id },
    { name: 'Mahesh Verma', phone: '9765432100', email: '', address: 'Dilwara, Abu', city: 'Abu', createdBy: user._id },
    { name: 'Geeta Joshi', phone: '9123456789', email: 'geeta@gmail.com', address: 'Nakki Lake Road, Abu', city: 'Abu', createdBy: user._id }
  ]);

  // Create sample products
  const products = await Product.insertMany([
    { name: 'Wooden Sofa Set (3+1+1)', category: 'Furniture', price: 25000, gstPercent: 18, stock: 10, unit: 'set', sku: 'FUR-001', createdBy: user._id },
    { name: 'King Size Bed with Storage', category: 'Furniture', price: 18000, gstPercent: 18, stock: 8, unit: 'pcs', sku: 'FUR-002', createdBy: user._id },
    { name: 'Dining Table 6-Seater', category: 'Furniture', price: 12000, gstPercent: 18, stock: 5, unit: 'set', sku: 'FUR-003', createdBy: user._id },
    { name: 'Wardrobe 3-Door', category: 'Furniture', price: 15000, gstPercent: 18, stock: 7, unit: 'pcs', sku: 'FUR-004', createdBy: user._id },
    { name: 'Samsung 43" Smart TV', category: 'Electronics', price: 32000, gstPercent: 28, stock: 15, unit: 'pcs', sku: 'ELE-001', createdBy: user._id },
    { name: 'LG 1.5 Ton Split AC', category: 'Electronics', price: 38000, gstPercent: 28, stock: 12, unit: 'pcs', sku: 'ELE-002', createdBy: user._id },
    { name: 'Whirlpool Refrigerator 250L', category: 'Electronics', price: 22000, gstPercent: 18, stock: 9, unit: 'pcs', sku: 'ELE-003', createdBy: user._id },
    { name: 'Ceiling Fan Crompton', category: 'Electronics', price: 1800, gstPercent: 12, stock: 30, unit: 'pcs', sku: 'ELE-004', createdBy: user._id },
    { name: 'Study Table with Chair', category: 'Furniture', price: 4500, gstPercent: 18, stock: 20, unit: 'set', sku: 'FUR-005', createdBy: user._id },
    { name: 'Washing Machine 7kg', category: 'Electronics', price: 18500, gstPercent: 18, stock: 10, unit: 'pcs', sku: 'ELE-005', createdBy: user._id }
  ]);

  // Create sample invoices
  const makeInvoice = (daysAgo, custIdx, itemsArr, payMode) => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    let subtotalBeforeGST = 0, totalGST = 0, grandTotal = 0;
    const items = itemsArr.map(({ idx, qty, discount = 0 }) => {
      const p = products[idx];
      const base = p.price * qty;
      const disc = discount;
      const gstAmt = ((base - disc) * p.gstPercent) / 100;
      const sub = base - disc + gstAmt;
      subtotalBeforeGST += base;
      totalGST += gstAmt;
      grandTotal += sub;
      return {
        product: p._id, productName: p.name, productCategory: p.category,
        quantity: qty, unit: p.unit, price: p.price,
        gstPercent: p.gstPercent, gstAmount: parseFloat(gstAmt.toFixed(2)),
        discount: disc, subtotal: parseFloat(sub.toFixed(2))
      };
    });
    return {
      customer: customers[custIdx]._id,
      customerName: customers[custIdx].name,
      customerPhone: customers[custIdx].phone,
      customerEmail: customers[custIdx].email,
      customerAddress: customers[custIdx].address,
      items,
      subtotalBeforeGST: parseFloat(subtotalBeforeGST.toFixed(2)),
      totalDiscount: 0,
      totalGST: parseFloat(totalGST.toFixed(2)),
      grandTotal: parseFloat(grandTotal.toFixed(2)),
      paymentMode: payMode,
      paymentStatus: 'Paid',
      amountPaid: parseFloat(grandTotal.toFixed(2)),
      date,
      createdBy: user._id
    };
  };

  await Invoice.create(makeInvoice(0, 0, [{ idx: 0, qty: 1 }, { idx: 4, qty: 1 }], 'UPI'));
  await Invoice.create(makeInvoice(1, 1, [{ idx: 1, qty: 1 }], 'Cash'));
  await Invoice.create(makeInvoice(2, 2, [{ idx: 5, qty: 1 }, { idx: 7, qty: 2 }], 'Card'));
  await Invoice.create(makeInvoice(3, 3, [{ idx: 2, qty: 1 }, { idx: 8, qty: 2 }], 'Cash'));
  await Invoice.create(makeInvoice(5, 4, [{ idx: 6, qty: 1 }], 'UPI'));
  await Invoice.create(makeInvoice(7, 0, [{ idx: 3, qty: 1 }, { idx: 9, qty: 1 }], 'Net Banking'));

  console.log('✅ Seed data inserted successfully!');
  console.log('📧 Login: admin@jaiswal.com | 🔑 Password: admin123');
  mongoose.disconnect();
};

seed().catch(err => { console.error(err); process.exit(1); });
