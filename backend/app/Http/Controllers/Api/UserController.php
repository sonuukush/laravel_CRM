<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    /**
     * Display a listing of the users.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        // Only Admin and Manager can see user lists
        if (!$user->hasAnyRole(['Admin', 'Manager']) || !$user->hasPermissionTo('users.manage')) {
            // Wait, manager might view executives, but prompt says: "users.manage: Admin only".
            // Let's restrict it strictly to Admin.
            if (!$user->hasRole('Admin')) {
                return response()->json(['message' => 'Unauthorized access'], 403);
            }
        }

        $users = User::with('roles')
            ->orderBy('name')
            ->paginate($request->get('per_page', 10));

        // Get all available roles for helper selects in front-end
        $roles = Role::all()->pluck('name');

        return response()->json([
            'users' => $users,
            'roles' => $roles
        ]);
    }

    /**
     * Store a newly created user.
     */
    public function store(Request $request)
    {
        $user = $request->user();

        if (!$user->hasRole('Admin') || !$user->hasPermissionTo('users.manage')) {
            return response()->json(['message' => 'Unauthorized action'], 403);
        }

        $fields = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', Password::defaults()],
            'phone' => ['nullable', 'string', 'max:20'],
            'role' => ['required', 'string', 'exists:roles,name'],
            'status' => ['required', 'in:active,inactive']
        ]);

        $newUser = User::create([
            'name' => $fields['name'],
            'email' => $fields['email'],
            'password' => Hash::make($fields['password']),
            'phone' => $fields['phone'] ?? null,
            'status' => $fields['status']
        ]);

        $newUser->assignRole($fields['role']);

        return response()->json([
            'message' => 'User created successfully',
            'user' => $newUser->load('roles')
        ], 201);
    }

    /**
     * Update the specified user.
     */
    public function update(Request $request, $id)
    {
        $user = $request->user();

        if (!$user->hasRole('Admin') || !$user->hasPermissionTo('users.manage')) {
            return response()->json(['message' => 'Unauthorized action'], 403);
        }

        $editUser = User::findOrFail($id);

        $fields = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email,' . $editUser->id],
            'password' => ['nullable', Password::defaults()],
            'phone' => ['nullable', 'string', 'max:20'],
            'role' => ['required', 'string', 'exists:roles,name'],
            'status' => ['required', 'in:active,inactive']
        ]);

        $editUser->name = $fields['name'];
        $editUser->email = $fields['email'];
        $editUser->phone = $fields['phone'] ?? null;
        $editUser->status = $fields['status'];

        if (!empty($fields['password'])) {
            $editUser->password = Hash::make($fields['password']);
        }

        $editUser->save();

        // Sync roles (Spatie replaces all existing roles with the new one)
        $editUser->syncRoles([$fields['role']]);

        return response()->json([
            'message' => 'User updated successfully',
            'user' => $editUser->load('roles')
        ]);
    }

    /**
     * Remove the specified user (soft-delete).
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();

        if (!$user->hasRole('Admin') || !$user->hasPermissionTo('users.manage')) {
            return response()->json(['message' => 'Unauthorized action'], 403);
        }

        $deleteUser = User::findOrFail($id);

        // Prevent self deletion
        if ($deleteUser->id === $user->id) {
            return response()->json(['message' => 'You cannot delete yourself'], 400);
        }

        $deleteUser->delete();

        return response()->json([
            'message' => 'User deleted successfully'
        ]);
    }

    /**
     * Assign/reassign a role to a user.
     */
    public function assignRole(Request $request)
    {
        $user = $request->user();

        if (!$user->hasRole('Admin') || !$user->hasPermissionTo('users.manage')) {
            return response()->json(['message' => 'Unauthorized action'], 403);
        }

        $fields = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
            'role' => ['required', 'string', 'exists:roles,name']
        ]);

        $targetUser = User::findOrFail($fields['user_id']);
        
        // Sync roles (assign the single chosen role)
        $targetUser->syncRoles([$fields['role']]);

        return response()->json([
            'message' => 'Role assigned successfully',
            'user' => $targetUser->load('roles')
        ]);
    }
}
