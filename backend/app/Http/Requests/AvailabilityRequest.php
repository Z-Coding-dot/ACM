<?php
namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
class AvailabilityRequest extends FormRequest {
    public function authorize(): bool { return true; }
    public function rules(): array {
        $business=$this->attributes->get('business')->id;
        return ['date'=>['required','date_format:Y-m-d'],'serviceId'=>['required','string','size:26',Rule::exists('services','id')->where('business_id',$business)],
            'staffId'=>['nullable','string','size:26',Rule::exists('staff_members','id')->where('business_id',$business)],
            'customerId'=>['nullable','string','size:26',Rule::exists('customers','id')->where('business_id',$business)], 'excludeId'=>['nullable','string','size:26']];
    }
}
