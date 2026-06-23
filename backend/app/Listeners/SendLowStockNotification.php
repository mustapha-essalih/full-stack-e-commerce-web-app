<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Events\LowStockDetected;
use App\Models\User;
use App\Notifications\LowStockNotification;

class SendLowStockNotification
{
    public function handle(LowStockDetected $event): void
    {
        $admins = User::role('admin')->get();

        foreach ($admins as $admin) {
            $admin->notify(new LowStockNotification(
                product: $event->product,
                currentQuantity: $event->currentQuantity,
            ));
        }
    }
}
