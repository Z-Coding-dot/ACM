<?php
namespace Database\Factories;
use App\Models\BusinessSettings;
use Illuminate\Database\Eloquent\Factories\Factory;
class BusinessSettingsFactory extends Factory {
    protected $model=BusinessSettings::class;
    public function definition(): array { return ['business_id'=>BusinessFactory::new(),'slot_minutes'=>30,'allow_unassigned'=>true,'require_confirmation'=>false]; }
}
