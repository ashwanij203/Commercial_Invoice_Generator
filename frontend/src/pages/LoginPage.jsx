import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Store, LogIn, KeyRound, ArrowLeft, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';

export default function LoginPage() {
  const { login, updateUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: 'admin@jaiswal.com', password: 'admin123' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  // Forgot password state
  const [showReset, setShowReset] = useState(false);
  const [resetForm, setResetForm] = useState({ email: '', masterKey: '', newPassword: '' });
  const [showResetPwd, setShowResetPwd] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Please fill all fields');
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Login successful! Welcome back.');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (!resetForm.email || !resetForm.masterKey || !resetForm.newPassword) {
      return toast.error('Please fill all fields');
    }
    if (resetForm.newPassword.length < 6) {
      return toast.error('New password must be at least 6 characters');
    }
    setResetLoading(true);
    try {
      const { data } = await api.post('/auth/reset-password', resetForm);
      // Auto-login after successful reset
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      updateUser(data.user);
      toast.success(data.message || 'Password reset successful!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed. Check your recovery key.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-brand-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-500/30">
            <Store size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Jaiswal Billing</h1>
          <p className="text-gray-400 text-sm mt-1">Furniture & Electronics</p>
        </div>

        {/* Card */}
        <div className="bg-gray-800/80 backdrop-blur rounded-2xl border border-gray-700 p-6 shadow-xl">

          {/* ============ LOGIN FORM ============ */}
          {!showReset ? (
            <>
              <h2 className="text-lg font-semibold text-white mb-5">Sign in to your account</h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label text-gray-300">Email address</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className="input bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:ring-brand-500"
                    placeholder="admin@jaiswal.com"
                    required
                  />
                </div>
                <div>
                  <label className="label text-gray-300">Password</label>
                  <div className="relative">
                    <input
                      type={showPwd ? 'text' : 'password'}
                      value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      className="input bg-gray-700 border-gray-600 text-white placeholder-gray-500 pr-10"
                      placeholder="••••••••"
                      required
                    />
                    <button type="button" onClick={() => setShowPwd(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200">
                      {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Forgot Password link */}
                <div className="text-right">
                  <button type="button"
                    onClick={() => { setShowReset(true); setResetForm({ ...resetForm, email: form.email }); }}
                    className="text-xs text-amber-400 hover:text-amber-300 font-medium transition-colors">
                    🔑 Forgot Password?
                  </button>
                </div>

                <button type="submit" disabled={loading} className="w-full btn-primary justify-center py-2.5 mt-1">
                  <LogIn size={16} />
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>

              <p className="text-center text-sm text-gray-400 mt-4">
                Don't have an account?{' '}
                <Link to="/register" className="text-brand-400 hover:text-brand-300 font-medium">Register</Link>
              </p>

              {/* Demo hint */}
              <div className="mt-4 p-3 bg-gray-700/50 rounded-lg border border-gray-600/50">
                <p className="text-xs text-gray-400 text-center">
                  Demo: <span className="text-gray-300">admin@jaiswal.com</span> / <span className="text-gray-300">admin123</span>
                </p>
              </div>
            </>
          ) : (
            /* ============ PASSWORD RESET FORM ============ */
            <>
              <div className="flex items-center gap-3 mb-5">
                <button onClick={() => setShowReset(false)}
                  className="p-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors">
                  <ArrowLeft size={16} />
                </button>
                <div>
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <ShieldCheck size={20} className="text-amber-400" />
                    Reset Password
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">Enter the master recovery key to reset</p>
                </div>
              </div>

              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <label className="label text-gray-300">Email address</label>
                  <input
                    type="email"
                    value={resetForm.email}
                    onChange={e => setResetForm({ ...resetForm, email: e.target.value })}
                    className="input bg-gray-700 border-gray-600 text-white placeholder-gray-500"
                    placeholder="your@email.com"
                    required
                  />
                </div>

                <div>
                  <label className="label text-amber-300 flex items-center gap-1.5">
                    <KeyRound size={13} />
                    Master Recovery Key
                  </label>
                  <input
                    type="text"
                    value={resetForm.masterKey}
                    onChange={e => setResetForm({ ...resetForm, masterKey: e.target.value })}
                    className="input bg-gray-700 border-amber-600/50 text-white placeholder-gray-500 focus:ring-amber-500 font-mono tracking-wider"
                    placeholder="JFE-MASTER-XXXX-XXXX-XXXX"
                    required
                  />
                  <p className="text-[10px] text-gray-500 mt-1">Contact your administrator for this key</p>
                </div>

                <div>
                  <label className="label text-gray-300">New Password</label>
                  <div className="relative">
                    <input
                      type={showResetPwd ? 'text' : 'password'}
                      value={resetForm.newPassword}
                      onChange={e => setResetForm({ ...resetForm, newPassword: e.target.value })}
                      className="input bg-gray-700 border-gray-600 text-white placeholder-gray-500 pr-10"
                      placeholder="Min. 6 characters"
                      minLength={6}
                      required
                    />
                    <button type="button" onClick={() => setShowResetPwd(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200">
                      {showResetPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={resetLoading}
                  className="w-full justify-center py-2.5 mt-1 flex items-center gap-2 font-medium rounded-lg text-sm px-4 bg-amber-600 hover:bg-amber-500 text-white transition-colors disabled:opacity-50">
                  <ShieldCheck size={16} />
                  {resetLoading ? 'Resetting...' : 'Reset Password & Login'}
                </button>
              </form>

              <div className="mt-4 p-3 bg-amber-900/20 rounded-lg border border-amber-700/30">
                <p className="text-[11px] text-amber-300/80 text-center">
                  ⚠️ The recovery key is provided by the app administrator. All data is preserved after reset.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
