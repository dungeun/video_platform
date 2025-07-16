import { BaseEntity, UUID } from '@revu/types';

export interface MatchingCriteria {
  brandId: UUID;
  campaign?: {
    budget: BudgetRange;
    duration: number;
    goals: CampaignGoal[];
    targetAudience: TargetAudience;
  };
  preferences: {
    platforms: string[];
    categories: string[];
    locations?: string[];
    languages?: string[];
    excludeCompetitors?: boolean;
  };
  requirements: {
    minFollowers?: number;
    maxFollowers?: number;
    minEngagementRate?: number;
    minAudienceQuality?: number;
    verifiedOnly?: boolean;
  };
  weights?: MatchingWeights;
}

export interface MatchingWeights {
  audienceRelevance: number;
  engagementRate: number;
  contentQuality: number;
  brandAlignment: number;
  reachPotential: number;
  costEfficiency: number;
  pastPerformance: number;
}

export interface BudgetRange {
  min: number;
  max: number;
  currency: string;
}

export interface CampaignGoal {
  type: 'awareness' | 'engagement' | 'conversion' | 'traffic';
  priority: number;
  kpi?: string;
  target?: number;
}

export interface TargetAudience {
  demographics: {
    ageRange?: [number, number];
    gender?: string[];
    locations?: string[];
    interests?: string[];
    income?: string[];
  };
  psychographics?: {
    lifestyle?: string[];
    values?: string[];
    personalities?: string[];
  };
}

export interface MatchResult extends BaseEntity {
  brandId: UUID;
  influencerId: UUID;
  score: number;
  confidence: number;
  breakdown: ScoreBreakdown;
  recommendation: MatchRecommendation;
  analysis: MatchAnalysis;
  suggestedTerms?: SuggestedTerms;
}

export interface ScoreBreakdown {
  audienceRelevance: number;
  engagementRate: number;
  contentQuality: number;
  brandAlignment: number;
  reachPotential: number;
  costEfficiency: number;
  pastPerformance: number;
  total: number;
}

export interface MatchRecommendation {
  status: 'highly_recommended' | 'recommended' | 'suitable' | 'not_recommended';
  reasons: string[];
  risks: string[];
  opportunities: string[];
}

export interface MatchAnalysis {
  audienceOverlap: number;
  estimatedReach: number;
  estimatedEngagement: number;
  estimatedROI: number;
  compatibilityFactors: CompatibilityFactor[];
  strengthsAndWeaknesses: {
    strengths: string[];
    weaknesses: string[];
  };
}

export interface CompatibilityFactor {
  name: string;
  score: number;
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
}

export interface SuggestedTerms {
  budget: number;
  deliverables: Deliverable[];
  timeline: string;
  performanceMetrics: string[];
}

export interface Deliverable {
  type: string;
  quantity: number;
  platform: string;
  description: string;
}

export interface MatchingModel {
  id: UUID;
  name: string;
  version: string;
  type: 'ml' | 'rule_based' | 'hybrid';
  parameters: any;
  performance: ModelPerformance;
  lastUpdated: Date;
}

export interface ModelPerformance {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  trainingSamples: number;
  validationSamples: number;
}

export interface InfluencerProfile {
  id: UUID;
  platforms: PlatformProfile[];
  categories: string[];
  languages: string[];
  locations: string[];
  audienceData: AudienceProfile;
  contentData: ContentProfile;
  performanceHistory: PerformanceHistory;
  brandCollaborations: BrandCollaboration[];
}

export interface PlatformProfile {
  platform: string;
  handle: string;
  followers: number;
  engagementRate: number;
  verified: boolean;
  metrics: any;
}

export interface AudienceProfile {
  totalReach: number;
  demographics: any;
  interests: string[];
  authenticity: number;
  quality: number;
}

export interface ContentProfile {
  primaryCategories: string[];
  contentQuality: number;
  postingFrequency: number;
  originalityScore: number;
  brandSafety: number;
}

export interface PerformanceHistory {
  campaignsCompleted: number;
  averageROI: number;
  completionRate: number;
  clientSatisfaction: number;
  specialties: string[];
}

export interface BrandCollaboration {
  brandId: UUID;
  campaignId: UUID;
  date: Date;
  performance: number;
  category: string;
}

export interface RecommendationRequest {
  brandId: UUID;
  limit?: number;
  offset?: number;
  filters?: MatchingCriteria;
  sortBy?: 'score' | 'relevance' | 'cost' | 'reach';
  includeAnalysis?: boolean;
}

export interface RecommendationResponse {
  recommendations: MatchResult[];
  totalCount: number;
  filters: MatchingCriteria;
  metadata: {
    modelVersion: string;
    generatedAt: Date;
    processingTime: number;
  };
}

export interface OptimizationRequest {
  brandId: UUID;
  budget: number;
  goals: CampaignGoal[];
  constraints: OptimizationConstraints;
}

export interface OptimizationConstraints {
  maxInfluencers?: number;
  minInfluencers?: number;
  platformDistribution?: { [platform: string]: number };
  categoryRequirements?: { [category: string]: number };
  timeConstraints?: {
    campaignStart: Date;
    campaignEnd: Date;
    blackoutDates?: Date[];
  };
}

export interface OptimizationResult {
  portfolio: InfluencerPortfolio[];
  totalScore: number;
  estimatedReach: number;
  estimatedEngagement: number;
  estimatedROI: number;
  budgetUtilization: number;
  recommendations: string[];
}

export interface InfluencerPortfolio {
  influencerId: UUID;
  allocation: number;
  role: 'primary' | 'supporting' | 'amplifier';
  deliverables: Deliverable[];
  estimatedImpact: number;
}