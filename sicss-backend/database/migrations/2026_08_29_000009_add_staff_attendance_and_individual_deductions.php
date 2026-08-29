<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::table('teacher_attendances', function (Blueprint $table) { $table->foreignId('user_id')->nullable()->after('teacher_id')->constrained('users')->nullOnDelete(); $table->index(['user_id', 'attendance_date']); });
        Schema::table('teacher_attendance_settings', function (Blueprint $table) { $table->foreignId('user_id')->nullable()->after('id')->constrained('users')->cascadeOnDelete(); $table->unique('user_id'); });
    }
    public function down(): void { Schema::table('teacher_attendance_settings', fn (Blueprint $table) => $table->dropConstrainedForeignId('user_id')); Schema::table('teacher_attendances', fn (Blueprint $table) => $table->dropConstrainedForeignId('user_id')); }
};
