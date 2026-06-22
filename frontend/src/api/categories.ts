import client from './client';
import type { Category, Product, PaginatedResponse, ProductFilters } from './products';

export interface CategoryWithProducts {
  category: Category;
  products: PaginatedResponse<Product>;
}

export async function fetchCategories(): Promise<Category[]> {
  const response = await client.get('/v1/categories');
  return response.data.data;
}

export async function fetchCategoryBySlug(slug: string, filters: ProductFilters = {}): Promise<CategoryWithProducts> {
  const params: Record<string, string | number | boolean> = {};
  if (filters.search) params.search = filters.search;
  if (filters.min_price !== undefined) params.min_price = filters.min_price;
  if (filters.max_price !== undefined) params.max_price = filters.max_price;
  if (filters.in_stock) params.in_stock = true;
  if (filters.sort) params.sort = filters.sort;
  if (filters.direction) params.direction = filters.direction;
  if (filters.page) params.page = filters.page;
  if (filters.per_page) params.per_page = filters.per_page;

  const response = await client.get(`/v1/categories/${slug}`, { params });
  return response.data.data;
}
