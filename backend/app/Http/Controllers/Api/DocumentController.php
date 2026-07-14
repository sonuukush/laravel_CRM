<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Document;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class DocumentController extends Controller
{
    /**
     * Store an uploaded document.
     */
    public function upload(Request $request)
    {
        $user = $request->user();

        if (!$user->hasPermissionTo('documents.upload')) {
            return response()->json(['message' => 'Unauthorized action'], 403);
        }

        $request->validate([
            'customer_id' => ['required', 'exists:customers,id'],
            'file' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png,docx', 'max:5120'], // 5MB Max
        ]);

        $customerId = $request->input('customer_id');
        $customer = Customer::findOrFail($customerId);

        // Access check
        if ($user->hasRole('Sales Executive') && $customer->assigned_to !== $user->id) {
            return response()->json(['message' => 'Unauthorized to upload documents for this customer'], 403);
        }

        if ($request->file('file')) {
            $file = $request->file('file');
            $originalName = $file->getClientOriginalName();
            $extension = $file->getClientOriginalExtension();
            
            // Store file in storage/app/public/documents
            $path = $file->store('documents', 'public');

            $document = Document::create([
                'customer_id' => $customerId,
                'uploaded_by' => $user->id,
                'file_name' => $originalName,
                'file_path' => $path,
                'file_type' => $extension,
            ]);

            return response()->json([
                'message' => 'Document uploaded successfully',
                'document' => $document->load('uploadedBy')
            ], 201);
        }

        return response()->json(['message' => 'No file uploaded'], 400);
    }

    /**
     * Delete an uploaded document.
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $document = Document::findOrFail($id);
        $customer = Customer::findOrFail($document->customer_id);

        // Access check
        if ($user->hasRole('Sales Executive') && $customer->assigned_to !== $user->id) {
            return response()->json(['message' => 'Unauthorized action'], 403);
        }

        if (!$user->hasPermissionTo('documents.delete') && !$user->hasRole('Admin')) {
            return response()->json(['message' => 'Unauthorized action'], 403);
        }

        // Delete from storage
        Storage::disk('public')->delete($document->file_path);

        // Delete DB record
        $document->delete();

        return response()->json([
            'message' => 'Document deleted successfully'
        ]);
    }
}
