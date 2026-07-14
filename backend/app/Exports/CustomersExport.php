<?php

namespace App\Exports;

use App\Models\Customer;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class CustomersExport implements FromCollection, WithHeadings, WithMapping
{
    protected $userId;
    protected $role;

    public function __construct($userId, $role)
    {
        $this->userId = $userId;
        $this->role = $role;
    }

    /**
    * @return \Illuminate\Support\Collection
    */
    public function collection()
    {
        $query = Customer::with(['assignedTo', 'createdBy']);

        // Limit export for Sales Executives to their own data
        if ($this->role === 'Sales Executive') {
            $query->where('assigned_to', $this->userId);
        }

        return $query->get();
    }

    /**
     * Map each row of data.
     */
    public function map($customer): array
    {
        return [
            $customer->id,
            $customer->name,
            $customer->email,
            $customer->phone,
            $customer->company ?? 'N/A',
            $customer->address ?? 'N/A',
            ucfirst($customer->status),
            $customer->pipeline_stage,
            $customer->assignedTo ? $customer->assignedTo->name : 'Unassigned',
            $customer->createdBy ? $customer->createdBy->name : 'System',
            $customer->created_at->toDateTimeString(),
        ];
    }

    /**
     * Define column headings.
     */
    public function headings(): array
    {
        return [
            'ID',
            'Name',
            'Email',
            'Phone',
            'Company',
            'Address',
            'Status',
            'Pipeline Stage',
            'Assigned To',
            'Created By',
            'Created At',
        ];
    }
}
