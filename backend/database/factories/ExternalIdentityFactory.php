<?php
namespace Database\Factories;
use App\Models\ExternalIdentity;
use Illuminate\Database\Eloquent\Factories\Factory;
class ExternalIdentityFactory extends Factory {
    protected $model=ExternalIdentity::class;
    public function definition(): array { return ['user_id'=>UserFactory::new(),'provider'=>'google','provider_id'=>fake()->unique()->uuid()]; }
}
