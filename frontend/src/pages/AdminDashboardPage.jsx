import { useEffect, useState } from 'react';
import api from '../api/axios';
import Loader from '../components/Loader';
import { formatCurrency } from '../utils/format';

const defaultProduct = {
  name: '',
  description: '',
  price: '',
  category: '',
  imageUrl: '',
  stock: '',
};

function AdminDashboardPage() {
  const [summary, setSummary] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(defaultProduct);
  const [editingId, setEditingId] = useState(null);

  const loadDashboard = async () => {
    const [dashboardRes, productsRes, ordersRes] = await Promise.all([
      api.get('/admin/dashboard'),
      api.get('/products'),
      api.get('/admin/orders'),
    ]);

    setSummary(dashboardRes.data);
    setProducts(productsRes.data);
    setOrders(ordersRes.data);
  };

  useEffect(() => {
    loadDashboard().finally(() => setLoading(false));
  }, []);

  const onSubmitProduct = async (event) => {
    event.preventDefault();

    const payload = {
      ...form,
      price: Number(form.price),
      stock: Number(form.stock),
    };

    if (editingId) {
      await api.put(`/products/${editingId}`, payload);
    } else {
      await api.post('/products', payload);
    }

    setForm(defaultProduct);
    setEditingId(null);
    await loadDashboard();
  };

  const onEditProduct = (product) => {
    setEditingId(product._id);
    setForm({
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      imageUrl: product.imageUrl,
      stock: product.stock,
    });
  };

  const onDeleteProduct = async (productId) => {
    await api.delete(`/products/${productId}`);
    await loadDashboard();
  };

  const onStatusChange = async (orderId, status) => {
    await api.patch(`/admin/orders/${orderId}/status`, { status });
    await loadDashboard();
  };

  if (loading) return <Loader label="Loading admin dashboard..." />;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-black text-slate-900">Admin Dashboard</h1>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Products</p>
          <p className="text-2xl font-black text-slate-900">{summary.productCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Orders</p>
          <p className="text-2xl font-black text-slate-900">{summary.orderCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Pending</p>
          <p className="text-2xl font-black text-slate-900">{summary.pendingOrders}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Revenue</p>
          <p className="text-2xl font-black text-slate-900">{formatCurrency(summary.totalRevenue)}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-xl font-bold text-slate-900">{editingId ? 'Edit Product' : 'Add Product'}</h2>
        <form onSubmit={onSubmitProduct} className="mt-4 grid gap-3 md:grid-cols-2">
          <input required placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-xl border border-slate-300 px-4 py-3" />
          <input required placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="rounded-xl border border-slate-300 px-4 py-3" />
          <input required type="number" step="0.01" placeholder="Price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="rounded-xl border border-slate-300 px-4 py-3" />
          <input required type="number" placeholder="Stock" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="rounded-xl border border-slate-300 px-4 py-3" />
          <input required placeholder="Image URL" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} className="rounded-xl border border-slate-300 px-4 py-3 md:col-span-2" />
          <textarea required placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="rounded-xl border border-slate-300 px-4 py-3 md:col-span-2" rows={3} />
          <div className="flex gap-2 md:col-span-2">
            <button type="submit" className="rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-700">
              {editingId ? 'Update Product' : 'Create Product'}
            </button>
            {editingId && (
              <button type="button" className="rounded-xl border border-slate-300 px-5 py-3" onClick={() => { setEditingId(null); setForm(defaultProduct); }}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-900">Products</h2>
        <div className="grid gap-3">
          {products.map((product) => (
            <div key={product._id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-semibold text-slate-900">{product.name}</p>
                <p className="text-sm text-slate-600">{product.category} | {formatCurrency(product.price)}</p>
              </div>
              <div className="flex gap-2">
                <button type="button" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" onClick={() => onEditProduct(product)}>
                  Edit
                </button>
                <button type="button" className="rounded-lg bg-red-500 px-3 py-2 text-sm text-white" onClick={() => onDeleteProduct(product._id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-900">Orders</h2>
        <div className="grid gap-3">
          {orders.map((order) => (
            <div key={order._id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-slate-600">{order.user?.name} ({order.user?.email})</p>
                <p className="text-sm font-bold text-slate-900">{formatCurrency(order.totalAmount)}</p>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <select
                  value={order.status}
                  onChange={(event) => onStatusChange(order._id, event.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option>Pending</option>
                  <option>Processing</option>
                  <option>Shipped</option>
                  <option>Delivered</option>
                  <option>Cancelled</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default AdminDashboardPage;
