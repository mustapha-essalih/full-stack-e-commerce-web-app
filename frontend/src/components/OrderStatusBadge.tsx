const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-warning-50 text-warning-600 border-warning-200',
  paid: 'bg-primary-50 text-primary-600 border-primary-200',
  processing: 'bg-accent-50 text-accent-600 border-accent-200',
  shipped: 'bg-blue-50 text-blue-600 border-blue-200',
  delivered: 'bg-success-50 text-success-600 border-success-200',
  cancelled: 'bg-danger-50 text-danger-600 border-danger-200',
  refunded: 'bg-secondary-100 text-secondary-600 border-secondary-300',
};

function OrderStatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? 'bg-secondary-50 text-secondary-600 border-secondary-200';

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${style}`}
    >
      {status}
    </span>
  );
}

export default OrderStatusBadge;
