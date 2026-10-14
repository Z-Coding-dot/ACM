<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class WorkingHours implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_array($value) || count($value) !== 7) { $fail('validation.hours'); return; }
        $days = [];
        foreach ($value as $hour) {
            if (! is_array($hour) || ! isset($hour['day'], $hour['open'], $hour['close'], $hour['closed'])) { $fail('validation.hours'); return; }
            if ((! is_int($hour['day']) && (! is_string($hour['day']) || ! preg_match('/^[0-6]$/', $hour['day']))) || ! is_string($hour['open']) || ! is_string($hour['close']) || ! in_array($hour['closed'], [true, false, 0, 1, '0', '1'], true)) { $fail('validation.hours'); return; }
            if (isset($days[$hour['day']]) || $hour['day'] < 0 || $hour['day'] > 6 || ! preg_match('/^([01]\d|2[0-3]):[0-5]\d$/', $hour['open']) || ! preg_match('/^([01]\d|2[0-3]):[0-5]\d$/', $hour['close'])) { $fail('validation.hours'); return; }
            $days[$hour['day']] = true;
            if (! $hour['closed'] && $hour['close'] <= $hour['open']) { $fail('validation.hours'); return; }
            $breaks = $hour['breaks'] ?? [];
            if (! is_array($breaks) || count($breaks) > 8) { $fail('validation.hours'); return; }
            foreach ($breaks as $break) {
                if (! is_array($break) || ! isset($break['open'], $break['close']) || ! is_string($break['open']) || ! is_string($break['close']) || ! preg_match('/^([01]\d|2[0-3]):[0-5]\d$/', $break['open']) || ! preg_match('/^([01]\d|2[0-3]):[0-5]\d$/', $break['close']) || $break['open'] < $hour['open'] || $break['close'] > $hour['close'] || $break['close'] <= $break['open']) { $fail('validation.hours'); return; }
            }
            usort($breaks, fn ($a, $b) => strcmp($a['open'], $b['open']));
            foreach ($breaks as $index => $break) {
                if ($index && $break['open'] < $breaks[$index - 1]['close']) { $fail('validation.hours'); return; }
            }
        }
    }
}
