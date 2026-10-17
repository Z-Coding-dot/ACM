<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class MembershipRequest extends FormRequest
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
        return ['email' => [$this->isMethod('POST') ? 'required' : 'sometimes', 'bail', 'string', 'email', 'max:254'], 'role' => ['required', 'string', Rule::in(['administrator', 'receptionist', 'staff'])]];
    }
}
