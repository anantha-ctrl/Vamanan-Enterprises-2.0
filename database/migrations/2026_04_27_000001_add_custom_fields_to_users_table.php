<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->default('customer'); // admin, manager, customer
            $table->string('referral_code')->unique()->nullable();
            $table->foreignId('referrer_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('kyc_status')->default('pending'); // pending, verified, rejected
            $table->text('kyc_document')->nullable();
            $table->string('phone')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['role', 'referral_code', 'referrer_id', 'kyc_status', 'kyc_document', 'phone']);
        });
    }
};
