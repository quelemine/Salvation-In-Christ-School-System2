import api from './api';
import type {
  SyncPushRequest,
  SyncPushResponse,
  SyncPullRequest,
  SyncPullResponse,
  SyncStatusResponse,
} from '../types';

export const syncService = {
  push: async (data: SyncPushRequest) => {
    const response = await api.post<SyncPushResponse>('/sync/push', data);
    return response.data;
  },

  pull: async (data: SyncPullRequest) => {
    const response = await api.post<SyncPullResponse>('/sync/pull', data);
    return response.data;
  },

  status: async (deviceUuid: string) => {
    const response = await api.get<SyncStatusResponse>(`/sync/status?device_uuid=${deviceUuid}`);
    return response.data;
  },
};
