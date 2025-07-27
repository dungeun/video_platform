import Redis from 'ioredis';

const globalForRedis = globalThis as unknown as {
  redis: Redis | null | undefined;
};

// Mock Redis client for when Redis is disabled
class MockRedis {
  async get(key: string): Promise<null> {
    return null;
  }
  
  async set(key: string, value: any, ...args: any[]): Promise<string> {
    return 'OK';
  }
  
  async setex(key: string, seconds: number, value: any): Promise<string> {
    return 'OK';
  }
  
  async del(key: string): Promise<number> {
    return 0;
  }
  
  async expire(key: string, seconds: number): Promise<number> {
    return 0;
  }
  
  async ttl(key: string): Promise<number> {
    return -1;
  }
  
  async exists(key: string): Promise<number> {
    return 0;
  }
  
  async hset(key: string, field: string, value: any): Promise<number> {
    return 0;
  }
  
  async hget(key: string, field: string): Promise<string | null> {
    return null;
  }
  
  async hdel(key: string, ...fields: string[]): Promise<number> {
    return 0;
  }
  
  async hgetall(key: string): Promise<Record<string, string>> {
    return {};
  }
}

// Disable Redis in production if REDIS_URL is not provided
const createRedisClient = () => {
  // Disable Redis if explicitly disabled or in development without URL
  if (process.env.DISABLE_REDIS === 'true' || (!process.env.REDIS_URL && process.env.NODE_ENV !== 'production')) {
    console.log('Redis is disabled - using mock Redis client');
    return new MockRedis() as any;
  }

  try {
    // Use REDIS_URL if provided, otherwise use individual config
    const redisUrl = process.env.REDIS_URL;
    
    const client = redisUrl 
      ? new Redis(redisUrl)
      : new Redis({
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
          password: process.env.REDIS_PASSWORD,
          db: parseInt(process.env.REDIS_DB || '0'),
          maxRetriesPerRequest: 3,
          retryStrategy(times) {
            if (times > 3) {
              // Stop retrying after 3 attempts
              console.log('Redis connection failed after 3 attempts - falling back to mock Redis');
              return null;
            }
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
          lazyConnect: true,
        });

    client.on('error', (err) => {
      console.error('Redis Client Error:', err.message);
    });

    client.on('connect', () => {
      console.log('Redis connected successfully');
    });

    // Try to connect
    client.connect().catch((err) => {
      console.error('Failed to connect to Redis:', err.message);
    });

    return client;
  } catch (error) {
    console.error('Failed to create Redis client:', error);
    console.log('Falling back to mock Redis client');
    return new MockRedis() as any;
  }
};

export const redis = globalForRedis.redis ?? createRedisClient();

if (process.env.NODE_ENV !== 'production' && redis) globalForRedis.redis = redis;