<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index()
    {
        return response()->json(User::with('role:id,name,slug')->latest()->get());
    }

    public function roles()
    {
        return response()->json(Role::where('is_active', true)->orderBy('name')->get(['id', 'name', 'slug']));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'role_id' => ['required', 'integer', Rule::exists('roles', 'id')->where('is_active', true)],
            'phone' => ['nullable', 'string', 'max:20'],
            'address' => ['nullable', 'string', 'max:255'],
            'profile_photo' => ['nullable', 'string', 'max:2048'],
            'credential_image_path' => ['nullable', 'string', 'max:2048'],
        ]);

        $validated['password'] = Hash::make($validated['password']);
        $user = User::create($validated)->load('role:id,name,slug');

        ActivityLog::create([
            'user_id' => $request->user()->id,
            'user_email' => $request->user()->email,
            'event' => 'user_created',
            'description' => 'Created user account for '.$user->email,
            'ip_address' => $request->ip(),
            'device_type' => 'Desktop',
            'browser' => 'Other',
            'platform' => 'Other',
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json($user, 201);
    }

    /**
     * Admin resets another user's password.
     */
    public function resetPassword(Request $request, User $user)
    {
        $request->validate([
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user->update(['password' => Hash::make($request->password)]);

        ActivityLog::create([
            'user_id' => $request->user()->id,
            'user_email' => $request->user()->email,
            'event' => 'password_reset',
            'description' => 'Admin reset password for '.$user->email,
            'ip_address' => $request->ip(),
            'device_type' => 'Desktop',
            'browser' => 'Other',
            'platform' => 'Other',
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json(['message' => 'Password reset successfully for '.$user->email]);
    }

    /**
     * Admin updates a user's basic profile (name, email, phone, role).
     */
    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'first_name' => ['sometimes', 'string', 'max:255'],
            'last_name'  => ['sometimes', 'string', 'max:255'],
            'email'      => ['sometimes', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'phone'      => ['nullable', 'string', 'max:20'],
            'address'    => ['nullable', 'string', 'max:255'],
            'profile_photo' => ['nullable', 'string', 'max:2048'],
            'credential_image_path' => ['nullable', 'string', 'max:2048'],
            'role_id'    => ['sometimes', 'integer', Rule::exists('roles', 'id')->where('is_active', true)],
            'is_active'  => ['sometimes', 'boolean'],
        ]);

        $user->update($validated);

        ActivityLog::create([
            'user_id' => $request->user()->id,
            'user_email' => $request->user()->email,
            'event' => 'user_updated',
            'description' => 'Updated profile for '.$user->email,
            'ip_address' => $request->ip(),
            'device_type' => 'Desktop',
            'browser' => 'Other',
            'platform' => 'Other',
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json($user->load('role:id,name,slug'));
    }

    /**
     * Any authenticated user updates their own profile.
     */
    public function updateSelf(Request $request)
    {
        $user = $request->user();

        abort_if(
            in_array($user->role?->slug, ['student', 'teacher', 'class-sponsor', 'subject-teacher', 'finance', 'finance-staff'], true),
            403,
            'This profile is managed by an administrator. Please contact the school for changes.'
        );

        $validated = $request->validate([
            'first_name' => ['sometimes', 'string', 'max:255'],
            'last_name'  => ['sometimes', 'string', 'max:255'],
            'email'      => ['sometimes', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'phone'      => ['nullable', 'string', 'max:30'],
            'address'    => ['nullable', 'string', 'max:255'],
        ]);

        // Convert empty strings to null for nullable fields
        foreach (['phone', 'address'] as $field) {
            if (isset($validated[$field]) && $validated[$field] === '') {
                $validated[$field] = null;
            }
        }

        $user->update($validated);

        return response()->json($user->fresh()->load('role:id,name,slug'));
    }
}
