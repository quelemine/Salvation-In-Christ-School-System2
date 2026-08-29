<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SalaryStructure extends Model
{
    protected $fillable = ['name', 'employment_type', 'role_title', 'monthly_salary', 'currency', 'is_active', 'notes'];
    protected $casts = ['monthly_salary' => 'decimal:2', 'is_active' => 'boolean'];
}
