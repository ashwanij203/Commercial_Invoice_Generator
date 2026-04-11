const { getDb } = require('../../database');

// @desc Get all customers
const getCustomers = async (req, res) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    const db = getDb();
    const offset = (page - 1) * limit;
    const params = [req.user._id];

    let whereClause = 'WHERE created_by = ?';
    if (search) {
      whereClause += ' AND (name LIKE ? OR phone LIKE ? OR email LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    const total = db.prepare(`SELECT COUNT(*) as count FROM customers ${whereClause}`).get(...params).count;

    const customers = db.prepare(`
      SELECT * FROM customers ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?
    `).all(...params, Number(limit), offset);

    // Map to frontend format
    const mapped = customers.map(c => ({
      _id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email,
      address: c.address,
      city: c.city,
      gstin: c.gstin,
      createdBy: c.created_by,
      createdAt: c.created_at,
      updatedAt: c.updated_at
    }));

    res.json({ success: true, data: mapped, total, page: Number(page) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get single customer
const getCustomer = async (req, res) => {
  try {
    const db = getDb();
    const customer = db.prepare('SELECT * FROM customers WHERE id = ? AND created_by = ?').get(req.params.id, req.user._id);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

    res.json({
      success: true,
      data: {
        _id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        city: customer.city,
        gstin: customer.gstin,
        createdBy: customer.created_by,
        createdAt: customer.created_at,
        updatedAt: customer.updated_at
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Create customer
const createCustomer = async (req, res) => {
  try {
    const { name, phone, email, address, city, gstin } = req.body;
    const db = getDb();

    const result = db.prepare(`
      INSERT INTO customers (name, phone, email, address, city, gstin, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(name, phone, email || '', address || '', city || '', gstin || '', req.user._id);

    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      success: true,
      message: 'Customer added successfully',
      data: {
        _id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        city: customer.city,
        gstin: customer.gstin,
        createdBy: customer.created_by,
        createdAt: customer.created_at,
        updatedAt: customer.updated_at
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Update customer
const updateCustomer = async (req, res) => {
  try {
    const { name, phone, email, address, city, gstin } = req.body;
    const db = getDb();

    const existing = db.prepare('SELECT * FROM customers WHERE id = ? AND created_by = ?').get(req.params.id, req.user._id);
    if (!existing) return res.status(404).json({ success: false, message: 'Customer not found' });

    db.prepare(`
      UPDATE customers SET name = ?, phone = ?, email = ?, address = ?, city = ?, gstin = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND created_by = ?
    `).run(
      name || existing.name,
      phone || existing.phone,
      email !== undefined ? email : existing.email,
      address !== undefined ? address : existing.address,
      city !== undefined ? city : existing.city,
      gstin !== undefined ? gstin : existing.gstin,
      req.params.id,
      req.user._id
    );

    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);

    res.json({
      success: true,
      message: 'Customer updated successfully',
      data: {
        _id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        city: customer.city,
        gstin: customer.gstin,
        createdBy: customer.created_by,
        createdAt: customer.created_at,
        updatedAt: customer.updated_at
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Delete customer
const deleteCustomer = async (req, res) => {
  try {
    const db = getDb();
    const result = db.prepare('DELETE FROM customers WHERE id = ? AND created_by = ?').run(req.params.id, req.user._id);
    if (result.changes === 0) return res.status(404).json({ success: false, message: 'Customer not found' });
    res.json({ success: true, message: 'Customer deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer };
