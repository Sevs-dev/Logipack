<?php

use App\Http\Controllers\AuthController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Ingredient;
use App\Http\Controllers\PermissionController;

Route::controller(AuthController::class)->group(function () {
    Route::post('login', 'login');
    Route::post('register', 'register');
    Route::post('logout', 'logout');
    Route::post('refresh', 'refresh');
    Route::get('/user/{email}', 'getUserByEmail');
    Route::post('/upload-image/{email}', 'uploadImage');
    Route::post('/users', 'create');
    Route::get('/role', 'role');
    Route::get('/usersAll', 'getUsers');
    Route::delete('/delete/{id}', 'getUserDelete');
    Route::put('/update/{id}', 'getUserUpdate');
    Route::get('/date/{id}', 'getuserById');
});

//Rutas Ingredients
Route::controller(Ingredient::class)->group(function () {
    Route::get('ingredients/list', 'index');
    Route::get('ingredients/{id}', 'show');
    Route::post('ingredients/create', 'store');
    Route::put('ingredients/{id}/update', 'update');
    Route::put('ingredients/{id}/deactivate', 'deactivate'); // Ruta para desactivar
});

Route::controller(PermissionController::class)->group(function () {
    Route::get('/permissions', 'getPermisos');
    Route::post('/permissions/{id}', 'update');
});