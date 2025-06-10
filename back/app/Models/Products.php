<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\AdminAuditable;

class Products extends Model
{
    use AdminAuditable;
    use HasFactory;

    protected $guarded = [];
    
}