# 리뷰 플랫폼 최적화 가이드

## 문제점
- 각 페이지마다 유저 프로필 정보를 개별적으로 fetch
- 캠페인, 비즈니스 정보 등이 중복으로 요청됨
- 페이지 이동 시 같은 데이터를 반복적으로 불러옴

## 해결 방안 (기존 코드 최소 수정)

### 1. Context와 캐싱 시스템 도입

#### UserDataContext 사용법

**기존 코드 (campaigns/[id]/page.tsx):**
```typescript
// 각 페이지마다 반복되는 코드
const [profileData, setProfileData] = useState<any>(null)

const fetchProfile = async () => {
  try {
    const response = await fetch('/api/influencer/profile', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`
      }
    })
    
    if (response.ok) {
      const data = await response.json()
      setProfileData(data)
    }
  } catch (error) {
    console.error('Error fetching profile:', error)
  }
}

useEffect(() => {
  if (user && user.type === 'INFLUENCER') {
    fetchProfile()
  }
}, [user])
```

**개선된 코드:**
```typescript
import { useUserData } from '@/contexts/UserDataContext'

// 한 줄로 해결
const { profileData, isLoading } = useUserData()

// 프로필 데이터는 자동으로 캐싱되고 모든 페이지에서 공유됨
```

### 2. 공통 데이터 캐싱 Hook 사용

#### 캠페인 데이터 캐싱

**기존 코드:**
```typescript
const fetchCampaign = async () => {
  try {
    const response = await fetch(`/api/campaigns/${params.id}`)
    const data = await response.json()
    setCampaign(data.campaign)
  } catch (error) {
    console.error('Error:', error)
  }
}

useEffect(() => {
  fetchCampaign()
}, [params.id])
```

**개선된 코드:**
```typescript
import { useCampaignData } from '@/hooks/useSharedData'

const { data: campaign, isLoading, error } = useCampaignData(params.id)
// 자동으로 캐싱되고, 다른 페이지에서도 같은 캠페인 접근 시 재사용
```

### 3. 실제 적용 예시

#### campaigns/[id]/page.tsx 수정 방법:

```typescript
// 상단에 import 추가
import { useUserData } from '@/contexts/UserDataContext'
import { useCampaignData } from '@/hooks/useSharedData'

export default function CampaignDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  
  // 기존의 fetchProfile, profileData state 제거하고 이렇게 변경
  const { profileData } = useUserData()
  
  // 기존의 fetchCampaign, campaign state 제거하고 이렇게 변경
  const { data: campaign, isLoading } = useCampaignData(params.id as string)
  
  // 나머지 코드는 그대로 유지
  // ...
  
  // useEffect에서 fetchProfile() 호출 제거
  useEffect(() => {
    if (user && user.type === 'INFLUENCER') {
      fetchTemplates() // 이것만 남김
      // fetchProfile() 제거
    }
  }, [user])
  
  // fetchProfile 함수 전체 제거
  // fetchCampaign 함수 전체 제거
}
```

#### 비즈니스 페이지에서 사용:

```typescript
import { useBusinessProfile } from '@/contexts/UserDataContext'

export default function BusinessDashboard() {
  const businessProfile = useBusinessProfile()
  
  // businessProfile이 자동으로 캐싱되어 있음
  if (!businessProfile) {
    return <div>Loading...</div>
  }
  
  return (
    <div>
      <h1>{businessProfile.businessProfile?.companyName}</h1>
      {/* ... */}
    </div>
  )
}
```

### 4. 데이터 업데이트 시 캐시 갱신

프로필이나 캠페인 정보를 수정한 후:

```typescript
import { useUserData } from '@/contexts/UserDataContext'
import { invalidateCache } from '@/hooks/useCachedData'

// 프로필 업데이트 후
const { refreshProfile } = useUserData()
await refreshProfile() // 프로필 캐시 갱신

// 캠페인 정보 업데이트 후
invalidateCache(`campaign_${campaignId}`) // 특정 캠페인 캐시 무효화

// 여러 캐시 동시 무효화
invalidateCache(['campaigns_{}', 'liked_campaigns_user123_1_20'])
```

### 5. 템플릿 데이터 공유

**기존 코드:**
```typescript
// 각 페이지마다 템플릿 fetch
const fetchTemplates = async () => {
  const response = await fetch('/api/application-templates')
  // ...
}
```

**개선된 코드:**
```typescript
import { useTemplates } from '@/hooks/useSharedData'

const { data: templates, isLoading } = useTemplates('application')
// 자동 캐싱, 15분간 유지
```

### 6. 통계 데이터 공유 (인플루언서 마이페이지)

```typescript
import { useInfluencerStats } from '@/hooks/useSharedData'

// InfluencerMyPage.tsx에서
const { data: stats, isLoading } = useInfluencerStats()

// 통계가 필요한 다른 컴포넌트에서도 동일하게 사용
// 5분간 캐싱되어 재사용
```

## 장점

1. **성능 향상**: 
   - 동일 데이터 중복 요청 제거
   - 페이지 이동 시 즉시 데이터 표시 (캐시 활용)
   - 네트워크 요청 최소화

2. **코드 간소화**:
   - 각 페이지의 fetch 로직 제거
   - 에러 처리 중앙화
   - 로딩 상태 관리 자동화

3. **사용자 경험 개선**:
   - 빠른 페이지 로딩
   - 일관된 데이터 표시
   - Stale-while-revalidate로 항상 최신 데이터 유지

4. **유지보수 용이**:
   - 데이터 fetching 로직 중앙 관리
   - 캐시 정책 일괄 변경 가능
   - 디버깅 편의성

## 적용 우선순위

1. **UserDataContext** 먼저 적용 (모든 페이지에서 사용)
2. 자주 접근하는 페이지부터 순차 적용:
   - campaigns/[id]/page.tsx
   - mypage 관련 페이지들
   - business 대시보드
3. 템플릿, 통계 등 부가 데이터는 필요에 따라 적용

## 주의사항

1. 캐시 TTL(Time To Live) 설정:
   - 자주 변경되는 데이터: 3-5분
   - 안정적인 데이터: 15-30분
   - 프로필 데이터: 5분 (기본값)

2. 데이터 수정 시 캐시 무효화 필수

3. 로컬 스토리지 용량 관리 (5MB 제한)

4. 민감한 데이터는 캐싱하지 않음