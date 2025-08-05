# 📦 보관 문서 (Archived Documents)

이 폴더는 VideoPick 프로젝트 초기 검토 과정에서 생성된 문서들을 보관합니다.

## 보관 이유

PRD_VIDEO_PLATFORM_V2.md를 최종 기준 문서로 채택하면서, 다음 결정사항에 따라 이전 문서들을 보관합니다:

### 기술 스택 결정
- **캐시**: Redis 선택 (Dragonfly 대신)
- **인증**: Appwrite 선택 (Supabase, Keycloak 대신)
- **스트리밍**: Ant Media Server 선택 (nginx-rtmp, SRS 대신)
- **스토리지**: Vultr Object Storage 선택 (AWS S3, Naver Cloud 대신)

### 보관 문서 목록

1. **PRD_VIDEO_PLATFORM.md**
   - 초기 PRD 버전
   - PRD_VIDEO_PLATFORM_V2.md로 대체

2. **VIDEO_PLATFORM_MASTER_PLAN.md**
   - 초기 전체 계획
   - 현재는 개별 문서로 분리됨

3. **DRAGONFLY_VS_REDIS.md**
   - Redis vs Dragonfly 비교
   - Redis 선택으로 결정

4. **REDIS_USAGE_GUIDE.md**
   - 기본 Redis 사용 가이드
   - 프로젝트별 설정으로 대체

5. **AUTH_SOLUTIONS_COMPARISON.md**
   - 인증 솔루션 비교
   - Appwrite 선택으로 결정

6. **COOLIFY_AUTH_SERVICES.md**
   - Coolify 호환 인증 서비스
   - Appwrite 선택으로 결정

7. **SUPABASE_REALTIME_CHAT.md**
   - Supabase 실시간 채팅
   - Appwrite Realtime으로 대체

8. **LIVE_STREAMING_SOLUTIONS.md**
   - 라이브 스트리밍 솔루션 비교
   - Ant Media Server 선택으로 결정

9. **DEPLOYMENT_OPTIONS.md**
   - 배포 옵션 검토
   - ANT_MEDIA_INFRASTRUCTURE_PLAN.md에 통합

## 참조 용도

이 문서들은 다음 경우에 참조할 수 있습니다:
- 의사결정 과정 확인
- 대안 기술 재검토
- 프로젝트 히스토리 추적

---

보관일: 2025-08-01