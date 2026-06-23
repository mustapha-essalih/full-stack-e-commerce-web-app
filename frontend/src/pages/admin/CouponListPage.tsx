import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAdminCoupons, archiveCoupon } from '../../api/adminCoupons';
import { useToastStore } from '../../stores/useToastStore';

export default function AdminCouponListPage() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-coupons', page, search],
    queryFn: () =>
      fetchAdminCoupons({
        page,
        per_page: 15,
        search: search || undefined,
      }),
  });

  const archiveMutation = useMutation({
    mutationFn: (id: number) => archiveCoupon(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      addToast('Coupon archived.', 'success');
    },
    onError: () => {
      addToast('Failed to archive coupon.', 'error');
    },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Coupons</h1>
          <p className="mt-1 text-sm text-secondary-500">Manage discount coupons</p>
        </div>
        <Link
          to="/admin/coupons/create"
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          Add Coupon
        </Link>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by code or description..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="block w-full max-w-xs rounded-lg border border-secondary-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
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
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary-500">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary-500">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary-500">Value</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary-500">Usage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary-500">Expires</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary-500">Status</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100 bg-white">
                {data.data.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-secondary-50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <Link
                        to={`/admin/coupons/${coupon.id}`}
                        className="font-mono text-sm font-medium text-primary-600 hover:text-primary-800"
                      >
                        {coupon.code}
                      </Link>
                      {coupon.description && (
                        <p className="mt-0.5 text-xs text-secondary-400">{coupon.description}</p>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-secondary-600">
                      {coupon.type_formatted}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-secondary-900">
                      {coupon.value_formatted}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-secondary-600">
                      {coupon.usage_count}
                      {coupon.usage_limit !== null && ` / ${coupon.usage_limit}`}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-secondary-600">
                      {coupon.expires_at
                        ? new Date(coupon.expires_at).toLocaleDateString()
                        : '—'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          coupon.is_active
                            ? 'bg-success-100 text-success-700'
                            : 'bg-secondary-100 text-secondary-500'
                        }`}
                      >
                        {coupon.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/admin/coupons/${coupon.id}/edit`}
                          className="text-xs font-medium text-primary-600 hover:text-primary-800"
                        >
                          Edit
                        </Link>
                        {coupon.is_active && (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Archive coupon "${coupon.code}"?`)) {
                                archiveMutation.mutate(coupon.id);
                              }
                            }}
                            className="text-xs font-medium text-danger-600 hover:text-danger-800"
                          >
                            Archive
                          </button>
                        )}
                      </div>
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
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border border-secondary-300 px-4 py-2 text-sm font-medium text-secondary-600 hover:bg-secondary-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              {Array.from({ length: data.meta.last_page }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
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
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-secondary-300 px-4 py-2 text-sm font-medium text-secondary-600 hover:bg-secondary-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-lg border border-secondary-200 bg-white p-12 text-center">
          <p className="text-sm text-secondary-500">No coupons found.</p>
          <Link
            to="/admin/coupons/create"
            className="mt-4 inline-block text-sm font-medium text-primary-600 hover:text-primary-800"
          >
            Create your first coupon
          </Link>
        </div>
      )}
    </div>
  );
}
