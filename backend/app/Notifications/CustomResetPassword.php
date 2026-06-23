<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Mail\PasswordResetMail;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class CustomResetPassword extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly string $token,
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): PasswordResetMail
    {
        $url = config('app.url') . '/reset-password?token=' . $this->token . '&email=' . urlencode($notifiable->email);

        return new PasswordResetMail(
            user: $notifiable,
            url: $url,
        );
    }
}
