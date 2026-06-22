<?php

declare(strict_types=1);

use Laravel\Telescope\EntryType;
use Laravel\Telescope\Watchers;

return [

    'enabled' => env('TELESCOPE_ENABLED', false),

    'domain' => env('TELESCOPE_DOMAIN'),

    'path' => env('TELESCOPE_PATH', 'telescope'),

    'driver' => 'database',

    'storage' => [
        'database' => [
            'connection' => env('DB_CONNECTION', 'pgsql'),
            'chunk' => 1000,
        ],
    ],

    'database' => [
        'connection' => null,
    ],

    'middleware' => [
        'web',
        'auth',
    ],

    'only_paths' => [
        'api/*',
    ],

    'ignore_paths' => [
        'telescope/*',
        'horizon/*',
        'nova-api/*',
    ],

    'ignore_http_methods' => [
        'OPTIONS',
    ],

    'watchers' => [
        Watchers\CacheWatcher::class => env('TELESCOPE_CACHE_WATCHER', true),
        Watchers\CommandWatcher::class => true,
        Watchers\DumpWatcher::class => true,
        Watchers\EventWatcher::class => true,
        Watchers\ExceptionWatcher::class => true,
        Watchers\GateWatcher::class => env('TELESCOPE_GATE_WATCHER', false),
        Watchers\JobWatcher::class => true,
        Watchers\LogWatcher::class => true,
        Watchers\MailWatcher::class => true,
        Watchers\ModelWatcher::class => true,
        Watchers\NotificationWatcher::class => true,
        Watchers\QueryWatcher::class => true,
        Watchers\RedisWatcher::class => env('TELESCOPE_REDIS_WATCHER', true),
        Watchers\RequestWatcher::class => true,
        Watchers\ScheduleWatcher::class => true,
        Watchers\ViewWatcher::class => true,
    ],
];
