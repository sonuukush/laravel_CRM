<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Document extends Model
{
    use HasFactory;

    protected $fillable = [
        'customer_id',
        'uploaded_by',
        'file_name',
        'file_path',
        'file_type'
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function uploadedBy()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
