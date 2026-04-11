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
    // Use browser print-to-PDF functionality
    toast('Use browser "Save as PDF" option in the print dialog', { icon: 'ℹ️' });
    setTimeout(handlePrint, 300);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!invoice) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Action bar - hidden on print */}
      <div className="flex items-center justify-between print:hidden">
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

      {/* Invoice Print Area */}
      <div id="invoice-print" className="card p-8 print:shadow-none print:border-none print:p-0 bg-white dark:bg-white text-gray-900">

        {/* Header */}
        <div className="flex justify-between items-start mb-8 print:mb-4 border-b-2 border-gray-800 pb-6 print:pb-4 print:border-black">
          <div>
            <div className="flex items-center gap-3 mb-2 print:mb-1">
              <div className="w-10 h-10 bg-orange-500 rounded-xl print:rounded-none flex items-center justify-center print:bg-black">
                <span className="text-white font-bold text-sm">JF</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 print:text-black uppercase tracking-wide">{user?.shopName || 'Jaiswal Furniture & Electronics'}</h1>
                <p className="text-sm text-gray-600 print:text-black">{user?.shopAddress}</p>
              </div>
            </div>
            {user?.shopPhone && <p className="text-sm text-gray-600 print:text-black mt-1">📞 {user.shopPhone}</p>}
            {user?.shopGSTIN && <p className="text-sm text-gray-600 print:text-black">GSTIN: <span className="font-mono font-medium">{user.shopGSTIN}</span></p>}
          </div>
          <div className="text-right">
            <div className="mb-2 print:mb-1">
              <p className="text-sm text-gray-500 print:text-black font-semibold uppercase tracking-widest">Tax Invoice</p>
              <p className="text-2xl print:text-xl font-bold text-gray-900 print:text-black font-mono">{invoice.invoiceNumber}</p>
            </div>
            <div className="text-sm print:text-xs text-gray-600 print:text-black space-y-0.5 mt-2 print:mt-1">
              <p><span className="font-semibold">Date:</span> {formatDateTime(invoice.date)}</p>
              <p><span className="font-semibold">{t('timeOfBilling')}:</span> {new Date(invoice.createdAt || invoice.date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</p>
              <p className="print:hidden">
                <span className="font-medium">Status: </span>
                <span className="font-semibold" style={{ color: statusColor[invoice.paymentStatus] }}>
                  {invoice.paymentStatus}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Bill To */}
        <div className="grid grid-cols-2 gap-8 print:gap-4 mb-8 print:mb-4">
          <div className="border border-gray-200 print:border-black rounded-lg print:rounded-none p-4 print:p-2">
            <p className="text-xs print:text-[10px] font-bold text-gray-500 print:text-black uppercase tracking-wider mb-2 print:mb-1 border-b print:border-black pb-1">Billed To</p>
            <p className="font-bold text-gray-900 print:text-black text-lg print:text-sm">{invoice.customerName}</p>
            {invoice.customerPhone && <p className="text-sm print:text-xs text-gray-700 print:text-black mt-1">📞 {invoice.customerPhone}</p>}
            {invoice.customerEmail && <p className="text-sm print:text-xs text-gray-700 print:text-black">✉️ {invoice.customerEmail}</p>}
            {invoice.customerAddress && <p className="text-sm print:text-xs text-gray-700 print:text-black mt-1">📍 {invoice.customerAddress}</p>}
            {invoice.customerGSTIN && <p className="text-sm print:text-xs text-gray-700 print:text-black mt-1 font-mono font-semibold">GSTIN: {invoice.customerGSTIN}</p>}
          </div>
          <div className="border border-gray-200 print:border-black rounded-lg print:rounded-none p-4 print:p-2">
            <p className="text-xs print:text-[10px] font-bold text-gray-500 print:text-black uppercase tracking-wider mb-2 print:mb-1 border-b print:border-black pb-1">Payment Details</p>
            <div className="space-y-2 print:space-y-1 text-sm print:text-xs text-gray-800 print:text-black mt-2 print:mt-1">
              <div className="flex justify-between"><span className="font-semibold">Payment Mode:</span><span>{invoice.paymentMode}</span></div>
              <div className="flex justify-between"><span className="font-semibold">Amount Paid:</span><span className="font-medium">{formatCurrency(invoice.amountPaid)}</span></div>
              {invoice.grandTotal - invoice.amountPaid > 0 && (
                <div className="flex justify-between"><span className="font-semibold">Balance Due:</span><span className="font-bold">{formatCurrency(invoice.grandTotal - invoice.amountPaid)}</span></div>
              )}
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="border border-gray-300 print:border-black mb-6 print:mb-3 print:rounded-none overflow-hidden rounded-lg">
          <table className="w-full text-sm print:text-xs text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 print:bg-gray-100 border-b border-gray-300 print:border-black text-gray-800 print:text-black">
                <th className="px-4 py-3 print:px-2 print:py-1.5 font-bold border-r border-gray-300 print:border-black w-12">#</th>
                <th className="px-4 py-3 print:px-2 print:py-1.5 font-bold border-r border-gray-300 print:border-black">{t('products')} / Description</th>
                <th className="px-4 py-3 print:px-2 print:py-1.5 font-bold border-r border-gray-300 print:border-black text-right w-20">{t('qty')}</th>
                <th className="px-4 py-3 print:px-2 print:py-1.5 font-bold border-r border-gray-300 print:border-black text-right w-28">{t('rate')} (₹)</th>
                <th className="px-4 py-3 print:px-2 print:py-1.5 font-bold border-r border-gray-300 print:border-black text-right w-24">{t('discount')} (₹)</th>
                <th className="px-4 py-3 print:px-2 print:py-1.5 font-bold border-r border-gray-300 print:border-black text-right w-24">GST</th>
                <th className="px-4 py-3 print:px-2 print:py-1.5 font-bold text-right w-32">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, idx) => (
                <tr key={idx} className="border-b border-gray-200 print:border-black last:border-b-0">
                  <td className="px-4 py-3 print:px-2 print:py-1.5 border-r border-gray-200 print:border-black text-gray-600 print:text-black">{idx + 1}</td>
                  <td className="px-4 py-3 print:px-2 print:py-1.5 border-r border-gray-200 print:border-black">
                    <p className="font-semibold text-gray-900 print:text-black">{item.productName}</p>
                    {item.productCategory && <p className="text-xs print:text-[10px] text-gray-500 print:text-gray-800">{item.productCategory}</p>}
                  </td>
                  <td className="px-4 py-3 print:px-2 print:py-1.5 border-r border-gray-200 print:border-black text-right text-gray-800 print:text-black font-medium">{item.quantity} {item.unit}</td>
                  <td className="px-4 py-3 print:px-2 print:py-1.5 border-r border-gray-200 print:border-black text-right text-gray-800 print:text-black">{formatCurrency(item.price)}</td>
                  <td className="px-4 py-3 print:px-2 print:py-1.5 border-r border-gray-200 print:border-black text-right text-gray-800 print:text-black">{item.discount > 0 ? formatCurrency(item.discount) : '—'}</td>
                  <td className="px-4 py-3 print:px-2 print:py-1.5 border-r border-gray-200 print:border-black text-right text-gray-800 print:text-black">{item.gstPercent}% <br className="print:hidden"/><span className="text-xs print:text-[10px] text-gray-500 print:text-gray-800 print:ml-1">({formatCurrency(item.gstAmount)})</span></td>
                  <td className="px-4 py-3 print:px-2 print:py-1.5 text-right font-bold text-gray-900 print:text-black">{formatCurrency(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Lower Section: Totals & Meta */}
        <div className="flex flex-col md:flex-row justify-between gap-8 print:gap-4 mb-8 print:mb-4 page-break-inside-avoid">
          {/* Left Side: GST Breakdown & Notes */}
          <div className="flex-1 space-y-6 print:space-y-3">
            {invoice.totalGST > 0 && (
              <div>
                <p className="text-xs print:text-[10px] font-bold text-gray-500 print:text-black uppercase tracking-wide mb-2 print:mb-1">GST Details</p>
                <div className="border border-gray-300 print:border-black rounded-lg print:rounded-none overflow-hidden">
                  <table className="w-full text-xs print:text-[10px] text-left border-collapse">
                    <thead className="bg-gray-100 print:bg-gray-100 border-b border-gray-300 print:border-black">
                      <tr>
                        <th className="px-3 py-2 print:px-2 print:py-1 font-bold text-gray-700 print:text-black border-r border-gray-300 print:border-black">Rate</th>
                        <th className="px-3 py-2 print:px-2 print:py-1 font-bold text-gray-700 print:text-black border-r border-gray-300 print:border-black text-right">Taxable</th>
                        <th className="px-3 py-2 print:px-2 print:py-1 font-bold text-gray-700 print:text-black border-r border-gray-300 print:border-black text-right">CGST</th>
                        <th className="px-3 py-2 print:px-2 print:py-1 font-bold text-gray-700 print:text-black border-r border-gray-300 print:border-black text-right">SGST</th>
                        <th className="px-3 py-2 print:px-2 print:py-1 font-bold text-gray-700 print:text-black text-right">Total GST</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(
                        invoice.items.reduce((acc, item) => {
                          const k = `${item.gstPercent}%`;
                          const base = item.price * item.quantity - (item.discount || 0);
                          if (!acc[k]) acc[k] = { taxable: 0, gst: 0, rate: item.gstPercent };
                          acc[k].taxable += base;
                          acc[k].gst += item.gstAmount;
                          return acc;
                        }, {})
                      ).map(([rate, v]) => (
                        <tr key={rate} className="border-b border-gray-200 print:border-black last:border-0">
                          <td className="px-3 py-2 print:px-2 print:py-1 font-semibold border-r border-gray-200 print:border-black">{rate}</td>
                          <td className="px-3 py-2 print:px-2 print:py-1 text-right border-r border-gray-200 print:border-black">{formatCurrency(v.taxable)}</td>
                          <td className="px-3 py-2 print:px-2 print:py-1 text-right border-r border-gray-200 print:border-black">{formatCurrency(v.gst / 2)}</td>
                          <td className="px-3 py-2 print:px-2 print:py-1 text-right border-r border-gray-200 print:border-black">{formatCurrency(v.gst / 2)}</td>
                          <td className="px-3 py-2 print:px-2 print:py-1 text-right font-bold">{formatCurrency(v.gst)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {invoice.notes && (
              <div>
                <p className="text-xs print:text-[10px] font-bold text-gray-500 print:text-black uppercase tracking-wide mb-1">Notes / Remarks</p>
                <div className="border border-gray-200 print:border-black rounded-lg print:rounded-none p-3 print:p-2 text-sm print:text-xs text-gray-800 print:text-black">
                  {invoice.notes}
                </div>
              </div>
            )}
          </div>

          {/* Right Side: Totals */}
          <div className="w-full md:w-80">
            <div className="border border-gray-300 print:border-black rounded-lg print:rounded-none overflow-hidden">
              <table className="w-full text-sm print:text-xs">
                <tbody>
                  <tr className="border-b border-gray-200 print:border-black text-gray-800 print:text-black">
                    <td className="px-4 py-3 print:px-2 print:py-1.5 font-semibold">Subtotal</td>
                    <td className="px-4 py-3 print:px-2 print:py-1.5 text-right font-medium">{formatCurrency(invoice.subtotalBeforeGST)}</td>
                  </tr>
                  {invoice.totalDiscount > 0 && (
                    <tr className="border-b border-gray-200 print:border-black text-gray-800 print:text-black bg-gray-50 print:bg-white">
                      <td className="px-4 py-3 print:px-2 print:py-1.5 font-semibold">Total Discount</td>
                      <td className="px-4 py-3 print:px-2 print:py-1.5 text-right font-medium">-{formatCurrency(invoice.totalDiscount)}</td>
                    </tr>
                  )}
                  <tr className="border-b border-gray-200 print:border-black text-gray-800 print:text-black">
                    <td className="px-4 py-3 print:px-2 print:py-1.5 font-semibold">Total GST</td>
                    <td className="px-4 py-3 print:px-2 print:py-1.5 text-right font-medium">{formatCurrency(invoice.totalGST)}</td>
                  </tr>
                  <tr className="bg-gray-800 print:bg-gray-100 text-white print:text-black">
                    <td className="px-4 py-4 print:px-2 print:py-2 font-bold text-base print:text-sm uppercase">Grand Total</td>
                    <td className="px-4 py-4 print:px-2 print:py-2 text-right font-bold text-lg print:text-base">{formatCurrency(invoice.grandTotal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer (Terms & Signatures) */}
        <div className="border-t-2 border-gray-800 print:border-black pt-6 print:pt-4 flex justify-between items-end pb-8 print:pb-2 page-break-inside-avoid">
          <div className="flex-1 pr-10">
            <p className="text-sm font-bold text-gray-900 print:text-black uppercase tracking-wide mb-2 print:mb-1">Terms & Conditions</p>
            <ol className="list-decimal list-inside text-xs print:text-[10px] text-gray-700 print:text-black space-y-1 print:space-y-0.5">
              <li className="font-semibold">{t('terms')}</li>
              <li>Interest will be charged @ 24% p.a. if payment is delayed beyond 15 days.</li>
              <li>Subject to local jurisdiction.</li>
            </ol>
            <div className="mt-4 print:mt-2">
              <p className="text-xs print:text-[10px] font-bold text-gray-900 print:text-black">Thank you for your business!</p>
              <p className="text-xs print:text-[10px] text-gray-600 print:text-black mt-1 print:mt-0">For queries contact: {user?.shopPhone || 'the shop administration'}</p>
            </div>
          </div>
          <div className="w-48 text-center pt-16 print:pt-10 border-t border-gray-400 print:border-black">
            <p className="text-sm print:text-xs font-bold text-gray-900 print:text-black">Authorized Signatory</p>
            <p className="text-xs print:text-[10px] text-gray-500 print:text-black mt-1 print:mt-0">For {user?.shopName}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
