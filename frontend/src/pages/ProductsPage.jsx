import { useState, useEffect, useCallback } from 'react';
import { Package, Plus, Search, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { formatCurrency } from '../utils/format';
import { useLanguage } from '../context/LanguageContext';

const emptyForm = { name: '', category: 'Other', options: '', price: '', gstPercent: 18, stock: '', unit: 'pcs', description: '', sku: '' };
const gstOptions = [0, 5, 12, 18, 28];

const categoryBadge = (cat) => {
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-400`}>{cat}</span>;
};

export default function ProductsPage() {
  const { t } = useLanguage();
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/products', { params: { search, category } });
      setProducts(data.data);
      setTotal(data.total);
    } catch { toast.error('Failed to load products'); }
    finally { setLoading(false); }
  }, [search, category]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const openAdd = () => { setEditProduct(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (p) => {
    setEditProduct(p);
    setForm({ 
      name: p.name, 
      category: p.category, 
      options: p.options?.join(', ') || '',
      price: p.price, 
      gstPercent: p.gstPercent, 
      stock: p.stock, 
      unit: p.unit, 
      description: p.description || '', 
      sku: p.sku || '' 
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Product name is required');
    if (!form.price || isNaN(form.price) || form.price < 0) return toast.error(`Enter a valid ${t('rate').toLowerCase()}`);
    if (form.stock === '' || isNaN(form.stock)) return toast.error('Enter valid stock quantity');
    setSaving(true);
    try {
      const optionsArray = form.options.split(',').map(s => s.trim()).filter(Boolean);
      const payload = { ...form, options: optionsArray, price: parseFloat(form.price), stock: parseInt(form.stock), gstPercent: parseInt(form.gstPercent) };
      if (editProduct) {
        await api.put(`/products/${editProduct._id}`, payload);
        toast.success('Product updated');
      } else {
        await api.post('/products', payload);
        toast.success('Product added');
      }
      setModalOpen(false);
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving product');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/products/${deleteId}`);
      toast.success('Product deleted');
      setDeleteId(null);
      fetchProducts();
    } catch { toast.error('Failed to delete'); }
    finally { setDeleting(false); }
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // get unique categories for filter dropdown
  const uniqueCategories = [...new Set(products.map(p => p.category))];

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">{t('products')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{total} products in inventory</p>
        </div>
        <button onClick={openAdd} className="btn-primary text-sm">
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder={`${t('search')} products...`} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-auto min-w-[140px]" value={category} onChange={e => setCategory(e.target.value)}>
          <option value="">All Categories</option>
          {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Products Grid / Table */}
      <div className="card overflow-hidden text-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider font-semibold text-gray-500 bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-md">
                <th className="px-5 py-4">Product</th>
                <th className="px-5 py-4">{t('category')}</th>
                <th className="px-5 py-4">{t('options')}</th>
                <th className="px-5 py-4">{t('rate')}</th>
                <th className="px-5 py-4">GST %</th>
                <th className="px-5 py-4">Stock</th>
                <th className="px-5 py-4 hidden md:table-cell">SKU</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading && (
                <tr><td colSpan={8} className="text-center py-12">
                  <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
                </td></tr>
              )}
              {!loading && products.length === 0 && (
                <tr><td colSpan={8} className="text-center py-12">
                  <Package size={32} className="mx-auto text-gray-300 dark:text-gray-600 mb-2 animate-float" />
                  <p className="text-gray-400 text-sm">No products found</p>
                  <button onClick={openAdd} className="mt-3 text-brand-500 text-sm font-medium hover:text-brand-600 transition-colors">Add your first product</button>
                </td></tr>
              )}
              {products.map(p => (
                <tr key={p._id} className="hover:bg-brand-50/30 dark:hover:bg-brand-900/10 transition-colors">
                  <td className="px-5 py-3">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{p.name}</p>
                      {p.description && <p className="text-xs text-gray-400 truncate max-w-[200px]">{p.description}</p>}
                    </div>
                  </td>
                  <td className="px-5 py-3">{categoryBadge(p.category)}</td>
                  <td className="px-5 py-3 text-xs text-gray-500 dark:text-gray-400">
                    {p.options && p.options.length > 0 ? p.options.join(', ') : '—'}
                  </td>
                  <td className="px-5 py-3 font-semibold text-brand-600 dark:text-brand-400">{formatCurrency(p.price)}</td>
                  <td className="px-5 py-3 text-gray-600 dark:text-gray-300">{p.gstPercent}%</td>
                  <td className="px-5 py-3">
                    <span className={`font-medium flex items-center gap-1.5 ${p.stock <= 3 ? 'text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-md inline-flex' : 'text-gray-700 dark:text-gray-300'}`}>
                      {p.stock <= 3 && <AlertTriangle size={14} />}
                      {p.stock} {p.unit}
                    </span>
                  </td>
                  <td className="px-5 py-3 hidden md:table-cell">
                    <span className="text-xs text-gray-400 font-mono bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">{p.sku || '—'}</span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => setDeleteId(p._id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editProduct ? 'Edit Product' : 'Add Product'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Product Name *</label>
              <input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Premium Office Chair" required />
            </div>
            <div>
              <label className="label">{t('category')}</label>
              <input className="input" value={form.category} onChange={e => set('category', e.target.value)} placeholder="Enter or define category" list="category-list" />
              <datalist id="category-list">
                {uniqueCategories.map(c => <option key={c} value={c} />)}
              </datalist>
            </div>
            <div>
              <label className="label">Unit</label>
              <input className="input" value={form.unit} onChange={e => set('unit', e.target.value)} placeholder="pcs / kg / lit" />
            </div>
            <div className="col-span-2">
              <label className="label">{t('options')} (Comma separated)</label>
              <input className="input" value={form.options} onChange={e => set('options', e.target.value)} placeholder="e.g. Red, Blue, Large (optional)" />
            </div>
            <div>
              <label className="label">{t('rate')} (₹) *</label>
              <input type="number" min="0" step="0.01" className="input" value={form.price} onChange={e => set('price', e.target.value)} placeholder="0.00" required />
            </div>
            <div>
              <label className="label">GST %</label>
              <select className="input" value={form.gstPercent} onChange={e => set('gstPercent', e.target.value)}>
                {gstOptions.map(g => <option key={g} value={g}>{g}%</option>)}
              </select>
            </div>
            <div>
              <label className="label">Stock Qty *</label>
              <input type="number" min="0" className="input" value={form.stock} onChange={e => set('stock', e.target.value)} placeholder="0" required />
            </div>
            <div>
              <label className="label">SKU / Code</label>
              <input className="input font-mono" value={form.sku} onChange={e => set('sku', e.target.value)} placeholder="ITEM-001" />
            </div>
            <div className="col-span-2">
              <label className="label">Description</label>
              <input className="input" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Short description (optional)" />
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2 border-t border-gray-100 dark:border-gray-800 mt-4 pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">{t('cancel')}</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : editProduct ? 'Update Product' : 'Add Product'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        loading={deleting}
        message="This will permanently delete this product from your inventory."
      />
    </div>
  );
}
