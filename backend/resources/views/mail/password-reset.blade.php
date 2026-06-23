<x-mail-layout title="Reset Your Password">
    <h2 style="margin-top: 0;">Reset Your Password</h2>

    <p>Hi {{ $user->name }},</p>
    <p>You are receiving this email because we received a password reset request for your account.</p>

    <p style="margin-bottom: 0; text-align: center;">
        <a href="{{ $url }}" class="button">Reset Password</a>
    </p>

    <p style="color: #71717a; font-size: 14px; margin-top: 24px;">
        This password reset link will expire in 60 minutes. If you did not request a password reset, no further action is required.
    </p>
</x-mail-layout>
