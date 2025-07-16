/**
 * @company/types - Zod 검증 스키마
 */
import { z } from 'zod';
export declare const IdSchema: z.ZodString;
export declare const UuidSchema: z.ZodString;
export declare const EmailSchema: z.ZodString;
export declare const UrlSchema: z.ZodString;
export declare const TimestampSchema: z.ZodNumber;
export declare const DateStringSchema: z.ZodString;
export declare const MoneySchema: z.ZodObject<{
    amount: z.ZodNumber;
    currency: z.ZodEnum<["KRW", "USD", "EUR", "JPY", "CNY"]>;
}, "strip", z.ZodTypeAny, {
    currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
    amount: number;
}, {
    currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
    amount: number;
}>;
export declare const AddressSchema: z.ZodObject<{
    country: z.ZodString;
    state: z.ZodOptional<z.ZodString>;
    city: z.ZodString;
    district: z.ZodOptional<z.ZodString>;
    street: z.ZodString;
    detail: z.ZodOptional<z.ZodString>;
    postalCode: z.ZodString;
    latitude: z.ZodOptional<z.ZodNumber>;
    longitude: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    street: string;
    city: string;
    country: string;
    postalCode: string;
    state?: string | undefined;
    district?: string | undefined;
    detail?: string | undefined;
    latitude?: number | undefined;
    longitude?: number | undefined;
}, {
    street: string;
    city: string;
    country: string;
    postalCode: string;
    state?: string | undefined;
    district?: string | undefined;
    detail?: string | undefined;
    latitude?: number | undefined;
    longitude?: number | undefined;
}>;
export declare const ContactInfoSchema: z.ZodObject<{
    phone: z.ZodOptional<z.ZodString>;
    mobile: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    fax: z.ZodOptional<z.ZodString>;
    website: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email?: string | undefined;
    phone?: string | undefined;
    mobile?: string | undefined;
    fax?: string | undefined;
    website?: string | undefined;
}, {
    email?: string | undefined;
    phone?: string | undefined;
    mobile?: string | undefined;
    fax?: string | undefined;
    website?: string | undefined;
}>;
export declare const FileInfoSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    originalName: z.ZodString;
    mimeType: z.ZodString;
    size: z.ZodNumber;
    url: z.ZodString;
    thumbnailUrl: z.ZodOptional<z.ZodString>;
    uploadedAt: z.ZodDate;
    uploadedBy: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodObject<{
        width: z.ZodOptional<z.ZodNumber>;
        height: z.ZodOptional<z.ZodNumber>;
        duration: z.ZodOptional<z.ZodNumber>;
        encoding: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        duration?: number | undefined;
        width?: number | undefined;
        height?: number | undefined;
        encoding?: string | undefined;
    }, {
        duration?: number | undefined;
        width?: number | undefined;
        height?: number | undefined;
        encoding?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    url: string;
    id: string;
    size: number;
    name: string;
    originalName: string;
    mimeType: string;
    uploadedAt: Date;
    metadata?: {
        duration?: number | undefined;
        width?: number | undefined;
        height?: number | undefined;
        encoding?: string | undefined;
    } | undefined;
    thumbnailUrl?: string | undefined;
    uploadedBy?: string | undefined;
}, {
    url: string;
    id: string;
    size: number;
    name: string;
    originalName: string;
    mimeType: string;
    uploadedAt: Date;
    metadata?: {
        duration?: number | undefined;
        width?: number | undefined;
        height?: number | undefined;
        encoding?: string | undefined;
    } | undefined;
    thumbnailUrl?: string | undefined;
    uploadedBy?: string | undefined;
}>;
export declare const EntityMetadataSchema: z.ZodObject<{
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
    createdBy: z.ZodOptional<z.ZodString>;
    updatedBy: z.ZodOptional<z.ZodString>;
    version: z.ZodNumber;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    createdAt: Date;
    updatedAt: Date;
    version: number;
    metadata?: Record<string, any> | undefined;
    tags?: string[] | undefined;
    createdBy?: string | undefined;
    updatedBy?: string | undefined;
}, {
    createdAt: Date;
    updatedAt: Date;
    version: number;
    metadata?: Record<string, any> | undefined;
    tags?: string[] | undefined;
    createdBy?: string | undefined;
    updatedBy?: string | undefined;
}>;
export declare const ErrorInfoSchema: z.ZodObject<{
    code: z.ZodString;
    message: z.ZodString;
    details: z.ZodOptional<z.ZodAny>;
    timestamp: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    message: string;
    code: string;
    timestamp: number;
    details?: any;
}, {
    message: string;
    code: string;
    timestamp: number;
    details?: any;
}>;
export declare const ResponseMetaSchema: z.ZodObject<{
    version: z.ZodString;
    requestId: z.ZodString;
    duration: z.ZodNumber;
    pagination: z.ZodOptional<z.ZodObject<{
        page: z.ZodNumber;
        limit: z.ZodNumber;
        total: z.ZodNumber;
        totalPages: z.ZodNumber;
        hasNext: z.ZodBoolean;
        hasPrev: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        total: number;
        limit: number;
        page: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    }, {
        total: number;
        limit: number;
        page: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    }>>;
}, "strip", z.ZodTypeAny, {
    duration: number;
    version: string;
    requestId: string;
    pagination?: {
        total: number;
        limit: number;
        page: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    } | undefined;
}, {
    duration: number;
    version: string;
    requestId: string;
    pagination?: {
        total: number;
        limit: number;
        page: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    } | undefined;
}>;
export declare const ResponseSchema: <T extends z.ZodTypeAny>(dataSchema: T) => z.ZodObject<{
    success: z.ZodBoolean;
    data: z.ZodOptional<T>;
    error: z.ZodOptional<z.ZodObject<{
        code: z.ZodString;
        message: z.ZodString;
        details: z.ZodOptional<z.ZodAny>;
        timestamp: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        message: string;
        code: string;
        timestamp: number;
        details?: any;
    }, {
        message: string;
        code: string;
        timestamp: number;
        details?: any;
    }>>;
    meta: z.ZodOptional<z.ZodObject<{
        version: z.ZodString;
        requestId: z.ZodString;
        duration: z.ZodNumber;
        pagination: z.ZodOptional<z.ZodObject<{
            page: z.ZodNumber;
            limit: z.ZodNumber;
            total: z.ZodNumber;
            totalPages: z.ZodNumber;
            hasNext: z.ZodBoolean;
            hasPrev: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            total: number;
            limit: number;
            page: number;
            totalPages: number;
            hasNext: boolean;
            hasPrev: boolean;
        }, {
            total: number;
            limit: number;
            page: number;
            totalPages: number;
            hasNext: boolean;
            hasPrev: boolean;
        }>>;
    }, "strip", z.ZodTypeAny, {
        duration: number;
        version: string;
        requestId: string;
        pagination?: {
            total: number;
            limit: number;
            page: number;
            totalPages: number;
            hasNext: boolean;
            hasPrev: boolean;
        } | undefined;
    }, {
        duration: number;
        version: string;
        requestId: string;
        pagination?: {
            total: number;
            limit: number;
            page: number;
            totalPages: number;
            hasNext: boolean;
            hasPrev: boolean;
        } | undefined;
    }>>;
}, "strip", z.ZodTypeAny, z.objectUtil.addQuestionMarks<z.baseObjectOutputType<{
    success: z.ZodBoolean;
    data: z.ZodOptional<T>;
    error: z.ZodOptional<z.ZodObject<{
        code: z.ZodString;
        message: z.ZodString;
        details: z.ZodOptional<z.ZodAny>;
        timestamp: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        message: string;
        code: string;
        timestamp: number;
        details?: any;
    }, {
        message: string;
        code: string;
        timestamp: number;
        details?: any;
    }>>;
    meta: z.ZodOptional<z.ZodObject<{
        version: z.ZodString;
        requestId: z.ZodString;
        duration: z.ZodNumber;
        pagination: z.ZodOptional<z.ZodObject<{
            page: z.ZodNumber;
            limit: z.ZodNumber;
            total: z.ZodNumber;
            totalPages: z.ZodNumber;
            hasNext: z.ZodBoolean;
            hasPrev: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            total: number;
            limit: number;
            page: number;
            totalPages: number;
            hasNext: boolean;
            hasPrev: boolean;
        }, {
            total: number;
            limit: number;
            page: number;
            totalPages: number;
            hasNext: boolean;
            hasPrev: boolean;
        }>>;
    }, "strip", z.ZodTypeAny, {
        duration: number;
        version: string;
        requestId: string;
        pagination?: {
            total: number;
            limit: number;
            page: number;
            totalPages: number;
            hasNext: boolean;
            hasPrev: boolean;
        } | undefined;
    }, {
        duration: number;
        version: string;
        requestId: string;
        pagination?: {
            total: number;
            limit: number;
            page: number;
            totalPages: number;
            hasNext: boolean;
            hasPrev: boolean;
        } | undefined;
    }>>;
}>, any> extends infer T_1 ? { [k in keyof T_1]: z.objectUtil.addQuestionMarks<z.baseObjectOutputType<{
    success: z.ZodBoolean;
    data: z.ZodOptional<T>;
    error: z.ZodOptional<z.ZodObject<{
        code: z.ZodString;
        message: z.ZodString;
        details: z.ZodOptional<z.ZodAny>;
        timestamp: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        message: string;
        code: string;
        timestamp: number;
        details?: any;
    }, {
        message: string;
        code: string;
        timestamp: number;
        details?: any;
    }>>;
    meta: z.ZodOptional<z.ZodObject<{
        version: z.ZodString;
        requestId: z.ZodString;
        duration: z.ZodNumber;
        pagination: z.ZodOptional<z.ZodObject<{
            page: z.ZodNumber;
            limit: z.ZodNumber;
            total: z.ZodNumber;
            totalPages: z.ZodNumber;
            hasNext: z.ZodBoolean;
            hasPrev: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            total: number;
            limit: number;
            page: number;
            totalPages: number;
            hasNext: boolean;
            hasPrev: boolean;
        }, {
            total: number;
            limit: number;
            page: number;
            totalPages: number;
            hasNext: boolean;
            hasPrev: boolean;
        }>>;
    }, "strip", z.ZodTypeAny, {
        duration: number;
        version: string;
        requestId: string;
        pagination?: {
            total: number;
            limit: number;
            page: number;
            totalPages: number;
            hasNext: boolean;
            hasPrev: boolean;
        } | undefined;
    }, {
        duration: number;
        version: string;
        requestId: string;
        pagination?: {
            total: number;
            limit: number;
            page: number;
            totalPages: number;
            hasNext: boolean;
            hasPrev: boolean;
        } | undefined;
    }>>;
}>, any>[k]; } : never, z.baseObjectInputType<{
    success: z.ZodBoolean;
    data: z.ZodOptional<T>;
    error: z.ZodOptional<z.ZodObject<{
        code: z.ZodString;
        message: z.ZodString;
        details: z.ZodOptional<z.ZodAny>;
        timestamp: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        message: string;
        code: string;
        timestamp: number;
        details?: any;
    }, {
        message: string;
        code: string;
        timestamp: number;
        details?: any;
    }>>;
    meta: z.ZodOptional<z.ZodObject<{
        version: z.ZodString;
        requestId: z.ZodString;
        duration: z.ZodNumber;
        pagination: z.ZodOptional<z.ZodObject<{
            page: z.ZodNumber;
            limit: z.ZodNumber;
            total: z.ZodNumber;
            totalPages: z.ZodNumber;
            hasNext: z.ZodBoolean;
            hasPrev: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            total: number;
            limit: number;
            page: number;
            totalPages: number;
            hasNext: boolean;
            hasPrev: boolean;
        }, {
            total: number;
            limit: number;
            page: number;
            totalPages: number;
            hasNext: boolean;
            hasPrev: boolean;
        }>>;
    }, "strip", z.ZodTypeAny, {
        duration: number;
        version: string;
        requestId: string;
        pagination?: {
            total: number;
            limit: number;
            page: number;
            totalPages: number;
            hasNext: boolean;
            hasPrev: boolean;
        } | undefined;
    }, {
        duration: number;
        version: string;
        requestId: string;
        pagination?: {
            total: number;
            limit: number;
            page: number;
            totalPages: number;
            hasNext: boolean;
            hasPrev: boolean;
        } | undefined;
    }>>;
}> extends infer T_2 ? { [k_1 in keyof T_2]: z.baseObjectInputType<{
    success: z.ZodBoolean;
    data: z.ZodOptional<T>;
    error: z.ZodOptional<z.ZodObject<{
        code: z.ZodString;
        message: z.ZodString;
        details: z.ZodOptional<z.ZodAny>;
        timestamp: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        message: string;
        code: string;
        timestamp: number;
        details?: any;
    }, {
        message: string;
        code: string;
        timestamp: number;
        details?: any;
    }>>;
    meta: z.ZodOptional<z.ZodObject<{
        version: z.ZodString;
        requestId: z.ZodString;
        duration: z.ZodNumber;
        pagination: z.ZodOptional<z.ZodObject<{
            page: z.ZodNumber;
            limit: z.ZodNumber;
            total: z.ZodNumber;
            totalPages: z.ZodNumber;
            hasNext: z.ZodBoolean;
            hasPrev: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            total: number;
            limit: number;
            page: number;
            totalPages: number;
            hasNext: boolean;
            hasPrev: boolean;
        }, {
            total: number;
            limit: number;
            page: number;
            totalPages: number;
            hasNext: boolean;
            hasPrev: boolean;
        }>>;
    }, "strip", z.ZodTypeAny, {
        duration: number;
        version: string;
        requestId: string;
        pagination?: {
            total: number;
            limit: number;
            page: number;
            totalPages: number;
            hasNext: boolean;
            hasPrev: boolean;
        } | undefined;
    }, {
        duration: number;
        version: string;
        requestId: string;
        pagination?: {
            total: number;
            limit: number;
            page: number;
            totalPages: number;
            hasNext: boolean;
            hasPrev: boolean;
        } | undefined;
    }>>;
}>[k_1]; } : never>;
export declare const PaginationParamsSchema: z.ZodObject<{
    page: z.ZodOptional<z.ZodNumber>;
    limit: z.ZodOptional<z.ZodNumber>;
    sort: z.ZodOptional<z.ZodString>;
    order: z.ZodOptional<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    sort?: string | undefined;
    order?: "asc" | "desc" | undefined;
    limit?: number | undefined;
    page?: number | undefined;
}, {
    sort?: string | undefined;
    order?: "asc" | "desc" | undefined;
    limit?: number | undefined;
    page?: number | undefined;
}>;
export declare const LoginCredentialsSchema: z.ZodEffects<z.ZodObject<{
    email: z.ZodOptional<z.ZodString>;
    username: z.ZodOptional<z.ZodString>;
    password: z.ZodString;
    rememberMe: z.ZodOptional<z.ZodBoolean>;
    deviceInfo: z.ZodOptional<z.ZodObject<{
        type: z.ZodOptional<z.ZodEnum<["mobile", "tablet", "desktop", "tv", "watch", "unknown"]>>;
        os: z.ZodOptional<z.ZodString>;
        osVersion: z.ZodOptional<z.ZodString>;
        browser: z.ZodOptional<z.ZodString>;
        browserVersion: z.ZodOptional<z.ZodString>;
        isMobile: z.ZodOptional<z.ZodBoolean>;
        isTablet: z.ZodOptional<z.ZodBoolean>;
        isDesktop: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        type?: "unknown" | "mobile" | "tablet" | "desktop" | "tv" | "watch" | undefined;
        os?: string | undefined;
        osVersion?: string | undefined;
        browser?: string | undefined;
        browserVersion?: string | undefined;
        isMobile?: boolean | undefined;
        isTablet?: boolean | undefined;
        isDesktop?: boolean | undefined;
    }, {
        type?: "unknown" | "mobile" | "tablet" | "desktop" | "tv" | "watch" | undefined;
        os?: string | undefined;
        osVersion?: string | undefined;
        browser?: string | undefined;
        browserVersion?: string | undefined;
        isMobile?: boolean | undefined;
        isTablet?: boolean | undefined;
        isDesktop?: boolean | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    password: string;
    email?: string | undefined;
    rememberMe?: boolean | undefined;
    username?: string | undefined;
    deviceInfo?: {
        type?: "unknown" | "mobile" | "tablet" | "desktop" | "tv" | "watch" | undefined;
        os?: string | undefined;
        osVersion?: string | undefined;
        browser?: string | undefined;
        browserVersion?: string | undefined;
        isMobile?: boolean | undefined;
        isTablet?: boolean | undefined;
        isDesktop?: boolean | undefined;
    } | undefined;
}, {
    password: string;
    email?: string | undefined;
    rememberMe?: boolean | undefined;
    username?: string | undefined;
    deviceInfo?: {
        type?: "unknown" | "mobile" | "tablet" | "desktop" | "tv" | "watch" | undefined;
        os?: string | undefined;
        osVersion?: string | undefined;
        browser?: string | undefined;
        browserVersion?: string | undefined;
        isMobile?: boolean | undefined;
        isTablet?: boolean | undefined;
        isDesktop?: boolean | undefined;
    } | undefined;
}>, {
    password: string;
    email?: string | undefined;
    rememberMe?: boolean | undefined;
    username?: string | undefined;
    deviceInfo?: {
        type?: "unknown" | "mobile" | "tablet" | "desktop" | "tv" | "watch" | undefined;
        os?: string | undefined;
        osVersion?: string | undefined;
        browser?: string | undefined;
        browserVersion?: string | undefined;
        isMobile?: boolean | undefined;
        isTablet?: boolean | undefined;
        isDesktop?: boolean | undefined;
    } | undefined;
}, {
    password: string;
    email?: string | undefined;
    rememberMe?: boolean | undefined;
    username?: string | undefined;
    deviceInfo?: {
        type?: "unknown" | "mobile" | "tablet" | "desktop" | "tv" | "watch" | undefined;
        os?: string | undefined;
        osVersion?: string | undefined;
        browser?: string | undefined;
        browserVersion?: string | undefined;
        isMobile?: boolean | undefined;
        isTablet?: boolean | undefined;
        isDesktop?: boolean | undefined;
    } | undefined;
}>;
export declare const UserProfileSchema: z.ZodObject<{
    phone: z.ZodOptional<z.ZodString>;
    birthDate: z.ZodOptional<z.ZodDate>;
    gender: z.ZodOptional<z.ZodEnum<["male", "female", "other", "prefer_not_to_say"]>>;
    nationality: z.ZodOptional<z.ZodString>;
    language: z.ZodString;
    timezone: z.ZodString;
    address: z.ZodOptional<z.ZodObject<{
        country: z.ZodOptional<z.ZodString>;
        state: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        city: z.ZodOptional<z.ZodString>;
        district: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        street: z.ZodOptional<z.ZodString>;
        detail: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        postalCode: z.ZodOptional<z.ZodString>;
        latitude: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
        longitude: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    }, "strip", z.ZodTypeAny, {
        street?: string | undefined;
        city?: string | undefined;
        state?: string | undefined;
        country?: string | undefined;
        postalCode?: string | undefined;
        district?: string | undefined;
        detail?: string | undefined;
        latitude?: number | undefined;
        longitude?: number | undefined;
    }, {
        street?: string | undefined;
        city?: string | undefined;
        state?: string | undefined;
        country?: string | undefined;
        postalCode?: string | undefined;
        district?: string | undefined;
        detail?: string | undefined;
        latitude?: number | undefined;
        longitude?: number | undefined;
    }>>;
    contacts: z.ZodOptional<z.ZodObject<{
        phone: z.ZodOptional<z.ZodString>;
        mobile: z.ZodOptional<z.ZodString>;
        email: z.ZodOptional<z.ZodString>;
        fax: z.ZodOptional<z.ZodString>;
        website: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        email?: string | undefined;
        phone?: string | undefined;
        mobile?: string | undefined;
        fax?: string | undefined;
        website?: string | undefined;
    }, {
        email?: string | undefined;
        phone?: string | undefined;
        mobile?: string | undefined;
        fax?: string | undefined;
        website?: string | undefined;
    }>>;
    socialLinks: z.ZodOptional<z.ZodObject<{
        facebook: z.ZodOptional<z.ZodString>;
        twitter: z.ZodOptional<z.ZodString>;
        linkedin: z.ZodOptional<z.ZodString>;
        instagram: z.ZodOptional<z.ZodString>;
        github: z.ZodOptional<z.ZodString>;
        website: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        facebook?: string | undefined;
        github?: string | undefined;
        linkedin?: string | undefined;
        twitter?: string | undefined;
        website?: string | undefined;
        instagram?: string | undefined;
    }, {
        facebook?: string | undefined;
        github?: string | undefined;
        linkedin?: string | undefined;
        twitter?: string | undefined;
        website?: string | undefined;
        instagram?: string | undefined;
    }>>;
    occupation: z.ZodOptional<z.ZodString>;
    company: z.ZodOptional<z.ZodString>;
    department: z.ZodOptional<z.ZodString>;
    position: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    language: string;
    timezone: string;
    address?: {
        street?: string | undefined;
        city?: string | undefined;
        state?: string | undefined;
        country?: string | undefined;
        postalCode?: string | undefined;
        district?: string | undefined;
        detail?: string | undefined;
        latitude?: number | undefined;
        longitude?: number | undefined;
    } | undefined;
    phone?: string | undefined;
    birthDate?: Date | undefined;
    gender?: "male" | "female" | "other" | "prefer_not_to_say" | undefined;
    nationality?: string | undefined;
    contacts?: {
        email?: string | undefined;
        phone?: string | undefined;
        mobile?: string | undefined;
        fax?: string | undefined;
        website?: string | undefined;
    } | undefined;
    socialLinks?: {
        facebook?: string | undefined;
        github?: string | undefined;
        linkedin?: string | undefined;
        twitter?: string | undefined;
        website?: string | undefined;
        instagram?: string | undefined;
    } | undefined;
    occupation?: string | undefined;
    company?: string | undefined;
    department?: string | undefined;
    position?: string | undefined;
}, {
    language: string;
    timezone: string;
    address?: {
        street?: string | undefined;
        city?: string | undefined;
        state?: string | undefined;
        country?: string | undefined;
        postalCode?: string | undefined;
        district?: string | undefined;
        detail?: string | undefined;
        latitude?: number | undefined;
        longitude?: number | undefined;
    } | undefined;
    phone?: string | undefined;
    birthDate?: Date | undefined;
    gender?: "male" | "female" | "other" | "prefer_not_to_say" | undefined;
    nationality?: string | undefined;
    contacts?: {
        email?: string | undefined;
        phone?: string | undefined;
        mobile?: string | undefined;
        fax?: string | undefined;
        website?: string | undefined;
    } | undefined;
    socialLinks?: {
        facebook?: string | undefined;
        github?: string | undefined;
        linkedin?: string | undefined;
        twitter?: string | undefined;
        website?: string | undefined;
        instagram?: string | undefined;
    } | undefined;
    occupation?: string | undefined;
    company?: string | undefined;
    department?: string | undefined;
    position?: string | undefined;
}>;
export declare const UserPreferencesSchema: z.ZodObject<{
    theme: z.ZodEnum<["light", "dark", "auto"]>;
    language: z.ZodString;
    timezone: z.ZodString;
    dateFormat: z.ZodString;
    timeFormat: z.ZodString;
    currency: z.ZodEnum<["KRW", "USD", "EUR", "JPY", "CNY"]>;
    notifications: z.ZodObject<{
        email: z.ZodBoolean;
        push: z.ZodBoolean;
        sms: z.ZodBoolean;
        inApp: z.ZodBoolean;
        marketing: z.ZodBoolean;
        digest: z.ZodEnum<["realtime", "hourly", "daily", "weekly", "never"]>;
    }, "strip", z.ZodTypeAny, {
        push: boolean;
        email: boolean;
        sms: boolean;
        inApp: boolean;
        marketing: boolean;
        digest: "never" | "realtime" | "hourly" | "daily" | "weekly";
    }, {
        push: boolean;
        email: boolean;
        sms: boolean;
        inApp: boolean;
        marketing: boolean;
        digest: "never" | "realtime" | "hourly" | "daily" | "weekly";
    }>;
    privacy: z.ZodObject<{
        profileVisibility: z.ZodEnum<["public", "friends", "private"]>;
        showEmail: z.ZodBoolean;
        showPhone: z.ZodBoolean;
        showLastSeen: z.ZodBoolean;
        allowDirectMessages: z.ZodBoolean;
        allowFriendRequests: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        profileVisibility: "public" | "friends" | "private";
        showEmail: boolean;
        showPhone: boolean;
        showLastSeen: boolean;
        allowDirectMessages: boolean;
        allowFriendRequests: boolean;
    }, {
        profileVisibility: "public" | "friends" | "private";
        showEmail: boolean;
        showPhone: boolean;
        showLastSeen: boolean;
        allowDirectMessages: boolean;
        allowFriendRequests: boolean;
    }>;
    accessibility: z.ZodObject<{
        fontSize: z.ZodEnum<["small", "medium", "large", "xlarge"]>;
        highContrast: z.ZodBoolean;
        reduceMotion: z.ZodBoolean;
        screenReader: z.ZodBoolean;
        keyboardNavigation: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        fontSize: "small" | "medium" | "large" | "xlarge";
        highContrast: boolean;
        reduceMotion: boolean;
        screenReader: boolean;
        keyboardNavigation: boolean;
    }, {
        fontSize: "small" | "medium" | "large" | "xlarge";
        highContrast: boolean;
        reduceMotion: boolean;
        screenReader: boolean;
        keyboardNavigation: boolean;
    }>;
}, "strip", z.ZodTypeAny, {
    currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
    language: string;
    timezone: string;
    theme: "auto" | "light" | "dark";
    dateFormat: string;
    timeFormat: string;
    notifications: {
        push: boolean;
        email: boolean;
        sms: boolean;
        inApp: boolean;
        marketing: boolean;
        digest: "never" | "realtime" | "hourly" | "daily" | "weekly";
    };
    privacy: {
        profileVisibility: "public" | "friends" | "private";
        showEmail: boolean;
        showPhone: boolean;
        showLastSeen: boolean;
        allowDirectMessages: boolean;
        allowFriendRequests: boolean;
    };
    accessibility: {
        fontSize: "small" | "medium" | "large" | "xlarge";
        highContrast: boolean;
        reduceMotion: boolean;
        screenReader: boolean;
        keyboardNavigation: boolean;
    };
}, {
    currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
    language: string;
    timezone: string;
    theme: "auto" | "light" | "dark";
    dateFormat: string;
    timeFormat: string;
    notifications: {
        push: boolean;
        email: boolean;
        sms: boolean;
        inApp: boolean;
        marketing: boolean;
        digest: "never" | "realtime" | "hourly" | "daily" | "weekly";
    };
    privacy: {
        profileVisibility: "public" | "friends" | "private";
        showEmail: boolean;
        showPhone: boolean;
        showLastSeen: boolean;
        allowDirectMessages: boolean;
        allowFriendRequests: boolean;
    };
    accessibility: {
        fontSize: "small" | "medium" | "large" | "xlarge";
        highContrast: boolean;
        reduceMotion: boolean;
        screenReader: boolean;
        keyboardNavigation: boolean;
    };
}>;
export declare const UserSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodString;
    username: z.ZodOptional<z.ZodString>;
    displayName: z.ZodString;
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
    avatar: z.ZodOptional<z.ZodString>;
    bio: z.ZodOptional<z.ZodString>;
    status: z.ZodEnum<["active", "inactive", "suspended", "pending", "deleted"]>;
    emailVerified: z.ZodBoolean;
    phoneVerified: z.ZodBoolean;
    twoFactorEnabled: z.ZodBoolean;
    lastLoginAt: z.ZodOptional<z.ZodDate>;
    lastActiveAt: z.ZodOptional<z.ZodDate>;
    roles: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        displayName: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        level: z.ZodNumber;
        permissions: z.ZodArray<z.ZodAny, "many">;
        isSystemRole: z.ZodBoolean;
        isDefault: z.ZodBoolean;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
    }, "strip", z.ZodTypeAny, {
        displayName: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        level: number;
        permissions: any[];
        isSystemRole: boolean;
        isDefault: boolean;
        description?: string | undefined;
    }, {
        displayName: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        level: number;
        permissions: any[];
        isSystemRole: boolean;
        isDefault: boolean;
        description?: string | undefined;
    }>, "many">;
    permissions: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        resource: z.ZodString;
        action: z.ZodEnum<["create", "read", "update", "delete", "list", "execute", "*"]>;
        conditions: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
        description: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        action: "*" | "delete" | "create" | "list" | "update" | "read" | "execute";
        resource: string;
        name: string;
        description?: string | undefined;
        conditions?: any[] | undefined;
    }, {
        id: string;
        action: "*" | "delete" | "create" | "list" | "update" | "read" | "execute";
        resource: string;
        name: string;
        description?: string | undefined;
        conditions?: any[] | undefined;
    }>, "many">;
    profile: z.ZodObject<{
        phone: z.ZodOptional<z.ZodString>;
        birthDate: z.ZodOptional<z.ZodDate>;
        gender: z.ZodOptional<z.ZodEnum<["male", "female", "other", "prefer_not_to_say"]>>;
        nationality: z.ZodOptional<z.ZodString>;
        language: z.ZodString;
        timezone: z.ZodString;
        address: z.ZodOptional<z.ZodObject<{
            country: z.ZodOptional<z.ZodString>;
            state: z.ZodOptional<z.ZodOptional<z.ZodString>>;
            city: z.ZodOptional<z.ZodString>;
            district: z.ZodOptional<z.ZodOptional<z.ZodString>>;
            street: z.ZodOptional<z.ZodString>;
            detail: z.ZodOptional<z.ZodOptional<z.ZodString>>;
            postalCode: z.ZodOptional<z.ZodString>;
            latitude: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
            longitude: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
        }, "strip", z.ZodTypeAny, {
            street?: string | undefined;
            city?: string | undefined;
            state?: string | undefined;
            country?: string | undefined;
            postalCode?: string | undefined;
            district?: string | undefined;
            detail?: string | undefined;
            latitude?: number | undefined;
            longitude?: number | undefined;
        }, {
            street?: string | undefined;
            city?: string | undefined;
            state?: string | undefined;
            country?: string | undefined;
            postalCode?: string | undefined;
            district?: string | undefined;
            detail?: string | undefined;
            latitude?: number | undefined;
            longitude?: number | undefined;
        }>>;
        contacts: z.ZodOptional<z.ZodObject<{
            phone: z.ZodOptional<z.ZodString>;
            mobile: z.ZodOptional<z.ZodString>;
            email: z.ZodOptional<z.ZodString>;
            fax: z.ZodOptional<z.ZodString>;
            website: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            email?: string | undefined;
            phone?: string | undefined;
            mobile?: string | undefined;
            fax?: string | undefined;
            website?: string | undefined;
        }, {
            email?: string | undefined;
            phone?: string | undefined;
            mobile?: string | undefined;
            fax?: string | undefined;
            website?: string | undefined;
        }>>;
        socialLinks: z.ZodOptional<z.ZodObject<{
            facebook: z.ZodOptional<z.ZodString>;
            twitter: z.ZodOptional<z.ZodString>;
            linkedin: z.ZodOptional<z.ZodString>;
            instagram: z.ZodOptional<z.ZodString>;
            github: z.ZodOptional<z.ZodString>;
            website: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            facebook?: string | undefined;
            github?: string | undefined;
            linkedin?: string | undefined;
            twitter?: string | undefined;
            website?: string | undefined;
            instagram?: string | undefined;
        }, {
            facebook?: string | undefined;
            github?: string | undefined;
            linkedin?: string | undefined;
            twitter?: string | undefined;
            website?: string | undefined;
            instagram?: string | undefined;
        }>>;
        occupation: z.ZodOptional<z.ZodString>;
        company: z.ZodOptional<z.ZodString>;
        department: z.ZodOptional<z.ZodString>;
        position: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        language: string;
        timezone: string;
        address?: {
            street?: string | undefined;
            city?: string | undefined;
            state?: string | undefined;
            country?: string | undefined;
            postalCode?: string | undefined;
            district?: string | undefined;
            detail?: string | undefined;
            latitude?: number | undefined;
            longitude?: number | undefined;
        } | undefined;
        phone?: string | undefined;
        birthDate?: Date | undefined;
        gender?: "male" | "female" | "other" | "prefer_not_to_say" | undefined;
        nationality?: string | undefined;
        contacts?: {
            email?: string | undefined;
            phone?: string | undefined;
            mobile?: string | undefined;
            fax?: string | undefined;
            website?: string | undefined;
        } | undefined;
        socialLinks?: {
            facebook?: string | undefined;
            github?: string | undefined;
            linkedin?: string | undefined;
            twitter?: string | undefined;
            website?: string | undefined;
            instagram?: string | undefined;
        } | undefined;
        occupation?: string | undefined;
        company?: string | undefined;
        department?: string | undefined;
        position?: string | undefined;
    }, {
        language: string;
        timezone: string;
        address?: {
            street?: string | undefined;
            city?: string | undefined;
            state?: string | undefined;
            country?: string | undefined;
            postalCode?: string | undefined;
            district?: string | undefined;
            detail?: string | undefined;
            latitude?: number | undefined;
            longitude?: number | undefined;
        } | undefined;
        phone?: string | undefined;
        birthDate?: Date | undefined;
        gender?: "male" | "female" | "other" | "prefer_not_to_say" | undefined;
        nationality?: string | undefined;
        contacts?: {
            email?: string | undefined;
            phone?: string | undefined;
            mobile?: string | undefined;
            fax?: string | undefined;
            website?: string | undefined;
        } | undefined;
        socialLinks?: {
            facebook?: string | undefined;
            github?: string | undefined;
            linkedin?: string | undefined;
            twitter?: string | undefined;
            website?: string | undefined;
            instagram?: string | undefined;
        } | undefined;
        occupation?: string | undefined;
        company?: string | undefined;
        department?: string | undefined;
        position?: string | undefined;
    }>;
    preferences: z.ZodObject<{
        theme: z.ZodEnum<["light", "dark", "auto"]>;
        language: z.ZodString;
        timezone: z.ZodString;
        dateFormat: z.ZodString;
        timeFormat: z.ZodString;
        currency: z.ZodEnum<["KRW", "USD", "EUR", "JPY", "CNY"]>;
        notifications: z.ZodObject<{
            email: z.ZodBoolean;
            push: z.ZodBoolean;
            sms: z.ZodBoolean;
            inApp: z.ZodBoolean;
            marketing: z.ZodBoolean;
            digest: z.ZodEnum<["realtime", "hourly", "daily", "weekly", "never"]>;
        }, "strip", z.ZodTypeAny, {
            push: boolean;
            email: boolean;
            sms: boolean;
            inApp: boolean;
            marketing: boolean;
            digest: "never" | "realtime" | "hourly" | "daily" | "weekly";
        }, {
            push: boolean;
            email: boolean;
            sms: boolean;
            inApp: boolean;
            marketing: boolean;
            digest: "never" | "realtime" | "hourly" | "daily" | "weekly";
        }>;
        privacy: z.ZodObject<{
            profileVisibility: z.ZodEnum<["public", "friends", "private"]>;
            showEmail: z.ZodBoolean;
            showPhone: z.ZodBoolean;
            showLastSeen: z.ZodBoolean;
            allowDirectMessages: z.ZodBoolean;
            allowFriendRequests: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            profileVisibility: "public" | "friends" | "private";
            showEmail: boolean;
            showPhone: boolean;
            showLastSeen: boolean;
            allowDirectMessages: boolean;
            allowFriendRequests: boolean;
        }, {
            profileVisibility: "public" | "friends" | "private";
            showEmail: boolean;
            showPhone: boolean;
            showLastSeen: boolean;
            allowDirectMessages: boolean;
            allowFriendRequests: boolean;
        }>;
        accessibility: z.ZodObject<{
            fontSize: z.ZodEnum<["small", "medium", "large", "xlarge"]>;
            highContrast: z.ZodBoolean;
            reduceMotion: z.ZodBoolean;
            screenReader: z.ZodBoolean;
            keyboardNavigation: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            fontSize: "small" | "medium" | "large" | "xlarge";
            highContrast: boolean;
            reduceMotion: boolean;
            screenReader: boolean;
            keyboardNavigation: boolean;
        }, {
            fontSize: "small" | "medium" | "large" | "xlarge";
            highContrast: boolean;
            reduceMotion: boolean;
            screenReader: boolean;
            keyboardNavigation: boolean;
        }>;
    }, "strip", z.ZodTypeAny, {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        language: string;
        timezone: string;
        theme: "auto" | "light" | "dark";
        dateFormat: string;
        timeFormat: string;
        notifications: {
            push: boolean;
            email: boolean;
            sms: boolean;
            inApp: boolean;
            marketing: boolean;
            digest: "never" | "realtime" | "hourly" | "daily" | "weekly";
        };
        privacy: {
            profileVisibility: "public" | "friends" | "private";
            showEmail: boolean;
            showPhone: boolean;
            showLastSeen: boolean;
            allowDirectMessages: boolean;
            allowFriendRequests: boolean;
        };
        accessibility: {
            fontSize: "small" | "medium" | "large" | "xlarge";
            highContrast: boolean;
            reduceMotion: boolean;
            screenReader: boolean;
            keyboardNavigation: boolean;
        };
    }, {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        language: string;
        timezone: string;
        theme: "auto" | "light" | "dark";
        dateFormat: string;
        timeFormat: string;
        notifications: {
            push: boolean;
            email: boolean;
            sms: boolean;
            inApp: boolean;
            marketing: boolean;
            digest: "never" | "realtime" | "hourly" | "daily" | "weekly";
        };
        privacy: {
            profileVisibility: "public" | "friends" | "private";
            showEmail: boolean;
            showPhone: boolean;
            showLastSeen: boolean;
            allowDirectMessages: boolean;
            allowFriendRequests: boolean;
        };
        accessibility: {
            fontSize: "small" | "medium" | "large" | "xlarge";
            highContrast: boolean;
            reduceMotion: boolean;
            screenReader: boolean;
            keyboardNavigation: boolean;
        };
    }>;
    security: z.ZodObject<{
        lastPasswordChange: z.ZodOptional<z.ZodDate>;
        passwordExpiresAt: z.ZodOptional<z.ZodDate>;
        failedLoginAttempts: z.ZodNumber;
        lockedUntil: z.ZodOptional<z.ZodDate>;
        ipWhitelist: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        trustedDevices: z.ZodArray<z.ZodAny, "many">;
        sessions: z.ZodArray<z.ZodAny, "many">;
        auditLog: z.ZodArray<z.ZodAny, "many">;
    }, "strip", z.ZodTypeAny, {
        failedLoginAttempts: number;
        trustedDevices: any[];
        sessions: any[];
        auditLog: any[];
        lastPasswordChange?: Date | undefined;
        passwordExpiresAt?: Date | undefined;
        lockedUntil?: Date | undefined;
        ipWhitelist?: string[] | undefined;
    }, {
        failedLoginAttempts: number;
        trustedDevices: any[];
        sessions: any[];
        auditLog: any[];
        lastPasswordChange?: Date | undefined;
        passwordExpiresAt?: Date | undefined;
        lockedUntil?: Date | undefined;
        ipWhitelist?: string[] | undefined;
    }>;
} & {
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
    createdBy: z.ZodOptional<z.ZodString>;
    updatedBy: z.ZodOptional<z.ZodString>;
    version: z.ZodNumber;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    status: "pending" | "active" | "inactive" | "deleted" | "suspended";
    displayName: string;
    email: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    version: number;
    emailVerified: boolean;
    phoneVerified: boolean;
    twoFactorEnabled: boolean;
    roles: {
        displayName: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        level: number;
        permissions: any[];
        isSystemRole: boolean;
        isDefault: boolean;
        description?: string | undefined;
    }[];
    permissions: {
        id: string;
        action: "*" | "delete" | "create" | "list" | "update" | "read" | "execute";
        resource: string;
        name: string;
        description?: string | undefined;
        conditions?: any[] | undefined;
    }[];
    profile: {
        language: string;
        timezone: string;
        address?: {
            street?: string | undefined;
            city?: string | undefined;
            state?: string | undefined;
            country?: string | undefined;
            postalCode?: string | undefined;
            district?: string | undefined;
            detail?: string | undefined;
            latitude?: number | undefined;
            longitude?: number | undefined;
        } | undefined;
        phone?: string | undefined;
        birthDate?: Date | undefined;
        gender?: "male" | "female" | "other" | "prefer_not_to_say" | undefined;
        nationality?: string | undefined;
        contacts?: {
            email?: string | undefined;
            phone?: string | undefined;
            mobile?: string | undefined;
            fax?: string | undefined;
            website?: string | undefined;
        } | undefined;
        socialLinks?: {
            facebook?: string | undefined;
            github?: string | undefined;
            linkedin?: string | undefined;
            twitter?: string | undefined;
            website?: string | undefined;
            instagram?: string | undefined;
        } | undefined;
        occupation?: string | undefined;
        company?: string | undefined;
        department?: string | undefined;
        position?: string | undefined;
    };
    preferences: {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        language: string;
        timezone: string;
        theme: "auto" | "light" | "dark";
        dateFormat: string;
        timeFormat: string;
        notifications: {
            push: boolean;
            email: boolean;
            sms: boolean;
            inApp: boolean;
            marketing: boolean;
            digest: "never" | "realtime" | "hourly" | "daily" | "weekly";
        };
        privacy: {
            profileVisibility: "public" | "friends" | "private";
            showEmail: boolean;
            showPhone: boolean;
            showLastSeen: boolean;
            allowDirectMessages: boolean;
            allowFriendRequests: boolean;
        };
        accessibility: {
            fontSize: "small" | "medium" | "large" | "xlarge";
            highContrast: boolean;
            reduceMotion: boolean;
            screenReader: boolean;
            keyboardNavigation: boolean;
        };
    };
    security: {
        failedLoginAttempts: number;
        trustedDevices: any[];
        sessions: any[];
        auditLog: any[];
        lastPasswordChange?: Date | undefined;
        passwordExpiresAt?: Date | undefined;
        lockedUntil?: Date | undefined;
        ipWhitelist?: string[] | undefined;
    };
    avatar?: string | undefined;
    metadata?: Record<string, any> | undefined;
    tags?: string[] | undefined;
    createdBy?: string | undefined;
    updatedBy?: string | undefined;
    username?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    bio?: string | undefined;
    lastLoginAt?: Date | undefined;
    lastActiveAt?: Date | undefined;
}, {
    status: "pending" | "active" | "inactive" | "deleted" | "suspended";
    displayName: string;
    email: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    version: number;
    emailVerified: boolean;
    phoneVerified: boolean;
    twoFactorEnabled: boolean;
    roles: {
        displayName: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        level: number;
        permissions: any[];
        isSystemRole: boolean;
        isDefault: boolean;
        description?: string | undefined;
    }[];
    permissions: {
        id: string;
        action: "*" | "delete" | "create" | "list" | "update" | "read" | "execute";
        resource: string;
        name: string;
        description?: string | undefined;
        conditions?: any[] | undefined;
    }[];
    profile: {
        language: string;
        timezone: string;
        address?: {
            street?: string | undefined;
            city?: string | undefined;
            state?: string | undefined;
            country?: string | undefined;
            postalCode?: string | undefined;
            district?: string | undefined;
            detail?: string | undefined;
            latitude?: number | undefined;
            longitude?: number | undefined;
        } | undefined;
        phone?: string | undefined;
        birthDate?: Date | undefined;
        gender?: "male" | "female" | "other" | "prefer_not_to_say" | undefined;
        nationality?: string | undefined;
        contacts?: {
            email?: string | undefined;
            phone?: string | undefined;
            mobile?: string | undefined;
            fax?: string | undefined;
            website?: string | undefined;
        } | undefined;
        socialLinks?: {
            facebook?: string | undefined;
            github?: string | undefined;
            linkedin?: string | undefined;
            twitter?: string | undefined;
            website?: string | undefined;
            instagram?: string | undefined;
        } | undefined;
        occupation?: string | undefined;
        company?: string | undefined;
        department?: string | undefined;
        position?: string | undefined;
    };
    preferences: {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        language: string;
        timezone: string;
        theme: "auto" | "light" | "dark";
        dateFormat: string;
        timeFormat: string;
        notifications: {
            push: boolean;
            email: boolean;
            sms: boolean;
            inApp: boolean;
            marketing: boolean;
            digest: "never" | "realtime" | "hourly" | "daily" | "weekly";
        };
        privacy: {
            profileVisibility: "public" | "friends" | "private";
            showEmail: boolean;
            showPhone: boolean;
            showLastSeen: boolean;
            allowDirectMessages: boolean;
            allowFriendRequests: boolean;
        };
        accessibility: {
            fontSize: "small" | "medium" | "large" | "xlarge";
            highContrast: boolean;
            reduceMotion: boolean;
            screenReader: boolean;
            keyboardNavigation: boolean;
        };
    };
    security: {
        failedLoginAttempts: number;
        trustedDevices: any[];
        sessions: any[];
        auditLog: any[];
        lastPasswordChange?: Date | undefined;
        passwordExpiresAt?: Date | undefined;
        lockedUntil?: Date | undefined;
        ipWhitelist?: string[] | undefined;
    };
    avatar?: string | undefined;
    metadata?: Record<string, any> | undefined;
    tags?: string[] | undefined;
    createdBy?: string | undefined;
    updatedBy?: string | undefined;
    username?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    bio?: string | undefined;
    lastLoginAt?: Date | undefined;
    lastActiveAt?: Date | undefined;
}>;
export declare const ProductInventorySchema: z.ZodObject<{
    quantity: z.ZodNumber;
    reservedQuantity: z.ZodNumber;
    minQuantity: z.ZodNumber;
    maxQuantity: z.ZodOptional<z.ZodNumber>;
    trackQuantity: z.ZodBoolean;
    allowBackorder: z.ZodBoolean;
    stockStatus: z.ZodEnum<["in_stock", "out_of_stock", "on_backorder"]>;
}, "strip", z.ZodTypeAny, {
    quantity: number;
    reservedQuantity: number;
    minQuantity: number;
    trackQuantity: boolean;
    allowBackorder: boolean;
    stockStatus: "out_of_stock" | "in_stock" | "on_backorder";
    maxQuantity?: number | undefined;
}, {
    quantity: number;
    reservedQuantity: number;
    minQuantity: number;
    trackQuantity: boolean;
    allowBackorder: boolean;
    stockStatus: "out_of_stock" | "in_stock" | "on_backorder";
    maxQuantity?: number | undefined;
}>;
export declare const ProductAttributeSchema: z.ZodObject<{
    name: z.ZodString;
    value: z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean]>;
    type: z.ZodEnum<["text", "number", "boolean", "select", "multiselect", "color", "image"]>;
    isRequired: z.ZodBoolean;
    isVariable: z.ZodBoolean;
    displayOrder: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    value: string | number | boolean;
    type: "number" | "boolean" | "select" | "color" | "image" | "text" | "multiselect";
    name: string;
    isRequired: boolean;
    isVariable: boolean;
    displayOrder: number;
}, {
    value: string | number | boolean;
    type: "number" | "boolean" | "select" | "color" | "image" | "text" | "multiselect";
    name: string;
    isRequired: boolean;
    isVariable: boolean;
    displayOrder: number;
}>;
export declare const ProductVariantSchema: z.ZodObject<{
    id: z.ZodString;
    sku: z.ZodString;
    name: z.ZodString;
    price: z.ZodObject<{
        amount: z.ZodNumber;
        currency: z.ZodEnum<["KRW", "USD", "EUR", "JPY", "CNY"]>;
    }, "strip", z.ZodTypeAny, {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    }, {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    }>;
    inventory: z.ZodObject<{
        quantity: z.ZodNumber;
        reservedQuantity: z.ZodNumber;
        minQuantity: z.ZodNumber;
        maxQuantity: z.ZodOptional<z.ZodNumber>;
        trackQuantity: z.ZodBoolean;
        allowBackorder: z.ZodBoolean;
        stockStatus: z.ZodEnum<["in_stock", "out_of_stock", "on_backorder"]>;
    }, "strip", z.ZodTypeAny, {
        quantity: number;
        reservedQuantity: number;
        minQuantity: number;
        trackQuantity: boolean;
        allowBackorder: boolean;
        stockStatus: "out_of_stock" | "in_stock" | "on_backorder";
        maxQuantity?: number | undefined;
    }, {
        quantity: number;
        reservedQuantity: number;
        minQuantity: number;
        trackQuantity: boolean;
        allowBackorder: boolean;
        stockStatus: "out_of_stock" | "in_stock" | "on_backorder";
        maxQuantity?: number | undefined;
    }>;
    attributes: z.ZodRecord<z.ZodString, z.ZodString>;
    image: z.ZodOptional<z.ZodString>;
    isDefault: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    id: string;
    sku: string;
    name: string;
    isDefault: boolean;
    price: {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    };
    inventory: {
        quantity: number;
        reservedQuantity: number;
        minQuantity: number;
        trackQuantity: boolean;
        allowBackorder: boolean;
        stockStatus: "out_of_stock" | "in_stock" | "on_backorder";
        maxQuantity?: number | undefined;
    };
    attributes: Record<string, string>;
    image?: string | undefined;
}, {
    id: string;
    sku: string;
    name: string;
    isDefault: boolean;
    price: {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    };
    inventory: {
        quantity: number;
        reservedQuantity: number;
        minQuantity: number;
        trackQuantity: boolean;
        allowBackorder: boolean;
        stockStatus: "out_of_stock" | "in_stock" | "on_backorder";
        maxQuantity?: number | undefined;
    };
    attributes: Record<string, string>;
    image?: string | undefined;
}>;
export declare const ProductSchema: z.ZodObject<{
    id: z.ZodString;
    sku: z.ZodString;
    name: z.ZodString;
    description: z.ZodString;
    shortDescription: z.ZodOptional<z.ZodString>;
    categoryId: z.ZodString;
    brandId: z.ZodOptional<z.ZodString>;
    supplierId: z.ZodOptional<z.ZodString>;
    status: z.ZodEnum<["active", "inactive", "draft", "archived", "out_of_stock"]>;
    type: z.ZodEnum<["simple", "variable", "grouped", "external", "subscription"]>;
    price: z.ZodObject<{
        amount: z.ZodNumber;
        currency: z.ZodEnum<["KRW", "USD", "EUR", "JPY", "CNY"]>;
    }, "strip", z.ZodTypeAny, {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    }, {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    }>;
    originalPrice: z.ZodOptional<z.ZodObject<{
        amount: z.ZodNumber;
        currency: z.ZodEnum<["KRW", "USD", "EUR", "JPY", "CNY"]>;
    }, "strip", z.ZodTypeAny, {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    }, {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    }>>;
    costPrice: z.ZodOptional<z.ZodObject<{
        amount: z.ZodNumber;
        currency: z.ZodEnum<["KRW", "USD", "EUR", "JPY", "CNY"]>;
    }, "strip", z.ZodTypeAny, {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    }, {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    }>>;
    inventory: z.ZodObject<{
        quantity: z.ZodNumber;
        reservedQuantity: z.ZodNumber;
        minQuantity: z.ZodNumber;
        maxQuantity: z.ZodOptional<z.ZodNumber>;
        trackQuantity: z.ZodBoolean;
        allowBackorder: z.ZodBoolean;
        stockStatus: z.ZodEnum<["in_stock", "out_of_stock", "on_backorder"]>;
    }, "strip", z.ZodTypeAny, {
        quantity: number;
        reservedQuantity: number;
        minQuantity: number;
        trackQuantity: boolean;
        allowBackorder: boolean;
        stockStatus: "out_of_stock" | "in_stock" | "on_backorder";
        maxQuantity?: number | undefined;
    }, {
        quantity: number;
        reservedQuantity: number;
        minQuantity: number;
        trackQuantity: boolean;
        allowBackorder: boolean;
        stockStatus: "out_of_stock" | "in_stock" | "on_backorder";
        maxQuantity?: number | undefined;
    }>;
    images: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        originalName: z.ZodString;
        mimeType: z.ZodString;
        size: z.ZodNumber;
        url: z.ZodString;
        thumbnailUrl: z.ZodOptional<z.ZodString>;
        uploadedAt: z.ZodDate;
        uploadedBy: z.ZodOptional<z.ZodString>;
        metadata: z.ZodOptional<z.ZodObject<{
            width: z.ZodOptional<z.ZodNumber>;
            height: z.ZodOptional<z.ZodNumber>;
            duration: z.ZodOptional<z.ZodNumber>;
            encoding: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            duration?: number | undefined;
            width?: number | undefined;
            height?: number | undefined;
            encoding?: string | undefined;
        }, {
            duration?: number | undefined;
            width?: number | undefined;
            height?: number | undefined;
            encoding?: string | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        url: string;
        id: string;
        size: number;
        name: string;
        originalName: string;
        mimeType: string;
        uploadedAt: Date;
        metadata?: {
            duration?: number | undefined;
            width?: number | undefined;
            height?: number | undefined;
            encoding?: string | undefined;
        } | undefined;
        thumbnailUrl?: string | undefined;
        uploadedBy?: string | undefined;
    }, {
        url: string;
        id: string;
        size: number;
        name: string;
        originalName: string;
        mimeType: string;
        uploadedAt: Date;
        metadata?: {
            duration?: number | undefined;
            width?: number | undefined;
            height?: number | undefined;
            encoding?: string | undefined;
        } | undefined;
        thumbnailUrl?: string | undefined;
        uploadedBy?: string | undefined;
    }>, "many">;
    videos: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        originalName: z.ZodString;
        mimeType: z.ZodString;
        size: z.ZodNumber;
        url: z.ZodString;
        thumbnailUrl: z.ZodOptional<z.ZodString>;
        uploadedAt: z.ZodDate;
        uploadedBy: z.ZodOptional<z.ZodString>;
        metadata: z.ZodOptional<z.ZodObject<{
            width: z.ZodOptional<z.ZodNumber>;
            height: z.ZodOptional<z.ZodNumber>;
            duration: z.ZodOptional<z.ZodNumber>;
            encoding: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            duration?: number | undefined;
            width?: number | undefined;
            height?: number | undefined;
            encoding?: string | undefined;
        }, {
            duration?: number | undefined;
            width?: number | undefined;
            height?: number | undefined;
            encoding?: string | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        url: string;
        id: string;
        size: number;
        name: string;
        originalName: string;
        mimeType: string;
        uploadedAt: Date;
        metadata?: {
            duration?: number | undefined;
            width?: number | undefined;
            height?: number | undefined;
            encoding?: string | undefined;
        } | undefined;
        thumbnailUrl?: string | undefined;
        uploadedBy?: string | undefined;
    }, {
        url: string;
        id: string;
        size: number;
        name: string;
        originalName: string;
        mimeType: string;
        uploadedAt: Date;
        metadata?: {
            duration?: number | undefined;
            width?: number | undefined;
            height?: number | undefined;
            encoding?: string | undefined;
        } | undefined;
        thumbnailUrl?: string | undefined;
        uploadedBy?: string | undefined;
    }>, "many">>;
    documents: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        originalName: z.ZodString;
        mimeType: z.ZodString;
        size: z.ZodNumber;
        url: z.ZodString;
        thumbnailUrl: z.ZodOptional<z.ZodString>;
        uploadedAt: z.ZodDate;
        uploadedBy: z.ZodOptional<z.ZodString>;
        metadata: z.ZodOptional<z.ZodObject<{
            width: z.ZodOptional<z.ZodNumber>;
            height: z.ZodOptional<z.ZodNumber>;
            duration: z.ZodOptional<z.ZodNumber>;
            encoding: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            duration?: number | undefined;
            width?: number | undefined;
            height?: number | undefined;
            encoding?: string | undefined;
        }, {
            duration?: number | undefined;
            width?: number | undefined;
            height?: number | undefined;
            encoding?: string | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        url: string;
        id: string;
        size: number;
        name: string;
        originalName: string;
        mimeType: string;
        uploadedAt: Date;
        metadata?: {
            duration?: number | undefined;
            width?: number | undefined;
            height?: number | undefined;
            encoding?: string | undefined;
        } | undefined;
        thumbnailUrl?: string | undefined;
        uploadedBy?: string | undefined;
    }, {
        url: string;
        id: string;
        size: number;
        name: string;
        originalName: string;
        mimeType: string;
        uploadedAt: Date;
        metadata?: {
            duration?: number | undefined;
            width?: number | undefined;
            height?: number | undefined;
            encoding?: string | undefined;
        } | undefined;
        thumbnailUrl?: string | undefined;
        uploadedBy?: string | undefined;
    }>, "many">>;
    attributes: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        value: z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean]>;
        type: z.ZodEnum<["text", "number", "boolean", "select", "multiselect", "color", "image"]>;
        isRequired: z.ZodBoolean;
        isVariable: z.ZodBoolean;
        displayOrder: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        value: string | number | boolean;
        type: "number" | "boolean" | "select" | "color" | "image" | "text" | "multiselect";
        name: string;
        isRequired: boolean;
        isVariable: boolean;
        displayOrder: number;
    }, {
        value: string | number | boolean;
        type: "number" | "boolean" | "select" | "color" | "image" | "text" | "multiselect";
        name: string;
        isRequired: boolean;
        isVariable: boolean;
        displayOrder: number;
    }>, "many">;
    variants: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        sku: z.ZodString;
        name: z.ZodString;
        price: z.ZodObject<{
            amount: z.ZodNumber;
            currency: z.ZodEnum<["KRW", "USD", "EUR", "JPY", "CNY"]>;
        }, "strip", z.ZodTypeAny, {
            currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
            amount: number;
        }, {
            currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
            amount: number;
        }>;
        inventory: z.ZodObject<{
            quantity: z.ZodNumber;
            reservedQuantity: z.ZodNumber;
            minQuantity: z.ZodNumber;
            maxQuantity: z.ZodOptional<z.ZodNumber>;
            trackQuantity: z.ZodBoolean;
            allowBackorder: z.ZodBoolean;
            stockStatus: z.ZodEnum<["in_stock", "out_of_stock", "on_backorder"]>;
        }, "strip", z.ZodTypeAny, {
            quantity: number;
            reservedQuantity: number;
            minQuantity: number;
            trackQuantity: boolean;
            allowBackorder: boolean;
            stockStatus: "out_of_stock" | "in_stock" | "on_backorder";
            maxQuantity?: number | undefined;
        }, {
            quantity: number;
            reservedQuantity: number;
            minQuantity: number;
            trackQuantity: boolean;
            allowBackorder: boolean;
            stockStatus: "out_of_stock" | "in_stock" | "on_backorder";
            maxQuantity?: number | undefined;
        }>;
        attributes: z.ZodRecord<z.ZodString, z.ZodString>;
        image: z.ZodOptional<z.ZodString>;
        isDefault: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        id: string;
        sku: string;
        name: string;
        isDefault: boolean;
        price: {
            currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
            amount: number;
        };
        inventory: {
            quantity: number;
            reservedQuantity: number;
            minQuantity: number;
            trackQuantity: boolean;
            allowBackorder: boolean;
            stockStatus: "out_of_stock" | "in_stock" | "on_backorder";
            maxQuantity?: number | undefined;
        };
        attributes: Record<string, string>;
        image?: string | undefined;
    }, {
        id: string;
        sku: string;
        name: string;
        isDefault: boolean;
        price: {
            currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
            amount: number;
        };
        inventory: {
            quantity: number;
            reservedQuantity: number;
            minQuantity: number;
            trackQuantity: boolean;
            allowBackorder: boolean;
            stockStatus: "out_of_stock" | "in_stock" | "on_backorder";
            maxQuantity?: number | undefined;
        };
        attributes: Record<string, string>;
        image?: string | undefined;
    }>, "many">>;
    seo: z.ZodObject<{
        title: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        keywords: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        slug: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        slug: string;
        title?: string | undefined;
        description?: string | undefined;
        keywords?: string[] | undefined;
    }, {
        slug: string;
        title?: string | undefined;
        description?: string | undefined;
        keywords?: string[] | undefined;
    }>;
    weight: z.ZodOptional<z.ZodNumber>;
    dimensions: z.ZodOptional<z.ZodObject<{
        length: z.ZodNumber;
        width: z.ZodNumber;
        height: z.ZodNumber;
        unit: z.ZodEnum<["cm", "in"]>;
    }, "strip", z.ZodTypeAny, {
        length: number;
        unit: "in" | "cm";
        width: number;
        height: number;
    }, {
        length: number;
        unit: "in" | "cm";
        width: number;
        height: number;
    }>>;
    isDigital: z.ZodBoolean;
    isTaxable: z.ZodBoolean;
    isShippable: z.ZodBoolean;
} & {
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
    createdBy: z.ZodOptional<z.ZodString>;
    updatedBy: z.ZodOptional<z.ZodString>;
    version: z.ZodNumber;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    status: "active" | "inactive" | "draft" | "archived" | "out_of_stock";
    type: "simple" | "variable" | "grouped" | "external" | "subscription";
    id: string;
    sku: string;
    createdAt: Date;
    updatedAt: Date;
    name: string;
    version: number;
    description: string;
    price: {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    };
    inventory: {
        quantity: number;
        reservedQuantity: number;
        minQuantity: number;
        trackQuantity: boolean;
        allowBackorder: boolean;
        stockStatus: "out_of_stock" | "in_stock" | "on_backorder";
        maxQuantity?: number | undefined;
    };
    attributes: {
        value: string | number | boolean;
        type: "number" | "boolean" | "select" | "color" | "image" | "text" | "multiselect";
        name: string;
        isRequired: boolean;
        isVariable: boolean;
        displayOrder: number;
    }[];
    categoryId: string;
    images: {
        url: string;
        id: string;
        size: number;
        name: string;
        originalName: string;
        mimeType: string;
        uploadedAt: Date;
        metadata?: {
            duration?: number | undefined;
            width?: number | undefined;
            height?: number | undefined;
            encoding?: string | undefined;
        } | undefined;
        thumbnailUrl?: string | undefined;
        uploadedBy?: string | undefined;
    }[];
    seo: {
        slug: string;
        title?: string | undefined;
        description?: string | undefined;
        keywords?: string[] | undefined;
    };
    isDigital: boolean;
    isTaxable: boolean;
    isShippable: boolean;
    metadata?: Record<string, any> | undefined;
    tags?: string[] | undefined;
    weight?: number | undefined;
    createdBy?: string | undefined;
    updatedBy?: string | undefined;
    shortDescription?: string | undefined;
    brandId?: string | undefined;
    supplierId?: string | undefined;
    originalPrice?: {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    } | undefined;
    costPrice?: {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    } | undefined;
    videos?: {
        url: string;
        id: string;
        size: number;
        name: string;
        originalName: string;
        mimeType: string;
        uploadedAt: Date;
        metadata?: {
            duration?: number | undefined;
            width?: number | undefined;
            height?: number | undefined;
            encoding?: string | undefined;
        } | undefined;
        thumbnailUrl?: string | undefined;
        uploadedBy?: string | undefined;
    }[] | undefined;
    documents?: {
        url: string;
        id: string;
        size: number;
        name: string;
        originalName: string;
        mimeType: string;
        uploadedAt: Date;
        metadata?: {
            duration?: number | undefined;
            width?: number | undefined;
            height?: number | undefined;
            encoding?: string | undefined;
        } | undefined;
        thumbnailUrl?: string | undefined;
        uploadedBy?: string | undefined;
    }[] | undefined;
    variants?: {
        id: string;
        sku: string;
        name: string;
        isDefault: boolean;
        price: {
            currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
            amount: number;
        };
        inventory: {
            quantity: number;
            reservedQuantity: number;
            minQuantity: number;
            trackQuantity: boolean;
            allowBackorder: boolean;
            stockStatus: "out_of_stock" | "in_stock" | "on_backorder";
            maxQuantity?: number | undefined;
        };
        attributes: Record<string, string>;
        image?: string | undefined;
    }[] | undefined;
    dimensions?: {
        length: number;
        unit: "in" | "cm";
        width: number;
        height: number;
    } | undefined;
}, {
    status: "active" | "inactive" | "draft" | "archived" | "out_of_stock";
    type: "simple" | "variable" | "grouped" | "external" | "subscription";
    id: string;
    sku: string;
    createdAt: Date;
    updatedAt: Date;
    name: string;
    version: number;
    description: string;
    price: {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    };
    inventory: {
        quantity: number;
        reservedQuantity: number;
        minQuantity: number;
        trackQuantity: boolean;
        allowBackorder: boolean;
        stockStatus: "out_of_stock" | "in_stock" | "on_backorder";
        maxQuantity?: number | undefined;
    };
    attributes: {
        value: string | number | boolean;
        type: "number" | "boolean" | "select" | "color" | "image" | "text" | "multiselect";
        name: string;
        isRequired: boolean;
        isVariable: boolean;
        displayOrder: number;
    }[];
    categoryId: string;
    images: {
        url: string;
        id: string;
        size: number;
        name: string;
        originalName: string;
        mimeType: string;
        uploadedAt: Date;
        metadata?: {
            duration?: number | undefined;
            width?: number | undefined;
            height?: number | undefined;
            encoding?: string | undefined;
        } | undefined;
        thumbnailUrl?: string | undefined;
        uploadedBy?: string | undefined;
    }[];
    seo: {
        slug: string;
        title?: string | undefined;
        description?: string | undefined;
        keywords?: string[] | undefined;
    };
    isDigital: boolean;
    isTaxable: boolean;
    isShippable: boolean;
    metadata?: Record<string, any> | undefined;
    tags?: string[] | undefined;
    weight?: number | undefined;
    createdBy?: string | undefined;
    updatedBy?: string | undefined;
    shortDescription?: string | undefined;
    brandId?: string | undefined;
    supplierId?: string | undefined;
    originalPrice?: {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    } | undefined;
    costPrice?: {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    } | undefined;
    videos?: {
        url: string;
        id: string;
        size: number;
        name: string;
        originalName: string;
        mimeType: string;
        uploadedAt: Date;
        metadata?: {
            duration?: number | undefined;
            width?: number | undefined;
            height?: number | undefined;
            encoding?: string | undefined;
        } | undefined;
        thumbnailUrl?: string | undefined;
        uploadedBy?: string | undefined;
    }[] | undefined;
    documents?: {
        url: string;
        id: string;
        size: number;
        name: string;
        originalName: string;
        mimeType: string;
        uploadedAt: Date;
        metadata?: {
            duration?: number | undefined;
            width?: number | undefined;
            height?: number | undefined;
            encoding?: string | undefined;
        } | undefined;
        thumbnailUrl?: string | undefined;
        uploadedBy?: string | undefined;
    }[] | undefined;
    variants?: {
        id: string;
        sku: string;
        name: string;
        isDefault: boolean;
        price: {
            currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
            amount: number;
        };
        inventory: {
            quantity: number;
            reservedQuantity: number;
            minQuantity: number;
            trackQuantity: boolean;
            allowBackorder: boolean;
            stockStatus: "out_of_stock" | "in_stock" | "on_backorder";
            maxQuantity?: number | undefined;
        };
        attributes: Record<string, string>;
        image?: string | undefined;
    }[] | undefined;
    dimensions?: {
        length: number;
        unit: "in" | "cm";
        width: number;
        height: number;
    } | undefined;
}>;
export declare const OrderItemSchema: z.ZodObject<{
    id: z.ZodString;
    productId: z.ZodString;
    variantId: z.ZodOptional<z.ZodString>;
    sku: z.ZodString;
    name: z.ZodString;
    quantity: z.ZodNumber;
    unitPrice: z.ZodObject<{
        amount: z.ZodNumber;
        currency: z.ZodEnum<["KRW", "USD", "EUR", "JPY", "CNY"]>;
    }, "strip", z.ZodTypeAny, {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    }, {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    }>;
    totalPrice: z.ZodObject<{
        amount: z.ZodNumber;
        currency: z.ZodEnum<["KRW", "USD", "EUR", "JPY", "CNY"]>;
    }, "strip", z.ZodTypeAny, {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    }, {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    }>;
    tax: z.ZodObject<{
        amount: z.ZodNumber;
        currency: z.ZodEnum<["KRW", "USD", "EUR", "JPY", "CNY"]>;
    }, "strip", z.ZodTypeAny, {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    }, {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    }>;
    discount: z.ZodObject<{
        amount: z.ZodNumber;
        currency: z.ZodEnum<["KRW", "USD", "EUR", "JPY", "CNY"]>;
    }, "strip", z.ZodTypeAny, {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    }, {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    }>;
    attributes: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    image: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    totalPrice: {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    };
    productId: string;
    sku: string;
    quantity: number;
    unitPrice: {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    };
    discount: {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    };
    tax: {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    };
    name: string;
    image?: string | undefined;
    variantId?: string | undefined;
    attributes?: Record<string, string> | undefined;
}, {
    id: string;
    totalPrice: {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    };
    productId: string;
    sku: string;
    quantity: number;
    unitPrice: {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    };
    discount: {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    };
    tax: {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    };
    name: string;
    image?: string | undefined;
    variantId?: string | undefined;
    attributes?: Record<string, string> | undefined;
}>;
export declare const OrderSchema: z.ZodObject<{
    id: z.ZodString;
    orderNumber: z.ZodString;
    customerId: z.ZodOptional<z.ZodString>;
    guestInfo: z.ZodOptional<z.ZodObject<{
        email: z.ZodString;
        firstName: z.ZodString;
        lastName: z.ZodString;
        phone: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        email: string;
        firstName: string;
        lastName: string;
        phone?: string | undefined;
    }, {
        email: string;
        firstName: string;
        lastName: string;
        phone?: string | undefined;
    }>>;
    status: z.ZodEnum<["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded", "returned"]>;
    items: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        productId: z.ZodString;
        variantId: z.ZodOptional<z.ZodString>;
        sku: z.ZodString;
        name: z.ZodString;
        quantity: z.ZodNumber;
        unitPrice: z.ZodObject<{
            amount: z.ZodNumber;
            currency: z.ZodEnum<["KRW", "USD", "EUR", "JPY", "CNY"]>;
        }, "strip", z.ZodTypeAny, {
            currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
            amount: number;
        }, {
            currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
            amount: number;
        }>;
        totalPrice: z.ZodObject<{
            amount: z.ZodNumber;
            currency: z.ZodEnum<["KRW", "USD", "EUR", "JPY", "CNY"]>;
        }, "strip", z.ZodTypeAny, {
            currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
            amount: number;
        }, {
            currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
            amount: number;
        }>;
        tax: z.ZodObject<{
            amount: z.ZodNumber;
            currency: z.ZodEnum<["KRW", "USD", "EUR", "JPY", "CNY"]>;
        }, "strip", z.ZodTypeAny, {
            currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
            amount: number;
        }, {
            currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
            amount: number;
        }>;
        discount: z.ZodObject<{
            amount: z.ZodNumber;
            currency: z.ZodEnum<["KRW", "USD", "EUR", "JPY", "CNY"]>;
        }, "strip", z.ZodTypeAny, {
            currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
            amount: number;
        }, {
            currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
            amount: number;
        }>;
        attributes: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        image: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        totalPrice: {
            currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
            amount: number;
        };
        productId: string;
        sku: string;
        quantity: number;
        unitPrice: {
            currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
            amount: number;
        };
        discount: {
            currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
            amount: number;
        };
        tax: {
            currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
            amount: number;
        };
        name: string;
        image?: string | undefined;
        variantId?: string | undefined;
        attributes?: Record<string, string> | undefined;
    }, {
        id: string;
        totalPrice: {
            currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
            amount: number;
        };
        productId: string;
        sku: string;
        quantity: number;
        unitPrice: {
            currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
            amount: number;
        };
        discount: {
            currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
            amount: number;
        };
        tax: {
            currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
            amount: number;
        };
        name: string;
        image?: string | undefined;
        variantId?: string | undefined;
        attributes?: Record<string, string> | undefined;
    }>, "many">;
    subtotal: z.ZodObject<{
        amount: z.ZodNumber;
        currency: z.ZodEnum<["KRW", "USD", "EUR", "JPY", "CNY"]>;
    }, "strip", z.ZodTypeAny, {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    }, {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    }>;
    tax: z.ZodObject<{
        amount: z.ZodNumber;
        currency: z.ZodEnum<["KRW", "USD", "EUR", "JPY", "CNY"]>;
    }, "strip", z.ZodTypeAny, {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    }, {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    }>;
    shipping: z.ZodObject<{
        amount: z.ZodNumber;
        currency: z.ZodEnum<["KRW", "USD", "EUR", "JPY", "CNY"]>;
    }, "strip", z.ZodTypeAny, {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    }, {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    }>;
    discount: z.ZodObject<{
        amount: z.ZodNumber;
        currency: z.ZodEnum<["KRW", "USD", "EUR", "JPY", "CNY"]>;
    }, "strip", z.ZodTypeAny, {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    }, {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    }>;
    total: z.ZodObject<{
        amount: z.ZodNumber;
        currency: z.ZodEnum<["KRW", "USD", "EUR", "JPY", "CNY"]>;
    }, "strip", z.ZodTypeAny, {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    }, {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    }>;
    shippingAddress: z.ZodObject<{
        country: z.ZodString;
        state: z.ZodOptional<z.ZodString>;
        city: z.ZodString;
        district: z.ZodOptional<z.ZodString>;
        street: z.ZodString;
        detail: z.ZodOptional<z.ZodString>;
        postalCode: z.ZodString;
        latitude: z.ZodOptional<z.ZodNumber>;
        longitude: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        street: string;
        city: string;
        country: string;
        postalCode: string;
        state?: string | undefined;
        district?: string | undefined;
        detail?: string | undefined;
        latitude?: number | undefined;
        longitude?: number | undefined;
    }, {
        street: string;
        city: string;
        country: string;
        postalCode: string;
        state?: string | undefined;
        district?: string | undefined;
        detail?: string | undefined;
        latitude?: number | undefined;
        longitude?: number | undefined;
    }>;
    billingAddress: z.ZodObject<{
        country: z.ZodString;
        state: z.ZodOptional<z.ZodString>;
        city: z.ZodString;
        district: z.ZodOptional<z.ZodString>;
        street: z.ZodString;
        detail: z.ZodOptional<z.ZodString>;
        postalCode: z.ZodString;
        latitude: z.ZodOptional<z.ZodNumber>;
        longitude: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        street: string;
        city: string;
        country: string;
        postalCode: string;
        state?: string | undefined;
        district?: string | undefined;
        detail?: string | undefined;
        latitude?: number | undefined;
        longitude?: number | undefined;
    }, {
        street: string;
        city: string;
        country: string;
        postalCode: string;
        state?: string | undefined;
        district?: string | undefined;
        detail?: string | undefined;
        latitude?: number | undefined;
        longitude?: number | undefined;
    }>;
    shippingMethod: z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        price: z.ZodObject<{
            amount: z.ZodNumber;
            currency: z.ZodEnum<["KRW", "USD", "EUR", "JPY", "CNY"]>;
        }, "strip", z.ZodTypeAny, {
            currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
            amount: number;
        }, {
            currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
            amount: number;
        }>;
        estimatedDays: z.ZodNumber;
        trackingEnabled: z.ZodBoolean;
        carrier: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        price: {
            currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
            amount: number;
        };
        estimatedDays: number;
        trackingEnabled: boolean;
        description?: string | undefined;
        carrier?: string | undefined;
    }, {
        id: string;
        name: string;
        price: {
            currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
            amount: number;
        };
        estimatedDays: number;
        trackingEnabled: boolean;
        description?: string | undefined;
        carrier?: string | undefined;
    }>;
    payment: z.ZodObject<{
        method: z.ZodEnum<["credit_card", "debit_card", "paypal", "bank_transfer", "cash", "crypto"]>;
        status: z.ZodEnum<["pending", "authorized", "paid", "failed", "cancelled", "refunded"]>;
        transactionId: z.ZodOptional<z.ZodString>;
        gatewayResponse: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        paidAt: z.ZodOptional<z.ZodDate>;
        failedAt: z.ZodOptional<z.ZodDate>;
        failureReason: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        status: "pending" | "cancelled" | "refunded" | "authorized" | "paid" | "failed";
        method: "crypto" | "credit_card" | "debit_card" | "paypal" | "bank_transfer" | "cash";
        transactionId?: string | undefined;
        gatewayResponse?: Record<string, any> | undefined;
        paidAt?: Date | undefined;
        failedAt?: Date | undefined;
        failureReason?: string | undefined;
    }, {
        status: "pending" | "cancelled" | "refunded" | "authorized" | "paid" | "failed";
        method: "crypto" | "credit_card" | "debit_card" | "paypal" | "bank_transfer" | "cash";
        transactionId?: string | undefined;
        gatewayResponse?: Record<string, any> | undefined;
        paidAt?: Date | undefined;
        failedAt?: Date | undefined;
        failureReason?: string | undefined;
    }>;
    notes: z.ZodOptional<z.ZodString>;
    source: z.ZodEnum<["web", "mobile", "pos", "phone", "email", "api"]>;
    estimatedDelivery: z.ZodOptional<z.ZodDate>;
    deliveredAt: z.ZodOptional<z.ZodDate>;
    cancelledAt: z.ZodOptional<z.ZodDate>;
    refundedAt: z.ZodOptional<z.ZodDate>;
} & {
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
    createdBy: z.ZodOptional<z.ZodString>;
    updatedBy: z.ZodOptional<z.ZodString>;
    version: z.ZodNumber;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    status: "pending" | "delivered" | "cancelled" | "confirmed" | "processing" | "shipped" | "refunded" | "returned";
    source: "email" | "phone" | "api" | "mobile" | "web" | "pos";
    id: string;
    discount: {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    };
    tax: {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    };
    orderNumber: string;
    items: {
        id: string;
        totalPrice: {
            currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
            amount: number;
        };
        productId: string;
        sku: string;
        quantity: number;
        unitPrice: {
            currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
            amount: number;
        };
        discount: {
            currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
            amount: number;
        };
        tax: {
            currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
            amount: number;
        };
        name: string;
        image?: string | undefined;
        variantId?: string | undefined;
        attributes?: Record<string, string> | undefined;
    }[];
    shippingAddress: {
        street: string;
        city: string;
        country: string;
        postalCode: string;
        state?: string | undefined;
        district?: string | undefined;
        detail?: string | undefined;
        latitude?: number | undefined;
        longitude?: number | undefined;
    };
    billingAddress: {
        street: string;
        city: string;
        country: string;
        postalCode: string;
        state?: string | undefined;
        district?: string | undefined;
        detail?: string | undefined;
        latitude?: number | undefined;
        longitude?: number | undefined;
    };
    subtotal: {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    };
    shipping: {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    };
    total: {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    };
    shippingMethod: {
        id: string;
        name: string;
        price: {
            currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
            amount: number;
        };
        estimatedDays: number;
        trackingEnabled: boolean;
        description?: string | undefined;
        carrier?: string | undefined;
    };
    createdAt: Date;
    updatedAt: Date;
    version: number;
    payment: {
        status: "pending" | "cancelled" | "refunded" | "authorized" | "paid" | "failed";
        method: "crypto" | "credit_card" | "debit_card" | "paypal" | "bank_transfer" | "cash";
        transactionId?: string | undefined;
        gatewayResponse?: Record<string, any> | undefined;
        paidAt?: Date | undefined;
        failedAt?: Date | undefined;
        failureReason?: string | undefined;
    };
    metadata?: Record<string, any> | undefined;
    customerId?: string | undefined;
    notes?: string | undefined;
    deliveredAt?: Date | undefined;
    cancelledAt?: Date | undefined;
    tags?: string[] | undefined;
    createdBy?: string | undefined;
    updatedBy?: string | undefined;
    guestInfo?: {
        email: string;
        firstName: string;
        lastName: string;
        phone?: string | undefined;
    } | undefined;
    estimatedDelivery?: Date | undefined;
    refundedAt?: Date | undefined;
}, {
    status: "pending" | "delivered" | "cancelled" | "confirmed" | "processing" | "shipped" | "refunded" | "returned";
    source: "email" | "phone" | "api" | "mobile" | "web" | "pos";
    id: string;
    discount: {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    };
    tax: {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    };
    orderNumber: string;
    items: {
        id: string;
        totalPrice: {
            currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
            amount: number;
        };
        productId: string;
        sku: string;
        quantity: number;
        unitPrice: {
            currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
            amount: number;
        };
        discount: {
            currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
            amount: number;
        };
        tax: {
            currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
            amount: number;
        };
        name: string;
        image?: string | undefined;
        variantId?: string | undefined;
        attributes?: Record<string, string> | undefined;
    }[];
    shippingAddress: {
        street: string;
        city: string;
        country: string;
        postalCode: string;
        state?: string | undefined;
        district?: string | undefined;
        detail?: string | undefined;
        latitude?: number | undefined;
        longitude?: number | undefined;
    };
    billingAddress: {
        street: string;
        city: string;
        country: string;
        postalCode: string;
        state?: string | undefined;
        district?: string | undefined;
        detail?: string | undefined;
        latitude?: number | undefined;
        longitude?: number | undefined;
    };
    subtotal: {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    };
    shipping: {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    };
    total: {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    };
    shippingMethod: {
        id: string;
        name: string;
        price: {
            currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
            amount: number;
        };
        estimatedDays: number;
        trackingEnabled: boolean;
        description?: string | undefined;
        carrier?: string | undefined;
    };
    createdAt: Date;
    updatedAt: Date;
    version: number;
    payment: {
        status: "pending" | "cancelled" | "refunded" | "authorized" | "paid" | "failed";
        method: "crypto" | "credit_card" | "debit_card" | "paypal" | "bank_transfer" | "cash";
        transactionId?: string | undefined;
        gatewayResponse?: Record<string, any> | undefined;
        paidAt?: Date | undefined;
        failedAt?: Date | undefined;
        failureReason?: string | undefined;
    };
    metadata?: Record<string, any> | undefined;
    customerId?: string | undefined;
    notes?: string | undefined;
    deliveredAt?: Date | undefined;
    cancelledAt?: Date | undefined;
    tags?: string[] | undefined;
    createdBy?: string | undefined;
    updatedBy?: string | undefined;
    guestInfo?: {
        email: string;
        firstName: string;
        lastName: string;
        phone?: string | undefined;
    } | undefined;
    estimatedDelivery?: Date | undefined;
    refundedAt?: Date | undefined;
}>;
export declare const FormFieldSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    label: z.ZodString;
    type: z.ZodEnum<["text", "email", "password", "number", "tel", "url", "textarea", "select", "multiselect", "checkbox", "radio", "date", "datetime", "time", "file", "image", "color", "range", "hidden"]>;
    required: z.ZodBoolean;
    placeholder: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    defaultValue: z.ZodOptional<z.ZodAny>;
    options: z.ZodOptional<z.ZodArray<z.ZodObject<{
        label: z.ZodString;
        value: z.ZodAny;
        disabled: z.ZodOptional<z.ZodBoolean>;
        group: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        label: string;
        value?: any;
        disabled?: boolean | undefined;
        group?: string | undefined;
    }, {
        label: string;
        value?: any;
        disabled?: boolean | undefined;
        group?: string | undefined;
    }>, "many">>;
    validation: z.ZodOptional<z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<["required", "min", "max", "pattern", "custom"]>;
        value: z.ZodOptional<z.ZodAny>;
        message: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        message: string;
        type: "required" | "custom" | "pattern" | "min" | "max";
        value?: any;
    }, {
        message: string;
        type: "required" | "custom" | "pattern" | "min" | "max";
        value?: any;
    }>, "many">>;
    conditions: z.ZodOptional<z.ZodArray<z.ZodObject<{
        field: z.ZodString;
        operator: z.ZodEnum<["eq", "ne", "gt", "lt", "in", "nin", "empty", "exists"]>;
        value: z.ZodAny;
        action: z.ZodEnum<["show", "hide", "enable", "disable", "require"]>;
    }, "strip", z.ZodTypeAny, {
        action: "show" | "hide" | "enable" | "disable" | "require";
        field: string;
        operator: "eq" | "ne" | "gt" | "lt" | "in" | "nin" | "exists" | "empty";
        value?: any;
    }, {
        action: "show" | "hide" | "enable" | "disable" | "require";
        field: string;
        operator: "eq" | "ne" | "gt" | "lt" | "in" | "nin" | "exists" | "empty";
        value?: any;
    }>, "many">>;
    styling: z.ZodOptional<z.ZodObject<{
        width: z.ZodOptional<z.ZodString>;
        className: z.ZodOptional<z.ZodString>;
        labelPosition: z.ZodOptional<z.ZodEnum<["top", "left", "right", "bottom"]>>;
        hideLabel: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        className?: string | undefined;
        width?: string | undefined;
        labelPosition?: "left" | "right" | "top" | "bottom" | undefined;
        hideLabel?: boolean | undefined;
    }, {
        className?: string | undefined;
        width?: string | undefined;
        labelPosition?: "left" | "right" | "top" | "bottom" | undefined;
        hideLabel?: boolean | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    label: string;
    type: "number" | "select" | "email" | "password" | "textarea" | "time" | "checkbox" | "color" | "date" | "file" | "hidden" | "image" | "radio" | "range" | "tel" | "text" | "url" | "multiselect" | "datetime";
    id: string;
    required: boolean;
    name: string;
    placeholder?: string | undefined;
    options?: {
        label: string;
        value?: any;
        disabled?: boolean | undefined;
        group?: string | undefined;
    }[] | undefined;
    validation?: {
        message: string;
        type: "required" | "custom" | "pattern" | "min" | "max";
        value?: any;
    }[] | undefined;
    description?: string | undefined;
    conditions?: {
        action: "show" | "hide" | "enable" | "disable" | "require";
        field: string;
        operator: "eq" | "ne" | "gt" | "lt" | "in" | "nin" | "exists" | "empty";
        value?: any;
    }[] | undefined;
    defaultValue?: any;
    styling?: {
        className?: string | undefined;
        width?: string | undefined;
        labelPosition?: "left" | "right" | "top" | "bottom" | undefined;
        hideLabel?: boolean | undefined;
    } | undefined;
}, {
    label: string;
    type: "number" | "select" | "email" | "password" | "textarea" | "time" | "checkbox" | "color" | "date" | "file" | "hidden" | "image" | "radio" | "range" | "tel" | "text" | "url" | "multiselect" | "datetime";
    id: string;
    required: boolean;
    name: string;
    placeholder?: string | undefined;
    options?: {
        label: string;
        value?: any;
        disabled?: boolean | undefined;
        group?: string | undefined;
    }[] | undefined;
    validation?: {
        message: string;
        type: "required" | "custom" | "pattern" | "min" | "max";
        value?: any;
    }[] | undefined;
    description?: string | undefined;
    conditions?: {
        action: "show" | "hide" | "enable" | "disable" | "require";
        field: string;
        operator: "eq" | "ne" | "gt" | "lt" | "in" | "nin" | "exists" | "empty";
        value?: any;
    }[] | undefined;
    defaultValue?: any;
    styling?: {
        className?: string | undefined;
        width?: string | undefined;
        labelPosition?: "left" | "right" | "top" | "bottom" | undefined;
        hideLabel?: boolean | undefined;
    } | undefined;
}>;
export declare const FormDefinitionSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    schema: z.ZodObject<{
        fields: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
            label: z.ZodString;
            type: z.ZodEnum<["text", "email", "password", "number", "tel", "url", "textarea", "select", "multiselect", "checkbox", "radio", "date", "datetime", "time", "file", "image", "color", "range", "hidden"]>;
            required: z.ZodBoolean;
            placeholder: z.ZodOptional<z.ZodString>;
            description: z.ZodOptional<z.ZodString>;
            defaultValue: z.ZodOptional<z.ZodAny>;
            options: z.ZodOptional<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                value: z.ZodAny;
                disabled: z.ZodOptional<z.ZodBoolean>;
                group: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                label: string;
                value?: any;
                disabled?: boolean | undefined;
                group?: string | undefined;
            }, {
                label: string;
                value?: any;
                disabled?: boolean | undefined;
                group?: string | undefined;
            }>, "many">>;
            validation: z.ZodOptional<z.ZodArray<z.ZodObject<{
                type: z.ZodEnum<["required", "min", "max", "pattern", "custom"]>;
                value: z.ZodOptional<z.ZodAny>;
                message: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                message: string;
                type: "required" | "custom" | "pattern" | "min" | "max";
                value?: any;
            }, {
                message: string;
                type: "required" | "custom" | "pattern" | "min" | "max";
                value?: any;
            }>, "many">>;
            conditions: z.ZodOptional<z.ZodArray<z.ZodObject<{
                field: z.ZodString;
                operator: z.ZodEnum<["eq", "ne", "gt", "lt", "in", "nin", "empty", "exists"]>;
                value: z.ZodAny;
                action: z.ZodEnum<["show", "hide", "enable", "disable", "require"]>;
            }, "strip", z.ZodTypeAny, {
                action: "show" | "hide" | "enable" | "disable" | "require";
                field: string;
                operator: "eq" | "ne" | "gt" | "lt" | "in" | "nin" | "exists" | "empty";
                value?: any;
            }, {
                action: "show" | "hide" | "enable" | "disable" | "require";
                field: string;
                operator: "eq" | "ne" | "gt" | "lt" | "in" | "nin" | "exists" | "empty";
                value?: any;
            }>, "many">>;
            styling: z.ZodOptional<z.ZodObject<{
                width: z.ZodOptional<z.ZodString>;
                className: z.ZodOptional<z.ZodString>;
                labelPosition: z.ZodOptional<z.ZodEnum<["top", "left", "right", "bottom"]>>;
                hideLabel: z.ZodOptional<z.ZodBoolean>;
            }, "strip", z.ZodTypeAny, {
                className?: string | undefined;
                width?: string | undefined;
                labelPosition?: "left" | "right" | "top" | "bottom" | undefined;
                hideLabel?: boolean | undefined;
            }, {
                className?: string | undefined;
                width?: string | undefined;
                labelPosition?: "left" | "right" | "top" | "bottom" | undefined;
                hideLabel?: boolean | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            label: string;
            type: "number" | "select" | "email" | "password" | "textarea" | "time" | "checkbox" | "color" | "date" | "file" | "hidden" | "image" | "radio" | "range" | "tel" | "text" | "url" | "multiselect" | "datetime";
            id: string;
            required: boolean;
            name: string;
            placeholder?: string | undefined;
            options?: {
                label: string;
                value?: any;
                disabled?: boolean | undefined;
                group?: string | undefined;
            }[] | undefined;
            validation?: {
                message: string;
                type: "required" | "custom" | "pattern" | "min" | "max";
                value?: any;
            }[] | undefined;
            description?: string | undefined;
            conditions?: {
                action: "show" | "hide" | "enable" | "disable" | "require";
                field: string;
                operator: "eq" | "ne" | "gt" | "lt" | "in" | "nin" | "exists" | "empty";
                value?: any;
            }[] | undefined;
            defaultValue?: any;
            styling?: {
                className?: string | undefined;
                width?: string | undefined;
                labelPosition?: "left" | "right" | "top" | "bottom" | undefined;
                hideLabel?: boolean | undefined;
            } | undefined;
        }, {
            label: string;
            type: "number" | "select" | "email" | "password" | "textarea" | "time" | "checkbox" | "color" | "date" | "file" | "hidden" | "image" | "radio" | "range" | "tel" | "text" | "url" | "multiselect" | "datetime";
            id: string;
            required: boolean;
            name: string;
            placeholder?: string | undefined;
            options?: {
                label: string;
                value?: any;
                disabled?: boolean | undefined;
                group?: string | undefined;
            }[] | undefined;
            validation?: {
                message: string;
                type: "required" | "custom" | "pattern" | "min" | "max";
                value?: any;
            }[] | undefined;
            description?: string | undefined;
            conditions?: {
                action: "show" | "hide" | "enable" | "disable" | "require";
                field: string;
                operator: "eq" | "ne" | "gt" | "lt" | "in" | "nin" | "exists" | "empty";
                value?: any;
            }[] | undefined;
            defaultValue?: any;
            styling?: {
                className?: string | undefined;
                width?: string | undefined;
                labelPosition?: "left" | "right" | "top" | "bottom" | undefined;
                hideLabel?: boolean | undefined;
            } | undefined;
        }>, "many">;
        sections: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            title: z.ZodString;
            description: z.ZodOptional<z.ZodString>;
            fields: z.ZodArray<z.ZodString, "many">;
            collapsible: z.ZodOptional<z.ZodBoolean>;
            defaultExpanded: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            title: string;
            id: string;
            fields: string[];
            description?: string | undefined;
            collapsible?: boolean | undefined;
            defaultExpanded?: boolean | undefined;
        }, {
            title: string;
            id: string;
            fields: string[];
            description?: string | undefined;
            collapsible?: boolean | undefined;
            defaultExpanded?: boolean | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        fields: {
            label: string;
            type: "number" | "select" | "email" | "password" | "textarea" | "time" | "checkbox" | "color" | "date" | "file" | "hidden" | "image" | "radio" | "range" | "tel" | "text" | "url" | "multiselect" | "datetime";
            id: string;
            required: boolean;
            name: string;
            placeholder?: string | undefined;
            options?: {
                label: string;
                value?: any;
                disabled?: boolean | undefined;
                group?: string | undefined;
            }[] | undefined;
            validation?: {
                message: string;
                type: "required" | "custom" | "pattern" | "min" | "max";
                value?: any;
            }[] | undefined;
            description?: string | undefined;
            conditions?: {
                action: "show" | "hide" | "enable" | "disable" | "require";
                field: string;
                operator: "eq" | "ne" | "gt" | "lt" | "in" | "nin" | "exists" | "empty";
                value?: any;
            }[] | undefined;
            defaultValue?: any;
            styling?: {
                className?: string | undefined;
                width?: string | undefined;
                labelPosition?: "left" | "right" | "top" | "bottom" | undefined;
                hideLabel?: boolean | undefined;
            } | undefined;
        }[];
        sections?: {
            title: string;
            id: string;
            fields: string[];
            description?: string | undefined;
            collapsible?: boolean | undefined;
            defaultExpanded?: boolean | undefined;
        }[] | undefined;
    }, {
        fields: {
            label: string;
            type: "number" | "select" | "email" | "password" | "textarea" | "time" | "checkbox" | "color" | "date" | "file" | "hidden" | "image" | "radio" | "range" | "tel" | "text" | "url" | "multiselect" | "datetime";
            id: string;
            required: boolean;
            name: string;
            placeholder?: string | undefined;
            options?: {
                label: string;
                value?: any;
                disabled?: boolean | undefined;
                group?: string | undefined;
            }[] | undefined;
            validation?: {
                message: string;
                type: "required" | "custom" | "pattern" | "min" | "max";
                value?: any;
            }[] | undefined;
            description?: string | undefined;
            conditions?: {
                action: "show" | "hide" | "enable" | "disable" | "require";
                field: string;
                operator: "eq" | "ne" | "gt" | "lt" | "in" | "nin" | "exists" | "empty";
                value?: any;
            }[] | undefined;
            defaultValue?: any;
            styling?: {
                className?: string | undefined;
                width?: string | undefined;
                labelPosition?: "left" | "right" | "top" | "bottom" | undefined;
                hideLabel?: boolean | undefined;
            } | undefined;
        }[];
        sections?: {
            title: string;
            id: string;
            fields: string[];
            description?: string | undefined;
            collapsible?: boolean | undefined;
            defaultExpanded?: boolean | undefined;
        }[] | undefined;
    }>;
    layout: z.ZodObject<{
        type: z.ZodEnum<["single", "multi", "wizard", "accordion"]>;
        columns: z.ZodOptional<z.ZodNumber>;
        gap: z.ZodOptional<z.ZodString>;
        alignment: z.ZodOptional<z.ZodEnum<["left", "center", "right"]>>;
    }, "strip", z.ZodTypeAny, {
        type: "single" | "multi" | "wizard" | "accordion";
        columns?: number | undefined;
        gap?: string | undefined;
        alignment?: "left" | "center" | "right" | undefined;
    }, {
        type: "single" | "multi" | "wizard" | "accordion";
        columns?: number | undefined;
        gap?: string | undefined;
        alignment?: "left" | "center" | "right" | undefined;
    }>;
    validation: z.ZodObject<{
        mode: z.ZodEnum<["onChange", "onBlur", "onSubmit", "all"]>;
        revalidateMode: z.ZodEnum<["onChange", "onBlur", "onSubmit"]>;
        resolver: z.ZodOptional<z.ZodString>;
        schema: z.ZodOptional<z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        mode: "onSubmit" | "onChange" | "all" | "onBlur";
        revalidateMode: "onSubmit" | "onChange" | "onBlur";
        schema?: any;
        resolver?: string | undefined;
    }, {
        mode: "onSubmit" | "onChange" | "all" | "onBlur";
        revalidateMode: "onSubmit" | "onChange" | "onBlur";
        schema?: any;
        resolver?: string | undefined;
    }>;
    submission: z.ZodObject<{
        method: z.ZodEnum<["POST", "PUT", "PATCH"]>;
        action: z.ZodString;
        redirect: z.ZodOptional<z.ZodString>;
        successMessage: z.ZodOptional<z.ZodString>;
        errorMessage: z.ZodOptional<z.ZodString>;
        resetOnSuccess: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        action: string;
        method: "POST" | "PUT" | "PATCH";
        errorMessage?: string | undefined;
        redirect?: string | undefined;
        successMessage?: string | undefined;
        resetOnSuccess?: boolean | undefined;
    }, {
        action: string;
        method: "POST" | "PUT" | "PATCH";
        errorMessage?: string | undefined;
        redirect?: string | undefined;
        successMessage?: string | undefined;
        resetOnSuccess?: boolean | undefined;
    }>;
    styling: z.ZodObject<{
        theme: z.ZodString;
        className: z.ZodOptional<z.ZodString>;
        customCSS: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        theme: string;
        className?: string | undefined;
        customCSS?: string | undefined;
    }, {
        theme: string;
        className?: string | undefined;
        customCSS?: string | undefined;
    }>;
    settings: z.ZodObject<{
        saveProgress: z.ZodOptional<z.ZodBoolean>;
        progressIndicator: z.ZodOptional<z.ZodBoolean>;
        confirmBeforeLeave: z.ZodOptional<z.ZodBoolean>;
        autoSave: z.ZodOptional<z.ZodObject<{
            enabled: z.ZodBoolean;
            interval: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
            interval: number;
        }, {
            enabled: boolean;
            interval: number;
        }>>;
    }, "strip", z.ZodTypeAny, {
        saveProgress?: boolean | undefined;
        progressIndicator?: boolean | undefined;
        confirmBeforeLeave?: boolean | undefined;
        autoSave?: {
            enabled: boolean;
            interval: number;
        } | undefined;
    }, {
        saveProgress?: boolean | undefined;
        progressIndicator?: boolean | undefined;
        confirmBeforeLeave?: boolean | undefined;
        autoSave?: {
            enabled: boolean;
            interval: number;
        } | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    id: string;
    validation: {
        mode: "onSubmit" | "onChange" | "all" | "onBlur";
        revalidateMode: "onSubmit" | "onChange" | "onBlur";
        schema?: any;
        resolver?: string | undefined;
    };
    name: string;
    styling: {
        theme: string;
        className?: string | undefined;
        customCSS?: string | undefined;
    };
    schema: {
        fields: {
            label: string;
            type: "number" | "select" | "email" | "password" | "textarea" | "time" | "checkbox" | "color" | "date" | "file" | "hidden" | "image" | "radio" | "range" | "tel" | "text" | "url" | "multiselect" | "datetime";
            id: string;
            required: boolean;
            name: string;
            placeholder?: string | undefined;
            options?: {
                label: string;
                value?: any;
                disabled?: boolean | undefined;
                group?: string | undefined;
            }[] | undefined;
            validation?: {
                message: string;
                type: "required" | "custom" | "pattern" | "min" | "max";
                value?: any;
            }[] | undefined;
            description?: string | undefined;
            conditions?: {
                action: "show" | "hide" | "enable" | "disable" | "require";
                field: string;
                operator: "eq" | "ne" | "gt" | "lt" | "in" | "nin" | "exists" | "empty";
                value?: any;
            }[] | undefined;
            defaultValue?: any;
            styling?: {
                className?: string | undefined;
                width?: string | undefined;
                labelPosition?: "left" | "right" | "top" | "bottom" | undefined;
                hideLabel?: boolean | undefined;
            } | undefined;
        }[];
        sections?: {
            title: string;
            id: string;
            fields: string[];
            description?: string | undefined;
            collapsible?: boolean | undefined;
            defaultExpanded?: boolean | undefined;
        }[] | undefined;
    };
    layout: {
        type: "single" | "multi" | "wizard" | "accordion";
        columns?: number | undefined;
        gap?: string | undefined;
        alignment?: "left" | "center" | "right" | undefined;
    };
    submission: {
        action: string;
        method: "POST" | "PUT" | "PATCH";
        errorMessage?: string | undefined;
        redirect?: string | undefined;
        successMessage?: string | undefined;
        resetOnSuccess?: boolean | undefined;
    };
    settings: {
        saveProgress?: boolean | undefined;
        progressIndicator?: boolean | undefined;
        confirmBeforeLeave?: boolean | undefined;
        autoSave?: {
            enabled: boolean;
            interval: number;
        } | undefined;
    };
    description?: string | undefined;
}, {
    id: string;
    validation: {
        mode: "onSubmit" | "onChange" | "all" | "onBlur";
        revalidateMode: "onSubmit" | "onChange" | "onBlur";
        schema?: any;
        resolver?: string | undefined;
    };
    name: string;
    styling: {
        theme: string;
        className?: string | undefined;
        customCSS?: string | undefined;
    };
    schema: {
        fields: {
            label: string;
            type: "number" | "select" | "email" | "password" | "textarea" | "time" | "checkbox" | "color" | "date" | "file" | "hidden" | "image" | "radio" | "range" | "tel" | "text" | "url" | "multiselect" | "datetime";
            id: string;
            required: boolean;
            name: string;
            placeholder?: string | undefined;
            options?: {
                label: string;
                value?: any;
                disabled?: boolean | undefined;
                group?: string | undefined;
            }[] | undefined;
            validation?: {
                message: string;
                type: "required" | "custom" | "pattern" | "min" | "max";
                value?: any;
            }[] | undefined;
            description?: string | undefined;
            conditions?: {
                action: "show" | "hide" | "enable" | "disable" | "require";
                field: string;
                operator: "eq" | "ne" | "gt" | "lt" | "in" | "nin" | "exists" | "empty";
                value?: any;
            }[] | undefined;
            defaultValue?: any;
            styling?: {
                className?: string | undefined;
                width?: string | undefined;
                labelPosition?: "left" | "right" | "top" | "bottom" | undefined;
                hideLabel?: boolean | undefined;
            } | undefined;
        }[];
        sections?: {
            title: string;
            id: string;
            fields: string[];
            description?: string | undefined;
            collapsible?: boolean | undefined;
            defaultExpanded?: boolean | undefined;
        }[] | undefined;
    };
    layout: {
        type: "single" | "multi" | "wizard" | "accordion";
        columns?: number | undefined;
        gap?: string | undefined;
        alignment?: "left" | "center" | "right" | undefined;
    };
    submission: {
        action: string;
        method: "POST" | "PUT" | "PATCH";
        errorMessage?: string | undefined;
        redirect?: string | undefined;
        successMessage?: string | undefined;
        resetOnSuccess?: boolean | undefined;
    };
    settings: {
        saveProgress?: boolean | undefined;
        progressIndicator?: boolean | undefined;
        confirmBeforeLeave?: boolean | undefined;
        autoSave?: {
            enabled: boolean;
            interval: number;
        } | undefined;
    };
    description?: string | undefined;
}>;
export declare const FilterConditionSchema: z.ZodObject<{
    field: z.ZodString;
    operator: z.ZodEnum<["eq", "ne", "gt", "gte", "lt", "lte", "in", "nin", "like", "regex", "exists", "null", "empty"]>;
    value: z.ZodAny;
    type: z.ZodOptional<z.ZodEnum<["and", "or"]>>;
}, "strip", z.ZodTypeAny, {
    field: string;
    operator: "null" | "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "in" | "nin" | "like" | "regex" | "exists" | "empty";
    value?: any;
    type?: "and" | "or" | undefined;
}, {
    field: string;
    operator: "null" | "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "in" | "nin" | "like" | "regex" | "exists" | "empty";
    value?: any;
    type?: "and" | "or" | undefined;
}>;
export declare const SearchParamsSchema: z.ZodObject<{
    query: z.ZodOptional<z.ZodString>;
    filters: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    pagination: z.ZodOptional<z.ZodObject<{
        page: z.ZodOptional<z.ZodNumber>;
        limit: z.ZodOptional<z.ZodNumber>;
        sort: z.ZodOptional<z.ZodString>;
        order: z.ZodOptional<z.ZodEnum<["asc", "desc"]>>;
    }, "strip", z.ZodTypeAny, {
        sort?: string | undefined;
        order?: "asc" | "desc" | undefined;
        limit?: number | undefined;
        page?: number | undefined;
    }, {
        sort?: string | undefined;
        order?: "asc" | "desc" | undefined;
        limit?: number | undefined;
        page?: number | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    filters?: Record<string, any> | undefined;
    pagination?: {
        sort?: string | undefined;
        order?: "asc" | "desc" | undefined;
        limit?: number | undefined;
        page?: number | undefined;
    } | undefined;
    query?: string | undefined;
}, {
    filters?: Record<string, any> | undefined;
    pagination?: {
        sort?: string | undefined;
        order?: "asc" | "desc" | undefined;
        limit?: number | undefined;
        page?: number | undefined;
    } | undefined;
    query?: string | undefined;
}>;
export declare const validate: <T>(schema: z.ZodSchema<T>, data: unknown) => {
    success: true;
    data: T;
} | {
    success: false;
    errors: z.ZodError;
};
export declare const validateAsync: <T>(schema: z.ZodSchema<T>, data: unknown) => Promise<{
    success: true;
    data: T;
} | {
    success: false;
    errors: z.ZodError;
}>;
export type InferSchema<T extends z.ZodTypeAny> = z.infer<T>;
export declare const CreateUserSchema: z.ZodObject<{
    status: z.ZodEnum<["active", "inactive", "suspended", "pending", "deleted"]>;
    displayName: z.ZodString;
    email: z.ZodString;
    avatar: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    createdBy: z.ZodOptional<z.ZodString>;
    updatedBy: z.ZodOptional<z.ZodString>;
    username: z.ZodOptional<z.ZodString>;
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
    bio: z.ZodOptional<z.ZodString>;
    emailVerified: z.ZodBoolean;
    phoneVerified: z.ZodBoolean;
    twoFactorEnabled: z.ZodBoolean;
    roles: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        displayName: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        level: z.ZodNumber;
        permissions: z.ZodArray<z.ZodAny, "many">;
        isSystemRole: z.ZodBoolean;
        isDefault: z.ZodBoolean;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
    }, "strip", z.ZodTypeAny, {
        displayName: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        level: number;
        permissions: any[];
        isSystemRole: boolean;
        isDefault: boolean;
        description?: string | undefined;
    }, {
        displayName: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        level: number;
        permissions: any[];
        isSystemRole: boolean;
        isDefault: boolean;
        description?: string | undefined;
    }>, "many">>;
    permissions: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        resource: z.ZodString;
        action: z.ZodEnum<["create", "read", "update", "delete", "list", "execute", "*"]>;
        conditions: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
        description: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        action: "*" | "delete" | "create" | "list" | "update" | "read" | "execute";
        resource: string;
        name: string;
        description?: string | undefined;
        conditions?: any[] | undefined;
    }, {
        id: string;
        action: "*" | "delete" | "create" | "list" | "update" | "read" | "execute";
        resource: string;
        name: string;
        description?: string | undefined;
        conditions?: any[] | undefined;
    }>, "many">>;
    profile: z.ZodObject<{
        phone: z.ZodOptional<z.ZodString>;
        birthDate: z.ZodOptional<z.ZodDate>;
        gender: z.ZodOptional<z.ZodEnum<["male", "female", "other", "prefer_not_to_say"]>>;
        nationality: z.ZodOptional<z.ZodString>;
        language: z.ZodString;
        timezone: z.ZodString;
        address: z.ZodOptional<z.ZodObject<{
            country: z.ZodOptional<z.ZodString>;
            state: z.ZodOptional<z.ZodOptional<z.ZodString>>;
            city: z.ZodOptional<z.ZodString>;
            district: z.ZodOptional<z.ZodOptional<z.ZodString>>;
            street: z.ZodOptional<z.ZodString>;
            detail: z.ZodOptional<z.ZodOptional<z.ZodString>>;
            postalCode: z.ZodOptional<z.ZodString>;
            latitude: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
            longitude: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
        }, "strip", z.ZodTypeAny, {
            street?: string | undefined;
            city?: string | undefined;
            state?: string | undefined;
            country?: string | undefined;
            postalCode?: string | undefined;
            district?: string | undefined;
            detail?: string | undefined;
            latitude?: number | undefined;
            longitude?: number | undefined;
        }, {
            street?: string | undefined;
            city?: string | undefined;
            state?: string | undefined;
            country?: string | undefined;
            postalCode?: string | undefined;
            district?: string | undefined;
            detail?: string | undefined;
            latitude?: number | undefined;
            longitude?: number | undefined;
        }>>;
        contacts: z.ZodOptional<z.ZodObject<{
            phone: z.ZodOptional<z.ZodString>;
            mobile: z.ZodOptional<z.ZodString>;
            email: z.ZodOptional<z.ZodString>;
            fax: z.ZodOptional<z.ZodString>;
            website: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            email?: string | undefined;
            phone?: string | undefined;
            mobile?: string | undefined;
            fax?: string | undefined;
            website?: string | undefined;
        }, {
            email?: string | undefined;
            phone?: string | undefined;
            mobile?: string | undefined;
            fax?: string | undefined;
            website?: string | undefined;
        }>>;
        socialLinks: z.ZodOptional<z.ZodObject<{
            facebook: z.ZodOptional<z.ZodString>;
            twitter: z.ZodOptional<z.ZodString>;
            linkedin: z.ZodOptional<z.ZodString>;
            instagram: z.ZodOptional<z.ZodString>;
            github: z.ZodOptional<z.ZodString>;
            website: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            facebook?: string | undefined;
            github?: string | undefined;
            linkedin?: string | undefined;
            twitter?: string | undefined;
            website?: string | undefined;
            instagram?: string | undefined;
        }, {
            facebook?: string | undefined;
            github?: string | undefined;
            linkedin?: string | undefined;
            twitter?: string | undefined;
            website?: string | undefined;
            instagram?: string | undefined;
        }>>;
        occupation: z.ZodOptional<z.ZodString>;
        company: z.ZodOptional<z.ZodString>;
        department: z.ZodOptional<z.ZodString>;
        position: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        language: string;
        timezone: string;
        address?: {
            street?: string | undefined;
            city?: string | undefined;
            state?: string | undefined;
            country?: string | undefined;
            postalCode?: string | undefined;
            district?: string | undefined;
            detail?: string | undefined;
            latitude?: number | undefined;
            longitude?: number | undefined;
        } | undefined;
        phone?: string | undefined;
        birthDate?: Date | undefined;
        gender?: "male" | "female" | "other" | "prefer_not_to_say" | undefined;
        nationality?: string | undefined;
        contacts?: {
            email?: string | undefined;
            phone?: string | undefined;
            mobile?: string | undefined;
            fax?: string | undefined;
            website?: string | undefined;
        } | undefined;
        socialLinks?: {
            facebook?: string | undefined;
            github?: string | undefined;
            linkedin?: string | undefined;
            twitter?: string | undefined;
            website?: string | undefined;
            instagram?: string | undefined;
        } | undefined;
        occupation?: string | undefined;
        company?: string | undefined;
        department?: string | undefined;
        position?: string | undefined;
    }, {
        language: string;
        timezone: string;
        address?: {
            street?: string | undefined;
            city?: string | undefined;
            state?: string | undefined;
            country?: string | undefined;
            postalCode?: string | undefined;
            district?: string | undefined;
            detail?: string | undefined;
            latitude?: number | undefined;
            longitude?: number | undefined;
        } | undefined;
        phone?: string | undefined;
        birthDate?: Date | undefined;
        gender?: "male" | "female" | "other" | "prefer_not_to_say" | undefined;
        nationality?: string | undefined;
        contacts?: {
            email?: string | undefined;
            phone?: string | undefined;
            mobile?: string | undefined;
            fax?: string | undefined;
            website?: string | undefined;
        } | undefined;
        socialLinks?: {
            facebook?: string | undefined;
            github?: string | undefined;
            linkedin?: string | undefined;
            twitter?: string | undefined;
            website?: string | undefined;
            instagram?: string | undefined;
        } | undefined;
        occupation?: string | undefined;
        company?: string | undefined;
        department?: string | undefined;
        position?: string | undefined;
    }>;
    preferences: z.ZodObject<{
        theme: z.ZodEnum<["light", "dark", "auto"]>;
        language: z.ZodString;
        timezone: z.ZodString;
        dateFormat: z.ZodString;
        timeFormat: z.ZodString;
        currency: z.ZodEnum<["KRW", "USD", "EUR", "JPY", "CNY"]>;
        notifications: z.ZodObject<{
            email: z.ZodBoolean;
            push: z.ZodBoolean;
            sms: z.ZodBoolean;
            inApp: z.ZodBoolean;
            marketing: z.ZodBoolean;
            digest: z.ZodEnum<["realtime", "hourly", "daily", "weekly", "never"]>;
        }, "strip", z.ZodTypeAny, {
            push: boolean;
            email: boolean;
            sms: boolean;
            inApp: boolean;
            marketing: boolean;
            digest: "never" | "realtime" | "hourly" | "daily" | "weekly";
        }, {
            push: boolean;
            email: boolean;
            sms: boolean;
            inApp: boolean;
            marketing: boolean;
            digest: "never" | "realtime" | "hourly" | "daily" | "weekly";
        }>;
        privacy: z.ZodObject<{
            profileVisibility: z.ZodEnum<["public", "friends", "private"]>;
            showEmail: z.ZodBoolean;
            showPhone: z.ZodBoolean;
            showLastSeen: z.ZodBoolean;
            allowDirectMessages: z.ZodBoolean;
            allowFriendRequests: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            profileVisibility: "public" | "friends" | "private";
            showEmail: boolean;
            showPhone: boolean;
            showLastSeen: boolean;
            allowDirectMessages: boolean;
            allowFriendRequests: boolean;
        }, {
            profileVisibility: "public" | "friends" | "private";
            showEmail: boolean;
            showPhone: boolean;
            showLastSeen: boolean;
            allowDirectMessages: boolean;
            allowFriendRequests: boolean;
        }>;
        accessibility: z.ZodObject<{
            fontSize: z.ZodEnum<["small", "medium", "large", "xlarge"]>;
            highContrast: z.ZodBoolean;
            reduceMotion: z.ZodBoolean;
            screenReader: z.ZodBoolean;
            keyboardNavigation: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            fontSize: "small" | "medium" | "large" | "xlarge";
            highContrast: boolean;
            reduceMotion: boolean;
            screenReader: boolean;
            keyboardNavigation: boolean;
        }, {
            fontSize: "small" | "medium" | "large" | "xlarge";
            highContrast: boolean;
            reduceMotion: boolean;
            screenReader: boolean;
            keyboardNavigation: boolean;
        }>;
    }, "strip", z.ZodTypeAny, {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        language: string;
        timezone: string;
        theme: "auto" | "light" | "dark";
        dateFormat: string;
        timeFormat: string;
        notifications: {
            push: boolean;
            email: boolean;
            sms: boolean;
            inApp: boolean;
            marketing: boolean;
            digest: "never" | "realtime" | "hourly" | "daily" | "weekly";
        };
        privacy: {
            profileVisibility: "public" | "friends" | "private";
            showEmail: boolean;
            showPhone: boolean;
            showLastSeen: boolean;
            allowDirectMessages: boolean;
            allowFriendRequests: boolean;
        };
        accessibility: {
            fontSize: "small" | "medium" | "large" | "xlarge";
            highContrast: boolean;
            reduceMotion: boolean;
            screenReader: boolean;
            keyboardNavigation: boolean;
        };
    }, {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        language: string;
        timezone: string;
        theme: "auto" | "light" | "dark";
        dateFormat: string;
        timeFormat: string;
        notifications: {
            push: boolean;
            email: boolean;
            sms: boolean;
            inApp: boolean;
            marketing: boolean;
            digest: "never" | "realtime" | "hourly" | "daily" | "weekly";
        };
        privacy: {
            profileVisibility: "public" | "friends" | "private";
            showEmail: boolean;
            showPhone: boolean;
            showLastSeen: boolean;
            allowDirectMessages: boolean;
            allowFriendRequests: boolean;
        };
        accessibility: {
            fontSize: "small" | "medium" | "large" | "xlarge";
            highContrast: boolean;
            reduceMotion: boolean;
            screenReader: boolean;
            keyboardNavigation: boolean;
        };
    }>;
    security: z.ZodOptional<z.ZodObject<{
        lastPasswordChange: z.ZodOptional<z.ZodDate>;
        passwordExpiresAt: z.ZodOptional<z.ZodDate>;
        failedLoginAttempts: z.ZodNumber;
        lockedUntil: z.ZodOptional<z.ZodDate>;
        ipWhitelist: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        trustedDevices: z.ZodArray<z.ZodAny, "many">;
        sessions: z.ZodArray<z.ZodAny, "many">;
        auditLog: z.ZodArray<z.ZodAny, "many">;
    }, "strip", z.ZodTypeAny, {
        failedLoginAttempts: number;
        trustedDevices: any[];
        sessions: any[];
        auditLog: any[];
        lastPasswordChange?: Date | undefined;
        passwordExpiresAt?: Date | undefined;
        lockedUntil?: Date | undefined;
        ipWhitelist?: string[] | undefined;
    }, {
        failedLoginAttempts: number;
        trustedDevices: any[];
        sessions: any[];
        auditLog: any[];
        lastPasswordChange?: Date | undefined;
        passwordExpiresAt?: Date | undefined;
        lockedUntil?: Date | undefined;
        ipWhitelist?: string[] | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    status: "pending" | "active" | "inactive" | "deleted" | "suspended";
    displayName: string;
    email: string;
    emailVerified: boolean;
    phoneVerified: boolean;
    twoFactorEnabled: boolean;
    profile: {
        language: string;
        timezone: string;
        address?: {
            street?: string | undefined;
            city?: string | undefined;
            state?: string | undefined;
            country?: string | undefined;
            postalCode?: string | undefined;
            district?: string | undefined;
            detail?: string | undefined;
            latitude?: number | undefined;
            longitude?: number | undefined;
        } | undefined;
        phone?: string | undefined;
        birthDate?: Date | undefined;
        gender?: "male" | "female" | "other" | "prefer_not_to_say" | undefined;
        nationality?: string | undefined;
        contacts?: {
            email?: string | undefined;
            phone?: string | undefined;
            mobile?: string | undefined;
            fax?: string | undefined;
            website?: string | undefined;
        } | undefined;
        socialLinks?: {
            facebook?: string | undefined;
            github?: string | undefined;
            linkedin?: string | undefined;
            twitter?: string | undefined;
            website?: string | undefined;
            instagram?: string | undefined;
        } | undefined;
        occupation?: string | undefined;
        company?: string | undefined;
        department?: string | undefined;
        position?: string | undefined;
    };
    preferences: {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        language: string;
        timezone: string;
        theme: "auto" | "light" | "dark";
        dateFormat: string;
        timeFormat: string;
        notifications: {
            push: boolean;
            email: boolean;
            sms: boolean;
            inApp: boolean;
            marketing: boolean;
            digest: "never" | "realtime" | "hourly" | "daily" | "weekly";
        };
        privacy: {
            profileVisibility: "public" | "friends" | "private";
            showEmail: boolean;
            showPhone: boolean;
            showLastSeen: boolean;
            allowDirectMessages: boolean;
            allowFriendRequests: boolean;
        };
        accessibility: {
            fontSize: "small" | "medium" | "large" | "xlarge";
            highContrast: boolean;
            reduceMotion: boolean;
            screenReader: boolean;
            keyboardNavigation: boolean;
        };
    };
    avatar?: string | undefined;
    metadata?: Record<string, any> | undefined;
    tags?: string[] | undefined;
    createdBy?: string | undefined;
    updatedBy?: string | undefined;
    username?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    bio?: string | undefined;
    roles?: {
        displayName: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        level: number;
        permissions: any[];
        isSystemRole: boolean;
        isDefault: boolean;
        description?: string | undefined;
    }[] | undefined;
    permissions?: {
        id: string;
        action: "*" | "delete" | "create" | "list" | "update" | "read" | "execute";
        resource: string;
        name: string;
        description?: string | undefined;
        conditions?: any[] | undefined;
    }[] | undefined;
    security?: {
        failedLoginAttempts: number;
        trustedDevices: any[];
        sessions: any[];
        auditLog: any[];
        lastPasswordChange?: Date | undefined;
        passwordExpiresAt?: Date | undefined;
        lockedUntil?: Date | undefined;
        ipWhitelist?: string[] | undefined;
    } | undefined;
}, {
    status: "pending" | "active" | "inactive" | "deleted" | "suspended";
    displayName: string;
    email: string;
    emailVerified: boolean;
    phoneVerified: boolean;
    twoFactorEnabled: boolean;
    profile: {
        language: string;
        timezone: string;
        address?: {
            street?: string | undefined;
            city?: string | undefined;
            state?: string | undefined;
            country?: string | undefined;
            postalCode?: string | undefined;
            district?: string | undefined;
            detail?: string | undefined;
            latitude?: number | undefined;
            longitude?: number | undefined;
        } | undefined;
        phone?: string | undefined;
        birthDate?: Date | undefined;
        gender?: "male" | "female" | "other" | "prefer_not_to_say" | undefined;
        nationality?: string | undefined;
        contacts?: {
            email?: string | undefined;
            phone?: string | undefined;
            mobile?: string | undefined;
            fax?: string | undefined;
            website?: string | undefined;
        } | undefined;
        socialLinks?: {
            facebook?: string | undefined;
            github?: string | undefined;
            linkedin?: string | undefined;
            twitter?: string | undefined;
            website?: string | undefined;
            instagram?: string | undefined;
        } | undefined;
        occupation?: string | undefined;
        company?: string | undefined;
        department?: string | undefined;
        position?: string | undefined;
    };
    preferences: {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        language: string;
        timezone: string;
        theme: "auto" | "light" | "dark";
        dateFormat: string;
        timeFormat: string;
        notifications: {
            push: boolean;
            email: boolean;
            sms: boolean;
            inApp: boolean;
            marketing: boolean;
            digest: "never" | "realtime" | "hourly" | "daily" | "weekly";
        };
        privacy: {
            profileVisibility: "public" | "friends" | "private";
            showEmail: boolean;
            showPhone: boolean;
            showLastSeen: boolean;
            allowDirectMessages: boolean;
            allowFriendRequests: boolean;
        };
        accessibility: {
            fontSize: "small" | "medium" | "large" | "xlarge";
            highContrast: boolean;
            reduceMotion: boolean;
            screenReader: boolean;
            keyboardNavigation: boolean;
        };
    };
    avatar?: string | undefined;
    metadata?: Record<string, any> | undefined;
    tags?: string[] | undefined;
    createdBy?: string | undefined;
    updatedBy?: string | undefined;
    username?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    bio?: string | undefined;
    roles?: {
        displayName: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        level: number;
        permissions: any[];
        isSystemRole: boolean;
        isDefault: boolean;
        description?: string | undefined;
    }[] | undefined;
    permissions?: {
        id: string;
        action: "*" | "delete" | "create" | "list" | "update" | "read" | "execute";
        resource: string;
        name: string;
        description?: string | undefined;
        conditions?: any[] | undefined;
    }[] | undefined;
    security?: {
        failedLoginAttempts: number;
        trustedDevices: any[];
        sessions: any[];
        auditLog: any[];
        lastPasswordChange?: Date | undefined;
        passwordExpiresAt?: Date | undefined;
        lockedUntil?: Date | undefined;
        ipWhitelist?: string[] | undefined;
    } | undefined;
}>;
export declare const UpdateUserSchema: z.ZodObject<Omit<{
    id: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    username: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    displayName: z.ZodOptional<z.ZodString>;
    firstName: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    lastName: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    avatar: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    bio: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    status: z.ZodOptional<z.ZodEnum<["active", "inactive", "suspended", "pending", "deleted"]>>;
    emailVerified: z.ZodOptional<z.ZodBoolean>;
    phoneVerified: z.ZodOptional<z.ZodBoolean>;
    twoFactorEnabled: z.ZodOptional<z.ZodBoolean>;
    lastLoginAt: z.ZodOptional<z.ZodOptional<z.ZodDate>>;
    lastActiveAt: z.ZodOptional<z.ZodOptional<z.ZodDate>>;
    roles: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        displayName: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        level: z.ZodNumber;
        permissions: z.ZodArray<z.ZodAny, "many">;
        isSystemRole: z.ZodBoolean;
        isDefault: z.ZodBoolean;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
    }, "strip", z.ZodTypeAny, {
        displayName: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        level: number;
        permissions: any[];
        isSystemRole: boolean;
        isDefault: boolean;
        description?: string | undefined;
    }, {
        displayName: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        level: number;
        permissions: any[];
        isSystemRole: boolean;
        isDefault: boolean;
        description?: string | undefined;
    }>, "many">>;
    permissions: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        resource: z.ZodString;
        action: z.ZodEnum<["create", "read", "update", "delete", "list", "execute", "*"]>;
        conditions: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
        description: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        action: "*" | "delete" | "create" | "list" | "update" | "read" | "execute";
        resource: string;
        name: string;
        description?: string | undefined;
        conditions?: any[] | undefined;
    }, {
        id: string;
        action: "*" | "delete" | "create" | "list" | "update" | "read" | "execute";
        resource: string;
        name: string;
        description?: string | undefined;
        conditions?: any[] | undefined;
    }>, "many">>;
    profile: z.ZodOptional<z.ZodObject<{
        phone: z.ZodOptional<z.ZodString>;
        birthDate: z.ZodOptional<z.ZodDate>;
        gender: z.ZodOptional<z.ZodEnum<["male", "female", "other", "prefer_not_to_say"]>>;
        nationality: z.ZodOptional<z.ZodString>;
        language: z.ZodString;
        timezone: z.ZodString;
        address: z.ZodOptional<z.ZodObject<{
            country: z.ZodOptional<z.ZodString>;
            state: z.ZodOptional<z.ZodOptional<z.ZodString>>;
            city: z.ZodOptional<z.ZodString>;
            district: z.ZodOptional<z.ZodOptional<z.ZodString>>;
            street: z.ZodOptional<z.ZodString>;
            detail: z.ZodOptional<z.ZodOptional<z.ZodString>>;
            postalCode: z.ZodOptional<z.ZodString>;
            latitude: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
            longitude: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
        }, "strip", z.ZodTypeAny, {
            street?: string | undefined;
            city?: string | undefined;
            state?: string | undefined;
            country?: string | undefined;
            postalCode?: string | undefined;
            district?: string | undefined;
            detail?: string | undefined;
            latitude?: number | undefined;
            longitude?: number | undefined;
        }, {
            street?: string | undefined;
            city?: string | undefined;
            state?: string | undefined;
            country?: string | undefined;
            postalCode?: string | undefined;
            district?: string | undefined;
            detail?: string | undefined;
            latitude?: number | undefined;
            longitude?: number | undefined;
        }>>;
        contacts: z.ZodOptional<z.ZodObject<{
            phone: z.ZodOptional<z.ZodString>;
            mobile: z.ZodOptional<z.ZodString>;
            email: z.ZodOptional<z.ZodString>;
            fax: z.ZodOptional<z.ZodString>;
            website: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            email?: string | undefined;
            phone?: string | undefined;
            mobile?: string | undefined;
            fax?: string | undefined;
            website?: string | undefined;
        }, {
            email?: string | undefined;
            phone?: string | undefined;
            mobile?: string | undefined;
            fax?: string | undefined;
            website?: string | undefined;
        }>>;
        socialLinks: z.ZodOptional<z.ZodObject<{
            facebook: z.ZodOptional<z.ZodString>;
            twitter: z.ZodOptional<z.ZodString>;
            linkedin: z.ZodOptional<z.ZodString>;
            instagram: z.ZodOptional<z.ZodString>;
            github: z.ZodOptional<z.ZodString>;
            website: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            facebook?: string | undefined;
            github?: string | undefined;
            linkedin?: string | undefined;
            twitter?: string | undefined;
            website?: string | undefined;
            instagram?: string | undefined;
        }, {
            facebook?: string | undefined;
            github?: string | undefined;
            linkedin?: string | undefined;
            twitter?: string | undefined;
            website?: string | undefined;
            instagram?: string | undefined;
        }>>;
        occupation: z.ZodOptional<z.ZodString>;
        company: z.ZodOptional<z.ZodString>;
        department: z.ZodOptional<z.ZodString>;
        position: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        language: string;
        timezone: string;
        address?: {
            street?: string | undefined;
            city?: string | undefined;
            state?: string | undefined;
            country?: string | undefined;
            postalCode?: string | undefined;
            district?: string | undefined;
            detail?: string | undefined;
            latitude?: number | undefined;
            longitude?: number | undefined;
        } | undefined;
        phone?: string | undefined;
        birthDate?: Date | undefined;
        gender?: "male" | "female" | "other" | "prefer_not_to_say" | undefined;
        nationality?: string | undefined;
        contacts?: {
            email?: string | undefined;
            phone?: string | undefined;
            mobile?: string | undefined;
            fax?: string | undefined;
            website?: string | undefined;
        } | undefined;
        socialLinks?: {
            facebook?: string | undefined;
            github?: string | undefined;
            linkedin?: string | undefined;
            twitter?: string | undefined;
            website?: string | undefined;
            instagram?: string | undefined;
        } | undefined;
        occupation?: string | undefined;
        company?: string | undefined;
        department?: string | undefined;
        position?: string | undefined;
    }, {
        language: string;
        timezone: string;
        address?: {
            street?: string | undefined;
            city?: string | undefined;
            state?: string | undefined;
            country?: string | undefined;
            postalCode?: string | undefined;
            district?: string | undefined;
            detail?: string | undefined;
            latitude?: number | undefined;
            longitude?: number | undefined;
        } | undefined;
        phone?: string | undefined;
        birthDate?: Date | undefined;
        gender?: "male" | "female" | "other" | "prefer_not_to_say" | undefined;
        nationality?: string | undefined;
        contacts?: {
            email?: string | undefined;
            phone?: string | undefined;
            mobile?: string | undefined;
            fax?: string | undefined;
            website?: string | undefined;
        } | undefined;
        socialLinks?: {
            facebook?: string | undefined;
            github?: string | undefined;
            linkedin?: string | undefined;
            twitter?: string | undefined;
            website?: string | undefined;
            instagram?: string | undefined;
        } | undefined;
        occupation?: string | undefined;
        company?: string | undefined;
        department?: string | undefined;
        position?: string | undefined;
    }>>;
    preferences: z.ZodOptional<z.ZodObject<{
        theme: z.ZodEnum<["light", "dark", "auto"]>;
        language: z.ZodString;
        timezone: z.ZodString;
        dateFormat: z.ZodString;
        timeFormat: z.ZodString;
        currency: z.ZodEnum<["KRW", "USD", "EUR", "JPY", "CNY"]>;
        notifications: z.ZodObject<{
            email: z.ZodBoolean;
            push: z.ZodBoolean;
            sms: z.ZodBoolean;
            inApp: z.ZodBoolean;
            marketing: z.ZodBoolean;
            digest: z.ZodEnum<["realtime", "hourly", "daily", "weekly", "never"]>;
        }, "strip", z.ZodTypeAny, {
            push: boolean;
            email: boolean;
            sms: boolean;
            inApp: boolean;
            marketing: boolean;
            digest: "never" | "realtime" | "hourly" | "daily" | "weekly";
        }, {
            push: boolean;
            email: boolean;
            sms: boolean;
            inApp: boolean;
            marketing: boolean;
            digest: "never" | "realtime" | "hourly" | "daily" | "weekly";
        }>;
        privacy: z.ZodObject<{
            profileVisibility: z.ZodEnum<["public", "friends", "private"]>;
            showEmail: z.ZodBoolean;
            showPhone: z.ZodBoolean;
            showLastSeen: z.ZodBoolean;
            allowDirectMessages: z.ZodBoolean;
            allowFriendRequests: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            profileVisibility: "public" | "friends" | "private";
            showEmail: boolean;
            showPhone: boolean;
            showLastSeen: boolean;
            allowDirectMessages: boolean;
            allowFriendRequests: boolean;
        }, {
            profileVisibility: "public" | "friends" | "private";
            showEmail: boolean;
            showPhone: boolean;
            showLastSeen: boolean;
            allowDirectMessages: boolean;
            allowFriendRequests: boolean;
        }>;
        accessibility: z.ZodObject<{
            fontSize: z.ZodEnum<["small", "medium", "large", "xlarge"]>;
            highContrast: z.ZodBoolean;
            reduceMotion: z.ZodBoolean;
            screenReader: z.ZodBoolean;
            keyboardNavigation: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            fontSize: "small" | "medium" | "large" | "xlarge";
            highContrast: boolean;
            reduceMotion: boolean;
            screenReader: boolean;
            keyboardNavigation: boolean;
        }, {
            fontSize: "small" | "medium" | "large" | "xlarge";
            highContrast: boolean;
            reduceMotion: boolean;
            screenReader: boolean;
            keyboardNavigation: boolean;
        }>;
    }, "strip", z.ZodTypeAny, {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        language: string;
        timezone: string;
        theme: "auto" | "light" | "dark";
        dateFormat: string;
        timeFormat: string;
        notifications: {
            push: boolean;
            email: boolean;
            sms: boolean;
            inApp: boolean;
            marketing: boolean;
            digest: "never" | "realtime" | "hourly" | "daily" | "weekly";
        };
        privacy: {
            profileVisibility: "public" | "friends" | "private";
            showEmail: boolean;
            showPhone: boolean;
            showLastSeen: boolean;
            allowDirectMessages: boolean;
            allowFriendRequests: boolean;
        };
        accessibility: {
            fontSize: "small" | "medium" | "large" | "xlarge";
            highContrast: boolean;
            reduceMotion: boolean;
            screenReader: boolean;
            keyboardNavigation: boolean;
        };
    }, {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        language: string;
        timezone: string;
        theme: "auto" | "light" | "dark";
        dateFormat: string;
        timeFormat: string;
        notifications: {
            push: boolean;
            email: boolean;
            sms: boolean;
            inApp: boolean;
            marketing: boolean;
            digest: "never" | "realtime" | "hourly" | "daily" | "weekly";
        };
        privacy: {
            profileVisibility: "public" | "friends" | "private";
            showEmail: boolean;
            showPhone: boolean;
            showLastSeen: boolean;
            allowDirectMessages: boolean;
            allowFriendRequests: boolean;
        };
        accessibility: {
            fontSize: "small" | "medium" | "large" | "xlarge";
            highContrast: boolean;
            reduceMotion: boolean;
            screenReader: boolean;
            keyboardNavigation: boolean;
        };
    }>>;
    security: z.ZodOptional<z.ZodObject<{
        lastPasswordChange: z.ZodOptional<z.ZodDate>;
        passwordExpiresAt: z.ZodOptional<z.ZodDate>;
        failedLoginAttempts: z.ZodNumber;
        lockedUntil: z.ZodOptional<z.ZodDate>;
        ipWhitelist: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        trustedDevices: z.ZodArray<z.ZodAny, "many">;
        sessions: z.ZodArray<z.ZodAny, "many">;
        auditLog: z.ZodArray<z.ZodAny, "many">;
    }, "strip", z.ZodTypeAny, {
        failedLoginAttempts: number;
        trustedDevices: any[];
        sessions: any[];
        auditLog: any[];
        lastPasswordChange?: Date | undefined;
        passwordExpiresAt?: Date | undefined;
        lockedUntil?: Date | undefined;
        ipWhitelist?: string[] | undefined;
    }, {
        failedLoginAttempts: number;
        trustedDevices: any[];
        sessions: any[];
        auditLog: any[];
        lastPasswordChange?: Date | undefined;
        passwordExpiresAt?: Date | undefined;
        lockedUntil?: Date | undefined;
        ipWhitelist?: string[] | undefined;
    }>>;
    createdAt: z.ZodOptional<z.ZodDate>;
    updatedAt: z.ZodOptional<z.ZodDate>;
    createdBy: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    updatedBy: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    version: z.ZodOptional<z.ZodNumber>;
    tags: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
    metadata: z.ZodOptional<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>>;
}, "id" | "createdAt" | "createdBy">, "strip", z.ZodTypeAny, {
    status?: "pending" | "active" | "inactive" | "deleted" | "suspended" | undefined;
    displayName?: string | undefined;
    email?: string | undefined;
    avatar?: string | undefined;
    metadata?: Record<string, any> | undefined;
    updatedAt?: Date | undefined;
    version?: number | undefined;
    tags?: string[] | undefined;
    updatedBy?: string | undefined;
    username?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    bio?: string | undefined;
    emailVerified?: boolean | undefined;
    phoneVerified?: boolean | undefined;
    twoFactorEnabled?: boolean | undefined;
    lastLoginAt?: Date | undefined;
    lastActiveAt?: Date | undefined;
    roles?: {
        displayName: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        level: number;
        permissions: any[];
        isSystemRole: boolean;
        isDefault: boolean;
        description?: string | undefined;
    }[] | undefined;
    permissions?: {
        id: string;
        action: "*" | "delete" | "create" | "list" | "update" | "read" | "execute";
        resource: string;
        name: string;
        description?: string | undefined;
        conditions?: any[] | undefined;
    }[] | undefined;
    profile?: {
        language: string;
        timezone: string;
        address?: {
            street?: string | undefined;
            city?: string | undefined;
            state?: string | undefined;
            country?: string | undefined;
            postalCode?: string | undefined;
            district?: string | undefined;
            detail?: string | undefined;
            latitude?: number | undefined;
            longitude?: number | undefined;
        } | undefined;
        phone?: string | undefined;
        birthDate?: Date | undefined;
        gender?: "male" | "female" | "other" | "prefer_not_to_say" | undefined;
        nationality?: string | undefined;
        contacts?: {
            email?: string | undefined;
            phone?: string | undefined;
            mobile?: string | undefined;
            fax?: string | undefined;
            website?: string | undefined;
        } | undefined;
        socialLinks?: {
            facebook?: string | undefined;
            github?: string | undefined;
            linkedin?: string | undefined;
            twitter?: string | undefined;
            website?: string | undefined;
            instagram?: string | undefined;
        } | undefined;
        occupation?: string | undefined;
        company?: string | undefined;
        department?: string | undefined;
        position?: string | undefined;
    } | undefined;
    preferences?: {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        language: string;
        timezone: string;
        theme: "auto" | "light" | "dark";
        dateFormat: string;
        timeFormat: string;
        notifications: {
            push: boolean;
            email: boolean;
            sms: boolean;
            inApp: boolean;
            marketing: boolean;
            digest: "never" | "realtime" | "hourly" | "daily" | "weekly";
        };
        privacy: {
            profileVisibility: "public" | "friends" | "private";
            showEmail: boolean;
            showPhone: boolean;
            showLastSeen: boolean;
            allowDirectMessages: boolean;
            allowFriendRequests: boolean;
        };
        accessibility: {
            fontSize: "small" | "medium" | "large" | "xlarge";
            highContrast: boolean;
            reduceMotion: boolean;
            screenReader: boolean;
            keyboardNavigation: boolean;
        };
    } | undefined;
    security?: {
        failedLoginAttempts: number;
        trustedDevices: any[];
        sessions: any[];
        auditLog: any[];
        lastPasswordChange?: Date | undefined;
        passwordExpiresAt?: Date | undefined;
        lockedUntil?: Date | undefined;
        ipWhitelist?: string[] | undefined;
    } | undefined;
}, {
    status?: "pending" | "active" | "inactive" | "deleted" | "suspended" | undefined;
    displayName?: string | undefined;
    email?: string | undefined;
    avatar?: string | undefined;
    metadata?: Record<string, any> | undefined;
    updatedAt?: Date | undefined;
    version?: number | undefined;
    tags?: string[] | undefined;
    updatedBy?: string | undefined;
    username?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    bio?: string | undefined;
    emailVerified?: boolean | undefined;
    phoneVerified?: boolean | undefined;
    twoFactorEnabled?: boolean | undefined;
    lastLoginAt?: Date | undefined;
    lastActiveAt?: Date | undefined;
    roles?: {
        displayName: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        level: number;
        permissions: any[];
        isSystemRole: boolean;
        isDefault: boolean;
        description?: string | undefined;
    }[] | undefined;
    permissions?: {
        id: string;
        action: "*" | "delete" | "create" | "list" | "update" | "read" | "execute";
        resource: string;
        name: string;
        description?: string | undefined;
        conditions?: any[] | undefined;
    }[] | undefined;
    profile?: {
        language: string;
        timezone: string;
        address?: {
            street?: string | undefined;
            city?: string | undefined;
            state?: string | undefined;
            country?: string | undefined;
            postalCode?: string | undefined;
            district?: string | undefined;
            detail?: string | undefined;
            latitude?: number | undefined;
            longitude?: number | undefined;
        } | undefined;
        phone?: string | undefined;
        birthDate?: Date | undefined;
        gender?: "male" | "female" | "other" | "prefer_not_to_say" | undefined;
        nationality?: string | undefined;
        contacts?: {
            email?: string | undefined;
            phone?: string | undefined;
            mobile?: string | undefined;
            fax?: string | undefined;
            website?: string | undefined;
        } | undefined;
        socialLinks?: {
            facebook?: string | undefined;
            github?: string | undefined;
            linkedin?: string | undefined;
            twitter?: string | undefined;
            website?: string | undefined;
            instagram?: string | undefined;
        } | undefined;
        occupation?: string | undefined;
        company?: string | undefined;
        department?: string | undefined;
        position?: string | undefined;
    } | undefined;
    preferences?: {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        language: string;
        timezone: string;
        theme: "auto" | "light" | "dark";
        dateFormat: string;
        timeFormat: string;
        notifications: {
            push: boolean;
            email: boolean;
            sms: boolean;
            inApp: boolean;
            marketing: boolean;
            digest: "never" | "realtime" | "hourly" | "daily" | "weekly";
        };
        privacy: {
            profileVisibility: "public" | "friends" | "private";
            showEmail: boolean;
            showPhone: boolean;
            showLastSeen: boolean;
            allowDirectMessages: boolean;
            allowFriendRequests: boolean;
        };
        accessibility: {
            fontSize: "small" | "medium" | "large" | "xlarge";
            highContrast: boolean;
            reduceMotion: boolean;
            screenReader: boolean;
            keyboardNavigation: boolean;
        };
    } | undefined;
    security?: {
        failedLoginAttempts: number;
        trustedDevices: any[];
        sessions: any[];
        auditLog: any[];
        lastPasswordChange?: Date | undefined;
        passwordExpiresAt?: Date | undefined;
        lockedUntil?: Date | undefined;
        ipWhitelist?: string[] | undefined;
    } | undefined;
}>;
export declare const CreateProductSchema: z.ZodObject<Omit<{
    id: z.ZodString;
    sku: z.ZodString;
    name: z.ZodString;
    description: z.ZodString;
    shortDescription: z.ZodOptional<z.ZodString>;
    categoryId: z.ZodString;
    brandId: z.ZodOptional<z.ZodString>;
    supplierId: z.ZodOptional<z.ZodString>;
    status: z.ZodEnum<["active", "inactive", "draft", "archived", "out_of_stock"]>;
    type: z.ZodEnum<["simple", "variable", "grouped", "external", "subscription"]>;
    price: z.ZodObject<{
        amount: z.ZodNumber;
        currency: z.ZodEnum<["KRW", "USD", "EUR", "JPY", "CNY"]>;
    }, "strip", z.ZodTypeAny, {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    }, {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    }>;
    originalPrice: z.ZodOptional<z.ZodObject<{
        amount: z.ZodNumber;
        currency: z.ZodEnum<["KRW", "USD", "EUR", "JPY", "CNY"]>;
    }, "strip", z.ZodTypeAny, {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    }, {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    }>>;
    costPrice: z.ZodOptional<z.ZodObject<{
        amount: z.ZodNumber;
        currency: z.ZodEnum<["KRW", "USD", "EUR", "JPY", "CNY"]>;
    }, "strip", z.ZodTypeAny, {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    }, {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    }>>;
    inventory: z.ZodObject<{
        quantity: z.ZodNumber;
        reservedQuantity: z.ZodNumber;
        minQuantity: z.ZodNumber;
        maxQuantity: z.ZodOptional<z.ZodNumber>;
        trackQuantity: z.ZodBoolean;
        allowBackorder: z.ZodBoolean;
        stockStatus: z.ZodEnum<["in_stock", "out_of_stock", "on_backorder"]>;
    }, "strip", z.ZodTypeAny, {
        quantity: number;
        reservedQuantity: number;
        minQuantity: number;
        trackQuantity: boolean;
        allowBackorder: boolean;
        stockStatus: "out_of_stock" | "in_stock" | "on_backorder";
        maxQuantity?: number | undefined;
    }, {
        quantity: number;
        reservedQuantity: number;
        minQuantity: number;
        trackQuantity: boolean;
        allowBackorder: boolean;
        stockStatus: "out_of_stock" | "in_stock" | "on_backorder";
        maxQuantity?: number | undefined;
    }>;
    images: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        originalName: z.ZodString;
        mimeType: z.ZodString;
        size: z.ZodNumber;
        url: z.ZodString;
        thumbnailUrl: z.ZodOptional<z.ZodString>;
        uploadedAt: z.ZodDate;
        uploadedBy: z.ZodOptional<z.ZodString>;
        metadata: z.ZodOptional<z.ZodObject<{
            width: z.ZodOptional<z.ZodNumber>;
            height: z.ZodOptional<z.ZodNumber>;
            duration: z.ZodOptional<z.ZodNumber>;
            encoding: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            duration?: number | undefined;
            width?: number | undefined;
            height?: number | undefined;
            encoding?: string | undefined;
        }, {
            duration?: number | undefined;
            width?: number | undefined;
            height?: number | undefined;
            encoding?: string | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        url: string;
        id: string;
        size: number;
        name: string;
        originalName: string;
        mimeType: string;
        uploadedAt: Date;
        metadata?: {
            duration?: number | undefined;
            width?: number | undefined;
            height?: number | undefined;
            encoding?: string | undefined;
        } | undefined;
        thumbnailUrl?: string | undefined;
        uploadedBy?: string | undefined;
    }, {
        url: string;
        id: string;
        size: number;
        name: string;
        originalName: string;
        mimeType: string;
        uploadedAt: Date;
        metadata?: {
            duration?: number | undefined;
            width?: number | undefined;
            height?: number | undefined;
            encoding?: string | undefined;
        } | undefined;
        thumbnailUrl?: string | undefined;
        uploadedBy?: string | undefined;
    }>, "many">;
    videos: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        originalName: z.ZodString;
        mimeType: z.ZodString;
        size: z.ZodNumber;
        url: z.ZodString;
        thumbnailUrl: z.ZodOptional<z.ZodString>;
        uploadedAt: z.ZodDate;
        uploadedBy: z.ZodOptional<z.ZodString>;
        metadata: z.ZodOptional<z.ZodObject<{
            width: z.ZodOptional<z.ZodNumber>;
            height: z.ZodOptional<z.ZodNumber>;
            duration: z.ZodOptional<z.ZodNumber>;
            encoding: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            duration?: number | undefined;
            width?: number | undefined;
            height?: number | undefined;
            encoding?: string | undefined;
        }, {
            duration?: number | undefined;
            width?: number | undefined;
            height?: number | undefined;
            encoding?: string | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        url: string;
        id: string;
        size: number;
        name: string;
        originalName: string;
        mimeType: string;
        uploadedAt: Date;
        metadata?: {
            duration?: number | undefined;
            width?: number | undefined;
            height?: number | undefined;
            encoding?: string | undefined;
        } | undefined;
        thumbnailUrl?: string | undefined;
        uploadedBy?: string | undefined;
    }, {
        url: string;
        id: string;
        size: number;
        name: string;
        originalName: string;
        mimeType: string;
        uploadedAt: Date;
        metadata?: {
            duration?: number | undefined;
            width?: number | undefined;
            height?: number | undefined;
            encoding?: string | undefined;
        } | undefined;
        thumbnailUrl?: string | undefined;
        uploadedBy?: string | undefined;
    }>, "many">>;
    documents: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        originalName: z.ZodString;
        mimeType: z.ZodString;
        size: z.ZodNumber;
        url: z.ZodString;
        thumbnailUrl: z.ZodOptional<z.ZodString>;
        uploadedAt: z.ZodDate;
        uploadedBy: z.ZodOptional<z.ZodString>;
        metadata: z.ZodOptional<z.ZodObject<{
            width: z.ZodOptional<z.ZodNumber>;
            height: z.ZodOptional<z.ZodNumber>;
            duration: z.ZodOptional<z.ZodNumber>;
            encoding: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            duration?: number | undefined;
            width?: number | undefined;
            height?: number | undefined;
            encoding?: string | undefined;
        }, {
            duration?: number | undefined;
            width?: number | undefined;
            height?: number | undefined;
            encoding?: string | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        url: string;
        id: string;
        size: number;
        name: string;
        originalName: string;
        mimeType: string;
        uploadedAt: Date;
        metadata?: {
            duration?: number | undefined;
            width?: number | undefined;
            height?: number | undefined;
            encoding?: string | undefined;
        } | undefined;
        thumbnailUrl?: string | undefined;
        uploadedBy?: string | undefined;
    }, {
        url: string;
        id: string;
        size: number;
        name: string;
        originalName: string;
        mimeType: string;
        uploadedAt: Date;
        metadata?: {
            duration?: number | undefined;
            width?: number | undefined;
            height?: number | undefined;
            encoding?: string | undefined;
        } | undefined;
        thumbnailUrl?: string | undefined;
        uploadedBy?: string | undefined;
    }>, "many">>;
    attributes: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        value: z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean]>;
        type: z.ZodEnum<["text", "number", "boolean", "select", "multiselect", "color", "image"]>;
        isRequired: z.ZodBoolean;
        isVariable: z.ZodBoolean;
        displayOrder: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        value: string | number | boolean;
        type: "number" | "boolean" | "select" | "color" | "image" | "text" | "multiselect";
        name: string;
        isRequired: boolean;
        isVariable: boolean;
        displayOrder: number;
    }, {
        value: string | number | boolean;
        type: "number" | "boolean" | "select" | "color" | "image" | "text" | "multiselect";
        name: string;
        isRequired: boolean;
        isVariable: boolean;
        displayOrder: number;
    }>, "many">;
    variants: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        sku: z.ZodString;
        name: z.ZodString;
        price: z.ZodObject<{
            amount: z.ZodNumber;
            currency: z.ZodEnum<["KRW", "USD", "EUR", "JPY", "CNY"]>;
        }, "strip", z.ZodTypeAny, {
            currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
            amount: number;
        }, {
            currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
            amount: number;
        }>;
        inventory: z.ZodObject<{
            quantity: z.ZodNumber;
            reservedQuantity: z.ZodNumber;
            minQuantity: z.ZodNumber;
            maxQuantity: z.ZodOptional<z.ZodNumber>;
            trackQuantity: z.ZodBoolean;
            allowBackorder: z.ZodBoolean;
            stockStatus: z.ZodEnum<["in_stock", "out_of_stock", "on_backorder"]>;
        }, "strip", z.ZodTypeAny, {
            quantity: number;
            reservedQuantity: number;
            minQuantity: number;
            trackQuantity: boolean;
            allowBackorder: boolean;
            stockStatus: "out_of_stock" | "in_stock" | "on_backorder";
            maxQuantity?: number | undefined;
        }, {
            quantity: number;
            reservedQuantity: number;
            minQuantity: number;
            trackQuantity: boolean;
            allowBackorder: boolean;
            stockStatus: "out_of_stock" | "in_stock" | "on_backorder";
            maxQuantity?: number | undefined;
        }>;
        attributes: z.ZodRecord<z.ZodString, z.ZodString>;
        image: z.ZodOptional<z.ZodString>;
        isDefault: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        id: string;
        sku: string;
        name: string;
        isDefault: boolean;
        price: {
            currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
            amount: number;
        };
        inventory: {
            quantity: number;
            reservedQuantity: number;
            minQuantity: number;
            trackQuantity: boolean;
            allowBackorder: boolean;
            stockStatus: "out_of_stock" | "in_stock" | "on_backorder";
            maxQuantity?: number | undefined;
        };
        attributes: Record<string, string>;
        image?: string | undefined;
    }, {
        id: string;
        sku: string;
        name: string;
        isDefault: boolean;
        price: {
            currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
            amount: number;
        };
        inventory: {
            quantity: number;
            reservedQuantity: number;
            minQuantity: number;
            trackQuantity: boolean;
            allowBackorder: boolean;
            stockStatus: "out_of_stock" | "in_stock" | "on_backorder";
            maxQuantity?: number | undefined;
        };
        attributes: Record<string, string>;
        image?: string | undefined;
    }>, "many">>;
    seo: z.ZodObject<{
        title: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        keywords: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        slug: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        slug: string;
        title?: string | undefined;
        description?: string | undefined;
        keywords?: string[] | undefined;
    }, {
        slug: string;
        title?: string | undefined;
        description?: string | undefined;
        keywords?: string[] | undefined;
    }>;
    weight: z.ZodOptional<z.ZodNumber>;
    dimensions: z.ZodOptional<z.ZodObject<{
        length: z.ZodNumber;
        width: z.ZodNumber;
        height: z.ZodNumber;
        unit: z.ZodEnum<["cm", "in"]>;
    }, "strip", z.ZodTypeAny, {
        length: number;
        unit: "in" | "cm";
        width: number;
        height: number;
    }, {
        length: number;
        unit: "in" | "cm";
        width: number;
        height: number;
    }>>;
    isDigital: z.ZodBoolean;
    isTaxable: z.ZodBoolean;
    isShippable: z.ZodBoolean;
} & {
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
    createdBy: z.ZodOptional<z.ZodString>;
    updatedBy: z.ZodOptional<z.ZodString>;
    version: z.ZodNumber;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "id" | "createdAt" | "updatedAt" | "version">, "strip", z.ZodTypeAny, {
    status: "active" | "inactive" | "draft" | "archived" | "out_of_stock";
    type: "simple" | "variable" | "grouped" | "external" | "subscription";
    sku: string;
    name: string;
    description: string;
    price: {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    };
    inventory: {
        quantity: number;
        reservedQuantity: number;
        minQuantity: number;
        trackQuantity: boolean;
        allowBackorder: boolean;
        stockStatus: "out_of_stock" | "in_stock" | "on_backorder";
        maxQuantity?: number | undefined;
    };
    attributes: {
        value: string | number | boolean;
        type: "number" | "boolean" | "select" | "color" | "image" | "text" | "multiselect";
        name: string;
        isRequired: boolean;
        isVariable: boolean;
        displayOrder: number;
    }[];
    categoryId: string;
    images: {
        url: string;
        id: string;
        size: number;
        name: string;
        originalName: string;
        mimeType: string;
        uploadedAt: Date;
        metadata?: {
            duration?: number | undefined;
            width?: number | undefined;
            height?: number | undefined;
            encoding?: string | undefined;
        } | undefined;
        thumbnailUrl?: string | undefined;
        uploadedBy?: string | undefined;
    }[];
    seo: {
        slug: string;
        title?: string | undefined;
        description?: string | undefined;
        keywords?: string[] | undefined;
    };
    isDigital: boolean;
    isTaxable: boolean;
    isShippable: boolean;
    metadata?: Record<string, any> | undefined;
    tags?: string[] | undefined;
    weight?: number | undefined;
    createdBy?: string | undefined;
    updatedBy?: string | undefined;
    shortDescription?: string | undefined;
    brandId?: string | undefined;
    supplierId?: string | undefined;
    originalPrice?: {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    } | undefined;
    costPrice?: {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    } | undefined;
    videos?: {
        url: string;
        id: string;
        size: number;
        name: string;
        originalName: string;
        mimeType: string;
        uploadedAt: Date;
        metadata?: {
            duration?: number | undefined;
            width?: number | undefined;
            height?: number | undefined;
            encoding?: string | undefined;
        } | undefined;
        thumbnailUrl?: string | undefined;
        uploadedBy?: string | undefined;
    }[] | undefined;
    documents?: {
        url: string;
        id: string;
        size: number;
        name: string;
        originalName: string;
        mimeType: string;
        uploadedAt: Date;
        metadata?: {
            duration?: number | undefined;
            width?: number | undefined;
            height?: number | undefined;
            encoding?: string | undefined;
        } | undefined;
        thumbnailUrl?: string | undefined;
        uploadedBy?: string | undefined;
    }[] | undefined;
    variants?: {
        id: string;
        sku: string;
        name: string;
        isDefault: boolean;
        price: {
            currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
            amount: number;
        };
        inventory: {
            quantity: number;
            reservedQuantity: number;
            minQuantity: number;
            trackQuantity: boolean;
            allowBackorder: boolean;
            stockStatus: "out_of_stock" | "in_stock" | "on_backorder";
            maxQuantity?: number | undefined;
        };
        attributes: Record<string, string>;
        image?: string | undefined;
    }[] | undefined;
    dimensions?: {
        length: number;
        unit: "in" | "cm";
        width: number;
        height: number;
    } | undefined;
}, {
    status: "active" | "inactive" | "draft" | "archived" | "out_of_stock";
    type: "simple" | "variable" | "grouped" | "external" | "subscription";
    sku: string;
    name: string;
    description: string;
    price: {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    };
    inventory: {
        quantity: number;
        reservedQuantity: number;
        minQuantity: number;
        trackQuantity: boolean;
        allowBackorder: boolean;
        stockStatus: "out_of_stock" | "in_stock" | "on_backorder";
        maxQuantity?: number | undefined;
    };
    attributes: {
        value: string | number | boolean;
        type: "number" | "boolean" | "select" | "color" | "image" | "text" | "multiselect";
        name: string;
        isRequired: boolean;
        isVariable: boolean;
        displayOrder: number;
    }[];
    categoryId: string;
    images: {
        url: string;
        id: string;
        size: number;
        name: string;
        originalName: string;
        mimeType: string;
        uploadedAt: Date;
        metadata?: {
            duration?: number | undefined;
            width?: number | undefined;
            height?: number | undefined;
            encoding?: string | undefined;
        } | undefined;
        thumbnailUrl?: string | undefined;
        uploadedBy?: string | undefined;
    }[];
    seo: {
        slug: string;
        title?: string | undefined;
        description?: string | undefined;
        keywords?: string[] | undefined;
    };
    isDigital: boolean;
    isTaxable: boolean;
    isShippable: boolean;
    metadata?: Record<string, any> | undefined;
    tags?: string[] | undefined;
    weight?: number | undefined;
    createdBy?: string | undefined;
    updatedBy?: string | undefined;
    shortDescription?: string | undefined;
    brandId?: string | undefined;
    supplierId?: string | undefined;
    originalPrice?: {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    } | undefined;
    costPrice?: {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    } | undefined;
    videos?: {
        url: string;
        id: string;
        size: number;
        name: string;
        originalName: string;
        mimeType: string;
        uploadedAt: Date;
        metadata?: {
            duration?: number | undefined;
            width?: number | undefined;
            height?: number | undefined;
            encoding?: string | undefined;
        } | undefined;
        thumbnailUrl?: string | undefined;
        uploadedBy?: string | undefined;
    }[] | undefined;
    documents?: {
        url: string;
        id: string;
        size: number;
        name: string;
        originalName: string;
        mimeType: string;
        uploadedAt: Date;
        metadata?: {
            duration?: number | undefined;
            width?: number | undefined;
            height?: number | undefined;
            encoding?: string | undefined;
        } | undefined;
        thumbnailUrl?: string | undefined;
        uploadedBy?: string | undefined;
    }[] | undefined;
    variants?: {
        id: string;
        sku: string;
        name: string;
        isDefault: boolean;
        price: {
            currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
            amount: number;
        };
        inventory: {
            quantity: number;
            reservedQuantity: number;
            minQuantity: number;
            trackQuantity: boolean;
            allowBackorder: boolean;
            stockStatus: "out_of_stock" | "in_stock" | "on_backorder";
            maxQuantity?: number | undefined;
        };
        attributes: Record<string, string>;
        image?: string | undefined;
    }[] | undefined;
    dimensions?: {
        length: number;
        unit: "in" | "cm";
        width: number;
        height: number;
    } | undefined;
}>;
export declare const UpdateProductSchema: z.ZodObject<Omit<{
    id: z.ZodOptional<z.ZodString>;
    sku: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    shortDescription: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    categoryId: z.ZodOptional<z.ZodString>;
    brandId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    supplierId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    status: z.ZodOptional<z.ZodEnum<["active", "inactive", "draft", "archived", "out_of_stock"]>>;
    type: z.ZodOptional<z.ZodEnum<["simple", "variable", "grouped", "external", "subscription"]>>;
    price: z.ZodOptional<z.ZodObject<{
        amount: z.ZodNumber;
        currency: z.ZodEnum<["KRW", "USD", "EUR", "JPY", "CNY"]>;
    }, "strip", z.ZodTypeAny, {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    }, {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    }>>;
    originalPrice: z.ZodOptional<z.ZodOptional<z.ZodObject<{
        amount: z.ZodNumber;
        currency: z.ZodEnum<["KRW", "USD", "EUR", "JPY", "CNY"]>;
    }, "strip", z.ZodTypeAny, {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    }, {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    }>>>;
    costPrice: z.ZodOptional<z.ZodOptional<z.ZodObject<{
        amount: z.ZodNumber;
        currency: z.ZodEnum<["KRW", "USD", "EUR", "JPY", "CNY"]>;
    }, "strip", z.ZodTypeAny, {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    }, {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    }>>>;
    inventory: z.ZodOptional<z.ZodObject<{
        quantity: z.ZodNumber;
        reservedQuantity: z.ZodNumber;
        minQuantity: z.ZodNumber;
        maxQuantity: z.ZodOptional<z.ZodNumber>;
        trackQuantity: z.ZodBoolean;
        allowBackorder: z.ZodBoolean;
        stockStatus: z.ZodEnum<["in_stock", "out_of_stock", "on_backorder"]>;
    }, "strip", z.ZodTypeAny, {
        quantity: number;
        reservedQuantity: number;
        minQuantity: number;
        trackQuantity: boolean;
        allowBackorder: boolean;
        stockStatus: "out_of_stock" | "in_stock" | "on_backorder";
        maxQuantity?: number | undefined;
    }, {
        quantity: number;
        reservedQuantity: number;
        minQuantity: number;
        trackQuantity: boolean;
        allowBackorder: boolean;
        stockStatus: "out_of_stock" | "in_stock" | "on_backorder";
        maxQuantity?: number | undefined;
    }>>;
    images: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        originalName: z.ZodString;
        mimeType: z.ZodString;
        size: z.ZodNumber;
        url: z.ZodString;
        thumbnailUrl: z.ZodOptional<z.ZodString>;
        uploadedAt: z.ZodDate;
        uploadedBy: z.ZodOptional<z.ZodString>;
        metadata: z.ZodOptional<z.ZodObject<{
            width: z.ZodOptional<z.ZodNumber>;
            height: z.ZodOptional<z.ZodNumber>;
            duration: z.ZodOptional<z.ZodNumber>;
            encoding: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            duration?: number | undefined;
            width?: number | undefined;
            height?: number | undefined;
            encoding?: string | undefined;
        }, {
            duration?: number | undefined;
            width?: number | undefined;
            height?: number | undefined;
            encoding?: string | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        url: string;
        id: string;
        size: number;
        name: string;
        originalName: string;
        mimeType: string;
        uploadedAt: Date;
        metadata?: {
            duration?: number | undefined;
            width?: number | undefined;
            height?: number | undefined;
            encoding?: string | undefined;
        } | undefined;
        thumbnailUrl?: string | undefined;
        uploadedBy?: string | undefined;
    }, {
        url: string;
        id: string;
        size: number;
        name: string;
        originalName: string;
        mimeType: string;
        uploadedAt: Date;
        metadata?: {
            duration?: number | undefined;
            width?: number | undefined;
            height?: number | undefined;
            encoding?: string | undefined;
        } | undefined;
        thumbnailUrl?: string | undefined;
        uploadedBy?: string | undefined;
    }>, "many">>;
    videos: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        originalName: z.ZodString;
        mimeType: z.ZodString;
        size: z.ZodNumber;
        url: z.ZodString;
        thumbnailUrl: z.ZodOptional<z.ZodString>;
        uploadedAt: z.ZodDate;
        uploadedBy: z.ZodOptional<z.ZodString>;
        metadata: z.ZodOptional<z.ZodObject<{
            width: z.ZodOptional<z.ZodNumber>;
            height: z.ZodOptional<z.ZodNumber>;
            duration: z.ZodOptional<z.ZodNumber>;
            encoding: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            duration?: number | undefined;
            width?: number | undefined;
            height?: number | undefined;
            encoding?: string | undefined;
        }, {
            duration?: number | undefined;
            width?: number | undefined;
            height?: number | undefined;
            encoding?: string | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        url: string;
        id: string;
        size: number;
        name: string;
        originalName: string;
        mimeType: string;
        uploadedAt: Date;
        metadata?: {
            duration?: number | undefined;
            width?: number | undefined;
            height?: number | undefined;
            encoding?: string | undefined;
        } | undefined;
        thumbnailUrl?: string | undefined;
        uploadedBy?: string | undefined;
    }, {
        url: string;
        id: string;
        size: number;
        name: string;
        originalName: string;
        mimeType: string;
        uploadedAt: Date;
        metadata?: {
            duration?: number | undefined;
            width?: number | undefined;
            height?: number | undefined;
            encoding?: string | undefined;
        } | undefined;
        thumbnailUrl?: string | undefined;
        uploadedBy?: string | undefined;
    }>, "many">>>;
    documents: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        originalName: z.ZodString;
        mimeType: z.ZodString;
        size: z.ZodNumber;
        url: z.ZodString;
        thumbnailUrl: z.ZodOptional<z.ZodString>;
        uploadedAt: z.ZodDate;
        uploadedBy: z.ZodOptional<z.ZodString>;
        metadata: z.ZodOptional<z.ZodObject<{
            width: z.ZodOptional<z.ZodNumber>;
            height: z.ZodOptional<z.ZodNumber>;
            duration: z.ZodOptional<z.ZodNumber>;
            encoding: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            duration?: number | undefined;
            width?: number | undefined;
            height?: number | undefined;
            encoding?: string | undefined;
        }, {
            duration?: number | undefined;
            width?: number | undefined;
            height?: number | undefined;
            encoding?: string | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        url: string;
        id: string;
        size: number;
        name: string;
        originalName: string;
        mimeType: string;
        uploadedAt: Date;
        metadata?: {
            duration?: number | undefined;
            width?: number | undefined;
            height?: number | undefined;
            encoding?: string | undefined;
        } | undefined;
        thumbnailUrl?: string | undefined;
        uploadedBy?: string | undefined;
    }, {
        url: string;
        id: string;
        size: number;
        name: string;
        originalName: string;
        mimeType: string;
        uploadedAt: Date;
        metadata?: {
            duration?: number | undefined;
            width?: number | undefined;
            height?: number | undefined;
            encoding?: string | undefined;
        } | undefined;
        thumbnailUrl?: string | undefined;
        uploadedBy?: string | undefined;
    }>, "many">>>;
    attributes: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        value: z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean]>;
        type: z.ZodEnum<["text", "number", "boolean", "select", "multiselect", "color", "image"]>;
        isRequired: z.ZodBoolean;
        isVariable: z.ZodBoolean;
        displayOrder: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        value: string | number | boolean;
        type: "number" | "boolean" | "select" | "color" | "image" | "text" | "multiselect";
        name: string;
        isRequired: boolean;
        isVariable: boolean;
        displayOrder: number;
    }, {
        value: string | number | boolean;
        type: "number" | "boolean" | "select" | "color" | "image" | "text" | "multiselect";
        name: string;
        isRequired: boolean;
        isVariable: boolean;
        displayOrder: number;
    }>, "many">>;
    variants: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        sku: z.ZodString;
        name: z.ZodString;
        price: z.ZodObject<{
            amount: z.ZodNumber;
            currency: z.ZodEnum<["KRW", "USD", "EUR", "JPY", "CNY"]>;
        }, "strip", z.ZodTypeAny, {
            currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
            amount: number;
        }, {
            currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
            amount: number;
        }>;
        inventory: z.ZodObject<{
            quantity: z.ZodNumber;
            reservedQuantity: z.ZodNumber;
            minQuantity: z.ZodNumber;
            maxQuantity: z.ZodOptional<z.ZodNumber>;
            trackQuantity: z.ZodBoolean;
            allowBackorder: z.ZodBoolean;
            stockStatus: z.ZodEnum<["in_stock", "out_of_stock", "on_backorder"]>;
        }, "strip", z.ZodTypeAny, {
            quantity: number;
            reservedQuantity: number;
            minQuantity: number;
            trackQuantity: boolean;
            allowBackorder: boolean;
            stockStatus: "out_of_stock" | "in_stock" | "on_backorder";
            maxQuantity?: number | undefined;
        }, {
            quantity: number;
            reservedQuantity: number;
            minQuantity: number;
            trackQuantity: boolean;
            allowBackorder: boolean;
            stockStatus: "out_of_stock" | "in_stock" | "on_backorder";
            maxQuantity?: number | undefined;
        }>;
        attributes: z.ZodRecord<z.ZodString, z.ZodString>;
        image: z.ZodOptional<z.ZodString>;
        isDefault: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        id: string;
        sku: string;
        name: string;
        isDefault: boolean;
        price: {
            currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
            amount: number;
        };
        inventory: {
            quantity: number;
            reservedQuantity: number;
            minQuantity: number;
            trackQuantity: boolean;
            allowBackorder: boolean;
            stockStatus: "out_of_stock" | "in_stock" | "on_backorder";
            maxQuantity?: number | undefined;
        };
        attributes: Record<string, string>;
        image?: string | undefined;
    }, {
        id: string;
        sku: string;
        name: string;
        isDefault: boolean;
        price: {
            currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
            amount: number;
        };
        inventory: {
            quantity: number;
            reservedQuantity: number;
            minQuantity: number;
            trackQuantity: boolean;
            allowBackorder: boolean;
            stockStatus: "out_of_stock" | "in_stock" | "on_backorder";
            maxQuantity?: number | undefined;
        };
        attributes: Record<string, string>;
        image?: string | undefined;
    }>, "many">>>;
    seo: z.ZodOptional<z.ZodObject<{
        title: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        keywords: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        slug: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        slug: string;
        title?: string | undefined;
        description?: string | undefined;
        keywords?: string[] | undefined;
    }, {
        slug: string;
        title?: string | undefined;
        description?: string | undefined;
        keywords?: string[] | undefined;
    }>>;
    weight: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    dimensions: z.ZodOptional<z.ZodOptional<z.ZodObject<{
        length: z.ZodNumber;
        width: z.ZodNumber;
        height: z.ZodNumber;
        unit: z.ZodEnum<["cm", "in"]>;
    }, "strip", z.ZodTypeAny, {
        length: number;
        unit: "in" | "cm";
        width: number;
        height: number;
    }, {
        length: number;
        unit: "in" | "cm";
        width: number;
        height: number;
    }>>>;
    isDigital: z.ZodOptional<z.ZodBoolean>;
    isTaxable: z.ZodOptional<z.ZodBoolean>;
    isShippable: z.ZodOptional<z.ZodBoolean>;
    createdAt: z.ZodOptional<z.ZodDate>;
    updatedAt: z.ZodOptional<z.ZodDate>;
    createdBy: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    updatedBy: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    version: z.ZodOptional<z.ZodNumber>;
    tags: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
    metadata: z.ZodOptional<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>>;
}, "id" | "createdAt" | "createdBy">, "strip", z.ZodTypeAny, {
    status?: "active" | "inactive" | "draft" | "archived" | "out_of_stock" | undefined;
    type?: "simple" | "variable" | "grouped" | "external" | "subscription" | undefined;
    sku?: string | undefined;
    metadata?: Record<string, any> | undefined;
    updatedAt?: Date | undefined;
    name?: string | undefined;
    version?: number | undefined;
    description?: string | undefined;
    tags?: string[] | undefined;
    weight?: number | undefined;
    updatedBy?: string | undefined;
    price?: {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    } | undefined;
    inventory?: {
        quantity: number;
        reservedQuantity: number;
        minQuantity: number;
        trackQuantity: boolean;
        allowBackorder: boolean;
        stockStatus: "out_of_stock" | "in_stock" | "on_backorder";
        maxQuantity?: number | undefined;
    } | undefined;
    attributes?: {
        value: string | number | boolean;
        type: "number" | "boolean" | "select" | "color" | "image" | "text" | "multiselect";
        name: string;
        isRequired: boolean;
        isVariable: boolean;
        displayOrder: number;
    }[] | undefined;
    shortDescription?: string | undefined;
    categoryId?: string | undefined;
    brandId?: string | undefined;
    supplierId?: string | undefined;
    originalPrice?: {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    } | undefined;
    costPrice?: {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    } | undefined;
    images?: {
        url: string;
        id: string;
        size: number;
        name: string;
        originalName: string;
        mimeType: string;
        uploadedAt: Date;
        metadata?: {
            duration?: number | undefined;
            width?: number | undefined;
            height?: number | undefined;
            encoding?: string | undefined;
        } | undefined;
        thumbnailUrl?: string | undefined;
        uploadedBy?: string | undefined;
    }[] | undefined;
    videos?: {
        url: string;
        id: string;
        size: number;
        name: string;
        originalName: string;
        mimeType: string;
        uploadedAt: Date;
        metadata?: {
            duration?: number | undefined;
            width?: number | undefined;
            height?: number | undefined;
            encoding?: string | undefined;
        } | undefined;
        thumbnailUrl?: string | undefined;
        uploadedBy?: string | undefined;
    }[] | undefined;
    documents?: {
        url: string;
        id: string;
        size: number;
        name: string;
        originalName: string;
        mimeType: string;
        uploadedAt: Date;
        metadata?: {
            duration?: number | undefined;
            width?: number | undefined;
            height?: number | undefined;
            encoding?: string | undefined;
        } | undefined;
        thumbnailUrl?: string | undefined;
        uploadedBy?: string | undefined;
    }[] | undefined;
    variants?: {
        id: string;
        sku: string;
        name: string;
        isDefault: boolean;
        price: {
            currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
            amount: number;
        };
        inventory: {
            quantity: number;
            reservedQuantity: number;
            minQuantity: number;
            trackQuantity: boolean;
            allowBackorder: boolean;
            stockStatus: "out_of_stock" | "in_stock" | "on_backorder";
            maxQuantity?: number | undefined;
        };
        attributes: Record<string, string>;
        image?: string | undefined;
    }[] | undefined;
    seo?: {
        slug: string;
        title?: string | undefined;
        description?: string | undefined;
        keywords?: string[] | undefined;
    } | undefined;
    dimensions?: {
        length: number;
        unit: "in" | "cm";
        width: number;
        height: number;
    } | undefined;
    isDigital?: boolean | undefined;
    isTaxable?: boolean | undefined;
    isShippable?: boolean | undefined;
}, {
    status?: "active" | "inactive" | "draft" | "archived" | "out_of_stock" | undefined;
    type?: "simple" | "variable" | "grouped" | "external" | "subscription" | undefined;
    sku?: string | undefined;
    metadata?: Record<string, any> | undefined;
    updatedAt?: Date | undefined;
    name?: string | undefined;
    version?: number | undefined;
    description?: string | undefined;
    tags?: string[] | undefined;
    weight?: number | undefined;
    updatedBy?: string | undefined;
    price?: {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    } | undefined;
    inventory?: {
        quantity: number;
        reservedQuantity: number;
        minQuantity: number;
        trackQuantity: boolean;
        allowBackorder: boolean;
        stockStatus: "out_of_stock" | "in_stock" | "on_backorder";
        maxQuantity?: number | undefined;
    } | undefined;
    attributes?: {
        value: string | number | boolean;
        type: "number" | "boolean" | "select" | "color" | "image" | "text" | "multiselect";
        name: string;
        isRequired: boolean;
        isVariable: boolean;
        displayOrder: number;
    }[] | undefined;
    shortDescription?: string | undefined;
    categoryId?: string | undefined;
    brandId?: string | undefined;
    supplierId?: string | undefined;
    originalPrice?: {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    } | undefined;
    costPrice?: {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    } | undefined;
    images?: {
        url: string;
        id: string;
        size: number;
        name: string;
        originalName: string;
        mimeType: string;
        uploadedAt: Date;
        metadata?: {
            duration?: number | undefined;
            width?: number | undefined;
            height?: number | undefined;
            encoding?: string | undefined;
        } | undefined;
        thumbnailUrl?: string | undefined;
        uploadedBy?: string | undefined;
    }[] | undefined;
    videos?: {
        url: string;
        id: string;
        size: number;
        name: string;
        originalName: string;
        mimeType: string;
        uploadedAt: Date;
        metadata?: {
            duration?: number | undefined;
            width?: number | undefined;
            height?: number | undefined;
            encoding?: string | undefined;
        } | undefined;
        thumbnailUrl?: string | undefined;
        uploadedBy?: string | undefined;
    }[] | undefined;
    documents?: {
        url: string;
        id: string;
        size: number;
        name: string;
        originalName: string;
        mimeType: string;
        uploadedAt: Date;
        metadata?: {
            duration?: number | undefined;
            width?: number | undefined;
            height?: number | undefined;
            encoding?: string | undefined;
        } | undefined;
        thumbnailUrl?: string | undefined;
        uploadedBy?: string | undefined;
    }[] | undefined;
    variants?: {
        id: string;
        sku: string;
        name: string;
        isDefault: boolean;
        price: {
            currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
            amount: number;
        };
        inventory: {
            quantity: number;
            reservedQuantity: number;
            minQuantity: number;
            trackQuantity: boolean;
            allowBackorder: boolean;
            stockStatus: "out_of_stock" | "in_stock" | "on_backorder";
            maxQuantity?: number | undefined;
        };
        attributes: Record<string, string>;
        image?: string | undefined;
    }[] | undefined;
    seo?: {
        slug: string;
        title?: string | undefined;
        description?: string | undefined;
        keywords?: string[] | undefined;
    } | undefined;
    dimensions?: {
        length: number;
        unit: "in" | "cm";
        width: number;
        height: number;
    } | undefined;
    isDigital?: boolean | undefined;
    isTaxable?: boolean | undefined;
    isShippable?: boolean | undefined;
}>;
export declare const CreateOrderSchema: z.ZodObject<Omit<{
    id: z.ZodString;
    orderNumber: z.ZodString;
    customerId: z.ZodOptional<z.ZodString>;
    guestInfo: z.ZodOptional<z.ZodObject<{
        email: z.ZodString;
        firstName: z.ZodString;
        lastName: z.ZodString;
        phone: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        email: string;
        firstName: string;
        lastName: string;
        phone?: string | undefined;
    }, {
        email: string;
        firstName: string;
        lastName: string;
        phone?: string | undefined;
    }>>;
    status: z.ZodEnum<["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded", "returned"]>;
    items: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        productId: z.ZodString;
        variantId: z.ZodOptional<z.ZodString>;
        sku: z.ZodString;
        name: z.ZodString;
        quantity: z.ZodNumber;
        unitPrice: z.ZodObject<{
            amount: z.ZodNumber;
            currency: z.ZodEnum<["KRW", "USD", "EUR", "JPY", "CNY"]>;
        }, "strip", z.ZodTypeAny, {
            currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
            amount: number;
        }, {
            currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
            amount: number;
        }>;
        totalPrice: z.ZodObject<{
            amount: z.ZodNumber;
            currency: z.ZodEnum<["KRW", "USD", "EUR", "JPY", "CNY"]>;
        }, "strip", z.ZodTypeAny, {
            currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
            amount: number;
        }, {
            currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
            amount: number;
        }>;
        tax: z.ZodObject<{
            amount: z.ZodNumber;
            currency: z.ZodEnum<["KRW", "USD", "EUR", "JPY", "CNY"]>;
        }, "strip", z.ZodTypeAny, {
            currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
            amount: number;
        }, {
            currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
            amount: number;
        }>;
        discount: z.ZodObject<{
            amount: z.ZodNumber;
            currency: z.ZodEnum<["KRW", "USD", "EUR", "JPY", "CNY"]>;
        }, "strip", z.ZodTypeAny, {
            currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
            amount: number;
        }, {
            currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
            amount: number;
        }>;
        attributes: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        image: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        totalPrice: {
            currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
            amount: number;
        };
        productId: string;
        sku: string;
        quantity: number;
        unitPrice: {
            currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
            amount: number;
        };
        discount: {
            currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
            amount: number;
        };
        tax: {
            currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
            amount: number;
        };
        name: string;
        image?: string | undefined;
        variantId?: string | undefined;
        attributes?: Record<string, string> | undefined;
    }, {
        id: string;
        totalPrice: {
            currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
            amount: number;
        };
        productId: string;
        sku: string;
        quantity: number;
        unitPrice: {
            currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
            amount: number;
        };
        discount: {
            currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
            amount: number;
        };
        tax: {
            currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
            amount: number;
        };
        name: string;
        image?: string | undefined;
        variantId?: string | undefined;
        attributes?: Record<string, string> | undefined;
    }>, "many">;
    subtotal: z.ZodObject<{
        amount: z.ZodNumber;
        currency: z.ZodEnum<["KRW", "USD", "EUR", "JPY", "CNY"]>;
    }, "strip", z.ZodTypeAny, {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    }, {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    }>;
    tax: z.ZodObject<{
        amount: z.ZodNumber;
        currency: z.ZodEnum<["KRW", "USD", "EUR", "JPY", "CNY"]>;
    }, "strip", z.ZodTypeAny, {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    }, {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    }>;
    shipping: z.ZodObject<{
        amount: z.ZodNumber;
        currency: z.ZodEnum<["KRW", "USD", "EUR", "JPY", "CNY"]>;
    }, "strip", z.ZodTypeAny, {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    }, {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    }>;
    discount: z.ZodObject<{
        amount: z.ZodNumber;
        currency: z.ZodEnum<["KRW", "USD", "EUR", "JPY", "CNY"]>;
    }, "strip", z.ZodTypeAny, {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    }, {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    }>;
    total: z.ZodObject<{
        amount: z.ZodNumber;
        currency: z.ZodEnum<["KRW", "USD", "EUR", "JPY", "CNY"]>;
    }, "strip", z.ZodTypeAny, {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    }, {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    }>;
    shippingAddress: z.ZodObject<{
        country: z.ZodString;
        state: z.ZodOptional<z.ZodString>;
        city: z.ZodString;
        district: z.ZodOptional<z.ZodString>;
        street: z.ZodString;
        detail: z.ZodOptional<z.ZodString>;
        postalCode: z.ZodString;
        latitude: z.ZodOptional<z.ZodNumber>;
        longitude: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        street: string;
        city: string;
        country: string;
        postalCode: string;
        state?: string | undefined;
        district?: string | undefined;
        detail?: string | undefined;
        latitude?: number | undefined;
        longitude?: number | undefined;
    }, {
        street: string;
        city: string;
        country: string;
        postalCode: string;
        state?: string | undefined;
        district?: string | undefined;
        detail?: string | undefined;
        latitude?: number | undefined;
        longitude?: number | undefined;
    }>;
    billingAddress: z.ZodObject<{
        country: z.ZodString;
        state: z.ZodOptional<z.ZodString>;
        city: z.ZodString;
        district: z.ZodOptional<z.ZodString>;
        street: z.ZodString;
        detail: z.ZodOptional<z.ZodString>;
        postalCode: z.ZodString;
        latitude: z.ZodOptional<z.ZodNumber>;
        longitude: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        street: string;
        city: string;
        country: string;
        postalCode: string;
        state?: string | undefined;
        district?: string | undefined;
        detail?: string | undefined;
        latitude?: number | undefined;
        longitude?: number | undefined;
    }, {
        street: string;
        city: string;
        country: string;
        postalCode: string;
        state?: string | undefined;
        district?: string | undefined;
        detail?: string | undefined;
        latitude?: number | undefined;
        longitude?: number | undefined;
    }>;
    shippingMethod: z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        price: z.ZodObject<{
            amount: z.ZodNumber;
            currency: z.ZodEnum<["KRW", "USD", "EUR", "JPY", "CNY"]>;
        }, "strip", z.ZodTypeAny, {
            currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
            amount: number;
        }, {
            currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
            amount: number;
        }>;
        estimatedDays: z.ZodNumber;
        trackingEnabled: z.ZodBoolean;
        carrier: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        price: {
            currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
            amount: number;
        };
        estimatedDays: number;
        trackingEnabled: boolean;
        description?: string | undefined;
        carrier?: string | undefined;
    }, {
        id: string;
        name: string;
        price: {
            currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
            amount: number;
        };
        estimatedDays: number;
        trackingEnabled: boolean;
        description?: string | undefined;
        carrier?: string | undefined;
    }>;
    payment: z.ZodObject<{
        method: z.ZodEnum<["credit_card", "debit_card", "paypal", "bank_transfer", "cash", "crypto"]>;
        status: z.ZodEnum<["pending", "authorized", "paid", "failed", "cancelled", "refunded"]>;
        transactionId: z.ZodOptional<z.ZodString>;
        gatewayResponse: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        paidAt: z.ZodOptional<z.ZodDate>;
        failedAt: z.ZodOptional<z.ZodDate>;
        failureReason: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        status: "pending" | "cancelled" | "refunded" | "authorized" | "paid" | "failed";
        method: "crypto" | "credit_card" | "debit_card" | "paypal" | "bank_transfer" | "cash";
        transactionId?: string | undefined;
        gatewayResponse?: Record<string, any> | undefined;
        paidAt?: Date | undefined;
        failedAt?: Date | undefined;
        failureReason?: string | undefined;
    }, {
        status: "pending" | "cancelled" | "refunded" | "authorized" | "paid" | "failed";
        method: "crypto" | "credit_card" | "debit_card" | "paypal" | "bank_transfer" | "cash";
        transactionId?: string | undefined;
        gatewayResponse?: Record<string, any> | undefined;
        paidAt?: Date | undefined;
        failedAt?: Date | undefined;
        failureReason?: string | undefined;
    }>;
    notes: z.ZodOptional<z.ZodString>;
    source: z.ZodEnum<["web", "mobile", "pos", "phone", "email", "api"]>;
    estimatedDelivery: z.ZodOptional<z.ZodDate>;
    deliveredAt: z.ZodOptional<z.ZodDate>;
    cancelledAt: z.ZodOptional<z.ZodDate>;
    refundedAt: z.ZodOptional<z.ZodDate>;
} & {
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
    createdBy: z.ZodOptional<z.ZodString>;
    updatedBy: z.ZodOptional<z.ZodString>;
    version: z.ZodNumber;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "id" | "orderNumber" | "createdAt" | "updatedAt" | "version">, "strip", z.ZodTypeAny, {
    status: "pending" | "delivered" | "cancelled" | "confirmed" | "processing" | "shipped" | "refunded" | "returned";
    source: "email" | "phone" | "api" | "mobile" | "web" | "pos";
    discount: {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    };
    tax: {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    };
    items: {
        id: string;
        totalPrice: {
            currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
            amount: number;
        };
        productId: string;
        sku: string;
        quantity: number;
        unitPrice: {
            currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
            amount: number;
        };
        discount: {
            currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
            amount: number;
        };
        tax: {
            currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
            amount: number;
        };
        name: string;
        image?: string | undefined;
        variantId?: string | undefined;
        attributes?: Record<string, string> | undefined;
    }[];
    shippingAddress: {
        street: string;
        city: string;
        country: string;
        postalCode: string;
        state?: string | undefined;
        district?: string | undefined;
        detail?: string | undefined;
        latitude?: number | undefined;
        longitude?: number | undefined;
    };
    billingAddress: {
        street: string;
        city: string;
        country: string;
        postalCode: string;
        state?: string | undefined;
        district?: string | undefined;
        detail?: string | undefined;
        latitude?: number | undefined;
        longitude?: number | undefined;
    };
    subtotal: {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    };
    shipping: {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    };
    total: {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    };
    shippingMethod: {
        id: string;
        name: string;
        price: {
            currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
            amount: number;
        };
        estimatedDays: number;
        trackingEnabled: boolean;
        description?: string | undefined;
        carrier?: string | undefined;
    };
    payment: {
        status: "pending" | "cancelled" | "refunded" | "authorized" | "paid" | "failed";
        method: "crypto" | "credit_card" | "debit_card" | "paypal" | "bank_transfer" | "cash";
        transactionId?: string | undefined;
        gatewayResponse?: Record<string, any> | undefined;
        paidAt?: Date | undefined;
        failedAt?: Date | undefined;
        failureReason?: string | undefined;
    };
    metadata?: Record<string, any> | undefined;
    customerId?: string | undefined;
    notes?: string | undefined;
    deliveredAt?: Date | undefined;
    cancelledAt?: Date | undefined;
    tags?: string[] | undefined;
    createdBy?: string | undefined;
    updatedBy?: string | undefined;
    guestInfo?: {
        email: string;
        firstName: string;
        lastName: string;
        phone?: string | undefined;
    } | undefined;
    estimatedDelivery?: Date | undefined;
    refundedAt?: Date | undefined;
}, {
    status: "pending" | "delivered" | "cancelled" | "confirmed" | "processing" | "shipped" | "refunded" | "returned";
    source: "email" | "phone" | "api" | "mobile" | "web" | "pos";
    discount: {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    };
    tax: {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    };
    items: {
        id: string;
        totalPrice: {
            currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
            amount: number;
        };
        productId: string;
        sku: string;
        quantity: number;
        unitPrice: {
            currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
            amount: number;
        };
        discount: {
            currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
            amount: number;
        };
        tax: {
            currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
            amount: number;
        };
        name: string;
        image?: string | undefined;
        variantId?: string | undefined;
        attributes?: Record<string, string> | undefined;
    }[];
    shippingAddress: {
        street: string;
        city: string;
        country: string;
        postalCode: string;
        state?: string | undefined;
        district?: string | undefined;
        detail?: string | undefined;
        latitude?: number | undefined;
        longitude?: number | undefined;
    };
    billingAddress: {
        street: string;
        city: string;
        country: string;
        postalCode: string;
        state?: string | undefined;
        district?: string | undefined;
        detail?: string | undefined;
        latitude?: number | undefined;
        longitude?: number | undefined;
    };
    subtotal: {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    };
    shipping: {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    };
    total: {
        currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
        amount: number;
    };
    shippingMethod: {
        id: string;
        name: string;
        price: {
            currency: "KRW" | "USD" | "EUR" | "JPY" | "CNY";
            amount: number;
        };
        estimatedDays: number;
        trackingEnabled: boolean;
        description?: string | undefined;
        carrier?: string | undefined;
    };
    payment: {
        status: "pending" | "cancelled" | "refunded" | "authorized" | "paid" | "failed";
        method: "crypto" | "credit_card" | "debit_card" | "paypal" | "bank_transfer" | "cash";
        transactionId?: string | undefined;
        gatewayResponse?: Record<string, any> | undefined;
        paidAt?: Date | undefined;
        failedAt?: Date | undefined;
        failureReason?: string | undefined;
    };
    metadata?: Record<string, any> | undefined;
    customerId?: string | undefined;
    notes?: string | undefined;
    deliveredAt?: Date | undefined;
    cancelledAt?: Date | undefined;
    tags?: string[] | undefined;
    createdBy?: string | undefined;
    updatedBy?: string | undefined;
    guestInfo?: {
        email: string;
        firstName: string;
        lastName: string;
        phone?: string | undefined;
    } | undefined;
    estimatedDelivery?: Date | undefined;
    refundedAt?: Date | undefined;
}>;
//# sourceMappingURL=schemas.d.ts.map