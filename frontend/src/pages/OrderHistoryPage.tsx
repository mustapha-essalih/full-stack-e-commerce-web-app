import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchCustomerOrders } from '../api/orders';
import { formatPrice } from '../utils/format';
import OrderStatusBadge from '../components/OrderStatusBadge';

export default function OrderHistoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page')) || 1;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['customer-orders', page],
    queryFn: () => fetchCustomerOrders(page),
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-2xl font-bold text-secondary-900">Order History</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-lg border border-secondary-200 bg-white p-6">
              <div className="mb-3 h-4 w-48 rounded bg-secondary-200" />
              <div className="h-4 w-32 rounded bg-secondary-200" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-danger-200 bg-danger-50 p-4 text-center text-sm text-danger-600">
          Failed to load orders. Please try again later.
        </div>
      </div>
    );
  }

  const { data: orders, meta } = data;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-2xl font-bold text-secondary-900">Order History</h1>

      {orders.length === 0 ? (
        <div className="rounded-lg border border-secondary-200 bg-white p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="mt-4 text-sm font-semibold text-secondary-900">No orders yet</h3>
          <p className="mt-2 text-sm text-secondary-500">
            When you place an order, it will appear here.
          </p>
          <Link
            to="/catalog"
            className="mt-6 inline-block rounded-lg bg-primary-600 px-6 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {orders.map((order) => (
              <Link
                key={order.uuid}
                to={`/account/orders/${order.uuid}`}
                className="block rounded-lg border border-secondary-200 bg-white p-6 transition hover:border-primary-300 hover:shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-secondary-500">
                      {new Date(order.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                    <p className="mt-1 font-mono text-xs text-secondary-400">
                      #{order.uuid.slice(0, 8)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-secondary-900">{order.total_formatted}</p>
                    <div className="mt-1">
                      <OrderStatusBadge status={order.status} />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {meta.last_page > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setSearchParams({ page: String(page - 1) })}
                className="rounded-lg border border-secondary-300 px-4 py-2 text-sm font-medium text-secondary-600 hover:bg-secondary-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              {Array.from({ length: meta.last_page }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setSearchParams({ page: String(p) })}
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
                disabled={page >= meta.last_page}
                onClick={() => setSearchParams({ page: String(page + 1) })}
                className="rounded-lg border border-secondary-300 px-4 py-2 text-sm font-medium text-secondary-600 hover:bg-secondary-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
