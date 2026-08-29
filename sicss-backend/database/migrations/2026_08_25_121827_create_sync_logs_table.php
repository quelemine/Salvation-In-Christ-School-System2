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
        Schema::create('sync_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->uuid('device_uuid')->nullable();
            $table->string('entity_type');
            $table->uuid('entity_uuid');
            $table->enum('action', ['create', 'update', 'delete']);
            $table->enum('status', ['pending', 'processing', 'completed', 'failed', 'conflict'])->default('pending');
            $table->text('error_message')->nullable();
            $table->json('data')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'device_uuid']);
            $table->index(['entity_type', 'entity_uuid']);
            $table->index('status');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sync_logs');
    }
};
