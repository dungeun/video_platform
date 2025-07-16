/**
 * @company/campaign-management - Campaign Status Badge Component
 */

import React from 'react';
import { CampaignStatus } from '../types';
import { getCampaignStatusColor, getCampaignStatusLabel } from '../utils/helpers';

interface CampaignStatusBadgeProps {
  status: CampaignStatus;
  className?: string;
  showIcon?: boolean;
}

export const CampaignStatusBadge: React.FC<CampaignStatusBadgeProps> = ({
  status,
  className = '',
  showIcon = true
}) => {
  const color = getCampaignStatusColor(status);
  const label = getCampaignStatusLabel(status);
  
  const getStatusIcon = () => {
    switch (status) {
      case CampaignStatus.DRAFT:
        return '📝';
      case CampaignStatus.PENDING:
        return '⏳';
      case CampaignStatus.RECRUITING:
        return '📢';
      case CampaignStatus.ACTIVE:
        return '🚀';
      case CampaignStatus.COMPLETED:
        return '✅';
      case CampaignStatus.SETTLED:
        return '💰';
      case CampaignStatus.CANCELLED:
        return '❌';
      case CampaignStatus.PAUSED:
        return '⏸️';
      default:
        return '📊';
    }
  };
  
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}
      style={{
        backgroundColor: `${color}20`,
        color: color,
        border: `1px solid ${color}40`
      }}
    >
      {showIcon && <span className="mr-1">{getStatusIcon()}</span>}
      {label}
    </span>
  );
};

// Additional component exports for common UI elements
export const CampaignCard: React.FC<{ campaign: any; onClick?: () => void }> = ({ campaign, onClick }) => {
  return (
    <div 
      className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow"
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{campaign.title}</h3>
        <CampaignStatusBadge status={campaign.status} />
      </div>
      
      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
        {campaign.description}
      </p>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-500">Budget:</span>
          <span className="ml-2 font-medium">
            ${campaign.budget.total.amount.toLocaleString()}
          </span>
        </div>
        <div>
          <span className="text-gray-500">Participants:</span>
          <span className="ml-2 font-medium">
            {campaign.participants.length}
          </span>
        </div>
      </div>
      
      <div className="mt-4 flex flex-wrap gap-2">
        {campaign.requirements.platforms.map((platform: string) => (
          <span
            key={platform}
            className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700"
          >
            {platform}
          </span>
        ))}
      </div>
    </div>
  );
};

export const CampaignProgress: React.FC<{ 
  recruited: number; 
  target: number;
  className?: string;
}> = ({ recruited, target, className = '' }) => {
  const percentage = target > 0 ? (recruited / target) * 100 : 0;
  
  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between text-sm text-gray-600 mb-1">
        <span>Recruited</span>
        <span>{recruited} / {target}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
};