import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const navLinkClass = ({ isActive }) =>
  `rounded-full px-3 py-1.5 text-sm font-medium transition ${
    isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-200'
  }`;

function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const { summary } = useCart();
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
        <Link to="/" className="text-2xl font-black tracking-tight text-slate-900">
          ShopEasy
        </Link>

        <button
          type="button"
          className="rounded-lg border border-slate-300 px-3 py-1 text-sm md:hidden"
          onClick={() => setOpen((value) => !value)}
        >
          Menu
        </button>

        <nav className={`${open ? 'flex' : 'hidden'} absolute left-0 top-full w-full flex-col gap-2 border-b border-slate-200 bg-white p-4 md:static md:flex md:w-auto md:flex-row md:items-center md:border-0 md:bg-transparent md:p-0`}>
          <NavLink to="/" className={navLinkClass} onClick={() => setOpen(false)}>
            Home
          </NavLink>
          <NavLink to="/products" className={navLinkClass} onClick={() => setOpen(false)}>
            Products
          </NavLink>
          {isAuthenticated && (
            <>
              <NavLink to="/cart" className={navLinkClass} onClick={() => setOpen(false)}>
                Cart ({summary.itemCount})
              </NavLink>
              <NavLink to="/orders" className={navLinkClass} onClick={() => setOpen(false)}>
                Orders
              </NavLink>
              <NavLink to="/profile" className={navLinkClass} onClick={() => setOpen(false)}>
                Profile
              </NavLink>
            </>
          )}
          {user?.role === 'admin' && (
            <NavLink to="/admin" className={navLinkClass} onClick={() => setOpen(false)}>
              Admin
            </NavLink>
          )}
          {isAuthenticated ? (
            <button
              type="button"
              onClick={onLogout}
              className="rounded-full bg-orange-500 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-orange-600"
            >
              Logout
            </button>
          ) : (
            <NavLink to="/login" className={navLinkClass} onClick={() => setOpen(false)}>
              Login
            </NavLink>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
