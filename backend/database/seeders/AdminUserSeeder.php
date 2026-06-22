<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $admin = User::create([
            'name' => 'Admin',
            'email' => 'admin@pharos.com',
            'password' => Hash::make('password', ['cost' => 12]),
            'email_verified_at' => now(),
        ]);

        $admin->assignRole('admin');
    }
}
