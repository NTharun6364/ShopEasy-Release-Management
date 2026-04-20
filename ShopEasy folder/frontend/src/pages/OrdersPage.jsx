import { useEffect, useState } from 'react';
import api from '../api/axios';
import Loader from '../components/Loader';
import { formatCurrency } from '../utils/format';

function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/orders')
      .then(({ data }) => setOrders(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader label="Loading your orders..." />;

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-black text-slate-900">My Orders</h1>

      {orders.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
          No orders yet.
        </p>
      ) : (
        orders.map((order) => (
          <article key={order._id} className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-slate-600">Order ID: {order._id}</p>
              <p className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
                {order.status}
              </p>
            </div>
            <div className="mt-3 space-y-2 text-sm text-slate-700">
              {order.items.map((item) => (
                <p key={`${order._id}-${item.product}`}>
                  {item.name} x {item.quantity}
                </p>
              ))}
            </div>
            <p className="mt-4 text-base font-bold text-slate-900">Total: {formatCurrency(order.totalAmount)}</p>
          </article>
        ))
      )}
    </div>
  );
}

export default OrdersPage;
