<?php

namespace Tests\Feature;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('email')->unique();
            $table->string('password');
            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('user_email')->nullable();
            $table->string('event');
            $table->text('description');
            $table->string('ip_address')->nullable();
            $table->string('device_type')->nullable();
            $table->string('browser')->nullable();
            $table->string('platform')->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();
        });
    }

    protected function tearDown(): void
    {
        Schema::dropIfExists('activity_logs');
        Schema::dropIfExists('users');

        parent::tearDown();
    }

    public function test_invalid_login_uses_the_friendly_non_enumerating_message(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'missing-user@example.test',
            'password' => 'incorrect-password',
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonPath(
                'message',
                'Invalid email or password. If you forgot your password, you can reset it using the Forgot Password option.'
            )
            ->assertJsonPath(
                'errors.email.0',
                'Invalid email or password. If you forgot your password, you can reset it using the Forgot Password option.'
            );
    }
}
