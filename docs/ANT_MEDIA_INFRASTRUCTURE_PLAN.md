# 🏗️ Ant Media Server 인프라 구성 계획

## 1. 서버 아키텍처

### 1.1 개발/테스트 환경
```yaml
단일 서버 구성:
  서버: Vultr Cloud Compute
  사양: 
    - CPU: 2 vCPU
    - RAM: 4GB
    - Storage: 80GB SSD
    - Network: 1Gbps
    - Location: Seoul
  비용: $20/월
  
  소프트웨어:
    - Ubuntu 20.04 LTS
    - Ant Media Server CE
    - Nginx (리버스 프록시)
    - Docker (옵션)
```

### 1.2 프로덕션 환경 (초기)
```yaml
Edge 서버 (스트리밍):
  서버: Vultr High Frequency
  사양:
    - CPU: 4 vCPU
    - RAM: 8GB
    - Storage: 128GB NVMe
    - Network: 2Gbps
    - Location: Seoul
  비용: $48/월
  용량: 500-1000 동시 스트림

Origin 서버 (인제스트):
  서버: Vultr Cloud Compute
  사양:
    - CPU: 2 vCPU
    - RAM: 4GB
    - Storage: 80GB SSD
    - Network: 1Gbps
  비용: $20/월
  용량: 50-100 라이브 스트림
```

### 1.3 프로덕션 확장 구성
```yaml
로드 밸런서:
  - Vultr Load Balancer: $10/월
  - 또는 Nginx 자체 구성

Origin 클러스터 (2대):
  - 각 $20/월 = $40/월
  - Active-Active 구성
  - 자동 장애 복구

Edge 클러스터 (3대):
  - 각 $48/월 = $144/월
  - 지역별 분산 (서울, 도쿄, 싱가포르)
  - GeoDNS 라우팅

총 비용: $194/월
용량: 5,000+ 동시 시청
```

## 2. 네트워크 구성

### 2.1 포트 설정
```yaml
Ant Media 포트:
  - 5080: HTTP (Web Panel)
  - 5443: HTTPS (Web Panel SSL)
  - 1935: RTMP
  - 5000-5999: WebRTC (TCP)
  - 50000-60000: WebRTC (UDP)
  - 4200-4299: WebSocket

방화벽 규칙:
  - SSH: 22 (관리자 IP만)
  - HTTP: 80
  - HTTPS: 443
  - RTMP: 1935
  - WebRTC: 5000-60000
```

### 2.2 도메인 구성
```yaml
메인 도메인:
  - video.one-q.xyz (메인 서비스)
  
서브도메인:
  - stream.video.one-q.xyz (스트리밍 서버)
  - origin.video.one-q.xyz (인제스트 서버)
  - edge1.video.one-q.xyz (Edge 서버 1)
  - edge2.video.one-q.xyz (Edge 서버 2)
  - admin.video.one-q.xyz (관리 패널)
```

### 2.3 SSL 인증서
```bash
# Let's Encrypt 무료 SSL
sudo certbot --nginx -d video.one-q.xyz -d *.video.one-q.xyz

# Ant Media SSL 설정
sudo /usr/local/antmedia/enable_ssl.sh -d video.one-q.xyz
```

## 3. 스토리지 구성

### 3.1 로컬 스토리지
```yaml
디렉토리 구조:
  /usr/local/antmedia/
    ├── webapps/           # 애플리케이션
    ├── streams/           # 임시 스트림 파일
    └── recordings/        # 녹화 파일
        ├── streams/       # 스트림별
        └── vod/          # VOD 변환

파티션:
  /: 20GB (시스템)
  /usr/local/antmedia: 100GB+ (별도 파티션)
```

### 3.2 Vultr Object Storage 연동
```yaml
버킷 구성:
  videopick-live/          # 라이브 녹화
  videopick-vod/           # VOD 파일
  videopick-thumbnails/    # 썸네일
  videopick-clips/         # 클립

자동 업로드 스크립트:
  - 녹화 완료 시 S3 업로드
  - 로컬 파일 삭제 (7일 후)
  - 메타데이터 DB 저장
```

## 4. Ant Media 설치 및 설정

### 4.1 서버 준비
```bash
# 1. 시스템 업데이트
sudo apt update && sudo apt upgrade -y

# 2. 필수 패키지 설치
sudo apt install -y openjdk-11-jdk unzip curl wget

# 3. 시스템 최적화
sudo sysctl -w net.core.rmem_max=134217728
sudo sysctl -w net.core.wmem_max=134217728
sudo sysctl -w net.ipv4.tcp_moderate_rcvbuf=1

# 4. 파일 디스크립터 증가
echo "* soft nofile 65536" >> /etc/security/limits.conf
echo "* hard nofile 65536" >> /etc/security/limits.conf
```

### 4.2 Ant Media 설치
```bash
# 1. 다운로드
cd /tmp
wget https://github.com/ant-media/Ant-Media-Server/releases/download/ams-v2.8.2/ant-media-server-community-2.8.2.zip

# 2. 설치
unzip ant-media-server-community-2.8.2.zip
cd ant-media-server
sudo ./install_ant-media-server.sh

# 3. 서비스 시작
sudo systemctl start antmedia
sudo systemctl enable antmedia

# 4. 상태 확인
sudo systemctl status antmedia
```

### 4.3 기본 설정
```javascript
// /usr/local/antmedia/webapps/root/WEB-INF/red5-web.properties

# 앱 설정
webapp.dbName=videopick
webapp.contextPath=/

# 스트리밍 설정
settings.mp4MuxingEnabled=true
settings.hlsMuxingEnabled=true
settings.webRTCEnabled=true
settings.rtmpPlaybackEnabled=true

# 녹화 설정
settings.recordingEnabled=true
settings.mp4RecordingEnabled=true
settings.addDateTimeToMp4FileName=true

# S3 설정
settings.s3RecordingEnabled=true
settings.s3AccessKey=${S3_ACCESS_KEY}
settings.s3SecretKey=${S3_SECRET_KEY}
settings.s3BucketName=videopick-recordings
settings.s3Endpoint=https://icn1.vultrobjects.com
settings.s3Region=icn1
```

## 5. 클러스터 구성 (확장 시)

### 5.1 Origin-Edge 아키텍처
```yaml
Origin Server:
  역할: 
    - RTMP 인제스트
    - 트랜스코딩
    - 녹화
  설정:
    mode: origin
    
Edge Servers:
  역할:
    - 시청자 연결
    - 캐싱
    - 지역 분산
  설정:
    mode: edge
    origin.serverURL: rtmp://origin.video.one-q.xyz/LiveApp
```

### 5.2 MongoDB 클러스터
```yaml
MongoDB ReplicaSet:
  Primary: origin 서버
  Secondary: edge1 서버
  Secondary: edge2 서버
  
장점:
  - 메타데이터 동기화
  - 자동 장애 복구
  - 읽기 분산
```

### 5.3 로드 밸런싱
```nginx
# Nginx 로드 밸런서 설정
upstream ant_media_edge {
    least_conn;
    server edge1.video.one-q.xyz:5080;
    server edge2.video.one-q.xyz:5080;
    server edge3.video.one-q.xyz:5080;
}

server {
    listen 443 ssl http2;
    server_name stream.video.one-q.xyz;
    
    location / {
        proxy_pass http://ant_media_edge;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## 6. 모니터링 및 관리

### 6.1 모니터링 스택
```yaml
Prometheus + Grafana:
  - CPU/메모리 사용률
  - 네트워크 트래픽
  - 스트림 수
  - 시청자 수
  - 에러율

Ant Media 메트릭:
  - /rest/v2/stats API
  - JMX 메트릭
  - 로그 분석
```

### 6.2 백업 전략
```yaml
데이터 백업:
  - MongoDB: 일일 백업
  - 설정 파일: Git 관리
  - 녹화 파일: S3 자동 업로드

복구 계획:
  - RTO: 1시간
  - RPO: 24시간
  - 자동 장애 복구
```

### 6.3 보안 설정
```bash
# 1. 관리자 패널 접근 제한
sudo ufw allow from 관리자IP to any port 5080

# 2. API 키 설정
# /usr/local/antmedia/webapps/root/WEB-INF/web.xml
<context-param>
    <param-name>apiKey</param-name>
    <param-value>your-secure-api-key</param-value>
</context-param>

# 3. RTMP 퍼블리시 인증
settings.publishTokenControlEnabled=true
```

## 7. 자동화 스크립트

### 7.1 녹화 파일 S3 업로드
```bash
#!/bin/bash
# /usr/local/antmedia/scripts/upload-to-s3.sh

RECORDING_PATH=$1
FILENAME=$(basename $RECORDING_PATH)
STREAM_ID=$(echo $FILENAME | cut -d'_' -f1)

# S3 업로드
aws s3 cp $RECORDING_PATH s3://videopick-recordings/$STREAM_ID/ \
    --endpoint-url https://icn1.vultrobjects.com

# DB 업데이트
curl -X POST http://localhost:3000/api/recordings \
    -H "Content-Type: application/json" \
    -d "{\"streamId\":\"$STREAM_ID\",\"filename\":\"$FILENAME\",\"s3Path\":\"s3://videopick-recordings/$STREAM_ID/$FILENAME\"}"

# 7일 후 로컬 삭제
echo "rm $RECORDING_PATH" | at now + 7 days
```

### 7.2 상태 체크 스크립트
```bash
#!/bin/bash
# /usr/local/antmedia/scripts/health-check.sh

# API 상태 체크
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5080/rest/v2/stats)

if [ $STATUS -ne 200 ]; then
    echo "Ant Media Server is down!"
    systemctl restart antmedia
    
    # 알림 전송
    curl -X POST https://api.telegram.org/bot$TOKEN/sendMessage \
        -d "chat_id=$CHAT_ID&text=Ant Media Server restarted"
fi
```

## 8. 비용 예측

### 8.1 초기 구성 (월)
```yaml
인프라:
  - Ant Media 서버: $20
  - Object Storage: $5
  - 도메인: $1
  총: $26/월

트래픽 (1TB):
  - Vultr 트래픽: 포함
  - S3 전송: $10
  총: $10/월

전체: $36/월
```

### 8.2 성장 단계 (월)
```yaml
인프라:
  - Origin 서버: $20
  - Edge 서버 x2: $96
  - Load Balancer: $10
  - Object Storage: $20
  총: $146/월

트래픽 (10TB):
  - S3 전송: $100
  - CDN: $50
  총: $150/월

전체: $296/월
```

### 8.3 대규모 (월)
```yaml
인프라:
  - Origin 클러스터: $40
  - Edge 클러스터: $288
  - 관리 서버: $20
  - Object Storage: $100
  총: $448/월

트래픽 (100TB):
  - CDN: $500
  - S3: $200
  총: $700/월

전체: $1,148/월
```

## 9. 재해 복구 계획

### 9.1 장애 시나리오
```yaml
Origin 서버 장애:
  - Edge 서버가 캐시된 콘텐츠 제공
  - 새 스트림만 영향
  - 30분 내 복구

Edge 서버 장애:
  - 다른 Edge로 자동 라우팅
  - 무중단 서비스
  - 용량만 감소

전체 장애:
  - DR 사이트 활성화
  - DNS 전환 (5분)
  - 데이터 복구 (1시간)
```

### 9.2 백업 사이트
```yaml
DR 구성:
  - 위치: 도쿄
  - 구성: 최소 구성
  - 평시: 대기 상태
  - 비용: $20/월
  
활성화 절차:
  1. DNS 전환
  2. DB 복구
  3. 서비스 시작
  4. 모니터링
```

이 구성으로 안정적이고 확장 가능한 라이브 스트리밍 인프라를 구축할 수 있습니다!