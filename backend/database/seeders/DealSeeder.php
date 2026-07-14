<?php

namespace Database\Seeders;

use App\Models\Deal;
use App\Models\Customer;
use App\Models\User;
use Illuminate\Database\Seeder;

class DealSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $vikas = Customer::where('email', 'vikas@traders.com')->first();
        $sunita = Customer::where('email', 'sunita@enterprises.com')->first();
        $rajesh = Customer::where('email', 'rajesh@motors.com')->first();

        $amit = User::where('email', 'sales1@minicrm.com')->first();
        $neha = User::where('email', 'sales2@minicrm.com')->first();

        if ($vikas && $amit) {
            Deal::firstOrCreate(
                [
                    'customer_id' => $vikas->id,
                    'title' => 'Annual AMC Deal',
                ],
                [
                    'amount' => 150000.00,
                    'stage' => 'Won',
                    'assigned_to' => $amit->id,
                    'closing_date' => '2026-06-30',
                ]
            );
        }

        if ($sunita && $neha) {
            Deal::firstOrCreate(
                [
                    'customer_id' => $sunita->id,
                    'title' => 'New Software License',
                ],
                [
                    'amount' => 80000.00,
                    'stage' => 'Negotiation',
                    'assigned_to' => $neha->id,
                    'closing_date' => '2026-08-05',
                ]
            );
        }

        if ($rajesh && $amit) {
            Deal::firstOrCreate(
                [
                    'customer_id' => $rajesh->id,
                    'title' => 'Bulk Purchase Deal',
                ],
                [
                    'amount' => 250000.00,
                    'stage' => 'Prospecting',
                    'assigned_to' => $amit->id,
                    'closing_date' => '2026-09-01',
                ]
            );
        }
    }
}
