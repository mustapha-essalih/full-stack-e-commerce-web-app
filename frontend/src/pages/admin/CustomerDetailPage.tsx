import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAdminCustomer, suspendCustomer, reinstateCustomer } from '../../api/adminCustomers';
import OrderStatusBadge from '../../components/OrderStatusBadge';
import { useToastStore } from '../../stores/useToastStore';

export default function AdminCustomerDetailPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);

  const { data: customer, isLoading, isError } = useQuery({
    queryKey: ['admin-customer', uuid],
    queryFn: () => fetchAdminCustomer(uuid!),
    enabled: !!uuid,
  });

  const suspendMutation = useMutation({
    mutationFn: () => suspendCustomer(uuid!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-customer', uuid] });
      queryClient.invalidateQueries({ queryKey: ['admin-customers'] });
      addToast('Customer suspended.', 'success');
    },
    onError: () => {
      addToast('Failed to suspend customer.', 'error');
    },
  });

  const reinstateMutation = useMutation({
    mutationFn: () => reinstateCustomer(uuid!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-customer', uuid] });
      queryClient.invalidateQueries({ queryKey: ['admin-customers'] });
      addToast('Customer reinstated.', 'success');
    },
    onError: () => {
      addToast('Failed to reinstate customer.', 'error');
    },
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-64 rounded bg-secondary-200" />
          <div className="h-48 rounded-lg bg-secondary-200" />
          <div className="h-32 rounded-lg bg-secondary-200" />
        </div>
      </div>
    );
  }

  if (isError || !customer) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-danger-200 bg-danger-50 p-12 text-center">
          <h2 className="text-lg font-semibold text-secondary-900">Customer Not Found</h2>
          <Link
            to="/admin/customers"
            className="mt-4 inline-block rounded-lg bg-primary-600 px-6 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            Back to Customers
          </Link>
        </div>
      </div>
    );
  }

  const isSuspended = customer.is_suspended;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link
          to="/admin/customers"
          className="mb-2 inline-flex items-center gap-1 text-sm text-secondary-500 hover:text-secondary-700"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Customers
        </Link>
      </div>

      {/* Customer Info */}
      <div className="mb-6 rounded-lg border border-secondary-200 bg-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">{customer.name}</h1>
            <p className="mt-1 text-sm text-secondary-500">{customer.email}</p>
            <p className="mt-1 text-xs text-secondary-400">
              Registered {new Date(customer.created_at).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric',
              })}
              &nbsp;&middot; Email {customer.email_verified_at ? 'Verified' : 'Not Verified'}
            </p>
          </div>
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
              isSuspended
                ? 'bg-danger-100 text-danger-700'
                : 'bg-success-100 text-success-700'
            }`}
          >
            {isSuspended ? 'Suspended' : 'Active'}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-6 sm:grid-cols-3">
        <div className="rounded-lg border border-secondary-200 bg-white p-6">
          <p className="text-sm text-secondary-500">Orders</p>
          <p className="mt-1 text-2xl font-bold text-secondary-900">{customer.orders_count}</p>
        </div>
        <div className="rounded-lg border border-secondary-200 bg-white p-6">
          <p className="text-sm text-secondary-500">Total Spent</p>
          <p className="mt-1 text-2xl font-bold text-secondary-900">{customer.total_spent_formatted}</p>
        </div>
        <div className="rounded-lg border border-secondary-200 bg-white p-6">
          <p className="text-sm text-secondary-500">Status</p>
          <p className="mt-1 text-2xl font-bold text-secondary-900">
            {isSuspended ? 'Suspended' : 'Active'}
            {customer.suspended_at && (
              <span className="block text-xs font-normal text-secondary-400">
                Since {new Date(customer.suspended_at).toLocaleDateString()}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Suspend / Reinstate */}
      <div className="mb-6 rounded-lg border border-secondary-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-secondary-900">Account Management</h2>
        {isSuspended ? (
          <div>
            <p className="mb-3 text-sm text-secondary-600">
              This customer is currently suspended. They cannot log in or place orders.
            </p>
            <button
              type="button"
              onClick={() => reinstateMutation.mutate()}
              disabled={reinstateMutation.isPending}
              className="rounded-lg bg-success-600 px-4 py-2 text-sm font-medium text-white hover:bg-success-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {reinstateMutation.isPending ? 'Reinstating...' : 'Reinstate Customer'}
            </button>
          </div>
        ) : (
          <div>
            <p className="mb-3 text-sm text-secondary-600">
              Suspending this customer will revoke all active sessions and prevent login.
            </p>
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Are you sure you want to suspend this customer?')) {
                  suspendMutation.mutate();
                }
              }}
              disabled={suspendMutation.isPending}
              className="rounded-lg bg-danger-600 px-4 py-2 text-sm font-medium text-white hover:bg-danger-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {suspendMutation.isPending ? 'Suspending...' : 'Suspend Customer'}
            </button>
          </div>
        )}
      </div>

      {/* Recent Orders */}
      <div className="rounded-lg border border-secondary-200 bg-white">
        <div className="border-b border-secondary-200 px-6 py-3">
          <h2 className="text-sm font-semibold text-secondary-900">Recent Orders</h2>
        </div>
        {customer.recent_orders && customer.recent_orders.length > 0 ? (
          <div className="divide-y divide-secondary-100">
            {customer.recent_orders.map((order) => (
              <div key={order.uuid} className="flex items-center justify-between px-6 py-4">
                <div>
                  <Link
                    to={`/admin/orders/${order.uuid}`}
                    className="font-mono text-sm font-medium text-primary-600 hover:text-primary-800"
                  >
                    #{order.uuid.slice(0, 8)}
                  </Link>
                  <p className="mt-0.5 text-xs text-secondary-500">
                    {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-secondary-900">{order.total_formatted}</span>
                  <OrderStatusBadge status={order.status} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <p className="text-sm text-secondary-500">No orders yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
