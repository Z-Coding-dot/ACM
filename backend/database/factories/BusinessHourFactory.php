<?php

namespace Database\Factories;

use App\Models\BusinessHour;
use Illuminate\Database\Eloquent\Factories\Factory;

class BusinessHourFactory extends Factory
{
    protected $model = BusinessHour::class;

    public function definition(): array
    {
        return ['business_id' => BusinessFactory::new(), 'day' => 1, 'open_at' => '09:00', 'close_at' => '17:00', 'closed' => false, 'breaks' => []];
    }
}
