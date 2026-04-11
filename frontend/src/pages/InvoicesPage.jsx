import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Plus, Search, Download, Eye, Trash2, Filter } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { formatCurrency, formatDate } from '../utils/format';

const statusBadge = (s) => {
  const map = { Paid: 'badge-paid', Pending: 'badge-pending', Partial: 'badge-partial' };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[s] || ''}`}>{s}</span>;
};

const paymentBadge = (m) => {
  const map = {
    Cash: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
    UPI: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400',
    Card: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
    'Net Banking': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400',
    Credit: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400',
  };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[m] || ''}`}>{m}</span>;
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/invoices', { params: { search, startDate, endDate, paymentStatus, page, limit: 15 } });
      setInvoices(data.data);
      setTotal(data.total);
      setPages(data.pages);
    } catch { toast.error('Failed to load invoices'); }
    finally { setLoading(false); }
  }, [search, startDate, endDate, paymentStatus, page]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);
  useEffect(() => { setPage(1); }, [search, startDate, endDate, paymentStatus]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/invoices/${deleteId}`);
      toast.success('Invoice deleted');
      setDeleteId(null);
      fetchInvoices();
    } catch { toast.error('Failed to delete'); }
    finally { setDeleting(false); }
  };

  const handleExportCSV = async () => {
    try {
      const res = await api.get('/invoices/export/csv', {
        params: { startDate, endDate },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'invoices.csv';
      a.click();
      toast.success('CSV exported!');
    } catch { toast.error('Export failed'); }
  };

  const clearFilters = () => { setSearch(''); setStartDate(''); setEndDate(''); setPaymentStatus(''); };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Invoices</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{total} total invoices</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportCSV} className="btn-secondary text-sm">
            <Download size={16} /> Export CSV
          </button>
          <Link to="/invoices/new" className="btn-primary text-sm">
            <Plus size={16} /> New Invoice
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={14} className="text-gray-400" />
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Filters</span>
          <button onClick={clearFilters} className="text-xs text-brand-500 hover:underline ml-auto">Clear all</button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="col-span-2 md:col-span-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-8 text-sm" placeholder="Search invoice/customer..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <input type="date" className="input text-sm" value={startDate} onChange={e => setStartDate(e.target.value)} title="From date" />
          <input type="date" className="input text-sm" value={endDate} onChange={e => setEndDate(e.target.value)} title="To date" />
          <select className="input text-sm" value={paymentStatus} onChange={e => setPaymentStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option>Paid</option>
            <option>Pending</option>
            <option>Partial</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-400 bg-gray-50 dark:bg-gray-700/50">
                <th className="px-5 py-3 font-medium">Invoice #</th>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium hidden sm:table-cell">Date</th>
                <th className="px-5 py-3 font-medium hidden md:table-cell">Payment</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7} className="text-center py-12">
                  <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
                </td></tr>
              )}
              {!loading && invoices.length === 0 && (
                <tr><td colSpan={7} className="text-center py-12">
                  <FileText size={32} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                  <p className="text-gray-400 text-sm">No invoices found</p>
                  <Link to="/invoices/new" className="mt-3 text-brand-500 text-sm hover:underline inline-block">Create your first invoice</Link>
                </td></tr>
              )}
              {invoices.map(inv => (
                <tr key={inv._id} className="border-t border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <td className="px-5 py-3">
                    <Link to={`/invoices/${inv._id}`} className="text-sm font-mono font-semibold text-brand-500 hover:text-brand-600">{inv.invoiceNumber}</Link>
                  </td>
                  <td className="px-5 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{inv.customerName}</p>
                      <p className="text-xs text-gray-400">{inv.customerPhone}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3 hidden sm:table-cell">
                    <span className="text-sm text-gray-500">{formatDate(inv.date)}</span>
                  </td>
                  <td className="px-5 py-3 hidden md:table-cell">{paymentBadge(inv.paymentMode)}</td>
                  <td className="px-5 py-3">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(inv.grandTotal)}</span>
                  </td>
                  <td className="px-5 py-3">{statusBadge(inv.paymentStatus)}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <Link to={`/invoices/${inv._id}`} className="p-1.5 rounded-lg text-gray-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors">
                        <Eye size={14} />
                      </Link>
                      <button onClick={() => setDeleteId(inv._id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-50 dark:border-gray-700">
            <p className="text-sm text-gray-500">Page {page} of {pages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-40">Prev</button>
              <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages} className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Invoice"
        message="This will permanently delete this invoice. Stock quantities will NOT be restored automatically."
      />
    </div>
  );
}
