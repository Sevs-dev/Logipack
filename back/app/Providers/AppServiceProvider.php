<?php

namespace App\Providers;

use Carbon\Carbon;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Blade;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // ✅ deja solo esto
        Carbon::setLocale(config('app.locale', 'es'));

        // (opcional) directiva para fechas
        Blade::directive('dt', function ($expression) {
            return "<?php echo dt($expression); ?>";
        });
    }
}
