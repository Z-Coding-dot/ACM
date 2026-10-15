<?php
namespace Database\Factories;
use App\Models\StaffMember;
use Illuminate\Database\Eloquent\Factories\Factory;
class StaffMemberFactory extends Factory {
    protected $model=StaffMember::class;
    public function definition(): array { return ['business_id'=>BusinessFactory::new()->configured(),'user_id'=>null,'name'=>fake()->name(),'email'=>fake()->safeEmail(),'phone'=>'+1 202 555 0102','active'=>true,'hours'=>array_map(fn($day)=>['day'=>$day,'open'=>'09:00','close'=>'17:00','closed'=>false,'breaks'=>[]],range(0,6))]; }
}
