<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Student application photos are currently submitted as data URLs, which
     * are much longer than the 255 characters supported by a string column.
     */
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->text('photo_url')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->string('photo_url')->nullable()->change();
        });
    }
};
