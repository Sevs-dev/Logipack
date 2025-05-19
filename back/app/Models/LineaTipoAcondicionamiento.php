<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LineaTipoAcondicionamiento extends Model
{
    protected $table = 'linea_tipo_acondicionamientos';

    protected $fillable = [
        'tipo_acondicionamiento_id',
        'orden',
        'descripcion',
        'fase',
        'editable',
        'control',
        'fase_control'
    ];

    protected $casts = [
        'editable' => 'boolean',
        'control' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    /**
     * Get the tipo acondicionamiento that owns the linea.
     */
    public function tipoAcondicionamiento(): BelongsTo
    {
        return $this->belongsTo(TipoAcondicionamiento::class, 'tipo_acondicionamiento_id');
    }
} 