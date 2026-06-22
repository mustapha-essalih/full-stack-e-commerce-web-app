import { useQuery } from '@tanstack/react-query';
import { fetchProducts, fetchProduct, fetchFeaturedProducts } from '../api/products';
import type { ProductFilters } from '../api/products';

export function useProducts(filters: ProductFilters = {}) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => fetchProducts(filters),
    placeholderData: (prev) => prev,
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: () => fetchProduct(slug),
    enabled: !!slug,
  });
}

export function useFeaturedProducts() {
  return useQuery({
    queryKey: ['products', 'featured'],
    queryFn: fetchFeaturedProducts,
  });
}
