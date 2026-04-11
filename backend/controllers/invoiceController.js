const Invoice = require('../models/Invoice');
const Product = require('../models/Product');

// @desc Get all invoices (with search & filter)
const getInvoices = async (req, res) => {
  try {
    const { search, startDate, endDate, paymentStatus, page = 1, limit = 20 } = req.query;
    const query = { createdBy: req.user._id };

    // Search by invoice number or customer name
    if (search) {
      query.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { customerPhone: { $regex: search, $options: 'i' } }
      ];
    }

    // Date range filter
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    if (paymentStatus) query.paymentStatus = paymentStatus;

    const total = await Invoice.countDocuments(query);
    const invoices = await Invoice.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, data: invoices, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get single invoice
const getInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    res.json({ success: true, data: invoice });
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

    const invoice = await Invoice.create({
      customer: customer || undefined,
      customerName, customerPhone, customerEmail, customerAddress, customerGSTIN,
      items: processedItems,
      subtotalBeforeGST: parseFloat(subtotalBeforeGST.toFixed(2)),
      totalDiscount: parseFloat(totalDiscount.toFixed(2)),
      totalGST: parseFloat(totalGST.toFixed(2)),
      grandTotal: parseFloat(grandTotal.toFixed(2)),
      paymentMode: paymentMode || 'Cash',
      paymentStatus: paymentStatus || 'Paid',
      amountPaid: amountPaid || grandTotal,
      notes: notes || '',
      date: date || new Date(),
      createdBy: req.user._id
    });

    // Reduce stock for each product
    for (const item of items) {
      if (item.product) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: -item.quantity }
        });
      }
    }

    res.status(201).json({ success: true, message: 'Invoice created successfully', data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Delete invoice
const deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    res.json({ success: true, message: 'Invoice deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Export invoices as CSV
const exportCSV = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = { createdBy: req.user._id };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const invoices = await Invoice.find(query).sort({ date: -1 });

    const header = 'Invoice No,Date,Customer,Phone,Payment Mode,Status,Subtotal,GST,Discount,Total\n';
    const rows = invoices.map(inv => {
      return [
        inv.invoiceNumber,
        new Date(inv.date).toLocaleDateString('en-IN'),
        inv.customerName,
        inv.customerPhone,
        inv.paymentMode,
        inv.paymentStatus,
        inv.subtotalBeforeGST,
        inv.totalGST,
        inv.totalDiscount,
        inv.grandTotal
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
