<?php

namespace Database\Factories;

use App\Models\Business;
use Illuminate\Database\Eloquent\Factories\Factory;

class BusinessFactory extends Factory
{
    protected $model = Business::class;

    public function definition(): array
    {
        return ['name' => fake()->company(), 'industry' => 'other', 'email' => fake()->safeEmail(), 'phone' => '+1 202 555 0100', 'time_zone' => 'UTC', 'currency' => 'USD', 'locale' => 'en'];
    }

    public function configured(): static
    {
        return $this->afterCreating(function (Business $b) {
            $b->settings()->create(['slot_minutes' => 30, 'allow_unassigned' => true, 'require_confirmation' => false]);
            $b->hours()->createMany(array_map(fn ($day) => ['day' => $day, 'open_at' => '09:00', 'close_at' => '17:00', 'closed' => false, 'breaks' => []], range(0, 6)));
        });
    }
}
