/**
 * 주소 목록 관리 Hook
 */

import { useState, useCallback, useMemo } from 'react';
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

export const useAddressList = (
  initialAddresses: AddressItem[] = []
): UseAddressListReturn => {
  const [addresses, setAddresses] = useState<AddressItem[]>(initialAddresses);

  // 기본 주소 찾기
  const defaultAddress = useMemo(
    () => addresses.find(addr => addr.isDefault) || null,
    [addresses]
  );

  // 주소 추가
  const addAddress = useCallback((
    address: DetailedAddress,
    name?: string
  ): string => {
    const id = `addr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    
    const newAddress: AddressItem = {
      ...address,
      id,
      name,
      isDefault: addresses.length === 0, // 첫 번째 주소는 기본값으로
      createdAt: now,
      updatedAt: now
    };

    setAddresses(prev => [...prev, newAddress]);
    return id;
  }, [addresses.length]);

  // 주소 업데이트
  const updateAddress = useCallback((
    id: string,
    updates: Partial<AddressItem>
  ) => {
    setAddresses(prev => prev.map(addr => {
      if (addr.id === id) {
        return {
          ...addr,
          ...updates,
          updatedAt: new Date()
        };
      }
      return addr;
    }));
  }, []);

  // 주소 삭제
  const removeAddress = useCallback((id: string) => {
    setAddresses(prev => {
      const filtered = prev.filter(addr => addr.id !== id);
      
      // 기본 주소가 삭제되면 첫 번째 주소를 기본값으로
      const removedAddress = prev.find(addr => addr.id === id);
      if (removedAddress?.isDefault && filtered.length > 0 && filtered[0]) {
        filtered[0].isDefault = true;
      }
      
      return filtered;
    });
  }, []);

  // 기본 주소 설정
  const setDefaultAddress = useCallback((id: string) => {
    setAddresses(prev => prev.map(addr => ({
      ...addr,
      isDefault: addr.id === id,
      updatedAt: addr.id === id ? new Date() : addr.updatedAt
    })));
  }, []);

  // 주소 찾기
  const findAddress = useCallback((id: string): AddressItem | undefined => {
    return addresses.find(addr => addr.id === id);
  }, [addresses]);

  // 전체 삭제
  const clearAll = useCallback(() => {
    setAddresses([]);
  }, []);

  return {
    addresses,
    defaultAddress,
    
    addAddress,
    updateAddress,
    removeAddress,
    setDefaultAddress,
    findAddress,
    clearAll,
    
    count: addresses.length,
    hasDefault: !!defaultAddress
  };
};

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

export const useAddressFilters = (
  addresses: AddressItem[],
  options: UseAddressFiltersOptions = {}
) => {
  const { sortBy = 'createdAt', sortOrder = 'desc', filterBy = {} } = options;

  const filteredAddresses = useMemo(() => {
    let filtered = [...addresses];

    // 필터링
    if (filterBy.sido) {
      filtered = filtered.filter(addr => addr.sido === filterBy.sido);
    }
    if (filterBy.sigungu) {
      filtered = filtered.filter(addr => addr.sigungu === filterBy.sigungu);
    }
    if (filterBy.searchTerm) {
      const term = filterBy.searchTerm.toLowerCase();
      filtered = filtered.filter(addr => 
        addr.address.toLowerCase().includes(term) ||
        addr.detailAddress?.toLowerCase().includes(term) ||
        addr.name?.toLowerCase().includes(term)
      );
    }

    // 정렬
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy];
      let bValue: any = b[sortBy];

      if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
        aValue = aValue.getTime();
        bValue = bValue.getTime();
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [addresses, sortBy, sortOrder, filterBy]);

  return filteredAddresses;
};