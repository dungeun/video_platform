/**
 * 주소 검색 서비스
 * Kakao Local API를 사용한 주소 검색
 */

import type {
  AddressSearchResult,
  AddressSuggestion,
  Coordinates,
  DetailedAddress
} from '../types';

export interface SearchOptions {
  query: string;
  page?: number;
  size?: number;
  addressType?: 'ROAD' | 'JIBUN' | 'ALL';
}

export class AddressSearchService {
  private kakaoApiKey?: string;
  private cache: Map<string, any> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5분

  constructor(kakaoApiKey?: string) {
    this.kakaoApiKey = kakaoApiKey;
  }

  /**
   * 주소 검색
   */
  async search(options: SearchOptions): Promise<AddressSearchResult[]> {
    const cacheKey = this.getCacheKey(options);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const results = await this.searchWithKakaoAPI(options);
      this.setCache(cacheKey, results);
      return results;
    } catch (error) {
      console.error('Address search failed:', error);
      throw new Error('주소 검색에 실패했습니다.');
    }
  }

  /**
   * 주소 자동완성
   */
  async getSuggestions(query: string, limit: number = 5): Promise<AddressSuggestion[]> {
    if (!query || query.length < 2) return [];

    try {
      const results = await this.search({
        query,
        size: limit
      });

      return results.map(result => ({
        text: result.address,
        highlightedText: this.highlightText(result.address, query),
        address: result,
        score: this.calculateScore(result, query)
      })).sort((a, b) => (b.score || 0) - (a.score || 0));
    } catch (error) {
      console.error('Failed to get suggestions:', error);
      return [];
    }
  }

  /**
   * 좌표로 주소 검색 (역지오코딩)
   */
  async reverseGeocode(coordinates: Coordinates): Promise<DetailedAddress | null> {
    if (!this.kakaoApiKey) {
      throw new Error('Kakao API key is required for reverse geocoding');
    }

    const cacheKey = `reverse:${coordinates.x},${coordinates.y}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(
        `https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${coordinates.x}&y=${coordinates.y}`,
        {
          headers: {
            'Authorization': `KakaoAK ${this.kakaoApiKey}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Reverse geocoding failed');
      }

      const data = await response.json();
      if (!data.documents || data.documents.length === 0) {
        return null;
      }

      const doc = data.documents[0];
      const address: DetailedAddress = {
        zonecode: doc.road_address?.zone_no || '',
        address: doc.address?.address_name || '',
        addressType: doc.road_address ? 'ROAD' : 'JIBUN',
        sido: doc.address?.region_1depth_name || '',
        sigungu: doc.address?.region_2depth_name || '',
        bname: doc.address?.region_3depth_name || '',
        roadname: doc.road_address?.road_name || '',
        buildingName: doc.road_address?.building_name || '',
        sigunguCode: '',
        bcode: doc.address?.b_code || '',
        coordinates
      };

      this.setCache(cacheKey, address);
      return address;
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      return null;
    }
  }

  /**
   * Kakao API를 사용한 주소 검색
   */
  private async searchWithKakaoAPI(options: SearchOptions): Promise<AddressSearchResult[]> {
    if (!this.kakaoApiKey) {
      // API 키가 없는 경우 빈 배열 반환
      return [];
    }

    const params = new URLSearchParams({
      query: options.query,
      page: String(options.page || 1),
      size: String(options.size || 10)
    });

    const response = await fetch(
      `https://dapi.kakao.com/v2/local/search/address.json?${params}`,
      {
        headers: {
          'Authorization': `KakaoAK ${this.kakaoApiKey}`
        }
      }
    );

    if (!response.ok) {
      throw new Error('Kakao API request failed');
    }

    const data = await response.json();
    return this.transformKakaoResults(data.documents || []);
  }

  /**
   * Kakao API 결과 변환
   */
  private transformKakaoResults(documents: any[]): AddressSearchResult[] {
    return documents.map(doc => {
      const isRoadAddress = !!doc.road_address;
      const address = isRoadAddress ? doc.road_address : doc.address;
      
      return {
        userSelectedType: isRoadAddress ? 'ROAD' : 'JIBUN',
        zonecode: address.zone_no || '',
        
        roadAddress: doc.road_address?.address_name || '',
        jibunAddress: doc.address?.address_name || '',
        
        address: address.address_name,
        
        sido: address.region_1depth_name || '',
        sigungu: address.region_2depth_name || '',
        sigunguCode: '',
        bcode: address.b_code || '',
        bname: address.region_3depth_name || '',
        
        roadname: doc.road_address?.road_name || '',
        buildingName: doc.road_address?.building_name || '',
        buildingCode: doc.road_address?.building_code || ''
      } as AddressSearchResult;
    });
  }

  /**
   * 텍스트 하이라이트
   */
  private highlightText(text: string, query: string): string {
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  /**
   * 검색 스코어 계산
   */
  private calculateScore(result: AddressSearchResult, query: string): number {
    let score = 0;
    const lowerQuery = query.toLowerCase();
    const lowerAddress = result.address.toLowerCase();

    // 정확한 일치
    if (lowerAddress === lowerQuery) {
      score += 100;
    }
    
    // 시작 부분 일치
    if (lowerAddress.startsWith(lowerQuery)) {
      score += 50;
    }
    
    // 포함 여부
    if (lowerAddress.includes(lowerQuery)) {
      score += 20;
    }
    
    // 도로명 주소 우선
    if (result.userSelectedType === 'ROAD') {
      score += 10;
    }
    
    // 건물명 일치
    if (result.buildingName && result.buildingName.toLowerCase().includes(lowerQuery)) {
      score += 30;
    }

    return score;
  }

  /**
   * 캐시 키 생성
   */
  private getCacheKey(options: SearchOptions): string {
    return `search:${options.query}:${options.page}:${options.size}:${options.addressType}`;
  }

  /**
   * 캐시에서 가져오기
   */
  private getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.cacheTimeout) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  /**
   * 캐시에 저장
   */
  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * 캐시 초기화
   */
  clearCache(): void {
    this.cache.clear();
  }
}