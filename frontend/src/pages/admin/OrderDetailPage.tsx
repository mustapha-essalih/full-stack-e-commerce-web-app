import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAdminOrder, updateOrderStatus } from '../../api/orders';
import { formatPrice } from '../../utils/format';
import OrderStatusBadge from '../../components/OrderStatusBadge';
import StatusTimeline from '../../components/StatusTimeline';
import { useToastStore } from '../../stores/useToastStore';

const STATUS_TRANSITIONS: Record<string, { label: string; status: string; needsTracking: boolean }[]> = {
  pending: [
    { label: 'Mark as Paid', status: 'paid', needsTracking: false },
  ],
  paid: [
    { label: 'Start Processing', status: 'processing', needsTracking: false },
    { label: 'Cancel Order', status: 'cancelled', needsTracking: false },
  ],
  processing: [
    { label: 'Mark as Shipped', status: 'shipped', needsTracking: true },
    { label: 'Cancel Order', status: 'cancelled', needsTracking: false },
  ],
  shipped: [
    { label: 'Mark as Delivered', status: 'delivered', needsTracking: false },
  ],
};

export default function AdminOrderDetailPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);

  const [trackingNumber, setTrackingNumber] = useState('');

  const { data: order, isLoading, isError } = useQuery({
    queryKey: ['admin-order', uuid],
    queryFn: () => fetchAdminOrder(uuid!),
    enabled: !!uuid,
  });

  const statusMutation = useMutation({
    mutationFn: ({ status, tracking }: { status: string; tracking?: string }) =>
      updateOrderStatus(uuid!, status, tracking),
    onSuccess: (updatedOrder) => {
      queryClient.invalidateQueries({ queryKey: ['admin-order', uuid] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      addToast(`Order status updated to ${updatedOrder.status}.`, 'success');
      setTrackingNumber('');
    },
    onError: () => {
      addToast('Failed to update order status.', 'error');
    },
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-64 rounded bg-secondary-200" />
          <div className="h-48 rounded-lg bg-secondary-200" />
          <div className="h-32 rounded-lg bg-secondary-200" />
        </div>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-danger-200 bg-danger-50 p-12 text-center">
          <h2 className="text-lg font-semibold text-secondary-900">Order Not Found</h2>
          <Link
            to="/admin/orders"
            className="mt-4 inline-block rounded-lg bg-primary-600 px-6 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  const transitions = STATUS_TRANSITIONS[order.status] ?? [];
  const shippingAddr = order.shipping_address as Record<string, string> | null | undefined;
  const billingAddr = order.billing_address as Record<string, string> | null | undefined;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link
            to="/admin/orders"
            className="mb-2 inline-flex items-center gap-1 text-sm text-secondary-500 hover:text-secondary-700"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Orders
          </Link>
          <h1 className="text-2xl font-bold text-secondary-900">
            Order #{order.uuid.slice(0, 8)}
          </h1>
          <p className="mt-1 text-sm text-secondary-500">
            {order.user_id ? `Customer #${order.user_id}` : 'Guest'} &middot;{' '}
            {new Date(order.created_at).toLocaleDateString('en-US', {
              year: 'numeric', month: 'long', day: 'numeric',
            })}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="mb-8 rounded-lg border border-secondary-200 bg-white p-6">
        <StatusTimeline currentStatus={order.status} cancelledAt={order.cancelled_at} />
      </div>

      {transitions.length > 0 && (
        <div className="mb-6 rounded-lg border border-secondary-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold text-secondary-900">Update Status</h2>
          {transitions.some((t) => t.needsTracking) && (
            <div className="mb-4">
              <label className="mb-1 block text-xs font-medium text-secondary-600">Tracking Number</label>
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Enter tracking number..."
                className="w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          )}
          <div className="flex flex-wrap gap-3">
            {transitions.map((transition) => (
              <button
                key={transition.status}
                type="button"
                onClick={() =>
                  statusMutation.mutate({
                    status: transition.status,
                    tracking: transition.needsTracking ? trackingNumber : undefined,
                  })
                }
                disabled={statusMutation.isPending || (transition.needsTracking && !trackingNumber)}
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {statusMutation.isPending ? 'Updating...' : transition.label}
              </button>
            ))}
          </div>
          {statusMutation.isError && (
            <p className="mt-2 text-sm text-danger-600">Failed to update status.</p>
          )}
        </div>
      )}

      {order.items && order.items.length > 0 && (
        <div className="mb-6 rounded-lg border border-secondary-200 bg-white">
          <div className="border-b border-secondary-200 px-6 py-3">
            <h2 className="text-sm font-semibold text-secondary-900">Items</h2>
          </div>
          <div className="divide-y divide-secondary-100">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="text-sm font-medium text-secondary-900">{item.product_name}</p>
                  <p className="text-xs text-secondary-500">SKU: {item.product_sku}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-secondary-900">{item.unit_price_formatted} x {item.quantity}</p>
                  <p className="text-sm font-semibold text-secondary-900">{item.total_formatted}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-6 rounded-lg border border-secondary-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-secondary-900">Order Summary</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-secondary-600">Subtotal</dt>
            <dd className="font-medium text-secondary-900">{order.subtotal_formatted}</dd>
          </div>
          {Number(order.discount_cents) > 0 && (
            <div className="flex justify-between">
              <dt className="text-secondary-600">Discount</dt>
              <dd className="font-medium text-success-600">-{order.discount_formatted}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-secondary-600">Shipping</dt>
            <dd className="font-medium text-secondary-900">{order.shipping_formatted}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-secondary-600">Tax</dt>
            <dd className="font-medium text-secondary-900">{order.tax_formatted}</dd>
          </div>
          <div className="flex justify-between border-t border-secondary-200 pt-2">
            <dt className="text-base font-semibold text-secondary-900">Total</dt>
            <dd className="text-base font-semibold text-secondary-900">{order.total_formatted}</dd>
          </div>
        </dl>
      </div>

      <div className="mb-6 grid gap-6 sm:grid-cols-2">
        {shippingAddr && (
          <div className="rounded-lg border border-secondary-200 bg-white p-6">
            <h3 className="mb-2 text-sm font-semibold text-secondary-900">Shipping Address</h3>
            <p className="text-sm text-secondary-600">
              {shippingAddr.first_name} {shippingAddr.last_name}<br />
              {shippingAddr.line1}
              {shippingAddr.line2 && <><br />{shippingAddr.line2}</>}<br />
              {shippingAddr.city}{shippingAddr.state ? `, ${shippingAddr.state}` : ''}{' '}
              {shippingAddr.postal_code}
            </p>
          </div>
        )}
        {billingAddr && (
          <div className="rounded-lg border border-secondary-200 bg-white p-6">
            <h3 className="mb-2 text-sm font-semibold text-secondary-900">Billing Address</h3>
            <p className="text-sm text-secondary-600">
              {billingAddr.first_name} {billingAddr.last_name}<br />
              {billingAddr.line1}
              {billingAddr.line2 && <><br />{billingAddr.line2}</>}<br />
              {billingAddr.city}{billingAddr.state ? `, ${billingAddr.state}` : ''}{' '}
              {billingAddr.postal_code}
            </p>
          </div>
        )}
      </div>

      {order.tracking_number && (
        <div className="mb-6 rounded-lg border border-secondary-200 bg-white p-6">
          <h3 className="mb-2 text-sm font-semibold text-secondary-900">Tracking Number</h3>
          <p className="font-mono text-sm text-secondary-600">{order.tracking_number}</p>
        </div>
      )}

      {order.payment && (
        <div className="mb-6 rounded-lg border border-secondary-200 bg-white p-6">
          <h3 className="mb-2 text-sm font-semibold text-secondary-900">Payment</h3>
          <p className="text-sm text-secondary-600">
            Status: <span className="capitalize font-medium">{order.payment.status}</span>
            {order.payment.stripe_charge_id && (
              <> &middot; Charge: {order.payment.stripe_charge_id}</>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
