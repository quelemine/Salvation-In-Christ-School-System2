<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class UploadController extends Controller
{
    /**
     * Upload a logo / branding image.
     * Stores under storage/app/public/branding/ and returns the public URL.
     */
    public function logo(Request $request)
    {
        $request->validate([
            'file' => 'required|file|image|max:2048|mimes:png,jpg,jpeg,svg,webp',
        ]);

        // Remove the old logo if one was uploaded before
        $oldPath = $request->input('old_path');
        if ($oldPath) {
            $relative = str_replace('/storage/', 'public/', ltrim(parse_url($oldPath, PHP_URL_PATH), '/'));
            if (Storage::exists($relative)) {
                Storage::delete($relative);
            }
        }

        $path = $request->file('file')->store('branding', 'public');

        return response()->json([
            'path'  => $path,                              // e.g. branding/logo.png
            'url'   => Storage::url($path),                // /storage/branding/logo.png
            'full_url' => url(Storage::url($path)),        // http://127.0.0.1:8000/storage/branding/logo.png
        ], 201);
    }

    /**
     * Delete a previously uploaded logo.
     */
    public function deleteLogo(Request $request)
    {
        $request->validate(['path' => 'required|string']);

        $storagePath = 'public/' . ltrim($request->path, '/');
        if (Storage::exists($storagePath)) {
            Storage::delete($storagePath);
        }

        return response()->json(['message' => 'Logo deleted.']);
    }

    /** Upload an optional teacher profile photo or credential image. */
    public function teacherImage(Request $request)
    {
        return $this->uploadImage($request, 'teachers');
    }

    /** Upload an optional profile photo or credential image for any user role. */
    public function userImage(Request $request)
    {
        return $this->uploadImage($request, 'users');
    }

    private function uploadImage(Request $request, string $directory)
    {
        $request->validate([
            'file' => 'required|file|image|max:5120|mimes:png,jpg,jpeg,webp',
            'type' => 'required|in:profile,credential',
        ]);

        $path = $request->file('file')->store($directory . '/' . $request->input('type'), 'public');

        return response()->json([
            'path' => $path,
            'url' => Storage::url($path),
            'full_url' => url(Storage::url($path)),
        ], 201);
    }
}
