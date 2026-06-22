import { Link, useSearchParams } from 'react-router-dom';
import { useWishlist, useRemoveFromWishlist } from '../../hooks/useAccount';
import { useToastStore } from '../../stores/useToastStore';
import AddToCartButton from '../../components/AddToCartButton';

export default function WishlistPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page')) || 1;

  const { data, isLoading, isError } = useWishlist(page);
  const removeMutation = useRemoveFromWishlist();
  const addToast = useToastStore((s) => s.addToast);

  async function handleRemove(productId: number) {
    try {
      await removeMutation.mutateAsync(productId);
      addToast('Removed from wishlist.', 'success');
    } catch {
      addToast('Failed to remove from wishlist.', 'error');
    }
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse rounded-lg border border-secondary-200 bg-white">
            <div className="aspect-square bg-secondary-200" />
            <div className="space-y-3 p-4">
              <div className="h-4 w-3/4 rounded bg-secondary-200" />
              <div className="h-4 w-1/4 rounded bg-secondary-200" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-danger-200 bg-danger-50 p-4 text-sm text-danger-600">
        Failed to load wishlist.
      </div>
    );
  }

  const items = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div>
      <h2 className="mb-6 text-lg font-semibold text-secondary-900">My Wishlist</h2>

      {items.length === 0 ? (
        <div className="rounded-lg border border-secondary-200 bg-white p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <h3 className="mt-4 text-sm font-semibold text-secondary-900">Your wishlist is empty</h3>
          <p className="mt-2 text-sm text-secondary-500">Save your favorite items here.</p>
          <Link
            to="/catalog"
            className="mt-6 inline-block rounded-lg bg-primary-600 px-6 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => {
              const product = item.product;
              const primaryImage = product.images?.find((img) => img.is_primary) || product.images?.[0];

              return (
                <div key={item.id} className="group relative flex flex-col overflow-hidden rounded-lg border border-secondary-200 bg-white transition-shadow hover:shadow-lg">
                  <button
                    type="button"
                    onClick={() => handleRemove(product.id)}
                    className="absolute right-2 top-2 z-10 rounded-full bg-white/80 p-1.5 text-danger-500 hover:bg-white hover:text-danger-600"
                    aria-label="Remove from wishlist"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                  </button>

                  <Link to={`/product/${product.slug}`} className="aspect-square overflow-hidden bg-secondary-100">
                    {primaryImage ? (
                      <img
                        src={primaryImage.thumbnail_url}
                        alt={primaryImage.alt_text || product.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-secondary-400">
                        <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </Link>

                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <Link to={`/product/${product.slug}`}>
                      <h3 className="text-sm font-medium text-secondary-900 line-clamp-2 group-hover:text-primary-600">
                        {product.name}
                      </h3>
                    </Link>

                    <div className="mt-auto flex items-center justify-between">
                      <span className="text-lg font-bold text-secondary-900">{product.price_formatted}</span>
                    </div>

                    <AddToCartButton product={product} />
                  </div>
                </div>
              );
            })}
          </div>

          {meta && meta.last_page > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setSearchParams({ page: String(page - 1) })}
                className="rounded-lg border border-secondary-300 px-4 py-2 text-sm font-medium text-secondary-600 hover:bg-secondary-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              {Array.from({ length: meta.last_page }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setSearchParams({ page: String(p) })}
                  className={`rounded-lg px-3 py-2 text-sm font-medium ${
                    p === page
                      ? 'bg-primary-600 text-white'
                      : 'border border-secondary-300 text-secondary-600 hover:bg-secondary-50'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                disabled={page >= meta.last_page}
                onClick={() => setSearchParams({ page: String(page + 1) })}
                className="rounded-lg border border-secondary-300 px-4 py-2 text-sm font-medium text-secondary-600 hover:bg-secondary-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
