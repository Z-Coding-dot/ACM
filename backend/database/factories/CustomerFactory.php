<?php
namespace Database\Factories;
use App\Models\Customer;
use Illuminate\Database\Eloquent\Factories\Factory;
class CustomerFactory extends Factory {
    protected $model=Customer::class;
    public function definition(): array { return ['business_id'=>BusinessFactory::new()->configured(),'name'=>fake()->name(),'email'=>fake()->unique()->safeEmail(),'phone'=>'+1 202 555 0101','notes'=>'','active'=>true,'fingerprint'=>hash('sha256',fake()->uuid())]; }
}
