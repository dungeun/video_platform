import { useState, useCallback, useEffect } from 'react';
import { useNotification } from '@revu/ui-kit';
import { ContentService } from '../services';
import type { Content, ContentFilter, MediaAsset, ContentRevision } from '../types';

const contentService = new ContentService();

export function useContent(contentId?: string) {
  const [content, setContent] = useState<Content | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { showNotification } = useNotification();

  const fetchContent = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await contentService.getContent(id);
      setContent(data);
    } catch (err) {
      setError(err as Error);
      showNotification({
        type: 'error',
        message: 'Failed to load content'
      });
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  const createContent = useCallback(async (data: Partial<Content>) => {
    setLoading(true);
    try {
      const created = await contentService.createContent(data);
      setContent(created);
      showNotification({
        type: 'success',
        message: 'Content created successfully'
      });
      return created;
    } catch (err) {
      showNotification({
        type: 'error',
        message: 'Failed to create content'
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  const updateContent = useCallback(async (
    id: string,
    updates: Partial<Content>
  ) => {
    setLoading(true);
    try {
      const updated = await contentService.updateContent(id, updates);
      setContent(updated);
      showNotification({
        type: 'success',
        message: 'Content updated successfully'
      });
      return updated;
    } catch (err) {
      showNotification({
        type: 'error',
        message: 'Failed to update content'
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  const deleteContent = useCallback(async (id: string) => {
    setLoading(true);
    try {
      await contentService.deleteContent(id);
      setContent(null);
      showNotification({
        type: 'success',
        message: 'Content deleted successfully'
      });
    } catch (err) {
      showNotification({
        type: 'error',
        message: 'Failed to delete content'
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  const submitForApproval = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const updated = await contentService.submitForApproval(id);
      setContent(updated);
      showNotification({
        type: 'success',
        message: 'Content submitted for approval'
      });
      return updated;
    } catch (err) {
      showNotification({
        type: 'error',
        message: 'Failed to submit content'
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  const approveContent = useCallback(async (
    id: string,
    feedback?: string
  ) => {
    setLoading(true);
    try {
      const updated = await contentService.approveContent(id, feedback);
      setContent(updated);
      showNotification({
        type: 'success',
        message: 'Content approved'
      });
      return updated;
    } catch (err) {
      showNotification({
        type: 'error',
        message: 'Failed to approve content'
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  const rejectContent = useCallback(async (
    id: string,
    reason: string
  ) => {
    setLoading(true);
    try {
      const updated = await contentService.rejectContent(id, reason);
      setContent(updated);
      showNotification({
        type: 'success',
        message: 'Content rejected'
      });
      return updated;
    } catch (err) {
      showNotification({
        type: 'error',
        message: 'Failed to reject content'
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  const requestRevision = useCallback(async (
    id: string,
    revision: Partial<ContentRevision>
  ) => {
    setLoading(true);
    try {
      const updated = await contentService.requestRevision(id, revision);
      setContent(updated);
      showNotification({
        type: 'success',
        message: 'Revision requested'
      });
      return updated;
    } catch (err) {
      showNotification({
        type: 'error',
        message: 'Failed to request revision'
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  const scheduleContent = useCallback(async (
    id: string,
    scheduledAt: Date
  ) => {
    setLoading(true);
    try {
      const updated = await contentService.scheduleContent(id, scheduledAt);
      setContent(updated);
      showNotification({
        type: 'success',
        message: 'Content scheduled successfully'
      });
      return updated;
    } catch (err) {
      showNotification({
        type: 'error',
        message: 'Failed to schedule content'
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  const publishContent = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const updated = await contentService.publishContent(id);
      setContent(updated);
      showNotification({
        type: 'success',
        message: 'Content published successfully'
      });
      return updated;
    } catch (err) {
      showNotification({
        type: 'error',
        message: 'Failed to publish content'
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    if (contentId) {
      fetchContent(contentId);
    }
  }, [contentId, fetchContent]);

  return {
    content,
    loading,
    error,
    fetchContent,
    createContent,
    updateContent,
    deleteContent,
    submitForApproval,
    approveContent,
    rejectContent,
    requestRevision,
    scheduleContent,
    publishContent,
    refetch: () => contentId && fetchContent(contentId)
  };
}

export function useContentList(filter?: ContentFilter) {
  const [contents, setContents] = useState<Content[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchContents = useCallback(async (params?: ContentFilter) => {
    setLoading(true);
    setError(null);
    try {
      const result = await contentService.listContents(params || filter);
      setContents(result.contents);
      setTotal(result.total);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchContents();
  }, [fetchContents]);

  return {
    contents,
    total,
    loading,
    error,
    refetch: fetchContents
  };
}

export function useContentPerformance(contentId: string, autoSync: boolean = false) {
  const [performance, setPerformance] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { showNotification } = useNotification();

  const fetchPerformance = useCallback(async () => {
    if (!contentId) return;
    
    setLoading(true);
    try {
      const data = await contentService.getContentPerformance(contentId);
      setPerformance(data);
    } catch (err) {
      showNotification({
        type: 'error',
        message: 'Failed to load performance data'
      });
    } finally {
      setLoading(false);
    }
  }, [contentId, showNotification]);

  const syncPerformance = useCallback(async () => {
    if (!contentId) return;
    
    setLoading(true);
    try {
      const data = await contentService.syncContentPerformance(contentId);
      setPerformance(data);
      showNotification({
        type: 'success',
        message: 'Performance data synced'
      });
    } catch (err) {
      showNotification({
        type: 'error',
        message: 'Failed to sync performance data'
      });
    } finally {
      setLoading(false);
    }
  }, [contentId, showNotification]);

  useEffect(() => {
    fetchPerformance();
    
    if (autoSync) {
      const interval = setInterval(syncPerformance, 5 * 60 * 1000); // 5 minutes
      return () => clearInterval(interval);
    }
  }, [fetchPerformance, syncPerformance, autoSync]);

  return {
    performance,
    loading,
    syncPerformance,
    refetch: fetchPerformance
  };
}