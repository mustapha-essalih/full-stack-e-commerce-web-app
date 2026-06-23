import { useState } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { useSubmitReview } from '../hooks/useReviews';
import { useToastStore } from '../stores/useToastStore';
import StarRating from './StarRating';

interface WriteReviewFormProps {
  productSlug: string;
  isEligible: boolean | null;
  alreadyReviewed: boolean;
}

export default function WriteReviewForm({ productSlug, isEligible, alreadyReviewed }: WriteReviewFormProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const submitMutation = useSubmitReview(productSlug);
  const addToast = useToastStore((s) => s.addToast);

  if (!isAuthenticated) {
    return (
      <div className="rounded-lg border border-secondary-200 bg-white p-6 text-center">
        <p className="text-sm text-secondary-500">
          <a href="/login" className="text-primary-600 hover:text-primary-500">Sign in</a> to leave a review.
        </p>
      </div>
    );
  }

  if (alreadyReviewed) {
    return (
      <div className="rounded-lg border border-secondary-200 bg-white p-6 text-center">
        <p className="text-sm text-secondary-500">You&apos;ve already reviewed this product.</p>
      </div>
    );
  }

  if (isEligible === false) {
    return (
      <div className="rounded-lg border border-secondary-200 bg-white p-6 text-center">
        <p className="text-sm text-secondary-500">Purchase this product to leave a review.</p>
      </div>
    );
  }

  if (isEligible === null) {
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (rating === 0) {
      addToast('Please select a rating.', 'error');
      return;
    }

    try {
      await submitMutation.mutateAsync({ rating, title: title || undefined, body: body || undefined });
      addToast('Review submitted! It will be visible after approval.', 'success');
      setRating(0);
      setTitle('');
      setBody('');
    } catch {
      addToast('Failed to submit review.', 'error');
    }
  }

  return (
    <div className="rounded-lg border border-secondary-200 bg-white p-6">
      <h3 className="mb-4 text-lg font-semibold text-secondary-900">Write a Review</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-secondary-700">Rating</label>
          <StarRating rating={rating} size="lg" interactive onChange={setRating} />
          {rating === 0 && (
            <p className="mt-1 text-xs text-secondary-400">Click a star to rate</p>
          )}
        </div>

        <div>
          <label htmlFor="review-title" className="mb-1 block text-sm font-medium text-secondary-700">
            Title (optional)
          </label>
          <input
            id="review-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Summarize your experience"
            maxLength={255}
            className="w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>

        <div>
          <label htmlFor="review-body" className="mb-1 block text-sm font-medium text-secondary-700">
            Review (optional)
          </label>
          <textarea
            id="review-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Tell others about your experience..."
            rows={4}
            maxLength={10000}
            className="w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>

        <button
          type="submit"
          disabled={submitMutation.isPending || rating === 0}
          className="rounded-lg bg-primary-600 px-6 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitMutation.isPending ? 'Submitting...' : 'Submit Review'}
        </button>
      </form>
    </div>
  );
}
