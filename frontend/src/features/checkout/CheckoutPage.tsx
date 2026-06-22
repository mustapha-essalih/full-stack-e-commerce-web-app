import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../../stores/useCartStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { useToastStore } from '../../stores/useToastStore';
import { initializeCheckout, applyCoupon, removeCoupon, createPaymentIntent } from '../../api/checkout';
import type { AddressData, CheckoutTotals } from '../../api/checkout';
import type { Order } from '../../api/orders';
import AddressStep from './AddressStep';
import ReviewStep from './ReviewStep';
import PaymentStep from './PaymentStep';

type CheckoutStep = 'address' | 'review' | 'payment';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, itemCount } = useCartStore();
  const { user } = useAuthStore();
  const addToast = useToastStore((s) => s.addToast);

  const [step, setStep] = useState<CheckoutStep>('address');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [order, setOrder] = useState<Order | null>(null);
  const [totals, setTotals] = useState<CheckoutTotals | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  useEffect(() => {
    if (itemCount === 0 && step === 'address') {
      navigate('/catalog');
    }
  }, [itemCount, step, navigate]);

  async function handleAddressSubmit(addressData: AddressData) {
    setIsLoading(true);
    setError(null);

    try {
      const result = await initializeCheckout(addressData);
      setOrder(result.order);
      setTotals(result.totals);
      setStep('review');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to initialize checkout.';
      setError(message);
      addToast(message, 'error');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleApplyCoupon(code: string): Promise<boolean> {
    if (!order) return false;

    try {
      const result = await applyCoupon(order.uuid, code);
      setOrder(result.order);

      if (result.totals) {
        setTotals(result.totals);
      }

      addToast('Coupon applied!', 'success');
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid coupon code.';
      addToast(message, 'error');
      return false;
    }
  }

  async function handleRemoveCoupon() {
    if (!order) return;

    try {
      const result = await removeCoupon(order.uuid);
      setOrder(result.order);

      if (result.totals) {
        setTotals(result.totals);
      }

      addToast('Coupon removed.', 'success');
    } catch {
      addToast('Failed to remove coupon.', 'error');
    }
  }

  async function handleProceedToPayment() {
    if (!order) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await createPaymentIntent(order.uuid);
      setClientSecret(result.client_secret);
      setStep('payment');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to initialize payment.';
      setError(message);
      addToast(message, 'error');
    } finally {
      setIsLoading(false);
    }
  }

  function handlePaymentSuccess(orderUuid: string) {
    navigate(`/orders/${orderUuid}/confirmation`);
  }

  function handlePaymentError(message: string) {
    setError(message);
    addToast(message, 'error');
  }

  function goBack() {
    if (step === 'review') setStep('address');
    else if (step === 'payment') setStep('review');
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-secondary-900">Checkout</h1>

        <div className="mt-4 flex items-center gap-2">
          {(['address', 'review', 'payment'] as const).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                  step === s
                    ? 'bg-primary-600 text-white'
                    : ['address', 'review'].indexOf(step) >= i
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-secondary-200 text-secondary-500'
                }`}
              >
                {['address', 'review'].indexOf(step) > i ? (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span className={`text-sm font-medium ${step === s ? 'text-primary-600' : 'text-secondary-500'}`}>
                {s === 'address' ? 'Shipping' : s === 'review' ? 'Review' : 'Payment'}
              </span>
              {i < 2 && (
                <div
                  className={`h-px w-8 sm:w-12 ${
                    ['address', 'review'].indexOf(step) > i ? 'bg-primary-500' : 'bg-secondary-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-danger-50 p-4 text-sm text-danger-600">
          {error}
        </div>
      )}

      {step === 'address' && (
        <AddressStep
          user={user}
          isLoading={isLoading}
          onSubmit={handleAddressSubmit}
        />
      )}

      {step === 'review' && order && totals && (
        <ReviewStep
          order={order}
          totals={totals}
          items={items}
          isLoading={isLoading}
          onApplyCoupon={handleApplyCoupon}
          onRemoveCoupon={handleRemoveCoupon}
          onProceedToPayment={handleProceedToPayment}
          onBack={goBack}
        />
      )}

      {step === 'payment' && order && clientSecret && (
        <PaymentStep
          order={order}
          clientSecret={clientSecret}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
          onBack={goBack}
        />
      )}
    </div>
  );
}
