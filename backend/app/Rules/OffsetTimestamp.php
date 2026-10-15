<?php
namespace App\Rules;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
class OffsetTimestamp implements ValidationRule {
    public function validate(string $attribute,mixed $value,Closure $fail): void {
        if (!is_string($value) || !preg_match('/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,6}))?(Z|[+-]\d{2}:\d{2})$/',$value,$m) ||
            !checkdate((int)$m[2],(int)$m[3],(int)$m[1]) || (int)$m[4]>23 || (int)$m[5]>59 || (int)$m[6]!==0 || (int)($m[7]??0)!==0 ||
            ($m[8]!=='Z' && ((int)substr($m[8],1,2)>14 || (int)substr($m[8],4,2)>59 || ((int)substr($m[8],1,2)===14 && (int)substr($m[8],4,2)!==0)))) $fail('validation.future');
    }
}
