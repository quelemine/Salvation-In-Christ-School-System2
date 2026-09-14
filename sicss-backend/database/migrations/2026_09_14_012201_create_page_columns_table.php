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
        Schema::create('page_columns', function (Blueprint $table) {
            $table->id();
            $table->string('page_key');
            $table->string('column_key');
            $table->string('label');
            $table->boolean('visible')->default(true);
            $table->integer('order')->default(0);
            $table->string('width')->nullable();
            $table->boolean('sortable')->default(true);
            $table->boolean('filterable')->default(false);
            $table->json('custom_options')->nullable();
            $table->timestamps();
            
            $table->unique(['page_key', 'column_key']);
            $table->index('page_key');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('page_columns');
    }
};
