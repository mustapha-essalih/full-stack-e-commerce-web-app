import { NavLink, Outlet } from 'react-router-dom';

const sidebarLinks = [
  { to: '/account', label: 'Profile', end: true },
  { to: '/account/addresses', label: 'Addresses' },
  { to: '/account/wishlist', label: 'Wishlist' },
  { to: '/account/orders', label: 'Orders' },
  { to: '/account/reviews', label: 'Reviews' },
];

export default function AccountLayout() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-2xl font-bold text-secondary-900">My Account</h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        <nav className="lg:col-span-1">
          <ul className="space-y-1 rounded-lg border border-secondary-200 bg-white p-2">
            {sidebarLinks.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    `block rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="lg:col-span-3">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
