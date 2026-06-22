import client from './client';

interface CategoryFormData {
  name: string;
  slug?: string;
  description?: string;
  parent_id?: number | null;
  is_active?: boolean;
  sort_order?: number;
  image_path?: string | null;
}

export async function fetchAdminCategories() {
  const { data } = await client.get('/v1/admin/categories');
  return data.data;
}

export async function fetchCategoryTree() {
  const { data } = await client.get('/v1/admin/categories/tree');
  return data.data;
}

export async function fetchAdminCategory(id: number) {
  const { data } = await client.get(`/v1/admin/categories/${id}`);
  return data.data;
}

export async function createCategory(data: CategoryFormData) {
  const response = await client.post('/v1/admin/categories', data);
  return response.data.data;
}

export async function updateCategory(id: number, data: CategoryFormData) {
  const response = await client.put(`/v1/admin/categories/${id}`, data);
  return response.data.data;
}

export async function archiveCategory(id: number) {
  await client.delete(`/v1/admin/categories/${id}`);
}
