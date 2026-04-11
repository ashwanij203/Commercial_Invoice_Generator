const jwt = require('jsonwebtoken');
const { getDb } = require('../../database');

const JWT_SECRET = 'jaiswal_billing_desktop_secret_key_2024_secure';

// Master Recovery Key — use this to reset any user's password if forgotten
// KEEP THIS SECRET. Only the app owner/administrator should know this key.
const MASTER_RECOVERY_KEY = 'JFE-MASTER-2024-XKCD-9372';

const protect = async (req, res, next) => {
  try {
    let token;

    // Get token from Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Get user from SQLite
    const db = getDb();
    const user = db.prepare('SELECT id, name, email, role, shop_name, shop_address, shop_phone, shop_gstin FROM users WHERE id = ?').get(decoded.id);

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    // Map SQLite column names to the format controllers expect
    req.user = {
      _id: user.id,
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      shopName: user.shop_name,
      shopAddress: user.shop_address,
      shopPhone: user.shop_phone,
      shopGSTIN: user.shop_gstin
    };

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized, invalid token' });
  }
};

module.exports = { protect, JWT_SECRET, MASTER_RECOVERY_KEY };
