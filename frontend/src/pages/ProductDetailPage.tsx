import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProduct } from '../hooks/useProducts';
import AddToCartButton from '../components/AddToCartButton';
import ProductGallery from '../components/ProductGallery';
import ProductCard from '../components/ProductCard';
import WishlistButton from '../components/WishlistButton';

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading, isError, error } = useProduct(slug!);

  const product = data?.product;
  const related = data?.related || [];

  useEffect(() => {
    if (product) {
      document.title = `${product.name} - Pharos Commerce`;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc && product.meta_description) {
        metaDesc.setAttribute('content', product.meta_description);
      }
    }
  }, [product]);

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
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className="h-5 w-5 text-yellow-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-sm text-secondary-500">(24 reviews)</span>
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
