import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Loader from '../components/Loader';
import ProductCard from '../components/ProductCard';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);

  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (category) params.set('category', category);
    return params.toString();
  }, [search, category]);

  useEffect(() => {
    api.get('/products/categories/all').then(({ data }) => setCategories(data));
  }, []);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/products${query ? `?${query}` : ''}`)
      .then(({ data }) => setProducts(data))
      .finally(() => setLoading(false));
  }, [query]);

  const handleAddToCart = async (product) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    await addToCart(product._id, 1);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-6">
        <h1 className="text-2xl font-black text-slate-900">Browse Products</h1>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <input
            type="text"
            placeholder="Search products"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="rounded-xl border border-slate-300 px-4 py-3 outline-none ring-orange-200 focus:ring"
          />
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="rounded-xl border border-slate-300 px-4 py-3 outline-none ring-orange-200 focus:ring"
          >
            <option value="">All categories</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setCategory('');
            }}
            className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
          >
            Reset filters
          </button>
        </div>
      </div>

      {loading ? (
        <Loader label="Fetching products..." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} onAddToCart={handleAddToCart} />
          ))}
        </div>
      )}

      {!loading && products.length === 0 && (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
          No products found for the selected filters.
        </p>
      )}
    </div>
  );
}

export default ProductsPage;
