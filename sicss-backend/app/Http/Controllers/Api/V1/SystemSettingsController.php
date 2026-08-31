<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use Illuminate\Http\Request;

class SystemSettingsController extends Controller
{
    public function show()
    {
        return response()->json(SystemSetting::where('key', 'global')->value('value') ?? []);
    }

    public function update(Request $request)
    {
        $data = $request->validate(['settings' => ['required', 'array']]);
        $setting = SystemSetting::updateOrCreate(
            ['key' => 'global'],
            ['value' => $data['settings'], 'updated_by' => $request->user()->id]
        );

        return response()->json($setting->value);
    }
}
