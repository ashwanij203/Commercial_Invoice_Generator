const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  /\.vercel\.app$/,    // Allow all Vercel domains
  /\.onrender\.com$/,  // Allow all Render domains
];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (Postman, server-to-server)
    if (!origin) return callback(null, true);
    const allowed = allowedOrigins.some(o =>
      o instanceof RegExp ? o.test(origin) : o === origin
    );
    callback(null, allowed);
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/products', require('./routes/products'));
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/dashboard', require('./routes/dashboard'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Jaiswal Billing API running' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Connect to MongoDB
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    
    // Listen to port only if run directly (e.g. `node server.js`), not if imported as module (e.g. Serverless)
    if (require.main === module || process.env.LISTEN_PORT === 'true') {
      app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
      });
    }
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
  });

// Export the app for Vercel
module.exports = app;
