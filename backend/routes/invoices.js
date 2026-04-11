const express = require('express');
const router = express.Router();
const { getInvoices, getInvoice, createInvoice, deleteInvoice, exportCSV } = require('../controllers/invoiceController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/export/csv', exportCSV);
router.route('/').get(getInvoices).post(createInvoice);
router.route('/:id').get(getInvoice).delete(deleteInvoice);

module.exports = router;
