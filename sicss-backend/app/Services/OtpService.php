<?php

namespace App\Services;

use App\Models\Otp;
use App\Models\User;
use Illuminate\Support\Facades\Mail;
use App\Mail\OtpMail;
use Carbon\Carbon;

class OtpService
{
    /**
     * Generate and send OTP to user
     */
    public function generateAndSend(User $user, string $deliveryMethod = 'email'): array
    {
        // Invalidate any existing OTPs for this user
        Otp::where('user_id', $user->id)->update(['used' => true]);

        // Generate 6-digit OTP
        $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        
        // Create OTP record (expires in 10 minutes)
        $otp = Otp::create([
            'user_id' => $user->id,
            'code' => $code,
            'expires_at' => Carbon::now()->addMinutes(10),
            'used' => false,
        ]);

        $emailSent = false;
        $smsSent = false;
        $whatsappSent = false;
        
        // Send OTP via selected delivery method
        try {
            switch ($deliveryMethod) {
                case 'sms':
                    $smsSent = $this->sendViaSms($user, $code);
                    break;
                case 'whatsapp':
                    $whatsappSent = $this->sendViaWhatsApp($user, $code);
                    break;
                case 'email':
                default:
                    Mail::to($user->email)->send(new OtpMail($code, $user->first_name));
                    $emailSent = true;
                    break;
            }
        } catch (\Exception $e) {
            \Log::error('Failed to send OTP', [
                'user_id' => $user->id,
                'delivery_method' => $deliveryMethod,
                'error' => $e->getMessage(),
            ]);
        }

        // Return OTP data (including code for development/testing when delivery fails)
        return [
            'otp' => $otp,
            'code' => $code,
            'email_sent' => $emailSent,
            'sms_sent' => $smsSent,
            'whatsapp_sent' => $whatsappSent,
            'delivery_method' => $deliveryMethod,
        ];
    }

    /**
     * Send OTP via SMS (Twilio integration placeholder)
     */
    protected function sendViaSms(User $user, string $code): bool
    {
        // TODO: Integrate with Twilio or SMS service
        // Example Twilio implementation:
        // $twilio = new \Twilio\Rest\Client(env('TWILIO_SID'), env('TWILIO_TOKEN'));
        // $twilio->messages->create(
        //     $user->country_code . $user->phone,
        //     [
        //         'from' => env('TWILIO_PHONE_NUMBER'),
        //         'body' => "Your SICSS verification code is: {$code}. Valid for 10 minutes."
        //     ]
        // );
        
        \Log::info('SMS OTP would be sent', [
            'user_id' => $user->id,
            'phone' => $user->country_code . $user->phone,
            'code' => $code,
        ]);
        
        return false; // Return false until SMS service is configured
    }

    /**
     * Send OTP via WhatsApp (Twilio/WhatsApp Business API placeholder)
     */
    protected function sendViaWhatsApp(User $user, string $code): bool
    {
        // TODO: Integrate with Twilio WhatsApp or WhatsApp Business API
        // Example Twilio WhatsApp implementation:
        // $twilio = new \Twilio\Rest\Client(env('TWILIO_SID'), env('TWILIO_TOKEN'));
        // $twilio->messages->create(
        //     'whatsapp:' . $user->country_code . $user->phone,
        //     [
        //         'from' => 'whatsapp:' . env('TWILIO_WHATSAPP_NUMBER'),
        //         'body' => "Your SICSS verification code is: {$code}. Valid for 10 minutes."
        //     ]
        // );
        
        \Log::info('WhatsApp OTP would be sent', [
            'user_id' => $user->id,
            'phone' => $user->country_code . $user->phone,
            'code' => $code,
        ]);
        
        return false; // Return false until WhatsApp service is configured
    }

    /**
     * Verify OTP code
     */
    public function verify(User $user, string $code): bool
    {
        $otp = Otp::where('user_id', $user->id)
            ->where('code', $code)
            ->where('used', false)
            ->where('expires_at', '>', Carbon::now())
            ->first();

        if (!$otp) {
            return false;
        }

        // Mark as used
        $otp->update(['used' => true]);

        return true;
    }

    /**
     * Check if user requires OTP verification
     */
    public function requiresOtp(User $user): bool
    {
        $role = $user->role->slug ?? '';
        
        // OTP required for admin, teacher, and staff roles
        $otpRequiredRoles = ['admin', 'teacher', 'class-teacher', 'subject-teacher', 'class-sponsor', 'staff', 'finance', 'finance-staff', 'vice-principal-instruction'];
        
        return in_array($role, $otpRequiredRoles);
    }
}
