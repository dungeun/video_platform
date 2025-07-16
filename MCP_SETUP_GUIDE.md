# MCP (Model Control Protocol) 설치 가이드

## 개요
이 문서는 레뷰 플랫폼 개발을 위한 MCP 툴 설치 및 설정 가이드입니다.

## 필요한 MCP 툴들

### 1. TaskMaster-AI
AI 기반 작업 관리 시스템으로 PRD 파싱, 작업 CRUD, 의존성 관리, 복잡도 분석 등을 제공합니다.

### 2. Context7
실시간으로 최신 라이브러리 문서와 코드 예제를 제공하는 MCP 서버입니다.

### 3. MemoryBank
프로젝트 컨텍스트를 저장하고 관리하는 도구입니다.

### 4. Coolify
셀프 호스팅 플랫폼으로 배포 자동화를 지원합니다.

## 설치 방법

### 1단계: 사전 요구사항
- Node.js >= v18.0.0
- npm 또는 pnpm
- Claude Code 또는 지원되는 에디터 (Cursor, Windsurf 등)

### 2단계: TaskMaster-AI 설치

#### 글로벌 설치
```bash
npm install -g task-master-ai
```

#### 프로젝트 로컬 설치
```bash
cd /Users/admin/new_project/revu-platform
npm install task-master-ai --save-dev
```

### 3단계: Claude Code 환경 설정

#### 디렉토리 생성
```bash
mkdir -p ~/.claude
mkdir -p ~/.claude/.taskmaster-global
```

#### 환경 변수 설정 (~/.zshrc 또는 ~/.bashrc에 추가)
```bash
export CLAUDECODE=1
export CLAUDE_CODE_ENTRYPOINT=cli
export TASKMASTER_DEFAULT_PROVIDER=claude-code
export TASKMASTER_GLOBAL_CONFIG=~/.claude/.taskmaster-global/config.json
```

### 4단계: MCP 서버 설정

#### Claude Code 설정 파일 생성
`~/.claude/claude_desktop_config.json` 파일 생성:

```json
{
  "mcpServers": {
    "taskmaster-ai": {
      "command": "npx",
      "args": ["-y", "task-master-ai"],
      "env": {
        "ANTHROPIC_API_KEY": "your-api-key-here"
      }
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "@context7/mcp-server"],
      "env": {}
    }
  }
}
```

#### 프로젝트별 설정 (선택사항)
`.cursor/mcp.json` 파일 생성:

```json
{
  "mcpServers": {
    "taskmaster-ai": {
      "command": "npx",
      "args": ["task-master-ai"],
      "env": {
        "ANTHROPIC_API_KEY": "your-api-key-here",
        "PERPLEXITY_API_KEY": "your-perplexity-key-here"
      }
    }
  }
}
```

### 5단계: API 키 설정

필요한 API 키들:
- ANTHROPIC_API_KEY (필수)
- PERPLEXITY_API_KEY (선택)
- OPENAI_API_KEY (선택)
- GOOGLE_API_KEY (선택)

환경 변수로 설정하거나 설정 파일에 직접 입력합니다.

### 6단계: Context7 사용법

쿼리에 "use context7"을 추가하여 최신 문서를 가져올 수 있습니다:
```
"Next.js 15에서 인증 구현하는 방법 use context7"
"React Hooks 예제 보여줘 use context7"
```

## 문제 해결

### MCP 툴이 0개로 표시될 때
1. 설정에서 MCP 새로고침 버튼 클릭
2. `--package=task-master-ai` 플래그 제거 시도
3. Claude Code 재시작

### 권한 오류
```bash
chmod +x ~/.claude/.taskmaster-global/config.json
```

## 프로젝트 특화 설정

### TaskMaster 작업 템플릿
`.taskmaster/templates/` 디렉토리에 프로젝트별 템플릿 저장:

```json
{
  "revu-platform": {
    "phases": ["planning", "development", "testing", "deployment"],
    "defaultComplexity": "medium",
    "tags": ["backend", "api", "database"]
  }
}
```

## 검증

설치가 완료되면 다음 명령으로 확인:
```bash
# TaskMaster 버전 확인
npx task-master-ai --version

# MCP 서버 상태 확인
echo $TASKMASTER_DEFAULT_PROVIDER
```

## 다음 단계
1. 모듈러 아키텍처를 단순한 레이어드 아키텍처로 전환
2. 유저 관리 플로우 구현
3. API 엔드포인트 단순화