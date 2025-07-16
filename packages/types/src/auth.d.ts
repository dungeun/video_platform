/**
 * @repo/types - 인증/인가 타입
 */
import { ID, EntityMetadata, ContactInfo } from './common';
export interface User extends EntityMetadata {
    id: ID;
    email: string;
    username?: string;
    displayName: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    bio?: string;
    status: UserStatus;
    emailVerified: boolean;
    phoneVerified: boolean;
    twoFactorEnabled: boolean;
    lastLoginAt?: Date;
    lastActiveAt?: Date;
    roles: Role[];
    permissions: Permission[];
    profile: UserProfile;
    preferences: UserPreferences;
    security: UserSecurity;
}
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending' | 'deleted';
export interface UserProfile {
    phone?: string;
    birthDate?: Date;
    gender?: Gender;
    nationality?: string;
    language: string;
    timezone: string;
    address?: {
        country: string;
        state?: string;
        city: string;
        street?: string;
        postalCode?: string;
    };
    contacts?: ContactInfo;
    socialLinks?: SocialLinks;
    occupation?: string;
    company?: string;
    department?: string;
    position?: string;
}
export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';
export interface SocialLinks {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
    github?: string;
    website?: string;
}
export interface UserPreferences {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    timezone: string;
    dateFormat: string;
    timeFormat: string;
    currency: string;
    notifications: NotificationPreferences;
    privacy: PrivacyPreferences;
    accessibility: AccessibilityPreferences;
}
export interface NotificationPreferences {
    email: boolean;
    push: boolean;
    sms: boolean;
    inApp: boolean;
    marketing: boolean;
    digest: 'realtime' | 'hourly' | 'daily' | 'weekly' | 'never';
}
export interface PrivacyPreferences {
    profileVisibility: 'public' | 'friends' | 'private';
    showEmail: boolean;
    showPhone: boolean;
    showLastSeen: boolean;
    allowDirectMessages: boolean;
    allowFriendRequests: boolean;
}
export interface AccessibilityPreferences {
    fontSize: 'small' | 'medium' | 'large' | 'xlarge';
    highContrast: boolean;
    reduceMotion: boolean;
    screenReader: boolean;
    keyboardNavigation: boolean;
}
export interface UserSecurity {
    lastPasswordChange?: Date;
    passwordExpiresAt?: Date;
    failedLoginAttempts: number;
    lockedUntil?: Date;
    ipWhitelist?: string[];
    trustedDevices: TrustedDevice[];
    sessions: UserSession[];
    auditLog: SecurityAuditLog[];
}
export interface TrustedDevice {
    id: ID;
    name: string;
    fingerprint: string;
    userAgent: string;
    ipAddress: string;
    trustedAt: Date;
    lastUsedAt: Date;
}
export interface UserSession {
    id: ID;
    userId: ID;
    token: string;
    refreshToken?: string;
    deviceInfo: DeviceInfo;
    ipAddress: string;
    userAgent: string;
    createdAt: Date;
    expiresAt: Date;
    lastActivityAt: Date;
    isActive: boolean;
}
export interface DeviceInfo {
    type: DeviceType;
    os: string;
    osVersion: string;
    browser?: string;
    browserVersion?: string;
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
}
export type DeviceType = 'mobile' | 'tablet' | 'desktop' | 'tv' | 'watch' | 'unknown';
export interface Role {
    id: ID;
    name: string;
    displayName: string;
    description?: string;
    level: number;
    permissions: Permission[];
    isSystemRole: boolean;
    isDefault: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface Permission {
    id: ID;
    name: string;
    resource: string;
    action: PermissionAction;
    conditions?: PermissionCondition[];
    description?: string;
}
export type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'list' | 'execute' | '*';
export interface PermissionCondition {
    field: string;
    operator: 'eq' | 'ne' | 'in' | 'nin' | 'gt' | 'gte' | 'lt' | 'lte';
    value: any;
}
export interface LoginCredentials {
    email?: string;
    username?: string;
    password: string;
    rememberMe?: boolean;
    deviceInfo?: Partial<DeviceInfo>;
}
export interface LoginResponse {
    success: boolean;
    user?: User;
    session?: UserSession;
    tokens?: AuthTokens;
    requiresTwoFactor?: boolean;
    error?: string;
}
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    tokenType: 'Bearer';
    expiresIn: number;
    scope?: string[];
}
export interface TwoFactorChallenge {
    type: TwoFactorType;
    challenge: string;
    expiresAt: Date;
}
export type TwoFactorType = 'totp' | 'sms' | 'email' | 'backup_code';
export interface SocialProvider {
    provider: SocialProviderType;
    providerId: string;
    email?: string;
    name?: string;
    avatar?: string;
    accessToken: string;
    refreshToken?: string;
    expiresAt?: Date;
}
export type SocialProviderType = 'google' | 'facebook' | 'apple' | 'github' | 'linkedin' | 'twitter';
export interface PasswordPolicy {
    minLength: number;
    maxLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSymbols: boolean;
    preventReuse: number;
    maxAge: number;
    complexity: PasswordComplexity;
}
export type PasswordComplexity = 'weak' | 'medium' | 'strong' | 'very_strong';
export interface PasswordResetRequest {
    email: string;
    token: string;
    expiresAt: Date;
    usedAt?: Date;
    ipAddress: string;
    userAgent: string;
}
export interface EmailVerification {
    email: string;
    token: string;
    expiresAt: Date;
    verifiedAt?: Date;
    attempts: number;
}
export interface SecurityAuditLog {
    id: ID;
    userId: ID;
    action: SecurityAction;
    result: 'success' | 'failure' | 'blocked';
    details: Record<string, any>;
    ipAddress: string;
    userAgent: string;
    timestamp: Date;
    riskScore?: number;
}
export type SecurityAction = 'login' | 'logout' | 'password_change' | 'password_reset' | 'email_verify' | 'two_factor_enable' | 'two_factor_disable' | 'session_create' | 'session_destroy' | 'permission_grant' | 'permission_revoke' | 'account_lock' | 'account_unlock';
export interface ApiKey {
    id: ID;
    name: string;
    key: string;
    hashedKey: string;
    userId: ID;
    permissions: string[];
    ipWhitelist?: string[];
    expiresAt?: Date;
    lastUsedAt?: Date;
    isActive: boolean;
    createdAt: Date;
}
export interface Organization {
    id: ID;
    name: string;
    slug: string;
    description?: string;
    logo?: string;
    website?: string;
    industry?: string;
    size?: OrganizationSize;
    address?: {
        country: string;
        state?: string;
        city: string;
        street: string;
        postalCode: string;
    };
    contacts: ContactInfo;
    settings: OrganizationSettings;
    plan: SubscriptionPlan;
    createdAt: Date;
    updatedAt: Date;
}
export type OrganizationSize = 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
export interface OrganizationSettings {
    allowUserRegistration: boolean;
    requireEmailVerification: boolean;
    defaultRole: string;
    passwordPolicy: PasswordPolicy;
    sessionTimeout: number;
    maxSessions: number;
    twoFactorRequired: boolean;
}
export interface SubscriptionPlan {
    id: ID;
    name: string;
    tier: 'free' | 'basic' | 'pro' | 'enterprise';
    maxUsers: number;
    maxStorage: number;
    features: string[];
    price: {
        amount: number;
        currency: string;
        period: 'monthly' | 'yearly';
    };
    startDate: Date;
    endDate?: Date;
    autoRenew: boolean;
}
export interface TeamMember {
    userId: ID;
    organizationId: ID;
    role: string;
    joinedAt: Date;
    invitedBy?: ID;
    status: 'active' | 'inactive' | 'pending' | 'suspended';
}
export interface Invitation {
    id: ID;
    email: string;
    organizationId: ID;
    invitedBy: ID;
    role: string;
    token: string;
    expiresAt: Date;
    acceptedAt?: Date;
    status: 'pending' | 'accepted' | 'expired' | 'cancelled';
    createdAt: Date;
}
//# sourceMappingURL=auth.d.ts.map