<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Review;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class NewReviewNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly Review $review,
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'type' => 'new_review',
            'review_id' => $this->review->id,
            'product_id' => $this->review->product_id,
            'product_name' => $this->review->product?->name ?? 'Unknown Product',
            'rating' => $this->review->rating,
            'customer_name' => $this->review->user?->name ?? 'Anonymous',
            'message' => 'New review by ' . ($this->review->user?->name ?? 'Anonymous') . ' on "' . ($this->review->product?->name ?? 'Unknown Product') . '" (' . $this->review->rating . '/5 stars) — pending moderation.',
        ];
    }
}
