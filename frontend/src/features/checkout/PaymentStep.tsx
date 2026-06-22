import { useState } from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import type { Order } from '../../api/orders';
import { formatPrice } from '../../utils/format';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_KEY ?? '');

interface PaymentStepProps {
  order: Order;
  clientSecret: string;
  onSuccess: (orderUuid: string) => void;
  onError: (message: string) => void;
  onBack: () => void;
}

function PaymentForm({ order, onSuccess, onError, onBack }: Omit<PaymentStepProps, 'clientSecret'>) {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/orders/${order.uuid}/confirmation`,
      },
      redirect: 'if_required',
    });

    if (error) {
      const message = error.message ?? 'Payment failed. Please try again.';
      setErrorMessage(message);
      onError(message);
      setIsSubmitting(false);
    } else {
      onSuccess(order.uuid);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-lg border border-secondary-200 bg-white p-4">
        <h3 className="mb-4 text-sm font-medium text-secondary-900">Payment Details</h3>
        <PaymentElement />
      </div>

      {errorMessage && (
        <div className="rounded-lg bg-danger-50 p-3 text-sm text-danger-600">
          {errorMessage}
        </div>
      )}

      <div className="rounded-lg border border-secondary-200 bg-secondary-50 p-4">
        <dl className="space-y-1 text-sm">
          <div className="flex justify-between">
            <dt className="text-secondary-600">Total</dt>
            <dd className="font-semibold text-secondary-900">{formatPrice(order.total_cents)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-secondary-600">Order</dt>
            <dd className="text-secondary-600">{order.uuid.slice(0, 8)}...</dd>
          </div>
        </dl>
      </div>

      <div className="flex items-center justify-between border-t border-secondary-200 pt-6">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="text-sm font-medium text-primary-600 hover:text-primary-500 disabled:opacity-50"
        >
          &larr; Back to Review
        </button>

        <button
          type="submit"
          disabled={!stripe || !elements || isSubmitting}
          className="rounded-lg bg-primary-600 px-8 py-3 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Processing...
            </span>
          ) : (
            `Pay ${formatPrice(order.total_cents)}`
          )}
        </button>
      </div>
    </form>
  );
}

export default function PaymentStep(props: PaymentStepProps) {
  const { clientSecret } = props;

  if (!clientSecret) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <svg className="mx-auto h-8 w-8 animate-spin text-primary-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="mt-2 text-sm text-secondary-500">Loading payment form...</p>
        </div>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <div>
        <h2 className="mb-6 text-lg font-semibold text-secondary-900">Payment</h2>
        <PaymentForm {...props} />
      </div>
    </Elements>
  );
}
