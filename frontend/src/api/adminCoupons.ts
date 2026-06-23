import client from './client';

export interface Coupon {
  id: number;
  code: string;
  description: string | null;
  type: 'percentage' | 'fixed_amount';
  value: number;
  minimum_order_cents: number | null;
  usage_limit: number | null;
  usage_count: number;
  per_customer_limit: number | null;
  starts_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  type_formatted: string;
  value_formatted: string;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CouponUsage {
  id: number;
  coupon_id: number;
  order_uuid: string;
  order_status: string;
  user_id: number | null;
  user_name: string | null;
  discount_cents: number;
  used_at: string;
  created_at: string;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface PaginatedCoupons {
  data: Coupon[];
  meta: PaginationMeta;
}

export interface PaginatedUsages {
  data: CouponUsage[];
  meta: PaginationMeta;
}

export async function fetchAdminCoupons(params?: {
  page?: number;
  per_page?: number;
  search?: string;
  sort?: string;
  direction?: string;
}): Promise<PaginatedCoupons> {
  const response = await client.get('/v1/admin/coupons', { params });
  return response.data;
}

export async function fetchAdminCoupon(id: number): Promise<Coupon> {
  const response = await client.get(`/v1/admin/coupons/${id}`);
  return response.data.data;
}

export async function createCoupon(data: Partial<Coupon>): Promise<Coupon> {
  const response = await client.post('/v1/admin/coupons', data);
  return response.data.data;
}

export async function updateCoupon(id: number, data: Partial<Coupon>): Promise<Coupon> {
  const response = await client.put(`/v1/admin/coupons/${id}`, data);
  return response.data.data;
}

export async function archiveCoupon(id: number): Promise<void> {
  await client.delete(`/v1/admin/coupons/${id}`);
}

export async function fetchCouponUsages(
  id: number,
  page = 1,
  perPage = 15,
): Promise<PaginatedUsages> {
  const response = await client.get(`/v1/admin/coupons/${id}/usages`, {
    params: { page, per_page: perPage },
  });
  return response.data;
}
