import React, { useState, useEffect } from 'react';
import { Bell, CheckCheck, AlertTriangle, AlertOctagon, Clock, ShieldAlert, Check } from 'lucide-react';
import api from '../api/client';

const NotificationsView = ({ onNotificationRead }) => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/notifications');
      setNotifications(response.data);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      const response = await api.patch(`/notifications/${id}/read`, { is_read: true });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? response.data : n))
      );
      if (onNotificationRead) onNotificationRead();
    } catch (err) {
      console.error('Error marking notification read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.post('/notifications/mark-all-read');
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true }))
      );
      if (onNotificationRead) onNotificationRead();
    } catch (err) {
      console.error('Error marking all read:', err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const getNotificationIcon = (type, title) => {
    if (title.toLowerCase().includes('high')) {
      return <AlertOctagon className="w-5 h-5 text-risk-high" />;
    } else if (title.toLowerCase().includes('moderate')) {
      return <AlertTriangle className="w-5 h-5 text-risk-mod" />;
    } else if (type === 'remediation_milestone') {
      return <Clock className="w-5 h-5 text-brand-gold" />;
    }
    return <Bell className="w-5 h-5 text-brand-green" />;
  };

  return (
    <div className="space-y-4 pb-24 animate-fade-in max-w-2xl mx-auto">
      
      {/* Header */}
      <div className="flex items-center justify-between bg-tg-surface dark:bg-tg-surface-dark p-5 rounded-2xl border border-black/5 dark:border-white/5 shadow-soft">
        <div>
          <h2 className="text-lg font-serif font-bold text-tg-text dark:text-tg-text-dark flex items-center gap-2">
            <Bell className="w-5 h-5 text-brand-green" /> Notifications & Alerts
          </h2>
          <p className="text-xs text-tg-muted dark:text-tg-muted-dark">
            {unreadCount > 0
              ? `You have ${unreadCount} unread alert${unreadCount > 1 ? 's' : ''}`
              : 'All notifications have been reviewed'}
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllAsRead}
            className="px-3 py-1.5 rounded-xl bg-brand-green/10 hover:bg-brand-green/20 text-brand-green text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <CheckCheck className="w-4 h-4" /> Mark All Read
          </button>
        )}
      </div>

      {/* Notifications List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-tg-surface dark:bg-tg-surface-dark rounded-2xl p-5 shadow-soft border border-black/5 dark:border-white/5 animate-pulse h-24"
            />
          ))}
        </div>
      ) : notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map((notif) => {
            const formattedTime = new Date(notif.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={notif.id}
                onClick={() => !notif.is_read && handleMarkAsRead(notif.id)}
                className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex items-start gap-4 cursor-pointer ${
                  notif.is_read
                    ? 'bg-tg-surface/70 dark:bg-tg-surface-dark/70 border-black/5 dark:border-white/5 opacity-80'
                    : 'bg-tg-surface dark:bg-tg-surface-dark border-brand-green/30 shadow-soft ring-1 ring-brand-green/20'
                }`}
              >
                {/* Icon Circle */}
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    notif.is_read
                      ? 'bg-black/[0.03] dark:bg-white/[0.04]'
                      : 'bg-brand-green/10 dark:bg-brand-green/20'
                  }`}
                >
                  {getNotificationIcon(notif.notification_type, notif.title)}
                </div>

                {/* Body */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4
                      className={`text-sm font-semibold truncate ${
                        notif.is_read
                          ? 'text-tg-text dark:text-tg-text-dark'
                          : 'text-tg-text dark:text-tg-text-dark font-bold'
                      }`}
                    >
                      {notif.title}
                    </h4>
                    {!notif.is_read && (
                      <span className="w-2 h-2 rounded-full bg-brand-green flex-shrink-0" />
                    )}
                  </div>

                  <p className="text-xs text-tg-text/80 dark:text-tg-text-dark/80 line-clamp-2 leading-relaxed">
                    {notif.message}
                  </p>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-black/5 dark:border-white/5 text-[11px] text-tg-muted dark:text-tg-muted-dark">
                    <span>{formattedTime}</span>
                    <span className="capitalize text-[10px] font-medium bg-black/[0.04] dark:bg-white/[0.05] px-2 py-0.5 rounded-full">
                      {notif.notification_type.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-12 px-4 bg-tg-surface dark:bg-tg-surface-dark rounded-2xl border border-black/5 dark:border-white/5 shadow-soft">
          <div className="w-12 h-12 rounded-2xl bg-brand-green/10 text-brand-green flex items-center justify-center mx-auto mb-3">
            <Bell className="w-6 h-6" />
          </div>
          <h3 className="text-base font-serif font-bold text-tg-text dark:text-tg-text-dark mb-1">
            No Notifications
          </h3>
          <p className="text-xs text-tg-muted dark:text-tg-muted-dark max-w-sm mx-auto">
            You're all caught up! New alerts will trigger when moderate or high lead levels are recorded, or when remediation cycles cross key thresholds.
          </p>
        </div>
      )}
    </div>
  );
};

export default NotificationsView;
