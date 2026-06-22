import { useState } from 'react';
import { useCartStore } from '../stores/useCartStore';
import { useToastStore } from '../stores/useToastStore';
import type { Product } from '../api/products';

interface AddToCartButtonProps {
  product: Product;
  showQuantity?: boolean;
  className?: string;
}

export default function AddToCartButton({ product, showQuantity = false, className = '' }: AddToCartButtonProps) {
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const addToast = useToastStore((s) => s.addToast);

  const isOutOfStock = product.stock_quantity === 0;

  async function handleAdd() {
    if (isOutOfStock || isAdding) return;

    setIsAdding(true);
    try {
      await addItem(product.id, quantity, product);
      addToast(`${product.name} added to cart.`, 'success');
    } catch {
      addToast('Failed to add item to cart.', 'error');
    } finally {
      setIsAdding(false);
    }
  }

  if (isOutOfStock) {
    return (
      <button
        type="button"
        disabled
        className={`cursor-not-allowed rounded-lg bg-secondary-300 px-8 py-3 text-sm font-medium text-secondary-500 ${className}`}
      >
        Out of Stock
      </button>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {showQuantity && (
        <div className="flex items-center rounded-md border border-secondary-300">
          <button
            type="button"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={quantity <= 1}
            className="px-3 py-2 text-secondary-600 hover:bg-secondary-100 disabled:opacity-50"
            aria-label="Decrease quantity"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <span className="min-w-[3rem] text-center text-sm font-medium text-secondary-900">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity(quantity + 1)}
            disabled={quantity >= product.stock_quantity}
            className="px-3 py-2 text-secondary-600 hover:bg-secondary-100 disabled:opacity-50"
            aria-label="Increase quantity"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={handleAdd}
        disabled={isAdding}
        className="rounded-lg bg-primary-600 px-8 py-3 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isAdding ? (
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Adding...
          </span>
        ) : (
          'Add to Cart'
        )}
      </button>
    </div>
  );
}
