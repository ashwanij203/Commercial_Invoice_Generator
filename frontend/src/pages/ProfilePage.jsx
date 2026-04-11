import { useState } from 'react';
import { User, Store, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    shopName: user?.shopName || '',
    shopAddress: user?.shopAddress || '',
    shopPhone: user?.shopPhone || '',
    shopGSTIN: user?.shopGSTIN || ''
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put('/auth/profile', form);
      updateUser(data.user);
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally { setSaving(false); }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Profile & Shop Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">These details appear on your invoices</p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Account Info */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <User size={16} className="text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Account</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="label">Your Name</label>
              <input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Your full name" />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input bg-gray-50 dark:bg-gray-700/50" value={user?.email || ''} disabled />
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
            </div>
          </div>
        </div>

        {/* Shop Info */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Store size={16} className="text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Shop Details</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="label">Shop Name</label>
              <input className="input" value={form.shopName} onChange={e => set('shopName', e.target.value)} placeholder="Shop name" />
            </div>
            <div>
              <label className="label">Shop Address</label>
              <input className="input" value={form.shopAddress} onChange={e => set('shopAddress', e.target.value)} placeholder="Full address" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Phone Number</label>
                <input className="input" value={form.shopPhone} onChange={e => set('shopPhone', e.target.value)} placeholder="+91 XXXXX XXXXX" />
              </div>
              <div>
                <label className="label">GSTIN</label>
                <input className="input font-mono" value={form.shopGSTIN} onChange={e => set('shopGSTIN', e.target.value)} placeholder="GSTIN number" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="btn-primary">
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>

      {/* Preview card */}
      <div className="card p-5 border-dashed">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Invoice Header Preview</p>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-sm">{form.shopName?.charAt(0) || 'J'}</span>
          </div>
          <div>
            <p className="font-bold text-gray-900 dark:text-white">{form.shopName}</p>
            <p className="text-xs text-gray-500">{form.shopAddress}</p>
            {form.shopPhone && <p className="text-xs text-gray-500">{form.shopPhone}</p>}
            {form.shopGSTIN && <p className="text-xs text-gray-500 font-mono">GSTIN: {form.shopGSTIN}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
