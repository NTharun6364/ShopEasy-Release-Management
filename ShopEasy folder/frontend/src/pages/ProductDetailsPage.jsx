import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import Loader from '../components/Loader';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { formatCurrency } from '../utils/format';

function ProductDetailsPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    api
      .get(`/products/${id}`)
      .then(({ data }) => setProduct(data))
      .catch(() => setError('Unable to load product details'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    await addToCart(product._id, quantity);
    navigate('/cart');
  };

  if (loading) return <Loader label="Loading product..." />;
  if (error) return <p className="text-red-600">{error}</p>;
  if (!product) return <p className="text-slate-600">Product not found</p>;

  return (
    <div className="grid gap-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:grid-cols-2">
      <img src={product.imageUrl} alt={product.name} className="h-full w-full rounded-2xl object-cover" />

      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{product.category}</p>
        <h1 className="text-3xl font-black text-slate-900">{product.name}</h1>
        <p className="text-base text-slate-700">{product.description}</p>
        <p className="text-3xl font-black text-slate-900">{formatCurrency(product.price)}</p>
        <p className="text-sm text-slate-500">Stock available: {product.stock}</p>

        <div className="flex max-w-xs items-center gap-3">
          <label htmlFor="qty" className="text-sm font-medium text-slate-700">
            Quantity
          </label>
          <input
            id="qty"
            type="number"
            min={1}
            max={product.stock || 20}
            value={quantity}
            onChange={(event) => setQuantity(Number(event.target.value))}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none ring-orange-200 focus:ring"
          />
        </div>

        <button
          type="button"
          onClick={handleAddToCart}
          className="rounded-xl bg-orange-500 px-5 py-3 font-semibold text-white transition hover:bg-orange-600"
        >
          Add to cart
        </button>
      </div>
    </div>
  );
}

export default ProductDetailsPage;
