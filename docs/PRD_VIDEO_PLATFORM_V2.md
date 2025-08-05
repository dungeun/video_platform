# 📹 VideoPick 플랫폼 PRD v2.0 (Ant Media 통합)

## 1. 제품 개요

### 1.1 프로젝트 정보
- **제품명**: VideoPick
- **버전**: 2.0 (Ant Media 통합)
- **목표**: YouTube형 동영상 플랫폼 + 라이브 스트리밍
- **대상**: 한국 시장 우선, 글로벌 확장 준비

### 1.2 핵심 가치 제안
- 🎬 **통합 플랫폼**: VOD + 라이브 스트리밍 일원화
- 💰 **수익화**: 다양한 수익 모델 (광고, 구독, 후원)
- 🚀 **저지연**: WebRTC 기반 0.5초 미만 지연
- 🌏 **확장성**: 클러스터 구조로 무제한 확장

## 2. 기술 스택 (업데이트)

### 2.1 핵심 인프라
```yaml
스트리밍:
  - Ant Media Server CE (라이브 + 녹화)
  - WebRTC/RTMP/HLS 멀티 프로토콜
  - 자동 트랜스코딩 & 녹화

스토리지:
  - Vultr Object Storage (S3 호환)
  - 자동 업로드 & 백업
  - CDN 통합

데이터베이스:
  - PostgreSQL (메인 DB)
  - MongoDB (Ant Media 메타데이터)
  - Redis (캐싱 & 실시간)

인증:
  - Appwrite (소셜 로그인, 실시간 채팅)
  - JWT 토큰 관리
```

### 2.2 서버 구성
```yaml
초기 (MVP):
  - 단일 Ant Media 서버 ($20/월)
  - Vultr Object Storage ($5/월)
  - 총 비용: $25/월

성장기:
  - Origin + 2 Edge 서버 ($116/월)
  - 확장된 스토리지 ($20/월)
  - 총 비용: $136/월

대규모:
  - 클러스터 구성 ($448/월)
  - CDN & 트래픽 ($700/월)
  - 총 비용: $1,148/월
```

## 3. 핵심 기능 (Ant Media 기반)

### 3.1 라이브 스트리밍
```yaml
스트리밍 기능:
  - OBS/웹캠 → RTMP 인제스트
  - WebRTC 초저지연 방송 (0.5초)
  - 자동 화질 조정 (ABR)
  - 동시 다중 플랫폼 송출

시청자 기능:
  - WebRTC/HLS 선택 시청
  - 실시간 채팅 (Appwrite)
  - Super Chat 후원
  - 클립 생성

관리 기능:
  - 웹 기반 관리 패널
  - 실시간 통계
  - 스트림 모니터링
  - API 제어
```

### 3.2 VOD (Video on Demand)
```yaml
업로드:
  - 대용량 파일 지원 (10GB)
  - 자동 인코딩 (다중 해상도)
  - 썸네일 자동 생성
  - YouTube 임포트

재생:
  - 적응형 스트리밍
  - 챕터 & 자막
  - 재생 속도 조절
  - 오프라인 다운로드

관리:
  - 자동 S3 업로드
  - 메타데이터 관리
  - 재생목록
  - 버전 관리
```

### 3.3 하이브리드 시스템
```yaml
라이브 → VOD 전환:
  - 자동 녹화 (MP4)
  - 즉시 재생 가능
  - 편집 도구 제공
  - 하이라이트 추출

YouTube 통합:
  - URL 임포트
  - 메타데이터 동기화
  - 자체 플레이어 재생
  - 독립적 통계
```

### 3.4 수익화 시스템
```yaml
크리에이터 수익:
  - 광고 수익 (70% 배분)
  - 채널 멤버십
  - Super Chat/Thanks
  - 유료 콘텐츠

플랫폼 수익:
  - 광고 수수료 (30%)
  - 프리미엄 구독
  - 기업 계정
  - API 사용료
```

## 4. 사용자 경험 (UX)

### 4.1 크리에이터 스튜디오
```yaml
대시보드:
  - 실시간 시청자 수
  - 수익 현황
  - 콘텐츠 성과
  - 구독자 분석

라이브 스튜디오:
  - 웹 기반 방송 도구
  - OBS 연동 가이드
  - 실시간 채팅 관리
  - 스트림 설정

콘텐츠 관리:
  - 업로드 큐
  - 일괄 편집
  - 예약 발행
  - A/B 테스트
```

### 4.2 시청자 경험
```yaml
홈 피드:
  - 개인화 추천
  - 트렌딩 콘텐츠
  - 구독 피드
  - 라이브 알림

플레이어:
  - 극장 모드
  - PIP (Picture in Picture)
  - 키보드 단축키
  - 제스처 컨트롤

상호작용:
  - 실시간 반응
  - 투표/설문
  - 클립 공유
  - 커뮤니티 탭
```

## 5. 데이터 모델 (업데이트)

### 5.1 스트리밍 관련
```prisma
model LiveStream {
  id            String   @id @default(cuid())
  channelId     String
  title         String
  description   String?
  streamKey     String   @unique
  rtmpUrl       String
  webrtcUrl     String
  hlsUrl        String
  status        String   // preparing, live, ended
  viewerCount   Int      @default(0)
  peakViewers   Int      @default(0)
  startedAt     DateTime?
  endedAt       DateTime?
  recordingUrl  String?  // 녹화 파일
  
  channel       Channel  @relation(fields: [channelId], references: [id])
  chats         LiveChat[]
  analytics     StreamAnalytics[]
}

model StreamAnalytics {
  id            String   @id
  streamId      String
  timestamp     DateTime
  viewers       Int
  bandwidth     BigInt
  quality       String
  region        String
  
  stream        LiveStream @relation(fields: [streamId], references: [id])
}
```

### 5.2 Ant Media 연동
```prisma
model AntMediaApp {
  id            String   @id
  appName       String   // LiveApp, WebRTCApp 등
  streamId      String
  rtmpUrl       String
  playUrl       String
  recordPath    String?
  createdAt     DateTime
  
  metadata      Json     // Ant Media 추가 정보
}
```

## 6. API 설계 (Ant Media 통합)

### 6.1 스트리밍 API
```typescript
// 스트림 생성
POST /api/streams/create
{
  title: string
  description?: string
  scheduled?: boolean
  scheduledTime?: Date
}

// 스트림 시작
POST /api/streams/:id/start
Response: {
  streamKey: string
  rtmpUrl: string
  webrtcUrl: string
}

// 스트림 상태
GET /api/streams/:id/status
Response: {
  status: 'preparing' | 'live' | 'ended'
  viewers: number
  duration: number
  health: object
}

// 녹화 관리
GET /api/streams/:id/recording
POST /api/streams/:id/convert-to-vod
```

### 6.2 Ant Media Proxy API
```typescript
// Ant Media 통계
GET /api/antmedia/stats
GET /api/antmedia/broadcasts/:streamId
POST /api/antmedia/broadcasts/create
DELETE /api/antmedia/broadcasts/:streamId

// WebRTC 연결
POST /api/antmedia/webrtc/publish
POST /api/antmedia/webrtc/play
```

## 7. 구현 로드맵 (수정)

### Phase 1: 인프라 구축 (2주)
- [x] Vultr 서버 프로비저닝
- [x] Ant Media Server 설치
- [ ] Appwrite 연동
- [ ] 기본 API 구현

### Phase 2: 라이브 스트리밍 (3주)
- [ ] 스트림 생성/관리 API
- [ ] OBS 연동 가이드
- [ ] WebRTC 플레이어
- [ ] 실시간 채팅

### Phase 3: VOD 시스템 (3주)
- [ ] 파일 업로드 시스템
- [ ] 자동 인코딩 파이프라인
- [ ] YouTube 임포트
- [ ] 플레이어 구현

### Phase 4: 수익화 (2주)
- [ ] 광고 시스템
- [ ] 결제 통합
- [ ] 정산 시스템
- [ ] 분석 대시보드

### Phase 5: 확장 기능 (4주)
- [ ] 클러스터링
- [ ] 글로벌 CDN
- [ ] 모바일 앱
- [ ] AI 기능

## 8. 성공 지표 (KPI)

### 8.1 기술 지표
- 스트림 지연시간: < 1초
- 시스템 가동률: > 99.9%
- 동시 스트림: > 1,000개
- 동시 시청자: > 100,000명

### 8.2 비즈니스 지표
- MAU: 100만 명 (1년)
- 일일 스트리밍 시간: 10만 시간
- 크리에이터 수: 10,000명
- 월 매출: $100,000

### 8.3 사용자 경험
- 평균 시청 시간: 30분
- 재방문율: 60%
- 앱 평점: 4.5/5
- NPS: 50+

## 9. 리스크 관리

### 9.1 기술적 리스크
```yaml
스케일링:
  리스크: 급격한 성장 시 서버 부족
  대응: 자동 스케일링, 클러스터 준비

안정성:
  리스크: 라이브 중 서비스 중단
  대응: 이중화, 자동 장애 복구

보안:
  리스크: 스트림 키 유출, DDoS
  대응: 토큰 인증, CloudFlare 보호
```

### 9.2 비즈니스 리스크
```yaml
경쟁:
  리스크: YouTube, Twitch 경쟁
  대응: 한국 특화 기능, 낮은 수수료

규제:
  리스크: 콘텐츠 규제, 저작권
  대응: 자동 모더레이션, DMCA 대응

수익성:
  리스크: 초기 적자 운영
  대응: 단계적 투자, 프리미엄 모델
```

## 10. 예산 계획

### 10.1 초기 투자 (3개월)
```yaml
개발:
  - 개발팀 (4명): $60,000
  - 디자인: $10,000
  - 테스트: $5,000

인프라:
  - 서버/스토리지: $300
  - 도구/서비스: $500
  - 도메인/SSL: $100

마케팅:
  - 크리에이터 유치: $10,000
  - 광고: $5,000

총계: $91,000
```

### 10.2 운영 비용 (월)
```yaml
초기 (0-6개월):
  - 인프라: $50
  - 인건비: $20,000
  - 마케팅: $5,000
  총: $25,050/월

성장기 (6-12개월):
  - 인프라: $300
  - 인건비: $40,000
  - 마케팅: $20,000
  총: $60,300/월
```

## 11. 출시 전략

### 11.1 베타 런칭 (1개월)
- 100명 크리에이터 초대
- 기능 피드백 수집
- 버그 수정
- 성능 최적화

### 11.2 소프트 런칭 (2개월)
- 1,000명 제한 오픈
- 초기 콘텐츠 확보
- 수익화 테스트
- 커뮤니티 구축

### 11.3 정식 런칭
- 전체 오픈
- 마케팅 캠페인
- 인플루언서 협업
- 미디어 홍보

## 12. 결론

Ant Media Server를 기반으로 한 VideoPick은 기술적으로 검증된 솔루션으로 빠르게 시장에 진입할 수 있습니다. 초기 투자를 최소화하면서도 확장 가능한 구조로 설계되어 있어, 성장에 따라 유연하게 대응할 수 있습니다.

**핵심 차별점**:
1. 초저지연 라이브 스트리밍 (0.5초)
2. 통합 플랫폼 (라이브 + VOD)
3. 합리적인 수수료 (30% vs 45%)
4. 한국 시장 최적화

**다음 단계**:
1. Ant Media 서버 구축
2. MVP 개발 (4주)
3. 베타 테스트 (2주)
4. 점진적 확장