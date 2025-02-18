<?php

use App\Http\Controllers\AuthController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::controller(AuthController::class)->group(function () {
    Route::post('login', 'login');
    Route::post('register', 'register');
    Route::post('logout', 'logout');
    Route::post('refresh', 'refresh');
    Route::get('/user/{email}','getUserByEmail');
    Route::post('/upload-image/{email}','uploadImage');
    Route::post('/users', 'create');
    Route::get('/role', 'role');
    Route::get('/usersAll', 'getUsers');
    Route::delete('/delete/{id}', 'getUserDelete');
    Route::put('/update/{id}', 'getUserUpdate');
    Route::get('/date/{id}', 'getuserById');
});