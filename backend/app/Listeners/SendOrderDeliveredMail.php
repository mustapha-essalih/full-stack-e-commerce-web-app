<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Enums\OrderStatus;
use App\Events\OrderStatusChanged;
use App\Mail\OrderDeliveredMail;
use Illuminate\Support\Facades\Mail;

class SendOrderDeliveredMail
{
    public function handle(OrderStatusChanged $event): void
    {
        if ($event->newStatus !== OrderStatus::Delivered) {
            return;
        }

        $order = $event->order;

        $user = $order->user;

        if ($user === null || $user->email === null) {
            return;
        }

        Mail::to($user->email, $user->name)->queue(
            new OrderDeliveredMail($order),
        );
    }
}
