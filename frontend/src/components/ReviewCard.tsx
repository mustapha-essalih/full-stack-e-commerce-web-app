import StarRating from './StarRating';
import type { Review } from '../api/reviews';

interface ReviewCardProps {
  review: Review;
  showStatus?: boolean;
}

export default function ReviewCard({ review, showStatus = false }: ReviewCardProps) {
  return (
    <div className="rounded-lg border border-secondary-200 bg-white p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
            {review.reviewer_name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div>
            <p className="text-sm font-medium text-secondary-900">{review.reviewer_name}</p>
            <p className="text-xs text-secondary-500">
              {new Date(review.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>

        <StarRating rating={review.rating} size="sm" />
      </div>

      {review.title && (
        <h4 className="mt-3 text-sm font-semibold text-secondary-900">{review.title}</h4>
      )}

      {review.body && (
        <p className="mt-1 text-sm text-secondary-700 leading-relaxed">{review.body}</p>
      )}

      {showStatus && (
        <div className="mt-3">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              review.is_approved
                ? 'bg-success-100 text-success-700'
                : 'bg-amber-100 text-amber-700'
            }`}
          >
            {review.is_approved ? 'Approved' : 'Pending'}
          </span>
          {review.is_flagged && (
            <span className="ml-2 inline-flex items-center rounded-full bg-danger-100 px-2.5 py-0.5 text-xs font-medium text-danger-700">
              Flagged
            </span>
          )}
        </div>
      )}
    </div>
  );
}
