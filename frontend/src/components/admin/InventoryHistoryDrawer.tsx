import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchAdjustmentHistory } from '../../api/adminInventory';
import type { InventoryAdjustment } from '../../api/adminInventory';

interface Props {
  productId: number | null;
  productName: string;
  onClose: () => void;
}

const typeLabels: Record<string, string> = {
  restock: 'Restock',
  adjustment: 'Adjustment',
  sale: 'Sale',
  cancellation: 'Cancellation',
  correction: 'Correction',
};

const typeColors: Record<string, string> = {
  restock: 'text-green-600 bg-green-50',
  adjustment: 'text-blue-600 bg-blue-50',
  sale: 'text-red-600 bg-red-50',
  cancellation: 'text-amber-600 bg-amber-50',
  correction: 'text-purple-600 bg-purple-50',
};

export default function InventoryHistoryDrawer({ productId, productName, onClose }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ['inventory-history', productId],
    queryFn: () => fetchAdjustmentHistory(productId!),
    enabled: productId !== null,
  });

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <>
      {productId !== null && (
        <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
      )}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-lg transform border-l border-secondary-200 bg-white shadow-xl transition-transform duration-200 ${
          productId !== null ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-secondary-200 px-6">
          <h2 className="text-lg font-semibold text-secondary-900">{productName}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-secondary-400 hover:bg-secondary-100 hover:text-secondary-600"
            aria-label="Close drawer"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto" style={{ height: 'calc(100% - 4rem)' }}>
          {isLoading && (
            <div className="space-y-4 p-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="animate-pulse space-y-2">
                  <div className="h-4 w-24 rounded bg-secondary-200" />
                  <div className="h-3 w-48 rounded bg-secondary-100" />
                </div>
              ))}
            </div>
          )}

          {data && data.data.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16">
              <p className="text-sm text-secondary-500">No adjustments recorded yet.</p>
            </div>
          )}

          {data && data.data.length > 0 && (
            <ul className="divide-y divide-secondary-100">
              {data.data.map((adjustment: InventoryAdjustment) => (
                <li key={adjustment.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        typeColors[adjustment.type] || 'text-secondary-600 bg-secondary-50'
                      }`}
                    >
                      {typeLabels[adjustment.type] || adjustment.type}
                    </span>
                    <span
                      className={`text-sm font-semibold ${
                        adjustment.quantity_change > 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {adjustment.quantity_change > 0 ? '+' : ''}
                      {adjustment.quantity_change}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs text-secondary-500">
                    <span>After: {adjustment.quantity_after}</span>
                    <span>{new Date(adjustment.created_at).toLocaleString()}</span>
                  </div>
                  {adjustment.note && (
                    <p className="mt-1 text-xs text-secondary-400">{adjustment.note}</p>
                  )}
                  {adjustment.user && (
                    <p className="mt-0.5 text-xs text-secondary-400">
                      by {adjustment.user.name}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}

          {data && data.meta.last_page > 1 && (
            <div className="flex items-center justify-between border-t border-secondary-200 px-6 py-3">
              <button
                type="button"
                disabled={!data.meta.from || data.meta.current_page <= 1}
                onClick={() => fetchAdjustmentHistory(productId!, data.meta.current_page - 1)}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-secondary-600 hover:bg-secondary-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-secondary-500">
                Page {data.meta.current_page} of {data.meta.last_page}
              </span>
              <button
                type="button"
                disabled={data.meta.current_page >= data.meta.last_page}
                onClick={() => fetchAdjustmentHistory(productId!, data.meta.current_page + 1)}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-secondary-600 hover:bg-secondary-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
