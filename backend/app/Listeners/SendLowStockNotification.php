<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Events\LowStockDetected;

class SendLowStockNotification
{
    public function handle(LowStockDetected $event): void
    {
        // Phase 14 will wire up the actual admin notification.
    }
}
