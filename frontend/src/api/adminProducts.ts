import client from './client';

interface ProductFilters {
  page?: number;
  per_page?: number;
  search?: string;
  category_id?: number;
  min_price?: number;
  max_price?: number;
  in_stock?: boolean;
  sort?: string;
  direction?: string;
}

export async function fetchAdminProducts(filters: ProductFilters = {}) {
  const params: Record<string, string> = {};
  if (filters.page) params['page'] = String(filters.page);
  if (filters.per_page) params['per_page'] = String(filters.per_page);
  if (filters.search) params['search'] = filters.search;
  if (filters.category_id) params['category_id'] = String(filters.category_id);
  if (filters.min_price) params['min_price'] = String(filters.min_price);
  if (filters.max_price) params['max_price'] = String(filters.max_price);
  if (filters.in_stock) params['in_stock'] = '1';
  if (filters.sort) params['sort'] = filters.sort;
  if (filters.direction) params['direction'] = filters.direction;

  const { data } = await client.get('/v1/admin/products', { params });
  return data;
}

export async function fetchAdminProduct(id: number) {
  const { data } = await client.get(`/v1/admin/products/${id}`);
  return data.data;
}

export async function createProduct(formData: FormData) {
  const { data } = await client.post('/v1/admin/products', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
}

export async function updateProduct(id: number, formData: FormData) {
  formData.append('_method', 'PUT');
  const { data } = await client.post(`/v1/admin/products/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
}

export async function archiveProduct(id: number) {
  await client.delete(`/v1/admin/products/${id}`);
}

export async function restoreProduct(id: number) {
  const { data } = await client.post(`/v1/admin/products/${id}/restore`);
  return data.data;
}

export async function bulkProductAction(action: 'activate' | 'archive', ids: number[]) {
  const { data } = await client.post('/v1/admin/products/bulk-action', { action, ids });
  return data;
}

export async function uploadProductImages(productId: number, files: File[]) {
  const formData = new FormData();
  files.forEach((file) => formData.append('images[]', file));
  const { data } = await client.post(`/v1/admin/products/${productId}/images`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
}

export async function deleteProductImage(productId: number, imageId: number) {
  await client.delete(`/v1/admin/products/${productId}/images/${imageId}`);
}

export async function reorderProductImages(productId: number, images: { id: number; sort_order: number }[]) {
  await client.patch(`/v1/admin/products/${productId}/images/reorder`, { images });
}
