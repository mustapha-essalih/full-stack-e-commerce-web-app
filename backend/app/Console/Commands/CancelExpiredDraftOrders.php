<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Enums\OrderStatus;
use App\Models\Order;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class CancelExpiredDraftOrders extends Command
{
    /**
     * @var string
     */
    protected $signature = 'orders:cancel-expired-drafts';

    /**
     * @var string
     */
    protected $description = 'Cancel draft orders that were not paid within 24 hours';

    public function handle(): int
    {
        $count = Order::where('status', OrderStatus::Draft->value)
            ->where('created_at', '<', Carbon::now()->subHours(24))
            ->update([
                'status' => OrderStatus::Cancelled->value,
                'cancelled_at' => Carbon::now(),
            ]);

        $this->info("Cancelled {$count} expired draft orders.");

        return self::SUCCESS;
    }
}
