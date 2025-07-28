# 캐시 무효화 가이드

## 개요
이 가이드는 revu-platform의 캐싱 시스템에서 데이터 변경 시 캐시를 무효화하는 방법을 설명합니다.

## 기본 사용법

```typescript
import { invalidateCache } from '@/hooks/useCachedData'

// 특정 캐시 키 무효화
invalidateCache('campaign_123')

// 여러 캐시 키 무효화 (정규식 지원)
invalidateCache(/^campaign_/) // 모든 캠페인 캐시 무효화
```

## 주요 캐시 무효화 패턴

### 1. 프로필 업데이트 후
```typescript
// 프로필 정보 수정 후
if (response.ok) {
  // UserDataContext가 자동으로 캐시 갱신
  refreshProfile() // 또는 직접 invalidateCache 호출
}
```

### 2. 캠페인 생성/수정/삭제 후
```typescript
// 캠페인 생성 후
if (response.ok) {
  invalidateCache(`business_campaigns_${user?.id}`)
  refetchCampaigns()
}

// 특정 캠페인 수정 후
if (response.ok) {
  invalidateCache(`campaign_${campaignId}`)
  invalidateCache(`business_campaigns_${user?.id}`)
}
```

### 3. 지원서 상태 변경 후
```typescript
// 지원서 승인/거절 후
if (response.ok) {
  invalidateCache(`business_applications_${user?.id}`)
  invalidateCache(`influencer_applications_${applicantId}`)
  refetchApplications()
}
```

### 4. 출금 신청 후
```typescript
// 출금 신청 완료 후
if (response.ok) {
  invalidateCache(`influencer_withdrawals_${user?.id}`)
  invalidateCache(`influencer_stats_${user?.id}`)
}
```

### 5. 좋아요/관심 목록 변경 후
```typescript
// 캠페인 좋아요 토글 후
if (response.ok) {
  invalidateCache(`liked_campaigns_${user?.id}`)
  refetchLikedCampaigns()
}
```

### 6. 템플릿 변경 후
```typescript
// 템플릿 저장/삭제 후
if (response.ok) {
  invalidateCache(`campaign_templates_${user?.id}`)
  invalidateCache(`application_templates_${user?.id}`)
  refetchTemplates()
}
```

## 전역 캐시 무효화 패턴

### 사용자 타입별 전체 캐시 무효화
```typescript
// 인플루언서 관련 모든 캐시 무효화
invalidateCache(/^influencer_/)

// 비즈니스 관련 모든 캐시 무효화
invalidateCache(/^business_/)

// 특정 사용자의 모든 캐시 무효화
invalidateCache(new RegExp(`_${user?.id}$`))
```

### 도메인별 캐시 무효화
```typescript
// 모든 캠페인 관련 캐시 무효화
invalidateCache(/campaign/)

// 모든 프로필 관련 캐시 무효화
invalidateCache(/profile/)
```

## 자동 캐시 무효화 시나리오

### 1. 로그아웃 시
```typescript
// 로그아웃 시 모든 사용자 관련 캐시 클리어
const handleLogout = () => {
  // localStorage 클리어 (캐시 포함)
  localStorage.clear()
  // 또는 특정 사용자 캐시만 클리어
  invalidateCache(new RegExp(`_${user?.id}`))
}
```

### 2. 실시간 업데이트 수신 시
```typescript
// WebSocket이나 SSE로 업데이트 수신 시
socket.on('campaign_updated', (campaignId) => {
  invalidateCache(`campaign_${campaignId}`)
})
```

### 3. 에러 발생 시
```typescript
// API 에러 발생 시 관련 캐시 무효화
catch (error) {
  if (error.status === 404) {
    // 리소스가 없으면 캐시 제거
    invalidateCache(`campaign_${campaignId}`)
  }
}
```

## 성능 최적화 팁

### 1. 선택적 무효화
필요한 캐시만 무효화하여 성능 최적화:
```typescript
// ❌ 비효율적: 모든 캐시 무효화
localStorage.clear()

// ✅ 효율적: 필요한 캐시만 무효화
invalidateCache(`campaign_${campaignId}`)
invalidateCache(`business_campaigns_${user?.id}`)
```

### 2. 배치 무효화
여러 작업 후 한 번에 무효화:
```typescript
const updateMultipleCampaigns = async (campaigns) => {
  const results = await Promise.all(
    campaigns.map(c => updateCampaign(c))
  )
  
  // 성공한 캠페인의 캐시만 무효화
  results.forEach((result, index) => {
    if (result.ok) {
      invalidateCache(`campaign_${campaigns[index].id}`)
    }
  })
  
  // 목록 캐시는 한 번만 무효화
  invalidateCache(`business_campaigns_${user?.id}`)
}
```

### 3. 조건부 무효화
데이터가 실제로 변경된 경우에만 무효화:
```typescript
const updateProfile = async (newData) => {
  const response = await apiPut('/api/profile', newData)
  
  if (response.ok) {
    const result = await response.json()
    // 실제로 변경된 경우에만 캐시 무효화
    if (result.updated) {
      refreshProfile()
    }
  }
}
```

## 디버깅

### 캐시 상태 확인
```typescript
// 개발자 콘솔에서 캐시 확인
console.log(Object.keys(localStorage).filter(key => key.startsWith('cache_')))

// 특정 캐시 데이터 확인
const cacheKey = 'cache_campaign_123'
const cached = localStorage.getItem(cacheKey)
if (cached) {
  const { data, timestamp, version } = JSON.parse(cached)
  console.log('Cached at:', new Date(timestamp))
  console.log('Data:', data)
}
```

### 캐시 무효화 로깅
```typescript
// 개발 환경에서 캐시 무효화 로깅
if (process.env.NODE_ENV === 'development') {
  const originalInvalidate = invalidateCache
  window.invalidateCache = (pattern) => {
    console.log('Invalidating cache:', pattern)
    originalInvalidate(pattern)
  }
}
```

## 주의사항

1. **과도한 무효화 피하기**: 너무 자주 캐시를 무효화하면 캐싱의 이점이 사라집니다.
2. **의존성 고려**: 한 데이터가 변경되면 관련된 모든 캐시를 무효화해야 합니다.
3. **사용자 격리**: 다른 사용자의 캐시를 실수로 무효화하지 않도록 주의합니다.
4. **에러 처리**: 캐시 무효화 실패 시에도 앱이 정상 작동하도록 합니다.