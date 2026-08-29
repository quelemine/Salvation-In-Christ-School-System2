<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    public function index(Request $request)
    {
        $activities = ActivityLog::query()
            ->with('user:id,first_name,last_name,email')
            ->latest()
            ->limit(20)
            ->get();

        return response()->json($activities);
    }
}
