<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ScheduleException extends Model
{
    use HasFactory;

    protected $fillable = [
        'exception_date',
        'start_time',
        'end_time',
        'is_closed',
        'description',
    ];

    protected function casts(): array
    {
        return [
            'exception_date' => 'date',
            'is_closed' => 'boolean',
        ];
    }
}

