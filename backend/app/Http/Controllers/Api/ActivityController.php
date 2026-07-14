<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Activity;
use App\Models\Customer;
use Illuminate\Http\Request;

class ActivityController extends Controller
{
    /**
     * Display a listing of activities for a specific customer.
     */
    public function getCustomerActivities(Request $request, $customerId)
    {
        $user = $request->user();
        $customer = Customer::findOrFail($customerId);

        // Access check
        if ($user->hasRole('Sales Executive') && $customer->assigned_to !== $user->id) {
            return response()->json(['message' => 'Unauthorized access'], 403);
        }

        $activities = Activity::where('customer_id', $customerId)
            ->with('user')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($activities);
    }

    /**
     * Store a newly created activity in storage.
     */
    public function store(Request $request)
    {
        $user = $request->user();

        if (!$user->hasPermissionTo('activities.create')) {
            return response()->json(['message' => 'Unauthorized action'], 403);
        }

        $fields = $request->validate([
            'customer_id' => ['required', 'exists:customers,id'],
            'type' => ['required', 'in:call,meeting,email,note'],
            'description' => ['required', 'string'],
            'due_date' => ['nullable', 'date'],
            'status' => ['nullable', 'in:pending,done'],
        ]);

        $customer = Customer::findOrFail($fields['customer_id']);

        // Access check
        if ($user->hasRole('Sales Executive') && $customer->assigned_to !== $user->id) {
            return response()->json(['message' => 'Unauthorized to log activity for this customer'], 403);
        }

        $activity = Activity::create([
            'customer_id' => $fields['customer_id'],
            'user_id' => $user->id,
            'type' => $fields['type'],
            'description' => $fields['description'],
            'due_date' => $fields['due_date'] ?? null,
            'status' => $fields['status'] ?? 'pending',
        ]);

        return response()->json([
            'message' => 'Activity logged successfully',
            'activity' => $activity->load('user')
        ], 201);
    }

    /**
     * Update the specified activity in storage.
     */
    public function update(Request $request, $id)
    {
        $user = $request->user();
        $activity = Activity::findOrFail($id);
        $customer = Customer::findOrFail($activity->customer_id);

        // Access check
        if ($user->hasRole('Sales Executive') && $customer->assigned_to !== $user->id) {
            return response()->json(['message' => 'Unauthorized action'], 403);
        }

        if (!$user->hasPermissionTo('activities.edit')) {
            return response()->json(['message' => 'Unauthorized action'], 403);
        }

        $fields = $request->validate([
            'type' => ['nullable', 'in:call,meeting,email,note'],
            'description' => ['nullable', 'string'],
            'due_date' => ['nullable', 'date'],
            'status' => ['nullable', 'in:pending,done'],
        ]);

        if (isset($fields['type'])) {
            $activity->type = $fields['type'];
        }
        if (isset($fields['description'])) {
            $activity->description = $fields['description'];
        }
        if (array_key_exists('due_date', $fields)) {
            $activity->due_date = $fields['due_date'];
        }
        if (isset($fields['status'])) {
            $activity->status = $fields['status'];
        }

        $activity->save();

        return response()->json([
            'message' => 'Activity updated successfully',
            'activity' => $activity->load('user')
        ]);
    }
}
