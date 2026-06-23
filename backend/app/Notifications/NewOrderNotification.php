<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class NewOrderNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly Order $order,
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'type' => 'new_order',
            'order_uuid' => $this->order->uuid,
            'order_total_cents' => $this->order->total_cents,
            'order_total_formatted' => '$' . number_format($this->order->total_cents / 100, 2),
            'customer_name' => $this->order->user?->name ?? 'Guest',
            'message' => 'New order #' . $this->order->uuid . ' placed by ' . ($this->order->user?->name ?? 'Guest') . ' for $' . number_format($this->order->total_cents / 100, 2) . '.',
        ];
    }
}
