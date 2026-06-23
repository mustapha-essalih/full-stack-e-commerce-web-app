import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAdminCoupon, fetchCouponUsages, archiveCoupon } from '../../api/adminCoupons';
import { useToastStore } from '../../stores/useToastStore';

export default function AdminCouponDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  const [usagePage, setUsagePage] = useState(1);

  const couponId = Number(id);

  const { data: coupon, isLoading, isError } = useQuery({
    queryKey: ['admin-coupon', id],
    queryFn: () => fetchAdminCoupon(couponId),
    enabled: !!id,
  });

  const { data: usagesData } = useQuery({
    queryKey: ['admin-coupon-usages', id, usagePage],
    queryFn: () => fetchCouponUsages(couponId, usagePage),
    enabled: !!id,
  });

  const archiveMutation = useMutation({
    mutationFn: () => archiveCoupon(couponId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupon', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      addToast('Coupon archived.', 'success');
    },
    onError: () => {
      addToast('Failed to archive coupon.', 'error');
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

  if (isError || !coupon) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-danger-200 bg-danger-50 p-12 text-center">
          <h2 className="text-lg font-semibold text-secondary-900">Coupon Not Found</h2>
          <Link
            to="/admin/coupons"
            className="mt-4 inline-block rounded-lg bg-primary-600 px-6 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            Back to Coupons
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link
          to="/admin/coupons"
          className="mb-2 inline-flex items-center gap-1 text-sm text-secondary-500 hover:text-secondary-700"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Coupons
        </Link>
      </div>

      <div className="mb-6 rounded-lg border border-secondary-200 bg-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-mono text-2xl font-bold text-secondary-900">{coupon.code}</h1>
            {coupon.description && (
              <p className="mt-1 text-sm text-secondary-500">{coupon.description}</p>
            )}
          </div>
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
              coupon.is_active
                ? 'bg-success-100 text-success-700'
                : 'bg-secondary-100 text-secondary-500'
            }`}
          >
            {coupon.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      <div className="mb-6 grid gap-6 sm:grid-cols-3">
        <div className="rounded-lg border border-secondary-200 bg-white p-6">
          <p className="text-sm text-secondary-500">Type</p>
          <p className="mt-1 text-lg font-bold text-secondary-900">{coupon.type_formatted}</p>
        </div>
        <div className="rounded-lg border border-secondary-200 bg-white p-6">
          <p className="text-sm text-secondary-500">Value</p>
          <p className="mt-1 text-lg font-bold text-secondary-900">{coupon.value_formatted}</p>
        </div>
        <div className="rounded-lg border border-secondary-200 bg-white p-6">
          <p className="text-sm text-secondary-500">Usage</p>
          <p className="mt-1 text-lg font-bold text-secondary-900">
            {coupon.usage_count}
            {coupon.usage_limit !== null && <span className="text-secondary-400"> / {coupon.usage_limit}</span>}
          </p>
        </div>
      </div>

      <div className="mb-6 rounded-lg border border-secondary-200 bg-white p-6">
        <h2 className="mb-3 text-sm font-semibold text-secondary-900">Details</h2>
        <dl className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-secondary-500">Minimum Order</dt>
            <dd className="text-sm font-medium text-secondary-900">
              {coupon.minimum_order_cents !== null
                ? '$' + (coupon.minimum_order_cents / 100).toFixed(2)
                : 'No minimum'}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-secondary-500">Per-Customer Limit</dt>
            <dd className="text-sm font-medium text-secondary-900">
              {coupon.per_customer_limit !== null ? coupon.per_customer_limit : 'Unlimited'}
            </dd>
          </div>
          {coupon.starts_at && (
            <div>
              <dt className="text-xs text-secondary-500">Start Date</dt>
              <dd className="text-sm font-medium text-secondary-900">
                {new Date(coupon.starts_at).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'long', day: 'numeric',
                })}
              </dd>
            </div>
          )}
          {coupon.expires_at && (
            <div>
              <dt className="text-xs text-secondary-500">Expiry Date</dt>
              <dd className="text-sm font-medium text-secondary-900">
                {new Date(coupon.expires_at).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'long', day: 'numeric',
                })}
              </dd>
            </div>
          )}
          <div>
            <dt className="text-xs text-secondary-500">Created</dt>
            <dd className="text-sm font-medium text-secondary-900">
              {new Date(coupon.created_at).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric',
              })}
            </dd>
          </div>
        </dl>
      </div>

      {coupon.is_active && (
        <div className="mb-6 rounded-lg border border-secondary-200 bg-white p-6">
          <h2 className="mb-3 text-sm font-semibold text-secondary-900">Actions</h2>
          <div className="flex gap-3">
            <Link
              to={`/admin/coupons/${coupon.id}/edit`}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
            >
              Edit Coupon
            </Link>
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`Archive coupon "${coupon.code}"? This will soft-delete it.`)) {
                  archiveMutation.mutate();
                }
              }}
              disabled={archiveMutation.isPending}
              className="rounded-lg border border-danger-300 px-4 py-2 text-sm font-medium text-danger-600 hover:bg-danger-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {archiveMutation.isPending ? 'Archiving...' : 'Archive Coupon'}
            </button>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-secondary-200 bg-white">
        <div className="border-b border-secondary-200 px-6 py-3">
          <h2 className="text-sm font-semibold text-secondary-900">Usage History</h2>
        </div>
        {usagesData && usagesData.data.length > 0 ? (
          <>
            <div className="divide-y divide-secondary-100">
              {usagesData.data.map((usage) => (
                <div key={usage.id} className="flex items-center justify-between px-6 py-4">
                  <div>
                    <Link
                      to={`/admin/orders/${usage.order_uuid}`}
                      className="font-mono text-sm font-medium text-primary-600 hover:text-primary-800"
                    >
                      #{usage.order_uuid.slice(0, 8)}
                    </Link>
                    <p className="mt-0.5 text-xs text-secondary-500">
                      {usage.user_name ?? 'Guest'}
                      {' · '}
                      {new Date(usage.used_at).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'short', day: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-secondary-900">
                      -${(usage.discount_cents / 100).toFixed(2)}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        usage.order_status === 'paid' || usage.order_status === 'completed'
                          ? 'bg-success-100 text-success-700'
                          : 'bg-secondary-100 text-secondary-500'
                      }`}
                    >
                      {usage.order_status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {usagesData.meta.last_page > 1 && (
              <div className="flex items-center justify-between border-t border-secondary-200 px-6 py-3">
                <button
                  type="button"
                  disabled={usagePage <= 1}
                  onClick={() => setUsagePage((p) => p - 1)}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-secondary-600 hover:bg-secondary-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm text-secondary-500">
                  Page {usagesData.meta.current_page} of {usagesData.meta.last_page}
                </span>
                <button
                  type="button"
                  disabled={usagePage >= usagesData.meta.last_page}
                  onClick={() => setUsagePage((p) => p + 1)}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-secondary-600 hover:bg-secondary-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="p-12 text-center">
            <p className="text-sm text-secondary-500">No usage records yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
