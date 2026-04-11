const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { getDb } = require('../../database');
const { JWT_SECRET, MASTER_RECOVERY_KEY } = require('../middleware/auth');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register user
// @route   POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password, shopName, shopAddress, shopPhone, shopGSTIN } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const db = getDb();

    // Check if user already exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Hash password with bcrypt (12 rounds)
    const hashedPassword = await bcrypt.hash(password, 12);

    const result = db.prepare(`
      INSERT INTO users (name, email, password, shop_name, shop_address, shop_phone, shop_gstin)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      name,
      email.toLowerCase(),
      hashedPassword,
      shopName || 'Jaiswal Furniture & Electronics',
      shopAddress || 'Abu, Rajasthan, India',
      shopPhone || '',
      shopGSTIN || ''
    );

    const token = generateToken(result.lastInsertRowid);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        id: result.lastInsertRowid,
        _id: result.lastInsertRowid,
        name,
        email: email.toLowerCase(),
        role: 'admin',
        shopName: shopName || 'Jaiswal Furniture & Electronics',
        shopAddress: shopAddress || 'Abu, Rajasthan, India',
        shopPhone: shopPhone || '',
        shopGSTIN: shopGSTIN || ''
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const db = getDb();

    // Find user by email (include password for comparison)
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Compare password with bcrypt
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateToken(user.id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        shopName: user.shop_name,
        shopAddress: user.shop_address,
        shopPhone: user.shop_phone,
        shopGSTIN: user.shop_gstin
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
const getMe = async (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      shopName: req.user.shopName,
      shopAddress: req.user.shopAddress,
      shopPhone: req.user.shopPhone,
      shopGSTIN: req.user.shopGSTIN
    }
  });
};

// @desc    Update profile
// @route   PUT /api/auth/profile
const updateProfile = async (req, res) => {
  try {
    const { name, shopName, shopAddress, shopPhone, shopGSTIN } = req.body;
    const db = getDb();

    db.prepare(`
      UPDATE users SET name = ?, shop_name = ?, shop_address = ?, shop_phone = ?, shop_gstin = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name, shopName, shopAddress, shopPhone, shopGSTIN, req.user._id);

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user._id);

    res.json({
      success: true,
      message: 'Profile updated',
      user: {
        id: user.id,
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        shopName: user.shop_name,
        shopAddress: user.shop_address,
        shopPhone: user.shop_phone,
        shopGSTIN: user.shop_gstin
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reset password using Master Recovery Key
// @route   POST /api/auth/reset-password
const resetPassword = async (req, res) => {
  try {
    const { email, masterKey, newPassword } = req.body;

    if (!email || !masterKey || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, recovery key, and new password are required' });
    }

    // Verify master recovery key
    if (masterKey !== MASTER_RECOVERY_KEY) {
      return res.status(403).json({ success: false, message: 'Invalid recovery key' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    const db = getDb();

    // Find user by email
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with this email' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    db.prepare('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(hashedPassword, user.id);

    // Auto-login: generate token for the user
    const token = generateToken(user.id);

    res.json({
      success: true,
      message: 'Password reset successful! You are now logged in.',
      token,
      user: {
        id: user.id,
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        shopName: user.shop_name,
        shopAddress: user.shop_address,
        shopPhone: user.shop_phone,
        shopGSTIN: user.shop_gstin
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { register, login, getMe, updateProfile, resetPassword };
