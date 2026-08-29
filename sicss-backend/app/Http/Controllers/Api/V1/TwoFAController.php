<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class TwoFAController extends Controller
{
    /**
     * Generate a 6-digit 2FA code and attach it to the authenticated user.
     * In production replace Log::info with Mail::to($user)->send(new TwoFACodeMail($code)).
     */
    public function generate(Request $request)
    {
        $user = $request->user();

        // Only admins require 2FA for password changes
        if ($user->role->slug !== 'admin') {
            return response()->json(['required' => false, 'message' => '2FA not required for this role.']);
        }

        $code    = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $expires = now()->addMinutes(10);

        $user->update([
            'two_fa_code'       => bcrypt($code),   // store hashed
            'two_fa_expires_at' => $expires,
        ]);

        // Log the plain code so admins can retrieve it from Activity logs
        // (replace with email in production)
        Log::info("2FA code for {$user->email}: {$code} (expires {$expires})");

        ActivityLog::create([
            'user_id'     => $user->id,
            'user_email'  => $user->email,
            'event'       => '2fa_code_generated',
            'description' => "2FA verification code generated for password change. Code: {$code} (expires 10 min)",
            'ip_address'  => $request->ip(),
            'device_type' => 'Desktop',
            'browser'     => 'Other',
            'platform'    => 'Other',
            'user_agent'  => $request->userAgent(),
        ]);

        return response()->json([
            'required'   => true,
            'message'    => 'A 6-digit verification code has been generated.',
            // Return the code directly in this local system.
            // In production remove this and send it via email instead.
            'code'       => $code,
            'expires_at' => $expires->toDateTimeString(),
        ]);
    }

    /**
     * Verify the provided code against the stored hash.
     */
    public function verify(Request $request)
    {
        $request->validate(['code' => 'required|string|size:6']);

        $user = $request->user();

        if (!$user->two_fa_code || !$user->two_fa_expires_at) {
            return response()->json(['valid' => false, 'message' => 'No active 2FA code. Please request a new one.'], 422);
        }

        if (now()->isAfter($user->two_fa_expires_at)) {
            $user->update(['two_fa_code' => null, 'two_fa_expires_at' => null]);
            return response()->json(['valid' => false, 'message' => 'Code has expired. Please request a new one.'], 422);
        }

        if (!\Illuminate\Support\Facades\Hash::check($request->code, $user->two_fa_code)) {
            ActivityLog::create([
                'user_id'     => $user->id,
                'user_email'  => $user->email,
                'event'       => '2fa_failed',
                'description' => '2FA verification failed — incorrect code.',
                'ip_address'  => $request->ip(),
                'device_type' => 'Desktop',
                'browser'     => 'Other',
                'platform'    => 'Other',
                'user_agent'  => $request->userAgent(),
            ]);
            return response()->json(['valid' => false, 'message' => 'Incorrect verification code.'], 422);
        }

        // Mark as used — a one-time token stored as a short-lived session key
        $verifiedToken = \Illuminate\Support\Str::random(40);
        $user->update([
            'two_fa_code'       => null,
            'two_fa_expires_at' => null,
        ]);

        // Store verified token in cache for 5 minutes
        \Illuminate\Support\Facades\Cache::put(
            "2fa_verified_{$user->id}",
            $verifiedToken,
            now()->addMinutes(5)
        );

        ActivityLog::create([
            'user_id'     => $user->id,
            'user_email'  => $user->email,
            'event'       => '2fa_verified',
            'description' => '2FA verification successful.',
            'ip_address'  => $request->ip(),
            'device_type' => 'Desktop',
            'browser'     => 'Other',
            'platform'    => 'Other',
            'user_agent'  => $request->userAgent(),
        ]);

        return response()->json(['valid' => true, 'verified_token' => $verifiedToken]);
    }
}
