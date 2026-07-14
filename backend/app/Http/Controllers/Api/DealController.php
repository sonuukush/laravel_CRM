<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Deal;
use Illuminate\Http\Request;

class DealController extends Controller
{
    /**
     * Display a listing of the deals.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Deal::with(['customer', 'assignedTo']);

        // Role-based data isolation
        if ($user->hasRole('Sales Executive')) {
            $query->where('assigned_to', $user->id);
        }

        // Filters (stage)
        if ($request->has('stage') && !empty($request->stage) && $request->stage !== 'all') {
            $query->where('stage', $request->stage);
        }

        // Search (customer name or deal title)
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhereHas('customer', function ($cq) use ($search) {
                      $cq->where('name', 'like', "%{$search}%")
                        ->orWhere('company', 'like', "%{$search}%");
                  });
            });
        }

        $deals = $query->get();

        return response()->json($deals);
    }

    /**
     * Store a newly created deal in storage.
     */
    public function store(Request $request)
    {
        $user = $request->user();

        if (!$user->hasPermissionTo('deals.create')) {
            return response()->json(['message' => 'Unauthorized action'], 403);
        }

        $fields = $request->validate([
            'customer_id' => ['required', 'exists:customers,id'],
            'title' => ['required', 'string', 'max:255'],
            'amount' => ['required', 'numeric', 'min:0'],
            'stage' => ['required', 'in:Prospecting,Qualification,Negotiation,Won,Lost'],
            'assigned_to' => ['nullable', 'exists:users,id'],
            'closing_date' => ['nullable', 'date'],
        ]);

        $customer = Customer::findOrFail($fields['customer_id']);

        // Access check
        if ($user->hasRole('Sales Executive') && $customer->assigned_to !== $user->id) {
            return response()->json(['message' => 'Unauthorized to create deal for this customer'], 403);
        }

        // Set assignee
        $assignedTo = $fields['assigned_to'] ?? null;
        if ($user->hasRole('Sales Executive')) {
            $assignedTo = $user->id;
        }

        $deal = Deal::create([
            'customer_id' => $fields['customer_id'],
            'title' => $fields['title'],
            'amount' => $fields['amount'],
            'stage' => $fields['stage'],
            'assigned_to' => $assignedTo ?? $user->id,
            'closing_date' => $fields['closing_date'] ?? null,
        ]);

        return response()->json([
            'message' => 'Deal created successfully',
            'deal' => $deal->load(['customer', 'assignedTo'])
        ], 201);
    }

    /**
     * Update the specified deal in storage.
     */
    public function update(Request $request, $id)
    {
        $user = $request->user();
        $deal = Deal::findOrFail($id);

        // Access check
        if ($user->hasRole('Sales Executive') && $deal->assigned_to !== $user->id) {
            return response()->json(['message' => 'Unauthorized action'], 403);
        }

        if (!$user->hasPermissionTo('deals.edit')) {
            return response()->json(['message' => 'Unauthorized action'], 403);
        }

        $fields = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'amount' => ['required', 'numeric', 'min:0'],
            'stage' => ['required', 'in:Prospecting,Qualification,Negotiation,Won,Lost'],
            'assigned_to' => ['nullable', 'exists:users,id'],
            'closing_date' => ['nullable', 'date'],
        ]);

        $deal->title = $fields['title'];
        $deal->amount = $fields['amount'];
        $deal->stage = $fields['stage'];
        $deal->closing_date = $fields['closing_date'] ?? null;

        if ($user->hasAnyRole(['Admin', 'Manager']) && array_key_exists('assigned_to', $fields)) {
            $deal->assigned_to = $fields['assigned_to'];
        }

        $deal->save();

        return response()->json([
            'message' => 'Deal updated successfully',
            'deal' => $deal->load(['customer', 'assignedTo'])
        ]);
    }

    /**
     * Update only the deal stage (e.g. for Kanban drag-and-drop).
     */
    public function updateStage(Request $request, $id)
    {
        $user = $request->user();
        $deal = Deal::findOrFail($id);

        // Access check
        if ($user->hasRole('Sales Executive') && $deal->assigned_to !== $user->id) {
            return response()->json(['message' => 'Unauthorized action'], 403);
        }

        if (!$user->hasPermissionTo('deals.edit')) {
            return response()->json(['message' => 'Unauthorized action'], 403);
        }

        $fields = $request->validate([
            'stage' => ['required', 'in:Prospecting,Qualification,Negotiation,Won,Lost'],
        ]);

        $deal->stage = $fields['stage'];
        $deal->save();

        return response()->json([
            'message' => 'Deal stage updated successfully',
            'deal' => $deal->load(['customer', 'assignedTo'])
        ]);
    }
}
