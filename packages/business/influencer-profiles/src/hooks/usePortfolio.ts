import { useState, useCallback } from 'react';
import { useNotification } from '@revu/ui-kit';
import { ProfileService } from '../services';
import type { Portfolio, PortfolioCampaign, MediaItem, Testimonial } from '../types';

const profileService = new ProfileService();

export function usePortfolio(profileId: string) {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(false);
  const { showNotification } = useNotification();

  const updatePortfolio = useCallback(async (
    updates: Partial<Portfolio>
  ): Promise<Portfolio> => {
    setLoading(true);
    try {
      const updated = await profileService.updatePortfolio(profileId, updates);
      setPortfolio(updated);
      showNotification({
        type: 'success',
        message: 'Portfolio updated successfully'
      });
      return updated;
    } catch (err) {
      showNotification({
        type: 'error',
        message: 'Failed to update portfolio'
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [profileId, showNotification]);

  const addCampaign = useCallback(async (
    campaign: Omit<PortfolioCampaign, 'id'>
  ) => {
    if (!portfolio) return;
    
    const newCampaign: PortfolioCampaign = {
      ...campaign,
      id: Date.now().toString()
    };
    
    return updatePortfolio({
      campaigns: [...portfolio.campaigns, newCampaign]
    });
  }, [portfolio, updatePortfolio]);

  const updateCampaign = useCallback(async (
    campaignId: string,
    updates: Partial<PortfolioCampaign>
  ) => {
    if (!portfolio) return;
    
    const updatedCampaigns = portfolio.campaigns.map(c =>
      c.id === campaignId ? { ...c, ...updates } : c
    );
    
    return updatePortfolio({ campaigns: updatedCampaigns });
  }, [portfolio, updatePortfolio]);

  const deleteCampaign = useCallback(async (campaignId: string) => {
    if (!portfolio) return;
    
    const filteredCampaigns = portfolio.campaigns.filter(c => c.id !== campaignId);
    return updatePortfolio({ campaigns: filteredCampaigns });
  }, [portfolio, updatePortfolio]);

  const addMedia = useCallback(async (
    media: Omit<MediaItem, 'id' | 'createdAt'>
  ) => {
    if (!portfolio) return;
    
    const newMedia: MediaItem = {
      ...media,
      id: Date.now().toString(),
      createdAt: new Date()
    };
    
    return updatePortfolio({
      media: [...portfolio.media, newMedia]
    });
  }, [portfolio, updatePortfolio]);

  const deleteMedia = useCallback(async (mediaId: string) => {
    if (!portfolio) return;
    
    const filteredMedia = portfolio.media.filter(m => m.id !== mediaId);
    return updatePortfolio({ media: filteredMedia });
  }, [portfolio, updatePortfolio]);

  const addTestimonial = useCallback(async (
    testimonial: Omit<Testimonial, 'id'>
  ) => {
    if (!portfolio) return;
    
    const newTestimonial: Testimonial = {
      ...testimonial,
      id: Date.now().toString()
    };
    
    return updatePortfolio({
      testimonials: [...portfolio.testimonials, newTestimonial]
    });
  }, [portfolio, updatePortfolio]);

  const deleteTestimonial = useCallback(async (testimonialId: string) => {
    if (!portfolio) return;
    
    const filteredTestimonials = portfolio.testimonials.filter(
      t => t.id !== testimonialId
    );
    return updatePortfolio({ testimonials: filteredTestimonials });
  }, [portfolio, updatePortfolio]);

  return {
    portfolio,
    loading,
    updatePortfolio,
    addCampaign,
    updateCampaign,
    deleteCampaign,
    addMedia,
    deleteMedia,
    addTestimonial,
    deleteTestimonial
  };
}