<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\SystemSetting;

class SystemSettingsSeeder extends Seeder
{
    public function run(): void
    {
        SystemSetting::updateOrCreate(
            ['key' => 'global'],
            ['value' => [], 'updated_by' => 1]
        );
    }
}
