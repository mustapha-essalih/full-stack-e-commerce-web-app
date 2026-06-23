import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchAllProducts } from '../../api/adminInventory';
import type { InventoryProduct } from '../../api/adminInventory';
import StockAdjustmentModal from '../../components/admin/StockAdjustmentModal';
import InventoryHistoryDrawer from '../../components/admin/InventoryHistoryDrawer';

type SortField = 'name' | 'stock_quantity' | 'price_cents';
type SortDir = 'asc' | 'desc';

export default function AdminInventoryPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [adjustProduct, setAdjustProduct] = useState<InventoryProduct | null>(null);
  const [historyProduct, setHistoryProduct] = useState<InventoryProduct | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', page, search, sortField, sortDir],
    queryFn: () =>
      fetchAllProducts({
        page,
        per_page: 15,
        search: search || undefined,
      }),
  });

  const lowStockCount = data?.data.filter((p) => p.stock_quantity < 10).length ?? 0;

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  }

  const sorted = [...(data?.data ?? [])].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    if (sortField === 'name') return a.name.localeCompare(b.name) * dir;
    if (sortField === 'stock_quantity') return (a.stock_quantity - b.stock_quantity) * dir;
    return (a.price_cents - b.price_cents) * dir;
  });

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) {
      return (
        <svg className="h-3 w-3 text-secondary-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
        </svg>
      );
    }
    return sortDir === 'asc' ? (
      <svg className="h-3 w-3 text-primary-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
      </svg>
    ) : (
      <svg className="h-3 w-3 text-primary-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
      </svg>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Inventory</h1>
          <p className="mt-1 text-sm text-secondary-500">
            {data?.meta.total ?? 0} products
            {lowStockCount > 0 && (
              <span className="ml-2 text-amber-600 font-medium">
                &middot; {lowStockCount} low in stock
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="block w-full max-w-xs rounded-lg border border-secondary-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-secondary-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-secondary-200">
            <thead className="bg-secondary-50">
              <tr>
                <th
                  className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary-500"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-1">
                    Product <SortIcon field="name" />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary-500">
                  SKU
                </th>
                <th
                  className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary-500"
                  onClick={() => handleSort('stock_quantity')}
                >
                  <div className="flex items-center gap-1">
                    Stock <SortIcon field="stock_quantity" />
                  </div>
                </th>
                <th
                  className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary-500"
                  onClick={() => handleSort('price_cents')}
                >
                  <div className="flex items-center gap-1">
                    Price <SortIcon field="price_cents" />
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-secondary-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-100">
              {isLoading && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-secondary-500">
                    Loading...
                  </td>
                </tr>
              )}
              {!isLoading && sorted.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-secondary-500">
                    No products found.
                  </td>
                </tr>
              )}
              {sorted.map((product) => (
                <tr
                  key={product.id}
                  className={`hover:bg-secondary-50 ${
                    product.stock_quantity < 10 ? 'bg-red-50/50' : ''
                  }`}
                >
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-secondary-900">
                    <div className="flex items-center gap-2">
                      {product.name}
                      {product.stock_quantity < 10 && (
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                          Low
                        </span>
                      )}
                      {product.stock_quantity === 0 && (
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                          Out
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-secondary-500">
                    {product.sku}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <span
                      className={`font-semibold ${
                        product.stock_quantity === 0
                          ? 'text-red-600'
                          : product.stock_quantity < 10
                            ? 'text-amber-600'
                            : 'text-secondary-900'
                      }`}
                    >
                      {product.stock_quantity}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-secondary-500">
                    {product.price_formatted}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setHistoryProduct(product)}
                        className="rounded-lg px-3 py-1.5 text-xs font-medium text-secondary-600 hover:bg-secondary-100"
                      >
                        History
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdjustProduct(product)}
                        className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700"
                      >
                        Adjust
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data && data.meta.last_page > 1 && (
          <div className="flex items-center justify-between border-t border-secondary-200 px-6 py-3">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-secondary-600 hover:bg-secondary-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-secondary-500">
              Page {data.meta.current_page} of {data.meta.last_page}
            </span>
            <button
              type="button"
              disabled={page >= data.meta.last_page}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-secondary-600 hover:bg-secondary-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {adjustProduct && (
        <StockAdjustmentModal
          productId={adjustProduct.id}
          productName={adjustProduct.name}
          currentStock={adjustProduct.stock_quantity}
          onClose={() => setAdjustProduct(null)}
        />
      )}

      {historyProduct && (
        <InventoryHistoryDrawer
          productId={historyProduct.id}
          productName={historyProduct.name}
          onClose={() => setHistoryProduct(null)}
        />
      )}
    </div>
  );
}
