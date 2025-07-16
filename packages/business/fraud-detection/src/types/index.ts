export interface FraudDetectionConfig {
  ml?: MLConfig;
  rules?: RulesConfig;
  blocking?: BlockingConfig;
  monitoring?: MonitoringConfig;
  external?: ExternalAPIConfig;
}

export interface MLConfig {
  modelPath?: string;
  enableTraining?: boolean;
  trainingSchedule?: string;
  algorithms?: {
    anomalyDetection?: 'isolation_forest' | 'one_class_svm' | 'local_outlier_factor';
    classification?: 'random_forest' | 'gradient_boosting' | 'neural_network';
  };
}

export interface RulesConfig {
  followerSpike?: {
    threshold: number;
    timeWindow: number; // hours
  };
  engagementAnomaly?: {
    threshold: number; // standard deviations
    minSamples: number;
  };
  contentFraud?: {
    duplicateThreshold: number;
    deepfakeDetection: boolean;
  };
}

export interface BlockingConfig {
  autoBlock: boolean;
  reviewThreshold: number;
  whitelistUsers?: string[];
  blacklistUsers?: string[];
}

export interface MonitoringConfig {
  enabled: boolean;
  platforms: string[];
  checkInterval: number; // milliseconds
  alertThreshold: number;
}

export interface ExternalAPIConfig {
  socialVerifyApiKey?: string;
  imageSearchApiKey?: string;
  textAnalysisApiKey?: string;
}

// Analysis Types
export interface InfluencerAnalysisParams {
  userId: string;
  socialAccounts: SocialAccount[];
  recentPosts?: Post[];
  historicalData?: HistoricalData;
}

export interface SocialAccount {
  platform: 'instagram' | 'youtube' | 'tiktok' | 'twitter';
  username: string;
  followers: number;
  following: number;
  posts: number;
  verified?: boolean;
  createdAt?: Date;
  profileImage?: string;
  bio?: string;
}

export interface Post {
  id: string;
  platform: string;
  content?: string;
  mediaUrl?: string;
  likes: number;
  comments: number;
  views?: number;
  shares?: number;
  timestamp: Date;
  hashtags?: string[];
}

export interface HistoricalData {
  followerHistory: DataPoint[];
  engagementHistory: DataPoint[];
  contentHistory: ContentHistory[];
}

export interface DataPoint {
  timestamp: Date;
  value: number;
}

export interface ContentHistory {
  date: Date;
  postCount: number;
  totalEngagement: number;
  avgEngagement: number;
}

// Analysis Results
export interface FraudAnalysis {
  userId: string;
  riskScore: number; // 0-1
  confidence: number; // 0-1
  detectedIssues: FraudIssue[];
  recommendations: string[];
  autoBlock: boolean;
  timestamp: Date;
  analysisDetails: AnalysisDetails;
}

export interface FraudIssue {
  type: FraudType;
  severity: Severity;
  description: string;
  evidence: Evidence[];
  confidence: number;
  score: number;
}

export enum FraudType {
  FAKE_FOLLOWERS = 'fake_followers',
  ENGAGEMENT_FRAUD = 'engagement_fraud',
  CONTENT_MANIPULATION = 'content_manipulation',
  BOT_ACTIVITY = 'bot_activity',
  SUSPICIOUS_BEHAVIOR = 'suspicious_behavior',
  PAYMENT_FRAUD = 'payment_fraud',
  ACCOUNT_FRAUD = 'account_fraud'
}

export enum Severity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface Evidence {
  type: string;
  description: string;
  data: any;
  weight: number;
}

export interface AnalysisDetails {
  followerAnalysis?: FollowerAnalysis;
  engagementAnalysis?: EngagementAnalysis;
  contentAnalysis?: ContentAnalysis;
  behaviorAnalysis?: BehaviorAnalysis;
}

// Specific Analysis Types
export interface FollowerAnalysisParams {
  userId: string;
  platform: string;
  sampleSize?: number;
  deepAnalysis?: boolean;
}

export interface FollowerAnalysis {
  totalFollowers: number;
  analyzedSample: number;
  fakePercentage: number;
  botIndicators: BotIndicator[];
  redFlags: RedFlag[];
  profileScores: ProfileScore[];
  confidence: number;
}

export interface BotIndicator {
  type: 'profile_incomplete' | 'username_pattern' | 'activity_pattern' | 'network_pattern';
  count: number;
  percentage: number;
  examples: string[];
}

export interface RedFlag {
  type: string;
  description: string;
  severity: Severity;
  count: number;
}

export interface ProfileScore {
  followerId: string;
  username: string;
  profileScore: number;
  activityScore: number;
  networkScore: number;
  overallScore: number;
  isFake: boolean;
}

export interface EngagementAnalysisParams {
  userId: string;
  posts: Post[];
  timeframe?: number; // days
}

export interface EngagementAnalysis {
  averageEngagementRate: number;
  engagementPattern: EngagementPattern;
  anomalies: EngagementAnomaly[];
  suspiciousActivity: SuspiciousActivity[];
  score: number;
}

export interface EngagementPattern {
  consistency: number;
  timing: TimingAnalysis;
  quality: QualityAnalysis;
}

export interface TimingAnalysis {
  peakHours: number[];
  irregularSpikes: SpikeEvent[];
  botLikePatterns: boolean;
}

export interface QualityAnalysis {
  commentQuality: number;
  likeToCommentRatio: number;
  engagementVelocity: number;
}

export interface EngagementAnomaly {
  postId: string;
  type: 'spike' | 'drop' | 'pattern';
  severity: number;
  description: string;
  evidence: any;
}

export interface SuspiciousActivity {
  type: string;
  description: string;
  confidence: number;
  posts: string[];
}

export interface SpikeEvent {
  timestamp: Date;
  magnitude: number;
  duration: number; // minutes
  suspicious: boolean;
}

export interface ContentAnalysisParams {
  contentId: string;
  platform: string;
  content?: string;
  mediaUrl?: string;
  metrics: {
    likes: number;
    comments: number;
    views?: number;
    shares?: number;
  };
  timestamp: Date;
  accountMetrics: {
    followers: number;
    avgLikes: number;
    avgComments: number;
  };
}

export interface ContentAnalysis {
  contentId: string;
  isSuspicious: boolean;
  anomalies: ContentAnomaly[];
  authenticity: AuthenticityCheck;
  engagement: EngagementAnalysis;
  score: number;
}

export interface ContentAnomaly {
  type: 'engagement_manipulation' | 'duplicate_content' | 'fake_metrics' | 'timing_fraud';
  severity: Severity;
  description: string;
  confidence: number;
}

export interface AuthenticityCheck {
  isOriginal: boolean;
  duplicateMatches: DuplicateMatch[];
  deepfakeScore?: number;
  manipulationSignals: ManipulationSignal[];
}

export interface DuplicateMatch {
  source: string;
  similarity: number;
  url?: string;
}

export interface ManipulationSignal {
  type: string;
  confidence: number;
  description: string;
}

export interface PaymentAnalysisParams {
  userId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  ipAddress: string;
  userAgent: string;
  billingAddress?: Address;
  previousPayments?: PaymentHistory[];
}

export interface Address {
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
}

export interface PaymentHistory {
  amount: number;
  timestamp: Date;
  status: 'success' | 'failed' | 'chargeback';
  paymentMethod: string;
}

export interface PaymentAnalysis {
  isFraudulent: boolean;
  riskScore: number;
  reasons: string[];
  recommendations: string[];
  allowPayment: boolean;
  requiresVerification: boolean;
}

// Batch Analysis
export interface BatchAnalysisParams {
  userIds: string[];
  analysisType: 'basic' | 'comprehensive' | 'followers_only' | 'content_only';
  parallel?: boolean;
  batchSize?: number;
}

export interface BatchResult {
  totalAnalyzed: number;
  completed: number;
  failed: number;
  results: BatchAnalysisResult[];
  summary: BatchSummary;
}

export interface BatchAnalysisResult {
  userId: string;
  status: 'success' | 'failed';
  analysis?: FraudAnalysis;
  error?: string;
}

export interface BatchSummary {
  highRiskUsers: number;
  mediumRiskUsers: number;
  lowRiskUsers: number;
  blockedUsers: number;
  averageRiskScore: number;
}

// Rules and ML
export interface FraudRule {
  id: string;
  name: string;
  description?: string;
  type: FraudType;
  condition: (data: any) => boolean;
  severity: Severity;
  action: RuleAction;
  enabled: boolean;
  weight: number;
  createdAt: Date;
  updatedAt: Date;
}

export enum RuleAction {
  FLAG = 'flag',
  REVIEW = 'review',
  BLOCK = 'block',
  ALERT = 'alert'
}

export interface MLModel {
  id: string;
  name: string;
  type: 'anomaly_detection' | 'classification' | 'regression';
  algorithm: string;
  features: string[];
  accuracy?: number;
  trainedAt?: Date;
  version: number;
}

export interface TrainingParams {
  dataset: string | any[];
  features: string[];
  algorithm: string;
  hyperparameters?: Record<string, any>;
  validationSplit?: number;
}

// Monitoring and Alerts
export interface FraudAlert {
  id: string;
  type: FraudType;
  userId: string;
  riskScore: number;
  severity: Severity;
  details: string;
  autoBlock: boolean;
  timestamp: Date;
  resolved?: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export interface AlertRule {
  id: string;
  name: string;
  trigger: AlertTrigger;
  actions: AlertAction[];
  enabled: boolean;
}

export interface AlertTrigger {
  condition: string;
  threshold: number;
  timeWindow?: number;
}

export interface AlertAction {
  type: 'email' | 'webhook' | 'block' | 'flag';
  target: string;
  parameters?: Record<string, any>;
}

// Behavior Analysis
export interface BehaviorAnalysis {
  loginPatterns: LoginPattern[];
  activityPatterns: ActivityPattern[];
  communicationPatterns: CommunicationPattern[];
  suspiciousActivities: SuspiciousActivity[];
  riskScore: number;
}

export interface LoginPattern {
  ipAddresses: string[];
  locations: string[];
  devices: string[];
  timingPattern: number[]; // hours of day
  irregularities: string[];
}

export interface ActivityPattern {
  actionVelocity: number;
  actionTypes: Record<string, number>;
  sessionDuration: number;
  inhuman: boolean;
}

export interface CommunicationPattern {
  messageCount: number;
  spamScore: number;
  suspiciousKeywords: string[];
  sentimentScore: number;
}

// Error Types
export class FraudDetectionError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'FraudDetectionError';
  }
}

export class ModelError extends FraudDetectionError {
  constructor(message: string) {
    super(message, 'MODEL_ERROR');
    this.name = 'ModelError';
  }
}

export class AnalysisError extends FraudDetectionError {
  constructor(message: string) {
    super(message, 'ANALYSIS_ERROR');
    this.name = 'AnalysisError';
  }
}

export class RuleError extends FraudDetectionError {
  constructor(message: string) {
    super(message, 'RULE_ERROR');
    this.name = 'RuleError';
  }
}