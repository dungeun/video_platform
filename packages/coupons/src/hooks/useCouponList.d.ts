import { Coupon, CouponQuery } from '../types';
interface UseCouponListOptions {
    query?: CouponQuery;
    autoLoad?: boolean;
    onLoad?: (coupons: Coupon[]) => void;
    onError?: (error: Error) => void;
}
export declare function useCouponList(options?: UseCouponListOptions): {
    coupons: Coupon[];
    total: number;
    isLoading: boolean;
    error: Error | null;
    query: CouponQuery;
    loadCoupons: (customQuery?: CouponQuery) => Promise<any>;
    refresh: () => Promise<any>;
    updateQuery: (newQuery: Partial<CouponQuery>) => void;
    searchCoupons: (search: string) => void;
    filterByType: (type: CouponQuery["type"]) => void;
    filterByCampaign: (campaignId: string | undefined) => void;
    filterByActive: (isActive: boolean | undefined) => void;
    changePage: (page: number) => void;
    changeLimit: (limit: number) => void;
    sortBy: (field: CouponQuery["sortBy"], order?: CouponQuery["sortOrder"]) => void;
};
export {};
//# sourceMappingURL=useCouponList.d.ts.map