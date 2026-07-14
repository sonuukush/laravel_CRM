<?php

namespace Database\Seeders;

use App\Models\Activity;
use App\Models\Customer;
use App\Models\User;
use Illuminate\Database\Seeder;

class ActivitySeeder extends Seeder
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
            Activity::firstOrCreate(
                [
                    'customer_id' => $vikas->id,
                    'description' => 'Follow-up call for renewal',
                ],
                [
                    'user_id' => $amit->id,
                    'type' => 'call',
                    'due_date' => '2026-07-20',
                    'status' => 'pending',
                ]
            );
        }

        if ($sunita && $neha) {
            Activity::firstOrCreate(
                [
                    'customer_id' => $sunita->id,
                    'description' => 'Product demo scheduled',
                ],
                [
                    'user_id' => $neha->id,
                    'type' => 'meeting',
                    'due_date' => '2026-07-16',
                    'status' => 'pending',
                ]
            );
        }

        if ($rajesh && $amit) {
            Activity::firstOrCreate(
                [
                    'customer_id' => $rajesh->id,
                    'description' => 'Interested in bulk order',
                ],
                [
                    'user_id' => $amit->id,
                    'type' => 'note',
                    'due_date' => null,
                    'status' => 'done',
                ]
            );
        }
    }
}
