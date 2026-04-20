import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { formatCurrency } from '../utils/format';

function CheckoutPage() {
  const { user } = useAuth();
  const { cart, summary, refreshCart } = useCart();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    street: user?.address?.street || '',
    city: user?.address?.city || '',
    state: user?.address?.state || '',
    zipCode: user?.address?.zipCode || '',
    country: user?.address?.country || '',
    paymentMethod: 'Cash On Delivery',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const placeOrder = async (event) => {
    event.preventDefault();

    if (cart.items.length === 0) {
      setError('Your cart is empty.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/orders', {
        shippingAddress: {
          street: form.street,
          city: form.city,
          state: form.state,
          zipCode: form.zipCode,
          country: form.country,
        },
        paymentMethod: form.paymentMethod,
      });

      await refreshCart();
      navigate('/orders');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to place order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <form onSubmit={placeOrder} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
        <h1 className="text-2xl font-black text-slate-900">Checkout</h1>

        <div className="grid gap-3 md:grid-cols-2">
          <input
            required
            placeholder="Street"
            value={form.street}
            onChange={(event) => setForm({ ...form, street: event.target.value })}
            className="rounded-xl border border-slate-300 px-4 py-3"
          />
          <input
            required
            placeholder="City"
            value={form.city}
            onChange={(event) => setForm({ ...form, city: event.target.value })}
            className="rounded-xl border border-slate-300 px-4 py-3"
          />
          <input
            required
            placeholder="State"
            value={form.state}
            onChange={(event) => setForm({ ...form, state: event.target.value })}
            className="rounded-xl border border-slate-300 px-4 py-3"
          />
          <input
            required
            placeholder="Zip code"
            value={form.zipCode}
            onChange={(event) => setForm({ ...form, zipCode: event.target.value })}
            className="rounded-xl border border-slate-300 px-4 py-3"
          />
        </div>

        <input
          required
          placeholder="Country"
          value={form.country}
          onChange={(event) => setForm({ ...form, country: event.target.value })}
          className="w-full rounded-xl border border-slate-300 px-4 py-3"
        />

        <select
          value={form.paymentMethod}
          onChange={(event) => setForm({ ...form, paymentMethod: event.target.value })}
          className="w-full rounded-xl border border-slate-300 px-4 py-3"
        >
          <option value="Cash On Delivery">Cash On Delivery</option>
          <option value="Card">Credit or Debit Card</option>
          <option value="UPI">UPI</option>
        </select>

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-700 disabled:opacity-70"
        >
          {loading ? 'Placing order...' : 'Place order'}
        </button>
      </form>

      <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-xl font-bold text-slate-900">Summary</h2>
        <div className="mt-4 space-y-2 text-sm text-slate-600">
          {cart.items.map((item) => (
            <div key={item.product._id} className="flex items-center justify-between gap-2">
              <span className="line-clamp-1">{item.product.name}</span>
              <span>x{item.quantity}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4 text-lg font-black text-slate-900">
          <span>Total</span>
          <span>{formatCurrency(summary.subtotal)}</span>
        </div>
      </aside>
    </div>
  );
}

export default CheckoutPage;
