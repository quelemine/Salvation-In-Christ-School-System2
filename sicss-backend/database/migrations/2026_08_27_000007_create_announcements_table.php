<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('announcements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->string('title');
            $table->text('body');
            $table->enum('priority', ['normal', 'important', 'urgent'])->default('normal');
            $table->enum('category', ['general', 'academic', 'finance', 'event', 'emergency'])->default('general');
            // audience: 'all' or comma-separated user IDs
            $table->string('audience')->default('all');
            $table->boolean('is_active')->default(true);
            $table->timestamp('publish_at')->nullable();   // schedule for later
            $table->timestamp('expires_at')->nullable();   // auto-expire
            $table->timestamps();
        });

        Schema::create('announcement_reads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('announcement_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamp('read_at')->useCurrent();
            $table->unique(['announcement_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('announcement_reads');
        Schema::dropIfExists('announcements');
    }
};
