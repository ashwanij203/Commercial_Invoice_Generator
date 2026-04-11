// SQLite schema — maps from the original Mongoose models
// All tables use INTEGER PRIMARY KEY (auto-increment) instead of MongoDB ObjectId

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'admin',
    shop_name TEXT DEFAULT 'Jaiswal Furniture & Electronics',
    shop_address TEXT DEFAULT 'Abu, Rajasthan, India',
    shop_phone TEXT DEFAULT '',
    shop_gstin TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT DEFAULT '' COLLATE NOCASE,
    address TEXT DEFAULT '',
    city TEXT DEFAULT '',
    gstin TEXT DEFAULT '',
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT DEFAULT 'Other',
    options TEXT DEFAULT '[]',
    price REAL NOT NULL CHECK(price >= 0),
    gst_percent INTEGER NOT NULL DEFAULT 18,
    stock INTEGER NOT NULL DEFAULT 0 CHECK(stock >= 0),
    unit TEXT DEFAULT 'pcs',
    description TEXT DEFAULT '',
    sku TEXT DEFAULT '',
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_number TEXT UNIQUE,
    customer_id INTEGER,
    customer_name TEXT NOT NULL,
    customer_phone TEXT DEFAULT '',
    customer_email TEXT DEFAULT '',
    customer_address TEXT DEFAULT '',
    customer_gstin TEXT DEFAULT '',
    subtotal_before_gst REAL DEFAULT 0,
    total_discount REAL DEFAULT 0,
    total_gst REAL DEFAULT 0,
    grand_total REAL NOT NULL,
    payment_mode TEXT DEFAULT 'Cash' CHECK(payment_mode IN ('Cash','UPI','Card','Net Banking','Credit')),
    payment_status TEXT DEFAULT 'Paid' CHECK(payment_status IN ('Paid','Pending','Partial')),
    amount_paid REAL DEFAULT 0,
    notes TEXT DEFAULT '',
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS invoice_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id INTEGER NOT NULL,
    product_id INTEGER,
    product_name TEXT NOT NULL,
    product_category TEXT DEFAULT '',
    quantity INTEGER NOT NULL CHECK(quantity >= 1),
    unit TEXT DEFAULT 'pcs',
    price REAL NOT NULL,
    gst_percent REAL DEFAULT 0,
    gst_amount REAL DEFAULT 0,
    discount REAL DEFAULT 0,
    subtotal REAL NOT NULL,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
  );

  -- Indexes for performance
  CREATE INDEX IF NOT EXISTS idx_customers_created_by ON customers(created_by);
  CREATE INDEX IF NOT EXISTS idx_products_created_by ON products(created_by);
  CREATE INDEX IF NOT EXISTS idx_invoices_created_by ON invoices(created_by);
  CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(date);
  CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
  CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);
`;

module.exports = SCHEMA;
