<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\ActivityLog;
use App\Services\OtpService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    protected OtpService $otpService;

    public function __construct(OtpService $otpService)
    {
        $this->otpService = $otpService;
    }

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
                'email' => ['Invalid email or password. If you forgot your password, you can reset it using the Forgot Password option.'],
            ]);
        }

        $user = Auth::user()->load('role');
        
        if (!$user->is_active) {
            return response()->json(['message' => 'Account is inactive'], 403);
        }

        // Check if user requires OTP verification
        if ($this->otpService->requiresOtp($user)) {
            // Get delivery method from request or user preference
            $deliveryMethod = $request->input('delivery_method', $user->otp_delivery_method ?? 'email');
            
            // Generate and send OTP
            $otpData = $this->otpService->generateAndSend($user, $deliveryMethod);
            
            Log::info('OTP generated for user', [
                'user_id' => $user->id,
                'email' => $user->email,
                'delivery_method' => $deliveryMethod,
                'ip' => $request->ip(),
            ]);

            $response = [
                'message' => $this->getOtpMessage($otpData, $deliveryMethod),
                'requires_otp' => true,
                'user_id' => $user->id,
                'email' => $user->email,
                'phone' => $user->phone,
                'country_code' => $user->country_code,
                'delivery_method' => $deliveryMethod,
            ];

            // Include OTP code for development/testing when delivery fails
            if (!$this->wasOtpSent($otpData, $deliveryMethod)) {
                $response['otp_code'] = $otpData['code'];
                $response['dev_mode'] = true;
            }

            return response()->json($response);
        }

        // No OTP required, complete login
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

    public function verifyOtp(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'code' => 'required|string|size:6',
        ]);

        $user = User::find($request->user_id);
        
        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        // Verify OTP
        if (!$this->otpService->verify($user, $request->code)) {
            Log::warning('OTP verification failed', [
                'user_id' => $user->id,
                'email' => $user->email,
                'ip' => $request->ip(),
            ]);

            return response()->json([
                'message' => 'Invalid or expired OTP. Please try again or request a new code.'
            ], 422);
        }

        // Generate authentication token
        $token = $user->createToken('auth-token')->plainTextToken;

        Log::info('OTP verification succeeded', [
            'user_id' => $user->id,
            'email' => $user->email,
            'ip' => $request->ip(),
        ]);
        ActivityLog::create([
            'user_id' => $user->id,
            'user_email' => $user->email,
            'event' => 'login',
            'description' => 'Signed in to the application with OTP verification',
            ...$this->deviceDetails($request),
        ]);

        return response()->json([
            'user' => $user->load('role'),
            'token' => $token,
        ]);
    }

    public function resendOtp(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        $user = User::find($request->user_id);
        
        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        // Generate and send new OTP
        $deliveryMethod = $request->input('delivery_method', $user->otp_delivery_method ?? 'email');
        $otpData = $this->otpService->generateAndSend($user, $deliveryMethod);
        
        Log::info('OTP resent to user', [
            'user_id' => $user->id,
            'email' => $user->email,
            'delivery_method' => $deliveryMethod,
            'ip' => $request->ip(),
        ]);

        $response = [
            'message' => $this->getOtpMessage($otpData, $deliveryMethod),
        ];

        // Include OTP code for development/testing when delivery fails
        if (!$this->wasOtpSent($otpData, $deliveryMethod)) {
            $response['otp_code'] = $otpData['code'];
            $response['dev_mode'] = true;
        }

        return response()->json($response);
    }

    /**
     * Get appropriate OTP message based on delivery method
     */
    protected function getOtpMessage(array $otpData, string $deliveryMethod): string
    {
        if ($this->wasOtpSent($otpData, $deliveryMethod)) {
            return match($deliveryMethod) {
                'sms' => 'OTP sent to your phone via SMS',
                'whatsapp' => 'OTP sent to your WhatsApp',
                'email' => 'OTP sent to your email',
                default => 'OTP sent to your email',
            };
        }
        
        return match($deliveryMethod) {
            'sms' => 'OTP generated (SMS not configured)',
            'whatsapp' => 'OTP generated (WhatsApp not configured)',
            'email' => 'OTP generated (email not configured)',
            default => 'OTP generated (email not configured)',
        };
    }

    /**
     * Check if OTP was successfully sent
     */
    protected function wasOtpSent(array $otpData, string $deliveryMethod): bool
    {
        return match($deliveryMethod) {
            'sms' => $otpData['sms_sent'] ?? false,
            'whatsapp' => $otpData['whatsapp_sent'] ?? false,
            'email' => $otpData['email_sent'] ?? false,
            default => $otpData['email_sent'] ?? false,
        };
    }
}
