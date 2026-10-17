<?php

namespace App\Http\Requests;

use App\Rules\WorkingHours;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class DirectoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if (is_string($this->input('email'))) {
            $this->merge(['email' => mb_strtolower(trim($this->input('email')))]);
        }
    }

    public function rules(): array
    {
        $common = ['name' => ['bail', 'required', 'string', 'max:160']];
        $contact = ['email' => ['bail', 'nullable', 'string', 'email', 'max:254'], 'phone' => ['bail', 'required', 'string', 'regex:/^[+\\d][\\d\\s().-]{6,24}$/']];

        return match ($this->route('kind')) {
            'customers' => [...$common, ...$contact, 'notes' => ['nullable', 'string', 'max:2000']],
            'services' => [...$common, 'description' => ['nullable', 'string', 'max:2000'], 'durationMinutes' => ['required', 'integer', 'between:5,480'], 'priceMinor' => ['required', 'integer', 'between:0,1000000000'], 'currency' => ['bail', 'required', 'string', Rule::in(['AFN', 'USD', 'EUR', 'GBP', 'AED', 'INR', 'PKR', 'JPY'])], 'active' => ['required', 'boolean']],
            'staff' => [...$common, ...$contact, 'email' => ['bail', 'required', 'string', 'email', 'max:254'], 'active' => ['required', 'boolean'], 'serviceIds' => ['present', 'array', 'max:100'], 'serviceIds.*' => ['required', 'string', 'size:26', 'distinct', Rule::exists('services', 'id')->where('business_id', $this->attributes->get('business')->id)], 'hours' => ['bail', 'required', 'array', new WorkingHours], 'hours.*.day' => ['required', 'integer', 'between:0,6', 'distinct'], 'hours.*.closed' => ['required', 'boolean'], 'hours.*.open' => ['required', 'string', 'date_format:H:i'], 'hours.*.close' => ['required', 'string', 'date_format:H:i'], 'hours.*.breaks' => ['sometimes', 'array', 'max:8'], 'hours.*.breaks.*.open' => ['required', 'string', 'date_format:H:i'], 'hours.*.breaks.*.close' => ['required', 'string', 'date_format:H:i'],
                'userId' => ['sometimes', 'nullable', 'integer', Rule::exists('business_memberships', 'user_id')->where('business_id', $this->attributes->get('business')->id)]],
        };
    }

    public function messages(): array
    {
        return ['*.required' => 'validation.required', '*.email' => 'validation.email', '*.max' => 'validation.maxLength', 'phone.regex' => 'validation.phone'];
    }
}
