import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Store, LogIn, ArrowLeft, ShieldCheck, Search, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';

export default function LoginPage() {
  const { login, updateUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Forgot password state
  const [showReset, setShowReset] = useState(false);
  const [resetStep, setResetStep] = useState(1);
  const [resetForm, setResetForm] = useState({ email: '', securityAnswer: '', newPassword: '' });
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [showResetPwd, setShowResetPwd] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.email.trim()) {
      setError('Please enter your email address');
      return;
    }
    if (!form.password) {
      setError('Please enter your password');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await login(form.email.trim(), form.password);
      toast.success('Login successful! Welcome back.');
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please check your connection and try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Fetch security question
  const handleFetchQuestion = async (e) => {
    e.preventDefault();
    setResetError('');
    if (!resetForm.email.trim()) {
      setResetError('Please enter your email address');
      return;
    }
    setResetLoading(true);
    try {
      const { data } = await api.post('/auth/security-question', { email: resetForm.email.trim() });
      setSecurityQuestion(data.securityQuestion);
      setResetStep(2);
      setResetError('');
    } catch (err) {
      setResetError(err.response?.data?.message || 'Could not find account. Check your email.');
    } finally {
      setResetLoading(false);
    }
  };

  // Step 2: Submit answer + new password
  const handleReset = async (e) => {
    e.preventDefault();
    setResetError('');

    if (!resetForm.securityAnswer.trim()) {
      setResetError('Please enter your security answer');
      return;
    }
    if (!resetForm.newPassword) {
      setResetError('Please enter a new password');
      return;
    }
    if (resetForm.newPassword.length < 6) {
      setResetError('New password must be at least 6 characters');
      return;
    }

    setResetLoading(true);
    try {
      const { data } = await api.post('/auth/reset-password', {
        ...resetForm,
        email: resetForm.email.trim(),
        securityAnswer: resetForm.securityAnswer.trim()
      });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      updateUser(data.user);
      toast.success(data.message || 'Password reset successful!');
      navigate('/');
    } catch (err) {
      setResetError(err.response?.data?.message || 'Reset failed. Please check your answer and try again.');
    } finally {
      setResetLoading(false);
    }
  };

  const openReset = () => {
    setShowReset(true);
    setResetStep(1);
    setResetForm({ email: form.email || '', securityAnswer: '', newPassword: '' });
    setSecurityQuestion('');
    setResetError('');
    setError('');
  };

  const closeReset = () => {
    setShowReset(false);
    setResetStep(1);
    setSecurityQuestion('');
    setResetError('');
  };

  // Inline error banner component
  const ErrorBanner = ({ message }) => message ? (
    <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm animate-fade-in-up">
      <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
      <span>{message}</span>
    </div>
  ) : null;

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

              <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
                <div>
                  <label className="label text-gray-300">Email address</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => { setForm({ ...form, email: e.target.value }); setError(''); }}
                    className={`input bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:ring-brand-500 ${error && !form.email ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                    placeholder="your@email.com"
                    autoComplete="new-email"
                  />
                </div>
                <div>
                  <label className="label text-gray-300">Password</label>
                  <div className="relative">
                    <input
                      type={showPwd ? 'text' : 'password'}
                      value={form.password}
                      onChange={e => { setForm({ ...form, password: e.target.value }); setError(''); }}
                      className={`input bg-gray-700 border-gray-600 text-white placeholder-gray-500 pr-10 ${error && !form.password ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                      placeholder="Enter your password"
                      autoComplete="new-password"
                    />
                    <button type="button" onClick={() => setShowPwd(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200">
                      {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Error banner */}
                <ErrorBanner message={error} />

                {/* Forgot Password link */}
                <div className="text-right">
                  <button type="button"
                    onClick={openReset}
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
            </>
          ) : (
            /* ============ PASSWORD RESET FORM ============ */
            <>
              <div className="flex items-center gap-3 mb-5">
                <button onClick={closeReset}
                  className="p-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors">
                  <ArrowLeft size={16} />
                </button>
                <div>
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <ShieldCheck size={20} className="text-amber-400" />
                    Reset Password
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {resetStep === 1 ? 'Enter your email to get your security question' : 'Answer your security question'}
                  </p>
                </div>
              </div>

              {/* STEP 1: Enter email */}
              {resetStep === 1 && (
                <form onSubmit={handleFetchQuestion} autoComplete="off" className="space-y-4">
                  <div>
                    <label className="label text-gray-300">Email address</label>
                    <input
                      type="email"
                      value={resetForm.email}
                      onChange={e => { setResetForm({ ...resetForm, email: e.target.value }); setResetError(''); }}
                      className="input bg-gray-700 border-gray-600 text-white placeholder-gray-500"
                      placeholder="your@email.com"
                      autoComplete="off"
                    />
                  </div>

                  <ErrorBanner message={resetError} />

                  <button type="submit" disabled={resetLoading}
                    className="w-full justify-center py-2.5 flex items-center gap-2 font-medium rounded-xl text-sm px-4 bg-amber-600 hover:bg-amber-500 text-white transition-colors disabled:opacity-50">
                    <Search size={16} />
                    {resetLoading ? 'Looking up...' : 'Find My Account'}
                  </button>
                </form>
              )}

              {/* STEP 2: Answer question + new password */}
              {resetStep === 2 && (
                <form onSubmit={handleReset} autoComplete="off" className="space-y-4">
                  <div className="p-3 bg-amber-900/20 rounded-lg border border-amber-700/30">
                    <p className="text-xs text-amber-300/60 uppercase tracking-wide font-semibold mb-1">Your Security Question</p>
                    <p className="text-sm text-amber-200 font-medium">{securityQuestion}</p>
                  </div>

                  <div>
                    <label className="label text-amber-300 flex items-center gap-1.5">
                      <ShieldCheck size={13} />
                      Your Answer
                    </label>
                    <input
                      type="text"
                      value={resetForm.securityAnswer}
                      onChange={e => { setResetForm({ ...resetForm, securityAnswer: e.target.value }); setResetError(''); }}
                      className="input bg-gray-700 border-amber-600/50 text-white placeholder-gray-500 focus:ring-amber-500"
                      placeholder="Enter your answer"
                      autoComplete="off"
                    />
                    <p className="text-[10px] text-gray-500 mt-1">Answer is case-insensitive</p>
                  </div>

                  <div>
                    <label className="label text-gray-300">New Password</label>
                    <div className="relative">
                      <input
                        type={showResetPwd ? 'text' : 'password'}
                        value={resetForm.newPassword}
                        onChange={e => { setResetForm({ ...resetForm, newPassword: e.target.value }); setResetError(''); }}
                        className="input bg-gray-700 border-gray-600 text-white placeholder-gray-500 pr-10"
                        placeholder="Min. 6 characters"
                        minLength={6}
                        autoComplete="new-password"
                      />
                      <button type="button" onClick={() => setShowResetPwd(s => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200">
                        {showResetPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <ErrorBanner message={resetError} />

                  <button type="submit" disabled={resetLoading}
                    className="w-full justify-center py-2.5 mt-1 flex items-center gap-2 font-medium rounded-xl text-sm px-4 bg-amber-600 hover:bg-amber-500 text-white transition-colors disabled:opacity-50">
                    <ShieldCheck size={16} />
                    {resetLoading ? 'Resetting...' : 'Reset Password & Login'}
                  </button>
                </form>
              )}

              <div className="mt-4 p-3 bg-gray-700/30 rounded-lg border border-gray-600/30">
                <p className="text-[11px] text-gray-400 text-center">
                  💡 The security question was set during account registration.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
