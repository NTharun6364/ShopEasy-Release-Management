import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from '../api/axios';

function ResetPasswordPage() {
  const [form, setForm] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const resetToken = location.state?.resetToken || new URLSearchParams(location.search).get('token');

  const validatePassword = (password) => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    return password.length >= 6 && hasUpperCase && hasLowerCase && hasNumbers;
  };

  const getPasswordStrength = (password) => {
    if (!password) return '';
    if (password.length < 6) return 'weak';
    if (validatePassword(password)) return 'strong';
    return 'medium';
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm({ ...form, [name]: value });
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!form.newPassword || !form.confirmPassword) {
      setError('Both password fields are required');
      return;
    }

    if (form.newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!validatePassword(form.newPassword)) {
      setError('Password must contain uppercase, lowercase, and numbers');
      return;
    }

    if (!resetToken) {
      setError('Invalid reset token. Please request a new password reset.');
      return;
    }

    try {
      setLoading(true);
      await axios.post('/auth/reset-password', {
        token: resetToken,
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword,
      });

      setSuccess('Password reset successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!resetToken) {
    return (
      <div className="mx-auto w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-black text-red-600">Invalid Reset Link</h1>
        <p className="mt-2 text-sm text-slate-600">
          This password reset link is invalid or has expired. Please request a new one.
        </p>
        <Link
          to="/forgot-password"
          className="mt-4 inline-block rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-700"
        >
          Request New Link
        </Link>
      </div>
    );
  }

  const passwordStrength = getPasswordStrength(form.newPassword);

  return (
    <div className="mx-auto w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-3xl font-black text-slate-900">Create New Password</h1>
      <p className="mt-2 text-sm text-slate-600">Enter a strong password to secure your account.</p>

      {success ? (
        <div className="mt-6 rounded-xl bg-green-50 border border-green-200 p-4">
          <p className="text-sm font-medium text-green-800">{success}</p>
          <p className="mt-2 text-xs text-green-700">Redirecting to login...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {/* New Password Field */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">New Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                name="newPassword"
                placeholder="Enter new password"
                value={form.newPassword}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-12 outline-none ring-orange-200 focus:ring"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-500 hover:text-slate-700"
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {form.newPassword && (
              <div className="mt-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`h-2 flex-1 rounded-full ${
                      passwordStrength === 'weak'
                        ? 'bg-red-500'
                        : passwordStrength === 'medium'
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                    }`}
                  />
                  <span
                    className={`text-xs font-medium ${
                      passwordStrength === 'weak'
                        ? 'text-red-600'
                        : passwordStrength === 'medium'
                          ? 'text-yellow-600'
                          : 'text-green-600'
                    }`}
                  >
                    {passwordStrength === 'weak'
                      ? 'Weak'
                      : passwordStrength === 'medium'
                        ? 'Medium'
                        : 'Strong'}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-600">
                  Password must contain at least 6 characters, uppercase, lowercase, and numbers
                </p>
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                required
                name="confirmPassword"
                placeholder="Confirm new password"
                value={form.confirmPassword}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-12 outline-none ring-orange-200 focus:ring"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-3 text-slate-500 hover:text-slate-700"
              >
                {showConfirm ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {form.confirmPassword && form.newPassword !== form.confirmPassword && (
              <p className="mt-1 text-xs text-red-600">Passwords do not match</p>
            )}
            {form.confirmPassword && form.newPassword === form.confirmPassword && (
              <p className="mt-1 text-xs text-green-600">✓ Passwords match</p>
            )}
          </div>

          {error && <p className="text-sm font-medium text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}

          <button
            type="submit"
            disabled={loading || !validatePassword(form.newPassword) || form.newPassword !== form.confirmPassword}
            className="w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-700 disabled:opacity-70"
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      )}

      <p className="mt-6 text-sm text-slate-600">
        <Link to="/login" className="font-semibold text-orange-600 hover:text-orange-700">
          Back to Login
        </Link>
      </p>
    </div>
  );
}

export default ResetPasswordPage;
