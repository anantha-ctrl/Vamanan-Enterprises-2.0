<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Admin
        User::create([
            'name' => 'Admin User',
            'email' => 'admin@makkalgold.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'kyc_status' => 'verified'
        ]);

        // Manager
        User::create([
            'name' => 'Manager User',
            'email' => 'manager@makkalgold.com',
            'password' => Hash::make('password'),
            'role' => 'manager',
            'kyc_status' => 'verified'
        ]);

        // Categories
        $coin = Category::create(['name' => 'Gold Coins', 'slug' => 'gold-coins']);
        $chain = Category::create(['name' => 'Gold Chains', 'slug' => 'gold-chains']);

        // Products
        Product::create([
            'category_id' => $coin->id,
            'name' => '24K Gold Coin (10g)',
            'slug' => '24k-gold-coin-10g',
            'weight' => 10.000,
            'purity' => '24K',
            'price' => 60000.00,
            'description' => '99.9% pure gold coin.'
        ]);

        Product::create([
            'category_id' => $coin->id,
            'name' => '24K Gold Coin (5g)',
            'slug' => '24k-gold-coin-5g',
            'weight' => 5.000,
            'purity' => '24K',
            'price' => 30000.00,
            'description' => '99.9% pure gold coin.'
        ]);
    }
}
