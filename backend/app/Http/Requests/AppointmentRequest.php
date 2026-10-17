<?php

namespace App\Http\Requests;

use App\Rules\OffsetTimestamp;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AppointmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $business = $this->attributes->get('business')->id;

        return ['customerId' => ['bail', 'required', 'string', 'size:26', Rule::exists('customers', 'id')->where('business_id', $business)],
            'serviceId' => ['bail', 'required', 'string', 'size:26', Rule::exists('services', 'id')->where('business_id', $business)],
            'staffId' => ['bail', 'nullable', 'string', 'size:26', Rule::exists('staff_members', 'id')->where('business_id', $business)],
            'startsAt' => ['bail', 'required', 'string', new OffsetTimestamp], 'notes' => ['nullable', 'string', 'max:2000'],
            'status' => ['sometimes', 'string', Rule::in(['scheduled', 'confirmed'])]];
    }
}
