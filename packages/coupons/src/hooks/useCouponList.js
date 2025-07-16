import { useState, useCallback, useEffect } from 'react';
export function useCouponList(options = {}) {
    const [coupons, setCoupons] = useState([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [query, setQuery] = useState(options.query || {});
    const loadCoupons = useCallback(async (customQuery) => {
        try {
            setIsLoading(true);
            setError(null);
            const queryParams = new URLSearchParams();
            const finalQuery = customQuery || query;
            Object.entries(finalQuery).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    queryParams.append(key, String(value));
                }
            });
            const response = await fetch(`/api/coupons?${queryParams}`);
            if (!response.ok)
                throw new Error('Failed to load coupons');
            const data = await response.json();
            setCoupons(data.coupons);
            setTotal(data.total);
            options.onLoad?.(data.coupons);
            return data;
        }
        catch (err) {
            const error = err instanceof Error ? err : new Error('Unknown error');
            setError(error);
            options.onError?.(error);
            throw error;
        }
        finally {
            setIsLoading(false);
        }
    }, [query, options]);
    const refresh = useCallback(() => {
        return loadCoupons();
    }, [loadCoupons]);
    const updateQuery = useCallback((newQuery) => {
        setQuery(prev => ({ ...prev, ...newQuery }));
    }, []);
    const searchCoupons = useCallback((search) => {
        updateQuery({ search, page: 1 });
    }, [updateQuery]);
    const filterByType = useCallback((type) => {
        updateQuery({ type, page: 1 });
    }, [updateQuery]);
    const filterByCampaign = useCallback((campaignId) => {
        updateQuery({ campaignId, page: 1 });
    }, [updateQuery]);
    const filterByActive = useCallback((isActive) => {
        updateQuery({ isActive, page: 1 });
    }, [updateQuery]);
    const changePage = useCallback((page) => {
        updateQuery({ page });
    }, [updateQuery]);
    const changeLimit = useCallback((limit) => {
        updateQuery({ limit, page: 1 });
    }, [updateQuery]);
    const sortBy = useCallback((field, order = 'desc') => {
        updateQuery({ sortBy: field, sortOrder: order });
    }, [updateQuery]);
    // Auto-load on mount if specified
    useEffect(() => {
        if (options.autoLoad) {
            loadCoupons();
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps
    // Reload when query changes
    useEffect(() => {
        if (options.autoLoad) {
            loadCoupons();
        }
    }, [query, loadCoupons, options.autoLoad]);
    return {
        coupons,
        total,
        isLoading,
        error,
        query,
        loadCoupons,
        refresh,
        updateQuery,
        searchCoupons,
        filterByType,
        filterByCampaign,
        filterByActive,
        changePage,
        changeLimit,
        sortBy
    };
}
//# sourceMappingURL=useCouponList.js.map