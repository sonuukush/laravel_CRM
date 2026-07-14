<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    /**
     * Display a listing of the customers.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Customer::with(['assignedTo', 'createdBy']);

        // Role-based data isolation
        if ($user->hasRole('Sales Executive')) {
            $query->where('assigned_to', $user->id);
        }

        // Search filter (name, email, phone, company)
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('company', 'like', "%{$search}%");
            });
        }

        // Status filter
        if ($request->has('status') && !empty($request->status) && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Assigned user filter
        if ($request->has('assigned_to') && !empty($request->assigned_to) && $request->assigned_to !== 'all') {
            $query->where('assigned_to', $request->assigned_to);
        }

        // Sort details
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        // Pagination
        $perPage = $request->get('per_page', 10);
        $customers = $query->paginate($perPage);

        return response()->json($customers);
    }

    /**
     * Store a newly created customer in storage.
     */
    public function store(Request $request)
    {
        $user = $request->user();

        // Check permission
        if (!$user->hasPermissionTo('customers.create')) {
            return response()->json(['message' => 'Unauthorized action'], 403);
        }

        $fields = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['required', 'string', 'max:20'],
            'company' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string'],
            'status' => ['nullable', 'in:lead,customer,inactive'],
            'pipeline_stage' => ['nullable', 'in:New,Contacted,Qualified,Converted,Lost'],
            'assigned_to' => ['nullable', 'exists:users,id'],
        ]);

        // Non-admin/manager cannot reassign
        $assignedTo = null;
        if ($user->hasAnyRole(['Admin', 'Manager'])) {
            $assignedTo = $fields['assigned_to'] ?? null;
        } else {
            // Sales Executive assigns to themselves by default
            $assignedTo = $user->id;
        }

        $customer = Customer::create([
            'name' => $fields['name'],
            'email' => $fields['email'],
            'phone' => $fields['phone'],
            'company' => $fields['company'] ?? null,
            'address' => $fields['address'] ?? null,
            'status' => $fields['status'] ?? 'lead',
            'pipeline_stage' => $fields['pipeline_stage'] ?? 'New',
            'assigned_to' => $assignedTo,
            'created_by' => $user->id,
        ]);

        return response()->json([
            'message' => 'Customer created successfully',
            'customer' => $customer->load(['assignedTo', 'createdBy'])
        ], 201);
    }

    /**
     * Display the specified customer.
     */
    public function show(Request $request, $id)
    {
        $user = $request->user();
        $customer = Customer::with(['assignedTo', 'createdBy', 'activities.user', 'deals.assignedTo', 'documents.uploadedBy'])
            ->findOrFail($id);

        // Access check
        if ($user->hasRole('Sales Executive') && $customer->assigned_to !== $user->id) {
            return response()->json(['message' => 'Unauthorized to view this customer'], 403);
        }

        return response()->json($customer);
    }

    /**
     * Update the specified customer in storage.
     */
    public function update(Request $request, $id)
    {
        $user = $request->user();
        $customer = Customer::findOrFail($id);

        // Access check
        if ($user->hasRole('Sales Executive') && $customer->assigned_to !== $user->id) {
            return response()->json(['message' => 'Unauthorized to update this customer'], 403);
        }

        if (!$user->hasPermissionTo('customers.edit')) {
            return response()->json(['message' => 'Unauthorized action'], 403);
        }

        $fields = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['required', 'string', 'max:20'],
            'company' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string'],
            'status' => ['required', 'in:lead,customer,inactive'],
            'pipeline_stage' => ['nullable', 'in:New,Contacted,Qualified,Converted,Lost'],
            'assigned_to' => ['nullable', 'exists:users,id'],
        ]);

        $customer->name = $fields['name'];
        $customer->email = $fields['email'];
        $customer->phone = $fields['phone'];
        $customer->company = $fields['company'] ?? null;
        $customer->address = $fields['address'] ?? null;
        $customer->status = $fields['status'];
        
        if (isset($fields['pipeline_stage'])) {
            $customer->pipeline_stage = $fields['pipeline_stage'];
        }

        // Only Admin/Manager can reassign
        if ($user->hasAnyRole(['Admin', 'Manager']) && array_key_exists('assigned_to', $fields)) {
            $customer->assigned_to = $fields['assigned_to'];
        }

        $customer->save();

        return response()->json([
            'message' => 'Customer updated successfully',
            'customer' => $customer->load(['assignedTo', 'createdBy'])
        ]);
    }

    /**
     * Remove the specified customer from storage.
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $customer = Customer::findOrFail($id);

        // Only Admin can delete customers
        if (!$user->hasRole('Admin') || !$user->hasPermissionTo('customers.delete')) {
            return response()->json(['message' => 'Unauthorized action. Only admins can delete customers.'], 403);
        }

        $customer->delete();

        return response()->json([
            'message' => 'Customer deleted successfully'
        ]);
    }
}
