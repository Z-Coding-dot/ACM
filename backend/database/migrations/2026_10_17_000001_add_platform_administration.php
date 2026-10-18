<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('is_platform_admin')->default(false)->index();
            $table->timestamp('disabled_at')->nullable();
        });
        Schema::table('businesses', function (Blueprint $table) {
            $table->string('logo_path')->nullable();
            $table->timestamp('suspended_at')->nullable();
        });
        Schema::create('public_content', function (Blueprint $table) {
            $table->id();
            $table->string('locale', 8);
            $table->string('key', 120);
            $table->text('draft');
            $table->text('published')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
            $table->unique(['locale', 'key']);
        });
        Schema::create('page_views', function (Blueprint $table) {
            $table->id();
            $table->date('day');
            $table->string('path', 32);
            $table->string('locale', 8);
            $table->unsignedBigInteger('views')->default(0);
            $table->unique(['day', 'path', 'locale']);
        });
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignUlid('business_id')->nullable()->constrained('businesses')->nullOnDelete();
            $table->string('method', 8);
            $table->string('resource', 160);
            $table->string('record_id', 120)->nullable();
            $table->timestamp('created_at')->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
        Schema::dropIfExists('page_views');
        Schema::dropIfExists('public_content');
        Schema::table('businesses', fn (Blueprint $table) => $table->dropColumn(['logo_path', 'suspended_at']));
        Schema::table('users', fn (Blueprint $table) => $table->dropColumn(['is_platform_admin', 'disabled_at']));
    }
};
