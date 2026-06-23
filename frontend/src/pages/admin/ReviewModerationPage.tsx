import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAdminReviews, useApproveReview, useRejectReview, useFlagReview } from '../../hooks/useReviews';
import { useToastStore } from '../../stores/useToastStore';
import StarRating from '../../components/StarRating';

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'flagged', label: 'Flagged' },
];

export default function AdminReviewModerationPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('filter[status]') || '');
  const page = Number(searchParams.get('page')) || 1;

  const { data, isLoading } = useAdminReviews(activeTab || undefined, page);
  const approveMutation = useApproveReview();
  const rejectMutation = useRejectReview();
  const flagMutation = useFlagReview();
  const addToast = useToastStore((s) => s.addToast);

  const items = data?.data ?? [];
  const meta = data?.meta;

  function handleTabChange(tab: string) {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams);
    if (tab) {
      params.set('filter[status]', tab);
    } else {
      params.delete('filter[status]');
    }
    params.set('page', '1');
    setSearchParams(params);
  }

  async function handleApprove(id: number) {
    try {
      await approveMutation.mutateAsync(id);
      addToast('Review approved.', 'success');
    } catch {
      addToast('Failed to approve review.', 'error');
    }
  }

  async function handleReject(id: number) {
    try {
      await rejectMutation.mutateAsync(id);
      addToast('Review rejected.', 'success');
    } catch {
      addToast('Failed to reject review.', 'error');
    }
  }

  async function handleFlag(id: number) {
    try {
      await flagMutation.mutateAsync(id);
      addToast('Review flag toggled.', 'success');
    } catch {
      addToast('Failed to update review.', 'error');
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-secondary-900">Review Moderation</h1>
        <p className="mt-1 text-sm text-secondary-500">Approve, reject, or flag customer reviews</p>
      </div>

      <div className="mb-6 border-b border-secondary-200">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => handleTabChange(tab.value)}
              className={`whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium ${
                activeTab === tab.value
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-secondary-500 hover:border-secondary-300 hover:text-secondary-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-lg border border-secondary-200 bg-white p-4">
              <div className="mb-2 h-4 w-48 rounded bg-secondary-200" />
              <div className="h-4 w-64 rounded bg-secondary-200" />
            </div>
          ))}
        </div>
      ) : items.length > 0 ? (
        <>
          <div className="space-y-4">
            {items.map((review) => (
              <div
                key={review.id}
                className={`rounded-lg border bg-white p-4 ${
                  review.is_flagged
                    ? 'border-danger-200 bg-danger-50'
                    : review.is_approved
                      ? 'border-success-200'
                      : 'border-amber-200'
                }`}
              >
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

                  <div className="flex items-center gap-2">
                    <StarRating rating={review.rating} size="sm" />
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        review.is_approved
                          ? 'bg-success-100 text-success-700'
                          : review.is_flagged
                            ? 'bg-danger-100 text-danger-700'
                            : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {review.is_approved ? 'Approved' : review.is_flagged ? 'Flagged' : 'Pending'}
                    </span>
                  </div>
                </div>

                {review.product && (
                  <p className="mt-2 text-xs text-secondary-400">
                    Product: {review.product.name}
                  </p>
                )}

                {review.title && (
                  <h4 className="mt-2 text-sm font-semibold text-secondary-900">{review.title}</h4>
                )}

                {review.body && (
                  <p className="mt-1 text-sm text-secondary-700">{review.body}</p>
                )}

                <div className="mt-4 flex items-center gap-2">
                  {!review.is_approved && (
                    <button
                      type="button"
                      onClick={() => handleApprove(review.id)}
                      disabled={approveMutation.isPending}
                      className="rounded-lg bg-success-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-success-700 disabled:opacity-50"
                    >
                      Approve
                    </button>
                  )}
                  {review.is_approved && (
                    <button
                      type="button"
                      onClick={() => handleReject(review.id)}
                      disabled={rejectMutation.isPending}
                      className="rounded-lg border border-secondary-300 px-3 py-1.5 text-xs font-medium text-secondary-600 hover:bg-secondary-50 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleFlag(review.id)}
                    disabled={flagMutation.isPending}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium disabled:opacity-50 ${
                      review.is_flagged
                        ? 'border-danger-300 text-danger-600 hover:bg-danger-50'
                        : 'border-secondary-300 text-secondary-600 hover:bg-secondary-50'
                    }`}
                  >
                    {review.is_flagged ? 'Unflag' : 'Flag'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {meta && meta.last_page > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => {
                  const params = new URLSearchParams(searchParams);
                  params.set('page', String(page - 1));
                  setSearchParams(params);
                }}
                className="rounded-lg border border-secondary-300 px-4 py-2 text-sm font-medium text-secondary-600 hover:bg-secondary-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              {Array.from({ length: meta.last_page }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    const params = new URLSearchParams(searchParams);
                    params.set('page', String(p));
                    setSearchParams(params);
                  }}
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
                onClick={() => {
                  const params = new URLSearchParams(searchParams);
                  params.set('page', String(page + 1));
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
        <div className="rounded-lg border border-secondary-200 bg-white p-12 text-center">
          <p className="text-sm text-secondary-500">No reviews found.</p>
        </div>
      )}
    </div>
  );
}
