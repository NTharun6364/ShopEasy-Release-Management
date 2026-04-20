import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../api/axios';

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const navigate = useNavigate();

  const validateEmail = (emailValue) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailValue);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    // Client-side validation
    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post('/auth/forgot-password', { email });

      setSuccess('Password reset link has been sent to your email!');
      setResetToken(response.data.resetToken);
      setEmail('');

      // Auto-redirect to reset password page after 2 seconds
      setTimeout(() => {
        navigate('/reset-password', { state: { resetToken: response.data.resetToken } });
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to process password reset request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-3xl font-black text-slate-900">Reset Password</h1>
      <p className="mt-2 text-sm text-slate-600">
        Enter your email and we'll send you a link to reset your password.
      </p>

      {success ? (
        <div className="mt-6 rounded-xl bg-green-50 border border-green-200 p-4">
          <p className="text-sm font-medium text-green-800">{success}</p>
          <p className="mt-2 text-xs text-green-700">Redirecting to reset password...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
            <input
              type="email"
              required
              placeholder="Enter your email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setError('');
              }}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none ring-orange-200 focus:ring"
            />
          </div>

          {error && <p className="text-sm font-medium text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-700 disabled:opacity-70"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
      )}

      <p className="mt-6 text-sm text-slate-600">
        Remember your password?{' '}
        <Link to="/login" className="font-semibold text-orange-600 hover:text-orange-700">
          Back to Login
        </Link>
      </p>
    </div>
  );
}

export default ForgotPasswordPage;
