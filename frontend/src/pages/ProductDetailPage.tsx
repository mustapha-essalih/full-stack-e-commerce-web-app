import { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useProduct } from '../hooks/useProducts';
import { useProductReviews } from '../hooks/useReviews';
import { useAuthStore } from '../stores/useAuthStore';
import client from '../api/client';
import AddToCartButton from '../components/AddToCartButton';
import ProductGallery from '../components/ProductGallery';
import ProductCard from '../components/ProductCard';
import StarRating from '../components/StarRating';
import ReviewCard from '../components/ReviewCard';
import WriteReviewForm from '../components/WriteReviewForm';
import WishlistButton from '../components/WishlistButton';

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data, isLoading, isError, error } = useProduct(slug!);
  const reviewPage = Number(searchParams.get('review_page')) || 1;
  const { data: reviewsData } = useProductReviews(slug!, reviewPage);

  const [eligibility, setEligibility] = useState<{
    eligible: boolean;
    already_reviewed: boolean;
  } | null>(null);

  const product = data?.product;
  const related = data?.related || [];
  const reviews = reviewsData?.data || [];
  const reviewMeta = reviewsData?.meta;

  useEffect(() => {
    if (product) {
      document.title = `${product.name} - Pharos Commerce`;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc && product.meta_description) {
        metaDesc.setAttribute('content', product.meta_description);
      }
    }
  }, [product]);

  useEffect(() => {
    if (!isAuthenticated || !slug) {
      setEligibility(null);
      return;
    }
    client
      .get(`/v1/products/${slug}/reviews/eligibility`)
      .then((res) => setEligibility(res.data.data))
      .catch(() => setEligibility(null));
  }, [isAuthenticated, slug]);

  if (isLoading) {
    return (
      <div className="min-h-full bg-secondary-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-8">
            <div className="h-4 w-48 rounded bg-secondary-200" />
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              <div className="aspect-square rounded-lg bg-secondary-200" />
              <div className="space-y-4">
                <div className="h-8 w-3/4 rounded bg-secondary-200" />
                <div className="h-6 w-1/4 rounded bg-secondary-200" />
                <div className="h-4 w-full rounded bg-secondary-200" />
                <div className="h-4 w-2/3 rounded bg-secondary-200" />
                <div className="h-12 w-48 rounded bg-secondary-200" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="min-h-full bg-secondary-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-lg bg-danger-50 p-6 text-center">
            <p className="text-danger-600">
              {error instanceof Error ? error.message : 'Product not found.'}
            </p>
            <Link to="/catalog" className="mt-4 inline-block text-primary-600 hover:text-primary-500">
              Back to catalog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const discount = product.compare_price_cents
    ? Math.round((1 - product.price_cents / product.compare_price_cents) * 100)
    : 0;

  const avgRating = product.average_rating ?? reviewMeta?.average_rating;
  const reviewCount = product.review_count ?? reviewMeta?.review_count;

  return (
    <div className="min-h-full bg-secondary-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <nav className="mb-6 text-sm text-secondary-500">
          <Link to="/" className="hover:text-primary-600">Home</Link>
          <span className="mx-2">/</span>
          <Link to="/catalog" className="hover:text-primary-600">Catalog</Link>
          <span className="mx-2">/</span>
          {product.categories?.[0] && (
            <>
              <Link
                to={`/category/${product.categories[0].slug}`}
                className="hover:text-primary-600"
              >
                {product.categories[0].name}
              </Link>
              <span className="mx-2">/</span>
            </>
          )}
          <span className="text-secondary-900">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <ProductGallery images={product.images || []} productName={product.name} />

          <div className="space-y-6">
            <div>
              <div className="flex flex-wrap gap-2 mb-2">
                {product.categories?.map((cat) => (
                  <Link
                    key={cat.uuid}
                    to={`/category/${cat.slug}`}
                    className="rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700 hover:bg-primary-100"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>

              <h1 className="text-2xl font-bold text-secondary-900 lg:text-3xl">{product.name}</h1>

              {product.sku && (
                <p className="mt-1 text-sm text-secondary-400">SKU: {product.sku}</p>
              )}
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-secondary-900">{product.price_formatted}</span>
              {product.compare_price_formatted && (
                <>
                  <span className="text-lg text-secondary-400 line-through">{product.compare_price_formatted}</span>
                  <span className="rounded-full bg-danger-100 px-3 py-1 text-sm font-medium text-danger-600">
                    {discount}% OFF
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-4">
              {avgRating ? (
                <div className="flex items-center gap-2">
                  <StarRating rating={Math.round(avgRating)} size="sm" />
                  <span className="text-sm text-secondary-500">
                    {avgRating.toFixed(1)} ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
                  </span>
                </div>
              ) : (
                <span className="text-sm text-secondary-400">No reviews yet</span>
              )}
            </div>

            {product.stock_quantity > 0 ? (
              <div className="flex items-center gap-2 text-sm">
                <span className="flex h-3 w-3 rounded-full bg-success-500" />
                <span className="text-success-600">In Stock ({product.stock_quantity} available)</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm">
                <span className="flex h-3 w-3 rounded-full bg-danger-500" />
                <span className="text-danger-600">Out of Stock</span>
              </div>
            )}

            {product.short_description && (
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-secondary-500">Description</h2>
                <p className="mt-2 text-secondary-700 leading-relaxed">{product.short_description}</p>
              </div>
            )}

            {product.description && (
              <div className="border-t border-secondary-200 pt-4">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-secondary-500">Details</h2>
                <div className="mt-2 text-secondary-700 leading-relaxed whitespace-pre-line">{product.description}</div>
              </div>
            )}

            <div className="flex items-center gap-4">
              <AddToCartButton product={product} showQuantity className="flex-wrap" />
              <WishlistButton
                productId={product.id}
                className="border border-secondary-300"
              />
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-16">
          <h2 className="mb-6 text-xl font-bold text-secondary-900">Customer Reviews</h2>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              {reviews.length > 0 ? (
                <>
                  {reviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}

                  {reviewMeta && reviewMeta.last_page > 1 && (
                    <div className="flex items-center justify-center gap-2 pt-4">
                      <button
                        type="button"
                        disabled={reviewPage <= 1}
                        onClick={() => {
                          const params = new URLSearchParams(searchParams);
                          params.set('review_page', String(reviewPage - 1));
                          setSearchParams(params);
                        }}
                        className="rounded-lg border border-secondary-300 px-4 py-2 text-sm font-medium text-secondary-600 hover:bg-secondary-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <span className="text-sm text-secondary-500">
                        Page {reviewMeta.current_page} of {reviewMeta.last_page}
                      </span>
                      <button
                        type="button"
                        disabled={reviewPage >= reviewMeta.last_page}
                        onClick={() => {
                          const params = new URLSearchParams(searchParams);
                          params.set('review_page', String(reviewPage + 1));
                          setSearchParams(params);
                        }}
                        className="rounded-lg border border-secondary-300 px-4 py-2 text-sm font-medium text-secondary-600 hover:bg-secondary-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded-lg border border-secondary-200 bg-white p-8 text-center">
                  <p className="text-sm text-secondary-500">No reviews yet.</p>
                </div>
              )}
            </div>

            <div>
              <WriteReviewForm
                productSlug={slug!}
                isEligible={eligibility?.eligible ?? null}
                alreadyReviewed={eligibility?.already_reviewed ?? false}
              />
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <div className="mt-16">
            <h2 className="mb-6 text-xl font-bold text-secondary-900">Related Products</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((item) => (
                <ProductCard key={item.uuid} product={item} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
