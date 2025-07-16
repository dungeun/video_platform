/**
 * @repo/campaign-management - React Hooks
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { create } from 'zustand';
import { CampaignService } from '../services/campaign.service';
import { 
  Campaign, 
  CampaignState, 
  CampaignActions,
  CreateCampaignRequest,
  UpdateCampaignRequest,
  CampaignFilters,
  CampaignActionRequest,
  ID,
  CampaignStatus,
  Participant,
  ApplicantFilters
} from '../types';

// ===== Zustand Store =====
interface CampaignStore extends CampaignState, CampaignActions {}

const useCampaignStore = create<CampaignStore>((set, get) => ({
  // State
  campaigns: new Map(),
  currentCampaign: undefined,
  filters: {},
  loading: false,
  error: undefined,
  pagination: {
    page: 1,
    limit: 20,
    total: 0
  },

  // Actions
  createCampaign: async (data: CreateCampaignRequest) => {
    set({ loading: true, error: undefined });
    try {
      const service = getCampaignService();
      const campaign = await service.createCampaign(data);
      
      set(state => ({
        campaigns: new Map(state.campaigns).set(campaign.id, campaign),
        loading: false
      }));
      
      return campaign;
    } catch (error) {
      set({ error: error as Error, loading: false });
      throw error;
    }
  },

  updateCampaign: async (data: UpdateCampaignRequest) => {
    set({ loading: true, error: undefined });
    try {
      const service = getCampaignService();
      const campaign = await service.updateCampaign(data);
      
      set(state => ({
        campaigns: new Map(state.campaigns).set(campaign.id, campaign),
        currentCampaign: state.currentCampaign?.id === campaign.id ? campaign : state.currentCampaign,
        loading: false
      }));
      
      return campaign;
    } catch (error) {
      set({ error: error as Error, loading: false });
      throw error;
    }
  },

  deleteCampaign: async (id: ID) => {
    set({ loading: true, error: undefined });
    try {
      const service = getCampaignService();
      await service.deleteCampaign(id);
      
      set(state => {
        const campaigns = new Map(state.campaigns);
        campaigns.delete(id);
        return {
          campaigns,
          currentCampaign: state.currentCampaign?.id === id ? undefined : state.currentCampaign,
          loading: false
        };
      });
    } catch (error) {
      set({ error: error as Error, loading: false });
      throw error;
    }
  },

  getCampaign: async (id: ID) => {
    set({ loading: true, error: undefined });
    try {
      const service = getCampaignService();
      const campaign = await service.getCampaign(id);
      
      set(state => ({
        campaigns: new Map(state.campaigns).set(campaign.id, campaign),
        currentCampaign: campaign,
        loading: false
      }));
      
      return campaign;
    } catch (error) {
      set({ error: error as Error, loading: false });
      throw error;
    }
  },

  listCampaigns: async (filters?: CampaignFilters) => {
    set({ loading: true, error: undefined });
    try {
      const service = getCampaignService();
      const result = await service.listCampaigns(filters);
      
      const campaignsMap = new Map<ID, Campaign>();
      result.campaigns.forEach(campaign => {
        campaignsMap.set(campaign.id, campaign);
      });
      
      set({
        campaigns: campaignsMap,
        filters: filters || {},
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total
        },
        loading: false
      });
      
      return result.campaigns;
    } catch (error) {
      set({ error: error as Error, loading: false });
      throw error;
    }
  },

  performAction: async (request: CampaignActionRequest) => {
    set({ loading: true, error: undefined });
    try {
      const service = getCampaignService();
      const campaign = await service.performAction(request);
      
      set(state => ({
        campaigns: new Map(state.campaigns).set(campaign.id, campaign),
        currentCampaign: state.currentCampaign?.id === campaign.id ? campaign : state.currentCampaign,
        loading: false
      }));
      
      return campaign;
    } catch (error) {
      set({ error: error as Error, loading: false });
      throw error;
    }
  },

  approveApplicant: async (campaignId: ID, applicantId: ID) => {
    set({ loading: true, error: undefined });
    try {
      const service = getCampaignService();
      await service.approveApplicant(campaignId, applicantId);
      
      // Refresh campaign data
      await get().getCampaign(campaignId);
      
      set({ loading: false });
    } catch (error) {
      set({ error: error as Error, loading: false });
      throw error;
    }
  },

  rejectApplicant: async (campaignId: ID, applicantId: ID, reason?: string) => {
    set({ loading: true, error: undefined });
    try {
      const service = getCampaignService();
      await service.rejectApplicant(campaignId, applicantId, reason);
      
      // Refresh campaign data
      await get().getCampaign(campaignId);
      
      set({ loading: false });
    } catch (error) {
      set({ error: error as Error, loading: false });
      throw error;
    }
  },

  removeParticipant: async (campaignId: ID, participantId: ID, reason?: string) => {
    set({ loading: true, error: undefined });
    try {
      const service = getCampaignService();
      await service.removeParticipant(campaignId, participantId, reason);
      
      // Refresh campaign data
      await get().getCampaign(campaignId);
      
      set({ loading: false });
    } catch (error) {
      set({ error: error as Error, loading: false });
      throw error;
    }
  },

  approveContent: async (campaignId: ID, participantId: ID, contentId: ID) => {
    set({ loading: true, error: undefined });
    try {
      const service = getCampaignService();
      await service.approveContent(campaignId, participantId, contentId);
      
      // Refresh campaign data
      await get().getCampaign(campaignId);
      
      set({ loading: false });
    } catch (error) {
      set({ error: error as Error, loading: false });
      throw error;
    }
  },

  rejectContent: async (campaignId: ID, participantId: ID, contentId: ID, feedback: string) => {
    set({ loading: true, error: undefined });
    try {
      const service = getCampaignService();
      await service.rejectContent(campaignId, participantId, contentId, feedback);
      
      // Refresh campaign data
      await get().getCampaign(campaignId);
      
      set({ loading: false });
    } catch (error) {
      set({ error: error as Error, loading: false });
      throw error;
    }
  },

  setCurrentCampaign: (campaign: Campaign | undefined) => {
    set({ currentCampaign: campaign });
  },

  setFilters: (filters: CampaignFilters) => {
    set({ filters });
  },

  clearError: () => {
    set({ error: undefined });
  }
}));

// ===== Service Singleton =====
let campaignService: CampaignService | null = null;

export function initializeCampaignService(config: { apiUrl: string; apiKey?: string }): void {
  campaignService = new CampaignService(config);
}

function getCampaignService(): CampaignService {
  if (!campaignService) {
    throw new Error('CampaignService not initialized. Call initializeCampaignService first.');
  }
  return campaignService;
}

// ===== Main Hook =====
export function useCampaign() {
  const store = useCampaignStore();
  
  return {
    // State
    campaigns: Array.from(store.campaigns.values()),
    currentCampaign: store.currentCampaign,
    loading: store.loading,
    error: store.error,
    filters: store.filters,
    pagination: store.pagination,
    
    // Actions
    createCampaign: store.createCampaign,
    updateCampaign: store.updateCampaign,
    deleteCampaign: store.deleteCampaign,
    getCampaign: store.getCampaign,
    listCampaigns: store.listCampaigns,
    performAction: store.performAction,
    setCurrentCampaign: store.setCurrentCampaign,
    setFilters: store.setFilters,
    clearError: store.clearError
  };
}

// ===== Specific Hooks =====

export function useCampaignDetails(id: ID) {
  const { getCampaign, currentCampaign, loading, error } = useCampaign();
  
  useEffect(() => {
    if (id) {
      getCampaign(id);
    }
  }, [id, getCampaign]);
  
  return {
    campaign: currentCampaign,
    loading,
    error,
    refresh: () => getCampaign(id)
  };
}

export function useCampaignList(filters?: CampaignFilters) {
  const { campaigns, listCampaigns, loading, error, pagination } = useCampaign();
  
  useEffect(() => {
    listCampaigns(filters);
  }, [filters, listCampaigns]);
  
  return {
    campaigns,
    loading,
    error,
    pagination,
    refresh: () => listCampaigns(filters)
  };
}

export function useCampaignActions(campaignId: ID) {
  const store = useCampaignStore();
  
  const publish = useCallback(() => {
    return store.performAction({
      campaignId,
      action: CampaignAction.PUBLISH
    });
  }, [campaignId, store]);
  
  const pause = useCallback(() => {
    return store.performAction({
      campaignId,
      action: CampaignAction.PAUSE
    });
  }, [campaignId, store]);
  
  const resume = useCallback(() => {
    return store.performAction({
      campaignId,
      action: CampaignAction.RESUME
    });
  }, [campaignId, store]);
  
  const cancel = useCallback((reason?: string) => {
    return store.performAction({
      campaignId,
      action: CampaignAction.CANCEL,
      reason
    });
  }, [campaignId, store]);
  
  const complete = useCallback(() => {
    return store.performAction({
      campaignId,
      action: CampaignAction.COMPLETE
    });
  }, [campaignId, store]);
  
  const clone = useCallback(() => {
    return store.performAction({
      campaignId,
      action: CampaignAction.CLONE
    });
  }, [campaignId, store]);
  
  return {
    publish,
    pause,
    resume,
    cancel,
    complete,
    clone,
    loading: store.loading,
    error: store.error
  };
}

export function useCampaignParticipants(campaignId: ID) {
  const [applicants, setApplicants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const store = useCampaignStore();
  
  const loadApplicants = useCallback(async (filters?: Omit<ApplicantFilters, 'campaignId'>) => {
    setLoading(true);
    setError(null);
    
    try {
      const service = getCampaignService();
      const result = await service.getApplicants({
        campaignId,
        ...filters
      });
      setApplicants(result.applicants);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [campaignId]);
  
  useEffect(() => {
    loadApplicants();
  }, [loadApplicants]);
  
  return {
    applicants,
    loading,
    error,
    refresh: loadApplicants,
    approveApplicant: (applicantId: ID) => store.approveApplicant(campaignId, applicantId),
    rejectApplicant: (applicantId: ID, reason?: string) => 
      store.rejectApplicant(campaignId, applicantId, reason),
    removeParticipant: (participantId: ID, reason?: string) =>
      store.removeParticipant(campaignId, participantId, reason)
  };
}

export function useCampaignMetrics(campaignId: ID) {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const loadMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const service = getCampaignService();
      const data = await service.getCampaignMetrics(campaignId);
      setMetrics(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [campaignId]);
  
  useEffect(() => {
    loadMetrics();
    
    // Refresh metrics every 5 minutes
    const interval = setInterval(loadMetrics, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [loadMetrics]);
  
  return {
    metrics,
    loading,
    error,
    refresh: loadMetrics
  };
}

// Import required types
import { CampaignAction } from '../types';