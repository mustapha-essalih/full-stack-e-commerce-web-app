const STATUS_ORDER = ['pending', 'paid', 'processing', 'shipped', 'delivered'];

function getStatusIndex(status: string): number {
  const idx = STATUS_ORDER.indexOf(status);
  return idx >= 0 ? idx : -1;
}

function formatLabel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

interface StatusTimelineProps {
  currentStatus: string;
  cancelledAt?: string | null;
}

function StatusTimeline({ currentStatus, cancelledAt }: StatusTimelineProps) {
  const currentIdx = getStatusIndex(currentStatus);
  const isCancelled = currentStatus === 'cancelled' || currentStatus === 'refunded';

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {STATUS_ORDER.map((status, idx) => {
          const isActive = idx <= currentIdx && !isCancelled;
          const isCurrent = idx === currentIdx && !isCancelled;

          return (
            <div key={status} className="flex flex-1 flex-col items-center">
              <div className="flex w-full items-center">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium ${
                    isCurrent
                      ? 'ring-2 ring-primary-500 ring-offset-2'
                      : ''
                    } ${
                      isActive
                        ? 'bg-primary-600 text-white'
                        : 'bg-secondary-100 text-secondary-400'
                    }`}
                >
                  {isActive ? (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>
                {idx < STATUS_ORDER.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 ${
                      idx < currentIdx && !isCancelled ? 'bg-primary-600' : 'bg-secondary-200'
                    }`}
                  />
                )}
              </div>
              <span
                className={`mt-1.5 text-xs font-medium ${
                  isActive ? 'text-primary-600' : 'text-secondary-400'
                }`}
              >
                {formatLabel(status)}
              </span>
            </div>
          );
        })}
      </div>

      {isCancelled && (
        <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-danger-50 px-4 py-2">
          <svg className="h-4 w-4 text-danger-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span className="text-sm font-medium capitalize text-danger-600">
            {currentStatus === 'refunded' ? 'Refunded' : 'Cancelled'}
            {cancelledAt && ` — ${new Date(cancelledAt).toLocaleDateString()}`}
          </span>
        </div>
      )}
    </div>
  );
}

export default StatusTimeline;
