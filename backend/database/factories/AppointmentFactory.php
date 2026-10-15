<?php
namespace Database\Factories;
use App\Models\Appointment;
use App\Models\Customer;
use App\Models\Service;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Factories\Factory;
class AppointmentFactory extends Factory {
    protected $model=Appointment::class;
    public function definition(): array { return ['business_id'=>BusinessFactory::new()->configured(),'staff_member_id'=>null,'starts_at'=>CarbonImmutable::now('UTC')->addDay()->setTime(9,0),'status'=>'confirmed','notes'=>'']; }
    public function configure(): static {
        return $this->afterMaking(function(Appointment $a) {
            if (!$a->customer_id) $a->customer_id=Customer::factory()->create(['business_id'=>$a->business_id])->id;
            if (!$a->service_id) $a->service_id=Service::factory()->create(['business_id'=>$a->business_id])->id;
            $service=Service::findOrFail($a->service_id);
            $a->forceFill(['ends_at'=>$a->starts_at->addMinutes($service->duration_minutes),'duration_minutes'=>$service->duration_minutes,'price_minor'=>$service->price_minor,'currency'=>$service->currency,'service_name'=>$service->name]);
        });
    }
}
