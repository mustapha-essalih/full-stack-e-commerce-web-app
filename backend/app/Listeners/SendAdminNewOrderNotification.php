<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Events\OrderPaid;
use App\Models\User;
use App\Notifications\NewOrderNotification;

class SendAdminNewOrderNotification
{
    public function handle(OrderPaid $event): void
    {
        $admins = User::role('admin')->get();

        foreach ($admins as $admin) {
            $admin->notify(new NewOrderNotification($event->order));
        }
    }
}
