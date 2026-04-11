const bcrypt = require('bcryptjs');
const { getDb } = require('./index');

/**
 * Seed the database with sample data.
 * Only runs if no users exist yet.
 */
function seedDatabase() {
  const db = getDb();

  // Check if data already exists
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCount.count > 0) {
    console.log('ℹ️  Database already has data, skipping seed');
    return;
  }

  console.log('🌱 Seeding sample data...');

  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password, shop_name, shop_address, shop_phone, shop_gstin)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const hashedPassword = bcrypt.hashSync('admin123', 12);
  const userResult = insertUser.run(
    'Jaiswal Admin',
    'admin@jaiswal.com',
    hashedPassword,
    'Jaiswal Furniture & Electronics',
    'Main Market, Abu, Rajasthan - 307026',
    '+91 98765 43210',
    '08AABCJ1234A1Z5'
  );
  const userId = userResult.lastInsertRowid;

  // Insert customers
  const insertCustomer = db.prepare(`
    INSERT INTO customers (name, phone, email, address, city, created_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const customers = [
    ['Ramesh Sharma', '9876543210', 'ramesh@gmail.com', 'Gandhi Nagar, Abu', 'Abu'],
    ['Sunil Patel', '9812345678', 'sunil@gmail.com', 'Shiv Colony, Sirohi', 'Sirohi'],
    ['Priya Mehta', '9988776655', 'priya@gmail.com', 'Station Road, Abu Road', 'Abu Road'],
    ['Mahesh Verma', '9765432100', '', 'Dilwara, Abu', 'Abu'],
    ['Geeta Joshi', '9123456789', 'geeta@gmail.com', 'Nakki Lake Road, Abu', 'Abu']
  ];

  const customerIds = [];
  for (const c of customers) {
    const r = insertCustomer.run(...c, userId);
    customerIds.push(r.lastInsertRowid);
  }

  // Insert products
  const insertProduct = db.prepare(`
    INSERT INTO products (name, category, price, gst_percent, stock, unit, sku, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const products = [
    ['Wooden Sofa Set (3+1+1)', 'Furniture', 25000, 18, 10, 'set', 'FUR-001'],
    ['King Size Bed with Storage', 'Furniture', 18000, 18, 8, 'pcs', 'FUR-002'],
    ['Dining Table 6-Seater', 'Furniture', 12000, 18, 5, 'set', 'FUR-003'],
    ['Wardrobe 3-Door', 'Furniture', 15000, 18, 7, 'pcs', 'FUR-004'],
    ['Samsung 43" Smart TV', 'Electronics', 32000, 28, 15, 'pcs', 'ELE-001'],
    ['LG 1.5 Ton Split AC', 'Electronics', 38000, 28, 12, 'pcs', 'ELE-002'],
    ['Whirlpool Refrigerator 250L', 'Electronics', 22000, 18, 9, 'pcs', 'ELE-003'],
    ['Ceiling Fan Crompton', 'Electronics', 1800, 12, 30, 'pcs', 'ELE-004'],
    ['Study Table with Chair', 'Furniture', 4500, 18, 20, 'set', 'FUR-005'],
    ['Washing Machine 7kg', 'Electronics', 18500, 18, 10, 'pcs', 'ELE-005']
  ];

  const productIds = [];
  for (const p of products) {
    const r = insertProduct.run(...p, userId);
    productIds.push(r.lastInsertRowid);
  }

  // Insert sample invoices
  const insertInvoice = db.prepare(`
    INSERT INTO invoices (invoice_number, customer_id, customer_name, customer_phone, customer_email,
      customer_address, subtotal_before_gst, total_discount, total_gst, grand_total,
      payment_mode, payment_status, amount_paid, date, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertItem = db.prepare(`
    INSERT INTO invoice_items (invoice_id, product_id, product_name, product_category,
      quantity, unit, price, gst_percent, gst_amount, discount, subtotal)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const year = new Date().getFullYear();
  let invoiceCount = 0;

  const createInvoice = (daysAgo, custIdx, itemsArr, payMode) => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    let subtotalBeforeGST = 0, totalGST = 0, grandTotal = 0;

    const processedItems = itemsArr.map(({ idx, qty, discount = 0 }) => {
      const p = products[idx];
      const base = p[2] * qty; // price * qty
      const disc = discount;
      const gstAmt = ((base - disc) * p[3]) / 100; // gstPercent
      const sub = base - disc + gstAmt;
      subtotalBeforeGST += base;
      totalGST += gstAmt;
      grandTotal += sub;
      return {
        productId: productIds[idx],
        productName: p[0],
        productCategory: p[1],
        quantity: qty,
        unit: p[5],
        price: p[2],
        gstPercent: p[3],
        gstAmount: parseFloat(gstAmt.toFixed(2)),
        discount: disc,
        subtotal: parseFloat(sub.toFixed(2))
      };
    });

    invoiceCount++;
    const invoiceNumber = `JFE-${year}-${String(invoiceCount).padStart(4, '0')}`;

    const invResult = insertInvoice.run(
      invoiceNumber,
      customerIds[custIdx],
      customers[custIdx][0], // name
      customers[custIdx][1], // phone
      customers[custIdx][2], // email
      customers[custIdx][3], // address
      parseFloat(subtotalBeforeGST.toFixed(2)),
      0,
      parseFloat(totalGST.toFixed(2)),
      parseFloat(grandTotal.toFixed(2)),
      payMode,
      'Paid',
      parseFloat(grandTotal.toFixed(2)),
      date.toISOString(),
      userId
    );

    for (const item of processedItems) {
      insertItem.run(
        invResult.lastInsertRowid,
        item.productId,
        item.productName,
        item.productCategory,
        item.quantity,
        item.unit,
        item.price,
        item.gstPercent,
        item.gstAmount,
        item.discount,
        item.subtotal
      );
    }
  };

  // Run all inserts in a transaction for performance
  const seedTransaction = db.transaction(() => {
    createInvoice(0, 0, [{ idx: 0, qty: 1 }, { idx: 4, qty: 1 }], 'UPI');
    createInvoice(1, 1, [{ idx: 1, qty: 1 }], 'Cash');
    createInvoice(2, 2, [{ idx: 5, qty: 1 }, { idx: 7, qty: 2 }], 'Card');
    createInvoice(3, 3, [{ idx: 2, qty: 1 }, { idx: 8, qty: 2 }], 'Cash');
    createInvoice(5, 4, [{ idx: 6, qty: 1 }], 'UPI');
    createInvoice(7, 0, [{ idx: 3, qty: 1 }, { idx: 9, qty: 1 }], 'Net Banking');
  });

  seedTransaction();

  console.log('✅ Seed data inserted successfully!');
  console.log('📧 Login: admin@jaiswal.com | 🔑 Password: admin123');
}

module.exports = { seedDatabase };
