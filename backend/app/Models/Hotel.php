<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Hotel extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'tagline',
        'star_rating',
        'address',
        'city',
        'phone',
        'email',
        'check_in_time',
        'check_out_time',
        'description',
        'image',
        'policies',
    ];

    protected function casts(): array
    {
        return [
            'star_rating' => 'integer',
            'policies' => 'array',
        ];
    }

    public function roomTypes(): HasMany
    {
        return $this->hasMany(RoomType::class);
    }
}

