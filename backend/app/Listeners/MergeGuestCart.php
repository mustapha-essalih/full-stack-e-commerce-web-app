<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Events\UserLoggedIn;
use App\Repositories\CartRepository;
use App\Services\CartService;

class MergeGuestCart
{
    public function __construct(
        private readonly CartRepository $cartRepository,
        private readonly CartService $cartService,
    ) {}

    public function handle(UserLoggedIn $event): void
    {
        if (!$event->sessionId) {
            return;
        }

        $guestCart = $this->cartRepository->findBySessionId($event->sessionId);

        if (!$guestCart || $guestCart->items->isEmpty()) {
            return;
        }

        $userCart = $this->cartRepository->findOrCreateForUser((int) $event->user->id);

        $this->cartService->mergeGuestCartIntoUserCart($guestCart, $userCart);
    }
}
