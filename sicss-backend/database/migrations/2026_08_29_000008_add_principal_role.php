<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
return new class extends Migration {
    public function up(): void { DB::table('roles')->updateOrInsert(['slug' => 'principal'], ['name' => 'PRINCIPAL', 'description' => 'School principal with staff oversight access', 'is_active' => true, 'updated_at' => now(), 'created_at' => now()]); }
    public function down(): void { DB::table('roles')->where('slug', 'principal')->delete(); }
};
