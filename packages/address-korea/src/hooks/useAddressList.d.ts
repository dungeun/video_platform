/**
 * 주소 목록 관리 Hook
 */
import type { DetailedAddress } from '../types';
interface AddressItem extends DetailedAddress {
    id: string;
    name?: string;
    isDefault?: boolean;
    createdAt: Date;
    updatedAt: Date;
}
interface UseAddressListReturn {
    addresses: AddressItem[];
    defaultAddress: AddressItem | null;
    addAddress: (address: DetailedAddress, name?: string) => string;
    updateAddress: (id: string, updates: Partial<AddressItem>) => void;
    removeAddress: (id: string) => void;
    setDefaultAddress: (id: string) => void;
    findAddress: (id: string) => AddressItem | undefined;
    clearAll: () => void;
    count: number;
    hasDefault: boolean;
}
export declare const useAddressList: (initialAddresses?: AddressItem[]) => UseAddressListReturn;
/**
 * 주소 목록 정렬 및 필터링 Hook
 */
interface UseAddressFiltersOptions {
    sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'address';
    sortOrder?: 'asc' | 'desc';
    filterBy?: {
        sido?: string;
        sigungu?: string;
        searchTerm?: string;
    };
}
export declare const useAddressFilters: (addresses: AddressItem[], options?: UseAddressFiltersOptions) => AddressItem[];
export {};
//# sourceMappingURL=useAddressList.d.ts.map