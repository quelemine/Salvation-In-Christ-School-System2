<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class UniversalUserIdTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('first_name');
            $table->string('last_name');
            $table->string('email')->unique();
            $table->string('password');
            $table->unsignedBigInteger('role_id')->nullable();
            $table->string('user_code')->unique();
            $table->string('uuid')->nullable();
            $table->string('sync_status')->nullable();
            $table->unsignedInteger('version')->nullable();
            $table->timestamp('last_synced_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('user_id_sequences', function (Blueprint $table) {
            $table->unsignedSmallInteger('year')->primary();
            $table->unsignedInteger('last_sequence')->default(0);
            $table->timestamps();
        });

        Schema::create('user_id_reservations', function (Blueprint $table) {
            $table->id();
            $table->string('user_code')->unique();
            $table->unsignedBigInteger('user_id')->nullable()->unique();
            $table->unsignedSmallInteger('year');
            $table->unsignedInteger('sequence');
            $table->timestamps();
            $table->unique(['year', 'sequence']);
        });
    }

    protected function tearDown(): void
    {
        Schema::dropIfExists('user_id_reservations');
        Schema::dropIfExists('user_id_sequences');
        Schema::dropIfExists('users');

        parent::tearDown();
    }

    public function test_all_roles_share_one_global_user_id_sequence(): void
    {
        $roles = [1, 2, 3, 4, 5];
        $users = array_map(fn (int $role, int $index) => User::create([
            'first_name' => 'Test',
            'last_name' => "Role {$role}",
            'email' => "role-{$index}@example.test",
            'password' => 'hashed-password',
            'role_id' => $role,
        ]), $roles, array_keys($roles));

        $year = now()->format('Y');
        $this->assertSame([
            "STU-{$year}-0001",
            "STU-{$year}-0002",
            "STU-{$year}-0003",
            "STU-{$year}-0004",
            "STU-{$year}-0005",
        ], array_map(fn (User $user) => $user->user_code, $users));
        $this->assertCount(5, DB::table('user_id_reservations')->get());
    }

    public function test_database_rejects_duplicate_ids_and_deleted_ids_are_not_reused(): void
    {
        $first = User::create([
            'first_name' => 'First',
            'last_name' => 'User',
            'email' => 'first@example.test',
            'password' => 'hashed-password',
        ]);

        $this->expectException(QueryException::class);
        DB::table('users')->insert([
            'first_name' => 'Duplicate',
            'last_name' => 'User',
            'email' => 'duplicate@example.test',
            'password' => 'hashed-password',
            'user_code' => $first->user_code,
            'is_active' => true,
        ]);
    }

    public function test_deleted_users_leave_their_id_reserved(): void
    {
        $first = User::create([
            'first_name' => 'First',
            'last_name' => 'User',
            'email' => 'first@example.test',
            'password' => 'hashed-password',
        ]);
        $first->delete();

        $next = User::create([
            'first_name' => 'Next',
            'last_name' => 'User',
            'email' => 'next@example.test',
            'password' => 'hashed-password',
        ]);

        $this->assertNotSame($first->user_code, $next->user_code);
        $this->assertDatabaseHas('user_id_reservations', ['user_code' => $first->user_code]);
    }

    public function test_manual_user_ids_are_rejected(): void
    {
        $user = new User([
            'first_name' => 'Manual',
            'last_name' => 'Attempt',
            'email' => 'manual@example.test',
            'password' => 'hashed-password',
        ]);
        $user->user_code = 'STU-2026-9999';

        $this->expectException(\LogicException::class);
        $user->save();
    }
}
