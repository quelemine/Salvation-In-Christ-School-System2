<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class TestController extends Controller
{
    public function adminOnly(Request $request)
    {
        return response()->json(['message' => 'Admin access granted']);
    }

    public function teacherOnly(Request $request)
    {
        return response()->json(['message' => 'Teacher access granted']);
    }

    public function studentOnly(Request $request)
    {
        return response()->json(['message' => 'Student access granted']);
    }
}
