# UI 섹션 관리 시스템 문서

## 개요
비디오 플랫폼의 메인 페이지 섹션을 동적으로 관리하는 시스템입니다. 관리자는 섹션의 순서 변경, 표시/숨김, 커스터마이징을 통해 메인 페이지 레이아웃을 실시간으로 조정할 수 있습니다.

## 시스템 구조

### 1. 데이터 저장 구조 (`ui-config.store.ts`)

#### 섹션 타입
- `hero` - 히어로 배너 슬라이드
- `category` - 카테고리 메뉴 그리드
- `quicklinks` - 바로가기 링크 (3단)
- `promo` - 프로모션 배너
- `ranking` - 실시간 랭킹
- `youtube` - YouTube 비디오 섹션
- `recommended` - 추천 비디오
- `custom` - 커스텀 섹션

#### 주요 인터페이스
```typescript
interface SectionOrder {
  id: string;
  type: string;
  order: number;
  visible: boolean;
}

interface YoutubeSection {
  visible: boolean;
  title: string;
  subtitle?: string;
  count: number;
  category: string;
  keywords?: string[];
  channelIds?: string[];
  viewAllLink?: string;
}
```

### 2. 관리자 페이지 구성

#### 섹션 관리 탭 (`/admin/ui-config`)
- **섹션 목록**: 모든 섹션 목록과 편집 링크 제공
- **섹션 순서 관리**: 드래그 앤 드롭으로 순서 변경, on/off 토글
- **개별 섹션 편집**: 각 섹션의 세부 설정 수정

#### 주요 기능
1. **실시간 순서 변경**: 드래그 앤 드롭으로 섹션 순서 조정
2. **표시/숨김 토글**: 눈 아이콘 클릭으로 섹션 활성화/비활성화
3. **자동 저장**: 변경사항 즉시 API 호출로 저장
4. **미리보기**: 홈페이지 구조 실시간 미리보기

### 3. 메인 페이지 렌더링 (`/app/page.tsx`)

#### 렌더링 프로세스
1. `useUIConfigStore`에서 설정 로드
2. `sectionOrder` 배열 기준으로 섹션 정렬
3. `visible: true`인 섹션만 필터링
4. 각 섹션 타입에 맞는 컴포넌트 렌더링

#### 섹션별 렌더링 조건
```typescript
// 섹션 순서와 가시성 확인
const visibleSections = allSections
  .filter(s => s.visible)
  .sort((a, b) => a.order - b.order)

// 각 섹션 타입별 렌더링
visibleSections.map((section) => {
  switch (section.type) {
    case 'youtube':
      const youtubeConfig = config.mainPage?.youtubeSection;
      if (!youtubeConfig || !youtubeConfig.visible) return null;
      // YouTube 섹션 렌더링
      break;
    // ... 다른 섹션들
  }
})
```

## 사용 방법

### 1. 섹션 순서 변경
1. 관리자 페이지 → UI 설정 → 섹션 순서 관리
2. 섹션을 드래그하여 원하는 위치로 이동
3. 자동으로 저장되며 메인 페이지에 즉시 반영

### 2. 섹션 표시/숨김
1. 섹션 순서 관리 페이지에서 눈 아이콘 클릭
2. 표시(초록색 눈) / 숨김(회색 눈) 상태 변경
3. 메인 페이지에서 즉시 적용

### 3. YouTube 섹션 설정
1. 섹션 관리 → YouTube 비디오 편집
2. 제목, 부제목, 표시 개수 설정
3. 카테고리 선택 (부동산, 재테크, 라이프스타일 등)
4. 검색 키워드 추가
5. 특정 채널 ID 지정 (선택사항)

### 4. 커스텀 섹션 추가
1. 섹션 관리 → 새 섹션 추가
2. 자동/수동 필터링 선택
3. 레이아웃 설정 (그리드/리스트/캐러셀)
4. 필터 조건 설정

## API 엔드포인트

### UI 설정 저장
```
POST /api/admin/ui-config
Body: { config: UIConfig }
```

### UI 설정 조회
```
GET /api/ui-config
Response: { config: UIConfig }
```

## 데이터 흐름

```
관리자 페이지 (SectionOrderTab)
    ↓ (순서/가시성 변경)
Zustand Store (updateSectionOrder)
    ↓ (상태 업데이트)
API 호출 (/api/admin/ui-config)
    ↓ (DB 저장)
PostgreSQL (UIConfig 테이블)
    ↓ (데이터 로드)
메인 페이지 (loadSettingsFromAPI)
    ↓ (렌더링)
사용자 화면
```

## 주요 컴포넌트

### SectionOrderTab (`/components/admin/ui-config/SectionOrderTab.tsx`)
- 섹션 순서 관리 메인 컴포넌트
- DnD Kit 라이브러리 사용
- 실시간 저장 및 미리보기 제공

### 개별 섹션 편집 페이지
- `/admin/ui-config/sections/hero` - 히어로 배너 편집
- `/admin/ui-config/sections/category` - 카테고리 메뉴 편집
- `/admin/ui-config/sections/youtube` - YouTube 섹션 편집
- `/admin/ui-config/sections/recommended` - 추천 비디오 편집

### useUIConfigStore (Zustand Store)
- 전역 UI 설정 상태 관리
- localStorage 영속성 지원
- API 연동 메서드 제공

## 트러블슈팅

### 섹션이 메인 페이지에 표시되지 않을 때
1. 섹션의 `visible` 상태 확인
2. `sectionOrder`에 해당 섹션이 포함되어 있는지 확인
3. 브라우저 캐시 및 localStorage 초기화
4. API 응답 확인 (Network 탭)

### 순서 변경이 적용되지 않을 때
1. API 호출 성공 여부 확인
2. `updateSectionOrder` 함수 호출 확인
3. DB의 UIConfig 테이블 데이터 확인

### 중복 섹션 문제
1. 섹션 순서 관리에서 "중복 섹션 정리" 버튼 클릭
2. localStorage 초기화: `localStorage.removeItem('ui-config-storage')`
3. 페이지 새로고침

## 개발 가이드

### 새로운 섹션 타입 추가하기
1. `ui-config.store.ts`에 인터페이스 정의
2. `SectionOrder` 타입에 새 타입 추가
3. `SectionOrderTab`의 `sectionInfo`에 섹션 정보 추가
4. 메인 페이지에 렌더링 케이스 추가
5. 개별 편집 페이지 생성

### 섹션 데이터 수정하기
```typescript
// Store 메서드 사용
const { updateMainPageYoutubeSection } = useUIConfigStore();

// 섹션 업데이트
updateMainPageYoutubeSection({
  visible: true,
  title: '새로운 제목',
  count: 6
});

// API 저장
await fetch('/api/admin/ui-config', {
  method: 'POST',
  body: JSON.stringify({ config: updatedConfig })
});
```

## 보안 고려사항
- 관리자 권한 체크 필수
- API 엔드포인트 인증 미들웨어 적용
- 입력 데이터 검증 및 sanitization
- XSS 방지를 위한 HTML 이스케이핑

## 성능 최적화
- 섹션별 lazy loading 구현
- 이미지 최적화 (next/image 사용)
- API 응답 캐싱
- 불필요한 리렌더링 방지 (React.memo)

## 향후 개선사항
- [ ] A/B 테스팅 지원
- [ ] 섹션별 애널리틱스
- [ ] 템플릿 저장/불러오기
- [ ] 버전 관리 및 롤백 기능
- [ ] 반응형 레이아웃 개별 설정