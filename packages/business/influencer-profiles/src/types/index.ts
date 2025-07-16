export interface InfluencerProfile {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  email: string;
  phone?: string;
  bio: string;
  avatar?: string;
  coverImage?: string;
  category: InfluencerCategory[];
  tags: string[];
  location: Location;
  languages: string[];
  status: ProfileStatus;
  verification: VerificationStatus;
  socialAccounts: SocialAccount[];
  metrics: InfluencerMetrics;
  portfolio: Portfolio;
  pricing: PricingInfo;
  availability: AvailabilityInfo;
  createdAt: Date;
  updatedAt: Date;
}

export interface SocialAccount {
  platform: SocialPlatform;
  handle: string;
  url: string;
  verified: boolean;
  followers: number;
  engagement: number;
  lastUpdated: Date;
}

export interface InfluencerMetrics {
  totalFollowers: number;
  averageEngagement: number;
  reachEstimate: number;
  audienceDemographics: AudienceDemographics;
  contentPerformance: ContentPerformance;
  growthRate: number;
}

export interface AudienceDemographics {
  ageGroups: Record<string, number>;
  gender: Record<string, number>;
  locations: Record<string, number>;
  interests: string[];
}

export interface ContentPerformance {
  averageLikes: number;
  averageComments: number;
  averageShares: number;
  topPerformingContent: ContentItem[];
}

export interface ContentItem {
  id: string;
  platform: SocialPlatform;
  type: ContentType;
  url: string;
  thumbnail?: string;
  metrics: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
  };
  createdAt: Date;
}

export interface Portfolio {
  campaigns: PortfolioCampaign[];
  media: MediaItem[];
  testimonials: Testimonial[];
}

export interface PortfolioCampaign {
  id: string;
  title: string;
  brand: string;
  description: string;
  results: string;
  media: string[];
  date: Date;
}

export interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
  caption?: string;
  tags: string[];
  createdAt: Date;
}

export interface Testimonial {
  id: string;
  brandName: string;
  brandLogo?: string;
  content: string;
  rating: number;
  date: Date;
}

export interface PricingInfo {
  baseRate: number;
  currency: string;
  packages: PricingPackage[];
  customQuoteAvailable: boolean;
}

export interface PricingPackage {
  id: string;
  name: string;
  description: string;
  price: number;
  deliverables: string[];
}

export interface AvailabilityInfo {
  isAvailable: boolean;
  nextAvailableDate?: Date;
  blackoutDates: DateRange[];
  responseTime: string;
}

export interface DateRange {
  start: Date;
  end: Date;
  reason?: string;
}

export interface Location {
  country: string;
  city: string;
  timezone: string;
}

export interface VerificationStatus {
  isVerified: boolean;
  verifiedAt?: Date;
  documents: VerificationDocument[];
  level: VerificationLevel;
}

export interface VerificationDocument {
  type: DocumentType;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
  reviewedAt?: Date;
  notes?: string;
}

export type InfluencerCategory = 
  | 'fashion'
  | 'beauty'
  | 'lifestyle'
  | 'food'
  | 'travel'
  | 'fitness'
  | 'tech'
  | 'gaming'
  | 'parenting'
  | 'business'
  | 'education'
  | 'entertainment';

export type SocialPlatform = 
  | 'instagram'
  | 'youtube'
  | 'tiktok'
  | 'twitter'
  | 'facebook'
  | 'linkedin'
  | 'pinterest'
  | 'twitch';

export type ProfileStatus = 
  | 'active'
  | 'inactive'
  | 'suspended'
  | 'pending';

export type VerificationLevel = 
  | 'basic'
  | 'verified'
  | 'premium'
  | 'elite';

export type DocumentType = 
  | 'identity'
  | 'address'
  | 'tax'
  | 'business';

export type ContentType = 
  | 'post'
  | 'story'
  | 'reel'
  | 'video'
  | 'live';

export interface ProfileFilter {
  categories?: InfluencerCategory[];
  platforms?: SocialPlatform[];
  minFollowers?: number;
  maxFollowers?: number;
  minEngagement?: number;
  maxEngagement?: number;
  location?: {
    country?: string;
    city?: string;
  };
  languages?: string[];
  verificationLevel?: VerificationLevel[];
  priceRange?: {
    min?: number;
    max?: number;
  };
  availability?: boolean;
  tags?: string[];
}

export interface ProfileSearchParams {
  query?: string;
  filter?: ProfileFilter;
  sort?: ProfileSortOption;
  page?: number;
  limit?: number;
}

export type ProfileSortOption = 
  | 'relevance'
  | 'followers_desc'
  | 'followers_asc'
  | 'engagement_desc'
  | 'engagement_asc'
  | 'price_desc'
  | 'price_asc'
  | 'rating_desc'
  | 'created_desc';