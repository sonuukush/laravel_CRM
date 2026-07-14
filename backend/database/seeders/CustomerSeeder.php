<?php

namespace Database\Seeders;

use App\Models\Customer;
use App\Models\User;
use Illuminate\Database\Seeder;

class CustomerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $amit = User::where('email', 'sales1@minicrm.com')->first();
        $neha = User::where('email', 'sales2@minicrm.com')->first();
        $rohit = User::where('email', 'admin@minicrm.com')->first();
        $priya = User::where('email', 'manager@minicrm.com')->first();

        // 1. Vikas Traders
        Customer::firstOrCreate(
            ['email' => 'vikas@traders.com'],
            [
                'name' => 'Vikas Traders',
                'phone' => '9911223344',
                'company' => 'Vikas Traders Pvt Ltd',
                'address' => '123 Business Park, Mumbai',
                'status' => 'customer',
                'pipeline_stage' => 'Converted',
                'assigned_to' => $amit ? $amit->id : null,
                'created_by' => $rohit ? $rohit->id : null,
            ]
        );

        // 2. Sunita Enterprises
        Customer::firstOrCreate(
            ['email' => 'sunita@enterprises.com'],
            [
                'name' => 'Sunita Enterprises',
                'phone' => '8811223344',
                'company' => 'Sunita Ent.',
                'address' => '456 Sector 15, Noida',
                'status' => 'lead',
                'pipeline_stage' => 'Contacted',
                'assigned_to' => $neha ? $neha->id : null,
                'created_by' => $priya ? $priya->id : null,
            ]
        );

        // 3. Rajesh Motors
        Customer::firstOrCreate(
            ['email' => 'rajesh@motors.com'],
            [
                'name' => 'Rajesh Motors',
                'phone' => '7711223344',
                'company' => 'Rajesh Motors',
                'address' => '789 Link Road, Delhi',
                'status' => 'lead',
                'pipeline_stage' => 'New',
                'assigned_to' => $amit ? $amit->id : null,
                'created_by' => $rohit ? $rohit->id : null,
            ]
        );

        // 4. Global Textiles
        Customer::firstOrCreate(
            ['email' => 'global@textiles.com'],
            [
                'name' => 'Global Textiles',
                'phone' => '6611223344',
                'company' => 'Global Textiles Ltd',
                'address' => '101 Industrial Area, Surat',
                'status' => 'inactive',
                'pipeline_stage' => 'Lost',
                'assigned_to' => $neha ? $neha->id : null,
                'created_by' => $priya ? $priya->id : null,
            ]
        );
    }
}
