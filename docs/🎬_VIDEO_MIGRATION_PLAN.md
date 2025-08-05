# 🎬 LinkPick → VideoPick 실전 전환 계획

> 기존 코드 최대 활용, 최소 수정으로 4주 내 출시

## 🎯 핵심 전략

### 목표
- **기존 코드 80% 재사용**
- **관리자 페이지 100% 유지**
- **4주 내 MVP 출시**
- **점진적 기능 추가**

### 원칙
1. **작동하는 것은 건드리지 않는다**
2. **네이밍보다 기능 우선**
3. **호환성 레이어로 점진적 전환**
4. **새 기능은 별도 모듈로**

## 📅 주차별 실행 계획

### 🚀 1주차: 기반 전환 (Backend)

#### Day 1-2: 데이터 모델 확장
```prisma
// schema.prisma - 기존 모델 확장만!
model Campaign {
  // 기존 필드 모두 유지
  id String @id
  title String
  description String
  
  // 비디오 필드 추가만
  videoUrl String? // nullable로 추가
  duration Int? 
  viewCount Int @default(0)
  streamKey String?
  isLive Boolean @default(false)
  
  // 기존 관계 유지
  business Business @relation(...)
  applications CampaignApplication[]
}

// 새 모델은 별도 추가
model VideoAnalytics {
  id String @id
  campaignId String // Campaign 참조
  watchTime Int
  // ...
}
```

#### Day 3-4: API 라우트 확장
```typescript
// 기존 API 확장 (수정 최소화)
// api/campaigns/route.ts
export async function GET(request) {
  const campaigns = await getCampaigns()
  
  // 비디오 플랫폼용 필터 추가
  if (request.nextUrl.searchParams.get('type') === 'video') {
    return campaigns.filter(c => c.videoUrl)
  }
  
  return campaigns // 기존 로직 유지
}

// 새 API는 별도 파일로
// api/videos/route.ts
export { GET } from '../campaigns/route' // 재사용!
```

#### Day 5: 스트리밍 서비스 추가
```typescript
// lib/streaming/antmedia.ts - 새 모듈
export class StreamingService {
  // 기존 시스템과 독립적으로 구현
}

// 기존 서비스에 주입
// services/campaign.service.ts
export class CampaignService {
  constructor(
    private streaming?: StreamingService // 선택적 주입
  ) {}
  
  async create(data) {
    const campaign = await this.oldCreate(data)
    
    // 비디오인 경우만 스트리밍 설정
    if (data.type === 'VIDEO' && this.streaming) {
      await this.streaming.createStream(campaign.id)
    }
    
    return campaign
  }
}
```

### 🎨 2주차: UI 전환 (Frontend)

#### Day 1-2: 홈페이지 변환
```tsx
// app/page.tsx - 최소 수정
export default function Home() {
  // 기존 캠페인 데이터를 비디오로 표시만
  const campaigns = await getCampaigns({ type: 'video' })
  
  return (
    <div>
      {/* 기존 HeroSection 텍스트만 변경 */}
      <HeroSection 
        title="당신의 동영상을 공유하세요" // 텍스트만
        subtitle="크리에이터와 시청자를 연결합니다"
      />
      
      {/* 기존 CampaignGrid 재사용 */}
      <CampaignGrid 
        campaigns={campaigns}
        cardType="video" // 프롭 추가로 스타일 변경
      />
    </div>
  )
}
```

#### Day 3-4: 상세 페이지 확장
```tsx
// app/campaigns/[id]/page.tsx - 기존 파일 확장
export default function CampaignDetail({ params }) {
  const campaign = await getCampaign(params.id)
  
  return (
    <div>
      {/* 비디오인 경우 플레이어 추가 */}
      {campaign.videoUrl && (
        <VideoPlayer src={campaign.videoUrl} />
      )}
      
      {/* 기존 상세 정보 유지 */}
      <CampaignInfo campaign={campaign} />
      
      {/* 기존 신청 시스템 → 댓글로 표시만 변경 */}
      <div className="comments-section">
        <h3>댓글</h3> {/* "신청자" → "댓글" */}
        <ApplicationList applications={campaign.applications} />
      </div>
    </div>
  )
}
```

#### Day 5: 비디오 플레이어 통합
```tsx
// components/VideoPlayer.tsx - 새 컴포넌트
export function VideoPlayer({ src, isLive, streamKey }) {
  if (isLive && streamKey) {
    return <AntMediaPlayer streamKey={streamKey} />
  }
  
  return (
    <video controls className="w-full">
      <source src={src} />
    </video>
  )
}
```

### 💼 3주차: 크리에이터 도구

#### Day 1-2: 업로드 수정
```tsx
// app/business/campaigns/new/page.tsx - 기존 수정
export default function CreateCampaign() {
  return (
    <form>
      {/* 기존 필드 유지 */}
      <Input name="title" />
      <Textarea name="description" />
      
      {/* 타입 선택 추가 */}
      <RadioGroup name="type">
        <Radio value="CAMPAIGN">일반 캠페인</Radio>
        <Radio value="VIDEO">동영상</Radio>
        <Radio value="LIVE">라이브</Radio>
      </RadioGroup>
      
      {/* 조건부 필드 */}
      {type === 'VIDEO' && (
        <FileUpload name="video" accept="video/*" />
      )}
      
      {type === 'LIVE' && (
        <LiveSettings />
      )}
    </form>
  )
}
```

#### Day 3-4: 대시보드 확장
```tsx
// app/business/dashboard/page.tsx
export default function Dashboard() {
  return (
    <div>
      {/* 기존 통계 유지 */}
      <CampaignStats />
      
      {/* 비디오 통계 추가 */}
      <VideoStats />
      
      {/* 라이브 컨트롤 추가 */}
      <LiveStreamControl />
    </div>
  )
}
```

#### Day 5: 스튜디오 라우트 추가
```typescript
// 라우트 별칭으로 처리
// middleware.ts
export function middleware(request) {
  // /studio/* → /business/* 리다이렉트
  if (request.nextUrl.pathname.startsWith('/studio')) {
    const url = request.nextUrl.clone()
    url.pathname = url.pathname.replace('/studio', '/business')
    return NextResponse.rewrite(url)
  }
}
```

### 🔧 4주차: 통합 및 최적화

#### Day 1-2: 실시간 기능
```typescript
// 기존 시스템과 별도로 구현
// lib/realtime/chat.ts
export class ChatService {
  constructor(private appwrite: Appwrite) {}
  
  // 기존 Application 모델을 채팅으로 활용
  async sendMessage(campaignId: string, message: string) {
    return this.appwrite.database.createDocument(
      'applications', // 기존 컬렉션 재사용
      {
        campaignId,
        content: message,
        type: 'CHAT', // 타입으로 구분
      }
    )
  }
}
```

#### Day 3-4: 검색/추천 최적화
```typescript
// 기존 검색 확장
// api/search/route.ts
export async function GET(request) {
  const query = request.nextUrl.searchParams.get('q')
  const type = request.nextUrl.searchParams.get('type')
  
  // 기존 검색 로직 활용
  let results = await searchCampaigns(query)
  
  // 비디오 필터링
  if (type === 'video') {
    results = results.filter(r => r.videoUrl)
  }
  
  return results
}
```

#### Day 5: 배포 준비
```bash
# 환경 변수만 추가
ANT_MEDIA_URL=...
VULTR_STORAGE=...

# 기존 배포 프로세스 그대로 사용
npm run build
npm run start
```

## 🔄 데이터 마이그레이션 전략

### 1. 무중단 마이그레이션
```sql
-- 1단계: 필드 추가 (영향 없음)
ALTER TABLE campaigns 
ADD COLUMN video_url TEXT,
ADD COLUMN duration INTEGER,
ADD COLUMN view_count INTEGER DEFAULT 0;

-- 2단계: 뷰 생성 (호환성)
CREATE VIEW videos AS 
SELECT * FROM campaigns 
WHERE video_url IS NOT NULL;

-- 3단계: 점진적 데이터 이동
UPDATE campaigns 
SET type = 'VIDEO' 
WHERE video_url IS NOT NULL;
```

### 2. API 호환성 유지
```typescript
// 이중 라우팅
app.get('/api/campaigns/:id', handler)
app.get('/api/videos/:id', handler) // 같은 핸들러

// 응답 변환
function transformResponse(campaign) {
  if (isVideoRequest()) {
    return {
      ...campaign,
      channel: campaign.business, // 네이밍 매핑
      comments: campaign.applications,
    }
  }
  return campaign // 기존 응답
}
```

## 📊 리스크 관리

### 최소 리스크 접근
1. **기존 기능 보장**: 모든 기존 기능 유지
2. **점진적 전환**: 새 기능만 새 URL로
3. **롤백 가능**: 언제든 이전 버전으로
4. **A/B 테스트**: 일부 사용자만 새 UI

### 핵심 체크포인트
- [ ] Week 1: API 응답 시간 변화 없음
- [ ] Week 2: 기존 사용자 영향 없음
- [ ] Week 3: 관리자 기능 100% 작동
- [ ] Week 4: 성능 저하 없음

## 🎯 성공 지표

### 기술 지표
- 코드 재사용률: 80% 이상
- 신규 버그: 10개 미만
- 성능 저하: 5% 미만
- 다운타임: 0분

### 비즈니스 지표
- 기존 사용자 이탈: 5% 미만
- 신규 가입: 주 100명 이상
- 비디오 업로드: 일 50개 이상
- 시청 시간: 일 1000시간 이상

## 💡 핵심 팁

### DO ✅
- 기존 코드 최대한 재사용
- 새 기능은 별도 모듈로
- 점진적 UI 변경
- 호환성 레이어 활용
- 텍스트/라벨만 변경

### DON'T ❌
- 대규모 리팩토링
- 기존 API 변경
- 데이터 구조 파괴
- 전체 재작성
- 성급한 최적화

---

**결론**: 4주 안에 안정적인 비디오 플랫폼 MVP를 출시할 수 있습니다. 기존 시스템의 안정성을 유지하면서 새로운 기능을 점진적으로 추가하는 것이 핵심입니다.