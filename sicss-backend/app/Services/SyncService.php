<?php

namespace App\Services;

use App\Models\Device;
use App\Models\SyncLog;
use Illuminate\Support\Facades\DB;

class SyncService
{
    /**
     * Conflict resolution strategies
     */
    const STRATEGY_LAST_WRITE_WINS = 'last_write_wins';
    const STRATEGY_SERVER_WINS = 'server_wins';
    const STRATEGY_MERGE = 'merge';
    const STRATEGY_MANUAL = 'manual';

    /**
     * Get conflict resolution strategy for entity type
     */
    public function getConflictStrategy(string $entityType): string
    {
        $strategies = [
            // Reference data - last write wins
            'divisions' => self::STRATEGY_LAST_WRITE_WINS,
            'roles' => self::STRATEGY_LAST_WRITE_WINS,
            'permissions' => self::STRATEGY_LAST_WRITE_WINS,

            // Academic data - merge where possible
            'attendance' => self::STRATEGY_MERGE,
            'grades' => self::STRATEGY_MERGE,
            'assignments' => self::STRATEGY_MERGE,
            'student_comments' => self::STRATEGY_MERGE,

            // Finance data - server wins (critical)
            'payments' => self::STRATEGY_SERVER_WINS,
            'receipts' => self::STRATEGY_SERVER_WINS,
            'fees' => self::STRATEGY_SERVER_WINS,

            // User data - manual resolution
            'users' => self::STRATEGY_MANUAL,
            'students' => self::STRATEGY_MANUAL,
            'teachers' => self::STRATEGY_MANUAL,
            'classes' => self::STRATEGY_MANUAL,
            'subjects' => self::STRATEGY_MANUAL,
        ];

        return $strategies[$entityType] ?? self::STRATEGY_MANUAL;
    }

    /**
     * Resolve conflict based on strategy
     */
    public function resolveConflict(
        string $entityType,
        string $entityUuid,
        array $clientData,
        array $serverData
    ): array {
        $strategy = $this->getConflictStrategy($entityType);

        switch ($strategy) {
            case self::STRATEGY_LAST_WRITE_WINS:
                return $this->resolveLastWriteWins($clientData, $serverData);

            case self::STRATEGY_SERVER_WINS:
                return $this->resolveServerWins($serverData);

            case self::STRATEGY_MERGE:
                return $this->resolveMerge($entityType, $clientData, $serverData);

            case self::STRATEGY_MANUAL:
            default:
                return $this->resolveManual($clientData, $serverData);
        }
    }

    /**
     * Last write wins strategy
     */
    protected function resolveLastWriteWins(array $clientData, array $serverData): array
    {
        $clientUpdatedAt = $clientData['updated_at'] ?? null;
        $serverUpdatedAt = $serverData['updated_at'] ?? null;

        if ($clientUpdatedAt && $serverUpdatedAt) {
            return strtotime($clientUpdatedAt) > strtotime($serverUpdatedAt) 
                ? $clientData 
                : $serverData;
        }

        return $serverData;
    }

    /**
     * Server wins strategy
     */
    protected function resolveServerWins(array $serverData): array
    {
        return $serverData;
    }

    /**
     * Merge strategy for academic data
     */
    protected function resolveMerge(string $entityType, array $clientData, array $serverData): array
    {
        // For attendance, grades, assignments - merge based on unique keys
        if ($entityType === 'attendance') {
            // Attendance is unique by student_id + date + class_id
            // If same record, use server version
            return $serverData;
        }

        if ($entityType === 'grades') {
            // Grades are unique by student_id + subject_id + term + academic_year
            // If same record, use server version
            return $serverData;
        }

        // Default to server data for merge
        return $serverData;
    }

    /**
     * Manual resolution - requires admin intervention
     */
    protected function resolveManual(array $clientData, array $serverData): array
    {
        // Return both versions for manual review
        return [
            'conflict' => true,
            'client_version' => $clientData,
            'server_version' => $serverData,
            'requires_manual_resolution' => true,
        ];
    }

    /**
     * Register device for sync
     */
    public function registerDevice(array $deviceData): Device
    {
        return Device::updateOrCreate(
            ['device_uuid' => $deviceData['device_uuid']],
            [
                'user_id' => $deviceData['user_id'],
                'device_name' => $deviceData['device_name'] ?? 'Unknown Device',
                'platform' => $deviceData['platform'] ?? 'Unknown',
                'platform_version' => $deviceData['platform_version'] ?? null,
                'app_version' => $deviceData['app_version'] ?? null,
                'last_sync_at' => now(),
                'is_active' => true,
            ]
        );
    }

    /**
     * Get pending sync logs for device
     */
    public function getPendingLogs(string $deviceUuid): array
    {
        return SyncLog::where('device_uuid', $deviceUuid)
            ->where('status', 'pending')
            ->get()
            ->toArray();
    }

    /**
     * Mark sync log as completed
     */
    public function markLogCompleted(int $logId): void
    {
        SyncLog::where('id', $logId)->update([
            'status' => 'completed',
            'updated_at' => now(),
        ]);
    }

    /**
     * Mark sync log as failed
     */
    public function markLogFailed(int $logId, string $errorMessage): void
    {
        SyncLog::where('id', $logId)->update([
            'status' => 'failed',
            'error_message' => $errorMessage,
            'updated_at' => now(),
        ]);
    }

    /**
     * Mark sync log as conflict
     */
    public function markLogConflict(int $logId, string $conflictDetails): void
    {
        SyncLog::where('id', $logId)->update([
            'status' => 'conflict',
            'error_message' => $conflictDetails,
            'updated_at' => now(),
        ]);
    }
}
