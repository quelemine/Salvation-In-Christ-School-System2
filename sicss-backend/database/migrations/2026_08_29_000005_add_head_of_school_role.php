<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('roles')->updateOrInsert(
            ['slug' => 'head-of-school'],
            ['name' => 'HEAD OF SCHOOL', 'description' => 'Receives school management reports', 'is_active' => true, 'updated_at' => now(), 'created_at' => now()]
        );
    }

    public function down(): void
    {
        DB::table('roles')->where('slug', 'head-of-school')->delete();
    }
};
