<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AuthRequest extends FormRequest
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
        $password = ['bail', 'required', 'string', 'min:8', 'max:72', function ($attribute, $value, $fail) {
            if (strlen($value) > 72) {
                $fail('validation.max.string');
            }
        }];

        return match ($this->route()->getName()) {
            'auth.signup' => ['name' => ['required', 'string', 'max:160'], 'email' => ['bail', 'required', 'string', 'email', 'max:254', Rule::unique('users')], 'password' => [...$password, 'confirmed'], 'locale' => ['bail', 'sometimes', 'string', Rule::in(['en', 'fa-AF'])]],
            'auth.login' => ['email' => ['required', 'email', 'max:254'], 'password' => ['required', 'string', 'max:256'], 'remember' => ['sometimes', 'boolean']],
            'auth.reset' => ['email' => ['required', 'email', 'max:254'], 'token' => ['required', 'string', 'max:256'], 'password' => [...$password, 'confirmed']],
            'auth.account' => ['name' => ['required', 'string', 'max:160'], 'email' => ['required', 'email', 'max:254', Rule::unique('users')->ignore($this->user()->id)], 'currentPassword' => ['sometimes', 'nullable', 'string', 'max:256']],
            default => ['email' => ['required', 'email', 'max:254']],
        };
    }

    public function messages(): array
    {
        return [
            '*.required' => 'validation.required', '*.max' => 'validation.maxLength',
            'email.email' => 'validation.email', 'email.unique' => 'validation.emailTaken',
            'password.min' => 'validation.password', 'password.confirmed' => 'validation.passwordMatch',
        ];
    }
}
