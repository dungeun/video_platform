import { useState, useEffect, useCallback, useRef } from 'react';
import { ContentModerationService } from '../services/ContentModerationService';
import { UserModerationService } from '../services/UserModerationService';
import type { 
  UseModerationOptions,
  ModerationActionData,
  ContentReport,
  UserReport,
  ServiceResponse,
  PaginatedResponse,
  ModerationFilters,
  ReportPriority
} from '../types';

export const useModeration = (options: UseModerationOptions = {}) => {
  const {
    queueType = 'all',
    priority,
    autoAssign = false
  } = options;

  // Service instances
  const contentModerationService = useRef(new ContentModerationService());
  const userModerationService = useRef(new UserModerationService());

  // State
  const [queue, setQueue] = useState<any[]>([]);
  const [contentReports, setContentReports] = useState<ContentReport[]>([]);
  const [userReports, setUserReports] = useState<UserReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Load moderation queue
  const loadQueue = useCallback(async (filters: ModerationFilters = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      // Apply priority filter if specified
      const queueFilters = {
        ...filters,
        ...(priority && { priority: [priority] })
      };

      const result = await contentModerationService.current.getModerationQueue(queueFilters);
      if (result.success && result.data) {
        setQueue(result.data);
      } else {
        throw new Error(result.error || 'Failed to load moderation queue');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load queue');
    } finally {
      setIsLoading(false);
    }
  }, [priority]);

  // Load content reports
  const loadContentReports = useCallback(async (filters = {}) => {
    try {
      // Content reports would be loaded from ContentModerationService
      // This is a placeholder implementation
      setContentReports([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load content reports');
    }
  }, []);

  // Load user reports
  const loadUserReports = useCallback(async (filters = {}) => {
    try {
      const result = await userModerationService.current.getUserReports(filters);
      if (result.success && result.data) {
        setUserReports(result.data);
      } else {
        throw new Error(result.error || 'Failed to load user reports');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user reports');
    }
  }, []);

  // Moderate content
  const moderateContent = useCallback(async (
    contentId: string,
    contentType: 'post' | 'comment' | 'media',
    action: ModerationActionData,
    moderatorId: string
  ): Promise<ServiceResponse> => {
    try {
      let result;
      switch (contentType) {
        case 'post':
          result = await contentModerationService.current.moderatePost(contentId, action, moderatorId);
          break;
        case 'comment':
          result = await contentModerationService.current.moderateComment(contentId, action, moderatorId);
          break;
        case 'media':
          result = await contentModerationService.current.moderateMedia(contentId, action, moderatorId);
          break;
      }

      if (result.success) {
        // Refresh queue after successful moderation
        await loadQueue();
      }

      return result;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to moderate content';
      setError(error);
      return { success: false, error };
    }
  }, [loadQueue]);

  // Moderate user
  const moderateUser = useCallback(async (
    userId: string,
    action: 'warn' | 'suspend' | 'ban',
    actionData: ModerationActionData,
    moderatorId: string,
    isPermanent = false
  ): Promise<ServiceResponse> => {
    try {
      let result;
      switch (action) {
        case 'warn':
          result = await userModerationService.current.warnUser(userId, actionData, moderatorId);
          break;
        case 'suspend':
          result = await userModerationService.current.suspendUser(userId, actionData, moderatorId);
          break;
        case 'ban':
          result = await userModerationService.current.banUser(userId, actionData, moderatorId, isPermanent);
          break;
      }

      if (result.success) {
        // Refresh data after successful moderation
        await Promise.all([loadQueue(), loadUserReports()]);
      }

      return result;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to moderate user';
      setError(error);
      return { success: false, error };
    }
  }, [loadQueue, loadUserReports]);

  // Bulk moderate content
  const bulkModerateContent = useCallback(async (
    contentIds: string[],
    contentType: 'post' | 'comment' | 'media',
    action: ModerationActionData,
    moderatorId: string
  ): Promise<ServiceResponse> => {
    try {
      const result = await contentModerationService.current.bulkModerateContent(
        contentIds,
        contentType,
        action,
        moderatorId
      );

      if (result.success) {
        // Refresh queue after bulk moderation
        await loadQueue();
      }

      return result;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to bulk moderate content';
      setError(error);
      return { success: false, error };
    }
  }, [loadQueue]);

  // Bulk moderate users
  const bulkModerateUsers = useCallback(async (
    userIds: string[],
    action: 'warn' | 'suspend' | 'ban',
    actionData: ModerationActionData,
    moderatorId: string
  ): Promise<ServiceResponse> => {
    try {
      const result = await userModerationService.current.bulkModerateUsers(
        userIds,
        action,
        actionData,
        moderatorId
      );

      if (result.success) {
        // Refresh data after bulk moderation
        await Promise.all([loadQueue(), loadUserReports()]);
      }

      return result;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to bulk moderate users';
      setError(error);
      return { success: false, error };
    }
  }, [loadQueue, loadUserReports]);

  // Assign moderation task
  const assignTask = useCallback(async (
    contentId: string,
    contentType: 'post' | 'comment' | 'report',
    moderatorId: string
  ): Promise<ServiceResponse> => {
    try {
      const result = await contentModerationService.current.assignModerationTask(
        contentId,
        contentType,
        moderatorId
      );

      if (result.success) {
        await loadQueue();
      }

      return result;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to assign task';
      setError(error);
      return { success: false, error };
    }
  }, [loadQueue]);

  // Escalate content
  const escalateContent = useCallback(async (
    contentId: string,
    contentType: 'post' | 'comment' | 'report',
    reason: string,
    escalatedBy: string
  ): Promise<ServiceResponse> => {
    try {
      const result = await contentModerationService.current.escalateContent(
        contentId,
        contentType,
        reason,
        escalatedBy
      );

      if (result.success) {
        await loadQueue();
      }

      return result;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to escalate content';
      setError(error);
      return { success: false, error };
    }
  }, [loadQueue]);

  // Resolve report
  const resolveReport = useCallback(async (
    reportId: string,
    reportType: 'content' | 'user',
    resolution: string,
    resolvedBy: string
  ): Promise<ServiceResponse> => {
    try {
      let result;
      if (reportType === 'content') {
        result = await contentModerationService.current.resolveContentReport(reportId, resolution, resolvedBy);
      } else {
        result = await userModerationService.current.resolveUserReport(reportId, resolution, resolvedBy);
      }

      if (result.success) {
        // Refresh relevant data
        if (reportType === 'content') {
          await loadContentReports();
        } else {
          await loadUserReports();
        }
        await loadQueue();
      }

      return result;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to resolve report';
      setError(error);
      return { success: false, error };
    }
  }, [loadQueue, loadContentReports, loadUserReports]);

  // Auto-moderate content
  const autoModerateContent = useCallback(async (content: string, metadata: any) => {
    try {
      const result = await contentModerationService.current.autoModerateContent(content, metadata);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to auto-moderate content';
      setError(error);
      return { success: false, error };
    }
  }, []);

  // Get moderation metrics
  const getModerationMetrics = useCallback(async (timeRange: { start: Date; end: Date }) => {
    try {
      const [contentMetrics, userMetrics] = await Promise.all([
        contentModerationService.current.getModerationMetrics(timeRange),
        userModerationService.current.getUserModerationMetrics(timeRange)
      ]);

      return {
        success: true,
        data: {
          content: contentMetrics.success ? contentMetrics.data : null,
          user: userMetrics.success ? userMetrics.data : null
        }
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to get moderation metrics';
      setError(error);
      return { success: false, error };
    }
  }, []);

  // Selection management
  const selectItem = useCallback((itemId: string) => {
    setSelectedItems(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  }, []);

  const selectAll = useCallback(() => {
    const allIds = queue.map(item => item.id);
    setSelectedItems(allIds);
  }, [queue]);

  const clearSelection = useCallback(() => {
    setSelectedItems([]);
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Refresh all data
  const refresh = useCallback(async () => {
    const filters: ModerationFilters = {};
    if (priority) {
      filters.priority = [priority];
    }

    await Promise.all([
      loadQueue(filters),
      loadContentReports(),
      loadUserReports()
    ]);
  }, [loadQueue, loadContentReports, loadUserReports, priority]);

  // Initialize data on mount
  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    // State
    queue,
    contentReports,
    userReports,
    isLoading,
    error,
    selectedItems,

    // Content moderation
    moderateContent,
    bulkModerateContent,
    autoModerateContent,

    // User moderation
    moderateUser,
    bulkModerateUsers,

    // Task management
    assignTask,
    escalateContent,
    resolveReport,

    // Data loading
    loadQueue,
    loadContentReports,
    loadUserReports,

    // Selection management
    selectItem,
    selectAll,
    clearSelection,

    // Metrics
    getModerationMetrics,

    // Utilities
    refresh,
    clearError
  };
};

export default useModeration;