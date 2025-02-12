<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::create([
            'name'     => 'Admin Logismart',
            'email'    => 'admin@logismart.com',
            'password' => bcrypt('Logismart123*'),
            'role'     => 'admin'
        ]);
    }
}