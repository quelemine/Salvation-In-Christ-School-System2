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
        Schema::create('fee_structures', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('academic_year', 20);
            $table->foreignId('class_id')->nullable()->constrained()->onDelete('set null');
            $table->enum('applies_to', ['all', 'class'])->default('all');
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('fee_structure_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('fee_structure_id')->constrained()->onDelete('cascade');
            $table->string('label');
            $table->decimal('amount', 10, 2);
            $table->enum('currency', ['LRD', 'USD'])->default('LRD');
            $table->enum('category', ['tuition', 'registration', 'uniform', 'exam', 'activity', 'library', 'other'])->default('tuition');
            $table->boolean('is_mandatory')->default(true);
            $table->date('due_date')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fee_structure_items');
        Schema::dropIfExists('fee_structures');
    }
};
