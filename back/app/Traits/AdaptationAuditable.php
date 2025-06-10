<?php

namespace App\Traits;

use App\Models\AdaptationAudit;

trait AdaptationAuditable
{
    public static function bootAdaptationAuditable()
    {
        static::created(function ($model) {
            self::logChange('create', $model, null, $model->toArray());
        });

        static::updated(function ($model) {
            self::logChange('update', $model, $model->getOriginal(), $model->getChanges());
        });

        static::deleted(function ($model) {
            self::logChange('delete', $model, $model->toArray(), null);
        });
    }

    protected static function logChange($action, $model, $oldValues, $newValues)
    {
        AdaptationAudit::create([
            'user' => $model->user,
            'action' => $action,
            'auditable_type' => get_class($model),
            'auditable_id' => $model->id,
            'reference_id' => $model->reference_id ?? null,
            'version' => $model->version ?? null,     
            'old_values' => $oldValues,
            'new_values' => $newValues,
        ]);
    }
}