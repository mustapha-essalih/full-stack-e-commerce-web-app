import client from './client';

export interface ProductFilters {
  search?: string;
  category_id?: number;
  category_slug?: string;
  min_price?: number;
  max_price?: number;
  in_stock?: boolean;
  sort?: string;
  direction?: string;
  page?: number;
  per_page?: number;
}

export interface ProductImage {
  id: number;
  path: string;
  url: string;
  thumbnail_url: string;
  alt_text: string | null;
  sort_order: number;
  is_primary: boolean;
}

export interface Category {
  uuid: string;
  name: string;
  slug: string;
  description: string | null;
  parent_id: number | null;
  image_path: string | null;
  is_active: boolean;
  sort_order: number;
  products_count?: number;
  children?: Category[];
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: number;
  uuid: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  price_cents: number;
  price_formatted: string;
  compare_price_cents: number | null;
  compare_price_formatted: string | null;
  sku: string;
  stock_quantity: number;
  is_active: boolean;
  is_featured: boolean;
  weight_grams: number | null;
  meta_title: string | null;
  meta_description: string | null;
  images: ProductImage[];
  primary_image: ProductImage | null;
  categories: Category[];
  created_at: string;
  updated_at: string;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface PaginationLinks {
  first: string | null;
  last: string | null;
  prev: string | null;
  next: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
  links: PaginationLinks;
}

export async function fetchProducts(filters: ProductFilters = {}): Promise<PaginatedResponse<Product>> {
  const params: Record<string, string | number | boolean> = {};
  if (filters.search) params.search = filters.search;
  if (filters.category_id) params.category_id = filters.category_id;
  if (filters.category_slug) params.category_slug = filters.category_slug;
  if (filters.min_price !== undefined) params.min_price = filters.min_price;
  if (filters.max_price !== undefined) params.max_price = filters.max_price;
  if (filters.in_stock) params.in_stock = true;
  if (filters.sort) params.sort = filters.sort;
  if (filters.direction) params.direction = filters.direction;
  if (filters.page) params.page = filters.page;
  if (filters.per_page) params.per_page = filters.per_page;

  const response = await client.get('/v1/products', { params });
  return response.data;
}

export async function fetchProduct(slug: string): Promise<{ product: Product; related: Product[] }> {
  const response = await client.get(`/v1/products/${slug}`);
  return response.data.data;
}

export async function fetchFeaturedProducts(): Promise<Product[]> {
  const response = await client.get('/v1/products/featured');
  return response.data.data;
}
