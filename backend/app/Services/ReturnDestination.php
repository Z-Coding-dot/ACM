<?php

namespace App\Services;

class ReturnDestination
{
    public static function safe(mixed $value): string
    {
        $fallback = '/app/overview';
        if (! is_string($value) || strlen($value) > 2048) {
            return $fallback;
        }
        $decoded = rawurldecode(rawurldecode($value));
        $candidate = parse_url($decoded, PHP_URL_PATH);
        if (! str_starts_with($decoded, '/') || str_starts_with($decoded, '//') || ! is_string($candidate) || (! str_starts_with($candidate, '/app/') && $candidate !== '/platform' && ! str_starts_with($candidate, '/platform/')) || preg_match('/[\x00-\x1f\x7f\\\\]/', $decoded)) {
            return $fallback;
        }
        $path = parse_url($decoded, PHP_URL_PATH);
        if (! is_string($path) || str_contains($path, '//') || array_intersect(['.', '..'], explode('/', $path))) {
            return $fallback;
        }

        return $value;
    }
}
