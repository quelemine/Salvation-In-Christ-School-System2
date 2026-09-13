<?php

namespace App\Console\Commands;

use App\Models\ClassModel;
use Illuminate\Console\Command;

class CheckDuplicateClasses extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:check-duplicate-classes';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check and remove duplicate classes from the database';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Checking for duplicate classes...');
        
        // Get all classes grouped by name and division
        $classes = ClassModel::with('division')->get();
        $duplicates = [];
        
        foreach ($classes as $class) {
            $key = $class->name . '|' . ($class->division_id ?? 'null');
            if (!isset($duplicates[$key])) {
                $duplicates[$key] = [];
            }
            $duplicates[$key][] = $class;
        }
        
        // Find duplicates (more than 1 class with same name and division)
        $duplicateCount = 0;
        foreach ($duplicates as $key => $classList) {
            if (count($classList) > 1) {
                $duplicateCount++;
                $this->warn("Found duplicate: " . $classList[0]->name . " (Division: " . ($classList[0]->division->name ?? 'None') . ")");
                $this->info("  IDs: " . implode(', ', array_map(fn($c) => $c->id, $classList)));
                
                // Keep the first one, delete the rest
                $toKeep = array_shift($classList);
                foreach ($classList as $toDelete) {
                    $this->info("  Deleting ID: {$toDelete->id}");
                    $toDelete->delete();
                }
            }
        }
        
        if ($duplicateCount === 0) {
            $this->info('No duplicate classes found.');
        } else {
            $this->info("Removed duplicates for {$duplicateCount} class name(s).");
        }
        
        return Command::SUCCESS;
    }
}
