import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@repo/auth-core';
import { WishlistNotificationService } from '../services';
import { NotificationListResponse } from '../types';
import { WishlistNotification, NotificationType } from '../entities';

export function useWishlistNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<WishlistNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Initialize service (in real app, this would be injected)
  const notificationService = new WishlistNotificationService(
    {} as any // Repository implementation
  );

  const getNotifications = useCallback(async (unreadOnly: boolean = false) => {
    if (!user) {
      setError(new Error('User not authenticated'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await notificationService.getNotifications(user.id, unreadOnly);
      setNotifications(response.notifications);
      setUnreadCount(response.unreadCount);
      return response;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const getNotificationsByType = useCallback(async (type: NotificationType) => {
    if (!user) {
      setError(new Error('User not authenticated'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const typeNotifications = await notificationService.getNotificationsByType(user.id, type);
      return typeNotifications;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const markAsRead = useCallback(async (notificationId: string) => {
    if (!user) {
      setError(new Error('User not authenticated'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await notificationService.markAsRead(notificationId, user.id);
      
      // Update local state
      setNotifications(prev => prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, isRead: true, readAt: new Date() }
          : notif
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const markAllAsRead = useCallback(async () => {
    if (!user) {
      setError(new Error('User not authenticated'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await notificationService.markAllAsRead(user.id);
      
      // Update local state
      setNotifications(prev => prev.map(notif => ({
        ...notif,
        isRead: true,
        readAt: new Date()
      })));
      setUnreadCount(0);
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    if (!user) {
      setError(new Error('User not authenticated'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await notificationService.deleteNotification(notificationId, user.id);
      
      // Update local state
      const notif = notifications.find(n => n.id === notificationId);
      if (notif && !notif.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, notifications]);

  const groupNotificationsByDate = useCallback(() => {
    const groups: Record<string, WishlistNotification[]> = {};
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    notifications.forEach(notif => {
      const date = new Date(notif.createdAt);
      let key: string;

      if (date.toDateString() === today.toDateString()) {
        key = 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        key = 'Yesterday';
      } else {
        key = date.toLocaleDateString();
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(notif);
    });

    return groups;
  }, [notifications]);

  const groupNotificationsByType = useCallback(() => {
    const groups: Record<NotificationType, WishlistNotification[]> = {} as any;

    notifications.forEach(notif => {
      if (!groups[notif.type]) {
        groups[notif.type] = [];
      }
      groups[notif.type].push(notif);
    });

    return groups;
  }, [notifications]);

  // Load notifications on mount
  useEffect(() => {
    if (user) {
      getNotifications();
    }
  }, [user]);

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      getNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, [user, getNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    getNotifications,
    getNotificationsByType,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    groupNotificationsByDate,
    groupNotificationsByType
  };
}