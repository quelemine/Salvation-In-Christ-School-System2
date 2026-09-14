import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { notificationService, type Notification } from '../services/notificationService';
import { Button, Card, CardContent, LoadingState } from '../components/ui';
import { FormModal } from '../components/FormModal';

export default function Notifications() {
  const { user } = useAuthStore();
  const isAdmin = user?.role?.slug === 'admin';
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [editingNotification, setEditingNotification] = useState<Notification | null>(null);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, [filterStatus, showUnreadOnly]);

  const loadNotifications = async () => {
    setLoading(true);
    setError('');
    try {
      const params: any = {};
      if (filterStatus !== 'all') {
        params.status = filterStatus;
      }
      if (showUnreadOnly) {
        params.unread = true;
      }
      const data = await notificationService.getAll(params);
      setNotifications(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (notificationData: Omit<Notification, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      await notificationService.create(notificationData);
      await loadNotifications();
      setIsOpen(false);
      setEditingNotification(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send notification.');
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationService.markAsRead(id);
      await loadNotifications();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to mark as read.');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead(user?.id);
      await loadNotifications();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to mark all as read.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this notification?')) return;
    try {
      await notificationService.delete(id);
      await loadNotifications();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete notification.');
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Notifications</h1>
        <p className="mt-2 text-slate-600">Manage SMS and email notifications</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <label className="mb-1 block text-sm font-medium text-slate-700">Filter by Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={showUnreadOnly}
                onChange={(e) => setShowUnreadOnly(e.target.checked)}
                className="rounded border-slate-300"
              />
              Show Unread Only
            </label>
          </div>
          {unreadCount > 0 && (
            <Button
              onClick={handleMarkAllAsRead}
              className="bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-semibold"
            >
              Mark All as Read ({unreadCount})
            </Button>
          )}
          {isAdmin && (
            <div className="flex items-end gap-2">
              <Button
                onClick={() => {
                  setEditingNotification(null);
                  setIsOpen(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold shadow-md"
              >
                + Send Notification
              </Button>
              <Button
                onClick={() => setIsBulkOpen(true)}
                className="bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-semibold shadow-md"
              >
                Send Bulk
              </Button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center shadow-sm">
          <p className="text-sm text-rose-800 mb-4">{error}</p>
          <Button onClick={loadNotifications} className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold">
            Try Again
          </Button>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 shadow-sm">
          <LoadingState message="Loading notifications..." />
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.length === 0 ? (
            <Card className="shadow-sm">
              <CardContent className="p-12 text-center">
                <p className="text-slate-500">No notifications found for the selected criteria.</p>
              </CardContent>
            </Card>
          ) : (
            notifications.map((notification) => (
              <Card key={notification.id} className={`shadow-sm ${!notification.is_read ? 'border-l-4 border-l-blue-500' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-slate-900">{notification.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          notification.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          notification.status === 'sent' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {notification.status}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          notification.channel === 'email' ? 'bg-blue-100 text-blue-800' :
                          notification.channel === 'sms' ? 'bg-purple-100 text-purple-800' :
                          'bg-indigo-100 text-indigo-800'
                        }`}>
                          {notification.channel}
                        </span>
                        {!notification.is_read && (
                          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                            New
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 mb-2">{notification.message}</p>
                      <div className="text-xs text-slate-500">
                        {notification.type && <span className="mr-4">Type: {notification.type}</span>}
                        {notification.sent_at && <span className="mr-4">Sent: {new Date(notification.sent_at).toLocaleString()}</span>}
                        <span>Created: {new Date(notification.created_at || '').toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!notification.is_read && (
                        <Button
                          onClick={() => notification.id && handleMarkAsRead(notification.id)}
                          className="bg-green-100 hover:bg-green-200 active:bg-green-300 text-green-700 font-semibold border border-green-300 px-3 py-1"
                        >
                          Mark Read
                        </Button>
                      )}
                      {isAdmin && (
                        <Button
                          onClick={() => notification.id && handleDelete(notification.id)}
                          className="bg-red-100 hover:bg-red-200 active:bg-red-300 text-red-700 font-semibold border border-red-300 px-3 py-1"
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      <FormModal
        isOpen={isOpen}
        title="Send Notification"
        onClose={() => {
          setIsOpen(false);
          setEditingNotification(null);
        }}
        onSubmit={() => editingNotification && handleSend(editingNotification)}
        submitText="Send"
        isLoading={false}
      >
        <NotificationForm notification={editingNotification} onChange={setEditingNotification} />
      </FormModal>

      <FormModal
        isOpen={isBulkOpen}
        title="Send Bulk Notification"
        onClose={() => setIsBulkOpen(false)}
        onSubmit={() => {/* Bulk send handled separately */}}
        submitText="Send"
        isLoading={false}
      >
        <BulkNotificationForm />
      </FormModal>
    </div>
  );
}

function NotificationForm({ notification, onChange }: any) {
  const [formData, setFormData] = useState<Partial<Notification>>(
    notification || {
      user_id: 0,
      type: '',
      title: '',
      message: '',
      channel: 'email',
      data: null,
    }
  );

  useEffect(() => {
    onChange(formData);
  }, [formData]);

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">User ID</label>
        <input
          type="number"
          value={formData.user_id}
          onChange={(e) => setFormData({ ...formData, user_id: parseInt(e.target.value) })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Type</label>
        <input
          type="text"
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Title</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Message</label>
        <textarea
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={4}
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Channel</label>
        <select
          value={formData.channel}
          onChange={(e) => setFormData({ ...formData, channel: e.target.value as 'email' | 'sms' | 'both' })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="email">Email</option>
          <option value="sms">SMS</option>
          <option value="both">Both</option>
        </select>
      </div>
    </div>
  );
}

function BulkNotificationForm() {
  const [formData, setFormData] = useState({
    user_ids: '',
    type: '',
    title: '',
    message: '',
    channel: 'email' as 'email' | 'sms' | 'both',
  });

  const handleSend = async () => {
    const user_ids = formData.user_ids.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
    await notificationService.sendBulk({
      user_ids,
      type: formData.type,
      title: formData.title,
      message: formData.message,
      channel: formData.channel,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">User IDs (comma-separated)</label>
        <textarea
          value={formData.user_ids}
          onChange={(e) => setFormData({ ...formData, user_ids: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={2}
          placeholder="1, 2, 3, 4, 5"
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Type</label>
        <input
          type="text"
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Title</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Message</label>
        <textarea
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={4}
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Channel</label>
        <select
          value={formData.channel}
          onChange={(e) => setFormData({ ...formData, channel: e.target.value as 'email' | 'sms' | 'both' })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="email">Email</option>
          <option value="sms">SMS</option>
          <option value="both">Both</option>
        </select>
      </div>
      <Button
        onClick={handleSend}
        className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold"
      >
        Send Bulk Notification
      </Button>
    </div>
  );
}
