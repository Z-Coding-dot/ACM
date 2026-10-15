<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::create('appointments',function(Blueprint $t) {
            $t->ulid('id')->primary(); $t->foreignUlid('business_id')->constrained()->restrictOnDelete();
            $t->ulid('customer_id'); $t->ulid('service_id'); $t->ulid('staff_member_id')->nullable();
            $t->dateTime('starts_at',6); $t->dateTime('ends_at',6);
            $t->enum('status',['scheduled','confirmed','completed','cancelled','no-show']); $t->text('notes')->nullable();
            $t->unsignedSmallInteger('duration_minutes'); $t->unsignedBigInteger('price_minor'); $t->char('currency',3); $t->string('service_name',160);
            $t->timestamps();
            $t->foreign(['customer_id','business_id'])->references(['id','business_id'])->on('customers')->restrictOnDelete();
            $t->foreign(['service_id','business_id'])->references(['id','business_id'])->on('services')->restrictOnDelete();
            $t->foreign(['staff_member_id','business_id'])->references(['id','business_id'])->on('staff_members')->restrictOnDelete();
            $t->index(['business_id','status','starts_at']);
            $t->index(['business_id','staff_member_id','starts_at','ends_at'],'appointments_staff_range');
            $t->index(['business_id','customer_id','starts_at','ends_at'],'appointments_customer_range');
        });
    }
    public function down(): void { Schema::dropIfExists('appointments'); }
};
