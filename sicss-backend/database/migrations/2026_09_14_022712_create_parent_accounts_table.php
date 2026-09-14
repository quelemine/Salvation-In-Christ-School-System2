<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('parent_accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('relationship')->default('parent');
            $table->string('phone')->nullable();
            $table->string('address')->nullable();
            $table->text('emergency_contact')->nullable();
            $table->boolean('receive_notifications')->default(true);
            $table->boolean('receive_sms')->default(false);
            $table->boolean('receive_email')->default(true);
            $table->timestamps();
            
            $table->index('user_id');
            $table->unique('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('parent_accounts');
    }
};
