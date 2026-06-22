import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchAdminProducts,
  archiveProduct,
  restoreProduct,
  bulkProductAction,
} from '../../api/adminProducts';
import { formatPrice } from '../../utils/format';

export default function AdminProductListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  const page = Number(searchParams.get('page')) || 1;
  const search = searchParams.get('search') || '';
  const sort = searchParams.get('sort') || 'created_at';
  const direction = searchParams.get('direction') || 'desc';

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', page, search, sort, direction],
    queryFn: () =>
      fetchAdminProducts({ page, search: search || undefined, sort, direction }),
  });

  const products = data?.data ?? [];
  const meta = data?.meta ?? { last_page: 1, total: 0 };

  function updateParams(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    params.set('page', '1');
    setSearchParams(params);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    updateParams({ search: searchInput });
  }

  function toggleSort(column: string) {
    const newDir = sort === column && direction === 'asc' ? 'desc' : 'asc';
    updateParams({ sort: column, direction: newDir });
  }

  function toggleSelect(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setSelectAll(false);
  }

  function toggleSelectAll() {
    if (selectAll) {
      setSelectedIds(new Set());
      setSelectAll(false);
    } else {
      setSelectedIds(new Set(products.map((p: { id: number }) => p.id)));
      setSelectAll(true);
    }
  }

  const archiveMutation = useMutation({
    mutationFn: (id: number) => archiveProduct(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-products'] }),
  });

  const restoreMutation = useMutation({
    mutationFn: (id: number) => restoreProduct(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-products'] }),
  });

  const bulkMutation = useMutation({
    mutationFn: ({ action, ids }: { action: 'activate' | 'archive'; ids: number[] }) =>
      bulkProductAction(action, ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setSelectedIds(new Set());
      setSelectAll(false);
    },
  });

  function renderSortIcon(column: string) {
    if (sort !== column) return <span className="ml-1 text-secondary-300">&#8597;</span>;
    return <span className="ml-1 text-primary-600">{direction === 'asc' ? '&#8593;' : '&#8595;'}</span>;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Products</h1>
          <p className="mt-1 text-sm text-secondary-500">{meta.total} total products</p>
        </div>
        <Link
          to="/admin/products/create"
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          Add Product
        </Link>
      </div>

      {/* Search */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <form onSubmit={handleSearch} className="flex-1 min-w-48">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search products..."
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

        {/* Bulk actions */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-secondary-600">{selectedIds.size} selected</span>
            <button
              type="button"
              onClick={() => bulkMutation.mutate({ action: 'activate', ids: Array.from(selectedIds) })}
              className="rounded-lg border border-success-500 px-3 py-2 text-sm font-medium text-success-600 hover:bg-success-50"
            >
              Activate
            </button>
            <button
              type="button"
              onClick={() => bulkMutation.mutate({ action: 'archive', ids: Array.from(selectedIds) })}
              className="rounded-lg border border-danger-500 px-3 py-2 text-sm font-medium text-danger-600 hover:bg-danger-50"
            >
              Archive
            </button>
          </div>
        )}
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
      ) : products.length > 0 ? (
        <>
          <div className="overflow-x-auto rounded-lg border border-secondary-200">
            <table className="min-w-full divide-y divide-secondary-200">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={toggleSelectAll}
                      className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-secondary-500">Image</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-secondary-500 cursor-pointer" onClick={() => toggleSort('name')}>
                    Name{renderSortIcon('name')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-secondary-500">SKU</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-secondary-500 cursor-pointer" onClick={() => toggleSort('price_cents')}>
                    Price{renderSortIcon('price_cents')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-secondary-500 cursor-pointer" onClick={() => toggleSort('stock_quantity')}>
                    Stock{renderSortIcon('stock_quantity')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-secondary-500">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-secondary-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100 bg-white">
                {products.map((product: {
                  id: number;
                  name: string;
                  sku: string;
                  price_cents: number;
                  stock_quantity: number;
                  is_active: boolean;
                  deleted_at: string | null;
                  primary_image?: { thumbnail_url: string } | null;
                }) => (
                  <tr key={product.id} className="hover:bg-secondary-50">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(product.id)}
                        onChange={() => toggleSelect(product.id)}
                        className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-10 w-10 overflow-hidden rounded border border-secondary-200 bg-secondary-100">
                        {product.primary_image?.thumbnail_url ? (
                          <img src={product.primary_image.thumbnail_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-secondary-400">—</div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Link to={`/admin/products/${product.id}/edit`} className="text-sm font-medium text-primary-600 hover:text-primary-800">
                        {product.name}
                      </Link>
                    </td>
                    <td className="px-4 py-4 text-sm text-secondary-500 font-mono">{product.sku}</td>
                    <td className="px-4 py-4 text-sm font-medium text-secondary-900">{formatPrice(product.price_cents)}</td>
                    <td className="px-4 py-4 text-sm text-secondary-600">{product.stock_quantity}</td>
                    <td className="px-4 py-4">
                      {product.deleted_at ? (
                        <span className="inline-flex rounded-full bg-secondary-100 px-2.5 py-0.5 text-xs font-medium text-secondary-600">Archived</span>
                      ) : product.is_active ? (
                        <span className="inline-flex rounded-full bg-success-50 px-2.5 py-0.5 text-xs font-medium text-success-600">Active</span>
                      ) : (
                        <span className="inline-flex rounded-full bg-warning-50 px-2.5 py-0.5 text-xs font-medium text-warning-600">Inactive</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/admin/products/${product.id}/edit`}
                          className="text-sm text-primary-600 hover:text-primary-800"
                        >
                          Edit
                        </Link>
                        {product.deleted_at ? (
                          <button
                            type="button"
                            onClick={() => restoreMutation.mutate(product.id)}
                            className="text-sm text-success-600 hover:text-success-800"
                          >
                            Restore
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => archiveMutation.mutate(product.id)}
                            className="text-sm text-danger-600 hover:text-danger-800"
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

          {meta.last_page > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => updateParams({ page: String(page - 1) })}
                className="rounded-lg border border-secondary-300 px-4 py-2 text-sm font-medium text-secondary-600 hover:bg-secondary-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              {Array.from({ length: meta.last_page }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => updateParams({ page: String(p) })}
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
                onClick={() => updateParams({ page: String(page + 1) })}
                className="rounded-lg border border-secondary-300 px-4 py-2 text-sm font-medium text-secondary-600 hover:bg-secondary-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-lg border border-secondary-200 bg-white p-12 text-center">
          <p className="text-sm text-secondary-500">No products found.</p>
          <Link
            to="/admin/products/create"
            className="mt-4 inline-block text-sm font-medium text-primary-600 hover:text-primary-800"
          >
            Create your first product
          </Link>
        </div>
      )}
    </div>
  );
}
