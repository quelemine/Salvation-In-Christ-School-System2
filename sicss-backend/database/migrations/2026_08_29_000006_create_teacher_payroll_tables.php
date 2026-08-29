<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('salary_structures', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->enum('employment_type', ['self_contained', 'part_time']);
            $table->string('role_title');
            $table->decimal('monthly_salary', 12, 2);
            $table->string('currency', 3)->default('LRD');
            $table->boolean('is_active')->default(true);
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::table('teachers', function (Blueprint $table) {
            $table->foreignId('salary_structure_id')->nullable()->after('user_id')->constrained('salary_structures')->nullOnDelete();
        });

        Schema::create('teacher_payrolls', function (Blueprint $table) {
            $table->id();
            $table->foreignId('teacher_id')->constrained('teachers')->cascadeOnDelete();
            $table->foreignId('salary_structure_id')->nullable()->constrained('salary_structures')->nullOnDelete();
            $table->string('payroll_month', 7);
            $table->string('role_title');
            $table->enum('employment_type', ['self_contained', 'part_time']);
            $table->decimal('amount', 12, 2);
            $table->string('currency', 3)->default('LRD');
            $table->enum('status', ['pending', 'paid'])->default('pending');
            $table->date('paid_at')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->unique(['teacher_id', 'payroll_month']);
            $table->index(['payroll_month', 'status']);
        });
    }

    public function down(): void
    {
        Schema::table('teachers', fn (Blueprint $table) => $table->dropConstrainedForeignId('salary_structure_id'));
        Schema::dropIfExists('teacher_payrolls');
        Schema::dropIfExists('salary_structures');
    }
};
