import { useState } from 'react';
import type { CartItem } from '../../api/cart';
import type { Order } from '../../api/orders';
import type { CheckoutTotals } from '../../api/checkout';
import { formatPrice } from '../../utils/format';

interface ReviewStepProps {
  order: Order;
  totals: CheckoutTotals;
  items: CartItem[];
  isLoading: boolean;
  onApplyCoupon: (code: string) => Promise<boolean>;
  onRemoveCoupon: () => Promise<void>;
  onProceedToPayment: () => Promise<void>;
  onBack: () => void;
}

export default function ReviewStep({
  order,
  totals,
  items,
  isLoading,
  onApplyCoupon,
  onRemoveCoupon,
  onProceedToPayment,
  onBack,
}: ReviewStepProps) {
  const [couponCode, setCouponCode] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  async function handleApplyCoupon(e: React.FormEvent) {
    e.preventDefault();
    if (!couponCode.trim() || isApplyingCoupon) return;

    setIsApplyingCoupon(true);
    const success = await onApplyCoupon(couponCode.trim());
    setIsApplyingCoupon(false);

    if (success) {
      setCouponCode('');
    }
  }

  async function handleRemoveCoupon() {
    await onRemoveCoupon();
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-secondary-900">Order Review</h2>

      <div className="rounded-lg border border-secondary-200 bg-white">
        <div className="border-b border-secondary-200 px-4 py-3">
          <h3 className="text-sm font-medium text-secondary-900">Items ({items.length})</h3>
        </div>
        <ul className="divide-y divide-secondary-200" role="list">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-4 px-4 py-3">
              <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-md bg-secondary-100">
                {item.product.images?.[0] ? (
                  <img
                    src={item.product.images[0].thumbnail_url}
                    alt={item.product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-secondary-400">
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-secondary-900">{item.product.name}</p>
                <p className="text-xs text-secondary-500">Qty: {item.quantity}</p>
              </div>
              <p className="text-sm font-medium text-secondary-900">{formatPrice(item.subtotal_cents)}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-lg border border-secondary-200 bg-white p-4">
        <h3 className="mb-3 text-sm font-medium text-secondary-900">Coupon Code</h3>
        {order.coupon_code ? (
          <div className="flex items-center justify-between rounded-md bg-primary-50 px-3 py-2">
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <span className="text-sm font-medium text-primary-700">{order.coupon_code}</span>
              {order.discount_cents > 0 && (
                <span className="text-sm text-primary-600">(-{formatPrice(order.discount_cents)})</span>
              )}
            </div>
            <button
              type="button"
              onClick={handleRemoveCoupon}
              className="text-sm text-danger-600 hover:text-danger-500"
              disabled={isLoading}
            >
              Remove
            </button>
          </div>
        ) : (
          <form onSubmit={handleApplyCoupon} className="flex gap-2">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="Enter coupon code"
              className="flex-1 rounded-md border border-secondary-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              disabled={isApplyingCoupon}
            />
            <button
              type="submit"
              disabled={!couponCode.trim() || isApplyingCoupon}
              className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isApplyingCoupon ? 'Applying...' : 'Apply'}
            </button>
          </form>
        )}
      </div>

      <div className="rounded-lg border border-secondary-200 bg-white p-4">
        <h3 className="mb-3 text-sm font-medium text-secondary-900">Order Summary</h3>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-secondary-600">Subtotal</dt>
            <dd className="font-medium text-secondary-900">{formatPrice(totals.subtotal_cents)}</dd>
          </div>
          {totals.discount_cents > 0 && (
            <div className="flex justify-between">
              <dt className="text-success-600">Discount</dt>
              <dd className="font-medium text-success-600">-{formatPrice(totals.discount_cents)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-secondary-600">Shipping</dt>
            <dd className="font-medium text-secondary-900">{formatPrice(totals.shipping_cents)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-secondary-600">Tax</dt>
            <dd className="font-medium text-secondary-900">{formatPrice(totals.tax_cents)}</dd>
          </div>
          <div className="flex justify-between border-t border-secondary-200 pt-2">
            <dt className="text-base font-semibold text-secondary-900">Total</dt>
            <dd className="text-base font-semibold text-secondary-900">{formatPrice(totals.total_cents)}</dd>
          </div>
        </dl>
      </div>

      <div className="flex items-center justify-between border-t border-secondary-200 pt-6">
        <button
          type="button"
          onClick={onBack}
          className="text-sm font-medium text-primary-600 hover:text-primary-500"
        >
          &larr; Back to Shipping
        </button>

        <button
          type="button"
          onClick={onProceedToPayment}
          disabled={isLoading}
          className="rounded-lg bg-primary-600 px-8 py-3 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Processing...
            </span>
          ) : (
            'Proceed to Payment'
          )}
        </button>
      </div>
    </div>
  );
}
