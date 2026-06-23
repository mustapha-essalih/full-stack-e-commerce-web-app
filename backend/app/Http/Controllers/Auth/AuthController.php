<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Events\UserLoggedIn;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\PersonalAccessToken;

class AuthController extends Controller
{
    public function register(RegisterRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = User::create([
            'name' => $request->string('name'),
            'email' => $request->string('email'),
            'password' => $request->string('password'),
        ]);

        $user->assignRole('customer');

        event(new Registered($user));

        $accessToken = $user->createToken('access', ['*'], now()->addMinutes(15));
        $refreshToken = $user->createToken('refresh', ['*'], now()->addDays(7));

        return response()->json([
            'data' => [
                'user' => new UserResource($user),
                'access_token' => $accessToken->plainTextToken,
                'refresh_token' => $refreshToken->plainTextToken,
                'token_type' => 'Bearer',
            ],
        ], 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        /** @var User|null $user */
        $user = User::where('email', $request->string('email'))->first();

        if (!$user || !Hash::check((string) $request->string('password'), $user->password)) {
            return response()->json([
                'message' => 'Invalid credentials.',
            ], 401);
        }

        if ($user->is_suspended) {
            return response()->json([
                'message' => 'Your account has been suspended. Please contact support.',
            ], 403);
        }

        $user->tokens()->delete();

        $accessToken = $user->createToken('access', ['*'], now()->addMinutes(15));
        $refreshToken = $user->createToken('refresh', ['*'], now()->addDays(7));

        event(new UserLoggedIn(
            user: $user,
            sessionId: $request->header('X-Cart-Session'),
        ));

        return response()->json([
            'data' => [
                'user' => new UserResource($user),
                'access_token' => $accessToken->plainTextToken,
                'refresh_token' => $refreshToken->plainTextToken,
                'token_type' => 'Bearer',
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->tokens()->delete();

        return response()->json([
            'message' => 'Logged out successfully.',
        ]);
    }

    public function refresh(Request $request): JsonResponse
    {
        $request->validate([
            'refresh_token' => ['required', 'string'],
        ]);

        /** @var PersonalAccessToken|null $refreshToken */
        $refreshToken = PersonalAccessToken::findToken((string) $request->string('refresh_token'));

        if (!$refreshToken || $refreshToken->name !== 'refresh' || $refreshToken->expires_at?->isPast()) {
            return response()->json([
                'message' => 'Invalid or expired refresh token.',
            ], 401);
        }

        /** @var User $user */
        $user = $refreshToken->tokenable;

        $user->tokens()->delete();

        $newAccessToken = $user->createToken('access', ['*'], now()->addMinutes(15));
        $newRefreshToken = $user->createToken('refresh', ['*'], now()->addDays(7));

        return response()->json([
            'data' => [
                'access_token' => $newAccessToken->plainTextToken,
                'refresh_token' => $newRefreshToken->plainTextToken,
                'token_type' => 'Bearer',
            ],
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        \assert($user instanceof \App\Models\User);

        return response()->json([
            'data' => new UserResource($user),
        ]);
    }
}
