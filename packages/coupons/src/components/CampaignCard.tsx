import React from 'react';
import { PromotionCampaign, CampaignPerformance } from '../types';
import { format } from 'date-fns';

interface CampaignCardProps {
  campaign: PromotionCampaign;
  performance?: CampaignPerformance;
  onView?: () => void;
  onEdit?: () => void;
  className?: string;
}

export const CampaignCard: React.FC<CampaignCardProps> = ({
  campaign,
  performance,
  onView,
  onEdit,
  className = ''
}) => {
  const isActive = campaign.isActive && 
    new Date() >= new Date(campaign.startDate) && 
    new Date() <= new Date(campaign.endDate);

  const daysRemaining = Math.ceil(
    (new Date(campaign.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  const budgetPercentage = campaign.budget 
    ? (campaign.spentAmount / campaign.budget) * 100 
    : 0;

  return (
    <div className={`campaign-card bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{campaign.name}</h3>
            {campaign.description && (
              <p className="mt-1 text-sm text-gray-600">{campaign.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isActive ? (
              <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                Active
              </span>
            ) : campaign.isActive ? (
              <span className="px-3 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">
                Scheduled
              </span>
            ) : (
              <span className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                Inactive
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          <div>
            <p className="text-gray-500">Duration</p>
            <p className="font-medium">
              {format(new Date(campaign.startDate), 'MMM d')} - {format(new Date(campaign.endDate), 'MMM d, yyyy')}
            </p>
            {isActive && daysRemaining > 0 && (
              <p className="text-xs text-gray-600 mt-1">
                {daysRemaining} days remaining
              </p>
            )}
          </div>

          {campaign.budget && (
            <div>
              <p className="text-gray-500">Budget</p>
              <p className="font-medium">
                ${campaign.spentAmount.toFixed(0)} / ${campaign.budget.toFixed(0)}
              </p>
              <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
                <div 
                  className="bg-blue-600 h-1.5 rounded-full"
                  style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {performance && (
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {performance.roi.toFixed(0)}%
              </p>
              <p className="text-xs text-gray-500">ROI</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {performance.conversionRate.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500">Conversion</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                ${(performance.totalRevenue / 1000).toFixed(1)}k
              </p>
              <p className="text-xs text-gray-500">Revenue</p>
            </div>
          </div>
        )}

        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
          {onView && (
            <button
              onClick={onView}
              className="flex-1 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              View Details
            </button>
          )}
          {onEdit && (
            <button
              onClick={onEdit}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Edit Campaign
            </button>
          )}
        </div>
      </div>
    </div>
  );
};