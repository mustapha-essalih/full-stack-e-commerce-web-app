import client from './client';

export interface RevenueSummary {
  revenue_cents: number;
  order_count: number;
  average_order_value_cents: number;
  comparison: {
    revenue_change_cents: number;
    revenue_change_percent: number;
    order_count_change: number;
    order_count_change_percent: number;
    aov_change_cents: number;
    aov_change_percent: number;
  };
}

export interface DailyRevenue {
  date: string;
  revenue_cents: number;
  order_count: number;
}

export interface TopProduct {
  product_id: number;
  product_name: string;
  product_sku: string;
  units_sold: number;
  revenue_cents: number;
}

export interface NewVsReturning {
  new_count: number;
  returning_count: number;
}

export interface CouponUsageSummary {
  unique_coupons_used: number;
  total_usages: number;
  total_discount_cents: number;
  coupons: {
    coupon_code: string;
    times_used: number;
    total_discount_cents: number;
  }[];
}

export async function fetchRevenueSummary(from: string, to: string): Promise<RevenueSummary> {
  const { data } = await client.get('/v1/admin/analytics/summary', { params: { from, to } });
  return data.data as RevenueSummary;
}

export async function fetchRevenueChart(from: string, to: string): Promise<DailyRevenue[]> {
  const { data } = await client.get('/v1/admin/analytics/revenue-chart', { params: { from, to } });
  return data.data as DailyRevenue[];
}

export async function fetchTopProducts(from: string, to: string, limit = 10): Promise<TopProduct[]> {
  const { data } = await client.get('/v1/admin/analytics/top-products', { params: { from, to, limit } });
  return data.data as TopProduct[];
}

export async function fetchAnalyticsCustomers(from: string, to: string): Promise<NewVsReturning> {
  const { data } = await client.get('/v1/admin/analytics/customers', { params: { from, to } });
  return data.data as NewVsReturning;
}

export async function fetchCouponSummary(from: string, to: string): Promise<CouponUsageSummary> {
  const { data } = await client.get('/v1/admin/analytics/coupons', { params: { from, to } });
  return data.data as CouponUsageSummary;
}
