<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Product;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class LowStockNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly Product $product,
        public readonly int $currentQuantity,
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'type' => 'low_stock',
            'product_id' => $this->product->id,
            'product_uuid' => $this->product->uuid,
            'product_name' => $this->product->name,
            'current_quantity' => $this->currentQuantity,
            'message' => 'Low stock: "' . $this->product->name . '" has only ' . $this->currentQuantity . ' units remaining.',
        ];
    }
}
