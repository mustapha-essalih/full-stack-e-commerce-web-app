import client from './client';

export interface InventoryProduct {
  id: number;
  uuid: string;
  name: string;
  slug: string;
  sku: string;
  stock_quantity: number;
  price_cents: number;
  price_formatted: string;
}

export interface InventoryAdjustment {
  id: number;
  product_id: number;
  user: { id: number; name: string } | null;
  type: string;
  quantity_change: number;
  quantity_after: number;
  note: string | null;
  created_at: string;
}

interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

interface LowStockResponse {
  data: InventoryProduct[];
  meta: { count: number };
}

interface HistoryResponse {
  data: InventoryAdjustment[];
  meta: PaginationMeta;
  links: { first: string; last: string; prev: string | null; next: string | null };
}

export async function fetchLowStockProducts(): Promise<LowStockResponse> {
  const { data } = await client.get('/v1/admin/inventory/low-stock');
  return data;
}

export async function adjustStock(
  productId: number,
  type: 'restock' | 'adjustment' | 'correction',
  quantity: number,
  note?: string,
): Promise<{ data: InventoryProduct; message: string }> {
  const { data } = await client.post(`/v1/admin/inventory/${productId}/adjust`, {
    type,
    quantity,
    note,
  });
  return data;
}

export async function fetchAdjustmentHistory(
  productId: number,
  page: number = 1,
): Promise<HistoryResponse> {
  const { data } = await client.get(`/v1/admin/inventory/${productId}/history`, {
    params: { page },
  });
  return data;
}

export async function fetchAllProducts(filters?: {
  page?: number;
  per_page?: number;
  search?: string;
}): Promise<{ data: InventoryProduct[]; meta: PaginationMeta }> {
  const params: Record<string, string> = {};
  if (filters?.page) params['page'] = String(filters.page);
  if (filters?.per_page) params['per_page'] = String(filters.per_page);
  if (filters?.search) params['search'] = filters.search;
  const { data } = await client.get('/v1/admin/products', { params });
  return data;
}
