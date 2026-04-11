const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');
const Product = require('../models/Product');

// @desc Get dashboard stats
const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // This month range
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);

    const [
      totalInvoices,
      totalCustomers,
      totalProducts,
      todayInvoices,
      monthInvoices,
      recentInvoices,
      allInvoices
    ] = await Promise.all([
      Invoice.countDocuments({ createdBy: userId }),
      Customer.countDocuments({ createdBy: userId }),
      Product.countDocuments({ createdBy: userId }),
      Invoice.find({ createdBy: userId, date: { $gte: today, $lt: tomorrow } }),
      Invoice.find({ createdBy: userId, date: { $gte: monthStart, $lte: monthEnd } }),
      Invoice.find({ createdBy: userId }).sort({ createdAt: -1 }).limit(5),
      Invoice.find({ createdBy: userId })
    ]);

    const todayRevenue = todayInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
    const monthRevenue = monthInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
    const totalRevenue = allInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);

    // Last 7 days revenue chart data
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(today);
      day.setDate(day.getDate() - i);
      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);

      const dayInvoices = allInvoices.filter(inv => {
        const invDate = new Date(inv.date);
        return invDate >= day && invDate < nextDay;
      });
      const dayRevenue = dayInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);

      last7Days.push({
        date: day.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        revenue: parseFloat(dayRevenue.toFixed(2)),
        count: dayInvoices.length
      });
    }

    res.json({
      success: true,
      data: {
        totalInvoices,
        totalCustomers,
        totalProducts,
        todayRevenue: parseFloat(todayRevenue.toFixed(2)),
        monthRevenue: parseFloat(monthRevenue.toFixed(2)),
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        recentInvoices,
        chartData: last7Days
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getDashboardStats };
