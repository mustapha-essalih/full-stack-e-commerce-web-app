import { Link } from 'react-router-dom';
import type { Product } from '../api/products';

interface ProductCardProps {
  product: Product;
}

function RatingStars({ rating = 0 }: { rating?: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`Rating: ${rating.toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`h-3.5 w-3.5 ${star <= rating ? 'text-yellow-400' : 'text-secondary-200'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function ProductCard({ product }: ProductCardProps) {
  const primaryImage = product.images?.find((img) => img.is_primary) || product.images?.[0];

  return (
    <Link
      to={`/product/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-secondary-200 bg-white transition-shadow hover:shadow-lg"
    >
      <div className="relative aspect-square overflow-hidden bg-secondary-100">
        {primaryImage ? (
          <img
            src={primaryImage.thumbnail_url}
            alt={primaryImage.alt_text || product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-secondary-400">
            <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {product.stock_quantity === 0 && (
          <span className="absolute left-2 top-2 rounded-md bg-danger-500 px-2 py-0.5 text-xs font-medium text-white">
            Out of Stock
          </span>
        )}
        {product.stock_quantity > 0 && product.stock_quantity <= 5 && (
          <span className="absolute left-2 top-2 rounded-md bg-warning-500 px-2 py-0.5 text-xs font-medium text-white">
            Only {product.stock_quantity} left
          </span>
        )}
        {product.compare_price_cents && (
          <span className="absolute right-2 top-2 rounded-md bg-danger-500 px-2 py-0.5 text-xs font-medium text-white">
            Sale
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex flex-wrap gap-1">
          {product.categories?.slice(0, 2).map((cat) => (
            <span key={cat.uuid} className="rounded-full bg-secondary-100 px-2 py-0.5 text-xs text-secondary-600">
              {cat.name}
            </span>
          ))}
        </div>

        <h3 className="text-sm font-medium text-secondary-900 line-clamp-2 group-hover:text-primary-600">
          {product.name}
        </h3>

        <div className="flex items-center gap-1">
          <RatingStars rating={4} />
          <span className="text-xs text-secondary-400">(12)</span>
        </div>

        <div className="mt-auto flex items-baseline gap-2">
          <span className="text-lg font-bold text-secondary-900">{product.price_formatted}</span>
          {product.compare_price_formatted && (
            <span className="text-sm text-secondary-400 line-through">{product.compare_price_formatted}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
