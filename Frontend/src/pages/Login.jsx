import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../store/authSlice';
import { authApi } from '../services/api';
import { Mail, Lock, Sparkles, AlertCircle, ArrowRight, Check } from 'lucide-react';
import OtpModal from '../components/OtpModal';

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Password reset flow state
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetStep, setResetStep] = useState('email'); // 'email' | 'otp' | 'newPassword'
  const [newPassword, setNewPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccessMsg, setResetSuccessMsg] = useState('');

  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Same password complexity rules as Register, applied to the new password
  const rules = [
    { label: 'At least 8 characters', valid: newPassword.length >= 8 },
    { label: 'One uppercase letter (A-Z)', valid: /[A-Z]/.test(newPassword) },
    { label: 'One lowercase letter (a-z)', valid: /[a-z]/.test(newPassword) },
    { label: 'One number (0-9)', valid: /[0-9]/.test(newPassword) },
    { label: 'One special char (!@#$%^&*?)', valid: /[!@#$%^&*?]/.test(newPassword) },
  ];

  const closeResetFlow = () => {
    setResetModalOpen(false);
    setResetStep('email');
    setResetEmail('');
    setNewPassword('');
    setResetError('');
    setResetSuccessMsg('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await authApi.login(formData);
      const accessToken = res.data?.data?.accessToken;

      dispatch(setCredentials({
        user: { email: formData.email },
        accessToken,
      }));

      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetRequest = async (e) => {
    e.preventDefault();
    if (!resetEmail) return;
    setLoading(true);
    setResetError('');

    try {
      await authApi.requestOtp({ email: resetEmail, type: 'password-reset' });
      setResetStep('otp');
    } catch (err) {
      setResetError(err.response?.data?.message || 'Email not found or too many requests.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChangeSubmit = async (e) => {
    e.preventDefault();
    if (!rules.every((r) => r.valid)) {
      setResetError('Please satisfy all password complexity requirements.');
      return;
    }

    setLoading(true);
    setResetError('');

    try {
      await authApi.changePassword({ email: resetEmail, password: newPassword });
      setResetSuccessMsg('Password updated successfully! You can now login.');
      setTimeout(closeResetFlow, 1500);
    } catch (err) {
      setResetError(err.response?.data?.message || 'Password update failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 shadow-xl shadow-indigo-500/30 mb-4">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Welcome Back</h2>
          <p className="text-sm text-slate-400 mt-1.5">Sign in to access your AI Quiz Dashboard</p>
        </div>

        <div className="glass-panel p-8 rounded-3xl border border-slate-800 shadow-2xl">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-11 pr-4 py-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => { setResetModalOpen(true); setError(''); }}
                  className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-11 pr-4 py-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 disabled:opacity-50 shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-400 pt-5 border-t border-slate-800/80">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-indigo-400 hover:text-indigo-300">
              Create account
            </Link>
          </div>
        </div>

      </div>

      {/* Forgot Password — email + new password steps use the card modal */}
      {resetModalOpen && (resetStep === 'email' || resetStep === 'newPassword') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md p-6 rounded-2xl border border-slate-800 relative">
            <h3 className="text-lg font-bold text-white mb-2">Reset Your Password</h3>

            {resetError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{resetError}</span>
              </div>
            )}

            {resetSuccessMsg && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 text-emerald-400 text-xs">
                {resetSuccessMsg}
              </div>
            )}

            {resetStep === 'email' && (
              <form onSubmit={handleResetRequest} className="space-y-4">
                <p className="text-xs text-slate-400">Enter your registered email to receive an OTP verification code.</p>
                <input
                  type="email"
                  required
                  placeholder="Enter registered email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={closeResetFlow}
                    className="flex-1 py-2 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold disabled:opacity-50"
                  >
                    {loading ? 'Sending...' : 'Send OTP'}
                  </button>
                </div>
              </form>
            )}

            {resetStep === 'newPassword' && (
              <form onSubmit={handlePasswordChangeSubmit} className="space-y-4">
                <p className="text-xs text-slate-400">Enter a new password.</p>
                <input
                  type="password"
                  required
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm"
                />

                {/* Same password checklist pattern as Register */}
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1">Password requirements:</span>
                  {rules.map((rule, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs">
                      <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${rule.valid ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-500'}`}>
                        {rule.valid ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : '•'}
                      </div>
                      <span className={rule.valid ? 'text-emerald-400 font-medium' : 'text-slate-500'}>
                        {rule.label}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={loading || !rules.every((r) => r.valid)}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* OTP step — rendered flat, same as Register, not nested inside the card modal */}
      {resetModalOpen && resetStep === 'otp' && (
        <OtpModal
          isOpen={true}
          onClose={closeResetFlow}
          email={resetEmail}
          type="password-reset"
          onVerified={() => setResetStep('newPassword')}
        />
      )}
    </div>
  );
}