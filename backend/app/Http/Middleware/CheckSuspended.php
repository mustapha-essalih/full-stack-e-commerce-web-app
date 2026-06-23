<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CheckSuspended
{
    public function handle(Request $request, Closure $next): mixed
    {
        $user = $request->user();

        if ($user !== null && $user->is_suspended) {
            return response()->json([
                'message' => 'Your account has been suspended. Please contact support.',
            ], 403);
        }

        return $next($request);
    }
}
