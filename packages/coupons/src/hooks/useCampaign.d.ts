import { PromotionCampaign, CampaignPerformance } from '../types';
interface UseCampaignOptions {
    onLoad?: (campaign: PromotionCampaign) => void;
    onPerformanceLoad?: (performance: CampaignPerformance) => void;
    onError?: (error: Error) => void;
}
export declare function useCampaign(campaignId?: string, options?: UseCampaignOptions): {
    campaign: PromotionCampaign | null;
    performance: CampaignPerformance | null;
    isLoading: boolean;
    isLoadingPerformance: boolean;
    error: Error | null;
    loadCampaign: (id: string) => Promise<any>;
    loadPerformance: (id: string) => Promise<any>;
    updateCampaign: (id: string, data: Partial<PromotionCampaign>) => Promise<any>;
    activateCampaign: (id: string) => Promise<any>;
    deactivateCampaign: (id: string) => Promise<any>;
    refresh: () => Promise<void>;
};
export {};
//# sourceMappingURL=useCampaign.d.ts.map