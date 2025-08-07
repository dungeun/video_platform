# VideoPick 로깅 시스템 가이드

## 개요
VideoPick 플랫폼에 구현된 포괄적인 로깅 시스템으로 서버 시작, 에러 추적, 성능 모니터링을 제공합니다.

## 기능

### 1. 서버 시작 시퀀스
- ✅ 환경 변수 검증
- ✅ 데이터베이스 연결 확인
- ✅ Prisma 스키마 검증
- ✅ 데이터베이스 테이블 확인
- ✅ 데이터 통계 수집
- ✅ 포트 가용성 확인
- ✅ 필수 디렉토리 생성
- ✅ 설정 로드
- ✅ 로그 파일 로테이션
- ✅ 시스템 상태 체크

### 2. 로그 파일 시스템
- **일반 로그**: `logs/app-YYYY-MM-DD.log`
- **에러 로그**: `logs/error-YYYY-MM-DD.log`
- **자동 로테이션**: 7일간 보관

### 3. 시각적 피드백
- 🔄 진행 상황 스피너
- 📊 진행률 표시 바
- 🎨 색상 코드 출력
- 📈 실시간 통계 테이블

## 사용법

### 개발 서버 실행
```bash
npm run dev
# 또는 디버그 모드
npm run dev:debug
```

### 프로덕션 서버 실행
```bash
npm run build
npm run start
# 또는 디버그 모드
npm run start:debug
```

### 로그 확인
```bash
# 실시간 로그 확인
npm run logs

# 에러 로그만 확인
npm run logs:error

# 특정 날짜 로그 확인
cat logs/app-2025-08-07.log
```

## Logger API

### 기본 사용법
```javascript
const { createLogger } = require('./lib/logger');

const logger = createLogger({
  logDir: 'logs',
  enableFileLogging: true,
  enableConsole: true
});

// 로그 레벨
logger.info('서버 시작됨');
logger.success('작업 완료');
logger.warning('메모리 부족');
logger.error('연결 실패', error);
logger.fatal('치명적 오류');
logger.debug('디버그 정보');
```

### 진행 상황 표시
```javascript
// 스피너
logger.startSpinner('데이터 로딩 중...');
logger.updateSpinner('50% 완료...');
logger.stopSpinner(true); // 성공
logger.stopSpinner(false); // 실패

// 진행률 바
logger.progressBar(50, 100, '파일 처리');
```

### 섹션 구분
```javascript
logger.section('🚀 서버 초기화');
logger.subsection('데이터베이스 연결');
```

### 테이블 출력
```javascript
logger.table([
  { 작업: '환경변수 확인', 상태: '✅', 시간: '1ms' },
  { 작업: 'DB 연결', 상태: '✅', 시간: '89ms' }
]);
```

### 시작 시퀀스
```javascript
const tasks = [
  {
    name: '데이터베이스 연결',
    required: true,
    fn: async () => {
      // 연결 로직
      return { connected: true };
    }
  }
];

const results = await logger.runStartupSequence(tasks);
```

## 로그 형식

### 파일 로그 형식
```
[2025-08-07T21:53:12.287Z] [INFO] 서버 시작됨
[2025-08-07T21:53:12.377Z] [SUCCESS] 데이터베이스 연결 성공 (89ms)
[2025-08-07T21:53:12.670Z] [ERROR] 포트 3000 이미 사용 중
```

### 콘솔 출력 형식
- 🔵 INFO - 일반 정보
- 🟢 SUCCESS - 성공 메시지
- 🟡 WARNING - 경고
- 🔴 ERROR - 에러
- ⚫ FATAL - 치명적 오류
- ⚪ DEBUG - 디버그 (NODE_ENV=development)

## 환경 변수

### 필수
- `DATABASE_URL`: 데이터베이스 연결 문자열
- `NEXT_PUBLIC_API_URL`: API 엔드포인트
- `JWT_SECRET`: JWT 시크릿 키

### 선택
- `PORT`: 서버 포트 (기본: 3000)
- `NODE_ENV`: 환경 (development/production)
- `DEBUG`: 디버그 모드 활성화

## 디렉토리 구조
```
video_platform/
├── logs/
│   ├── app-2025-08-07.log
│   └── error-2025-08-07.log
├── lib/
│   └── logger.js
├── scripts/
│   ├── server-startup.js
│   ├── dev-server.js
│   └── prod-server.js
└── uploads/
    ├── videos/
    └── thumbnails/
```

## 문제 해결

### 포트 충돌
```bash
# 다른 포트로 실행
PORT=3001 npm run dev
```

### 로그 파일 권한
```bash
# 로그 디렉토리 권한 설정
chmod 755 logs
```

### 메모리 부족
로그 파일이 너무 크면 자동 로테이션이 작동합니다.
수동으로 정리하려면:
```bash
rm logs/app-*.log
rm logs/error-*.log
```

## 성능 최적화
- 로그 레벨 조정으로 I/O 감소
- 프로덕션에서는 DEBUG 로그 비활성화
- 로그 파일 로테이션으로 디스크 공간 관리
- 비동기 로깅으로 성능 영향 최소화

## 모니터링 통합
로그 파일은 다음 도구와 통합 가능:
- ELK Stack (Elasticsearch, Logstash, Kibana)
- Grafana Loki
- CloudWatch Logs
- Datadog
- New Relic