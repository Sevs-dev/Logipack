<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\AdminAuditable;

class Role extends Model
{
    use AdminAuditable;
    use HasFactory;

    protected $guarded = [];

    protected $casts = [
        'active' => 'boolean',
        'can_edit' => 'boolean',
        'can_view' => 'boolean',
    ];

    public function permissions()
    {
        return $this->belongsToMany(Permission::class, 'role_permissions');
    }

    public function givePermissionTo(Permission $permission)
    {
        return $this->permissions()->attach($permission);
    }
}