<?php
namespace App\Http\Resources;
use App\Models\Appointment;
class AppointmentResource {
    public static function data(Appointment $a): array {
        return ['id'=>$a->id,'businessId'=>$a->business_id,'customerId'=>$a->customer_id,'serviceId'=>$a->service_id,'staffId'=>$a->staff_member_id,
            'startsAt'=>$a->starts_at->utc()->toISOString(),'endsAt'=>$a->ends_at->utc()->toISOString(),'status'=>$a->status,'notes'=>$a->notes??'',
            'customerName'=>$a->customer->name,'serviceName'=>$a->service_name,'staffName'=>$a->staff?->name,
            'durationMinutes'=>$a->duration_minutes,'priceMinor'=>$a->price_minor,'currency'=>$a->currency];
    }
}
