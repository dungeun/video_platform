import { CouponType, DiscountType } from '../types';
export * from './config/coupons-admin.config';
export declare const couponAdminConfig: {
    entities: {
        coupon: {
            name: string;
            plural: string;
            fields: {
                code: {
                    label: string;
                    type: string;
                    required: boolean;
                    validation: {
                        pattern: RegExp;
                        minLength: number;
                        maxLength: number;
                    };
                };
                name: {
                    label: string;
                    type: string;
                    required: boolean;
                    maxLength: number;
                };
                description: {
                    label: string;
                    type: string;
                    maxLength: number;
                };
                type: {
                    label: string;
                    type: string;
                    required: boolean;
                    options: {
                        value: CouponType;
                        label: string;
                    }[];
                };
                discountType: {
                    label: string;
                    type: string;
                    required: boolean;
                    options: {
                        value: DiscountType;
                        label: string;
                    }[];
                };
                discountValue: {
                    label: string;
                    type: string;
                    required: boolean;
                    min: number;
                };
                minPurchaseAmount: {
                    label: string;
                    type: string;
                    min: number;
                };
                maxDiscountAmount: {
                    label: string;
                    type: string;
                    min: number;
                };
                validFrom: {
                    label: string;
                    type: string;
                    required: boolean;
                };
                validUntil: {
                    label: string;
                    type: string;
                    required: boolean;
                };
                usageLimit: {
                    label: string;
                    type: string;
                    min: number;
                };
                usageLimitPerUser: {
                    label: string;
                    type: string;
                    min: number;
                };
                isActive: {
                    label: string;
                    type: string;
                    defaultValue: boolean;
                };
                campaignId: {
                    label: string;
                    type: string;
                    relation: string;
                };
            };
            list: {
                columns: string[];
                filters: string[];
                searchFields: string[];
                defaultSort: {
                    field: string;
                    order: string;
                };
            };
            actions: {
                create: boolean;
                edit: boolean;
                delete: boolean;
                bulk: string[];
                custom: {
                    name: string;
                    label: string;
                    icon: string;
                    handler: string;
                }[];
            };
        };
        campaign: {
            name: string;
            plural: string;
            fields: {
                name: {
                    label: string;
                    type: string;
                    required: boolean;
                    maxLength: number;
                };
                description: {
                    label: string;
                    type: string;
                    maxLength: number;
                };
                startDate: {
                    label: string;
                    type: string;
                    required: boolean;
                };
                endDate: {
                    label: string;
                    type: string;
                    required: boolean;
                };
                budget: {
                    label: string;
                    type: string;
                    min: number;
                };
                isActive: {
                    label: string;
                    type: string;
                    defaultValue: boolean;
                };
            };
            list: {
                columns: string[];
                filters: string[];
                searchFields: string[];
                defaultSort: {
                    field: string;
                    order: string;
                };
            };
            actions: {
                create: boolean;
                edit: boolean;
                delete: boolean;
                custom: {
                    name: string;
                    label: string;
                    icon: string;
                    handler: string;
                }[];
            };
        };
    };
    dashboard: {
        widgets: ({
            type: string;
            title: string;
            query: string;
            chartType?: undefined;
            limit?: undefined;
        } | {
            type: string;
            title: string;
            query: string;
            chartType: string;
            limit?: undefined;
        } | {
            type: string;
            title: string;
            query: string;
            limit: number;
            chartType?: undefined;
        })[];
    };
    reports: ({
        id: string;
        name: string;
        description: string;
        parameters: {
            dateRange: {
                type: string;
                required: boolean;
            };
            groupBy: {
                type: string;
                options: string[];
                defaultValue: string;
            };
            campaignId?: undefined;
        };
    } | {
        id: string;
        name: string;
        description: string;
        parameters: {
            campaignId: {
                type: string;
                relation: string;
            };
            dateRange: {
                type: string;
                required?: undefined;
            };
            groupBy?: undefined;
        };
    })[];
};
//# sourceMappingURL=index.d.ts.map