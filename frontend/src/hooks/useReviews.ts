import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchProductReviews,
  submitReview,
  fetchMyReviews,
  fetchAdminReviews,
  approveReview,
  rejectReview,
  flagReview,
} from '../api/reviews';
import type { ReviewData } from '../api/reviews';

export function useProductReviews(slug: string, page = 1) {
  return useQuery({
    queryKey: ['product-reviews', slug, page],
    queryFn: () => fetchProductReviews(slug, page),
    enabled: !!slug,
  });
}

export function useSubmitReview(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ReviewData) => submitReview(slug, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-reviews', slug] });
    },
  });
}

export function useMyReviews(page = 1) {
  return useQuery({
    queryKey: ['account', 'reviews', page],
    queryFn: () => fetchMyReviews(page),
  });
}

export function useAdminReviews(status?: string, page = 1) {
  return useQuery({
    queryKey: ['admin-reviews', status, page],
    queryFn: () => fetchAdminReviews(status, page),
  });
}

export function useApproveReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => approveReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
    },
  });
}

export function useRejectReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => rejectReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
    },
  });
}

export function useFlagReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => flagReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
    },
  });
}
