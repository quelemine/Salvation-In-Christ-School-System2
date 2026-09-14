<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Schedule duplicate ID check to run daily at midnight
Schedule::command('app:check-duplicate-ids-scheduled')
    ->daily()
    ->at('00:00')
    ->description('Check for duplicate IDs in the system');
