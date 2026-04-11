const { getDb } = require('../../database');

// @desc Get dashboard stats
const getDashboardStats = async (req, res) => {
  try {
    const db = getDb();
    const userId = req.user._id;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);

    // Counts
    const totalInvoices = db.prepare('SELECT COUNT(*) as count FROM invoices WHERE created_by = ?').get(userId).count;
    const totalCustomers = db.prepare('SELECT COUNT(*) as count FROM customers WHERE created_by = ?').get(userId).count;
    const totalProducts = db.prepare('SELECT COUNT(*) as count FROM products WHERE created_by = ?').get(userId).count;

    // Today's revenue
    const todayResult = db.prepare(
      'SELECT COALESCE(SUM(grand_total), 0) as revenue, COUNT(*) as count FROM invoices WHERE created_by = ? AND date >= ? AND date < ?'
    ).get(userId, today.toISOString(), tomorrow.toISOString());

    // Month's revenue
    const monthResult = db.prepare(
      'SELECT COALESCE(SUM(grand_total), 0) as revenue FROM invoices WHERE created_by = ? AND date >= ? AND date <= ?'
    ).get(userId, monthStart.toISOString(), monthEnd.toISOString());

    // Total revenue
    const totalResult = db.prepare(
      'SELECT COALESCE(SUM(grand_total), 0) as revenue FROM invoices WHERE created_by = ?'
    ).get(userId);

    // Recent 5 invoices
    const recentInvoices = db.prepare(
      'SELECT * FROM invoices WHERE created_by = ? ORDER BY created_at DESC LIMIT 5'
    ).all(userId).map(inv => ({
      _id: inv.id,
      invoiceNumber: inv.invoice_number,
      customerName: inv.customer_name,
      customerPhone: inv.customer_phone,
      grandTotal: inv.grand_total,
      paymentMode: inv.payment_mode,
      paymentStatus: inv.payment_status,
      date: inv.date,
      createdAt: inv.created_at
    }));

    // Last 7 days chart data
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(today);
      day.setDate(day.getDate() - i);
      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);

      const dayResult = db.prepare(
        'SELECT COALESCE(SUM(grand_total), 0) as revenue, COUNT(*) as count FROM invoices WHERE created_by = ? AND date >= ? AND date < ?'
      ).get(userId, day.toISOString(), nextDay.toISOString());

      last7Days.push({
        date: day.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        revenue: parseFloat(dayResult.revenue.toFixed(2)),
        count: dayResult.count
      });
    }

    res.json({
      success: true,
      data: {
        totalInvoices,
        totalCustomers,
        totalProducts,
        todayRevenue: parseFloat(todayResult.revenue.toFixed(2)),
        monthRevenue: parseFloat(monthResult.revenue.toFixed(2)),
        totalRevenue: parseFloat(totalResult.revenue.toFixed(2)),
        recentInvoices,
        chartData: last7Days
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getDashboardStats };
