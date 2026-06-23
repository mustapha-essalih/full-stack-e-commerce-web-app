<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Events\OrderPaid;
use App\Mail\OrderConfirmationMail;
use Illuminate\Support\Facades\Mail;

class SendOrderConfirmationMail
{
    public function handle(OrderPaid $event): void
    {
        $order = $event->order;

        $user = $order->user;

        if ($user === null || $user->email === null) {
            return;
        }

        Mail::to($user->email, $user->name)->queue(
            new OrderConfirmationMail($order),
        );
    }
}
