<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Mail\EmailVerificationMail;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class CustomVerifyEmail extends Notification implements ShouldQueue
{
    use Queueable;

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): EmailVerificationMail
    {
        $hash = sha1($notifiable->getEmailForVerification());
        $url = config('app.url') . '/email/verify?hash=' . $hash;

        return new EmailVerificationMail(
            user: $notifiable,
            url: $url,
        );
    }
}
