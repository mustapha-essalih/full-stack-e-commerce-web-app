<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Auth\Events\Registered;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;

class ProfileService
{
    public function updateProfile(User $user, array $data): User
    {
        if (isset($data['email']) && $data['email'] !== $user->email) {
            $data['email_verified_at'] = null;
        }

        $user->update($data);

        if (array_key_exists('email_verified_at', $data) && $data['email_verified_at'] === null) {
            event(new Registered($user));
        }

        return $user->fresh();
    }

    public function updatePassword(User $user, string $currentPassword, string $newPassword): User
    {
        if (!Hash::check($currentPassword, $user->password)) {
            abort(422, 'The current password is incorrect.');
        }

        $user->update([
            'password' => $newPassword,
        ]);

        return $user->fresh();
    }
}
