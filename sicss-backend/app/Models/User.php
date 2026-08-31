<?php

namespace App\Models;

use App\Traits\Syncable;
use App\Models\Role;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, Syncable;

    protected $fillable = [
        'first_name',
        'last_name',
        'email',
        'password',
        'role_id',
        'phone',
        'address',
        'profile_photo',
        'credential_image_path',
        'is_active',
        'two_fa_code',
        'two_fa_expires_at',
        'two_fa_enabled',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'two_fa_code',
    ];

    protected static function booted(): void
    {
        static::creating(function (User $user) {
            if ($user->user_code) {
                return;
            }

            $year = now()->format('Y');
            $prefix = static::userCodePrefix($user->role_id);
            $lastUser = static::where('user_code', 'like', "{$prefix}-{$year}-%")
                ->orderByDesc('user_code')
                ->first();
            $next = $lastUser
                ? (int) (explode('-', $lastUser->user_code)[2] ?? 0) + 1
                : 1;

            $user->user_code = "{$prefix}-{$year}-".str_pad((string) $next, 4, '0', STR_PAD_LEFT);
        });
    }

    public static function userCodePrefix(?int $roleId): string
    {
        $slug = $roleId ? Role::find($roleId)?->slug : null;

        return match ($slug) {
            'student' => 'STU',
            'teacher' => 'TCH',
            'class-teacher' => 'CTH',
            'subject-teacher' => 'STH',
            'parent' => 'PAR',
            'finance', 'finance-staff' => 'FIN',
            'vice-principal-instruction' => 'VPI',
            'principal' => 'PRI',
            'head-of-school' => 'HOS',
            'admin' => 'ADM',
            default => 'USR',
        };
    }

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
        ];
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    public function hasRole(string $roleSlug): bool
    {
        return $this->role && $this->role->slug === $roleSlug;
    }

    public function hasAnyRole(array $roleSlugs): bool
    {
        return $this->role && in_array($this->role->slug, $roleSlugs);
    }

    public function hasPermission(string $permissionSlug): bool
    {
        return $this->role && $this->role->permissions()->where('slug', $permissionSlug)->exists();
    }
}
