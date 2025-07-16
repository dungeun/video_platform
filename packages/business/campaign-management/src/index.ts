/**
 * @company/campaign-management - Campaign Management Module
 * 
 * Complete campaign lifecycle management for influencer marketing platform
 * Handles campaign creation, participant management, content approval, and settlement
 * 
 * @version 1.0.0
 * @author Enterprise AI Team
 */

// ===== Core Services =====
export { CampaignService } from './services/campaign.service';
export type { CampaignServiceConfig } from './services/campaign.service';

// ===== React Hooks =====
export {
  useCampaign,
  useCampaignDetails,
  useCampaignList,
  useCampaignActions,
  useCampaignParticipants,
  useCampaignMetrics,
  initializeCampaignService
} from './hooks/useCampaign';

// ===== React Components =====
export {
  CampaignStatusBadge,
  CampaignCard,
  CampaignProgress
} from './components/CampaignStatusBadge';

// ===== Types =====
export type {
  // Core Types
  Campaign,
  CampaignBudget,
  CampaignPeriod,
  CampaignRequirements,
  CampaignMetrics,
  
  // Participant Types
  Participant,
  ParticipantContent,
  ParticipantPerformance,
  ContentFeedback,
  ContentMetrics,
  
  // Request/Response Types
  CreateCampaignRequest,
  UpdateCampaignRequest,
  CampaignFilters,
  CampaignActionRequest,
  ApplicantFilters,
  
  // Supporting Types
  TargetAudience,
  GeoTargeting,
  PaymentTerms,
  PaymentMilestone,
  
  // State Types
  CampaignState,
  CampaignActions,
  
  // Event Types
  CampaignEvent,
  
  // Validation Types
  CampaignValidation
} from './types';

// ===== Enums =====
export {
  CampaignStatus,
  ApprovalStatus,
  ParticipantStatus,
  ContentStatus,
  PaymentStatus,
  Platform,
  ContentType,
  Gender,
  CampaignAction,
  CampaignEventType
} from './types';

// ===== Utilities =====
export {
  // Validation
  validateCampaignData,
  validateCampaignStatus,
  validateBudgetAllocation,
  validateCampaignDates,
  validateRequirements,
  calculateCampaignProgress,
  getCampaignPhase,
  formatCampaignDuration,
  
  // Schemas
  CampaignBudgetSchema,
  CampaignPeriodSchema,
  CampaignRequirementsSchema,
  CreateCampaignSchema
} from './utils/validation';

export {
  // Status Helpers
  getCampaignStatusColor,
  getCampaignStatusLabel,
  getParticipantStatusColor,
  getContentStatusColor,
  
  // Platform Helpers
  getPlatformIcon,
  getPlatformLabel,
  
  // Content Type Helpers
  getContentTypeIcon,
  getContentTypeLabel,
  
  // Date Helpers
  formatCampaignDate,
  formatCampaignDateTime,
  getTimeRemaining,
  getDaysRemaining,
  getCampaignDuration,
  
  // Money Helpers
  formatMoney,
  formatBudgetUtilization,
  
  // Statistics Helpers
  calculateEngagementRate,
  calculateAverageMetric,
  calculateCompletionRate,
  
  // Filter Helpers
  filterActiveParticipants,
  filterPendingContent,
  groupParticipantsByStatus,
  
  // Validation Helpers
  canEditCampaign,
  canPublishCampaign,
  canPauseCampaign,
  canCancelCampaign,
  canSettleCampaign,
  
  // Export Helpers
  exportCampaignToCSV,
  
  // Summary Helpers
  generateCampaignSummary
} from './utils/helpers';

// ===== Module Info =====
export const CAMPAIGN_MODULE_INFO = {
  name: '@company/campaign-management',
  version: '1.0.0',
  description: 'Campaign Management Module for Influencer Marketing Platform',
  author: 'Enterprise AI Team',
  license: 'MIT',
  features: [
    'Campaign CRUD operations',
    'Status lifecycle management',
    'Budget tracking and allocation',
    'Participant recruitment and management',
    'Content approval workflow',
    'Real-time metrics and analytics',
    'Export and reporting capabilities'
  ]
} as const;

// ===== Default Configuration =====
export const DEFAULT_CAMPAIGN_CONFIG = {
  validation: {
    title: { min: 5, max: 100 },
    description: { min: 20, max: 5000 },
    budget: { min: 100 },
    participants: { min: 1, max: 1000 },
    period: {
      minRecruitDays: 3,
      minCampaignDays: 7,
      maxCampaignDays: 365
    }
  },
  defaults: {
    currency: 'USD',
    platforms: [Platform.INSTAGRAM],
    contentTypes: [ContentType.POST],
    minFollowers: 10000,
    recruitDuration: 7, // days
    campaignDuration: 30 // days
  },
  features: {
    autoApprove: false,
    requireContentApproval: true,
    enableBudgetTracking: true,
    enableMetricsTracking: true,
    enableExport: true
  }
} as const;

// ===== Quick Start Function =====
export function createCampaignManager(config: {
  apiUrl: string;
  apiKey?: string;
  defaults?: Partial<typeof DEFAULT_CAMPAIGN_CONFIG>;
}) {
  // Initialize service
  initializeCampaignService({
    apiUrl: config.apiUrl,
    apiKey: config.apiKey
  });
  
  // Return configured module interface
  return {
    service: new CampaignService({
      apiUrl: config.apiUrl,
      apiKey: config.apiKey
    }),
    config: {
      ...DEFAULT_CAMPAIGN_CONFIG,
      ...config.defaults
    },
    info: CAMPAIGN_MODULE_INFO
  };
}

// ===== Type Guards =====
export function isCampaign(obj: any): obj is Campaign {
  return obj &&
    typeof obj.id === 'string' &&
    typeof obj.brandId === 'string' &&
    typeof obj.title === 'string' &&
    typeof obj.status === 'string' &&
    obj.budget &&
    obj.period &&
    obj.requirements &&
    Array.isArray(obj.participants);
}

export function isParticipant(obj: any): obj is Participant {
  return obj &&
    typeof obj.id === 'string' &&
    typeof obj.influencerId === 'string' &&
    typeof obj.status === 'string' &&
    obj.appliedAt instanceof Date &&
    Array.isArray(obj.content);
}

// ===== Re-export common types from @company/types =====
export type { ID, Money, EntityMetadata } from '@company/types';

// ===== Initialization Log =====
if (typeof window !== 'undefined') {
  console.log(`🎯 ${CAMPAIGN_MODULE_INFO.name} v${CAMPAIGN_MODULE_INFO.version} initialized`);
}

// Import required for proper types
import { Platform, ContentType } from './types';