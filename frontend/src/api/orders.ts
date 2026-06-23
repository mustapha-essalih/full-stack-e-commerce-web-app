import client from './client';

export interface AddressInfo {
  id?: number;
  first_name: string;
  last_name: string;
  line1: string;
  line2?: string | null;
  city: string;
  state?: string | null;
  postal_code?: string | null;
  country_code: string;
}

export interface PaymentInfo {
  id: number;
  status: string;
  amount_cents: number;
  currency: string;
  stripe_charge_id: string | null;
  created_at: string;
}

export interface OrderItem {
  id: number;
  product_id: number | null;
  product_name: string;
  product_sku: string;
  quantity: number;
  unit_price_cents: number;
  total_cents: number;
  unit_price_formatted: string;
  total_formatted: string;
}

export interface Order {
  uuid: string;
  user_id: number | null;
  status: string;
  subtotal_cents: number;
  tax_cents: number;
  shipping_cents: number;
  discount_cents: number;
  total_cents: number;
  currency: string;
  coupon_code: string | null;
  tracking_number: string | null;
  subtotal_formatted: string;
  tax_formatted: string;
  shipping_formatted: string;
  discount_formatted: string;
  total_formatted: string;
  paid_at: string | null;
  cancelled_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  processing_at: string | null;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
  billing_address?: AddressInfo | null;
  shipping_address?: AddressInfo | null;
  payment?: PaymentInfo | null;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface PaginatedOrders {
  data: Order[];
  meta: PaginationMeta;
}

export async function fetchCustomerOrders(page = 1, perPage = 15): Promise<PaginatedOrders> {
  const response = await client.get('/v1/orders', { params: { page, per_page: perPage } });
  return response.data;
}

export async function fetchCustomerOrder(uuid: string): Promise<Order> {
  const response = await client.get(`/v1/orders/${uuid}`);
  return response.data.data;
}

export async function cancelCustomerOrder(uuid: string): Promise<Order> {
  const response = await client.post(`/v1/orders/${uuid}/cancel`);
  return response.data.data;
}

export async function fetchAdminOrders(filters?: {
  status?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  page?: number;
  per_page?: number;
}): Promise<PaginatedOrders> {
  const params: Record<string, string | number> = {};

  if (filters?.page) params.page = filters.page;
  if (filters?.per_page) params.per_page = filters.per_page;

  if (filters?.status) params['filter[status]'] = filters.status;
  if (filters?.date_from) params['filter[date_from]'] = filters.date_from;
  if (filters?.date_to) params['filter[date_to]'] = filters.date_to;
  if (filters?.search) params['filter[search]'] = filters.search;

  const response = await client.get('/v1/admin/orders', { params });
  return response.data;
}

export async function fetchAdminOrder(uuid: string): Promise<Order> {
  const response = await client.get(`/v1/admin/orders/${uuid}`);
  return response.data.data;
}

export async function updateOrderStatus(
  uuid: string,
  status: string,
  trackingNumber?: string,
): Promise<Order> {
  const response = await client.patch(`/v1/admin/orders/${uuid}/status`, {
    status,
    tracking_number: trackingNumber,
  });
  return response.data.data;
}

export async function updateOrderNotes(
  uuid: string,
  adminNotes: string,
): Promise<{ admin_notes: string }> {
  const response = await client.patch(`/v1/admin/orders/${uuid}/notes`, {
    admin_notes: adminNotes,
  });
  return response.data.data;
}

export async function refundOrder(uuid: string): Promise<Order> {
  const response = await client.post(`/v1/admin/orders/${uuid}/refund`);
  return response.data.data;
}
