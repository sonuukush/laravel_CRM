<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Rohit Sharma - Admin
        $admin = User::firstOrCreate(
            ['email' => 'admin@minicrm.com'],
            [
                'name' => 'Rohit Sharma',
                'password' => Hash::make('password123'),
                'phone' => '9876543210',
                'status' => 'active',
            ]
        );
        $admin->assignRole('Admin');

        // 2. Priya Verma - Manager
        $manager = User::firstOrCreate(
            ['email' => 'manager@minicrm.com'],
            [
                'name' => 'Priya Verma',
                'password' => Hash::make('password123'),
                'phone' => '8765432109',
                'status' => 'active',
            ]
        );
        $manager->assignRole('Manager');

        // 3. Amit Kumar - Sales Executive
        $sales1 = User::firstOrCreate(
            ['email' => 'sales1@minicrm.com'],
            [
                'name' => 'Amit Kumar',
                'password' => Hash::make('password123'),
                'phone' => '7654321098',
                'status' => 'active',
            ]
        );
        $sales1->assignRole('Sales Executive');

        // 4. Neha Singh - Sales Executive
        $sales2 = User::firstOrCreate(
            ['email' => 'sales2@minicrm.com'],
            [
                'name' => 'Neha Singh',
                'password' => Hash::make('password123'),
                'phone' => '6543210987',
                'status' => 'active',
            ]
        );
        $sales2->assignRole('Sales Executive');
    }
}
