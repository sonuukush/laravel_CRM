<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    /**
     * Handle user registration.
     */
    public function register(Request $request)
    {
        $fields = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'confirmed', Password::defaults()],
            'phone' => ['nullable', 'string', 'max:20'],
        ]);

        $user = User::create([
            'name' => $fields['name'],
            'email' => $fields['email'],
            'password' => Hash::make($fields['password']),
            'phone' => $fields['phone'] ?? null,
            'status' => 'active',
        ]);

        // Default role for new registrations is Sales Executive
        $user->assignRole('Sales Executive');

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Registration successful',
            'user' => $user->load('roles'),
            'token' => $token,
        ], 201);
    }

    /**
     * Handle user login.
     */
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (!Auth::attempt($credentials)) {
            return response()->json([
                'message' => 'Invalid email or password'
            ], 412);
        }

        $user = User::where('email', $credentials['email'])->firstOrFail();

        if ($user->status !== 'active') {
            Auth::logout();
            return response()->json([
                'message' => 'Your account is deactivated'
            ], 403);
        }

        // Support SPA Cookie session regeneration
        if ($request->hasSession()) {
            $request->session()->regenerate();
        }

        // Support Token-based fallback
        $token = $user->createToken('auth_token')->plainTextToken;

        // Load roles and permissions
        $user->load('roles.permissions');
        $permissions = $user->getAllPermissions()->pluck('name');

        return response()->json([
            'message' => 'Login successful',
            'user' => $user,
            'roles' => $user->getRoleNames(),
            'permissions' => $permissions,
            'token' => $token
        ]);
    }

    /**
     * Handle user logout.
     */
    public function logout(Request $request)
    {
        // Revoke token if using Sanctum tokens
        if ($request->user() && $request->user()->currentAccessToken()) {
            $request->user()->currentAccessToken()->delete();
        }

        // Revoke session if using SPA Cookies
        Auth::guard('web')->logout();
        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return response()->json([
            'message' => 'Logged out successfully'
        ]);
    }

    /**
     * Get the authenticated user.
     */
    public function user(Request $request)
    {
        $user = $request->user();
        $user->load('roles.permissions');
        
        return response()->json([
            'user' => $user,
            'roles' => $user->getRoleNames(),
            'permissions' => $user->getAllPermissions()->pluck('name')
        ]);
    }

    /**
     * Update user profile.
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $fields = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email,' . $user->id],
            'phone' => ['nullable', 'string', 'max:20'],
            'password' => ['nullable', 'confirmed', Password::defaults()],
        ]);

        $user->name = $fields['name'];
        $user->email = $fields['email'];
        $user->phone = $fields['phone'] ?? null;

        if (!empty($fields['password'])) {
            $user->password = Hash::make($fields['password']);
        }

        $user->save();

        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => $user->load('roles')
        ]);
    }

    /**
     * Update profile photo.
     */
    public function updatePhoto(Request $request)
    {
        $request->validate([
            'photo' => ['required', 'image', 'mimes:jpeg,png,jpg,webp', 'max:2048'], // 2MB Max
        ]);

        $user = $request->user();

        if ($request->file('photo')) {
            // Delete old photo if it exists
            if ($user->profile_photo) {
                Storage::disk('public')->delete($user->profile_photo);
            }

            $path = $request->file('photo')->store('profile_photos', 'public');
            $user->profile_photo = $path;
            $user->save();

            return response()->json([
                'message' => 'Profile photo updated successfully',
                'profile_photo_url' => asset('storage/' . $path),
                'user' => $user
            ]);
        }

        return response()->json([
            'message' => 'No photo provided'
        ], 400);
    }
}
