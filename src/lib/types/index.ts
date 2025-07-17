// Mock types for database entities until Prisma is properly set up

export enum CampaignStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum UserType {
  BUSINESS = 'BUSINESS',
  INFLUENCER = 'INFLUENCER',
  ADMIN = 'ADMIN'
}

export enum ApplicationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export enum PaymentType {
  CAMPAIGN_FEE = 'CAMPAIGN_FEE',
  COMMISSION = 'COMMISSION',
  BONUS = 'BONUS',
  SETTLEMENT = 'SETTLEMENT'
}

// Types are already exported above