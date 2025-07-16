/**
 * 지오코딩 서비스
 * 주소를 좌표로, 좌표를 주소로 변환
 */
export class GeocodingService {
    constructor(kakaoApiKey) {
        this.cache = new Map();
        this.cacheTimeout = 60 * 60 * 1000; // 1시간
        this.kakaoApiKey = kakaoApiKey;
    }
    /**
     * 주소를 좌표로 변환 (지오코딩)
     */
    async geocode(address) {
        const addressStr = typeof address === 'string'
            ? address
            : `${address.address} ${address.detailAddress || ''}`.trim();
        const cacheKey = `geocode:${addressStr}`;
        const cached = this.getFromCache(cacheKey);
        if (cached)
            return cached;
        try {
            const result = await this.geocodeWithKakao(addressStr);
            if (result) {
                this.setCache(cacheKey, result);
            }
            return result;
        }
        catch (error) {
            console.error('Geocoding failed:', error);
            return null;
        }
    }
    /**
     * 좌표를 주소로 변환 (역지오코딩)
     */
    async reverseGeocode(coordinates) {
        const cacheKey = `reverse:${coordinates.x},${coordinates.y}`;
        const cached = this.getFromCache(cacheKey);
        if (cached)
            return cached;
        try {
            const result = await this.reverseGeocodeWithKakao(coordinates);
            if (result) {
                this.setCache(cacheKey, result);
            }
            return result;
        }
        catch (error) {
            console.error('Reverse geocoding failed:', error);
            return null;
        }
    }
    /**
     * 두 좌표 간 거리 계산 (미터 단위)
     */
    calculateDistance(coord1, coord2) {
        const R = 6371e3; // 지구 반지름 (미터)
        const φ1 = this.toRadians(Number(coord1.y));
        const φ2 = this.toRadians(Number(coord2.y));
        const Δφ = this.toRadians(Number(coord2.y) - Number(coord1.y));
        const Δλ = this.toRadians(Number(coord2.x) - Number(coord1.x));
        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
    /**
     * 좌표가 한국 내에 있는지 확인
     */
    isInKorea(coordinates) {
        const lat = Number(coordinates.y);
        const lng = Number(coordinates.x);
        // 대한민국 경계 좌표 (대략적)
        return lat >= 33.0 && lat <= 43.0 && lng >= 124.0 && lng <= 132.0;
    }
    /**
     * Kakao API를 사용한 지오코딩
     */
    async geocodeWithKakao(address) {
        if (!this.kakaoApiKey) {
            throw new Error('Kakao API key is required for geocoding');
        }
        const response = await fetch(`https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`, {
            headers: {
                'Authorization': `KakaoAK ${this.kakaoApiKey}`
            }
        });
        if (!response.ok) {
            throw new Error('Kakao API request failed');
        }
        const data = await response.json();
        if (!data.documents || data.documents.length === 0) {
            return null;
        }
        const doc = data.documents[0];
        return {
            address: doc.address_name,
            coordinates: {
                x: doc.x,
                y: doc.y
            },
            accuracy: this.determineAccuracy(doc),
            source: 'KAKAO'
        };
    }
    /**
     * Kakao API를 사용한 역지오코딩
     */
    async reverseGeocodeWithKakao(coordinates) {
        if (!this.kakaoApiKey) {
            throw new Error('Kakao API key is required for reverse geocoding');
        }
        const response = await fetch(`https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${coordinates.x}&y=${coordinates.y}`, {
            headers: {
                'Authorization': `KakaoAK ${this.kakaoApiKey}`
            }
        });
        if (!response.ok) {
            throw new Error('Kakao API request failed');
        }
        const data = await response.json();
        if (!data.documents || data.documents.length === 0) {
            return null;
        }
        const doc = data.documents[0];
        const address = {
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
        // 주변 장소 검색
        const nearbyPlaces = await this.searchNearbyPlaces(coordinates);
        return {
            coordinates,
            address,
            nearbyPlaces
        };
    }
    /**
     * 주변 장소 검색
     */
    async searchNearbyPlaces(coordinates, radius = 500) {
        if (!this.kakaoApiKey) {
            return [];
        }
        try {
            const response = await fetch(`https://dapi.kakao.com/v2/local/search/category.json?x=${coordinates.x}&y=${coordinates.y}&radius=${radius}&sort=distance`, {
                headers: {
                    'Authorization': `KakaoAK ${this.kakaoApiKey}`
                }
            });
            if (!response.ok) {
                return [];
            }
            const data = await response.json();
            return (data.documents || []).slice(0, 5).map((doc) => ({
                name: doc.place_name,
                distance: Number(doc.distance),
                category: doc.category_name
            }));
        }
        catch (error) {
            console.error('Failed to search nearby places:', error);
            return [];
        }
    }
    /**
     * 정확도 판단
     */
    determineAccuracy(doc) {
        if (doc.road_address) {
            return 'ROOFTOP';
        }
        if (doc.address?.address_type === 'REGION_ADDR') {
            return 'GEOMETRIC_CENTER';
        }
        return 'APPROXIMATE';
    }
    /**
     * 도를 라디안으로 변환
     */
    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }
    /**
     * 캐시에서 가져오기
     */
    getFromCache(key) {
        const cached = this.cache.get(key);
        if (!cached)
            return null;
        if (Date.now() - cached.timestamp > this.cacheTimeout) {
            this.cache.delete(key);
            return null;
        }
        return cached.data;
    }
    /**
     * 캐시에 저장
     */
    setCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }
    /**
     * 캐시 초기화
     */
    clearCache() {
        this.cache.clear();
    }
}
//# sourceMappingURL=GeocodingService.js.map