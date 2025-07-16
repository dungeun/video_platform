/**
 * @company/campaign-management - Type Definitions
 */

import { ID, Money, EntityMetadata } from '@company/types';

// ===== Campaign Types =====
export interface Campaign extends EntityMetadata {
  id: ID;
  brandId: ID;
  title: string;
  description: string;
  category: string[];
  budget: CampaignBudget;
  period: CampaignPeriod;
  requirements: CampaignRequirements;
  status: CampaignStatus;
  participants: Participant[];
  metrics?: CampaignMetrics;
  tags?: string[];
  isDraft: boolean;
  approvalStatus?: ApprovalStatus;
  approvalNotes?: string;
  approvedBy?: ID;
  approvedAt?: Date;
}

export interface CampaignBudget {
  total: Money;
  currency: string;
  perInfluencer?: Money;
  allocated: Money;
  spent: Money;
  paymentTerms?: PaymentTerms;
}

export interface PaymentTerms {
  type: 'fixed' | 'performance' | 'hybrid';
  upfrontPercentage?: number;
  milestones?: PaymentMilestone[];
}

export interface PaymentMilestone {
  name: string;
  percentage: number;
  condition: string;
  dueDate?: Date;
}

export interface CampaignPeriod {
  recruitStart: Date;
  recruitEnd: Date;
  campaignStart: Date;
  campaignEnd: Date;
  contentDeadline?: Date;
  settlementDate?: Date;
}

export interface CampaignRequirements {
  minFollowers: number;
  maxFollowers?: number;
  platforms: Platform[];
  contentType: ContentType[];
  hashtags: string[];
  mentions?: string[];
  targetAudience?: TargetAudience;
  geoTargeting?: GeoTargeting;
  languages?: string[];
  exclusions?: string[];
  contentGuidelines?: string;
  brandGuidelines?: string;
}

export interface TargetAudience {
  ageRange?: { min: number; max: number };
  gender?: Gender[];
  interests?: string[];
  lifestyle?: string[];
}

export interface GeoTargeting {
  countries?: string[];
  regions?: string[];
  cities?: string[];
  excludedLocations?: string[];
}

export interface Participant {
  id: ID;
  influencerId: ID;
  status: ParticipantStatus;
  appliedAt: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  completedAt?: Date;
  budget?: Money;
  content: ParticipantContent[];
  performance?: ParticipantPerformance;
  paymentStatus?: PaymentStatus;
  notes?: string;
}

export interface ParticipantContent {
  id: ID;
  type: ContentType;
  platform: Platform;
  url?: string;
  status: ContentStatus;
  submittedAt?: Date;
  approvedAt?: Date;
  publishedAt?: Date;
  metrics?: ContentMetrics;
  feedback?: ContentFeedback[];
}

export interface ContentFeedback {
  id: ID;
  message: string;
  createdBy: ID;
  createdAt: Date;
  type: 'revision' | 'approval' | 'rejection';
}

export interface ContentMetrics {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  engagementRate: number;
  reach: number;
  impressions: number;
  clicks?: number;
  conversions?: number;
}

export interface ParticipantPerformance {
  totalReach: number;
  totalEngagement: number;
  averageEngagementRate: number;
  contentDelivered: number;
  contentPending: number;
  roi?: number;
}

export interface CampaignMetrics {
  totalParticipants: number;
  activeParticipants: number;
  totalReach: number;
  totalEngagement: number;
  averageEngagementRate: number;
  totalContent: number;
  completionRate: number;
  budgetUtilization: number;
  roi?: number;
  costPerEngagement?: Money;
  costPerReach?: Money;
}

// ===== Enums =====
export enum CampaignStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  RECRUITING = 'recruiting',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  SETTLED = 'settled',
  CANCELLED = 'cancelled',
  PAUSED = 'paused'
}

export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  REVISION_REQUIRED = 'revision_required'
}

export enum ParticipantStatus {
  APPLIED = 'applied',
  REVIEWING = 'reviewing',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  WITHDRAWN = 'withdrawn',
  REMOVED = 'removed'
}

export enum ContentStatus {
  NOT_STARTED = 'not_started',
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  REVIEWING = 'reviewing',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PUBLISHED = 'published',
  REMOVED = 'removed'
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  PAID = 'paid',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded'
}

export enum Platform {
  INSTAGRAM = 'instagram',
  YOUTUBE = 'youtube',
  TIKTOK = 'tiktok',
  TWITTER = 'twitter',
  FACEBOOK = 'facebook',
  BLOG = 'blog',
  OTHER = 'other'
}

export enum ContentType {
  POST = 'post',
  STORY = 'story',
  REEL = 'reel',
  VIDEO = 'video',
  LIVE = 'live',
  BLOG_POST = 'blog_post',
  REVIEW = 'review'
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
  ALL = 'all'
}

// ===== Request/Response Types =====
export interface CreateCampaignRequest {
  title: string;
  description: string;
  category: string[];
  budget: Omit<CampaignBudget, 'allocated' | 'spent'>;
  period: CampaignPeriod;
  requirements: CampaignRequirements;
  isDraft?: boolean;
  tags?: string[];
}

export interface UpdateCampaignRequest extends Partial<CreateCampaignRequest> {
  id: ID;
}

export interface CampaignFilters {
  status?: CampaignStatus[];
  brandId?: ID;
  category?: string[];
  minBudget?: number;
  maxBudget?: number;
  dateRange?: {
    start: Date;
    end: Date;
  };
  search?: string;
}

export interface ApplicantFilters {
  campaignId: ID;
  status?: ParticipantStatus[];
  minFollowers?: number;
  platforms?: Platform[];
  search?: string;
}

export interface CampaignActionRequest {
  campaignId: ID;
  action: CampaignAction;
  reason?: string;
  data?: any;
}

export enum CampaignAction {
  PUBLISH = 'publish',
  PAUSE = 'pause',
  RESUME = 'resume',
  CANCEL = 'cancel',
  COMPLETE = 'complete',
  SETTLE = 'settle',
  CLONE = 'clone'
}

// ===== State Management Types =====
export interface CampaignState {
  campaigns: Map<ID, Campaign>;
  currentCampaign?: Campaign;
  filters: CampaignFilters;
  loading: boolean;
  error?: Error;
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface CampaignActions {
  // CRUD
  createCampaign: (data: CreateCampaignRequest) => Promise<Campaign>;
  updateCampaign: (data: UpdateCampaignRequest) => Promise<Campaign>;
  deleteCampaign: (id: ID) => Promise<void>;
  getCampaign: (id: ID) => Promise<Campaign>;
  listCampaigns: (filters?: CampaignFilters) => Promise<Campaign[]>;
  
  // Actions
  performAction: (request: CampaignActionRequest) => Promise<Campaign>;
  
  // Participant Management
  approveApplicant: (campaignId: ID, applicantId: ID) => Promise<void>;
  rejectApplicant: (campaignId: ID, applicantId: ID, reason?: string) => Promise<void>;
  removeParticipant: (campaignId: ID, participantId: ID, reason?: string) => Promise<void>;
  
  // Content Management
  approveContent: (campaignId: ID, participantId: ID, contentId: ID) => Promise<void>;
  rejectContent: (campaignId: ID, participantId: ID, contentId: ID, feedback: string) => Promise<void>;
  
  // State
  setCurrentCampaign: (campaign: Campaign | undefined) => void;
  setFilters: (filters: CampaignFilters) => void;
  clearError: () => void;
}

// ===== Validation Schemas =====
export interface CampaignValidation {
  title: { min: number; max: number };
  description: { min: number; max: number };
  budget: { min: number };
  participants: { min: number; max: number };
  period: {
    minRecruitDays: number;
    minCampaignDays: number;
    maxCampaignDays: number;
  };
}

// ===== Event Types =====
export interface CampaignEvent {
  type: CampaignEventType;
  campaignId: ID;
  data: any;
  timestamp: Date;
  userId: ID;
}

export enum CampaignEventType {
  CREATED = 'campaign.created',
  UPDATED = 'campaign.updated',
  STATUS_CHANGED = 'campaign.status_changed',
  PARTICIPANT_APPLIED = 'campaign.participant_applied',
  PARTICIPANT_APPROVED = 'campaign.participant_approved',
  PARTICIPANT_REJECTED = 'campaign.participant_rejected',
  CONTENT_SUBMITTED = 'campaign.content_submitted',
  CONTENT_APPROVED = 'campaign.content_approved',
  CONTENT_REJECTED = 'campaign.content_rejected',
  BUDGET_UPDATED = 'campaign.budget_updated',
  METRICS_UPDATED = 'campaign.metrics_updated'
}

// ===== Export all types =====
export type {
  ID,
  Money,
  EntityMetadata
} from '@company/types';