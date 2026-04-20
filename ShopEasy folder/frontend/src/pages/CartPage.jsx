import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { formatCurrency } from '../utils/format';

function CartPage() {
  const { cart, summary, updateQuantity, removeItem } = useCart();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black text-slate-900">Your Cart</h1>

      {cart.items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
          Cart is empty. Add some products to continue.
        </p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-4">
            {cart.items.map((item) => (
              <div key={item.product._id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 md:flex-row">
                <img
                  src={item.product.imageUrl}
                  alt={item.product.name}
                  className="h-24 w-24 rounded-xl object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900">{item.product.name}</h3>
                  <p className="text-sm text-slate-600">{formatCurrency(item.product.price)}</p>
                  <div className="mt-3 flex items-center gap-3">
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(event) => updateQuantity(item.product._id, Number(event.target.value))}
                      className="w-24 rounded-lg border border-slate-300 px-2 py-1"
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(item.product._id)}
                      className="text-sm font-semibold text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <p className="text-right text-lg font-black text-slate-900">
                  {formatCurrency(item.product.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>

          <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-xl font-bold text-slate-900">Order summary</h2>
            <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
              <span>Items</span>
              <span>{summary.itemCount}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-base font-semibold text-slate-900">
              <span>Subtotal</span>
              <span>{formatCurrency(summary.subtotal)}</span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/checkout')}
              className="mt-5 w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-700"
            >
              Checkout
            </button>
          </aside>
        </div>
      )}
    </div>
  );
}

export default CartPage;
