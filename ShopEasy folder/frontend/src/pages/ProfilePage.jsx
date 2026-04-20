import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

function ProfilePage() {
  const { user, updateProfile, fetchProfile } = useAuth();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    password: '',
  });

  useEffect(() => {
    fetchProfile().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!user) return;
    setForm((prev) => ({
      ...prev,
      name: user.name || '',
      phone: user.phone || '',
      street: user.address?.street || '',
      city: user.address?.city || '',
      state: user.address?.state || '',
      zipCode: user.address?.zipCode || '',
      country: user.address?.country || '',
      password: '',
    }));
  }, [user]);

  const onSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    try {
      await updateProfile({
        name: form.name,
        phone: form.phone,
        address: {
          street: form.street,
          city: form.city,
          state: form.state,
          zipCode: form.zipCode,
          country: form.country,
        },
        password: form.password || undefined,
      });
      setMessage('Profile updated successfully.');
      setForm((prev) => ({ ...prev, password: '' }));
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update profile');
    }
  };

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-3xl space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
      <h1 className="text-3xl font-black text-slate-900">My Profile</h1>

      <div className="grid gap-3 md:grid-cols-2">
        <input
          required
          placeholder="Full name"
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          className="rounded-xl border border-slate-300 px-4 py-3"
        />
        <input
          placeholder="Phone"
          value={form.phone}
          onChange={(event) => setForm({ ...form, phone: event.target.value })}
          className="rounded-xl border border-slate-300 px-4 py-3"
        />
        <input
          placeholder="Street"
          value={form.street}
          onChange={(event) => setForm({ ...form, street: event.target.value })}
          className="rounded-xl border border-slate-300 px-4 py-3"
        />
        <input
          placeholder="City"
          value={form.city}
          onChange={(event) => setForm({ ...form, city: event.target.value })}
          className="rounded-xl border border-slate-300 px-4 py-3"
        />
        <input
          placeholder="State"
          value={form.state}
          onChange={(event) => setForm({ ...form, state: event.target.value })}
          className="rounded-xl border border-slate-300 px-4 py-3"
        />
        <input
          placeholder="Zip code"
          value={form.zipCode}
          onChange={(event) => setForm({ ...form, zipCode: event.target.value })}
          className="rounded-xl border border-slate-300 px-4 py-3"
        />
      </div>

      <input
        placeholder="Country"
        value={form.country}
        onChange={(event) => setForm({ ...form, country: event.target.value })}
        className="w-full rounded-xl border border-slate-300 px-4 py-3"
      />

      <input
        type="password"
        placeholder="New password (optional)"
        value={form.password}
        onChange={(event) => setForm({ ...form, password: event.target.value })}
        className="w-full rounded-xl border border-slate-300 px-4 py-3"
      />

      {message && <p className="text-sm font-medium text-green-600">{message}</p>}
      {error && <p className="text-sm font-medium text-red-600">{error}</p>}

      <button
        type="submit"
        className="rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-700"
      >
        Save Changes
      </button>
    </form>
  );
}

export default ProfilePage;
