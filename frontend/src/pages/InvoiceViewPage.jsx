import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Download } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDateTime } from '../utils/format';
import toast from 'react-hot-toast';
import { useLanguage } from '../context/LanguageContext';

const statusColor = { Paid: '#16a34a', Pending: '#d97706', Partial: '#2563eb' };

export default function InvoiceViewPage() {
  const { t } = useLanguage();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/invoices/${id}`)
      .then(r => setInvoice(r.data.data))
      .catch(() => { toast.error('Invoice not found'); navigate('/invoices'); })
      .finally(() => setLoading(false));
  }, [id]);

  const handlePrint = () => window.print();

  const handleDownloadPDF = () => {
    toast('Use browser "Save as PDF" option in the print dialog', { icon: 'ℹ️' });
    setTimeout(handlePrint, 300);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!invoice) return null;

  // Pre-compute GST breakdown
  const gstBreakdown = invoice.totalGST > 0
    ? Object.entries(invoice.items.reduce((acc, item) => {
        const k = `${item.gstPercent}%`;
        const base = item.price * item.quantity - (item.discount || 0);
        if (!acc[k]) acc[k] = { taxable: 0, gst: 0 };
        acc[k].taxable += base;
        acc[k].gst += item.gstAmount;
        return acc;
      }, {}))
    : [];

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Action bar - hidden on print */}
      <div className="flex items-center justify-between no-print">
        <button onClick={() => navigate(-1)} className="btn-secondary text-sm">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="flex gap-2">
          <button onClick={handleDownloadPDF} className="btn-secondary text-sm">
            <Download size={16} /> Download PDF
          </button>
          <button onClick={handlePrint} className="btn-primary text-sm">
            <Printer size={16} /> Print Invoice
          </button>
        </div>
      </div>

      {/* ═══════════════ INVOICE PRINT AREA ═══════════════ */}
      <div id="invoice-print" className="card p-6 bg-white dark:bg-white text-gray-900">

        {/* ── Header Row ── */}
        <div className="invoice-header flex justify-between items-start border-b-2 border-gray-800 pb-3 mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-xs">JF</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 uppercase tracking-wide leading-tight">{user?.shopName || 'Jaiswal Furniture & Electronics'}</h1>
                <p className="text-xs text-gray-600">{user?.shopAddress}</p>
              </div>
            </div>
            {user?.shopPhone && <p className="text-xs text-gray-600">📞 {user.shopPhone}</p>}
            {user?.shopGSTIN && <p className="text-xs text-gray-600">GSTIN: <span className="font-mono font-medium">{user.shopGSTIN}</span></p>}
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest">Tax Invoice</p>
            <p className="text-lg font-bold text-gray-900 font-mono">{invoice.invoiceNumber}</p>
            <div className="text-xs text-gray-600 mt-1 space-y-0.5">
              <p><span className="font-semibold">Date:</span> {formatDateTime(invoice.date)}</p>
              <p><span className="font-semibold">{t('timeOfBilling')}:</span> {new Date(invoice.createdAt || invoice.date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</p>
              <p className="no-print">
                <span className="font-medium">Status: </span>
                <span className="font-semibold" style={{ color: statusColor[invoice.paymentStatus] }}>
                  {invoice.paymentStatus}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* ── Billed To + Payment Details ── */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="border border-gray-300 rounded p-2">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 border-b border-gray-300 pb-0.5">Billed To</p>
            <p className="font-bold text-gray-900 text-sm">{invoice.customerName}</p>
            {invoice.customerPhone && <p className="text-xs text-gray-700">📞 {invoice.customerPhone}</p>}
            {invoice.customerEmail && <p className="text-xs text-gray-700">✉️ {invoice.customerEmail}</p>}
            {invoice.customerAddress && <p className="text-xs text-gray-700">📍 {invoice.customerAddress}</p>}
            {invoice.customerGSTIN && <p className="text-xs text-gray-700 font-mono font-semibold">GSTIN: {invoice.customerGSTIN}</p>}
          </div>
          <div className="border border-gray-300 rounded p-2">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 border-b border-gray-300 pb-0.5">Payment Details</p>
            <div className="space-y-1 text-xs text-gray-800 mt-1">
              <div className="flex justify-between"><span className="font-semibold">Payment Mode:</span><span>{invoice.paymentMode}</span></div>
              <div className="flex justify-between"><span className="font-semibold">Amount Paid:</span><span className="font-medium">{formatCurrency(invoice.amountPaid)}</span></div>
              {invoice.grandTotal - invoice.amountPaid > 0 && (
                <div className="flex justify-between"><span className="font-semibold">Balance Due:</span><span className="font-bold text-red-600">{formatCurrency(invoice.grandTotal - invoice.amountPaid)}</span></div>
              )}
            </div>
          </div>
        </div>

        {/* ── Items Table ── */}
        <div className="border border-gray-400 mb-3 overflow-hidden rounded">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-400 text-gray-800">
                <th className="px-2 py-1.5 font-bold border-r border-gray-300 w-8 text-center">#</th>
                <th className="px-2 py-1.5 font-bold border-r border-gray-300">{t('products')} / Description</th>
                <th className="px-2 py-1.5 font-bold border-r border-gray-300 text-right w-16">{t('qty')}</th>
                <th className="px-2 py-1.5 font-bold border-r border-gray-300 text-right w-20">{t('rate')} (₹)</th>
                <th className="px-2 py-1.5 font-bold border-r border-gray-300 text-right w-16">{t('discount')}</th>
                <th className="px-2 py-1.5 font-bold border-r border-gray-300 text-right w-20">GST</th>
                <th className="px-2 py-1.5 font-bold text-right w-24">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, idx) => (
                <tr key={idx} className="border-b border-gray-200 last:border-b-0">
                  <td className="px-2 py-1.5 border-r border-gray-200 text-gray-600 text-center">{idx + 1}</td>
                  <td className="px-2 py-1.5 border-r border-gray-200">
                    <span className="font-semibold text-gray-900">{item.productName}</span>
                    {item.productCategory && <span className="text-[10px] text-gray-500 ml-1">({item.productCategory})</span>}
                  </td>
                  <td className="px-2 py-1.5 border-r border-gray-200 text-right text-gray-800 font-medium">{item.quantity} {item.unit}</td>
                  <td className="px-2 py-1.5 border-r border-gray-200 text-right text-gray-800">{formatCurrency(item.price)}</td>
                  <td className="px-2 py-1.5 border-r border-gray-200 text-right text-gray-800">{item.discount > 0 ? formatCurrency(item.discount) : '—'}</td>
                  <td className="px-2 py-1.5 border-r border-gray-200 text-right text-gray-800">{item.gstPercent}% <span className="text-[10px] text-gray-500">({formatCurrency(item.gstAmount)})</span></td>
                  <td className="px-2 py-1.5 text-right font-bold text-gray-900">{formatCurrency(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── GST Breakdown + Totals (side by side) ── */}
        <div className="flex gap-3 mb-3">
          {/* Left: GST Details */}
          <div className="flex-1">
            {gstBreakdown.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">GST Details</p>
                <div className="border border-gray-300 rounded overflow-hidden">
                  <table className="w-full text-[11px] text-left border-collapse">
                    <thead className="bg-gray-100 border-b border-gray-300">
                      <tr>
                        <th className="px-2 py-1 font-bold text-gray-700 border-r border-gray-300">Rate</th>
                        <th className="px-2 py-1 font-bold text-gray-700 border-r border-gray-300 text-right">Taxable</th>
                        <th className="px-2 py-1 font-bold text-gray-700 border-r border-gray-300 text-right">CGST</th>
                        <th className="px-2 py-1 font-bold text-gray-700 border-r border-gray-300 text-right">SGST</th>
                        <th className="px-2 py-1 font-bold text-gray-700 text-right">Total GST</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gstBreakdown.map(([rate, v]) => (
                        <tr key={rate} className="border-b border-gray-200 last:border-0">
                          <td className="px-2 py-1 font-semibold border-r border-gray-200">{rate}</td>
                          <td className="px-2 py-1 text-right border-r border-gray-200">{formatCurrency(v.taxable)}</td>
                          <td className="px-2 py-1 text-right border-r border-gray-200">{formatCurrency(v.gst / 2)}</td>
                          <td className="px-2 py-1 text-right border-r border-gray-200">{formatCurrency(v.gst / 2)}</td>
                          <td className="px-2 py-1 text-right font-bold">{formatCurrency(v.gst)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {invoice.notes && (
              <div className="mt-2">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-0.5">Notes</p>
                <p className="text-xs text-gray-700 border border-gray-200 rounded p-1.5">{invoice.notes}</p>
              </div>
            )}
          </div>

          {/* Right: Totals */}
          <div className="w-64">
            <div className="border border-gray-400 rounded overflow-hidden">
              <table className="w-full text-xs">
                <tbody>
                  <tr className="border-b border-gray-200 text-gray-800">
                    <td className="px-3 py-1.5 font-semibold">Subtotal</td>
                    <td className="px-3 py-1.5 text-right font-medium">{formatCurrency(invoice.subtotalBeforeGST)}</td>
                  </tr>
                  {invoice.totalDiscount > 0 && (
                    <tr className="border-b border-gray-200 text-gray-800">
                      <td className="px-3 py-1.5 font-semibold">Discount</td>
                      <td className="px-3 py-1.5 text-right font-medium">-{formatCurrency(invoice.totalDiscount)}</td>
                    </tr>
                  )}
                  <tr className="border-b border-gray-200 text-gray-800">
                    <td className="px-3 py-1.5 font-semibold">Total GST</td>
                    <td className="px-3 py-1.5 text-right font-medium">{formatCurrency(invoice.totalGST)}</td>
                  </tr>
                  <tr className="bg-gray-800 text-white">
                    <td className="px-3 py-2 font-bold text-sm uppercase">Grand Total</td>
                    <td className="px-3 py-2 text-right font-bold text-sm">{formatCurrency(invoice.grandTotal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── Terms & Signature ── */}
        <div className="border-t-2 border-gray-800 pt-3 flex justify-between items-end">
          <div className="flex-1 pr-8">
            <p className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-1">Terms & Conditions</p>
            <ol className="list-decimal list-inside text-[10px] text-gray-700 space-y-0.5">
              <li className="font-semibold">{t('terms')}</li>
              <li>Interest will be charged @ 24% p.a. if payment is delayed beyond 15 days.</li>
              <li>Subject to local jurisdiction.</li>
            </ol>
            <div className="mt-2">
              <p className="text-[10px] font-bold text-gray-900">Thank you for your business!</p>
              <p className="text-[10px] text-gray-600">For queries contact: {user?.shopPhone || 'the shop administration'}</p>
            </div>
          </div>
          <div className="w-40 text-center pt-10 border-t border-gray-400">
            <p className="text-xs font-bold text-gray-900">Authorized Signatory</p>
            <p className="text-[10px] text-gray-500">For {user?.shopName}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
