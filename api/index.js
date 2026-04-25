// Vercel Serverless Function — wraps the Express app
// Vercel injects environment variables directly, no .env file needed
module.exports = require('../backend/server');
