<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rule;

class MembershipAccountRequest extends MembershipRequest
{
    public function rules(): array
    {
        return [
            ...parent::rules(),
            'name' => ['required', 'string', 'max:160'],
            'email' => ['bail', 'required', 'string', 'email', 'max:254', Rule::unique('users')],
            'password' => ['bail', 'required', 'string', 'min:8', 'max:72', function ($attribute, $value, $fail) {
                if (strlen($value) > 72) {
                    $fail('validation.maxLength');
                }
            }],
        ];
    }

    public function messages(): array
    {
        return ['*.required' => 'validation.required', '*.max' => 'validation.maxLength', 'email.email' => 'validation.email', 'email.unique' => 'memberships.accountExists', 'password.min' => 'validation.password'];
    }
}
