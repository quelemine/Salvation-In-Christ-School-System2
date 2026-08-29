<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Device;
use App\Models\SyncLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SyncController extends Controller
{
    public function push(Request $request)
    {
        $request->validate([
            'device_uuid' => 'required|uuid',
            'changes' => 'required|array',
            'changes.*.entity_type' => 'required|string',
            'changes.*.entity_uuid' => 'required|uuid',
            'changes.*.action' => 'required|in:create,update,delete',
            'changes.*.data' => 'required|array',
        ]);

        $deviceUuid = $request->device_uuid;
        $userId = $request->user()->id;

        // Register or update device
        $device = Device::updateOrCreate(
            ['device_uuid' => $deviceUuid],
            [
                'user_id' => $userId,
                'device_name' => $request->device_name ?? 'Unknown Device',
                'platform' => $request->platform ?? 'Unknown',
                'platform_version' => $request->platform_version ?? null,
                'app_version' => $request->app_version ?? null,
                'last_sync_at' => now(),
                'is_active' => true,
            ]
        );

        $results = [];
        $conflicts = [];

        foreach ($request->changes as $change) {
            $entityType = $change['entity_type'];
            $entityUuid = $change['entity_uuid'];
            $action = $change['action'];
            $data = $change['data'];

            // Create sync log entry
            $syncLog = SyncLog::create([
                'user_id' => $userId,
                'device_uuid' => $deviceUuid,
                'entity_type' => $entityType,
                'entity_uuid' => $entityUuid,
                'action' => $action,
                'status' => 'processing',
                'data' => $data,
            ]);

            try {
                $result = $this->processChange($entityType, $entityUuid, $action, $data, $userId);
                
                $syncLog->update(['status' => 'completed']);
                $results[] = [
                    'entity_type' => $entityType,
                    'entity_uuid' => $entityUuid,
                    'action' => $action,
                    'status' => 'success',
                    'data' => $result,
                ];
            } catch (\Exception $e) {
                $syncLog->update([
                    'status' => 'failed',
                    'error_message' => $e->getMessage(),
                ]);

                $results[] = [
                    'entity_type' => $entityType,
                    'entity_uuid' => $entityUuid,
                    'action' => $action,
                    'status' => 'failed',
                    'error' => $e->getMessage(),
                ];
            }
        }

        return response()->json([
            'device_id' => $device->id,
            'processed' => count($results),
            'results' => $results,
            'conflicts' => $conflicts,
        ]);
    }

    public function pull(Request $request)
    {
        $request->validate([
            'device_uuid' => 'required|uuid',
            'last_sync_at' => 'nullable|date',
        ]);

        $deviceUuid = $request->device_uuid;
        $lastSyncAt = $request->last_sync_at ?? '1970-01-01';

        $syncableTables = [
            'users',
            'students',
            'teachers',
            'classes',
            'subjects',
            'attendances',
            'grades',
            'assignments',
            'student_comments',
            'fees',
            'payments',
            'receipts',
        ];

        $changes = [];

        foreach ($syncableTables as $table) {
            $modelClass = $this->getModelClass($table);
            if (!$modelClass) continue;

            $query = $modelClass::where('updated_at', '>', $lastSyncAt);

            // Filter by user's accessible data
            if ($table === 'users' && !$request->user()->hasRole('admin')) {
                $query->where('id', $request->user()->id);
            }

            $records = $query->get();

            foreach ($records as $record) {
                $changes[] = [
                    'entity_type' => $table,
                    'entity_uuid' => $record->uuid,
                    'action' => $record->deleted_at ? 'delete' : 'update',
                    'data' => $record->toArray(),
                    'version' => $record->version,
                    'updated_at' => $record->updated_at,
                ];
            }
        }

        // Update device last sync
        Device::where('device_uuid', $deviceUuid)->update(['last_sync_at' => now()]);

        return response()->json([
            'last_sync_at' => now(),
            'changes' => $changes,
            'total' => count($changes),
        ]);
    }

    public function status(Request $request)
    {
        $request->validate([
            'device_uuid' => 'required|uuid',
        ]);

        $deviceUuid = $request->device_uuid;
        $userId = $request->user()->id;

        $pendingLogs = SyncLog::where('device_uuid', $deviceUuid)
            ->where('status', 'pending')
            ->count();

        $failedLogs = SyncLog::where('device_uuid', $deviceUuid)
            ->where('status', 'failed')
            ->count();

        $conflictLogs = SyncLog::where('device_uuid', $deviceUuid)
            ->where('status', 'conflict')
            ->count();

        $device = Device::where('device_uuid', $deviceUuid)->first();

        return response()->json([
            'device_uuid' => $deviceUuid,
            'last_sync_at' => $device ? $device->last_sync_at : null,
            'pending_records' => $pendingLogs,
            'failed_records' => $failedLogs,
            'conflicts' => $conflictLogs,
            'device_active' => $device ? $device->is_active : false,
        ]);
    }

    private function processChange($entityType, $entityUuid, $action, $data, $userId)
    {
        $modelClass = $this->getModelClass($entityType);
        
        if (!$modelClass) {
            throw new \Exception("Unknown entity type: {$entityType}");
        }

        $record = $modelClass::where('uuid', $entityUuid)->first();

        switch ($action) {
            case 'create':
                if ($record) {
                    // Conflict: record already exists
                    throw new \Exception("Record with UUID {$entityUuid} already exists");
                }
                
                $data['uuid'] = $entityUuid;
                $data['sync_status'] = 'synced';
                $data['last_synced_at'] = now();
                $record = $modelClass::create($data);
                break;

            case 'update':
                if (!$record) {
                    throw new \Exception("Record with UUID {$entityUuid} not found");
                }

                // Version check for conflict detection
                if (isset($data['version']) && $record->version > $data['version']) {
                    throw new \Exception("Version conflict: server version {$record->version} is newer than client version {$data['version']}");
                }

                $data['version'] = $record->version + 1;
                $data['sync_status'] = 'synced';
                $data['last_synced_at'] = now();
                $record->update($data);
                break;

            case 'delete':
                if (!$record) {
                    throw new \Exception("Record with UUID {$entityUuid} not found");
                }
                $record->delete();
                break;

            default:
                throw new \Exception("Unknown action: {$action}");
        }

        return $record ? $record->fresh()->toArray() : ['deleted' => true];
    }

    private function getModelClass($table)
    {
        $modelMap = [
            'users' => \App\Models\User::class,
            'students' => \App\Models\Student::class,
            'teachers' => \App\Models\Teacher::class,
            'classes' => \App\Models\ClassModel::class,
            'subjects' => \App\Models\Subject::class,
            'attendances' => \App\Models\Attendance::class,
            'grades' => \App\Models\Grade::class,
            'assignments' => \App\Models\Assignment::class,
            'student_comments' => \App\Models\StudentComment::class,
            'fees' => \App\Models\Fee::class,
            'payments' => \App\Models\Payment::class,
            'receipts' => \App\Models\Receipt::class,
        ];

        return $modelMap[$table] ?? null;
    }
}
