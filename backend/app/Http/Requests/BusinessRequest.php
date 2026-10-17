<?php

namespace App\Http\Requests;

use App\Rules\WorkingHours;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BusinessRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:160'], 'industry' => ['bail', 'required', 'string', Rule::in(['salon', 'clinic', 'education', 'consulting', 'other'])],
            'email' => ['nullable', 'email', 'max:254'], 'phone' => ['nullable', 'string', 'regex:/^[+\d][\d\s().-]{6,24}$/'],
            'timeZone' => ['bail', 'required', 'string', 'timezone:all', 'max:64'], 'currency' => ['bail', 'required', 'string', Rule::in(['AFN', 'USD', 'EUR', 'GBP', 'AED', 'INR', 'PKR', 'JPY'])],
            'locale' => ['bail', 'required', 'string', Rule::in(['en', 'fa-AF'])],
            'hours' => ['bail', 'required', 'array', new WorkingHours], 'hours.*.day' => ['required', 'integer', 'between:0,6', 'distinct'], 'hours.*.closed' => ['required', 'boolean'],
            'hours.*.open' => ['required', 'string', 'date_format:H:i'], 'hours.*.close' => ['required', 'string', 'date_format:H:i'],
            'hours.*.breaks' => ['sometimes', 'array', 'max:8'], 'hours.*.breaks.*.open' => ['required', 'string', 'date_format:H:i'], 'hours.*.breaks.*.close' => ['required', 'string', 'date_format:H:i'],
            'appointmentSettings' => ['required', 'array'], 'appointmentSettings.slotMinutes' => ['required', 'integer', 'between:5,60'],
            'appointmentSettings.allowUnassigned' => ['required', 'boolean'], 'appointmentSettings.requireConfirmation' => ['required', 'boolean'],
        ];
    }
}
