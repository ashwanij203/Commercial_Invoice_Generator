import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Store, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    shopName: 'Jaiswal Furniture & Electronics',
    shopAddress: 'Abu, Rajasthan, India',
    shopPhone: '', shopGSTIN: ''
  });
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return toast.error('Please fill required fields');
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created! Welcome.');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-brand-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Store size={24} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">Create Account</h1>
          <p className="text-gray-400 text-sm mt-1">Set up your billing system</p>
        </div>

        <div className="bg-gray-800/80 backdrop-blur rounded-2xl border border-gray-700 p-6 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 sm:col-span-1">
                <label className="label text-gray-300">Your Name *</label>
                <input className="input bg-gray-700 border-gray-600 text-white" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Full name" required />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="label text-gray-300">Email *</label>
                <input type="email" className="input bg-gray-700 border-gray-600 text-white" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@example.com" required />
              </div>
              <div>
                <label className="label text-gray-300">Password *</label>
                <input type="password" className="input bg-gray-700 border-gray-600 text-white" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min 6 chars" required />
              </div>
              <div>
                <label className="label text-gray-300">Confirm Password *</label>
                <input type="password" className="input bg-gray-700 border-gray-600 text-white" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} placeholder="Repeat password" required />
              </div>
            </div>
            <hr className="border-gray-600" />
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Shop Details</p>
            <div>
              <label className="label text-gray-300">Shop Name</label>
              <input className="input bg-gray-700 border-gray-600 text-white" value={form.shopName} onChange={e => set('shopName', e.target.value)} />
            </div>
            <div>
              <label className="label text-gray-300">Shop Address</label>
              <input className="input bg-gray-700 border-gray-600 text-white" value={form.shopAddress} onChange={e => set('shopAddress', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label text-gray-300">Phone</label>
                <input className="input bg-gray-700 border-gray-600 text-white" value={form.shopPhone} onChange={e => set('shopPhone', e.target.value)} placeholder="+91 XXXXX XXXXX" />
              </div>
              <div>
                <label className="label text-gray-300">GSTIN</label>
                <input className="input bg-gray-700 border-gray-600 text-white" value={form.shopGSTIN} onChange={e => set('shopGSTIN', e.target.value)} placeholder="GSTIN number" />
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full btn-primary justify-center py-2.5">
              <UserPlus size={16} />
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-400 mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
