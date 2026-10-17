<?php

namespace Database\Factories;

use App\Models\BusinessMembership;
use Illuminate\Database\Eloquent\Factories\Factory;

class BusinessMembershipFactory extends Factory
{
    protected $model = BusinessMembership::class;

    public function definition(): array
    {
        return ['business_id' => BusinessFactory::new()->configured(), 'user_id' => UserFactory::new(), 'role' => 'staff'];
    }
}
