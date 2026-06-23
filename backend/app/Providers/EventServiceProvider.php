<?php

declare(strict_types=1);

namespace App\Providers;

use App\Events\LowStockDetected;
use App\Events\OrderPaid;
use App\Events\OrderPaymentFailed;
use App\Events\OrderStatusChanged;
use App\Events\UserLoggedIn;
use App\Listeners\MergeGuestCart;
use App\Listeners\SendLowStockNotification;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

class EventServiceProvider extends ServiceProvider
{
    /**
     * @var array<class-string, array<int, class-string>>
     */
    protected $listen = [
        UserLoggedIn::class => [
            MergeGuestCart::class,
        ],
        OrderPaid::class => [],
        OrderPaymentFailed::class => [],
        OrderStatusChanged::class => [],
        LowStockDetected::class => [
            SendLowStockNotification::class,
        ],
    ];

    public function shouldDiscoverEvents(): bool
    {
        return false;
    }
}
