# MCP (Model Context Protocol) 설치 및 설정 가이드

## 개요

MCP(Model Context Protocol)는 Claude Code와 외부 서비스 간의 통신을 위한 프로토콜입니다. 이 가이드는 MCP 서버 설치, 설정, 그리고 활용 방법을 한국어로 설명합니다.

## 주요 MCP 서버

### 1. Context7 - 라이브러리 문서화 서버
- **목적**: 최신 라이브러리 문서 및 코드 예제 제공
- **활용**: 프레임워크 패턴, API 참조, 베스트 프랙티스

### 2. Sequential Thinking - 복잡한 분석 서버
- **목적**: 다단계 문제 해결 및 체계적 분석
- **활용**: 아키텍처 분석, 디버깅, 시스템 설계

### 3. Firecrawl - 웹 스크래핑 서버
- **목적**: 웹 콘텐츠 수집 및 분석
- **활용**: 웹 데이터 추출, 연구, 문서 수집

### 4. GitHub - Git 통합 서버
- **목적**: GitHub API 연동
- **활용**: 리포지토리 관리, 이슈 추적, PR 생성

### 5. Supabase - 백엔드 서비스 서버
- **목적**: Supabase 프로젝트 관리
- **활용**: 데이터베이스 관리, 인증, 실시간 기능

### 6. Filesystem - 파일 시스템 서버
- **목적**: 고급 파일 작업
- **활용**: 파일 검색, 일괄 처리, 메타데이터 관리

### 7. Playwright - 브라우저 자동화 서버
- **목적**: 웹 브라우저 자동화 및 테스팅
- **활용**: E2E 테스트, 성능 모니터링, 시각적 테스트

### 8. Memory - 지식 그래프 서버
- **목적**: 프로젝트 정보 저장 및 관리
- **활용**: 컨텍스트 유지, 정보 추적, 관계 매핑

### 9. IDE Integration - IDE 통합 서버
- **목적**: VS Code와의 고급 통합
- **활용**: 진단 정보, 코드 실행, 디버깅

### 10. Coolify - 배포 관리 서버
- **목적**: 애플리케이션 배포 및 관리
- **활용**: 컨테이너 배포, 서비스 관리, 모니터링

## 설치 방법

### 1. Claude Code 설치
```bash
# Claude Code CLI 설치
npm install -g @anthropic/claude-code

# 또는 Homebrew 사용 (macOS)
brew install claude-code
```

### 2. MCP 서버 설정

Claude Code는 설정 파일을 통해 MCP 서버를 관리합니다:

```json
// ~/.claude/config.json 예시
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["@context7/mcp-server"],
      "env": {
        "CONTEXT7_API_KEY": "your-api-key"
      }
    },
    "sequential": {
      "command": "npx", 
      "args": ["@sequential/mcp-server"]
    },
    "firecrawl": {
      "command": "npx",
      "args": ["@firecrawl/mcp-server"],
      "env": {
        "FIRECRAWL_API_KEY": "your-firecrawl-key"
      }
    }
  }
}
```

### 3. 환경 변수 설정

필요한 API 키들을 환경 변수로 설정:

```bash
# .env 파일 또는 shell 프로필에 추가
export CONTEXT7_API_KEY="your-context7-key"
export FIRECRAWL_API_KEY="your-firecrawl-key"
export GITHUB_TOKEN="your-github-token"
export SUPABASE_ACCESS_TOKEN="your-supabase-token"
```

## 주요 기능 및 사용법

### Context7 사용법

라이브러리 문서 검색:
```bash
claude code --c7 "React hooks 사용법"
claude code --context7 "Next.js 라우팅"
```

### Sequential Thinking 사용법

복잡한 분석:
```bash
claude code --seq "시스템 아키텍처 분석"
claude code --think "성능 병목 지점 찾기"
```

### 웹 스크래핑 (Firecrawl)

웹 데이터 수집:
```bash
claude code "https://example.com에서 제품 정보 추출"
```

### GitHub 통합

리포지토리 작업:
```bash
claude code --git "이슈 생성 및 PR 관리"
```

## 고급 활용법

### 자동 활성화

MCP 서버들은 컨텍스트에 따라 자동으로 활성화됩니다:

- **라이브러리 사용 시** → Context7 자동 활성화
- **복잡한 분석 시** → Sequential 자동 활성화  
- **UI 컴포넌트 작업 시** → Magic 자동 활성화
- **테스트 작업 시** → Playwright 자동 활성화

### 플래그 조합

효율적인 작업을 위한 플래그 조합:

```bash
# 성능 최적화 작업
claude code --persona-performance --think --seq

# UI 컴포넌트 개발
claude code --persona-frontend --magic --c7

# 보안 분석
claude code --persona-security --validate --seq

# 문서 작성
claude code --persona-scribe=ko --c7
```

## 문제 해결

### 일반적인 문제들

**1. MCP 서버 연결 실패**
- API 키 확인
- 네트워크 연결 상태 확인
- 서버 상태 확인

**2. 성능 저하**
- `--uc` 플래그로 토큰 압축 활성화
- 불필요한 MCP 서버 비활성화 (`--no-mcp`)

**3. 설정 오류**
- 설정 파일 경로 확인: `~/.claude/config.json`
- 환경 변수 설정 확인

### 디버깅 명령어

```bash
# MCP 서버 상태 확인
claude code --debug --mcp-status

# 설정 검증
claude code --validate-config

# 연결 테스트
claude code --test-mcp-connections
```

## 보안 고려사항

1. **API 키 보안**
   - 환경 변수 사용
   - .env 파일을 .gitignore에 추가
   - 정기적인 키 순환

2. **네트워크 보안**
   - HTTPS 통신 확인
   - 방화벽 설정 검토

3. **데이터 보안**
   - 민감한 데이터 로깅 금지
   - 암호화된 저장소 사용

## 모범 사례

### 1. 효율적인 MCP 사용

- 적절한 서버 선택
- 플래그 조합 최적화
- 캐싱 활용

### 2. 성능 최적화

- 토큰 사용량 모니터링
- 배치 작업 활용
- 불필요한 서버 비활성화

### 3. 보안 강화

- API 키 정기 순환
- 액세스 권한 최소화
- 로그 모니터링

## 참고 자료

- Claude Code 공식 문서: https://docs.anthropic.com/claude-code
- MCP 프로토콜 사양: https://modelcontextprotocol.io
- GitHub 리포지토리: https://github.com/anthropics/claude-code

---

**작성일**: 2025년 8월 9일  
**버전**: 1.0  
**업데이트**: 주기적으로 최신 정보 반영