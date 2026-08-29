<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, string $role): Response
    {
        $roles = explode('|', $role);
        
        if (!$request->user() || !$request->user()->hasAnyRole($roles)) {
            return response()->json(['message' => 'Unauthorized. Required role: ' . $role], 403);
        }

        return $next($request);
    }
}
