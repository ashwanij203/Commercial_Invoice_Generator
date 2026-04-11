import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Search, UserPlus, ChevronDown } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { formatCurrency } from '../utils/format';
import { useLanguage } from '../context/LanguageContext';

const PAYMENT_MODES = ['Cash', 'UPI', 'Card', 'Net Banking', 'Credit'];
const PAYMENT_STATUSES = ['Paid', 'Pending', 'Partial'];

export default function NewInvoicePage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  // Customer
  const [customers, setCustomers] = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const customerRef = useRef(null);

  // Products
  const [products, setProducts] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const productRef = useRef(null);

  // Invoice items
  const [items, setItems] = useState([]);

  // Invoice meta
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [paymentStatus, setPaymentStatus] = useState('Paid');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amountPaid, setAmountPaid] = useState('');

  // Manual customer entry (if not from list)
  const [manualCustomer, setManualCustomer] = useState({ name: '', phone: '', email: '', address: '' });
  const [useManual, setUseManual] = useState(false);

  useEffect(() => {
    api.get('/customers', { params: { limit: 100 } }).then(r => setCustomers(r.data.data)).catch(console.error);
    api.get('/products', { params: { limit: 200 } }).then(r => setProducts(r.data.data)).catch(console.error);
  }, []);

  // Filter customers
  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.phone.includes(customerSearch)
  );

  // Filter products
  useEffect(() => {
    const q = productSearch.toLowerCase();
    setFilteredProducts(q ? products.filter(p => p.name.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q))) : products.slice(0, 20));
  }, [productSearch, products]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (customerRef.current && !customerRef.current.contains(e.target)) setShowCustomerDropdown(false);
      if (productRef.current && !productRef.current.contains(e.target)) setShowProductDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectCustomer = (c) => {
    setSelectedCustomer(c);
    setCustomerSearch(c.name);
    setShowCustomerDropdown(false);
    setUseManual(false);
  };

  const [showManualItemModal, setShowManualItemModal] = useState(false);
  const [manualItem, setManualItem] = useState({ name: '', category: '', price: '', gstPercent: 0 });

  const handleAddManualItem = () => {
    if (!manualItem.name || !manualItem.price) return toast.error('Name and Rate are required');
    setItems(prev => [...prev, {
      id: Date.now(),
      product: null,
      productName: manualItem.name,
      productCategory: manualItem.category || 'Manual Entry',
      price: parseFloat(manualItem.price),
      gstPercent: parseFloat(manualItem.gstPercent) || 0,
      quantity: 1,
      unit: 'pcs',
      discount: 0,
      maxStock: 9999
    }]);
    setShowManualItemModal(false);
    setManualItem({ name: '', category: '', price: '', gstPercent: 0 });
  };

  const addProduct = (p) => {
    const existing = items.find(i => i.product === p._id);
    if (existing) {
      updateItem(existing.id, 'quantity', existing.quantity + 1);
    } else {
      setItems(prev => [...prev, {
        id: Date.now(),
        product: p._id,
        productName: p.name,
        productCategory: p.category,
        price: p.price,
        gstPercent: p.gstPercent,
        quantity: 1,
        unit: p.unit,
        discount: 0,
        maxStock: p.stock
      }]);
    }
    setProductSearch('');
    setShowProductDropdown(false);
  };

  const updateItem = (id, field, value) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const removeItem = (id) => setItems(prev => prev.filter(i => i.id !== id));

  // Calculations
  const calcLine = (item) => {
    const base = item.price * item.quantity;
    const disc = parseFloat(item.discount) || 0;
    const afterDiscount = base - disc;
    const gst = (afterDiscount * item.gstPercent) / 100;
    return { base, disc, gst, total: afterDiscount + gst };
  };

  const totals = items.reduce((acc, item) => {
    const { base, disc, gst, total } = calcLine(item);
    return {
      subtotal: acc.subtotal + base,
      discount: acc.discount + disc,
      gst: acc.gst + gst,
      grand: acc.grand + total
    };
  }, { subtotal: 0, discount: 0, gst: 0, grand: 0 });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0) return toast.error('Add at least one item to the invoice');

    const customer = useManual ? manualCustomer : selectedCustomer ? {
      name: selectedCustomer.name, phone: selectedCustomer.phone,
      email: selectedCustomer.email, address: selectedCustomer.address,
      gstin: selectedCustomer.gstin
    } : null;

    if (!customer?.name) return toast.error('Please select or enter a customer');

    setSaving(true);
    try {
      const payload = {
        customer: selectedCustomer?._id,
        customerName: customer.name,
        customerPhone: customer.phone || '',
        customerEmail: customer.email || '',
        customerAddress: customer.address || '',
        customerGSTIN: customer.gstin || '',
        items: items.map(item => ({
          product: item.product,
          productName: item.productName,
          productCategory: item.productCategory,
          quantity: parseInt(item.quantity),
          unit: item.unit,
          price: parseFloat(item.price),
          gstPercent: item.gstPercent,
          discount: parseFloat(item.discount) || 0
        })),
        paymentMode, paymentStatus,
        amountPaid: parseFloat(amountPaid) || totals.grand,
        notes, date
      };
      const { data } = await api.post('/invoices', payload);
      toast.success(`Invoice ${data.data.invoiceNumber} created!`);
      navigate(`/invoices/${data.data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create invoice');
    } finally { setSaving(false); }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-fade-in-up">
      {/* Modal for Custom Item */}
      {showManualItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700 animate-scale-up">
            <div className="p-5 border-b border-gray-100 dark:border-gray-700">
              <h3 className="font-bold text-lg">Add Custom Item</h3>
              <p className="text-sm text-gray-500">Quickly add an item without saving it to products</p>
            </div>
            <div className="p-5 space-y-4">
              <div><label className="label">Item Name *</label><input className="input" autoFocus value={manualItem.name} onChange={e => setManualItem(m => ({ ...m, name: e.target.value }))} placeholder="e.g. Installation Charge" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Rate (₹) *</label><input type="number" step="0.01" className="input" value={manualItem.price} onChange={e => setManualItem(m => ({ ...m, price: e.target.value }))} placeholder="0.00" /></div>
                <div><label className="label">GST %</label><input type="number" className="input" value={manualItem.gstPercent} onChange={e => setManualItem(m => ({ ...m, gstPercent: e.target.value }))} placeholder="0" /></div>
              </div>
              <div><label className="label">Category (optional)</label><input className="input" value={manualItem.category} onChange={e => setManualItem(m => ({ ...m, category: e.target.value }))} placeholder="e.g. Services" /></div>
            </div>
            <div className="p-5 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
              <button type="button" onClick={() => setShowManualItemModal(false)} className="btn-secondary">Cancel</button>
              <button type="button" onClick={handleAddManualItem} className="btn-primary">Add Item</button>
            </div>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
          {t('newInvoice')}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Fill in customer details and add products</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Customer Section */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">Customer Details</h2>
          <div className="flex items-center gap-3 mb-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="radio" checked={!useManual} onChange={() => setUseManual(false)} /> Select existing customer
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="radio" checked={useManual} onChange={() => setUseManual(true)} /> Enter manually
            </label>
          </div>

          {!useManual ? (
            <div className="relative" ref={customerRef}>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  className="input pl-9"
                  placeholder="Search customer by name or phone..."
                  value={customerSearch}
                  onChange={e => { setCustomerSearch(e.target.value); setShowCustomerDropdown(true); setSelectedCustomer(null); }}
                  onFocus={() => setShowCustomerDropdown(true)}
                />
              </div>
              {showCustomerDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-52 overflow-y-auto">
                  {filteredCustomers.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-gray-400">No customers found</p>
                  ) : filteredCustomers.map(c => (
                    <button key={c._id} type="button" onClick={() => selectCustomer(c)}
                      className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{c.name}</p>
                      <p className="text-xs text-gray-400">{c.phone} {c.city ? `· ${c.city}` : ''}</p>
                    </button>
                  ))}
                </div>
              )}
              {selectedCustomer && (
                <div className="mt-3 p-3 bg-brand-50 dark:bg-brand-900/20 rounded-lg border border-brand-200 dark:border-brand-800">
                  <p className="text-sm font-semibold text-brand-700 dark:text-brand-400">{selectedCustomer.name}</p>
                  <p className="text-xs text-gray-500">{selectedCustomer.phone} · {selectedCustomer.address}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Name *</label><input className="input" value={manualCustomer.name} onChange={e => setManualCustomer(m => ({ ...m, name: e.target.value }))} placeholder="Customer name" /></div>
              <div><label className="label">Phone</label><input className="input" value={manualCustomer.phone} onChange={e => setManualCustomer(m => ({ ...m, phone: e.target.value }))} placeholder="Phone number" /></div>
              <div><label className="label">Email</label><input className="input" value={manualCustomer.email} onChange={e => setManualCustomer(m => ({ ...m, email: e.target.value }))} placeholder="Email (optional)" /></div>
              <div><label className="label">Address</label><input className="input" value={manualCustomer.address} onChange={e => setManualCustomer(m => ({ ...m, address: e.target.value }))} placeholder="Address (optional)" /></div>
            </div>
          )}
        </div>

        {/* Products Section */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">Products / Items</h2>

          {/* Product search */}
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1" ref={productRef}>
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="input pl-9"
                placeholder="Search and add product..."
                value={productSearch}
                onChange={e => { setProductSearch(e.target.value); setShowProductDropdown(true); }}
                onFocus={() => setShowProductDropdown(true)}
              />
              {showProductDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-52 overflow-y-auto">
                  {filteredProducts.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-gray-400">No products found</p>
                  ) : filteredProducts.map(p => (
                    <button key={p._id} type="button" onClick={() => addProduct(p)}
                      className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{p.name}</p>
                        <p className="text-xs text-gray-400">{p.category} · GST {p.gstPercent}% · Stock: {p.stock}</p>
                      </div>
                      <span className="text-sm font-semibold text-brand-500">{formatCurrency(p.price)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button type="button" onClick={() => setShowManualItemModal(true)} className="btn-secondary whitespace-nowrap px-4 bg-gray-50 flex gap-2 border-gray-200 shadow-sm hover:border-gray-300 dark:bg-gray-800 dark:border-gray-600 text-sm font-semibold items-center rounded-xl">
              <Plus size={16} /> Custom Item
            </button>
          </div>

          {/* Items table */}
          {items.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-lg">
              <p className="text-sm text-gray-400">No items added. Search and select products above.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider font-semibold text-gray-500 bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-md rounded-lg">
                    <th className="px-3 py-2">{t('products')}</th>
                    <th className="px-3 py-2 w-20">{t('qty')}</th>
                    <th className="px-3 py-2 w-28">{t('rate')} (₹)</th>
                    <th className="px-3 py-2 w-24">{t('discount')} (₹)</th>
                    <th className="px-3 py-2 w-16">GST%</th>
                    <th className="px-3 py-2 w-28 text-right">{t('total')}</th>
                    <th className="px-3 py-2 w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => {
                    const { total } = calcLine(item);
                    return (
                      <tr key={item.id} className="border-t border-gray-50 dark:border-gray-700">
                        <td className="px-3 py-2">
                          <p className="font-medium text-gray-900 dark:text-white text-xs">{item.productName}</p>
                          <p className="text-xs text-gray-400">{item.productCategory}</p>
                        </td>
                        <td className="px-3 py-2">
                          <input type="number" min="1" max={item.maxStock}
                            className="input text-xs py-1 px-2 w-16"
                            value={item.quantity}
                            onChange={e => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input type="number" min="0" step="0.01"
                            className="input text-xs py-1 px-2 w-24"
                            value={item.price}
                            onChange={e => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input type="number" min="0" step="0.01"
                            className="input text-xs py-1 px-2 w-20"
                            value={item.discount}
                            onChange={e => updateItem(item.id, 'discount', parseFloat(e.target.value) || 0)}
                          />
                        </td>
                        <td className="px-3 py-2 text-gray-500 text-xs">{item.gstPercent}%</td>
                        <td className="px-3 py-2 text-right font-semibold text-gray-900 dark:text-white text-xs">{formatCurrency(total)}</td>
                        <td className="px-3 py-2">
                          <button type="button" onClick={() => removeItem(item.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Totals */}
          {items.length > 0 && (
            <div className="mt-4 ml-auto max-w-xs space-y-1.5 text-sm p-4 bg-brand-50/50 dark:bg-brand-900/10 rounded-xl border border-brand-100 dark:border-brand-800/50">
              <div className="flex justify-between text-gray-500 font-medium"><span>{t('subtotal')}</span><span>{formatCurrency(totals.subtotal)}</span></div>
              {totals.discount > 0 && <div className="flex justify-between text-green-600 font-medium"><span>{t('discount')}</span><span>-{formatCurrency(totals.discount)}</span></div>}
              <div className="flex justify-between text-gray-500 font-medium"><span>GST</span><span>{formatCurrency(totals.gst)}</span></div>
              <div className="flex justify-between font-bold text-lg text-gray-900 dark:text-white border-t border-brand-200 dark:border-brand-800 pt-3 mt-2">
                <span>{t('grandTotal')}</span><span className="text-brand-500">{formatCurrency(totals.grand)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Payment & Meta */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">Payment Details</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="label">Invoice Date</label>
              <input type="date" className="input" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div>
              <label className="label">Payment Mode</label>
              <select className="input" value={paymentMode} onChange={e => setPaymentMode(e.target.value)}>
                {PAYMENT_MODES.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Payment Status</label>
              <select className="input" value={paymentStatus} onChange={e => setPaymentStatus(e.target.value)}>
                {PAYMENT_STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Amount Paid (₹)</label>
              <input type="number" min="0" step="0.01" className="input"
                value={amountPaid || ''}
                onChange={e => setAmountPaid(e.target.value)}
                placeholder={formatCurrency(totals.grand).replace('₹', '').trim()}
              />
            </div>
            <div className="col-span-2 md:col-span-4">
              <label className="label">Notes (optional)</label>
              <input className="input" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Thank you for your purchase!" />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3 justify-end">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={saving || items.length === 0} className="btn-primary px-8">
            {saving ? 'Creating Invoice...' : `Create Invoice · ${formatCurrency(totals.grand)}`}
          </button>
        </div>
      </form>
    </div>
  );
}
