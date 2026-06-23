import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchAdminCustomers } from '../../api/adminCustomers';

const HAS_ORDERS_OPTIONS = [
  { value: '', label: 'All Customers' },
  { value: 'true', label: 'With Orders' },
  { value: 'false', label: 'No Orders' },
];

export default function AdminCustomerListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get('filter[search]') || '');

  const page = Number(searchParams.get('page')) || 1;
  const search = searchParams.get('filter[search]') || '';
  const dateFrom = searchParams.get('filter[date_from]') || '';
  const dateTo = searchParams.get('filter[date_to]') || '';
  const hasOrders = searchParams.get('filter[has_orders]') || '';

  const { data, isLoading } = useQuery({
    queryKey: ['admin-customers', page, search, dateFrom, dateTo, hasOrders],
    queryFn: () =>
      fetchAdminCustomers({
        page,
        search: search || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        has_orders: hasOrders || undefined,
      }),
  });

  function updateFilters(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    params.set('page', '1');
    setSearchParams(params);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    updateFilters({ 'filter[search]': searchInput });
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-secondary-900">Customers</h1>
        <p className="mt-1 text-sm text-secondary-500">Manage customer accounts</p>
      </div>

      <div className="mb-6 rounded-lg border border-secondary-200 bg-white p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-40">
            <label className="mb-1 block text-xs font-medium text-secondary-600">Order History</label>
            <select
              value={hasOrders}
              onChange={(e) => updateFilters({ 'filter[has_orders]': e.target.value })}
              className="w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              {HAS_ORDERS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-secondary-600">Registered From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => updateFilters({ 'filter[date_from]': e.target.value })}
              className="rounded-lg border border-secondary-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-secondary-600">Registered To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => updateFilters({ 'filter[date_to]': e.target.value })}
              className="rounded-lg border border-secondary-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          <form onSubmit={handleSearch} className="flex-1 min-w-48">
            <label className="mb-1 block text-xs font-medium text-secondary-600">Search</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Name or email..."
                className="flex-1 rounded-lg border border-secondary-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              <button
                type="submit"
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
              >
                Search
              </button>
            </div>
          </form>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse rounded-lg border border-secondary-200 bg-white p-4">
              <div className="mb-2 h-4 w-64 rounded bg-secondary-200" />
              <div className="h-4 w-32 rounded bg-secondary-200" />
            </div>
          ))}
        </div>
      ) : data && data.data.length > 0 ? (
        <>
          <div className="overflow-x-auto rounded-lg border border-secondary-200">
            <table className="min-w-full divide-y divide-secondary-200">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-secondary-500">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-secondary-500">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-secondary-500">Registered</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-secondary-500">Orders</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-secondary-500">Total Spent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-secondary-500">Status</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100 bg-white">
                {data.data.map((customer) => (
                  <tr key={customer.uuid} className="hover:bg-secondary-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-secondary-900">
                      {customer.name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-secondary-600">
                      {customer.email}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-secondary-600">
                      {new Date(customer.created_at).toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-secondary-900">
                      {customer.orders_count}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-secondary-900">
                      {customer.total_spent_formatted}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          customer.is_suspended
                            ? 'bg-danger-100 text-danger-700'
                            : 'bg-success-100 text-success-700'
                        }`}
                      >
                        {customer.is_suspended ? 'Suspended' : 'Active'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <Link
                        to={`/admin/customers/${customer.uuid}`}
                        className="text-sm font-medium text-primary-600 hover:text-primary-800"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.meta.last_page > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => {
                  const params = new URLSearchParams(searchParams);
                  params.set('page', String(page - 1));
                  setSearchParams(params);
                }}
                className="rounded-lg border border-secondary-300 px-4 py-2 text-sm font-medium text-secondary-600 hover:bg-secondary-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              {Array.from({ length: data.meta.last_page }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    const params = new URLSearchParams(searchParams);
                    params.set('page', String(p));
                    setSearchParams(params);
                  }}
                  className={`rounded-lg px-3 py-2 text-sm font-medium ${
                    p === page
                      ? 'bg-primary-600 text-white'
                      : 'border border-secondary-300 text-secondary-600 hover:bg-secondary-50'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                disabled={page >= data.meta.last_page}
                onClick={() => {
                  const params = new URLSearchParams(searchParams);
                  params.set('page', String(page + 1));
                  setSearchParams(params);
                }}
                className="rounded-lg border border-secondary-300 px-4 py-2 text-sm font-medium text-secondary-600 hover:bg-secondary-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-lg border border-secondary-200 bg-white p-12 text-center">
          <p className="text-sm text-secondary-500">No customers found.</p>
        </div>
      )}
    </div>
  );
}
