<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class TimerControl extends Model
{
    use HasFactory;
    protected $guarded = [];

    protected $casts = [
        'data' => 'array',
    ];

    public function timer()
    {
        return $this->belongsTo(Timer::class);
    } 

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id'); // asumiendo user_id
    }
}