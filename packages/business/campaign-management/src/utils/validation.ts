/**
 * @company/campaign-management - Validation Utilities
 */

import { z } from 'zod';
import { 
  Campaign, 
  CampaignStatus, 
  Platform, 
  ContentType,
  CreateCampaignRequest,
  CampaignRequirements,
  CampaignPeriod
} from '../types';

// ===== Validation Schemas =====

export const CampaignBudgetSchema = z.object({
  total: z.object({
    amount: z.number().min(0),
    currency: z.string().length(3)
  }),
  currency: z.string().length(3),
  perInfluencer: z.object({
    amount: z.number().min(0),
    currency: z.string().length(3)
  }).optional()
});

export const CampaignPeriodSchema = z.object({
  recruitStart: z.date(),
  recruitEnd: z.date(),
  campaignStart: z.date(),
  campaignEnd: z.date(),
  contentDeadline: z.date().optional(),
  settlementDate: z.date().optional()
}).refine(data => data.recruitEnd > data.recruitStart, {
  message: "Recruitment end date must be after start date"
}).refine(data => data.campaignStart >= data.recruitEnd, {
  message: "Campaign start date must be after recruitment end date"
}).refine(data => data.campaignEnd > data.campaignStart, {
  message: "Campaign end date must be after start date"
});

export const CampaignRequirementsSchema = z.object({
  minFollowers: z.number().min(0),
  maxFollowers: z.number().min(0).optional(),
  platforms: z.array(z.nativeEnum(Platform)).min(1),
  contentType: z.array(z.nativeEnum(ContentType)).min(1),
  hashtags: z.array(z.string()).default([]),
  mentions: z.array(z.string()).optional(),
  targetAudience: z.object({
    ageRange: z.object({
      min: z.number().min(13).max(100),
      max: z.number().min(13).max(100)
    }).optional(),
    gender: z.array(z.string()).optional(),
    interests: z.array(z.string()).optional(),
    lifestyle: z.array(z.string()).optional()
  }).optional(),
  geoTargeting: z.object({
    countries: z.array(z.string()).optional(),
    regions: z.array(z.string()).optional(),
    cities: z.array(z.string()).optional(),
    excludedLocations: z.array(z.string()).optional()
  }).optional(),
  languages: z.array(z.string()).optional(),
  exclusions: z.array(z.string()).optional(),
  contentGuidelines: z.string().optional(),
  brandGuidelines: z.string().optional()
}).refine(data => !data.maxFollowers || data.maxFollowers >= data.minFollowers, {
  message: "Maximum followers must be greater than minimum followers"
});

export const CreateCampaignSchema = z.object({
  title: z.string().min(5).max(100),
  description: z.string().min(20).max(5000),
  category: z.array(z.string()).min(1).max(5),
  budget: CampaignBudgetSchema,
  period: CampaignPeriodSchema,
  requirements: CampaignRequirementsSchema,
  isDraft: z.boolean().default(false),
  tags: z.array(z.string()).optional()
});

// ===== Validation Functions =====

export function validateCampaignData(data: CreateCampaignRequest): {
  isValid: boolean;
  errors: Record<string, string[]>;
} {
  try {
    CreateCampaignSchema.parse(data);
    return { isValid: true, errors: {} };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string[]> = {};
      
      error.errors.forEach(err => {
        const path = err.path.join('.');
        if (!errors[path]) {
          errors[path] = [];
        }
        errors[path].push(err.message);
      });
      
      return { isValid: false, errors };
    }
    
    return { 
      isValid: false, 
      errors: { general: ['Unknown validation error'] }
    };
  }
}

export function validateCampaignStatus(
  currentStatus: CampaignStatus,
  newStatus: CampaignStatus
): boolean {
  const validTransitions: Record<CampaignStatus, CampaignStatus[]> = {
    [CampaignStatus.DRAFT]: [CampaignStatus.PENDING],
    [CampaignStatus.PENDING]: [CampaignStatus.RECRUITING, CampaignStatus.CANCELLED],
    [CampaignStatus.RECRUITING]: [CampaignStatus.ACTIVE, CampaignStatus.PAUSED, CampaignStatus.CANCELLED],
    [CampaignStatus.ACTIVE]: [CampaignStatus.COMPLETED, CampaignStatus.PAUSED, CampaignStatus.CANCELLED],
    [CampaignStatus.PAUSED]: [CampaignStatus.RECRUITING, CampaignStatus.ACTIVE, CampaignStatus.CANCELLED],
    [CampaignStatus.COMPLETED]: [CampaignStatus.SETTLED],
    [CampaignStatus.SETTLED]: [],
    [CampaignStatus.CANCELLED]: []
  };
  
  return validTransitions[currentStatus]?.includes(newStatus) || false;
}

export function validateBudgetAllocation(
  totalBudget: number,
  allocations: { participantId: string; amount: number }[]
): {
  isValid: boolean;
  allocated: number;
  remaining: number;
  errors: string[];
} {
  const allocated = allocations.reduce((sum, alloc) => sum + alloc.amount, 0);
  const remaining = totalBudget - allocated;
  const errors: string[] = [];
  
  if (allocated > totalBudget) {
    errors.push('Allocated budget exceeds total budget');
  }
  
  allocations.forEach(alloc => {
    if (alloc.amount < 0) {
      errors.push(`Invalid budget amount for participant ${alloc.participantId}`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    allocated,
    remaining,
    errors
  };
}

export function validateCampaignDates(period: CampaignPeriod): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const now = new Date();
  
  if (period.recruitStart < now) {
    errors.push('Recruitment start date cannot be in the past');
  }
  
  if (period.recruitEnd <= period.recruitStart) {
    errors.push('Recruitment end date must be after start date');
  }
  
  if (period.campaignStart < period.recruitEnd) {
    errors.push('Campaign cannot start before recruitment ends');
  }
  
  if (period.campaignEnd <= period.campaignStart) {
    errors.push('Campaign end date must be after start date');
  }
  
  if (period.contentDeadline && period.contentDeadline > period.campaignEnd) {
    errors.push('Content deadline cannot be after campaign end date');
  }
  
  if (period.settlementDate && period.settlementDate < period.campaignEnd) {
    errors.push('Settlement date cannot be before campaign end date');
  }
  
  // Check minimum durations
  const recruitDuration = period.recruitEnd.getTime() - period.recruitStart.getTime();
  const campaignDuration = period.campaignEnd.getTime() - period.campaignStart.getTime();
  
  const minRecruitDays = 3 * 24 * 60 * 60 * 1000; // 3 days
  const minCampaignDays = 7 * 24 * 60 * 60 * 1000; // 7 days
  
  if (recruitDuration < minRecruitDays) {
    errors.push('Recruitment period must be at least 3 days');
  }
  
  if (campaignDuration < minCampaignDays) {
    errors.push('Campaign duration must be at least 7 days');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateRequirements(requirements: CampaignRequirements): {
  isValid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];
  
  // Check follower requirements
  if (requirements.minFollowers < 1000) {
    warnings.push('Minimum follower count is very low, this may attract low-quality applicants');
  }
  
  if (requirements.maxFollowers && requirements.maxFollowers < requirements.minFollowers * 2) {
    warnings.push('Follower range is very narrow, this may limit applicant pool');
  }
  
  // Check platform requirements
  if (requirements.platforms.length > 3) {
    warnings.push('Requiring many platforms may reduce applicant pool');
  }
  
  // Check content requirements
  if (requirements.contentType.length > 3) {
    warnings.push('Many content types may increase campaign complexity');
  }
  
  // Check hashtag requirements
  if (requirements.hashtags.length > 10) {
    warnings.push('Too many hashtags may reduce content authenticity');
  }
  
  // Check geo-targeting
  if (requirements.geoTargeting?.countries && requirements.geoTargeting.countries.length === 1) {
    warnings.push('Single country targeting may limit reach');
  }
  
  return {
    isValid: true,
    warnings
  };
}

// ===== Utility Functions =====

export function calculateCampaignProgress(campaign: Campaign): {
  recruitmentProgress: number;
  campaignProgress: number;
  overallProgress: number;
} {
  const now = new Date();
  
  // Recruitment progress
  let recruitmentProgress = 0;
  if (now >= campaign.period.recruitEnd) {
    recruitmentProgress = 100;
  } else if (now >= campaign.period.recruitStart) {
    const total = campaign.period.recruitEnd.getTime() - campaign.period.recruitStart.getTime();
    const elapsed = now.getTime() - campaign.period.recruitStart.getTime();
    recruitmentProgress = Math.round((elapsed / total) * 100);
  }
  
  // Campaign progress
  let campaignProgress = 0;
  if (now >= campaign.period.campaignEnd) {
    campaignProgress = 100;
  } else if (now >= campaign.period.campaignStart) {
    const total = campaign.period.campaignEnd.getTime() - campaign.period.campaignStart.getTime();
    const elapsed = now.getTime() - campaign.period.campaignStart.getTime();
    campaignProgress = Math.round((elapsed / total) * 100);
  }
  
  // Overall progress
  const overallProgress = Math.round((recruitmentProgress + campaignProgress) / 2);
  
  return {
    recruitmentProgress,
    campaignProgress,
    overallProgress
  };
}

export function getCampaignPhase(campaign: Campaign): 'pre-recruitment' | 'recruiting' | 'pre-campaign' | 'active' | 'completed' {
  const now = new Date();
  
  if (now < campaign.period.recruitStart) {
    return 'pre-recruitment';
  } else if (now >= campaign.period.recruitStart && now < campaign.period.recruitEnd) {
    return 'recruiting';
  } else if (now >= campaign.period.recruitEnd && now < campaign.period.campaignStart) {
    return 'pre-campaign';
  } else if (now >= campaign.period.campaignStart && now < campaign.period.campaignEnd) {
    return 'active';
  } else {
    return 'completed';
  }
}

export function formatCampaignDuration(campaign: Campaign): string {
  const duration = campaign.period.campaignEnd.getTime() - campaign.period.campaignStart.getTime();
  const days = Math.floor(duration / (1000 * 60 * 60 * 24));
  
  if (days < 7) {
    return `${days} days`;
  } else if (days < 30) {
    const weeks = Math.floor(days / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''}`;
  } else {
    const months = Math.floor(days / 30);
    return `${months} month${months > 1 ? 's' : ''}`;
  }
}