<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Deal;
use App\Models\Activity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardController extends Controller
{
    /**
     * Get statistics and charts data for the dashboard.
     */
    public function getStats(Request $request)
    {
        $user = $request->user();

        // 1. Initialize queries
        $customerQuery = Customer::query();
        $leadQuery = Customer::where('status', 'lead');
        $dealQuery = Deal::query();
        $activityQuery = Activity::with(['customer', 'user']);

        // 2. Role-based scopes
        if ($user->hasRole('Sales Executive')) {
            $customerQuery->where('assigned_to', $user->id);
            $leadQuery->where('assigned_to', $user->id);
            $dealQuery->where('assigned_to', $user->id);
            $activityQuery->whereHas('customer', function ($q) use ($user) {
                $q->where('assigned_to', $user->id);
            });
        }

        // 3. Count basic stats
        $totalCustomers = (clone $customerQuery)->where('status', 'customer')->count();
        $totalLeads = $leadQuery->count();
        
        $dealsWon = (clone $dealQuery)->where('stage', 'Won')->count();
        $dealsLost = (clone $dealQuery)->where('stage', 'Lost')->count();
        $dealsOpen = (clone $dealQuery)->whereNotIn('stage', ['Won', 'Lost'])->count();

        $totalRevenue = (clone $dealQuery)->where('stage', 'Won')->sum('amount');

        // 4. Recent Activities (last 5)
        $recentActivities = $activityQuery->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        // 5. Monthly Revenue Chart (for Won deals in the current year)
        $currentYear = Carbon::now()->year;
        $monthlyRevenueRaw = (clone $dealQuery)
            ->where('stage', 'Won')
            ->whereYear('closing_date', $currentYear)
            ->select(
                DB::raw('MONTH(closing_date) as month_num'),
                DB::raw('SUM(amount) as total_amount')
            )
            ->groupBy('month_num')
            ->orderBy('month_num')
            ->get();

        // Format monthly revenue with month names
        $months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        $monthlyRevenue = [];
        
        // Initialize all months to 0
        foreach ($months as $idx => $name) {
            $monthlyRevenue[$idx + 1] = [
                'month' => $name,
                'revenue' => 0
            ];
        }

        foreach ($monthlyRevenueRaw as $data) {
            $mNum = intval($data->month_num);
            if (isset($monthlyRevenue[$mNum])) {
                $monthlyRevenue[$mNum]['revenue'] = floatval($data->total_amount);
            }
        }

        // 6. Lead Status Pie Chart
        $leadStatusRaw = (clone $leadQuery)
            ->select('pipeline_stage', DB::raw('count(*) as count'))
            ->groupBy('pipeline_stage')
            ->get();

        $leadStatusData = [];
        foreach ($leadStatusRaw as $item) {
            $leadStatusData[] = [
                'name' => $item->pipeline_stage,
                'value' => intval($item->count)
            ];
        }

        return response()->json([
            'stats' => [
                'total_customers' => $totalCustomers,
                'total_leads' => $totalLeads,
                'deals_won' => $dealsWon,
                'deals_lost' => $dealsLost,
                'deals_open' => $dealsOpen,
                'total_revenue' => floatval($totalRevenue)
            ],
            'recent_activities' => $recentActivities,
            'monthly_revenue' => array_values($monthlyRevenue),
            'lead_status' => $leadStatusData
        ]);
    }
}
