/**
 * Simple in-memory cache manager
 * Redis 제거 후 사용할 간단한 메모리 캐시
 */

interface CacheEntry<T> {
  value: T
  expires: number
}

export class SimpleCacheManager {
  private memoryCache = new Map<string, CacheEntry<any>>()
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // 1분마다 만료된 캐시 정리
    if (typeof window === 'undefined') {
      this.cleanupInterval = setInterval(() => {
        this.cleanupExpired()
      }, 60000)
    }
  }

  /**
   * 캐시에서 값 가져오기
   */
  async get<T>(key: string): Promise<T | null> {
    const entry = this.memoryCache.get(key)
    
    if (!entry) {
      return null
    }
    
    if (entry.expires <= Date.now()) {
      this.memoryCache.delete(key)
      return null
    }
    
    return entry.value as T
  }

  /**
   * 캐시에 값 저장
   */
  async set<T>(key: string, value: T, ttl = 3600): Promise<void> {
    this.memoryCache.set(key, {
      value,
      expires: Date.now() + ttl * 1000
    })
  }

  /**
   * 캐시에서 값 삭제
   */
  async del(key: string): Promise<void> {
    this.memoryCache.delete(key)
  }

  /**
   * 모든 캐시 삭제
   */
  async clear(): Promise<void> {
    this.memoryCache.clear()
  }

  /**
   * 캐시-aside 패턴 헬퍼
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl = 3600
  ): Promise<T> {
    const cached = await this.get<T>(key)
    if (cached !== null) {
      return cached
    }

    const value = await factory()
    await this.set(key, value, ttl)
    return value
  }

  /**
   * 만료된 캐시 정리
   */
  private cleanupExpired(): void {
    const now = Date.now()
    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.expires <= now) {
        this.memoryCache.delete(key)
      }
    }
  }

  /**
   * 패턴과 일치하는 모든 캐시 키 삭제
   */
  async deletePattern(pattern: string): Promise<void> {
    const keysToDelete: string[] = []
    const regex = new RegExp(pattern.replace(/\*/g, '.*'))
    
    for (const key of this.memoryCache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key)
      }
    }
    
    for (const key of keysToDelete) {
      this.memoryCache.delete(key)
    }
  }

  /**
   * 특정 엔티티의 캐시 무효화
   */
  async invalidateEntity(entity: string, id: string): Promise<void> {
    const pattern = `${entity}:${id}:*`
    await this.deletePattern(pattern)
  }

  /**
   * 정리 인터벌 중지 (앱 종료 시)
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }
}

// 싱글톤 인스턴스
export const cache = new SimpleCacheManager()

// 캐시 키 생성 헬퍼
export const cacheKeys = {
  video: (id: string) => `video:${id}`,
  videoList: (params: any) => `videos:${JSON.stringify(params)}`,
  user: (id: string) => `user:${id}`,
  userProfile: (id: string) => `profile:${id}`,
  channel: (id: string) => `channel:${id}`,
  stats: (type: string, date: string) => `stats:${type}:${date}`,
  config: (key: string) => `config:${key}`
}

// 캐시 태그 (향후 태그 기반 무효화를 위해 남겨둠)
export const cacheTags = {
  videos: 'videos',
  users: 'users',
  channels: 'channels',
  stats: 'stats',
  config: 'config'
}