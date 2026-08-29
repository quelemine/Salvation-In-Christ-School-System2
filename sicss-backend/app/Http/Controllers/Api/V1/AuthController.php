<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    private function deviceDetails(Request $request): array
    {
        $userAgent = $request->userAgent() ?? 'Unknown';
        $deviceType = preg_match('/mobile|android|iphone|ipad/i', $userAgent) ? 'Mobile' : 'Desktop';
        $browser = preg_match('/edg/i', $userAgent) ? 'Edge' : (preg_match('/chrome/i', $userAgent) ? 'Chrome' : (preg_match('/firefox/i', $userAgent) ? 'Firefox' : (preg_match('/safari/i', $userAgent) ? 'Safari' : 'Other')));
        $platform = preg_match('/windows/i', $userAgent) ? 'Windows' : (preg_match('/macintosh|mac os/i', $userAgent) ? 'macOS' : (preg_match('/android/i', $userAgent) ? 'Android' : (preg_match('/iphone|ipad|ios/i', $userAgent) ? 'iOS' : 'Other')));

        return ['ip_address' => $request->ip(), 'device_type' => $deviceType, 'browser' => $browser, 'platform' => $platform, 'user_agent' => $userAgent];
    }

    public function register(Request $request)
    {
        $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
        ]);

        $user = User::create([
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'phone' => $request->phone,
            'address' => $request->address,
        ]);

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ], 201);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        if (!Auth::attempt($request->only('email', 'password'))) {
            ActivityLog::create([
                'event' => 'login_failed',
                'user_email' => $request->input('email'),
                'description' => 'Failed login attempt for '.$request->input('email'),
                ...$this->deviceDetails($request),
            ]);
            Log::warning('Authentication failed', [
                'email' => $request->input('email'),
                'ip' => $request->ip(),
            ]);

            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $user = Auth::user()->load('role');
        
        if (!$user->is_active) {
            return response()->json(['message' => 'Account is inactive'], 403);
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        Log::info('Authentication succeeded', [
            'user_id' => $user->id,
            'email' => $user->email,
            'ip' => $request->ip(),
        ]);
        ActivityLog::create([
            'user_id' => $user->id,
            'user_email' => $user->email,
            'event' => 'login',
            'description' => 'Signed in to the application',
            ...$this->deviceDetails($request),
        ]);

        return response()->json([
            'user' => $user,
            'token' => $token,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        Log::info('User logged out', [
            'user_id' => $request->user()->id,
            'email' => $request->user()->email,
            'ip' => $request->ip(),
        ]);
        ActivityLog::create([
            'user_id' => $request->user()->id,
            'user_email' => $request->user()->email,
            'event' => 'logout',
            'description' => 'Signed out of the application',
            ...$this->deviceDetails($request),
        ]);

        return response()->json(['message' => 'Logged out successfully']);
    }

    public function me(Request $request)
    {
        return response()->json($request->user()->load('role'));
    }
}
