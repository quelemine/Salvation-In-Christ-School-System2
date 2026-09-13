<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class CheckDuplicateUserCodes extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:check-duplicate-user-codes';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check and fix duplicate user codes in the database';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Checking for duplicate user codes...');
        
        // Get all users grouped by user_code
        $users = User::all();
        $duplicates = [];
        
        foreach ($users as $user) {
            $userCode = $user->user_code;
            if (!$userCode) continue;
            
            if (!isset($duplicates[$userCode])) {
                $duplicates[$userCode] = [];
            }
            $duplicates[$userCode][] = $user;
        }
        
        // Find duplicates (more than 1 user with same user_code)
        $duplicateCount = 0;
        foreach ($duplicates as $userCode => $userList) {
            if (count($userList) > 1) {
                $duplicateCount++;
                $this->warn("Found duplicate user code: {$userCode}");
                $this->info("  User IDs: " . implode(', ', array_map(fn($u) => $u->id, $userList)));
                $this->info("  Names: " . implode(', ', array_map(fn($u) => $u->first_name . ' ' . $u->last_name, $userList)));
                $this->info("  Roles: " . implode(', ', array_map(fn($u) => $u->role?->slug ?? 'none', $userList)));
                
                // Keep the first one, clear user_code for the rest
                $toKeep = array_shift($userList);
                foreach ($userList as $toUpdate) {
                    $this->info("  Clearing user_code for user ID: {$toUpdate->id} ({$toUpdate->first_name} {$toUpdate->last_name})");
                    $toUpdate->user_code = null;
                    $toUpdate->save();
                }
            }
        }
        
        if ($duplicateCount === 0) {
            $this->info('No duplicate user codes found.');
        } else {
            $this->info("Fixed duplicates for {$duplicateCount} user code(s).");
        }
        
        return Command::SUCCESS;
    }
}
