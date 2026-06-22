import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import CartIcon from './CartIcon';
import CartDrawer from './CartDrawer';
import ToastContainer from './Toast';

export default function Layout() {
  const { isAuthenticated, isAdmin, user, logout } = useAuthStore();
  const location = useLocation();

  function handleLogout() {
    logout();
  }

  const navLinks = [
    { to: '/catalog', label: 'Catalog' },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-secondary-50">
      <header className="sticky top-0 z-30 border-b border-secondary-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="text-xl font-bold text-primary-600">
            Pharos
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`text-sm font-medium transition-colors ${
                  location.pathname.startsWith(link.to)
                    ? 'text-primary-600'
                    : 'text-secondary-600 hover:text-secondary-900'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <CartIcon />

            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link
                  to={isAdmin ? '/admin' : '/account'}
                  className="text-sm font-medium text-secondary-600 hover:text-secondary-900"
                >
                  {user?.name}
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-lg border border-secondary-300 px-3 py-1.5 text-sm font-medium text-secondary-600 hover:bg-secondary-50"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-secondary-200 bg-white py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-secondary-500">
            &copy; {new Date().getFullYear()} Pharos Commerce. All rights reserved.
          </p>
        </div>
      </footer>

      <CartDrawer />
      <ToastContainer />
    </div>
  );
}
