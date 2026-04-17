import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('shopeasy_token'));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('shopeasy_user');
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(false);

  const persistAuth = (nextToken, nextUser) => {
    setToken(nextToken);
    setUser(nextUser);

    if (nextToken) {
      localStorage.setItem('shopeasy_token', nextToken);
    } else {
      localStorage.removeItem('shopeasy_token');
    }

    if (nextUser) {
      localStorage.setItem('shopeasy_user', JSON.stringify(nextUser));
    } else {
      localStorage.removeItem('shopeasy_user');
    }
  };

  const login = async (payload) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', payload);
      persistAuth(data.token, data.user);
      return data.user;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (payload) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', payload);
      persistAuth(data.token, data.user);
      return data.user;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    persistAuth(null, null);
  };

  const fetchProfile = async () => {
    if (!token) return null;
    const { data } = await api.get('/profile');
    const nextUser = {
      ...user,
      ...data,
      id: data._id || user?.id,
    };
    setUser(nextUser);
    localStorage.setItem('shopeasy_user', JSON.stringify(nextUser));
    return nextUser;
  };

  const updateProfile = async (payload) => {
    const { data } = await api.put('/profile', payload);
    const nextUser = { ...user, ...data, id: data.id || data._id || user?.id };
    setUser(nextUser);
    localStorage.setItem('shopeasy_user', JSON.stringify(nextUser));
    return nextUser;
  };

  useEffect(() => {
    if (!token) return;
    fetchProfile().catch(() => logout());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token),
      loading,
      login,
      signup,
      logout,
      fetchProfile,
      updateProfile,
    }),
    [token, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
