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
        Schema::table('page_layouts', function (Blueprint $table) {
            $table->string('primary_button_color')->nullable()->after('layout_type');
            $table->string('secondary_button_color')->nullable()->after('primary_button_color');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('page_layouts', function (Blueprint $table) {
            $table->dropColumn(['primary_button_color', 'secondary_button_color']);
        });
    }
};
