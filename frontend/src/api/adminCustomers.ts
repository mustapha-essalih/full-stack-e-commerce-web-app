import client from './client';

export interface Customer {
  uuid: string;
  name: string;
  email: string;
  email_verified_at: string | null;
  is_suspended: boolean;
  suspended_at: string | null;
  created_at: string;
  orders_count: number;
  total_spent_cents: number;
  total_spent_formatted: string;
}

export interface Order {
  uuid: string;
  status: string;
  total_cents: number;
  total_formatted: string;
  created_at: string;
  items?: { id: number; product_name: string; quantity: number }[];
  payment?: { status: string } | null;
}

export interface CustomerDetail extends Customer {
  recent_orders: Order[];
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface PaginatedCustomers {
  data: Customer[];
  meta: PaginationMeta;
}

export async function fetchAdminCustomers(filters?: {
  page?: number;
  per_page?: number;
  search?: string;
  date_from?: string;
  date_to?: string;
  has_orders?: string;
}): Promise<PaginatedCustomers> {
  const params: Record<string, string | number> = {};

  if (filters?.page) params.page = filters.page;
  if (filters?.per_page) params.per_page = filters.per_page;
  if (filters?.search) params['filter[search]'] = filters.search;
  if (filters?.date_from) params['filter[date_from]'] = filters.date_from;
  if (filters?.date_to) params['filter[date_to]'] = filters.date_to;
  if (filters?.has_orders) params['filter[has_orders]'] = filters.has_orders;

  const response = await client.get('/v1/admin/customers', { params });
  return response.data;
}

export async function fetchAdminCustomer(uuid: string): Promise<CustomerDetail> {
  const response = await client.get(`/v1/admin/customers/${uuid}`);
  return response.data.data;
}

export async function suspendCustomer(uuid: string): Promise<Customer> {
  const response = await client.patch(`/v1/admin/customers/${uuid}/suspend`);
  return response.data.data;
}

export async function reinstateCustomer(uuid: string): Promise<Customer> {
  const response = await client.patch(`/v1/admin/customers/${uuid}/reinstate`);
  return response.data.data;
}
