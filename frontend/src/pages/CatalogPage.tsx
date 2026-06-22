import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import { useCategories } from '../hooks/useCategories';
import ProductCard from '../components/ProductCard';
import ProductFilters from '../components/ProductFilters';
import CategoryTree from '../components/CategoryTree';
import SearchBar from '../components/SearchBar';

export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = {
    search: searchParams.get('search') || undefined,
    category_id: searchParams.get('category_id') ? Number(searchParams.get('category_id')) : undefined,
    min_price: searchParams.get('min_price') ? Number(searchParams.get('min_price')) : undefined,
    max_price: searchParams.get('max_price') ? Number(searchParams.get('max_price')) : undefined,
    in_stock: searchParams.get('in_stock') === 'true' || undefined,
    sort: searchParams.get('sort') || undefined,
    direction: searchParams.get('direction') || undefined,
    page: searchParams.get('page') ? Number(searchParams.get('page')) : undefined,
    per_page: searchParams.get('per_page') ? Number(searchParams.get('per_page')) : undefined,
  };

  const { data, isLoading, isError, error } = useProducts(filters);
  const { data: categories } = useCategories();

  useEffect(() => {
    document.title = 'Browse Products - Pharos Commerce';
  }, []);

  function handleSearch(value: string) {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set('search', value);
    } else {
      newParams.delete('search');
    }
    newParams.set('page', '1');
    setSearchParams(newParams, { replace: true });
  }

  function handlePageChange(page: number) {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', String(page));
    setSearchParams(newParams, { replace: true });
  }

  return (
    <div className="min-h-full bg-secondary-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-secondary-900">Browse Products</h1>
          <p className="mt-1 text-secondary-600">Discover our collection of products</p>
        </div>

        <div className="mb-6">
          <SearchBar onSearch={handleSearch} initialValue={filters.search || ''} />
        </div>

        <div className="flex flex-col gap-8 lg:flex-row">
          <aside className="w-full shrink-0 space-y-6 lg:w-64">
            {categories && <CategoryTree categories={categories} />}
            <ProductFilters />
          </aside>

          <main className="flex-1">
            {isLoading && (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="animate-pulse rounded-lg border border-secondary-200 bg-white">
                    <div className="aspect-square bg-secondary-200" />
                    <div className="space-y-3 p-4">
                      <div className="h-4 w-3/4 rounded bg-secondary-200" />
                      <div className="h-4 w-1/2 rounded bg-secondary-200" />
                      <div className="h-6 w-1/3 rounded bg-secondary-200" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {isError && (
              <div className="rounded-lg bg-danger-50 p-6 text-center">
                <p className="text-danger-600">
                  {error instanceof Error ? error.message : 'Failed to load products. Please try again.'}
                </p>
              </div>
            )}

            {data && data.data.length === 0 && (
              <div className="rounded-lg bg-white p-12 text-center shadow-sm">
                <svg className="mx-auto h-16 w-16 text-secondary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-secondary-900">No products found</h3>
                <p className="mt-2 text-secondary-500">Try adjusting your search or filter criteria.</p>
              </div>
            )}

            {data && data.data.length > 0 && (
              <>
                <div className="mb-4 text-sm text-secondary-500">
                  Showing {data.meta.from}-{data.meta.to} of {data.meta.total} products
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {data.data.map((product) => (
                    <ProductCard key={product.uuid} product={product} />
                  ))}
                </div>

                {data.meta.last_page > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    <button
                      onClick={() => handlePageChange(data.meta.current_page - 1)}
                      disabled={data.meta.current_page <= 1}
                      className="rounded-md border border-secondary-300 px-3 py-2 text-sm text-secondary-600 hover:bg-secondary-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Previous
                    </button>

                    {Array.from({ length: data.meta.last_page }, (_, i) => i + 1)
                      .filter((page) => {
                        const current = data.meta.current_page;
                        return page === 1 || page === data.meta.last_page || (page >= current - 1 && page <= current + 1);
                      })
                      .map((page, idx, arr) => (
                        <span key={page} className="flex items-center">
                          {idx > 0 && arr[idx - 1] !== page - 1 && (
                            <span className="px-2 text-secondary-400">...</span>
                          )}
                          <button
                            onClick={() => handlePageChange(page)}
                            className={`rounded-md px-3 py-2 text-sm ${
                              page === data.meta.current_page
                                ? 'bg-primary-600 text-white'
                                : 'border border-secondary-300 text-secondary-600 hover:bg-secondary-50'
                            }`}
                          >
                            {page}
                          </button>
                        </span>
                      ))}

                    <button
                      onClick={() => handlePageChange(data.meta.current_page + 1)}
                      disabled={data.meta.current_page >= data.meta.last_page}
                      className="rounded-md border border-secondary-300 px-3 py-2 text-sm text-secondary-600 hover:bg-secondary-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
