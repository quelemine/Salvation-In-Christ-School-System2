<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            // Extended application fields
            $table->string('place_of_birth')->nullable()->after('date_of_birth');
            $table->string('nationality')->nullable()->after('place_of_birth');
            $table->string('county')->nullable()->after('nationality');
            $table->string('previous_school')->nullable()->after('county');
            $table->string('grade_applying_for')->nullable()->after('previous_school');
            $table->string('photo_url')->nullable()->after('photo');
            // Parent section
            $table->string('father_name')->nullable()->after('parent_guardian_name');
            $table->string('mother_name')->nullable()->after('father_name');
            $table->string('father_occupation')->nullable()->after('mother_name');
            $table->string('mother_occupation')->nullable()->after('father_occupation');
            $table->string('father_contact')->nullable()->after('mother_occupation');
            $table->string('mother_contact')->nullable()->after('father_contact');
            $table->text('parent_address')->nullable()->after('mother_contact');
            // Additional
            $table->boolean('has_illness')->default(false)->after('parent_address');
            $table->text('illness_details')->nullable()->after('has_illness');
            $table->string('emergency_contact_name')->nullable()->after('illness_details');
            $table->string('emergency_contact_phone')->nullable()->after('emergency_contact_name');
            $table->string('sports_interest')->nullable()->after('emergency_contact_phone');
            $table->text('additional_notes')->nullable()->after('sports_interest');
            // Official section
            $table->string('registration_number')->nullable()->after('additional_notes');
            $table->string('class_assigned')->nullable()->after('registration_number');
            $table->string('approved_by_registrar')->nullable()->after('class_assigned');
            $table->string('approved_by_principal')->nullable()->after('approved_by_registrar');
            $table->date('approval_date')->nullable()->after('approved_by_principal');
            $table->enum('application_status', ['pending', 'approved', 'rejected'])->default('pending')->after('approval_date');
        });
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropColumn([
                'place_of_birth','nationality','county','previous_school','grade_applying_for','photo_url',
                'father_name','mother_name','father_occupation','mother_occupation','father_contact','mother_contact','parent_address',
                'has_illness','illness_details','emergency_contact_name','emergency_contact_phone','sports_interest','additional_notes',
                'registration_number','class_assigned','approved_by_registrar','approved_by_principal','approval_date','application_status',
            ]);
        });
    }
};
