import { z } from 'zod';
export type UserType = 'business' | 'influencer';
export type UserRole = 'user' | 'admin' | 'super_admin';
export type UserStatus = 'active' | 'pending' | 'suspended' | 'deleted';
export declare const BasicProfileSchema: z.ZodObject<{
    firstName: z.ZodString;
    lastName: z.ZodString;
    avatar: z.ZodOptional<z.ZodString>;
    bio: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    firstName: string;
    lastName: string;
    avatar?: string | undefined;
    bio?: string | undefined;
}, {
    firstName: string;
    lastName: string;
    avatar?: string | undefined;
    bio?: string | undefined;
}>;
export declare const UserRegistrationSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    type: z.ZodEnum<["business", "influencer"]>;
    profile: z.ZodObject<{
        firstName: z.ZodString;
        lastName: z.ZodString;
        avatar: z.ZodOptional<z.ZodString>;
        bio: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        firstName: string;
        lastName: string;
        avatar?: string | undefined;
        bio?: string | undefined;
    }, {
        firstName: string;
        lastName: string;
        avatar?: string | undefined;
        bio?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    type: "business" | "influencer";
    email: string;
    password: string;
    profile: {
        firstName: string;
        lastName: string;
        avatar?: string | undefined;
        bio?: string | undefined;
    };
}, {
    type: "business" | "influencer";
    email: string;
    password: string;
    profile: {
        firstName: string;
        lastName: string;
        avatar?: string | undefined;
        bio?: string | undefined;
    };
}>;
export declare const LoginCredentialsSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const PasswordChangeSchema: z.ZodObject<{
    currentPassword: z.ZodString;
    newPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    currentPassword: string;
    newPassword: string;
}, {
    currentPassword: string;
    newPassword: string;
}>;
export interface UserRegistration extends z.infer<typeof UserRegistrationSchema> {
}
export interface LoginCredentials extends z.infer<typeof LoginCredentialsSchema> {
}
export interface PasswordChange extends z.infer<typeof PasswordChangeSchema> {
}
export interface BasicProfile extends z.infer<typeof BasicProfileSchema> {
}
export interface TokenPayload {
    userId: string;
    email: string;
    type: UserType;
    role: UserRole;
    iat: number;
    exp: number;
}
export interface TokenPair {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}
export interface AuthResult {
    user: {
        id: string;
        email: string;
        type: UserType;
        role: UserRole;
        status: UserStatus;
        profile: BasicProfile;
    };
    tokens: TokenPair;
    isFirstLogin: boolean;
}
export interface TwoFactorSetup {
    qrCode: string;
    secret: string;
    backupCodes: string[];
}
export interface LoginHistory {
    id: string;
    userId: string;
    ipAddress: string;
    userAgent: string;
    loginAt: Date;
    success: boolean;
    location?: {
        country: string;
        city: string;
    };
}
export interface Permission {
    resource: string;
    action: string;
    granted: boolean;
}
export type OAuthProvider = 'google' | 'facebook' | 'instagram' | 'youtube' | 'tiktok';
export interface SocialLoginData {
    provider: OAuthProvider;
    token: string;
    type: UserType;
}
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: any;
    };
}
export type Result<T, E = Error> = {
    success: true;
    data: T;
} | {
    success: false;
    error: E;
};
export declare class AuthError extends Error {
    code: string;
    statusCode: number;
    constructor(message: string, code: string, statusCode?: number);
}
export interface AuthConfig {
    jwt: {
        secret: string;
        accessTokenExpiry: string;
        refreshTokenExpiry: string;
    };
    oauth: {
        google: {
            clientId: string;
            clientSecret: string;
        };
        facebook: {
            appId: string;
            appSecret: string;
        };
    };
    twoFactor: {
        issuer: string;
        window: number;
    };
    security: {
        bcryptRounds: number;
        maxLoginAttempts: number;
        lockoutDuration: number;
    };
}
//# sourceMappingURL=index.d.ts.map