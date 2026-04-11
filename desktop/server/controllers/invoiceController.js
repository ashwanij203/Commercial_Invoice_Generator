const { getDb } = require('../../database');

// @desc Get all invoices (with search & filter)
const getInvoices = async (req, res) => {
  try {
    const { search, startDate, endDate, paymentStatus, page = 1, limit = 20 } = req.query;
    const db = getDb();
    const offset = (page - 1) * limit;
    const params = [req.user._id];

    let whereClause = 'WHERE created_by = ?';

    if (search) {
      whereClause += ' AND (invoice_number LIKE ? OR customer_name LIKE ? OR customer_phone LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    if (startDate) {
      whereClause += ' AND date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      whereClause += ' AND date <= ?';
      params.push(end.toISOString());
    }

    if (paymentStatus) {
      whereClause += ' AND payment_status = ?';
      params.push(paymentStatus);
    }

    const total = db.prepare(`SELECT COUNT(*) as count FROM invoices ${whereClause}`).get(...params).count;

    const invoices = db.prepare(`
      SELECT * FROM invoices ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?
    `).all(...params, Number(limit), offset);

    // For each invoice, get its items
    const getItems = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ?');

    const mapped = invoices.map(inv => {
      const items = getItems.all(inv.id).map(item => ({
        product: item.product_id,
        productName: item.product_name,
        productCategory: item.product_category,
        quantity: item.quantity,
        unit: item.unit,
        price: item.price,
        gstPercent: item.gst_percent,
        gstAmount: item.gst_amount,
        discount: item.discount,
        subtotal: item.subtotal
      }));

      return {
        _id: inv.id,
        invoiceNumber: inv.invoice_number,
        customer: inv.customer_id,
        customerName: inv.customer_name,
        customerPhone: inv.customer_phone,
        customerEmail: inv.customer_email,
        customerAddress: inv.customer_address,
        customerGSTIN: inv.customer_gstin,
        items,
        subtotalBeforeGST: inv.subtotal_before_gst,
        totalDiscount: inv.total_discount,
        totalGST: inv.total_gst,
        grandTotal: inv.grand_total,
        paymentMode: inv.payment_mode,
        paymentStatus: inv.payment_status,
        amountPaid: inv.amount_paid,
        notes: inv.notes,
        date: inv.date,
        createdBy: inv.created_by,
        createdAt: inv.created_at,
        updatedAt: inv.updated_at
      };
    });

    res.json({ success: true, data: mapped, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get single invoice
const getInvoice = async (req, res) => {
  try {
    const db = getDb();
    const inv = db.prepare('SELECT * FROM invoices WHERE id = ? AND created_by = ?').get(req.params.id, req.user._id);
    if (!inv) return res.status(404).json({ success: false, message: 'Invoice not found' });

    const items = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ?').all(inv.id).map(item => ({
      product: item.product_id,
      productName: item.product_name,
      productCategory: item.product_category,
      quantity: item.quantity,
      unit: item.unit,
      price: item.price,
      gstPercent: item.gst_percent,
      gstAmount: item.gst_amount,
      discount: item.discount,
      subtotal: item.subtotal
    }));

    res.json({
      success: true,
      data: {
        _id: inv.id,
        invoiceNumber: inv.invoice_number,
        customer: inv.customer_id,
        customerName: inv.customer_name,
        customerPhone: inv.customer_phone,
        customerEmail: inv.customer_email,
        customerAddress: inv.customer_address,
        customerGSTIN: inv.customer_gstin,
        items,
        subtotalBeforeGST: inv.subtotal_before_gst,
        totalDiscount: inv.total_discount,
        totalGST: inv.total_gst,
        grandTotal: inv.grand_total,
        paymentMode: inv.payment_mode,
        paymentStatus: inv.payment_status,
        amountPaid: inv.amount_paid,
        notes: inv.notes,
        date: inv.date,
        createdBy: inv.created_by,
        createdAt: inv.created_at,
        updatedAt: inv.updated_at
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Create invoice
const createInvoice = async (req, res) => {
  try {
    const {
      customer, customerName, customerPhone, customerEmail, customerAddress, customerGSTIN,
      items, paymentMode, paymentStatus, amountPaid, notes, date
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Invoice must have at least one item' });
    }

    const db = getDb();

    // Calculate totals
    let subtotalBeforeGST = 0;
    let totalDiscount = 0;
    let totalGST = 0;
    let grandTotal = 0;

    const processedItems = items.map(item => {
      const lineBase = item.price * item.quantity;
      const lineDiscount = item.discount || 0;
      const lineAfterDiscount = lineBase - lineDiscount;
      const lineGST = (lineAfterDiscount * item.gstPercent) / 100;
      const lineTotal = lineAfterDiscount + lineGST;

      subtotalBeforeGST += lineBase;
      totalDiscount += lineDiscount;
      totalGST += lineGST;
      grandTotal += lineTotal;

      return {
        ...item,
        gstAmount: parseFloat(lineGST.toFixed(2)),
        subtotal: parseFloat(lineTotal.toFixed(2))
      };
    });

    // Auto-generate invoice number
    const year = new Date().getFullYear();
    const countResult = db.prepare('SELECT COUNT(*) as count FROM invoices').get();
    const invoiceNumber = `JFE-${year}-${String(countResult.count + 1).padStart(4, '0')}`;

    // Use a transaction for atomicity
    const createTransaction = db.transaction(() => {
      const invResult = db.prepare(`
        INSERT INTO invoices (invoice_number, customer_id, customer_name, customer_phone, customer_email,
          customer_address, customer_gstin, subtotal_before_gst, total_discount, total_gst, grand_total,
          payment_mode, payment_status, amount_paid, notes, date, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        invoiceNumber,
        customer || null,
        customerName,
        customerPhone || '',
        customerEmail || '',
        customerAddress || '',
        customerGSTIN || '',
        parseFloat(subtotalBeforeGST.toFixed(2)),
        parseFloat(totalDiscount.toFixed(2)),
        parseFloat(totalGST.toFixed(2)),
        parseFloat(grandTotal.toFixed(2)),
        paymentMode || 'Cash',
        paymentStatus || 'Paid',
        amountPaid !== undefined ? amountPaid : parseFloat(grandTotal.toFixed(2)),
        notes || '',
        date || new Date().toISOString(),
        req.user._id
      );

      const invoiceId = invResult.lastInsertRowid;

      // Insert items
      const insertItem = db.prepare(`
        INSERT INTO invoice_items (invoice_id, product_id, product_name, product_category,
          quantity, unit, price, gst_percent, gst_amount, discount, subtotal)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const item of processedItems) {
        insertItem.run(
          invoiceId,
          item.product || null,
          item.productName,
          item.productCategory || '',
          item.quantity,
          item.unit || 'pcs',
          item.price,
          item.gstPercent || 0,
          item.gstAmount,
          item.discount || 0,
          item.subtotal
        );

        // Reduce stock
        if (item.product) {
          db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(item.quantity, item.product);
        }
      }

      return invoiceId;
    });

    const invoiceId = createTransaction();

    // Fetch the created invoice
    const inv = db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoiceId);
    const invItems = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ?').all(invoiceId).map(item => ({
      product: item.product_id,
      productName: item.product_name,
      productCategory: item.product_category,
      quantity: item.quantity,
      unit: item.unit,
      price: item.price,
      gstPercent: item.gst_percent,
      gstAmount: item.gst_amount,
      discount: item.discount,
      subtotal: item.subtotal
    }));

    res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      data: {
        _id: inv.id,
        invoiceNumber: inv.invoice_number,
        customer: inv.customer_id,
        customerName: inv.customer_name,
        customerPhone: inv.customer_phone,
        customerEmail: inv.customer_email,
        customerAddress: inv.customer_address,
        customerGSTIN: inv.customer_gstin,
        items: invItems,
        subtotalBeforeGST: inv.subtotal_before_gst,
        totalDiscount: inv.total_discount,
        totalGST: inv.total_gst,
        grandTotal: inv.grand_total,
        paymentMode: inv.payment_mode,
        paymentStatus: inv.payment_status,
        amountPaid: inv.amount_paid,
        notes: inv.notes,
        date: inv.date,
        createdBy: inv.created_by,
        createdAt: inv.created_at,
        updatedAt: inv.updated_at
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Delete invoice
const deleteInvoice = async (req, res) => {
  try {
    const db = getDb();
    // Items are deleted automatically via ON DELETE CASCADE
    const result = db.prepare('DELETE FROM invoices WHERE id = ? AND created_by = ?').run(req.params.id, req.user._id);
    if (result.changes === 0) return res.status(404).json({ success: false, message: 'Invoice not found' });
    res.json({ success: true, message: 'Invoice deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Export invoices as CSV
const exportCSV = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const db = getDb();
    const params = [req.user._id];

    let whereClause = 'WHERE created_by = ?';
    if (startDate) {
      whereClause += ' AND date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      whereClause += ' AND date <= ?';
      params.push(endDate);
    }

    const invoices = db.prepare(`SELECT * FROM invoices ${whereClause} ORDER BY date DESC`).all(...params);

    const header = 'Invoice No,Date,Customer,Phone,Payment Mode,Status,Subtotal,GST,Discount,Total\n';
    const rows = invoices.map(inv => {
      return [
        inv.invoice_number,
        new Date(inv.date).toLocaleDateString('en-IN'),
        inv.customer_name,
        inv.customer_phone,
        inv.payment_mode,
        inv.payment_status,
        inv.subtotal_before_gst,
        inv.total_gst,
        inv.total_discount,
        inv.grand_total
      ].join(',');
    }).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=invoices.csv');
    res.send(header + rows);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getInvoices, getInvoice, createInvoice, deleteInvoice, exportCSV };
