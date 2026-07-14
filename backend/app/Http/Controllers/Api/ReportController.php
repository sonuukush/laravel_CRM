<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Deal;
use App\Models\Customer;
use App\Exports\CustomersExport;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use Barryvdh\DomPDF\Facade\Pdf;

class ReportController extends Controller
{
    /**
     * Get Sales Performance metrics.
     * Accessible by Admin and Manager only.
     */
    public function salesPerformance(Request $request)
    {
        $user = $request->user();

        if (!$user->hasAnyRole(['Admin', 'Manager']) || !$user->hasPermissionTo('reports.view')) {
            return response()->json(['message' => 'Unauthorized access'], 403);
        }

        // Get all Sales Executives
        $salesExecs = User::role('Sales Executive')->get();

        $performanceData = [];

        foreach ($salesExecs as $exec) {
            $totalCustomers = Customer::where('assigned_to', $exec->id)->where('status', 'customer')->count();
            $totalLeads = Customer::where('assigned_to', $exec->id)->where('status', 'lead')->count();
            
            $dealsQuery = Deal::where('assigned_to', $exec->id);
            $dealsWon = (clone $dealsQuery)->where('stage', 'Won')->count();
            $revenue = (clone $dealsQuery)->where('stage', 'Won')->sum('amount');
            $dealsLost = (clone $dealsQuery)->where('stage', 'Lost')->count();
            $totalDeals = (clone $dealsQuery)->count();

            // Deal conversion rate (Won Deals / Total Deals)
            $conversionRate = $totalDeals > 0 ? round(($dealsWon / $totalDeals) * 100, 2) : 0;

            $performanceData[] = [
                'id' => $exec->id,
                'name' => $exec->name,
                'email' => $exec->email,
                'total_customers' => $totalCustomers,
                'total_leads' => $totalLeads,
                'total_deals' => $totalDeals,
                'deals_won' => $dealsWon,
                'deals_lost' => $dealsLost,
                'revenue' => floatval($revenue),
                'conversion_rate' => $conversionRate
            ];
        }

        return response()->json($performanceData);
    }

    /**
     * Export Customers to Excel.
     */
    public function exportExcel(Request $request)
    {
        $user = $request->user();
        $roleName = $user->roles->first() ? $user->roles->first()->name : 'Sales Executive';

        return Excel::download(new CustomersExport($user->id, $roleName), 'customers_report.xlsx');
    }

    /**
     * Export Deals to PDF.
     */
    public function exportPdf(Request $request)
    {
        $user = $request->user();
        $query = Deal::with(['customer', 'assignedTo'])->orderBy('closing_date', 'desc');

        // Role restriction
        if ($user->hasRole('Sales Executive')) {
            $query->where('assigned_to', $user->id);
        }

        $deals = $query->get();
        $totalAmount = $deals->sum('amount');
        $wonAmount = $deals->where('stage', 'Won')->sum('amount');

        // Render blade template and generate PDF
        $pdf = Pdf::loadView('reports.deals', [
            'deals' => $deals,
            'totalAmount' => $totalAmount,
            'wonAmount' => $wonAmount,
            'exportedAt' => now()->toDateTimeString(),
            'exportedBy' => $user->name
        ]);

        return $pdf->download('deals_report.pdf');
    }
}
