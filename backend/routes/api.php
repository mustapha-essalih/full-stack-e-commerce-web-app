<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;

Route::get('/v1/health', function () {
    return response()->json([
        'status' => 'ok',
        'version' => '1.0.0',
    ]);
});
