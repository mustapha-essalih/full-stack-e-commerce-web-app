import client from './client';

export interface NotificationData {
  id: string;
  type: string;
  data: {
    type: string;
    order_uuid?: string;
    product_id?: number;
    product_uuid?: string;
    review_id?: number;
    message: string;
    [key: string]: unknown;
  };
  read_at: string | null;
  created_at: string;
  is_read: boolean;
}

export interface NotificationsResponse {
  data: NotificationData[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    unread_count: number;
  };
}

export async function fetchNotifications(): Promise<NotificationsResponse> {
  const { data } = await client.get('/v1/admin/notifications', {
    params: { per_page: 10 },
  });
  return data;
}

export async function markAsRead(id: string): Promise<void> {
  await client.patch(`/v1/admin/notifications/${id}/read`);
}

export async function markAllAsRead(): Promise<{ message: string }> {
  const { data } = await client.post('/v1/admin/notifications/read-all');
  return data;
}
