import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchNotifications, markAsRead, markAllAsRead } from '../../api/adminNotifications';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-notifications'],
    queryFn: fetchNotifications,
    refetchInterval: 60_000,
  });

  const markReadMutation = useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
    },
  });

  const unreadCount = data?.meta.unread_count ?? 0;
  const notifications = data?.data ?? [];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  function getNotificationLink(notification: typeof notifications[number]): string {
    const type = notification.data.type;
    if (type === 'new_order' && notification.data.order_uuid) {
      return `/admin/orders/${notification.data.order_uuid}`;
    }
    if (type === 'low_stock') {
      return '/admin/inventory';
    }
    if (type === 'new_review') {
      return '/admin/reviews';
    }
    return '#';
  }

  function handleNotificationClick(notification: typeof notifications[number]) {
    if (!notification.is_read) {
      markReadMutation.mutate(notification.id);
    }
    const link = getNotificationLink(notification);
    if (link !== '#') {
      navigate(link);
    }
    setOpen(false);
  }

  function handleMarkAllRead() {
    markAllReadMutation.mutate();
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative rounded-lg p-2 text-secondary-500 hover:bg-secondary-100 hover:text-secondary-700"
        aria-label={`Notifications (${unreadCount} unread)`}
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex min-w-[20px] items-center justify-center rounded-full bg-danger-500 px-1.5 py-0.5 text-xs font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-lg border border-secondary-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-secondary-200 px-4 py-3">
            <h3 className="text-sm font-semibold text-secondary-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-xs font-medium text-primary-600 hover:text-primary-500"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
              </div>
            )}

            {isError && (
              <p className="px-4 py-8 text-center text-sm text-danger-500">
                Failed to load notifications.
              </p>
            )}

            {!isLoading && !isError && notifications.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-secondary-500">
                No notifications yet.
              </p>
            )}

            {!isLoading &&
              !isError &&
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full border-b border-secondary-100 px-4 py-3 text-left text-sm transition-colors hover:bg-secondary-50 ${
                    !notification.is_read ? 'bg-primary-50/50' : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!notification.is_read && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary-500" />
                    )}
                    <div className={!notification.is_read ? 'flex-1' : 'flex-1 pl-4'}>
                      <p className="text-secondary-800">{notification.data.message}</p>
                      <p className="mt-0.5 text-xs text-secondary-400">
                        {formatTimeAgo(notification.created_at)}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

function formatTimeAgo(dateString: string): string {
  const now = Date.now();
  const date = new Date(dateString).getTime();
  const diffMs = now - date;
  const diffMinutes = Math.floor(diffMs / 60_000);

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Date(dateString).toLocaleDateString();
}
