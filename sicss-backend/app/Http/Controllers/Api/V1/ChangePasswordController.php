<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class ChangePasswordController extends Controller
{
    public function __invoke(Request $request)
    {
        $request->validate([
            'current_password' => 'required',
            'password'         => 'required|min:8|confirmed',
            // admins must supply the verified_token from 2FA step
            'verified_token'   => 'sometimes|nullable|string',
        ]);

        $user    = $request->user();
        $isAdmin = $user->role->slug === 'admin';

        // ── 2FA gate for admins ───────────────────────────────────────────────
        if ($isAdmin) {
            $token = $request->input('verified_token');

            if (!$token) {
                return response()->json([
                    'message'       => '2FA verification required.',
                    'requires_2fa'  => true,
                ], 403);
            }

            $cached = Cache::get("2fa_verified_{$user->id}");
            if (!$cached || $cached !== $token) {
                return response()->json([
                    'message'       => '2FA token is invalid or expired. Please verify again.',
                    'requires_2fa'  => true,
                ], 403);
            }

            // Consume the token — one use only
            Cache::forget("2fa_verified_{$user->id}");
        }

        // ── Verify current password ───────────────────────────────────────────
        if (!Hash::check($request->current_password, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['The current password is incorrect.'],
            ]);
        }

        $user->update(['password' => Hash::make($request->password)]);

        ActivityLog::create([
            'user_id'     => $user->id,
            'user_email'  => $user->email,
            'event'       => 'password_changed',
            'description' => '✅ Password changed successfully' . ($isAdmin ? ' (2FA verified)' : '') . '.',
            'ip_address'  => $request->ip(),
            'device_type' => 'Desktop',
            'browser'     => 'Other',
            'platform'    => 'Other',
            'user_agent'  => $request->userAgent(),
        ]);

        return response()->json(['message' => 'Password changed successfully.']);
    }
}
