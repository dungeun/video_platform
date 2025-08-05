# 🔴 Redis 사용 가이드 - 동영상 플랫폼

## 1. Redis 연결 정보

### 현재 설정
```bash
# 메인 Redis URL
REDIS_URL="redis://default:uu1SxljgYlrQpLlhIqXUn4GY1TNUuu81hk0IL0bDdT7WbuoDZ2JxUWITk9PVgQ2Q@bssgk8sogo8cgs4c4o0gkwkw:6379/0"

# 호스트 정보
Host: bssgk8sogo8cgs4c4o0gkwkw
Port: 6379
Username: default
Password: uu1SxljgYlrQpLlhIqXUn4GY1TNUuu81hk0IL0bDdT7WbuoDZ2JxUWITk9PVgQ2Q
```

## 2. Redis DB 구조 및 용도

동영상 플랫폼에서는 Redis의 여러 DB를 용도별로 분리하여 사용합니다:

### DB 0: 일반 캐싱
```javascript
// 사용 예시
const cacheKey = {
  video: (id) => `video:${id}`,                    // 동영상 메타데이터
  channel: (id) => `channel:${id}`,                // 채널 정보
  trending: () => 'trending:videos',               // 인기 동영상
  recommendations: (userId) => `reco:${userId}`    // 추천 목록
}

// TTL 설정
VIDEO_METADATA_TTL = 3600      // 1시간
CHANNEL_DATA_TTL = 1800        // 30분
TRENDING_TTL = 300             // 5분
```

### DB 1: 세션 관리
```javascript
// 사용 예시
const sessionKey = {
  auth: (token) => `auth:${token}`,               // JWT 토큰
  user: (userId) => `session:${userId}`,          // 사용자 세션
  refresh: (token) => `refresh:${token}`          // 리프레시 토큰
}

// TTL 설정
AUTH_TOKEN_TTL = 3600          // 1시간
REFRESH_TOKEN_TTL = 604800     // 7일
```

### DB 2: 작업 큐
```javascript
// 큐 이름
const queues = {
  videoUpload: 'queue:video:upload',              // 동영상 업로드
  videoEncoding: 'queue:video:encoding',          // 인코딩 작업
  thumbnailGeneration: 'queue:thumbnail:generate', // 썸네일 생성
  notification: 'queue:notification:send'          // 알림 발송
}

// Bull Queue 설정 예시
const videoQueue = new Bull('video-processing', {
  redis: {
    port: 6379,
    host: 'bssgk8sogo8cgs4c4o0gkwkw',
    password: 'uu1SxljgYlrQpLlhIqXUn4GY1TNUuu81hk0IL0bDdT7WbuoDZ2JxUWITk9PVgQ2Q',
    db: 2
  }
});
```

### DB 3: 실시간 분석
```javascript
// 카운터 키
const analyticsKey = {
  views: (videoId) => `views:${videoId}`,         // 조회수
  likes: (videoId) => `likes:${videoId}`,         // 좋아요
  watching: (videoId) => `watching:${videoId}`,   // 실시간 시청자
  trending: (hour) => `trending:${hour}`          // 시간별 트렌딩
}

// 실시간 집계 예시
await redis.incr(`views:${videoId}`);             // 조회수 증가
await redis.zincrby('trending:videos', 1, videoId); // 트렌딩 점수
```

### DB 4: Pub/Sub (실시간 기능)
```javascript
// 채널 이름
const channels = {
  videoUpload: 'channel:video:uploaded',          // 업로드 완료
  liveChat: (videoId) => `chat:${videoId}`,      // 라이브 채팅
  notification: (userId) => `notify:${userId}`,    // 사용자 알림
  systemAlert: 'channel:system:alert'             // 시스템 알림
}

// Pub/Sub 예시
// Publisher
await redis.publish('channel:video:uploaded', JSON.stringify({
  videoId: '123',
  channelId: '456',
  title: '새 동영상'
}));

// Subscriber
redis.subscribe('channel:video:uploaded');
redis.on('message', (channel, message) => {
  console.log(`Received: ${message}`);
});
```

## 3. 동영상 플랫폼 특화 패턴

### 3.1 조회수 처리 (높은 처리량)
```javascript
// 배치 처리로 DB 부하 감소
class ViewCounter {
  async incrementView(videoId) {
    // Redis에 즉시 기록
    await redis.incr(`views:${videoId}`);
    
    // 10초마다 DB 동기화
    if (!this.syncScheduled) {
      this.syncScheduled = true;
      setTimeout(() => this.syncToDatabase(), 10000);
    }
  }
  
  async syncToDatabase() {
    const keys = await redis.keys('views:*');
    for (const key of keys) {
      const count = await redis.get(key);
      const videoId = key.split(':')[1];
      
      // DB 업데이트
      await prisma.video.update({
        where: { id: videoId },
        data: { viewCount: { increment: parseInt(count) } }
      });
      
      // Redis 카운터 리셋
      await redis.del(key);
    }
    this.syncScheduled = false;
  }
}
```

### 3.2 실시간 시청자 추적
```javascript
// HyperLogLog로 유니크 시청자 추적
class LiveViewerTracker {
  async addViewer(videoId, userId) {
    const key = `viewers:${videoId}`;
    await redis.pfadd(key, userId);
    await redis.expire(key, 300); // 5분 후 만료
  }
  
  async getViewerCount(videoId) {
    const key = `viewers:${videoId}`;
    return await redis.pfcount(key);
  }
}
```

### 3.3 추천 시스템 캐싱
```javascript
// 협업 필터링 결과 캐싱
class RecommendationCache {
  async getRecommendations(userId) {
    const key = `reco:${userId}`;
    const cached = await redis.get(key);
    
    if (cached) {
      return JSON.parse(cached);
    }
    
    // 추천 알고리즘 실행
    const recommendations = await calculateRecommendations(userId);
    
    // 30분간 캐싱
    await redis.setex(key, 1800, JSON.stringify(recommendations));
    
    return recommendations;
  }
}
```

### 3.4 트렌딩 동영상
```javascript
// Sorted Set으로 실시간 순위 관리
class TrendingVideos {
  async updateScore(videoId, engagement) {
    // 가중치 적용
    const score = engagement.views * 1 + 
                 engagement.likes * 10 + 
                 engagement.comments * 5;
    
    await redis.zadd('trending:videos', score, videoId);
    
    // 상위 100개만 유지
    await redis.zremrangebyrank('trending:videos', 0, -101);
  }
  
  async getTopVideos(count = 20) {
    const videoIds = await redis.zrevrange('trending:videos', 0, count - 1);
    return videoIds;
  }
}
```

## 4. 성능 최적화

### 4.1 파이프라이닝
```javascript
// 여러 명령을 한번에 전송
const pipeline = redis.pipeline();
pipeline.incr(`views:${videoId}`);
pipeline.zadd('trending:videos', score, videoId);
pipeline.expire(`cache:video:${videoId}`, 3600);
await pipeline.exec();
```

### 4.2 연결 풀 설정
```javascript
const Redis = require('ioredis');

const redis = new Redis({
  host: 'bssgk8sogo8cgs4c4o0gkwkw',
  port: 6379,
  password: 'uu1SxljgYlrQpLlhIqXUn4GY1TNUuu81hk0IL0bDdT7WbuoDZ2JxUWITk9PVgQ2Q',
  db: 0,
  
  // 연결 풀 설정
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  reconnectOnError: (err) => {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      return true;
    }
    return false;
  },
  
  // 성능 최적화
  enableOfflineQueue: true,
  lazyConnect: true
});
```

## 5. 모니터링

### 5.1 Redis 상태 확인
```bash
# Redis CLI로 접속
redis-cli -h bssgk8sogo8cgs4c4o0gkwkw -p 6379 -a uu1SxljgYlrQpLlhIqXUn4GY1TNUuu81hk0IL0bDdT7WbuoDZ2JxUWITk9PVgQ2Q

# 기본 정보
INFO

# 메모리 사용량
INFO memory

# 연결 클라이언트
CLIENT LIST

# 느린 쿼리 확인
SLOWLOG GET 10
```

### 5.2 키 패턴 분석
```bash
# 키 분포 확인
redis-cli --scan --pattern "video:*" | wc -l
redis-cli --scan --pattern "cache:*" | wc -l
redis-cli --scan --pattern "session:*" | wc -l

# 메모리 사용량 큰 키 찾기
redis-cli --bigkeys
```

## 6. 보안 고려사항

### 6.1 접근 제어
- ACL 사용자별 권한 설정
- 네트워크 레벨 방화벽 설정
- SSL/TLS 연결 사용 (프로덕션)

### 6.2 데이터 보호
- 민감한 데이터는 암호화 후 저장
- 정기적인 백업 수행
- 키 만료 시간 설정 필수

## 7. 문제 해결

### 7.1 연결 실패
```javascript
// 재시도 로직
const connectWithRetry = async () => {
  for (let i = 0; i < 5; i++) {
    try {
      await redis.ping();
      console.log('Redis connected');
      return;
    } catch (err) {
      console.log(`Redis connection attempt ${i + 1} failed`);
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
  throw new Error('Failed to connect to Redis');
};
```

### 7.2 메모리 부족
```bash
# 메모리 정책 확인
CONFIG GET maxmemory-policy

# LRU 정책 설정
CONFIG SET maxmemory-policy allkeys-lru
```

### 7.3 성능 저하
- 키 개수 확인 (DBSIZE)
- 느린 명령 확인 (SLOWLOG)
- 불필요한 키 정리
- 적절한 TTL 설정