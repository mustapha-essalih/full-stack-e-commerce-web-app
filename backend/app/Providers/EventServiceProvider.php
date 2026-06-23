<?php

declare(strict_types=1);

namespace App\Providers;

use App\Events\LowStockDetected;
use App\Events\OrderPaid;
use App\Events\OrderPaymentFailed;
use App\Events\OrderStatusChanged;
use App\Events\UserLoggedIn;
use App\Listeners\InvalidateAnalyticsCache;
use App\Listeners\MergeGuestCart;
use App\Listeners\SendAdminNewOrderNotification;
use App\Listeners\SendLowStockNotification;
use App\Listeners\SendOrderConfirmationMail;
use App\Listeners\SendOrderDeliveredMail;
use App\Listeners\SendOrderShippedMail;
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
        OrderPaid::class => [
            InvalidateAnalyticsCache::class,
            SendOrderConfirmationMail::class,
            SendAdminNewOrderNotification::class,
        ],
        OrderPaymentFailed::class => [],
        OrderStatusChanged::class => [
            SendOrderShippedMail::class,
            SendOrderDeliveredMail::class,
        ],
        LowStockDetected::class => [
            SendLowStockNotification::class,
        ],
    ];

    public function shouldDiscoverEvents(): bool
    {
        return false;
    }
}
