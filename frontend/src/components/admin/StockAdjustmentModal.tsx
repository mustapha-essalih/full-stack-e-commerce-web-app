import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adjustStock } from '../../api/adminInventory';
import { useToastStore } from '../../stores/useToastStore';

interface Props {
  productId: number | null;
  productName: string;
  currentStock: number;
  onClose: () => void;
}

type AdjustmentType = 'restock' | 'adjustment' | 'correction';

const typeOptions: { value: AdjustmentType; label: string }[] = [
  { value: 'restock', label: 'Restock' },
  { value: 'adjustment', label: 'Adjustment (decrease)' },
  { value: 'correction', label: 'Correction (decrease)' },
];

export default function StockAdjustmentModal({ productId, productName, currentStock, onClose }: Props) {
  const [type, setType] = useState<AdjustmentType>('restock');
  const [quantity, setQuantity] = useState<number>(1);
  const [note, setNote] = useState('');
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);

  const mutation = useMutation({
    mutationFn: () => adjustStock(productId!, type, quantity, note || undefined),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['low-stock-count'] });
      addToast(response.message, 'success');
      onClose();
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      addToast(error.response?.data?.message || 'Failed to adjust stock', 'error');
    },
  });

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  if (productId === null) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
        <div
          className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-secondary-900">Adjust Stock</h2>
            <p className="mt-1 text-sm text-secondary-500">{productName}</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700">Current Stock</label>
              <p className="mt-1 text-lg font-semibold text-secondary-900">{currentStock}</p>
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-secondary-700">
                Adjustment Type
              </label>
              <select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value as AdjustmentType)}
                className="mt-1 block w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                {typeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-secondary-700">
                Quantity
              </label>
              <input
                id="quantity"
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="mt-1 block w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              <p className="mt-1 text-xs text-secondary-500">
                {type === 'restock'
                  ? 'This amount will be added to current stock.'
                  : 'This amount will be subtracted from current stock.'}
              </p>
            </div>

            <div>
              <label htmlFor="note" className="block text-sm font-medium text-secondary-700">
                Note (optional)
              </label>
              <textarea
                id="note"
                rows={2}
                maxLength={500}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Reason for adjustment..."
                className="mt-1 block w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={mutation.isPending}
              className="rounded-lg border border-secondary-300 px-4 py-2 text-sm font-medium text-secondary-600 hover:bg-secondary-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {mutation.isPending ? 'Adjusting...' : 'Apply Adjustment'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
