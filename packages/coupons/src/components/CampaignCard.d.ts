import React from 'react';
import { PromotionCampaign, CampaignPerformance } from '../types';
interface CampaignCardProps {
    campaign: PromotionCampaign;
    performance?: CampaignPerformance;
    onView?: () => void;
    onEdit?: () => void;
    className?: string;
}
export declare const CampaignCard: React.FC<CampaignCardProps>;
export {};
//# sourceMappingURL=CampaignCard.d.ts.map