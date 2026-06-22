<?php

return [
    App\Providers\AppServiceProvider::class,
    App\Providers\EventServiceProvider::class,
    ...(($_ENV['APP_ENV'] ?? '') === 'testing' ? [] : [
        App\Providers\HorizonServiceProvider::class,
    ]),
];
