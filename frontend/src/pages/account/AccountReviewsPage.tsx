import { Link, useSearchParams } from 'react-router-dom';
import { useMyReviews } from '../../hooks/useReviews';
import ReviewCard from '../../components/ReviewCard';

export default function AccountReviewsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page')) || 1;

  const { data, isLoading, isError } = useMyReviews(page);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="animate-pulse rounded-lg border border-secondary-200 bg-white p-4">
            <div className="mb-2 h-4 w-48 rounded bg-secondary-200" />
            <div className="h-4 w-64 rounded bg-secondary-200" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-danger-200 bg-danger-50 p-4 text-sm text-danger-600">
        Failed to load reviews.
      </div>
    );
  }

  const items = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div>
      <h2 className="mb-6 text-lg font-semibold text-secondary-900">My Reviews</h2>

      {items.length === 0 ? (
        <div className="rounded-lg border border-secondary-200 bg-white p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <h3 className="mt-4 text-sm font-semibold text-secondary-900">No reviews yet</h3>
          <p className="mt-2 text-sm text-secondary-500">Your reviews will appear here after you submit them.</p>
          <Link
            to="/catalog"
            className="mt-6 inline-block rounded-lg bg-primary-600 px-6 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {items.map((review) => (
              <div key={review.id}>
                {review.product && (
                  <Link
                    to={`/product/${review.product.slug}`}
                    className="mb-2 block text-sm font-medium text-primary-600 hover:text-primary-500"
                  >
                    {review.product.name}
                  </Link>
                )}
                <ReviewCard review={review} showStatus />
              </div>
            ))}
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
