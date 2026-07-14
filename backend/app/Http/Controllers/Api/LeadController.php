<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\Request;

class LeadController extends Controller
{
    /**
     * Display a listing of the leads.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Customer::with(['assignedTo', 'createdBy'])->where('status', 'lead');

        // Role-based data isolation
        if ($user->hasRole('Sales Executive')) {
            $query->where('assigned_to', $user->id);
        }

        // Filters (pipeline stage)
        if ($request->has('stage') && !empty($request->stage) && $request->stage !== 'all') {
            $query->where('pipeline_stage', $request->stage);
        }

        // Search
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('company', 'like', "%{$search}%");
            });
        }

        $leads = $query->paginate($request->get('per_page', 10));

        return response()->json($leads);
    }

    /**
     * Convert a lead to a customer.
     */
    public function convert(Request $request, $id)
    {
        $user = $request->user();
        $lead = Customer::findOrFail($id);

        // Access check
        if ($user->hasRole('Sales Executive') && $lead->assigned_to !== $user->id) {
            return response()->json(['message' => 'Unauthorized access'], 403);
        }

        if ($lead->status !== 'lead') {
            return response()->json(['message' => 'Customer is already converted or inactive'], 400);
        }

        // Perform conversion
        $lead->status = 'customer';
        $lead->pipeline_stage = 'Converted';
        $lead->save();

        return response()->json([
            'message' => 'Lead converted to customer successfully',
            'customer' => $lead
        ]);
    }
}
