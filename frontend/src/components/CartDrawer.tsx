import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useCartStore } from '../stores/useCartStore';
import { useToastStore } from '../stores/useToastStore';

export default function CartDrawer() {
  const { items, total, itemCount, isDrawerOpen, closeDrawer, updateQuantity, removeItem, clearCart } =
    useCartStore();
  const addToast = useToastStore((s) => s.addToast);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isDrawerOpen]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') closeDrawer();
    }
    if (isDrawerOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isDrawerOpen, closeDrawer]);

  async function handleUpdateQuantity(itemId: number, newQuantity: number) {
    try {
      await updateQuantity(itemId, newQuantity);
    } catch {
      addToast('Failed to update quantity.', 'error');
    }
  }

  async function handleRemoveItem(itemId: number) {
    try {
      await removeItem(itemId);
      addToast('Item removed from cart.', 'success');
    } catch {
      addToast('Failed to remove item.', 'error');
    }
  }

  async function handleClearCart() {
    try {
      await clearCart();
      addToast('Cart cleared.', 'success');
    } catch {
      addToast('Failed to clear cart.', 'error');
    }
  }

  function formatPrice(cents: number): string {
    return '$' + (cents / 100).toFixed(2);
  }

  return (
    <>
      {isDrawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 transition-opacity"
          onClick={closeDrawer}
          aria-hidden="true"
        />
      )}

      <div
        ref={panelRef}
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-xl transition-transform duration-300 ${
          isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
      >
        <div className="flex items-center justify-between border-b border-secondary-200 px-4 py-3">
          <h2 className="text-lg font-semibold text-secondary-900">
            Cart ({itemCount} {itemCount === 1 ? 'item' : 'items'})
          </h2>
          <button
            type="button"
            onClick={closeDrawer}
            className="rounded-lg p-1 text-secondary-400 hover:bg-secondary-100 hover:text-secondary-600"
            aria-label="Close cart"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
            <svg className="h-16 w-16 text-secondary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
            <p className="text-secondary-500">Your cart is empty.</p>
            <Link
              to="/catalog"
              onClick={closeDrawer}
              className="rounded-lg bg-primary-600 px-6 py-2 text-sm font-medium text-white hover:bg-primary-700"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <ul className="divide-y divide-secondary-200" role="list">
                {items.map((item) => (
                  <li key={item.id} className="flex gap-4 py-4">
                    <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-secondary-100">
                      {item.product.images?.[0] ? (
                        <img
                          src={item.product.images[0].thumbnail_url}
                          alt={item.product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-secondary-400">
                          <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <Link
                          to={`/product/${item.product.slug}`}
                          onClick={closeDrawer}
                          className="text-sm font-medium text-secondary-900 hover:text-primary-600"
                        >
                          {item.product.name}
                        </Link>
                        <p className="mt-0.5 text-sm text-secondary-500">{formatPrice(item.unit_price_cents)}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center rounded-md border border-secondary-300">
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                            disabled={item.quantity <= 1}
                            className="px-2 py-1 text-secondary-600 hover:bg-secondary-100 disabled:opacity-50"
                            aria-label="Decrease quantity"
                          >
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                            </svg>
                          </button>
                          <span className="min-w-[2rem] text-center text-sm font-medium text-secondary-900">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                            className="px-2 py-1 text-secondary-600 hover:bg-secondary-100"
                            aria-label="Increase quantity"
                          >
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                        </div>

                        <span className="ml-auto text-sm font-medium text-secondary-900">
                          {formatPrice(item.subtotal_cents)}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="rounded p-1 text-secondary-400 hover:bg-danger-50 hover:text-danger-600"
                          aria-label={`Remove ${item.product.name} from cart`}
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-secondary-200 px-4 py-4">
              <div className="flex items-center justify-between text-base font-medium text-secondary-900">
                <span>Subtotal</span>
                <span>{formatPrice(total)}</span>
              </div>
              <p className="mt-0.5 text-sm text-secondary-500">Shipping and taxes calculated at checkout.</p>

              <div className="mt-4 flex flex-col gap-2">
                <Link
                  to="/checkout"
                  onClick={closeDrawer}
                  className="w-full rounded-lg bg-primary-600 px-6 py-2.5 text-center text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                >
                  Proceed to Checkout
                </Link>
                <button
                  type="button"
                  onClick={handleClearCart}
                  className="w-full rounded-lg border border-secondary-300 px-6 py-2 text-sm font-medium text-secondary-600 hover:bg-secondary-50"
                >
                  Clear Cart
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
