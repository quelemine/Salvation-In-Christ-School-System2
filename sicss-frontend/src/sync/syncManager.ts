import { getDB } from '../database/indexedDB';
import { syncService } from '../services/syncService';
import type { SyncChange } from '../types';

class SyncManager {
  private deviceUuid: string | null = null;
  private isSyncing = false;
  private syncInterval: number | null = null;

  constructor() {
    this.initDevice();
  }

  private async initDevice(): Promise<void> {
    let deviceUuid = localStorage.getItem('device_uuid');
    if (!deviceUuid) {
      deviceUuid = crypto.randomUUID();
      localStorage.setItem('device_uuid', deviceUuid);
    }
    this.deviceUuid = deviceUuid;
  }

  getDeviceUuid(): string {
    if (!this.deviceUuid) {
      this.initDevice();
    }
    return this.deviceUuid || '';
  }

  async addToSyncQueue(
    entityType: string,
    entityUuid: string,
    action: 'create' | 'update' | 'delete',
    data: any
  ): Promise<void> {
    const db = await getDB();
    // ID is auto-incremented by IndexedDB
    await db.add('sync_queue' as any, {
      entity_type: entityType,
      entity_uuid: entityUuid,
      action,
      data,
      status: 'pending' as const,
      created_at: new Date().toISOString(),
    });
  }

  async getPendingSyncItems(): Promise<any[]> {
    const db = await getDB();
    return await db.getAllFromIndex('sync_queue', 'by-status', 'pending');
  }

  async sync(): Promise<void> {
    if (this.isSyncing) return;
    this.isSyncing = true;

    try {
      const pendingItems = await this.getPendingSyncItems();
      
      if (pendingItems.length > 0) {
        const changes: SyncChange[] = pendingItems.map((item) => ({
          entity_type: item.entity_type,
          entity_uuid: item.entity_uuid,
          action: item.action,
          data: item.data,
        }));

        const response = await syncService.push({
          device_uuid: this.getDeviceUuid(),
          changes,
        });

        // Update sync queue status
        const db = await getDB();
        for (const item of pendingItems) {
          const result = response.results.find(
            (r) => r.entity_uuid === item.entity_uuid && r.entity_type === item.entity_type
          );
          
          if (result?.status === 'success') {
            await db.delete('sync_queue', item.id);
          } else {
            await db.put('sync_queue', {
              ...item,
              status: 'failed',
              error_message: result?.error || 'Unknown error',
            });
          }
        }
      }

      // Pull changes from server
      await this.pullChanges();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  async pullChanges(): Promise<void> {
    const lastSyncAt = localStorage.getItem('last_sync_at') || '1970-01-01';
    
    try {
      const response = await syncService.pull({
        device_uuid: this.getDeviceUuid(),
        last_sync_at: lastSyncAt,
      });

      const db = await getDB();
      
      for (const change of response.changes) {
        const storeName = this.getStoreName(change.entity_type);
        if (!storeName) continue;

        // Use type assertion to work around IndexedDB type limitations
        const tx = db.transaction(storeName as any, 'readwrite');
        const store = tx.objectStore(storeName as any);

        if (change.action === 'delete') {
          try {
            // Find by UUID and delete
            const allRecords = await store.getAll();
            const existing = allRecords.find((r: any) => r.uuid === change.entity_uuid);
            if (existing) {
              await store.delete(existing.id);
            }
          } catch (e) {
            // Record might not exist, that's okay
            console.warn('Failed to delete record:', e);
          }
        } else {
          try {
            if (storeName === 'users') {
              // Users are managed server-side only — skip pull to avoid
              // unique-index constraint errors on email / user_code
              continue;
            }
            // For all other stores: try put; on constraint error skip the record
            await store.put(change.data);
          } catch (putError) {
            console.warn(`Skipping pull record for ${change.entity_type} (constraint):`, putError);
          }
        }
      }

      localStorage.setItem('last_sync_at', response.last_sync_at);
    } catch (error) {
      console.error('Pull failed:', error);
    }
  }

  private getStoreName(entityType: string): string | null {
    const storeMap: Record<string, string> = {
      users: 'users',
      students: 'students',
      teachers: 'teachers',
      classes: 'classes',
      subjects: 'subjects',
      attendance: 'attendance',
      grades: 'grades',
      assignments: 'assignments',
      student_comments: 'student_comments',
      fees: 'fees',
      payments: 'payments',
      receipts: 'receipts',
    };
    return storeMap[entityType] || null;
  }

  startAutoSync(intervalMs: number = 60000): void {
    this.stopAutoSync();
    this.syncInterval = setInterval(() => {
      this.sync();
    }, intervalMs);
  }

  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  async getSyncStatus() {
    try {
      return await syncService.status(this.getDeviceUuid());
    } catch (error) {
      console.error('Failed to get sync status:', error);
      return null;
    }
  }
}

export const syncManager = new SyncManager();
