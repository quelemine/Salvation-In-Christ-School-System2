<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('roles')->updateOrInsert(
            ['slug' => 'vice-principal-instruction'],
            [
                'name' => 'VICE PRINCIPAL FOR INSTRUCTION',
                'description' => 'Reviews and approves submitted grades',
                'is_active' => true,
                'updated_at' => now(),
                'created_at' => now(),
            ]
        );
    }

    public function down(): void
    {
        DB::table('roles')->where('slug', 'vice-principal-instruction')->delete();
    }
};
