<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('roles')->updateOrInsert(
            ['slug' => 'proprietor'],
            ['name' => 'PROPRIETOR', 'description' => 'School proprietor with management oversight', 'is_active' => true, 'updated_at' => now(), 'created_at' => now()]
        );
        DB::table('roles')->updateOrInsert(
            ['slug' => 'proprietress'],
            ['name' => 'PROPRIETRESS', 'description' => 'School proprietress with management oversight', 'is_active' => true, 'updated_at' => now(), 'created_at' => now()]
        );
    }

    public function down(): void
    {
        DB::table('roles')->where('slug', 'proprietor')->delete();
        DB::table('roles')->where('slug', 'proprietress')->delete();
    }
};
