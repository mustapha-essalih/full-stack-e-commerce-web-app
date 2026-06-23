<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Events\OrderPaid;
use Illuminate\Support\Facades\Cache;

class InvalidateAnalyticsCache
{
    public function handle(OrderPaid $event): void
    {
        Cache::tags('analytics')->flush();
    }
}
