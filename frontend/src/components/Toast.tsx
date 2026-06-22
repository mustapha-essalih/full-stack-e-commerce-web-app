import { useToastStore } from '../stores/useToastStore';

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2" aria-live="polite" aria-label="Notifications">
      {toasts.map((toast) => {
        const styles = {
          success: 'bg-success-600 text-white',
          error: 'bg-danger-600 text-white',
          info: 'bg-primary-600 text-white',
        };

        return (
          <div
            key={toast.id}
            className={`flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg text-sm font-medium animate-slide-up ${styles[toast.type]}`}
          >
            <span className="flex-1">{toast.message}</span>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="rounded p-0.5 hover:opacity-80"
              aria-label="Dismiss"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}
