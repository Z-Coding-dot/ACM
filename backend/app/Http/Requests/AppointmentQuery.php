<?php
namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
class AppointmentQuery extends FormRequest {
    public function authorize(): bool { return true; }
    public function rules(): array {
        $business=$this->attributes->get('business')->id;
        return ['page'=>['sometimes','integer','between:1,100000'],'per_page'=>['sometimes','integer','between:1,100'],
            'from'=>['nullable','date_format:Y-m-d'],'to'=>['nullable','date_format:Y-m-d'],'search'=>['nullable','string','max:160'],
            'status'=>['nullable','string',Rule::in(['scheduled','confirmed','completed','cancelled','no-show'])],
            'staffId'=>['nullable','string','size:26',Rule::exists('staff_members','id')->where('business_id',$business)],
            'customerId'=>['nullable','string','size:26',Rule::exists('customers','id')->where('business_id',$business)]];
    }
}
