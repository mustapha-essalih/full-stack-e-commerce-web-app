<?php

declare(strict_types=1);

use App\Console\Commands\PruneExpiredCarts;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    /** @phpstan-ignore variable.undefined */
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command(PruneExpiredCarts::class)->daily();
