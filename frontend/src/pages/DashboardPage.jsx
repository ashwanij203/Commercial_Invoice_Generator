import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, FileText, Users, Package, PlusCircle, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../utils/api';
import { formatCurrency, formatDate } from '../utils/format';

const StatCard = ({ icon: Icon, label, value, sub, color }) => (
  <div className="card p-5">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
      <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center`}>
        <Icon size={20} className="text-white" />
      </div>
    </div>
  </div>
);

const statusBadge = (s) => {
  const map = { Paid: 'badge-paid', Pending: 'badge-pending', Partial: 'badge-partial' };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[s] || ''}`}>{s}</span>;
};

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/stats').then(r => setStats(r.data.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Overview of your billing activity</p>
        </div>
        <Link to="/invoices/new" className="btn-primary text-sm">
          <PlusCircle size={16} /> New Invoice
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={TrendingUp} label="Today's Revenue" value={formatCurrency(stats?.todayRevenue)} sub="Today" color="bg-brand-500" />
        <StatCard icon={TrendingUp} label="Month Revenue" value={formatCurrency(stats?.monthRevenue)} sub="This month" color="bg-purple-500" />
        <StatCard icon={FileText}   label="Total Invoices"  value={stats?.totalInvoices}  sub="All time" color="bg-blue-500" />
        <StatCard icon={Users}      label="Customers"       value={stats?.totalCustomers}  sub="Registered" color="bg-green-500" />
      </div>

      {/* Chart + recent invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar chart */}
        <div className="card p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">Revenue — Last 7 Days</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats?.chartData || []} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-100 dark:stroke-gray-700" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} className="text-gray-400" />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#1f2937', border: 'none', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#9ca3af' }}
                formatter={v => [formatCurrency(v), 'Revenue']}
              />
              <Bar dataKey="revenue" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Quick stats */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">Quick Stats</h2>
          <div className="space-y-3">
            {[
              { label: 'Total Revenue', value: formatCurrency(stats?.totalRevenue), icon: TrendingUp },
              { label: 'Products Listed', value: stats?.totalProducts, icon: Package },
              { label: 'Total Customers', value: stats?.totalCustomers, icon: Users },
              { label: 'Total Invoices', value: stats?.totalInvoices, icon: FileText },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-700 last:border-0">
                <div className="flex items-center gap-2">
                  <Icon size={14} className="text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Recent Invoices</h2>
          <Link to="/invoices" className="text-xs text-brand-500 hover:text-brand-600 flex items-center gap-1">
            View all <ArrowRight size={12} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-400 bg-gray-50 dark:bg-gray-700/50">
                <th className="px-5 py-3 font-medium">Invoice #</th>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recentInvoices?.length === 0 && (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400 text-sm">No invoices yet</td></tr>
              )}
              {stats?.recentInvoices?.map(inv => (
                <tr key={inv._id} className="border-t border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <td className="px-5 py-3">
                    <Link to={`/invoices/${inv._id}`} className="text-sm font-medium text-brand-500 hover:text-brand-600">{inv.invoiceNumber}</Link>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-700 dark:text-gray-300">{inv.customerName}</td>
                  <td className="px-5 py-3 text-sm text-gray-500">{formatDate(inv.date)}</td>
                  <td className="px-5 py-3 text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(inv.grandTotal)}</td>
                  <td className="px-5 py-3">{statusBadge(inv.paymentStatus)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
