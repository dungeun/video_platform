import Redis from 'ioredis'

// Redis 클라이언트 인스턴스 생성
const createRedisClient = () => {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
  
  try {
    const client = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) return null
        return Math.min(times * 200, 1000)
      },
      reconnectOnError: (err) => {
        const targetErrors = ['READONLY', 'ECONNRESET', 'ECONNREFUSED']
        if (targetErrors.some(e => err.message.includes(e))) {
          return true
        }
        return false
      }
    })

    client.on('error', (err) => {
      console.error('Redis Client Error:', err)
    })

    client.on('connect', () => {
      console.log('Redis Client Connected')
    })

    return client
  } catch (error) {
    console.error('Failed to create Redis client:', error)
    return null
  }
}

// 싱글톤 패턴으로 Redis 클라이언트 관리
let redisClient: Redis | null = null

export const getRedisClient = () => {
  if (!redisClient && process.env.NODE_ENV !== 'test') {
    redisClient = createRedisClient()
  }
  return redisClient
}

// 캐시 키 생성 헬퍼
export const generateCacheKey = (prefix: string, ...parts: (string | number)[]) => {
  return `${prefix}:${parts.join(':')}`
}

// 캐시 TTL 상수
export const CACHE_TTL = {
  SHORT: 60, // 1분
  MEDIUM: 300, // 5분
  LONG: 3600, // 1시간
  DAY: 86400, // 1일
} as const