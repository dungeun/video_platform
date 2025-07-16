/**
 * PromotionList Component
 * Displays a list of active promotions with filtering and search
 */

import React, { useState, useMemo } from 'react';
import { 
  PromotionCampaign, 
  Event, 
  CampaignStatus,
  EventStatus,
  DiscountType,
  AudienceType 
} from '../types';
import { DiscountBadge } from './DiscountCalculator';

export interface PromotionListProps {
  promotions: PromotionCampaign[];
  events?: Event[];
  showFilters?: boolean;
  showSearch?: boolean;
  maxDisplay?: number;
  onPromotionClick?: (promotion: PromotionCampaign) => void;
  onEventClick?: (event: Event) => void;
  className?: string;
}

interface FilterOptions {
  status: CampaignStatus[];
  discountType: DiscountType[];
  audienceType: AudienceType[];
  showExpired: boolean;
}

export const PromotionList: React.FC<PromotionListProps> = ({
  promotions,
  events = [],
  showFilters = true,
  showSearch = true,
  maxDisplay,
  onPromotionClick,
  onEventClick,
  className = ''
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({
    status: [CampaignStatus.ACTIVE],
    discountType: [],
    audienceType: [],
    showExpired: false
  });

  const filteredPromotions = useMemo(() => {
    let filtered = promotions;

    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(promotion => 
        promotion.name.toLowerCase().includes(term) ||
        promotion.description?.toLowerCase().includes(term) ||
        promotion.tags.some(tag => tag.toLowerCase().includes(term))
      );
    }

    // Apply status filter
    if (filters.status.length > 0) {
      filtered = filtered.filter(promotion => 
        filters.status.includes(promotion.status)
      );
    }

    // Apply discount type filter
    if (filters.discountType.length > 0) {
      filtered = filtered.filter(promotion => 
        filters.discountType.includes(promotion.discountConfig.type)
      );
    }

    // Apply audience type filter
    if (filters.audienceType.length > 0) {
      filtered = filtered.filter(promotion => 
        filters.audienceType.includes(promotion.targetAudience.type)
      );
    }

    // Apply expired filter
    if (!filters.showExpired) {
      const now = new Date();
      filtered = filtered.filter(promotion => 
        promotion.endDate >= now
      );
    }

    // Sort by priority and date
    filtered.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    });

    // Apply max display limit
    if (maxDisplay) {
      filtered = filtered.slice(0, maxDisplay);
    }

    return filtered;
  }, [promotions, searchTerm, filters, maxDisplay]);

  const activeEvents = useMemo(() => {
    return events.filter(event => 
      event.status === EventStatus.LIVE || event.status === EventStatus.UPCOMING
    );
  }, [events]);

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const toggleFilter = (key: 'status' | 'discountType' | 'audienceType', value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key].includes(value) 
        ? prev[key].filter((item: any) => item !== value)
        : [...prev[key], value]
    }));
  };

  const getPromotionStatus = (promotion: PromotionCampaign): {
    text: string;
    variant: 'success' | 'warning' | 'error' | 'info';
  } => {
    const now = new Date();
    
    if (promotion.status === CampaignStatus.ACTIVE) {
      if (promotion.endDate < now) {
        return { text: 'Expired', variant: 'error' };
      }
      return { text: 'Active', variant: 'success' };
    }
    
    if (promotion.status === CampaignStatus.SCHEDULED) {
      return { text: 'Scheduled', variant: 'info' };
    }
    
    if (promotion.status === CampaignStatus.PAUSED) {
      return { text: 'Paused', variant: 'warning' };
    }
    
    return { text: promotion.status, variant: 'error' };
  };

  const getDiscountDescription = (promotion: PromotionCampaign): string => {
    const config = promotion.discountConfig;
    
    switch (config.type) {
      case DiscountType.PERCENTAGE:
        const percentageConfig = config as any;
        return `${percentageConfig.percentage}% off${percentageConfig.maxAmount ? ` (max ₩${percentageConfig.maxAmount.toLocaleString()})` : ''}`;
      
      case DiscountType.FIXED:
        const fixedConfig = config as any;
        return `₩${fixedConfig.amount.toLocaleString()} off`;
      
      case DiscountType.BUY_X_GET_Y:
        const bogoConfig = config as any;
        return `Buy ${bogoConfig.buyQuantity}, get ${bogoConfig.getQuantity} ${bogoConfig.discountType || 'free'}`;
      
      case DiscountType.FREE_SHIPPING:
        const shippingConfig = config as any;
        return `Free shipping${shippingConfig.minimumOrderAmount ? ` on orders over ₩${shippingConfig.minimumOrderAmount.toLocaleString()}` : ''}`;
      
      default:
        return 'Special discount';
    }
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  return (
    <div className={`promotion-list ${className}`}>
      {/* Header */}
      <div className="promotion-list-header">
        <h3 className="list-title">
          Active Promotions ({filteredPromotions.length})
        </h3>
        
        {activeEvents.length > 0 && (
          <div className="active-events-indicator">
            {activeEvents.length} active event{activeEvents.length > 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Search */}
      {showSearch && (
        <div className="promotion-search">
          <input
            type="text"
            placeholder="Search promotions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="promotion-filters">
          <div className="filter-group">
            <label className="filter-label">Status:</label>
            <div className="filter-options">
              {Object.values(CampaignStatus).map(status => (
                <button
                  key={status}
                  className={`filter-button ${filters.status.includes(status) ? 'active' : ''}`}
                  onClick={() => toggleFilter('status', status)}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <label className="filter-label">Discount Type:</label>
            <div className="filter-options">
              {Object.values(DiscountType).map(type => (
                <button
                  key={type}
                  className={`filter-button ${filters.discountType.includes(type) ? 'active' : ''}`}
                  onClick={() => toggleFilter('discountType', type)}
                >
                  {type.replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <label className="filter-checkbox">
              <input
                type="checkbox"
                checked={filters.showExpired}
                onChange={(e) => handleFilterChange('showExpired', e.target.checked)}
              />
              Show expired promotions
            </label>
          </div>
        </div>
      )}

      {/* Active Events */}
      {activeEvents.length > 0 && (
        <div className="active-events-section">
          <h4 className="section-title">Live Events</h4>
          <div className="events-list">
            {activeEvents.slice(0, 3).map(event => (
              <div 
                key={event.id} 
                className="event-item"
                onClick={() => onEventClick?.(event)}
              >
                <div className="event-info">
                  <span className="event-name">{event.name}</span>
                  <span className="event-type">{event.type}</span>
                </div>
                <div className="event-status">
                  <span className={`status-badge ${event.status}`}>
                    {event.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Promotions List */}
      <div className="promotions-section">
        {filteredPromotions.length === 0 ? (
          <div className="empty-state">
            <p>No promotions found matching your criteria.</p>
          </div>
        ) : (
          <div className="promotions-grid">
            {filteredPromotions.map(promotion => {
              const status = getPromotionStatus(promotion);
              
              return (
                <div 
                  key={promotion.id}
                  className={`promotion-card ${promotion.status}`}
                  onClick={() => onPromotionClick?.(promotion)}
                >
                  {/* Header */}
                  <div className="promotion-header">
                    <div className="promotion-title">
                      <h4 className="promotion-name">{promotion.name}</h4>
                      <span className={`status-badge ${status.variant}`}>
                        {status.text}
                      </span>
                    </div>
                    
                    <DiscountBadge
                      discountType={promotion.discountConfig.type}
                      value={
                        promotion.discountConfig.type === DiscountType.PERCENTAGE 
                          ? (promotion.discountConfig as any).percentage
                          : promotion.discountConfig.type === DiscountType.FIXED
                          ? (promotion.discountConfig as any).amount
                          : ''
                      }
                      size="small"
                    />
                  </div>

                  {/* Description */}
                  {promotion.description && (
                    <p className="promotion-description">
                      {promotion.description}
                    </p>
                  )}

                  {/* Discount Details */}
                  <div className="promotion-details">
                    <div className="discount-info">
                      <span className="discount-label">Discount:</span>
                      <span className="discount-value">
                        {getDiscountDescription(promotion)}
                      </span>
                    </div>

                    {/* Usage Conditions */}
                    {promotion.usageConditions.minimumOrderAmount && (
                      <div className="condition-info">
                        <span className="condition-label">Min. order:</span>
                        <span className="condition-value">
                          ₩{promotion.usageConditions.minimumOrderAmount.toLocaleString()}
                        </span>
                      </div>
                    )}

                    {/* Date Range */}
                    <div className="date-range">
                      <span className="date-label">Valid:</span>
                      <span className="date-value">
                        {formatDate(promotion.startDate)} - {formatDate(promotion.endDate)}
                      </span>
                    </div>
                  </div>

                  {/* Tags */}
                  {promotion.tags.length > 0 && (
                    <div className="promotion-tags">
                      {promotion.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Usage Stats */}
                  <div className="promotion-stats">
                    <div className="stat">
                      <span className="stat-label">Used:</span>
                      <span className="stat-value">{promotion.usage.totalUsed}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Saved:</span>
                      <span className="stat-value">
                        ₩{promotion.usage.totalSavings.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// Simplified Promotion Card Component
export interface PromotionCardProps {
  promotion: PromotionCampaign;
  compact?: boolean;
  onClick?: (promotion: PromotionCampaign) => void;
  className?: string;
}

export const PromotionCard: React.FC<PromotionCardProps> = ({
  promotion,
  compact = false,
  onClick,
  className = ''
}) => {
  const getDiscountText = (): string => {
    const config = promotion.discountConfig;
    
    switch (config.type) {
      case DiscountType.PERCENTAGE:
        return `${(config as any).percentage}% OFF`;
      case DiscountType.FIXED:
        return `₩${(config as any).amount.toLocaleString()} OFF`;
      case DiscountType.BUY_X_GET_Y:
        return 'BOGO';
      case DiscountType.FREE_SHIPPING:
        return 'FREE SHIPPING';
      default:
        return 'DISCOUNT';
    }
  };

  const isActive = promotion.status === CampaignStatus.ACTIVE && 
                   new Date() <= promotion.endDate;

  return (
    <div 
      className={`promotion-card ${compact ? 'compact' : ''} ${!isActive ? 'inactive' : ''} ${className}`}
      onClick={() => onClick?.(promotion)}
    >
      <div className="card-content">
        <div className="discount-badge">
          {getDiscountText()}
        </div>
        
        <h4 className="promotion-title">{promotion.name}</h4>
        
        {!compact && promotion.description && (
          <p className="promotion-description">{promotion.description}</p>
        )}
        
        <div className="promotion-footer">
          <span className="expiry-date">
            Expires: {new Intl.DateTimeFormat('ko-KR').format(promotion.endDate)}
          </span>
          
          {promotion.usageConditions.requiredCouponCode && (
            <span className="coupon-code">
              Code: {promotion.usageConditions.requiredCouponCode}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default PromotionList;