import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchOrderByUuid } from '../api/orders';
import { formatPrice } from '../utils/format';

export default function OrderConfirmationPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const [searchParams] = useSearchParams();
  const redirectStatus = searchParams.get('redirect_status');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['order', uuid],
    queryFn: () => fetchOrderByUuid(uuid!),
    enabled: !!uuid,
    retry: 2,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <svg className="mx-auto h-8 w-8 animate-spin text-primary-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="mt-4 text-sm text-secondary-500">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-danger-50">
            <svg className="h-8 w-8 text-danger-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="mt-4 text-lg font-semibold text-secondary-900">Order Not Found</h2>
          <p className="mt-2 text-sm text-secondary-500">
            We couldn't find this order. It may have been removed or the link is invalid.
          </p>
          <Link
            to="/catalog"
            className="mt-6 inline-block rounded-lg bg-primary-600 px-6 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  const { order, totals } = data;
  const isPaid = order.status === 'paid' || redirectStatus === 'succeeded';

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center">
        {isPaid ? (
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-50">
            <svg className="h-8 w-8 text-success-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        ) : (
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-warning-50">
            <svg className="h-8 w-8 text-warning-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        )}

        <h1 className="mt-4 text-2xl font-bold text-secondary-900">
          {isPaid ? 'Payment Successful!' : 'Payment Processing'}
        </h1>
        <p className="mt-2 text-sm text-secondary-500">
          {isPaid
            ? 'Thank you for your order. You will receive a confirmation email shortly.'
            : 'Your payment is being processed. We will notify you once it is confirmed.'}
        </p>
      </div>

      <div className="mt-8 rounded-lg border border-secondary-200 bg-white">
        <div className="border-b border-secondary-200 px-4 py-3">
          <h2 className="text-sm font-medium text-secondary-900">
            Order #{order.uuid.slice(0, 8)}
          </h2>
        </div>
        <div className="p-4">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-secondary-600">Status</dt>
              <dd className={`font-medium capitalize ${isPaid ? 'text-success-600' : 'text-warning-600'}`}>
                {order.status}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-secondary-600">Subtotal</dt>
              <dd className="font-medium text-secondary-900">{formatPrice(totals.subtotal_cents)}</dd>
            </div>
            {totals.discount_cents > 0 && (
              <div className="flex justify-between">
                <dt className="text-secondary-600">Discount</dt>
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
      </div>

      {order.billing_address && (
        <div className="mt-4 rounded-lg border border-secondary-200 bg-white p-4">
          <h3 className="mb-2 text-sm font-medium text-secondary-900">Shipping Address</h3>
          <p className="text-sm text-secondary-600">
            {order.billing_address.first_name} {order.billing_address.last_name}<br />
            {order.billing_address.line1}
            {order.billing_address.line2 && <><br />{order.billing_address.line2}</>}<br />
            {order.billing_address.city}{order.billing_address.state ? `, ${order.billing_address.state}` : ''}{' '}
            {order.billing_address.postal_code}
          </p>
        </div>
      )}

      <div className="mt-8 text-center">
        <Link
          to="/catalog"
          className="inline-block rounded-lg bg-primary-600 px-8 py-3 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
