<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('businesses', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('name', 160);
            $table->enum('industry', ['salon', 'clinic', 'education', 'consulting', 'other']);
            $table->string('email', 254)->default('');
            $table->string('phone', 32)->default('');
            $table->string('time_zone', 64);
            $table->char('currency', 3);
            $table->enum('locale', ['en', 'fa-AF']);
            $table->timestamps();
        });
        Schema::create('business_memberships', function (Blueprint $table) {
            $table->id();
            $table->foreignUlid('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->enum('role', ['owner', 'administrator', 'receptionist', 'staff']);
            $table->timestamps();
            $table->unique(['business_id', 'user_id']);
        });
        Schema::create('business_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignUlid('business_id')->unique()->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('slot_minutes')->default(30);
            $table->boolean('allow_unassigned')->default(true);
            $table->boolean('require_confirmation')->default(false);
            $table->timestamps();
        });
        Schema::create('business_hours', function (Blueprint $table) {
            $table->id();
            $table->foreignUlid('business_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('day');
            $table->time('open_at');
            $table->time('close_at');
            $table->boolean('closed');
            $table->json('breaks')->nullable();
            $table->unique(['business_id', 'day']);
        });
        Schema::table('users', fn (Blueprint $table) => $table->foreignUlid('active_business_id')->nullable()->constrained('businesses')->nullOnDelete());
    }

    public function down(): void
    {
        Schema::table('users', fn (Blueprint $table) => $table->dropConstrainedForeignId('active_business_id'));
        Schema::dropIfExists('business_hours');
        Schema::dropIfExists('business_settings');
        Schema::dropIfExists('business_memberships');
        Schema::dropIfExists('businesses');
    }
};
