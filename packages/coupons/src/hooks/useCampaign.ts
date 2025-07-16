import { useState, useCallback } from 'react';
import { PromotionCampaign, CampaignPerformance } from '../types';

interface UseCampaignOptions {
  onLoad?: (campaign: PromotionCampaign) => void;
  onPerformanceLoad?: (performance: CampaignPerformance) => void;
  onError?: (error: Error) => void;
}

export function useCampaign(campaignId?: string, options: UseCampaignOptions = {}) {
  const [campaign, setCampaign] = useState<PromotionCampaign | null>(null);
  const [performance, setPerformance] = useState<CampaignPerformance | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPerformance, setIsLoadingPerformance] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadCampaign = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/campaigns/${id}`);
      if (!response.ok) throw new Error('Failed to load campaign');
      
      const data = await response.json();
      setCampaign(data);
      options.onLoad?.(data);
      
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      options.onError?.(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [options]);

  const loadPerformance = useCallback(async (id: string) => {
    try {
      setIsLoadingPerformance(true);
      setError(null);
      
      const response = await fetch(`/api/campaigns/${id}/performance`);
      if (!response.ok) throw new Error('Failed to load performance');
      
      const data = await response.json();
      setPerformance(data);
      options.onPerformanceLoad?.(data);
      
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      options.onError?.(error);
      throw error;
    } finally {
      setIsLoadingPerformance(false);
    }
  }, [options]);

  const updateCampaign = useCallback(async (
    id: string,
    data: Partial<PromotionCampaign>
  ) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/campaigns/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) throw new Error('Failed to update campaign');
      
      const updated = await response.json();
      setCampaign(updated);
      
      return updated;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      options.onError?.(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [options]);

  const activateCampaign = useCallback(async (id: string) => {
    return updateCampaign(id, { isActive: true });
  }, [updateCampaign]);

  const deactivateCampaign = useCallback(async (id: string) => {
    return updateCampaign(id, { isActive: false });
  }, [updateCampaign]);

  const refresh = useCallback(async () => {
    if (campaignId || campaign?.id) {
      const id = campaignId || campaign!.id;
      await Promise.all([
        loadCampaign(id),
        loadPerformance(id)
      ]);
    }
  }, [campaignId, campaign, loadCampaign, loadPerformance]);

  return {
    campaign,
    performance,
    isLoading,
    isLoadingPerformance,
    error,
    loadCampaign,
    loadPerformance,
    updateCampaign,
    activateCampaign,
    deactivateCampaign,
    refresh
  };
}