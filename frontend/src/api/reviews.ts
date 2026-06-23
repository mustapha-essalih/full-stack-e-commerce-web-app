import client from './client';
import type { Product } from './products';

export interface Review {
  id: number;
  rating: number;
  title: string | null;
  body: string | null;
  reviewer_name: string | null;
  is_approved: boolean;
  is_flagged: boolean;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  product?: Product;
}

export interface ReviewPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  average_rating: number | null;
  review_count: number;
}

export interface ReviewListResponse {
  data: Review[];
  meta: ReviewPaginationMeta;
}

export interface ReviewData {
  rating: number;
  title?: string;
  body?: string;
}

export async function fetchProductReviews(
  slug: string,
  page = 1,
  perPage = 15,
): Promise<ReviewListResponse> {
  const response = await client.get(`/v1/products/${slug}/reviews`, {
    params: { page, per_page: perPage },
  });
  return response.data;
}

export async function submitReview(
  slug: string,
  data: ReviewData,
): Promise<Review> {
  const response = await client.post(`/v1/products/${slug}/reviews`, data);
  return response.data.data;
}

export async function fetchMyReviews(
  page = 1,
  perPage = 15,
): Promise<ReviewListResponse> {
  const response = await client.get('/v1/account/reviews', {
    params: { page, per_page: perPage },
  });
  return response.data;
}

export async function fetchAdminReviews(
  status?: string,
  page = 1,
  perPage = 15,
): Promise<ReviewListResponse> {
  const params: Record<string, string | number> = { page, per_page: perPage };
  if (status) params['filter[status]'] = status;
  const response = await client.get('/v1/admin/reviews', { params });
  return response.data;
}

export async function approveReview(id: number): Promise<Review> {
  const response = await client.patch(`/v1/admin/reviews/${id}/approve`);
  return response.data.data;
}

export async function rejectReview(id: number): Promise<Review> {
  const response = await client.patch(`/v1/admin/reviews/${id}/reject`);
  return response.data.data;
}

export async function flagReview(id: number): Promise<Review> {
  const response = await client.patch(`/v1/admin/reviews/${id}/flag`);
  return response.data.data;
}
