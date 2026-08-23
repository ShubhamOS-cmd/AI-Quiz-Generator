import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../store/authSlice';
import { authApi } from '../services/api';
import { User, Mail, Lock, Sparkles, AlertCircle, ArrowRight, ShieldCheck, Check } from 'lucide-react';
import OtpModal from '../components/OtpModal';

export default function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showOtpModal, setShowOtpModal] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Password rules validation display
  const pwd = formData.password;
  const rules = [
    { label: 'At least 8 characters', valid: pwd.length >= 8 },
    { label: 'One uppercase letter (A-Z)', valid: /[A-Z]/.test(pwd) },
    { label: 'One lowercase letter (a-z)', valid: /[a-z]/.test(pwd) },
    { label: 'One number (0-9)', valid: /[0-9]/.test(pwd) },
    { label: 'One special char (!@#$%^&*?)', valid: /[!@#$%^&*?]/.test(pwd) },
  ];

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!rules.every((r) => r.valid)) {
      setError('Please satisfy all password complexity requirements.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await authApi.requestOtp({ email: formData.email, type: 'register' });
      setShowOtpModal(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP. Check if email already exists.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerifiedAndRegister = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await authApi.register(formData);
      const accessToken = res.data?.data?.accessToken;

      dispatch(setCredentials({
        user: { username: formData.username, email: formData.email },
        accessToken,
      }));

      setShowOtpModal(false);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed after OTP verification.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 shadow-xl shadow-indigo-500/30 mb-4">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Create Account</h2>
          <p className="text-sm text-slate-400 mt-1.5">Join the AI-powered quiz assessment platform</p>
        </div>

        <div className="glass-panel p-8 rounded-3xl border border-slate-800 shadow-2xl">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Username
              </label>
              <div className="relative">
                <User className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="johndoe"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full pl-11 pr-4 py-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
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
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
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

            {/* Password Validation Checklist */}
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
              className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 disabled:opacity-50 shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 group mt-2"
            >
              {loading ? (
                <span>Sending OTP...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify Email & Register</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-400 pt-5 border-t border-slate-800/80">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-indigo-400 hover:text-indigo-300">
              Sign In
            </Link>
          </div>
        </div>

      </div>

      <OtpModal
        isOpen={showOtpModal}
        onClose={() => setShowOtpModal(false)}
        email={formData.email}
        type="register"
        onVerified={handleOtpVerifiedAndRegister}
      />
    </div>
  );
}