<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->boolean('fees_cleared')->default(false)->after('status');
            $table->string('clearance_academic_year')->nullable()->after('fees_cleared');
            $table->timestamp('cleared_at')->nullable()->after('clearance_academic_year');
            $table->foreignId('cleared_by')->nullable()->constrained('users')->nullOnDelete()->after('cleared_at');
        });

        // Fee structures table — admin templates for fees per class/year
        if (!Schema::hasTable('fee_structures')) {
            Schema::create('fee_structures', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('academic_year');
                $table->foreignId('class_id')->nullable()->constrained('classes')->nullOnDelete();
                $table->enum('applies_to', ['all', 'class'])->default('all');
                $table->text('description')->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        // Fee structure items — individual line items within a structure
        if (!Schema::hasTable('fee_structure_items')) {
            Schema::create('fee_structure_items', function (Blueprint $table) {
                $table->id();
                $table->foreignId('fee_structure_id')->constrained()->cascadeOnDelete();
                $table->string('label');
                $table->decimal('amount', 12, 2);
                $table->string('currency', 3)->default('LRD');
                $table->enum('category', ['tuition', 'registration', 'uniform', 'exam', 'activity', 'library', 'other'])->default('tuition');
                $table->boolean('is_mandatory')->default(true);
                $table->date('due_date')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('fee_structure_items');
        Schema::dropIfExists('fee_structures');
        Schema::table('students', function (Blueprint $table) {
            $table->dropColumn(['fees_cleared', 'clearance_academic_year', 'cleared_at', 'cleared_by']);
        });
    }
};
