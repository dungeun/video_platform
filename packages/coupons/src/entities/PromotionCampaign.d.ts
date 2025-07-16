import { z } from 'zod';
export declare const TargetAudienceSchema: z.ZodObject<{
    userSegments: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    minPurchaseHistory: z.ZodOptional<z.ZodNumber>;
    location: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    ageRange: z.ZodOptional<z.ZodObject<{
        min: z.ZodNumber;
        max: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        min: number;
        max: number;
    }, {
        min: number;
        max: number;
    }>>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    tags?: string[] | undefined;
    location?: string[] | undefined;
    userSegments?: string[] | undefined;
    minPurchaseHistory?: number | undefined;
    ageRange?: {
        min: number;
        max: number;
    } | undefined;
}, {
    tags?: string[] | undefined;
    location?: string[] | undefined;
    userSegments?: string[] | undefined;
    minPurchaseHistory?: number | undefined;
    ageRange?: {
        min: number;
        max: number;
    } | undefined;
}>;
export declare const CampaignGoalsSchema: z.ZodObject<{
    targetRevenue: z.ZodOptional<z.ZodNumber>;
    targetUsage: z.ZodOptional<z.ZodNumber>;
    targetNewCustomers: z.ZodOptional<z.ZodNumber>;
    conversionRate: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    targetRevenue?: number | undefined;
    targetUsage?: number | undefined;
    targetNewCustomers?: number | undefined;
    conversionRate?: number | undefined;
}, {
    targetRevenue?: number | undefined;
    targetUsage?: number | undefined;
    targetNewCustomers?: number | undefined;
    conversionRate?: number | undefined;
}>;
export declare const PromotionCampaignSchema: z.ZodEffects<z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    startDate: z.ZodDate;
    endDate: z.ZodDate;
    budget: z.ZodOptional<z.ZodNumber>;
    spentAmount: z.ZodDefault<z.ZodNumber>;
    targetAudience: z.ZodOptional<z.ZodObject<{
        userSegments: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        minPurchaseHistory: z.ZodOptional<z.ZodNumber>;
        location: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        ageRange: z.ZodOptional<z.ZodObject<{
            min: z.ZodNumber;
            max: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            min: number;
            max: number;
        }, {
            min: number;
            max: number;
        }>>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        tags?: string[] | undefined;
        location?: string[] | undefined;
        userSegments?: string[] | undefined;
        minPurchaseHistory?: number | undefined;
        ageRange?: {
            min: number;
            max: number;
        } | undefined;
    }, {
        tags?: string[] | undefined;
        location?: string[] | undefined;
        userSegments?: string[] | undefined;
        minPurchaseHistory?: number | undefined;
        ageRange?: {
            min: number;
            max: number;
        } | undefined;
    }>>;
    goals: z.ZodOptional<z.ZodObject<{
        targetRevenue: z.ZodOptional<z.ZodNumber>;
        targetUsage: z.ZodOptional<z.ZodNumber>;
        targetNewCustomers: z.ZodOptional<z.ZodNumber>;
        conversionRate: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        targetRevenue?: number | undefined;
        targetUsage?: number | undefined;
        targetNewCustomers?: number | undefined;
        conversionRate?: number | undefined;
    }, {
        targetRevenue?: number | undefined;
        targetUsage?: number | undefined;
        targetNewCustomers?: number | undefined;
        conversionRate?: number | undefined;
    }>>;
    isActive: z.ZodDefault<z.ZodBoolean>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    name: string;
    isActive: boolean;
    startDate: Date;
    endDate: Date;
    spentAmount: number;
    description?: string | undefined;
    budget?: number | undefined;
    targetAudience?: {
        tags?: string[] | undefined;
        location?: string[] | undefined;
        userSegments?: string[] | undefined;
        minPurchaseHistory?: number | undefined;
        ageRange?: {
            min: number;
            max: number;
        } | undefined;
    } | undefined;
    goals?: {
        targetRevenue?: number | undefined;
        targetUsage?: number | undefined;
        targetNewCustomers?: number | undefined;
        conversionRate?: number | undefined;
    } | undefined;
}, {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    name: string;
    startDate: Date;
    endDate: Date;
    description?: string | undefined;
    isActive?: boolean | undefined;
    budget?: number | undefined;
    spentAmount?: number | undefined;
    targetAudience?: {
        tags?: string[] | undefined;
        location?: string[] | undefined;
        userSegments?: string[] | undefined;
        minPurchaseHistory?: number | undefined;
        ageRange?: {
            min: number;
            max: number;
        } | undefined;
    } | undefined;
    goals?: {
        targetRevenue?: number | undefined;
        targetUsage?: number | undefined;
        targetNewCustomers?: number | undefined;
        conversionRate?: number | undefined;
    } | undefined;
}>, {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    name: string;
    isActive: boolean;
    startDate: Date;
    endDate: Date;
    spentAmount: number;
    description?: string | undefined;
    budget?: number | undefined;
    targetAudience?: {
        tags?: string[] | undefined;
        location?: string[] | undefined;
        userSegments?: string[] | undefined;
        minPurchaseHistory?: number | undefined;
        ageRange?: {
            min: number;
            max: number;
        } | undefined;
    } | undefined;
    goals?: {
        targetRevenue?: number | undefined;
        targetUsage?: number | undefined;
        targetNewCustomers?: number | undefined;
        conversionRate?: number | undefined;
    } | undefined;
}, {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    name: string;
    startDate: Date;
    endDate: Date;
    description?: string | undefined;
    isActive?: boolean | undefined;
    budget?: number | undefined;
    spentAmount?: number | undefined;
    targetAudience?: {
        tags?: string[] | undefined;
        location?: string[] | undefined;
        userSegments?: string[] | undefined;
        minPurchaseHistory?: number | undefined;
        ageRange?: {
            min: number;
            max: number;
        } | undefined;
    } | undefined;
    goals?: {
        targetRevenue?: number | undefined;
        targetUsage?: number | undefined;
        targetNewCustomers?: number | undefined;
        conversionRate?: number | undefined;
    } | undefined;
}>;
export declare class PromotionCampaignEntity {
    private data;
    constructor(data: z.infer<typeof PromotionCampaignSchema>);
    get id(): string;
    get name(): string;
    get isRunning(): boolean;
    get hasEnded(): boolean;
    get remainingBudget(): number | null;
    get budgetUtilization(): number | null;
    addSpending(amount: number): void;
    activate(): void;
    deactivate(): void;
    toJSON(): z.infer<typeof PromotionCampaignSchema>;
    static fromJSON(data: unknown): PromotionCampaignEntity;
}
//# sourceMappingURL=PromotionCampaign.d.ts.map