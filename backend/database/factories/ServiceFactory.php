<?php
namespace Database\Factories;
use App\Models\Service;
use Illuminate\Database\Eloquent\Factories\Factory;
class ServiceFactory extends Factory {
    protected $model=Service::class;
    public function definition(): array { return ['business_id'=>BusinessFactory::new()->configured(),'name'=>'Test service','description'=>'','duration_minutes'=>30,'price_minor'=>1234,'currency'=>'USD','active'=>true]; }
}
