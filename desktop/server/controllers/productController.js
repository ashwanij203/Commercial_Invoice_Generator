const { getDb } = require('../../database');

// @desc Get all products
const getProducts = async (req, res) => {
  try {
    const { search, category, page = 1, limit = 50 } = req.query;
    const db = getDb();
    const offset = (page - 1) * limit;
    const params = [req.user._id];

    let whereClause = 'WHERE created_by = ?';
    if (search) {
      whereClause += ' AND (name LIKE ? OR sku LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern);
    }
    if (category) {
      whereClause += ' AND category = ?';
      params.push(category);
    }

    const total = db.prepare(`SELECT COUNT(*) as count FROM products ${whereClause}`).get(...params).count;

    const products = db.prepare(`
      SELECT * FROM products ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?
    `).all(...params, Number(limit), offset);

    const mapped = products.map(p => ({
      _id: p.id,
      name: p.name,
      category: p.category,
      options: JSON.parse(p.options || '[]'),
      price: p.price,
      gstPercent: p.gst_percent,
      stock: p.stock,
      unit: p.unit,
      description: p.description,
      sku: p.sku,
      createdBy: p.created_by,
      createdAt: p.created_at,
      updatedAt: p.updated_at
    }));

    res.json({ success: true, data: mapped, total });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get single product
const getProduct = async (req, res) => {
  try {
    const db = getDb();
    const product = db.prepare('SELECT * FROM products WHERE id = ? AND created_by = ?').get(req.params.id, req.user._id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    res.json({
      success: true,
      data: {
        _id: product.id,
        name: product.name,
        category: product.category,
        options: JSON.parse(product.options || '[]'),
        price: product.price,
        gstPercent: product.gst_percent,
        stock: product.stock,
        unit: product.unit,
        description: product.description,
        sku: product.sku,
        createdBy: product.created_by,
        createdAt: product.created_at,
        updatedAt: product.updated_at
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Create product
const createProduct = async (req, res) => {
  try {
    const { name, category, options, price, gstPercent, stock, unit, description, sku } = req.body;
    const db = getDb();

    const result = db.prepare(`
      INSERT INTO products (name, category, options, price, gst_percent, stock, unit, description, sku, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name,
      category || 'Other',
      JSON.stringify(options || []),
      price,
      gstPercent !== undefined ? gstPercent : 18,
      stock !== undefined ? stock : 0,
      unit || 'pcs',
      description || '',
      sku || '',
      req.user._id
    );

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      success: true,
      message: 'Product added successfully',
      data: {
        _id: product.id,
        name: product.name,
        category: product.category,
        options: JSON.parse(product.options || '[]'),
        price: product.price,
        gstPercent: product.gst_percent,
        stock: product.stock,
        unit: product.unit,
        description: product.description,
        sku: product.sku,
        createdBy: product.created_by,
        createdAt: product.created_at,
        updatedAt: product.updated_at
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Update product
const updateProduct = async (req, res) => {
  try {
    const { name, category, options, price, gstPercent, stock, unit, description, sku } = req.body;
    const db = getDb();

    const existing = db.prepare('SELECT * FROM products WHERE id = ? AND created_by = ?').get(req.params.id, req.user._id);
    if (!existing) return res.status(404).json({ success: false, message: 'Product not found' });

    db.prepare(`
      UPDATE products SET name = ?, category = ?, options = ?, price = ?, gst_percent = ?, stock = ?, unit = ?, description = ?, sku = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND created_by = ?
    `).run(
      name !== undefined ? name : existing.name,
      category !== undefined ? category : existing.category,
      options !== undefined ? JSON.stringify(options) : existing.options,
      price !== undefined ? price : existing.price,
      gstPercent !== undefined ? gstPercent : existing.gst_percent,
      stock !== undefined ? stock : existing.stock,
      unit !== undefined ? unit : existing.unit,
      description !== undefined ? description : existing.description,
      sku !== undefined ? sku : existing.sku,
      req.params.id,
      req.user._id
    );

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: {
        _id: product.id,
        name: product.name,
        category: product.category,
        options: JSON.parse(product.options || '[]'),
        price: product.price,
        gstPercent: product.gst_percent,
        stock: product.stock,
        unit: product.unit,
        description: product.description,
        sku: product.sku,
        createdBy: product.created_by,
        createdAt: product.created_at,
        updatedAt: product.updated_at
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Delete product
const deleteProduct = async (req, res) => {
  try {
    const db = getDb();
    const result = db.prepare('DELETE FROM products WHERE id = ? AND created_by = ?').run(req.params.id, req.user._id);
    if (result.changes === 0) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getProducts, getProduct, createProduct, updateProduct, deleteProduct };
