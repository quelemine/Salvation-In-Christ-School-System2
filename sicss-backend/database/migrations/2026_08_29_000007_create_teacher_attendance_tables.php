<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('teacher_attendance_settings', function (Blueprint $table) {
            $table->id();
            $table->decimal('late_deduction_percent', 5, 2)->default(0);
            $table->decimal('absent_deduction_percent', 5, 2)->default(0);
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
        Schema::create('teacher_attendances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('teacher_id')->constrained('teachers')->cascadeOnDelete();
            $table->date('attendance_date');
            $table->enum('attendance_type', ['working_day', 'meeting'])->default('working_day');
            $table->enum('status', ['present', 'late', 'absent', 'excused'])->default('present');
            $table->time('check_in_time')->nullable();
            $table->text('remarks')->nullable();
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->unique(['teacher_id', 'attendance_date', 'attendance_type']);
            $table->index(['attendance_date', 'status']);
        });
        Schema::table('teacher_payrolls', function (Blueprint $table) {
            $table->decimal('base_amount', 12, 2)->nullable()->after('amount');
            $table->decimal('deduction_amount', 12, 2)->default(0)->after('base_amount');
            $table->unsignedInteger('late_count')->default(0)->after('deduction_amount');
            $table->unsignedInteger('absent_count')->default(0)->after('late_count');
        });
    }
    public function down(): void
    {
        Schema::table('teacher_payrolls', fn (Blueprint $table) => $table->dropColumn(['base_amount', 'deduction_amount', 'late_count', 'absent_count']));
        Schema::dropIfExists('teacher_attendances');
        Schema::dropIfExists('teacher_attendance_settings');
    }
};
