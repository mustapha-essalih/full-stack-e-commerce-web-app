<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Models\Cart;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Laravel\Sanctum\PersonalAccessToken;

class CartRepository
{
    public function findBySessionId(string $sessionId): ?Cart
    {
        return Cart::with('items.product')
            ->where('session_id', $sessionId)
            ->whereNull('user_id')
            ->first();
    }

    public function findByUserId(int $userId): ?Cart
    {
        return Cart::with('items.product')
            ->where('user_id', $userId)
            ->first();
    }

    public function findOrCreateForUser(int $userId): Cart
    {
        $cart = $this->findByUserId($userId);

        if ($cart) {
            return $cart->load('items.product');
        }

        /** @var Cart $cart */
        $cart = Cart::create([
            'uuid' => (string) Str::uuid(),
            'user_id' => $userId,
            'expires_at' => Carbon::now()->addDays(7),
        ]);

        return $cart;
    }

    public function findOrCreateForRequest(Request $request): Cart
    {
        $user = $this->resolveUserFromRequest($request);

        if ($user) {
            return $this->findOrCreateForUser((int) $user->id);
        }

        $sessionId = $request->header('X-Cart-Session');

        if ($sessionId) {
            $cart = $this->findBySessionId($sessionId);

            if ($cart) {
                return $cart->load('items.product');
            }
        } else {
            $sessionId = (string) Str::uuid();
        }

        /** @var Cart $cart */
        $cart = Cart::create([
            'uuid' => (string) Str::uuid(),
            'session_id' => $sessionId,
            'expires_at' => Carbon::now()->addDays(7),
        ]);

        return $cart;
    }

    private function resolveUserFromRequest(Request $request): ?User
    {
        $bearerToken = $request->bearerToken();

        if (!$bearerToken) {
            return null;
        }

        /** @var PersonalAccessToken|null $accessToken */
        $accessToken = PersonalAccessToken::findToken($bearerToken);

        if (!$accessToken || $accessToken->expires_at?->isPast()) {
            return null;
        }

        $tokenable = $accessToken->tokenable;

        if ($tokenable instanceof User) {
            return $tokenable;
        }

        return null;
    }
}
