<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class DirectoryQuery extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return ['search' => ['nullable', 'string', 'max:160'], 'page' => ['sometimes', 'integer', 'min:1', 'max:100000'], 'per_page' => ['sometimes', 'integer', 'between:1,100'], 'active' => ['sometimes', Rule::in(['true', 'false', 'all'])], 'sort' => ['sometimes', Rule::in(['name', 'createdAt'])], 'direction' => ['sometimes', Rule::in(['asc', 'desc'])]];
    }
}
