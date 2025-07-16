import { useState, useCallback, useEffect } from 'react';
import { useNotification } from '@revu/ui-kit';
import { BriefService } from '../services';
import type {
  ContentBrief,
  ContentRequirement,
  BrandGuideline,
  Deliverable,
  Timeline
} from '../types';

const briefService = new BriefService();

export function useContentBrief(briefId?: string) {
  const [brief, setBrief] = useState<ContentBrief | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { showNotification } = useNotification();

  const fetchBrief = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await briefService.getBrief(id);
      setBrief(data);
    } catch (err) {
      setError(err as Error);
      showNotification({
        type: 'error',
        message: 'Failed to load content brief'
      });
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  const createBrief = useCallback(async (data: Partial<ContentBrief>) => {
    setLoading(true);
    try {
      const created = await briefService.createBrief(data);
      setBrief(created);
      showNotification({
        type: 'success',
        message: 'Content brief created successfully'
      });
      return created;
    } catch (err) {
      showNotification({
        type: 'error',
        message: 'Failed to create content brief'
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  const updateBrief = useCallback(async (
    id: string,
    updates: Partial<ContentBrief>
  ) => {
    setLoading(true);
    try {
      const updated = await briefService.updateBrief(id, updates);
      setBrief(updated);
      showNotification({
        type: 'success',
        message: 'Content brief updated successfully'
      });
      return updated;
    } catch (err) {
      showNotification({
        type: 'error',
        message: 'Failed to update content brief'
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  const deleteBrief = useCallback(async (id: string) => {
    setLoading(true);
    try {
      await briefService.deleteBrief(id);
      setBrief(null);
      showNotification({
        type: 'success',
        message: 'Content brief deleted successfully'
      });
    } catch (err) {
      showNotification({
        type: 'error',
        message: 'Failed to delete content brief'
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  const addRequirement = useCallback(async (
    id: string,
    requirement: ContentRequirement
  ) => {
    setLoading(true);
    try {
      const updated = await briefService.addRequirement(id, requirement);
      setBrief(updated);
      showNotification({
        type: 'success',
        message: 'Requirement added successfully'
      });
      return updated;
    } catch (err) {
      showNotification({
        type: 'error',
        message: 'Failed to add requirement'
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  const updateDeliverable = useCallback(async (
    id: string,
    deliverableId: string,
    updates: Partial<Deliverable>
  ) => {
    setLoading(true);
    try {
      const updated = await briefService.updateDeliverable(
        id,
        deliverableId,
        updates
      );
      setBrief(updated);
      showNotification({
        type: 'success',
        message: 'Deliverable updated successfully'
      });
      return updated;
    } catch (err) {
      showNotification({
        type: 'error',
        message: 'Failed to update deliverable'
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  const exportBrief = useCallback(async (
    id: string,
    format: 'pdf' | 'docx'
  ) => {
    setLoading(true);
    try {
      const blob = await briefService.exportBrief(id, format);
      // Trigger download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `content-brief-${id}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      showNotification({
        type: 'success',
        message: 'Brief exported successfully'
      });
    } catch (err) {
      showNotification({
        type: 'error',
        message: 'Failed to export brief'
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    if (briefId) {
      fetchBrief(briefId);
    }
  }, [briefId, fetchBrief]);

  return {
    brief,
    loading,
    error,
    fetchBrief,
    createBrief,
    updateBrief,
    deleteBrief,
    addRequirement,
    updateDeliverable,
    exportBrief,
    refetch: () => briefId && fetchBrief(briefId)
  };
}

export function useCampaignBrief(campaignId: string) {
  const [brief, setBrief] = useState<ContentBrief | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { showNotification } = useNotification();

  const fetchBriefByCampaign = useCallback(async () => {
    if (!campaignId) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await briefService.getBriefByCampaign(campaignId);
      setBrief(data);
    } catch (err) {
      // If no brief exists, we might want to generate one
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  const generateBrief = useCallback(async () => {
    setLoading(true);
    try {
      const generated = await briefService.generateBriefFromCampaign(campaignId);
      setBrief(generated);
      showNotification({
        type: 'success',
        message: 'Brief generated from campaign'
      });
      return generated;
    } catch (err) {
      showNotification({
        type: 'error',
        message: 'Failed to generate brief'
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [campaignId, showNotification]);

  useEffect(() => {
    fetchBriefByCampaign();
  }, [fetchBriefByCampaign]);

  return {
    brief,
    loading,
    error,
    generateBrief,
    refetch: fetchBriefByCampaign
  };
}