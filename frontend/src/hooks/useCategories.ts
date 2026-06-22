import { useQuery } from '@tanstack/react-query';
import { fetchCategories, fetchCategoryBySlug } from '../api/categories';
import type { ProductFilters } from '../api/products';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCategoryProducts(slug: string, filters: ProductFilters = {}) {
  return useQuery({
    queryKey: ['category', slug, filters],
    queryFn: () => fetchCategoryBySlug(slug, filters),
    enabled: !!slug,
    placeholderData: (prev) => prev,
  });
}
