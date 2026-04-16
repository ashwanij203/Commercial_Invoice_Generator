// Vercel Serverless Function — wraps the Express app
// Load env vars relative to this file's location
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

module.exports = require('../backend/server');
