<?php

if (!function_exists('mb_split')) {
    function mb_split(string $pattern, string $string, int $limit = -1): array|false
    {
        $result = preg_split('/' . str_replace('/', '\\/', $pattern) . '/', $string, $limit);

        return $result;
    }
}

require_once __DIR__ . '/../vendor/autoload.php';
