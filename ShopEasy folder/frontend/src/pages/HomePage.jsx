import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Hero from '../components/Hero';
import Loader from '../components/Loader';
import ProductCard from '../components/ProductCard';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

function HomePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get('/products')
      .then(({ data }) => setProducts(data.slice(0, 4)))
      .finally(() => setLoading(false));
  }, []);

  const handleAddToCart = async (product) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    await addToCart(product._id, 1);
  };

  return (
    <div className="space-y-10">
      <Hero />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">Featured Products</h2>
          <button
            type="button"
            className="text-sm font-semibold text-orange-600"
            onClick={() => navigate('/products')}
          >
            View all
          </button>
        </div>

        {loading ? (
          <Loader label="Loading featured products..." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} onAddToCart={handleAddToCart} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default HomePage;
