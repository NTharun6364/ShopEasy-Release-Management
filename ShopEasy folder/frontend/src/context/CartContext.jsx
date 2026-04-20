import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState({ items: [] });
  const [loading, setLoading] = useState(false);

  const refreshCart = async () => {
    if (!isAuthenticated) {
      setCart({ items: [] });
      return;
    }

    const { data } = await api.get('/cart');
    setCart(data);
  };

  const addToCart = async (productId, quantity = 1) => {
    const { data } = await api.post('/cart', { productId, quantity });
    setCart(data);
  };

  const updateQuantity = async (productId, quantity) => {
    const { data } = await api.put(`/cart/${productId}`, { quantity });
    setCart(data);
  };

  const removeItem = async (productId) => {
    const { data } = await api.delete(`/cart/${productId}`);
    setCart(data);
  };

  const clearCart = async () => {
    const { data } = await api.delete('/cart');
    setCart(data);
  };

  useEffect(() => {
    setLoading(true);
    refreshCart().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const summary = useMemo(() => {
    const itemCount = cart.items.reduce((count, item) => count + item.quantity, 0);
    const subtotal = cart.items.reduce((sum, item) => sum + item.quantity * item.product.price, 0);
    return { itemCount, subtotal };
  }, [cart]);

  const value = useMemo(
    () => ({
      cart,
      loading,
      summary,
      refreshCart,
      addToCart,
      updateQuantity,
      removeItem,
      clearCart,
    }),
    [cart, loading, summary]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}
