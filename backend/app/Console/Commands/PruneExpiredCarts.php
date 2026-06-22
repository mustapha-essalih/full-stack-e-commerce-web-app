<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\Cart;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class PruneExpiredCarts extends Command
{
    /**
     * @var string
     */
    protected $signature = 'carts:prune-expired';

    /**
     * @var string
     */
    protected $description = 'Delete expired guest carts';

    public function handle(): int
    {
        $count = Cart::whereNull('user_id')
            ->where('expires_at', '<', Carbon::now())
            ->delete();

        $this->info("Deleted {$count} expired guest carts.");

        return self::SUCCESS;
    }
}
