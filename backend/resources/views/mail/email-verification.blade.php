<x-mail-layout title="Verify Your Email Address">
    <h2 style="margin-top: 0;">Verify Your Email Address</h2>

    <p>Hi {{ $user->name }},</p>
    <p>Thank you for creating an account with {{ config('app.name') }}. Please verify your email address by clicking the button below.</p>

    <p style="margin-bottom: 0; text-align: center;">
        <a href="{{ $url }}" class="button">Verify Email</a>
    </p>

    <p style="color: #71717a; font-size: 14px; margin-top: 24px;">
        If you did not create an account, no further action is required.
    </p>
</x-mail-layout>
