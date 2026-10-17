<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $t) {
            $t->ulid('id')->primary();
            $t->foreignUlid('business_id')->constrained()->restrictOnDelete();
            $t->string('name', 160);
            $t->string('email', 254)->default('');
            $t->string('phone', 32);
            $t->text('notes')->nullable();
            $t->boolean('active')->default(true);
            $t->char('fingerprint', 64);
            $t->timestamps();
            $t->unique(['id', 'business_id']);
            $t->unique(['business_id', 'fingerprint']);
            $t->index(['business_id', 'active', 'name']);
        });
        Schema::create('services', function (Blueprint $t) {
            $t->ulid('id')->primary();
            $t->foreignUlid('business_id')->constrained()->restrictOnDelete();
            $t->string('name', 160);
            $t->text('description')->nullable();
            $t->unsignedSmallInteger('duration_minutes');
            $t->unsignedBigInteger('price_minor');
            $t->char('currency', 3);
            $t->boolean('active');
            $t->timestamps();
            $t->unique(['id', 'business_id']);
            $t->index(['business_id', 'active', 'name']);
        });
        Schema::create('staff_members', function (Blueprint $t) {
            $t->ulid('id')->primary();
            $t->foreignUlid('business_id')->constrained()->restrictOnDelete();
            $t->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $t->string('name', 160);
            $t->string('email', 254);
            $t->string('phone', 32);
            $t->boolean('active');
            $t->json('hours');
            $t->timestamps();
            $t->unique(['id', 'business_id']);
            $t->unique(['business_id', 'user_id']);
            $t->index(['business_id', 'active', 'name']);
        });
        Schema::create('staff_services', function (Blueprint $t) {
            $t->ulid('business_id');
            $t->ulid('staff_member_id');
            $t->ulid('service_id');
            $t->primary(['staff_member_id', 'service_id']);
            $t->foreign(['staff_member_id', 'business_id'])->references(['id', 'business_id'])->on('staff_members')->cascadeOnDelete();
            $t->foreign(['service_id', 'business_id'])->references(['id', 'business_id'])->on('services')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('staff_services');
        Schema::dropIfExists('staff_members');
        Schema::dropIfExists('services');
        Schema::dropIfExists('customers');
    }
};
