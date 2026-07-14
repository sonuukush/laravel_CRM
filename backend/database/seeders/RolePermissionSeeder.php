<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

class RolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // Create Permissions
        $permissions = [
            'customers.view',
            'customers.create',
            'customers.edit',
            'customers.delete',
            'leads.view',
            'leads.create',
            'leads.edit',
            'leads.delete',
            'deals.view',
            'deals.create',
            'deals.edit',
            'deals.delete',
            'activities.view',
            'activities.create',
            'activities.edit',
            'reports.view',
            'users.manage',
            'documents.upload',
            'documents.delete'
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // Create Roles and Assign Permissions
        
        // Admin gets all permissions
        $adminRole = Role::firstOrCreate(['name' => 'Admin']);
        $adminRole->syncPermissions(Permission::all());

        // Manager permissions
        $managerRole = Role::firstOrCreate(['name' => 'Manager']);
        $managerRole->syncPermissions([
            'customers.view',
            'customers.create',
            'customers.edit',
            'leads.view',
            'leads.create',
            'leads.edit',
            'deals.view',
            'deals.create',
            'deals.edit',
            'activities.view',
            'activities.create',
            'activities.edit',
            'reports.view',
            'documents.upload'
        ]);

        // Sales Executive permissions
        $salesRole = Role::firstOrCreate(['name' => 'Sales Executive']);
        $salesRole->syncPermissions([
            'customers.view',
            'customers.create',
            'customers.edit',
            'leads.view',
            'leads.create',
            'leads.edit',
            'deals.view',
            'deals.create',
            'deals.edit',
            'activities.view',
            'activities.create',
            'activities.edit',
            'documents.upload'
        ]);
    }
}
