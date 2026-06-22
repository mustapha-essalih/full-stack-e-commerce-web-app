import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchAdminOrders } from '../../api/orders';
import OrderStatusBadge from '../../components/OrderStatusBadge';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'refunded', label: 'Refunded' },
];

export default function AdminOrderListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get('filter[search]') || '');

  const page = Number(searchParams.get('page')) || 1;
  const statusFilter = searchParams.get('filter[status]') || '';
  const dateFrom = searchParams.get('filter[date_from]') || '';
  const dateTo = searchParams.get('filter[date_to]') || '';
  const search = searchParams.get('filter[search]') || '';

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', page, statusFilter, dateFrom, dateTo, search],
    queryFn: () =>
      fetchAdminOrders({
        page,
        status: statusFilter || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        search: search || undefined,
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
        <h1 className="text-2xl font-bold text-secondary-900">Orders</h1>
        <p className="mt-1 text-sm text-secondary-500">Manage customer orders</p>
      </div>

      <div className="mb-6 rounded-lg border border-secondary-200 bg-white p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-40">
            <label className="mb-1 block text-xs font-medium text-secondary-600">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => updateFilters({ 'filter[status]': e.target.value })}
              className="w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-secondary-600">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => updateFilters({ 'filter[date_from]': e.target.value })}
              className="rounded-lg border border-secondary-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-secondary-600">To</label>
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
                placeholder="Order UUID or customer email..."
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
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-secondary-500">Order</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-secondary-500">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-secondary-500">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-secondary-500">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-secondary-500">Status</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100 bg-white">
                {data.data.map((order) => (
                  <tr key={order.uuid} className="hover:bg-secondary-50">
                    <td className="whitespace-nowrap px-6 py-4 font-mono text-sm text-secondary-900">
                      #{order.uuid.slice(0, 8)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-secondary-600">
                      {order.user_id ? `User #${order.user_id}` : 'Guest'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-secondary-600">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-secondary-900">
                      {order.total_formatted}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <Link
                        to={`/admin/orders/${order.uuid}`}
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
          <p className="text-sm text-secondary-500">No orders found.</p>
        </div>
      )}
    </div>
  );
}
