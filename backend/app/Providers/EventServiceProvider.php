<?php

declare(strict_types=1);

namespace App\Providers;

use App\Events\UserLoggedIn;
use App\Listeners\MergeGuestCart;
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
    ];

    public function shouldDiscoverEvents(): bool
    {
        return false;
    }
}
